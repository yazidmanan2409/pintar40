-- 0014 — FABLE-02 §1/§4/§5/§6: content hierarchy, item-type registry and the
-- doctrine constraints the database itself enforces.
-- Architecture: docs/rebuild/02 (Learning content), 03 (INV-01..04, 12, 26),
-- FABLE-02 §1 §4 §5 §6. Schema only: FABLE-03 owns the engine that reads it.
--
-- Status columns are created here with the lifecycle enum; the transition
-- trigger, freeze hash and immutability land in the next migration (expand
-- first, enforce second — doc 16 §2).

-- ---------------------------------------------------------------------------
-- Enums. SCREAMING_SNAKE labels, lower_snake type names, no vendor words.
-- ---------------------------------------------------------------------------
create type public.content_status as enum
  ('INGESTED','STRUCTURED','VALIDATED','VALIDATION_FAILED','IN_REVIEW','APPROVED',
   'FROZEN','PUBLISHED','SUPERSEDED');

create type public.bank_type as enum ('PRACTICE','TEST','EXAM');

create type public.item_type as enum
  ('MCQ_SINGLE','MCQ_MULTI','NUMERIC','GRID','TRUE_FALSE_BATTERY','MATCHING','IMAGE_ANCHORED');

create type public.bloom_level as enum
  ('REMEMBER','UNDERSTAND','APPLY','ANALYSE','EVALUATE','CREATE');

-- ---------------------------------------------------------------------------
-- INV-02, same-row half: a hint may not name or narrow the answer. Applies to
-- the coaching columns only (petunjuk, arah_berpikir) — never to stem or
-- stimulus, where "titik A dan B" is ordinary subject prose.
-- Word boundaries are \y: PostgreSQL ARE does not treat \b as a boundary.
-- The cross-table half (hint vs the correct option's *text*) cannot be a CHECK
-- — CHECK cannot see another table — and arrives as a trigger in the next
-- migration. ADR-0002 records that deviation.
-- ---------------------------------------------------------------------------
create function public.hint_reveals_answer_shape(p_text text) returns boolean
language sql immutable parallel safe as $$
  select case when p_text is null or btrim(p_text) = '' then false else
    p_text ~* '(jawab\w*|answer|kunci|key)[^.!?]{0,24}(adalah|ialah|is|:|=)\s*\(?[a-e]\)?\y'
    or p_text ~* '\y(bukan|not|selain|exclude[sd]?|eliminate)\s+\(?[a-e]\)?\y'
    or p_text ~* '\y\(?[a-e]\)?\s+(atau|or)\s+\(?[a-e]\)?\y'
  end
$$;

-- ---------------------------------------------------------------------------
-- Authoring authorization. can_on_node() fails closed when the node is null,
-- and authored content is institution-scoped rather than node-scoped, so it
-- cannot answer "may this person author here". This is the institution-level
-- sibling: the person holds a capability-bearing role anywhere inside the
-- institution. Same shape, same fail-closed behaviour, same pinned search_path.
-- ---------------------------------------------------------------------------
create function public.can_in_institution(p_capability text, p_institution uuid)
returns boolean
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid;
begin
  if p_capability is null or p_institution is null then return false; end if;
  v_person := public.current_person_id();
  if v_person is null then return false; end if;
  return coalesce((
    select true from public.role_assignments ra
     where ra.person_id = v_person and ra.revoked_at is null
       and now() >= ra.valid_from and now() < ra.valid_until
       and p_capability = any (public.role_capabilities(ra.role))
       and (ra.role = 'SYSTEM_ADMIN'
            or exists (select 1 from public.org_nodes n
                        where n.id = ra.scope_node_id and n.institution_id = p_institution))
     limit 1), false);
exception when others then return false;
end $$;
revoke all on function public.can_in_institution(text, uuid) from public, anon;
grant execute on function public.can_in_institution(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Lesson media predicates. A CHECK constraint cannot contain a subquery, so
-- the jsonb walk lives in IMMUTABLE functions the CHECKs call.
-- ---------------------------------------------------------------------------
create function public.media_entries_have_transcripts(p_media jsonb) returns boolean
language sql immutable parallel safe as $$
  select not exists (
    select 1 from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) e
     where (e ? 'audio' or e ? 'video')
       and coalesce(btrim(e ->> 'transcript'), '') = ''
  )
$$;

create function public.media_entries_are_storage_paths(p_media jsonb) returns boolean
language sql immutable parallel safe as $$
  select not exists (
    select 1 from jsonb_array_elements(coalesce(p_media, '[]'::jsonb)) e
     where coalesce(e ->> 'path', '') ~* '^(https?:)?//'
  )
$$;

-- ---------------------------------------------------------------------------
-- Sources (OD-3). Append-only provenance for what content is grounded in.
-- Nothing is seeded: a citation is never invented.
-- ---------------------------------------------------------------------------
create table public.sources (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  title          text not null check (btrim(title) <> ''),
  publisher      text,
  isbn           text check (isbn is null or isbn ~ '^[0-9Xx-]{10,17}$'),
  note           text,
  created_at     timestamptz not null default now()
);
alter table public.sources enable row level security;

create table public.source_versions (
  id             uuid primary key default gen_random_uuid(),
  source_id      uuid not null references public.sources(id),
  institution_id uuid not null references public.institutions(id),
  version_label  text not null check (btrim(version_label) <> ''),
  published_year smallint check (published_year is null or published_year between 1900 and 2100),
  created_at     timestamptz not null default now(),
  unique (source_id, version_label)
);
alter table public.source_versions enable row level security;

-- ---------------------------------------------------------------------------
-- Course → Module → Lesson → LearningObjective
-- ---------------------------------------------------------------------------
create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id),
  subject        text not null check (btrim(subject) <> ''),
  stage          text not null check (btrim(stage) <> ''),          -- jenjang
  grade_label    text not null check (btrim(grade_label) <> ''),
  title          text not null check (btrim(title) <> ''),
  status         public.content_status not null default 'INGESTED',
  created_at     timestamptz not null default now()
);
alter table public.courses enable row level security;

