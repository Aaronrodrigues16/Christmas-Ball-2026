import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'
import { verifyPaymentSignature } from './_lib/paymentSecurity'

/**
 * Instant client-side confirmation only. Fulfilment is always done by the
 * verified webhook; this endpoint never changes order state.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {}
  if (typeof razorpay_payment_id !== 'string' || typeof razorpay_order_id !== 'string' || typeof razorpay_signature !== 'string') {
    return res.status(400).json({ error: 'Missing payment fields' })
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    console.error('[verify-payment] RAZORPAY_KEY_SECRET is not configured')
    return res.status(500).json({ error: 'Payment verification unavailable' })
  }

  try {
    const supabase = getSupabaseAdmin()
    // The order ID used for verification MUST come from our own database.
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, razorpay_order_id, status')
      .eq('razorpay_order_id', razorpay_order_id)
      .maybeSingle()

    if (error) return res.status(500).json({ error: 'Order lookup failed' })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    if (!verifyPaymentSignature(order.razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      return res.status(400).json({ error: 'Signature verification failed' })
    }

    return res.status(200).json({ verified: true, status: order.status })
  } catch {
    return res.status(500).json({ error: 'Verification failed' })
  }
}
