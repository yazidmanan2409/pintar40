-- 0026 — FABLE-02 §8: views, aggregates and QuestionHealth.
--
-- Three rules shape every view here.
--
-- (1) ITEM CONTENT IS NEVER PUBLIC. §8 is explicit that no view exposing item
-- stems, options or hints may be anon- or authenticated-readable even if its
-- name suggests otherwise, because a question bank is harvestable on its own.
-- The item-facing views are therefore granted to service_role only and named
-- service_* so the restriction is legible at the call site rather than hidden
-- in a grant.
--
-- (2) AGGREGATES READ official_responses, NOT RAW EVIDENCE. Slice D made
-- official_* the one evidence read path; these views honour it, so a session
-- later reclassified drops out of every statistic without recomputation.
--
-- (3) THE ANON-SAFE LESSON VIEW SHOWS SEALED CONTENT ONLY. A lesson is
-- publicly visible when a release covering its course is PUBLISHED -- not
-- FROZEN, which is sealed but not yet made available, and not SUPERSEDED,
-- which has been replaced. It carries lesson prose and nothing that belongs to
-- an item.

-- ---------------------------------------------------------------------------
-- Public lesson view, and the one exception to "anon holds nothing".
--
-- FABLE-01 asserted anon_table_grants = 0, which was right while nothing in
-- the product was public. §8 requires a publicly readable lesson view, so that
-- assertion has to change -- and the honest way to change it is to narrow what
-- it counts and make the exception visible, not to quietly exclude an object
-- from a counter that still claims to be zero.
--
-- The view is SECURITY DEFINER (the default) rather than security_invoker: it
-- IS the security boundary for anon. An invoker view would need anon to hold
-- SELECT on lessons, modules and courses -- three table grants and three anon
-- policies -- to read prose the view has already filtered. One grant on one
-- view is a far smaller surface, and the filter lives in the view definition
-- where it can be read.
--
-- PUBLISHED only. Not FROZEN, which is sealed but not yet made available, and
-- not SUPERSEDED, which has been replaced. Lesson prose only: nothing that
-- belongs to an item ever appears here.
-- ---------------------------------------------------------------------------
create view public.published_lessons as
  select l.id, l.institution_id, m.course_id, l.module_id,
         c.subject, c.stage, c.grade_label, c.title as course_title,
         m.ordinal as module_ordinal, m.title as module_title,
         l.ordinal as lesson_ordinal, l.title, l.summary, l.body_markdown,
         l.worked_examples, l.media
    from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
   where exists (select 1 from public.plp_releases r
                  where r.course_id = c.id and r.status = 'PUBLISHED');

grant usage on schema public to anon;
grant select on public.published_lessons to anon, authenticated;

