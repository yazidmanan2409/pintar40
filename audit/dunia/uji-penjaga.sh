#!/usr/bin/env bash
# Ruling 79's audit world: the proof of Sharon's guard. muat.sh must refuse every database but the local stack's, with
# exit 3, before it resets, connects or writes anything. Each case runs with `psql` and `npx` replaced by stand-ins that
# record any call, so a refused case that reached either one fails this test. Then the local URL must pass the guard.
# It runs on a copy of audit/dunia, so it never writes the real dunia.json.
set -uo pipefail
ASLI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p "$T/bin"
# a copy of the loader and its parts, so no case can write the real dunia.json
HERE="$T/audit/dunia"; mkdir -p "$HERE"; cp -r "$ASLI"/. "$HERE"/
for b in psql npx; do printf '#!/bin/sh\necho "%s $*" >> "%s/dipanggil"\nexit 0\n' "$b" "$T" > "$T/bin/$b"; chmod +x "$T/bin/$b"; done
gagal=0
tolak() {
  rm -f "$T/dipanggil"
  for mode in "" "--tanpa-reset" "--fiksasi w8"; do
    PATH="$T/bin:$PATH" SUPABASE_DB_URL="$1" "$HERE/muat.sh" $mode >/dev/null 2>"$T/err"; rc=$?
    if [ "$rc" -ne 3 ] || [ -e "$T/dipanggil" ]; then
      echo "FAIL  not refused before any call: $1 ${mode:-(reset)} (exit $rc; calls: $(cat "$T/dipanggil" 2>/dev/null | tr '\n' ';'))"; gagal=1
    else echo "PASS  refused: $1 ${mode:-(reset)}"; fi
  done
}
tolak "postgresql://postgres:x@db.abcdefghij.supabase.co:5432/postgres"
tolak "postgresql://postgres.abcdefghij:x@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
tolak "postgresql://postgres:postgres@10.0.0.5:54322/postgres"
tolak "postgresql://postgres:postgres@127.0.0.1:5432/postgres"
tolak "postgresql://postgres:postgres@127.0.0.1:54322/staging"
tolak "postgresql://postgres:postgres@127.0.0.1.evil.example:54322/postgres"
tolak "postgresql://postgres:postgres@127.0.0.1:54322/postgres?host=db.example.com"
tolak "not a url"
# the local stack passes the guard (the stand-ins answer, so nothing real runs)
rm -f "$T/dipanggil"
PATH="$T/bin:$PATH" SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" "$HERE/muat.sh" --tanpa-reset >/dev/null 2>"$T/err"
if grep -q "REFUSED" "$T/err" || [ ! -e "$T/dipanggil" ]; then echo "FAIL  the local stack was refused"; gagal=1; else echo "PASS  the local stack passes the guard"; fi
[ "$gagal" -eq 0 ] && echo "uji-penjaga: every non-local database refused" || echo "uji-penjaga: FAILED"
exit "$gagal"
