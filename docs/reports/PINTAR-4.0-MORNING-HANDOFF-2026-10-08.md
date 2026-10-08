# PINTAR 4.0 · Handoff, 8 Oct

**Main:** dab5c12 (code), aad799b (records). **Staging:** dab5c12 (facts 37782586725). **Production:** untouched.

## Done

1. **L4 GREEN** (the Second Eye's verdict, D-136(a)). Three rounds:
   - review 1 was AMBER: two MAJOR findings, both fixed. The example workbook exposed live answer keys and is withdrawn. A refused edit lost what had been typed; it no longer does. Six minor findings were fixed or recorded;
   - review 2 was AMBER (light), on four new minor defects: transfer names, edit rows left open after a save, two loopholes in the display guard, and page links repeating one-time steps. All four were fixed, each with a check that fails on the old code and passes on the new;
   - review 3 was GREEN, on condition of the evidence below.

   The local full suite also found one real defect: the example workbook sat in the chapters folder. It was moved.
2. **Terminology v1 applied** where L4 needed words (D-134).
3. **The owner's directive recorded** (D-135). Batch 4 and L4's open questions were settled under it. Nothing in them waits on the owner.
4. **Daisy: APPLICATION READY verified on c42fecb** (D-136(b)). Daisy froze it on bb0f98a. An independent review found four document defects; the coordinator corrected them on her lane (cc96030) and re-ran her checks: 60/0, 61/0, 7/0, lint 0 errors.

## Evidence

| | |
|---|---|
| CI | 37775379355: 18/18 |
| Journeys | 37775382999: crawl GREEN; **75 PASS, 1 governed FAIL** (S23q, CR-52, D-123) |
| main | dab5c12; run 37782331321 stopped, already proven |
| Facts | 37782586725: staging = main |
| Local | full suite 649 passed, 1 failed (fixed); crawl clean; journeys 74 PASS + S23q (BD11 needs CI's engines) |

## Open, and whose

- **Budget (owner):** 1,792 of 1,900 used, 108 left. The full regression needs about 125–147, so it needs a further allowance.
- **The application slices** carry APPLICATION READY into the product (`08-migration.md`). They include:
  - the owed copy: C1, C2, CR-13/50/76/81, «Tandai soal ini», «Menerbitkan…»;
  - a screen-reader pass with NVDA or TalkBack;
  - the Design System page republished after c42fecb.

  These are engineering and design work; their CI also draws on the allowance.
- **Kept as recorded:**
  - finding 6: the roles list stays unbounded until its Collection component exists;
  - S23q/CR-52 is an A item for S7;
  - CR-91 and CR-92;
  - the Dr Gladys terminology register: template titles and the words v1 lacks.

## Not claimed

APPLICATION READY is a design freeze. Nothing here is launch-ready, production-ready or human-accepted. Final human acceptance stays the owner's.

## Next step

When the allowance is extended: the application slices in `08-migration.md` order, each proven locally first, then one CI cycle, then the full regression. Until then, slice work continues locally, with no CI.
