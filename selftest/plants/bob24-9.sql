-- bob24-9 — A SUSPENSION WEARS OFF. The 30-day decay also lifts a suspended ID, so waiting a month buys three more guesses.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.recovery_attempt(text, text)'::regprocedure);
  src := replace(orig, $p$if r.level < 3 and r.last_failure_at is not null$p$, $p$if r.last_failure_at is not null$p$);
  src := replace(src, $p$r.level := 0; r.failures := 0; r.locked_until := null;$p$,
    $p$r.level := 0; r.failures := 0; r.locked_until := null; r.suspended_at := null;
    update public.recovery_ladder set level = 0, failures = 0, locked_until = null, suspended_at = null where typed_id = v_id;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
