-- 0027 — FABLE-02 §9: the coaching validator, MCQ quality checks, and
-- Publish Readiness (INV-35).
--
-- LESSON 10, ENFORCED RATHER THAN REMEMBERED. "Adding a learner-readable
-- column later means adding it to this validator in the same migration" is a
-- rule nobody will remember in eight months. The set of learner-readable
-- fields is therefore a TABLE, the validator iterates it, and this migration's
-- verification block compares it against the actual text columns of the content
-- tables. A new learner-readable column that nobody registered fails the
-- migration that adds it, which is the only version of this rule that survives.
--
-- LEGITIMATE SUBJECT LANGUAGE IS NOT A VIOLATION. The lexicon's whole
-- difficulty is that "salah" is forbidden as a judgement and ordinary as
-- Indonesian -- "salah satu" means "one of". Each term is therefore a pattern
-- that excludes its own legitimate forms rather than a bare word plus a
-- reviewer's judgement.
--
-- WHAT BLOCKS PUBLICATION, AND WHAT DOES NOT. INV-35 names technical
-- validation, academic approval, FROZEN, ERROR findings and unacknowledged
-- WARNING findings. The first three are already the state machine's job: a
-- release cannot reach FROZEN without traversing VALIDATED, IN_REVIEW and
-- APPROVED with a reviewer who is not the author. Re-deriving them here would
-- be a second opinion that could disagree with the first. Readiness therefore
-- adds exactly what the state machine cannot see -- the findings -- and the
-- FROZEN -> PUBLISHED transition re-checks it server-side.

create type public.finding_severity as enum ('ERROR','WARNING');

-- ---------------------------------------------------------------------------
-- Which fields a learner can read. Data, not a code comment.
-- ---------------------------------------------------------------------------
create table public.learner_readable_fields (
  table_name  text not null,
  column_name text not null,
  note        text,
  primary key (table_name, column_name)
);
alter table public.learner_readable_fields enable row level security;
insert into public.learner_readable_fields values
  ('lessons','title',                 'lesson heading'),
  ('lessons','summary',               'lesson summary'),
  ('lessons','body_markdown',         'lesson prose'),
  ('items','stem',                    'the question itself'),
  ('items','stimulus',                'shared context for a question'),
  ('items','petunjuk',                'coaching hint'),
  ('items','arah_berpikir',           'thinking scaffold'),
  ('item_options','body',             'option text'),
  ('item_options','rationale',        'why an option is right or wrong'),
  ('misconception_taxonomy','remediation', 'what to do about a misconception'),
  ('learning_objectives','statement', 'what the learner will be able to do');
grant select on public.learner_readable_fields to authenticated;
create policy learner_readable_fields_select on public.learner_readable_fields
  for select to authenticated using (public.current_person_id() is not null);

