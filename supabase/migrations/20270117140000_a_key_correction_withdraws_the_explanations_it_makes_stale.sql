-- F1-R1b (owner, 12 Nov 2026, Option A; INV-03 amended A1): a key correction withdraws the explanations it makes stale
-- (C1W-KEY-CORRECTION-CLEARS-STALE-EXPLANATIONS.md §0, §3a, §3c, §3d, §3e).
--
--   * THE DEFECT: tegaskan_koreksi_kunci set is_correct on the corrected revision's options and left their rationale and
--     misconception code as authored for the old key. On the corrected revision the new key could read «Ini belum
--     tepat» and name a misconception, and the old key «Ini tepat»; every later sitting could show a mark and, beside
--     it, an explanation that contradicts it.
--   * THE CORRECTION: in the confirming act, in the statement that writes the corrected key on the draft copy, an
--     option whose correctness changed loses its rationale and its misconception code, and names the correction that
--     withdrew them (rationale_withdrawn_by). The withdrawn text is kept on the correction's record (penjelasan_dihapus,
--     written once). Options whose correctness did not change are untouched; nothing sealed is rewritten.
--   * INV-03, AMENDED (owner, A1; docs/rebuild/03-PINTAR-INVARIANTS.md, ADR-0025): a rationale is non-empty, or it is
--     null and the withdrawing correction is named. One CHECK, and a trigger admitting the reference from exactly two
--     places (Sharon §3d.1): the confirming act (koreksi_kunci_berwenang for that correction, the option in its corrected
--     copy of the target question, its correctness different from the option it supersedes), and a copy of an option
--     that already holds the same reference (the copied question's supersedes_item_id, and the same label: unique per
--     question). Every other path is refused. Writing a rationale again clears the reference, in the same statement,
--     by the same trigger.
--   * UNCHANGED: the release digest (content_field writes '~' for null; the reference is governance, not taught
--     content); the draft editor and the package upload still refuse an option without a rationale; the sealed-content
--     guard; the two-person rule.

-- ═══════════════════════════════════════════════════════════ (1) the columns and INV-03's one constraint
alter table public.key_corrections add column penjelasan_dihapus jsonb;
comment on column public.key_corrections.penjelasan_dihapus is
  'F1-R1b: the explanations the confirmed correction withdrew from its corrected copy, [{label, rationale, '
  'misconception_code}], written once in the confirming transaction.';

alter table public.item_options
  add column rationale_withdrawn_by uuid references public.key_corrections(id) on delete restrict;
alter table public.item_options alter column rationale drop not null;
alter table public.item_options drop constraint item_options_rationale_check;
alter table public.item_options add constraint item_options_rationale_inv03 check (
  (rationale is not null and btrim(rationale) <> '' and rationale_withdrawn_by is null)
  or (rationale is null and rationale_withdrawn_by is not null));
comment on column public.item_options.rationale_withdrawn_by is
  'INV-03 (amended 12 Nov 2026, ADR-0025): the confirmed key correction that withdrew this option''s rationale because it '
  'contradicted the corrected key. Set only by the confirming act, or carried by a copy; cleared when a rationale is written.';

