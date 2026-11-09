-- «Kenaikan kelas dan kelulusan» (Daisy's approved flow; owner, 9 Nov; ACCOUNT-LIFECYCLE-INVENTORY.md §10). Red on
-- c481fa26: F37-K01..K05.
--
-- The demonstration found the year-end move working class by class but blind: no preview, no confirmation, one number,
-- a Tingkat-only learner left behind unmentioned, a repeat done as a promotion moved back, and no withdrawal or
-- graduation. The flow is now: choose the class → every learner listed → a decision for each → the outcomes reviewed →
-- one confirmation, applied whole or not at all, and the outcome of each learner shown by name.
--
-- kenaikan_rencana(kelas): what the screen shows: the class, its Tingkat, every learner in it AND every learner of its
--   Tingkat placed in no Kelas (finding 8B), whether a transfer is under way or a sitting is open, the class's
--   teachers, and next year's classes with theirs.
-- kenaikan_tetapkan(kelas, tahun_baru, keputusan, guru_ditinjau, terapkan): validates every decision; with terapkan
--   false it writes nothing and returns the outcomes for review; with true it applies all of them in one transaction.
--   NAIK and TINGGAL: the learner's year is ended (ENDED/EXPIRED) and a new enrolment opens for the new year in the
--     same programme, placed straight into the chosen Kelas (a repeat's destination is the repeat class itself, never
--     a promotion moved back). The old placement closes as PERIOD_ROLLOVER. Sittings and results stay on the old
--     enrolment and the old class, where they were earned.
--   LULUS and KELUAR: akhiri_pendaftaran (E3), with its reason, date and audit row.
--   PINDAH: only for a learner whose transfer is under way; nothing is changed here, and the transfer decides.
--   Every learner of the population needs exactly one decision (PROMO_UNDECIDED names who is missing); a decision for
--   someone outside it (or a class changed since review) is PROMO_CHANGED. Teachers are never carried to the new year:
--   the confirmation states that their assignments were reviewed (PROMO_TEACHERS_UNREVIEWED otherwise; the
--   assignments themselves are «Ubah peran & tanggung jawab»'s). A learner's open sittings are shown in the preview and
--   closed by the confirmation (tutup_asesmen_terbuka; 9 Nov, for Sharon's ruling).
--   One promotion.applied audit row records every learner's outcome; a refused run writes nothing.
-- kenaikan_hasil(kelas): the last confirmation read back for the screen, each learner with where they are now.
-- period_rollover is unchanged; the screen no longer offers it (the blind class-to-class run is replaced by this flow).

create or replace function public.kenaikan_populasi(p_kelas uuid)
returns table (person_id uuid, enrollment_id uuid, sumber text)
language sql stable security definer set search_path = public, pg_temp as $$
  with k as (select n.id, n.jalur from public.org_nodes n where n.id = p_kelas and n.kind = 'CLASS'),
  t as (select a.id from k, public.org_nodes a
         where a.id = any(k.jalur) and a.kind = 'COHORT' order by array_position(k.jalur, a.id) desc limit 1),
  dalam_kelas as (
    select distinct on (e.person_id) e.person_id, e.id as enrollment_id, 'KELAS'::text as sumber
      from k join public.memberships m on m.node_id = k.id and m.valid_to is null
      join public.enrollments e on e.id = m.enrollment_id and e.status in ('PENDING', 'ACTIVE')
     order by e.person_id, e.created_at),
  hanya_tingkat as (
    select distinct on (e.person_id) e.person_id, e.id as enrollment_id, 'TINGKAT'::text as sumber
      from t join public.memberships m on m.node_id = t.id and m.valid_to is null
      join public.enrollments e on e.id = m.enrollment_id and e.status in ('PENDING', 'ACTIVE')
     where not exists (select 1 from public.memberships km join public.org_nodes kn on kn.id = km.node_id
                        where km.enrollment_id = e.id and km.valid_to is null and kn.kind = 'CLASS'
                          and kn.jalur @> array[t.id])
     order by e.person_id, e.created_at)
  select * from dalam_kelas
  union all
  select h.* from hanya_tingkat h where not exists (select 1 from dalam_kelas d where d.person_id = h.person_id)
$$;
revoke all on function public.kenaikan_populasi(uuid) from public, anon, authenticated;

create or replace function public.kenaikan_guru(p_node uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('person_id', ra.person_id, 'nama', p.display_name, 'peran', ra.role)
                            order by p.display_name), '[]'::jsonb)
    from public.role_assignments ra join public.persons p on p.id = ra.person_id
   where ra.scope_node_id = p_node and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
$$;
revoke all on function public.kenaikan_guru(uuid) from public, anon, authenticated;

create or replace function public.kenaikan_rencana(p_kelas uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare k record; v_tingkat uuid;
begin
  select n.id, n.name, n.institution_id, n.academic_period_id, n.jalur, n.kind, n.is_active, ap.name as tahun, ap.starts_on
    into k from public.org_nodes n left join public.academic_periods ap on ap.id = n.academic_period_id
   where n.id = p_kelas;
  if k.id is null or not public.has_scope('INSTITUTION_ADMIN', k.id) then
    raise exception using errcode = '42501', message = 'a year-end promotion needs INSTITUTION_ADMIN of the class''s school';
  end if;
  if k.kind <> 'CLASS' or k.academic_period_id is null then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a promotion starts from a Kelas of a school year';
  end if;
  select a.id into v_tingkat from public.org_nodes a where a.id = any(k.jalur) and a.kind = 'COHORT'
   order by array_position(k.jalur, a.id) desc limit 1;
  return jsonb_build_object(
    'kelas', jsonb_build_object('id', k.id, 'nama', k.name, 'tahun_id', k.academic_period_id, 'tahun', k.tahun,
                                'tingkat_id', v_tingkat, 'tingkat', (select name from public.org_nodes where id = v_tingkat)),
    'murid', coalesce((
      select jsonb_agg(jsonb_build_object(
               'person_id', pop.person_id, 'nama', p.display_name, 'nomor', ii.institutional_id,
               'enrollment_id', pop.enrollment_id, 'sumber', pop.sumber,
               'pindah_berjalan', exists (select 1 from public.transfers tr where tr.from_enrollment_id = pop.enrollment_id
                                            and tr.status in ('REQUESTED', 'AUTHORIZED')),
               'asesmen_terbuka', exists (select 1 from public.assessment_sessions s where s.enrollment_id = pop.enrollment_id
                                            and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')))
             order by p.display_name, pop.person_id)
        from public.kenaikan_populasi(p_kelas) pop join public.persons p on p.id = pop.person_id
        left join public.institutional_identities ii on ii.person_id = pop.person_id and ii.institution_id = k.institution_id),
      '[]'::jsonb),
    'guru', public.kenaikan_guru(k.id),
    'tahun_berikut', coalesce((
      select jsonb_agg(jsonb_build_object('id', ap.id, 'nama', ap.name, 'kelas', coalesce((
               select jsonb_agg(jsonb_build_object('id', n.id, 'nama', n.name, 'guru', public.kenaikan_guru(n.id)) order by n.name)
                 from public.org_nodes n where n.academic_period_id = ap.id and n.institution_id = k.institution_id
                  and n.kind = 'CLASS' and n.is_active and coalesce(n.member_kind, 'LEARNER') = 'LEARNER'), '[]'::jsonb))
             order by ap.starts_on)
        from public.academic_periods ap
       where ap.institution_id = k.institution_id and ap.id <> k.academic_period_id and ap.starts_on > k.starts_on),
      '[]'::jsonb));
end;
$$;
revoke all on function public.kenaikan_rencana(uuid) from public, anon, authenticated;
grant execute on function public.kenaikan_rencana(uuid) to authenticated, service_role;

-- CORRECTED IN PLACE (undeployed; Daisy's reconciliation K1 and Sharon, 9 Nov: «fold, don't hide»): A RUN NAMES ITSELF.
-- audit_write adds the transaction's run id (pintar.audit_run, set only by kenaikan_tetapkan for the length of its run)
-- to every row written while it is set, so the run's endings, placements and ended sittings each stay findable on their
-- own and fold under the run's one promotion.applied row by a recorded link, never by time. Replaced from its own
-- definition, that one block added before the actor-role line, so nothing else in audit_write moves.
do $$
declare v_def text := pg_get_functiondef('public.audit_write(text,text,text,uuid,jsonb)'::regprocedure);
        v_anker text := '  -- ADDED BY D-093 T2: the role the acting person holds';
begin
  if position(v_anker in v_def) = 0 then raise exception 'K1: audit_write''s actor-role line is not where it was'; end if;
  execute replace(v_def, v_anker,
    '  -- ADDED IN 20270112210000 (K1): the run this row belongs to, when one is under way' || E'\n'
    || '  if nullif(current_setting(''pintar.audit_run'', true), '''') is not null and not (v_summary ? ''run_id'') then' || E'\n'
    || '    v_summary := v_summary || jsonb_build_object(''run_id'', current_setting(''pintar.audit_run'', true));' || E'\n'
    || '  end if;' || E'\n' || v_anker);
end $$;

create or replace function public.kenaikan_tetapkan(p_kelas uuid, p_tahun_baru uuid, p_keputusan jsonb,
                                                    p_guru_ditinjau boolean, p_terapkan boolean)
returns jsonb language plpgsql volatile security definer set search_path = public, pg_temp as $$
declare k record; d record; en record; v_tj uuid; v_tjn text; v_terbuka int; v_hasil jsonb := '[]'::jsonb; v_kurang text; v_new uuid;
        v_keputusan jsonb := coalesce(p_keputusan, '[]'::jsonb); v_n int; v_run uuid;
begin
  -- K1: the run's id, carried by every row it writes (cleared at its end; a refused run rolls it back with its rows)
  if p_terapkan then
    v_run := gen_random_uuid();
    perform set_config('pintar.audit_run', v_run::text, true);
  end if;
  select n.id, n.name, n.institution_id, n.academic_period_id, n.kind, ap.starts_on into k
    from public.org_nodes n left join public.academic_periods ap on ap.id = n.academic_period_id where n.id = p_kelas;
  if k.id is null or not public.has_scope('INSTITUTION_ADMIN', k.id) then
    raise exception using errcode = '42501', message = 'a year-end promotion needs INSTITUTION_ADMIN of the class''s school';
  end if;
  if k.kind <> 'CLASS' or k.academic_period_id is null then
    raise exception using errcode = 'PR070', detail = 'PLACE_NOT_A_KELAS', message = 'a promotion starts from a Kelas of a school year';
  end if;
  if not exists (select 1 from public.academic_periods ap where ap.id = p_tahun_baru and ap.institution_id = k.institution_id
                   and ap.id <> k.academic_period_id and ap.starts_on > k.starts_on) then
    raise exception using errcode = 'PR070', detail = 'PROMO_YEAR_INVALID', message = 'the new year is a later school year of this school';
  end if;
  if jsonb_typeof(v_keputusan) <> 'array' then
    raise exception using errcode = '22023', detail = 'PROMO_INPUT_INVALID', message = 'the decisions are a list';
  end if;
  if p_terapkan then
    -- the population's people serialise this run against another (a double press, a transfer, a re-enrolment)
    perform 1 from public.persons pr where pr.id in (select pop.person_id from public.kenaikan_populasi(p_kelas) pop)
      order by pr.id for update;
  end if;

  -- every learner exactly once, nobody else
  if exists (select 1 from jsonb_array_elements(v_keputusan) x group by x ->> 'person_id' having count(*) > 1)
     or exists (select 1 from jsonb_array_elements(v_keputusan) x
                 where not exists (select 1 from public.kenaikan_populasi(p_kelas) pop where pop.person_id::text = x ->> 'person_id')) then
    raise exception using errcode = 'PR070', detail = 'PROMO_CHANGED',
      message = 'the class has changed since it was reviewed: a decision names someone who is not in it now';
  end if;
  select string_agg(p.display_name, ', ' order by p.display_name) into v_kurang
    from public.kenaikan_populasi(p_kelas) pop join public.persons p on p.id = pop.person_id
   where not exists (select 1 from jsonb_array_elements(v_keputusan) x where x ->> 'person_id' = pop.person_id::text);
  if v_kurang is not null then
    raise exception using errcode = 'PR070', detail = 'PROMO_UNDECIDED', message = 'no decision yet for: ' || v_kurang;
  end if;
  if p_terapkan and p_guru_ditinjau is not true then
    raise exception using errcode = 'PR070', detail = 'PROMO_TEACHERS_UNREVIEWED',
      message = 'teachers are not carried to the new year; confirm that their assignments were reviewed';
  end if;

  for d in
    select pop.person_id, pop.enrollment_id, pop.sumber, p.display_name as nama, x ->> 'keputusan' as keputusan,
           nullif(x ->> 'kelas_tujuan', '') as kelas_tujuan, nullif(x ->> 'alasan', '') as alasan,
           nullif(x ->> 'keterangan', '') as keterangan
      from public.kenaikan_populasi(p_kelas) pop join public.persons p on p.id = pop.person_id
      join jsonb_array_elements(v_keputusan) x on x ->> 'person_id' = pop.person_id::text
     order by p.display_name, pop.person_id
  loop
    v_tj := null; v_tjn := null;
    if d.keputusan is null or d.keputusan not in ('NAIK', 'TINGGAL', 'LULUS', 'KELUAR', 'PINDAH') then
      raise exception using errcode = 'PR070', detail = 'PROMO_DECISION_INVALID', message = 'an unknown decision for ' || d.nama;
    end if;
    if d.keputusan in ('NAIK', 'TINGGAL') then
      select n.id, n.name into v_tj, v_tjn from public.org_nodes n
       where n.id::text = d.kelas_tujuan and n.kind = 'CLASS' and n.is_active and n.institution_id = k.institution_id
         and n.academic_period_id = p_tahun_baru and coalesce(n.member_kind, 'LEARNER') = 'LEARNER';
      if v_tj is null then
        raise exception using errcode = 'PR070', detail = 'PROMO_TARGET_INVALID',
          message = 'the destination for ' || d.nama || ' is not an active Kelas of the new year at this school';
      end if;
    elsif d.keputusan = 'KELUAR' and (d.alasan is null or d.alasan not in ('TRANSFER_EXTERNAL', 'MOVED_ABROAD', 'WITHDRAWN', 'DECEASED', 'OTHER')) then
      raise exception using errcode = 'PR070', detail = 'ENROL_REASON_INVALID', message = 'a reason for leaving is needed for ' || d.nama;
    elsif d.keputusan = 'PINDAH' and not exists (select 1 from public.transfers tr where tr.from_enrollment_id = d.enrollment_id
                                                   and tr.status in ('REQUESTED', 'AUTHORIZED')) then
      raise exception using errcode = 'PR070', detail = 'PROMO_NO_TRANSFER',
        message = d.nama || ' has no transfer under way; «Perpindahan murid» starts one';
    end if;
    -- 9 Nov (with E3): a learner's open sittings no longer refuse the run; the preview says how many will be ended, and
    -- the confirmation closes them (tutup_asesmen_terbuka: expired, or ended as an institutional revocation)
    v_terbuka := case when d.keputusan = 'PINDAH' then 0 else
      (select count(*) from public.assessment_sessions s where s.enrollment_id = d.enrollment_id
          and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) end;

    if p_terapkan then
      if d.keputusan in ('NAIK', 'TINGGAL') then
        perform public.tutup_asesmen_terbuka(d.enrollment_id, 'Kenaikan kelas: tahun ajaran berakhir');
        select e.id, e.programme_id, e.status into en from public.enrollments e where e.id = d.enrollment_id for update;
        update public.memberships set valid_to = now(), close_reason = 'PERIOD_ROLLOVER'
         where enrollment_id = en.id and valid_to is null;
        update public.enrollments set status = 'ENDED', end_reason = 'EXPIRED', valid_to = now() where id = en.id;
        begin
          insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
          -- CORRECTED IN PLACE (undeployed; Sharon F4): the programme the next year's Kelas sits under, where it sits
          -- under one; else the learner's own
          values (d.person_id, k.institution_id, p_tahun_baru,
                  coalesce((select p.id from public.org_nodes tn join public.org_nodes p on p.id = any(tn.jalur) and p.kind = 'PROGRAMME'
                             where tn.id = v_tj order by array_position(tn.jalur, p.id) desc limit 1), en.programme_id),
                  en.status) returning id into v_new;
        exception when unique_violation then
          raise exception using errcode = 'PR070', detail = 'PROMO_ALREADY_IN_YEAR',
            message = d.nama || ' is already enrolled in the new year';
        end;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_new, v_tj, p_tahun_baru);
      elsif d.keputusan = 'LULUS' then
        perform public.akhiri_pendaftaran(d.enrollment_id, 'GRADUATED', d.keterangan, null);
      elsif d.keputusan = 'KELUAR' then
        perform public.akhiri_pendaftaran(d.enrollment_id, d.alasan, d.keterangan, null);
      end if;
    end if;
    v_hasil := v_hasil || jsonb_build_object('person_id', d.person_id, 'nama', d.nama, 'sumber', d.sumber,
                                             'keputusan', d.keputusan, 'kelas_tujuan', v_tj, 'kelas_tujuan_nama', v_tjn,
                                             'alasan', d.alasan, 'asesmen_diakhiri', v_terbuka);
  end loop;

  v_n := jsonb_array_length(v_hasil);
  if p_terapkan and v_n > 0 then
    perform public.audit_write('promotion.applied', 'org_nodes', p_kelas::text, k.institution_id,
      jsonb_build_object('from_period', k.academic_period_id, 'to_period', p_tahun_baru, 'teachers_reviewed', true,
                         'learners', v_n, 'outcomes',
                         (select jsonb_agg(h - 'nama' - 'kelas_tujuan_nama') from jsonb_array_elements(v_hasil) h)));
  end if;
  if p_terapkan then perform set_config('pintar.audit_run', '', true); end if;
  return jsonb_build_object('diterapkan', p_terapkan and v_n > 0, 'hasil', v_hasil);
end;
$$;
revoke all on function public.kenaikan_tetapkan(uuid, uuid, jsonb, boolean, boolean) from public, anon, authenticated;
grant execute on function public.kenaikan_tetapkan(uuid, uuid, jsonb, boolean, boolean) to authenticated, service_role;

-- what the confirmation did, read back for the screen: the latest promotion of this class, each learner by name, with
-- where they are now (their live Kelas at this school, or how their last enrolment here ended)
create or replace function public.kenaikan_hasil(p_kelas uuid)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare k record; a record;
begin
  select n.id, n.institution_id into k from public.org_nodes n where n.id = p_kelas;
  if k.id is null or not public.has_scope('INSTITUTION_ADMIN', k.id) then
    raise exception using errcode = '42501', message = 'a year-end promotion needs INSTITUTION_ADMIN of the class''s school';
  end if;
  select l.at, l.summary into a from public.audit_log l
   where l.action = 'promotion.applied' and l.target_table = 'org_nodes' and l.target_id = p_kelas::text
   order by l.at desc, l.id desc limit 1;
  if a.at is null then return null; end if;
  -- CORRECTED IN PLACE (undeployed; Daisy's reconciliation Q3 and K1): what the outcome page says. Per learner: the
  -- destination with its year, where they are now (id and name) and whether that matches the decision (sesuai); for a
  -- departure, how and when the enrolment ended and the reason given. For the run: its id, and each destination Kelas
  -- of the new year that has no teacher now.
  return jsonb_build_object('pada', a.at, 'run_id', a.summary ->> 'run_id',
    'guru_kosong', coalesce((
      select jsonb_agg(distinct n.name) from jsonb_array_elements(a.summary -> 'outcomes') o
        join public.org_nodes n on n.id::text = o ->> 'kelas_tujuan'
       where o ->> 'keputusan' in ('NAIK', 'TINGGAL') and jsonb_array_length(public.kenaikan_guru(n.id)) = 0), '[]'::jsonb),
    'hasil', coalesce((
    select jsonb_agg(x.v order by x.v ->> 'nama') from (
      select jsonb_build_object(
             'person_id', o ->> 'person_id', 'nama', p.display_name, 'keputusan', o ->> 'keputusan',
             'kelas_tujuan', o ->> 'kelas_tujuan',
             'kelas_tujuan_nama', tj.name, 'tahun_tujuan', tap.name,
             'alasan', o ->> 'alasan',
             'kelas_sekarang', sk.nama, 'kelas_sekarang_id', sk.ids,
             'akhir', ak.end_reason, 'akhir_pada', to_char(ak.valid_to at time zone public.zona_sekolah(k.institution_id), 'YYYY-MM-DD'),
             'akhir_alasan', ak.reason_code,
             'sesuai', case
               when o ->> 'keputusan' in ('NAIK', 'TINGGAL') then coalesce(sk.ids @> array[o ->> 'kelas_tujuan'], false)
               when o ->> 'keputusan' = 'LULUS' then ak.end_reason = 'COMPLETED' and sk.ids is null
               when o ->> 'keputusan' = 'KELUAR' then ak.end_reason in ('WITHDRAWN', 'TRANSFERRED_OUT') and sk.ids is null
               else true end) as v
        from jsonb_array_elements(a.summary -> 'outcomes') o
        join public.persons p on p.id::text = o ->> 'person_id'
        left join public.org_nodes tj on tj.id::text = o ->> 'kelas_tujuan'
        left join public.academic_periods tap on tap.id = tj.academic_period_id
        left join lateral (select string_agg(n.name, ', ' order by n.name) as nama, array_agg(n.id::text) as ids
                             from public.enrollments e
                             join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                             join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
                            where e.person_id = p.id and e.institution_id = k.institution_id and e.status in ('PENDING', 'ACTIVE')) sk on true
        left join lateral (select e.end_reason::text as end_reason, e.valid_to,
                                  (select l.summary ->> 'reason_code' from public.audit_log l
                                    where l.action = 'enrollment.ended_with_reason' and l.target_id = e.id::text
                                    order by l.id desc limit 1) as reason_code
                             from public.enrollments e
                            where e.person_id = p.id and e.institution_id = k.institution_id
                            order by e.created_at desc limit 1) ak on true) x), '[]'::jsonb));
end;
$$;
revoke all on function public.kenaikan_hasil(uuid) from public, anon, authenticated;
grant execute on function public.kenaikan_hasil(uuid) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('kenaikan_rencana', 'STAFF', '«Kenaikan kelas dan kelulusan»: a class''s learners (its Tingkat-only ones included), '
   || 'teachers and next year''s classes, for review.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('kenaikan_tetapkan', 'STAFF', '«Kenaikan kelas dan kelulusan»: every learner''s decision validated (preview) or '
   || 'applied whole in one transaction; one audit row with each outcome.', 'SCOPE', 'INSTITUTION_ADMIN'),
  ('kenaikan_hasil', 'STAFF', '«Kenaikan kelas dan kelulusan»: the last confirmation of a class read back, each learner '
   || 'by name with where they are now.', 'SCOPE', 'INSTITUTION_ADMIN')
on conflict (function_name) do update set exposure = excluded.exposure, note = excluded.note,
  authorization_kind = excluded.authorization_kind, authorization_requirement = excluded.authorization_requirement;

-- verification
do $$
declare v text := (select prosrc from pg_proc where oid = 'public.kenaikan_tetapkan(uuid, uuid, jsonb, boolean, boolean)'::regprocedure);
begin
  if position('PROMO_UNDECIDED' in v) = 0 or position('kenaikan_populasi' in v) = 0 then
    raise exception 'year-end: a learner can be left without a decision';
  end if;
  if position('PROMO_TEACHERS_UNREVIEWED' in v) = 0 then
    raise exception 'year-end: teachers'' assignments are not reviewed before a promotion';
  end if;
  if position('akhiri_pendaftaran' in v) = 0 then
    raise exception 'year-end: graduation and departure do not go through E3';
  end if;
  if has_function_privilege('authenticated', 'public.kenaikan_populasi(uuid)', 'execute') then
    raise exception 'year-end: an internal helper is a client function';
  end if;
end $$;
