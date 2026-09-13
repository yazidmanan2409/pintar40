-- 0058 -- the Studio surfaces: one calm state, the task-first home, the two
-- review decisions, and the certificate template manager.
--
-- ONE STATE, COMPOSED SERVER-SIDE. The brief asks for a single surface state --
-- Ready / Action Required / Blocked -- over three things that are separate
-- underneath: technical validation, academic approval, and publish readiness.
-- `publish_readiness` is the findings gate and stays exactly that; it is what
-- `enforce_release_publish_readiness` consults at the moment of publication and
-- nothing here changes it. `studio_package_state` is the COMPOSITION the brief
-- describes: it reads publish_readiness rather than reimplementing it, and adds
-- the lifecycle facts a human can act on ("not yet approved", "not yet sealed").
-- Composing it in the database rather than in the page means the API and the UI
-- cannot disagree about what a package's state is.
--
-- NO LIFECYCLE ENUM REACHES THE SURFACE. Every reason this function returns is
-- a sentence in Indonesian. `VALIDATION_FAILED`, `FROZEN`, `INGESTED` and the
-- version string appear nowhere in its output, which is asserted rather than
-- reviewed by eye (§12).
--
-- THE TWO REVIEW DECISIONS ARE DECISIONS, NOT VERDICTS. Integrity review
-- records a human's decision to the audit trail and writes no second log table
-- and no verdict column -- there is nothing in this migration a learner could
-- be shown as an accusation. Question Health review walks the existing
-- `question_health_transitions` graph; it computes nothing, and while FABLE-06
-- has not run there is nothing to review, which the surface says honestly
-- rather than hiding.
--
-- CERTIFICATE TEMPLATES ARE LAYOUT AND NUMBERING ONLY. Identity presentation
-- stays name-only until OD-10 is answered, enforced by a check constraint
-- rather than by a convention, and nothing here can widen the public
-- verification payload, which is fixed at {pass, predikat, institution, date,
-- validity}. ADR-0017.

-- ---------------------------------------------------------------------------
-- 1. The one calm state.
-- ---------------------------------------------------------------------------
create function public.studio_package_state(p_course uuid)
returns table (surface_state text, reasons text[], preview_lesson_id uuid)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  c record; v_status text; v_blockers text[]; v_reasons text[] := '{}';
  n_unvalidated int; n_unapproved int; v_release record;
begin
  select * into c from public.courses where id = p_course;
  if c.id is null then raise exception 'unknown course %', p_course; end if;
  if not (public.can_in_institution('CAN_DRAFT', c.institution_id)
       or public.can_in_institution('CAN_ASSIGN_LEARNING', c.institution_id)) then
    raise exception 'reading a package''s state requires CAN_DRAFT or CAN_ASSIGN_LEARNING in the owning institution';
  end if;

  -- the findings gate, read not reimplemented
  select pr.status, pr.blockers into v_status, v_blockers from public.publish_readiness(p_course) pr;
  v_reasons := v_reasons || coalesce(v_blockers, '{}'::text[]);

  -- technical validation: anything still short of VALIDATED is work a human
  -- can do in Studio now
  select count(*) into n_unvalidated from (
    select 1 from public.courses x where x.id = p_course and x.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.modules m where m.course_id = p_course and m.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
     where m.course_id = p_course and l.status in ('INGESTED','STRUCTURED')
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.status in ('INGESTED','STRUCTURED')) t;
  if n_unvalidated > 0 then
    v_reasons := v_reasons || format('%s bagian isi belum lulus pemeriksaan teknis', n_unvalidated);
  end if;

  select count(*) into n_unapproved from (
    select 1 from public.courses x where x.id = p_course and x.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.modules m where m.course_id = p_course and m.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.lessons l join public.modules m on m.id = l.module_id
     where m.course_id = p_course and l.status = 'VALIDATION_FAILED'
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.status = 'VALIDATION_FAILED') t;
  if n_unapproved > 0 then
    v_reasons := v_reasons || format('%s bagian isi dikembalikan untuk diperbaiki', n_unapproved);
    v_status := 'BLOCKED';
  end if;

  -- academic sign-off
  select count(*) into n_unapproved from (
    select 1 from public.courses x where x.id = p_course and x.reviewed_by_person_id is null
    union all
    select 1 from public.items i join public.lessons l on l.id = i.lesson_id
      join public.modules m on m.id = l.module_id
     where m.course_id = p_course and i.reviewed_by_person_id is null) t;
  if n_unapproved > 0 then
    v_reasons := v_reasons || format('%s bagian isi menunggu persetujuan akademik', n_unapproved);
  end if;

  -- the seal
  select r.id, r.status, r.version_label into v_release
    from public.plp_releases r where r.course_id = p_course
   order by r.created_at desc limit 1;
  if v_release.id is null then
    v_reasons := v_reasons || 'paket ini belum memiliki terbitan'::text;
  elsif not public.content_is_sealed(p_course) then
    v_reasons := v_reasons || 'isi paket belum dikunci; setelah dikunci isi tidak dapat diubah lagi'::text;
  end if;

  if v_status = 'BLOCKED' then
    surface_state := 'BLOCKED';
  elsif array_length(v_reasons, 1) > 0 then
    surface_state := 'ACTION_REQUIRED';
  else
    surface_state := 'READY';
  end if;
  reasons := v_reasons;

  select l.id into preview_lesson_id from public.lessons l
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course order by m.ordinal, l.ordinal limit 1;
  return next;
