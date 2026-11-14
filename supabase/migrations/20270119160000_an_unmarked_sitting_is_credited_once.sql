-- A2a, change C · C18-1: the lift does not mark; an unmarked sitting of a lifted stop is credited once (Sharon's ruling,
-- A2A-C-C18-1-AND-23-28.md at 50dab36f). DRAFT, for Sharon's read.
--
-- Measured (commit 29): marking 50,000 sittings at the lift costs 5.5 s through the table's triggers (0.9 s without any),
-- against the 0.5 s budget under the exclusive fence. So the lift records T_lift only, and the time a stop held is given
-- to a sitting that no marking batch reached, ONCE, after the lift:
--   * a watermark per sitting, darurat_dikredit_sampai: the end of the last chain already given (by a release or by a
--     credit). A lifted EMERGENCY window w is pending for an unmarked sitting when w.t_stop is at or after the watermark,
--     the sitting was open (or EXPIRED inside its grace, C17-1's helper) at w.t_stop, and w affected its person then
--     (maintenance_affects_pada); the credit is the union chain from w (penghentian_geser), and the watermark becomes the
--     chain's end, so no window is given twice. A release of a marked sitting writes the watermark too;
--   * D1 (required): pengerjaan_tenggat_efektif adds the PENDING credit itself, on the same rule and chain, and the
--     read-only readers (session_state, may_continue_session, maintenance_draining, daftar_pengerjaan; pengerjaan_saya
--     already reads it) read the effective deadline: between the lift and the first touch nobody sees, or decides on,
--     the unshifted deadline. The first touch and the batch only persist what readers already see;
--   * the credit write (pengerjaan_kredit_darurat) locks the sitting FOR UPDATE and re-reads the watermark under that
--     lock; first touch is pengerjaan_pagar (after the person and the shared fence: no window can be lifted meanwhile);
--     the release batch also credits, SKIP LOCKED, the live unmarked sittings of the people of windows lifted in the
--     last seven days (older ones are credited at first touch, and read shifted until then).
-- Marking before the lift is unchanged (the batch), and the lift's own marking is removed.

alter table public.assessment_sessions add column darurat_dikredit_sampai timestamptz;
comment on column public.assessment_sessions.darurat_dikredit_sampai is
  'A2a C18-1: the end of the last emergency stop chain already given to this sitting (by a release or a credit); a lifted stop starting before it is never given again';

-- ═══════════════════════════════════════════════════════════ the window's people at its T_stop (set-based)
create function public.penghentian_orang(w public.maintenance_windows) returns setof uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select e.person_id from public.enrollments e join public.memberships m on m.enrollment_id = e.id
   where cardinality(w.node_ids) > 0 and m.node_id = any (w.node_ids)
     and m.valid_from <= w.t_stop and (m.valid_to is null or m.valid_to > w.t_stop)
     and e.valid_from <= w.t_stop and (e.valid_to is null or e.valid_to > w.t_stop)
  union
  select ra.person_id from public.role_assignments ra join public.org_nodes sn on sn.id = ra.scope_node_id
   where cardinality(w.node_ids) > 0 and (sn.id = any (w.node_ids) or sn.jalur && w.node_ids)
     and w.t_stop >= ra.valid_from and w.t_stop < ra.valid_until and (ra.revoked_at is null or ra.revoked_at > w.t_stop)
  union
  select e.person_id from public.enrollments e
   where not w.platform and cardinality(w.node_ids) = 0 and e.institution_id = any (w.institution_ids)
     and e.valid_from <= w.t_stop and (e.valid_to is null or e.valid_to > w.t_stop)
  union
  select ra.person_id from public.role_assignments ra join public.org_nodes sn on sn.id = ra.scope_node_id
   where not w.platform and cardinality(w.node_ids) = 0 and sn.institution_id = any (w.institution_ids)
     and w.t_stop >= ra.valid_from and w.t_stop < ra.valid_until and (ra.revoked_at is null or ra.revoked_at > w.t_stop)
$$;
revoke all on function public.penghentian_orang(public.maintenance_windows) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the pending credit
-- What lifted stops would still give this sitting, and the watermark after them. Nothing for a marked sitting (its
-- release gives it) or a final one; nothing past a chain still in force (the sitting is protected by it now).
create function public.penghentian_kredit(s public.assessment_sessions, out geser interval, out sampai timestamptz)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare w public.maintenance_windows; g interval;
begin
  geser := interval '0'; sampai := s.darurat_dikredit_sampai;
  if s.id is null or s.darurat_sejak is not null or s.status not in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED') then return; end if;
  loop
    select x.* into w from public.maintenance_windows x
     where x.kind = 'EMERGENCY' and x.t_stop is not null and x.ended_at is not null
       and (sampai is null or x.t_stop >= sampai)
       and s.created_at <= x.t_stop
       and (s.status <> 'EXPIRED' or public.pengerjaan_dalam_tenggang_pada(s, x.t_stop))
       and public.maintenance_affects_pada(x, s.person_id, x.t_stop)
     order by x.t_stop, x.id limit 1;
    exit when not found;
    g := public.penghentian_geser(s.person_id, w.id);
    exit when g is null;   -- a window of the chain is still in force: nothing past it is pending yet
    geser := geser + g; sampai := w.t_stop + g;
  end loop;
end $$;
revoke all on function public.penghentian_kredit(public.assessment_sessions) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ D1: the effective deadline includes the pending credit
create or replace function public.pengerjaan_tenggat_efektif(p_session uuid) returns timestamptz
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.authoritative_deadline,
                  (select aa.closes_at from public.assessment_assignments aa where aa.id = s.assessment_assignment_id)
                    + make_interval(secs => s.darurat_geser_detik))
         + (public.penghentian_kredit(s)).geser
    from public.assessment_sessions s where s.id = p_session
