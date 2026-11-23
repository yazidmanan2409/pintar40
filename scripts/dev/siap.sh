#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# SIAP: the readiness gate (ruling 83, P-1 and P-3; P-4's heartbeat).
#
# An expensive run starts only after this prints READY. Otherwise it prints ONE named infrastructure cause and exits 3,
# so a machine problem is reported as the machine's before a single test runs:
#
#   INFRA disk     free space below the minimum (SIAP_DISK_MIN_GB, default 10) on the checkout or the temp folder
#   INFRA runtime  the container runtime (dockerd/containerd) is dead and did not come back
#   INFRA image    an image in scripts/dev/images.lock is missing or has another digest, and could not be pulled
#   INFRA registry the registry refused the pull (rate limit, 429), after retries with backoff
#   INFRA stack    the stack would not start, or the database, Auth or Mailpit did not become healthy
#   INFRA port     the app port (default 3999) is held, by something that is not a leaked app server
#
#   scripts/dev/siap.sh                 the full gate, recovering what it can (restart the runtime, pull images,
#                                       start the stack and Mailpit, stop a leaked app server)
#   scripts/dev/siap.sh --tanpa-pulih   check only: report the first cause, change nothing
#   scripts/dev/siap.sh --denyut        the heartbeat during a run: disk, runtime, database. Never recovers
#                                       (a run whose machine failed under it is VOID, not repaired mid-way)
#
# Order: disk, runtime, images, stack, port. Each line it prints is `siap: <check> <ok|pulih|…>`; the last line is
# READY or INFRA. It never prints a key, a token or `supabase status` output.
#
# Scope (N-3): a single-user sandbox (the builder's or a session container). A leaked app server is stopped only when
# it belongs to the user running the gate; anything else on the port is named and left alone.
#
# Environment: SIAP_DISK_MIN_GB, SIAP_PORT (3999), SIAP_DB_URL (the local stack's), SIAP_LOG_DIR (where dockerd's log
# goes; default $TMPDIR/pintar-siap-log), SIAP_PULL_TRIES (4), SIAP_PULL_WAIT (5: seconds, tripled per retry),
# SIAP_HEALTH_WAIT (120 s).
# ---------------------------------------------------------------------------
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE=full
for a in "$@"; do
  case "$a" in
    --tanpa-pulih) MODE=check ;;
    --denyut) MODE=heartbeat ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "siap: unknown argument $a" >&2; exit 2 ;;
  esac
done

TMP="${TMPDIR:-/tmp}"
MIN_GB="${SIAP_DISK_MIN_GB:-10}"
PORT="${SIAP_PORT:-3999}"
DB_URL="${SIAP_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
LOCK="$REPO/scripts/dev/images.lock"
LOGDIR="${SIAP_LOG_DIR:-$TMP/pintar-siap-log}"
TRIES="${SIAP_PULL_TRIES:-4}"
WAIT0="${SIAP_PULL_WAIT:-5}"
HEALTH_WAIT="${SIAP_HEALTH_WAIT:-120}"
EXCLUDE="studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit"

source "$REPO/scripts/dev/tapis.sh"   # S-2: nothing this gate writes keeps a key
say() { echo "siap: $*"; }
RESULT=""
infra() { RESULT="INFRA $1: $2"; echo "$RESULT"; exit 3; }

