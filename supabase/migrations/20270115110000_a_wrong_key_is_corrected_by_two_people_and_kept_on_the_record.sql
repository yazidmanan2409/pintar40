-- ---------------------------------------------------------------------------
-- C1w · THE ITEM WORKBENCH, the database half, part two: A WRONG ANSWER KEY IS CORRECTED
-- (docs/completion-4.1/batches/C1W-COMPLETION.md, «Pre-build review: outcome»; owner decisions O41-11, O41-18, O41-19,
-- O41-21, O41-22; Sharon's blockers 1-3 and C1W-3/C1W-4; Daisy's C1-B1). In 4.0 recompute_result was the platform
-- admin's alone, re-scored against the same sealed key, and allowed one recalculation per sitting (D11).
--
-- (1) WHO. A correction is PROPOSED by the content's owner: CAN_PUBLISH through a role scoped inside the owning school
--     (never a platform admin, for a school's content); for the platform library, a role on the platform's own tenant
--     or the platform admin, who owns it (D-120 Q7). It is CONFIRMED by an independent second person: a different
--     person holding CAN_PUBLISH or CAN_REVIEW over that content in the same tenant (so a school with one administrator
--     confirms through its head of department). The proposer never confirms (the row itself refuses it). Whether the
--     confirmer wrote the faulty revision is recorded, not refused. A question takes one waiting proposal at a time.
--     A decline returns it with a reason.
-- (2) BEFORE CONFIRMATION, koreksi_kunci_dampak gives the exact counts by THE RULE THE RECALCULATION USES (the same
--     two functions, sesi_peta_kunci and evaluate_session_kunci): finished sittings, schools, results that change,
--     target decisions that change, certificates to be reviewed, certificates newly earnable, and sittings still open.
--     The proposer of platform content sees other schools as counts only.
-- (3) ON CONFIRMATION, one transaction, serialised per course line (pg_advisory_xact_lock):
--       * a corrected revision of the line's head is made (every question pointing to its original; the corrected
--         question carries the new key), authored by the proposer and reviewed, locked and published on the
--         confirmer's word under the correction's authority (pintar.koreksi_kunci; enforce_content_status accepts it
--         for these rows only); the head's release is replaced by it; a release its publisher withdrew stays stopped:
--         its correction is published and withdrawn with it;
--       * platform content is distributed onward to every school that held the replaced release;
--       * existing assignments' new starts move to the corrected release (Sharon, blocker 3), through a move recorded
--         as move_learning_assignment_release records one, even after starts; the post-test never repeats a pre-test
--         question across the move, because INV-24's exclusion now follows lineage;
--       * every FINISHED sitting that presented the question (or an unchanged earlier version of it) gets a NEW result,
--         written by hitung_ulang_koreksi_kunci under the correction's authority (recompute_result is untouched: its
--         platform-only authority and D11, PR011, stay exactly). It supersedes the result in force, scores the ORIGINAL
--         recorded responses against the complete currently authorized key (every governed correction so far, never an
--         adjustment of an earlier corrected score: O41-22), and records its scoring basis (assessment_result_bases):
--         for each original question, the question whose key it used, that key, and the release it belongs to;
--       * a sitting OPEN at that moment is recalculated the moment it finalises, by whatever path (the learner, the
--         teacher's hand-in, the A1 deadline job): a trigger on the root result asks the same function;
--       * a certificate whose result changed (even with the same outcome) has a review opened (certificate_reviews);
--       * each affected issuing school gets a notice listing only its own sittings and certificates.
-- (4) THE CHAIN. Every earlier result, basis, reason, authorization and timestamp stays; exactly one result is current
--     (the one nothing supersedes, results_one_successor); two corrections at once wait for each other on the line's
--     lock and on the sitting's row, and a lost race is answered CORRECTION_CONCURRENT, never a raw constraint error.
-- (5) THE READERS (O41-21): the learner's result page, map and review, Kenaikan's pair and the certificate decision
--     read the governed corrected result when one exists (hasil_murid_id), and say so (dikoreksi); an ordinary
--     recalculation keeps D14 exactly (the learner keeps the sealed original). The teacher's reports already read the
--     result in force. riwayat_hasil_sesi gives the teacher the whole chain; the sealed original stays traceable.
-- (6) CERTIFICATES (O41-19, Sharon C1W-4): certificate_reviews is append-only beside the certificate; nothing of the
--     certificate itself changes. verify_certificate answers DITINJAU while a review is open; DICABUT and DIGANTIKAN
--     take precedence. The issuing school's CAN_PUBLISH (the platform admin for a Professional Development
--     certificate) confirms it (it stays ISSUED) or revokes it through revoke_certificate; either closes the review. A
--     decided certificate affected again gets a new review. Never revoked or revalidated silently.
-- Refusals are PR190 with the code in DETAIL (koreksi_tolak). Every act writes an audit row.
-- ---------------------------------------------------------------------------

create or replace function public.koreksi_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR190',
    detail  = p_code,
    message = case p_code
      when 'CORRECTION_NOT_ALLOWED'          then 'a key correction is proposed by the content''s owner: CAN_PUBLISH through a role of the owning school (the platform library: its own tenant)'
      when 'CORRECTION_UNKNOWN'              then 'this key correction or question is not known'
      when 'CORRECTION_ITEM_NOT_PUBLISHED'   then 'only a question of published material has its key corrected'
      when 'CORRECTION_NOT_IN_HEAD'          then 'this question was changed in a newer version of the package; that version''s question is the one corrected'
      when 'CORRECTION_OPEN_REVISION'        then 'an unfinished revision of this package is open: finish it (submit, review, lock, publish) or discard it (buang_draf), then propose or confirm the key correction again'
      when 'CORRECTION_KEY_INVALID'          then 'the new key names options of this question: exactly one for a single-answer question, at least one otherwise'
      when 'CORRECTION_KEY_UNCHANGED'        then 'the new key is the key the question already has'
      when 'CORRECTION_REASON_REQUIRED'      then 'the reason is 10 to 300 characters'
      when 'CORRECTION_PENDING'              then 'a correction of this question is already waiting for its second person'
      when 'CORRECTION_ALREADY_DECIDED'      then 'this correction has already been confirmed or declined'
      when 'CORRECTION_OWN_PROPOSAL'         then 'the person who proposed a correction does not confirm or decline it'
      when 'CORRECTION_CONFIRM_NOT_ALLOWED'  then 'a correction is confirmed by another person holding CAN_PUBLISH or CAN_REVIEW over this content in its own tenant'
      when 'CORRECTION_PROPOSER_LAPSED'      then 'the person who proposed this correction no longer owns the content; it is proposed again'
      when 'CORRECTION_STALE'                then 'the question changed after this correction was proposed; it is proposed again'
      when 'CORRECTION_NOT_READY'            then 'the corrected revision could not be published as it stands'
      when 'CORRECTION_SITTING_NOT_AFFECTED' then 'this sitting did not present the corrected question; it is not recalculated'
      when 'CORRECTION_CONCURRENT'           then 'another correction recalculated this sitting at the same moment; nothing was written, try again'
      when 'RESULT_NOT_VISIBLE'              then 'this sitting''s results are read by its own learner and by those who may see them'
      when 'CERT_REVIEW_UNKNOWN'             then 'this certificate review is not known'
      when 'CERT_REVIEW_NOT_ALLOWED'         then 'a certificate review is decided by the issuing school''s CAN_PUBLISH (a Professional Development certificate: the platform admin)'
      when 'CERT_REVIEW_DECIDED'             then 'this certificate review has already been decided'
      when 'CERT_REVIEW_DECISION_INVALID'    then 'a certificate review is decided CONFIRMED or REVOKED'
      when 'CERT_REVIEW_REASON_REQUIRED'     then 'the decision records why, in 10 to 300 characters'
      else 'the correction could not be saved' end;
end $$;
revoke all on function public.koreksi_tolak(text) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ who
-- A capability held through a role scoped inside one tenant: never the platform admin's own, unscoped role.
create or replace function public.peran_tenant_punya(p_person uuid, p_capability text, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.role_assignments ra join public.org_nodes n on n.id = ra.scope_node_id
                  where ra.person_id = p_person and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
                    and ra.role <> 'SYSTEM_ADMIN' and n.institution_id = p_institution
                    and p_capability = any (public.role_capabilities(ra.role)))
