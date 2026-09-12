-- 0017 — FABLE-02 §2/§6: the content_sha256 contract, freeze-time computation,
-- post-FROZEN taught-content immutability (INV-04) and the CAN_PUBLISH gate
-- (INV-32).
--
-- The contract this migration implements is ADR-0004, written before any of
-- this SQL: what contributes to the hash, what is excluded, what makes the
-- serialisation deterministic, and what happens if the semantics ever change.
-- The contract identifier PINTAR-CONTENT-SHA256/1 is the first field of every
-- payload, so a stored hash always declares which contract produced it.
--
-- Two rules from that ADR drive the whole implementation:
--   * no UUID and no timestamp ever enters the payload, so the same content
--     restored into a second database hashes identically. Objectives enter by
--     `code`, misconceptions by `misconception_code`, parallel groups by a
--     derived rank;
--   * order is hashed only where order is data. Modules and lessons carry an
--     `ordinal`, options carry a `label`, JSONB arrays carry their own order:
--     those are ordered collections and reordering them changes the hash.
--     Everything else is a genuine set, made order-independent by sorting
--     element *digests* under `collate "C"` -- never by sorting rows, and never
--     under a collation the host could change.
--
-- Scope note, deliberately not widened here: APPROVED -> FROZEN is still
-- ungated. CAN_FREEZE_RELEASE exists in the capability model and belongs on
-- that edge; it is the next migration's item, not this one's. This migration
-- gates FROZEN -> PUBLISHED only, which is what INV-32 names.
--
-- Verification block: structural and pure-function only (ADR-0003). The
-- behavioural proof -- freezing real content, hashing it, and being refused
-- afterwards -- needs seeded institutions and personas, so it lives in
-- selftest/db/fable02.sql (F02-T05..T08), which runs after the seed.

-- ---------------------------------------------------------------------------
-- Serialisation primitives.
--
-- content_field is injective by construction: `length:value`, and `~` for
-- NULL. Length-prefixed fields concatenate unambiguously, so the classic
-- delimiter collision ("ab"|"c" vs "a"|"bc") cannot happen. `~` is not a
-- digit, so a NULL can never be read as a length.
-- ---------------------------------------------------------------------------
create function public.content_field(p_value text) returns text
language sql immutable parallel safe as $$
  select case when p_value is null then '~'
              else length(p_value)::text || ':' || p_value end
$$;
revoke all on function public.content_field(text) from public, anon, authenticated;

create function public.content_digest(p_payload text) returns text
language sql immutable parallel safe as $$
  select encode(sha256(convert_to(p_payload, 'UTF8')), 'hex')
