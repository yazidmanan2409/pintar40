#!/usr/bin/env bash
# Ruling 83: the planted failures, one per improvement, each recorded red first (see BUKTI.md).
#
#   bash docs/completion-4.1/infra-83/bukti.sh <proof>     proof: image registry clean disk dockerd port midrun usedb defect
#
# Each proof writes docs/completion-4.1/infra-83/bukti-<proof>.txt: the commands, their output, and what was checked.
# Run in the builder's own container only: the proofs kill the runtime, fill the disk and stop servers.
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO"
HERE="docs/completion-4.1/infra-83"
P="${1:?proof name}"
OUTF="$HERE/bukti-$P.txt"
exec > >(tee "$OUTF") 2>&1
step() { echo; echo "\$ $*"; "$@"; echo "[rc=$?]"; }
note() { echo; echo "## $*"; }
echo "# bukti-$P · $(date -u +%FT%TZ) · commit $(git rev-parse --short HEAD)"

case "$P" in
image)
  note "plant: remove one pinned image (postgrest/postgrest:v16.2; its container keeps running)"
  step docker rmi -f postgrest/postgrest:v16.2 "postgrest/postgrest@sha256:85258123312dc496ad4c2ed832154a65e9746f84df0d6d09b44229ff9230c08e"
  note "RED: the check-only gate names the missing image and stops, before anything starts"
  step scripts/dev/siap.sh --tanpa-pulih
  note "GREEN: the full gate pulls it by digest, verifies the digest, and prints READY"
  step scripts/dev/siap.sh
  step docker image inspect postgrest/postgrest:v16.2 --format '{{join .RepoDigests " "}}'
  ;;
registry)
  note "plant: a registry that answers every pull with 429 (a docker shim on PATH; every other docker command passes through)"
  SHIM="$(mktemp -d)"; REAL="$(command -v docker)"
  cat > "$SHIM/docker" <<EOF
#!/usr/bin/env bash
if [ "\$1" = pull ]; then echo "Error response from daemon: toomanyrequests: You have reached your pull rate limit (429 Too Many Requests)" >&2; exit 1; fi
exec "$REAL" "\$@"
EOF
  chmod +x "$SHIM/docker"
  step docker rmi -f axllent/mailpit:v1.31.3 "axllent/mailpit@sha256:ed9b00c609e77e99c79b93f1178255ebc271868920f2c69a8d166bd5634ed10d"
  note "RED → INFRA: 4 tries with backoff (2 s, tripled), then «INFRA registry», before anything starts"
  t0=$(date +%s); PATH="$SHIM:$PATH" SIAP_PULL_WAIT=2 step scripts/dev/siap.sh; echo "elapsed $(( $(date +%s) - t0 ))s"
  rm -rf "$SHIM"
  note "the registry back: the same gate pulls it and prints READY"
  step scripts/dev/siap.sh
  ;;