# ---- the machine's trace (ruling 86, L-1) -------------------------------------------------------------------------
# Every gate and every heartbeat appends one line to a log ON DISK (not the temp folder), so it outlives a container
# restart: the boot, the uptime, the kernel's OOM kills since boot, the memory cgroup's peak and failure count, free
# memory and free disk, which run it belongs to, and how the check ended. After a restart the next gate reads the
# previous boot's last line and names the cause, instead of the run going quietly missing.
JEJAK_DIR="${SIAP_JEJAK_DIR:-$HOME/pintar-preflight}"
JEJAK="$JEJAK_DIR/jejak-mesin.log"
UPTIME_FILE="${SIAP_UPTIME_FILE:-/proc/uptime}"   # a proof may point this at a planted file (a simulated reboot)
BOOT_FILE="${SIAP_BOOT_FILE:-/proc/sys/kernel/random/boot_id}"
mesin() { # prints key=value fields describing the machine now
  local up boot oom peak fail cg avail disk
  up="$(cut -d' ' -f1 "$UPTIME_FILE" 2>/dev/null | cut -d. -f1)"; boot="$(cat "$BOOT_FILE" 2>/dev/null)"
  oom="$(awk '$1=="oom_kill"{print $2}' /proc/vmstat 2>/dev/null)"
  if [ -r /sys/fs/cgroup/memory.events ]; then                       # cgroup v2
    cg="$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory.events)"; peak="$(cat /sys/fs/cgroup/memory.peak 2>/dev/null)"
    fail="$(awk '$1=="max"{print $2}' /sys/fs/cgroup/memory.events)"
  else                                                                 # cgroup v1 (this container)
    cg="$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory/memory.oom_control 2>/dev/null)"
    peak="$(cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null)"; fail="$(cat /sys/fs/cgroup/memory/memory.failcnt 2>/dev/null)"
  fi
  avail="$(awk '$1=="MemAvailable:"{print $2*1024}' /proc/meminfo)"
  disk="$(df -B1 --output=avail "$REPO" 2>/dev/null | tail -1 | tr -d ' ')"
  echo "boot=${boot:-?} uptime=${up:-?} oom_kill=${oom:-?} cg_oom_kill=${cg:-?} mem_peak=${peak:-?} mem_failcnt=${fail:-?} mem_avail=${avail:-?} disk_free=${disk:-?}"
}
catat() { # appends this check's line; the result is read at exit
  mkdir -p "$JEJAK_DIR" 2>/dev/null || return 0
  echo "$(date -u +%FT%TZ) $(mesin) mode=$MODE run=${SIAP_RUN:--} result=\"${RESULT:-READY}\"" >> "$JEJAK" 2>/dev/null
}
trap catat EXIT
medan() { sed -nE "s/.*(^| )$1=([^ ]*).*/\2/p" <<< "$2"; }
cek_mulai_ulang() { # the previous boot: did a run end by a restart?
  [ -s "$JEJAK" ] || { say "trace: first entry ($JEJAK)"; return; }
  local last now boot0 up0 t0 boot1 up1 run0 oom0 when berjalan="$JEJAK_DIR/berjalan"
  last="$(tail -1 "$JEJAK")"; now="$(mesin)"
  boot0="$(medan boot "$last")"; up0="$(medan uptime "$last")"; run0="$(medan run "$last")"; oom0="$(medan oom_kill "$last")"; oom0="${oom0:-?}"
  t0="${last%% *}"; boot1="$(medan boot "$now")"; up1="$(medan uptime "$now")"
  if [ "$boot0" != "$boot1" ] || { [ "$up1" != "?" ] && [ "$up0" != "?" ] && [ "$up1" -lt "$up0" ]; }; then
    when="$(date -u -d "@$(( $(date +%s) - up1 ))" +%FT%TZ)"
    local cause="a REBOOT at $when, after uptime ${up0}s (the previous boot's last beat: $t0, oom_kill=${oom0})"
    if [ -f "$berjalan" ]; then
      local r; r="$(cat "$berjalan")"
      say "the previous run ended by $cause: run $r"
      if [ -f "$r/SUMMARY.txt" ] && ! grep -q '^RUN ' "$r/SUMMARY.txt"; then
        { echo "INFRA  run  ended by $cause"; echo "finished (by the reboot, recorded at the next gate $(date -u +%FT%TZ))"; echo "RUN VOID"
          echo "VOID, not a result: the machine restarted under the run. Find the cause (the trace: $JEJAK) before repeating it."; } >> "$r/SUMMARY.txt"
      fi
      rm -f "$berjalan"
    else
      say "the machine restarted since the last check: $cause (no run was in progress)"
    fi
  else
    say "trace: same boot as the last check (uptime ${up1}s)"
  fi
}

