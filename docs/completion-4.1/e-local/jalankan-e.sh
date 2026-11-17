#!/bin/bash
# PINTAR E · the local evaluation run, on the owner's Mac.
#
#   bash jalankan-e.sh              the real procedure. It makes paid calls ONLY after you type RUN.
#   bash jalankan-e.sh --rehearse   Bob's offline rehearsal: the same script, with the paid run replaced by the offline
#                                   dry run and the key check pointed at a local mock. It never contacts a provider.
#
# What it never does: put a key in a command argument, a file, the shell history or a persistent environment
# variable. Each key is typed (or pasted) at a hidden prompt, held only in this script's memory, passed to the two
# commands that need it through their own environment, and cleared before the script continues.

set -euo pipefail
set +x
ulimit -c 0
umask 077

MODE=live
if [ "${1:-}" = "--rehearse" ]; then MODE=rehearse; fi

cd "$(dirname "$0")"
ROOT="$(pwd)"
EVAL="$ROOT/docs/completion-4.1/c3-eval"
PACK_SHA=ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4
HASIL="$ROOT/hasil"
PRIVAT="$HASIL/PRIVAT-simpan-jangan-dikirim"

say()  { printf '\n== %s\n' "$1"; }
stop() { printf '\nSTOPPED: %s\nNothing further was done.\n' "$1"; K_ANTHROPIC=''; K_OPENAI=''; unset K_ANTHROPIC K_OPENAI; exit 1; }
sha()  { if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$@"; else sha256sum "$@"; fi; }

# ── Step A · checks, all offline ─────────────────────────────────────────────
say "Step A: checking this computer and the package (offline)"
command -v node >/dev/null 2>&1 || stop "Node.js is not installed. Install Node 22 (see the instructions, step 1)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || stop "Node $NODE_MAJOR is too old. Install Node 22 or newer."
echo "Node $(node --version): OK"
if command -v shasum >/dev/null 2>&1; then shasum -a 256 -c -s SHA256SUMS || stop "the package does not match its checksums. Download it again."
else sha256sum -c --quiet SHA256SUMS || stop "the package does not match its checksums. Download it again."; fi
echo "Package checksums: OK"
echo "Package built from the frozen runner commit $(cat SOURCE-COMMIT)"
[ "$(cat SOURCE-COMMIT)" = "68ebe2fda37c03016ddca36d9668418865f8d587" ] || stop "the package is not from the frozen runner commit."
[ -z "$(find "$ROOT" -name '.env*' -print -quit)" ] || stop "a .env file is inside this folder. Use a fresh copy of the package."
[ ! -e "$HASIL" ] || stop "a folder 'hasil' already exists. Move it somewhere safe first; this script never overwrites results."
mkdir -p "$PRIVAT" "$HASIL/latihan"

( cd "$EVAL"
  cp -R material "$HASIL/latihan/material-before"
  node kit.mjs material >/dev/null
  diff -r "$HASIL/latihan/material-before" material >/dev/null ) || stop "the frozen material does not match."
echo "Frozen material: unchanged"
( cd "$EVAL"
  node runner.mjs --self-test > "$HASIL/latihan/self-test-runner.txt" 2>&1
  node score.mjs  --self-test > "$HASIL/latihan/self-test-score.txt" 2>&1
  node report.mjs --self-test > "$HASIL/latihan/self-test-report.txt" 2>&1
  node kit.mjs selftest      > "$HASIL/latihan/self-test-kit.txt" 2>&1 ) || stop "a self-test failed (see hasil/latihan)."
echo "Self-tests: all passed"
( cd "$EVAL" && node runner.mjs --dry-run --real-prices --cap-provider 5 --cap-total 10 --pack-sha "$PACK_SHA" \
    --out "$HASIL/latihan/dry-run" > "$HASIL/latihan/dry-run.txt" 2>&1 ) || stop "the offline practice run failed (see hasil/latihan)."
echo "Offline practice run, at the real prices and caps: OK"

# ── Step B · the keys, at hidden prompts ─────────────────────────────────────
say "Step B: your two keys (nothing you type or paste will show)"
printf 'Paste the ANTHROPIC key (evaluation workspace), then press Return: '
IFS= read -rs K_ANTHROPIC; echo
printf 'Paste the OPENAI key (evaluation project), then press Return: '
IFS= read -rs K_OPENAI; echo
[ -n "$K_ANTHROPIC" ] && [ -n "$K_OPENAI" ] || stop "a key was empty."
case "$K_ANTHROPIC" in sk-ant-*) ;; *) stop "the first key does not look like an Anthropic key (it should start sk-ant-). Were they swapped?";; esac
case "$K_OPENAI" in sk-ant-*) stop "the second key looks like an Anthropic key. Were they swapped?";; sk-*) ;; *) stop "the second key does not look like an OpenAI key (it should start sk-).";; esac
echo "Both keys received (not shown, not saved)."