$$;
revoke all on function public.peran_tenant_punya(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.orang_admin_platform(p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.role_assignments ra
                  where ra.person_id = p_person and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null
                    and now() >= ra.valid_from and now() < ra.valid_until)
$$;
revoke all on function public.orang_admin_platform(uuid) from public, anon, authenticated;

create or replace function public.tenant_platform(p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.institutions i where i.id = p_institution and i.tenant_kind = 'PLATFORM_CANONICAL')
$$;
revoke all on function public.tenant_platform(uuid) from public, anon, authenticated;

-- The content's owner (O41-18): school content, CAN_PUBLISH through a role inside that school; platform content, a role
-- on the platform's own tenant, or the platform admin.
create or replace function public.koreksi_pemilik(p_person uuid, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null
     and (public.peran_tenant_punya(p_person, 'CAN_PUBLISH', p_institution)
          or (public.tenant_platform(p_institution) and public.orang_admin_platform(p_person)))
$$;
revoke all on function public.koreksi_pemilik(uuid, uuid) from public, anon, authenticated;

-- The independent second person (Sharon, blocker): CAN_PUBLISH or CAN_REVIEW over the content in the same tenant.
create or replace function public.koreksi_penegas(p_person uuid, p_institution uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null
     and (public.peran_tenant_punya(p_person, 'CAN_PUBLISH', p_institution)
          or public.peran_tenant_punya(p_person, 'CAN_REVIEW', p_institution)
          or (public.tenant_platform(p_institution) and public.orang_admin_platform(p_person)))
$$;
revoke all on function public.koreksi_penegas(uuid, uuid) from public, anon, authenticated;

-- The first course of a course's line.
create or replace function public.kursus_akar(p_course uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  with recursive up as (
    select c.id, c.supersedes_course_id, 0 as d from public.courses c where c.id = p_course
    union all
    select c.id, c.supersedes_course_id, up.d + 1 from public.courses c join up on c.id = up.supersedes_course_id where up.d < 64)
  select id from up order by d desc limit 1
$$;
revoke all on function public.kursus_akar(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ what is recorded
create table public.key_corrections (
  id                     uuid primary key default gen_random_uuid(),
  institution_id         uuid not null references public.institutions(id),
  line_root_course_id    uuid not null references public.courses(id),
  asked_item_id          uuid not null references public.items(id),
  item_id                uuid not null references public.items(id),
  course_id              uuid not null references public.courses(id),
  release_id             uuid not null references public.plp_releases(id),
  question_digest        text not null,
  key_before             text[] not null,
  key_after              text[] not null,
  reason                 text not null check (char_length(btrim(reason)) between 10 and 300),
  proposed_by_person_id  uuid not null references public.persons(id),
  proposed_at            timestamptz not null default now(),
  status                 text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'DECLINED')),
  decided_by_person_id   uuid references public.persons(id),
  decided_at             timestamptz,
  decline_reason         text,
  confirmer_wrote_faulty boolean,
  head_course_id         uuid references public.courses(id),
  corrected_course_id    uuid references public.courses(id),
  corrected_release_id   uuid references public.plp_releases(id),
  corrected_item_id      uuid references public.items(id),
  outcome                jsonb,
  constraint key_corrections_decision_shape
    check ((status = 'PENDING' and decided_by_person_id is null and decided_at is null and decline_reason is null)
        or (status = 'CONFIRMED' and decided_by_person_id is not null and decided_at is not null and decline_reason is null)
        or (status = 'DECLINED' and decided_by_person_id is not null and decided_at is not null
            and char_length(btrim(decline_reason)) between 10 and 300)),
  -- independent confirmation, in the row itself
  constraint key_corrections_independent check (decided_by_person_id is null or decided_by_person_id <> proposed_by_person_id),
  constraint key_corrections_key_changes check (key_after is distinct from key_before and cardinality(key_after) > 0)
);
create unique index key_corrections_one_pending on public.key_corrections (item_id) where status = 'PENDING';
create index key_corrections_line_idx on public.key_corrections (line_root_course_id, status);
create index key_corrections_institution_idx on public.key_corrections (institution_id, status);
alter table public.key_corrections enable row level security;
revoke all on table public.key_corrections from public, anon, authenticated;
insert into public.record_class_registry values
  ('key_corrections', 'INSTITUTION_SCOPED',
   'C1w (O41-11, O41-18, O41-22): a proposed answer-key correction, its independent decision and what it did; read through functions only');
create trigger key_corrections_tenant_immutable before update on public.key_corrections
  for each row execute function public.enforce_record_tenant_immutable();

-- Decided once; what a confirmation did is written once, beside it; never deleted.
create or replace function public.key_corrections_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_kolom text;
begin
  if tg_op = 'DELETE' then raise exception 'a key correction is kept, never deleted'; end if;
  if old.status = 'PENDING' then
    if (to_jsonb(new) - 'status' - 'decided_by_person_id' - 'decided_at' - 'decline_reason' - 'confirmer_wrote_faulty'
        - 'head_course_id' - 'corrected_course_id' - 'corrected_release_id' - 'corrected_item_id' - 'outcome')
       is distinct from
       (to_jsonb(old) - 'status' - 'decided_by_person_id' - 'decided_at' - 'decline_reason' - 'confirmer_wrote_faulty'
        - 'head_course_id' - 'corrected_course_id' - 'corrected_release_id' - 'corrected_item_id' - 'outcome') then
      raise exception 'only the decision of a key correction is written after it was proposed';
    end if;
    return new;
  end if;
  if (to_jsonb(new) - 'head_course_id' - 'corrected_course_id' - 'corrected_release_id' - 'corrected_item_id' - 'outcome')
     is distinct from (to_jsonb(old) - 'head_course_id' - 'corrected_course_id' - 'corrected_release_id' - 'corrected_item_id' - 'outcome') then
    raise exception 'a decided key correction is not rewritten';
  end if;
  foreach v_kolom in array array['head_course_id', 'corrected_course_id', 'corrected_release_id', 'corrected_item_id', 'outcome'] loop
    if (to_jsonb(old) -> v_kolom) is not null and (to_jsonb(old) -> v_kolom) <> 'null'::jsonb
       and (to_jsonb(new) -> v_kolom) is distinct from (to_jsonb(old) -> v_kolom) then
      raise exception 'what a key correction did is recorded once (%)', v_kolom;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.key_corrections_guard() from public, anon, authenticated;
create trigger key_corrections_guard before update or delete on public.key_corrections
  for each row execute function public.key_corrections_guard();

-- The basis a governed recalculation scored on (Sharon, blocker 2), one row per result it wrote. Append-only.
--   basis = {"koreksi": [correction ids in force], "soal": {"<original item>": {"soal": <item whose key>, "kunci": [..],
--            "terbitan": <release of that item>}}}
create table public.assessment_result_bases (
  result_id         uuid primary key references public.assessment_results(id),
  session_id        uuid not null references public.assessment_sessions(id),
  institution_id    uuid not null references public.institutions(id),
  key_correction_id uuid not null references public.key_corrections(id),
  supersedes_result_id uuid not null references public.assessment_results(id),
  basis             jsonb not null check (jsonb_typeof(basis) = 'object'),
  written_at        timestamptz not null default now()
);
create index assessment_result_bases_session_idx on public.assessment_result_bases (session_id, written_at);
alter table public.assessment_result_bases enable row level security;
revoke all on table public.assessment_result_bases from public, anon, authenticated;
insert into public.record_class_registry values
  ('assessment_result_bases', 'INSTITUTION_SCOPED',
   'C1w (Sharon, blocker 2): the corrected key and the item mapping a governed recalculation scored on; read through functions only');

-- The certificate review (O41-19, Sharon C1W-4): beside the certificate, never in it. One open at a time per
-- certificate; decided once.
create table public.certificate_reviews (
  id                     uuid primary key default gen_random_uuid(),
  certificate_id         uuid not null references public.certificates(id),
  institution_id         uuid not null references public.institutions(id),
  session_id             uuid not null references public.assessment_sessions(id),
  opened_at              timestamptz not null default now(),
  opened_by_result_id    uuid not null references public.assessment_results(id),
  previous_result_id     uuid not null references public.assessment_results(id),
  key_correction_id      uuid not null references public.key_corrections(id),
  decided_at             timestamptz,
  decided_by_person_id   uuid references public.persons(id),
  decision               text check (decision in ('CONFIRMED', 'REVOKED')),
  reason                 text,
  constraint certificate_reviews_decision_shape
    check ((decision is null and decided_at is null and decided_by_person_id is null and reason is null)
        or (decision is not null and decided_at is not null and decided_by_person_id is not null
            and char_length(btrim(reason)) between 10 and 300))
);
create unique index certificate_reviews_one_open on public.certificate_reviews (certificate_id) where decision is null;
create index certificate_reviews_institution_idx on public.certificate_reviews (institution_id, decision);
alter table public.certificate_reviews enable row level security;
revoke all on table public.certificate_reviews from public, anon, authenticated;
insert into public.record_class_registry values
  ('certificate_reviews', 'INSTITUTION_SCOPED',
   'C1w (O41-19): a certificate under review after its supporting result changed, and the issuing school''s decision');

-- A notice to each affected issuing school: its own sittings and certificates only.
create table public.key_correction_notices (
  id                uuid primary key default gen_random_uuid(),
  key_correction_id uuid not null references public.key_corrections(id),
  institution_id    uuid not null references public.institutions(id),
  session_ids       uuid[] not null default '{}',
  certificate_review_ids uuid[] not null default '{}',
  created_at        timestamptz not null default now(),
  unique (key_correction_id, institution_id)
);
alter table public.key_correction_notices enable row level security;
revoke all on table public.key_correction_notices from public, anon, authenticated;
insert into public.record_class_registry values
  ('key_correction_notices', 'INSTITUTION_SCOPED',
   'C1w: a governed key correction''s notice to one issuing school, naming only its own sittings and certificate reviews');

create or replace function public.c1w_tambahan_saja() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_table_name = 'certificate_reviews' and tg_op = 'UPDATE' and old.decision is null
     and (to_jsonb(new) - 'decided_at' - 'decided_by_person_id' - 'decision' - 'reason')
         = (to_jsonb(old) - 'decided_at' - 'decided_by_person_id' - 'decision' - 'reason') then
    return new;
  end if;
  if tg_table_name = 'key_correction_notices' and tg_op = 'UPDATE'
     and new.id = old.id and new.key_correction_id = old.key_correction_id and new.institution_id = old.institution_id
     and new.session_ids @> old.session_ids and new.certificate_review_ids @> old.certificate_review_ids then
    return new;
  end if;
  raise exception '% is history: it is appended to, never rewritten or deleted', tg_table_name;
end $$;
revoke all on function public.c1w_tambahan_saja() from public, anon, authenticated;
create trigger assessment_result_bases_append_only before update or delete on public.assessment_result_bases
  for each row execute function public.c1w_tambahan_saja();
create trigger certificate_reviews_append_only before update or delete on public.certificate_reviews
  for each row execute function public.c1w_tambahan_saja();
create trigger key_correction_notices_append_only before update or delete on public.key_correction_notices
  for each row execute function public.c1w_tambahan_saja();

-- ═══════════════════════════════════════════════════════════ the corrected revision is published on the correction's authority
-- Inside tegaskan_koreksi_kunci alone (pintar.koreksi_kunci names the correction its caller confirmed in this very
-- transaction), the rows of the corrected course, its release, and the head release it replaces take their content
-- steps on the correction's authority: the proposer owns the content (CAN_PUBLISH), the confirmer is its second
-- person. The four-eyes rules (reviewer is the caller, never the author) are unchanged.
create or replace function public.koreksi_kunci_berwenang(p_table text, p_row jsonb)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
declare k public.key_corrections; v_course uuid; v_id uuid;
begin
  begin
    v_id := nullif(current_setting('pintar.koreksi_kunci', true), '')::uuid;
  exception when others then return false; end;
  if v_id is null then return false; end if;
  select * into k from public.key_corrections
   where id = v_id and status = 'CONFIRMED' and decided_by_person_id = public.current_person_id() and decided_at = now();
  if k.id is null then return false; end if;
  v_course := case p_table
    when 'courses' then (p_row ->> 'id')::uuid
    when 'modules' then (p_row ->> 'course_id')::uuid
    when 'lessons' then (select m.course_id from public.modules m where m.id = (p_row ->> 'module_id')::uuid)
    when 'items' then (select m.course_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = (p_row ->> 'lesson_id')::uuid)
    when 'assessment_definitions' then coalesce((p_row ->> 'course_id')::uuid,
                                                (select m.course_id from public.modules m where m.id = (p_row ->> 'module_id')::uuid))
    when 'plp_releases' then (p_row ->> 'course_id')::uuid end;
  return v_course is not null
     and (v_course = k.corrected_course_id or (p_table = 'plp_releases' and v_course = k.head_course_id));
end $$;
revoke all on function public.koreksi_kunci_berwenang(text, jsonb) from public, anon, authenticated;

do $$
declare v_def text := pg_get_functiondef('public.enforce_content_status()'::regprocedure); v_cap text; v_old text; n int;
begin
  foreach v_cap in array array['CAN_REVIEW', 'CAN_FREEZE_RELEASE', 'CAN_PUBLISH'] loop
    v_old := format('if not public.can_in_institution(%L, v_institution) then', v_cap);
    n := (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old);
    if n <> (case when v_cap = 'CAN_PUBLISH' then 2 else 1 end) then
      raise exception 'C1w: enforce_content_status asks % % time(s), not where it did', v_cap, n;
    end if;
    v_def := replace(v_def, v_old, format('if not public.can_in_institution(%L, v_institution) and not public.koreksi_kunci_berwenang(tg_table_name, to_jsonb(new)) then', v_cap));
  end loop;
  execute v_def;
end $$;

-- ═══════════════════════════════════════════════════════════ the key a question is scored by now
-- One step forward in a question's line that keeps it the same question for a learner who saw it: a child in a course
-- whose release was published, reading the same (type, stem, stimulus, every option's label and text), and either
-- keeping the key (an unchanged copy) or made by a confirmed key correction. An ordinary revision that changed the key
-- is a new question as far as an earlier sitting goes: only a governed correction re-scores the past.
create or replace function public.soal_anak_sah(p_item uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select c.id
    from public.items c
    join public.lessons l on l.id = c.lesson_id join public.modules m on m.id = l.module_id
    join public.courses co on co.id = m.course_id
    join public.plp_releases r on r.course_id = co.id and r.published_at is not null
   where c.supersedes_item_id = p_item and co.discarded_at is null
     and public.soal_sidik_isi(c.id) = public.soal_sidik_isi(p_item)
     and (public.soal_kunci(c.id) = public.soal_kunci(p_item)
          or exists (select 1 from public.key_corrections k where k.corrected_course_id = co.id and k.status = 'CONFIRMED'))
   order by r.published_at desc, c.id
   limit 1
$$;
revoke all on function public.soal_anak_sah(uuid) from public, anon, authenticated;

-- The question's newest such version (the question whose key is in force for it).
create or replace function public.soal_ujung(p_item uuid)
returns uuid language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v uuid := p_item; v_next uuid; n int := 0;
begin
  loop
    v_next := public.soal_anak_sah(v);
    exit when v_next is null or n > 64;
    v := v_next; n := n + 1;
  end loop;
  return v;
end $$;
revoke all on function public.soal_ujung(uuid) from public, anon, authenticated;

-- The question and every earlier version of it whose newest version is this one: the questions a sitting may have
-- presented for its key to be this question's.
create or replace function public.soal_leluhur_sah(p_item uuid)
returns table (item_id uuid) language sql stable security definer set search_path = public, pg_temp as $$
  with recursive up as (
    select p_item as id, 0 as d
    union all
    select i.supersedes_item_id, up.d + 1 from public.items i join up on i.id = up.id
     where i.supersedes_item_id is not null and up.d < 64 and public.soal_anak_sah(i.supersedes_item_id) = up.id)
  select id from up
$$;
revoke all on function public.soal_leluhur_sah(uuid) from public, anon, authenticated;

-- Did this sitting present an earlier version of the corrected question (one scored by a key the correction replaced).
-- A sitting that presented the corrected question itself was scored by its key already and is not affected.
create or replace function public.sesi_terdampak(p_session uuid, p_item uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.presented_items p
                  where p.session_id = p_session and p.item_id <> p_item
                    and p.item_id in (select x.item_id from public.soal_leluhur_sah(p_item) x))
$$;
revoke all on function public.sesi_terdampak(uuid, uuid) from public, anon, authenticated;

-- THE RULE (shared by the preview and the recalculation): for each question a sitting presented, the question whose
-- key is in force for it and that key. p_hipotesis {item, kunci} is a proposal not yet confirmed: where the newest
-- version is that item, its key is the proposed one.
create or replace function public.sesi_peta_kunci(p_session uuid, p_hipotesis jsonb default null)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_object_agg(x.item_id::text, jsonb_build_object(
           'soal', u.ujung,
           'kunci', to_jsonb(case when p_hipotesis is not null and u.ujung = (p_hipotesis ->> 'item')::uuid
                                  then array(select e from jsonb_array_elements_text(p_hipotesis -> 'kunci') e order by e collate "C")
                                  else public.soal_kunci(u.ujung) end),
           'terbitan', (select r.id from public.plp_releases r where r.course_id = public.soal_kursus(u.ujung)))), '{}'::jsonb)
    from (select distinct p.item_id from public.presented_items p where p.session_id = p_session) x
    cross join lateral (select public.soal_ujung(x.item_id) as ujung) u
$$;
revoke all on function public.sesi_peta_kunci(uuid, jsonb) from public, anon, authenticated;

-- grade_response with the key given (the original item's type and the learner's recorded value).
create or replace function public.grade_kunci(p_item uuid, p_value jsonb, p_kunci text[])
returns numeric language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_contract text; v_chosen text[]; v_correct text[];
begin
  select r.scorer_contract into v_contract
    from public.items i join public.item_type_registry r on r.item_type = i.item_type where i.id = p_item;
  if v_contract is null then raise exception 'unknown item %', p_item; end if;
  if p_value is null then return 0; end if;
  v_correct := array(select x from unnest(coalesce(p_kunci, '{}')) x order by x collate "C");
  if v_contract = 'exact_option' then
    if jsonb_typeof(p_value -> 'pilihan') <> 'string' then return 0; end if;
    return case when (p_value ->> 'pilihan') = any (v_correct) then 1 else 0 end;
  elsif v_contract = 'set_match' then
    if jsonb_typeof(p_value -> 'pilihan') <> 'array' then return 0; end if;
    v_chosen := array(select d.y from (select distinct t.x as y from jsonb_array_elements_text(p_value -> 'pilihan') t(x)) d
                       order by d.y collate "C");
    return case when coalesce(v_chosen, '{}') = coalesce(v_correct, '{}') then 1 else 0 end;
  end if;
  raise exception 'scorer contract "%" has no implementation in this phase (OD-8)', v_contract;
end $$;
revoke all on function public.grade_kunci(uuid, jsonb, text[]) from public, anon, authenticated;

-- evaluate_session, line for line, with each recorded answer graded against the key the map gives.
create or replace function public.evaluate_session_kunci(p_session uuid, p_peta jsonb)
returns table (item_total integer, answered integer, correct integer, mastery numeric, per_domain jsonb,
               safety_total integer, safety_correct integer, safety_gate_passed boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return query
  with graded as (
    select f.presented_item_id, f.item_id, f.value, f.is_safety_critical,
           case when f.value is null then 0
                else public.grade_kunci(f.item_id, f.value,
                       coalesce(array(select jsonb_array_elements_text(p_peta -> f.item_id::text -> 'kunci')),
                                public.soal_kunci(f.item_id))) end as score,
           (f.value is not null) as answered
      from public.session_final_responses(p_session) f
  ),
  domains as (
    select lo.code, count(*)::integer as total, sum(g.score)::integer as benar
      from graded g
      join public.items i on i.id = g.item_id
      join public.learning_objectives lo on lo.id = any (i.objective_ids)
     group by lo.code
  )
  select count(*)::integer,
         count(*) filter (where g.answered)::integer,
         coalesce(sum(g.score), 0)::integer,
         case when count(*) = 0 then null else round(coalesce(sum(g.score), 0)::numeric / count(*), 4) end,
         coalesce((select jsonb_object_agg(d.code, jsonb_build_object('benar', d.benar, 'total', d.total,
                            'penguasaan', round(d.benar::numeric / d.total, 4))) from domains d), '{}'::jsonb),
         count(*) filter (where g.is_safety_critical)::integer,
         coalesce(sum(g.score) filter (where g.is_safety_critical), 0)::integer,
         (count(*) filter (where g.is_safety_critical) = coalesce(sum(g.score) filter (where g.is_safety_critical), 0))
    from graded g;
end $$;
revoke all on function public.evaluate_session_kunci(uuid, jsonb) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the chain of results
-- The result in force: the one nothing supersedes.
create or replace function public.hasil_terkini_id(p_session uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select r.id from public.assessment_results r
   where r.session_id = p_session
     and not exists (select 1 from public.assessment_results x where x.supersedes_result_id = r.id)
   order by r.computed_at desc, r.id limit 1
$$;
revoke all on function public.hasil_terkini_id(uuid) from public, anon, authenticated;

-- The learner's result (O41-21): the latest governed correction, else the sealed original (an ordinary recalculation
-- keeps D14: the learner and the certificate keep the original).
create or replace function public.hasil_murid_id(p_session uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select b.result_id from public.assessment_result_bases b where b.session_id = p_session
        and not exists (select 1 from public.assessment_result_bases b2 where b2.session_id = p_session and b2.supersedes_result_id = b.result_id)
      limit 1),
    (select r.id from public.assessment_results r where r.session_id = p_session and r.supersedes_result_id is null))
$$;
revoke all on function public.hasil_murid_id(uuid) from public, anon, authenticated;

-- certificate_eligibility's own determination, for any result values (the preview's «newly earnable» and the
-- certificate decision ask the same conditions).
create or replace function public.sertifikat_layak_dengan(p_session uuid, p_mastery numeric, p_gate boolean)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select m.certifies from public.mode_policy m join public.assessment_sessions s on s.mode = m.mode where s.id = p_session), false)
     and exists (select 1 from public.official_sessions o where o.id = p_session)
     and p_mastery is not null
     and (select s.pass_mark from public.assessment_sessions s where s.id = p_session) is not null
     and coalesce(p_gate, false)
     and p_mastery >= (select s.pass_mark from public.assessment_sessions s where s.id = p_session)
$$;
revoke all on function public.sertifikat_layak_dengan(uuid, numeric, boolean) from public, anon, authenticated;

-- The certificate a sitting holds now: issued, nothing replacing it.
create or replace function public.sertifikat_sesi_kini(p_session uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select c.id from public.certificates c where c.session_id = p_session and c.status = 'ISSUED'
   order by c.issued_at desc limit 1
$$;
revoke all on function public.sertifikat_sesi_kini(uuid) from public, anon, authenticated;

create or replace function public.sertifikat_ditinjau(p_certificate uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.certificate_reviews v where v.certificate_id = p_certificate and v.decision is null)
$$;
revoke all on function public.sertifikat_ditinjau(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (3) the governed recalculation of one sitting
-- Under the correction's authority, never widening recompute_result. On the sitting's row lock: the result in force is
-- superseded by a new one scored from the original recorded responses against the complete currently authorized key,
-- with its basis; a certificate whose result changed has a review opened. A sitting the correction does not reach is
-- refused. Returns the new result, or null for a sitting not yet finished (it is recalculated when it finishes).
create or replace function public.hitung_ulang_koreksi_kunci(p_session uuid, p_correction uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare k public.key_corrections; s public.assessment_sessions; v_head public.assessment_results; v_peta jsonb; e record;
        v_id uuid; v_berubah boolean; v_cert uuid; v_review uuid; v_koreksi jsonb;
begin
  select * into k from public.key_corrections where id = p_correction and status = 'CONFIRMED';
  if k.id is null or k.corrected_item_id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  if not public.sesi_terdampak(p_session, k.corrected_item_id) then perform public.koreksi_tolak('CORRECTION_SITTING_NOT_AFFECTED'); end if;
  select * into v_head from public.assessment_results where id = public.hasil_terkini_id(p_session);
  if v_head.id is null then return null; end if;

  v_peta := public.sesi_peta_kunci(p_session, null);
  select * into e from public.evaluate_session_kunci(p_session, v_peta);
  select coalesce(jsonb_agg(x.id order by x.decided_at), '[]'::jsonb) into v_koreksi
    from public.key_corrections x
   where x.status = 'CONFIRMED'
     and x.corrected_item_id in (select y.item_id from jsonb_each(v_peta) m
                                  cross join lateral public.soal_leluhur_sah((m.value ->> 'soal')::uuid) y);
  begin
    insert into public.assessment_results (
      session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version, mastery, per_domain,
      safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason)
    values (
      p_session, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'SYNTHETIC',
      public.engine_version(), coalesce(s.scoring_policy_version, v_head.scoring_policy_version), e.mastery, e.per_domain,
      e.safety_gate_passed,
      jsonb_build_object('item_total', e.item_total, 'answered', e.answered, 'correct', e.correct,
                         'safety_total', e.safety_total, 'safety_correct', e.safety_correct),
      v_head.id, 'KOREKSI_KUNCI: ' || k.reason)
    returning id into v_id;
  exception when unique_violation then
    perform public.koreksi_tolak('CORRECTION_CONCURRENT');
  end;
  insert into public.assessment_result_bases (result_id, session_id, institution_id, key_correction_id, supersedes_result_id, basis)
  values (v_id, p_session, s.institution_id, k.id, v_head.id, jsonb_build_object('koreksi', v_koreksi, 'soal', v_peta));

  v_berubah := v_head.mastery is distinct from e.mastery or v_head.safety_gate_passed is distinct from e.safety_gate_passed
            or v_head.per_domain is distinct from e.per_domain;
  if v_berubah then
    v_cert := public.sertifikat_sesi_kini(p_session);
    if v_cert is not null and not public.sertifikat_ditinjau(v_cert) then
      insert into public.certificate_reviews (certificate_id, institution_id, session_id, opened_by_result_id, previous_result_id, key_correction_id)
      select v_cert, c.institution_id, p_session, v_id, v_head.id, k.id from public.certificates c where c.id = v_cert
      returning id into v_review;
      perform public.audit_write('certificate.review_opened', 'certificates', v_cert::text, s.institution_id,
        jsonb_build_object('certificate_id', v_cert, 'review', v_review, 'session_id', p_session, 'key_correction', k.id,
                           'from', jsonb_build_object('result', v_head.id, 'mastery', v_head.mastery),
                           'to', jsonb_build_object('result', v_id, 'mastery', e.mastery), 'certificate_status', 'ISSUED'));
    end if;
  end if;
  perform public.audit_write('assessment_result.key_corrected', 'assessment_results', v_id::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'supersedes', v_head.id, 'new_result', v_id, 'key_correction', k.id,
                       'reason', k.reason, 'corrections_in_force', v_koreksi,
                       'from', jsonb_build_object('mastery', v_head.mastery, 'safety_gate_passed', v_head.safety_gate_passed),
                       'to', jsonb_build_object('mastery', e.mastery, 'safety_gate_passed', e.safety_gate_passed),
                       'changed', v_berubah, 'certificate_review', v_review,
                       'noticed_by', case when public.current_person_id() is null then 'schedule' else 'request' end));
  return v_id;
end $$;
revoke all on function public.hitung_ulang_koreksi_kunci(uuid, uuid) from public, anon, authenticated;

-- A sitting open when a correction was confirmed is recalculated the moment its first result is written, whatever
-- wrote it (the learner, the teacher's hand-in, the A1 deadline job). The line's lock makes it wait for a
-- confirmation under way, so a sitting is never finished between a confirmation's count and its recalculations.
create or replace function public.koreksi_kunci_saat_selesai() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_root uuid; v_k uuid;
begin
  select public.kursus_akar(r.course_id) into v_root
    from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id where s.id = new.session_id;
  if v_root is null or not exists (select 1 from public.key_corrections k where k.line_root_course_id = v_root) then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('koreksi_kunci:' || v_root::text, 0));
  select k.id into v_k from public.key_corrections k
   where k.line_root_course_id = v_root and k.status = 'CONFIRMED' and k.corrected_item_id is not null
     and public.sesi_terdampak(new.session_id, k.corrected_item_id)
   order by k.decided_at desc limit 1;
  if v_k is not null then perform public.hitung_ulang_koreksi_kunci(new.session_id, v_k); end if;
  return null;
end $$;
revoke all on function public.koreksi_kunci_saat_selesai() from public, anon, authenticated;
create trigger assessment_results_key_correction after insert on public.assessment_results
  for each row when (new.supersedes_result_id is null) execute function public.koreksi_kunci_saat_selesai();

-- ═══════════════════════════════════════════════════════════ (1) the proposal
create or replace function public.ajukan_koreksi_kunci(p_item uuid, p_kunci text[], p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); i public.items; v_t uuid; v_course uuid; v_head uuid; r public.plp_releases;
        v_kunci text[]; v_alasan text := btrim(coalesce(p_alasan, '')); v_id uuid; v_labels text[];
begin
  select * into i from public.items where id = p_item;
  if i.id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  if not public.koreksi_pemilik(v_me, i.institution_id) then perform public.koreksi_tolak('CORRECTION_NOT_ALLOWED'); end if;
  if not exists (select 1 from public.plp_releases x where x.course_id = public.soal_kursus(p_item) and x.published_at is not null) then
    perform public.koreksi_tolak('CORRECTION_ITEM_NOT_PUBLISHED');
  end if;
  v_t := public.soal_ujung(p_item);
  v_course := public.soal_kursus(v_t);
  v_head := public.kursus_kepala(v_course);
  if v_head <> v_course then
    if not public.content_is_sealed(v_head) then perform public.koreksi_tolak('CORRECTION_OPEN_REVISION'); end if;
    perform public.koreksi_tolak('CORRECTION_NOT_IN_HEAD');
  end if;
  select * into r from public.plp_releases x where x.course_id = v_course;
  if r.id is null or r.published_at is null then perform public.koreksi_tolak('CORRECTION_ITEM_NOT_PUBLISHED'); end if;
  if char_length(v_alasan) not between 10 and 300 then perform public.koreksi_tolak('CORRECTION_REASON_REQUIRED'); end if;
  v_kunci := array(select distinct upper(btrim(x)) from unnest(coalesce(p_kunci, '{}')) x where btrim(x) <> '' order by 1);
  v_labels := array(select o.label from public.item_options o where o.item_id = v_t);
  if cardinality(v_kunci) = 0 or not (v_kunci <@ v_labels)
     or ((select it.item_type from public.items it where it.id = v_t) = 'MCQ_SINGLE' and cardinality(v_kunci) <> 1) then
    perform public.koreksi_tolak('CORRECTION_KEY_INVALID');
  end if;
  if v_kunci = public.soal_kunci(v_t) then perform public.koreksi_tolak('CORRECTION_KEY_UNCHANGED'); end if;
  begin
    insert into public.key_corrections (institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id,
      question_digest, key_before, key_after, reason, proposed_by_person_id)
    values (i.institution_id, public.kursus_akar(v_course), p_item, v_t, v_course, r.id, public.soal_sidik_isi(v_t),
            public.soal_kunci(v_t), v_kunci, v_alasan, v_me)
    returning id into v_id;
  exception when unique_violation then
    perform public.koreksi_tolak('CORRECTION_PENDING');
  end;
  perform public.audit_write('key_correction.proposed', 'key_corrections', v_id::text, i.institution_id,
    jsonb_build_object('correction', v_id, 'item', v_t, 'asked_item', p_item, 'release', r.id, 'reason', v_alasan,
                       'from', jsonb_build_object('key', to_jsonb(public.soal_kunci(v_t))), 'to', jsonb_build_object('key', to_jsonb(v_kunci))));
  return jsonb_build_object('ok', true, 'koreksi', v_id, 'item', v_t, 'kunci_lama', to_jsonb(public.soal_kunci(v_t)), 'kunci_baru', to_jsonb(v_kunci));
end $$;
revoke all on function public.ajukan_koreksi_kunci(uuid, text[], text) from public, anon, authenticated;
grant execute on function public.ajukan_koreksi_kunci(uuid, text[], text) to authenticated;

create or replace function public.tolak_koreksi_kunci(p_correction uuid, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); k public.key_corrections; v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  select * into k from public.key_corrections where id = p_correction for update;
  if k.id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  if v_me = k.proposed_by_person_id then perform public.koreksi_tolak('CORRECTION_OWN_PROPOSAL'); end if;
  if not public.koreksi_penegas(v_me, k.institution_id) then perform public.koreksi_tolak('CORRECTION_CONFIRM_NOT_ALLOWED'); end if;
  if k.status <> 'PENDING' then perform public.koreksi_tolak('CORRECTION_ALREADY_DECIDED'); end if;
  if char_length(v_alasan) not between 10 and 300 then perform public.koreksi_tolak('CORRECTION_REASON_REQUIRED'); end if;
  update public.key_corrections set status = 'DECLINED', decided_by_person_id = v_me, decided_at = now(), decline_reason = v_alasan
   where id = p_correction;
  perform public.audit_write('key_correction.declined', 'key_corrections', p_correction::text, k.institution_id,
    jsonb_build_object('correction', p_correction, 'reason', v_alasan, 'proposed_by', k.proposed_by_person_id,
                       'from', jsonb_build_object('status', 'PENDING'), 'to', jsonb_build_object('status', 'DECLINED')));
  return jsonb_build_object('ok', true, 'koreksi', p_correction, 'status', 'DECLINED');
end $$;
revoke all on function public.tolak_koreksi_kunci(uuid, text) from public, anon, authenticated;
grant execute on function public.tolak_koreksi_kunci(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════ (2) the exact counts, before confirmation
-- By the recalculation's own rule (sesi_peta_kunci with the proposal as its hypothesis, evaluate_session_kunci). For
-- a decided correction, what its confirmation recorded.
create or replace function public.koreksi_kunci_hitung_untuk(p_item uuid, p_kunci text[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_t uuid; v_hyp jsonb; s record; e record; v_cur public.assessment_results;
        n_sesi int := 0; n_ubah int := 0; n_putusan int := 0; n_tinjau int := 0; n_baru int := 0; n_buka int := 0;
        v_sekolah uuid[] := '{}'; v_daftar jsonb := '[]'::jsonb; v_lulus_a boolean; v_lulus_b boolean; v_berubah boolean;
        v_cert uuid;
begin
  v_t := public.soal_ujung(p_item);
  v_hyp := jsonb_build_object('item', v_t, 'kunci', to_jsonb(p_kunci));
  for s in
    select distinct ss.id, ss.institution_id, ss.pass_mark, ss.mode, ss.person_id, ss.status, coalesce(ss.class_node_id, ss.cohort_node_id) as tempat
      from public.presented_items p join public.assessment_sessions ss on ss.id = p.session_id
     where p.item_id in (select x.item_id from public.soal_leluhur_sah(v_t) x)
  loop
    if public.hasil_terkini_id(s.id) is null then
      if s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'SUBMITTED', 'EXPIRED') then n_buka := n_buka + 1; end if;
      continue;
    end if;
    n_sesi := n_sesi + 1;
    if not (s.institution_id = any (v_sekolah)) then v_sekolah := v_sekolah || s.institution_id; end if;
    select * into v_cur from public.assessment_results where id = public.hasil_terkini_id(s.id);
    select * into e from public.evaluate_session_kunci(s.id, public.sesi_peta_kunci(s.id, v_hyp));
    v_berubah := v_cur.mastery is distinct from e.mastery or v_cur.safety_gate_passed is distinct from e.safety_gate_passed
              or v_cur.per_domain is distinct from e.per_domain;
    if v_berubah then n_ubah := n_ubah + 1; end if;
    v_lulus_a := case when s.mode = 'POST_TEST' and s.pass_mark is not null then v_cur.safety_gate_passed and v_cur.mastery >= s.pass_mark end;
    v_lulus_b := case when s.mode = 'POST_TEST' and s.pass_mark is not null then e.safety_gate_passed and e.mastery >= s.pass_mark end;
    if v_lulus_a is distinct from v_lulus_b then n_putusan := n_putusan + 1; end if;
    v_cert := public.sertifikat_sesi_kini(s.id);
    if v_berubah and v_cert is not null then n_tinjau := n_tinjau + 1; end if;
    if not exists (select 1 from public.certificates c where c.session_id = s.id)
       and public.sertifikat_layak_dengan(s.id, e.mastery, e.safety_gate_passed)
       and not public.sertifikat_layak_dengan(s.id, v_cur.mastery, v_cur.safety_gate_passed) then
      n_baru := n_baru + 1;
    end if;
    v_daftar := v_daftar || jsonb_build_object('sesi', s.id, 'sekolah', s.institution_id, 'murid', s.person_id,
      'nama', (select p.display_name from public.persons p where p.id = s.person_id),
      'tempat', s.tempat, 'nama_tempat', (select n.name from public.org_nodes n where n.id = s.tempat),
      'mode', s.mode, 'sebelum', v_cur.mastery, 'sesudah', e.mastery, 'berubah', v_berubah,
      'lulus_sebelum', v_lulus_a, 'lulus_sesudah', v_lulus_b, 'sertifikat_ditinjau', v_berubah and v_cert is not null);
  end loop;
  return jsonb_build_object('sesi_selesai', n_sesi, 'sekolah', coalesce(array_length(v_sekolah, 1), 0), 'hasil_berubah', n_ubah,
    'putusan_target_berubah', n_putusan, 'sertifikat_ditinjau', n_tinjau, 'sertifikat_baru_layak', n_baru, 'sesi_terbuka', n_buka,
    'daftar', v_daftar);
end $$;
revoke all on function public.koreksi_kunci_hitung_untuk(uuid, text[]) from public, anon, authenticated;

create or replace function public.koreksi_kunci_hitung(p_correction uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public.koreksi_kunci_hitung_untuk(k.item_id, k.key_after) from public.key_corrections k where k.id = p_correction
$$;
revoke all on function public.koreksi_kunci_hitung(uuid) from public, anon, authenticated;

-- Daisy's step 2 («Yang terdampak») comes BEFORE the proposal is sent, so the proposer reads the same exact counts
-- for the key she has chosen without writing anything: the proposal's own refusals except the reason, then the
-- recalculation's rule over that hypothesis. For platform content the other schools are counts only.
create or replace function public.pratinjau_koreksi_kunci(p_item uuid, p_kunci text[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); i public.items; v_t uuid; v_course uuid; v_head uuid; v_kunci text[]; v jsonb;
begin
  select * into i from public.items where id = p_item;
  if i.id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  if not public.koreksi_pemilik(v_me, i.institution_id) then perform public.koreksi_tolak('CORRECTION_NOT_ALLOWED'); end if;
  v_t := public.soal_ujung(p_item);
  v_course := public.soal_kursus(v_t);
  v_head := public.kursus_kepala(v_course);
  if v_head <> v_course then
    if not public.content_is_sealed(v_head) then perform public.koreksi_tolak('CORRECTION_OPEN_REVISION'); end if;
    perform public.koreksi_tolak('CORRECTION_NOT_IN_HEAD');
  end if;
  if not exists (select 1 from public.plp_releases x where x.course_id = v_course and x.published_at is not null) then
    perform public.koreksi_tolak('CORRECTION_ITEM_NOT_PUBLISHED');
  end if;
  v_kunci := array(select distinct upper(btrim(x)) from unnest(coalesce(p_kunci, '{}')) x where btrim(x) <> '' order by 1);
  if cardinality(v_kunci) = 0 or not (v_kunci <@ array(select o.label from public.item_options o where o.item_id = v_t))
     or ((select it.item_type from public.items it where it.id = v_t) = 'MCQ_SINGLE' and cardinality(v_kunci) <> 1) then
    perform public.koreksi_tolak('CORRECTION_KEY_INVALID');
  end if;
  if v_kunci = public.soal_kunci(v_t) then perform public.koreksi_tolak('CORRECTION_KEY_UNCHANGED'); end if;
  v := public.koreksi_kunci_hitung_untuk(v_t, v_kunci);
  if public.tenant_platform(i.institution_id) then v := v - 'daftar'; end if;
  return v || jsonb_build_object('item', v_t, 'kunci_lama', to_jsonb(public.soal_kunci(v_t)), 'kunci_baru', to_jsonb(v_kunci),
                                 'konten_platform', public.tenant_platform(i.institution_id));
end $$;
revoke all on function public.pratinjau_koreksi_kunci(uuid, text[]) from public, anon, authenticated;
grant execute on function public.pratinjau_koreksi_kunci(uuid, text[]) to authenticated;

create or replace function public.koreksi_kunci_dampak(p_correction uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); k public.key_corrections; v jsonb; v_platform boolean;
begin
  select * into k from public.key_corrections where id = p_correction;
  if k.id is null or not (public.koreksi_pemilik(v_me, k.institution_id) or public.koreksi_penegas(v_me, k.institution_id)) then
    perform public.koreksi_tolak('CORRECTION_UNKNOWN');
  end if;
  v_platform := public.tenant_platform(k.institution_id);
  v := case when k.status = 'PENDING' then public.koreksi_kunci_hitung(p_correction) else coalesce(k.outcome, '{}'::jsonb) end;
  -- O41-18 / Daisy: for platform content the other schools are counts only
  if v_platform then v := v - 'daftar'; end if;
  return v || jsonb_build_object(
    'koreksi', k.id, 'status', k.status, 'item', k.item_id, 'kunci_lama', to_jsonb(k.key_before), 'kunci_baru', to_jsonb(k.key_after),
    'alasan', k.reason, 'diajukan_oleh', k.proposed_by_person_id,
    'nama_pengaju', (select p.display_name from public.persons p where p.id = k.proposed_by_person_id), 'diajukan_pada', k.proposed_at,
    'diputuskan_oleh', k.decided_by_person_id, 'diputuskan_pada', k.decided_at, 'alasan_tolak', k.decline_reason,
    'konten_platform', v_platform,
    'course', k.course_id, 'paket', (select c.title from public.courses c where c.id = k.course_id),
    'soal', (select jsonb_build_object('bacaan', i.stimulus, 'pertanyaan', i.stem,
               'pilihan', coalesce((select jsonb_agg(jsonb_build_object('label', o.label, 'teks', o.body) order by o.label collate "C")
                                      from public.item_options o where o.item_id = i.id), '[]'::jsonb))
               from public.items i where i.id = k.item_id),
    'nama_pemutus', (select p.display_name from public.persons p where p.id = k.decided_by_person_id),
    'boleh_tegaskan', k.status = 'PENDING' and v_me is distinct from k.proposed_by_person_id and public.koreksi_penegas(v_me, k.institution_id),
    'milik_sendiri', v_me = k.proposed_by_person_id);
end $$;
revoke all on function public.koreksi_kunci_dampak(uuid) from public, anon, authenticated;
grant execute on function public.koreksi_kunci_dampak(uuid) to authenticated;

create or replace function public.koreksi_kunci_antrean(p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if not (public.koreksi_pemilik(v_me, p_institution) or public.koreksi_penegas(v_me, p_institution)) then
    perform public.koreksi_tolak('CORRECTION_NOT_ALLOWED');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('koreksi', k.id, 'item', k.item_id, 'release', k.release_id,
             'course', k.course_id, 'paket', (select c.title from public.courses c where c.id = k.course_id),
             'kunci_lama', to_jsonb(k.key_before), 'kunci_baru', to_jsonb(k.key_after), 'alasan', k.reason,
             'diajukan_oleh', k.proposed_by_person_id, 'nama_pengaju', p.display_name, 'diajukan_pada', k.proposed_at,
             'milik_sendiri', k.proposed_by_person_id = v_me) order by k.proposed_at, k.id)
      from public.key_corrections k join public.persons p on p.id = k.proposed_by_person_id
     where k.institution_id = p_institution and k.status = 'PENDING'), '[]'::jsonb);
end $$;
revoke all on function public.koreksi_kunci_antrean(uuid) from public, anon, authenticated;
grant execute on function public.koreksi_kunci_antrean(uuid) to authenticated;

-- The package page's read (Daisy Q6): for each question shown, its latest key correction, for the owner and the
-- confirmers of its school only: waiting (with when it was proposed), declined (who declined and why, returned to the
-- proposer) or confirmed. Nothing for anyone else.
create or replace function public.koreksi_kunci_terakhir(p_items uuid[])
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('item', x.item, 'koreksi', k.id, 'status', k.status,
             'kunci_lama', to_jsonb(k.key_before), 'kunci_baru', to_jsonb(k.key_after), 'alasan', k.reason,
             'diajukan_pada', k.proposed_at, 'diputuskan_pada', k.decided_at, 'alasan_tolak', k.decline_reason,
             'nama_pemutus', (select p.display_name from public.persons p where p.id = k.decided_by_person_id),
             'milik_sendiri', k.proposed_by_person_id = v_me))
      from unnest(coalesce(p_items, '{}')) as x(item)
      join lateral (select * from public.key_corrections kc where kc.asked_item_id = x.item or kc.item_id = x.item
                     order by kc.proposed_at desc, kc.id desc limit 1) k on true
     where public.koreksi_pemilik(v_me, k.institution_id) or public.koreksi_penegas(v_me, k.institution_id)), '[]'::jsonb);
end $$;
revoke all on function public.koreksi_kunci_terakhir(uuid[]) from public, anon, authenticated;
grant execute on function public.koreksi_kunci_terakhir(uuid[]) to authenticated;

-- ═══════════════════════════════════════════════════════════ (3) the confirmation
-- An existing assignment's new starts move to the corrected release: the move recorded as move_learning_assignment_
-- release records one, under the correction's authority, also after starts (Sharon, blocker 3). The cycle moves with
-- it to the corrected release's own definitions; every sitting already started stays bound to its own release.
create or replace function public.koreksi_kunci_pindah(p_assignment uuid, p_to_release uuid, p_correction uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.learning_assignments; v_target public.plp_releases; v_aa record; v_def public.assessment_definitions;
        v_cycle jsonb := '{}'::jsonb; v_repoint jsonb := '[]'::jsonb; v_left int; v_moved int; v_id uuid; k public.key_corrections;
begin
  select * into k from public.key_corrections where id = p_correction;
  select * into a from public.learning_assignments where id = p_assignment for update;
  select * into v_target from public.plp_releases where id = p_to_release;
  for v_aa in
    select aa.id, aa.assessment_definition_id as from_def, d.mode
      from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
     where aa.learning_assignment_id = p_assignment and d.mode in ('PRE_TEST', 'POST_TEST') order by d.mode
  loop
    v_def := public.release_cycle_definition(p_to_release, v_aa.mode);
    if v_def.id is null then perform public.koreksi_tolak('CORRECTION_NOT_READY'); end if;
    update public.assessment_assignments set assessment_definition_id = v_def.id where id = v_aa.id;
    v_cycle := v_cycle || jsonb_build_object(case v_aa.mode when 'PRE_TEST' then 'pre_test' else 'post_test' end, v_def.id);
    v_repoint := v_repoint || jsonb_build_object('mode', v_aa.mode, 'from', v_aa.from_def, 'to', v_def.id);
  end loop;
  select count(distinct s.person_id) into v_left from public.assessment_sessions s
   where s.learning_assignment_id = p_assignment and s.plp_release_id = a.plp_release_id;
  select count(distinct m.enrollment_id) into v_moved from public.memberships m
   where m.node_id = a.node_id and m.valid_to is null
     and not exists (select 1 from public.assessment_sessions s where s.learning_assignment_id = p_assignment and s.enrollment_id = m.enrollment_id);
  insert into public.learning_assignment_release_moves (learning_assignment_id, institution_id, from_release_id, to_release_id,
    reason, moved_by_person_id, learners_moved, learners_left_in_place)
  values (p_assignment, a.institution_id, a.plp_release_id, p_to_release, 'Koreksi kunci jawaban: ' || k.reason,
          public.current_person_id(), v_moved, v_left)
  returning id into v_id;
  update public.learning_assignments
     set plp_release_id = p_to_release, course_id = v_target.course_id, learning_cycle = coalesce(learning_cycle, '{}'::jsonb) || v_cycle
   where id = p_assignment;
  perform public.audit_write('LEARNING_RELEASE_MOVED', 'learning_assignments', p_assignment::text, a.institution_id,
    jsonb_build_object('from_release', a.plp_release_id, 'to_release', p_to_release, 'from_course', a.course_id,
                       'to_course', v_target.course_id, 'learners_moved', v_moved, 'learners_left_in_place', v_left,
                       'cycle', v_repoint, 'reason', 'Koreksi kunci jawaban: ' || k.reason, 'by_key_correction', k.id));
  return v_id;
end $$;
revoke all on function public.koreksi_kunci_pindah(uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.tegaskan_koreksi_kunci(p_correction uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); k public.key_corrections; v_t uuid; v_course uuid; v_head uuid;
        v_rel_h public.plp_releases; v_new uuid; v_t2 uuid; v_rel uuid; v_label text; st public.content_status;
        v_mods uuid[]; v_les uuid[]; v_hitung jsonb; s record; v_n_sesi int := 0; v_n_ubah int := 0; v_n_buka int := 0;
        v_sekolah jsonb := '{}'::jsonb; v_inst uuid; v_reviews uuid[]; v_pindah int := 0; v_distribusi int := 0; la record;
        d record; v_ditarik boolean; v_res uuid; v_prev public.assessment_results; v_nr public.assessment_results;
begin
  select * into k from public.key_corrections where id = p_correction;
  if k.id is null then perform public.koreksi_tolak('CORRECTION_UNKNOWN'); end if;
  if v_me is null or v_me = k.proposed_by_person_id then
    if v_me is not null then perform public.koreksi_tolak('CORRECTION_OWN_PROPOSAL'); end if;
    perform public.koreksi_tolak('CORRECTION_CONFIRM_NOT_ALLOWED');
  end if;
  if not public.koreksi_penegas(v_me, k.institution_id) then perform public.koreksi_tolak('CORRECTION_CONFIRM_NOT_ALLOWED'); end if;
  -- one confirmation at a time per course line, and against every finishing sitting of the line
  perform pg_advisory_xact_lock(hashtextextended('koreksi_kunci:' || k.line_root_course_id::text, 0));
  select * into k from public.key_corrections where id = p_correction for update;
  if k.status <> 'PENDING' then perform public.koreksi_tolak('CORRECTION_ALREADY_DECIDED'); end if;
  if not public.koreksi_pemilik(k.proposed_by_person_id, k.institution_id) then perform public.koreksi_tolak('CORRECTION_PROPOSER_LAPSED'); end if;

  -- the question as it stands now (another correction may have moved the line meanwhile: its unchanged copy)
  v_t := public.soal_ujung(k.item_id);
  v_course := public.soal_kursus(v_t);
  v_head := public.kursus_kepala(v_course);
  if v_head <> v_course then
    if not public.content_is_sealed(v_head) then perform public.koreksi_tolak('CORRECTION_OPEN_REVISION'); end if;
    perform public.koreksi_tolak('CORRECTION_STALE');
  end if;
  if public.soal_sidik_isi(v_t) <> k.question_digest then perform public.koreksi_tolak('CORRECTION_STALE'); end if;
  if public.soal_kunci(v_t) = k.key_after then perform public.koreksi_tolak('CORRECTION_KEY_UNCHANGED'); end if;
  select * into v_rel_h from public.plp_releases r where r.course_id = v_head for update;
  if v_rel_h.id is null or v_rel_h.published_at is null or v_rel_h.status not in ('PUBLISHED', 'SUPERSEDED') then
    perform public.koreksi_tolak('CORRECTION_STALE');
  end if;
  v_ditarik := v_rel_h.withdrawn_at is not null;

  -- the counts, by the recalculation's own rule, as they stand at this moment
  v_hitung := public.koreksi_kunci_hitung(p_correction);

  update public.key_corrections
     set status = 'CONFIRMED', decided_by_person_id = v_me, decided_at = now(), head_course_id = v_head,
         confirmer_wrote_faulty = exists (select 1 from public.items x where x.id = v_t and x.author_person_id = v_me)
                               or exists (select 1 from public.courses c where c.id = v_head and c.author_person_id = v_me)
   where id = p_correction;
  perform set_config('pintar.koreksi_kunci', p_correction::text, true);

  -- the corrected revision: the head copied, authored by the proposer; the corrected question carries the new key
  v_new := public.salin_kursus_revisi(v_head, public.kursus_penerus(v_head, k.proposed_by_person_id), k.proposed_by_person_id, true);
  update public.key_corrections set corrected_course_id = v_new where id = p_correction;
  select i.id into v_t2 from public.items i where i.supersedes_item_id = v_t and public.soal_kursus(i.id) = v_new;
  update public.item_options set is_correct = (label = any (k.key_after)) where item_id = v_t2;
  insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary, written_by_person_id)
  values (v_new, k.institution_id, v_head, 'Koreksi kunci jawaban: ' || k.reason, k.proposed_by_person_id);

  -- reviewed and approved by the confirmer (the second person), as one step each, every row of the package
  v_mods := array(select m.id from public.modules m where m.course_id = v_new);
  v_les := array(select l.id from public.lessons l where l.module_id = any (v_mods));
  foreach st in array array['STRUCTURED', 'VALIDATED', 'IN_REVIEW', 'APPROVED']::public.content_status[] loop
    update public.items set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where lesson_id = any (v_les);
    update public.lessons set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where module_id = any (v_mods);
    update public.modules set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where course_id = v_new;
    update public.assessment_definitions set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where (course_id = v_new or module_id = any (v_mods)) and not is_ad_hoc;
    update public.courses set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where id = v_new;
  end loop;

  -- its release, locked and published (the label as create_release gives it); it replaces the head's
  v_label := split_part(v_rel_h.version_label, '.', 1) || '.' || (split_part(v_rel_h.version_label, '.', 2)::int + 1)::text || '.0';
  while exists (select 1 from public.plp_releases r where r.institution_id = k.institution_id and r.course_id = v_new and r.version_label = v_label) loop
    v_label := split_part(v_label, '.', 1) || '.' || (split_part(v_label, '.', 2)::int + 1)::text || '.0';
  end loop;
  insert into public.plp_releases (institution_id, course_id, version_label, author_person_id, supersedes_release_id)
  values (k.institution_id, v_new, v_label, k.proposed_by_person_id, v_rel_h.id)
  returning id into v_rel;
  update public.key_corrections set corrected_release_id = v_rel, corrected_item_id = v_t2 where id = p_correction;
  foreach st in array array['STRUCTURED', 'VALIDATED', 'IN_REVIEW', 'APPROVED', 'FROZEN']::public.content_status[] loop
    update public.plp_releases set status = st, reviewed_by_person_id = case when st = 'APPROVED' then v_me else reviewed_by_person_id end
     where id = v_rel;
  end loop;
  begin
    update public.plp_releases set status = 'PUBLISHED' where id = v_rel;
  exception when sqlstate 'PR040' then
    perform public.koreksi_tolak('CORRECTION_NOT_READY');
  end;
  perform public.audit_write('RELEASE_PUBLISHED', 'plp_releases', v_rel::text, k.institution_id,
    jsonb_build_object('course_id', v_new, 'version_label', v_label, 'assigns_nothing', true, 'by_key_correction', k.id,
                       'author', k.proposed_by_person_id, 'reviewer', v_me));
  perform public.terbitan_gantikan_pendahulu(v_rel);
  if v_ditarik then
    -- a release its publisher withdrew stays stopped: its correction is withdrawn with it
    update public.plp_releases
       set status = 'SUPERSEDED', withdrawn_at = now(), withdrawn_by_person_id = v_me,
           withdrawal_reason = 'Ditarik seperti terbitan yang dikoreksinya: ' || coalesce(v_rel_h.withdrawal_reason, '-')
     where id = v_rel;
    perform public.audit_write('RELEASE_WITHDRAWN', 'plp_releases', v_rel::text, k.institution_id,
      jsonb_build_object('course_id', v_new, 'version_label', v_label, 'reason', 'withdrawn as the release it corrects was',
                         'by_key_correction', k.id, 'evidence_untouched', true,
                         'from', jsonb_build_object('status', 'PUBLISHED'), 'to', jsonb_build_object('status', 'SUPERSEDED', 'withdrawn', true)));
  else
    -- platform content: onward to every school holding the line's replaced releases
    if public.tenant_platform(k.institution_id) then
      for d in
        select distinct rd.institution_id from public.release_distributions rd join public.plp_releases r on r.id = rd.plp_release_id
         where rd.status = 'ACTIVE' and r.course_id in (select c.course_id from public.course_lineage_chain(v_head) c)
           and not exists (select 1 from public.release_distributions x where x.plp_release_id = v_rel and x.institution_id = rd.institution_id and x.status = 'ACTIVE')
      loop
        insert into public.release_distributions (plp_release_id, institution_id, authorized_by_person_id, reason)
        values (v_rel, d.institution_id, v_me, 'Koreksi kunci jawaban');
        perform public.audit_write('RELEASE_DISTRIBUTION_GRANTED', 'release_distributions', v_rel::text, d.institution_id,
          jsonb_build_object('plp_release_id', v_rel, 'course_id', v_new, 'version_label', v_label,
                             'owner_institution_id', k.institution_id, 'reason', 'Koreksi kunci jawaban', 'by_key_correction', k.id));
        v_distribusi := v_distribusi + 1;
      end loop;
    end if;
    -- existing assignments over the question (any release of the line it reached unchanged) start on the correction
    for la in
      select distinct a.id from public.learning_assignments a join public.plp_releases r on r.id = a.plp_release_id
       where a.status = 'ACTIVE' and r.withdrawn_at is null and r.id <> v_rel
         and r.course_id in (select c.course_id from public.course_lineage_chain(v_head) c)
         and exists (select 1 from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                      where m.course_id = r.course_id and i.id in (select x.item_id from public.soal_leluhur_sah(v_t2) x))
       order by a.id
    loop
      perform public.koreksi_kunci_pindah(la.id, v_rel, p_correction);
      v_pindah := v_pindah + 1;
    end loop;
  end if;

  -- every finished sitting that presented the question: a governed recalculation; an open one waits for its finish
  for s in
    select distinct ss.id, ss.institution_id, ss.status
      from public.presented_items p join public.assessment_sessions ss on ss.id = p.session_id
     where p.item_id in (select x.item_id from public.soal_leluhur_sah(v_t2) x)
     order by ss.id
  loop
    if public.hasil_terkini_id(s.id) is null then
      if s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'SUBMITTED', 'EXPIRED') then v_n_buka := v_n_buka + 1; end if;
      continue;
    end if;
    select * into v_prev from public.assessment_results where id = public.hasil_terkini_id(s.id);
    v_res := public.hitung_ulang_koreksi_kunci(s.id, p_correction);
    select * into v_nr from public.assessment_results where id = v_res;
    v_n_sesi := v_n_sesi + 1;
    if v_prev.mastery is distinct from v_nr.mastery or v_prev.safety_gate_passed is distinct from v_nr.safety_gate_passed
       or v_prev.per_domain is distinct from v_nr.per_domain then v_n_ubah := v_n_ubah + 1; end if;
    v_sekolah := jsonb_set(v_sekolah, array[s.institution_id::text],
                           coalesce(v_sekolah -> s.institution_id::text, '[]'::jsonb) || to_jsonb(s.id));
  end loop;

  -- each issuing school's notice: its own sittings and its own certificate reviews
  for v_inst in select (jsonb_object_keys(v_sekolah))::uuid loop
    v_reviews := array(select v.id from public.certificate_reviews v where v.key_correction_id = p_correction and v.institution_id = v_inst);
    insert into public.key_correction_notices (key_correction_id, institution_id, session_ids, certificate_review_ids)
    values (p_correction, v_inst, array(select (jsonb_array_elements_text(v_sekolah -> v_inst::text))::uuid), v_reviews);
    perform public.audit_write('key_correction.school_notified', 'key_correction_notices', p_correction::text, v_inst,
      jsonb_build_object('correction', p_correction, 'sittings', jsonb_array_length(v_sekolah -> v_inst::text),
                         'certificate_reviews', coalesce(array_length(v_reviews, 1), 0)));
  end loop;

  v_hitung := (v_hitung - 'daftar') || jsonb_build_object('dihitung_ulang', v_n_sesi, 'hasil_berubah_tercatat', v_n_ubah,
    'sesi_terbuka', v_n_buka, 'penugasan_dipindah', v_pindah, 'distribusi', v_distribusi,
    'terbitan_koreksi', v_rel, 'versi', v_label, 'ditarik', v_ditarik,
    'tinjauan_sertifikat', (select count(*) from public.certificate_reviews v where v.key_correction_id = p_correction));
  update public.key_corrections set outcome = v_hitung where id = p_correction;
  perform set_config('pintar.koreksi_kunci', '', true);
  perform public.audit_write('key_correction.confirmed', 'key_corrections', p_correction::text, k.institution_id,
    jsonb_build_object('correction', p_correction, 'proposed_by', k.proposed_by_person_id, 'confirmed_by', v_me,
                       'reason', k.reason, 'item', v_t, 'corrected_item', v_t2, 'corrected_release', v_rel,
                       'confirmer_wrote_faulty', (select x.confirmer_wrote_faulty from public.key_corrections x where x.id = p_correction),
                       'from', jsonb_build_object('status', 'PENDING', 'key', to_jsonb(k.key_before)),
                       'to', jsonb_build_object('status', 'CONFIRMED', 'key', to_jsonb(k.key_after)),
                       'outcome', v_hitung));
  return jsonb_build_object('ok', true, 'koreksi', p_correction) || v_hitung;
end $$;
revoke all on function public.tegaskan_koreksi_kunci(uuid) from public, anon, authenticated;
grant execute on function public.tegaskan_koreksi_kunci(uuid) to authenticated;

-- INV-24 across a move: a post-test never repeats a pre-test question or one of its parallel siblings, also where the
-- pre-test was sat on the release the assignment was moved from (the later version of the same question is excluded).
create or replace function public.excluded_items_for_post_test(p_person uuid, p_learning_assignment uuid)
returns table (item_id uuid, reason text) language sql stable security definer set search_path = public, pg_temp as $$
  with recursive seen as (
    select distinct p.item_id, i.parallel_group
      from public.presented_items p
      join public.assessment_sessions s on s.id = p.session_id
      join public.items i on i.id = p.item_id
     where s.person_id = p_person and s.learning_assignment_id = p_learning_assignment and s.mode = 'PRE_TEST'
  ),
  dasar as (
    select seen.item_id, 'presented in this learner''s pre-test'::text as reason from seen
    union
    select sib.id, 'parallel sibling of an item presented in this learner''s pre-test'
      from public.items sib join seen on sib.parallel_group = seen.parallel_group
     where sib.parallel_group is not null and sib.id <> seen.item_id
  ),
  turunan as (
    select d.item_id, d.reason, 0 as n from dasar d
    union all
    select c.id, 'a later version of a question this learner''s pre-test excluded', t.n + 1
      from public.items c join turunan t on c.supersedes_item_id = t.item_id where t.n < 64
  )
  select distinct on (t.item_id) t.item_id, t.reason from turunan t order by t.item_id, t.n
$$;
revoke all on function public.excluded_items_for_post_test(uuid, uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (5) the readers (O41-21)
do $$
declare v_def text; v_old text;
begin
  -- the learner's result page
  v_def := pg_get_functiondef('public.session_outcome(uuid)'::regprocedure);
  v_old := 'where session_id = p_session and supersedes_result_id is null;';
  if position(v_old in v_def) = 0 then raise exception 'C1w: session_outcome no longer reads the sealed result where it did'; end if;
  v_def := replace(v_def, v_old, 'where id = public.hasil_murid_id(p_session);   -- C1w (O41-21): a governed correction is the learner''s result');
  v_old := E'''ringkasan'',   v_r.delta_inputs);';
  if position(v_old in v_def) = 0 then raise exception 'C1w: session_outcome no longer builds its answer where it did'; end if;
  execute replace(v_def, v_old, E'''ringkasan'',   v_r.delta_inputs) || public.hasil_koreksi_ringkas(p_session);');
  -- Kenaikan's pair, as the learner reads it
  v_def := pg_get_functiondef('public.learning_delta(uuid)'::regprocedure);
  v_old := 'join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null';
  if (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old) <> 2 then raise exception 'C1w: learning_delta is not where it was'; end if;
  execute replace(v_def, v_old, 'join public.assessment_results r on r.id = public.hasil_murid_id(s.id)');
  -- the certificate decision (and so a certificate newly earned is issued by the usual path)
  v_def := pg_get_functiondef('public.certificate_eligibility(uuid)'::regprocedure);
  v_old := 'from public.official_results r where r.session_id = p_session and r.supersedes_result_id is null;';
  if position(v_old in v_def) = 0 then raise exception 'C1w: certificate_eligibility is not where it was'; end if;
  execute replace(v_def, v_old, 'from public.official_results r where r.id = public.hasil_murid_id(p_session);   -- C1w (O41-21)');
  -- the learner's review and map grade by the key in force for them
  foreach v_old in array array['session_review', 'reading_map'] loop
    v_def := pg_get_functiondef(('public.' || v_old || '(uuid)')::regprocedure);
    if position('public.grade_response(f.item_id, f.value)' in v_def) = 0 then raise exception 'C1w: % does not grade where it did', v_old; end if;
    execute replace(v_def, 'public.grade_response(f.item_id, f.value)', 'public.nilai_jawaban_berlaku(p_session, f.item_id, f.value)');
  end loop;
end $$;

-- grade_response, or the key the learner's governed corrected result scored this question by.
create or replace function public.nilai_jawaban_berlaku(p_session uuid, p_item uuid, p_value jsonb)
returns numeric language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select public.grade_kunci(p_item, p_value, array(select jsonb_array_elements_text(b.basis -> 'soal' -> p_item::text -> 'kunci')))
       from public.assessment_result_bases b
      where b.result_id = public.hasil_murid_id(p_session) and b.basis -> 'soal' ? p_item::text),
    public.grade_response(p_item, p_value))
