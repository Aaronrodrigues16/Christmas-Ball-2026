export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
  dietary: string
}

export type CheckoutDraft = {
  quantities: Record<string, number>
  requiredSeatCount: number
  customer: CheckoutCustomer
  step: 'select-passes' | 'payment'
}

const DRAFT_KEY = 'checkoutDraft'
const SEATS_KEY = 'selectedSeatIds'

export function readDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CheckoutDraft
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function writeDraft(draft: CheckoutDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function readSeatIds(): string[] {
  const raw = sessionStorage.getItem(SEATS_KEY)
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export function writeSeatIds(ids: string[]) {
  sessionStorage.setItem(SEATS_KEY, ids.join(','))
}

export function clearCheckoutState() {
  sessionStorage.removeItem(DRAFT_KEY)
  sessionStorage.removeItem(SEATS_KEY)
  sessionStorage.removeItem('selectedTier')
}