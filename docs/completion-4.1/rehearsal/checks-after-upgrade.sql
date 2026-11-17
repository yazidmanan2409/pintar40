-- The rehearsal's after-upgrade checks: Sharon's blind spots 1 and 2, and the certificate question.
-- Run from the repository root by the workflow, after the upgrade, with psql -v ON_ERROR_STOP=1 -f.
-- It writes only temporary tables (gone with the session) and files under out/after/; the database is not changed.
--
--   BLIND SPOT 1. For every column the target adds to a table that already exists at 111: over the rows that existed
--   at 111 (matched by primary key, from the BEFORE capture), the null count and the distinct count. Then each
--   adding migration's own backfill or default rule is asserted, for the data-rewriting migrations.
--   BLIND SPOT 2. Every table new in the target that holds rows, with its row count; for the two filled from 111's own
--   rows by an INSERT ... SELECT in a migration, the rule is asserted against the BEFORE capture.
--   THE QUICK CERTIFICATE (20261113100000). A certificate sealed from a QUICK sitting before the upgrade: its stored row,
--   its public verification, its verification material and its holder's read are compared with what 111 returned.
--
-- A check is never loosened to pass: a false check fails the step, and the step's output says which and why.

\set ON_ERROR_STOP 1
create temp table r_cols (s text, t text, cols text);
\copy r_cols from 'out/columns-at-111.tsv'
create temp table r_pkcols (s text, t text, pk text);
\copy r_pkcols from 'out/pkcols-at-111.tsv'
create temp table r_pk (tbl text, pk text);
\copy r_pk from 'out/pk-at-111.tsv'
create temp table r_schemas (nspname text);
\copy r_schemas from 'out/r111/schemas.tsv'
create temp table r_banned (id uuid, banned_until timestamptz);
\copy r_banned from 'out/r111/banned.tsv'
create temp table r_email (id uuid);
\copy r_email from 'out/r111/email-accounts.tsv'
create temp table r_postfin (id uuid, person_id uuid, finalized_at timestamptz);
\copy r_postfin from 'out/r111/post-finalized.tsv'
create temp table r_quick (id uuid, eligible boolean);
\copy r_quick from 'out/r111/quick-uncertified.tsv'
create temp table r_cert (id uuid, session_id uuid, row_111 jsonb, verify_111 jsonb, material_111 jsonb);
\copy r_cert from 'out/r111/certificates.tsv'
create temp table r_holder_111 (id uuid, mine jsonb);
\copy r_holder_111 from 'out/r111/holder-reads.tsv'
create temp table r_holder_after (id uuid, mine jsonb);
\copy r_holder_after from 'out/after/holder-reads.tsv'

-- the rows of 111, by table, for single-uuid primary keys (every table the rules below read has one)
create temp view r_id as
  select tbl, substr(pk, 2, 36)::uuid as id from r_pk where pk ~ '^\([0-9a-f-]{36}\)$';

create temp table r_check (ord serial, area text, rule text, ok boolean, detail text);
create temp table r_backfill (tbl text, col text, rows_of_111 bigint, nulls bigint, distinct_values bigint);
create temp table r_newtable (tbl text, rows bigint);

-- ============================================================ blind spot 1: the added columns, over the rows of 111
do $$
declare r record; c record; n bigint; nn bigint; nd bigint;
begin
  for r in select p.s, p.t, p.pk, k.cols from r_pkcols p join r_cols k on k.s = p.s and k.t = p.t order by 1, 2 loop
    for c in select a.attname from pg_attribute a join pg_class t on t.oid = a.attrelid join pg_namespace ns on ns.oid = t.relnamespace
              where ns.nspname = r.s and t.relname = r.t and a.attnum > 0 and not a.attisdropped
                and quote_ident(a.attname) <> all (string_to_array(r.cols, ','))
              order by a.attnum loop
      execute format('select count(*), count(*) filter (where %1$I is null), count(distinct %1$I::text) from %2$I.%3$I '
                     || 'where row(%4$s)::text in (select pk from r_pk where tbl = %5$L)',
                     c.attname, r.s, r.t, r.pk, r.s || '.' || r.t)
        into n, nn, nd;
      insert into r_backfill values (r.s || '.' || r.t, c.attname, n, nn, nd);
    end loop;
  end loop;
