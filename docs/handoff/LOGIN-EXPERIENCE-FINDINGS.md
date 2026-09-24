# UX-1 · THE SIGN-IN SCREEN — WHAT WAS BUILT, AND WHAT WAS RULED

Written by Daisy Code after implementing the canonical login handoff
(`UX-1-LOGIN-IMPLEMENTATION-HANDOFF.md`, SHA-256
`3dbaf1c0ecb6f29fc69b1613ed4297c65007afe1c485520611ba1db511380833`) against the
frozen authentication baseline `bff6897e3d5656a0eb5a14f19c62bcd65bf8ec31`.

This file exists so that two decisions are recorded rather than inferred from
an absence in the code.

---

## S6 — SUPPRESSED BY SECURITY RULING

**Status: specified, verified, built, and then withdrawn by ruling. Not
deleted from the record.**

### What S6 was

The handoff (§S6, §7.1) specified a *held-resend* surface: the confirmation
screen with `Kirim ulang` disabled and a neutral note above it, rendering
**only** when a resend attempt was refused by the authentication layer with a
distinguishable rate-limit condition. It carried no countdown, no number of
seconds and no client-side timer, and it was conditional by construction:

> **If** the authentication layer returns a rate-limit condition the page can
> distinguish from a transport failure, **then** S6 renders on that condition
> and clears when it does. **If** it does not, **then S6 is not built.**

Its copy was `cool.msg` — *"Tautan baru bisa diminta lagi sebentar lagi.
Periksa dulu email Anda — tautan yang pertama mungkin sudah sampai."* /
*"You can ask for a new link again shortly. Check your email first — the first
link may already have arrived."*

### What verification found

**The condition exists.** `over_email_send_rate_limit` and
`over_request_rate_limit` are declared members of the client library's own
error-code union, carried on `AuthApiError.code` with HTTP 429. Verification
task 1 therefore answered *yes*, and S6 was built as specified.

**And then the state turned out to be an oracle.** The handoff could not have
known this: §7.4 records that L-2's direction was unknown when it was written.
L-2 closed with `shouldCreateUser: false`, which means an **unknown** address
never reaches the provider's send path at all — it comes back as
`otp_disabled`, which the action folds into the ordinary outcome. An unknown
address therefore *could not* produce a held resend, while a provisioned one
could. Two presses of `Kirim ulang` separated the two.

That is precisely the account-enumeration boundary the conditional confirmation
(`sent.p`, §S5) exists to close, and that boundary is frozen.

### The ruling

**Sauron, 2026-09-18 — D2.** Suppress S6 as a distinguishable user-facing
state. The authentication provider may enforce rate limits internally, but the
login experience must not expose behaviour that allows repeated resend attempts
to distinguish a provisioned address from an unknown one. Fold the rate-limit
outcome into the same privacy-neutral sent outcome already used by the L-2
contract. Preserve the canonical neutral copy. Add no countdown, cooldown
message, retry-after value, throttling explanation or other distinguishable
state. The ruling takes precedence over S6 because implementation verification
established that S6 would weaken the frozen boundary.

### What is in the code now

- `HasilKirim` has **two** members, `terkirim` and `gagal`. There is no
  outcome meaning *held*, and none meaning *no such account*.
- `terlaluSering()` is **retained** — not to display anything, but so a
  throttle is never mistaken for a transport failure and reported as S7, which
  would put the distinguishable state back through the other door.
- `Kirim ulang` has one behaviour for everybody: a refused resend returns the
  same answer as an accepted one.
- `cool.msg` is gone from the copy table. A suppressed state's copy sitting in
  the table is an invitation to wire it back.
- The fold is **honest as well as safe**: the throttle fires *because* a link
  went out recently, so "if that address is linked, a sign-in link has been
  sent there" describes the one already in the person's inbox.

`UX1-MASUK-KONTRAK-01` holds this: no cooldown state, no timer, no
retry-after, and the privacy fold covers the rate-limit case. It was watched on
a planted defect.

### The state machine is now fourteen states

S1–S5 and S7–S15. The acceptance matrix is **84 rendering cases** (3 viewports
× 2 locales × 14 states), not 90. The missing six are S6's, and they are
missing on purpose.

---

## JavaScript — accepted, with a bounded failure

**Sauron, 2026-09-18.** The S1–S12 JavaScript dependency is accepted for
PINTAR 4.0. Full no-JS feature parity is not required, and the login experience
is not to be redesigned around progressive enhancement. What is required is a
bounded failure behaviour: a client that fails to initialise must not leave
authentication controls appearing operational while silently doing nothing.

**What that is.** `useSiap()` (`src/components/masuk/siap.ts`) reports `false`
in server-rendered HTML and `true` once React has hydrated, through
`useSyncExternalStore` — no effect, no state write. Until it reports `true`:

- every actionable control on the sign-in surfaces is `disabled` — the submit,
  the card route, the back control, both buttons on the sent surface;
- a `role="status"` note says the page is not ready and to reload it;
- the callback surface shows no spinner and does not claim an exchange is in
  flight, because none is. The heading stays, so no judgement is passed on the
  link.

This covers a blocked script, a dead network and a throw during hydration
alike, because it is keyed on hydration having happened rather than on
JavaScript being enabled.

**One piece of copy here is not from the canonical table.** `auth.belum_siap`
was written for this ruling, in both languages, and is flagged for Experience:
*"Halaman ini belum siap. Jika tombol tetap tidak aktif, muat ulang halaman."*
/ *"This page isn't ready yet. If the buttons stay unavailable, reload the
page."* It says nothing about any address and appears for everybody or nobody.

---

## Still open, and not this unit's to close

**The photograph — ASSET REQUIRED, not yet selected.** No licensed,
provenanced image exists. The panel is built to §5.3 with a flat `--ink-1`
placeholder carrying *FOTO CONTOH*. Nothing was sourced, generated or
substituted. It does not block development. It blocks release, and §8.2's
caption case and §8.5's asset cases cannot be measured until it lands.

**Not verified here, and not claimed.** Announcement order on a real screen
reader, 200 % zoom on a physical handset, and colour-vision simulation need a
device rather than a headless browser. They are acceptance criteria for
release, as §6.8 says, not claims of this build.
