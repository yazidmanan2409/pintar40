# shellcheck shell=bash
# ---------------------------------------------------------------------------
# KELAS: how the pre-flight classes a failure (ruling 83 P-5, after Sharon's S-1). Sourced by preflight.sh.
#
# The rule, in precedence order:
#   1. RED takes precedence. Any FAIL row makes the run RED, and its INFRA rows are listed beside it. A suite holding
#      both keeps its FAIL rows; it never collapses into one INFRA row.
#   2. A failure is INFRA only when the machine was not healthy (siap.sh or the heartbeat was not READY during or at
#      the end of the step), or its signal is one code cannot produce: the runtime gone, or a registry refusal.
#   3. Every other signal (a missing facility, a port in use, a refused database connection, a full disk) is
#      ambiguous: code can cause each of them. On a healthy machine they are FAIL, with the signal noted.
#   4. VOID only when there is an INFRA row and no FAIL row.
# ---------------------------------------------------------------------------

# Signals code cannot produce: always INFRA.
SIG_MESIN=(
  'Cannot connect to the Docker daemon|runtime'
  'docker.sock: connect|runtime'
  'toomanyrequests|registry'
  '429 Too Many Requests|registry'
  'Data limit exceeded|registry'                          # public ECR: «error from registry: Data limit exceeded» (Second Eye, I-4)
  'failed to pull docker image from all registries|registry'   # the supabase CLI's summary after every registry refused
  # GHCR through the session's agent proxy: «… Forbidden (agent proxy: no rule or network setting allows this host)».
  # The proxy's words alone could come from app code reaching any host, so only on a line that names a registry host
  # or the image-pull machinery. Not «/v2/» (any versioned API) nor «registr…» (registration, registrasi): N-4
  '(ghcr\.io|pkg-containers\.githubusercontent\.com|httpReadSeeker|Pulling from|docker image).*agent proxy: no rule or network setting allows this host|registry'
  # the session's agent proxy refusing a REGISTRY host (GHCR and its blob host). Only a registry host: app code can
  # also be refused by the proxy, and that is not the machine's
  'request blocked: no rule allows host.*(ghcr\.io|pkg-containers\.githubusercontent\.com|docker\.io|docker\.com|ecr\.aws)|registry'
)
# Signals code can produce: INFRA only when the machine was not healthy.
SIG_MUNGKIN=(
  'No space left on device|disk'
  'ENOSPC|disk'
  'nospc|disk'
  'Check free disk space|disk'
  'connection to server at "127.0.0.1", port 54322 failed|database'
  'ECONNREFUSED 127.0.0.1:5432[0-9]|database'
  'the database system is (shutting down|starting up|in recovery mode)|database'
  'facility missing: (db|app|network|build|mail|mailsink)|facility'
  'EADDRINUSE.*:3999|port'
)

_sinyal() { # <file> <array name>: prints "<cause>: <line>" for the first matching signal
  local -n _arr="$2"; local s pat cause line
  for s in "${_arr[@]}"; do
    pat="${s%|*}"; cause="${s##*|}"
    line="$(grep -m1 -E -- "$pat" "$1" 2>/dev/null)" && { echo "$cause: $(echo "$line" | cut -c1-200)"; return 0; }
  done
  return 1
}

# kelas_teks <file> <healthy 0|1>: prints "INFRA <cause>: <line>" or "FAIL" or "FAIL (… on a healthy machine)"
kelas_teks() {
  local sig
  if sig="$(_sinyal "$1" SIG_MESIN)"; then echo "INFRA $sig"; return; fi
  if sig="$(_sinyal "$1" SIG_MUNGKIN)"; then
    if [ "$2" = 1 ]; then echo "FAIL (a $sig signal, on a healthy machine)"; else echo "INFRA $sig"; fi
    return
  fi
  echo "FAIL"
}

# kelas_baris <suite.log> <healthy 0|1> <out dir>: writes ROWS.txt and rows.sum; sets N_FAIL, N_INFRA,
# FIRST_FAIL and FIRST_INFRA
kelas_baris() {
  local log="$1" sehat="$2" out="$3" line id st detail k
  N_FAIL=0; N_INFRA=0; FIRST_FAIL=""; FIRST_INFRA=""
  : > "$out/ROWS.txt"
  awk '/^id +status +detail$/{on=1; next} on && /^[0-9]+ passed, /{exit} on && NF' "$log" > "$out/rows.raw"
  while IFS= read -r line; do
    # fields by whitespace, not by column: run.ts pads ids to 11, and longer ids push the status right
    read -r id st detail <<< "$line"
    case "$st" in
      PASS|SKIP\*) k=PASS ;;
      *) printf '%s\n' "$detail" > "$out/.row"; k="$(kelas_teks "$out/.row" "$sehat")" ;;
    esac
    case "$k" in
      INFRA*) N_INFRA=$((N_INFRA + 1)); [ -n "$FIRST_INFRA" ] || FIRST_INFRA="$id ${k#INFRA }" ;;
      FAIL*)  N_FAIL=$((N_FAIL + 1));   [ -n "$FIRST_FAIL" ]  || FIRST_FAIL="$id $(echo "$detail" | cut -c1-160)" ;;
    esac
    printf '%-11s %-6s %s\n' "$id" "$st" "$k" >> "$out/ROWS.txt"
  done < "$out/rows.raw"
  rm -f "$out/.row" "$out/rows.raw"
  echo "rows: $(wc -l < "$out/ROWS.txt") classed; $N_FAIL FAIL, $N_INFRA INFRA (ROWS.txt; the machine $([ "$sehat" = 1 ] && echo healthy || echo NOT healthy) through the step)" > "$out/rows.sum"
}

# putusan <failed 0|1> <infra 0|1>: the run's verdict
putusan() {
  if [ "$1" = 1 ]; then echo RED; elif [ "$2" = 1 ]; then echo VOID; else echo GREEN; fi
}
