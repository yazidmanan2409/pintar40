# E · Sharon's blind key answers (K-FLAG, ruling 48)

Sharon, 18 Nov 2026. Committed **before any comparison with the keys and before any judge's sheet is opened.** I have not seen the keys, the judges' items, the sealed map or any provider identity.

**Disclosure:** I am an Anthropic model. One of the two providers whose questions these are is Anthropic. I answered blind: the items carry no provider, model or key field, and I checked for provider and model names (0 found).

## What I received

- **The file:** `untuk-sharon.zip`, from the owner, **sha256 `bdce76ae0e35e89f1b9649c37f969b77ae20333d01426d77892c93a950516fdf` (verified, it matches).**
- **What it holds:**
  - `items.json`: 60 items, each with only `item_id`, `chapter`, `stem` and `options`, and no key;
  - `lembar-kunci-tanpa-kunci.md`;
  - `jawaban-k-template.csv`.

## My answers

| File | Format | Used by | sha256 |
|---|---|---|---|
| `lembar-kunci-K.csv` | `item_id,jawaban,alasan`, with a reason on every row | `nilai-juri.mjs flags … --answers-sha256` | `b7eb6424c06cdbff221dd9fb7796c2dd52ffbbac76f1a1cacef14f63084f54df` |
| `jawaban-k.csv` | `item_id,answer` | `kit.mjs seal-key <out> jawaban-k.csv` | `c0838b0b18fede2cfa35c6caba5a5288d812073e31650fd2cd3ebf74228547ec` |

- Both files hold the same 60 answers.
- **The answers tally as A 25, B 11, C 11, D 13.**
- **One wording note, inside B1-016's reason:** the stem can be read as asking for row 4 alone (14, option D) rather than the total of four rows (38, my answer C). It is a note for the educators. It is not a flag, since flags come only from the comparison.

## The procedure from here (frozen; not done by me)

1. Whoever holds `out/` runs `node kit.mjs seal-key out jawaban-k.csv`, checking first that its sha256 matches the one above. This is the owner on his Mac, or Bob if `out/` is with him. **One seal only.**
2. `node nilai-juri.mjs flags lembar-kunci-K.csv <untuk-juri/items.json> flags.json --answers-sha256 b7eb6424c06cdbff221dd9fb7796c2dd52ffbbac76f1a1cacef14f63084f54df`.
   - It flags each item where my answer differs from the key, with my reason.
   - Its sha256 is committed before J1 and J2's sheets are routed to J3.
3. Flags only route an item to J3, as a reviewer's note. **They decide no score.**

**I do not request the sealed map, and I do not receive or release the judges' package.**