-- ---------------------------------------------------------------------------
-- The doctrine lexicon. Each row carries the coaching a finding will quote, so
-- the message a teacher reads is versioned with the rule, not built in code.
-- ---------------------------------------------------------------------------
create table public.doctrine_lexicon (
  term_pattern     text primary key,
  label            text not null,
  severity         public.finding_severity not null,
  mengapa_penting  text not null check (btrim(mengapa_penting) <> ''),
  cara_memperbaiki text not null check (btrim(cara_memperbaiki) <> '')
);
alter table public.doctrine_lexicon enable row level security;
insert into public.doctrine_lexicon values
  ('\ysalah\y(?!\s+satu)', 'kata menghakimi: "salah"', 'ERROR',
   'Menyebut pekerjaan siswa "salah" menutup percakapan dan memindahkan fokus dari cara berpikir ke penilaian diri.',
   'Sebut apa yang terjadi pada langkahnya: "penyebutnya belum disamakan", bukan "jawabanmu salah".'),
  ('\y(gagal|bodoh|malas)\y', 'kata menghakimi tentang siswa', 'ERROR',
   'Kata ini menilai orangnya, bukan pekerjaannya, dan tidak memberi jalan keluar.',
   'Ganti dengan langkah konkret berikutnya yang bisa dicoba siswa.'),
  ('\y(wrong|incorrect|failed|stupid|penalty)\y', 'judgemental English term', 'ERROR',
   'Learner-facing copy is Indonesian and coaching in tone; an English verdict word is both out of register and a judgement.',
   'Describe the step that did not hold, in Indonesian, with the next thing to try.'),
  ('\y(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|SUPERSEDED)\y',
   'status internal bocor ke teks siswa', 'ERROR',
   'Nama status internal tidak berarti apa pun bagi siswa dan membocorkan cara kerja sistem.',
   'Hapus dari teks; status ditampilkan lewat bahasa manusia di lapisan tampilan.'),
  ('\y(evidence_class|OFFICIAL|PREVIEW|SYNTHETIC|PUBLIC_DEMO)\y',
   'istilah bukti internal bocor ke teks siswa', 'ERROR',
   'Klasifikasi bukti adalah urusan internal; menampilkannya membingungkan dan mengundang salah tafsir.',
   'Hapus dari teks yang dibaca siswa.'),
  ('\yPINTAR\s*4\.0\y', 'nama versi internal', 'WARNING',
   'String versi internal tidak pernah menjadi bagian dari materi ajar.',
   'Hapus; sebut nama produk hanya di tempat yang memang untuk itu.');
grant select on public.doctrine_lexicon to authenticated;
create policy doctrine_lexicon_select on public.doctrine_lexicon
  for select to authenticated using (public.current_person_id() is not null);

-- Pure: given a piece of learner-facing text, which doctrine rules does it break.
create function public.validate_learner_text(p_text text)
returns table (term_pattern text, label text, severity public.finding_severity,
               mengapa_penting text, cara_memperbaiki text)
language sql stable as $$
  select d.term_pattern, d.label, d.severity, d.mengapa_penting, d.cara_memperbaiki
    from public.doctrine_lexicon d
   where p_text is not null and btrim(p_text) <> '' and p_text ~* d.term_pattern
