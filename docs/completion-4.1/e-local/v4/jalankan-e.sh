#!/bin/zsh
# PINTAR E · the local evaluation run, v4: OpenAI (Ruling 50 (7)), streamed, on the owner's Mac; then both providers'
# questions blinded together (Ruling 51).
# Run it with:  zsh jalankan-e.sh
# Kept from v3 (Sharon's reviews 1ad0927e, b3edc995): the input bound; max_output 48,000; streaming with only completed
# streams counted; incomplete answers kept in PRIVAT only; the P-2 refusal beside a practice run; the key handling.
# v4 changes:
#   - one provider, OpenAI, so one key; the key check asks OpenAI only;
#   - the caps: OpenAI US$5.00 (its balance), total US$9.51 (US$10 less the US$0.48 Anthropic has cost);
#   - it refuses to start unless BOTH earlier folders are present and unchanged: the void run 1 (../pintar-e-local) and
#     Anthropic's run 2 (../pintar-e-local-v3), whose two answer files must still match their SHA-256 in its ledger;
#   - after a completed run, Anthropic's sealed answers and OpenAI's new ones are blinded together, with the frozen
#     kit.mjs blind, on this Mac. This is the first time either provider's questions are blinded (Ruling 51).
#
#   zsh jalankan-e.sh              the real procedure. It makes paid calls ONLY after you type RUN.
#   zsh jalankan-e.sh --latihan    the owner's practice run on the Mac, at no cost and with no key: the dummy text
#                                  sk-proj-latihan at the key prompt, the key check answered by latihan-mock.mjs on
#                                  127.0.0.1, the offline dry run in place of the paid run, and the blinding done on
#                                  mock answers for BOTH providers. It never reads Anthropic's real answers (it checks
#                                  only their fingerprints). Results go to hasil-latihan.
#   zsh jalankan-e.sh --rehearse   Bob's offline rehearsal, the same as --latihan but with the key check pointed at
#                                  the rehearsal's own mock. It never contacts a provider.
#
# The key: typed (or pasted) at a hidden prompt into this script's own memory. It reaches only the two commands
# that need it (the key check and the run), through their environment, never through a command argument, a file,
# the shell history or an exported variable. After the final scan it is cleared, and an exit trap clears it on any
# exit. Written for zsh (the macOS default) and bash alike.
# (K_ANTHROPIC stays only so that the clearing code is the reviewed one; v4 never asks for it or passes it.)
#
# Accepted residual risk (Sharon R9): while the run is going, another program running as you on this Mac could read
# the runner's environment. Close programs you don't need before starting.

set -euo pipefail
set +x
ulimit -c 0
umask 077

MODE=live
if [ "${1:-}" = "--rehearse" ]; then MODE=rehearse; fi
if [ "${1:-}" = "--latihan" ]; then MODE=latihan; fi
MOCK_PID=''
if [ "$MODE" = live ]; then unset E_REHEARSE E_REHEARSE_ANTHROPIC_BASE E_REHEARSE_OPENAI_BASE 2>/dev/null || true; fi

K_ANTHROPIC=''; K_OPENAI=''
clear_keys() { K_ANTHROPIC=''; K_OPENAI=''; unset K_ANTHROPIC K_OPENAI 2>/dev/null || true; }
on_exit() { clear_keys; if [ -n "$MOCK_PID" ]; then kill "$MOCK_PID" 2>/dev/null || true; fi; }
trap on_exit EXIT

cd "$(dirname "$0")"
ROOT="$(pwd)"
EVAL="$ROOT/docs/completion-4.1/c3-eval"
PACK_SHA=ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4
MAX_OUT=48000
CAPS=(--providers openai --cap-provider 5 --cap-total 9.51 --max-output 48000)
HASIL="$ROOT/hasil"
if [ "$MODE" = latihan ]; then HASIL="$ROOT/hasil-latihan"; fi
PRIVAT="$HASIL/PRIVAT-simpan-jangan-dikirim"
V3RUNS="$ROOT/../pintar-e-local-v3/hasil/PRIVAT-simpan-jangan-dikirim/runs"

