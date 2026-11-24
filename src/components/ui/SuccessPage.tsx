import { clearReceipt, readReceipt } from '../../lib/checkoutState'
import { getTier } from '../../lib/ticketCatalog'

export default function SuccessPage() {
  const receipt = readReceipt()

  const returnHome = () => {
    clearReceipt()
    window.location.assign('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight-bg px-5 py-12 text-midnight-ivory">
      <div className="w-full max-w-xl border border-midnight-gold/25 bg-midnight-bg2/35 px-6 py-10 text-center md:px-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-green-500/40 bg-green-500/15">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="font-editorial text-3xl italic text-midnight-ivory md:text-4xl">Payment Successful! 🎉</h1>

        {receipt && (
          <div className="mt-8 border border-midnight-gold/15 bg-midnight-bg/60 px-5 py-6 text-left">
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-midnight-goldMuted">Order Summary</p>

            <dl className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-6 border-b border-midnight-gold/10 pb-4">
                <dt className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-muted">Number of Tickets</dt>
                <dd className="text-right font-editorial text-lg italic text-midnight-ivory">{receipt.ticketCount}</dd>
              </div>

              <div className="flex items-start justify-between gap-6 border-b border-midnight-gold/10 pb-4">
                <dt className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-muted">Selected Seats</dt>
                <dd className="max-w-[65%] text-right font-display text-[11px] tracking-[0.1em] text-midnight-ivory">
                  {receipt.selectedSeats.length > 0 ? receipt.selectedSeats.join(', ') : '—'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-6">
                <dt className="font-display text-[10px] tracking-[0.18em] uppercase text-midnight-muted">Total Paid</dt>
                <dd className="text-right font-editorial text-2xl italic text-midnight-gold">
                  ₹{receipt.totalPaid.toLocaleString('en-IN')}
                </dd>
              </div>
            </dl>

            {Object.entries(receipt.quantities).length > 0 && (
              <ul className="mt-6 space-y-1 border-t border-midnight-gold/10 pt-4 text-[12px] text-midnight-muted">
                {Object.entries(receipt.quantities).map(([tierId, quantity]) => (
                  <li key={tierId} className="flex justify-between gap-4">
                    <span>{getTier(tierId)?.name ?? tierId}</span>
                    <span>× {quantity}</span>
                  </li>
                ))}
              </ul>
            )}

            {receipt.simulated && (
              <p className="mt-5 font-display text-[9px] uppercase tracking-[0.14em] text-midnight-muted/70">
                Local simulation — no real payment was taken
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-sm text-midnight-ivory/90">Your ticket PDF will arrive shortly via email.</p>

        <button
          type="button"
          onClick={returnHome}
          className="btn-gold mt-8 w-full py-3.5 font-display text-[10px] tracking-[0.3em] uppercase"
        >
          Return to Home
        </button>
      </div>
    </div>
  )
}