$$;
revoke all on function public.nilai_jawaban_berlaku(uuid, uuid, jsonb) from public, anon, authenticated;

-- What the learner's result page adds when the result in force for them is a governed correction: that it was
-- corrected, why, when, and the sealed original's mastery. Nothing otherwise.
create or replace function public.hasil_koreksi_ringkas(p_session uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select jsonb_build_object('dikoreksi', true, 'koreksi', jsonb_build_object(
             'alasan', k.reason, 'pada', b.written_at,
             'penguasaan_asli', (select r.mastery from public.assessment_results r where r.session_id = p_session and r.supersedes_result_id is null),
             'sertifikat_ditinjau', coalesce(public.sertifikat_ditinjau(public.sertifikat_sesi_kini(p_session)), false)))
      from public.assessment_result_bases b join public.key_corrections k on k.id = b.key_correction_id
     where b.result_id = public.hasil_murid_id(p_session)), '{}'::jsonb)
$$;
revoke all on function public.hasil_koreksi_ringkas(uuid) from public, anon, authenticated;

-- The learner's own: whether their result was corrected, why, the original and the current, and whether their
-- certificate is under review.
create or replace function public.hasil_koreksi_saya(p_session uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_asli public.assessment_results; v_kini public.assessment_results; s public.assessment_sessions; v_k public.key_corrections;
begin
  if not public.session_is_mine(p_session) then perform public.koreksi_tolak('RESULT_NOT_VISIBLE'); end if;
  select * into s from public.assessment_sessions where id = p_session;
  select * into v_asli from public.assessment_results where session_id = p_session and supersedes_result_id is null;
  select * into v_kini from public.assessment_results where id = public.hasil_murid_id(p_session);
  select k.* into v_k from public.assessment_result_bases b join public.key_corrections k on k.id = b.key_correction_id where b.result_id = v_kini.id;
  return jsonb_build_object(
    'dikoreksi', v_k.id is not null, 'alasan', v_k.reason, 'pada', v_kini.computed_at,
    'asli', case when v_asli.id is not null then jsonb_build_object('penguasaan', v_asli.mastery,
              'lulus', case when s.mode = 'POST_TEST' and s.pass_mark is not null then v_asli.safety_gate_passed and v_asli.mastery >= s.pass_mark end) end,
    'terkini', case when v_kini.id is not null then jsonb_build_object('penguasaan', v_kini.mastery,
              'lulus', case when s.mode = 'POST_TEST' and s.pass_mark is not null then v_kini.safety_gate_passed and v_kini.mastery >= s.pass_mark end) end,
    'sertifikat_ditinjau', coalesce(public.sertifikat_ditinjau(public.sertifikat_sesi_kini(p_session)), false));
end $$;
revoke all on function public.hasil_koreksi_saya(uuid) from public, anon, authenticated;
grant execute on function public.hasil_koreksi_saya(uuid) to authenticated;

-- The teacher's: the whole chain of one sitting's results, oldest first, each with how it came to be (SEALED,
-- RECALCULATED by the platform, KEY_CORRECTED with its reason, who proposed and who confirmed), and which is current.
create or replace function public.riwayat_hasil_sesi(p_session uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.boleh_atas_sesi(p_session, 'CAN_VIEW_LEARNER_RESULT') then perform public.koreksi_tolak('RESULT_NOT_VISIBLE'); end if;
  return jsonb_build_object('sesi', p_session, 'terkini', public.hasil_terkini_id(p_session), 'rantai', coalesce((
    with recursive rantai as (
      select r.*, 1 as n from public.assessment_results r where r.session_id = p_session and r.supersedes_result_id is null
      union all
      select r.*, rantai.n + 1 from public.assessment_results r join rantai on r.supersedes_result_id = rantai.id where rantai.n < 64)
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'hasil', x.id, 'urutan', x.n, 'pada', x.computed_at, 'penguasaan', x.mastery, 'gerbang_keselamatan', x.safety_gate_passed,
             'jenis', case when x.supersedes_result_id is null then 'SEALED' when b.result_id is not null then 'KEY_CORRECTED' else 'RECALCULATED' end,
             'alasan', case when b.result_id is not null then k.reason else x.recomputation_reason end,
             'koreksi', b.key_correction_id, 'diajukan_oleh', k.proposed_by_person_id, 'ditegaskan_oleh', k.decided_by_person_id,
             'kini', x.id = public.hasil_terkini_id(p_session))) order by x.n)
      from rantai x left join public.assessment_result_bases b on b.result_id = x.id left join public.key_corrections k on k.id = b.key_correction_id),
    '[]'::jsonb));
