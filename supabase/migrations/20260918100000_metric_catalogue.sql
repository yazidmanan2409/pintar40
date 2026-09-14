-- 0071 -- the Canonical Metric Catalogue. PINTAR owns the meaning of a number.
--
-- THE RULE THIS TABLE EXISTS TO MAKE MECHANICAL (INV-34, doc 02):
-- institutions customize the TELLING, never the MEANING. A template selects,
-- orders, visualizes, titles and brands. It never carries a formula, never
-- carries SQL, never redefines a metric. For that to be enforceable rather
-- than merely stated, the meaning has to live somewhere the template cannot
-- reach -- here, versioned, immutable once published.
--
-- WHY A THRESHOLD IS A CATALOGUE ROW AND NOT A CONSTANT. The readiness tiers
-- (Siap Sertifikasi / Perlu Review / Butuh Pendampingan Ekstra / Belum
-- Post-Test) and every minimum-sample figure are values WITH A VERSION. A
-- number in a component is invisible to provenance: a report generated last
-- term and a report generated today would silently disagree and neither would
-- say so. Here, a generated report records the catalogue version it used, and
-- a changed threshold is a new version by construction.
--
-- =========================================================================
-- SCOPE IS INSTITUTION-BOUNDED BY TYPE, NOT BY CONVENTION.
--
-- The accepted reconciliation (delta 3.1): a metric may aggregate over
-- learners WITHIN an institution; none may aggregate a person ACROSS
-- institutions. PINTAR now exposes three independent product account types --
-- personal, institution, business -- and they are separate evidence contexts.
-- A cross-institution person-keyed metric would silently re-merge them.
--
-- So `metric_scope` carries no such value. There is no label to select, which
-- makes the forbidden metric a TYPE ERROR at declaration rather than a code
-- review finding. This is the same technique 0065 used for
-- `official_evidence_purpose`, and for the same reason: an unapproved value
-- must be impossible, not merely absent today. The terminal block asserts the
-- enum has not since gained one.
-- =========================================================================

create type public.metric_scope as enum (
  'ITEM',                  -- one question, within its owning institution
  'LESSON',                -- one lesson, within its owning institution
  'CLASS',                 -- one class node
  'COHORT',                -- one cohort node
  'INSTITUTION',           -- the institution total
  'LEARNER_IN_INSTITUTION' -- one learner, inside ONE institution's context
);
-- deliberately absent: any person-keyed scope that spans institutions.

-- ---------------------------------------------------------------------------
-- The catalogue version. Mirrors `scoring_policy`, which is this codebase's
-- established shape for a PINTAR-owned versioned reference: text version,
-- supersession pointer, SYSTEM_ADMIN publication, audited.
-- ---------------------------------------------------------------------------
create table public.metric_catalogue (
  version        text primary key,
  effective_from timestamptz not null default now(),
  superseded_by  text references public.metric_catalogue(version),
  note           text,
  published_by   uuid references public.persons(id),
  created_at     timestamptz not null default now(),
  constraint metric_catalogue_version_shape check (version ~ '^MC-[0-9]+$')
);
alter table public.metric_catalogue enable row level security;