-- The lint now counts anon grants on anything OTHER than the designated public
-- view, and reports the public surface separately so it cannot grow unnoticed.
-- F01-T13's existing zero-assertion therefore keeps its meaning: anon holds no
-- grant on any table or view except the one the phase deliberately published.
create or replace function public.platform_schema_lint() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v jsonb := '{}'::jsonb; n int; txt text;
begin
  if not public.is_system_admin() then raise exception 'SYSTEM_ADMIN required'; end if;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  v := v || jsonb_build_object('tables_without_rls', n);

  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  v := v || jsonb_build_object('policies_using_true', n);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('secdef_without_search_path', n);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  v := v || jsonb_build_object('functions_executable_by_anon', n);

  -- CHANGED IN 0026. FABLE-01 counted every anon grant and asserted zero, which
  -- was right while nothing was public. FABLE-02 §8 publishes one lesson view,
  -- so this now counts anon grants on anything ELSE -- the zero-assertion keeps
  -- its meaning -- and the two counters below make the published surface
  -- visible so it cannot grow unnoticed.
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  v := v || jsonb_build_object('anon_table_grants', n);

  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon'
     and table_name = 'published_lessons' and privilege_type <> 'SELECT';
  v := v || jsonb_build_object('anon_public_view_write_grants', n);

  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  v := v || jsonb_build_object('anon_public_surface', n);

  select count(*) into n from storage.buckets where public;
  v := v || jsonb_build_object('public_buckets', n);

  select count(*) into n from pg_policies
   where schemaname='storage' and tablename='objects'
     and (roles::text like '%anon%' or roles::text like '%public%' or roles::text like '%authenticated%');
  v := v || jsonb_build_object('client_storage_policies', n);

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='persons'
     and column_name in ('institution_id','class_id','cohort_id','node_id');
  v := v || jsonb_build_object('persons_institution_columns', n);

  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and table_name='audit_log' and privilege_type in ('UPDATE','DELETE','TRUNCATE')
     and grantee in ('anon','authenticated','service_role');
  v := v || jsonb_build_object('audit_log_client_write_grants', n);

  select count(*) into n from public.org_nodes
   where cardinality(jalur) = 0 or jalur[cardinality(jalur)] <> id;
  v := v || jsonb_build_object('malformed_jalur', n);

  select environment into txt from public.platform_environment;
  v := v || jsonb_build_object('environment', txt);

  select count(*) into n from supabase_migrations.schema_migrations;
  v := v || jsonb_build_object('migrations_applied', n);

  return v;
end $$;
revoke all on function public.platform_schema_lint() from public, anon;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- QuestionHealth: one row per item, lifecycle-enforced (doc 04 §9).
-- Signal computation is Phase 6; the lifecycle it will drive exists now.
-- ---------------------------------------------------------------------------
create type public.question_health_state as enum
  ('INSUFFICIENT_EVIDENCE','OBSERVING','SIGNAL_RAISED','UNDER_REVIEW','ACKNOWLEDGED_OK','ACTION_TAKEN');

create table public.question_health_transitions (
  from_state public.question_health_state not null,
  to_state   public.question_health_state not null,
  note       text,
  primary key (from_state, to_state)
);
alter table public.question_health_transitions enable row level security;
insert into public.question_health_transitions values
  ('INSUFFICIENT_EVIDENCE','OBSERVING',      'enough evidence to watch it'),
  ('OBSERVING','SIGNAL_RAISED',              'a statistic crossed its threshold'),
  ('OBSERVING','INSUFFICIENT_EVIDENCE',      'evidence withdrawn by reclassification'),
  ('SIGNAL_RAISED','UNDER_REVIEW',           'a human picked it up'),
  ('SIGNAL_RAISED','OBSERVING',              'the signal cleared on its own'),
  ('UNDER_REVIEW','ACKNOWLEDGED_OK',         'reviewed and judged sound'),
  ('UNDER_REVIEW','ACTION_TAKEN',            'reviewed and changed'),
  ('ACKNOWLEDGED_OK','OBSERVING',            'watching resumes'),
  ('ACTION_TAKEN','OBSERVING',               'watching resumes on the revised item');

create table public.question_health (
  item_id        uuid primary key references public.items(id),
  institution_id uuid not null references public.institutions(id),
  state          public.question_health_state not null default 'INSUFFICIENT_EVIDENCE',
  evidence_count integer not null default 0 check (evidence_count >= 0),
  reviewed_by_person_id uuid references public.persons(id),
  reviewed_at    timestamptz,
  note           text,
  updated_at     timestamptz not null default now()
);
alter table public.question_health enable row level security;

