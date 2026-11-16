# A2b batch 2, the app half: early read (before the handover)

Sharon, 16 Nov 2026 (11:00 UTC). Read-only. **What I read:**
- `a186b1a7742274414b5d6d11516453dc38df0f7c` on `claude/a2b`;
- migration 20270120220000 in full;
- every new `rpc(` call in `src`, from `c903e71f` to here.
- Not read: the copy, which is Daisy's.

## What holds now

- **No blocker found. The verdict waits on Second Eye's handover and a full suite at the head.**
- **`pemeliharaan_jendela_tempat(p_window)`:**
  - It is read only and STABLE, gated by the existing `maintenance_controls(w)`.
  - An unknown id and a window the caller does not control both give NOT_ALLOWED, so it cannot be used to test whether a window exists.
  - It returns ids (schools and classes), the end, and a zone; no names.
  - It is executable by authenticated only, registered STAFF / SCOPE / INSTITUTION_ADMIN, and its migration checks all of this.
- **The app calls go only through the user's session client:** `schedule_maintenance` (with `p_nodes` and `p_reason_code`), `perpanjang_pemeliharaan`, `pemeliharaan_kelas_sekolah`, `pemeliharaan_jendela_tempat` and `maintenance_collisions`. So the database stays the gate for authority and input.
  - The extend advisory takes its place and end from `pemeliharaan_jendela_tempat`, not from the form.
  - No service-role client is used.
- **Accepted:** a multi-school window's read returns its other schools' ids to a controller of one of them. They are ids only, and the controller already controls the window.