-- ═══════════════════════════════════════════════════════════ (2) who may set the reference
create or replace function public.alasan_ditarik_jaga()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare k public.key_corrections; v_item public.items; v_asal uuid; v_dulu boolean;
begin
  -- a new row never arrives with both: no path inserts a rationale and a withdrawal together
  if tg_op = 'INSERT' and new.rationale_withdrawn_by is not null and new.rationale is not null then
    raise exception using errcode = '23514', message = 'an option has a rationale or names the correction that withdrew it, not both';
  end if;
  -- writing a rationale again ends the withdrawn state (the ordinary draft path), whoever writes it
  if tg_op = 'UPDATE' and new.rationale is not null and btrim(new.rationale) <> '' then
    new.rationale_withdrawn_by := null;
    return new;
  end if;
  if new.rationale_withdrawn_by is null then return new; end if;   -- the CHECK refuses a null rationale without one
  if tg_op = 'UPDATE' and new.rationale_withdrawn_by is not distinct from old.rationale_withdrawn_by then return new; end if;
  if tg_op = 'UPDATE' and old.rationale_withdrawn_by is not null then
    raise exception using errcode = '42501', message = 'a withdrawn rationale keeps the correction that withdrew it';
  end if;
  select * into v_item from public.items i where i.id = new.item_id;
  v_asal := v_item.supersedes_item_id;
  -- (a) the confirming act: the correction it is confirming, on its corrected copy of the question it corrects
  select * into k from public.key_corrections c where c.id = new.rationale_withdrawn_by;
  if tg_op = 'UPDATE'
     and public.koreksi_kunci_berwenang('items', to_jsonb(v_item))
     and nullif(current_setting('pintar.koreksi_kunci', true), '')::uuid = new.rationale_withdrawn_by
     -- the copy supersedes the question the correction names, or one in its line (the draft copy itself is not yet in it)
     and (v_asal = k.item_id or exists (select 1 from public.soal_leluhur_sah(v_asal) x where x.item_id = k.item_id)) then
    select o.is_correct into v_dulu from public.item_options o where o.item_id = v_asal and o.label = new.label;
    if new.is_correct is distinct from v_dulu then return new; end if;
  end if;
  -- (b) a copy of an option that already holds the same reference
  if tg_op = 'INSERT' and v_asal is not null
     and exists (select 1 from public.item_options o where o.item_id = v_asal and o.label = new.label
                   and o.rationale_withdrawn_by = new.rationale_withdrawn_by) then
    return new;
  end if;
  raise exception using errcode = '42501',
    message = 'a rationale is withdrawn only by a confirmed key correction, or carried by a copy of an option it withdrew';
end $$;
revoke all on function public.alasan_ditarik_jaga() from public, anon, authenticated, service_role;
create trigger _f1r1b_item_options_alasan before insert or update on public.item_options
  for each row execute function public.alasan_ditarik_jaga();

