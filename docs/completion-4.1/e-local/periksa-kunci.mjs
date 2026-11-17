// PINTAR E · key check at no cost (Sharon's A3). Run only by jalankan-e.sh.
//
// For each provider, one GET of the model's own record (no generation, so no tokens are used and nothing is billed).
// HTTP 200 proves that the key is accepted and that the model ID exists.
// It prints only the provider, the HTTP status, whether the model was confirmed, and the UTC time.
// It never prints or stores a key, a request header or a response body.
//
// The keys come from this process's own environment, set by jalankan-e.sh for this one command only.
// Which providers: the arguments (v3: `anthropic` only, Ruling 50); with none, both, as before.

const MODELS = { anthropic: 'claude-sonnet-5-5', openai: 'gpt-6.1-sol' };
const BASE = { anthropic: 'https://api.anthropic.com', openai: 'https://api.openai.com' };
const LIST = process.argv.length > 2 ? process.argv.slice(2) : ['anthropic', 'openai'];
for (const p of LIST) if (!(p in MODELS) || LIST.indexOf(p) !== LIST.lastIndexOf(p)) { console.error(`unknown or repeated provider: ${p}`); process.exit(2); }

// Rehearsal only: jalankan-e.sh --rehearse points both checks at a local mock on 127.0.0.1. No other host is accepted.
if (process.env.E_REHEARSE === '1') {
  for (const p of LIST) {
    const b = process.env[`E_REHEARSE_${p.toUpperCase()}_BASE`] || '';
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(b)) { console.error(`rehearsal base for ${p} must be http://127.0.0.1:<port>`); process.exit(2); }
    BASE[p] = b;
  }
}

const KEY = { anthropic: process.env.ANTHROPIC_API_KEY || '', openai: process.env.OPENAI_API_KEY || '' };
const REQ = {
  anthropic: () => fetch(`${BASE.anthropic}/v1/models/${MODELS.anthropic}`,
    { headers: { authorization: `Bearer ${KEY.anthropic}`, 'anthropic-version': '2026-10-21' }, signal: AbortSignal.timeout(30_000) }),
  openai: () => fetch(`${BASE.openai}/v1/models/${MODELS.openai}`,
    { headers: { authorization: `Bearer ${KEY.openai}` }, signal: AbortSignal.timeout(30_000) }),
};

let ok = true;
for (const p of LIST) {
  const at = new Date().toISOString();
  if (!KEY[p]) { console.log(`${p}: no key given  ${at}`); ok = false; continue; }
  let status = 'no response', confirmed = false;
  try {
    const r = await REQ[p]();
    status = `HTTP ${r.status}`;
    if (r.ok) { const j = await r.json().catch(() => ({})); confirmed = j && j.id === MODELS[p]; }
    else await r.body?.cancel();
  } catch (e) { status = `failed (${e.name})`; }
  console.log(`${p}: ${status}; model ${MODELS[p]} ${confirmed ? 'CONFIRMED' : 'NOT confirmed'}  ${at}`);
  if (!confirmed) ok = false;
}
process.exit(ok ? 0 : 1);
