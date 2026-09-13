-- 0056 -- the canonical read path, the registry notes, and the FABLE-06 hook.
--
-- WHY ACCESSORS AND NOT WIDER POLICIES. The seven content SELECT policies all
-- read `can_in_institution('CAN_DRAFT', institution_id)`. Widening them to
-- admit canonical content would put an OR inside the predicate that every
-- authoring path also reads, and the same predicate would then be answering two
-- different questions -- "may I edit this?" and "may I look at this?" -- which
-- is how a read grant quietly becomes a write grant. The policies are left
-- exactly as they are, and reading distributed canonical content goes through
-- named SECURITY DEFINER accessors instead. A school holds no role assignment
-- in the canonical tenant, so its inability to write is structural: there is no
-- policy to get past, because there is no policy that would ever admit it.
--
-- NO NEW CAPABILITY. The accessors gate on capabilities that already exist and
-- already mean what is needed -- CAN_ASSIGN_LEARNING (this is content I might
-- assign) and CAN_DRAFT (this is content I am building alongside). Inventing a
-- CAN_READ_CANONICAL would create a capability whose name invites a later
-- author to treat it as an authoring grant.
--
-- WHAT IS AND IS NOT EXPOSED. The catalogue, the structure, and the sanitized
-- lesson body for preview. NOT the correctness mapping or option rationales:
-- those are assessment secrets, preview is defined as the sanitized learner
-- view, and a consuming school has no authoring reason to hold another tenant's
-- answer key. This is not a narrowing of anything that existed -- a school
-- could read none of this before -- it is the smallest widening that makes
-- "visible, assignable, previewable, no authoring action" true.
--
-- THE FABLE-06 HOOK EXPOSES AND COMPUTES NOTHING. `content_ownership_lineage`
-- is a security_invoker view: every row it returns is a row the caller could
-- already read, joined to the two dimensions FABLE-06 needs -- the owner's
-- tenant_kind, and the lineage pointer. No aggregate, no metric, no signal.
-- ADR-0015, ADR-0016.

-- ---------------------------------------------------------------------------
-- 1. May this caller read this distributed release?
-- ---------------------------------------------------------------------------
create function public.caller_may_read_distributed_release(p_release uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.release_distributions d
     where d.plp_release_id = p_release
       and d.status = 'ACTIVE'
       and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
         or public.can_in_institution('CAN_DRAFT', d.institution_id))
       and public.release_is_distributed_to(p_release, d.institution_id)
  )
