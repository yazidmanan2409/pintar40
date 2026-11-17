#!/usr/bin/env bash
# The production-upgrade rehearsal's steps beyond the fingerprint, one subcommand each, called by
# .github/workflows/rehearse-production-upgrade.yml from the repository root (out/ is the evidence directory).
# Every subcommand talks only to $DB_URL, the runner's own throw-away local stack. Synthetic data only.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
: "${DB_URL:?DB_URL must name the local stack database}"
q() { psql -X -v ON_ERROR_STOP=1 "$DB_URL" "$@"; }
mkdir -p out/r111 out/after out/extra

do_fixture() {
  # the synthetic shapes, at 111, in one transaction
  q -1 -q -f "$here/fixture-at-111.sql" > out/fixture.log 2>&1 || { cat out/fixture.log; echo "::error::the fixture failed at 111"; exit 1; }
  grep -E 'NOTICE' out/fixture.log || true
  n="$(q -At -c "select count(*) from auth.users where email like 'fiktif-%@example.invalid'")"
  [ "$n" -gt 0 ] || { echo "::error::the fixture added no synthetic learner"; exit 1; }
  # nothing in it is real: every email it wrote is on example.invalid
  bad="$(q -At -c "select count(*) from auth.users where email like 'fiktif-%' and email not like '%@example.invalid'")"
  [ "$bad" = 0 ] || { echo "::error::a fixture email is not on example.invalid"; exit 1; }
  echo "fixture applied at 111: $n synthetic learners"
}

do_stage2() {
  # stage 2's production query, run here at 111 against the synthetic rows only. It must be read only, valid at 111,
  # and return counts only.
  f="$here/stage2-production-counts.sql"
  first_select="$(grep -n -m1 -E '^\s*(with|select)\b' "$f" | cut -d: -f1)"
  ro="$(grep -n -m1 -E '^set transaction read only;' "$f" | cut -d: -f1)"
  [ -n "$ro" ] && [ "$ro" -lt "$first_select" ] || { echo "::error::the stage 2 query does not set its transaction read only before it reads"; exit 1; }
  q -At -F ' | ' -f "$f" > out/stage2-at-111.txt
  tail -1 out/stage2-at-111.txt | grep -qx ROLLBACK || { echo "::error::the stage 2 query did not end with its rollback"; exit 1; }
  # counts only: no email, no fixture name, no uuid in what it returns
  if grep -n -i -E '@|fiktif|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' out/stage2-at-111.txt; then
    echo "::error::the stage 2 query returned something other than counts"; exit 1
  fi
  grep -c ' | ' out/stage2-at-111.txt | xargs echo "stage 2 measures returned:"
  # every guard measure is 0 on the synthetic database (the main run must apply)
  if grep -E '^guard \| .* \| [1-9]' out/stage2-at-111.txt; then echo "::error::a guard measure is above 0 at 111"; exit 1; fi
}

do_extra() {
  # Sharon's blind spot 3: pg_cron's definitions, storage buckets, storage objects' metadata (never their content)
  phase="$1"; : > "out/extra-$phase.txt"
  while IFS='|' read -r name rel cols; do
    if [ "$(q -At -c "select to_regclass('$rel') is not null")" = t ]; then
      q -At -c "select row($cols)::text from $rel" | LC_ALL=C sort > "out/extra/$name.$phase"
      echo "$name $(wc -l < "out/extra/$name.$phase") $(md5sum < "out/extra/$name.$phase" | cut -c1-32)" >> "out/extra-$phase.txt"
    else
      : > "out/extra/$name.$phase"; echo "$name absent -" >> "out/extra-$phase.txt"
    fi
  done <<'EOF'
cron.job|cron.job|jobname,schedule,command,database,username,active
storage.buckets|storage.buckets|id,name,public,file_size_limit,allowed_mime_types
storage.objects|storage.objects|bucket_id,name,metadata
EOF
  cat "out/extra-$phase.txt"
}

do_capture() {
  # beside the fingerprint, at 111: the primary keys of every table (to find its rows after), and the inputs of the
  # after-upgrade checks
  q -At -F $'\t' -c "
    select n.nspname, c.relname, string_agg(quote_ident(a.attname), ',' order by k.ord)
      from pg_index i join pg_class c on c.oid = i.indrelid join pg_namespace n on n.oid = c.relnamespace
      cross join unnest(i.indkey) with ordinality k(attnum, ord)
      join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
     where i.indisprimary and n.nspname in ('public', 'auth')
     group by 1, 2 order by 1, 2" > out/pkcols-at-111.tsv
  : > out/pk-at-111.tsv
  while IFS=$'\t' read -r s t pk; do
    q -c "copy (select '$s.$t', row($pk)::text from $s.\"$t\") to stdout" >> out/pk-at-111.tsv
  done < out/pkcols-at-111.tsv
  echo "primary keys of 111: $(wc -l < out/pkcols-at-111.tsv) tables, $(wc -l < out/pk-at-111.tsv) rows"
  q -q -f "$here/capture-at-111.sql"
  q -At -F $'\t' -c "select distinct on (c.id) c.id, c.session_id, a.auth_user_id from public.certificates c
                       join public.accounts a on a.person_id = c.person_id order by c.id, a.created_at" > out/r111/holders.tsv
  : > out/r111/holder-reads.tsv
  while IFS=$'\t' read -r cert sess sub; do
    q -q -v cert="$cert" -v sess="$sess" -v sub="$sub" -f "$here/holder-read.sql" >> out/r111/holder-reads.tsv
  done < out/r111/holders.tsv
  echo "certificates of 111: $(wc -l < out/r111/certificates.tsv); holder reads: $(wc -l < out/r111/holder-reads.tsv)"
}

