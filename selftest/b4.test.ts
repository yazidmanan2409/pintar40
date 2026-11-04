/**
 * BATCH 4 · ADMINISTRATION, IDENTITY AND ACCOUNT MANAGEMENT (owner, 3 Nov: «Batch 4 development GO», D-152). Each
 * guard is RED on the code Batch 3 closed with (cb1ff3e) and GREEN after Batch 4.
 *
 *  B4-KARTU-K01  D-152(a) · the source: «Murid yang menjadi staf» is on Aktivasi beside «Kartu hilang atau rusak», posts
 *                to /api/akun/kartu-ke-email, whose source asks authorize_card_conversion with the CALLER's client
 *                and only then uses the service key for Auth's one address write; every refusal code has its
 *                sentence in both languages.
 *  B4-KARTU-A01  D-152(a) · live: a class-card learner signs in with the card; the platform admin's conversion without
 *                a reason is refused; with one it answers ok; the card no longer signs in; the same account row and
 *                Auth user are now an EMAIL account; the person activates it with a code to the new address and signs
 *                in with their password; a staff role is then accepted where it was refused (CR-91); the conversion is
 *                audited with its reason, the old card and the new address.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";
import { STATUS_KARTU_JADI_EMAIL, KODE_KARTU_JADI_EMAIL_DARI_DB } from "../src/lib/kartu-jadi-email-kontrak";
import { aktifkan } from "./bob28.test";
import { ipUji, lit, Peramban, psql } from "./bob26.test";
import { pilihKonteksPeramban } from "./konteks-uji";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const b4Tests: SelfTest[] = [
  {
    id: "B4-KARTU-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(/<KartuUlang locale=\{locale\} pemegang=\{pemegangUlang\} ada=\{adaPemegang\} dicari=\{cariKartu\} \/>\s*(?:\{[^}]*\}\s*)?<KartuJadiEmail locale=\{locale\} pemegang=\{pemegangStaf\} ada=\{adaPemegang\} dicari=\{cariStaf\} \/>/.test(halaman),
        "Aktivasi does not offer «Murid yang menjadi staf» beside «Kartu hilang atau rusak»");
      const komp = kode(baca(ctx.repoRoot, "src/components/aktivasi/KartuJadiEmail.tsx"));
      c.expect(/fetch\("\/api\/akun\/kartu-ke-email"/.test(komp) && /<BidangTeks id=\{`staf-email-/.test(komp) && /<BidangTeks id=\{`staf-alasan-/.test(komp),
        "the section does not post the address and the reason to /api/akun/kartu-ke-email through the text fields");
      const rute = kode(baca(ctx.repoRoot, "src/app/api/akun/kartu-ke-email/route.ts"));
      const tanya = rute.indexOf('caller.rpc("authorize_card_conversion"');
      const tulis = rute.indexOf("supabaseService().auth.admin.updateUserById(");
      c.expect(tanya > 0 && tulis > tanya && (rute.match(/supabaseService\(\)/g) ?? []).length === 1,
        "the route does not ask the database with the caller's client before its one service-key write");
      c.expect(/if \(!asalSendiri\(/.test(rute) && /if \(!user\) return gagal\("BELUM_MASUK"\)/.test(rute), "the route does not refuse a foreign origin or a signed-out caller");
      for (const kodeDb of ["REASON_REQUIRED", "EMAIL_INVALID", "EMAIL_TAKEN", "CARD_NOT_FOUND"]) {
        c.expect(kodeDb in KODE_KARTU_JADI_EMAIL_DARI_DB, `${kodeDb} reaches no code of the contract`);
      }
      for (const k of Object.keys(STATUS_KARTU_JADI_EMAIL)) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(`aktivasi.staf.gagal.${k}` as HleEvent, "staff", { locale });
          c.expect(!!kata && !kata.startsWith("aktivasi."), `«${k}» has no sentence in ${locale}`);
        }
      }
      return c.verdict("the source of src/app/aktivasi/page.tsx offers «Murid yang menjadi staf» beside «Kartu hilang atau rusak»; "
        + "src/components/aktivasi/KartuJadiEmail.tsx posts the address and the reason (TextField) to /api/akun/kartu-ke-email, whose source "
        + "refuses a foreign origin and a signed-out caller, asks authorize_card_conversion with the caller's client and only then makes its "
        + "one service-key write (Auth's address move); each database refusal maps to a contract code with a sentence in both languages");
    },
  },
  {
    id: "B4-FOTO-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/akun/page.tsx"));
      c.expect(/<FotoProfil locale=\{locale\} personId=\{String\(aku\)\} url=\{urlFoto\} \/>/.test(halaman), "«Akun saya» does not show «Foto profil»");
      c.expect(/`\/api\/assets\/read-url\?path=\$\{encodeURIComponent\(jalurFoto\)\}&alih=1`/.test(halaman) && /jalurFoto\.startsWith\(`profile\/\$\{aku\}\/`\)/.test(halaman)
        && !/supabaseService/.test(halaman), "the page does not show only the person's own photo through the read route's short-lived URL");
      const komp = kode(baca(ctx.repoRoot, "src/components/akun/FotoProfil.tsx"));
      c.expect(/<BidangBerkas id="foto-profil"/.test(komp) && /fetch\("\/api\/assets\/upload-url"/.test(komp) && /uploadToSignedUrl\(/.test(komp)
        && /simpanFoto\(path\)/.test(komp) && /simpanFoto\(null\)/.test(komp) && /fetch\("\/api\/akun\/foto"/.test(komp),
        "the section does not upload through the signed route (FileField) and then keep, or remove, the path");
      const aksi = kode(baca(ctx.repoRoot, "src/app/api/akun/foto/route.ts"));
      const milik = aksi.indexOf("fotoMilik(");
      const ada = aksi.indexOf('.storage.from("assets").list(');
      const tulis = aksi.indexOf('supabase.from("persons").update({ photo_path: jalur })');
      c.expect(milik > 0 && ada > milik && tulis > ada, "the route does not check the folder and the file before the person's own update");
      c.expect(!/supabaseService\(\)\.from\("persons"\)/.test(aksi) && /if \(!asalSendiri\(/.test(aksi), "the route writes the person with the service key, or answers another origin");
      const kontrak = await import("../src/lib/foto-profil-kontrak");
      const p = "11111111-1111-4111-8111-111111111111";
      const q = "22222222-2222-4222-8222-222222222222";
      c.expect(kontrak.jalurFotoBaru(p, q, "image/png") === `profile/${p}/${q}.png` && kontrak.jalurFotoBaru(p, q, "image/gif") === null,
        "the contract does not keep PNG, JPEG and WebP only");
      c.expect(kontrak.fotoMilik(p, `profile/${p}/${q}.jpg`) && !kontrak.fotoMilik(p, `profile/${q}/${q}.jpg`) && !kontrak.fotoMilik(p, `profile/${p}/../x.jpg`),
        "the contract accepts a path outside the person's own folder");
      c.expect(!/photo/i.test(kode(baca(ctx.repoRoot, "src/components/sertifikat/KartuSertifikat.tsx")).replace(/NAME_ONLY/g, "")),
        "the certificate reads a photo");
      for (const k of ["judul", "arti", "alt", "pilih", "ganti", "batas", "besar", "jenis", "hapus", "naik", "ok", "dihapus", "gagal"]) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(`akun.foto.${k}` as HleEvent, "staff", { locale });
          c.expect(!!kata && !kata.startsWith("akun."), `akun.foto.${k} has no sentence in ${locale}`);
        }
      }
      return c.verdict("«Akun saya» shows «Foto profil» (src/components/akun/FotoProfil.tsx): FileField, upload through the one signed route into "
        + "profile/<own id>/, then simpanFotoAksi keeps the path only if it is in the person's own folder and the file exists, with the "
        + "person's own client (persons_update_own), or removes it; the page reads only the own photo through a 300-second signed URL; PNG, "
        + "JPEG and WebP only; the certificate reads no photo; every sentence in both languages");
    },
  },
  {
    id: "B4-ORANG-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/aktivasi/orang/page.tsx"));
      c.expect(/supabase\.rpc\("orang_berakun"/.test(halaman) && /<Koleksi\b/.test(halaman) && /posisiHalaman\(total, hal, UKURAN\)/.test(halaman),
        "the corrections screen does not list the database's own people as a paged Collection");
      c.expect(/dipilih\.boleh_email \?/.test(halaman) && /const identitas = dipilih\?\.boleh_identitas && platformIni/.test(halaman),
        "the panel does not offer only what the database says this reader may correct");
      c.expect(!/supabaseService/.test(halaman), "the corrections screen reads with the service key");
      c.expect(/\{o\.pintar_id \? tampilPintarId\(o\.pintar_id\) : "—"\}/.test(halaman) && !/\{o\.institutional_id \?\? "—"\}/.test(halaman),
        "the «PINTAR ID» column does not show the PINTAR ID (4+4), or shows the school's nomor induk under that name");
      const aksi = kode(baca(ctx.repoRoot, "src/app/aktivasi/orang/actions.ts"));
      c.expect(/supabase\.rpc\("correct_person_name", \{ p_person: orang, p_name: nilai, p_reason: alasan \}\)/.test(aksi)
        && /supabase\.rpc\("correct_username", \{ p_person: orang, p_name: nilai, p_reason: alasan \}\)/.test(aksi) && !/supabaseService/.test(aksi),
        "the name and username corrections are not the database's own, asked with the caller's client");
      const aktivasi = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(/href="\/aktivasi\/orang"/.test(aktivasi), "Aktivasi does not lead to «Koreksi data orang»");
      for (const k of ["DITOLAK", "REASON_REQUIRED", "IDENTITY_NOT_FOUND", "NAME_INVALID", "NAME_UNCHANGED", "PERMINTAAN_TIDAK_SAH", "LAYANAN_TIDAK_TERSEDIA"]) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(`orang.gagal.${k}` as HleEvent, "staff", { locale });
          c.expect(!!kata && !kata.startsWith("orang."), `orang.gagal.${k} has no sentence in ${locale}`);
        }
      }
      return c.verdict("/aktivasi/orang lists orang_berakun as a paged Collection with the caller's client, opens a panel offering only the "
        + "corrections the database grants this reader (boleh_email, boleh_identitas), and asks correct_person_name and correct_username "
        + "with the caller's client; Aktivasi leads to it; every refusal has a sentence in both languages");
    },
  },
  {
    id: "B4-PINDAH-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/konfigurasi/page.tsx"));
      c.expect(/supabase\.rpc\("cari_sekolah_tujuan", \{ p_kata: cariSekolah \}\)/.test(halaman) && /supabase\.rpc\("pindah_masuk", \{ p_sekolah: satuSekolah \}\)/.test(halaman),
        "Konfigurasi does not find the destination by the directory, or read the incoming requests, through the database");
      c.expect(/data-pindah="keluar"/.test(halaman) && /action=\{transferMintaAction\}/.test(halaman) && /action=\{transferTerimaAction\}/.test(halaman),
        "Konfigurasi does not offer the request and the acceptance");
      const aksi = kode(baca(ctx.repoRoot, "src/app/konfigurasi/actions.ts"));
      c.expect(/supabase\.rpc\("transfer_minta"/.test(aksi) && /supabase\.rpc\("transfer_terima"/.test(aksi), "the actions do not ask transfer_minta and transfer_terima");
      for (const k of ["galat.transfer_search_short", "pindah.masuk.judul", "pindah.keluar.judul", "pindah.cari.kosong", "pindah.tujuan"] as const) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(k as HleEvent, "staff", { locale });
          c.expect(!!kata && kata !== k, `${k} has no sentence in ${locale}`);
        }
      }
      return c.verdict("Konfigurasi · Perpindahan finds a destination school through cari_sekolah_tujuan (exact name or code), requests the "
        + "transfer through transfer_minta, and shows the receiving school its incoming requests (pindah_masuk) to accept into its own "
        + "school year through transfer_terima; every sentence in both languages");
    },
  },
  {
    id: "B4-HAL-K01",
    run: async (ctx) => {
      const c = new Checks();
      const konf = kode(baca(ctx.repoRoot, "src/app/konfigurasi/page.tsx"));
      c.expect(/: platformKonteks\s*\? supabase\.from\("institutions"\)\.select\([^)]*\)\.order\("name"\)\.order\("id"\)\s*\.range\(\.\.\.rentang\(halSekolah\)\)/.test(konf)
        && /\.in\("institution_id", \(institutions \?\? \[\]\)\.map\(\(i\) => i\.id\)\)/.test(konf),
        "«Seluruh platform» does not read the schools a page at a time, with only those schools' years");
      c.expect(/laporanTriase\(platformIni \? null : sekolahIni, halLapor\)/.test(konf), "the problem reports are not read a page at a time");
      c.expect(/daftarKelola\(\{ jendela: halJendela, pengumuman: halPengumuman, sekolah: !lama && !platformKonteks \? satuSekolah : null \}\)/.test(konf)
        && !/w\.sekolah\.some\(/.test(konf), "the maintenance lists are not the database's pages, narrowed by the database");
      for (const k of ["hal_sekolah", "hal_lapor", "hal_jendela", "hal_pengumuman"]) {
        c.expect(new RegExp(`tautanHalaman\\("/konfigurasi", sp, "${k}", n, "[a-z-]+"\\)\\} locale=\\{locale\\}\\s+benda=\\{sl\\("koleksi\\.benda\\.[a-z]+"\\)\\} jumlah=\\{[^}]+\\} />`).test(konf), `${k} has no pager`);
      }
      const pem = kode(baca(ctx.repoRoot, "src/lib/pemeliharaan.ts"));
      c.expect(/rpc\("maintenance_list", \{\s*p_hal_jendela:/.test(pem), "daftarKelola does not ask for a page");
      const akt = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(!/rpc\("card_holders"\)/.test(akt) && /cariPemegangKartu\(supabase, cariKartu, sekolahKartu\)/.test(akt),
        "Aktivasi still reads every card holder");
      const pk = kode(baca(ctx.repoRoot, "src/lib/pemegang-kartu.ts"));
      c.expect(/\.limit\(sekolah \? 60 : 20\)/.test(pk) && /\.slice\(0, 20\)/.test(pk) && /if \(kata\.length < 1\) return \[\];/.test(pk),
        "the holder search is not bounded, or reads without words");
      const { kataAman } = await import("../src/lib/pemegang-kartu");
      c.expect(kataAman('Ani"),x*%') === "Ani ),x" && kataAman(["Budi", "x"]) === "Budi" && kataAman(undefined) === "", "the search words are not made safe");
      // the triage's paging arithmetic, executed: 23 open reports and pages of 20 (one row more is read)
      const { rentangTriase } = await import("../src/lib/lapor-masalah-kontrak");
      const r1 = rentangTriase(1, 20, 23), r2 = rentangTriase(2, 20, 23), r3 = rentangTriase(1, 20, 0), r4 = rentangTriase(3, 20, 23);
      c.expect(JSON.stringify(r1) === '{"terbuka":[0,20],"selesai":null}', `page 1: ${JSON.stringify(r1)}`);
      c.expect(JSON.stringify(r2) === '{"terbuka":[20,22],"selesai":[0,17]}', `page 2: ${JSON.stringify(r2)}`);
      c.expect(JSON.stringify(r3) === '{"terbuka":null,"selesai":[0,20]}', `no open reports: ${JSON.stringify(r3)}`);
      c.expect(JSON.stringify(r4) === '{"terbuka":null,"selesai":[17,37]}', `page 3: ${JSON.stringify(r4)}`);
      return c.verdict("«Seluruh platform» reads the schools a page at a time with only their years; the problem reports a page at a time in "
        + "the database's order (the page from open to finished reads both, executed); the maintenance windows and notices are "
        + "maintenance_list's pages narrowed by the database; Aktivasi searches the card holders on the server (at most twenty, never "
        + "without words, the words made safe); every list has its pager");
    },
  },
  {
    id: "B4-MENUNGGU-K01",
    run: async (ctx) => {
      const c = new Checks();
      const konf = kode(baca(ctx.repoRoot, "src/app/konfigurasi/page.tsx"));
      c.expect(/from\("import_jobs"\)\.select\("id", \{ count: "exact", head: true \}\)\.eq\("institution_id", satuSekolah\)\s*\.in\("state", \["AWAITING_CONFIRMATION", "AWAITING_PILOT_VERIFICATION"\]\)/.test(konf),
        "the imports waiting for a go are not counted for the context's school");
      c.expect(/rpc\("persons_awaiting_account", \{\}, \{ count: "exact", head: true \}\)\.eq\("institution_id", satuSekolah\)/.test(konf)
        && /melayani\(kh, "\/aktivasi"\)/.test(konf), "the people waiting for an account are not counted, or counted for a reader Aktivasi does not serve");
      c.expect(/rpc\("studio_home"\)\.then/.test(konf) && /r\.bucket === "ACTION_REQUIRED" \|\| r\.bucket === "AWAITING_MY_REVIEW"/.test(konf) && /melayani\(kh, "\/studio"\)/.test(konf),
        "Studio's waiting packages are not studio_home's own counts");
      c.expect(/\.filter\(\(m\) => m\.n > 0\)/.test(konf) && /\{menunggu\.length > 0 \? \(/.test(konf) && /<Link className="pin-tautan" href=\{m\.href\}>/.test(konf),
        "the landing shows an empty count, or a count that does not open where it is done");
      for (const k of ["judul", "pendataan", "aktivasi", "studio"]) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(`config.menunggu.${k}` as HleEvent, "staff", { locale });
          c.expect(!!kata && !kata.startsWith("config."), `config.menunggu.${k} has no sentence in ${locale}`);
        }
      }
      return c.verdict("Konfigurasi's landing shows what waits (UX-33), each counted by the database under the reader's row security and only "
        + "where the reader may act in this context: the school's imports waiting for a go, its people waiting for an account (every "
        + "school's in «Seluruh platform»), its packages waiting on the reader (studio_home); each opens where it is done; nothing when "
        + "nothing waits; every sentence in both languages");
    },
  },
  {
    id: "B4-J2-K01",
    run: async (ctx) => {
      const c = new Checks();
      const siapa = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/siapa/page.tsx"));
      const kelas = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/page.tsx"));
      c.expect(/<Koleksi\s+id="pin-siapa-murid"/.test(siapa) && !/<DaftarMurid\b/.test(siapa), "/siapa is not Daisy's J2Kelas Table");
      c.expect(/sel: \[<span key="k" className=\{KEADAAN\[m\.keadaan\]\.badge\} data-keadaan=\{m\.keadaan\}>\{s\(KEADAAN\[m\.keadaan\]\.kunci\)\}<\/span>\]/.test(siapa)
        && /saring=\{\{/.test(siapa) && /cari=\{cari\}/.test(siapa), "/siapa's rows do not carry their state's Badge, or the Table has no search or state filter");
      c.expect(!/format\.percent|m\.nilai|skor|peringkat|rank/i.test(siapa.slice(siapa.indexOf("<Koleksi"), siapa.indexOf("</section>", siapa.indexOf("<Koleksi")))),
        "/siapa's Table carries a score or a ranking");
      c.expect(/<Koleksi\s+id="pin-kelas-murid"/.test(kelas) && !/<DaftarMurid\b/.test(kelas) && /kolom=\{\[\{ judul: s\("mengajar\.cepat\.hasil\.kolom\.nama"\) \}\]\}/.test(kelas)
        && /sel: \[\] \}\)\)/.test(kelas), "the class page's roster is not a Table of names alone");
      c.expect(/susunKoleksi\(fakta\.murid, \{ nama: \(m\) => m\.nama, kueri: kueriDiminta\(sp\.cari\), halaman: halamanKoleksi\(sp\.hal\), ukuran: 50 \}\)/.test(kelas),
        "the class page's roster is not searched and paged");
      return c.verdict("Daisy's J2Kelas: /siapa is one Table, each learner once (the name opening their record) with their state's Badge in "
        + "the words «Lihat bukti» counts under, searched and filtered by state, no score or rank; the class page's roster is a Table "
        + "of names alone (each opening the record), searched and paged with the total");
    },
  },
  {
    id: "B4-BIDANG-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pd = kode(baca(ctx.repoRoot, "src/app/pendataan/page.tsx"));
      c.expect(/<form action=\{simpanKodeAksi\} className="pin-baris-aksi">/.test(pd)
        && /<BidangTeks id="pin-kode-isi" name="kode" label=\{s\("pendataan\.kode\.label"\)\} petunjuk=\{s\("pendataan\.kode\.bentuk"\)\}/.test(pd)
        && !/className="pin-isian"/.test(pd) && !/pin-data-btn/.test(pd),
        "the school code is not Daisy's TextField (sentence-case label, the hint under it) on one row with its button");
      const bp = kode(baca(ctx.repoRoot, "src/components/pendataan/BacaDanPetakan.tsx"));
      c.expect(!/className="pin-isian"/.test(bp) && /<label htmlFor="pin-tempel" className="pin-bidang-label">/.test(bp),
        "the intake's file and paste fields still wear the upper-case eyebrow label");
      c.expect(!/format\.date\(/.test(pd) && /tanggal\(j\.dibuat, "cap", locale\)/.test(pd), "Pendataan's job list does not say its moments on WIB (RV-16)");
      const kf = kode(baca(ctx.repoRoot, "src/app/konfigurasi/page.tsx"));
      c.expect(!/format\.date\(/.test(kf), "Konfigurasi still writes a date without the WIB helper (RV-16)");
      return c.verdict("reading the source: Pendataan's school code is the TextField primitive (sentence-case label, hint under it, named by "
        + "the field) on one row with its button; the intake's file and paste fields use the field frame with a sentence-case label; "
        + "Pendataan's job list and every Konfigurasi date go through the WIB date helper (RV-16)");
    },
  },
];

export const b4AppTests: SelfTest[] = [
  {
    id: "B4-KARTU-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const nama = `Murid Asisten ${tag}`;
      const email = `b4-asisten-${tag}@local.invalid`;
      // a learner of a synthetic school of its own, provisioned as the intake does (BOB28-A03's)
      const murid = psql(`
        do $$ declare v_p uuid; v_inst uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.institutions (name, slug, is_synthetic, is_active)
          values (${lit(`Sekolah Asisten ${tag}`)}, ${lit(`sekolah-asisten-${tag}`)}, true, true) returning id into v_inst;
          update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                      where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
           where id = v_inst;
          insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
          perform public.issue_institutional_id(v_p, v_inst);
        end $$;
        select id from public.persons where display_name = ${lit(nama)};`).split("\n").pop()!;
      const sys = new Peramban(asal, ipUji());
      c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200, "the platform admin could not sign in");
      await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");
      const buat = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
      const k = buat.body as { card?: string; pin?: string };
      if (!c.expect(buat.status === 200 && /^\d{10}$/.test(k.card ?? ""), `the card could not be made (${buat.status})`)) return c.verdict("");
      const akunSebelum = psql(`select id || '/' || auth_user_id from public.accounts where person_id = ${lit(murid)}`);
      const m1 = await new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: k.card!, pin: k.pin! } });
      c.expect(m1.status === 200, `the card could not sign in first (${m1.status})`);

      // the screen offers it, then the conversion
      const halaman = await sys.kirim("/aktivasi");
      const teks = await halaman.text();
      c.expect(halaman.status === 200 && teks.includes(t("aktivasi.staf.judul", "staff", { locale: "id" })), "Aktivasi does not show «Murid yang menjadi staf»");
      const tanpa = await sys.jsonDari("/api/akun/kartu-ke-email", { json: { person_id: murid, email, alasan: "  " } });
      c.expect(tanpa.status === 400 && tanpa.body?.code === "ALASAN_WAJIB", `without a reason the conversion answered ${tanpa.status} ${JSON.stringify(tanpa.body)}`);
      const ubah = await sys.jsonDari("/api/akun/kartu-ke-email", { json: { person_id: murid, email: email.toUpperCase(), alasan: "Diangkat menjadi asisten guru" } });
      if (!c.expect(ubah.status === 200 && ubah.body?.ok === true, `the conversion answered ${ubah.status} ${JSON.stringify(ubah.body)}`)) return c.verdict("");

      const m2 = await new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: k.card!, pin: k.pin! } });
      c.expect(m2.status !== 200, `the card still signs in after the conversion (${m2.status})`);
      const akunSesudah = psql(`select id || '/' || auth_user_id || '/' || kind || '/' || coalesce(card_number, '-') from public.accounts where person_id = ${lit(murid)}`);
      c.expect(akunSesudah === `${akunSebelum}/EMAIL/-`, `the account after reads ${akunSesudah}; before ${akunSebelum}`);

      const sandi = await aktifkan(c, asal, email, `asisten.${tag}`, "5937");
      if (sandi) {
        const m3 = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
        c.expect(m3.status === 200, `the activated person could not sign in with their password (${m3.status})`);
      }
      // CR-91 still decides: a staff role is now accepted for this person (it was refused over the card)
      const peran = psql(`
        do $$ declare v_node uuid; begin
          select n.id into v_node from public.org_nodes n join public.institutional_identities ii on ii.institution_id = n.institution_id
           where ii.person_id = ${lit(murid)} and n.kind = 'INSTITUTION' limit 1;
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (${lit(murid)}, 'EDUCATOR', v_node, now() + interval '1 year');
        end $$;
        select count(*) from public.role_assignments where person_id = ${lit(murid)} and revoked_at is null;`).split("\n").pop();
      c.expect(peran === "1", `the staff role after the conversion: ${peran}`);
      const jejak = psql(`select (summary ->> 'reason') || '|' || (summary #>> '{from,card_number}') || '|' || (summary #>> '{to,email}')
                            from public.audit_log where action = 'account.card_converted_to_email' and target_id = ${lit(murid)}`);
      c.expect(jejak === `Diangkat menjadi asisten guru|${k.card}|${email}`, `the conversion is audited as «${jejak}»`);
      return c.verdict("a class-card learner signed in with the card; without a reason the conversion was refused (ALASAN_WAJIB); with one "
        + "it answered ok, after which the card signed nobody in; the same account row and Auth user are an EMAIL account; the person "
        + "activated it with a code to the new address and signed in with their password; a staff role was then accepted (CR-91 still "
        + "decides in the database); the conversion is audited with its reason, the old card and the new address");
    },
  },
];