end $$;
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', 'every table of 111 has a primary key to match its rows by',
       not exists (select 1 from r_cols k where not exists (select 1 from r_pkcols p where p.s = k.s and p.t = k.t)),
       coalesce('without one: ' || (select string_agg(k.s || '.' || k.t, ', ') from r_cols k
                                     where not exists (select 1 from r_pkcols p where p.s = k.s and p.t = k.t)), 'all have one');

-- 20261021100000: persons.pintar_id drawn for every person (not null, unique, 8 Crockford Base32 characters)
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261021100000 persons.pintar_id: every person of 111 has one, distinct, of the stated shape',
       count(*) filter (where p.pintar_id is null or p.pintar_id !~ '^[0-9A-HJKMNP-TV-Z]{8}$') = 0 and count(distinct p.pintar_id) = count(*),
       count(*) || ' persons of 111, ' || count(distinct p.pintar_id) || ' distinct ids'
  from public.persons p join r_id r on r.tbl = 'public.persons' and r.id = p.id;

-- 20261102100000: pass_mark and its source copied from the definition's mastery_min where the mode is not PRE_TEST
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261102100000 assessment_assignments.pass_mark = mastery_min (BEFORE_SCHOOL_MARKS) unless PRE_TEST, else none',
       count(*) filter (where x.want is distinct from aa.pass_mark
                          or (case when x.want is null then null else 'BEFORE_SCHOOL_MARKS' end) is distinct from aa.pass_mark_source) = 0,
       count(*) || ' assignments of 111, ' || count(aa.pass_mark) || ' with a mark, '
         || count(*) filter (where x.want is distinct from aa.pass_mark) || ' differing from the rule'
  from public.assessment_assignments aa join r_id r on r.tbl = 'public.assessment_assignments' and r.id = aa.id
  join public.assessment_definitions d on d.id = aa.assessment_definition_id
  cross join lateral (select case when d.mode <> 'PRE_TEST' then nullif(d.passing_rules ->> 'mastery_min', '')::numeric end as want) x;
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261102100000 assessment_sessions.pass_mark = mastery_min (BEFORE_SCHOOL_MARKS) unless PRE_TEST, else none',
       count(*) filter (where x.want is distinct from s.pass_mark
                          or (case when x.want is null then null else 'BEFORE_SCHOOL_MARKS' end) is distinct from s.pass_mark_source) = 0,
       count(*) || ' sittings of 111, ' || count(s.pass_mark) || ' with a mark, '
         || count(*) filter (where x.want is distinct from s.pass_mark) || ' differing from the rule'
  from public.assessment_sessions s join r_id r on r.tbl = 'public.assessment_sessions' and r.id = s.id
  join public.assessment_definitions d on d.id = s.assessment_definition_id
  cross join lateral (select case when s.mode <> 'PRE_TEST' then nullif(d.passing_rules ->> 'mastery_min', '')::numeric end as want) x;

-- 20261118100000: learning_context ACADEMIC below a Jenjang, none on the school and its Jenjang; member_kind follows
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261118100000 org_nodes.learning_context ACADEMIC unless INSTITUTION/FACULTY (none), member_kind LEARNER for ACADEMIC',
       count(*) filter (where (case when n.kind not in ('INSTITUTION', 'FACULTY') then 'ACADEMIC' end) is distinct from n.learning_context::text
                          or (case when n.learning_context::text = 'ACADEMIC' then 'LEARNER' end) is distinct from upper(n.member_kind)) = 0,
       count(*) || ' places of 111, ' || count(n.learning_context) || ' ACADEMIC'
  from public.org_nodes n join r_id r on r.tbl = 'public.org_nodes' and r.id = n.id;

