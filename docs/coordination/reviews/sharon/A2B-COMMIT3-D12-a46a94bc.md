# A2b · early read of commit 3 (D4) and D1-2

Sharon, 16 Nov 2026 (04:10 UTC). Read-only.
- commit 3, `38a4b34f73a59406cfe64d578d2e7f961175f036`, migration `20270120120000`;
- D1-2, `a46a94bc3a704613e34d7b48f1d22e600d693fc2`, migration `20270120130000`.

Acknowledged on receipt.

## What holds now

- **NO BLOCKER on either.**
- **D1-2 is closed.**
- **The two sibling readers: yes, change them as proposed (D1-3).** One commit, with a test and a plant.

## Commit 3 (D4)

**`maintenance_mulai_tolak(person, node, deadline)`, on `clock_timestamp()`, in this order:**
1. the place is active: PLACE;
2. a PLANNED window within T−15: NO_NEW_START, as today;
3. the new sitting's own `authoritative_deadline` after a coming window's start: `MAINTENANCE_CANNOT_FINISH`, with the window's start in the hint;
4. an untimed sitting, with no deadline, meets T−15 only (K4).

**Where it applies:** platform-wide windows, and the work's school or class through `jalur`.
- The sitting-insert trigger and `may_start_assessment` give the same answer.
- The node is the learner's own placement under the assignment's node.

## D1-2: closed

**What it does:**
- `pengerjaan_tenggat_efektif` adds, for a marked sitting not held by A1, `penghentian_geser(person, darurat_jendela_id)`;
- that is zero while the stop is in force and zero after the release, which is exactly what the release writes.

**A2B-D12:**
- a sitting marked by a 45-minute stop, lifted, with no batch and no touch;
- `efektif`, `session_state`, `pengerjaan_saya` and `daftar_pengerjaan` read +900 s; `may_continue_session` is OK, and `maintenance_draining` is true;
- the release changes nothing a reader shows;
- the plant fails it, and K5 asserts the drain before the first touch.

## D1-3 · the two siblings: yes, as proposed

- `pengerjaan_saya` shows the learner `ditahan: true`, and `pengerjaan_terbuka_saya` leaves the sitting out, between the lift and the first touch. Both read a stale mark through `pengerjaan_ditahan(s)`.
- **In those two read-only readers:** held means (A1-frozen and not unfrozen) **or** `pengerjaan_dilindungi(s.id)`. That is C41-2's rule.
- **The decider keeps `pengerjaan_ditahan`,** because it touches first.
- **Test:** in D12's fixture, both readers show the sitting as open and offered. Add a plant.
- **Sweep once more,** under rule 3: any other stable reader of `pengerjaan_ditahan`, listed in the commit.

## Addendum (04:25 UTC): commit 4, the status read (`8509224a34526914dd712e880c56d13ba67d8acf`). NO BLOCKER

**`pintar_status_saya` gives each window:**
- `cakupan`: ORANG for an EMERGENCY or a platform-wide PLANNED window, and TEMPAT for a class or school PLANNED window. Only ORANG redirects.
- `kelas` and `kelas_lain` for a class window of either kind;
- `sekolah`;
- `zona`.

**The listing is unchanged** (`maintenance_affects`), so a work-scoped window reaches only the people with work in its place. A2B-S01 shows it: 7B's learner does not see 7A's window.

**`zona_saya(person)`:**
- the zone of the person's active enrolment's school, else their active role's, else Asia/Jakarta;
- internal, and revoked from every role.

**Your question: "the active enrolment, else the active role" is the right reading for a platform window.**
- D8 asks for each reader's own school's zone. A person at two schools is shown the zone of their latest enrolment: one zone, which is clear.
- **Register it:** a person whose schools lie in two zones, if Daisy wants both shown.