-- ---------------------------------------------------------------------------
-- The metric definitions. One row per metric per catalogue version.
--
-- `calculation_key` NAMES a PINTAR-owned computation; it is not, and cannot
-- become, an expression. The CHECK admits a bare lower-case identifier and
-- nothing else -- no spaces, no parentheses, no quotes, no operators -- so a
-- formula smuggled into this column is refused by the database rather than by
-- a reviewer's attention.
-- ---------------------------------------------------------------------------
create table public.metric_definitions (
  catalogue_version      text not null references public.metric_catalogue(version) on delete restrict,
  metric_id              text not null,
  label_key              text not null,   -- HLE key, never literal prose
  meaning_key            text not null,   -- HLE key: what this number means
  scope                  public.metric_scope not null,
  evidence_class         public.evidence_class not null default 'OFFICIAL',
  minimum_sample         integer not null,
  allowed_visualizations text[] not null default '{}',
  allowed_audiences      public.app_role[] not null default '{}',
  calculation_key        text not null,
  deprecated             boolean not null default false,
  deprecation_note_key   text,
  primary key (catalogue_version, metric_id),
  constraint metric_definitions_official_only
    check (evidence_class = 'OFFICIAL'),
  constraint metric_definitions_minimum_sample_real
    check (minimum_sample > 0),
  constraint metric_definitions_calculation_is_a_name_not_a_formula
    check (calculation_key ~ '^[a-z][a-z0-9_]{2,60}$'),
  constraint metric_definitions_metric_id_shape
    check (metric_id ~ '^[a-z][a-z0-9_.]{2,60}$'),
  constraint metric_definitions_keys_are_hle
    check (label_key ~ '^[a-z][a-z0-9_.]+$' and meaning_key ~ '^[a-z][a-z0-9_.]+$'),
  constraint metric_definitions_deprecated_says_why
    check (deprecated = false or deprecation_note_key is not null),
  constraint metric_definitions_audience_is_not_empty
    check (cardinality(allowed_audiences) > 0)
);
alter table public.metric_definitions enable row level security;

-- ---------------------------------------------------------------------------
-- Readiness tiers -- catalogue values, versioned with everything else.
--
-- The frozen scope states them as: Siap Sertifikasi = >=80% AND the safety
-- gate passed; Perlu Review = 60-79%; Butuh Pendampingan Ekstra = <60% OR the
-- safety gate failed; Belum Post-Test = pre-test only. `min_mastery` is
-- inclusive and `max_mastery` exclusive so the bands tile the range exactly;
-- the terminal block proves they do rather than trusting the numbers typed
-- here.
-- ---------------------------------------------------------------------------
create table public.readiness_tiers (
  catalogue_version    text not null references public.metric_catalogue(version) on delete restrict,
  tier_key             text not null,   -- HLE key; the Indonesian label is the telling
  ordinal              smallint not null,
  min_mastery          numeric(5,4),    -- inclusive; null = not mastery-derived
  max_mastery          numeric(5,4),    -- exclusive
  requires_safety_gate boolean not null default false,
  applies_without_post_test boolean not null default false,
  primary key (catalogue_version, tier_key),
  constraint readiness_tiers_band_is_ordered
    check (min_mastery is null or max_mastery is null or min_mastery < max_mastery),
  constraint readiness_tiers_band_or_no_post_test
    check (applies_without_post_test or min_mastery is not null),
  constraint readiness_tiers_key_is_hle
    check (tier_key ~ '^[a-z][a-z0-9_.]+$'),
  unique (catalogue_version, ordinal)
);
alter table public.readiness_tiers enable row level security;

-- ---------------------------------------------------------------------------
-- A PUBLISHED CATALOGUE VERSION IS IMMUTABLE.
--
-- Provenance is the whole point: a report that recorded `MC-1` must mean the
-- same thing when it is re-read next year. If a threshold inside MC-1 could be
-- edited in place, the version number would record nothing. A changed
-- threshold is a NEW version, which is what `publish_metric_catalogue` is for.
-- ---------------------------------------------------------------------------
create function public.enforce_catalogue_immutable()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  if tg_op = 'UPDATE' or tg_op = 'DELETE' then
    raise exception
      'a published catalogue version is immutable: publish a new version instead of editing %',
      tg_table_name;
  end if;
  return new;
end $function$;

create trigger metric_definitions_immutable
  before update or delete on public.metric_definitions
  for each row execute function public.enforce_catalogue_immutable();
create trigger readiness_tiers_immutable
  before update or delete on public.readiness_tiers
  for each row execute function public.enforce_catalogue_immutable();

