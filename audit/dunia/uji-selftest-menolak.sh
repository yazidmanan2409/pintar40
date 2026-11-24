#!/usr/bin/env bash
# Ruling 79's audit world: the proof of Sharon's marker guard. On a database the world has loaded (dunia.penanda
# holds its row), `npm run selftest` must refuse to start: a non-zero exit, the refusal's words, and no suite run.
#   audit/dunia/uji-selftest-menolak.sh        (the world loaded first: audit/dunia/muat.sh)
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
if [ "$(psql "$DB" -XqAt -c "select count(*) > 0 from dunia.penanda" 2>/dev/null)" != "t" ]; then
  echo "uji-selftest-menolak: the world is not loaded here (no dunia.penanda row): load it first"; exit 2
fi
out="$(mktemp)"; trap 'rm -f "$out"' EXIT
(cd "$REPO" && SUPABASE_DB_URL="$DB" timeout 300 npx --no-install tsx selftest/run.ts --only=F01-D01 >"$out" 2>&1); rc=$?
if [ "$rc" -ne 0 ] && grep -q "REFUSED: this database holds the ruling 79 audit world" "$out" && ! grep -q "^\[db\]" "$out"; then
  echo "PASS  selftest refused to start on a world-loaded database (exit $rc)"; exit 0
fi
echo "FAIL  selftest was not refused (exit $rc). Its output:"; head -20 "$out"; exit 1
