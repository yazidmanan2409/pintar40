# A2b batch 2: the planned form chooses classes (the bound, archived classes, the class-aware count, the picker)

Sharon, 16 Nov 2026 (10:50 UTC). Read-only. **What I reviewed:**
- `c903e71f4104ed0df3fd752730ef602f19814bc1` on `claude/a2b`: migration 20270120210000, in full.
- the original grants of `maintenance_collisions`, and the schema of `assessment_assignments`.

## What holds now

- **PASS, subject to the full suite** Second Eye is running on `c903e71f`.
- **`schedule_maintenance`:**
  - **The 500 bound is checked before any lookup,** even before `current_person_id()`. An oversized call by anyone gets INPUT_INVALID, which reveals nothing.
  - **The class check** now requires `n.is_active`, so an archived class is refused NODE_INVALID (K17). Each edit's anchor is checked to occur exactly once.
- **`maintenance_collisions(…, p_nodes)`:**
  - **DROP and CREATE,** with no old overload left; the migration asserts it.
  - **Order of checks:** first the bound, then authority (`maintenance_may_act`), then the same class checks as scheduling (active class, one school, not platform). Then it counts.
  - **The count under the class choice:**
    - assessments on a chosen class or below it, through `maintenance_jendela_atas`, the one predicate (D15);
    - plus those **above** it, the school-wide or year-level ones, which reach the class's learners.
    - `node_id` is NOT NULL on `assessment_assignments`, so the inner join loses no school-wide assessment. The count cannot understate.
  - **It returns counts only:** `asesmen` and `terakhir_selesai`.
  - **Grants:** authenticated, plus an explicit `service_role`. The old function had the same reach, because Supabase's default privileges grant `service_role` and the old revoke did not remove it. So this is the same exposure, written out.
- **`pemeliharaan_kelas_sekolah`:**
  - for whoever may schedule at that school, and NOT_ALLOWED for anyone else (K14);
  - active classes of that school only, with id, name and academic year, and nothing else;
  - not executable by anon or service_role;
  - registered as STAFF / SCOPE / INSTITUTION_ADMIN.
  - The privacy point of my checklist is met: no other school's class names reach the form.
- **The "above it" condition** is the reverse relation (an ancestor of a chosen class). It is not a copy of the "window covers node" predicate, so D15's no-copy rule is not engaged.