-- The catalogue header itself takes exactly one mutation -- the supersession
-- pointer -- and nothing else, so a version cannot be silently re-dated or
-- re-noted after reports have cited it.
create function public.enforce_catalogue_header()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  if tg_op = 'DELETE' then
    raise exception 'a catalogue version is never deleted; supersede it';
  end if;
  if new.version is distinct from old.version
     or new.effective_from is distinct from old.effective_from
     or new.note is distinct from old.note
     or new.published_by is distinct from old.published_by
     or new.created_at is distinct from old.created_at then
    raise exception 'only the supersession pointer of a catalogue version may change';
  end if;
  if old.superseded_by is not null and new.superseded_by is distinct from old.superseded_by then
    raise exception 'catalogue version % is already superseded by %', old.version, old.superseded_by;
  end if;
  return new;
end $function$;
create trigger metric_catalogue_header_guard
  before update or delete on public.metric_catalogue
  for each row execute function public.enforce_catalogue_header();

-- ---------------------------------------------------------------------------
-- The live version, and publication.
-- ---------------------------------------------------------------------------
create function public.current_metric_catalogue()
returns text language sql stable security definer set search_path = public, pg_temp as $function$
  select c.version from public.metric_catalogue c
   where c.superseded_by is null
   order by c.effective_from desc, c.version desc limit 1
$function$;

-- Publishing clones the live version forward, applies named threshold
-- overrides, and supersedes. Copy-forward rather than edit-in-place is the
-- same shape `create_course_revision` uses, and for the same reason: the
-- predecessor has to survive intact because something already cites it.
create function public.publish_metric_catalogue(p_version text, p_note text,
                                                p_minimum_sample_overrides jsonb default '{}'::jsonb)
returns text language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_prev text; v_actor uuid; n_metrics int; n_tiers int; bad text;
begin
  if not public.is_system_admin() then
    raise exception 'publishing a metric catalogue requires SYSTEM_ADMIN';
  end if;
  v_actor := public.current_person_id();
  v_prev := public.current_metric_catalogue();
  if v_prev is null then
    raise exception 'there is no live catalogue version to supersede';
  end if;

  -- an override naming a metric that does not exist is a typo with a silent
  -- blast radius: it would publish a version that quietly kept the old number.
  select string_agg(k, ', ') into bad
    from jsonb_object_keys(p_minimum_sample_overrides) k
   where not exists (select 1 from public.metric_definitions d
                      where d.catalogue_version = v_prev and d.metric_id = k);
  if bad is not null then
    raise exception 'override names metric(s) not in catalogue %: %', v_prev, bad;
  end if;

  insert into public.metric_catalogue (version, note, published_by) values (p_version, p_note, v_actor);

  insert into public.metric_definitions
    (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
     minimum_sample, allowed_visualizations, allowed_audiences, calculation_key,
     deprecated, deprecation_note_key)
  select p_version, d.metric_id, d.label_key, d.meaning_key, d.scope, d.evidence_class,
         coalesce((p_minimum_sample_overrides ->> d.metric_id)::int, d.minimum_sample),
         d.allowed_visualizations, d.allowed_audiences, d.calculation_key,
         d.deprecated, d.deprecation_note_key
    from public.metric_definitions d where d.catalogue_version = v_prev;
  get diagnostics n_metrics = row_count;

  insert into public.readiness_tiers
    (catalogue_version, tier_key, ordinal, min_mastery, max_mastery,
     requires_safety_gate, applies_without_post_test)
  select p_version, t.tier_key, t.ordinal, t.min_mastery, t.max_mastery,
         t.requires_safety_gate, t.applies_without_post_test
    from public.readiness_tiers t where t.catalogue_version = v_prev;
  get diagnostics n_tiers = row_count;

  update public.metric_catalogue set superseded_by = p_version where version = v_prev;

  perform public.audit_write('metric_catalogue.published', 'metric_catalogue', p_version, null,
    jsonb_build_object('version', p_version, 'supersedes', v_prev, 'metrics', n_metrics,
                       'readiness_tiers', n_tiers,
                       'minimum_sample_overrides', p_minimum_sample_overrides, 'note', p_note));
  return p_version;
end $function$;