end $$;
revoke all on function public.riwayat_hasil_sesi(uuid) from public, anon, authenticated;
grant execute on function public.riwayat_hasil_sesi(uuid) to authenticated;

-- A question's history says which version a governed correction made (part one's hook).
create or replace function public.riwayat_soal_koreksi(p_item uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object('koreksi', k.id, 'alasan', k.reason, 'kunci_lama', to_jsonb(k.key_before), 'kunci_baru', to_jsonb(k.key_after),
                            'diajukan_oleh', k.proposed_by_person_id, 'ditegaskan_oleh', k.decided_by_person_id, 'pada', k.decided_at)
    from public.key_corrections k where k.corrected_item_id = p_item and k.status = 'CONFIRMED'
$$;
revoke all on function public.riwayat_soal_koreksi(uuid) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ (6) the certificate
-- 20270113160000's verify_certificate; one change: an issued certificate under review answers DITINJAU. Revoked and
-- superseded take precedence. Nothing else is added: no reason and no score.
create or replace function public.verify_certificate(p_token text)
returns table (pass boolean, predikat text, institution text, date text, validity text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_c public.certificates; v_inst text;
begin
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  -- an unknown token yields no row at all: no existence oracle, no distinguishable error
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;   -- not yet issued is not public
  select i.name into v_inst from public.institutions i where i.id = v_c.institution_id;
  pass       := (v_c.canonical_payload -> 'result' ->> 'passed')::boolean;
  predikat   := v_c.canonical_payload -> 'result' ->> 'predikat';
  -- CR-02: the school's name as issued; a certificate issued before the seal reads it as before
  institution:= coalesce(v_c.institution_as_issued, v_inst);
  -- D-199 (owner, 10 Nov): the issuing school's issue day, on its own clock (WIB when the school keeps none)
  date       := to_char((v_c.issued_at_iso::timestamptz) at time zone coalesce(
                  (select i.zona_waktu from public.institutions i where i.id = v_c.institution_id), 'Asia/Jakarta'), 'YYYY-MM-DD');
  validity   := case v_c.status when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN'
                                when 'ISSUED' then case when public.sertifikat_ditinjau(v_c.id) then 'DITINJAU' else 'BERLAKU' end end;
  return next;
end $$;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;
grant execute on function public.verify_certificate(text) to service_role;

-- The learner's certificate: whether it is under review.
create or replace function public.sertifikat_saya_ditinjau(p_session uuid)
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then perform public.koreksi_tolak('RESULT_NOT_VISIBLE'); end if;
  return coalesce(public.sertifikat_ditinjau(public.sertifikat_sesi_kini(p_session)), false);
end $$;
revoke all on function public.sertifikat_saya_ditinjau(uuid) from public, anon, authenticated;
grant execute on function public.sertifikat_saya_ditinjau(uuid) to authenticated;

-- Who decides a certificate's review: the issuing school's CAN_PUBLISH through its own role; the platform admin for a
-- Professional Development certificate.
create or replace function public.boleh_putuskan_tinjauan(p_certificate uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select case when public.session_is_professional(c.session_id) then public.is_system_admin()
                               else public.peran_tenant_punya(public.current_person_id(), 'CAN_PUBLISH', c.institution_id) end
                     from public.certificates c where c.id = p_certificate), false)
$$;
revoke all on function public.boleh_putuskan_tinjauan(uuid) from public, anon, authenticated;

create or replace function public.putuskan_tinjauan_sertifikat(p_review uuid, p_keputusan text, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id(); v public.certificate_reviews; c public.certificates;
        v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  select * into v from public.certificate_reviews where id = p_review for update;
  if v.id is null then perform public.koreksi_tolak('CERT_REVIEW_UNKNOWN'); end if;
  if v_me is null or not public.boleh_putuskan_tinjauan(v.certificate_id) then perform public.koreksi_tolak('CERT_REVIEW_NOT_ALLOWED'); end if;
  if v.decision is not null then perform public.koreksi_tolak('CERT_REVIEW_DECIDED'); end if;
  if p_keputusan is null or p_keputusan not in ('CONFIRMED', 'REVOKED') then perform public.koreksi_tolak('CERT_REVIEW_DECISION_INVALID'); end if;
  if char_length(v_alasan) not between 10 and 300 then perform public.koreksi_tolak('CERT_REVIEW_REASON_REQUIRED'); end if;
  select * into c from public.certificates where id = v.certificate_id;
  if p_keputusan = 'REVOKED' and c.status = 'ISSUED' then
    perform public.revoke_certificate(c.id, v_alasan);
  end if;
  update public.certificate_reviews set decision = p_keputusan, decided_at = now(), decided_by_person_id = v_me, reason = v_alasan
   where id = p_review;
  perform public.audit_write('certificate.review_decided', 'certificates', c.id::text, c.institution_id,
    jsonb_build_object('certificate_id', c.id, 'review', p_review, 'decision', p_keputusan, 'reason', v_alasan,
                       'key_correction', v.key_correction_id,
                       'from', jsonb_build_object('status', c.status, 'under_review', true),
                       'to', jsonb_build_object('status', case when p_keputusan = 'REVOKED' then 'REVOKED' else c.status::text end, 'under_review', false)));
  return jsonb_build_object('ok', true, 'tinjauan', p_review, 'keputusan', p_keputusan,
                            'status', (select x.status from public.certificates x where x.id = c.id));
end $$;
revoke all on function public.putuskan_tinjauan_sertifikat(uuid, text, text) from public, anon, authenticated;
grant execute on function public.putuskan_tinjauan_sertifikat(uuid, text, text) to authenticated;

-- Konfigurasi › Sertifikat «Sedang ditinjau (n)»: one school's open reviews (academic) or the platform's (PD).
create or replace function public.tinjauan_sertifikat_antrean(p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null or not (public.peran_tenant_punya(v_me, 'CAN_PUBLISH', p_institution) or public.is_system_admin()) then
    perform public.koreksi_tolak('CERT_REVIEW_NOT_ALLOWED');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('tinjauan', v.id, 'sertifikat', c.id, 'nomor', c.certificate_number,
             'sesi', v.session_id, 'murid', c.person_id, 'nama', p.display_name, 'dibuka_pada', v.opened_at,
             'sebelum', (select r.mastery from public.assessment_results r where r.id = v.previous_result_id),
             'sesudah', (select r.mastery from public.assessment_results r where r.id = v.opened_by_result_id),
             'alasan_koreksi', k.reason, 'boleh_putuskan', public.boleh_putuskan_tinjauan(c.id),
             'paket', (select co.title from public.courses co where co.id = k.course_id),
             'target', (select ss.pass_mark from public.assessment_sessions ss where ss.id = v.session_id)) order by v.opened_at, v.id)
      from public.certificate_reviews v join public.certificates c on c.id = v.certificate_id
      join public.persons p on p.id = c.person_id join public.key_corrections k on k.id = v.key_correction_id
     where v.institution_id = p_institution and v.decision is null and public.boleh_putuskan_tinjauan(c.id)), '[]'::jsonb);
