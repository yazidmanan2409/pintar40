-- A2a, change C · O1 after the lift (THE PLAN §5.3 D6.2, "Enrolment termination is permitted (O1)"). DRAFT.
--
-- During a stop, a departure (akhiri_pendaftaran, transfer_execute; both through tutup_asesmen_terbuka) ends the
-- enrolment as usual, and a PROTECTED sitting is preserved, unscored, for the whole stop (commit 12). What was missing:
--
--   "After the lift, the ordinary enrolment-ending rule (tutup_asesmen_terbuka) is applied to it, judged against its
--    shifted deadline (D6.3): a sitting not past that deadline is terminated unscored with its answers kept, as an
--    ordinary departure; only a sitting genuinely past its shifted deadline, and any grace it has, is scored. [...]
--    The enrolment's ending and the later treatment of the sitting are each audited, the second naming the stop."
--
-- So:
--   * the departure records, on each sitting it preserves, who departed the learner and why (darurat_keluar), recorded
--     once, and audits assessment_session.departure_preserved;
--   * pengerjaan_keluar_sesudah_henti(sitting) applies the ordinary rule once the sitting is no longer protected: the
--     helper first (the learner, the shared fence, the release or the credit, D6.3's shift), then the deadline rule
--     (session_enforce_deadline: past the shifted deadline and its grace, it is scored; inside its grace, it waits), then,
--     still open, terminated INSTITUTIONAL_REVOCATION by the departure's actor with the departure's reason, answers kept.
--     It audits assessment_session.departure_applied, naming the stop;
--   * the release batch (pengerjaan_lepas_darurat_semua, run by the closer's job every five minutes) applies it to every
--     sitting so preserved, after the releases and the credits, walking in id order.

alter table public.assessment_sessions add column darurat_keluar jsonb;
create index assessment_sessions_keluar_tertunda on public.assessment_sessions (id)
  where darurat_keluar is not null and status in ('CREATED', 'IN_PROGRESS', 'PAUSED');

create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a O1: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
begin
  -- the departure records who and why on the sitting it preserves; once
  perform pg_temp.a2a_sisip('public.tutup_asesmen_terbuka(uuid,text)',
    E'    if public.pengerjaan_pagar(s.id) then continue; end if;   -- O1: preserved, unscored, for the stop\n',
    E'    if public.pengerjaan_pagar(s.id) then\n'
    || E'      -- O1: preserved, unscored, for the stop; the ordinary rule is applied after the lift (pengerjaan_keluar_sesudah_henti)\n'
    || E'      update public.assessment_sessions\n'
    || E'         set darurat_keluar = jsonb_build_object(''oleh'', v_actor, ''alasan'', p_alasan, ''pendaftaran'', p_enrollment, ''pada'', now())\n'
    || E'       where id = s.id and darurat_keluar is null;\n'
    || E'      perform public.audit_write(''assessment_session.departure_preserved'', ''assessment_sessions'', s.id::text, s.institution_id,\n'
    || E'        jsonb_build_object(''session_id'', s.id, ''enrollment_id'', p_enrollment, ''actor'', v_actor, ''reason'', p_alasan));\n'
    || E'      continue;\n'
    || E'    end if;\n');
  -- the guard: what a departure recorded is recorded once
  perform pg_temp.a2a_sisip('public.pengerjaan_jaga()',
    E'  -- A2a, D6.3/D6.5: the emergency hold\n',
    E'  -- A2a O1: the departure preserved through a stop is recorded once\n'
    || E'  if old.darurat_keluar is not null and new.darurat_keluar is distinct from old.darurat_keluar then\n'
    || E'    raise exception ''a departure preserved through a stop is recorded once'';\n'
    || E'  end if;\n'
    || E'  -- A2a, D6.3/D6.5: the emergency hold\n');
end $$;

create function public.pengerjaan_keluar_sesudah_henti(p_session uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_status public.session_status; v_henti uuid; v_kept integer; v_hasil text;
begin
  -- A2A-L01: the people first (the learner, and the departure's actor its termination names), as the departure does
  perform 1 from public.persons p
   where p.id in (select a.person_id from public.assessment_sessions a where a.id = p_session
                  union select (a.darurat_keluar ->> 'oleh')::uuid from public.assessment_sessions a where a.id = p_session)
   order by p.id for key share;
  -- then the shared fence and protection read under it; a lifted stop's release or credit applied first
  if public.pengerjaan_pagar(p_session) then return 'PROTECTED'; end if;
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.darurat_keluar is null or s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then return 'NONE'; end if;
  -- the stop that preserved it: the latest lifted stop that held the learner by the departure
  select x.id into v_henti from public.maintenance_windows x
   where x.kind = 'EMERGENCY' and x.t_stop is not null and x.ended_at is not null
     and x.t_stop <= (s.darurat_keluar ->> 'pada')::timestamptz and s.created_at <= x.t_stop
     and public.maintenance_affects_pada(x, s.person_id, x.t_stop)
   order by x.t_stop desc, x.id limit 1;
  -- the ordinary rule, on the shifted deadline: past it and its grace, scored; inside its grace, it waits
  v_status := public.session_enforce_deadline(p_session);
  if v_status in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    select count(*) into v_kept from public.responses r where r.session_id = p_session;
    update public.assessment_sessions
       set status = 'TERMINATED', termination_cause = 'INSTITUTIONAL_REVOCATION',
           termination_reason = s.darurat_keluar ->> 'alasan', terminated_by_person_id = (s.darurat_keluar ->> 'oleh')::uuid
     where id = p_session;
    perform public.audit_write('assessment_session.terminated', 'assessment_sessions', p_session::text, s.institution_id,
      jsonb_build_object('session_id', p_session, 'cause', 'INSTITUTIONAL_REVOCATION', 'reason', s.darurat_keluar ->> 'alasan',
                         'actor', s.darurat_keluar -> 'oleh', 'responses_retained', v_kept,
                         'enrollment_id', s.darurat_keluar -> 'pendaftaran', 'after_stop', v_henti));
    v_hasil := 'TERMINATED';
  else
    v_hasil := v_status::text;   -- FINALIZED (scored), or EXPIRED inside its grace: the closer scores it when the grace ends
  end if;
  perform public.audit_write('assessment_session.departure_applied', 'assessment_sessions', p_session::text, s.institution_id,
    jsonb_build_object('session_id', p_session, 'enrollment_id', s.darurat_keluar -> 'pendaftaran', 'stop', v_henti,
                       'departed_at', s.darurat_keluar -> 'pada', 'outcome', v_hasil));
  return v_hasil;
end $$;
revoke all on function public.pengerjaan_keluar_sesudah_henti(uuid) from public, anon, authenticated, service_role;

-- the release batch: the departures preserved through a stop come first (A2A-L01: the people and the fence before any
-- sitting the batch locks itself), then the releases and the credits as before
do $$
declare v text := pg_get_functiondef('public.pengerjaan_lepas_darurat_semua(integer)'::regprocedure);
        v_old text := E'  -- the releases of marked sittings, as before\n';
begin
  if (length(v) - length(replace(v, v_old, ''))) / length(v_old) <> 1 then
    raise exception 'A2a O1: the release batch''s first pass is not where it was';
  end if;
  execute replace(v, v_old,
       E'  -- O1: a departure preserved through a stop, once the stop no longer holds it (walked in id order)\n'
    || E'  loop\n'
    || E'    n := 0;\n'
    || E'    for r in select s.id from public.assessment_sessions s\n'
    || E'              where s.darurat_keluar is not null and s.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') and s.id > v_dari\n'
    || E'              order by s.id limit p_batas loop\n'
    || E'      perform public.pengerjaan_keluar_sesudah_henti(r.id);\n'
    || E'      n := n + 1; v_dari := r.id;\n'
    || E'    end loop;\n'
    || E'    commit;\n'
    || E'    exit when n = 0;\n'
    || E'  end loop;\n'
    || E'  v_dari := ''00000000-0000-0000-0000-000000000000'';\n'
    || v_old);
  if public.jalur_tanpa_pin() <> 0 then raise exception 'A2a O1: the release batch is no longer an excused procedure'; end if;
end $$;