gib() { awk -v b="$1" 'BEGIN { printf "%.1fG", b / 1073741824 }'; }
# ---- disk -------------------------------------------------------------------------------------------------------
cek_disk() {
  local min=$((MIN_GB * 1024 * 1024 * 1024)) p free worst="" worstfree=""
  for p in "$REPO" "$TMP"; do
    free="$(df -B1 --output=avail "$p" 2>/dev/null | tail -1 | tr -d ' ')"
    [ -n "$free" ] || infra disk "cannot read free space on $p"
    if [ -z "$worstfree" ] || [ "$free" -lt "$worstfree" ]; then worst="$p"; worstfree="$free"; fi
  done
  if [ "$worstfree" -lt "$min" ]; then
    infra disk "$(gib "$worstfree") free on $worst, below the minimum of ${MIN_GB}G (scripts/dev/bersih.sh lists what the harness left behind)"
  fi
  say "disk ok ($(gib "$worstfree") free, minimum ${MIN_GB}G)"
}

# ---- runtime ----------------------------------------------------------------------------------------------------
runtime_hidup() { timeout 10 docker info >/dev/null 2>&1; }
# Second Eye's blocker (I-1, a REAL reboot): the previous boot leaves /run/containerd/containerd.sock on disk with
# nothing behind it; dockerd tries it, is refused, and exits. So before starting the runtime, each runtime socket and
# pid file is checked for life, and removed only when nothing is behind it:
#   a socket is live if the kernel lists it as bound (/proc/net/unix) or a connection to it succeeds;
#   a pid file is live if its pid is a running process.
# A live one is never removed.
soket_hidup() { # <path>
  awk -v p="$1" '$NF == p { f = 1 } END { exit !f }' /proc/net/unix 2>/dev/null && return 0
  timeout 3 python3 -c 'import socket,sys; s=socket.socket(socket.AF_UNIX); s.settimeout(2); s.connect(sys.argv[1])' "$1" 2>/dev/null
}
bersihkan_soket() {
  local f p
  for f in /run/containerd/containerd.sock /run/containerd/containerd.sock.ttrpc /var/run/docker.sock \
           /var/run/docker/containerd/containerd.sock /var/run/docker/containerd/containerd.sock.ttrpc; do
    [ -S "$f" ] || continue
    if soket_hidup "$f"; then say "runtime: $f is live (a process is behind it): kept"; continue; fi
    rm -f -- "$f" && say "runtime: removed the stale socket $f (nothing behind it, left by a previous boot or a killed daemon)"
  done
  for f in /var/run/docker.pid /run/containerd/containerd.pid /var/run/docker/containerd/containerd.pid; do
    [ -f "$f" ] || continue
    p="$(tr -dc 0-9 < "$f")"
    if [ -n "$p" ] && kill -0 "$p" 2>/dev/null; then say "runtime: $f names a running process ($p): kept"; continue; fi
    rm -f -- "$f" && say "runtime: removed the stale pid file $f"
  done
}
cek_runtime() {
  if runtime_hidup; then say "runtime ok"; return; fi
  [ "$MODE" = full ] || infra runtime "docker does not answer (dockerd or containerd is dead)"
  say "runtime dead: restarting containerd and dockerd"
  mkdir -p "$LOGDIR"
  pkill -x dockerd 2>/dev/null; pkill -x containerd 2>/dev/null
  for _ in $(seq 1 20); do pgrep -x dockerd >/dev/null || pgrep -x containerd >/dev/null || break; sleep 0.5; done
  pkill -9 -x dockerd 2>/dev/null; pkill -9 -x containerd 2>/dev/null
  bersihkan_soket
  # dockerd starts its own containerd when none is running.
  setsid nohup dockerd >>"$LOGDIR/dockerd.log" 2>&1 < /dev/null &
  for _ in $(seq 1 60); do runtime_hidup && break; sleep 1; done
  runtime_hidup || infra runtime "dockerd did not come back within 60 s (its log: $LOGDIR/dockerd.log)"
  say "runtime pulih (restarted; containerd and dockerd answer)"
}

