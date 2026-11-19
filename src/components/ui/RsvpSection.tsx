import { useMemo, useState, type FormEvent } from 'react'

type Attendance = 'attending' | 'unable' | ''

const WEB3FORMS_KEY = import.meta.env.VITE_RSVP_WEB3FORMS_KEY as string | undefined
const FORMSPREE_ID = import.meta.env.VITE_RSVP_FORMSPREE_ID as string | undefined
// ponytail: env-configured form endpoint when provided; no fake success, no invented backend.

export default function RsvpSection() {
  const [attendance, setAttendance] = useState<Attendance>('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const endpoint = useMemo(() => {
    if (WEB3FORMS_KEY) return { type: 'web3forms' as const, url: 'https://api.web3forms.com/submit' }
    if (FORMSPREE_ID) return { type: 'formspree' as const, url: `https://formspree.io/f/${FORMSPREE_ID}` }
    return null
  }, [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const name = String(fd.get('name') || '').trim()
    const contact = String(fd.get('contact') || '').trim()
    const count = String(fd.get('count') || '').trim()

    if (!name || !contact || !count || !attendance) {
      setError('Please complete all required fields and select your attendance.')
      return
    }
    if (!endpoint) {
      setError('RSVP submission is not configured yet. Please set VITE_RSVP_WEB3FORMS_KEY or VITE_RSVP_FORMSPREE_ID.')
      return
    }

    setStatus('submitting')
    try {
      let res: Response
      if (endpoint.type === 'web3forms') {
        fd.append('access_key', WEB3FORMS_KEY!)
        fd.append('subject', 'Orlem Christmas Ball 2026 RSVP')
        fd.append('attendance', attendance)
        res = await fetch(endpoint.url, { method: 'POST', body: fd })
      } else {
        const payload = {
          name, contact, count, attendance,
          message: String(fd.get('message') || '').trim(),
          event: 'Orlem Christmas Ball 2026',
        }
        res = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      form.reset()
      setAttendance('')
    } catch {
      setStatus('error')
      setError('Submission failed. Please try again later.')
    }
  }

  return (
    <section id="rsvp" className="section-shell py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 md:mb-14">
          <p className="font-display text-[10px] md:text-[11px] tracking-[0.38em] uppercase text-midnight-goldMuted mb-4 pl-[0.38em]">Répondez s&apos;il vous plaît</p>
          <h2 className="font-editorial italic text-3xl md:text-5xl text-midnight-ivory">RSVP</h2>
        </div>

        {status === 'success' ? (
          <div className="border border-midnight-gold/30 bg-midnight-bg2/40 px-6 py-10 text-center" role="status" aria-live="polite">
            <p className="font-editorial italic text-2xl md:text-3xl text-midnight-gold">Thank you</p>
            <p className="mt-3 font-display text-[11px] tracking-[0.22em] uppercase text-midnight-muted pl-[0.22em]">Your response has been received.</p>
            <button type="button" className="btn-gold mt-8 px-6 py-3 font-display text-[10px] tracking-[0.28em] uppercase pl-[calc(1.5rem+0.28em)] pr-6" onClick={() => setStatus('idle')}>
              Submit Another Response
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="border border-midnight-gold/15 bg-midnight-bg2/25 p-6 md:p-10 space-y-6" noValidate>
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-2">Full Name *</span>
                <input name="name" type="text" required autoComplete="name" className="input-gold" placeholder="Your full name" />
              </label>
              <label className="block">
                <span className="block font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-2">Contact Number *</span>
                <input name="contact" type="tel" required autoComplete="tel" className="input-gold" placeholder="Phone number" />
              </label>
            </div>

            <label className="block">
              <span className="block font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-2">Number of Attendees *</span>
              <input name="count" type="number" min={1} max={20} required className="input-gold" placeholder="e.g. 2" />
            </label>

            <fieldset className="text-center">
              <legend className="block w-full text-center font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-3 pl-[0.28em]">Attendance Confirmation *</legend>
              <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <button type="button" aria-pressed={attendance === 'attending'} onClick={() => setAttendance('attending')}
                  className="btn-gold px-5 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.3em] uppercase pl-[calc(1.25rem+0.3em)] pr-5">Attending</button>
                <button type="button" aria-pressed={attendance === 'unable'} onClick={() => setAttendance('unable')}
                  className="btn-gold px-5 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.3em] uppercase pl-[calc(1.25rem+0.3em)] pr-5">Unable to Attend</button>
              </div>
              <input type="hidden" name="attendance" value={attendance} />
            </fieldset>

            <label className="block">
              <span className="block font-display text-[10px] tracking-[0.28em] uppercase text-midnight-goldMuted mb-2">Optional Message</span>
              <textarea name="message" rows={4} className="input-gold resize-y min-h-[110px]" placeholder="Message (optional)" />
            </label>

            {error && <p className="text-[12px] tracking-wide text-[#d8b4a6] text-center" role="alert">{error}</p>}
            {!endpoint && (
              <p className="text-[11px] leading-relaxed tracking-wide text-midnight-muted border border-midnight-gold/10 px-4 py-3 text-center">
                Integration point: configure <code className="text-midnight-gold/90">VITE_RSVP_WEB3FORMS_KEY</code> (Web3Forms) or <code className="text-midnight-gold/90">VITE_RSVP_FORMSPREE_ID</code> (Formspree) in environment to enable submissions. No response is stored until configured.
              </p>
            )}

            <div className="pt-2 flex justify-center">
              <button type="submit" disabled={status === 'submitting'} className="btn-gold w-full sm:w-auto px-10 py-3.5 font-display text-[10px] md:text-[11px] tracking-[0.32em] uppercase pl-[calc(2.5rem+0.32em)] pr-10 disabled:opacity-50 disabled:cursor-not-allowed">
                {status === 'submitting' ? 'Submitting…' : 'Submit RSVP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
