# Orlem Christmas Ball 2026 — Site + Serverless Ticketing

React/Vite invitation site with serverless Razorpay ticketing (Supabase + Resend) and an admin door scanner.

## Stack

- **Frontend:** Vite + React + Tailwind + R3F hero
- **DB:** Supabase Postgres (`ticket_tiers`, `orders`, `order_items`, `tickets`, `processed_webhook_events`, `app_settings`) + RLS
- **Payments:** Razorpay Standard Checkout via Vercel serverless functions
- **Email:** Resend (QR ticket attachments on a verified `payment.captured` webhook)
- **Admin/ops:** Supabase Dashboard + `/scanner` door check-in tool

## Setup

### 1) Supabase

1. Create a project and run `supabase/migrations/001_ticketing.sql` in the SQL editor.
2. Run `supabase/migrations/002_payment_hardening.sql`. This renames `orders.cashfree_order_id` to `razorpay_order_id`, adds payment reconciliation fields and the webhook idempotency ledger, and adds the atomic fulfilment RPC.
3. Seed tiers and the scanner PIN:

   ```sql
   insert into public.ticket_tiers (name, price_inr, total_quota) values
   ('Regular Ticket', 1500, 200),
   ('Reduced Ticket', 1000, 50);

   insert into public.app_settings (key, value) values ('scanner_pin', 'YOUR_PIN')
   on conflict (key) do update set value = excluded.value;
   ```

4. RLS is enabled on all tables. `anon` can only select active `ticket_tiers` and execute the booking/scanner RPCs. All payment state changes happen server-side with the service role.

### 2) Env vars

Frontend `.env` (Vite — public by design):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_SITE_URL`

Server env (Vercel Project Settings → Environment Variables, or local env used by `vercel dev`):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` — the exact secret configured on the Razorpay webhook in the Dashboard
- `RESEND_API_KEY`, `TICKET_EMAIL_FROM`
- Optional: `RAZORPAY_WEBHOOK_MAX_AGE_SECONDS` (default `300`)

Never put the key secret or webhook secret in a `VITE_` variable, in source control, or in client-side code.

### 3) Razorpay Dashboard

- Use **Test Mode** keys while testing; switch to Live Mode keys and a Live Mode webhook only when ready.
- Webhook URL: `https://<your-domain>/api/razorpay-webhook`
- Webhook secret: same value as `RAZORPAY_WEBHOOK_SECRET`.
- Subscribe to `payment.captured`. `payment.failed`, `order.paid`, `refund.*` and `payment.dispute.created` are acknowledged but not acted on by the current handler.
- Enable **auto-capture** under Account & Settings → Payment Capture. The create-order request deliberately sends only documented fields, so Dashboard auto-capture is what makes `payment.captured` webhooks fire.

### 4) Run locally

```powershell
npm install
npx vercel dev   # required for /api serverless routes
```

`npm run dev` only serves the frontend. `npm run build` produces the production bundle.

## Payment flow

1. Checkout validates the form and posts only customer details and tier quantities to `/api/create-razorpay-order`. The client never supplies a price.
2. `reserve_tickets` locks stock, recomputes the total, creates a `PENDING` order and returns an unguessable `status_token`.
3. The server creates a Razorpay order with the authoritative amount in paise, stores its ID and returns it with the public Key ID to the browser.
4. `checkout.js` opens the modal. On success, the browser sends the three Razorpay callback fields to `/api/verify-payment`, which checks the HMAC signature using the Key Secret and the order ID from our database. This is for instant UI confirmation only.
5. The browser polls `/api/order-status` with `status_token`. A bare Razorpay order ID cannot read anyone's order or QR tokens.
6. The verified `payment.captured` webhook compares the amount and currency with the order, atomically marks it `PAID`, issues one ticket per quantity, deduplicates on the Razorpay event ID, emails QR codes and marks the email as sent.

## How "admin" works

- **Supabase Dashboard:** manage `ticket_tiers`, inspect `orders` / `order_items` / `tickets` / `processed_webhook_events`, and reconcile against the Razorpay Dashboard using `razorpay_order_id` and `razorpay_payment_id`.
- **`/scanner`:** staff PIN + QR scan. Calls `scan_ticket` RPC; atomic check-in; no direct frontend access to the `tickets` table.

## Testing checklist

- Successful payment returns all three callback fields and the modal shows QR tickets.
- Tampering with any callback field makes `/api/verify-payment` reject it.
- A webhook with a bad `X-Razorpay-Signature` is rejected with 401.
- A replayed webhook event ID does not create duplicate tickets.
- A captured amount that differs from the order amount is rejected.
- Failed payment does not fulfil the order.
- UPI `success@razorpay` and `pending@razorpay` flows behave correctly.
- Payment completed with the browser tab closed still fulfils via the webhook.
- Refunds and disputes appear in the Dashboard and are reconciled manually.

## Notes / remaining hardening

- The scanner PIN is stored in plaintext in `app_settings`; hash it and add staff auth before going live.
- Add rate limiting to `/api/*` and to the booking/scanner RPCs.
- Add a resend endpoint or retry queue for failed ticket emails (the webhook logs the failure but the event is already marked processed).
- Consider moving webhook processing to a background queue if it approaches Razorpay's 5-second response window.
- Schedule `release_expired_reservations()` if `reserve_tickets` is not called often enough to clean up abandoned orders.