clean)
  T="${TMPDIR:-/tmp}"; old="$(date -d '-3 hours' '+%Y%m%d%H%M')"
  note "plant: abandoned harness scratch (aged 3 h), a large build folder, an abandoned red-case clone, and evidence"
  git worktree add -q --detach "$T/pintar-redcase-990001" HEAD
  mkdir -p "$T/pintar-redcase-990001/.next" && fallocate -l 512M "$T/pintar-redcase-990001/.next/planted-build.bin"
  git worktree add -q --detach "$T/pintar-redcase-990002" HEAD
  mkdir -p "$T/pintar-redcase-990002/docs/completion-4.1/batches/z/z-evidence/preflight-planted"
  echo "planted evidence inside a clone: must survive" > "$T/pintar-redcase-990002/docs/completion-4.1/batches/z/z-evidence/preflight-planted/SUMMARY.txt"
  mkdir -p "$T/dr150-Pl4nt1" "$T/pintar-plants-Pl4nt2" "$T/dr-s09-Pl4nt3/z-evidence"
  fallocate -l 256M "$T/dr150-Pl4nt1/scratch.bin"; echo x > "$T/pintar-plants-Pl4nt2/a.sql"
  echo "planted evidence in scratch: must survive" > "$T/dr-s09-Pl4nt3/z-evidence/run.txt"
  mkdir -p "$T/not-harness-Pl4nt4"; echo "not the harness's: must survive" > "$T/not-harness-Pl4nt4/keep.txt"
  mkdir -p "$T/dr150-Pl4nt5"; echo "fresh: must survive (younger than the limit)" > "$T/dr150-Pl4nt5/new.txt"
  mkdir -p "$REPO/docs/completion-4.1/batches/z/z-evidence/preflight-planted"
  echo "planted evidence in the checkout: must survive" > "$REPO/docs/completion-4.1/batches/z/z-evidence/preflight-planted/SUMMARY.txt"
  find "$T/pintar-redcase-990001" "$T/pintar-redcase-990002" "$T/dr150-Pl4nt1" "$T/pintar-plants-Pl4nt2" "$T/dr-s09-Pl4nt3" "$T/not-harness-Pl4nt4" -exec touch -h -t "$old" {} +
  tracked0="$(git ls-files -s | sha256sum)"; status0="$(git status --porcelain | sha256sum)"
  step df -h --output=avail "$T"
  note "DRY RUN (the default): lists, removes nothing"
  step scripts/dev/bersih.sh
  step ls -d "$T/pintar-redcase-990001" "$T/dr150-Pl4nt1"
  note "ACT: --hapus"
  step scripts/dev/bersih.sh --hapus
  step df -h --output=avail "$T"
  note "CHECKS"
  for f in "$T/pintar-redcase-990001" "$T/dr150-Pl4nt1" "$T/pintar-plants-Pl4nt2"; do [ -e "$f" ] && echo "FAIL still there: $f" || echo "ok removed: $f"; done
  for f in "$T/pintar-redcase-990002/docs/completion-4.1/batches/z/z-evidence/preflight-planted/SUMMARY.txt" "$T/dr-s09-Pl4nt3/z-evidence/run.txt" \
           "$T/not-harness-Pl4nt4/keep.txt" "$T/dr150-Pl4nt5/new.txt" "$REPO/docs/completion-4.1/batches/z/z-evidence/preflight-planted/SUMMARY.txt"; do
    [ -f "$f" ] && echo "ok survived: $f" || echo "FAIL gone: $f"; done
  [ "$(git ls-files -s | sha256sum)" = "$tracked0" ] && echo "ok the index (every committed path) is unchanged" || echo "FAIL the index changed"
  [ "$(git status --porcelain | sha256sum)" = "$status0" ] && echo "ok git status is unchanged" || echo "FAIL git status changed"
  git worktree list
  note "tidy the planted files the cleanup rightly kept"
  git worktree remove --force "$T/pintar-redcase-990002"; rm -rf "$T/dr-s09-Pl4nt3" "$T/not-harness-Pl4nt4" "$T/dr150-Pl4nt5" "$REPO/docs/completion-4.1/batches/z/z-evidence/preflight-planted"
  rmdir "$REPO/docs/completion-4.1/batches/z/z-evidence" "$REPO/docs/completion-4.1/batches/z" 2>/dev/null; true
  ;;
disk)
  T="${TMPDIR:-/tmp}"; free="$(df -B1 --output=avail "$T" | tail -1)"
  min=$(( free / 1024 / 1024 / 1024 - 2 ))
  note "plant: a minimum of ${min}G (2G under the free space), then fill 3G: free space falls below it"
  step fallocate -l 3G "$T/pintar-bukti-isi.bin"
  note "RED → INFRA: the pre-flight refuses to start, with «disk», before minute one"
  t0=$(date +%s); SIAP_DISK_MIN_GB=$min step scripts/dev/preflight.sh --keluar="$HOME/pintar-preflight/bukti-disk"; echo "elapsed $(( $(date +%s) - t0 ))s"
  step cat "$HOME/pintar-preflight/bukti-disk/SUMMARY.txt"
  rm -f "$T/pintar-bukti-isi.bin"
  note "the space back: the gate is READY"
  SIAP_DISK_MIN_GB=$min step scripts/dev/siap.sh
  ;;
dockerd)
  note "plant: kill the runtime (dockerd and containerd), as a container restart leaves it"
  step pkill -9 -x dockerd; pkill -9 -x containerd; sleep 2
  step bash -c 'timeout 5 docker info >/dev/null 2>&1 && echo alive || echo "docker: dead"'
  note "RED: the check-only gate names it"
  step scripts/dev/siap.sh --tanpa-pulih
  note "GREEN: the full gate restarts containerd and dockerd, waits for the stack's health, READY, with no person"
  t0=$(date +%s); step scripts/dev/siap.sh; echo "elapsed $(( $(date +%s) - t0 ))s"
  ;;
port)
  note "plant: a stale production server left on :3999 (the checkout's existing build, started and abandoned)"
  setsid nohup node node_modules/next/dist/bin/next start -p 3999 > /dev/null 2>&1 < /dev/null &
  for _ in $(seq 1 30); do curl -s -o /dev/null http://127.0.0.1:3999/ && break; sleep 1; done
  step bash -c 'fuser -v -n tcp 3999'
  note "RED: the check-only gate names the leaked server"
  step scripts/dev/siap.sh --tanpa-pulih
  note "GREEN: the full gate stops it and frees the port"
  step scripts/dev/siap.sh
  step bash -c 'fuser -n tcp 3999 || echo "3999: free"'
  note "and a port held by something that is not ours is named, not killed"
  setsid nohup python3 -m http.server 3999 --bind 127.0.0.1 > /dev/null 2>&1 < /dev/null & sleep 1
  step scripts/dev/siap.sh
  pkill -f "http.server 3999"
  ;;
