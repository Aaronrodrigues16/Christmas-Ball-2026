import {
  clearCheckoutState,
  writeReceipt,
  type CheckoutDraft,
} from './checkoutState'
import { computeTicketCount, toOrderItems } from './ticketCatalog'

type RazorpayPaymentResponse = {
  razorpay_payment_id?: string
  razorpay_order_id?: string
  razorpay_signature?: string
  error?: { description?: string }
}

type RazorpayCheckout = {
  open: () => void
  on: (event: string, handler: (response: RazorpayPaymentResponse) => void) => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckout

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

type CreateOrderResponse = {
  razorpay_order_id?: string
  key_id?: string
  amount?: number
  currency?: string
  status_token?: string
  order_id?: string
  free?: boolean
  error?: string
}

type VerifyPaymentResponse = {
  verified?: boolean
  status?: string
  total_amount?: number
  error?: string
}

export type StartPaymentInput = {
  draft: CheckoutDraft
  selectedSeats: string[]
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

function shouldSimulatePayment(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_SIMULATE_PAYMENT !== 'false'
}

function completePayment(input: StartPaymentInput, paymentId: string, totalPaid: number, simulated: boolean) {
  const { draft, selectedSeats } = input
  writeReceipt({
    customer: draft.customer,
    quantities: draft.quantities,
    ticketCount: computeTicketCount(draft.quantities),
    selectedSeats,
    totalPaid,
    orderId: simulated ? 'LOCAL_SIMULATION' : paymentId,
    paymentId,
    simulated,
    createdAt: new Date().toISOString(),
  })
  clearCheckoutState()
  window.location.assign('/success')
}

/**
 * Starts the real Razorpay checkout in production. In Vite dev (where /api/*
 * is not served) it simulates a successful payment so the full UI flow can
 * be exercised locally. Set VITE_SIMULATE_PAYMENT=false to force the API path.
 */
export async function startPayment(input: StartPaymentInput): Promise<string | null> {
  const { draft, selectedSeats } = input

  if (selectedSeats.length !== draft.requiredSeatCount) {
    return `Select exactly ${draft.requiredSeatCount} seat${draft.requiredSeatCount === 1 ? '' : 's'} to continue.`
  }

  if (shouldSimulatePayment()) {
    completePayment(input, `SIMULATED_${Date.now()}`, draft.total, true)
    return null
  }

  try {
    const orderResponse = await fetch('/api/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: draft.customer.name,
        customer_email: draft.customer.email,
        customer_phone: draft.customer.phone,
        dietary_pref: draft.customer.dietary || null,
        items: toOrderItems(draft.quantities),
        seat_ids: selectedSeats,
        expected_total: draft.total,
      }),
    })

    const order = (await orderResponse.json().catch(() => ({}))) as CreateOrderResponse
    if (!orderResponse.ok) {
      throw new Error(order.error || `Could not create order (${orderResponse.status}). Run with vercel dev for /api routes.`)
    }
    if (order.free) {
      throw new Error('This ticket selection has no payment due. Return to tickets and add a paid pass.')
    }
    const gatewayOrderId = order.razorpay_order_id
    const gatewayKey = order.key_id
    const gatewayAmount = order.amount
    const gatewayCurrency = order.currency || 'INR'

    if (!gatewayOrderId || !gatewayKey || typeof gatewayAmount !== 'number') {
      throw new Error('Payment gateway returned an incomplete order')
    }

    const ready = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
    if (!ready || !window.Razorpay) throw new Error('Razorpay SDK failed to load')

    const Razorpay = window.Razorpay

    return await new Promise<string | null>((resolve) => {
      let settled = false
      let paymentSubmitted = false

      const settle = (message: string | null) => {
        if (settled) return
        settled = true
        resolve(message)
      }

      const options: Record<string, unknown> = {
        key: gatewayKey,
        amount: Math.round(gatewayAmount * 100),
        currency: gatewayCurrency,
        name: 'Orlem Christmas Ball',
        description: `Tickets & seats: ${selectedSeats.join(', ')}`,
        order_id: gatewayOrderId,
        prefill: {
          name: draft.customer.name,
          email: draft.customer.email,
          contact: draft.customer.phone.replace(/\D/g, '').slice(-10),
        },
        notes: {
          internal_order_id: order.order_id ?? '',
          selected_seats: selectedSeats.join(','),
        },
        theme: { color: '#c6ad78' },
        modal: {
          ondismiss: () => {
            if (!paymentSubmitted) settle('Payment cancelled')
          },
        },
        handler: async (payment: RazorpayPaymentResponse) => {
          paymentSubmitted = true
          try {
            if (!payment.razorpay_payment_id || !payment.razorpay_order_id || !payment.razorpay_signature) {
              throw new Error('Razorpay did not return a complete payment response')
            }

            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_signature: payment.razorpay_signature,
              }),
            })
            const verified = (await verifyResponse.json().catch(() => ({}))) as VerifyPaymentResponse

            if (!verifyResponse.ok || !verified.verified || verified.status !== 'PAID') {
              throw new Error(verified.error || 'Payment could not be verified. Contact support if you were charged.')
            }

            const totalPaid = Number(verified.total_amount ?? order.amount ?? draft.total)
            completePayment(input, payment.razorpay_payment_id, totalPaid, false)
            settle(null)
          } catch (error) {
            settle(errorMessage(error, 'Payment verification failed'))
          }
        },
      }

      const checkout = new Razorpay(options)
      checkout.on('payment.failed', (payment) => {
        settle(payment.error?.description || 'Payment failed. Please try again.')
      })
      checkout.open()
    })
  } catch (error) {
    return errorMessage(error, 'Something went wrong while starting payment')
  }
}