create table public.modules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id),
  institution_id uuid not null references public.institutions(id),
  ordinal        smallint not null check (ordinal > 0),
  title          text not null check (btrim(title) <> ''),
  status         public.content_status not null default 'INGESTED',
  created_at     timestamptz not null default now(),
  unique (course_id, ordinal)
);
alter table public.modules enable row level security;

-- media: one JSONB column (FABLE-02 §6), not a table per type.
--  - every audio/video entry carries a non-empty transcript (accessibility at
--    the data layer);
--  - entries reference storage paths only, never a public URL (Phase 1 §7).
create table public.lessons (
  id              uuid primary key default gen_random_uuid(),
  module_id       uuid not null references public.modules(id),
  institution_id  uuid not null references public.institutions(id),
  ordinal         smallint not null check (ordinal > 0),
  title           text not null check (btrim(title) <> ''),
  summary         text,
  body_markdown   text,
  worked_examples jsonb not null default '[]'::jsonb,
  media           jsonb not null default '[]'::jsonb,
  source_version_id uuid references public.source_versions(id),
  page_citation   text,
  status          public.content_status not null default 'INGESTED',
  created_at      timestamptz not null default now(),
  unique (module_id, ordinal),
  constraint lessons_media_is_array check (jsonb_typeof(media) = 'array'),
  constraint lessons_media_transcript_required check (public.media_entries_have_transcripts(media)),
  constraint lessons_media_storage_path_only  check (public.media_entries_are_storage_paths(media))
);
alter table public.lessons enable row level security;

create table public.learning_objectives (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid not null references public.lessons(id),
  institution_id uuid not null references public.institutions(id),
  code           text not null check (btrim(code) <> ''),
  statement      text not null check (btrim(statement) <> ''),
  bloom          public.bloom_level not null,
  is_core        boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (lesson_id, code)
);
alter table public.learning_objectives enable row level security;

-- ---------------------------------------------------------------------------
-- Misconception taxonomy: append-only, codes never reused, remediation NOT NULL.
-- ---------------------------------------------------------------------------
create table public.misconception_taxonomy (
  code           text primary key,
  institution_id uuid not null references public.institutions(id),
  label          text not null check (btrim(label) <> ''),
  description    text not null check (btrim(description) <> ''),
  remediation    text not null check (btrim(remediation) <> ''),
  created_at     timestamptz not null default now()
);
alter table public.misconception_taxonomy enable row level security;

