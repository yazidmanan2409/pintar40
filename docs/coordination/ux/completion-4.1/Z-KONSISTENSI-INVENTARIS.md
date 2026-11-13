# Inventory for Z's consistency pass (Daisy, 13 Nov 2026)

> **What holds now:**
> - **The inventory Z's consistency pass works from, for the items Bob named:** the «Pendataan» naming, X-1, X-3, X-4. It also includes the remaining «Admin platform» strings, which the same pass owes (my 4.0 consistency item 6; THE PLAN §8.4: one role name, «Admin PINTAR»).
> - **Everything is found by search** at `55e7eed9573d7396973b48665cd9d67a048da5bf`, not from memory (question 1). Each item lists its files and the test that proves it closed.
> - **Not a review.** X-1 and X-3 are also on Second Eye's register list as small commits; this page is what those commits should cover.

## Z-1 · The sub-page shell names the place «Pendataan», and shortens the navigation (X-4)

**What:** ten pages use the sub-page shell `kind="pendataan"`:
- `src/app/aktivasi/page.tsx`
- `src/app/aktivasi/orang/page.tsx`
- `src/app/konfigurasi/catatan-masuk/page.tsx`
- `src/app/konfigurasi/email-uji/page.tsx`
- `src/app/konfigurasi/keamanan/page.tsx`
- `src/app/konfigurasi/kesempatan/page.tsx`
- `src/app/konfigurasi/sertifikat/page.tsx`
- `src/app/konfigurasi/staf/page.tsx`
- `src/app/pendataan/page.tsx`
- `src/app/pendataan/[pekerjaan]/page.tsx`

**Two consequences:**
1. **The bar's place word.** On a Konfigurasi sub-page the top bar says «Pendataan», where the page's own eyebrow says «Konfigurasi». At 320 it also breaks as «Penda/taan» (4.0 register).
2. **X-4, the navigation.** The sub-page shell's place list is shorter than the Konfigurasi index's, at every width:
   - the platform admin loses «Keamanan akun», «Kirim email uji» and «Sertifikat sekolah»;
   - a school admin loses «Keamanan akun» and «Sertifikat sekolah».

**The correction:**
- **A Konfigurasi sub-page uses the Konfigurasi shell's place and places:** «Konfigurasi» in the bar, and the index's own navigation list.
- **«Aktivasi akun» and «Pendataan»'s own pages keep their own place word:** they are places of their own in the navigation.
- **The rule:** a page's bar names the navigation item it is reached from, and its navigation is that item's.

**Test:** on each of the seven Konfigurasi sub-pages, as a school admin and as the platform admin:
- the bar reads «Konfigurasi»;
- the navigation's items equal the index's, at 1280 and in the 390 drawer.

## Z-2 · X-1: a second `<main id="isi">` inside Studio

**What:**
- `src/app/studio/layout.tsx` is the only layout that renders `<main id="isi">`.
- Three components render their own `<main id="isi">`: `HalamanPenolakan`, `HalamanGalat` and `MemuatHalaman`.

**Inside Studio they are used by:**
- `src/app/studio/loading.tsx` (`MemuatHalaman`): **every Studio page while it loads**;
- `src/app/studio/paket/[course]/page.tsx`;
- `src/app/studio/tinjau/kunci/[koreksi]/page.tsx`;
- the layout itself.

**Each gives two `main` landmarks** and two elements with the skip link's target id.

**The correction:**
- The three components render a `<div>` with the same class when a layout already provides `<main>`, through a prop such as `dalamMain`.
- Or Studio's layout stops rendering `<main>` and each Studio page renders its own, as the other areas do.
- **The second is the more consistent:** no other area's layout owns `<main>`.

**Test:**
- for a Studio refusal (`/studio/tinjau/kunci/{unknown}`), Studio's loading state and a Studio page: exactly one `main` landmark and one `#isi`;
- the skip link moves focus to it.

## Z-3 · X-3: an unknown key-correction id is refused, not «not found»

**What:** `src/app/studio/tinjau/kunci/[koreksi]/page.tsx` answers a correction id that does not exist (or no longer exists) with `HalamanPenolakan`, the "not allowed" page.

**The correction:**
- `notFound()` when the correction does not exist.
- The refusal stays for a correction that exists and the person may not review.
- The same distinction holds on Studio's other id-addressed pages (`/studio/paket/[course]`): check them in the same commit, by search.

**Test:** an unknown id answers 404; another school's correction answers the refusal.

## Z-4 · «Admin platform», still on screen

**18 strings** still say «Admin platform» in Indonesian, against one role name, «Admin PINTAR»:

| Area | Strings |
|---|---|
| Roles | `peran.perpanjang.sendiri`, `peran.saya.berakhir_platform`, `peran.saya.berakhir_sendiri`, `galat.role_scope_required` |
| Reports | `laporan.templat.tak_berwenang` |
| Konfigurasi | `config.kesehatan.bukan_admin`, `config.refused`, `email.uji.alasan` |
| Maintenance | `pemeliharaan.darurat.arti` (also in A2a's page), `galat.maintenance_not_allowed` |
| Studio | `studio.paket.masalah.package_could_not_be_saved` |
| Activation | `aktivasi.ditolak`, `aktivasi.galat.baru_ditolak` |
| People | `orang.intro.sekolah`, `orang.email.hanya_platform`, `orang.identitas.hanya_platform` |
| Audit | `audit.aksi.role.first_system_admin_bootstrapped` |

**The English:** 15 strings say «platform administrator». They become «Admin PINTAR» («an Admin PINTAR»), as B1-R1 did.

**The correction:**
- Replace the role name only; no sentence otherwise changes.
- The audit row's text is the audit's own record wording: check with Sharon whether history rows are re-rendered or keep their words.

**Test:** no `hle.ts` string contains «Admin platform» or «platform administrator»; one assertion in the strings' own test.

## Z-5 · Two fixed «WIB»s that should be the school's zone

Found while preparing A2's words (`A2-KATA-DESAIN.md` B3):
- `pemeliharaan.zona` is the fixed «WIB». A2b's D8 removes it.
- **The pass should search for any other fixed zone word** in strings and components (`"WIB"` literals) and confirm each is either the school's zone or a stated fallback.

## Order

- **Z-2 and Z-3** are on Second Eye's register list now.
- **Z-1, Z-4 and Z-5** are Z's.
- **Z-1 changes navigation on ten pages,** so it should land early in Z, so that journeys run on it.