# ---- images -----------------------------------------------------------------------------------------------------
punya_digest() { # <ref> <digest>: the local image carries that repository digest
  docker image inspect "$1" --format '{{range .RepoDigests}}{{println .}}{{end}}' 2>/dev/null | grep -q "@$2\$"
}
tarik() { # <ref> <digest>: pull by digest with backoff, then tag; prints the cause on failure
  local ref="$1" dg="$2" repo="${1%:*}" n=1 w="$WAIT0" out
  while :; do
    out="$(timeout 600 docker pull -q "$repo@$dg" 2>&1)" && { docker tag "$repo@$dg" "$ref" >/dev/null 2>&1; return 0; }
    if echo "$out" | grep -qiE 'toomanyrequests|429 Too Many Requests|rate limit|Data limit exceeded|failed to pull docker image from all registries|request blocked: no rule allows host|agent proxy: no rule or network setting allows this host'; then kind=registry; else kind=image; fi
    say "image $ref: pull $n/$TRIES failed ($kind: $(echo "$out" | tail -1 | cut -c1-300))"
    [ "$n" -ge "$TRIES" ] && { echo "$kind" > "$LOGDIR/pull-cause"; return 1; }
    sleep "$w"; w=$((w * 3)); n=$((n + 1))
  done
}
cek_images() {
  local ref dg missing=0 have=0
  mkdir -p "$LOGDIR"
  while read -r ref dg _; do
    case "$ref" in ''|'#'*) continue ;; esac
    if punya_digest "$ref" "$dg"; then have=$((have + 1)); continue; fi
    [ "$MODE" = full ] || infra image "$ref is not present with $dg"
    say "image $ref missing (or another digest): pulling by digest"
    if ! tarik "$ref" "$dg"; then
      local k; k="$(cat "$LOGDIR/pull-cause" 2>/dev/null || echo image)"
      [ "$k" = registry ] && infra registry "the registry refused $ref after $TRIES tries with backoff (a rate or data limit, or the proxy blocking its host)"
      infra image "$ref could not be pulled after $TRIES tries"
    fi
    punya_digest "$ref" "$dg" || infra image "$ref was pulled but does not carry $dg"
    missing=$((missing + 1))
  done < "$LOCK"
  if [ "$missing" -gt 0 ]; then say "images pulih ($missing pulled, $have already present, all pinned)"; else say "images ok ($have present, all pinned by digest)"; fi
}