-- 20270112195000: a school keeps its own clock, Asia/Jakarta by default
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20270112195000 institutions.zona_waktu = Asia/Jakarta for every institution of 111',
       count(*) filter (where i.zona_waktu is distinct from 'Asia/Jakarta') = 0, count(*) || ' institutions of 111'
  from public.institutions i join r_id r on r.tbl = 'public.institutions' and r.id = i.id;

-- 20270115100000: a question of 111 is at revision 1 and was never edited in the app
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20270115100000 items.revision = 1, edited_at none, for every item of 111',
       count(*) filter (where it.revision <> 1 or it.edited_at is not null or it.edited_by_person_id is not null) = 0, count(*) || ' items of 111'
  from public.items it join r_id r on r.tbl = 'public.items' and r.id = it.id;

-- 20270115100000: a release withdrawn before the migration carries what its first RELEASE_WITHDRAWN audit row recorded
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20270115100000 plp_releases.withdrawn_* = the first RELEASE_WITHDRAWN audit row, for SUPERSEDED releases of 111 only',
       count(*) filter (where l.at is distinct from pr.withdrawn_at or l.actor_person_id is distinct from pr.withdrawn_by_person_id
                          or (l.summary ->> 'reason') is distinct from pr.withdrawal_reason) = 0,
       count(*) || ' releases of 111, ' || count(pr.withdrawn_at) || ' marked withdrawn, ' || count(l.at) || ' by the rule'
  from public.plp_releases pr join r_id r on r.tbl = 'public.plp_releases' and r.id = pr.id
  left join lateral (select a.at, a.actor_person_id, a.summary from public.audit_log a
                      where a.action = 'RELEASE_WITHDRAWN' and a.target_table = 'plp_releases' and a.target_id = pr.id::text
                        and pr.status = 'SUPERSEDED' order by a.at limit 1) l on true;

-- 20270116130000: an account locked with infinity is locked until 2999-12-31 23:59:59 UTC; any other ban is untouched
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20270116130000 auth.users.banned_until: infinity of 111 -> akun_terkunci_sampai(); every other ban unchanged; no infinity left',
       count(*) filter (where (case when b.banned_until = 'infinity' then public.akun_terkunci_sampai() else b.banned_until end)
                              is distinct from u.banned_until) = 0
         and not exists (select 1 from auth.users where banned_until = 'infinity'),
       count(*) filter (where b.banned_until = 'infinity') || ' locked at 111, now until '
         || coalesce(max(u.banned_until) filter (where b.banned_until = 'infinity')::text, '-') || '; '
         || count(*) filter (where b.banned_until <> 'infinity') || ' other ban(s) of 111'
  from r_banned b left join auth.users u on u.id = b.id;

-- 20261011100000: the rows of 111 are not standard; every school now holds both standard reports
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261011100000 report_templates.is_standard false on the rows of 111; each INSTITUTION tenant holds both standard reports',
       (select count(*) from public.report_templates t join r_id r on r.tbl = 'public.report_templates' and r.id = t.id where t.is_standard) = 0
         and not exists (select 1 from public.institutions i where i.tenant_kind = 'INSTITUTION'
                          and (select count(distinct t.standard_report) from public.report_templates t where t.institution_id = i.id
                                and t.is_standard and t.standard_report in ('class_learning_intelligence', 'institution_learning_intelligence')) <> 2),
       (select count(*) from public.report_templates where is_standard) || ' standard templates for '
         || (select count(*) from public.institutions where tenant_kind = 'INSTITUTION') || ' schools';

-- 20270114100000 / 20270119*: the sitting columns added later are empty on the sittings of 111 (no closure, no stop)
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20270114100000 / 20270119130000: no sitting of 111 carries a closure, a hold or an emergency mark at the upgrade',
       count(*) filter (where s.closure_kind is not null or s.frozen_at is not null or s.darurat_sejak is not null
                          or s.darurat_geser_detik <> 0 or s.darurat_dikredit_sampai is not null) = 0,
       count(*) || ' sittings of 111'
  from public.assessment_sessions s join r_id r on r.tbl = 'public.assessment_sessions' and r.id = s.id;