end $$;
revoke all on function public.studio_package_state(uuid) from public, anon, authenticated;
grant execute on function public.studio_package_state(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('studio_package_state', 'STAFF',
   'The one calm package state the Studio shows: READY / ACTION_REQUIRED / BLOCKED plus a '
   'plain-language list. Composes publish_readiness with the lifecycle facts; reimplements '
   'neither. Returns no lifecycle enum and no version string.');

-- ---------------------------------------------------------------------------
-- 2. The task-first home. A card with a zero count does not render, so the
-- function returns no row for an empty bucket rather than a row saying nought.
-- ---------------------------------------------------------------------------
create function public.studio_home()
returns table (bucket text, institution_id uuid, count int)
language sql stable security definer set search_path = public, pg_temp as $$
  with mine as (
    select i.id, i.name from public.institutions i
     where public.can_in_institution('CAN_DRAFT', i.id)
        or public.can_in_institution('CAN_REVIEW', i.id)
        or public.can_in_institution('CAN_ASSIGN_LEARNING', i.id)
  )
  select 'ACTION_REQUIRED', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and c.status in ('INGESTED','STRUCTURED','VALIDATION_FAILED')
   group by m.id having count(*) > 0
  union all
  select 'AWAITING_MY_REVIEW', m.id, count(*)::int
    from mine m join public.courses c on c.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW', m.id)
     and c.status = 'IN_REVIEW'
     and c.author_person_id is distinct from public.current_person_id()
   group by m.id having count(*) > 0
  union all
  select 'BLOCKED', m.id, count(distinct f.course_id)::int
    from mine m join public.mcq_quality_findings f on f.institution_id = m.id
   where public.can_in_institution('CAN_DRAFT', m.id)
     and f.severity = 'ERROR' and f.acknowledged_at is null
   group by m.id having count(*) > 0
  union all
  select 'QUESTION_HEALTH', m.id, count(*)::int
    from mine m join public.question_health q on q.institution_id = m.id
   where public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', m.id)
     and q.state = 'SIGNAL_RAISED'
   group by m.id having count(*) > 0
  union all
  select 'DISTRIBUTED_CANONICAL', d.institution_id, count(*)::int
    from public.release_distributions d
   where d.status = 'ACTIVE'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
   group by d.institution_id having count(*) > 0
$$;
revoke all on function public.studio_home() from public, anon, authenticated;
grant execute on function public.studio_home() to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('studio_home', 'STAFF',
   'Task-first counts for the Studio home. An empty bucket returns no row at all, so a card '
   'with a zero count cannot render. Every bucket is gated on the capability that would let '
   'the caller act on it.');

-- ---------------------------------------------------------------------------
-- 3. Integrity review: a recorded human decision, never a verdict.
-- ---------------------------------------------------------------------------
create function public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; sig record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording an integrity review requires an authenticated actor'; end if;
  if p_decision not in ('NO_CONCERN', 'DISCUSSED_WITH_LEARNER', 'REFERRED_TO_INSTITUTION') then
    raise exception
      'an integrity review records what the reviewer did, not a verdict about the learner: unknown decision %',
      p_decision;
  end if;

  select s.id, s.institution_id, s.session_id, s.category into sig
    from public.integrity_signals s where s.id = p_signal;
  if sig.id is null then raise exception 'unknown integrity signal %', p_signal; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note));
  return p_signal;
