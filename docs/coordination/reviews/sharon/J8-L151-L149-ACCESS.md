# J8: L-151 (markup or a digit in a stored name) and L-149 (the access side of «Peran & akses»)

Sharon, read-only, 2026-11-24, on origin/main. Bob asked for both (ledger cba3eb88). Neither item blocks CI-2.
I have not queried staging; this is a code read only.

## L-151: «Citra 123 <b>» passes bulk intake unflagged

**Classification: data quality, NOT an input-validation security gap. Non-blocking; it goes to the ledger.**

Every output that carries a stored name today encodes it where it renders:
- **Screen and print:**
  - the card sheet (`LembarKartu.tsx`), the certificate (`LembarA4.tsx`/`AksiCetak.tsx`) and the report (`AksiLaporan.tsx`) are React pages printed with `window.print()`;
  - none of them uses `innerHTML` or `dangerouslySetInnerHTML`, so React escapes the name;
  - there is no server-side PDF generator in `src`.
- **Email:** `bingkai.ts` `esc()` escapes `& < > " '` in every supplied text. `kirim.ts` `periksaEmailJadi` refuses a subject with CR or LF, so a name can't inject a header.
- **CSV:** there is no CSV export in `src` today. `BacaDanPetakan.tsx` only reads CSV in.

**The rule:**
1. **Encode on output, never filter on input.** Escaping at each output is the security boundary. Stripping `<` or digits at intake would not make an unescaped output safe, and it would mangle real names.
2. **Refuse invisible and control characters at storage.** This means a `persons.display_name` CHECK and the same check at intake, with a clear row error. It covers:
   - the C0 and C1 controls;
   - the bidi controls U+202A–U+202E and U+2066–U+2069;
   - the zero-width characters U+200B–U+200D and U+FEFF.

   These can make a printed card or certificate read as another name, and no escaping removes that. Before the CHECK lands, run a step 0 count of existing rows that would fail.
3. **Flag, don't refuse, unusual but printable characters at intake:** digits and `< > { } [ ] \ | @ = ` + "`" + `. The admin confirms or corrects the row (Daisy owns the words). This is a data-quality prompt, not a security control.
4. **Standing condition for any future CSV or spreadsheet export:**
   - a cell starting with `= + - @`, TAB or CR is prefixed with `'`, which stops CSV and formula injection;
   - fields are quoted per RFC 4180.

   Any new non-React renderer (a server PDF, plain-text email, SMS) must state its encoding and test it with this row.

Could reasonably have been anticipated: partly. Output encoding was done throughout. Point 2 (invisible and control characters) was not stated anywhere.

## L-149: whom a school admin may search and see in «Peran & akses»

`school_people_page` today returns a school's ACTIVE enrolments only, for a school the caller holds `INSTITUTION_ADMIN` over. The fix widens this to people with no enrolment.

**The boundary:**
1. **The caller:** `has_scope('INSTITUTION_ADMIN', s)` per requested school, exactly as today. A school not administered gives no rows. The platform path (`p_institutions` null) is unchanged.
2. **The population:** only persons linked to *that* school, meaning either:
   - an `institutional_identities` row with `institution_id = s` (the school gave them a number); or
   - any enrolment at `s`, whatever its status.

   **Never** a global person search, never a person known only to another school, and never a person linked through any other institution in the same network.
3. **The fields:** `person_id`, `display_name`, the school's own `institutional_id`, and the existing kind or status. Nothing else:
   - no email or phone, no auth identifier;
   - no other school's number or enrolment;
   - no suspension or closure category (if a locked flag is needed, it is the CI-2 boolean only).
4. **The search:** the same limits as now. A plain case-insensitive substring of at least 2 characters, and at most 50 rows. No wildcard or regex passes through, and an empty search gives the newest 50 only.
5. **The write re-checks the boundary.** The role grant itself (not just the picker) refuses a person outside point 2 for that school, with the same refusal as an unknown person, so the grant can't be used to probe whether a person exists.
6. **Registry and tests:**
   - update the `client_rpc_registry` row's note and requirement;
   - a test where an admin of school A searching a name held only at school B gets 0 rows;
   - a test where a person with no link anywhere is invisible;
   - a test where a person with an identity row but no enrolment at A is found by A's admin;
   - a test where a grant to a school-B-only person is refused;
   - a test that none of the point 3 exclusions appears in the result.

Could reasonably have been anticipated: yes. The ACTIVE-only population was a W2.17 choice for the transfer picker, and it was reused for the roles picker without asking who the roles picker needs.

---

## Addendum (2026-11-24, 23:5xZ): L-149 withdrawn; L-152 access angle

**L-149: withdrawn by Bob.** Daisy reproduced the staff path: staff recorded without a class are found in «Peran & akses» and can be given a role. The boundary above ~~is needed now~~ stays on record as the condition for any future widening of `school_people_page`. The L-151 rules go into AR-79 as written.

**L-152 (the last admin releasing their own role is given a false cause). The access angle:**
- **What I found:** a code read of the latest `revoke_role` (migration `20261111100000`) and a search of the migrations turned up **no server-side last-admin guard**. The only refusals are "assignment not found", "not authorized to revoke" and ROLE_REASON_REQUIRED. If the UI is what blocks the last admin, the database does not, and a school can be left with no INSTITUTION_ADMIN. Only the platform admin can recover it. Please confirm or point me to a guard I missed.
- **If a guard is added:**
  1. It belongs in the database, in `revoke_role` and any other path that ends an INSTITUTION_ADMIN assignment: expiry, person suspension, anonymisation.
  2. It must hold under concurrency. Two admins each revoking the other at the same moment must not both pass a count check. Take a per-institution advisory lock, in the A2A-L01 order, or lock the remaining active admin rows FOR UPDATE, before counting.
  3. The refusal names the true cause, with its own errcode and detail, e.g. LAST_INSTITUTION_ADMIN. It names no other admin and gives no count beyond "the last one".
  4. Suspending or closing the last admin's person is a platform-admin act. Whether that leaves the school without an admin, or is refused, is the owner's or Daisy's call, not a silent outcome.
  5. Test with a planted race, two sessions revoking each other, ending with ≥1 admin left; with a PLANT that removes the lock and turns the test red; and with a test that the refusal text matches the cause.
- **If the guard exists and only the message is wrong:** this is UX and not a security gap, though the message must still not leak other admins' identities.

Could reasonably have been anticipated: yes. L-36 is the sibling at platform level.