# ---- stack ------------------------------------------------------------------------------------------------------
db_ok() { timeout 10 psql "$DB_URL" -Atqc 'select 1' >/dev/null 2>&1; }
auth_ok() { [ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' http://127.0.0.1:54321/auth/v1/health)" = 200 ]; }
mail_ok() { curl -sf -m 5 -o /dev/null http://127.0.0.1:54324/api/v1/info; }
tunggu_sehat() {
  local t=0
  while [ "$t" -lt "$HEALTH_WAIT" ]; do db_ok && auth_ok && mail_ok && return 0; sleep 3; t=$((t + 3)); done
  return 1
}
cek_stack() {
  if db_ok && auth_ok && mail_ok; then say "stack ok (database, Auth, Mailpit)"; return; fi
  if [ "$MODE" != full ]; then
    db_ok || infra stack "the database does not answer on 54322"
    auth_ok || infra stack "Auth is not healthy (:54321/auth/v1/health)"
    infra stack "Mailpit does not answer (:54324)"
  fi
  if [ -z "$(docker ps -q --filter name=supabase_db_)" ]; then
    say "stack not running: supabase start"
    sudo -n sysctl -q -w net.ipv4.ip_local_reserved_ports=54320-54329 2>/dev/null || sysctl -q -w net.ipv4.ip_local_reserved_ports=54320-54329 2>/dev/null || true
    (cd "$REPO" && timeout 900 npx --no-install supabase start -x "$EXCLUDE" 2>&1 | tapis >"$LOGDIR/supabase-start.log") \
      || { (cd "$REPO" && npx --no-install supabase stop --no-backup >/dev/null 2>&1); sleep 5;
           (cd "$REPO" && timeout 900 npx --no-install supabase start -x "$EXCLUDE" 2>&1 | tapis >>"$LOGDIR/supabase-start.log") \
             || infra stack "supabase start failed twice (its log: $LOGDIR/supabase-start.log)"; }
  fi
  if ! mail_ok; then
    say "Mailpit not answering: (re)starting the sink as CI does"
    docker rm -f mailpit >/dev/null 2>&1
    docker run -d --name mailpit -p 127.0.0.1:54325:1025 -p 127.0.0.1:54324:8025 axllent/mailpit:v1.31.3 \
      --enable-chaos --smtp-auth-accept-any --smtp-auth-allow-insecure --disable-version-check >/dev/null 2>&1 \
      || infra stack "Mailpit would not start"
  fi
  tunggu_sehat || {
    db_ok || infra stack "the database did not become healthy within ${HEALTH_WAIT} s"
    auth_ok || infra stack "Auth did not become healthy within ${HEALTH_WAIT} s"
    infra stack "Mailpit did not become healthy within ${HEALTH_WAIT} s"; }
  say "stack pulih (database, Auth, Mailpit healthy)"
}

# ---- port -------------------------------------------------------------------------------------------------------
# fuser, not lsof: in this sandbox lsof cannot map a socket to its process (it saw no listener while a leaked
# next-server held the port), and `ss` is not installed.
listeners() { fuser -n tcp "$PORT" 2>/dev/null | tr -s ' ' '\n' | grep -E '^[0-9]+$' | sort -u; }
cek_port() {
  local pids p cmd leaked=""
  pids="$(listeners)"
  [ -z "$pids" ] && { say "port $PORT ok (free)"; return; }
  for p in $pids; do
    cmd="$(tr '\0' ' ' < "/proc/$p/cmdline" 2>/dev/null | cut -c1-120)"
    case "$cmd" in
      *next-server*|*next\ start*|*next/dist/bin/next*)
        # N-3: only this user's server is ours to stop
        [ "$(stat -c %u "/proc/$p" 2>/dev/null)" = "$(id -u)" ] \
          || infra port "$PORT is held by an app server of another user (pid $p, uid $(stat -c %u "/proc/$p" 2>/dev/null)): not stopped"
        leaked="$leaked $p" ;;
      *) infra port "$PORT is held by pid $p ($cmd), which is not an app server this harness starts" ;;
    esac
  done
  [ "$MODE" = full ] || infra port "$PORT is held by a leaked app server (pid$leaked)"
  say "port $PORT held by a leaked app server (pid$leaked, started $(ps -o lstart= -p ${leaked# } 2>/dev/null | head -1)): stopping it"
  kill $leaked 2>/dev/null
  for _ in $(seq 1 20); do [ -z "$(listeners)" ] && break; sleep 0.5; done
  kill -9 $leaked 2>/dev/null
  sleep 0.5
  [ -n "$(listeners)" ] && infra port "$PORT is still held after stopping pid$leaked"
  say "port $PORT pulih (leaked server stopped)"
}

[ "$MODE" = heartbeat ] || { tapis_berkas "$LOGDIR"/*.log; cek_mulai_ulang; }
if [ "$MODE" = heartbeat ]; then
  cek_disk; cek_runtime
  db_ok || infra stack "the database does not answer on 54322"
  say "heartbeat ok"
  echo READY
  exit 0
fi
cek_disk; cek_runtime; cek_images; cek_stack; cek_port
echo READY
