#!/bin/zsh
# PINTAR E · the local evaluation run, v2 (after the void run 1 of 17 Nov), on the owner's Mac.
# Run it with:  zsh jalankan-e.sh
# v2 changes (INCIDENT-RUN1.md; Sharon C3, C4): the fixed runner (source commit below); max_output 48,000 for both
# providers; the caps less the void run's US$0.13 (Anthropic and per provider 4.87, total 9.87); and it refuses to start
# unless the void run's folder ../pintar-e-local/hasil is present with its one-attempt ledger, which it records.
#
#   zsh jalankan-e.sh              the real procedure. It makes paid calls ONLY after you type RUN.
#   zsh jalankan-e.sh --rehearse   Bob's offline rehearsal: the same script, with the paid run replaced by the offline
#                                  dry run and the key check pointed at a local mock. It never contacts a provider.
#
# Keys: each is typed (or pasted) at a hidden prompt into this script's own memory. It reaches only the two commands
# that need it (the key check and the run), through their environment, never through a command argument, a file,
# the shell history or an exported variable. After the final scan it is cleared, and an exit trap clears it on any
# exit. Written for zsh (the macOS default) and bash alike; rehearsed under zsh 5.9 and bash 5.2.
#
# Accepted residual risk (Sharon R9): while the run is going, another program running as you on this Mac could read
# the runner's environment. Close programs you don't need before starting.

set -euo pipefail
set +x
ulimit -c 0
umask 077

MODE=live
if [ "${1:-}" = "--rehearse" ]; then MODE=rehearse; fi
if [ "$MODE" = live ]; then unset E_REHEARSE E_REHEARSE_ANTHROPIC_BASE E_REHEARSE_OPENAI_BASE 2>/dev/null || true; fi

K_ANTHROPIC=''; K_OPENAI=''
clear_keys() { K_ANTHROPIC=''; K_OPENAI=''; unset K_ANTHROPIC K_OPENAI 2>/dev/null || true; }
trap clear_keys EXIT

cd "$(dirname "$0")"
ROOT="$(pwd)"
EVAL="$ROOT/docs/completion-4.1/c3-eval"
PACK_SHA=ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4
MAX_OUT=48000
CAPS=(--cap-provider 4.87 --cap-total 9.87 --max-output 48000)
HASIL="$ROOT/hasil"
PRIVAT="$HASIL/PRIVAT-simpan-jangan-dikirim"

