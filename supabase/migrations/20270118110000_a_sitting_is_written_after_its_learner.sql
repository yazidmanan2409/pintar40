-- A2A-L01, change A commit 3 (Sharon's ruling, A2A-L01-FINDING-f09da528.md): a function that writes a sitting the hold
-- would take, and then reaches that sitting's learner, takes the learner first.
--
-- The deadlock, reproduced on two connections on 245 (A2A-L03): a lifecycle act (tangguhkan_akun) holds the learner FOR
-- UPDATE and, through pengerjaan_tahan_orang, then takes the learner's CREATED / IN_PROGRESS / PAUSED sittings FOR
-- UPDATE. finalize_session, on such a sitting past its deadline, first writes it (pengerjaan_putus_tenggat: FOR UPDATE,
-- then EXPIRED), then inserts its result, whose foreign key to persons takes the learner FOR KEY SHARE, which waits for
-- the act. The act waits for the sitting: "deadlock detected".
--
-- The fix: the learner FOR KEY SHARE before the sitting is touched. KEY SHARE conflicts only with FOR UPDATE (and
-- DELETE), so nothing waits on it that did not already wait on the foreign key it comes ahead of; it only moves that
-- wait to before the sitting is held.
--
-- The sweep for siblings (Sharon: "every function that writes a sitting whose committed status the hold takes, then
-- touches that sitting's learner through a foreign key"), read from A2A-L01's per-function lock lists, found the same
-- shape in nine more, fixed here in the same shape:
--   pengerjaan_putus_tenggat   the deadline writer: the sitting FOR UPDATE, then (scoring) finalize_session's result;
--                              every caller that does not lock the sitting itself (submit, finish, extend, the hold)
--                              comes through it
--   akhiri_pengerjaan          locks the sitting, then pengerjaan_putus_tenggat and finalize_session
--   tambah_waktu_pengerjaan    locks the sitting, then pengerjaan_putus_tenggat
--   pengerjaan_tutup_terjadwal locks each candidate, then pengerjaan_putus_tenggat (the learner per candidate)
--   minta_percobaan            locks the sitting, closes the learner's open ones, then inserts attempt_requests (its
--                              person_id, and orang_lampiran_jaga's FOR SHARE): the learner FOR SHARE, so no upgrade
--   tutup_asesmen_terbuka      locks the enrolment's open sittings, then session_enforce_deadline → finalize_session
--   akhiri_penugasan           locks the assignment's open sittings (many learners), then session_enforce_deadline:
--                              their learners FOR KEY SHARE, in id order, after its assessment assignments are locked
--                              (so no new sitting can start) and before the sittings
--   akhiri_pendaftaran         closes the enrolment's sittings, then ends the enrolment, whose trigger
--                              (enrollments_programme_alone) takes the learner FOR UPDATE: the learner FOR UPDATE
--                              before the sittings (after the enrolment row, the order that trigger already keeps)
--   terminate_session          writes the sitting TERMINATED, whose terminated_by_person_id is the actor; nothing stops
--                              the actor being the sitting's own learner (a system admin ending their own professional-
--                              learning sitting), so it cannot be read as the actor's row only: the learner first
-- Not changed, read: kenaikan_tetapkan and transfer_execute already hold the learner FOR UPDATE before they close
-- sittings (the population lock; the enrolment trigger). lanjutkan_pengerjaan and tutup_pengerjaan_ditahan write only a
-- held (frozen) sitting, which the hold does not take; their foreign key is the actor's. akhiri_pengerjaan's closure_by
-- is the actor's too, and its learner is now taken first in any case.
--
-- Each new line names the sitting (or enrolment) only to find the learner, and locks only the learner (OF p).
-- Nothing else changes: signatures, owners, grants, volatility and security are kept (each is replaced from its own
-- definition with one line added).

create function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baris text, p_sebelum boolean) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2A-L01: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, case when p_sebelum then p_baris || p_anchor else p_anchor || p_baris end);
end $$;

do $$
declare
  c text := E'  -- A2A-L01 (Sharon, A2A-L01-FINDING-f09da528.md): the learner first, before the sitting is touched\n';
