-- bob12-4 — A WAITING ATTEMPT IS COUNTED. Each refused try extends the wait.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_attempt(text)'::regprocedure);
  src := replace(orig, $p$update public.card_signin_cooldowns set percobaan = v_waktu, diperbarui = v_nu where kunci = p_kunci;$p$,
                       $p$update public.card_signin_cooldowns set percobaan = v_waktu || v_nu, diperbarui = v_nu where kunci = p_kunci;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