judul()    { printf '\n== %s\n' "$1"; }
berhenti() { printf '\nSTOPPED: %s\nNothing further was done.\n' "$1"; clear_keys; exit 1; }
sha()      { if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$@"; else sha256sum "$@"; fi; }

# Sharon P-2: the real run never starts beside a practice run. No practice stand-in may be listening, no practice run
# may be in progress, and no rehearsal or practice setting may be left in this program's environment.
if [ "$MODE" = live ]; then
  if pgrep -f 'latihan-mock[.]mjs' >/dev/null 2>&1 || pgrep -f 'jalankan-e[.]sh --latihan' >/dev/null 2>&1; then
    printf '\nSTOPPED: a practice run (--latihan) or its stand-in is still running. Close that Terminal window first.\nNothing further was done.\n'; exit 1; fi
  LEFT="$(env | grep -c '^E_REHEARSE' || true)"
  [ "$LEFT" = 0 ] || { printf '\nSTOPPED: practice or rehearsal settings are still set (%s). Open a new Terminal window.\nNothing further was done.\n' "$LEFT"; exit 1; }
  echo "Real run: no practice run, stand-in or practice setting present."
fi

# ── Step A · checks, all offline ─────────────────────────────────────────────
judul "Step A: checking this computer and the package (offline)"
command -v node >/dev/null 2>&1 || berhenti "Node.js is not installed. Install Node 22 (see the instructions, step 1)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || berhenti "Node $NODE_MAJOR is too old. Install Node 22 or newer."
echo "Node $(node --version): OK"
if command -v shasum >/dev/null 2>&1; then shasum -a 256 -c -s SHA256SUMS || berhenti "the package does not match its checksums. Download it again."
else sha256sum -c --quiet SHA256SUMS || berhenti "the package does not match its checksums. Download it again."; fi
echo "Package checksums: OK"
[ "$(cat SOURCE-COMMIT)" = "1041447112b5d4a93aebfdc381c67cd6de98fc88" ] || berhenti "the package is not from the v4 (OpenAI streaming) runner commit."
echo "Package built from the v4 (OpenAI streaming) runner commit $(cat SOURCE-COMMIT)"
VOID="$ROOT/../pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs/ledger.json"
[ -f "$VOID" ] || berhenti "the first (void) run's folder was not found next to this one (../pintar-e-local/hasil). Keep it in Downloads, unchanged."
node -e 'const l=require(process.argv[1]); const e=l.entries; if (e.length!==1 || e[0].provider!=="anthropic" || e[0].status!=="overrun" || e[0].cost_usd!=="0.129986") process.exit(1)' "$VOID" \
  || berhenti "the first (void) run's ledger is not the one recorded (one Anthropic attempt, US\$0.129986). Tell Bob."
VOID_SHA="$(sha "$VOID" | cut -d' ' -f1)"
echo "Void run 1 found and unchanged: one Anthropic attempt, US\$0.129986 (ledger $VOID_SHA)"
# Anthropic's run 2: read for its fingerprints only. Its answer files are hashed, never shown or copied in a practice run.
[ -f "$V3RUNS/ledger.json" ] || berhenti "Anthropic's run 2 folder was not found next to this one (../pintar-e-local-v3/hasil). Keep it in Downloads, unchanged."
node -e '
  const { createHash } = require("node:crypto"); const { readFileSync } = require("node:fs"); const { join } = require("node:path");
  const dir = process.argv[1]; const l = JSON.parse(readFileSync(join(dir, "ledger.json"), "utf8")); const e = l.entries;
  const want = { 1: ["req_011Ch9PeLYw4LJjgUQn5GrUo", "0.193536"], 2: ["req_011Ch9PoBLnrwRi6dP8NjrJN", "0.158732"] };
  if (e.length !== 2) process.exit(1);
  for (const b of [1, 2]) {
    const x = e.find((y) => y.chapter === b);
    if (!x || x.provider !== "anthropic" || x.status !== "ok" || x.attempt !== 1 || x.request_id !== want[b][0] || x.cost_usd !== want[b][1]) process.exit(1);
    const h = createHash("sha256").update(readFileSync(join(dir, "anthropic", `bab${b}.json`))).digest("hex");
    if (h !== x.response_sha256) process.exit(1);
  }
' "$V3RUNS" || berhenti "Anthropic's run 2 is not as recorded (two answers, US\$0.352268, each file matching its fingerprint). Do not continue; tell Bob."
V3_SHA="$(sha "$V3RUNS/ledger.json" | cut -d' ' -f1)"
echo "Anthropic's run 2 found and unchanged: two sealed answers, each matching its fingerprint (ledger $V3_SHA)"
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

# ── Step B · the key, at a hidden prompt ─────────────────────────────────────
judul "Step B: your OpenAI key (nothing you type or paste will show)"
if [ "$MODE" = latihan ]; then echo "PRACTICE RUN: do not paste a real key. Type  sk-proj-latihan  instead, then press Return."; fi
printf 'Paste the OPENAI key (evaluation project), then press Return: '
IFS= read -rs K_OPENAI; echo
if command -v pbcopy >/dev/null 2>&1; then printf '' | pbcopy; echo "Clipboard cleared."; fi
[ -n "$K_OPENAI" ] || berhenti "the key was empty."
case "$K_OPENAI" in sk-ant-*) berhenti "this looks like an Anthropic key. This run needs the OpenAI key.";; sk-*) ;; *) berhenti "this does not look like an OpenAI key (it should start sk-).";; esac
if [ "$MODE" = latihan ] && [ "$K_OPENAI" != "sk-proj-latihan" ]; then
  berhenti "this is the practice run: type sk-proj-latihan at the prompt, never a real key."; fi