do_probe() {
  # 20261113100000's guard, proven on a transaction that is never committed; then the database is shown untouched
  bash "$here/quick-guard-probe.sh" "$DB_URL" target/supabase/migrations base/supabase/migrations out
  psql -X -1 -At -F ' ' -v ON_ERROR_STOP=1 -c "set transaction read only" -f out/fingerprint.sql "$DB_URL" > out/before-again.txt
  diff -u out/before.txt out/before-again.txt || { echo "::error::the probe left the database changed"; exit 1; }
  [ "$(q -At -c "select count(*) from supabase_migrations.schema_migrations")" = 111 ] || { echo "::error::the probe left a migration applied"; exit 1; }
  echo "after the probe: the same fingerprint, still 111 migrations"
}

do_hold_jobs() {
  # The scheduled jobs the upgrade installed would run on their own (the closer every five minutes) while the AFTER
  # reads are taken. Their definitions are fingerprinted first (extra after); then they are held for the reads, and
  # the closer's first pass is run on purpose, later, as its own step.
  q -At -c "select count(*) from cron.job_run_details" | xargs echo "pg_cron runs recorded before the hold:" | tee out/cron-runs-before-hold.txt
  q -At -c "select jobname || ' held' from cron.job, lateral (select cron.alter_job(jobid, active := false)) x order by jobname"
}

do_release_jobs() {
  q -At -c "select jobname || ' active again' from cron.job, lateral (select cron.alter_job(jobid, active := true)) x order by jobname"
}

do_checks() {
  : > out/after/holder-reads.tsv
  while IFS=$'\t' read -r cert sess sub; do
    q -q -v cert="$cert" -v sess="$sess" -v sub="$sub" -f "$here/holder-read.sql" >> out/after/holder-reads.tsv
  done < out/r111/holders.tsv
  # which migration added each column (by its text): the first target migration naming it in an ADD COLUMN on that table
  q -X -q -f "$here/checks-after-upgrade.sql" | tee out/after/checks.log
  : > out/after/backfill-migrations.tsv
  while IFS=$'\t' read -r tbl col rest; do
    t="${tbl#*.}"
    m="$(grep -l -i -E "alter table (only )?(if exists )?(public\.|auth\.)?\"?$t\"?( |$)" target/supabase/migrations/*.sql \
          | xargs -r grep -l -i -E "add column (if not exists )?\"?$col\"? " 2>/dev/null | head -1 | xargs -r basename || true)"
    printf '%s\t%s\t%s\t%s\n' "$tbl" "$col" "$rest" "${m:-?}" >> out/after/backfill-migrations.tsv
  done < out/after/backfill.tsv
}

do_closer() {
  # A1's closer, its first pass after the upgrade, run on purpose: production's would run within five minutes. Its own
  # selection names the sittings it closes; every one of them must leave its open state, and no other sitting may move.
  q -At -F $'\t' -c "select x from public.pengerjaan_tutup_calon(500) x" | LC_ALL=C sort > out/after/closer-candidates.txt
  q -At -F $'\t' -c "select id, status from public.assessment_sessions order by id" > out/after/sittings-before-closer.tsv
  q -q -c "call public.pengerjaan_tutup_berkala()"
  q -At -F $'\t' -c "select id, status from public.assessment_sessions order by id" > out/after/sittings-after-closer.tsv
  echo "closer candidates: $(wc -l < out/after/closer-candidates.txt)"
  LC_ALL=C join -t $'\t' out/after/sittings-before-closer.tsv out/after/sittings-after-closer.tsv | awk -F '\t' '$2 != $3' > out/after/closer-moved.tsv
  sed 's/^/moved: /' out/after/closer-moved.tsv
  # A FINDING, reported and not failed (a product question, not the rehearsal's invariant): a sitting 111 had already
  # EXPIRED and never scored carries no closure_kind (20270114100000 adds the column with no backfill), and the closer
  # and the lazy check finalise an EXPIRED sitting only when closure_kind is DEADLINE or WINDOW_CLOSED.
  q -At -c "select count(*) from public.assessment_sessions s where s.status = 'EXPIRED' and s.closure_kind is null
              and not exists (select 1 from public.assessment_results r where r.session_id = s.id)" > out/after/closer-stranded.txt
  if [ "$(cat out/after/closer-stranded.txt)" != 0 ]; then
    echo "::warning::$(cat out/after/closer-stranded.txt) sitting(s) EXPIRED at 111 with no result are still unscored after the closer's pass (closure_kind is null, so neither the closer nor the lazy check selects them)"
  fi
  status=0
  while read -r id; do
    grep -q "^$id"$'\t' out/after/closer-moved.tsv || { echo "::error::closer candidate $id did not move"; status=1; }
  done < out/after/closer-candidates.txt
  while IFS=$'\t' read -r id from to; do
    grep -qx "$id" out/after/closer-candidates.txt || { echo "::error::sitting $id moved ($from -> $to) without being a candidate"; status=1; }
  done < out/after/closer-moved.tsv
  exit $status
}

case "${1:-}" in
  fixture) shift; do_fixture "$@" ;;
  stage2) shift; do_stage2 "$@" ;;
  extra) shift; do_extra "$@" ;;
  capture) shift; do_capture "$@" ;;
  probe) shift; do_probe "$@" ;;
  hold-jobs) shift; do_hold_jobs "$@" ;;
  release-jobs) shift; do_release_jobs "$@" ;;
  checks) shift; do_checks "$@" ;;
  closer) shift; do_closer "$@" ;;
  *) echo "usage: rehearse.sh fixture|stage2|extra <phase>|capture|probe|hold-jobs|release-jobs|checks|closer" >&2; exit 2 ;;
esac
