#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# PRE-FLIGHT: the full local run before CI, with the machine kept apart from the code (ruling 83, P-2, P-4, P-5).
#
#   scripts/dev/preflight.sh [--langkah=lint,typecheck,build-identity,suite,plants,redcase] [--keluar=DIR]
#                            [--tanpa-reset] [--ukur] [-- <arguments for selftest/run.ts, e.g. --only=F07-*>]
#
# --ukur prints only the size check (L-2) and runs nothing.
#
# In order:
#   1. bersih.sh --hapus, then siap.sh. Nothing runs until siap prints READY; if it prints INFRA, the run is VOID
#      before minute one (disk, runtime, image, registry, stack or port, named).
#   2. Each step in turn. The suite and the plants are each preceded by a FORCED `supabase db reset --local`, so a db
#      suite never runs on a world another run has used (I-2). `--tanpa-reset` skips it, for replaying I-2 only: those
#      steps carry an INFRA (world) row, and under S-1 such a run is never GREEN (RED if a row fails, else VOID), its FAIL rows not attributed to the code until a reset run reproduces them.
#   3. While a step runs, a heartbeat every PREFLIGHT_DENYUT seconds (default 120): `siap.sh --denyut`, the runtime,
#      the database and the disk. The FIRST lost heartbeat stops the step at once and the run is VOID (I-1).
#
# Every step, and every row of the suite, is classed:
#   PASS   it passed
#   FAIL   it failed, and the machine was healthy: a finding about the code
#   INFRA  the machine failed: a lost heartbeat, a heartbeat not READY at the step's end, or a signal code cannot
#          produce (the runtime gone, a registry refusal). A signal code CAN produce (a missing facility, a port in
#          use, a refused database, a full disk) is INFRA only on an unhealthy machine, and FAIL on a healthy one.
# The run is RED when any row is FAIL (its INFRA rows listed beside it), VOID when a row is INFRA and none is FAIL,
# and GREEN when every step passed (scripts/dev/kelas.sh, after Sharon's S-1). A VOID run is never red or green
# evidence, and it is kept like any other run. After an INFRA row the remaining steps are NOT RUN.
#
# Output (kept, never cleaned): DIR (default $HOME/pintar-preflight/<commit>-<UTC time>): SUMMARY.txt, ROWS.txt (the
# suite's rows with their class), HEARTBEAT.txt, and one log per step. The local stack's keys are redacted from them.
# Exit: 0 GREEN, 1 RED, 3 VOID.
# ---------------------------------------------------------------------------
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"
ALL="lint,typecheck,build-identity,suite,plants,redcase"
STEPS="$ALL"; OUT=""; RESET=1; UKUR=0; SUITE_ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --langkah=*) STEPS="${1#*=}" ;;
    --keluar=*) OUT="${1#*=}" ;;
    --tanpa-reset) RESET=0 ;;
    --ukur) UKUR=1 ;;
    --) shift; SUITE_ARGS=("$@"); break ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "preflight: unknown argument $1" >&2; exit 2 ;;
  esac
  shift
done
DENYUT="${PREFLIGHT_DENYUT:-120}"
SHA="$(git rev-parse HEAD)"
OUT="${OUT:-$HOME/pintar-preflight/${SHA:0:8}-$(date -u +%Y%m%dT%H%M%SZ)}"
[ "$UKUR" = 1 ] && OUT="$(mktemp -d)"   # --ukur writes nothing it keeps, and removes only this folder
mkdir -p "$OUT"
SUM="$OUT/SUMMARY.txt"; HB="$OUT/HEARTBEAT.txt"
: > "$HB"
{ echo "commit $SHA"; echo "started $(date -u +%FT%TZ)"; echo "steps $STEPS"; echo "heartbeat every ${DENYUT}s"; } > "$SUM"