begin
  -- finalize_session: after its unlocked read of the sitting (it names the learner), before the deadline decision
  perform pg_temp.a2a_sisip('public.finalize_session(uuid)',
    E'  if v_s.id is null then raise exception ''unknown session %'', p_session; end if;\n',
    c || E'  perform 1 from public.persons where id = v_s.person_id for key share;\n', false);
  perform pg_temp.a2a_sisip('public.pengerjaan_putus_tenggat(uuid,boolean)',
    E'  select * into v from public.assessment_sessions where id = p_session for update;\n',
    c || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n', true);
  perform pg_temp.a2a_sisip('public.akhiri_pengerjaan(uuid,text,text)',
    E'  select * into s from public.assessment_sessions where id = p_session for update;\n',
    c || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n', true);
  perform pg_temp.a2a_sisip('public.tambah_waktu_pengerjaan(uuid,integer,text)',
    E'  select * into s from public.assessment_sessions where id = p_session for update;\n',
    c || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n', true);
  perform pg_temp.a2a_sisip('public.pengerjaan_tutup_terjadwal(integer)',
    E'      select * into v_kini from public.assessment_sessions where id = s.id for update;\n',
    E'      perform 1 from public.persons p, public.assessment_sessions a where a.id = s.id and p.id = a.person_id for key share of p;   -- A2A-L01: the learner first\n', true);
  perform pg_temp.a2a_sisip('public.minta_percobaan(uuid,text)',
    E'  select * into s from public.assessment_sessions where id = p_session for update;\n',
    c || E'  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for share of p;\n', true);
  perform pg_temp.a2a_sisip('public.tutup_asesmen_terbuka(uuid,text)',
    E'  for s in select a.id, a.institution_id from public.assessment_sessions a\n',
    c || E'  perform 1 from public.persons p, public.enrollments e where e.id = p_enrollment and p.id = e.person_id for key share of p;\n', true);
  perform pg_temp.a2a_sisip('public.akhiri_penugasan(uuid,text,text,boolean)',
    E'  for s in select x.id, x.institution_id from public.penugasan_sesi(p_la) x\n',
    c || E'  perform 1 from public.persons pr where pr.id in (select x.person_id from public.penugasan_sesi(p_la) x\n'
      || E'     where x.status in (''CREATED'', ''IN_PROGRESS'', ''PAUSED'')) order by pr.id for key share of pr;\n', true);
  perform pg_temp.a2a_sisip('public.terminate_session(uuid,termination_cause,text)',
    E'  if v_s.id is null then raise exception ''unknown session %'', p_session; end if;\n',
    c || E'  perform 1 from public.persons where id = v_s.person_id for key share;\n', false);
  perform pg_temp.a2a_sisip('public.akhiri_pendaftaran(uuid,text,text,date)',
    E'    from public.enrollments e where e.id = p_enrollment for update;\n',
    c || E'  perform 1 from public.persons where id = en.person_id for update;\n', false);
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
-- In each, the learner's lock comes before the first statement that locks or writes a sitting.
do $$
declare r record; v text; k int; s int;
begin
  for r in select * from (values
      ('public.finalize_session(uuid)', 'perform 1 from public.persons where id = v_s.person_id for key share;', 'pengerjaan_putus_tenggat'),
      ('public.pengerjaan_putus_tenggat(uuid,boolean)', 'and p.id = a.person_id for key share of p;', 'from public.assessment_sessions where id = p_session for update'),
      ('public.akhiri_pengerjaan(uuid,text,text)', 'and p.id = a.person_id for key share of p;', 'from public.assessment_sessions where id = p_session for update'),
      ('public.tambah_waktu_pengerjaan(uuid,integer,text)', 'and p.id = a.person_id for key share of p;', 'from public.assessment_sessions where id = p_session for update'),
      ('public.pengerjaan_tutup_terjadwal(integer)', 'where a.id = s.id and p.id = a.person_id for key share of p;', 'from public.assessment_sessions where id = s.id for update'),
      ('public.minta_percobaan(uuid,text)', 'and p.id = a.person_id for share of p;', 'from public.assessment_sessions where id = p_session for update'),
      ('public.tutup_asesmen_terbuka(uuid,text)', 'and p.id = e.person_id for key share of p;', 'for s in select a.id'),
      ('public.akhiri_penugasan(uuid,text,text,boolean)', 'order by pr.id for key share of pr;', 'for s in select x.id'),
      ('public.terminate_session(uuid,termination_cause,text)', 'perform 1 from public.persons where id = v_s.person_id for key share;', 'update public.assessment_sessions'),
      ('public.akhiri_pendaftaran(uuid,text,text,date)', 'perform 1 from public.persons where id = en.person_id for update;', 'tutup_asesmen_terbuka')
    ) t(fn, kunci, sesi) loop
    v := pg_get_functiondef(r.fn::regprocedure);
    k := position(r.kunci in v); s := position(r.sesi in v);
    if k = 0 or s = 0 or k > s then
      raise exception 'A2A-L01: % does not take its learner before its sitting', r.fn;
    end if;
  end loop;
end $$;
