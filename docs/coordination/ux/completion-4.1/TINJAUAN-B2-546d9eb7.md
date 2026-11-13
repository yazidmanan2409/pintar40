# B2's fix: one look (Daisy, 12 Nov 2026)

> **What holds now:**
> - **Defects, marked for anticipation (13 Nov):** `ANTISIPASI-4.1.md`, B2: 2, both anticipable.
> - **PASS on `546d9eb75abb53d41523750e7134cc83889d1089`.** B2's one blocker (`TINJAUAN-B2-bfe949b1.md` §3) is corrected.
> - My verdict on `bfe949b1` (BLOCKED) is superseded by this one.
> - Everything else in that review stands as passed.
> - **This was one look, not a visit,** as Bob asked:
>   - the engineer's screenshots (`docs/completion-4.1/batches/b2-fix/` on the work branch, copied to `verifikasi-B2-546d9eb7/`);
>   - the diff since `bfe949b11935763a8c8ed7b91f4adcdbcea93645`.

| Item | Seen | Verdict |
|---|---|---|
| **The notice's layout** | The sentence and «Kesehatan sistem» are now one `<span>`, the banner's only child, so both sit in the content column. **At 320** the text wraps inside the banner, and «Kesehatan sistem» sits on its own line within it, nothing cut (`notice-320.png`; compare `notice-320-before.png` on the branch). **At 1280** the link sits under the sentence, inside the banner (`notice-1280.png`) | **Accept** |
| **B2-R-A1, my line** | A new key `laporan.cetak.ditolak.konteks`: «Laporan ini tidak dapat dicetak dari pilihan yang sedang Anda pakai di {pilih}. Pilih yang sesuai dengan laporan ini, lalu cetak lagi.» / the English as I wrote it. `{pilih}` is the chooser's own title («Mau ke mana hari ini?», `entry.title`) as a link to `/`, inside the same `role="alert"` result line | **Accept** |
| **When that line is used** | The engineer added a condition I agree with: it is used **only** when the report's school is one of the person's own contexts. For any other school the general «Laporan ini tidak dapat dicetak dari akun Anda.» stays. So the answer never tells a person that a report they cannot read exists, and never sends them to a context they do not have. Tested both ways in `b2-layar.test.ts` | **Accept** |
| **Also seen in the 1280 shot** | B1-R2's «tanpa sekolah» under the platform admin's own sign-in, which I could not see at my visit | **Accept** |

**Register (non-blocking; for Bob):** the notice's guard test reads the banner's markup in the source. A rendered check (`scrollWidth === innerWidth` at 320 with the notice present, and the link's box non-zero) would catch the same failure from any future cause. It can ride with any later commit to B2-S02.