$$;

-- ═══════════════════════════════════════════════════════════ the credit, persisted once
create function public.pengerjaan_kredit_darurat(p_session uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.assessment_sessions; k record;
begin
  select * into s from public.assessment_sessions where id = p_session for update;   -- the watermark re-read under the lock
  if s.id is null then return false; end if;
  select * into k from public.penghentian_kredit(s);
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
revoke all on function public.pengerjaan_kredit_darurat(uuid) from public, anon, authenticated, service_role;

create or replace function pg_temp.a2a_sisip(p_fn regprocedure, p_anchor text, p_baru text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_anchor, ''))) / greatest(length(p_anchor), 1);
  if n <> 1 then raise exception 'A2a C18-1: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_anchor, p_baru);
end $$;

do $$
begin
  -- the guard: the credit moves the deadline (or the window-timed shift) later and the watermark forward, nothing else;
  -- the watermark never goes back
  perform pg_temp.a2a_sisip('public.pengerjaan_jaga()',
    E'  -- A2a, D6.3/D6.5: the emergency hold\n',
    E'  -- A2a C18-1: the watermark of what stops have given never goes back; a credit (no hold before or after) moves the\n'
    || E'  -- deadline or the window-timed shift later and changes nothing else\n'
    || E'  if new.darurat_dikredit_sampai is distinct from old.darurat_dikredit_sampai then\n'
    || E'    if new.darurat_dikredit_sampai is null or new.darurat_dikredit_sampai < old.darurat_dikredit_sampai then\n'
    || E'      raise exception ''what emergency stops have given a sitting is not taken back'';\n'
    || E'    end if;\n'
    || E'    if old.darurat_sejak is null and new.darurat_sejak is null then\n'
    || E'      if new.status is distinct from old.status\n'
    || E'         or (new.authoritative_deadline is distinct from old.authoritative_deadline\n'
    || E'             and (old.authoritative_deadline is null or new.authoritative_deadline < old.authoritative_deadline))\n'
    || E'         or new.darurat_geser_detik < old.darurat_geser_detik\n'
    || E'         or (old.authoritative_deadline is not null and new.darurat_geser_detik <> old.darurat_geser_detik) then\n'
    || E'        raise exception ''an emergency credit moves the deadline later and changes nothing else'';\n'
    || E'      end if;\n'
    || E'      return new;   -- the credit, checked; a release with its watermark goes on to the release''s own checks\n'
    || E'    end if;\n'
    || E'  end if;\n'
    || E'  -- A2a, D6.3/D6.5: the emergency hold\n');
  -- the release writes the watermark: the end of the chain it gave
  perform pg_temp.a2a_sisip('public.pengerjaan_lepas_darurat(uuid)',
    E'set authoritative_deadline = s.authoritative_deadline + v_geser, darurat_sejak = null, darurat_jendela_id = null where id = s.id;',
    E'set authoritative_deadline = s.authoritative_deadline + v_geser, darurat_sejak = null, darurat_jendela_id = null,\n'
    || E'           darurat_dikredit_sampai = greatest(coalesce(s.darurat_dikredit_sampai, s.darurat_sejak + v_geser), s.darurat_sejak + v_geser)\n'
    || E'     where id = s.id;');
  perform pg_temp.a2a_sisip('public.pengerjaan_lepas_darurat(uuid)',
    E'           darurat_jendela_id = null\n     where id = s.id;',
    E'           darurat_jendela_id = null,\n'
    || E'           darurat_dikredit_sampai = greatest(coalesce(s.darurat_dikredit_sampai, s.darurat_sejak + v_geser), s.darurat_sejak + v_geser)\n'
    || E'     where id = s.id;');
  -- first touch: after the release, the credit (an unlocked look first: no window can be lifted while this transaction
  -- holds the shared fence, and the credit re-reads under the sitting's lock)
  perform pg_temp.a2a_sisip('public.pengerjaan_pagar(uuid)',
    E'  return false;\nend',
    E'  if exists (select 1 from public.assessment_sessions a, public.maintenance_windows x\n'
    || E'              where a.id = p_session and a.darurat_sejak is null and x.kind = ''EMERGENCY'' and x.t_stop is not null\n'
    || E'                and x.ended_at is not null and a.created_at <= x.t_stop\n'
    || E'                and (a.darurat_dikredit_sampai is null or x.t_stop >= a.darurat_dikredit_sampai)) then\n'
    || E'    perform public.pengerjaan_kredit_darurat(p_session);   -- C18-1: the first touch credits once\n'
    || E'  end if;\n'
    || E'  return false;\nend');
  -- the lift no longer marks (C18-1); it records T_lift under the exclusive fence, as before
  perform pg_temp.a2a_sisip('public.change_maintenance(uuid,text,text)',
    E'    if v_lift is not null then v_tandai := public.pengerjaan_tandai_saat_angkat(w.id); end if;\n', E'');
  perform pg_temp.a2a_sisip('public.change_maintenance(uuid,text,text)',
    E', ''marked_at_lift'', v_tandai', E'');
  -- D1: the read-only readers read the effective deadline, pending credit included
  perform pg_temp.a2a_sisip('public.session_state(uuid)',
    E'    select s.status, s.mode, d.allows_pause, s.authoritative_deadline,',
    E'    select s.status, s.mode, d.allows_pause,\n'
    || E'           case when s.authoritative_deadline is null then null else public.pengerjaan_tenggat_efektif(s.id) end,');
  perform pg_temp.a2a_sisip('public.may_continue_session(uuid)',
    E'  if v.authoritative_deadline is not null and now() >= v.authoritative_deadline then',
    E'  if v.authoritative_deadline is not null and now() >= public.pengerjaan_tenggat_efektif(v.id) then');
  perform pg_temp.a2a_sisip('public.maintenance_draining(uuid)',
    E'else now() <= s.authoritative_deadline',
    E'else now() <= public.pengerjaan_tenggat_efektif(s.id)');
  perform pg_temp.a2a_sisip('public.daftar_pengerjaan(uuid,uuid)',
    E'(select coalesce(s.authoritative_deadline, aa.closes_at + make_interval(secs => s.darurat_geser_detik)) as tenggat)',
    E'(select public.pengerjaan_tenggat_efektif(s.id) as tenggat)');
end $$;
drop function public.pengerjaan_tandai_saat_angkat(uuid);

-- ═══════════════════════════════════════════════════════════ the release batch credits too
create or replace procedure public.pengerjaan_lepas_darurat_semua(p_batas integer default 200)
language plpgsql as $$
declare r record; n integer;
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
  -- C18-1: the credits of unmarked sittings of windows lifted in the last seven days, from their people, SKIP LOCKED
  loop
    n := 0;
    for r in select distinct s.id
               from public.maintenance_windows w
               join public.assessment_sessions s
                 on s.darurat_sejak is null and s.status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')
                and s.created_at <= w.t_stop and (s.darurat_dikredit_sampai is null or w.t_stop >= s.darurat_dikredit_sampai)
                and (w.platform or s.person_id in (select o from public.penghentian_orang(w) o))
              where w.kind = 'EMERGENCY' and w.t_stop is not null and w.ended_at is not null
                and coalesce(w.t_lift, w.ended_at) > now() - interval '7 days'
              order by s.id limit p_batas loop
      if public.pengerjaan_kredit_darurat(r.id) then n := n + 1; end if;
    end loop;
    commit;
    exit when n = 0;
  end loop;
end $$;
revoke all on procedure public.pengerjaan_lepas_darurat_semua(integer) from public, anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare r record;
begin
  for r in select x::regprocedure as fn from unnest(array['public.penghentian_orang(public.maintenance_windows)',
      'public.penghentian_kredit(public.assessment_sessions)', 'public.pengerjaan_kredit_darurat(uuid)']) x loop
    if has_function_privilege('anon', r.fn, 'execute') or has_function_privilege('authenticated', r.fn, 'execute')
       or has_function_privilege('service_role', r.fn, 'execute') then
      raise exception 'A2a C18-1: % is callable by a client or the server key', r.fn;
    end if;
  end loop;
  if position('pengerjaan_kredit_darurat(' in pg_get_functiondef('public.pengerjaan_pagar(uuid)'::regprocedure)) = 0 then
    raise exception 'A2a C18-1: the first touch does not credit';
  end if;
  if position('pengerjaan_tandai_saat_angkat' in pg_get_functiondef('public.change_maintenance(uuid,text,text)'::regprocedure)) > 0 then
    raise exception 'A2a C18-1: the lift still marks';
  end if;
end $$;