midrun)
  note "plant: kill the runtime 20 s after the suite step itself starts, past its forced reset (heartbeat every 15 s)"
  rm -rf "$HOME/pintar-preflight/bukti-midrun"
  ( until [ -f "$HOME/pintar-preflight/bukti-midrun/suite.log" ]; do sleep 1; done; sleep 20
    pkill -9 -x dockerd; pkill -9 -x containerd; echo "[planted] $(date -u +%TZ) dockerd and containerd killed" ) &
  t0=$(date +%s)
  PREFLIGHT_DENYUT=15 step scripts/dev/preflight.sh --langkah=suite,plants --keluar="$HOME/pintar-preflight/bukti-midrun" -- --only='F01-*,F02-*,F03-*,F04-*,F05-*'
  echo "elapsed $(( $(date +%s) - t0 ))s"
  step cat "$HOME/pintar-preflight/bukti-midrun/SUMMARY.txt"
  step cat "$HOME/pintar-preflight/bukti-midrun/HEARTBEAT.txt"
  note "recovery for the next proof"
  step scripts/dev/siap.sh
  ;;
midrun2)
  note "plant: kill dockerd ONLY (containerd and the containers keep running, so the suite runs on, as in I-1) 20 s into the whole suite; heartbeat every 15 s"
  rm -rf "$HOME/pintar-preflight/bukti-midrun2"
  ( until [ -f "$HOME/pintar-preflight/bukti-midrun2/suite.log" ]; do sleep 1; done; sleep 20
    pkill -9 -x dockerd; echo "[planted] $(date -u +%TZ) dockerd killed" ) &
  t0=$(date +%s)
  PREFLIGHT_DENYUT=15 step scripts/dev/preflight.sh --langkah=suite,plants,redcase --keluar="$HOME/pintar-preflight/bukti-midrun2"
  echo "elapsed $(( $(date +%s) - t0 ))s"
  step cat "$HOME/pintar-preflight/bukti-midrun2/SUMMARY.txt"
  step cat "$HOME/pintar-preflight/bukti-midrun2/HEARTBEAT.txt"
  step bash -c "tail -3 '$HOME/pintar-preflight/bukti-midrun2/suite.log'"
  step bash -c 'pgrep -af "selftest/run.ts|next build|next-server" || echo "no step process left"'
  note "recovery for the next proof"
  step scripts/dev/siap.sh
  ;;
usedb)
  sel="--only=F01-*,F02-*,F03-*,A2A-C*"
  note "I-2 replayed: the WHOLE suite on a fresh database (it leaves the world used), then the targeted run on that database WITHOUT a reset (the old way)"
  step scripts/dev/preflight.sh --langkah=suite --keluar="$HOME/pintar-preflight/bukti-usedb-1"
  step scripts/dev/preflight.sh --langkah=suite --tanpa-reset --keluar="$HOME/pintar-preflight/bukti-usedb-2-tanpa-reset" -- "$sel"
  step cat "$HOME/pintar-preflight/bukti-usedb-2-tanpa-reset/SUMMARY.txt"
  step bash -c "grep -v ' PASS ' '$HOME/pintar-preflight/bukti-usedb-2-tanpa-reset/ROWS.txt' | head -20"
  note "GREEN: the same replay on the same used database, as the pre-flight now runs it (forced reset first)"
  step scripts/dev/preflight.sh --langkah=suite --keluar="$HOME/pintar-preflight/bukti-usedb-3" -- "$sel"
  step cat "$HOME/pintar-preflight/bukti-usedb-3/SUMMARY.txt"
  ;;
defect)
  f=src/lib/hle.ts
  note "plant: a real code defect (a user-facing string a static test pins), on a healthy machine"
  cp "$f" "$HERE/.hle.bak"
  sed -i 's/An Admin PINTAR reset recovery/An Admin PINTAT reset recovery/' "$f"; step git diff --stat
  step scripts/dev/preflight.sh --langkah=suite --keluar="$HOME/pintar-preflight/bukti-defect" -- --only=Z-T03-01
  step cat "$HOME/pintar-preflight/bukti-defect/SUMMARY.txt"
  step cat "$HOME/pintar-preflight/bukti-defect/ROWS.txt"
  mv "$HERE/.hle.bak" "$f"; step git diff --stat
  ;;
*) echo "unknown proof $P"; exit 2 ;;
esac