-- ---------------------------------------------------------------------------
-- Item-type registry (INV-26): a new type is registered here and added to the
-- sanitizer allow-list — never a second engine.
-- ---------------------------------------------------------------------------
create table public.item_type_registry (
  item_type          public.item_type primary key,
  renderer_contract  text not null,
  scorer_contract    text not null,
  sanitizer_allowlist jsonb not null default '[]'::jsonb,
  is_active          boolean not null default true,
  note               text
);
alter table public.item_type_registry enable row level security;
insert into public.item_type_registry (item_type, renderer_contract, scorer_contract, note) values
  ('MCQ_SINGLE',        'options.single',   'exact_option',      'one correct option'),
  ('MCQ_MULTI',         'options.multi',    'set_match',         'multiple correct options'),
  ('NUMERIC',           'numeric.stepwork', 'numeric_tolerance', 'value with optional step work'),
  ('GRID',              'grid',             'cellwise',          'row/column selection'),
  ('TRUE_FALSE_BATTERY','battery.tf',       'per_statement',     'several true/false statements'),
  ('MATCHING',          'matching',         'pairwise',          'left/right pairing'),
  ('IMAGE_ANCHORED',    'image.anchored',   'region_or_option',  'answer anchored to an image region');

-- ---------------------------------------------------------------------------
-- Item. predicted_* is authored; empirical_* stays NULL until legitimately
-- computed from sufficient OFFICIAL evidence (doc 02 "Item Statistics") — it is
-- never seeded and never defaulted to look complete.
-- ---------------------------------------------------------------------------
create table public.items (
  id                  uuid primary key default gen_random_uuid(),
  lesson_id           uuid not null references public.lessons(id),
  institution_id      uuid not null references public.institutions(id),
  item_type           public.item_type not null references public.item_type_registry(item_type),
  bank_type           public.bank_type not null,
  stem                text not null check (btrim(stem) <> ''),
  stimulus            text,
  petunjuk            text,
  arah_berpikir       text,
  objective_ids       uuid[] not null default '{}',
  is_safety_critical  boolean not null default false,
  parallel_group      uuid,
  predicted_difficulty numeric(4,3) check (predicted_difficulty is null or predicted_difficulty between 0 and 1),
  empirical_difficulty numeric(4,3),
  empirical_discrimination numeric(4,3),
  empirical_evidence_count integer,
  source_version_id   uuid references public.source_versions(id),
  page_citation       text,
  status              public.content_status not null default 'INGESTED',
  created_at          timestamptz not null default now(),
  constraint items_petunjuk_no_answer      check (not public.hint_reveals_answer_shape(petunjuk)),
  constraint items_arah_berpikir_no_answer check (not public.hint_reveals_answer_shape(arah_berpikir))
);
create index items_lesson_idx on public.items (lesson_id);
create index items_bank_idx on public.items (institution_id, bank_type);
create index items_parallel_group_idx on public.items (parallel_group) where parallel_group is not null;
alter table public.items enable row level security;

-- INV-03: every option carries a non-empty rationale, correct or not.
create table public.item_options (
  id                 uuid primary key default gen_random_uuid(),
  item_id            uuid not null references public.items(id),
  institution_id     uuid not null references public.institutions(id),
  label              text not null check (label ~ '^[A-E]$'),
  body               text not null check (btrim(body) <> ''),
  is_correct         boolean not null default false,
  rationale          text not null check (btrim(rationale) <> ''),
  misconception_code text references public.misconception_taxonomy(code),
  created_at         timestamptz not null default now(),
  unique (item_id, label)
);
create index item_options_item_idx on public.item_options (item_id);
alter table public.item_options enable row level security;

-- ---------------------------------------------------------------------------
-- Transfer portability: authored content belongs to the institution that
-- authored it and never travels with a learner.
-- ---------------------------------------------------------------------------
insert into public.record_class_registry values
  ('sources',                'INSTITUTION_SCOPED', 'authored provenance'),
  ('source_versions',        'INSTITUTION_SCOPED', 'authored provenance'),
  ('courses',                'INSTITUTION_SCOPED', 'authored content'),
  ('modules',                'INSTITUTION_SCOPED', 'authored content'),
  ('lessons',                'INSTITUTION_SCOPED', 'authored content'),
  ('learning_objectives',    'INSTITUTION_SCOPED', 'authored content'),
  ('items',                  'INSTITUTION_SCOPED', 'question bank never transfers'),
  ('item_options',           'INSTITUTION_SCOPED', 'question bank never transfers'),
  ('misconception_taxonomy', 'INSTITUTION_SCOPED', 'authored taxonomy');

-- ---------------------------------------------------------------------------
-- Grants and RLS. Authoring is a staff capability (CAN_DRAFT); item content is
-- a harvestable question bank, so no learner and no anon role reads it (INV-01).
-- anon receives nothing anywhere in this migration.
-- ---------------------------------------------------------------------------
-- Reference data, but never `using (true)` — that trips the standing rule and
-- the schema-lint counter. Signed-in people only.
grant select on public.item_type_registry to authenticated;
create policy item_type_registry_select on public.item_type_registry for select to authenticated
  using (public.current_person_id() is not null);