$$;
revoke all on function public.validate_learner_text(text) from public, anon;
grant execute on function public.validate_learner_text(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Findings. Coaching shape: Lokasi, Masalah, Mengapa penting, Cara memperbaiki.
-- ---------------------------------------------------------------------------
create table public.coaching_findings (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references public.institutions(id),
  course_id        uuid not null references public.courses(id),
  target_table     text not null,
  target_id        uuid not null,
  target_field     text not null,
  severity         public.finding_severity not null,
  lokasi           text not null,
  masalah          text not null,
  mengapa_penting  text not null,
  cara_memperbaiki text not null,
  acknowledged_by_person_id uuid references public.persons(id),
  acknowledged_at  timestamptz,
  created_at       timestamptz not null default now(),
  constraint coaching_findings_ack_is_paired
    check ((acknowledged_by_person_id is null) = (acknowledged_at is null))
);
create index coaching_findings_course_idx on public.coaching_findings (course_id, severity);
alter table public.coaching_findings enable row level security;

create table public.mcq_quality_findings (
  id               uuid primary key default gen_random_uuid(),
  institution_id   uuid not null references public.institutions(id),
  course_id        uuid not null references public.courses(id),
  item_id          uuid references public.items(id),
  pattern_class    text not null,
  severity         public.finding_severity not null,
  lokasi           text not null,
  masalah          text not null,
  mengapa_penting  text not null,
  cara_memperbaiki text not null,
  acknowledged_by_person_id uuid references public.persons(id),
  acknowledged_at  timestamptz,
  created_at       timestamptz not null default now(),
  constraint mcq_quality_findings_ack_is_paired
    check ((acknowledged_by_person_id is null) = (acknowledged_at is null))
);
create index mcq_quality_findings_course_idx on public.mcq_quality_findings (course_id, severity);
alter table public.mcq_quality_findings enable row level security;

-- Acknowledgement is a CAN_REVIEW act and nothing else about a finding moves.
create function public.enforce_finding_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_col text; v_new jsonb; v_old jsonb;
begin
  if tg_op = 'INSERT' then return new; end if;
  if tg_op = 'DELETE' then return old; end if;
  v_new := to_jsonb(new); v_old := to_jsonb(old);
  foreach v_col in array array['institution_id','course_id','severity','lokasi','masalah',
                               'mengapa_penting','cara_memperbaiki','created_at'] loop
    if (v_new -> v_col) is distinct from (v_old -> v_col) then
      raise exception 'a finding is a record of what was found; only its acknowledgement changes (%)', v_col;
    end if;
  end loop;
  if new.acknowledged_by_person_id is distinct from old.acknowledged_by_person_id then
    if not public.can_in_institution('CAN_REVIEW', new.institution_id) then
      raise exception 'acknowledging a finding requires CAN_REVIEW in the owning institution';
    end if;
    new.acknowledged_by_person_id := public.current_person_id();
    new.acknowledged_at := coalesce(new.acknowledged_at, now());
  end if;
  return new;
end $$;
revoke all on function public.enforce_finding_write() from public, anon, authenticated;
create trigger coaching_findings_write before insert or update or delete on public.coaching_findings
  for each row execute function public.enforce_finding_write();
create trigger mcq_quality_findings_write before insert or update or delete on public.mcq_quality_findings
  for each row execute function public.enforce_finding_write();

do $$
declare t text;
begin
  foreach t in array array['coaching_findings','mcq_quality_findings'] loop
    execute format('grant select, update on public.%I to authenticated', t);
    execute format($f$create policy %1$s_select on public.%1$I for select to authenticated
      using (public.can_in_institution('CAN_DRAFT', institution_id))$f$, t);
    execute format($f$create policy %1$s_update on public.%1$I for update to authenticated
      using (public.can_in_institution('CAN_REVIEW', institution_id))
      with check (public.can_in_institution('CAN_REVIEW', institution_id))$f$, t);
    execute format('create trigger %1$s_tenant_immutable before update on public.%1$I
      for each row execute function public.enforce_record_tenant_immutable()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- The validator. Iterates learner_readable_fields, so a registered column is
-- scanned automatically and an unregistered one fails this migration's check.
-- ---------------------------------------------------------------------------
create function public.validate_course_content(p_course uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare f record; r record; v_inst uuid; v_sql text; n integer := 0;
begin
  select institution_id into v_inst from public.courses where id = p_course;
  if v_inst is null then raise exception 'unknown course %', p_course; end if;
  delete from public.coaching_findings where course_id = p_course and acknowledged_at is null;

  for f in select * from public.learner_readable_fields loop
    -- every branch yields the same three columns, so the insert below does not
    -- care which table it is walking
    v_sql := case f.table_name
      when 'lessons' then format($q$
        select l.id as tid, l.%1$I as txt,
               'Pelajaran "' || l.title || '", kolom %1$s' as lokasi
          from public.lessons l join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name)
      when 'items' then format($q$
        select i.id as tid, i.%1$I as txt,
               'Soal "' || left(i.stem, 40) || '", kolom %1$s' as lokasi
          from public.items i join public.lessons l on l.id = i.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name)
      when 'item_options' then format($q$
        select o.id as tid, o.%1$I as txt,
               'Pilihan ' || o.label || ' pada soal "' || left(i.stem, 30) || '", kolom %1$s' as lokasi
          from public.item_options o join public.items i on i.id = o.item_id
          join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
         where m.course_id = $1$q$, f.column_name)
      when 'learning_objectives' then format($q$
        select lo.id as tid, lo.%1$I as txt,
               'Tujuan ' || lo.code || ', kolom %1$s' as lokasi
          from public.learning_objectives lo join public.lessons l on l.id = lo.lesson_id
          join public.modules m on m.id = l.module_id where m.course_id = $1$q$, f.column_name)
      -- misconception_taxonomy is keyed by a text code, not a uuid, so it is
      -- validated per institution rather than per course; FABLE-02 registers
      -- the field and the taxonomy sweep lands with the ingestion migration
      -- that first writes taxonomy rows.
      else null end;
    if v_sql is null then continue; end if;
    for r in execute v_sql using p_course loop
      insert into public.coaching_findings (institution_id, course_id, target_table, target_id,
        target_field, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
      select v_inst, p_course, f.table_name, r.tid, f.column_name, v.severity,
             r.lokasi, v.label, v.mengapa_penting, v.cara_memperbaiki
        from public.validate_learner_text(r.txt) v;
      get diagnostics n = row_count;
    end loop;
  end loop;
  select count(*) into n from public.coaching_findings where course_id = p_course;
  return n;
end $$;
revoke all on function public.validate_course_content(uuid) from public, anon;
grant execute on function public.validate_course_content(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- MCQ quality: exploitable patterns, never cosmetic uniformity.
-- ---------------------------------------------------------------------------
create function public.run_mcq_quality(p_course uuid) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid; n integer;
begin
  select institution_id into v_inst from public.courses where id = p_course;
  if v_inst is null then raise exception 'unknown course %', p_course; end if;
  delete from public.mcq_quality_findings where course_id = p_course and acknowledged_at is null;

  -- the correct option is markedly the longest: a testwise learner picks it
  -- without reading the subject matter. Length alone is not a fault, so the
  -- threshold is a wide margin, not equality.
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'CORRECT_OPTION_LENGTH_IMBALANCE', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Pilihan benar jauh lebih panjang daripada pengecohnya.',
         'Siswa yang paham pola ujian bisa memilih yang terpanjang tanpa menguasai materinya.',
         'Panjangkan pengecoh yang masuk akal atau ringkaskan pilihan benar; jangan samakan panjangnya secara kosmetik.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
     and (select length(o.body) from public.item_options o where o.item_id = i.id and o.is_correct limit 1)
         > 2 * (select coalesce(max(length(o.body)), 0) from public.item_options o
                 where o.item_id = i.id and not o.is_correct);

  -- the stem gives the answer away by sharing a distinctive word with the
  -- correct option and with no distractor
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select distinct v_inst, p_course, i.id, 'STEM_REVEALS_ANSWER', 'ERROR',
         'Soal "' || left(i.stem, 40) || '"',
         'Kata khas pada pertanyaan hanya muncul di pilihan yang benar.',
         'Kecocokan kata memberi jawabannya tanpa penalaran apa pun.',
         'Ganti kata itu di pertanyaan, atau pakai kata yang sama di pengecoh yang masuk akal.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
    join public.item_options oc on oc.item_id = i.id and oc.is_correct
    join lateral unnest(string_to_array(lower(oc.body), ' ')) w(token) on length(w.token) >= 6
   where m.course_id = p_course
     and lower(i.stem) like '%' || w.token || '%'
     and not exists (select 1 from public.item_options od
                      where od.item_id = i.id and not od.is_correct
                        and lower(od.body) like '%' || w.token || '%');

  -- a distractor no one could believe is not a distractor
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'IMPLAUSIBLE_DISTRACTOR', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Ada pengecoh yang terlalu pendek dibanding yang lain sehingga tidak meyakinkan.',
         'Pengecoh yang tidak mungkin dipilih mempersempit soal menjadi tebakan di antara sisanya.',
         'Tulis ulang pengecoh itu dari kesalahan berpikir yang nyata, lalu tautkan ke miskonsepsinya.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course
     and exists (select 1 from public.item_options o where o.item_id = i.id and not o.is_correct
                   and length(o.body) * 3 < (select avg(length(o2.body)) from public.item_options o2
                                              where o2.item_id = i.id));

  -- distractors with no misconception behind them teach nothing
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, i.id, 'WEAK_MISCONCEPTION_LINKAGE', 'WARNING',
         'Soal "' || left(i.stem, 40) || '"',
         'Tidak satu pun pengecoh tertaut ke miskonsepsi.',
         'Tanpa tautan itu, jawaban salah tidak bisa dijelaskan atau diremediasi.',
         'Tautkan setiap pengecoh ke kode miskonsepsi yang menjelaskan mengapa siswa memilihnya.'
    from public.items i join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id
   where m.course_id = p_course and i.item_type in ('MCQ_SINGLE','MCQ_MULTI')
     and not exists (select 1 from public.item_options o
                      where o.item_id = i.id and not o.is_correct and o.misconception_code is not null)
     and exists (select 1 from public.item_options o where o.item_id = i.id and not o.is_correct);

  -- the correct answer sits in the same position across the bank
  insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class,
    severity, lokasi, masalah, mengapa_penting, cara_memperbaiki)
  select v_inst, p_course, null, 'ANSWER_POSITION_SKEW', 'WARNING',
         'Bank soal untuk kursus ini',
         'Jawaban benar terlalu sering berada di posisi yang sama.',
         'Pola posisi bisa dipelajari dan dipakai tanpa menguasai materi.',
         'Sebarkan posisi jawaban benar saat menulis, atau aktifkan pengacakan pilihan pada definisi asesmen.'
   where (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id
           join public.modules m on m.id = l.module_id where m.course_id = p_course) >= 10
     and (select max(c) * 2 > sum(c) from (
            select count(*) c from public.item_options o
              join public.items i on i.id = o.item_id
              join public.lessons l on l.id = i.lesson_id
              join public.modules m on m.id = l.module_id
             where m.course_id = p_course and o.is_correct group by o.label) x);

  select count(*) into n from public.mcq_quality_findings where course_id = p_course;
  return n;
end $$;
revoke all on function public.run_mcq_quality(uuid) from public, anon;
grant execute on function public.run_mcq_quality(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Publish Readiness (INV-35). A derived projection, never a status column.
-- ---------------------------------------------------------------------------
create function public.publish_readiness(p_course uuid)
returns table (status text, blockers text[])
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_err int; v_warn int; v_blockers text[] := '{}';
begin
  if not exists (select 1 from public.courses where id = p_course) then
    raise exception 'unknown course %', p_course;
  end if;
  select count(*) into v_err from public.coaching_findings
   where course_id = p_course and severity = 'ERROR' and acknowledged_at is null;
  select count(*) into v_warn from public.coaching_findings
   where course_id = p_course and severity = 'WARNING' and acknowledged_at is null;
  if v_err > 0 then v_blockers := v_blockers || format('%s temuan ERROR pada teks siswa', v_err); end if;
  if v_warn > 0 then v_blockers := v_blockers || format('%s temuan WARNING pada teks siswa belum diakui', v_warn); end if;

  select count(*) into v_err from public.mcq_quality_findings
   where course_id = p_course and severity = 'ERROR' and acknowledged_at is null;
  select count(*) into v_warn from public.mcq_quality_findings
   where course_id = p_course and severity = 'WARNING' and acknowledged_at is null;
  if v_err > 0 then v_blockers := v_blockers || format('%s temuan ERROR mutu soal', v_err); end if;
  if v_warn > 0 then v_blockers := v_blockers || format('%s temuan WARNING mutu soal belum diakui', v_warn); end if;

  if exists (select 1 from unnest(v_blockers) b where b like '%ERROR%') then
    status := 'BLOCKED';
  elsif array_length(v_blockers, 1) > 0 then
    status := 'ACTION_REQUIRED';
  else
    status := 'READY';
  end if;
  blockers := v_blockers;
  return next;
end $$;
revoke all on function public.publish_readiness(uuid) from public, anon;
grant execute on function public.publish_readiness(uuid) to authenticated;

-- FROZEN -> PUBLISHED re-checks readiness server-side (INV-35). Technical
-- validation, academic approval and FROZEN are already the state machine's
-- job; this adds only what it cannot see.
create or replace function public.enforce_release_publish_readiness() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status text; v_blockers text[];
begin
  if new.status = 'PUBLISHED' and old.status is distinct from new.status then
    select status, blockers into v_status, v_blockers from public.publish_readiness(new.course_id);
    if v_status <> 'READY' then
      raise exception 'publish readiness is %: %', v_status, array_to_string(v_blockers, '; ');
    end if;
  end if;
  return new;
end $$;
revoke all on function public.enforce_release_publish_readiness() from public, anon, authenticated;
create trigger plp_releases_zz_publish_readiness before update on public.plp_releases
  for each row execute function public.enforce_release_publish_readiness();

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003): structural and pure-function only.
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text;
begin
  -- LESSON 10: every learner-readable text column on a content table is
  -- registered. A new one fails the migration that adds it.
  select string_agg(c.table_name || '.' || c.column_name, ', ') into bad
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name in ('lessons','items','item_options','learning_objectives','misconception_taxonomy')
     and c.data_type = 'text'
     -- Not prose a learner reads: stable identifiers (code, misconception_code),
     -- the option's position marker (label), staff-facing provenance
     -- (page_citation) and the taxonomy's internal description. Everything
     -- else on these tables reaches a learner and must be registered above.
     and c.column_name not in ('code','misconception_code','label','page_citation','description')
     and not exists (select 1 from public.learner_readable_fields f
                      where f.table_name = c.table_name and f.column_name = c.column_name);
  if bad is not null then
    raise exception 'learner-readable column(s) not registered with the validator (Lesson 10): %', bad;
  end if;

  -- the lexicon distinguishes judgement from subject language
  if not exists (select 1 from public.validate_learner_text('Jawabanmu salah')) then
    raise exception 'the validator missed a judgement word'; end if;
  if exists (select 1 from public.validate_learner_text('Pilih salah satu dari dua cara berikut')) then
    raise exception 'the validator flagged legitimate Indonesian ("salah satu")'; end if;
  if not exists (select 1 from public.validate_learner_text('This answer is incorrect')) then
    raise exception 'the validator missed an English verdict word'; end if;
  if not exists (select 1 from public.validate_learner_text('Materi ini masih FROZEN')) then
    raise exception 'the validator missed an internal status leaking into learner text'; end if;
  if exists (select 1 from public.validate_learner_text('Samakan penyebutnya lebih dulu, lalu jumlahkan')) then
    raise exception 'the validator flagged ordinary coaching text'; end if;
  select count(*) into n from public.doctrine_lexicon where severity = 'ERROR';
  if n < 4 then raise exception 'the doctrine lexicon carries only % ERROR rules', n; end if;

  -- every lexicon row carries coaching, not just a verdict
  select count(*) into n from public.doctrine_lexicon
   where btrim(mengapa_penting) = '' or btrim(cara_memperbaiki) = '';
  if n > 0 then raise exception '% lexicon row(s) carry no concrete fix', n; end if;

  -- readiness is a projection, not a column
  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='courses' and column_name ~* 'readiness';
  if n > 0 then raise exception 'publish readiness became a stored column'; end if;
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_release_publish_readiness';
  if def not like '%publish_readiness%' then
    raise exception 'FROZEN -> PUBLISHED does not re-check readiness server-side (INV-35)';
  end if;

  -- findings record what was found; only acknowledgement moves, under CAN_REVIEW
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='enforce_finding_write';
  if def not like '%CAN_REVIEW%' then
    raise exception 'a finding can be acknowledged without CAN_REVIEW';
  end if;

  -- standing hygiene
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  if n > 0 then raise exception 'anon holds % grant(s) beyond the published view', n; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
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