echo "Key received (not shown, not saved)."

# ── Step C · the key check, at no cost ───────────────────────────────────────
judul "Step C: checking the key at no cost (no tokens are used)"
if [ "$MODE" = latihan ]; then
  rm -f "$HASIL/latihan/mock-port"
  node "$ROOT/latihan-mock.mjs" "$HASIL/latihan/mock-port" & MOCK_PID=$!
  for _ in 1 2 3 4 5 6 7 8 9 10; do [ -s "$HASIL/latihan/mock-port" ] && break; sleep 0.5; done
  [ -s "$HASIL/latihan/mock-port" ] || berhenti "the practice stand-in did not start."
  export E_REHEARSE_OPENAI_BASE="http://127.0.0.1:$(cat "$HASIL/latihan/mock-port")"
fi
( if [ "$MODE" != live ]; then export E_REHEARSE=1; fi
  OPENAI_API_KEY="$K_OPENAI" node "$ROOT/periksa-kunci.mjs" openai ) \
  | tee "$HASIL/latihan/key-check.txt" || berhenti "the key or the model was not confirmed. Nothing was spent."

# ── Step D · your go ─────────────────────────────────────────────────────────
judul "Step D: the paid run"
if [ "$MODE" = latihan ]; then echo "PRACTICE RUN: typing RUN starts the offline practice run. No provider is called and nothing is spent."; fi
echo "Ready. The run calls OpenAI only: at most 6 calls (normally 2), each streamed and allowed up to $MAX_OUT output tokens, with these limits:"
echo "  - this program stops before any call that could take OpenAI past US\$5.00, or the evaluation past US\$9.51"
echo "    (US\$10 less the US\$0.48 Anthropic has cost);"
echo "  - your OpenAI balance is US\$5, with auto-reload off;"
echo "  - the expected cost is about US\$1.04, and the worst case, with every retry, is US\$3.13."
echo "  - rules: the frozen decision pack ${PACK_SHA:0:8}; prices: the pinned US\$2 / US\$10 per million tokens."
printf 'Type RUN in capital letters to make the paid calls now. Anything else stops without spending: '
IFS= read -r GO
[ "$GO" = "RUN" ] || berhenti "you did not type RUN."