end $$;
revoke all on function public.record_integrity_review(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('record_integrity_review', 'STAFF',
   'Records a CAN_REVIEW_INTEGRITY holder''s decision as an audit row. The three decisions '
   'describe what the reviewer did; none is a finding about the learner, and no outcome is '
   'written back onto the signal or onto any result.');

-- ---------------------------------------------------------------------------
-- 4. Question Health review: the existing transition graph, no computation.
-- ---------------------------------------------------------------------------
create function public.record_question_health_review(
  p_item uuid, p_decision public.question_health_state, p_note text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; q record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording a Question Health review requires an authenticated actor'; end if;
  if p_decision not in ('UNDER_REVIEW', 'ACKNOWLEDGED_OK', 'ACTION_TAKEN') then
    raise exception 'a reviewer records UNDER_REVIEW, ACKNOWLEDGED_OK or ACTION_TAKEN, not %', p_decision;
  end if;

  select h.item_id, h.institution_id, h.state, h.evidence_count into q
    from public.question_health h where h.item_id = p_item;
  if q.item_id is null then
    raise exception 'this question has no health record yet; there is not enough evidence to review';
  end if;
  if not public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', q.institution_id) then
    raise exception 'reviewing Question Health requires CAN_REVIEW_QUESTION_HEALTH in the owning institution';
  end if;
  if not exists (select 1 from public.question_health_transitions t
                  where t.from_state = q.state and t.to_state = p_decision) then
    raise exception 'a Question Health record does not move from % to %', q.state, p_decision;
  end if;

  update public.question_health
     set state = p_decision, reviewed_by_person_id = v_actor, reviewed_at = now(),
         note = p_note, updated_at = now()
   where item_id = p_item;

  perform public.audit_write('QUESTION_HEALTH_REVIEWED', 'question_health', p_item::text,
    q.institution_id,
    jsonb_build_object('from_state', q.state, 'to_state', p_decision,
                       'evidence_count', q.evidence_count, 'note', p_note));
  return p_item;
end $$;
revoke all on function public.record_question_health_review(uuid, public.question_health_state, text)
  from public, anon, authenticated;
grant execute on function public.record_question_health_review(uuid, public.question_health_state, text)
  to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('record_question_health_review', 'STAFF',
   'Moves a Question Health record along the existing transition graph on a human decision. '
   'Computes nothing: FABLE-06 raises the signal, and until it does there is nothing here to '
   'review, which the surface says rather than hides.');

-- ---------------------------------------------------------------------------
-- 5. Certificate templates: layout and numbering, nothing about identity.
-- ---------------------------------------------------------------------------
create table public.certificate_templates (
  id                  uuid primary key default gen_random_uuid(),
  institution_id      uuid not null references public.institutions(id),
  course_id           uuid references public.courses(id),
  module_id           uuid references public.modules(id),
  layout              text not null,
  number_prefix       text not null,
  identity_presentation text not null default 'NAME_ONLY',
  created_by_person_id uuid not null references public.persons(id),
  created_at          timestamptz not null default now(),
  constraint certificate_templates_scope_one check (num_nonnulls(course_id, module_id) <= 1),
  constraint certificate_templates_layout_known check (layout in ('CLASSIC', 'MODERN', 'MINIMAL')),
  constraint certificate_templates_prefix_shape
    check (number_prefix ~ '^[A-Z0-9]{2,12}(/[A-Z0-9]{1,8})*$'),
  -- OD-10 is unanswered. Until it is, there is exactly one identity
  -- presentation, and this constraint is why no later edit can introduce a
  -- second by accident.
  constraint certificate_templates_identity_is_name_only
    check (identity_presentation = 'NAME_ONLY')
);
create unique index certificate_templates_one_per_scope
  on public.certificate_templates (institution_id, coalesce(course_id, module_id, institution_id));
alter table public.certificate_templates enable row level security;
alter table public.certificate_templates force row level security;
grant select on public.certificate_templates to authenticated;
create policy certificate_templates_select on public.certificate_templates
  for select to authenticated using (public.can_in_institution('CAN_PUBLISH', institution_id));
insert into public.record_class_registry (table_name, portability, note) values
  ('certificate_templates', 'INSTITUTION_SCOPED',
   'Layout and numbering configuration belonging to the issuing institution. Carries no learner '
   'data and no identity-presentation choice beyond NAME_ONLY while OD-10 is open.');

create function public.save_certificate_template(
  p_institution uuid, p_course uuid, p_module uuid, p_layout text, p_number_prefix text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; v_id uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'saving a certificate template requires an authenticated actor'; end if;
  if not public.can_in_institution('CAN_PUBLISH', p_institution) then
    raise exception 'the certificate template manager requires CAN_PUBLISH in the owning institution';
  end if;
  if p_course is not null and not exists (
       select 1 from public.courses c where c.id = p_course and c.institution_id = p_institution) then
    raise exception 'that course belongs to another institution (INV-13)';
  end if;
  if p_module is not null and not exists (
       select 1 from public.modules m where m.id = p_module and m.institution_id = p_institution) then
    raise exception 'that module belongs to another institution (INV-13)';
  end if;

  insert into public.certificate_templates
    (institution_id, course_id, module_id, layout, number_prefix, created_by_person_id)
  values (p_institution, p_course, p_module, p_layout, p_number_prefix, v_actor)
  on conflict (institution_id, coalesce(course_id, module_id, institution_id)) do update
    set layout = excluded.layout, number_prefix = excluded.number_prefix,
        created_by_person_id = excluded.created_by_person_id
  returning id into v_id;

  perform public.audit_write('CERTIFICATE_TEMPLATE_SAVED', 'certificate_templates', v_id::text,
    p_institution,
    jsonb_build_object('course_id', p_course, 'module_id', p_module, 'layout', p_layout,
                       'number_prefix', p_number_prefix, 'identity_presentation', 'NAME_ONLY'));
  return v_id;
end $$;
revoke all on function public.save_certificate_template(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.save_certificate_template(uuid, uuid, uuid, text, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('save_certificate_template', 'STAFF',
   'Layout and numbering prefix per institution, course or module. CAN_PUBLISH only. Identity '
   'presentation is NAME_ONLY and is not a parameter, because OD-10 has not been answered.');

-- ---------------------------------------------------------------------------
-- 6. Publishing and withdrawing through one audited path.
-- ---------------------------------------------------------------------------
create function public.publish_release(p_release uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_actor uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'publishing requires an authenticated actor'; end if;
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null then raise exception 'unknown release %', p_release; end if;
  if not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32)';
  end if;

  -- The readiness gate is the trigger's, not a second copy here; this update
  -- passes through enforce_release_publish_readiness exactly as a direct one
  -- would, so a Blocked package is refused server-side either way.
  update public.plp_releases set status = 'PUBLISHED' where id = p_release;

  perform public.audit_write('RELEASE_PUBLISHED', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'assigns_nothing', true));
  return p_release;
end $$;
revoke all on function public.publish_release(uuid) from public, anon, authenticated;
grant execute on function public.publish_release(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('publish_release', 'STAFF',
   'Publishes a frozen release under CAN_PUBLISH, through the same readiness trigger a direct '
   'update passes. Publishing assigns nothing; the audit row says so.');

create function public.withdraw_release(p_release uuid, p_reason text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_actor uuid;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'withdrawing requires an authenticated actor'; end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'a withdrawal records why; the reason is not optional';
  end if;
  select pr.id, pr.status, pr.institution_id, pr.course_id, pr.version_label into r
    from public.plp_releases pr where pr.id = p_release;
  if r.id is null then raise exception 'unknown release %', p_release; end if;
  if r.status <> 'PUBLISHED' then
    raise exception 'only a published release is withdrawn; this one is %', r.status;
  end if;
  if not public.can_in_institution('CAN_PUBLISH', r.institution_id) then
    raise exception 'withdrawing requires CAN_PUBLISH in the owning institution';
  end if;

  -- SUPERSEDED, never deleted: the chain stays intact and every session,
  -- result and certificate already bound to this release stays bound to it.
  update public.plp_releases set status = 'SUPERSEDED' where id = p_release;

  perform public.audit_write('RELEASE_WITHDRAWN', 'plp_releases', p_release::text, r.institution_id,
    jsonb_build_object('course_id', r.course_id, 'version_label', r.version_label,
                       'reason', p_reason, 'evidence_untouched', true));
  return p_release;
end $$;
revoke all on function public.withdraw_release(uuid, text) from public, anon, authenticated;
grant execute on function public.withdraw_release(uuid, text) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('withdraw_release', 'STAFF',
   'Moves a published release to SUPERSEDED under CAN_PUBLISH, chain intact and never deleted. '
   'Existing evidence, results and certificates are untouched.');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_uid uuid; v_p uuid; v_course uuid; v_mod uuid; v_les uuid;
  n int; v_raised boolean; v_state text; v_reasons text[]; r text;
begin
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe inst 0058', 'probe-inst-0058', true, true) returning id into v_inst;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0058@local.invalid')
    returning id into v_uid;
    select a.person_id into v_p from public.accounts a where a.auth_user_id = v_uid;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p, 'INSTITUTION_ADMIN', v_inst, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);

    insert into public.courses (institution_id, subject, stage, grade_label, title, status)
    values (v_inst, 'Matematika', 'SMA', 'X', 'probe course 0058', 'INGESTED') returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, status)
    values (v_course, v_inst, 1, 'probe module', 'INGESTED') returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, status)
    values (v_mod, v_inst, 1, 'probe lesson', 'INGESTED') returning id into v_les;

    -- a fresh package is never READY, and every reason is a sentence
    select s.surface_state, s.reasons into v_state, v_reasons
      from public.studio_package_state(v_course) s;
    if v_state = 'READY' then raise exception 'an unvalidated, unapproved, unsealed package read as READY'; end if;
    if array_length(v_reasons, 1) is null then raise exception 'ACTION_REQUIRED with no reason given'; end if;
    foreach r in array v_reasons loop
      if r ~ '(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|PUBLISHED|SUPERSEDED)'
         or r ~ '[0-9]+\.[0-9]+\.[0-9]+' then
        raise exception 'a lifecycle enum or version string reached the Studio surface: %', r;
      end if;
    end loop;

    -- the home renders no zero card
    select count(*) into n from public.studio_home() where count = 0;
    if n <> 0 then raise exception 'the Studio home returned % zero-count bucket(s)', n; end if;
    select count(*) into n from public.studio_home() where bucket = 'ACTION_REQUIRED';
    if n <> 1 then raise exception 'the drafted package did not reach the Action Required bucket'; end if;
    select count(*) into n from public.studio_home() where bucket = 'QUESTION_HEALTH';
    if n <> 0 then raise exception 'a Question Health card rendered with nothing computed yet'; end if;

    -- the certificate template manager
    declare v_tpl uuid;
    begin
      v_tpl := public.save_certificate_template(v_inst, v_course, null, 'CLASSIC', 'PNT/2026');
      if v_tpl is null then raise exception 'a valid certificate template was refused'; end if;
      -- saving again updates rather than duplicating
      perform public.save_certificate_template(v_inst, v_course, null, 'MODERN', 'PNT/2027');
      select count(*) into n from public.certificate_templates
       where institution_id = v_inst and course_id = v_course;
      if n <> 1 then raise exception 'the template manager wrote % rows for one scope', n; end if;
    end;
    v_raised := false;
    begin
      update public.certificate_templates set identity_presentation = 'NAME_AND_PHOTO'
       where institution_id = v_inst;
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'identity presentation was widened while OD-10 is open';
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the OD-10 probe did not run'; end if;

    -- an unknown integrity decision is refused, and a verdict is not a decision
    v_raised := false;
    begin
      perform public.record_integrity_review(gen_random_uuid(), 'CHEATED', 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'an accusatory integrity verdict was accepted';
      end if;
      if sqlerrm !~ 'not a verdict' then
        raise exception 'the verdict probe was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the verdict probe did not run'; end if;

    -- nothing to review while FABLE-06 has computed nothing, said honestly
    v_raised := false;
    begin
      perform public.record_question_health_review(gen_random_uuid(), 'ACKNOWLEDGED_OK', 'probe');
      raise exception 'GUARD_DID_NOT_FIRE';
    exception when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a Question Health review was accepted with no health record';
      end if;
      if sqlerrm !~ 'not enough evidence' then
        raise exception 'the empty Question Health probe was refused for the wrong reason: %', sqlerrm;
      end if;
      v_raised := true;
    end;
    if not v_raised then raise exception 'the Question Health probe did not run'; end if;

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0058';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- structural: the composition reads the findings gate rather than restating it
  if pg_get_functiondef('public.studio_package_state(uuid)'::regprocedure) !~ 'publish_readiness' then
    raise exception 'the Studio state does not read publish_readiness; that is a second validator';
  end if;
  if pg_get_functiondef('public.studio_package_state(uuid)'::regprocedure) ~ 'mcq_quality_findings' then
    raise exception 'the Studio state counts findings itself instead of reading the gate';
  end if;
  -- the integrity path writes no outcome column and no second log
  if pg_get_functiondef('public.record_integrity_review(uuid,text,text)'::regprocedure)
       ~* 'update public\.integrity_signals|insert into public\.integrity' then
    raise exception 'the integrity review mutates the signal or writes a second log';
  end if;
  -- nothing here widened the public verification payload
  select count(*) into n from public.public_surface_registry where parent is null;
  if n <> 2 then raise exception 'the anonymous surface moved to % declared surfaces', n; end if;

  raise notice '0058 verified: one calm state, no zero cards, decisions not verdicts, OD-10 held';
end $$;
