import crypto from 'crypto'
import type { VercelRequest } from '@vercel/node'

/**
 * Constant-time comparison of two hex-encoded HMAC digests.
 * Rejects malformed inputs before comparing so length differences cannot leak.
 */
export function timingSafeHexEqual(expected: string, received: unknown): boolean {
  if (typeof received !== 'string') return false
  if (!/^[0-9a-f]{64}$/i.test(received)) return false
  if (expected.length !== received.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
  } catch {
    return false
  }
}

/**
 * Verify the browser callback signature described by Razorpay:
 * HMAC-SHA256(RAZORPAY_KEY_SECRET, order_id + "|" + razorpay_payment_id)
 *
 * IMPORTANT: `orderId` must come from OUR database, never from the browser
 * callback, otherwise a spoofed order_id can be used.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: unknown, keySecret: string): boolean {
  if (!orderId || !paymentId || !keySecret) return false
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
  return timingSafeHexEqual(expected, signature)
}

/**
 * Verify a Razorpay webhook: HMAC-SHA256(webhook_secret, RAW request body).
 * The signature arrives in the X-Razorpay-Signature header. The body must not
 * be JSON-parsed or re-serialised before hashing.
 */
export function verifyWebhookSignature(rawBody: string, signature: unknown, webhookSecret: string): boolean {
  if (!rawBody || !webhookSecret) return false
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex')
  return timingSafeHexEqual(expected, signature)
}

/**
 * Read the untouched request body for webhook signature verification.
 * Requires `export const config = { api: { bodyParser: false } }` on the route.
 */
export async function readRawBody(req: VercelRequest): Promise<string> {
  const raw = req as unknown as { body?: unknown }
  if (Buffer.isBuffer(raw.body)) return raw.body.toString('utf8')
  if (typeof raw.body === 'string') return raw.body
  // Some Vercel runtimes hand over a stream when bodyParser is disabled.
  return await new Promise<string>((resolve, reject) => {
    let data = ''
    const stream = req as unknown as NodeJS.ReadableStream
    stream.on('data', (chunk: Buffer | string) => {
      data += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    })
    stream.on('end', () => resolve(data))
    stream.on('error', reject)
  })
}

/** Reject stale webhook events. Idempotency is handled separately by event ID. */
export function isStaleEvent(createdAtUnixSeconds: unknown, maxAgeSeconds: number): boolean {
  const created = Number(createdAtUnixSeconds)
  if (!Number.isFinite(created) || created <= 0) return true
  return Math.floor(Date.now() / 1000) - created > maxAgeSeconds
}