create function public.enforce_question_health() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid;
begin
  select i.institution_id into v_inst from public.items i where i.id = new.item_id;
  if v_inst is null then raise exception 'unknown item %', new.item_id; end if;
  new.institution_id := v_inst;
  if tg_op = 'INSERT' then
    if new.state <> 'INSUFFICIENT_EVIDENCE' then
      raise exception 'question health begins at INSUFFICIENT_EVIDENCE, not %', new.state;
    end if;
    return new;
  end if;
  if new.state is distinct from old.state then
    if not exists (select 1 from public.question_health_transitions t
                    where t.from_state = old.state and t.to_state = new.state) then
      raise exception 'illegal question health transition % -> % (not in the allow-list)',
        old.state, new.state;
    end if;
    if new.state in ('ACKNOWLEDGED_OK','ACTION_TAKEN') then
      if not public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', v_inst) then
        raise exception 'closing a question health review requires CAN_REVIEW_QUESTION_HEALTH';
      end if;
      new.reviewed_by_person_id := coalesce(new.reviewed_by_person_id, public.current_person_id());
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.enforce_question_health() from public, anon, authenticated;
create trigger question_health_guard before insert or update on public.question_health
  for each row execute function public.enforce_question_health();
create trigger question_health_tenant_immutable before update on public.question_health
  for each row execute function public.enforce_record_tenant_immutable();

grant select, insert, update on public.question_health to authenticated;
create policy question_health_select on public.question_health for select to authenticated
  using (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id));
create policy question_health_insert on public.question_health for insert to authenticated
  with check (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id));
create policy question_health_update on public.question_health for update to authenticated
  using (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id))
  with check (public.can_in_institution('CAN_REVIEW_QUESTION_HEALTH', institution_id));
grant select on public.question_health_transitions to authenticated;
create policy question_health_transitions_select on public.question_health_transitions
  for select to authenticated using (public.current_person_id() is not null);

-- ---------------------------------------------------------------------------
-- Aggregates. Both read official_responses only, and neither is client-visible:
-- one carries item content, the other is a cohort statistic whose smallest
-- cells would identify individuals.
-- ---------------------------------------------------------------------------
create view public.service_item_statistics with (security_invoker = true) as
  select i.id as item_id, i.institution_id, i.lesson_id, i.bank_type, i.item_type,
         count(*)::integer as evidence_count,
         count(*) filter (where o.is_correct)::integer as correct_count,
         case when count(*) = 0 then null
              else round(count(*) filter (where o.is_correct)::numeric / count(*), 4) end
           as correctness_rate,
         avg(extract(epoch from (r.received_at - p.presented_at)))::numeric(10,3)
           as mean_response_seconds,
         min(p.position)::smallint as first_position,
         max(p.position)::smallint as last_position
    from public.items i
    join public.presented_items p on p.item_id = i.id
    join public.official_responses r on r.presented_item_id = p.id
    left join public.item_options o
           on o.item_id = i.id and o.label = (r.value ->> 'pilihan')
   group by i.id, i.institution_id, i.lesson_id, i.bank_type, i.item_type;

create view public.service_distractor_uptake with (security_invoker = true) as
  select i.id as item_id, i.institution_id, o.label, o.is_correct,
         o.misconception_code,
         count(*)::integer as chosen_count
    from public.items i
    join public.item_options o on o.item_id = i.id
    join public.presented_items p on p.item_id = i.id
    join public.official_responses r on r.presented_item_id = p.id
                                    and (r.value ->> 'pilihan') = o.label
   group by i.id, i.institution_id, o.label, o.is_correct, o.misconception_code;

-- Cohort misconception: no learner id anywhere in the projection.
create view public.service_cohort_misconceptions with (security_invoker = true) as
  select s.institution_id, s.cohort_node_id, s.class_node_id,
         o.misconception_code, mt.label, mt.remediation,
         count(*)::integer as occurrences
    from public.official_responses r
    join public.assessment_sessions s on s.id = r.session_id
    join public.presented_items p on p.id = r.presented_item_id
    join public.item_options o on o.item_id = p.item_id
                             and o.label = (r.value ->> 'pilihan')
                             and not o.is_correct
    join public.misconception_taxonomy mt on mt.code = o.misconception_code
   where o.misconception_code is not null
   group by s.institution_id, s.cohort_node_id, s.class_node_id,
            o.misconception_code, mt.label, mt.remediation;

