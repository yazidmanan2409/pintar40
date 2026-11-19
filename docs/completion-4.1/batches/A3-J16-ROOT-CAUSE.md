# A3 · J1.6 on `5ae2d406`: root cause and fix (for Bob, to relay to Sharon)

**One line:** J1.6 asked its start with hand-written claims that carried no `session_id`. Since A3, a start with no
session is refused first (S11: PR170 SITTING_NOT_CONTROLLER), before the window. This is Sharon's case (a): the product
order is as designed, the fix is the journey's, and no real learner's start can arrive without a session.

**The evidence:**
- **Reproduced.** I ran J1.6's own SQL locally under a work-scoped window on the cycle school.
  - As at `5ae2d406`: `boleh|MAINTENANCE_PLACE`, `mulai|PR170:SITTING_NOT_CONTROLLER`. This is run 44443171111's failure.
  - With the claims given a session: `mulai|PR040:MAINTENANCE_PLACE`.
- **Not a product defect.** Every sign-in path goes through Supabase Auth, whose session token carries `session_id`:
  - password, and the card sign-in, which is also a password sign-in;
  - the OAuth code exchange (`auth/callback`);
  - the magic-link `verifyOtp` (`evaluation/assume`, `aktivasi`).

  Nothing mints its own token. The running-app tests also start real sittings through the app's own sign-in:
  A1-J01 asserts that the start set the sitting's controller, and A3-J01 and A3-J02 start sittings the same way.
- **The other journeys are not affected.** Four other journey scripts also hand-write claims without a session (`b6-cetak`,
  `rb-ujung`, `c12`, `c12-potret`). None of them starts a sitting or writes to one.

**The commits:**
- `11ce499f`, A3-M01, rolled back. A new start in a work-scoped window over the class:
  - with a verified session: PR040 MAINTENANCE_PLACE, and `may_start` also says MAINTENANCE_PLACE;
  - with no session: PR170 SITTING_NOT_CONTROLLER, first.

  It pins the order J1.6 met. It was green on its first run because the product is right; the red it answers is the
  journey's.
- `c31ab198`, `audit/b8-jalan.mjs`: J1.6's learner claims gain a session id, as the app's own token has. No product code
  changes.

**Pre-flight on `c31ab198`:** one uninterrupted run, GREEN.
- 1295 tests passed, 0 failed.
- Plants 175/175; red cases 11/11.
- Lint, typecheck and build identity clean.

CI and the audit journeys are for Bob to re-dispatch (D-025). I have not dispatched either.