judul()    { printf '\n== %s\n' "$1"; }
berhenti() { printf '\nSTOPPED: %s\nNothing further was done.\n' "$1"; clear_keys; exit 1; }
sha()      { if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$@"; else sha256sum "$@"; fi; }

# ── Step A · checks, all offline ─────────────────────────────────────────────
judul "Step A: checking this computer and the package (offline)"
command -v node >/dev/null 2>&1 || berhenti "Node.js is not installed. Install Node 22 (see the instructions, step 1)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || berhenti "Node $NODE_MAJOR is too old. Install Node 22 or newer."
echo "Node $(node --version): OK"
if command -v shasum >/dev/null 2>&1; then shasum -a 256 -c -s SHA256SUMS || berhenti "the package does not match its checksums. Download it again."
else sha256sum -c --quiet SHA256SUMS || berhenti "the package does not match its checksums. Download it again."; fi
echo "Package checksums: OK"
[ "$(cat SOURCE-COMMIT)" = "99a9ea1556f2f783e440225ca49b6db343ac3a6b" ] || berhenti "the package is not from the v2 runner commit."
echo "Package built from the v2 runner commit $(cat SOURCE-COMMIT)"
VOID="$ROOT/../pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs/ledger.json"
[ -f "$VOID" ] || berhenti "the first (void) run's folder was not found next to this one (../pintar-e-local/hasil). Keep it in Downloads, unchanged."
node -e 'const l=require(process.argv[1]); const e=l.entries; if (e.length!==1 || e[0].provider!=="anthropic" || e[0].status!=="overrun" || e[0].cost_usd!=="0.129986") process.exit(1)' "$VOID" \
  || berhenti "the first (void) run's ledger is not the one recorded (one Anthropic attempt, US\$0.129986). Tell Bob."
VOID_SHA="$(sha "$VOID" | cut -d' ' -f1)"
echo "Void run 1 found and unchanged: one Anthropic attempt, US\$0.129986 (ledger $VOID_SHA)"
[ -z "$(find "$ROOT" -name '.env*' | head -1)" ] || berhenti "a .env file is inside this folder. Use a fresh copy of the package."
[ ! -e "$HASIL" ] || berhenti "a folder 'hasil' already exists. Move it somewhere safe first; this script never overwrites results."
mkdir -p "$PRIVAT" "$HASIL/latihan"

( cd "$EVAL"
  cp -R material "$HASIL/latihan/material-before"
  node kit.mjs material >/dev/null
  diff -r "$HASIL/latihan/material-before" material >/dev/null ) || berhenti "the frozen material does not match."
echo "Frozen material: unchanged"
( cd "$EVAL"
  node runner.mjs --self-test > "$HASIL/latihan/self-test-runner.txt" 2>&1
  node score.mjs  --self-test > "$HASIL/latihan/self-test-score.txt" 2>&1
  node report.mjs --self-test > "$HASIL/latihan/self-test-report.txt" 2>&1
  node kit.mjs selftest      > "$HASIL/latihan/self-test-kit.txt" 2>&1 ) || berhenti "a self-test failed (see hasil/latihan)."
echo "Self-tests: all passed (including the runner's frozen-set check)"
( cd "$EVAL" && node runner.mjs --dry-run --real-prices "${CAPS[@]}" --pack-sha "$PACK_SHA" \
    --out "$HASIL/latihan/dry-run" > "$HASIL/latihan/dry-run.txt" 2>&1 ) || berhenti "the offline practice run failed (see hasil/latihan)."
echo "Offline practice run, at the real prices and caps: OK"

# ── Step B · the keys, at hidden prompts ─────────────────────────────────────
judul "Step B: your two keys (nothing you type or paste will show)"
printf 'Paste the ANTHROPIC key (evaluation workspace), then press Return: '
IFS= read -rs K_ANTHROPIC; echo
printf 'Paste the OPENAI key (evaluation project), then press Return: '
IFS= read -rs K_OPENAI; echo
if command -v pbcopy >/dev/null 2>&1; then printf '' | pbcopy; echo "Clipboard cleared."; fi
[ -n "$K_ANTHROPIC" ] && [ -n "$K_OPENAI" ] || berhenti "a key was empty."
case "$K_ANTHROPIC" in sk-ant-*) ;; *) berhenti "the first key does not look like an Anthropic key (it should start sk-ant-). Were they swapped?";; esac
case "$K_OPENAI" in sk-ant-*) berhenti "the second key looks like an Anthropic key. Were they swapped?";; sk-*) ;; *) berhenti "the second key does not look like an OpenAI key (it should start sk-).";; esac
echo "Both keys received (not shown, not saved)."