-- 20261201100000: what a certificate says is sealed at issuance from then on; one issued before carries none, and its
-- readers fall back to what 111 read (asserted with the certificate below)
insert into r_check (area, rule, ok, detail)
select 'blind spot 1', '20261201100000 certificates.*_as_issued: none on the certificates of 111 (no backfill; the readers fall back)',
       count(*) filter (where c.institution_as_issued is not null or c.course_title_as_issued is not null
                          or c.course_subject_as_issued is not null or c.language_as_issued is not null) = 0,
       count(*) || ' certificates of 111'
  from public.certificates c join r_id r on r.tbl = 'public.certificates' and r.id = c.id;

-- ============================================================ blind spot 2: the new tables
do $$
declare r record; n bigint;
begin
  for r in select ns.nspname, c.relname from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
            where c.relkind in ('r', 'p')
              and (ns.nspname in ('public', 'auth') or ns.nspname not in (select nspname from r_schemas))
              and ns.nspname !~ '^pg_(toast_)?temp_'
              and not exists (select 1 from r_cols k where k.s = ns.nspname and k.t = c.relname)
            order by 1, 2 loop
    execute format('select count(*) from %I.%I', r.nspname, r.relname) into n;
    insert into r_newtable values (r.nspname || '.' || r.relname, n);
  end loop;
end $$;

-- 20261021100000: account_setup filled from accounts: every EMAIL account of 111 not of an evaluation persona, REQUIRED
insert into r_check (area, rule, ok, detail)
select 'blind spot 2', '20261021100000 account_setup = the EMAIL accounts of 111 not of a persona, each REQUIRED',
       (select count(*) from r_email e where not exists (select 1 from public.account_setup a where a.account_id = e.id)) = 0
         and (select count(*) from public.account_setup a where not exists (select 1 from r_email e where e.id = a.account_id)) = 0
         and (select count(*) from public.account_setup where state::text <> 'REQUIRED') = 0,
       (select count(*) from public.account_setup) || ' rows for ' || (select count(*) from r_email) || ' such accounts; states '
         || coalesce((select string_agg(state::text || '=' || n, ', ') from (select state, count(*) n from public.account_setup group by 1) g), 'none');

-- 20261227100000: result_views filled from the POST_TEST sittings FINALIZED at 111, first seen at their finalisation
insert into r_check (area, rule, ok, detail)
select 'blind spot 2', '20261227100000 result_views = the POST_TEST sittings FINALIZED at 111, person and first_seen_at = finalized_at',
       (select count(*) from r_postfin p left join public.result_views v on v.session_id = p.id
         where v.session_id is null or v.person_id is distinct from p.person_id or v.first_seen_at is distinct from p.finalized_at) = 0
         and (select count(*) from public.result_views v where not exists (select 1 from r_postfin p where p.id = v.session_id)) = 0,
       (select count(*) from public.result_views) || ' rows for ' || (select count(*) from r_postfin) || ' such sittings';

