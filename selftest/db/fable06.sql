-- FABLE-06 database suite.
--
-- Ordering: depends on fable01.sql (role-switch helpers) and fable04.sql
-- (the bootstrap-tenant fixture and its purge). Never applied as a migration;
-- never present in production.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.purge_certificates()') is null
     or to_regprocedure('selftest.first_presented_of_type(uuid, text)') is null then
    raise exception 'apply fable01.sql and fable04.sql before fable06.sql';
  end if;
end $$;

create or replace function selftest.run_fable06()
returns table(id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  aa uuid; s uuid; v_pi uuid; v_item uuid; v_proj jsonb; v_txt text;
  v_secret text; v_correct text; n int;
begin
  -- =========================================================================
  -- F06-P01 -- sanitized_item, executed to a SUCCESSFUL RETURN.
  --
  -- WHY THIS TEST EXISTS. The happy-path sweep found that `sanitized_item` --
  -- the function deciding what a learner may see of a question -- had never
  -- run to a successful return under any migration, seed or test. It was read
  -- and it is correct. Nothing said so.
  --
  -- AND WHY IT ASSERTS ABSENCE, NOT PRESENCE. A probe that checked "it
  -- returned something" would pass on a function that returned EVERYTHING.
  -- So this takes the item's real rationale text and its real correct-option
  -- label out of the database, and requires neither to appear anywhere in the
  -- projection -- the secret itself, not a guess at what the key is called.
  -- =========================================================================
  perform selftest.purge_certificates();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  select m.post_test_assignment into aa from public.my_learning_assignments() m limit 1;
  if aa is null then
    id:='F06-P01'; area:='learner projection'; ok:=false;
    detail:='the bootstrap learner sees no post-test assignment'; return next; return;
  end if;
  s := public.start_learning_session(aa);
  v_pi := selftest.first_presented_of_type(s, 'MCQ_SINGLE');

  -- the projection, as the learner who owns the session
  v_proj := public.sanitized_item(v_pi);
  v_txt := v_proj::text;

  perform selftest.as_owner();
  select p.item_id into v_item from public.presented_items p where p.id = v_pi;
  -- the actual secrets held for this item
  select o.rationale into v_secret from public.item_options o
   where o.item_id = v_item and o.rationale is not null and length(o.rationale) > 3 limit 1;
  select o.label into v_correct from public.item_options o
   where o.item_id = v_item and o.is_correct limit 1;

  id := 'F06-P01'; area := 'INV-13 learner projection / happy-path sweep';
  ok := true; detail := '';
  if v_proj is null then
    ok := false; detail := 'sanitized_item returned null for an item in the caller''s own session';
  elsif not (v_proj ? 'stem') then
    ok := false; detail := 'the projection carries no stem: a learner cannot read the question';
  elsif v_secret is not null and position(v_secret in v_txt) > 0 then
    ok := false; detail := 'the projection contains an option RATIONALE verbatim: ' || left(v_secret, 40);
  elsif v_txt ~* '"(is_correct|benar|rationale|alasan|misconception_code|kunci)"' then
    ok := false; detail := 'the projection carries a correctness-shaped key: ' || left(v_txt, 120);
  elsif jsonb_typeof(v_proj -> 'opsi') = 'array'
        and exists (select 1 from jsonb_array_elements(v_proj -> 'opsi') e
                     where e ? 'is_correct' or e ? 'label') then
    ok := false; detail := 'an option carries its identity or its correctness flag';
  else
    -- and every key present is one the declared safe set permits
    select string_agg(k, ', ') into v_txt from jsonb_object_keys(v_proj) k
     where k not in ('item_type', 'stem', 'stimulus', 'opsi');
    if v_txt is not null then
      ok := false; detail := 'the projection carries key(s) outside the declared safe set: ' || v_txt;
    else
      detail := 'sanitized_item executed to a successful return and the projection carries the stem and '
             || 'options only: the option rationale held for this item appears nowhere in it, no '
             || 'correctness-shaped key is present, no option carries its own label, and every key is '
             || 'inside the declared set {item_type, stem, stimulus, opsi}';
    end if;
  end if;
  return next;

  -- =========================================================================
  -- F06-N01 -- the same call, by somebody else, discloses nothing -- INCLUDING
  -- whether the item exists. Existence and ownership answer identically.
  -- =========================================================================
  declare v_a text; v_b text; v_fake uuid := gen_random_uuid();
  begin
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    begin
      perform public.sanitized_item(v_pi);
      v_a := '(no refusal)';
    exception when others then v_a := sqlerrm; end;
    begin
      perform public.sanitized_item(v_fake);
      v_b := '(no refusal)';
    exception when others then v_b := sqlerrm; end;
    perform selftest.as_owner();

    id := 'F06-N01'; area := 'INV-13 / oracle removal';
    if v_a = '(no refusal)' then
      ok := false; detail := 'another person read a learner''s item projection';
    elsif v_b = '(no refusal)' then
      ok := false; detail := 'a fabricated presented-item id was accepted';
    elsif v_a is distinct from v_b then
      ok := false;
      detail := 'a real item and a fabricated one answer differently, so existence is an oracle: '
             || left(v_a, 60) || ' / ' || left(v_b, 60);
    else
      ok := true;
      detail := 'a real item belonging to someone else and a uuid that does not exist produce the '
             || 'identical refusal, so a caller learns nothing about which it was: "' || left(v_a, 70) || '"';
    end if;
    return next;
  end;

  -- =========================================================================
  -- F06-P02 -- the declared projection boundary holds on this database.
  -- =========================================================================
  id := 'F06-P02'; area := 'INV-13 / §3.4 applied to a boundary';
  select a.ok, a.detail into ok, detail from public.assert_learner_projection_is_closed() a;
  return next;

  perform selftest.purge_certificates();
  id := 'F06-DONE'; area := 'suite'; ok := true; detail := 'FABLE-06 suite complete';
  return next;
end $$;
revoke all on function selftest.run_fable06() from public;
