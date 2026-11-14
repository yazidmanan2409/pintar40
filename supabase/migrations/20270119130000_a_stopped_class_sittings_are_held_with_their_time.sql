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
  add column darurat_geser_detik integer not null default 0 check (darurat_geser_detik >= 0);
create index assessment_sessions_darurat_idx on public.assessment_sessions (person_id) where darurat_sejak is not null;

-- ═══════════════════════════════════════════════════════════ protection (D6.1, D6.2)
-- Read as a new statement after the shared fence is held, at READ COMMITTED.
create function public.orang_dilindungi(p_person uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.maintenance_windows w
                  where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                    and public.maintenance_affects(w, p_person))
$$;
create function public.pengerjaan_dilindungi(p_session uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select public.orang_dilindungi(s.person_id) from public.assessment_sessions s where s.id = p_session), false)
$$;
revoke all on function public.orang_dilindungi(uuid) from public, anon, authenticated;
revoke all on function public.pengerjaan_dilindungi(uuid) from public, anon, authenticated;

-- D6.5: held for either cause
create or replace function public.pengerjaan_ditahan(s public.assessment_sessions) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
     and ((s.frozen_at is not null and s.unfrozen_at is null) or s.darurat_sejak is not null)
$$;

-- ═══════════════════════════════════════════════════════════ the shift (D6.3, D6.4)
-- The length of the protected interval that began at p_sejak for this person: the union of their EMERGENCY windows,
-- chained from p_sejak while each next window starts before the chain ends. Null while the chain has a window not yet
-- lifted (the person is still protected: nothing is released).
create function public.penghentian_geser(p_person uuid, p_sejak timestamptz) returns interval
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_akhir timestamptz := p_sejak; w record; v_lanjut boolean := true;
begin
  while v_lanjut loop
    v_lanjut := false;
    for w in select x.t_stop, coalesce(x.t_lift, x.ended_at) as t_lift, x.ended_at
               from public.maintenance_windows x
              where x.kind = 'EMERGENCY' and x.t_stop is not null and x.t_stop <= v_akhir
                and (x.ended_at is null or coalesce(x.t_lift, x.ended_at) > v_akhir)
                and public.maintenance_affects(x, p_person)
    loop
      if w.ended_at is null then return null; end if;   -- still in force
      v_akhir := w.t_lift; v_lanjut := true;
    end loop;
  end loop;
  return v_akhir - p_sejak;
end $$;
revoke all on function public.penghentian_geser(uuid, timestamptz) from public, anon, authenticated;

-- D6.3/B4: the window-timed shift is added where the window's closing time is read for the sitting
create or replace function public.pengerjaan_tenggat_efektif(p_session uuid) returns timestamptz
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.authoritative_deadline,
                  (select aa.closes_at from public.assessment_assignments aa where aa.id = s.assessment_assignment_id)
                    + make_interval(secs => s.darurat_geser_detik))
    from public.assessment_sessions s where s.id = p_session
$$;

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
    if new.darurat_sejak is distinct from old.darurat_sejak then raise exception 'when an emergency hold began is recorded once'; end if;
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

-- ═══════════════════════════════════════════════════════════ marking and release (D6.7), bookkeeping
-- One sitting released by the rule (the gate, the decider and the batches all use it). Returns true when released.
create function public.pengerjaan_lepas_darurat(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_geser interval;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.darurat_sejak is null then return false; end if;
  v_geser := public.penghentian_geser(s.person_id, s.darurat_sejak);
  if v_geser is null then return false; end if;   -- still protected
  if s.authoritative_deadline is not null then
    update public.assessment_sessions
       set authoritative_deadline = s.authoritative_deadline + v_geser, darurat_sejak = null where id = s.id;
  else
    update public.assessment_sessions
       set darurat_geser_detik = s.darurat_geser_detik + ceil(extract(epoch from v_geser))::integer, darurat_sejak = null
     where id = s.id;
  end if;
  return true;
end $$;
revoke all on function public.pengerjaan_lepas_darurat(uuid) from public, anon, authenticated;

-- Marking: protected sittings not yet marked, in id order, a bounded batch per transaction, SKIP LOCKED. A pending
-- release is applied before a second hold is recorded (D6.4): a marked sitting is skipped here, and released first.
-- A procedure that commits per batch cannot be SECURITY DEFINER or carry a SET clause (Postgres refuses transaction
-- control there); it runs as its job's owner, and every name in it is schema-qualified.
create procedure public.pengerjaan_tandai_darurat(p_batas integer default 200)
language plpgsql as $$
declare n integer;
begin
  loop
    with c as (
      select s.id, (select min(w.t_stop) from public.maintenance_windows w
                     where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                       and public.maintenance_affects(w, s.person_id)) as sejak
        from public.assessment_sessions s
       where s.darurat_sejak is null
         and (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED')
              or (s.status = 'EXPIRED' and s.authoritative_deadline is not null
                  and not exists (select 1 from public.assessment_results r where r.session_id = s.id)))
         and public.orang_dilindungi(s.person_id)
       order by s.id limit p_batas for update of s skip locked)
    update public.assessment_sessions s set darurat_sejak = c.sejak from c
     where s.id = c.id and c.sejak is not null
       -- B3: an EXPIRED sitting is protected only while still inside its grace at T_stop
       and (s.status <> 'EXPIRED' or c.sejak <= s.authoritative_deadline + make_interval(secs => coalesce(
             (select d.late_sync_grace_seconds from public.assessment_definitions d where d.id = s.assessment_definition_id), 0)));
    get diagnostics n = row_count;
    commit;
    exit when n = 0;
  end loop;
end $$;

-- Release: marked sittings whose person is no longer protected, in id order, bounded batches, SKIP LOCKED
create procedure public.pengerjaan_lepas_darurat_semua(p_batas integer default 200)
language plpgsql as $$
declare r record; n integer;
begin
  loop
    n := 0;
    for r in select s.id from public.assessment_sessions s
              where s.darurat_sejak is not null and not public.orang_dilindungi(s.person_id)
              order by s.id limit p_batas for update skip locked loop
      if public.pengerjaan_lepas_darurat(r.id) then n := n + 1; end if;
    end loop;
    commit;
    exit when n = 0;
  end loop;
end $$;
revoke all on procedure public.pengerjaan_tandai_darurat(integer) from public, anon, authenticated;
revoke all on procedure public.pengerjaan_lepas_darurat_semua(integer) from public, anon, authenticated;
