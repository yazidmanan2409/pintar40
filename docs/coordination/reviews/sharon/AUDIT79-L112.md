# Audit 79 · L-112: an open welcome tour keeps a shared computer from locking — Sharon

**Work:** the builder's J10 capture (`claude/audit-79-world` `6b248975`, `audit/79/tangkapan/d70f3222/j10/j10-cabang-tur-terbuka/`). Read against `main`: `src/components/PenjagaSesi.tsx` and `src/components/tur/Tur.tsx`.

## (1) Severity: HIGH, above Significant

- **The shared-computer lock is a confidentiality control.** With the tour open it **never** fires: 9 minutes with no input, still BUKA.
- **The condition is common, not contrived:** the tour reopens at every sign-in until it is dismissed, so it is the default in a learner's first days, which is exactly when they least know to sign out.
- **Whoever sits down next** gets the learner's session: their results, their messages and their open sittings.
- **For the 10-adult pilot,** if it runs on personal devices, this is not a blocker. **It must be fixed before any shared-computer use** (schools, labs). It sits in AR-79, unless the pilot uses shared machines, in which case it must be fixed before the pilot.

## (2) The cause, traced in code (not yet observed event by event)

1. **`PenjagaSesi` counts `scroll` as human activity:**
   - `PERISTIWA = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"]`;
   - they are listened to on `window` with `capture: true`, so the listener sees **every** element's scroll, not only the page's;
   - each one calls `aktif()`, which sets `lokal = now`, clears the warning and arranges a heartbeat.
2. **A `scroll` event does not prove a person is there.** Browsers fire it for programmatic scrolling (`scrollBy`, `scrollIntoView`, focus moving into view), for smooth-scroll completion, and for scroll-position clamping and anchoring when the layout changes. All of these are `isTrusted`.
3. **The tour changes the layout and scrolls:**
   - `Tur.tsx` sets `document.body.style.paddingBottom` (the room it borrows) and calls `window.scrollBy({ behavior: "smooth" })`;
   - it re-measures on every scroll (`window.addEventListener("scroll", lagi, true)`).
4. **The loop that matches the samples:**
   - at 240 s the warning renders, which changes the layout;
   - the browser re-clamps or anchors the scroll position, which fires a `scroll`;
   - `aktif()` clears the warning and sends a heartbeat (242 s), and a pending one follows (307 s);
   - 240 s later the warning renders again (≈ 482 s), which gives the 487 s heartbeat.
   - **With the tour skipped,** there is no borrowed padding and no listener re-measuring, so the warning's render scrolls nothing, and it locks at 303 s.
5. **To confirm, before the fix:**
   - instrument the listener to log each event's `type`, `isTrusted`, `target` and timestamp relative to the warning's render;
   - the expected result is a `scroll` with no `wheel`, `touch` or `key` before it.
   - Also check `pointermove`: some browsers dispatch a synthetic move under a stationary cursor after a layout shift.

## (3) The same class elsewhere: likely, wherever code moves the page

**The fault is the rule, not the tour:** "an event fired" is treated as "a person acted". The other places with the same effect:
- **Programmatic scrolling and focus:**
  - the help panel and the tip (`PanelBantuan`, `TipSetelahTutup`: `focus()` and scroll listeners);
  - any `scrollIntoView` on form errors or new content;
  - the tour's own step changes.
- **Layout changes on a timer:**
  - autosave notices and live regions;
  - countdowns, polling lists and banners that change height, each of which can re-clamp the scroll position.
- **A synthetic `pointermove`** under a still cursor.
- **Media:** "a video or sound playing on the visible page" keeps the session alive. A looping or autoplaying video would never lock. Check that none loops; if any does, count media only while a person has interacted within the window.

## The direction for AR-79 (my conditions)

1. **Count only events that need a person:**
   - `keydown`, `pointerdown`, `touchstart` and `wheel`;
   - `pointermove` only with real movement (`movementX` or `movementY` ≠ 0);
   - **drop `scroll`** as activity, or count it only within about a second after a `wheel`, `touch` or `key` event.
2. **The warning and the lock never feed themselves:** rendering the warning or the lock screen must not count as activity. Only the «Masih di sini» button, which is a `pointerdown` or key, counts.
3. **Red-first tests in a real browser:**
   - the tour open with no input locks at about 300 s;
   - each programmatic scroll (`scrollBy`, `scrollIntoView`, `focus`) and each layout change counts as nothing;
   - a real wheel or key counts.
4. **The sweep:** list every component that scrolls, focuses or changes height without input, and check each against the new rule.