-- ---------------------------------------------------------------------------
-- Reads. The catalogue is not a secret -- a dean asking "what does this number
-- mean?" is the product working -- but it is staff-facing, so a signed-in
-- person may read it and `anon` may not.
-- ---------------------------------------------------------------------------
create policy metric_catalogue_select on public.metric_catalogue
  for select to authenticated using (public.current_person_id() is not null);
create policy metric_definitions_select on public.metric_definitions
  for select to authenticated using (public.current_person_id() is not null);
create policy readiness_tiers_select on public.readiness_tiers
  for select to authenticated using (public.current_person_id() is not null);

grant select on public.metric_catalogue to authenticated;
grant select on public.metric_definitions to authenticated;
grant select on public.readiness_tiers to authenticated;

-- A grant is an exposure decision. `publish_metric_catalogue` is SYSTEM_ADMIN
-- platform machinery and is NOT a client entry point; it gets no client grant
-- and therefore no registry row.
revoke all on function public.publish_metric_catalogue(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.current_metric_catalogue() from public, anon;
revoke all on function public.enforce_catalogue_immutable() from public, anon, authenticated;
revoke all on function public.enforce_catalogue_header() from public, anon, authenticated;
grant execute on function public.current_metric_catalogue() to authenticated;
insert into public.client_rpc_registry (function_name, exposure, note) values
  ('current_metric_catalogue', 'STAFF',
   'Which catalogue version is live. Read-only; a surface cites it as provenance.');

-- ---------------------------------------------------------------------------
-- MC-1 -- the first catalogue version.
--
-- Every metric here computes from the `official_*` / `service_*` views, which
-- are OFFICIAL-only by construction (`service_item_statistics` joins
-- `official_responses`), so INV-20 holds without this table restating it:
-- SYNTHETIC, PREVIEW and PUBLIC_DEMO sessions are not in the source at all.
-- ---------------------------------------------------------------------------
insert into public.metric_catalogue (version, note)
values ('MC-1', 'First canonical catalogue: class and institution learning intelligence, question health signals.');

insert into public.metric_definitions
  (catalogue_version, metric_id, label_key, meaning_key, scope, minimum_sample,
   allowed_visualizations, allowed_audiences, calculation_key) values
  ('MC-1', 'class.participants', 'metrik.peserta.label', 'metrik.peserta.arti',
   'CLASS', 1, array['hero_stat'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_participants'),
  ('MC-1', 'class.comprehension', 'metrik.pemahaman.label', 'metrik.pemahaman.arti',
   'CLASS', 5, array['hero_stat','bar'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_comprehension'),
  ('MC-1', 'class.net_gain', 'metrik.kenaikan.label', 'metrik.kenaikan.arti',
   'CLASS', 5, array['hero_stat','bar'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_net_gain'),
  ('MC-1', 'class.readiness_distribution', 'metrik.kesiapan.label', 'metrik.kesiapan.arti',
   'CLASS', 5, array['distribution'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_readiness_distribution'),
  ('MC-1', 'class.topic_mastery', 'metrik.topik.label', 'metrik.topik.arti',
   'LESSON', 5, array['bar','list'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_topic_mastery'),
  ('MC-1', 'class.misconceptions', 'metrik.miskonsepsi.label', 'metrik.miskonsepsi.arti',
   'CLASS', 3, array['card_list'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_misconceptions'),
  ('MC-1', 'institution.participants', 'metrik.peserta_institusi.label', 'metrik.peserta_institusi.arti',
   'INSTITUTION', 1, array['hero_stat'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_participants'),
  ('MC-1', 'institution.net_gain', 'metrik.kenaikan_institusi.label', 'metrik.kenaikan_institusi.arti',
   'INSTITUTION', 10, array['hero_stat','bar'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_net_gain'),
  ('MC-1', 'institution.safety_gate_pass_rate', 'metrik.gerbang_keselamatan.label', 'metrik.gerbang_keselamatan.arti',
   'INSTITUTION', 10, array['hero_stat'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_safety_gate_pass_rate'),
  ('MC-1', 'institution.cohort_comparison', 'metrik.perbandingan_kohort.label', 'metrik.perbandingan_kohort.arti',
   'COHORT', 5, array['table'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_cohort_comparison'),
  ('MC-1', 'institution.competency_outcomes', 'metrik.kompetensi.label', 'metrik.kompetensi.arti',
   'INSTITUTION', 10, array['table','list'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_competency_outcomes'),
  ('MC-1', 'institution.verified_credentials', 'metrik.kredensial.label', 'metrik.kredensial.arti',
   'INSTITUTION', 1, array['hero_stat'], array['HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'institution_verified_credentials'),
  ('MC-1', 'item.correctness_rate', 'metrik.item_benar.label', 'metrik.item_benar.arti',
   'ITEM', 30, array['bar'], array['HEAD_OF_DEPARTMENT','INSTITUTION_ADMIN']::public.app_role[], 'item_correctness_rate'),
  ('MC-1', 'item.distractor_uptake', 'metrik.pengecoh.label', 'metrik.pengecoh.arti',
   'ITEM', 30, array['bar','table'], array['HEAD_OF_DEPARTMENT','INSTITUTION_ADMIN']::public.app_role[], 'item_distractor_uptake'),
  ('MC-1', 'item.position_effect', 'metrik.posisi.label', 'metrik.posisi.arti',
   'ITEM', 30, array['table'], array['HEAD_OF_DEPARTMENT','INSTITUTION_ADMIN']::public.app_role[], 'item_position_effect'),
  ('MC-1', 'learner.result', 'metrik.hasil_murid.label', 'metrik.hasil_murid.arti',
   'LEARNER_IN_INSTITUTION', 1, array['summary'], array['STUDENT','EDUCATOR','HEAD_OF_DEPARTMENT','INSTITUTION_ADMIN']::public.app_role[], 'learner_result');

insert into public.readiness_tiers
  (catalogue_version, tier_key, ordinal, min_mastery, max_mastery, requires_safety_gate, applies_without_post_test) values
  ('MC-1', 'kesiapan.belum_post_test',      1, null,   null,   false, true),
  ('MC-1', 'kesiapan.butuh_pendampingan',   2, 0.0000, 0.6000, false, false),
  ('MC-1', 'kesiapan.perlu_review',         3, 0.6000, 0.8000, false, false),
  ('MC-1', 'kesiapan.siap_sertifikasi',     4, 0.8000, 1.0001, true,  false);

-- ---------------------------------------------------------------------------
-- The boundary assertion.
--
-- Written against what the catalogue CONTAINS, not against what this file says
-- it contains -- the difference that matters when a later migration adds a
-- metric or a later hand adds an enum label.
-- ---------------------------------------------------------------------------
create function public.assert_metric_catalogue()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare problems text[] := '{}'; bad text; n int; v_live text;
        v_min numeric; v_max numeric; v_prev numeric;
begin
  select count(*) into n from public.metric_catalogue where superseded_by is null;
  if n <> 1 then
    problems := problems || format('%s live catalogue version(s): a report cannot cite an ambiguous catalogue', n);
  end if;
  v_live := public.current_metric_catalogue();

  -- THE TYPE-LEVEL GUARANTEE, RE-MEASURED. `metric_scope` must not have gained
  -- a person-keyed scope that spans institutions. Delta 3.1 is enforced by the
  -- absence of a label; this is what notices if somebody adds one.
  select string_agg(e.enumlabel, ', ') into bad
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'metric_scope'
     and e.enumlabel not in ('ITEM','LESSON','CLASS','COHORT','INSTITUTION','LEARNER_IN_INSTITUTION');
  if bad is not null then
    problems := problems || ('metric_scope gained value(s): ' || bad ||
      ' -- a scope outside the approved set may aggregate a person across institutions');
  end if;

  -- no metric reads anything but OFFICIAL
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d where d.evidence_class <> 'OFFICIAL';
  if bad is not null then
    problems := problems || ('metric(s) declaring evidence other than OFFICIAL: ' || bad);
  end if;

  -- no metric carries a formula. The CHECK refuses one at write time; this
  -- notices a CHECK that was dropped.
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d
   where d.calculation_key !~ '^[a-z][a-z0-9_]{2,60}$';
  if bad is not null then
    problems := problems || ('metric(s) whose calculation is not a bare name: ' || bad);
  end if;

  -- every metric states a real minimum sample
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d where d.minimum_sample is null or d.minimum_sample < 1;
  if bad is not null then
    problems := problems || ('metric(s) with no honest minimum sample: ' || bad);
  end if;

  -- a deprecated metric must say why, because a report omitting it has to be
  -- able to tell the reader something true
  select string_agg(distinct d.metric_id, ', ') into bad
    from public.metric_definitions d where d.deprecated and d.deprecation_note_key is null;
  if bad is not null then
    problems := problems || ('deprecated metric(s) with nothing to say: ' || bad);
  end if;

  -- THE READINESS BANDS TILE THE RANGE. A gap means a mastery figure resolves
  -- to no tier and a learner falls out of the distribution silently; an overlap
  -- means two tiers claim the same learner.
  if v_live is not null then
    v_prev := null;
    for v_min, v_max in
      select t.min_mastery, t.max_mastery from public.readiness_tiers t
       where t.catalogue_version = v_live and t.min_mastery is not null
       order by t.min_mastery
    loop
      if v_prev is null then
        if v_min <> 0 then
          problems := problems || format('the lowest readiness band starts at %s, not 0: mastery below it resolves to no tier', v_min);
        end if;
      elsif v_min <> v_prev then
        problems := problems || format('readiness bands do not meet at %s (previous band ended at %s)', v_min, v_prev);
      end if;
      v_prev := v_max;
    end loop;
    if v_prev is null then
      problems := problems || 'the live catalogue declares no mastery-derived readiness band'::text;
    elsif v_prev <= 1 then
      problems := problems || format('the highest readiness band ends at %s: a perfect score resolves to no tier', v_prev);
    end if;
    -- and exactly one tier is the no-post-test case
    select count(*) into n from public.readiness_tiers t
     where t.catalogue_version = v_live and t.applies_without_post_test;
    if n <> 1 then
      problems := problems || format('%s tier(s) claim the no-post-test case; exactly one must', n);
    end if;
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'catalogue %s live: %s metric(s), %s readiness tier(s) tiling mastery with no gap, every metric OFFICIAL-only '
      || 'and named rather than computed, and metric_scope carries no cross-institution person scope',
      v_live,
      (select count(*) from public.metric_definitions where catalogue_version = v_live),
      (select count(*) from public.readiness_tiers where catalogue_version = v_live))
    else array_to_string(problems, '; ') end;
  return next;
end $function$;
revoke all on function public.assert_metric_catalogue() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Every row this block probes is built here
-- and rolled back; nothing is assumed to have been seeded.
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_refused boolean; v_msg text; v_live text; v_new text;
  u_admin uuid := gen_random_uuid(); p_admin uuid;
  v_inst uuid; v_node uuid;
begin
  -- === structural ==========================================================
  if (select count(*) from pg_enum e join pg_type t on t.oid = e.enumtypid
       where t.typname = 'metric_scope') <> 6 then
    raise exception 'metric_scope does not carry exactly the six approved scopes';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'metric_scope' and e.enumlabel ilike '%across%') then
    raise exception 'metric_scope carries a cross-institution scope';
  end if;
  if public.current_metric_catalogue() <> 'MC-1' then
    raise exception 'MC-1 is not the live catalogue after this migration';
  end if;
  if not (select a.ok from public.assert_metric_catalogue() a) then
    raise exception 'the catalogue this migration just wrote does not satisfy its own assertion: %',
      (select a.detail from public.assert_metric_catalogue() a);
  end if;

  -- the catalogue is not reachable by anon, and publication is not reachable
  -- by any client role
  if has_table_privilege('anon', 'public.metric_definitions', 'SELECT') then
    raise exception 'the metric catalogue is readable by anon';
  end if;
  foreach v_msg in array array['anon','authenticated'] loop
    if has_function_privilege(v_msg, 'public.publish_metric_catalogue(text,text,jsonb)'::regprocedure, 'EXECUTE') then
      raise exception 'publish_metric_catalogue is executable by %', v_msg;
    end if;
  end loop;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    -- (1) A FORMULA IS REFUSED BY THE DATABASE, not by review.
    foreach v_msg in array array[
        'sum(x)/count(*)', 'select 1', 'a + b', 'count(*)', 'drop table items', 'UPPERCASE'] loop
      v_refused := false;
      begin
        insert into public.metric_definitions
          (catalogue_version, metric_id, label_key, meaning_key, scope, minimum_sample,
           allowed_audiences, calculation_key)
        values ('MC-1', 'probe.formula', 'metrik.probe.label', 'metrik.probe.arti', 'CLASS', 5,
                array['EDUCATOR']::public.app_role[], v_msg);
      exception when others then v_refused := true; end;
      if not v_refused then
        raise exception 'a metric whose calculation is %L was accepted: INV-34 is not mechanical', v_msg;
      end if;
    end loop;

    -- (2) a metric may not declare evidence other than OFFICIAL
    v_refused := false;
    begin
      insert into public.metric_definitions
        (catalogue_version, metric_id, label_key, meaning_key, scope, evidence_class,
         minimum_sample, allowed_audiences, calculation_key)
      values ('MC-1', 'probe.class', 'metrik.probe.label', 'metrik.probe.arti', 'CLASS',
              'SYNTHETIC', 5, array['EDUCATOR']::public.app_role[], 'probe_calc');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a metric was allowed to read non-OFFICIAL evidence'; end if;

    -- (3) a metric with no audience, or no honest minimum sample, is refused
    v_refused := false;
    begin
      insert into public.metric_definitions
        (catalogue_version, metric_id, label_key, meaning_key, scope, minimum_sample,
         allowed_audiences, calculation_key)
      values ('MC-1', 'probe.noaudience', 'metrik.probe.label', 'metrik.probe.arti', 'CLASS', 5,
              '{}'::public.app_role[], 'probe_calc');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a metric with no audience was accepted'; end if;
    v_refused := false;
    begin
      insert into public.metric_definitions
        (catalogue_version, metric_id, label_key, meaning_key, scope, minimum_sample,
         allowed_audiences, calculation_key)
      values ('MC-1', 'probe.zero', 'metrik.probe.label', 'metrik.probe.arti', 'CLASS', 0,
              array['EDUCATOR']::public.app_role[], 'probe_calc');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a metric with a zero minimum sample was accepted'; end if;

    -- (4) A PUBLISHED VERSION IS IMMUTABLE. This is what makes the version
    --     number on a stored report mean something a year later.
    v_refused := false;
    begin
      update public.metric_definitions set minimum_sample = 999
       where catalogue_version = 'MC-1' and metric_id = 'class.comprehension';
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a published metric definition was edited in place'; end if;
    v_refused := false;
    begin
      delete from public.metric_definitions
       where catalogue_version = 'MC-1' and metric_id = 'class.comprehension';
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a published metric definition was deleted'; end if;
    v_refused := false;
    begin
      update public.readiness_tiers set min_mastery = 0.9
       where catalogue_version = 'MC-1' and tier_key = 'kesiapan.siap_sertifikasi';
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a published readiness threshold was edited in place'; end if;
    v_refused := false;
    begin
      update public.metric_catalogue set note = 'rewritten' where version = 'MC-1';
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a published catalogue header was re-noted'; end if;

    -- (5) PUBLICATION REQUIRES SYSTEM_ADMIN, and with no identity at all it is
    --     refused rather than silently permitted.
    v_refused := false;
    begin
      perform public.publish_metric_catalogue('MC-2', 'probe');
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'a catalogue was published with no identity'; end if;

    -- (6) THE BUMP ITSELF: clone forward, apply an override, supersede.
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0071 school', 'probe-0071-school', true, true) returning id into v_inst;
    select id into v_node from public.org_nodes where institution_id = v_inst order by created_at limit 1;
    insert into auth.users (id, email) values (u_admin, 'probe0071-admin@local.invalid');
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_until)
    values (p_admin, 'SYSTEM_ADMIN', null, now() + interval '10 years');
    perform set_config('app.seed_intent', '', true);
    perform set_config('request.jwt.claims', json_build_object('sub', u_admin::text)::text, true);
    perform set_config('request.jwt.claim.sub', u_admin::text, true);

    if not public.is_system_admin() then raise exception 'the probe admin is not a system admin'; end if;

    -- an override naming a metric that does not exist is refused, because it
    -- would publish a version that quietly kept the old number
    v_refused := false;
    begin
      perform public.publish_metric_catalogue('MC-2', 'probe',
        jsonb_build_object('class.no_such_metric', 99));
    exception when others then v_refused := true; end;
    if not v_refused then raise exception 'an override naming an unknown metric was accepted'; end if;

    v_new := public.publish_metric_catalogue('MC-2', 'probe bump',
      jsonb_build_object('class.comprehension', 42));
    if v_new <> 'MC-2' then raise exception 'publication returned %', v_new; end if;
    if public.current_metric_catalogue() <> 'MC-2' then
      raise exception 'the live catalogue did not follow the supersession';
    end if;
    if (select superseded_by from public.metric_catalogue where version = 'MC-1') <> 'MC-2' then
      raise exception 'MC-1 was not marked superseded';
    end if;
    -- the override landed, and ONLY on the new version
    if (select minimum_sample from public.metric_definitions
         where catalogue_version = 'MC-2' and metric_id = 'class.comprehension') <> 42 then
      raise exception 'the minimum-sample override did not apply to the new version';
    end if;
    if (select minimum_sample from public.metric_definitions
         where catalogue_version = 'MC-1' and metric_id = 'class.comprehension') = 42 then
      raise exception 'the override reached back into the superseded version';
    end if;
    -- and everything else came forward intact
    select count(*) into n from public.metric_definitions where catalogue_version = 'MC-2';
    if n <> (select count(*) from public.metric_definitions where catalogue_version = 'MC-1') then
      raise exception 'the clone lost or gained metrics';
    end if;
    select count(*) into n from public.readiness_tiers where catalogue_version = 'MC-2';
    if n <> 4 then raise exception 'the clone carried % readiness tiers, not 4', n; end if;
    if not (select a.ok from public.assert_metric_catalogue() a) then
      raise exception 'the catalogue is false after a legitimate bump: %',
        (select a.detail from public.assert_metric_catalogue() a);
    end if;

    -- (7) THE ASSERTION IS WATCHED TO FAIL. A band that does not meet its
    --     neighbour must be named, or the tiling check proves nothing.
    insert into public.metric_catalogue (version, note) values ('MC-3', 'probe gap');
    insert into public.readiness_tiers
      (catalogue_version, tier_key, ordinal, min_mastery, max_mastery, applies_without_post_test) values
      ('MC-3', 'kesiapan.belum_post_test', 1, null, null, true),
      ('MC-3', 'kesiapan.rendah',          2, 0.0000, 0.5000, false),
      ('MC-3', 'kesiapan.tinggi',          3, 0.7000, 1.0001, false);
    update public.metric_catalogue set superseded_by = 'MC-3' where version = 'MC-2';
    if (select a.ok from public.assert_metric_catalogue() a) then
      raise exception 'a gap between readiness bands was not noticed';
    end if;
    if (select a.detail from public.assert_metric_catalogue() a) !~ 'do not meet at' then
      raise exception 'the band gap was not named: %',
        (select a.detail from public.assert_metric_catalogue() a);
    end if;

    raise exception 'PROBE_0071_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0071_ROLLBACK' then raise; end if;
  end;

  raise notice '0071 verified: catalogue MC-1 live, formulas refused, published versions immutable, bump clones and supersedes, band gap detected';
end $$;
