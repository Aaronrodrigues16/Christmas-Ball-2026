import type { VercelRequest, VercelResponse } from '@vercel/node'
import Razorpay from 'razorpay'
import { loadSeatMap, resolveSeatIds } from './_lib/seatIds'

import { getSupabaseAdmin } from './_lib/supabaseAdmin'

const keyId = process.env.RAZORPAY_KEY_ID?.trim()
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null

/**
 * Razorpay's Node SDK does NOT throw a normal Error for API rejections.
 * Its `normalizeError` throws a plain object:
 *   { statusCode, error: { code, description, field, reason, ... } }
 * so `error.message` is always undefined. This is why every gateway
 * rejection previously surfaced as an opaque HTTP 500.
 */
function describeGatewayError(err: any) {
  const gatewayError = err?.error ?? {}
  return {
    statusCode: err?.statusCode ?? err?.response?.status ?? null,
    code: gatewayError.code ?? null,
    description: gatewayError.description ?? err?.message ?? 'Unknown gateway error',
    field: gatewayError.field ?? null,
    reason: gatewayError.reason ?? null,
  }
}

/** Safe to log/return: key IDs are public (the browser receives them anyway). */
function maskedKeyId(id?: string) {
  if (!id) return 'none'
  if (id.length <= 12) return id
  return `${id.slice(0, 11)}…${id.slice(-4)}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!razorpay || !keyId) {
    console.error('[create-razorpay-order] Razorpay credentials not configured')
    return res.status(500).json({ error: 'Payment gateway unavailable' })
  }

  // Never trust a client-supplied amount. Price is always recomputed by reserve_tickets.
  const { customer_name, customer_email, customer_phone, dietary_pref, items } = req.body || {}

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' })
  }

  let orderId: string | undefined

  try {
    const supabase = getSupabaseAdmin()
    const { data: reserved, error: reservationError } = await supabase.rpc('reserve_tickets', {
      p_name: customer_name,
      p_email: customer_email,
      p_phone: customer_phone,
      p_dietary: dietary_pref || null,
      p_items: items,
    })

    if (reservationError || !reserved) {
      return res.status(400).json({ error: reservationError?.message || 'Could not reserve tickets' })
    }

    orderId = reserved.order_id as string
    const totalAmount = Number(reserved.total_amount || 0)
    const statusToken = reserved.status_token as string | undefined

    // Razorpay requires amount in paise as a JSON integer, minimum 100 (INR 1).
    const amountPaise = Math.round(totalAmount * 100)
    if (!orderId || !statusToken || !Number.isInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Invalid order amount' })
    }

    // POST /v1/orders — send ONLY documented create-order fields:
    // https://razorpay.com/docs/api/orders/create/
    //
    // Do not send `payment.capture` here. That is a per-payment capture
    // override from a separate, account-specific API; the standard
    // create-order schema rejects it. Auto-capture is enabled on the
    // Dashboard (Account & Settings → Payment Capture), which is what
    // makes `payment.captured` webhooks fire.
    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      // ASCII, unique, <= 40 chars. UUID hyphens removed to be safe.
      receipt: `ocb_${orderId.replace(/-/g, '').slice(0, 32)}`,
      notes: { internal_order_id: orderId },
    })

    const { error: linkError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: rpOrder.id })
      .eq('id', orderId)

    if (linkError) {
      console.error('[create-razorpay-order] could not link Razorpay order', { orderId })
      return res.status(500).json({ error: 'Could not save order' })
    }

    // status_token is the only credential for polling this order's status.
    return res.status(200).json({
      order_id: orderId,
      razorpay_order_id: rpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      key_id: keyId,
      status_token: statusToken,
    })
  } catch (error: any) {
    const detail = describeGatewayError(error)
    const keyHint = maskedKeyId(keyId)
    console.error('[create-razorpay-order] Razorpay rejected order creation', { orderId, keyHint, ...detail })

    // Surface the real gateway description so the cause is visible in the UI
    // immediately (e.g. bad amount, invalid currency, auth failure).
    return res.status(502).json({
      error: detail.description,
      gateway_code: detail.code,
      gateway_field: detail.field,
      key_hint: keyHint,
    })
  }
}
