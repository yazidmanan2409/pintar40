#!/usr/bin/env bash
# W9.12, the restore rehearsal's second corrected step: PINTAR's client-role rights and its Storage buckets, re-applied to
# the restored copy from staging's own catalog.
#   restore-posture.sh <staging database URL> <the copy's database URL> <a work directory on the runner>
# Staging is only read (every session there is read only). The copy is written. Only counts, kinds, object and bucket
# NAMES are printed, never a value of any row (the bucket rows' settings stay in the work directory, which the
# workflow discards). Exit 0 when the copy's rights and buckets equal staging's afterwards, 1 otherwise.
set +e -uo pipefail
export LC_ALL=C PGTZ=UTC
S="$1"; C="$2"; W="$3"
here=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$W"
ro() { PGOPTIONS='-c default_transaction_read_only=on' psql -X -q -v ON_ERROR_STOP=1 "$@"; }
rw() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
errs() { grep -E 'ERROR|FATAL' "$1" | sed -E 's/(DETAIL|Key \().*//' | cut -c1-220 | head -5; }
bykind() { cut -d, -f1 "$1" | sort | uniq -c | awk '{printf "%s %s; ", $2, $1}'; }
# rows of the first file not in the second: count, by kind, and the first few as kind object grantee privilege (names)
only() { comm -23 <(sort "$1") <(sort "$2") > "$W/only.tmp"; printf '%s' "$(wc -l < "$W/only.tmp" | tr -d ' ')"
         [ -s "$W/only.tmp" ] && { printf ' ('; bykind "$W/only.tmp"; printf 'first: %s)' "$(head -3 "$W/only.tmp" | sed 's/,[tf]$//' | paste -sd';' - | cut -c1-200)"; }; }
ok=0

# --- 1. rights ---------------------------------------------------------------------------------------------------
ro -f "$here/posture-acl.sql" "$S" > "$W/acl-staging.csv" 2> "$W/acl.err" || { echo "staging's rights could not be read:"; errs "$W/acl.err"; exit 1; }
echo "rights read from staging: $(wc -l < "$W/acl-staging.csv" | tr -d ' ') ($(bykind "$W/acl-staging.csv"))"
ro -f "$here/posture-acl.sql" "$C" > "$W/acl-before.csv" 2> "$W/acl.err" || { echo "the copy's rights could not be read:"; errs "$W/acl.err"; exit 1; }
echo "on the copy before: $(wc -l < "$W/acl-before.csv" | tr -d ' ') rights; staging's lacking there $(only "$W/acl-staging.csv" "$W/acl-before.csv"); the copy's beyond staging's $(only "$W/acl-before.csv" "$W/acl-staging.csv")"
rw -f "$here/posture-apply.sql" "$C" < "$W/acl-staging.csv" > /dev/null 2> "$W/apply.err"
ra=$?
echo "re-applied on the copy: exit $ra"; grep -o 'posture: .*' "$W/apply.err"; [ "$ra" = 0 ] || { errs "$W/apply.err"; ok=1; }
ro -f "$here/posture-acl.sql" "$C" > "$W/acl-after.csv" 2> "$W/acl.err" || { errs "$W/acl.err"; ok=1; }
a=$(only "$W/acl-staging.csv" "$W/acl-after.csv"); b=$(only "$W/acl-after.csv" "$W/acl-staging.csv")
echo "on the copy after: $(wc -l < "$W/acl-after.csv" | tr -d ' ') rights; staging's lacking there $a; the copy's beyond staging's $b"
[ "${a%% *}" = 0 ] && [ "${b%% *}" = 0 ] || ok=1

# --- 2. Storage buckets (the rows, not the files) ------------------------------------------------------------------
cols() { ro -At -c "select quote_ident(column_name::text) from information_schema.columns where table_schema = 'storage' and table_name = 'buckets'" "$1" | sort; }
both=$(comm -12 <(cols "$S") <(cols "$C") | paste -sd, -)
echo "bucket columns: staging $(cols "$S" | wc -l), the copy $(cols "$C" | wc -l), in both $(printf '%s' "$both" | tr ',' '\n' | grep -c .)"
case ",$both," in *',id,'*) ;; *) echo "storage.buckets has no common id column; buckets not re-applied"; exit 1;; esac
set_list=$(printf '%s' "$both" | tr ',' '\n' | grep -vx id | sed 's/.*/& = excluded.&/' | paste -sd, -)
ids() { ro -At -c "select coalesce(string_agg(id || case when public then ' (PUBLIC)' else ' (private)' end, ', ' order by id), '(none)') from storage.buckets" "$1"; }
echo "buckets on staging: $(ids "$S"); on the copy before: $(ids "$C")"
ro -c "copy (select $both from storage.buckets order by id) to stdout with (format csv)" "$S" > "$W/buckets.csv" 2> "$W/b.err" || { errs "$W/b.err"; exit 1; }
rw "$C" > /dev/null 2> "$W/b.err" <<SQL
begin;
create temp table b on commit drop as select $both from storage.buckets with no data;
\copy b from '$W/buckets.csv' with (format csv)
insert into storage.buckets ($both) select $both from b on conflict (id) do update set $set_list;
commit;
SQL
rb=$?
echo "buckets re-applied on the copy: exit $rb; on the copy after: $(ids "$C")"; [ "$rb" = 0 ] || { errs "$W/b.err"; ok=1; }
h() { ro -At -c "select count(*) || ' ' || md5(coalesce(string_agg(r::text, '|' order by r::text), '')) from (select $both from storage.buckets) r" "$1"; }
if [ "$(h "$S")" = "$(h "$C")" ]; then echo "bucket rows (columns in both): the same as staging's"; else echo "bucket rows (columns in both): DIFFER from staging's"; ok=1; fi

exit $ok