-- ============================================================ the QUICK certificate (20261113100000, Sharon's question)
insert into r_check (area, rule, ok, detail)
select 'certificate', 'the fixture holds a sealed certificate from a QUICK sitting (else the question below is not asked)',
       exists (select 1 from r_cert c join public.assessment_sessions s on s.id = c.session_id
                where s.mode = 'QUICK' and c.row_111 ->> 'status' = 'ISSUED'),
       (select count(*) from r_cert c join public.assessment_sessions s on s.id = c.session_id where s.mode = 'QUICK') || ' QUICK certificate(s)';
insert into r_check (area, rule, ok, detail)
select 'certificate', 'every certificate of 111: its stored row is unchanged over 111''s columns',
       count(*) filter (where not (c.row_111 <@ to_jsonb(a))) = 0, count(*) || ' certificates'
  from r_cert c left join public.certificates a on a.id = c.id;
insert into r_check (area, rule, ok, detail)
select 'certificate', 'every sealed certificate of 111: verify_certificate still returns it, with the same pass, predikat, school and validity (BERLAKU)',
       count(*) filter (where v.pass is distinct from (c.verify_111 ->> 'pass')::boolean
                          or v.predikat is distinct from c.verify_111 ->> 'predikat'
                          or v.institution is distinct from c.verify_111 ->> 'institution'
                          or v.validity is distinct from c.verify_111 ->> 'validity') = 0,
       string_agg(coalesce(v.validity, 'NO ROW') || ' (111: ' || coalesce(c.verify_111 ->> 'validity', 'none') || ')', '; ')
  from r_cert c left join lateral public.verify_certificate((c.row_111 ->> 'verification_token')) v on true
 where c.row_111 ->> 'status' <> 'ELIGIBLE';
insert into r_check (area, rule, ok, detail)
select 'certificate', 'every sealed certificate of 111: its verification date is 111''s, or (issued 17:00-24:00 UTC) the school''s own day (20270113160000)',
       count(*) filter (where v.date is distinct from c.verify_111 ->> 'date'
                          and v.date is distinct from to_char((c.row_111 ->> 'issued_at_iso')::timestamptz at time zone 'Asia/Jakarta', 'YYYY-MM-DD')) = 0,
       string_agg('after ' || coalesce(v.date, '-') || ', at 111 ' || coalesce(c.verify_111 ->> 'date', '-')
                  || ', issued ' || (c.row_111 ->> 'issued_at_iso'), '; ')
  from r_cert c left join lateral public.verify_certificate((c.row_111 ->> 'verification_token')) v on true
 where c.row_111 ->> 'status' <> 'ELIGIBLE';
insert into r_check (area, rule, ok, detail)
select 'certificate', 'every sealed certificate of 111: its verification material (payload, signature, key version) is byte-identical',
       count(*) filter (where to_jsonb(m) is distinct from c.material_111) = 0, count(*) || ' certificates'
  from r_cert c left join lateral public.certificate_verification_material((c.row_111 ->> 'verification_token')) m on true
 where c.row_111 ->> 'status' <> 'ELIGIBLE';
insert into r_check (area, rule, ok, detail)
select 'certificate', 'every certificate of 111: its holder''s read (my_certificate) returns what 111 returned, every field 111 had',
       (select count(*) from r_holder_111) = (select count(*) from r_cert)
         and count(*) filter (where a.mine is null or not (b.mine <@ a.mine)) = 0,
       count(*) || ' holder reads compared'
  from r_holder_111 b left join r_holder_after a on a.id = b.id;
insert into r_check (area, rule, ok, detail)
select 'certificate', '20261113100000 is prospective: a QUICK sitting eligible at 111 and never certified is no longer eligible',
       count(*) filter (where q.eligible and coalesce((select e.eligible from public.certificate_eligibility(q.id) e), true)) = 0
         and count(*) filter (where q.eligible) > 0,
       count(*) || ' uncertified QUICK sitting(s); now: '
         || coalesce(string_agg(distinct (select e.reason from public.certificate_eligibility(q.id) e), '; '), '-')
  from r_quick q;

-- ============================================================ the report, and the verdict
\copy (select * from r_backfill order by 1, 2) to 'out/after/backfill.tsv'
\copy (select * from r_newtable order by 1) to 'out/after/new-tables.tsv'
\copy (select area, rule, case when ok then 'ok' else 'FAILED' end, detail from r_check order by ord) to 'out/after/checks.tsv'
\echo '== blind spot 1: columns added to tables of 111, over the rows of 111 (table, column, rows, nulls, distinct)'
select * from r_backfill order by 1, 2;
\echo '== blind spot 2: tables new in the target, with rows'
select * from r_newtable where rows > 0 order by 1;
\echo '== the checks'
select area, rule, ok, detail from r_check order by ord;
do $$
declare n int; d text;
begin
  select count(*), string_agg(rule || ': ' || coalesce(detail, ''), E'\n') into n, d from r_check where ok is not true;
  if n > 0 then raise exception '% after-upgrade check(s) failed:%', n, E'\n' || d; end if;
end $$;
