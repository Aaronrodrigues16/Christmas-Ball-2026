# Deployment checklist — Razorpay (Test Mode)

## Step 1: Supabase migrations

Run `supabase/migrations/001_ticketing.sql`, then `supabase/migrations/002_payment_hardening.sql`, in the Supabase SQL editor. Seed `ticket_tiers` and set `scanner_pin` (see README).

## Step 2: Vercel environment variables

Project → Settings → Environment Variables. Add to Production, Preview and Development as appropriate:

| Variable | Notes |
|---|---|
| `VITE_SUPABASE_URL` | Public |
| `VITE_SUPABASE_ANON_KEY` | Public |
| `VITE_SITE_URL` | Public |
| `SUPABASE_URL` | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never exposed to the browser |
| `RAZORPAY_KEY_ID` | Use `rzp_test_…` in Test Mode; `rzp_live_…` in Live Mode |
| `RAZORPAY_KEY_SECRET` | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | Must exactly match the secret configured on the webhook |
| `RESEND_API_KEY` | Server only |
| `TICKET_EMAIL_FROM` | Verified sender domain |
| `RAZORPAY_WEBHOOK_MAX_AGE_SECONDS` | Optional, default `300` |

Never add secrets as `VITE_` variables. After changing any variable, redeploy.

**Validate a new key pair before saving it in Vercel:**

```powershell
node --env-file=.env scripts/check-razorpay-keys.cjs
# or, without touching .env:
node scripts/check-razorpay-keys.cjs --key-id rzp_test_xxx --key-secret xxx
```

This makes a read-only `GET /v1/orders` call (no side effects) and prints the exact Razorpay error if authentication fails. Add `--create-order` to also create a harmless INR 1 Test Mode order and confirm create permissions. The script refuses `rzp_live_` keys unless `--allow-live` is passed explicitly.

> Current status: the key pair in local `.env` is rejected by Razorpay with `HTTP 401 | BAD_REQUEST_ERROR | Authentication failed`. Generate a fresh Test Mode pair in the Dashboard before proceeding.

## Step 3: Razorpay webhook (Test Mode)

1. Dashboard (Test Mode) → Settings → Webhooks → Add New Webhook.
2. URL: `https://christmasball26.vercel.app/api/razorpay-webhook`
3. Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`.
4. Events: `payment.captured` (required). Other payment, order, refund and dispute events may be subscribed; they are acknowledged with HTTP 200 and ignored.
5. Save, then use the Dashboard's webhook test feature to confirm a `payment.captured` sample returns 200.

Also confirm Dashboard → Account & Settings → Payment Capture has **auto-capture** enabled.

## Step 4: Verify deployment

1. `/api/health` → `ok: true` (checks Supabase, Razorpay keys, webhook secret and Resend key).
2. Make a test payment using `success@razorpay` or test card `4100 2800 0000 1007`.
3. Confirm:
   - the modal shows QR tickets,
   - `orders.status` becomes `PAID` with `razorpay_payment_id` set,
   - one `tickets` row per quantity exists,
   - the email arrives with QR attachments,
   - `/scanner` accepts one of the QR codes and rejects a re-scan.
4. Check Dashboard → Payments shows the payment as **Captured**.
5. Check webhook delivery logs show HTTP 200 with no retries.

## Before going live

- Generate Live Mode keys and a Live Mode webhook with a new secret; update all Vercel env vars and redeploy.
- Re-run the full test checklist in Test Mode first.
- Rotate credentials that have existed in local `.env` files (Razorpay secret, Supabase service role key, Resend key).
- Add scanner PIN hashing, staff auth and rate limiting.
