-- A2a, change C · Sharon's C39-1 on commit 39 (A2A-C-39-d77609ec.md) and her note on commit 40 (A2A-C-40-0a6ddca1.md). DRAFT.
--
-- C39-1: after the lift a sitting preserved through a stop by a departure (darurat_keluar) is an ordinary open sitting
-- until the release batch reaches it; an act in that gap (the learner's answer and hand-in, a teacher's act) was judged
-- as if no departure had happened, and the hand-in scored it. As the release (C7-2) and the credit (C18-1), the departure
-- is now applied at first touch: pengerjaan_pagar, when the sitting is no longer protected, after the release and the
-- credit, applies it to a sitting so preserved that is still open, before the caller's own act. The batch stays, for
-- sittings nobody touches.
--   * pengerjaan_keluar_terapkan(sitting): the inner step (no call to pengerjaan_pagar; its caller holds the learner, the
--     departure's actor and the shared fence). A transaction-local mark keeps it from being re-entered through the
--     deadline rule, whose decider passes through pengerjaan_pagar again.
--   * pengerjaan_pagar takes the departure's actor FOR KEY SHARE with the learner, in id order, before the fence (the
--     termination names the actor: A2A-L01).
--   * pengerjaan_keluar_sesudah_henti (the batch's) is now: the people, then pengerjaan_pagar, which applies it.
-- A refused act's own transaction rolls back with its refusal, the termination with it; the sitting is not scored, and
-- the departure lands at the next touch that commits (the decider, the closer, the batch).
--
-- The note on commit 40: maintenance.release_completed's "released" counted the affected sittings still open at the
-- release batch, missing one released at first touch and ended before it. Named for what it counts.

create or replace function pg_temp.a2a_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2a C39-1: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

create function public.pengerjaan_keluar_terapkan(p_session uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_status public.session_status; v_henti uuid; v_kept integer; v_hasil text;
        v_tanda text := current_setting('pintar.keluar_sedang', true);
begin
  -- its caller holds the learner and the departure's actor (KEY SHARE) and the shared fence, and the sitting is not
  -- protected (pengerjaan_pagar returned, or is returning, false); taken again here, in A2A-L01's order (re-locks of the
  -- rows its caller holds, which do not wait), so the step is in order on its own
  perform 1 from public.persons p
   where p.id in (select a.person_id from public.assessment_sessions a where a.id = p_session
                  union select (a.darurat_keluar ->> 'oleh')::uuid from public.assessment_sessions a
                   where a.id = p_session and a.darurat_keluar is not null)
   order by p.id for key share;
  begin
    perform public.pagar_darurat_bersama();
  exception when lock_not_available then
    perform public.pengerjaan_tolak('SITTING_FENCE_BUSY');
  end;
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.darurat_keluar is null or s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then return 'NONE'; end if;
  perform set_config('pintar.keluar_sedang', p_session::text, true);
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
  perform set_config('pintar.keluar_sedang', coalesce(v_tanda, ''), true);
  return v_hasil;
end $$;
revoke all on function public.pengerjaan_keluar_terapkan(uuid) from public, anon, authenticated, service_role;

do $$
begin
  -- the people: the learner and the departure's actor, in id order, before the fence
  perform pg_temp.a2a_ganti('public.pengerjaan_pagar(uuid)',
    E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n',
    E'  -- A2A-L01: the learner, and the actor of a departure preserved through a stop (its termination names them), first\n'
    || E'  perform 1 from public.persons p\n'
    || E'   where p.id in (select a.person_id from public.assessment_sessions a where a.id = p_session\n'
    || E'                  union select (a.darurat_keluar ->> ''oleh'')::uuid from public.assessment_sessions a\n'
    || E'                   where a.id = p_session and a.darurat_keluar is not null)\n'
    || E'   order by p.id for key share;\n');
  -- C39-1: after the release and the credit, the departure, before the caller's act
  perform pg_temp.a2a_ganti('public.pengerjaan_pagar(uuid)',
    E'    perform public.pengerjaan_kredit_darurat(p_session);   -- C18-1: the first touch credits once\n  end if;\n  return false;\n',
    E'    perform public.pengerjaan_kredit_darurat(p_session);   -- C18-1: the first touch credits once\n  end if;\n'
    || E'  -- C39-1: the first touch applies a departure preserved through a stop (not while it is being applied)\n'
    || E'  if current_setting(''pintar.keluar_sedang'', true) is distinct from p_session::text\n'
    || E'     and exists (select 1 from public.assessment_sessions a where a.id = p_session and a.darurat_keluar is not null\n'
    || E'                    and a.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')) then\n'
    || E'    perform public.pengerjaan_keluar_terapkan(p_session);\n'
    || E'  end if;\n'
    || E'  return false;\n');
end $$;

-- the batch's: the people, then the helper, which applies it
create or replace function public.pengerjaan_keluar_sesudah_henti(p_session uuid) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- A2A-L01: the people first (the learner, and the departure's actor its termination names), as the departure does
  perform 1 from public.persons p
   where p.id in (select a.person_id from public.assessment_sessions a where a.id = p_session
                  union select (a.darurat_keluar ->> 'oleh')::uuid from public.assessment_sessions a where a.id = p_session)
   order by p.id for key share;
  -- then the shared fence and protection read under it; a lifted stop's release, credit and departure applied there
  if public.pengerjaan_pagar(p_session) then return 'PROTECTED'; end if;
  return coalesce((select s.status::text from public.assessment_sessions s where s.id = p_session), 'NONE');
end $$;
revoke all on function public.pengerjaan_keluar_sesudah_henti(uuid) from public, anon, authenticated, service_role;

-- the note on commit 40: the field named for what it counts
do $$
begin
  perform pg_temp.a2a_ganti('public.pengerjaan_lepas_darurat_semua(integer)',
    E'''released'', count(*) filter',
    E'''affected_still_open_released'', count(*) filter');
  if public.jalur_tanpa_pin() <> 0 then raise exception 'A2a C39-1: the release batch is no longer an excused procedure'; end if;
end $$;
