#!/usr/bin/env bash
# Ruling 79's audit world (track 3c): reset the local database and load the shared synthetic world.
#
#   audit/dunia/muat.sh [--tanpa-reset]     writes audit/dunia/dunia.json (the world's facts, synthetic only)
#   audit/dunia/muat.sh --fiksasi <name>    applies fiksasi/<name>.sql to the world ALREADY loaded (no reset), as one
#                                           transaction, and writes dunia.json again: a per-journey fixture (W7, W8)
#
# 1. `supabase db reset --local`: every migration and the seed, so a reset returns every state (Daisy's rule).
# 2. 00-pembantu.sql, then every other NN-*.sql here in order, as ONE transaction (psql -1, ON_ERROR_STOP): a part
#    that fails leaves no half-built world.
# 3. dunia.fakta exported to dunia.json, which the journey captures read (sign-in details, ids).
# Local and CI only: the loader refuses any database but the local stack's (below), and the seed's own guards refuse
# a production environment. Never run the selftests against a database where the world has loaded (Bob, 24 Nov).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
DB="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

# SHARON'S GUARD (24 Nov): the world (and its legacy-state and fixture paths, which write past today's guards) loads into
# the local stack only, which is CI's too: host 127.0.0.1 or localhost, port 54322, database postgres. Anything else
# exits non-zero here, before any reset, connection or write. Proven by audit/dunia/uji-penjaga.sh.
if ! python3 - "$DB" <<'PY_GUARD'
import sys
from urllib.parse import urlsplit
u = urlsplit(sys.argv[1])
ok = (u.scheme in ("postgresql", "postgres") and u.hostname in ("127.0.0.1", "localhost") and u.port == 54322
      and u.path == "/postgres" and not u.query)
sys.exit(0 if ok else 1)
PY_GUARD
then
  echo "dunia: REFUSED: the world loads into the local stack only (127.0.0.1:54322/postgres), not this database" >&2
  exit 3
fi
args=(-v ON_ERROR_STOP=1 -q -X -1)
if [ "${1:-}" = "--fiksasi" ]; then
  fx="$HERE/fiksasi/${2:?which fixture}.sql"
  [ -f "$fx" ] || { echo "dunia: no fixture $fx" >&2; exit 2; }
  psql "$DB" "${args[@]}" -f "$fx"
else
  if [ "${1:-}" != "--tanpa-reset" ]; then
    (cd "$REPO" && npx --no-install supabase db reset --local >/dev/null)
  fi
  for f in "$HERE"/[0-9][0-9]-*.sql; do args+=(-f "$f"); done
  psql "$DB" "${args[@]}"
fi
psql "$DB" -X -Atqc "select coalesce(jsonb_object_agg(k, case when left(v,1) in ('{','[') then v::jsonb else to_jsonb(v) end), '{}')::text from dunia.fakta" \
  | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False, sort_keys=True))' > "$HERE/dunia.json"
[ "${1:-}" = "--fiksasi" ] && echo "dunia: fixture $2 applied" || echo "dunia: loaded $(ls "$HERE"/[0-9][0-9]-*.sql | wc -l) part(s); facts: $(python3 -c 'import json,sys; print(len(json.load(open(sys.argv[1]))))' "$HERE/dunia.json") → audit/dunia/dunia.json"
