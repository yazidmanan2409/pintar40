# B4 · The card: a school-less role beside a school role

**Form K (confirm the current treatment).** Register entry B4.
**Case:** a person holding **Admin platform** (no school) and a school role, for example **Guru · SMP Cahaya Kaliandra**.
**Built at 0b19707:** `src/lib/kartu-pintar.ts` `susunKartu` (its lines, `baris`), drawn by `KartuPintar.tsx`. The card email builds its block from the same lines (D1 step 2, owner's note 1).
**Nearest rule:** D-074(6), «one role and its school per line», with D-074(4)–(8): the roles in alphabetical order by their Terminology v1 names; the card's colour is the first role's family; colour never alone.
**Decides:** D.

**Missing evidence, and its substitute:** no render of a platform role beside a school role exists. The nearest is `batch-6/evidence/B6K/contoh-dua-sekolah.png` (two schools, one line each), labelled as a substitute. This confirmation is read from the code path, which takes the two-places branch for this case, the same branch that drew `contoh-dua-sekolah`.

---

## What the card does, and the verdict

| # | Rule | What `susunKartu` does for «Admin platform» + «Guru · SMP Cahaya Kaliandra» | Verdict |
|---|---|---|---|
| K1 | **One role and its place per line** (D-074(6)) | The two contexts are in different places: the platform has no school. So the card takes the one-line-per-context branch: **«Admin platform»** on its own line, **with no school under it**, then **«Guru · SMP Cahaya Kaliandra»**. | **CONFIRM.** A platform role is never drawn under a school, and the school is never drawn as if it held the platform role. |
| K2 | **The order** (D-074(5)) | Sorted by the Terminology v1 names: «Admin platform» before «Guru». | **CONFIRM** |
| K3 | **The colour** (D-074(4)) | The first role's family: **Admin platform `#5E6062`**. | **CONFIRM.** The colour follows the order; it does not prefer the school role. Colour is never the only carrier: each line names its role. |
| K4 | **Nothing truncated or shrunk** | Two pairs, within the card's proven capacity (`KAPASITAS_PASANGAN = 2`); every line at the approved type. | **CONFIRM** |
| K5 | **The email card** (D1) | Built from the same `baris`, so the card and the email agree. | **CONFIRM** (D-172: one card, one grammar, wherever it appears) |

**The treatment is confirmed as built. No redraw.**

## Edge cases (named, not designed here)

- **Admin platform and two roles at one school** (for example Guru and Kepala departemen at SMP Cahaya Kaliandra): three pairs, beyond the card's proven two. That is **B3**, explicitly unresolved by the owner (4 Nov). The card keeps the built rule (no truncation, no shrinking, no silent omission) and marks the exception (`data-pengecualian="lebih-dari-dua"`). Nothing is drawn here.
- **Admin platform alone:** one line, «Admin platform», no school line: the single-place branch, with no school to write.

## Acceptance checklist

- [auto] For Admin platform + one school role, the card draws two lines: «Admin platform» with no school under it, then the school role with its school.
- [auto] The order is alphabetical by Terminology v1 names, and the colour is the first role's family (D-074).
- [auto] Nothing is truncated or shrunk; the card email shows the same lines.
- [manual] A real render of the case, from a disposable stack, added beside the substitute before final acceptance.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): one card grammar for the Digital Card and the card email (`susunKartu`).
