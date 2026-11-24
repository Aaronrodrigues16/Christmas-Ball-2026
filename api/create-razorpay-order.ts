import type { VercelRequest, VercelResponse } from '@vercel/node'
import Razorpay from 'razorpay'
import { loadSeatMap, resolveSeatIds } from './_lib/seatIds'
import { getSupabaseAdmin } from './_lib/supabaseAdmin'

const keyId = process.env.RAZORPAY_KEY_ID?.trim()
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null

type CanonicalTier = {
  key: string
  name: string
  requiresSeat: boolean
}

const CANONICAL_TIERS: readonly CanonicalTier[] = [
  { key: 'kids', name: 'Kids Below 3', requiresSeat: false },
  { key: 'child', name: 'Children Below 10', requiresSeat: true },
  { key: 'adult', name: 'Adult', requiresSeat: true },
]

const CANONICAL_BY_KEY = new Map(CANONICAL_TIERS.map((tier) => [tier.key, tier]))

type RequestItem = {
  tier_key?: unknown
  quantity?: unknown
}

type TierRow = {
  id: string
  name: string
  price_inr: number
  active: boolean
}

type ReservationResult = {
  order_id?: string
  total_amount?: number | string
  status_token?: string
}

type GatewayFailure = {
  statusCode?: number
  response?: { status?: number }
  message?: string
  error?: {
    code?: string
    description?: string
    field?: string
    reason?: string
  }
}

/**
 * Razorpay's Node SDK throws a plain object for API rejections, not an Error.
 * Normalise it so the real gateway description reaches both logs and the UI.
 */
function describeGatewayError(error: unknown) {
  const failure = (error || {}) as GatewayFailure
  return {
    statusCode: failure.statusCode ?? failure.response?.status ?? null,
    code: failure.error?.code ?? null,
    description: failure.error?.description ?? failure.message ?? 'Unknown gateway error',
    field: failure.error?.field ?? null,
    reason: failure.error?.reason ?? null,
  }
}

function maskedKeyId(id?: string) {
  if (!id) return 'none'
  if (id.length <= 12) return id
  return `${id.slice(0, 11)}…${id.slice(-4)}`
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!razorpay || !keyId) {
    console.error('[create-razorpay-order] Razorpay credentials not configured')
    return res.status(500).json({ error: 'Payment gateway unavailable' })
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
    dietary_pref,
    items,
    seat_ids,
    expected_total,
  } = req.body || {}

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items required' })
  }
  if (items.length > 10) {
    return res.status(400).json({ error: 'too many ticket tiers' })
  }

  const requestedItems: Array<{ key: string; quantity: number }> = []
  for (const raw of items as RequestItem[]) {
    const key = typeof raw.tier_key === 'string' ? raw.tier_key : ''
    const canonical = CANONICAL_BY_KEY.get(key)
    const quantity = Number(raw.quantity)

    if (!canonical) return res.status(400).json({ error: 'Unknown ticket tier' })
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 4) {
      return res.status(400).json({ error: 'quantity must be between 1 and 4' })
    }
    if (requestedItems.some((item) => item.key === key)) {
      return res.status(400).json({ error: 'Duplicate ticket tier' })
    }

    requestedItems.push({ key, quantity })
  }

  const requestedSeats: string[] = Array.isArray(seat_ids)
    ? seat_ids.filter((seat): seat is string => typeof seat === 'string')
    : []

  if (new Set(requestedSeats).size !== requestedSeats.length) {
    return res.status(400).json({ error: 'Duplicate seat id' })
  }

  const requiredSeats = requestedItems.reduce(
    (total, item) => total + (CANONICAL_BY_KEY.get(item.key)?.requiresSeat ? item.quantity : 0),
    0,
  )
  if (requestedSeats.length !== requiredSeats) {
    return res.status(400).json({ error: `Select exactly ${requiredSeats} seat${requiredSeats === 1 ? '' : 's'}` })
  }

  let orderId: string | undefined

  try {
    const supabase = getSupabaseAdmin()

    const { data: tierData, error: tierError } = await supabase
      .from('ticket_tiers')
      .select('id, name, price_inr, active')
      .eq('active', true)

    if (tierError) return res.status(500).json({ error: 'Could not load ticket tiers' })

    const activeTiers = (tierData ?? []) as TierRow[]
    const dbItems: Array<{ tier_id: string; quantity: number }> = []
    const prices = new Map<string, number>()

    for (const item of requestedItems) {
      const canonical = CANONICAL_BY_KEY.get(item.key)
      if (!canonical) return res.status(400).json({ error: 'Unknown ticket tier' })

      const row = activeTiers.find((tier) => normalizeName(tier.name) === normalizeName(canonical.name))
      if (!row) return res.status(400).json({ error: `Ticket tier ${canonical.name} is not configured` })

      dbItems.push({ tier_id: row.id, quantity: item.quantity })
      prices.set(row.id, Number(row.price_inr))
    }

    // Never trust a client-supplied amount. Compare it with server-side prices
    // before reserving anything.
    const serverTotal = dbItems.reduce((total, item) => total + (prices.get(item.tier_id) ?? 0) * item.quantity, 0)
    if (typeof expected_total === 'number' && expected_total !== serverTotal) {
      return res.status(409).json({ error: 'Ticket prices changed. Please review your order.' })
    }

    let dbSeatIds: string[] = []
    if (requestedSeats.length > 0) {
      const seatMap = await loadSeatMap()
      const resolved = resolveSeatIds(requestedSeats, seatMap)
      if (!resolved) return res.status(400).json({ error: 'Unknown seat id' })
      dbSeatIds = resolved
    }

    const { data: reservedData, error: reservationError } = await supabase.rpc('reserve_tickets', {
      p_name: customer_name,
      p_email: customer_email,
      p_phone: customer_phone,
      p_dietary: dietary_pref || null,
      p_items: dbItems,
      p_seat_ids: dbSeatIds,
    })

    if (reservationError || !reservedData) {
      return res.status(400).json({ error: reservationError?.message || 'Could not reserve tickets' })
    }

    const reserved = reservedData as ReservationResult
    orderId = reserved.order_id
    const totalAmount = Number(reserved.total_amount || 0)
    const statusToken = reserved.status_token

    // Free orders (Kids only) skip Razorpay. The current UI always requires a
    // paid seat ticket, but keep this response for completeness.
    if (totalAmount === 0) {
      return res.status(200).json({ order_id: orderId, amount: 0, currency: 'INR', status_token: statusToken, free: true })
    }

    const amountPaise = Math.round(totalAmount * 100)
    if (!orderId || !statusToken || !Number.isInteger(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ error: 'Invalid order amount' })
    }

    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
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

    return res.status(200).json({
      order_id: orderId,
      razorpay_order_id: rpOrder.id,
      amount: totalAmount,
      currency: 'INR',
      key_id: keyId,
      status_token: statusToken,
    })
  } catch (error) {
    const detail = describeGatewayError(error)
    const keyHint = maskedKeyId(keyId)
    console.error('[create-razorpay-order] rejected', { orderId, keyHint, ...detail })

    if (!detail.code && !detail.statusCode) {
      return res.status(500).json({ error: detail.description })
    }

    return res.status(502).json({
      error: detail.description,
      gateway_code: detail.code,
      gateway_field: detail.field,
      key_hint: keyHint,
    })
  }
}
