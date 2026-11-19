#!/usr/bin/env node
/**
 * Validate a Razorpay key pair BEFORE putting it in Vercel.
 *
 * Default: read-only auth check (GET /v1/orders?count=1) — no side effects.
 * Optional: --create-order also creates a harmless INR 1 (100 paise) Test Mode order.
 *
 * Usage:
 *   node --env-file=.env scripts/check-razorpay-keys.cjs
 *   node scripts/check-razorpay-keys.cjs --key-id rzp_test_xxx --key-secret xxx
 *   node scripts/check-razorpay-keys.cjs --key-id ... --key-secret ... --create-order
 */
const Razorpay = require('razorpay')

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--key-id': out.keyId = argv[++i]; break
      case '--key-secret': out.keySecret = argv[++i]; break
      case '--create-order': out.createOrder = true; break
      case '--allow-live': out.allowLive = true; break
      case '-h':
      case '--help': out.help = true; break
      default: out.unknown = argv[i]
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  console.log(`Usage:
  node --env-file=.env scripts/check-razorpay-keys.cjs
  node scripts/check-razorpay-keys.cjs --key-id rzp_test_xxx --key-secret xxx [--create-order]

Options:
  --create-order   Also create a INR 1 Test Mode order (default: read-only check)
  --allow-live     Permit rzp_live_ keys (refused by default for safety)`)
  process.exit(0)
}

const keyId = (args.keyId || process.env.RAZORPAY_KEY_ID || '').trim()
const keySecret = (args.keySecret || process.env.RAZORPAY_KEY_SECRET || '').trim()

if (args.unknown) {
  console.error(`Unknown argument: ${args.unknown}`)
  process.exit(1)
}
if (!keyId || !keySecret) {
  console.error('Missing key pair. Pass --key-id / --key-secret or run with --env-file=.env')
  process.exit(1)
}
if (!/^rzp_(test|live)_/.test(keyId)) {
  console.error('Key ID should start with rzp_test_ or rzp_live_.')
  process.exit(1)
}
if (keyId.startsWith('rzp_live_') && !args.allowLive) {
  console.error('Refusing to test LIVE keys. Use Test Mode keys (or pass --allow-live deliberately).')
  process.exit(1)
}
if (keySecret.length < 20) {
  console.error('Key secret looks too short (expected ~24 chars). Check for quotes/truncation.')
  process.exit(1)
}

// Never print the secret. Only a short, masked fingerprint of the key ID.
const maskedId = `${keyId.slice(0, 11)}…${keyId.slice(-4)}`
console.log(`Checking ${maskedId} (${keyId.startsWith('rzp_live_') ? 'LIVE' : 'TEST'}) against Razorpay...`)

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

function formatError(err) {
  const e = err?.error || {}
  const parts = [
    `HTTP ${err?.statusCode ?? err?.response?.status ?? '?'}`,
    e.code || 'UNKNOWN_CODE',
    e.description || err?.message || 'no description',
  ]
  if (e.field) parts.push(`field=${e.field}`)
  return parts.join(' | ')
}

;(async () => {
  try {
    const result = await razorpay.orders.all({ count: 1 })
    console.log('OK: credentials authenticated (GET /v1/orders succeeded).')
    console.log(`Existing orders visible: ${Array.isArray(result?.items) ? result.items.length : 'unknown'}`)

    if (args.createOrder) {
      try {
        const order = await razorpay.orders.create({
          amount: 100,
          currency: 'INR',
          receipt: `keycheck_${Date.now()}`,
          notes: { purpose: 'key validation' },
        })
        console.log(`OK: INR 1 test order created (id=${order.id}).`)
      } catch (createErr) {
        console.error(`FAIL: authenticated, but order creation was rejected: ${formatError(createErr)}`)
        process.exit(1)
      }
    }

    console.log('These keys are safe to use in Vercel. Remember: key_id/key_secret are server-only.')
    process.exit(0)
  } catch (err) {
    console.error(`FAIL: ${formatError(err)}`)
    console.error('Generate a fresh TEST MODE key pair in the Razorpay Dashboard and retry.')
    process.exit(1)
  }
})()
