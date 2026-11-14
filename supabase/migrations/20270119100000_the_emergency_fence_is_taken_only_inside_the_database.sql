-- A2a, change C · the emergency fence (D6.1; Sharon's ruling, Part 2 row 5; her required setting, early read §6).
-- DRAFT, pushed unfinished for Sharon's early read.
--
-- The fence is a transaction-level advisory lock on one fixed key, taken only inside database functions reached
-- through PostgREST (an RPC) or pg_cron (the closer's CALL), never by a client through the pooler and never by the
-- app's own code. Each RPC, and each of the closer's batches, is one transaction, so a transaction-level lock lives
-- exactly as long as the decision it fences.
--
-- Two functions on one key, because the two sides need two lock timeouts and a SET clause holds one value per
-- function. A SET clause applies only while the function runs; the lock it takes lasts to the end of the transaction,
-- and the caller's own lock_timeout is untouched (set_config(…, true) would have left the short timeout on every later
-- row lock in the caller's transaction).
--   pagar_darurat_eksklusif()  lock_timeout 1500ms  the activation and the lift
--   pagar_darurat_bersama()    lock_timeout 2s      every protected decision, and each of the closer's batches
-- Every fenced decision calls one of them as its first lock after the lifecycle ranks (A2A-L01's rule B1).
--
-- The key: 7201190000000001 ("A2a, 19 Jan 2027, the fence"), fixed, named only here.

create function public.pagar_darurat_eksklusif() returns void
language plpgsql security definer set search_path = public, pg_temp set lock_timeout = '1500ms' as $$
begin
  perform pg_advisory_xact_lock(7201190000000001);
end $$;

create function public.pagar_darurat_bersama() returns void
language plpgsql security definer set search_path = public, pg_temp set lock_timeout = '2s' as $$
begin
  perform pg_advisory_xact_lock_shared(7201190000000001);
end $$;

-- Only the fenced functions call them; no client does.
revoke all on function public.pagar_darurat_eksklusif() from public, anon, authenticated;
revoke all on function public.pagar_darurat_bersama() from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════ the migration's own check (ADR-0003: structural)
do $$
declare r record;
begin
  for r in select * from (values ('public.pagar_darurat_eksklusif()', 'lock_timeout=1500ms'),
                                 ('public.pagar_darurat_bersama()', 'lock_timeout=2s')) t(fn, setelan) loop
    if not exists (select 1 from pg_proc p where p.oid = r.fn::regprocedure and r.setelan = any (p.proconfig)) then
      raise exception 'A2a fence: % does not carry its SET clause %', r.fn, r.setelan;
    end if;
    if has_function_privilege('anon', r.fn, 'execute') or has_function_privilege('authenticated', r.fn, 'execute') then
      raise exception 'A2a fence: % is callable by a client', r.fn;
    end if;
  end loop;
end $$;