# ── Step C · the key check, at no cost ───────────────────────────────────────
judul "Step C: checking both keys at no cost (no tokens are used)"
( if [ "$MODE" = rehearse ]; then export E_REHEARSE=1; fi
  ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" node "$ROOT/periksa-kunci.mjs" ) \
  | tee "$HASIL/latihan/key-check.txt" || berhenti "a key or model was not confirmed. Nothing was spent."

# ── Step D · your go ─────────────────────────────────────────────────────────
judul "Step D: the paid run"
echo "Ready. The run will make at most 6 calls per provider (normally 2), each allowed up to $MAX_OUT output tokens, with these limits:"
echo "  - this program stops before any call that could pass US\$4.87 for one provider or US\$9.87 in total (the US\$0.13 of run 1 deducted);"
echo "  - your Anthropic workspace limit is US\$5, and your OpenAI balance is US\$5;"
echo "  - the expected cost is about US\$1.04 per provider, and the worst case is US\$3.13 per provider."
echo "  - rules: the frozen decision pack ${PACK_SHA:0:8}; prices: the pinned US\$2 / US\$10 per million tokens."
printf 'Type RUN in capital letters to make the paid calls now. Anything else stops without spending: '
IFS= read -r GO
[ "$GO" = "RUN" ] || berhenti "you did not type RUN."

T_START="$(node -p 'new Date().toISOString()')"
set +e
if [ "$MODE" = live ]; then
  ( cd "$EVAL" && ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --live "${CAPS[@]}" --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
else
  ( cd "$EVAL" && ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --dry-run --real-prices "${CAPS[@]}" --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
fi
RUN_EXIT=$?
set -e
T_END="$(node -p 'new Date().toISOString()')"
echo "Run finished (exit code $RUN_EXIT). No program needs your keys any more."
[ "$RUN_EXIT" -eq 0 ] || berhenti "the run did not complete. Send Bob the file hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt (it holds no key)."

# ── Step E · blinding, on this computer ──────────────────────────────────────
judul "Step E: blinding the questions"
( cd "$EVAL" && node kit.mjs blind "$PRIVAT/runs" "$PRIVAT/out" ) > "$PRIVAT/blind-log.txt" 2>&1 || berhenti "blinding failed (see the blind log)."
MAP_SHA="$(sha "$PRIVAT/out/SEALED/map.json" | cut -d' ' -f1)"

mkdir -p "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob"
cp -R "$PRIVAT/out/kunci/."    "$HASIL/untuk-sharon/"
cp -R "$PRIVAT/out/reviewer/." "$HASIL/untuk-juri/"
cp "$PRIVAT/runs/ledger.json" "$PRIVAT/runs/summary.json" "$HASIL/untuk-bob/"
node -e '
  const l = require(process.argv[1]); const by = {}; let first = null, last = null;
  for (const e of l.entries) {
    const p = by[e.provider] ??= { attempts: 0, cost: 0, status: {} };
    p.attempts++; p.cost += Number(e.cost_usd || 0); p.status[e.status] = (p.status[e.status] || 0) + 1;
    if (e.reserved_at && (!first || e.reserved_at < first)) first = e.reserved_at;
    if (e.settled_at && (!last || e.settled_at > last)) last = e.settled_at;
  }
  const lines = [`void run 1 ledger sha256: ${process.argv[6]}`, `mode: ${process.argv[2]}`, `run window (this command): ${process.argv[3]} to ${process.argv[4]}`,
    `ledger first request: ${first}`, `ledger last settlement: ${last}`, `sealed map sha256: ${process.argv[5]}`];
  for (const [k, v] of Object.entries(by)) lines.push(`${k}: ${v.attempts} attempts, US$${v.cost.toFixed(6)}, ${JSON.stringify(v.status)}`);
  console.log(lines.join("\n"));
' "$PRIVAT/runs/ledger.json" "$MODE" "$T_START" "$T_END" "$MAP_SHA" "$VOID_SHA" > "$HASIL/untuk-bob/ringkasan.txt"
cat "$HASIL/untuk-bob/ringkasan.txt"

# Before anything leaves this Mac (Sharon R3, and her sheet points 4 and 5):
# 1. the exact key values, given to grep through a file descriptor (never argv), in every result file;
set +e
grep -rqF -f <(printf '%s\n' "$K_ANTHROPIC" "$K_OPENAI") "$HASIL"
SCAN=$?
set -e
[ "$SCAN" -eq 1 ] || berhenti "a key was found in a result file, or the scan failed (code $SCAN). Send nothing; tell Bob."
clear_keys
echo "Checked: neither key appears in any result file. Your keys have been cleared from this program."
# 2. nothing key-like, and the sealed map in none of the folders to send.
if grep -rIlE 'sk-(ant-|proj-)?[A-Za-z0-9_-]{16,}' "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" >/dev/null 2>&1; then
  berhenti "something that looks like a key is in a folder to send. Send nothing; tell Bob."; fi
if find "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" -name 'map.json' | grep -q .; then
  berhenti "the sealed map is in a folder to send. Send nothing; tell Bob."; fi
echo "Checked: no key-like text and no sealed map in the folders to send."

( cd "$HASIL" && zip -qr untuk-sharon.zip untuk-sharon && zip -qr untuk-juri.zip untuk-juri && zip -qr untuk-bob.zip untuk-bob )

judul "Done"
echo "In the folder hasil (see the instructions, step 6, for the order):"
echo "  untuk-bob.zip     -> 1st: send to Bob (costs, times, the sealed map's fingerprint; no questions, no key)"
echo "  untuk-sharon.zip  -> 2nd: send to Bob when he says the fingerprint is recorded (questions and options only)"
echo "  untuk-juri.zip    -> 3rd: keep until Bob says Sharon's check is recorded and sends the scoring guide"
echo "  PRIVAT-simpan-jangan-dikirim  -> KEEP SAFE, SEND TO NO ONE. It holds the raw answers and the map of which"
echo "                                   provider wrote which question. Bob asks for it only after all scoring is final."
echo ""
echo "Now: revoke both keys in the two consoles, note the time, and close this window (instructions, step 7)."