# How a failure is classed (S-1: RED first; INFRA only on an unhealthy machine or a cause code cannot produce)
source "$REPO/scripts/dev/kelas.sh"
source "$REPO/scripts/dev/tapis.sh"
redact() { # no kept file holds a key: the stack's own values, and every key shape tapis.sh knows (S-2)
  local f
  for f in "$OUT"/* "${SIAP_LOG_DIR:-${TMPDIR:-/tmp}/pintar-siap-log}"/*; do
    [ -f "$f" ] && [ ! -L "$f" ] || continue
    K1="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" K2="${SUPABASE_SERVICE_ROLE_KEY:-}" perl -pi -e \
      'for my $k (@ENV{qw(K1 K2)}) { next unless length($k) > 8; s/\Q$k\E/«key redacted»/g }' "$f"
    tapis_berkas "$f"
  done
}
row() { echo "$1" | tee -a "$SUM"; }
VOID=0; FAILED=0

finish() {
  local verdict code
  verdict="$(putusan "$FAILED" "$VOID")"
  case "$verdict" in RED) code=1 ;; VOID) code=3 ;; *) code=0 ;; esac
  { echo "finished $(date -u +%FT%TZ)"; echo "RUN $verdict"; } >> "$SUM"
  if [ "$verdict" = RED ] && [ "$RESET" = 0 ]; then
    echo "RED on an UNRESET world (--tanpa-reset): its FAIL rows are NOT attributed to the code until a run with the forced reset reproduces them." >> "$SUM"
  elif [ "$verdict" = RED ] && [ "$VOID" = 1 ]; then
    echo "RED, with INFRA beside it: the FAIL rows above are findings about the code; the INFRA rows listed with them say what the machine also did." >> "$SUM"
  fi
  [ "$verdict" = VOID ] && echo "VOID, not a result: an INFRA row above says what the machine did, and no row failed. Fix that and repeat the run on the same commit." >> "$SUM"
  rm -f "$JEJAK_DIR/berjalan"
  redact
  echo "preflight: RUN $verdict ($OUT)"
  exit "$code"
}

JEJAK_DIR="${SIAP_JEJAK_DIR:-$HOME/pintar-preflight}"; mkdir -p "$JEJAK_DIR"
# ---- 0b. will this machine hold the run? (ruling 86, L-2: a warning, never a block) ------------------------------
# The estimate: each step's last measured length in the kept runs (a PASS or FAIL row's «(Ns)»), else a default.
# The machine's lifetime: from the trace, each earlier boot's last uptime (how long it stayed up).
perkiraan() {
  local total=0 st d
  for st in ${STEPS//,/ }; do
    d="$(grep -hE "^(PASS|FAIL) +$st +rc=[0-9]+ \(([0-9]+)s\)" "$JEJAK_DIR"/*/SUMMARY.txt 2>/dev/null | sed -E 's/.*\(([0-9]+)s\).*/\1/' | tail -1)"
    if [ -z "$d" ]; then case "$st" in suite) d=1500 ;; plants) d=1800 ;; redcase) d=2400 ;; *) d=120 ;; esac; fi
    total=$((total + d))
  done
  echo "$total"
}
umur_mesin() { # prints "<median seconds> <boots>" over the earlier boots in the trace, or nothing
  local cur; cur="$(cat "${SIAP_BOOT_FILE:-/proc/sys/kernel/random/boot_id}" 2>/dev/null)"
  [ -s "$JEJAK_DIR/jejak-mesin.log" ] || return 0
  local v n
  v="$(awk -v cur="$cur" '{ b=""; u=""; for (i=1;i<=NF;i++) { if ($i ~ /^boot=/) b=substr($i,6); if ($i ~ /^uptime=/) u=substr($i,8) }
       if (b != "" && b != cur && u ~ /^[0-9]+$/ && u+0 > max[b]+0) max[b]=u }
       END { for (b in max) print max[b] }' "$JEJAK_DIR/jejak-mesin.log" | sort -n)"
  [ -n "$v" ] || return 0
  n="$(wc -l <<< "$v")"
  echo "$(sed -n "$(( (n + 1) / 2 ))p" <<< "$v") $n"
}
EST="$(perkiraan)"; LIFE="$(umur_mesin)"
if [ -n "$LIFE" ]; then
  read -r MED BOOTS <<< "$LIFE"
  if [ "$EST" -gt "$MED" ]; then
    row "WARN   size  keep the session active for the whole run (wait on it within the turn: an idle session may be suspended or reclaimed, L-5), or use CI, the full run's stable route (L-3: push, or dispatch ci.yml). The run is estimated at $((EST / 60)) min, but this machine stayed up a median $((MED / 60)) min over its last $BOOTS boot(s) (the trace). Starting anyway."
  else
    echo "size: estimated $((EST / 60)) min, within this machine's median uptime of $((MED / 60)) min ($BOOTS boot(s))" >> "$SUM"
  fi
else
  echo "size: estimated $((EST / 60)) min; no earlier boot in the trace to compare with" >> "$SUM"
fi
[ "$UKUR" = 1 ] && { tail -1 "$SUM"; rm -rf "$OUT"; exit 0; }

