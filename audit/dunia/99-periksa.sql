-- Ruling 79's audit world (track 3c), the last part: the load's own checks, in the same transaction, so a world that
-- fails one is never left behind.
--   * Every guard trigger a world part disabled is ENABLED again (Bob, W4: pg_trigger.tgenabled = 'O').
--   * Every seeded row of the dev/CI bootstrap tenant is unchanged, and none is gone (Bob, W14/W18 condition 1): the
--     fingerprints 11-w14.sql took before the world touched the tenant, compared row by row (the institution's own row
--     without its namespace, which the world sets: X9W, world-only).
do $$
declare t record;
begin
  for t in select c.relname, g.tgname, g.tgenabled from pg_trigger g join pg_class c on c.oid = g.tgrelid
            where (c.relname, g.tgname) in (('assessment_assignments', 'assessment_assignments_the_pass_mark_is_sealed'),
                                            ('assessment_results', 'assessment_results_write')) loop
    if t.tgenabled <> 'O' then raise exception 'dunia: the guard % on % is not enabled again (%)', t.tgname, t.relname, t.tgenabled; end if;
  end loop;
  if (select count(*) from pg_trigger g join pg_class c on c.oid = g.tgrelid
       where (c.relname, g.tgname) in (('assessment_assignments', 'assessment_assignments_the_pass_mark_is_sealed'),
                                       ('assessment_results', 'assessment_results_write'))) <> 2 then
    raise exception 'dunia: a guard trigger the world names is missing';
  end if;
  raise notice 'dunia: checks passed (every disabled guard is enabled again)';
end $$;

do $$
declare t text; n_beda int := 0; n_hilang int := 0; b uuid := dunia.ambil('boot.sekolah')::uuid;
begin
  for t in select distinct tabel from dunia.benih where tabel <> 'institutions' loop
    execute format('select count(*) filter (where x.id is null), count(*) filter (where x.id is not null and md5(row_to_json(x)::text) <> d.sidik)
                      from dunia.benih d left join public.%I x on x.id::text = d.id where d.tabel = %L', t, t)
      into n_hilang, n_beda;
    if n_hilang > 0 or n_beda > 0 then
      raise exception 'dunia: the bootstrap tenant''s seeded rows in % changed (% gone, % altered)', t, n_hilang, n_beda;
    end if;
  end loop;
  if (select md5((to_jsonb(i) - 'namespace')::text) from public.institutions i where i.id = b)
     <> (select sidik from dunia.benih where tabel = 'institutions') then
    raise exception 'dunia: the bootstrap tenant''s own row changed beyond its namespace';
  end if;
  raise notice 'dunia: checks passed (% seeded row(s) of the bootstrap tenant unchanged)', (select count(*) from dunia.benih);
end $$;