do $$
declare t text;
begin
  foreach t in array array['sources','source_versions','courses','modules','lessons',
                           'learning_objectives','misconception_taxonomy','items','item_options']
  loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format($f$
      create policy %1$s_select on public.%1$I for select to authenticated
        using (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
    execute format($f$
      create policy %1$s_insert on public.%1$I for insert to authenticated
        with check (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
    execute format($f$
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.can_in_institution('CAN_DRAFT', institution_id))
        with check (public.can_in_institution('CAN_DRAFT', institution_id))
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Verification block (doc 16 §2): this migration fails on its own violation.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text;
begin
  -- every new table has RLS
  select count(*) into n from pg_tables
   where schemaname = 'public' and not rowsecurity
     and tablename in ('sources','source_versions','courses','modules','lessons',
                       'learning_objectives','misconception_taxonomy','item_type_registry',
                       'items','item_options');
  if n > 0 then raise exception 'RLS not enabled on % FABLE-02 content table(s)', n; end if;

  -- no anon grant anywhere in public
  select count(*) into n from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'anon';
  if n > 0 then raise exception 'anon holds % table grant(s) in public', n; end if;

  -- no permissive policy
  select count(*) into n from pg_policies
   where schemaname = 'public' and (qual = 'true' or with_check = 'true');
  if n > 0 then raise exception '% permissive policy/policies introduced', n; end if;

  -- the new authoring predicate fails closed on null input (Lesson 11)
  if public.can_in_institution(null, null) or public.can_in_institution('CAN_DRAFT', null)
     or public.can_in_institution(null, gen_random_uuid()) then
    raise exception 'can_in_institution failed open on null input';
  end if;

  -- SECURITY DEFINER hygiene unchanged
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;

  -- INV-02 detector: fires on reveals and narrowing, silent on subject prose.
  -- \y is the word boundary in PostgreSQL ARE; \b is not, and an earlier
  -- revision of this function silently matched nothing because of it.
  if not public.hint_reveals_answer_shape('Ingat, jawabannya adalah C') then
    raise exception 'INV-02 detector missed an answer reveal'; end if;
  if not public.hint_reveals_answer_shape('Kunci: B') then
    raise exception 'INV-02 detector missed a short-form key'; end if;
  if not public.hint_reveals_answer_shape('The answer is d.') then
    raise exception 'INV-02 detector missed an English reveal'; end if;
  if not public.hint_reveals_answer_shape('Pilihannya bukan A') then
    raise exception 'INV-02 detector missed a narrowing hint'; end if;
  if not public.hint_reveals_answer_shape('Pilih antara A atau C') then
    raise exception 'INV-02 detector missed a narrowing-to-two hint'; end if;
  if public.hint_reveals_answer_shape('Perhatikan satuan sebelum menghitung hasil akhirnya') then
    raise exception 'INV-02 detector flagged legitimate coaching text'; end if;
  if public.hint_reveals_answer_shape('Gunakan rumus luas segitiga, lalu bandingkan hasilnya') then
    raise exception 'INV-02 detector flagged legitimate subject language'; end if;

  -- media predicates behave
  if public.media_entries_have_transcripts('[{"audio":{"path":"a.mp3"}}]'::jsonb) then
    raise exception 'media transcript predicate allowed an audio entry with no transcript'; end if;
  if not public.media_entries_have_transcripts('[{"audio":{"path":"a.mp3"},"transcript":"teks"}]'::jsonb) then
    raise exception 'media transcript predicate rejected a captioned entry'; end if;
  if public.media_entries_are_storage_paths('[{"path":"https://cdn.example/x.mp3"}]'::jsonb) then
    raise exception 'media path predicate allowed a public URL'; end if;

  -- every new content table is registered for transfer portability
  select string_agg(t, ', ') into bad from unnest(array['sources','source_versions','courses','modules',
    'lessons','learning_objectives','items','item_options','misconception_taxonomy']) t
   where not exists (select 1 from public.record_class_registry r where r.table_name = t);
  if bad is not null then raise exception 'record_class_registry missing: %', bad; end if;

  -- the item-type registry is populated and referenced
  select count(*) into n from public.item_type_registry;
  if n <> 7 then raise exception 'item_type_registry has % rows, expected 7', n; end if;

  -- empirical columns exist and default to NULL (never seeded to look complete)
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='items'
     and column_name in ('empirical_difficulty','empirical_discrimination','empirical_evidence_count')
     and column_default is not null;
  if n > 0 then raise exception '% empirical column(s) carry a default', n; end if;
end $$;
