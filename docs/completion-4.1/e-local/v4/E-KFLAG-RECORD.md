# E · the key check and the judging-release gate (Rulings 48 and 51)

**Sharon's blind answers are committed before any comparison:** `b056e334ba71d1dcd3615d5f51483046104c4e2b`, on `claude/gracious-lamport-0m1qjr`, in `docs/coordination/reviews/sharon/E-KFLAG/`. Bob checked both fingerprints against that commit:

| File | Columns | SHA-256 | Used by |
|---|---|---|---|
| `lembar-kunci-K.csv` | item_id, jawaban, alasan (60 rows, each with a reason) | `b7eb6424c06cdbff221dd9fb7796c2dd52ffbbac76f1a1cacef14f63084f54df` | `nilai-juri.mjs flags` |
| `jawaban-k.csv` | item_id, answer (the same 60 answers) | `c0838b0b18fede2cfa35c6caba5a5288d812073e31650fd2cd3ebf74228547ec` | `kit.mjs seal-key` |

- **Sharon's package:** `untuk-sharon.zip`, sha256 `bdce76ae…6fdf`. The owner delivered it directly to her session. It held 60 items, with no key, no provider and no model.
- **The sealed map:** `112714f445ffc21731df68db70a0e038e33180e9ba6794cf734ea3a914315e59`. It stays on the owner's Mac. `seal-key` reads it but never changes it; Bob rehearsed this, and a second seal is refused.

## The two steps, on the owner's Mac (the keys and the map never leave it)

1. **The seal:** `kit.mjs seal-key` on `PRIVAT/out` with `jawaban-k.csv`, once. It writes `SEALED/k-answers.json` beside the map.
2. **The comparison:** `nilai-juri.mjs flags` with `lembar-kunci-K.csv`, the judges' `untuk-juri/items.json` (which holds the keys) and the committed answers' SHA-256. This writes `flags.json`: each flagged item id with Sharon's reason, and no keys, no provider codes and no scores.

**Recorded here when they arrive:** the number of flags, `flags.json`'s SHA-256, and the flagged item ids with Sharon's reasons. The fingerprint is committed **before any judge's sheet exists.**

## For the educators (preserved, not a flag)

**B1-016** (Sharon, in her reason; `lembar-kunci-K.csv`, `b056e334`):

> «Baris 5, 8, 11, 14; jumlah empat baris pertama = 38. Catatan: kalimat soal bisa dibaca sebagai banyak kursi baris ke-4 saja (14, pilihan D); sebaiknya ditulis «jumlah kursi pada empat baris pertama».»

- **What it means:** the stem can be read two ways, as the total of the first four rows (38, option C, her answer) or as row 4 alone (14, option D).
- **How it reaches the educators:**
  - if the comparison flags B1-016, J3 receives the note with the flag;
  - if it is not flagged, it is still given to J3 among the items J3 decides, as a wording question. It is never treated as a correctness ruling: the educators decide.
- Nothing about who wrote the item is implied.

## The judging-release gate

`untuk-juri.zip` goes to J1 and J2 only when **all** of these hold:
- [ ] the seal is done on the owner's Mac (`sealed` printed once);
- [ ] `flags.json` is made, and its SHA-256 is committed here by Bob;
- [ ] Sharon has received only the flag count and the flagged ids with her reasons;
- [ ] the judges' guide is the neutral `PANDUAN-JURI.md` (Daisy, `8002a69b`), with `JAWABAN-BILA-DITANYA.md` held by the owner.

Then J1 and J2 score independently. J3 decides the routed items. **The map is unsealed only after every score is final.** No provider identity is revealed before that.