-- service_role only. These carry item content or cohort-level statistics; a
-- client role reading either would be harvesting the bank or profiling a class.
revoke all on public.service_item_statistics, public.service_distractor_uptake,
               public.service_cohort_misconceptions from public, anon, authenticated;
grant select on public.service_item_statistics, public.service_distractor_uptake,
                public.service_cohort_misconceptions to service_role;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v text;
begin
  -- no view carrying item content is reachable by a client role
  foreach v in array array['service_item_statistics','service_distractor_uptake',
                           'service_cohort_misconceptions'] loop
    if has_table_privilege('anon', ('public.'||v)::regclass, 'SELECT')
       or has_table_privilege('authenticated', ('public.'||v)::regclass, 'SELECT') then
      raise exception 'view % is readable by a client role; it carries item or cohort data', v;
    end if;
  end loop;

  -- every aggregate reads official_responses, never the raw table
  foreach v in array array['service_item_statistics','service_distractor_uptake',
                           'service_cohort_misconceptions'] loop
    select pg_get_viewdef(('public.'||v)::regclass, true) into def;
    if def not like '%official_responses%' then
      raise exception 'aggregate % does not read official_responses', v;
    end if;
    if def ~* '\yFROM\s+responses\y' or def ~* '\yJOIN\s+responses\y' then
      raise exception 'aggregate % reads the raw responses table (INV-20)', v;
    end if;
  end loop;

  -- the cohort view exposes no learner identity
  select pg_get_viewdef('public.service_cohort_misconceptions'::regclass, true) into def;
  if def ~* '\y(person_id|enrollment_id)\y' then
    raise exception 'the cohort misconception view exposes a learner identity (doc 06)';
  end if;

  -- the public lesson view shows published content only, and no item content
  select pg_get_viewdef('public.published_lessons'::regclass, true) into def;
  if def not like '%PUBLISHED%' then
    raise exception 'published_lessons does not restrict to PUBLISHED releases';
  end if;
  if def ~* '\y(stem|petunjuk|arah_berpikir|rationale|is_correct)\y' then
    raise exception 'published_lessons exposes item content';
  end if;
  -- published_lessons is deliberately NOT security_invoker: it is the boundary
  select c.reloptions::text into bad from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
   where ns.nspname='public' and c.relname='published_lessons';
  if bad is not null and bad like '%security_invoker=true%' then
    raise exception 'published_lessons became an invoker view; anon would need base-table grants';
  end if;

  -- anon's entire surface is SELECT on the one published view
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee='anon'
     and (g.privilege_type <> 'SELECT' or g.table_name <> 'published_lessons');
  if bad is not null then raise exception 'anon holds a grant beyond the published view: %', bad; end if;
  select count(*) into n from pg_policies where schemaname='public' and 'anon' = any(roles);
  if n > 0 then raise exception 'anon gained % policy/policies; the view is the boundary', n; end if;

  -- the lint still reports zero for everything outside that view, and names
  -- the published surface explicitly
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='platform_schema_lint';
  if def not like '%anon_public_surface%' then
    raise exception 'the lint no longer reports the anon public surface';
  end if;
  if def not like '%table_name <> ''published_lessons''%' then
    raise exception 'the anon grant counter no longer narrows to the published view';
  end if;

  -- question health lifecycle is an allow-list with no capability column
  select string_agg(column_name, ', ') into bad from information_schema.columns
   where table_schema='public' and table_name='question_health_transitions'
     and column_name not in ('from_state','to_state','note');
  if bad is not null then raise exception 'question_health_transitions grew a column: %', bad; end if;
  select count(*) into n from public.question_health_transitions;
  if n <> 9 then raise exception 'question health allow-list has % edges, expected 9', n; end if;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity
   and tablename in ('question_health','question_health_transitions');
  if n > 0 then raise exception 'RLS not enabled on % new table(s)', n; end if;
  select count(*) into n from pg_policies
   where schemaname in ('public','telemetry') and (qual='true' or with_check='true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
