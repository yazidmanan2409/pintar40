# S-1: an early look before B2 (Daisy, 12 Nov 2026)

> **What holds now:**
> - **No defect found in S-1** (`61a6dd3b19761dfc91e11ac4f9e0295b64a32c6e`, rendered as part of `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`).
> - **My verdict on S-1 is still given in the B2 visit,** on B2's commit, as the queue says. This page only lets Second Eye know early that nothing needs changing.
> - **Bob:** one finding that predates S-1 is in §2, for the register.

## 1 · What was checked

**The open drawer.**
- **Who and where:** Bu Wulan (one context) and the platform admin (several), at 390 and 320 px, on «Konfigurasi», «Jejak audit», «Catatan masuk dan cetak», «Keamanan» and «Pendataan».
- **Width:** the sheet is the screen's width, and its content sits **16 px from each edge** (390: 16 to 374; 320: 16 to 304).
- **Overflow:** the page does not scroll sideways (`scrollWidth` equals the screen).
- **Focus:** it lands on «Konfigurasi», and its ring has 16 px clear on both sides.
- **No duplicate:** for the platform admin, the context block shows «Seluruh platform · Mau ke mana hari ini?» once (`S1-laci-390`).

**The desktop sidebar** (the rule that hides `a.pin-konteks-rail` at every width):

| Platform admin | What shows |
|---|---|
| 1280, expanded | The context block with «Mau ke mana hari ini?»; the rail's duplicate link is hidden |
| 1280, collapsed | The rail link |
| 1100, collapsed (the default there) | The rail link |
| 1100, expanded | «Mau ke mana hari ini?» |

- **A way to change context is present in every state,** and only the duplicate is gone.
- Bu Wulan has one context, so there is nothing to switch, and nothing is offered, as before.

**What the rule hides:** only `a.pin-konteks-rail`, the second copy. **No place in the navigation is hidden** by it at any width.

## 2 · Found, not S-1 (register; Bob)

**A Konfigurasi sub-page shows a shorter navigation than the Konfigurasi index,** at every width:

| Who | On «Konfigurasi» | On «Catatan masuk dan cetak» (and the other sub-pages) |
|---|---|---|
| Platform admin | Konfigurasi, Aktivasi akun, Keamanan akun, Kirim email uji, Sertifikat sekolah | Konfigurasi, Aktivasi akun |
| Bu Wulan | Konfigurasi, Pendataan, Aktivasi akun, Studio, Keamanan akun, Sertifikat sekolah | Konfigurasi, Pendataan, Aktivasi akun, Studio |

- **Why it is older:** this is the sub-page shell (`kind="pendataan"`), the same one that names the bar «Pendataan» there (my `TINJAUAN-B1-40e89308.md`, "Not B1"). S-1 changed no markup, and the lists are identical at 1280 and 390.
- **Why it matters:** an admin on a sub-page cannot reach «Keamanan akun» or «Sertifikat sekolah» without going back to the index first. The places a person can go should not change with the page they are on.
- **For the 4.1 consistency pass,** with the «Pendataan» bar: the sub-pages should use the index's navigation.
