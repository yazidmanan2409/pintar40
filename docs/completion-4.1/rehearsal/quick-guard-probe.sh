#!/usr/bin/env bash
# The QUICK guard probe (20261113100000), on a throw-away transaction.
#
# Usage: quick-guard-probe.sh <db-url> <target migrations dir> <base migrations dir> <out dir>
#
# 20261113100000 refuses to apply while an ELIGIBLE (unsigned) certificate from a QUICK session exists. The main run
# never creates one (it would stop the upgrade). This probe proves the refusal instead, on the same database, inside
# ONE transaction that is never committed:
#   1. it prepares an ELIGIBLE certificate for the fixture's finished, uncertified QUICK session (111's own
#      certificate_prepare);
#   2. it applies, in that transaction, every target migration after 111 up to and including 20261113100000;
#   3. it expects that last migration to raise its BOB-50 refusal, naming exactly 1 certificate.
# psql stops at the first error, so the transaction is rolled back with the connection. The caller then checks the
# database is still exactly what it was (the same fingerprint, still 111 migrations).
set -euo pipefail
db="$1"; target="$2"; base="$3"; out="$4"
guard=20261113100000
probe="$out/quick-guard-probe.sql"
{
  echo '\set ON_ERROR_STOP 1'
  echo 'begin;'
  echo "select count(*) as eligible_quick_prepared from public.assessment_sessions s"
  echo "  cross join lateral public.certificate_prepare(s.id, 1::smallint) c"
  echo " where s.mode = 'QUICK' and s.status = 'FINALIZED'"
  echo "   and not exists (select 1 from public.certificates x where x.session_id = s.id);"
  echo "select count(*) as eligible_quick_now from public.certificates c join public.assessment_sessions s on s.id = c.session_id"
  echo " where c.status = 'ELIGIBLE' and s.mode = 'QUICK';"
  for f in "$target"/*.sql; do
    n="$(basename "$f")"
    [ -f "$base/$n" ] && continue
    echo "\\echo probe: applying $n"
    echo "\\i $f"
    [ "${n%%_*}" = "$guard" ] && break
  done
  echo '\echo probe: GUARD-DID-NOT-REFUSE'
  echo 'rollback;'
} > "$probe"
set +e
psql -q "$db" -f "$probe" > "$out/quick-guard-probe.log" 2>&1
rc=$?
set -e
grep -E '^probe: applying|ERROR|GUARD-DID-NOT-REFUSE|eligible_quick' "$out/quick-guard-probe.log" | tail -4 || true
grep -q 'GUARD-DID-NOT-REFUSE' "$out/quick-guard-probe.log" && { echo "::error::20261113100000 applied over an ELIGIBLE QUICK certificate"; exit 1; }
last="$(grep -E '^probe: applying' "$out/quick-guard-probe.log" | tail -1 | awk '{print $3}')"
[ "${last%%_*}" = "$guard" ] || { echo "::error::the probe stopped before the guard, at $last"; tail -20 "$out/quick-guard-probe.log"; exit 1; }
grep -q "ERROR:  BOB-50: 1 unsigned certificate(s) from an Uji Cepat exist; this migration refuses to apply" "$out/quick-guard-probe.log" \
  || { echo "::error::the guard migration failed, but not with its BOB-50 refusal of exactly 1 certificate"; tail -20 "$out/quick-guard-probe.log"; exit 1; }
[ "$rc" -ne 0 ] || { echo "::error::psql exited 0 although the guard refused"; exit 1; }
echo "the guard refused as designed: BOB-50, 1 unsigned QUICK certificate; the probe's transaction was never committed"
