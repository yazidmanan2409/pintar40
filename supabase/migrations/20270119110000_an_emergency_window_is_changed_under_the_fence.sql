-- A2a, change C · Sharon's B1 (early read of A2a's page): change_maintenance on an EMERGENCY window takes the fence
-- before the window row. DRAFT, pushed unfinished for Sharon's early read.
--
-- Before: change_maintenance locked the window row FOR UPDATE first. A2a's lift takes the fence and then the window
-- row (§6's order: … → the fence → maintenance_windows → sittings). So one path went window → fence and the other
-- fence → window, and two lifts of one window could deadlock (40P01).
--
-- After: it reads the window's kind without a lock. On an EMERGENCY window it takes the exclusive fence
-- (pagar_darurat_eksklusif, 1500ms) and only then locks the window row. A PLANNED window is unchanged: it takes no fence.
-- A window's kind never changes after it is scheduled, so the unlocked read decides correctly.
--
-- Not yet here (A2a's D6, later in change C): AKHIRI on an EMERGENCY window going through the fenced lift (T_lift
-- read under the fence, the held sittings released). This migration fixes the order only.
-- Nothing else changes: the signature, owner, grants, volatility and security are kept.

do $$
declare v text := pg_get_functiondef('public.change_maintenance(uuid,text,text)'::regprocedure);
        v_old text := E'  select * into w from public.maintenance_windows where id = p_window for update;\n';
        n int;
begin
  n := (length(v) - length(replace(v, v_old, ''))) / length(v_old);
  if n <> 1 then raise exception 'A2a B1: change_maintenance has its anchor % time(s), not once', n; end if;
  execute replace(v, v_old,
    E'  -- A2a B1 (Sharon): an EMERGENCY window is changed under the fence, taken before its row\n'
    || E'  if (select x.kind from public.maintenance_windows x where x.id = p_window) = ''EMERGENCY'' then\n'
    || E'    perform public.pagar_darurat_eksklusif();\n'
    || E'  end if;\n'
    || v_old);
end $$;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare v text := pg_get_functiondef('public.change_maintenance(uuid,text,text)'::regprocedure);
        f int := position('perform public.pagar_darurat_eksklusif();' in v);
        w int := position('from public.maintenance_windows where id = p_window for update' in v);
begin
  if f = 0 or w = 0 or f > w then
    raise exception 'A2a B1: change_maintenance does not take the fence before an EMERGENCY window''s row';
  end if;
end $$;