# ---- 0. a run in progress is marked on disk, so a restart under it is found and named by the next gate (L-1) --------
export SIAP_RUN="$OUT"

# ---- 1. cleanup and readiness ----------------------------------------------------------------------------------
bash scripts/dev/bersih.sh --hapus > "$OUT/bersih.log" 2>&1
row "== bersih: $(tail -1 "$OUT/bersih.log")"
bash scripts/dev/siap.sh > "$OUT/siap.log" 2>&1
GATE="$(tail -1 "$OUT/siap.log")"
grep -E 'ended by a REBOOT|restarted since the last check' "$OUT/siap.log" | sed 's/^siap: /== previous: /' | tee -a "$SUM"
echo "$OUT" > "$JEJAK_DIR/berjalan"
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
      local hb k sehat=1
      hb="$(heartbeat)" || sehat=0
      k="$(kelas_teks "$OUT/$name-reset.log" "$sehat")"
      if [ "$sehat" = 0 ]; then row "INFRA  $name  forced reset failed, the machine not healthy: $hb"; VOID=1
      elif [ "${k%% *}" = INFRA ]; then row "INFRA  $name  forced reset failed: ${k#INFRA }"; VOID=1
      else row "FAIL   $name  forced reset failed on a healthy machine (a migration or seed?): ${k#FAIL} (its log: $name-reset.log)"; FAILED=1; fi
      return
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
  # the machine's health through the step: every beat READY (a lost one stopped it above) and READY at its end
  local hb sehat=1 k
  hb="$(heartbeat)" || sehat=0
  if [ "$RESET" = 0 ] && { [ "$name" = suite ] || [ "$name" = plants ]; }; then
    # I-2: a db step on a world that was not reset is not clean evidence; listed as INFRA, and its FAIL rows still count
    row "INFRA  $name  world: the database was not reset before this step (--tanpa-reset)"; VOID=1
  fi
  if [ "$name" = suite ]; then
    kelas_baris "$log" "$sehat" "$OUT"
    if [ "$N_FAIL" -gt 0 ]; then
      row "FAIL   $name  rc=$rc: $N_FAIL FAIL row(s), first $FIRST_FAIL$([ "$N_INFRA" -gt 0 ] && echo "; beside them $N_INFRA INFRA row(s), first $FIRST_INFRA")"
      FAILED=1; [ "$N_INFRA" -gt 0 ] && VOID=1
    elif [ "$N_INFRA" -gt 0 ]; then
      row "INFRA  $name  rc=$rc: $N_INFRA INFRA row(s), first $FIRST_INFRA"; VOID=1
    elif [ "$rc" = 0 ]; then
      row "PASS   $name  rc=0 ($(( $(date +%s) - t0 ))s)  $(grep -E '→ (GREEN|RED)$' "$log" | tail -1)"
    elif [ "$sehat" = 0 ]; then
      row "INFRA  $name  rc=$rc: the machine was lost by the end of the step: $hb"; VOID=1
    else
      k="$(tail -40 "$log" > "$OUT/.tail"; kelas_teks "$OUT/.tail" 1)"; rm -f "$OUT/.tail"
      if [ "${k%% *}" = INFRA ]; then row "INFRA  $name  rc=$rc: ${k#INFRA }"; VOID=1
      else row "FAIL   $name  rc=$rc: $(grep -E '→ RED$|^CONTRACT|crashed' "$log" | tail -1 | cut -c1-200) ${k#FAIL}"; FAILED=1; fi
    fi
    cat "$OUT/rows.sum" >> "$SUM"
  elif [ "$rc" = 0 ]; then
    row "PASS   $name  rc=0 ($(( $(date +%s) - t0 ))s)"
  elif [ "$sehat" = 0 ]; then
    row "INFRA  $name  rc=$rc: the machine was lost by the end of the step: $hb"; VOID=1
  else
    k="$(kelas_teks "$log" 1)"
    if [ "${k%% *}" = INFRA ]; then row "INFRA  $name  rc=$rc: ${k#INFRA }"; VOID=1
    else row "FAIL   $name  rc=$rc: $(grep -E '→ RED$|^FAILED|failed|Error' "$log" | tail -1 | cut -c1-200) ${k#FAIL}"; FAILED=1; fi
  fi
}


IFS=, read -r -a LIST <<< "$STEPS"
for s in "${LIST[@]}"; do
  if [ "$VOID" = 1 ]; then row "NOT RUN $s  (an INFRA row above: the machine is not to be trusted for the rest)"; continue; fi
  run_step "$s"
done
finish