end $$;
revoke all on function public.tinjauan_sertifikat_antrean(uuid) from public, anon, authenticated;
grant execute on function public.tinjauan_sertifikat_antrean(uuid) to authenticated;

-- Konfigurasi › Sertifikat's main list (Daisy Q6): a certificate confirmed after its result was recalculated keeps
-- «Dikonfirmasi setelah dihitung ulang · {alasan}», for the people who may decide its reviews; not while another is open.
create or replace function public.tinjauan_sertifikat_dikonfirmasi(p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null or not (public.peran_tenant_punya(v_me, 'CAN_PUBLISH', p_institution) or public.is_system_admin()) then
    perform public.koreksi_tolak('CERT_REVIEW_NOT_ALLOWED');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('sertifikat', x.certificate_id, 'alasan', x.reason, 'pada', x.decided_at))
      from (select distinct on (v.certificate_id) v.certificate_id, v.reason, v.decided_at, v.decision
              from public.certificate_reviews v
             where v.institution_id = p_institution and v.decision is not null and public.boleh_putuskan_tinjauan(v.certificate_id)
             order by v.certificate_id, v.decided_at desc) x
     where x.decision = 'CONFIRMED' and not public.sertifikat_ditinjau(x.certificate_id)), '[]'::jsonb);
end $$;
revoke all on function public.tinjauan_sertifikat_dikonfirmasi(uuid) from public, anon, authenticated;
grant execute on function public.tinjauan_sertifikat_dikonfirmasi(uuid) to authenticated;

