-- A2a, change C · C30-2 (Sharon's early read of commit 30, A2A-C-30-8cbda9cc.md at 88d8ffec): A1's hold (a suspension)
-- meets an emergency stop. DRAFT.
--
-- The rule, composed from two approved rules (D-1: a stop costs a sitting no time; A1: a held sitting keeps the time it
-- had): a sitting's time runs only while it is neither stopped (protected by a stop in force) nor held by A1.
--   1. At an A1 hold of a sitting a stop is holding, the time left is measured at the T_stop of that stop's chain (or at
--      darurat_sejak, if marked), not at the hold: the learner was stopped from then.
--   2. While held by A1: no emergency credit is pending (the effective deadline is the held one), the credit write is
--      skipped (never raised: SITTING_FROZEN no longer blocks a touch after a lift), no sitting is newly marked, and a
--      release clears the mark with no shift. The time left recorded at the hold already covers it.
--   3. At the resume, the watermark of what stops have given moves past every chain lifted by then, so nothing spent
--      under the hold is credited after it.
--
-- Swept with it (Bob: every writer that fixes the deadline before crediting; every guard path where SITTING_FROZEN could
-- block the credit):
--   S1. The marking batch fixed a mark without the credit of an earlier lifted stop not yet given (D-1 lost that stop:
--       the release's watermark then passes it). Now a marked sitting's pending credit is the lifted chains before its
--       mark, applied with the release; and a mark is set at the start of the chain in force (a chain begun by a stop
--       lifted since, overlapped by one still in force), never part-way through it.
--   S2. The release batch's credit pass re-selected the same first rows: a page of sittings with nothing to credit (now
--       also: held ones) ended the pass before the rest. It walks the sittings in id order instead.
--   C30-1. record_answer already reaches pengerjaan_pagar before its read (through pengerjaan_gerbang, A2a D6.2); the
--       structural rule that keeps it so is A2A-C708's, and A2A-C712 proves the answer's mode after a lift.

