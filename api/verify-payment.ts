import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import { verifyPaymentSignature } from './_lib/paymentSecurity'

/**
 * Verify Razorpay payment signature AND fulfill the order atomically.
 * Returns generated tickets immediately so frontend can render confirmation without polling.
 * Idempotent: safe to call from both client callback and webhook.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {}
  if (typeof razorpay_payment_id !== 'string' || typeof razorpay_order_id !== 'string' || typeof razorpay_signature !== 'string') {
    return res.status(400).json({ error: 'Missing payment fields' })
  }

  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()
  if (!keySecret) {
    console.error('[verify-payment] RAZORPAY_KEY_SECRET is not configured')
    return res.status(500).json({ error: 'Payment verification unavailable' })
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // Get order from database (order ID must come from our DB, not browser)
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, razorpay_order_id, status, total_amount, customer_name, customer_email')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle()

    if (error) return res.status(500).json({ error: 'Order lookup failed' })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    // Verify HMAC signature
    if (!verifyPaymentSignature(order.razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      return res.status(400).json({ error: 'Signature verification failed' })
    }

    // If already paid, return existing tickets
    if (order.status === 'PAID') {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, qr_token, tier_id')
        .eq('order_id', order.id)
      return res.status(200).json({ 
        verified: true, 
        status: order.status,
        tickets: tickets || [],
        already_paid: true
      })
    }

    // Fulfill the order atomically via RPC (idempotent via processed_webhook_events table)
    // Generate event ID from payment ID for client-side verification
    const eventId = `verify_${razorpay_payment_id}_${razorpay_order_id}`
    
    const { data: result, error: fulfilError } = await supabase.rpc('fulfill_razorpay_payment', {
      p_event_id: eventId,
      p_order_id: order.id,
      p_payment_id: razorpay_payment_id,
      p_amount_paise: order.total_amount * 100,
      p_currency: 'INR'
    })

    if (fulfilError) {
      // 23505 = duplicate event (already processed by webhook or previous call)
      if ((fulfilError as any).code === '23505') {
        // Fetch tickets that were already created
        const { data: tickets } = await supabase
          .from('tickets')
          .select('id, qr_token, tier_id')
          .eq('order_id', order.id)
        return res.status(200).json({ 
          verified: true, 
          status: 'PAID',
          tickets: tickets || [],
          duplicate: true
        })
      }
      console.error('[verify-payment] fulfilment failed', { orderId: order.id, message: fulfilError.message })
      return res.status(500).json({ error: 'Fulfilment failed' })
    }

    const tickets = (result?.tickets || []) as { id: string; qr_token: string; tier_id: string }[]
    
    // Send confirmation email (non-blocking, don't fail payment if email fails)
    if (tickets.length > 0) {
      // Import Resend dynamically to avoid issues
      const { Resend } = await import('resend')
      const key = process.env.RESEND_API_KEY
      if (key) {
        try {
          const QRCode = (await import('qrcode')).default
          const attachments = await Promise.all(tickets.map(async (ticket, index) => {
            const dataUrl = await QRCode.toDataURL(ticket.qr_token, { margin: 1, width: 320 })
            return { filename: `ticket-${index + 1}.png`, content: dataUrl.split(',')[1] || '' }
          }))
          
          const list = tickets.map((t, i) => `<li>Ticket ${i + 1}: <code>${t.qr_token}</code></li>`).join('')
          const from = process.env.TICKET_EMAIL_FROM || 'Orlem Christmas Ball <tickets@orlemchristmasball.in>'
          
          await new Resend(key).emails.send({
            from,
            to: order.customer_email,
            subject: 'Your Tickets — Orlem Christmas Ball 2026',
            html: `<div style="font-family:Arial,sans-serif;color:#111;background:#fff;padding:24px">
              <h2 style="margin:0 0 8px">Orlem Christmas Ball 2026</h2>
              <p>Hi ${order.customer_name}, your payment is confirmed.</p>
              <p><strong>Date:</strong> 25 Dec 2026 · 7:30 PM onwards<br/><strong>Venue:</strong> St. Joseph School Turf Ground, Orlem, Malad</p>
              <p>Present the attached QR codes at entry.</p>
              <ul>${list}</ul>
              <p style="color:#666;font-size:12px">Order ${razorpay_order_id}</p>
            </div>`,
            attachments,
          })
          await supabase.from('orders').update({ tickets_email_sent_at: new Date().toISOString() }).eq('id', order.id)
        } catch (e: any) {
          console.error('[verify-payment] email failed', { orderId: order.id, error: e?.message })
        }
      }

    return res.status(200).json({ 
      verified: true, 
      status: 'PAID',
      tickets,
      order_id: order.id,
      total_amount: order.total_amount
    })
  } catch (e: any) {
    console.error('[verify-payment] unexpected error', e?.message)
    return res.status(500).json({ error: 'Verification failed' })
  }
}
