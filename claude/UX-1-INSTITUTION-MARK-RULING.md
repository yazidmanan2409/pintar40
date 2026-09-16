# PINTAR 4.0 — INSTITUTION MARK BEHAVIOUR

**Ruling:** Yazid 💍 / Sauron 👁️🔥, 2026-09-17 · **Recorded by:** Daisy 🌼💻 · **Applies to:** the Experience architecture from UX-1 onward · **Status of the current implementation:** `2cc72d2` is visually APPROVED and preserved unchanged.

**Institution may own the mark. PINTAR owns the experience.**

---

## 1. What was approved at `2cc72d2`

| | |
|---|---|
| Logo treatment | **APPROVED** — 36px desktop / 32px phone, optical sizing preserved |
| Footer treatment | **APPROVED** — provenance, unchanged from `09a97bf` |
| Institution-logo replacement principle | **APPROVED** — as specified in §2 below |
| A4 separation | **APPROVED** — the credential carries no PINTAR SELALU mark |
| Branding beyond the current default | **DEFERRED to Q-7** |

The optical sizing and treatment implemented at `2cc72d2` are not to be revisited. They were chosen by rendering the artwork at seven heights against the real 56px header: below 28px the reversed SELALU stops resolving into letters, at 44px the block fills the bar and behaves like a masthead.

---

## 2. The required Experience behaviour

### 2.1 Default application identity

When an institution has **not** supplied an approved custom mark, the application shell displays the official **PINTAR SELALU** logo, using the treatment implemented at `2cc72d2`.

This is the state today, and it is the state until §2.2's source exists.

### 2.2 Institution-customised identity

When an institution **has** supplied and configured its own institutional mark — UIN, for example — that mark **replaces** the PINTAR SELALU logo **in the application shell identity position only**.

> The result is *PINTAR for UIN*, not an independently themed application.
> Same PINTAR, different institution at the door.

### 2.3 This is bounded branding, not tenant theming

Replacing the mark does **not** change any of:

`PINTAR colour tokens` · `typography` · `spacing` · `navigation` · `components` · `status colours` · `interaction patterns` · `evidence semantics` · `assessment and scoring` · `authorization` · `tenant behaviour` · `certificate semantics`

An institution that can change the mark and nothing else is the whole design. The moment a second thing becomes configurable per tenant, this stops being branding and becomes theming, and the guarantee that every PINTAR screen behaves the same way for every child in Indonesia is gone.

### 2.4 The identity area accommodates the mark, not the reverse

The institutional mark is fitted **optically** within the established identity area, **preserving its original aspect ratio**.

Institution marks are not all the shape of the PINTAR SELALU logo. A university crest is often square or vertical; a school wordmark is often horizontal and much wider. So the identity area must be a **bounded box constrained on both axes** — a maximum height *and* a maximum width — inside which any mark is scaled to fit whole:

- a **horizontal** mark meets the width bound first and sits shorter than the box;
- a **square or vertical** mark meets the height bound first and sits narrower than the box;
- **no mark is stretched, cropped, letterboxed onto a plate, or forced to the PINTAR SELALU logo's 1.7855:1 proportions.**

The bound exists so that no institution's mark can dominate the header. The height bound should be the one already chosen optically at `2cc72d2`; the width bound is what stops a very wide wordmark from crowding the navigation. Both are design decisions for the session that implements this, judged by looking at real institution marks rather than derived from the spacing scale.

### 2.5 The certificate is a separate concern, permanently

Application-shell branding and **credential issuer identity are different things and do not propagate into one another.**

- The A4 credential remains unbranded by PINTAR SELALU.
- An institution's mark appearing in the application shell does **not** thereby appear on that institution's certificates.
- The certificate's own institution mark slot is a separate question, governed by the credential's issuer semantics — the certificate says who *issued* it, and that claim is not decorated by whoever's mark happens to be in the header.

`BarisLingkup` already carries a `markUrl` slot that renders nothing when no mark exists (Q-7), and `KartuSertifikat` renders no mark at all. Both are correct and unchanged.

---

## 3. Why nothing is implemented today — OBSERVED, not assumed

The ruling permits implementation only if *"the existing frozen contract already exposes the institution mark safely."* It does not. Measured against the frozen baseline `9b2cc5d`:

**1. There is no column.** `public.institutions` has exactly seven:

```
id · name · slug · is_synthetic · is_active · retention_days · created_at
```

**2. There is no column anywhere else either.** A sweep of all 83 migrations for `logo`, `brand`, `mark_url`, `emblem`, `crest`, `wordmark`, `favicon` and `theme` as column names returns nothing; the only two hits are the words "brand-new" in two comments.

**3. And a column alone would not be sufficient.** Eleven migrations assert `count(*) from storage.buckets where public` **= 0** as a standing invariant. A mark rendered on `/verifikasi/[token]` is read by an anonymous stranger, so it needs a public read path — and the schema asserts there is none. **Whoever closes Q-7 must solve the delivery path, not only the column.** That is the part most likely to be missed, because a column is the obvious half.

This is therefore recorded as the existing bounded **Q-7** implementation/product gap, not as a new finding.

### What was explicitly not done

- No logo URL field invented
- No storage bucket created or made public
- No RPC added
- No migration written
- No tenant-theme mechanism of any kind
- **UIN is not hard-coded anywhere.** It appears in this document as the example the ruling used, and nowhere in `src/`.

`UX1-BRAND-02` asserts all of the above mechanically, so the gap cannot be closed quietly and the boundary in §2.3 cannot erode by accident.

---

## 4. For whoever implements this

The Experience side is already shaped for it. `MerekPintar` is the single component that renders the shell identity; every surface goes through it, so the substitution happens in one place. What is needed is:

1. **A source for the mark** — the Q-7 column, and the safe delivery path §3.3 describes.
2. **An approval step.** The ruling says *"supplied and configured"* and *"approved custom mark"*. An institution mark is a claim about an institution that appears in a product used by children; it should not become live because somebody uploaded a file.
3. **The bounded box of §2.4**, with both bounds chosen by looking at real marks.
4. **A test that the substitution changes the mark and nothing else** — that §2.3's list is still true with an institution mark configured.

Until then, PINTAR SELALU is the default, and it is the only mark.

---

**STOP.** Slice 2 is not begun. Second Eye and Bob remain paused.

**CALM ON THE SURFACE. RIGOROUS UNDERNEATH.**