$$;
revoke all on function public.content_digest(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The canonical payload of one course.
--
-- SECURITY DEFINER on purpose: every table below is under RLS, and a caller
-- who can see only part of a course must not be able to compute a different,
-- smaller hash and store it as the release's hash. It reads as its owner and
-- is granted to nobody -- the freeze trigger, also SECURITY DEFINER and owned
-- by the same role, is the only caller. A permissioned verification RPC for
-- Studio is a later phase's job, not a grant here.
-- ---------------------------------------------------------------------------
create function public.content_canonical_payload(p_course uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
with
course_row as (
  select c.subject, c.stage, c.grade_label, c.title
    from public.courses c where c.id = p_course
),
course_lessons as (
  select l.id as lesson_id, l.module_id
    from public.lessons l
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
),
-- objectives of a lesson: a set, keyed by the stable `code`
objective_payload as (
  select lo.lesson_id,
         string_agg(public.content_field(lo.code)
                 || public.content_field(lo.statement)
                 || public.content_field(lo.bloom::text)
                 || public.content_field(lo.is_core::text),
                    '' order by lo.code collate "C") as payload
    from public.learning_objectives lo
    join course_lessons cl on cl.lesson_id = lo.lesson_id
   group by lo.lesson_id
),
-- options of an item: ORDERED, because `label` is the position a learner sees
option_payload as (
  select o.item_id,
         string_agg(public.content_field(o.label)
                 || public.content_field(o.body)
                 || public.content_field(o.is_correct::text)
                 || public.content_field(o.rationale)
                 || public.content_field(o.misconception_code),
                    '' order by o.label collate "C") as payload
    from public.item_options o
    join public.items i on i.id = o.item_id
    join course_lessons cl on cl.lesson_id = i.lesson_id
   group by o.item_id
),
-- the objectives an item targets, by code: never by objective_ids (uuids)
item_objective_payload as (
  select i.id as item_id,
         string_agg(public.content_field(lo.code), '' order by lo.code collate "C") as payload
    from public.items i
    join course_lessons cl on cl.lesson_id = i.lesson_id
    join public.learning_objectives lo on lo.id = any (i.objective_ids)
   group by i.id
),
item_base as (
  select i.id, i.lesson_id, i.parallel_group,
         public.content_digest(
              public.content_field(i.item_type::text)
           || public.content_field(i.bank_type::text)
           || public.content_field(i.stem)
           || public.content_field(i.stimulus)
           || public.content_field(i.petunjuk)
           || public.content_field(i.arah_berpikir)
           || public.content_field(i.predicted_difficulty::text)
           || public.content_field(i.is_safety_critical::text)
           || public.content_field(iop.payload)
           || public.content_field(op.payload)) as digest
    from public.items i
    join course_lessons cl on cl.lesson_id = i.lesson_id
    left join item_objective_payload iop on iop.item_id = i.id
    left join option_payload op on op.item_id = i.id
),
-- parallel_group is a uuid, so it cannot be hashed, but regrouping parallel
-- items changes what a learner can be shown and must not be invisible. Groups
-- are ordered by the sorted concatenation of their members' digests and given
-- a dense_rank; that rank -- pure content, no identifier -- enters the item.
parallel_key as (
  select ib.parallel_group,
         string_agg(ib.digest, '' order by ib.digest collate "C") as k
    from item_base ib where ib.parallel_group is not null
   group by ib.parallel_group
),
parallel_rank as (
  select pk.parallel_group, dense_rank() over (order by pk.k collate "C") as idx
    from parallel_key pk
),
item_final as (
  select ib.lesson_id,
         public.content_digest(public.content_field(ib.digest)
                            || public.content_field(pr.idx::text)) as digest
    from item_base ib
    left join parallel_rank pr on pr.parallel_group = ib.parallel_group
),
-- items in a lesson: a set
item_payload as (
  select itf.lesson_id, string_agg(itf.digest, '' order by itf.digest collate "C") as payload
    from item_final itf group by itf.lesson_id
),
lesson_digest as (
  select l.module_id, l.ordinal,
         public.content_digest(
              public.content_field(l.ordinal::text)
           || public.content_field(l.title)
           || public.content_field(l.summary)
           || public.content_field(l.body_markdown)
           || public.content_field(l.worked_examples::text)
           || public.content_field(l.media::text)
           || public.content_field(ob.payload)
           || public.content_field(ip.payload)) as digest
    from public.lessons l
    join public.modules m on m.id = l.module_id and m.course_id = p_course
    left join objective_payload ob on ob.lesson_id = l.id
    left join item_payload ip on ip.lesson_id = l.id
),
-- lessons in a module and modules in a course: ORDERED by ordinal
module_payload as (
  select m.course_id,
         string_agg(public.content_digest(
                         public.content_field(m.ordinal::text)
                      || public.content_field(m.title)
                      || public.content_field(lp.payload)),
                    '' order by m.ordinal) as payload
    from public.modules m
    left join lateral (select string_agg(ld.digest, '' order by ld.ordinal) as payload
                         from lesson_digest ld where ld.module_id = m.id) lp on true
   where m.course_id = p_course
   group by m.course_id
),
-- assessment definitions in scope: bound to the course, or to one of its
-- modules. The module binding enters as that module's ordinal, never its uuid.
assessment_digest as (
  select public.content_digest(
              public.content_field(a.title)
           || public.content_field(a.mode::text)
           || public.content_field(a.bank_type::text)
           || public.content_field(a.version::text)
           || public.content_field(a.item_count::text)
           || public.content_field(a.difficulty_mix::text)
           || public.content_field(a.safety_critical_minimum::text)
           || public.content_field(a.passing_rules::text)
           || public.content_field(a.hesitation_window_seconds::text)
           || public.content_field(a.shuffle_policy)
           || public.content_field(a.allows_pause::text)
           || public.content_field(a.offline_tolerant::text)
           || public.content_field(a.late_sync_grace_seconds::text)
           || public.content_field(a.attempt_limit::text)
           || public.content_field(am.ordinal::text)) as digest
    from public.assessment_definitions a
    left join public.modules am on am.id = a.module_id
   where a.course_id = p_course or am.course_id = p_course
),
assessment_payload as (
  select string_agg(ad.digest, '' order by ad.digest collate "C") as payload
    from assessment_digest ad
)
select 'PINTAR-CONTENT-SHA256/1'
    || public.content_field(cr.subject)
    || public.content_field(cr.stage)
    || public.content_field(cr.grade_label)
    || public.content_field(cr.title)
    || public.content_field(mp.payload)
    || public.content_field(ap.payload)
  from course_row cr
  left join module_payload mp on true
  left join assessment_payload ap on true
$$;
revoke all on function public.content_canonical_payload(uuid) from public, anon, authenticated;

-- NULL for a course that does not exist; a 64-char hex digest otherwise.
create function public.course_content_sha256(p_course uuid) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select public.content_digest(public.content_canonical_payload(p_course))
$$;
revoke all on function public.course_content_sha256(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sealing. Taught content under a course is sealed when the course itself has
-- reached a sealed state, or when ANY release covering it has -- the second
-- half is what makes the hash meaningful, because a release's hash would
-- otherwise go stale the moment someone edited a lesson under it.
-- ---------------------------------------------------------------------------
create function public.content_is_sealed(p_course uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.courses c
                  where c.id = p_course
                    and c.status in ('FROZEN','PUBLISHED','SUPERSEDED'))
      or exists (select 1 from public.plp_releases r
                  where r.course_id = p_course
                    and r.status in ('FROZEN','PUBLISHED','SUPERSEDED'))
$$;
revoke all on function public.content_is_sealed(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- INV-04. One trigger function for every taught-content table. The column list
-- per table is the same list ADR-0004 hashes, so "the hash did not change" and
-- "the content did not change" mean the same thing. Status, authorship, review
-- and the empirical_* columns are absent from every list on purpose: a frozen
-- row still transitions, still records who reviewed it, and still accumulates
-- measured statistics.
--
-- This also discharges FABLE-02 §6's "a trigger blocks writing `media` on any
-- lesson bound to a FROZEN/PUBLISHED/SUPERSEDED release": `media` is in the
-- lessons column list.
-- ---------------------------------------------------------------------------
create function public.enforce_taught_content_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_course uuid; v_cols text[]; v_col text; v_row jsonb; v_new jsonb; v_old jsonb;
begin
  if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;

  case tg_table_name
    when 'courses' then
      v_course := (v_row ->> 'id')::uuid;
      v_cols := array['subject','stage','grade_label','title'];
    when 'modules' then
      v_course := (v_row ->> 'course_id')::uuid;
      v_cols := array['course_id','ordinal','title'];
    when 'lessons' then
      select m.course_id into v_course from public.modules m
       where m.id = (v_row ->> 'module_id')::uuid;
      v_cols := array['module_id','ordinal','title','summary','body_markdown',
                      'worked_examples','media'];
    when 'learning_objectives' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      v_cols := array['lesson_id','code','statement','bloom','is_core'];
    when 'items' then
      select m.course_id into v_course from public.lessons l
        join public.modules m on m.id = l.module_id
       where l.id = (v_row ->> 'lesson_id')::uuid;
      v_cols := array['lesson_id','item_type','bank_type','stem','stimulus','petunjuk',
                      'arah_berpikir','objective_ids','is_safety_critical',
                      'predicted_difficulty','parallel_group'];
    when 'item_options' then
      select m.course_id into v_course from public.items i
        join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id
       where i.id = (v_row ->> 'item_id')::uuid;
      v_cols := array['item_id','label','body','is_correct','rationale','misconception_code'];
    when 'assessment_definitions' then
      if (v_row ->> 'course_id') is not null then
        v_course := (v_row ->> 'course_id')::uuid;
      else
        select m.course_id into v_course from public.modules m
         where m.id = (v_row ->> 'module_id')::uuid;
      end if;
      v_cols := array['course_id','module_id','title','mode','bank_type','version','item_count',
                      'difficulty_mix','safety_critical_minimum','passing_rules',
                      'hesitation_window_seconds','shuffle_policy','allows_pause',
                      'offline_tolerant','late_sync_grace_seconds','attempt_limit'];
    else
      raise exception 'taught-content immutability trigger attached to an unexpected table: %.%',
        tg_table_schema, tg_table_name;
  end case;

  if v_course is null or not public.content_is_sealed(v_course) then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'taught content cannot be added under a frozen course (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'taught content cannot be deleted once frozen (INV-04): %.%',
      tg_table_schema, tg_table_name;
  end if;

  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array v_cols loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception '%.%.% is immutable once the course is frozen (INV-04)',
        tg_table_schema, tg_table_name, v_col;
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.enforce_taught_content_immutable() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['courses','modules','lessons','learning_objectives','items',
                           'item_options','assessment_definitions'] loop
    execute format('create trigger %1$s_taught_immutable
                      before insert or update or delete on public.%1$I
                      for each row execute function public.enforce_taught_content_immutable()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Freeze-time computation. The database computes content_sha256 -- no client
-- ever supplies it -- and it can never be rewritten afterwards.
-- ---------------------------------------------------------------------------
create function public.enforce_release_freeze() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    if new.content_sha256 is not null then
      raise exception 'content_sha256 is computed by the database at FROZEN, never supplied';
    end if;
    if new.frozen_at is not null or new.published_at is not null then
      raise exception 'frozen_at and published_at are stamped by the database, never supplied';
    end if;
    return new;
  end if;

  if new.course_id is distinct from old.course_id then
    raise exception 'a release never changes the course it snapshots';
  end if;
  if old.content_sha256 is not null and new.content_sha256 is distinct from old.content_sha256 then
    raise exception 'content_sha256 is immutable once frozen (INV-04)';
  end if;
  if old.frozen_at is not null and new.frozen_at is distinct from old.frozen_at then
    raise exception 'frozen_at is immutable once stamped';
  end if;
  if old.published_at is not null and new.published_at is distinct from old.published_at then
    raise exception 'published_at is immutable once stamped';
  end if;

  if new.status = 'FROZEN' and old.status is distinct from new.status then
    new.content_sha256 := public.course_content_sha256(new.course_id);
    if new.content_sha256 is null then
      raise exception 'no content hash could be computed for course %', new.course_id;
    end if;
    new.frozen_at := coalesce(new.frozen_at, now());
  end if;

  if new.status = 'PUBLISHED' and old.status is distinct from new.status then
    if new.content_sha256 is null then
      raise exception 'a release is published only after it has been frozen and hashed';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end $$;
revoke all on function public.enforce_release_freeze() from public, anon, authenticated;

-- Trigger order against plp_releases_status_guard is immaterial: an illegal
-- edge raises, and a raise aborts the whole statement, so a hash computed by
-- the other trigger is never committed.
create trigger plp_releases_freeze_stamp before insert or update on public.plp_releases
  for each row execute function public.enforce_release_freeze();

-- ---------------------------------------------------------------------------
-- INV-32: publication is a human CAN_PUBLISH act.
--
-- Replaces the FABLE-02 migration 2 body, adding the gate only. There is no
-- SERVICE or AI role in the capability model, and can_in_institution() needs a
-- current person, so an ingest/service connection -- no JWT, no person -- is
-- refused by construction rather than by a role name check that a future role
-- could slip past. CAN_PUBLISH is held by SYSTEM_ADMIN and INSTITUTION_ADMIN
-- only; HEAD_OF_DEPARTMENT can freeze a release but not publish it.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_content_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_institution uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'INGESTED' then
      raise exception 'content rows are created at INGESTED, not % (%.%)',
        new.status, tg_table_schema, tg_table_name;
    end if;
    if new.author_person_id is null then
      new.author_person_id := public.current_person_id();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status) then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

    if new.status = 'APPROVED' then
      if new.reviewed_by_person_id is null then
        raise exception 'APPROVED requires a reviewer (%.%)', tg_table_schema, tg_table_name;
      end if;
      if new.author_person_id is null then
        raise exception 'APPROVED requires a known author to separate from the reviewer (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id = new.author_person_id then
        raise exception 'the reviewer may not be the author (%.%)', tg_table_schema, tg_table_name;
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'PUBLISHED' then
      v_institution := (to_jsonb(new) ->> 'institution_id')::uuid;
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32) (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;
revoke all on function public.enforce_content_status() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text;
begin
  -- the serialiser is injective where a delimiter-joined string would not be
  if public.content_field('ab') || public.content_field('c')
     = public.content_field('a') || public.content_field('bc') then
    raise exception 'content_field is not injective: a field-boundary collision exists';
  end if;
  if public.content_field(null) <> '~' then
    raise exception 'content_field does not render NULL as the reserved sentinel';
  end if;
  if public.content_field('') <> '0:' then
    raise exception 'content_field does not distinguish the empty string from NULL';
  end if;

  -- known SHA-256 vectors: the digest is the standard one, not a local variant
  if public.content_digest('abc') <>
     'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' then
    raise exception 'content_digest does not produce standard SHA-256';
  end if;
  if public.content_digest('') <>
     'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' then
    raise exception 'content_digest does not produce standard SHA-256 for the empty string';
  end if;

  -- fails closed on a course that does not exist, and on NULL
  if public.course_content_sha256(gen_random_uuid()) is not null then
    raise exception 'course_content_sha256 invented a hash for a non-existent course';
  end if;
  if public.course_content_sha256(null) is not null then
    raise exception 'course_content_sha256 invented a hash for a null course';
  end if;
  if public.content_is_sealed(null) or public.content_is_sealed(gen_random_uuid()) then
    raise exception 'content_is_sealed failed open';
  end if;

  -- volatility: the primitives must be IMMUTABLE, the readers STABLE
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.provolatile <> 'i'
     and p.proname in ('content_field','content_digest');
  if bad is not null then raise exception 'serialisation primitive is not IMMUTABLE: %', bad; end if;
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.provolatile <> 's'
     and p.proname in ('content_canonical_payload','course_content_sha256','content_is_sealed');
  if bad is not null then raise exception 'hash reader is not STABLE: %', bad; end if;

  -- the payload reader bypasses RLS, so it must be granted to no client role
  select string_agg(p.proname, ', ') into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('content_canonical_payload','course_content_sha256','content_is_sealed',
                       'content_field','content_digest')
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'));
  if bad is not null then raise exception 'hash internals are executable by a client role: %', bad; end if;

  -- every taught-content table carries the immutability trigger
  select string_agg(t, ', ') into bad from unnest(array['courses','modules','lessons',
    'learning_objectives','items','item_options','assessment_definitions']) t
   where not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                      where c.relname = t and g.tgname = t || '_taught_immutable'
                        and not g.tgisinternal);
  if bad is not null then raise exception 'taught-content immutability trigger missing on: %', bad; end if;

  -- ... and covers INSERT, UPDATE and DELETE on each (tgtype bits 2|4|8|16)
  select string_agg(c.relname, ', ') into bad from pg_trigger g join pg_class c on c.oid = g.tgrelid
   where g.tgname like '%\_taught\_immutable' and not g.tgisinternal
     and ((g.tgtype & 4) = 0 or (g.tgtype & 8) = 0 or (g.tgtype & 16) = 0);
  if bad is not null then raise exception 'immutability trigger does not cover all three write paths on: %', bad; end if;

  -- the release freeze trigger exists
  if not exists (select 1 from pg_trigger g join pg_class c on c.oid = g.tgrelid
                  where c.relname = 'plp_releases' and g.tgname = 'plp_releases_freeze_stamp'
                    and not g.tgisinternal) then
    raise exception 'plp_releases_freeze_stamp trigger missing';
  end if;

  -- the publish gate is present in the status trigger, and names CAN_PUBLISH
  select pg_get_functiondef(p.oid) into bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = 'enforce_content_status';
  if bad not like '%CAN_PUBLISH%' then
    raise exception 'the status trigger does not gate PUBLISHED on CAN_PUBLISH (INV-32)';
  end if;

  -- CAN_PUBLISH is held by exactly the two roles that should hold it
  select string_agg(r::text, ', ') into bad
    from unnest(enum_range(null::public.app_role)) r
   where 'CAN_PUBLISH' = any (public.role_capabilities(r))
     and r not in ('SYSTEM_ADMIN','INSTITUTION_ADMIN');
  if bad is not null then raise exception 'CAN_PUBLISH leaked to role(s): %', bad; end if;

  -- standing hygiene, re-asserted after every migration
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;

  select count(*) into n from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