-- ═══════════════════════════════════════════════════════════ (3) the correction's record holds what it withdrew, once
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.key_corrections_guard()'::regprocedure);
  if position('''corrected_item_id'' - ''outcome''' in v_def) = 0 then raise exception 'F1-R1b: key_corrections_guard is not as it was'; end if;
  v_def := replace(v_def, '''corrected_item_id'' - ''outcome''', '''corrected_item_id'' - ''outcome'' - ''penjelasan_dihapus''');
  v_def := replace(v_def, 'array[''head_course_id'', ''corrected_course_id'', ''corrected_release_id'', ''corrected_item_id'', ''outcome'']',
                          'array[''head_course_id'', ''corrected_course_id'', ''corrected_release_id'', ''corrected_item_id'', ''outcome'', ''penjelasan_dihapus'']');
  execute v_def;

  -- (4) the confirming act: the withdrawn text recorded, then the key and the withdrawal in one statement, on the draft
  v_def := pg_get_functiondef('public.tegaskan_koreksi_kunci(uuid)'::regprocedure);
  if position(E'  update public.item_options set is_correct = (label = any (k.key_after)) where item_id = v_t2;\n' in v_def) = 0 then
    raise exception 'F1-R1b: tegaskan_koreksi_kunci does not write the corrected key where it did';
  end if;
  execute replace(v_def, E'  update public.item_options set is_correct = (label = any (k.key_after)) where item_id = v_t2;\n',
    E'  -- F1-R1b: the explanations the new key makes stale are withdrawn with it, in the statement that writes it, while the\n'
    || E'  -- copy is a draft (Sharon §3a.7); what they said is kept on the correction''s record first\n'
    || E'  update public.key_corrections set penjelasan_dihapus = (\n'
    || E'    select coalesce(jsonb_agg(jsonb_build_object(''label'', o.label, ''rationale'', o.rationale, ''misconception_code'', o.misconception_code)\n'
    || E'                              order by o.label collate "C"), ''[]''::jsonb)\n'
    || E'      from public.item_options o\n'
    || E'     where o.item_id = v_t2 and o.is_correct is distinct from (o.label = any (k.key_after))\n'
    || E'       and (o.rationale is not null or o.misconception_code is not null))\n'
    || E'   where id = p_correction;\n'
    || E'  update public.item_options\n'
    || E'     set is_correct = (label = any (k.key_after)),\n'
    || E'         rationale = case when is_correct is distinct from (label = any (k.key_after)) then null else rationale end,\n'
    || E'         misconception_code = case when is_correct is distinct from (label = any (k.key_after)) then null else misconception_code end,\n'
    || E'         rationale_withdrawn_by = case when is_correct is distinct from (label = any (k.key_after))\n'
    || E'                                       then coalesce(rationale_withdrawn_by, k.id) else rationale_withdrawn_by end\n'
    || E'   where item_id = v_t2;\n');

  -- (5) a copy carries the state of the row it copies (its admission is the trigger's case (b))
  v_def := pg_get_functiondef('public.salin_kursus_revisi(uuid,uuid,uuid,boolean)'::regprocedure);
  if position(E'      (item_id, institution_id, label, body, is_correct, rationale, misconception_code)\n    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,\n           o.misconception_code\n' in v_def) = 0 then
    raise exception 'F1-R1b: salin_kursus_revisi does not copy options where it did';
  end if;
  execute replace(v_def,
    E'      (item_id, institution_id, label, body, is_correct, rationale, misconception_code)\n    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,\n           o.misconception_code\n',
    E'      (item_id, institution_id, label, body, is_correct, rationale, misconception_code, rationale_withdrawn_by)\n    select v_new_item, src.institution_id, o.label, o.body, o.is_correct, o.rationale,\n           o.misconception_code, o.rationale_withdrawn_by   -- F1-R1b: the withdrawn state travels with its copy\n');

  -- (6) the preview and the record name the options that lose (or lost) their explanation (Daisy's line 1)
  v_def := pg_get_functiondef('public.koreksi_kunci_dampak(uuid)'::regprocedure);
  if position(E'    ''milik_sendiri'', v_me = k.proposed_by_person_id);' in v_def) = 0 then
    raise exception 'F1-R1b: koreksi_kunci_dampak does not end where it did';
  end if;
  execute replace(v_def, E'    ''milik_sendiri'', v_me = k.proposed_by_person_id);',
    E'    ''milik_sendiri'', v_me = k.proposed_by_person_id,\n'
    || E'    -- F1-R1b: which options lose their explanation (waiting), or lost it (decided)\n'
    || E'    ''penjelasan_hilang'', case when k.status = ''PENDING'' then\n'
    || E'        coalesce((select jsonb_agg(jsonb_build_object(''label'', o.label, ''alasan'', o.rationale, ''kode'', o.misconception_code)\n'
    || E'                                   order by o.label collate "C")\n'
    || E'                    from public.item_options o\n'
    || E'                   where o.item_id = public.soal_ujung(k.item_id) and o.is_correct is distinct from (o.label = any (k.key_after))\n'
    || E'                     and (o.rationale is not null or o.misconception_code is not null)), ''[]''::jsonb)\n'
    || E'      else coalesce((select jsonb_agg(jsonb_build_object(''label'', x ->> ''label'', ''alasan'', x ->> ''rationale'', ''kode'', x ->> ''misconception_code'')\n'
    || E'                                      order by x ->> ''label'')\n'
    || E'                       from jsonb_array_elements(k.penjelasan_dihapus) x), ''[]''::jsonb) end);');
end $$;

-- ═══════════════════════════════════════════════════════════ (6b) the proposer's preview names them too, and the teacher's
-- per-question view says when any of a question's wrong options is not linked to a misconception (Sharon §3a.1: wording
-- and a marker, no new number; Daisy §6a: «belum dikaitkan», shown when any wrong option is unlinked)
do $$
declare v_def text; v_old text;
begin
  v_def := pg_get_functiondef('public.pratinjau_koreksi_kunci(uuid,text[])'::regprocedure);
  v_old := E'  v := public.koreksi_kunci_hitung_untuk(v_t, v_kunci);\n';
  if position(v_old in v_def) = 0 then raise exception 'F1-R1b: pratinjau_koreksi_kunci does not count where it did'; end if;
  execute replace(v_def, v_old, v_old
    || E'  -- F1-R1b: the options that would lose their explanation (Daisy''s line 1)\n'
    || E'  v := v || jsonb_build_object(''penjelasan_hilang'', coalesce((\n'
    || E'    select jsonb_agg(jsonb_build_object(''label'', o.label, ''alasan'', o.rationale, ''kode'', o.misconception_code) order by o.label collate "C")\n'
    || E'      from public.item_options o\n'
    || E'     where o.item_id = v_t and o.is_correct is distinct from (o.label = any (v_kunci))\n'
    || E'       and (o.rationale is not null or o.misconception_code is not null)), ''[]''::jsonb));\n');

  v_def := pg_get_functiondef('public.teacher_question_evidence(uuid,uuid)'::regprocedure);
  v_old := E'               ''stimulus'', i.stimulus,\n';
  if position(v_old in v_def) = 0 then raise exception 'F1-R1b: teacher_question_evidence does not build a question where it did'; end if;
  execute replace(v_def, v_old, v_old
    || E'               -- F1-R1b (Sharon §3a.1; Daisy §6a): a wrong option, by the key in force, not linked to a misconception\n'
    || E'               ''ada_tak_terkait'', exists (select 1 from public.item_options o2 where o2.item_id = q.item_id\n'
    || E'                                           and not coalesce(q.kunci ? o2.label, o2.is_correct) and o2.misconception_code is null),\n');
end $$;

-- ═══════════════════════════════════════════════════════════ (6c) explanations owed: a question steps forward only whole
-- §3 point 5 asks that a later ordinary revision cannot be submitted until each withdrawn option has its rationale again.
-- The checks it named (soal_draf_masalah, lesson_package_check) run only on a question written in the app or uploaded,
-- and neither the content check nor the MCQ quality run reads a rationale. So the existing rule (OPTION_REASON_MISSING)
-- is held here, where a question's status moves past STRUCTURED. The confirming act alone is exempt: it steps its own
-- corrected copy under the correction it is confirming (koreksi_kunci_berwenang), so an urgent correction is never
-- refused for the explanations it has just withdrawn.
create or replace function public.penjelasan_terutang_jaga()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status in ('VALIDATED', 'IN_REVIEW', 'APPROVED')
     and new.status is distinct from old.status
     and exists (select 1 from public.item_options o where o.item_id = new.id and o.rationale is null)
     and not public.koreksi_kunci_berwenang('items', to_jsonb(new)) then
    raise exception using errcode = 'PR040', detail = 'CONTENT_RATIONALE_OWED',
      message = 'a question whose key was corrected moves on once each of its options has a rationale again';
  end if;
  return new;
end $$;
revoke all on function public.penjelasan_terutang_jaga() from public, anon, authenticated, service_role;
create trigger _f1r1b_items_penjelasan_terutang before update of status on public.items
  for each row execute function public.penjelasan_terutang_jaga();

-- ═══════════════════════════════════════════════════════════ (7) the migration's own check
do $$
begin
  if exists (select 1 from public.item_options where rationale is null) then
    raise exception 'F1-R1b: an option is already without a rationale before any correction withdrew one';
  end if;
  if position('rationale_withdrawn_by' in pg_get_functiondef('public.salin_kursus_revisi(uuid,uuid,uuid,boolean)'::regprocedure)) = 0
     or position('penjelasan_dihapus' in pg_get_functiondef('public.tegaskan_koreksi_kunci(uuid)'::regprocedure)) = 0 then
    raise exception 'F1-R1b: the copy or the confirming act was not rewritten';
  end if;
end $$;
