-- A3's staging promotion, STEP 0 of the BEFORE read (Sharon, f6d3a2cb, A3-PRESERVATION-8cb312ee.md, point 2).
-- DRAFT for Sharon's check (Bob, 18 Nov). It is run under the owner's authorisation for the BEFORE read, before it, in
-- the same read-only transaction. READ ONLY: plain SELECTs that write out the predicates of 20270121210000's
-- garis_definisi_pendahulu and garis_definisi_periksa, and the backfill's cycle check. They must agree with those
-- functions exactly, and the copy is re-checked against the frozen head. The step records counts and ids only, never a
-- title.
--
-- Lines 1 and 2 must both read "0". Any other value stops the promotion before migrating. The migration would raise
-- on it anyway, but step 0 finds it without starting a migration.
--
-- Local proof (Sharon): plant an ambiguous chain (two same-titled, same-mode, non-ad-hoc definitions in the superseded
-- course). Line 1 then reads 1 with that id, and the migration aborts cleanly at garis_definisi_periksa, leaving 284.
begin transaction read only;
with recursive pendahulu as (   -- garis_definisi_pendahulu(d.id), for every d at once
  select d.id as def, d0.id as pred
    from public.assessment_definitions d
    join public.assessment_definitions d0
      on d0.institution_id = d.institution_id and d0.title = d.title and d0.mode = d.mode
     and not d0.is_ad_hoc and d0.id <> d.id
   where not d.is_ad_hoc
     and ((d.course_id is not null
           and d0.course_id = (select c.supersedes_course_id from public.courses c where c.id = d.course_id))
       or (d.module_id is not null
           and d0.module_id = (select m.supersedes_module_id from public.modules m where m.id = d.module_id)))
),
ambigu as (select def, count(*) n from pendahulu group by def having count(*) > 1),
-- the backfill: roots are definitions with no predecessor; the rest inherit along their single predecessor.
-- A definition that never reaches a root is in, or hangs below, a cycle.
jalur(def) as (
  select d.id from public.assessment_definitions d where not exists (select 1 from pendahulu p where p.def = d.id)
  union
  select p.def from pendahulu p join jalur j on j.def = p.pred
),
tanpa_akar as (select d.id from public.assessment_definitions d where d.id not in (select def from jalur))
select 1 as n, 'definitions with more than one predecessor (must be 0)' as garis,
       (select count(*) || coalesce(': ' || string_agg(def::text || ' (' || n || ')', ', ' order by def), '') from ambigu) as nilai
union all
select 2, 'definitions that reach no root (a cycle; must be 0)',
       (select count(*) || coalesce(': ' || string_agg(id::text, ', ' order by id), '') from tanpa_akar)
union all
select 3, 'state: definitions, roots, with a predecessor',
       (select count(*) || ', ' || count(*) filter (where not exists (select 1 from pendahulu p where p.def = d.id)) || ', '
               || count(*) filter (where exists (select 1 from pendahulu p where p.def = d.id))
          from public.assessment_definitions d)
order by n;
rollback;
-- Note: with an ambiguous definition (line 1 above 0) the migration stops at garis_definisi_periksa before the
-- backfill, so line 2 can then over-count. Line 1 governs.