# ── Step C · the key check, at no cost ───────────────────────────────────────
say "Step C: checking both keys at no cost (no tokens are used)"
CHECK_ENV=""
if [ "$MODE" = rehearse ]; then CHECK_ENV="E_REHEARSE=1"; fi
env $CHECK_ENV ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" node "$ROOT/periksa-kunci.mjs" \
  | tee "$HASIL/latihan/key-check.txt" || stop "a key or model was not confirmed. Nothing was spent."

# ── Step D · your go ─────────────────────────────────────────────────────────
say "Step D: the paid run"
echo "Ready. The run will make at most 6 calls per provider (normally 2), with these limits:"
echo "  - this program stops before any call that could pass US\$5 for one provider or US\$10 in total;"
echo "  - your Anthropic workspace limit is US\$5, and your OpenAI balance is US\$5;"
echo "  - the expected cost is about US\$0.25 per provider, and the worst case is US\$0.76."
echo "  - rules: the frozen decision pack ${PACK_SHA:0:8}; prices: the pinned US\$2 / US\$10 per million tokens."
printf 'Type RUN in capital letters to make the paid calls now. Anything else stops without spending: '
IFS= read -r GO
[ "$GO" = "RUN" ] || stop "you did not type RUN."

T_START="$(node -p "new Date().toISOString()")"
set +e
if [ "$MODE" = live ]; then
  ( cd "$EVAL" && ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --live --cap-provider 5 --cap-total 10 --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
else
  ( cd "$EVAL" && ANTHROPIC_API_KEY="$K_ANTHROPIC" OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --dry-run --real-prices --cap-provider 5 --cap-total 10 --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
fi
RUN_EXIT=$?
set -e
T_END="$(node -p "new Date().toISOString()")"

# The keys are no longer needed by anything.
K_ANTHROPIC=''; K_OPENAI=''; unset K_ANTHROPIC K_OPENAI
echo "Run finished (exit code $RUN_EXIT). Your keys have been cleared from this program."
[ "$RUN_EXIT" -eq 0 ] || stop "the run did not complete. Send Bob the file hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt (it holds no key)."

# ── Step E · blinding, on this computer ──────────────────────────────────────
say "Step E: blinding the questions"
( cd "$EVAL" && node kit.mjs blind "$PRIVAT/runs" "$PRIVAT/out" ) > "$PRIVAT/blind-log.txt" 2>&1 || stop "blinding failed (see the blind log)."
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
  const lines = [`mode: ${process.argv[2]}`, `run window (this command): ${process.argv[3]} to ${process.argv[4]}`,
    `ledger first request: ${first}`, `ledger last settlement: ${last}`, `sealed map sha256: ${process.argv[5]}`];
  for (const [k, v] of Object.entries(by)) lines.push(`${k}: ${v.attempts} attempts, US$${v.cost.toFixed(6)}, ${JSON.stringify(v.status)}`);
  console.log(lines.join("\n"));
' "$PRIVAT/runs/ledger.json" "$MODE" "$T_START" "$T_END" "$MAP_SHA" | tee "$HASIL/untuk-bob/ringkasan.txt"

# Before anything leaves this Mac (Sharon's sheet, points 4 and 5): nothing key-like, and the sealed map in none of them.
if grep -rIlE 'sk-(ant-|proj-)?[A-Za-z0-9_-]{16,}' "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" >/dev/null 2>&1; then
  stop "something that looks like a key is in a folder to send. Send nothing; tell Bob."; fi
if find "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" -name 'map.json' | grep -q .; then
  stop "the sealed map is in a folder to send. Send nothing; tell Bob."; fi
echo "Checked: no key-like text and no sealed map in the folders to send."
( cd "$HASIL" && zip -qr untuk-sharon.zip untuk-sharon && zip -qr untuk-juri.zip untuk-juri && zip -qr untuk-bob.zip untuk-bob )

say "Done"
echo "In the folder hasil:"
echo "  untuk-bob.zip     -> send to Bob (costs, times, the sealed map's fingerprint; no questions, no key)"
echo "  untuk-sharon.zip  -> send to Sharon via Bob (questions and options only; it names no provider)"
echo "  untuk-juri.zip    -> keep until Bob sends you the scoring guide; then give it to the three judges"
echo "  PRIVAT-simpan-jangan-dikirim  -> KEEP SAFE, SEND TO NO ONE. It holds the raw answers and the map of which"
echo "                                   provider wrote which question. Bob asks for it only after all scoring is final."
echo ""
echo "Next: revoke both keys in the two consoles (instructions, step 7)."
