#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# PRE-FLIGHT: the full local run before CI, with the machine kept apart from the code (ruling 83, P-2, P-4, P-5).
#
#   scripts/dev/preflight.sh [--langkah=lint,typecheck,build-identity,suite,plants,redcase] [--keluar=DIR]
#                            [--tanpa-reset] [-- <arguments for selftest/run.ts, e.g. --only=F07-*>]
#
# In order:
#   1. bersih.sh --hapus, then siap.sh. Nothing runs until siap prints READY; if it prints INFRA, the run is VOID
#      before minute one (disk, runtime, image, registry, stack or port, named).
#   2. Each step in turn. The suite and the plants are each preceded by a FORCED `supabase db reset --local`, so a db
#      suite never runs on a world another run has used (I-2). `--tanpa-reset` skips it, for replaying I-2 only.
#   3. While a step runs, a heartbeat every PREFLIGHT_DENYUT seconds (default 120): `siap.sh --denyut`, the runtime,
#      the database and the disk. The FIRST lost heartbeat stops the step at once and the run is VOID (I-1).
#
# Every step, and every row of the suite, is classed:
#   PASS   it passed
#   FAIL   it failed, and the machine was healthy: a finding about the code
#   INFRA  the machine failed: a lost heartbeat, or a failure whose output carries an infrastructure signal
#          (disk full, the runtime gone, a registry refusal, the database refusing connections, a missing facility).
#          The signal that proved it is recorded beside it.
# The run is GREEN (every step PASS), RED (a FAIL, and no INFRA), or VOID (any INFRA). A VOID run is never red or
# green evidence, and it is kept like any other run.
#
# Output (kept, never cleaned): DIR (default $HOME/pintar-preflight/<commit>-<UTC time>): SUMMARY.txt, ROWS.txt (the
# suite's rows with their class), HEARTBEAT.txt, and one log per step. The local stack's keys are redacted from them.
# Exit: 0 GREEN, 1 RED, 3 VOID.
# ---------------------------------------------------------------------------
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
ALL="lint,typecheck,build-identity,suite,plants,redcase"
STEPS="$ALL"; OUT=""; RESET=1; SUITE_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --langkah=*) STEPS="${1#*=}" ;;
    --keluar=*) OUT="${1#*=}" ;;
    --tanpa-reset) RESET=0 ;;
    --) shift; SUITE_ARGS=("$@"); break ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "preflight: unknown argument $1" >&2; exit 2 ;;
  esac
  shift
done
DENYUT="${PREFLIGHT_DENYUT:-120}"
SHA="$(git rev-parse HEAD)"
OUT="${OUT:-$HOME/pintar-preflight/${SHA:0:8}-$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$OUT"
SUM="$OUT/SUMMARY.txt"; HB="$OUT/HEARTBEAT.txt"
: > "$HB"
{ echo "commit $SHA"; echo "started $(date -u +%FT%TZ)"; echo "steps $STEPS"; echo "heartbeat every ${DENYUT}s"; } > "$SUM"