$$;
revoke all on function public.caller_may_read_distributed_release(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The catalogue. "What canonical content may my school teach?"
-- ---------------------------------------------------------------------------
create function public.distributed_releases()
returns table (
  plp_release_id uuid, version_label text, published_at timestamptz,
  course_id uuid, course_title text, subject text, stage text, grade_label text,
  owner_institution_id uuid, owner_name text,
  consuming_institution_id uuid, distribution_status public.distribution_status,
  authorized_at timestamptz, withdrawn_at timestamptz,
  supersedes_release_id uuid, supersedes_course_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  select r.id, r.version_label, r.published_at,
         c.id, c.title, c.subject, c.stage, c.grade_label,
         owner.id, owner.name,
         d.institution_id, d.status, d.authorized_at, d.withdrawn_at,
         r.supersedes_release_id, c.supersedes_course_id
    from public.release_distributions d
    join public.plp_releases r on r.id = d.plp_release_id
    join public.courses c on c.id = r.course_id
    join public.institutions owner on owner.id = r.institution_id
   where owner.tenant_kind = 'PLATFORM_CANONICAL'
     and (public.can_in_institution('CAN_ASSIGN_LEARNING', d.institution_id)
       or public.can_in_institution('CAN_DRAFT', d.institution_id))
$$;
revoke all on function public.distributed_releases() from public, anon, authenticated;
grant execute on function public.distributed_releases() to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('distributed_releases', 'STAFF',
   'The canonical releases the caller''s institution may teach, withdrawn ones included so '
   'Studio can say why an assignment produces no new sessions. Read-only; offers no authoring '
   'action and no answer key.');

-- ---------------------------------------------------------------------------
-- 3. The structure. "What is inside it?"
-- ---------------------------------------------------------------------------
create function public.distributed_release_outline(p_release uuid)
returns table (
  module_id uuid, module_ordinal smallint, module_title text,
  lesson_id uuid, lesson_ordinal smallint, lesson_title text, lesson_summary text,
  objective_count int, item_count int)
language sql stable security definer set search_path = public, pg_temp as $$
  select m.id, m.ordinal, m.title, l.id, l.ordinal, l.title, l.summary,
         (select count(*)::int from public.learning_objectives lo where lo.lesson_id = l.id),
         (select count(*)::int from public.items i where i.lesson_id = l.id)
    from public.plp_releases r
    join public.modules m on m.course_id = r.course_id
    left join public.lessons l on l.module_id = m.id
   where r.id = p_release
     and public.caller_may_read_distributed_release(p_release)
   order by m.ordinal, l.ordinal
$$;
revoke all on function public.distributed_release_outline(uuid) from public, anon, authenticated;
grant execute on function public.distributed_release_outline(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('distributed_release_outline', 'STAFF',
   'Module/lesson structure of a distributed canonical release, gated on an active grant held '
   'by an institution the caller is staff in. Counts only -- no item content, no answer key.');

-- ---------------------------------------------------------------------------
-- 4. Preview: the sanitized learner view of one lesson.
-- ---------------------------------------------------------------------------
create function public.distributed_lesson_preview(p_lesson uuid)
returns table (
  lesson_id uuid, title text, summary text, body_markdown text,
  worked_examples jsonb, media jsonb, page_citation text,
  objectives jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select l.id, l.title, l.summary, l.body_markdown, l.worked_examples, l.media, l.page_citation,
         coalesce((select jsonb_agg(jsonb_build_object('code', lo.code, 'statement', lo.statement,
                                                       'bloom', lo.bloom, 'is_core', lo.is_core)
                                    order by lo.code)
                     from public.learning_objectives lo where lo.lesson_id = l.id), '[]'::jsonb)
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.plp_releases r on r.course_id = m.course_id
   where l.id = p_lesson
     and public.caller_may_read_distributed_release(r.id)
$$;
revoke all on function public.distributed_lesson_preview(uuid) from public, anon, authenticated;
grant execute on function public.distributed_lesson_preview(uuid) to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('distributed_lesson_preview', 'STAFF',
   'The sanitized lesson body of distributed canonical content, for Studio preview. Carries no '
   'item, no option, no correctness mapping and no rationale -- preview is the learner view.');

-- ---------------------------------------------------------------------------
-- 5. The FABLE-06 hook. Two dimensions, nothing computed.
-- ---------------------------------------------------------------------------
create view public.content_ownership_lineage
  with (security_invoker = true) as
  select i.id                      as item_id,
         i.supersedes_item_id      as supersedes_item_id,
         i.institution_id          as owner_institution_id,
         owner.tenant_kind         as owner_tenant_kind,
         l.id                      as lesson_id,
         l.supersedes_lesson_id    as supersedes_lesson_id,
         m.id                      as module_id,
         m.supersedes_module_id    as supersedes_module_id,
         m.course_id               as course_id,
         c.supersedes_course_id    as supersedes_course_id
    from public.items i
    join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.institutions owner on owner.id = i.institution_id;

grant select on public.content_ownership_lineage to authenticated;

comment on view public.content_ownership_lineage is
  'FABLE-06 hook (ADR-0015 §5.8). security_invoker, so it returns exactly the rows the caller '
  'could already read and widens nothing. Exposes the two dimensions FABLE-06 needs to keep a '
  'canonical-global signal apart from an institution-local one: the owner''s tenant_kind, and '
  'the lineage pointers. It computes nothing, and FABLE-06 may aggregate across a lineage only '
  'where the metric''s own semantics permit it.';

-- ---------------------------------------------------------------------------
-- 6. record_class_registry: the distinction, written down.
--
-- Institution-owned content keeps INSTITUTION_SCOPED. Canonical content belongs
-- to no institution, so the transfer question does not arise for it -- and that
-- is recorded through tenant_kind rather than a third record_portability value.
-- A new enum label would be an enum change with its own ADR, and would imply
-- canonical content participates in transfer at all, which it does not.
-- ---------------------------------------------------------------------------
update public.record_class_registry
   set note = coalesce(note || ' ', '') ||
       'Ownership is the owning institution''s tenant_kind: rows owned by an INSTITUTION are '
       'institution-scoped in the ordinary way; rows owned by a PLATFORM_CANONICAL tenant belong '
       'to no institution and no transfer question arises for them. Recorded through tenant_kind, '
       'deliberately not a third record_portability value (ADR-0015 §5.7).'
 where table_name in ('courses','modules','lessons','learning_objectives','items','item_options',
                      'assessment_definitions','plp_releases');

-- ---------------------------------------------------------------------------
-- Terminal verification. Builds its own data and rolls it back (ADR-0014).
-- ---------------------------------------------------------------------------
do $$
declare
  v_canon uuid; v_a uuid; v_b uuid; v_uid_a uuid; v_uid_b uuid;
  v_pa uuid; v_pb uuid; v_course uuid; v_mod uuid; v_les uuid; v_rel uuid;
  v_item uuid; n int;
begin
  select id into v_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' limit 1;
  if v_canon is null then raise exception 'no canonical tenant to probe with'; end if;

  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe A 0056', 'probe-a-0056', true, true) returning id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe B 0056', 'probe-b-0056', true, true) returning id into v_b;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-a-0056@local.invalid')
    returning id into v_uid_a;
    select a.person_id into v_pa from public.accounts a where a.auth_user_id = v_uid_a;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-b-0056@local.invalid')
    returning id into v_uid_b;
    select a.person_id into v_pb from public.accounts a where a.auth_user_id = v_uid_b;

    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_pa, 'INSTITUTION_ADMIN', v_a, now() - interval '1 day', now() + interval '365 days'),
           (v_pb, 'INSTITUTION_ADMIN', v_b, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    insert into public.courses (institution_id, subject, stage, grade_label, title, status, author_person_id)
    values (v_canon, 'Matematika', 'SMA', 'X', 'probe canonical 0056', 'INGESTED', v_pa)
    returning id into v_course;
    insert into public.modules (course_id, institution_id, ordinal, title, status, author_person_id)
    values (v_course, v_canon, 1, 'probe module 0056', 'INGESTED', v_pa) returning id into v_mod;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown, status, author_person_id)
    values (v_mod, v_canon, 1, 'probe lesson 0056', 'isi pelajaran', 'INGESTED', v_pa) returning id into v_les;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, status, author_person_id)
    values (v_les, v_canon, 'MCQ_SINGLE', 'PRACTICE', 'probe stem 0056', 'INGESTED', v_pa)
    returning id into v_item;
    insert into public.plp_releases (institution_id, course_id, version_label, status, author_person_id)
    values (v_canon, v_course, '1.0.0', 'INGESTED', v_pa) returning id into v_rel;

    -- A holds a grant; B does not.
    insert into public.release_distributions
      (plp_release_id, institution_id, authorized_by_person_id, reason)
    values (v_rel, v_a, v_pa, 'probe');

    -- as A's administrator: the release is in the catalogue and readable
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    -- the internal predicate is checked before dropping privileges, because it
    -- is deliberately not executable by a client role
    if not public.caller_may_read_distributed_release(v_rel) then
      raise exception 'a granted institution''s staff cannot read the distributed release';
    end if;
    -- and everything after this runs as the client role, so RLS is actually in
    -- force: a superuser DO block bypasses every policy and the direct-select
    -- probe below would be vacuous
    set local role authenticated;
    select count(*) into n from public.distributed_releases() where plp_release_id = v_rel;
    if n <> 1 then raise exception 'the catalogue returned % row(s) for the granted release', n; end if;
    select count(*) into n from public.distributed_release_outline(v_rel);
    if n <> 1 then raise exception 'the outline returned % row(s), expected 1 lesson', n; end if;
    select count(*) into n from public.distributed_lesson_preview(v_les);
    if n <> 1 then raise exception 'the preview returned % row(s)', n; end if;

    -- and still cannot WRITE it: the content policies were not widened
    select count(*) into n from public.courses where id = v_course;
    if n <> 0 then
      raise exception 'a consuming institution can SELECT canonical content rows directly; the policies were widened';
    end if;

    reset role;

    -- as B's administrator, with no grant: nothing at all
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    if public.caller_may_read_distributed_release(v_rel) then
      raise exception 'an institution with no grant can read the distributed release';
    end if;
    set local role authenticated;
    select count(*) into n from public.distributed_releases();
    if n <> 0 then raise exception 'the catalogue returned % row(s) to an ungranted institution', n; end if;
    select count(*) into n from public.distributed_release_outline(v_rel);
    if n <> 0 then raise exception 'the outline returned % row(s) to an ungranted institution', n; end if;
    select count(*) into n from public.distributed_lesson_preview(v_les);
    if n <> 0 then raise exception 'the preview returned % row(s) to an ungranted institution', n; end if;

    reset role;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    reset role;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug like 'probe-%-0056';
  if n <> 0 then raise exception 'the probe left % institution(s) behind', n; end if;

  -- Structural: the seven content SELECT policies are exactly as they were.
  select count(*) into n from pg_policies
   where schemaname = 'public' and cmd = 'SELECT'
     and tablename in ('courses','modules','lessons','learning_objectives','items','item_options',
                       'assessment_definitions')
     and qual = 'can_in_institution(''CAN_DRAFT''::text, institution_id)';
  if n <> 7 then
    raise exception 'the content SELECT policies were changed: % of 7 still read CAN_DRAFT alone', n;
  end if;

  -- No new capability was invented.
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
              where ns.nspname = 'public' and p.proname = 'role_capabilities'
                and pg_get_functiondef(p.oid) ~* 'CANONICAL') then
    raise exception 'a canonical-shaped capability was added to the capability model';
  end if;

  -- Every accessor is classified in the same breath as its grant.
  select count(*) into n from public.client_rpc_registry
   where function_name in ('distributed_releases','distributed_release_outline',
                           'distributed_lesson_preview')
     and exposure = 'STAFF';
  if n <> 3 then raise exception 'the canonical read accessors are not all classified STAFF (%)', n; end if;

  -- The preview carries no assessment secret, structurally.
  if pg_get_functiondef('public.distributed_lesson_preview(uuid)'::regprocedure)
       ~* 'is_correct|item_options|rationale' then
    raise exception 'the preview accessor reaches into the answer key';
  end if;
  if pg_get_functiondef('public.distributed_release_outline(uuid)'::regprocedure)
       ~* 'is_correct|item_options' then
    raise exception 'the outline accessor reaches into the answer key';
  end if;

  -- The FABLE-06 hook widens nothing and computes nothing.
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relname = 'content_ownership_lineage'
     and c.reloptions::text like '%security_invoker=true%';
  if n <> 1 then raise exception 'content_ownership_lineage is not a security_invoker view'; end if;
  if pg_get_viewdef('public.content_ownership_lineage'::regclass) ~* 'count\(|avg\(|sum\(|percentile' then
    raise exception 'the FABLE-06 hook computes an aggregate; it must expose and stop';
  end if;
  if has_table_privilege('anon', 'public.content_ownership_lineage', 'SELECT') then
    raise exception 'the FABLE-06 hook is readable by anon';
  end if;

  -- The registry records the distinction rather than settling it by omission.
  select count(*) into n from public.record_class_registry
   where table_name in ('courses','modules','lessons','learning_objectives','items','item_options',
                        'assessment_definitions','plp_releases')
     and note like '%tenant_kind%';
  if n <> 8 then raise exception 'only % of 8 content tables record the ownership distinction', n; end if;
  select count(*) into n from unnest(enum_range(null::public.record_portability));
  if n <> 2 then raise exception 'record_portability gained a value; §5.7 says tenant_kind, not an enum change'; end if;

  raise notice '0056 verified: read-only canonical access via accessors, content policies untouched';
end $$;
