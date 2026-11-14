-- A2a, change C · D6.2 at sitting level: a stopped class's sitting is not ended, scored, resumed, extended or re-timed
-- (THE PLAN §5.3 D6.1, D6.2; owner ruling O1). DRAFT, pushed unfinished for Sharon's early read.
--
-- One helper, pengerjaan_pagar(p_session), is every sitting act's first call:
--   1. the learner FOR KEY SHARE (the lifecycle rank comes before the fence: required change 3);
--   2. the shared fence (pagar_darurat_bersama, 2 s);
--   3. a NEW statement, at READ COMMITTED, reading whether the learner is protected (D6.1's guarantee rests on it);
--   4. when it is not, and the sitting is still marked from a stop whose chain has ended, the release, at once (D6.7's
--      first touch; Sharon's C7-2). Every writer of a sitting's status or deadline reaches this helper before its write
--      (A2A-C702 enforces it over the catalogue), so no writer ends, scores or re-times a sitting on its unshifted time
--      between the lift and the release batch.
-- A decision that took the fence before an activation commits before it; one that takes it after reads the window.
-- The fence not taken within its 2 s is a refusal of its own (SITTING_FENCE_BUSY, Daisy's fence line), never the
-- stopped-class refusal: the class may not be stopped at all.
--
-- What each act does on a protected sitting (THE PLAN D6.2's table):
--   pengerjaan_putus_tenggat   skipped: nothing ended or scored
--   finalize_session           not run (refused)
--   akhiri_pengerjaan, terminate_session                    refused (O1)
--   tambah_waktu_pengerjaan, extend_session_deadline        refused
--   lanjutkan_pengerjaan, tutup_pengerjaan_ditahan          refused (through pengerjaan_ditahan_periksa)
--   note_item_view                                          refused
--   the learner's gate (pengerjaan_gerbang) and the response trigger   refused
--   tutup_asesmen_terbuka (the departure: akhiri_pendaftaran, transfer_execute)   preserved, unscored, for the stop (O1)
--   kenaikan_tetapkan (the promotion run)                    refused, PROMO_STOPPED with the count (M-1)
-- NOT HERE, for Sharon: the assignment-level acts (ubah_jadwal_penugasan, akhiri_penugasan). Each locks an unranked row
-- (the assignment, the transfer) before its learners, and the fence must be the first lock after the lifecycle ranks
-- with no person after it; their order is a design question. Also still to build (O1): after the lift, the departure's
-- rule applied to a sitting preserved through the stop, judged against its shifted deadline and audited naming the stop.

-- ═══════════════════════════════════════════════════════════ the codes
do $$
declare v text := pg_get_functiondef('public.pengerjaan_tolak(text)'::regprocedure);
        v_old text := E'      else ';
        n int;
begin
  n := (length(v) - length(replace(v, v_old, ''))) / length(v_old);
  if n <> 1 then raise exception 'A2a D6.2: pengerjaan_tolak has its anchor % time(s), not once', n; end if;
  execute replace(v, v_old,
       E'      when ''SITTING_CLASS_STOPPED''        then ''the class is stopped by an Admin PINTAR; this can be done once the stop has ended; nothing was changed''\n'
    || E'      when ''SITTING_FENCE_BUSY''           then ''PINTAR is processing a stop or its end; nothing was changed; try again in a moment''\n'
    || E'      when ''SITTING_EMERGENCY_HELD''       then ''the sitting is held during a stop; it is not ended, scored or re-timed''\n'
    || v_old);
end $$;

-- ═══════════════════════════════════════════════════════════ the helper
create function public.pengerjaan_pagar(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;
  begin
    perform public.pagar_darurat_bersama();
  exception when lock_not_available then
    perform public.pengerjaan_tolak('SITTING_FENCE_BUSY');
  end;
  if public.pengerjaan_dilindungi(p_session) then return true; end if;
  -- C7-2: the first touch releases. The unlocked read is safe: a sitting is marked only while protected, and nothing
  -- becomes protected while this transaction holds the shared fence (activation takes it exclusively).
  if exists (select 1 from public.assessment_sessions a where a.id = p_session and a.darurat_sejak is not null) then
    perform public.pengerjaan_lepas_darurat(p_session);
  end if;
  return false;
end $$;
revoke all on function public.pengerjaan_pagar(uuid) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ each act calls it first
create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a D6.2: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
declare
  t text := E'  -- A2a D6.2: the learner, the shared fence, then protection read under it\n';
  tolak text := E'  if public.pengerjaan_pagar(p_session) then perform public.pengerjaan_tolak(''SITTING_CLASS_STOPPED''); end if;\n';
begin
  perform pg_temp.a2a_sisip('public.pengerjaan_putus_tenggat(uuid,boolean)', E'\nbegin\n',
    E'\nbegin\n' || t
    || E'  if public.pengerjaan_pagar(p_session) then\n'
    || E'    return (select a.status from public.assessment_sessions a where a.id = p_session);   -- skipped: nothing ended or scored\n'
    || E'  end if;\n');
  perform pg_temp.a2a_sisip('public.finalize_session(uuid)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.terminate_session(uuid,termination_cause,text)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.akhiri_pengerjaan(uuid,text,text)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.tambah_waktu_pengerjaan(uuid,integer,text)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.extend_session_deadline(uuid,integer,text)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.pengerjaan_ditahan_periksa(uuid)', E'\nbegin\n', E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.pengerjaan_gerbang(uuid,text)', E'\nbegin\n',
    E'\nbegin\n' || t || tolak);
  perform pg_temp.a2a_sisip('public.note_item_view(uuid)',
    E'  if v_session is null then raise exception ''unknown presented item %'', p_presented_item; end if;\n',
    E'  if v_session is null then raise exception ''unknown presented item %'', p_presented_item; end if;\n' || t
    || E'  if public.pengerjaan_pagar(v_session) then perform public.pengerjaan_tolak(''SITTING_CLASS_STOPPED''); end if;\n');
  -- not a D6.2 act, but it reaches the decider after locking a sitting: it takes the fence first (no refusal)
  perform pg_temp.a2a_sisip('public.minta_percobaan(uuid,text)',
    E'  select * into s from public.assessment_sessions where id = p_session for update;\n',
    t || E'  perform public.pengerjaan_pagar(p_session);\n'
      || E'  select * into s from public.assessment_sessions where id = p_session for update;\n');
  -- the departure (akhiri_pendaftaran, transfer_execute; O1): the person and the enrolment are already held (ranks 1 and
  -- 1.5), so the shared fence comes next, before the first sitting is locked. Each sitting then goes through the helper:
  -- a protected one is preserved, unscored, for the stop (O1); an unprotected one still marked from a lifted stop is
  -- released with its shift first (C7-2), and only then judged by the deadline rule.
  perform pg_temp.a2a_sisip('public.tutup_asesmen_terbuka(uuid,text)',
    E'  for s in select a.id, a.institution_id from public.assessment_sessions a\n',
    t || E'  begin\n    perform public.pagar_darurat_bersama();\n'
      || E'  exception when lock_not_available then\n    perform public.pengerjaan_tolak(''SITTING_FENCE_BUSY'');\n  end;\n'
      || E'  for s in select a.id, a.institution_id from public.assessment_sessions a\n');
  perform pg_temp.a2a_sisip('public.tutup_asesmen_terbuka(uuid,text)',
    E'    if public.session_enforce_deadline(s.id) in',
    E'    if public.pengerjaan_pagar(s.id) then continue; end if;   -- O1: preserved, unscored, for the stop\n'
      || E'    if public.session_enforce_deadline(s.id) in');
  -- the promotion run (owner ruling M-1, 11 Nov): a school's year-end administrative act, refused during a stop for a
  -- class with a learner whose sitting is protected, saying how many (PROMO_STOPPED, the count in HINT). On the apply
  -- path the population is already held (rank 1), so the shared fence comes next, before any sitting; the preview
  -- writes nothing and reads protection as it stands, so the refusal is seen at the review before the confirmation.
  perform pg_temp.a2a_sisip('public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)',
    E'declare k record;', E'declare v_ditahan integer; k record;');
  perform pg_temp.a2a_sisip('public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)',
    E'      order by pr.id for update;\n  end if;\n',
    E'      order by pr.id for update;\n  end if;\n'
      || E'  -- A2a M-1: the population, the shared fence, then protection read under it\n'
      || E'  if p_terapkan then\n'
      || E'    begin\n      perform public.pagar_darurat_bersama();\n'
      || E'    exception when lock_not_available then\n      perform public.pengerjaan_tolak(''SITTING_FENCE_BUSY'');\n    end;\n'
      || E'  end if;\n'
      || E'  select count(distinct a.person_id) into v_ditahan\n'
      || E'    from public.kenaikan_populasi(p_kelas) pop\n'
      || E'    join public.assessment_sessions a on a.person_id = pop.person_id and a.enrollment_id = pop.enrollment_id\n'
      || E'   where a.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'') and public.pengerjaan_dilindungi(a.id);\n'
      || E'  if v_ditahan > 0 then\n'
      || E'    raise exception using errcode = ''PR070'', detail = ''PROMO_STOPPED'', hint = v_ditahan::text,\n'
      || E'      message = ''the promotion cannot be applied during a stop: '' || v_ditahan || '' learner(s) have a sitting held by it'';\n'
      || E'  end if;\n');
  -- the closer: the fence before each candidate's sitting (D6.6 makes it a procedure committing per batch, so the fence
  -- is not held for a whole run)
  perform pg_temp.a2a_sisip('public.pengerjaan_tutup_terjadwal(integer)',
    E'      select * into v_kini from public.assessment_sessions where id = s.id for update;\n',
    E'      perform public.pengerjaan_pagar(s.id);   -- A2a D6.2/D6.6: the fence before the candidate''s sitting\n'
      || E'      select * into v_kini from public.assessment_sessions where id = s.id for update;\n');
  perform pg_temp.a2a_sisip('public.enforce_response_write()',
    E'    raise exception ''a response is evidence: append a new client_seq, never rewrite one (INV-28)'';\n  end if;\n',
    E'    raise exception ''a response is evidence: append a new client_seq, never rewrite one (INV-28)'';\n  end if;\n' || t
    || E'  if public.pengerjaan_pagar(new.session_id) then perform public.pengerjaan_tolak(''SITTING_CLASS_STOPPED''); end if;\n');
end $$;

-- The departure's helper now takes the fence; it is called only by akhiri_pendaftaran, transfer_execute and the
-- promotion run, never by a client nor the server key. Supabase's default privileges granted it to service_role; that
-- grant is removed, as N1 did for the fence itself (A2A-F01: a caller of the fence is an RPC, the closer, a trigger or
-- internal).
revoke all on function public.tutup_asesmen_terbuka(uuid, text) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare r record;
begin
  for r in select x::regprocedure as fn from unnest(array['public.pengerjaan_putus_tenggat(uuid,boolean)', 'public.finalize_session(uuid)',
      'public.terminate_session(uuid,termination_cause,text)', 'public.akhiri_pengerjaan(uuid,text,text)',
      'public.tambah_waktu_pengerjaan(uuid,integer,text)', 'public.extend_session_deadline(uuid,integer,text)',
      'public.pengerjaan_ditahan_periksa(uuid)', 'public.pengerjaan_gerbang(uuid,text)', 'public.note_item_view(uuid)',
      'public.enforce_response_write()', 'public.minta_percobaan(uuid,text)', 'public.pengerjaan_tutup_terjadwal(integer)',
      'public.tutup_asesmen_terbuka(uuid,text)']) x loop
    if position('public.pengerjaan_pagar(' in pg_get_functiondef(r.fn)) = 0 then
      raise exception 'A2a D6.2: % does not take the fence and read protection', r.fn;
    end if;
  end loop;
  if position('PROMO_STOPPED' in pg_get_functiondef('public.kenaikan_tetapkan(uuid,uuid,jsonb,boolean,boolean)'::regprocedure)) = 0 then
    raise exception 'A2a M-1: kenaikan_tetapkan does not refuse during a stop';
  end if;
  if has_function_privilege('service_role', 'public.tutup_asesmen_terbuka(uuid,text)', 'execute') then
    raise exception 'A2a D6.2: tutup_asesmen_terbuka is still granted to service_role';
  end if;
end $$;