T_START="$(node -p 'new Date().toISOString()')"
set +e
if [ "$MODE" = live ]; then
  ( cd "$EVAL" && OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --live "${CAPS[@]}" --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
else
  ( cd "$EVAL" && OPENAI_API_KEY="$K_OPENAI" \
      node runner.mjs --dry-run --real-prices "${CAPS[@]}" --pack-sha "$PACK_SHA" --out "$PRIVAT/runs" ) \
      > "$PRIVAT/run-log.txt" 2>&1
fi
RUN_EXIT=$?
set -e
T_END="$(node -p 'new Date().toISOString()')"
echo "Run finished (exit code $RUN_EXIT). No program needs your key any more."
[ "$RUN_EXIT" -eq 0 ] || berhenti "the run did not complete. Send Bob the file hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt (it holds no key). Nothing was blinded."

# ── Step E · both providers blinded together, on this Mac (Ruling 51) ────────
judul "Step E: blinding both providers' questions together"
GAB="$PRIVAT/gabungan"
mkdir -p "$GAB"
if [ "$MODE" = live ]; then
  cp -R "$V3RUNS/anthropic" "$GAB/anthropic"
else
  # practice and rehearsal: mock answers for Anthropic too, so that the real sealed answers are never read
  ( cd "$EVAL" && node runner.mjs --dry-run --real-prices --providers anthropic --cap-provider 4.87 --cap-total 9.87 --max-output 48000 \
      --pack-sha "$PACK_SHA" --out "$PRIVAT/latihan-anthropic" ) > "$PRIVAT/latihan-anthropic.txt" 2>&1 || berhenti "the practice Anthropic answers could not be made."
  cp -R "$PRIVAT/latihan-anthropic/anthropic" "$GAB/anthropic"
fi
cp -R "$PRIVAT/runs/openai" "$GAB/openai"
( cd "$EVAL" && node kit.mjs blind "$GAB" "$PRIVAT/out" ) > "$PRIVAT/blind-log.txt" 2>&1 || berhenti "blinding failed (see the blind log)."
MAP_SHA="$(sha "$PRIVAT/out/SEALED/map.json" | cut -d' ' -f1)"
echo "Blinded: both providers' questions, together, with the frozen kit."

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
  const lines = [`void run 1 ledger sha256: ${process.argv[6]}`, `anthropic run 2 ledger sha256: ${process.argv[7]}`, `mode: ${process.argv[2]}`,
    `run window (this command): ${process.argv[3]} to ${process.argv[4]}`, `ledger first request: ${first}`, `ledger last settlement: ${last}`,
    `sealed map sha256: ${process.argv[5]}`, `blinded: anthropic (${process.argv[2] === "live" ? "run 2, sealed" : "practice mock"}) and openai, together`];
  for (const [k, v] of Object.entries(by)) lines.push(`${k}: ${v.attempts} attempts, US$${v.cost.toFixed(6)}, ${JSON.stringify(v.status)}`);
  console.log(lines.join("\n"));
' "$PRIVAT/runs/ledger.json" "$MODE" "$T_START" "$T_END" "$MAP_SHA" "$VOID_SHA" "$V3_SHA" > "$HASIL/untuk-bob/ringkasan.txt"
cat "$HASIL/untuk-bob/ringkasan.txt"

# Before anything leaves this Mac (Sharon R3, and her sheet points 4 and 5):
# 1. the exact key value, given to grep through a file descriptor (never argv), in every result file;
set +e
grep -rqF -f <(printf '%s\n' "$K_OPENAI") "$HASIL"
SCAN=$?
set -e
[ "$SCAN" -eq 1 ] || berhenti "the key was found in a result file, or the scan failed (code $SCAN). Send nothing; tell Bob."
clear_keys
echo "Checked: the key appears in no result file. It has been cleared from this program."
# 2. nothing key-like, no incomplete answer (Sharon P-1), and no sealed map, in the folders to send; untuk-bob holds
#    only the ledger and the two summaries.
if find "$HASIL"/untuk-* -path '*incomplete*' 2>/dev/null | grep -q .; then
  berhenti "an incomplete answer is in a folder to send. Send nothing; tell Bob."; fi
if grep -rIlE 'sk-(ant-|proj-)?[A-Za-z0-9_-]{16,}' "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" >/dev/null 2>&1; then
  berhenti "something that looks like a key is in a folder to send. Send nothing; tell Bob."; fi
if find "$HASIL/untuk-sharon" "$HASIL/untuk-juri" "$HASIL/untuk-bob" -name 'map.json' | grep -q .; then
  berhenti "the sealed map is in a folder to send. Send nothing; tell Bob."; fi
[ "$(cd "$HASIL/untuk-bob" && ls | LC_ALL=C sort | tr '\n' ' ')" = "ledger.json ringkasan.txt summary.json " ] \
  || berhenti "the folder for Bob holds something other than the ledger and the two summaries. Send nothing; tell Bob."
echo "Checked: no key-like text, no incomplete answer and no sealed map in the folders to send."

( cd "$HASIL" && zip -qr untuk-sharon.zip untuk-sharon && zip -qr untuk-juri.zip untuk-juri && zip -qr untuk-bob.zip untuk-bob )

judul "Done"
if [ "$MODE" = latihan ]; then
  echo "PRACTICE RUN complete. Nothing was sent anywhere and nothing was spent."
  echo "The questions blinded here are mock ones for both providers; Anthropic's real answers were not read."
  echo "Send Bob ONLY hasil-latihan/untuk-bob.zip. Leave the folder hasil-latihan where it is; the real run writes to hasil."
  exit 0
fi
echo "In the folder hasil (see the instructions, step 6, for the order):"
echo "  untuk-bob.zip     -> 1st: send to Bob (costs, times, the sealed map's fingerprint; no questions, no key)"
echo "  untuk-sharon.zip  -> 2nd: send to Bob when he says the fingerprint is recorded (questions and options only)"
echo "  untuk-juri.zip    -> 3rd: keep until Bob says Sharon's check is recorded and sends the scoring guide"
echo "  PRIVAT-simpan-jangan-dikirim  -> KEEP SAFE, SEND TO NO ONE. It holds the raw answers of both providers and"
echo "                                   the map of which provider wrote which question. Bob asks for it only after"
echo "                                   all scoring is final."
echo ""
echo "Now: revoke the key in the OpenAI dashboard, note the time, and close this window (instructions, step 7)."
