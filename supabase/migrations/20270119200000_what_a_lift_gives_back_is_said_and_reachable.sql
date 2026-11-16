-- A2a, change C · what a lift gives back is said, and reachable (Daisy: THE PLAN §5.3 F items 2 to 4;
-- A2A-DITUTUP-BERJALAN.md §2 and §3, with Sharon's shape for §3 in A2A-C-DRAFTS-e076520c.md). DRAFT.
--
--   pengerjaan_dilepas_henti(s)       a sitting a stop held, now free again, and not yet answered since the stop ended
--                                     (or not yet credited): the player's item 3 on reopening; false once it is answered
--   pengerjaan_saya                   gains 'dilepas_henti'
--   pengerjaan_dilepas_saya()         how many of the reader's own sittings are so: item 2 on «PINTAR dapat digunakan»
--   akhiri_penugasan                  item 4: an assignment is not ended or withdrawn while a stop holds any of its open
--                                     sittings (ASSIGN_CLASS_STOPPED, its own line), checked under the shared fence after
--                                     the learners, as every sitting act
--   penugasan_masih_dikerjakan(aa)    DITUTUP §2: an assignment past its own closes_at whose sittings still run on their
--                                     shifted time: how many learners, and until when (the latest effective deadline);
--                                     for a reader who manages sittings in its class
--   pengerjaan_terbuka_saya()         DITUTUP §3 (Sharon's shape): a separate read keyed on the learner's own open
--                                     sitting of a standalone assignment whose closes_at has passed, so Belajar keeps
--                                     the row and opens the sitting by its id; nothing in may_start_assessment changes,
--                                     so no new sitting can start after closes_at

create function public.pengerjaan_dilepas_henti(s public.assessment_sessions) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id is not null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not public.pengerjaan_ditahan(s)
     and not public.pengerjaan_dilindungi(s.id)
     and ((public.penghentian_kredit(s)).geser > interval '0'
          or (s.darurat_dikredit_sampai is not null
              and not exists (select 1 from public.responses r where r.session_id = s.id and r.received_at >= s.darurat_dikredit_sampai)))
$$;
revoke all on function public.pengerjaan_dilepas_henti(public.assessment_sessions) from public, anon, authenticated, service_role;

create function public.pengerjaan_dilepas_saya() returns integer
language sql stable security definer set search_path = public, pg_temp as $$
  select count(*)::integer from public.assessment_sessions s
   where s.person_id = public.current_person_id() and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
     and public.pengerjaan_dilepas_henti(s)
$$;
revoke all on function public.pengerjaan_dilepas_saya() from public, anon, service_role;
grant execute on function public.pengerjaan_dilepas_saya() to authenticated;

create function public.penugasan_masih_dikerjakan(p_aa uuid) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare aa public.assessment_assignments; n integer; v_sampai timestamptz;
begin
  select * into aa from public.assessment_assignments where id = p_aa;
  if aa.id is null or public.current_person_id() is null or not public.can_on_node('CAN_MANAGE_SITTINGS', aa.node_id) then
    return jsonb_build_object('murid', 0, 'sampai', null);
  end if;
  if aa.closes_at is null or now() < aa.closes_at then return jsonb_build_object('murid', 0, 'sampai', null); end if;
  select count(distinct x.person_id)::integer, max(x.tenggat) into n, v_sampai
    from (select s.person_id, public.pengerjaan_tenggat_efektif(s.id) as tenggat from public.assessment_sessions s
           where s.assessment_assignment_id = p_aa and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) x
   where x.tenggat is not null and x.tenggat > now();
  return jsonb_build_object('murid', coalesce(n, 0), 'sampai', v_sampai);
end $$;
revoke all on function public.penugasan_masih_dikerjakan(uuid) from public, anon, service_role;
grant execute on function public.penugasan_masih_dikerjakan(uuid) to authenticated;

create function public.pengerjaan_terbuka_saya()
returns table (assessment_assignment_id uuid, mode public.assessment_mode, title text, node_id uuid, node_name text,
               item_count smallint, opens_at timestamptz, closes_at timestamptz, sesi_id uuid, tenggat timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select aa.id, d.mode, d.title, aa.node_id, n.name, d.item_count, aa.opens_at, aa.closes_at, s.id, x.tenggat
    from public.assessment_sessions s
    join public.assessment_assignments aa on aa.id = s.assessment_assignment_id
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    join public.org_nodes n on n.id = aa.node_id
    cross join lateral (select public.pengerjaan_tenggat_efektif(s.id) as tenggat) x
   where s.person_id = public.current_person_id() and public.current_person_id() is not null
     and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not public.pengerjaan_ditahan(s)
     and aa.learning_assignment_id is null and aa.status = 'OPEN'
     and aa.closes_at is not null and now() >= aa.closes_at
     and x.tenggat is not null and x.tenggat > now()
   order by x.tenggat, s.id
$$;
revoke all on function public.pengerjaan_terbuka_saya() from public, anon, service_role;
grant execute on function public.pengerjaan_terbuka_saya() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement) values
  ('pengerjaan_dilepas_saya', 'LEARNER', 'A2a (THE PLAN item 2): how many of the reader''s own sittings a lifted stop held and are free again, not yet answered since.', null, null),
  ('pengerjaan_terbuka_saya', 'LEARNER', 'A2a (DITUTUP §3, Sharon''s shape): the reader''s own open sittings of standalone assignments whose closes_at has passed, by the sitting, gated by its effective deadline.', null, null),
  ('penugasan_masih_dikerjakan', 'STAFF', 'A2a (DITUTUP §2): an assignment past its own close whose sittings still run on their shifted time: how many learners and until when. Counts only.', 'CAPABILITY', 'CAN_MANAGE_SITTINGS');

-- A2a, THE PLAN item 4 (W221's contract reads these whole): an assignment is not ended or withdrawn while a stop holds
-- any of its open sittings, ASSIGN_CLASS_STOPPED, under the shared fence after the learners, as every sitting act
create or replace function public.penugasan_tolak(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $$
begin
  raise exception using
    errcode = 'PR050',
    detail  = p_code,
    message = case p_code
      when 'ASSIGN_NOT_ALLOWED'      then 'ending an assignment requires CAN_ASSIGN_LEARNING over the class it was given to'
      when 'ASSIGN_NOT_LIVE'         then 'this assignment has already ended or been withdrawn'
      when 'ASSIGN_KIND_INVALID'     then 'an assignment is ended (ENDED) or withdrawn (WITHDRAWN)'
      when 'ASSIGN_REASON_REQUIRED'  then 'ending an assignment records why, in 5 to 300 characters'
      when 'ASSIGN_IN_PROGRESS'      then 'learners still have a sitting open; confirm that it ends, with its answers kept'
      when 'ASSIGN_CLASS_STOPPED'    then 'an emergency stop holds a sitting of this assignment; it is not ended or withdrawn during the stop'
      else 'the assignment could not be ended' end;
end $$;
revoke execute on function public.penugasan_tolak(text) from public;   -- ADR-0021

create or replace function public.akhiri_penugasan(p_la uuid, p_jenis text, p_alasan text, p_akhiri_yang_berjalan boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
declare
  v_actor uuid; v_la public.learning_assignments; s record; v_open int := 0; v_expired int := 0; v_ended int := 0;
  v_done int; v_closed int; v_kept int; v_alasan text := btrim(coalesce(p_alasan, ''));
begin
  v_actor := public.current_person_id();
  select * into v_la from public.learning_assignments where id = p_la for update;
  if v_actor is null or v_la.id is null or not public.boleh_akhiri_penugasan(p_la) then
    perform public.penugasan_tolak('ASSIGN_NOT_ALLOWED');
  end if;
  if p_jenis is null or p_jenis not in ('ENDED', 'WITHDRAWN') then perform public.penugasan_tolak('ASSIGN_KIND_INVALID'); end if;
  if v_la.status <> 'ACTIVE' and not (v_la.status = 'DRAFT' and p_jenis = 'WITHDRAWN') then
    perform public.penugasan_tolak('ASSIGN_NOT_LIVE');
  end if;
  -- CORRECTED IN PLACE (undeployed; Daisy, TINJAUAN-6faef690): 10 characters, as every other reason in PINTAR
  if char_length(v_alasan) < 10 or char_length(v_alasan) > 300 then perform public.penugasan_tolak('ASSIGN_REASON_REQUIRED'); end if;

  -- CORRECTED IN PLACE (undeployed; Sharon §13 on 6faef690, Low): the assessments are locked before the open sittings
  -- are counted. start_learning_session takes a share lock on its assessment assignment, so a start already under way
  -- finishes first and its sitting is counted and swept here; one that comes after waits, then finds it CLOSED.
  perform 1 from public.assessment_assignments aa where aa.learning_assignment_id = p_la order by aa.id for update;

  select count(*) into v_open from public.penugasan_sesi(p_la) x where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
  if v_open > 0 and not coalesce(p_akhiri_yang_berjalan, false) then perform public.penugasan_tolak('ASSIGN_IN_PROGRESS'); end if;

  -- a sitting still open: past its deadline it expires; otherwise it is ended, its answers kept, on the record
  -- A2A-L01 (Sharon, A2A-L01-FINDING-f09da528.md): the learner first, before the sitting is touched
  perform 1 from public.persons pr where pr.id in (select x.person_id from public.penugasan_sesi(p_la) x
     where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')) order by pr.id for key share of pr;
  -- A2a, THE PLAN item 4: not ended or withdrawn while a stop holds any of its open sittings (the shared fence after
  -- the learners, as every sitting act)
  begin
    perform public.pagar_darurat_bersama();
  exception when lock_not_available then
    perform public.pengerjaan_tolak('SITTING_FENCE_BUSY');
  end;
  if exists (select 1 from public.penugasan_sesi(p_la) x where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
              and public.pengerjaan_dilindungi(x.id)) then
    perform public.penugasan_tolak('ASSIGN_CLASS_STOPPED');
  end if;
  for s in select x.id, x.institution_id from public.penugasan_sesi(p_la) x
            where x.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') order by x.id for update loop
    perform public.session_enforce_deadline(s.id);
    if (select x.status from public.assessment_sessions x where x.id = s.id) in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
      select count(*) into v_kept from public.responses r where r.session_id = s.id;
      update public.assessment_sessions
         set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION',
             termination_reason = v_alasan, terminated_by_person_id = v_actor
       where id = s.id;
      perform public.audit_write('assessment_session.terminated', 'assessment_sessions', s.id::text, s.institution_id,
        jsonb_build_object('session_id', s.id, 'cause', 'ADMINISTRATIVE_TERMINATION', 'reason', v_alasan,
                           'actor', v_actor, 'responses_retained', v_kept, 'learning_assignment_id', p_la));
      v_ended := v_ended + 1;
    else
      v_expired := v_expired + 1;
    end if;
  end loop;

  select count(distinct x.person_id) into v_done from public.penugasan_sesi(p_la) x where x.status in ('SUBMITTED', 'FINALIZED');

  -- no new start: the assessments close, then the assignment leaves ACTIVE
  update public.assessment_assignments set status = 'CLOSED'
   where learning_assignment_id = p_la and status <> 'CLOSED';
  get diagnostics v_closed = row_count;
  update public.learning_assignments set status = p_jenis::public.learning_assignment_status where id = p_la;

  perform public.audit_write(case p_jenis when 'ENDED' then 'learning_assignment.ended' else 'learning_assignment.withdrawn' end,
    'learning_assignments', p_la::text, v_la.institution_id,
    jsonb_build_object('kind', p_jenis, 'reason', v_alasan, 'from_status', v_la.status, 'node_id', v_la.node_id,
                       'plp_release_id', v_la.plp_release_id, 'learners_finished', v_done,
                       'sittings_ended', v_ended, 'sittings_expired', v_expired, 'assessments_closed', v_closed));
  return jsonb_build_object('ok', true, 'status', p_jenis, 'selesai', v_done, 'diakhiri', v_ended, 'kedaluwarsa', v_expired);
end $$;
revoke execute on function public.akhiri_penugasan(uuid, text, text, boolean) from public;   -- ADR-0021

create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a items 2-4: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
begin
  perform pg_temp.a2a_sisip('public.pengerjaan_saya(uuid)',
    E'''ditahan'', public.pengerjaan_ditahan(s),',
    E'''ditahan'', public.pengerjaan_ditahan(s),\n    ''dilepas_henti'', public.pengerjaan_dilepas_henti(s),   -- A2a, THE PLAN item 3');
end $$;

do $$
begin
  if position('ASSIGN_CLASS_STOPPED' in pg_get_functiondef('public.akhiri_penugasan(uuid,text,text,boolean)'::regprocedure)) = 0
     or position('dilepas_henti' in pg_get_functiondef('public.pengerjaan_saya(uuid)'::regprocedure)) = 0 then
    raise exception 'A2a items 2-4: the assignment''s refusal or the player''s line is not built';
  end if;
end $$;
