-- 0038 — FABLE-04 §1 / roadmap §3.2: the mode vocabulary, completed additively.
--
-- WHY ADDITIVE AND NOT A RENAME. `mode::text` is inside the frozen
-- `PINTAR-CONTENT-SHA256/1` canonical payload (ADR-0004 §2), so renaming a
-- label would change the content hash of every sealed release that carries an
-- assessment definition -- silently invalidating certificates that bind to it.
-- ADR-0005 §2 already settled this for FABLE-03 by MAPPING the phase prompt's
-- vocabulary onto the four existing labels rather than renaming them. FABLE-04
-- needs five more modes that have no existing label to map onto, so they are
-- ADDED. Adding a label changes no existing row's `mode::text`, so no existing
-- hash moves -- and that is proven by test (F04-T01), not asserted here.
--
-- THE COMPLETE MAPPING, recorded in ADR-0006:
--
--   phase vocabulary          enum label        introduced
--   ------------------------  ----------------  ----------
--   LEARNING_CYCLE_PRETEST    PRE_TEST          FABLE-02 (mapped, ADR-0005 §2)
--   LEARNING_CYCLE_POSTTEST   POST_TEST         FABLE-02 (mapped, ADR-0005 §2)
--   QUICK_ASSESSMENT          QUICK             FABLE-02 (mapped, ADR-0005 §2)
--   (standalone assessment)   STANDALONE        FABLE-02
--   PRACTICE                  PRACTICE          FABLE-04 (added here)
--   TEST                      TEST              FABLE-04 (added here)
--   EXAM                      EXAM              FABLE-04 (added here)
--   PUBLIC_DEMO               PUBLIC_DEMO       FABLE-04 (added here)
--   PAPER                     PAPER             FABLE-04 (added here)
--
-- `QUICK` keeps its short label rather than becoming `QUICK_ASSESSMENT`: the
-- rename is forbidden for the hash reason above, and the mapping is what the
-- ADR is for.
--
-- NOTHING ELSE IS IN THIS MIGRATION. A new enum label cannot be USED in the
-- transaction that adds it, so every function, constraint and policy that
-- mentions the new modes lands in 0039 and later. This is the 0033 lesson
-- applied deliberately rather than rediscovered.

alter type public.assessment_mode add value if not exists 'PRACTICE';
alter type public.assessment_mode add value if not exists 'TEST';
alter type public.assessment_mode add value if not exists 'EXAM';
alter type public.assessment_mode add value if not exists 'PUBLIC_DEMO';
alter type public.assessment_mode add value if not exists 'PAPER';

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003).
--
-- Structural only, deliberately: the behavioural half -- that a sealed
-- course's content hash is byte-identical across this migration -- cannot be
-- asserted from inside the transaction that adds the labels, and needs a
-- before/after comparison across the migration boundary anyway. That is
-- F04-T01, which captures the hash of every sealed release before the
-- migration series runs and recomputes it after.
-- ---------------------------------------------------------------------------
do $$
declare v_labels text[]; v_missing text[]; v text;
begin
  select array_agg(e.enumlabel::text order by e.enumsortorder) into v_labels
    from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'assessment_mode';

  -- the four original labels are still present, spelled exactly as before
  foreach v in array array['PRE_TEST','POST_TEST','QUICK','STANDALONE'] loop
    if not (v = any (v_labels)) then
      raise exception 'existing mode label % disappeared: every sealed content hash carrying it would move', v;
    end if;
  end loop;

  -- and the five new ones arrived
  v_missing := '{}';
  foreach v in array array['PRACTICE','TEST','EXAM','PUBLIC_DEMO','PAPER'] loop
    if not (v = any (v_labels)) then v_missing := v_missing || v; end if;
  end loop;
  if array_length(v_missing, 1) > 0 then
    raise exception 'mode label(s) not added: %', array_to_string(v_missing, ', ');
  end if;

  if array_length(v_labels, 1) <> 9 then
    raise exception 'assessment_mode carries % labels, expected 9: %', array_length(v_labels, 1),
      array_to_string(v_labels, ', ');
  end if;
end $$;