-- Konfigurasi «Yang menunggu»: one school's notices of governed key corrections: its own sittings and certificates,
-- and how many of its reviews still wait.
create or replace function public.pemberitahuan_koreksi_kunci(p_institution uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if v_me is null or not (public.peran_tenant_punya(v_me, 'CAN_PUBLISH', p_institution) or public.peran_tenant_punya(v_me, 'CAN_REVIEW', p_institution)) then
    perform public.koreksi_tolak('CORRECTION_NOT_ALLOWED');
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('pemberitahuan', n.id, 'koreksi', n.key_correction_id, 'pada', n.created_at,
             'paket', (select co.title from public.courses co where co.id = k.course_id),
             'alasan', k.reason, 'sesi', to_jsonb(n.session_ids), 'jumlah_sesi', cardinality(n.session_ids),
             'tinjauan_sertifikat', to_jsonb(n.certificate_review_ids),
             'tinjauan_menunggu', (select count(*) from public.certificate_reviews v where v.id = any (n.certificate_review_ids) and v.decision is null),
             'selesai', not exists (select 1 from public.certificate_reviews v where v.id = any (n.certificate_review_ids) and v.decision is null))
             order by n.created_at desc)
      from public.key_correction_notices n join public.key_corrections k on k.id = n.key_correction_id
     where n.institution_id = p_institution), '[]'::jsonb);
