-- Ruling 79's audit world (track 3c), fixture W8 (J3's «the gate unknown»): a per-journey fixture, applied to the world
-- already loaded (muat.sh --fiksasi w8), never part of the shared world. Apply it on a fresh world (not after W7).
--   Sinta's result (J3's, in the dev/CI bootstrap tenant: 83 % against 60 %) with its gate UNREADABLE: the result row's safety_gate_passed is null, as a
--   result recorded before the gate was stored reads, and as Z's captures met it (a read that is withheld or fails gives
--   the screens the same null). Due on all three surfaces: «…tak_diketahui», and nobody pre-ticked.
--   A FIXTURE-ONLY STATE, WRITTEN PAST TODAY'S GUARD: a result row is written only by scoring (assessment_results_write),
--   so that one trigger is disabled ON THE TABLE FOR THIS ONE UPDATE (DISABLE TRIGGER is table-wide; the fixture's one
--   transaction holds the table's exclusive lock until it is enabled again, at once), as the selftests do for theirs.
--   The fixture fails unless the trigger is enabled again. Its captures are labelled «keadaan fiksasi (dibuat melewati
--   penjaga hari ini)».
do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
do $$
declare s uuid := dunia.ambil('j3.sesi')::uuid; n int;
begin
  perform dunia.jaga();
  alter table public.assessment_results disable trigger assessment_results_write;
  update public.assessment_results set safety_gate_passed = null where session_id = s and supersedes_result_id is null;
  get diagnostics n = row_count;
  alter table public.assessment_results enable trigger assessment_results_write;
  if n <> 1 then raise exception 'W8: expected one result for Sinta''s sitting, found %', n; end if;
  if (select tgenabled from pg_trigger where tgrelid = 'public.assessment_results'::regclass
       and tgname = 'assessment_results_write') <> 'O' then
    raise exception 'W8: assessment_results_write is not enabled again';
  end if;
  raise notice 'dunia: W8 (Sinta''s result with its gate unreadable)';
end $$;
