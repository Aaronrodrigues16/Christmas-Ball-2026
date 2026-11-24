export type TicketTierId = 'kids' | 'child' | 'adult'

export type TicketTier = {
  id: TicketTierId
  name: string
  price: number
  requiresSeat: boolean
  tag: string
  desc: string
  points: string[]
}

export const TICKET_TIERS: readonly TicketTier[] = [
  {
    id: 'kids',
    name: 'Kids Below 3',
    price: 0,
    requiresSeat: false,
    tag: 'Free Entry',
    desc: 'Complimentary entry for children under 3 years.',
    points: ['Official event entry', 'Instant QR code ticket via email'],
  },
  {
    id: 'child',
    name: 'Children Below 10',
    price: 1000,
    requiresSeat: true,
    tag: '@ Rs 1000',
    desc: 'Discounted pass for children below 10 years.',
    points: ['Official event entry', 'Instant QR code ticket via email', 'Seat selection included'],
  },
  {
    id: 'adult',
    name: 'Adult',
    price: 3500,
    requiresSeat: true,
    tag: '@ Rs 3500',
    desc: 'Standard adult pass for Orlem Christmas Ball 2026.',
    points: [
      'Official event entry',
      'Instant QR code ticket via email',
      'Secure Razorpay checkout',
      'Seat selection included',
    ],
  },
]

const TIER_BY_ID = new Map<string, TicketTier>(TICKET_TIERS.map((tier) => [tier.id, tier]))

export function getTier(id: string): TicketTier | undefined {
  return TIER_BY_ID.get(id)
}

export function getQuantity(quantities: Record<string, number>, id: string): number {
  const value = quantities[id]
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

export function computeTicketCount(quantities: Record<string, number>): number {
  return TICKET_TIERS.reduce((sum, tier) => sum + getQuantity(quantities, tier.id), 0)
}

export function computeTotal(quantities: Record<string, number>): number {
  return TICKET_TIERS.reduce((sum, tier) => sum + getQuantity(quantities, tier.id) * tier.price, 0)
}

export function computeRequiredSeatCount(quantities: Record<string, number>): number {
  return TICKET_TIERS.reduce(
    (sum, tier) => sum + (tier.requiresSeat ? getQuantity(quantities, tier.id) : 0),
    0,
  )
}

export type OrderItem = { tier_key: TicketTierId; quantity: number }

export function toOrderItems(quantities: Record<string, number>): OrderItem[] {
  return TICKET_TIERS
    .filter((tier) => getQuantity(quantities, tier.id) > 0)
    .map((tier) => ({ tier_key: tier.id, quantity: getQuantity(quantities, tier.id) }))
}