-- the stop that holds a sitting now: the first window of the chain in force, walking from what stops have given;
-- null when no stop holds it
create function public.penghentian_berlaku(s public.assessment_sessions) returns uuid
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows; g interval; sampai timestamptz := s.darurat_dikredit_sampai;
begin
  if s.id is null then return null; end if;
  if s.darurat_sejak is not null then
    return case when public.penghentian_geser(s.person_id, s.darurat_jendela_id) is null then s.darurat_jendela_id end;
  end if;
  loop
    select x.* into w from public.maintenance_windows x
     where x.kind = 'EMERGENCY' and x.t_stop is not null
       and (sampai is null or x.t_stop >= sampai)
       and s.created_at <= x.t_stop
       and (s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') or public.pengerjaan_dalam_tenggang_pada(s, x.t_stop))
       and public.maintenance_affects_pada(x, s.person_id, x.t_stop)
     order by x.t_stop, x.id limit 1;
    if not found then return null; end if;
    if w.ended_at is null then return w.id; end if;
    g := public.penghentian_geser(s.person_id, w.id);
    if g is null then return w.id; end if;   -- lifted, but its chain runs on into a stop still in force
    sampai := w.t_stop + g;
  end loop;
end $$;
revoke all on function public.penghentian_berlaku(public.assessment_sessions) from public, anon, authenticated, service_role;

-- the pending credit: zero while held by A1 (C30-2); for a marked sitting, the lifted chains before its mark (S1)
create or replace function public.penghentian_kredit(s public.assessment_sessions, out geser interval, out sampai timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows; g interval;
begin
  geser := interval '0'; sampai := s.darurat_dikredit_sampai;
  if s.id is null or s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
     or (s.frozen_at is not null and s.unfrozen_at is null) then return; end if;
  loop
    select x.* into w from public.maintenance_windows x
     where x.kind = 'EMERGENCY' and x.t_stop is not null and x.ended_at is not null
       and (sampai is null or x.t_stop >= sampai)
       and (s.darurat_sejak is null or x.t_stop < s.darurat_sejak)
       and s.created_at <= x.t_stop
       and (s.status <> 'EXPIRED' or public.pengerjaan_dalam_tenggang_pada(s, x.t_stop))
       and public.maintenance_affects_pada(x, s.person_id, x.t_stop)
     order by x.t_stop, x.id limit 1;
    exit when not found;
    g := public.penghentian_geser(s.person_id, w.id);
    exit when g is null;   -- a window of the chain is still in force: nothing past it is pending yet
    -- a marked sitting: what runs into its mark is the release's to give
    if s.darurat_sejak is not null and w.t_stop + g > s.darurat_sejak then g := s.darurat_sejak - w.t_stop; end if;
    geser := geser + g; sampai := w.t_stop + g;
  end loop;
end $$;
revoke execute on function public.penghentian_kredit(public.assessment_sessions) from public;   -- ADR-0021

-- the credit: skipped, not refused, while held (C30-2); never for a marked sitting (its release gives it)
create or replace function public.pengerjaan_kredit_darurat(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; k record;
begin
  select * into s from public.assessment_sessions where id = p_session for update;   -- the watermark re-read under the lock
  if s.id is null or s.darurat_sejak is not null then return false; end if;
  select * into k from public.penghentian_kredit(s);   -- zero while held by A1
  if k.geser is null or k.geser <= interval '0' then return false; end if;
  if s.authoritative_deadline is not null then
    update public.assessment_sessions set authoritative_deadline = s.authoritative_deadline + k.geser, darurat_dikredit_sampai = k.sampai
     where id = s.id;
  else
    update public.assessment_sessions
       set darurat_geser_detik = s.darurat_geser_detik + ceil(extract(epoch from k.geser))::integer, darurat_dikredit_sampai = k.sampai
     where id = s.id;
  end if;
  return true;
end $$;
revoke execute on function public.pengerjaan_kredit_darurat(uuid) from public;   -- ADR-0021

-- the release: the stop's shift and the credit of the lifted chains before the mark (S1); under A1's hold, the mark is
-- cleared with no shift and the watermark moved past the chain (C30-2: the held time left covers it)
create or replace function public.pengerjaan_lepas_darurat(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; v_geser interval; k record; v_sampai timestamptz;
begin
  select * into s from public.assessment_sessions where id = p_session for update;
  if s.id is null or s.darurat_sejak is null then return false; end if;
  v_geser := public.penghentian_geser(s.person_id, s.darurat_jendela_id);
  if v_geser is null then return false; end if;   -- still protected
  select * into k from public.penghentian_kredit(s);   -- zero while held by A1
  v_sampai := greatest(coalesce(s.darurat_dikredit_sampai, s.darurat_sejak + v_geser), s.darurat_sejak + v_geser);
  if s.frozen_at is not null and s.unfrozen_at is null then
    update public.assessment_sessions set darurat_sejak = null, darurat_jendela_id = null, darurat_dikredit_sampai = v_sampai
     where id = s.id;
  elsif s.authoritative_deadline is not null then
    update public.assessment_sessions
       set authoritative_deadline = s.authoritative_deadline + v_geser + k.geser, darurat_sejak = null, darurat_jendela_id = null,
           darurat_dikredit_sampai = v_sampai
     where id = s.id;
  else
    update public.assessment_sessions
       set darurat_geser_detik = s.darurat_geser_detik + ceil(extract(epoch from (v_geser + k.geser)))::integer,
           darurat_sejak = null, darurat_jendela_id = null, darurat_dikredit_sampai = v_sampai
     where id = s.id;
  end if;
  return true;
end $$;
revoke execute on function public.pengerjaan_lepas_darurat(uuid) from public;   -- ADR-0021

-- the marking: never a sitting held by A1 (C30-2); the mark at the start of the chain in force (S1)
create or replace procedure public.pengerjaan_tandai_darurat(p_batas integer default 200)
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
      select s.id, b.jendela, w.t_stop as sejak
        from public.assessment_sessions s
        -- judged as of each window's T_stop (the owner's review, on C7-1): a sitting already open by then, of a person
        -- the window affected at that instant, whether or not they have since been moved, transferred or re-roled
        cross join lateral (select w.id from public.maintenance_windows w
                             where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is null
                               and s.created_at <= w.t_stop
                               and public.maintenance_affects_pada(w, s.person_id, w.t_stop)
                             order by w.t_stop, w.id limit 1) j
        -- S1: the chain's own first window (a stop lifted since may have begun it); its pending credit stays pending
        cross join lateral (select coalesce(public.penghentian_berlaku(s), j.id) as jendela) b
        join public.maintenance_windows w on w.id = b.jendela
       where s.darurat_sejak is null
         and not (s.frozen_at is not null and s.unfrozen_at is null)   -- C30-2: the held time left covers the stop
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

-- the release batch: its credit pass walks the sittings in id order (S2), so a page with nothing to credit does not end it
create or replace procedure public.pengerjaan_lepas_darurat_semua(p_batas integer default 200)
language plpgsql as $$
declare r record; n integer; v_dari uuid := '00000000-0000-0000-0000-000000000000';
begin
  -- the releases of marked sittings, as before
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
  -- C18-1: the credits of unmarked sittings of windows lifted in the last seven days, from their people
  loop
    n := 0;
    for r in select distinct s.id
               from public.maintenance_windows w
               join public.assessment_sessions s
                 on s.darurat_sejak is null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
                and not (s.frozen_at is not null and s.unfrozen_at is null)
                and s.created_at <= w.t_stop and (s.darurat_dikredit_sampai is null or w.t_stop >= s.darurat_dikredit_sampai)
                and (w.platform or s.person_id in (select o from public.penghentian_orang(w) o))
              where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is not null
                and coalesce(w.t_lift, w.ended_at) > now() - interval '7 days'
                and s.id > v_dari
              order by s.id limit p_batas loop
      perform public.pengerjaan_kredit_darurat(r.id);
      n := n + 1; v_dari := r.id;
    end loop;
    commit;
    exit when n = 0;
  end loop;
end $$;

create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a C30-2: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
begin
  -- 1. the hold of a sitting a stop holds: the time left as at the chain's T_stop
  perform pg_temp.a2a_sisip('public.pengerjaan_tahan_orang(uuid,uuid)',
    E'v_sisa := case when v_tenggat is null then null else greatest(0, floor(extract(epoch from (v_tenggat - now())))::integer) end;',
    E'v_sisa := case when v_tenggat is null then null else greatest(0, floor(extract(epoch from (v_tenggat - coalesce(\n'
    || E'      (select w.t_stop from public.maintenance_windows w where w.id = public.penghentian_berlaku(v)), now()))))::integer) end;');
  -- 3. the resume: the watermark past every chain lifted by now (time under the hold is not credited after it)
  perform pg_temp.a2a_sisip('public.lanjutkan_pengerjaan(uuid,text)',
    E'   where id = p_session;\n  perform public.audit_write(''assessment_session.resumed''',
    E'   where id = p_session;\n'
    || E'  s.frozen_at := null; s.unfrozen_at := null; s.frozen_cause := null;\n'
    || E'  update public.assessment_sessions a set darurat_dikredit_sampai = k.sampai\n'
    || E'    from public.penghentian_kredit(s) k\n'
    || E'   where a.id = p_session and k.sampai is not null\n'
    || E'     and (a.darurat_dikredit_sampai is null or k.sampai > a.darurat_dikredit_sampai);\n'
    || E'  perform public.audit_write(''assessment_session.resumed''');
end $$;

do $$
begin
  if position('penghentian_berlaku(v)' in pg_get_functiondef('public.pengerjaan_tahan_orang(uuid,uuid)'::regprocedure)) = 0
     or position('penghentian_kredit(s)' in pg_get_functiondef('public.lanjutkan_pengerjaan(uuid,text)'::regprocedure)) = 0 then
    raise exception 'A2a C30-2: the hold or the resume does not compose with the stop';
  end if;
end $$;