end $$;
revoke all on function public.pemberitahuan_koreksi_kunci(uuid) from public, anon, authenticated;
grant execute on function public.pemberitahuan_koreksi_kunci(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════ the declarations
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('ajukan_koreksi_kunci', 'STAFF',
   'C1w (O41-11, O41-18): the content owner (CAN_PUBLISH through a role of the owning school; the platform library''s own '
   || 'tenant) proposes a corrected key for one published question with a 10-300 reason; one waiting proposal per question. '
   || 'Audited key_correction.proposed. Refusals PR190.', 'CAPABILITY', 'CAN_PUBLISH'),
  ('tolak_koreksi_kunci', 'STAFF',
   'C1w: the second person declines a waiting key correction with a 10-300 reason; never the proposer. Audited. Refusals PR190.',
   'CAPABILITY', 'CAN_REVIEW'),
  ('tegaskan_koreksi_kunci', 'STAFF',
   'C1w (O41-11, O41-22): a different person holding CAN_PUBLISH or CAN_REVIEW in the same tenant confirms: in one '
   || 'transaction a corrected revision is published, existing assignments start on it, every finished sitting is '
   || 'recalculated under the correction (its basis recorded, earlier results kept), certificate reviews are opened and '
   || 'each school is notified. Audited. Refusals PR190.', 'CAPABILITY', 'CAN_REVIEW'),
  ('koreksi_kunci_dampak', 'STAFF',
   'C1w: a correction''s exact counts by the recalculation''s own rule (finished sittings, schools, results and target '
   || 'decisions that change, certificates to be reviewed and newly earnable, open sittings); for school content the '
   || 'sittings themselves; for platform content counts only.', 'CAPABILITY', 'CAN_REVIEW'),
  ('pratinjau_koreksi_kunci', 'STAFF',
   'C1w (Daisy Q6 step 2): before a proposal is sent, the exact counts for the key the owner has chosen, by the '
   || 'recalculation''s own rule; writes nothing; the proposal''s own refusals except the reason. Counts only for platform content.',
   'CAPABILITY', 'CAN_PUBLISH'),
  ('koreksi_kunci_terakhir', 'STAFF',
   'C1w (Daisy Q6): for the questions a package page shows, each one''s latest key correction (waiting, declined with '
   || 'its reason, or confirmed), for the owner and the confirmers of its school only.', 'CAPABILITY', 'CAN_REVIEW'),
  ('koreksi_kunci_antrean', 'STAFF',
   'C1w: one tenant''s waiting key corrections; the caller''s own proposal is marked and is not theirs to confirm.',
   'CAPABILITY', 'CAN_REVIEW'),
  ('hasil_koreksi_saya', 'LEARNER',
   'C1w (O41-21): whether the caller''s own result was corrected by a governed key correction, why and when, the sealed '
   || 'original and the current result, and whether their certificate is under review.', null, null),
  ('riwayat_hasil_sesi', 'STAFF',
   'C1w (O41-22): one sitting''s whole chain of results (sealed, recalculated, key-corrected with its reason and its two '
   || 'people) and which is current, for whoever may see that learner''s results.', 'CAPABILITY', 'CAN_VIEW_LEARNER_RESULT'),
  ('sertifikat_saya_ditinjau', 'LEARNER',
   'C1w (O41-19): whether the caller''s certificate for one sitting is under review after its result changed.', null, null),
  ('putuskan_tinjauan_sertifikat', 'STAFF',
   'C1w (O41-19): the issuing school''s CAN_PUBLISH (the platform admin for Professional Development) confirms a '
   || 'certificate under review (it stays issued) or revokes it through revoke_certificate, with a 10-300 reason; either '
   || 'closes the review. Audited. Refusals PR190.', 'CAPABILITY', 'CAN_PUBLISH'),
  ('tinjauan_sertifikat_antrean', 'STAFF',
   'C1w: one school''s certificates under review after a key correction, with the result before and after.',
   'CAPABILITY', 'CAN_PUBLISH'),
  ('tinjauan_sertifikat_dikonfirmasi', 'STAFF',
   'C1w (Daisy Q6): one school''s certificates confirmed valid after a key correction recalculated their result, with '
   || 'the reason recorded; none while another review of it is open.', 'CAPABILITY', 'CAN_PUBLISH'),
  ('pemberitahuan_koreksi_kunci', 'STAFF',
   'C1w: one school''s notices of governed key corrections, naming only its own sittings and certificate reviews and '
   || 'how many reviews still wait.', 'CAPABILITY', 'CAN_PUBLISH')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Verification (ADR-0003): structural only.
-- ---------------------------------------------------------------------------
do $$
declare f text; v_src text;
begin
  -- recompute_result keeps its platform-only authority and D11 exactly
  v_src := (select prosrc from pg_proc where oid = 'public.recompute_result(uuid, text)'::regprocedure);
  if position('is_system_admin()' in v_src) = 0 or position('PR011' in v_src) = 0 or position('koreksi' in v_src) > 0 then
    raise exception 'C1w: recompute_result was widened';
  end if;
  if not exists (select 1 from pg_constraint where conname = 'results_one_successor') then
    raise exception 'C1w: results_one_successor is gone; exactly one current result is no longer structural';
  end if;
  if position('koreksi_kunci_berwenang' in (select prosrc from pg_proc where oid = 'public.enforce_content_status()'::regprocedure)) = 0
     or position('hasil_murid_id' in (select prosrc from pg_proc where oid = 'public.session_outcome(uuid)'::regprocedure)) = 0
     or position('hasil_murid_id' in (select prosrc from pg_proc where oid = 'public.certificate_eligibility(uuid)'::regprocedure)) = 0
     or position('DITINJAU' in (select prosrc from pg_proc where oid = 'public.verify_certificate(text)'::regprocedure)) = 0 then
    raise exception 'C1w: the correction''s authority, the learner''s reader or the public answer is not wired';
  end if;
  foreach f in array array['koreksi_tolak(text)', 'hitung_ulang_koreksi_kunci(uuid, uuid)', 'koreksi_kunci_berwenang(text, jsonb)',
      'koreksi_kunci_pindah(uuid, uuid, uuid)', 'koreksi_kunci_hitung(uuid)', 'koreksi_kunci_hitung_untuk(uuid, text[])', 'sesi_peta_kunci(uuid, jsonb)',
      'evaluate_session_kunci(uuid, jsonb)', 'grade_kunci(uuid, jsonb, text[])', 'hasil_murid_id(uuid)', 'hasil_terkini_id(uuid)',
      'soal_ujung(uuid)', 'soal_anak_sah(uuid)', 'soal_leluhur_sah(uuid)', 'koreksi_pemilik(uuid, uuid)', 'koreksi_penegas(uuid, uuid)',
      'peran_tenant_punya(uuid, text, uuid)', 'nilai_jawaban_berlaku(uuid, uuid, jsonb)', 'sertifikat_ditinjau(uuid)'] loop
    if has_function_privilege('authenticated', ('public.' || f)::regprocedure, 'execute')
       or has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'C1w: % is callable by a client', f;
    end if;
  end loop;
  foreach f in array array['ajukan_koreksi_kunci(uuid, text[], text)', 'tolak_koreksi_kunci(uuid, text)', 'tegaskan_koreksi_kunci(uuid)',
      'koreksi_kunci_dampak(uuid)', 'pratinjau_koreksi_kunci(uuid, text[])', 'koreksi_kunci_terakhir(uuid[])', 'koreksi_kunci_antrean(uuid)', 'hasil_koreksi_saya(uuid)', 'riwayat_hasil_sesi(uuid)',
      'sertifikat_saya_ditinjau(uuid)', 'putuskan_tinjauan_sertifikat(uuid, text, text)', 'tinjauan_sertifikat_antrean(uuid)', 'tinjauan_sertifikat_dikonfirmasi(uuid)',
      'pemberitahuan_koreksi_kunci(uuid)'] loop
    if has_function_privilege('anon', ('public.' || f)::regprocedure, 'execute') then
      raise exception 'C1w: an anonymous caller can call %', f;
    end if;
  end loop;
  if exists (select 1 from information_schema.role_table_grants g
              where g.table_schema = 'public' and g.grantee in ('anon', 'authenticated')
                and g.table_name in ('key_corrections', 'assessment_result_bases', 'certificate_reviews', 'key_correction_notices')) then
    raise exception 'C1w: a client role reaches a key-correction table directly';
  end if;
  raise notice 'C1w (part two) verified: a key correction is proposed by its content''s owner and confirmed by another person; it publishes a corrected revision, moves new starts onto it and recalculates under its own authority with its basis; recompute_result and D11 are unchanged; a certificate whose result changed is under review';
end $$;
