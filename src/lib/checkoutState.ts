import { computeRequiredSeatCount, computeTicketCount, computeTotal } from './ticketCatalog'

export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  dietary: string
}

export type CheckoutDraft = {
  quantities: Record<string, number>
  requiredSeatCount: number
  ticketCount: number
  total: number
  customer: CheckoutCustomer
  step: 'select-passes' | 'payment'
  updatedAt: string
}

export type PaymentReceipt = {
  customer: CheckoutCustomer
  quantities: Record<string, number>
  ticketCount: number
  selectedSeats: string[]
  totalPaid: number
  orderId?: string
  paymentId?: string
  simulated?: boolean
  createdAt: string
}

const DRAFT_KEY = 'checkoutDraft'
const SEATS_KEY = 'selectedSeatIds'
const RECEIPT_KEY = 'paymentReceipt'

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private browsing; the flow still works in-memory.
  }
}

function safeRemove(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

function normalizeQuantities(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const quantity = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(quantity) && quantity > 0) result[key] = Math.floor(quantity)
  }
  return result
}

export function readDraft(): CheckoutDraft | null {
  try {
    const raw = safeGet(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>
    if (!parsed || typeof parsed !== 'object') return null

    const quantities = normalizeQuantities(parsed.quantities)
    if (Object.keys(quantities).length === 0) return null

    const customer = parsed.customer
    return {
      quantities,
      requiredSeatCount:
        typeof parsed.requiredSeatCount === 'number'
          ? parsed.requiredSeatCount
          : computeRequiredSeatCount(quantities),
      ticketCount:
        typeof parsed.ticketCount === 'number' ? parsed.ticketCount : computeTicketCount(quantities),
      total: typeof parsed.total === 'number' ? parsed.total : computeTotal(quantities),
      customer: {
        name: customer?.name ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        dietary: customer?.dietary ?? '',
      },
      step: parsed.step === 'payment' ? 'payment' : 'select-passes',
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writeDraft(draft: CheckoutDraft) {
  safeSet(DRAFT_KEY, JSON.stringify(draft))
}

export function readSeatIds(): string[] {
  const raw = safeGet(SEATS_KEY)
  if (!raw) return []
  return raw.split(',').map((seat) => seat.trim()).filter(Boolean)
}

export function writeSeatIds(ids: string[]) {
  safeSet(SEATS_KEY, ids.join(','))
}

export function writeReceipt(receipt: PaymentReceipt) {
  safeSet(RECEIPT_KEY, JSON.stringify(receipt))
}

export function readReceipt(): PaymentReceipt | null {
  try {
    const raw = safeGet(RECEIPT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PaymentReceipt
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function clearReceipt() {
  safeRemove(RECEIPT_KEY)
}

export function clearCheckoutState() {
  safeRemove(DRAFT_KEY)
  safeRemove(SEATS_KEY)
  safeRemove('selectedTier')
}
