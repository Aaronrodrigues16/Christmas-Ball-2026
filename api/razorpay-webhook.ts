import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import QRCode from 'qrcode'
import { Resend } from 'resend'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import { isStaleEvent, readRawBody, verifyWebhookSignature } from './_lib/paymentSecurity'

// The raw body is required to verify X-Razorpay-Signature. Parsing/re-serialising it
// changes the bytes and breaks the HMAC.
export const config = { api: { bodyParser: false } }

const MAX_AGE_SECONDS = Number(process.env.RAZORPAY_WEBHOOK_MAX_AGE_SECONDS || 300)

function header(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

type IssuedTicket = { id: string; qr_token: string; tier_id: string }

async function sendTickets(orderId: string, customerName: string, customerEmail: string, razorpayOrderId: string, tickets: IssuedTicket[]) {
  const key = process.env.RESEND_API_KEY
  if (!key || tickets.length === 0) {
    console.warn('[razorpay-webhook] ticket email skipped', { orderId, hasKey: !!key, ticketCount: tickets.length })
    return false
  }

  const attachments = await Promise.all(tickets.map(async (ticket, index) => {
    const dataUrl = await QRCode.toDataURL(ticket.qr_token, { margin: 1, width: 320 })
    return {
      filename: `ticket-${index + 1}.png`,
      content: dataUrl.split(',')[1] || '',
    }
  }))

  const list = tickets.map((ticket, index) => `<li>Ticket ${index + 1}: <code>${ticket.qr_token}</code></li>`).join('')
  const from = process.env.TICKET_EMAIL_FROM || 'Orlem Christmas Ball <tickets@orlemchristmasball.in>'
  try {
    const { error, data } = await new Resend(key).emails.send({
      from,
      to: customerEmail,
      subject: 'Your Tickets — Orlem Christmas Ball 2026',
      html: `<div style="font-family:Arial,sans-serif;color:#111;background:#fff;padding:24px">
        <h2 style="margin:0 0 8px">Orlem Christmas Ball 2026</h2>
        <p>Hi ${customerName}, your payment is confirmed.</p>
        <p><strong>Date:</strong> 25 Dec 2026 · 7:30 PM onwards<br/><strong>Venue:</strong> St. Joseph School Turf Ground, Orlem, Malad</p>
        <p>Present the attached QR codes at entry.</p>
        <ul>${list}</ul>
        <p style="color:#666;font-size:12px">Order ${razorpayOrderId}</p>
      </div>`,
      attachments,
    })

    if (error) {
      console.error('[razorpay-webhook] ticket email failed', { orderId, error: error.message, code: error.name || 'unknown' })
      return false
    }
    console.log('[razorpay-webhook] ticket email sent', { orderId, emailId: data?.id })
    return true
  } catch (e: any) {
    console.error('[razorpay-webhook] ticket email exception', { orderId, error: e?.message })
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET is not configured')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  let raw: string
  try {
    raw = await readRawBody(req)
  } catch {
    return res.status(400).json({ error: 'Could not read request body' })
  }

  // 1. Authenticate the sender before doing anything else.
  if (!verifyWebhookSignature(raw, header(req.headers['x-razorpay-signature']), webhookSecret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  let event: any
  try {
    event = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  // 2. Replay guard. Exact duplicates are handled by the event ID ledger below.
  if (isStaleEvent(event.created_at, MAX_AGE_SECONDS)) {
    return res.status(200).json({ ok: true, ignored: 'stale' })
  }

  // Razorpay sends a unique ID per event in this header.
  const eventId = header(req.headers['x-razorpay-event-id']) || crypto.createHash('sha256').update(raw).digest('hex')

  // 3. Only captured payments fulfil orders. Everything else is acknowledged
  //    so Razorpay does not retry events we intentionally do not act on.
  if (event.event !== 'payment.captured') {
    return res.status(200).json({ ok: true, ignored: 'event_type' })
  }

  const payment = event?.payload?.payment?.entity
  const razorpayOrderId = payment?.order_id
  const razorpayPaymentId = payment?.id
  const amountPaise = Number(payment?.amount)
  const currency = payment?.currency

  if (!razorpayOrderId || !razorpayPaymentId || !Number.isInteger(amountPaise)) {
    return res.status(400).json({ error: 'Missing payment fields' })
  }
  if (payment?.status !== 'captured' || payment?.captured !== true) {
    return res.status(200).json({ ok: true, ignored: 'not_captured' })
  }

  const supabase = getSupabaseAdmin()

  const { data: order, error: lookupError } = await supabase
    .from('orders')
    .select('id, status, customer_name, customer_email, razorpay_payment_id')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  if (lookupError) {
    console.error('[razorpay-webhook] order lookup failed', { orderId: razorpayOrderId })
    return res.status(500).json({ error: 'Order lookup failed' })
  }
  if (!order) {
    console.warn('[razorpay-webhook] unknown Razorpay order', { orderId: razorpayOrderId })
    return res.status(200).json({ ok: true, ignored: 'unknown_order' })
  }

  // 4. Atomic, idempotent fulfilment with amount + currency reconciliation.
  const { data: result, error: fulfilError } = await supabase.rpc('fulfill_razorpay_payment', {
    p_event_id: eventId,
    p_order_id: order.id,
    p_payment_id: razorpayPaymentId,
    p_amount_paise: amountPaise,
    p_currency: currency,
  })

  if (fulfilError) {
    // 23505 = this webhook event was already claimed by another delivery.
    if ((fulfilError as any).code === '23505') {
      return res.status(200).json({ ok: true, duplicate: true })
    }
    console.error('[razorpay-webhook] fulfilment failed', { orderId: order.id, message: fulfilError.message })
    return res.status(500).json({ error: 'Fulfilment failed' })
  }

  const tickets = (result?.tickets || []) as IssuedTicket[]
  if (!result?.duplicate && tickets.length > 0) {
    const sent = await sendTickets(order.id, order.customer_name, order.customer_email, razorpayOrderId, tickets)
    if (sent) {
      await supabase.from('orders').update({ tickets_email_sent_at: new Date().toISOString() }).eq('id', order.id)
    }
  }

  return res.status(200).json({ ok: true, duplicate: !!result?.duplicate, tickets: tickets.length })
}
