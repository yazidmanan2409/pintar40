-- A2a, change C · D6.3, D6.4, D6.5 and D6.7: a stopped class's sittings are held with their time (THE PLAN §5.3 D6;
-- owner ruling D-1). DRAFT, pushed unfinished for Sharon's early read.
--
-- Terms (THE PLAN): a sitting is PROTECTED while an active EMERGENCY window affects its person. Protection comes from
-- the fence and the check (D6.1, D6.2); marking and release are bookkeeping (D6.7), so a late or interrupted batch
-- changes no outcome.
--
-- D6.5 · A1's held state, extended (no second system). An emergency hold and a suspension hold are independent facts:
--   darurat_sejak        the instant the emergency hold began (the T_stop of the window that first held it); null when
--                        no emergency hold is in force. Recorded on an open sitting, and on an EXPIRED sitting inside
--                        its grace (D6.3/B3: protected, not placed in A1's held state, released by the same rule).
--   darurat_geser_detik  the total shift of a window-timed sitting (D6.3/B4): recorded beside it, added wherever its
--                        closing time is read; the assignment's window is not changed. An own-deadline sitting's
--                        deadline itself is moved instead, so every reader of it stays consistent.
-- pengerjaan_ditahan stays the one question "is this sitting held?", yes for either cause.
--
-- D6.3/D6.4 · One time rule: at release, the effective deadline moves later by exactly the protected interval, the
-- union of the person's EMERGENCY windows from darurat_sejak to the last T_lift with no gap. T_stop and T_lift only;
-- never the moment a row is processed, so returning late gives no more time.

alter table public.assessment_sessions
  add column darurat_sejak timestamptz,
  -- C7-1 (Sharon, A2A-C-DRAFTS-6-8-c3cbe3c4.md): the window that held it; the shift's chain starts from it
  -- No foreign key, on purpose: a key would take the window FOR KEY SHARE after the sitting at every hold and release,
  -- against the order (… the fence → maintenance_windows → sittings). Windows are never deleted (no function deletes
  -- one), and the release reads the window by id only.
  add column darurat_jendela_id uuid,
  add column darurat_geser_detik integer not null default 0 check (darurat_geser_detik >= 0);
alter table public.assessment_sessions add constraint assessment_sessions_darurat_shape
  check ((darurat_sejak is null) = (darurat_jendela_id is null));
create index assessment_sessions_darurat_idx on public.assessment_sessions (person_id) where darurat_sejak is not null;

-- ═══════════════════════════════════════════════════════════ protection (D6.1, D6.2)
-- Read as a new statement after the shared fence is held, at READ COMMITTED.
create function public.orang_dilindungi(p_person uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.maintenance_windows w
                  where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                    and public.maintenance_affects(w, p_person))
$$;
revoke all on function public.orang_dilindungi(uuid) from public, anon, authenticated, service_role;

-- D6.5: held for either cause
create or replace function public.pengerjaan_ditahan(s public.assessment_sessions) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
     and ((s.frozen_at is not null and s.unfrozen_at is null) or s.darurat_sejak is not null)
$$;
revoke execute on function public.pengerjaan_ditahan(public.assessment_sessions) from public;   -- ADR-0021

-- ═══════════════════════════════════════════════════════════ the shift (D6.3, D6.4)
-- C7-1: whether a window affected a person AT an instant: the memberships, enrolments and roles valid then, not now.
-- A learner moved or transferred during a stop, or a teacher whose role ended during it, was still affected at T_stop.
create function public.maintenance_affects_pada(w public.maintenance_windows, p_person uuid, p_t timestamptz)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select p_person is not null and p_t is not null and (w.platform
    or (cardinality(w.node_ids) = 0 and (
         exists (select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
                  where ra.person_id = p_person and s.institution_id = any (w.institution_ids)
                    and p_t >= ra.valid_from and p_t < ra.valid_until and (ra.revoked_at is null or ra.revoked_at > p_t))
      or exists (select 1 from public.enrollments e
                  where e.person_id = p_person and e.institution_id = any (w.institution_ids)
                    and e.valid_from <= p_t and (e.valid_to is null or e.valid_to > p_t))))
    or (cardinality(w.node_ids) > 0 and (
         exists (select 1 from public.role_assignments ra join public.org_nodes s on s.id = ra.scope_node_id
                  where ra.person_id = p_person and (s.id = any (w.node_ids) or s.jalur && w.node_ids)
                    and p_t >= ra.valid_from and p_t < ra.valid_until and (ra.revoked_at is null or ra.revoked_at > p_t))
      or exists (select 1 from public.enrollments e join public.memberships m on m.enrollment_id = e.id
                  where e.person_id = p_person and m.node_id = any (w.node_ids)
                    and m.valid_from <= p_t and (m.valid_to is null or m.valid_to > p_t)
                    and e.valid_from <= p_t and (e.valid_to is null or e.valid_to > p_t)))))
$$;
revoke all on function public.maintenance_affects_pada(public.maintenance_windows, uuid, timestamptz) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ one instant for an EMERGENCY window (Sharon's C10-1)
-- Sharon (A2A-C-BEFORE-FREEZE-8bc74097.md, C10-1 and her 04:50 addendum): for an EMERGENCY window, the request hook,
-- protection and marking all judge "affected" at the window's T_stop. A person moved out after T_stop stays stopped and
-- held until the lift and is given the stopped time back; a person who joins after T_stop is neither stopped nor held,
-- and loses nothing. PLANNED windows keep the current reading. So maintenance_affects itself answers, for an EMERGENCY
-- window, as of its T_stop: every reader (the hook maintenance_block_for_me, pintar_status_saya, the no-new-sitting
-- guard, orang_dilindungi, pengerjaan_dilindungi) reads the same instant. The current reading is kept, unchanged, as
-- maintenance_affects_kini.
do $$
declare v text := pg_get_functiondef('public.maintenance_affects(public.maintenance_windows,uuid)'::regprocedure);
        v_head text := 'CREATE OR REPLACE FUNCTION public.maintenance_affects(';
begin
  if position(v_head in v) <> 1 then raise exception 'A2a C10-1: maintenance_affects does not start as expected'; end if;
  execute 'CREATE OR REPLACE FUNCTION public.maintenance_affects_kini(' || substr(v, length(v_head) + 1);
end $$;
revoke all on function public.maintenance_affects_kini(public.maintenance_windows, uuid) from public, anon, authenticated, service_role;

create or replace function public.maintenance_affects(w public.maintenance_windows, p_person uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select case when w.kind = 'EMERGENCY' and w.t_stop is not null then public.maintenance_affects_pada(w, p_person, w.t_stop)
              else public.maintenance_affects_kini(w, p_person) end
$$;
revoke execute on function public.maintenance_affects(public.maintenance_windows, uuid) from public;   -- ADR-0021


-- The length of the protected interval of a hold: from the holding window's T_stop, the union of that window and every
-- later EMERGENCY window that affected the person AT ITS OWN T_stop, chained while each starts before the chain ends.
-- Null while the chain has a window still in force (nothing is released). C7-1: never "affects now".
create function public.penghentian_geser(p_person uuid, p_jendela uuid) returns interval
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_awal timestamptz; v_akhir timestamptz; w record; v_lanjut boolean := true;
begin
  select x.t_stop, case when x.ended_at is null then null else coalesce(x.t_lift, x.ended_at) end into v_awal, v_akhir
    from public.maintenance_windows x where x.id = p_jendela;
  if v_awal is null then return interval '0'; end if;
  if v_akhir is null then return null; end if;   -- the holding window is still in force
  while v_lanjut loop
    v_lanjut := false;
    for w in select x.t_stop, coalesce(x.t_lift, x.ended_at) as t_lift, x.ended_at
               from public.maintenance_windows x
              where x.kind = 'EMERGENCY' and x.t_stop is not null and x.id <> p_jendela
                and x.t_stop <= v_akhir and (x.ended_at is null or coalesce(x.t_lift, x.ended_at) > v_akhir)
                and public.maintenance_affects_pada(x, p_person, x.t_stop)
    loop
      if w.ended_at is null then return null; end if;
      v_akhir := w.t_lift; v_lanjut := true;
    end loop;
  end loop;
  return v_akhir - v_awal;
end $$;
revoke all on function public.penghentian_geser(uuid, uuid) from public, anon, authenticated, service_role;

-- Sharon's C17-1: "EXPIRED inside its grace" is judged by ONE helper, used by protection and both markings. Its basis is
-- the one the grace readers themselves use (record_answer's late sync, finalize_session, the decider's scoring):
-- authoritative_deadline plus the definition's grace. A window-timed sitting has no grace under A1 (no deadline of its
-- own: the decider scores it as soon as it expires and record_answer has no late sync for it), so it is never inside one.
create function public.pengerjaan_dalam_tenggang_pada(s public.assessment_sessions, p_t timestamptz) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.status = 'EXPIRED' and s.authoritative_deadline is not null and p_t is not null
     and (s.closure_at is null or s.closure_at <= p_t)
     and not exists (select 1 from public.assessment_results r where r.session_id = s.id)
     and p_t <= s.authoritative_deadline + make_interval(secs => coalesce(
           (select d.late_sync_grace_seconds from public.assessment_definitions d where d.id = s.assessment_definition_id), 0))
$$;
revoke all on function public.pengerjaan_dalam_tenggang_pada(public.assessment_sessions, timestamptz) from public, anon, authenticated, service_role;

-- A sitting is protected by an EMERGENCY window w in force when its person was affected by w at w.t_stop and the sitting
-- was open, or EXPIRED inside its grace, at w.t_stop; or when it carries a mark whose chain is still in force (C10-1).
create function public.pengerjaan_dilindungi(p_session uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select exists (select 1 from public.maintenance_windows w
                    where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                      and s.created_at <= w.t_stop
                      and public.maintenance_affects_pada(w, s.person_id, w.t_stop)
                      and (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
                           or public.pengerjaan_dalam_tenggang_pada(s, w.t_stop)))   -- C17-1: the one helper
        or (s.darurat_sejak is not null and public.penghentian_geser(s.person_id, s.darurat_jendela_id) is null)
      from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.pengerjaan_dilindungi(uuid) from public, anon, authenticated, service_role;

-- D6.3/B4: the window-timed shift is added where the window's closing time is read for the sitting
create or replace function public.pengerjaan_tenggat_efektif(p_session uuid) returns timestamptz
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.authoritative_deadline,
                  (select aa.closes_at from public.assessment_assignments aa where aa.id = s.assessment_assignment_id)
                    + make_interval(secs => s.darurat_geser_detik))
    from public.assessment_sessions s where s.id = p_session
$$;
revoke execute on function public.pengerjaan_tenggat_efektif(uuid) from public;   -- ADR-0021

-- ═══════════════════════════════════════════════════════════ the guard (D6.3: exactly the release's transition)
create or replace function public.pengerjaan_jaga() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if old.closure_kind is not null
     and (new.closure_kind is distinct from old.closure_kind or new.closure_at is distinct from old.closure_at
          or new.closure_deadline is distinct from old.closure_deadline
          or new.closure_by_person_id is distinct from old.closure_by_person_id
          or new.closure_reason is distinct from old.closure_reason) then
    raise exception 'how a sitting ended is recorded once';
  end if;
  if old.attempt_request_id is not null and new.attempt_request_id is distinct from old.attempt_request_id then
    raise exception 'the request that granted a sitting is recorded once';
  end if;
  if old.frozen_at is not null and old.unfrozen_at is null and new.frozen_at is not null and new.unfrozen_at is null then
    if new.status is distinct from old.status and new.status <> 'TERMINATED' then perform public.pengerjaan_tolak('SITTING_FROZEN'); end if;
    if new.authoritative_deadline is distinct from old.authoritative_deadline and old.darurat_sejak is null then
      perform public.pengerjaan_tolak('SITTING_FROZEN');
    end if;
    if new.frozen_at is distinct from old.frozen_at or new.frozen_cause is distinct from old.frozen_cause
       or new.frozen_suspension_id is distinct from old.frozen_suspension_id
       or new.frozen_remaining_seconds is distinct from old.frozen_remaining_seconds then
      raise exception 'what a held sitting recorded when it was held is not rewritten';
    end if;
  end if;
  if new.frozen_at is not null and new.unfrozen_at is null and (old.frozen_at is null or old.unfrozen_at is not null)
     and old.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED') then
    raise exception 'only an open sitting is held';
  end if;
  -- A2a, D6.3/D6.5: the emergency hold
  if old.darurat_sejak is null and new.darurat_sejak is not null then
    -- the hold: an open sitting, or an EXPIRED one inside its grace; nothing else changes with it
    if not (old.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') or old.status = 'EXPIRED')
       or new.status is distinct from old.status or new.authoritative_deadline is distinct from old.authoritative_deadline
       or new.darurat_geser_detik is distinct from old.darurat_geser_detik then
      raise exception 'an emergency hold records only when it began';
    end if;
  elsif old.darurat_sejak is not null and new.darurat_sejak is not null then
    -- held: no ending, no scoring, no re-timing
    if new.darurat_sejak is distinct from old.darurat_sejak or new.darurat_jendela_id is distinct from old.darurat_jendela_id then
      raise exception 'when and by which window an emergency hold began is recorded once';
    end if;
    if new.status is distinct from old.status or new.authoritative_deadline is distinct from old.authoritative_deadline
       or new.darurat_geser_detik is distinct from old.darurat_geser_detik then
      perform public.pengerjaan_tolak('SITTING_EMERGENCY_HELD');
    end if;
  elsif old.darurat_sejak is not null and new.darurat_sejak is null then
    -- the release: the deadline (own) or the recorded shift (window-timed) moves later, nothing else changes
    if new.status is distinct from old.status
       or (new.authoritative_deadline is distinct from old.authoritative_deadline
           and (old.authoritative_deadline is null or new.authoritative_deadline < old.authoritative_deadline))
       or new.darurat_geser_detik < old.darurat_geser_detik
       or (old.authoritative_deadline is not null and new.darurat_geser_detik <> old.darurat_geser_detik) then
      raise exception 'an emergency release moves the deadline later and changes nothing else';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.pengerjaan_jaga() from public;   -- ADR-0021

-- ═══════════════════════════════════════════════════════════ marking and release (D6.7), bookkeeping
-- One sitting released by the rule (the gate, the decider and the batches all use it). Returns true when released.
create function public.pengerjaan_lepas_darurat(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_geser interval;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.darurat_sejak is null then return false; end if;
  v_geser := public.penghentian_geser(s.person_id, s.darurat_jendela_id);
  if v_geser is null then return false; end if;   -- still protected
  if s.authoritative_deadline is not null then
    update public.assessment_sessions
       set authoritative_deadline = s.authoritative_deadline + v_geser, darurat_sejak = null, darurat_jendela_id = null where id = s.id;
  else
    update public.assessment_sessions
       set darurat_geser_detik = s.darurat_geser_detik + ceil(extract(epoch from v_geser))::integer, darurat_sejak = null,
           darurat_jendela_id = null
     where id = s.id;
  end if;
  return true;
end $$;
revoke all on function public.pengerjaan_lepas_darurat(uuid) from public, anon, authenticated, service_role;

-- Marking: protected sittings not yet marked, in id order, a bounded batch per transaction, SKIP LOCKED. A pending
-- release is applied before a second hold is recorded (D6.4): a marked sitting is skipped here, and released first.
-- A procedure that commits per batch cannot be SECURITY DEFINER or carry a SET clause (Postgres refuses transaction
-- control there); it runs as its job's owner, and every name in it is schema-qualified.
create procedure public.pengerjaan_tandai_darurat(p_batas integer default 200)
language plpgsql as $$
declare n integer; x record;
begin
  -- D6.4: a pending release is applied before a second hold is recorded. A sitting still marked from a stop whose chain
  -- has ended (its shift is known) is released first, by the same rule, then marked again with the new stop's T_stop;
  -- otherwise the second stop's interval would be lost (found on review of commit 7: a stop, a lift, a second stop).
  loop
    n := 0;
    for x in select s.id from public.assessment_sessions s
              where s.darurat_sejak is not null and public.penghentian_geser(s.person_id, s.darurat_jendela_id) is not null
              order by s.id limit p_batas for update skip locked loop
      if public.pengerjaan_lepas_darurat(x.id) then n := n + 1; end if;
    end loop;
    commit;
    exit when n = 0;
  end loop;
  loop
    with c as (
      select s.id, j.id as jendela, j.t_stop as sejak
        from public.assessment_sessions s
        -- judged as of each window's T_stop (the owner's review, on C7-1): a sitting already open by then, of a person
        -- the window affected at that instant, whether or not they have since been moved, transferred or re-roled
        cross join lateral (select w.id, w.t_stop from public.maintenance_windows w
                             where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                               and s.created_at <= w.t_stop
                               and public.maintenance_affects_pada(w, s.person_id, w.t_stop)
                             order by w.t_stop, w.id limit 1) j
       where s.darurat_sejak is null
         and (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
              or (s.status = 'EXPIRED' and s.authoritative_deadline is not null
                  and not exists (select 1 from public.assessment_results r where r.session_id = s.id)))
       order by s.id limit p_batas for update of s skip locked)
    update public.assessment_sessions s set darurat_sejak = c.sejak, darurat_jendela_id = c.jendela from c
     where s.id = c.id and c.sejak is not null
       -- B3: an EXPIRED sitting is protected only while still inside its grace at T_stop (C17-1: the one helper)
       and (s.status <> 'EXPIRED' or public.pengerjaan_dalam_tenggang_pada(s, c.sejak));
    get diagnostics n = row_count;
    commit;
    exit when n = 0;
  end loop;
end $$;

-- Release: marked sittings whose chain of stops has ended (its shift is known), whether or not a later stop now
-- protects the person (D6.4), in id order, bounded batches, SKIP LOCKED
create procedure public.pengerjaan_lepas_darurat_semua(p_batas integer default 200)
language plpgsql as $$
declare r record; n integer;
begin
  loop
    n := 0;
    for r in select s.id from public.assessment_sessions s
              where s.darurat_sejak is not null and public.penghentian_geser(s.person_id, s.darurat_jendela_id) is not null
              order by s.id limit p_batas for update skip locked loop
      if public.pengerjaan_lepas_darurat(r.id) then n := n + 1; end if;
    end loop;
    commit;
    exit when n = 0;
  end loop;
end $$;
-- Bounded privileges (the owner's question 3): only the job's owner runs the batches; service_role, the server-side
-- key, holds none of these (Supabase's default privileges would otherwise grant it)
revoke all on procedure public.pengerjaan_tandai_darurat(integer) from public, anon, authenticated, service_role;
revoke all on procedure public.pengerjaan_lepas_darurat_semua(integer) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ every reader adds the shift (D6.3; Sharon's C7-3)
-- A sitting with its own deadline has it moved in place at release, so a raw read of authoritative_deadline is already
-- shifted. A window-timed sitting keeps the assignment's closes_at and carries darurat_geser_detik instead: every
-- reader of A2A-T01's HARUS list that reads closes_at as a sitting's closing time adds it. Three did not.
create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a D6.3: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;
do $$
begin
  -- the decider
  perform pg_temp.a2a_sisip('public.pengerjaan_putus_tenggat(uuid,boolean)',
    E'      select aa.closes_at into v_tenggat from public.assessment_assignments aa where aa.id = v.assessment_assignment_id;\n',
    E'      v_tenggat := public.pengerjaan_tenggat_efektif(p_session);   -- A2a D6.3: closes_at with the stop''s shift\n');
  -- the closer's selection
  perform pg_temp.a2a_sisip('public.pengerjaan_tutup_terjadwal(integer)',
    E'(select aa.closes_at from public.assessment_assignments aa where aa.id = a.assessment_assignment_id)) <= now())',
    E'(select aa.closes_at from public.assessment_assignments aa where aa.id = a.assessment_assignment_id)\n'
    || E'                           + make_interval(secs => a.darurat_geser_detik)) <= now())   -- A2a D6.3: the stop''s shift');
  -- the teacher's list (and so AturPengerjaan's client computation, from its tenggat)
  perform pg_temp.a2a_sisip('public.daftar_pengerjaan(uuid,uuid)',
    E'(select coalesce(s.authoritative_deadline, aa.closes_at) as tenggat)',
    E'(select coalesce(s.authoritative_deadline, aa.closes_at + make_interval(secs => s.darurat_geser_detik)) as tenggat)');
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as fn from pg_proc p
            where p.proname in ('orang_dilindungi', 'pengerjaan_dilindungi', 'penghentian_geser', 'pengerjaan_lepas_darurat',
                                'pengerjaan_tandai_darurat', 'pengerjaan_lepas_darurat_semua', 'maintenance_affects_pada') loop
    if has_function_privilege('anon', r.fn, 'execute') or has_function_privilege('authenticated', r.fn, 'execute')
       or has_function_privilege('service_role', r.fn, 'execute') then
      raise exception 'A2a D6: % is callable by a client or the server key', r.fn;
    end if;
  end loop;
end $$;
