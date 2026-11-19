#!/usr/bin/env node
/**
 * Read-only Supabase diagnostics:
 *  - base schema (001)
 *  - service_role table grants (required by /api/*)
 *  - payment migration 002 objects (ledger table + fulfilment RPC)
 *
 * Usage: node --env-file=.env scripts/check-supabase-schema.cjs
 */
const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const anon = (process.env.VITE_SUPABASE_ANON_KEY || '').trim()
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!url || !anon || !service) {
  console.error('Missing SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env)')
  process.exit(1)
}

const auth = (key) => ({ apikey: key, Authorization: `Bearer ${key}` })

async function get(path, key) {
  try {
    const res = await fetch(`${url}${path}`, { headers: { ...auth(key) } })
    let json = {}
    try { json = await res.json() } catch {}
    return { status: res.status, code: json?.code || '', message: json?.message || '' }
  } catch (e) {
    return { status: 'network', code: '', message: e?.message || 'request failed' }
  }
}

async function rpcExists() {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/fulfill_razorpay_payment`, {
      method: 'POST',
      headers: { ...auth(service), 'Content-Type': 'application/json' },
      // Dummy order: the function raises order_not_found and rolls back,
      // so no ledger row is written. This only checks that it exists.
      body: JSON.stringify({
        p_event_id: 'diag-nonexistent-0001',
        p_order_id: '00000000-0000-0000-0000-000000000000',
        p_payment_id: 'diag',
        p_amount_paise: 100,
        p_currency: 'INR',
      }),
    })
    let json = {}
    try { json = await res.json() } catch {}
    // PGRST205 = function missing; P0001 order_not_found = function present.
    const present = json?.code !== 'PGRST205' && json?.message !== 'Could not find the function'
    return { present, status: res.status, code: json?.code || '', message: json?.message || '' }
  } catch (e) {
    return { present: false, status: 'network', code: '', message: e?.message || 'request failed' }
  }
}

;(async () => {
  console.log(`Supabase: ${url}\n`)

  const base = await get('/rest/v1/ticket_tiers?select=id&limit=1', anon)
  console.log(`${base.status === 200 ? 'OK  ' : 'FAIL'} Base schema (001): anon can read ticket_tiers (HTTP ${base.status})`)

  const grants = await get('/rest/v1/ticket_tiers?select=id&limit=0', service)
  const grantsOk = grants.status === 200
  console.log(`${grantsOk ? 'OK  ' : 'FAIL'} service_role table grants: ${
    grantsOk ? 'direct reads allowed' : `HTTP ${grants.status} ${grants.message.slice(0, 90)}`
  }`)
  if (!grantsOk) console.log('     -> Re-apply migration 002 (section 6 grants service_role).')

  const ledger = await get('/rest/v1/processed_webhook_events?select=event_id&limit=0', anon)
  const ledgerMissing = ledger.code === 'PGRST205' || ledger.status === 404
  console.log(`${ledgerMissing ? 'FAIL' : 'OK  '} Migration 002 ledger table: ${
    ledgerMissing ? 'missing (404)' : `exists (HTTP ${ledger.status}, no anon grant)`
  }`)

  const fn = await rpcExists()
  console.log(`${fn.present ? 'OK  ' : 'FAIL'} Migration 002 RPC fulfill_razorpay_payment: ${
    fn.present ? `exists (HTTP ${fn.status} ${fn.code})` : `missing (HTTP ${fn.status} ${fn.message})`
  }`)

  const allOk = base.status === 200 && grantsOk && !ledgerMissing && fn.present
  console.log(allOk ? '\nRESULT: database is ready.' : '\nRESULT: see failures above.')
  process.exit(allOk ? 0 : 1)
})()