# The infrastructure signals: <pattern>|<cause>. A failure carrying one is the machine's, not the code's.
SIGNALS=(
  'No space left on device|disk'
  'ENOSPC|disk'
  'nospc|disk'
  'Check free disk space|disk'
  'Cannot connect to the Docker daemon|runtime'
  'docker.sock: connect|runtime'
  'toomanyrequests|registry'
  '429 Too Many Requests|registry'
  'connection to server at "127.0.0.1", port 54322 failed|database'
  'ECONNREFUSED 127.0.0.1:5432[0-9]|database'
  'the database system is (shutting down|starting up|in recovery mode)|database'
  'facility missing: (db|app|network|build|mail)|facility'
  'EADDRINUSE.*:3999|port'
)
signal_in() { # <file>: prints "<cause>: <the line>" for the first infrastructure signal in it
  local s pat cause line
  for s in "${SIGNALS[@]}"; do
    pat="${s%|*}"; cause="${s##*|}"
    line="$(grep -m1 -E -- "$pat" "$1" 2>/dev/null)" && { echo "$cause: $(echo "$line" | cut -c1-200)"; return 0; }
  done
  return 1
}
redact() { # the local stack's keys never stay in a kept file
  local f
  for f in "$OUT"/*; do
    [ -f "$f" ] || continue
    K1="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" K2="${SUPABASE_SERVICE_ROLE_KEY:-}" perl -pi -e \
      'for my $k (@ENV{qw(K1 K2)}) { next unless length($k) > 8; s/\Q$k\E/«key redacted»/g }' "$f"
  done
}
row() { echo "$1" | tee -a "$SUM"; }
VOID=0; FAILED=0

finish() {
  local verdict code
  if [ "$VOID" = 1 ]; then verdict="VOID"; code=3
  elif [ "$FAILED" = 1 ]; then verdict="RED"; code=1
  else verdict="GREEN"; code=0; fi
  { echo "finished $(date -u +%FT%TZ)"; echo "RUN $verdict"; } >> "$SUM"
  [ "$VOID" = 1 ] && echo "VOID, not a result: an INFRA row above says what the machine did. Fix that and repeat the run on the same commit." >> "$SUM"
  redact
  echo "preflight: RUN $verdict ($OUT)"
  exit "$code"
}

# ---- 1. cleanup and readiness ----------------------------------------------------------------------------------
bash scripts/dev/bersih.sh --hapus > "$OUT/bersih.log" 2>&1
row "== bersih: $(tail -1 "$OUT/bersih.log")"
bash scripts/dev/siap.sh > "$OUT/siap.log" 2>&1
GATE="$(tail -1 "$OUT/siap.log")"
row "== siap: $GATE"
if [ "$GATE" != READY ]; then
  row "INFRA  siap  ${GATE#INFRA }"
  VOID=1; finish
fi

# The stack's address and keys for the app; the values are never printed.
eval "$(npx --no-install supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY|DB_URL|PUBLISHABLE_KEY|SECRET_KEY)=' | sed 's/^/SB_/')"
export NEXT_PUBLIC_SUPABASE_URL="${SB_API_URL:-}" NEXT_PUBLIC_SUPABASE_ANON_KEY="${SB_ANON_KEY:-${SB_PUBLISHABLE_KEY:-}}"
export SUPABASE_SERVICE_ROLE_KEY="${SB_SERVICE_ROLE_KEY:-${SB_SECRET_KEY:-}}" SUPABASE_DB_URL="${SB_DB_URL:-}" DB_URL="${SB_DB_URL:-}"
# Synthetic, CI's own values (ci.yml, «Build against the local stack and run the whole manifest»): not secrets.
export NEXT_PUBLIC_APP_URL=http://127.0.0.1:3999 SELFTEST_APP_PORT=3999 PINTAR_BUILD_SHA="$SHA"
export CARD_PEPPER=synthetic-card-pepper-fable01-32plus CARD_EMAIL_DOMAIN=cards.synthetic.pintar.test
export CERT_SECRET_KEY_V1=synthetic-certificate-key-fable04-32plus
export PINTAR_SMTP_HOST=127.0.0.1 PINTAR_SMTP_PORT=54325 PINTAR_SMTP_USER=noreply@pintarselalu.test PINTAR_SMTP_PASSWORD=sink-accepts-any
[ -n "$SUPABASE_DB_URL" ] || { row "INFRA  siap  stack: supabase status gave no database URL"; VOID=1; finish; }

# ---- 2. the steps, each under the heartbeat --------------------------------------------------------------------
cmd_for() {
  case "$1" in
    lint) echo "npm run --silent lint" ;;
    typecheck) echo "npm run --silent typecheck" ;;
    build-identity) echo "npm run --silent selftest:build-identity" ;;
    suite) printf 'npx --no-install tsx selftest/run.ts --accept-justified-skips'; printf ' %q' "${SUITE_ARGS[@]}" ;;
    plants) echo "node scripts/dev/plants.mjs run --db-url=$SUPABASE_DB_URL" ;;
    redcase) echo "node scripts/dev/redcase-local.mjs --db-url=$SUPABASE_DB_URL" ;;
    *) return 1 ;;
  esac
}

heartbeat() { # prints the cause and returns 1 when the machine is lost
  local r; r="$(bash scripts/dev/siap.sh --denyut 2>&1 | tail -1)"
  echo "$(date -u +%TZ) $r" >> "$HB"
  [ "$r" = READY ] || { echo "${r#INFRA }"; return 1; }
}

run_step() { # <name>
  local name="$1" cmd log="$OUT/$1.log" pid rc lost="" t0 next
  cmd="$(cmd_for "$name")" || { row "== $name: unknown step"; FAILED=1; return; }
  echo "== $name" >> "$SUM"
  if [ "$RESET" = 1 ] && { [ "$name" = suite ] || [ "$name" = plants ]; }; then
    if ! timeout 900 npx --no-install supabase db reset --local > "$OUT/$name-reset.log" 2>&1; then
      local why hb
      why="$(signal_in "$OUT/$name-reset.log")" || { hb="$(heartbeat)" && why="the forced reset failed on a healthy machine (its log: $name-reset.log)" || why="$hb"; }
      row "INFRA  $name  forced reset failed: $why"; VOID=1; return
    fi
    echo "forced reset: done (supabase db reset --local)" >> "$SUM"
  fi
  t0=$(date +%s); next=$((t0 + DENYUT))
  setsid bash -c "$cmd" > "$log" 2>&1 < /dev/null &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    sleep 2
    if [ "$(date +%s)" -ge "$next" ]; then
      next=$(( $(date +%s) + DENYUT ))
      if ! lost="$(heartbeat)"; then
        kill -TERM -- "-$pid" 2>/dev/null; sleep 5; kill -KILL -- "-$pid" 2>/dev/null
        break
      fi
      lost=""
    fi
  done
  wait "$pid" 2>/dev/null; rc=$?
  if [ -n "$lost" ]; then
    row "INFRA  $name  heartbeat lost after $(( $(date +%s) - t0 ))s: $lost (step stopped)"; VOID=1; return
  fi
  local why hb rows=""
  [ "$name" = suite ] && rows="$(classify_rows "$log")"
  if [ "$rc" = 0 ]; then
    row "PASS   $name  rc=0 ($(( $(date +%s) - t0 ))s)$( [ "$name" = suite ] && echo "  $(grep -E '→ (GREEN|RED)$' "$log" | tail -1)")"
  elif ! hb="$(heartbeat)"; then
    row "INFRA  $name  rc=$rc: the machine was lost by the end of the step: $hb"; VOID=1
  elif [ "$name" = suite ] && [ -n "$rows" ]; then
    # the suite: its rows decide (a justified skip's text must not void a real failure)
    row "INFRA  $name  rc=$rc: $rows"; VOID=1
  elif [ "$name" != suite ] && why="$(signal_in "$log")"; then
    row "INFRA  $name  rc=$rc: $why"; VOID=1
  else
    row "FAIL   $name  rc=$rc: $(grep -E '→ RED$|^FAILED|failed|Error' "$log" | tail -1 | cut -c1-200)"; FAILED=1
  fi
  [ "$name" = suite ] && cat "$OUT/rows.sum" >> "$SUM"
}

classify_rows() { # the suite's rows, each with its class
  local log="$1" id st detail cls sig n_infra=0 n_fail=0
  : > "$OUT/ROWS.txt"
  awk '/^id +status +detail$/{on=1; next} on && /^[0-9]+ passed, /{exit} on && NF' "$log" > "$OUT/rows.raw"
  while IFS= read -r line; do
    id="${line:0:11}"; st="$(echo "${line:12:7}" | tr -d ' ')"; detail="${line:20}"
    case "$st" in
      PASS|SKIP\*) cls=PASS ;;
      *) printf '%s\n' "$detail" > "$OUT/.row"
         if sig="$(signal_in "$OUT/.row")"; then cls="INFRA ($sig)"; n_infra=$((n_infra + 1)); else cls=FAIL; n_fail=$((n_fail + 1)); fi ;;
    esac
    printf '%-11s %-6s %s\n' "$id" "$st" "$cls" >> "$OUT/ROWS.txt"
  done < "$OUT/rows.raw"
  rm -f "$OUT/.row" "$OUT/rows.raw"
  echo "rows: $(wc -l < "$OUT/ROWS.txt") classed; $n_fail FAIL, $n_infra INFRA (ROWS.txt)" > "$OUT/rows.sum"
  # prints the first INFRA row's signal (the caller voids the run on it); nothing when no row is INFRA
  [ "$n_infra" -gt 0 ] && grep -m1 ' INFRA (' "$OUT/ROWS.txt" | sed -E 's/^([^ ]+) +[^ ]+ +INFRA \((.*)\)$/\1 is INFRA (\2), and '"$n_infra"' row(s) in all/'
  return 0
}

IFS=, read -r -a LIST <<< "$STEPS"
for s in "${LIST[@]}"; do
  if [ "$VOID" = 1 ]; then row "NOT RUN $s  (the run is VOID)"; continue; fi
  run_step "$s"
done
finish
