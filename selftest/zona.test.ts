/**
 * A SCHOOL'S DATE IS WRITTEN ON ITS OWN CLOCK (the owner's ruling, 10 Nov: school-context dates in 4.0). A named
 * school's assessments, deadlines, departures, promotions and audit events are written in that school's zone
 * (institutions.zona_waktu: Asia/Jakarta WIB, Asia/Makassar WITA, Asia/Jayapura WIT); a platform-wide or personal
 * moment tied to no school stays WIB and says so; stored timestamps are unchanged, only how they are written and the
 * school-day calculations that were still WIB-only.
 *
 *  ZONA-01  THE FORMATTER. src/lib/tanggal.ts writes one instant in each zone with its own offset and word (WIB +7,
 *           WITA +8, WIT +9) in every form with a time; the day moves with the zone where it should (23.30 WIB is
 *           00.30 WITA the next day); a field's yyyy-mm-dd or yyyy-mm-ddThh:mm is read as written whatever the zone
 *           (only its word follows the zone); no zone, or an unknown one, is WIB as before; jam(), gemaTanggal(),
 *           the zone's word and offset, format.date, the maintenance clock and judulAsesmen take the same zone.
 *  ZONA-02  THE SCHOOL-DAY CALCULATIONS. A date and time typed for one school's maintenance window is read on that
 *           school's clock (WIB when none); the default academic year turns on 1 July on the school's clock; a role's
 *           last day ends at 23.59.59 on the school's clock (batasHari), never a hard-coded +07:00.
 *  ZONA-03  THE SURFACES. Reads the source: the school-context pages and components pass their school's zone to the
 *           date helper; platform and personal surfaces either pass a row's own school or stay WIB by the convention;
 *           no comment claims «the school's time zone» over a WIB-only write; the teacher's home reads its «today»
 *           and greeting on the school's clock.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** Source without its comments, so a comment that names a call is not the call. */
const kode = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

/** 2026-10-09 16:30 UTC: Friday 23.30 WIB, but Saturday 00.30 WITA and 01.30 WIT */
const MALAM = "2026-10-09T16:30:00Z";
/** 2026-10-09 00:30 UTC: Friday 07.30 WIB, 08.30 WITA, 09.30 WIT */
const PAGI = "2026-10-09T00:30:00Z";

export const zonaTests: SelfTest[] = [
  {
    id: "ZONA-01",
    run: async () => {
      const c = new Checks();
      const t = await import("../src/lib/tanggal");
      const HARAP: Array<[string, Parameters<typeof t.tanggal>[1], "id" | "en", string | null | undefined, string]> = [
        [PAGI, "cap", "id", "Asia/Jakarta", "9 Okt 2026, 07.30 WIB"],
        [PAGI, "cap", "id", "Asia/Makassar", "9 Okt 2026, 08.30 WITA"],
        [PAGI, "cap", "id", "Asia/Jayapura", "9 Okt 2026, 09.30 WIT"],
        [PAGI, "hariJam", "en", "Asia/Makassar", "Friday, 9 Oct 2026, 08.30 WITA"],
        [PAGI, "resmiJam", "id", "Asia/Jayapura", "9 Oktober 2026 pukul 09.30 WIT"],
        [MALAM, "hariJam", "id", "Asia/Jakarta", "Jumat, 9 Okt 2026, 23.30 WIB"],
        [MALAM, "hariJam", "id", "Asia/Makassar", "Sabtu, 10 Okt 2026, 00.30 WITA"],
        [MALAM, "hariJam", "id", "Asia/Jayapura", "Sabtu, 10 Okt 2026, 01.30 WIT"],
        [MALAM, "baca", "id", "Asia/Jakarta", "9 Okt 2026"],
        [MALAM, "baca", "id", "Asia/Makassar", "10 Okt 2026"],
        [MALAM, "ringkas", "id", "Asia/Jayapura", "10/10/2026"],
        [MALAM, "resmi", "en", "Asia/Makassar", "10 October 2026"],
        // no zone, or one PINTAR does not keep: WIB, as before
        [MALAM, "hariJam", "id", undefined, "Jumat, 9 Okt 2026, 23.30 WIB"],
        [MALAM, "hariJam", "id", null, "Jumat, 9 Okt 2026, 23.30 WIB"],
        [MALAM, "cap", "en", "Europe/London", "9 Oct 2026, 23.30 WIB"],
        // a field's own value is read as written, whatever the zone; only the word follows it
        ["2026-10-09", "hari", "id", "Asia/Jayapura", "Jumat, 9 Okt 2026"],
        ["2026-10-09", "hariJam", "id", "Asia/Makassar", "Jumat, 9 Okt 2026"],
        ["2026-10-09T07:30", "hariJam", "id", "Asia/Makassar", "Jumat, 9 Okt 2026, 07.30 WITA"],
        ["2026-10-09T23:59", "cap", "en", "Asia/Jayapura", "9 Oct 2026, 23.59 WIT"],
      ];
      for (const [nilai, bentuk, locale, zona, harap] of HARAP) {
        const v = t.tanggal(nilai, bentuk, locale, zona);
        c.expect(v === harap, `tanggal(«${nilai}», ${bentuk}, ${locale}, ${zona}) is «${v}», not «${harap}»`);
      }
      // the zone's word and offset, from the one table
      const kata = (t as { kataZona?: (z?: string | null) => string }).kataZona;
      const geser = (t as { geserZona?: (z?: string | null) => number }).geserZona;
      if (c.expect(typeof kata === "function" && typeof geser === "function", "src/lib/tanggal.ts has no kataZona/geserZona")) {
        c.expect(kata!("Asia/Jakarta") === "WIB" && kata!("Asia/Makassar") === "WITA" && kata!("Asia/Jayapura") === "WIT" && kata!(null) === "WIB" && kata!("UTC") === "WIB",
          `the zone words are ${["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", null, "UTC"].map((z) => kata!(z)).join(", ")}`);
        c.expect(geser!("Asia/Jakarta") === 7 * 3600_000 && geser!("Asia/Makassar") === 8 * 3600_000 && geser!("Asia/Jayapura") === 9 * 3600_000 && geser!(undefined) === 7 * 3600_000,
          "the zone offsets are not +7, +8, +9 hours (WIB when none)");
      }
      // the time of day, and the field's echo
      const jam = t.jam as (n: string, z?: string | null) => string;
      c.expect(jam(MALAM) === "23.30" && jam(MALAM, "Asia/Makassar") === "00.30" && jam(MALAM, "Asia/Jayapura") === "01.30" && jam("2026-10-09", "Asia/Jayapura") === "",
        `jam() reads «${jam(MALAM)}», «${jam(MALAM, "Asia/Makassar")}», «${jam(MALAM, "Asia/Jayapura")}»`);
      const gema = t.gemaTanggal as (n: string, l?: "id" | "en", z?: string | null) => string;
      c.expect(gema("2026-10-09T07:30", "id") === "Jumat, 9 Okt 2026, 07.30 WIB" && gema("2026-10-09T07:30", "id", "Asia/Makassar") === "Jumat, 9 Okt 2026, 07.30 WITA"
        && gema("2026-10-09T07:30", "en", "Asia/Jayapura") === "Friday, 9 Oct 2026, 07.30 WIT" && gema("2026-10-09", "id", "Asia/Jayapura") === "Jumat, 9 Okt 2026",
        `the echo reads «${gema("2026-10-09T07:30", "id", "Asia/Makassar")}» / «${gema("2026-10-09T07:30", "en", "Asia/Jayapura")}»`);
      c.expect(gema(PAGI, "id", "Asia/Makassar") === "", "the echo writes an instant that is not a field's value");
      // the surfaces built on it take the same zone
      const { format } = await import("../src/lib/hle");
      const fd = format.date as (iso: string, l?: "id" | "en", z?: string | null) => string;
      c.expect(fd(MALAM, "id") === "9 Oktober 2026" && fd(MALAM, "id", "Asia/Makassar") === "10 Oktober 2026" && fd(MALAM, "en", "Asia/Jayapura") === "10 October 2026",
        `format.date reads «${fd(MALAM, "id")}» / «${fd(MALAM, "id", "Asia/Makassar")}»`);
      const { jamWib } = await import("../src/lib/pemeliharaan-kontrak");
      const jw = jamWib as (iso: string, z?: string | null) => string;
      c.expect(jw(MALAM) === "23.30" && jw(MALAM, "Asia/Jayapura") === "01.30", `the maintenance clock reads «${jw(MALAM)}» / «${jw(MALAM, "Asia/Jayapura")}»`);
      const { judulAsesmen } = await import("../src/lib/judul-asesmen");
      const ja = judulAsesmen as (a: { judul: string; mode: string; dibuka: string | null }, l: "id" | "en", z?: string | null) => string;
      const uc = { judul: "x", mode: "QUICK", dibuka: PAGI };
      c.expect(ja(uc, "id").endsWith("9 Okt 2026, 07.30 WIB") && ja(uc, "id", "Asia/Makassar").endsWith("9 Okt 2026, 08.30 WITA"),
        `an Uji Cepat is named «${ja(uc, "id")}» / «${ja(uc, "id", "Asia/Makassar")}»`);
      return c.verdict(`${HARAP.length} values in WIB, WITA and WIT (offset and word; the day moves with the zone; a field's value as written; WIB when none); jam, the echo, format.date, the maintenance clock and an Uji Cepat's name take the zone`);
    },
  },
  {
    id: "ZONA-02",
    run: async (ctx) => {
      const c = new Checks();
      const pk = await import("../src/lib/pemeliharaan-kontrak");
      const ws = (pk as { waktuSekolah?: (n: string | null | undefined, z?: string | null) => string | null }).waktuSekolah;
      if (c.expect(typeof ws === "function", "src/lib/pemeliharaan-kontrak.ts has no waktuSekolah (a typed time on a school's clock)")) {
        c.expect(ws!("2026-10-09T07:30", "Asia/Jakarta") === "2026-10-09T00:30:00.000Z" && ws!("2026-10-09T07:30", "Asia/Makassar") === "2026-10-08T23:30:00.000Z"
          && ws!("2026-10-09T07:30", "Asia/Jayapura") === "2026-10-08T22:30:00.000Z" && ws!("2026-10-09T07:30") === "2026-10-09T00:30:00.000Z"
          && ws!("", "Asia/Makassar") === null && ws!("07:30", "Asia/Makassar") === null,
          `07.30 typed for a WITA school reads ${ws!("2026-10-09T07:30", "Asia/Makassar")}, for a WIT school ${ws!("2026-10-09T07:30", "Asia/Jayapura")}`);
      }
      c.expect(pk.waktuWib("2026-10-05T22:00") === "2026-10-05T15:00:00.000Z", "waktuWib no longer reads WIB");
      const { tahunAjaranPada } = await import("../src/lib/struktur-kontrak");
      const ta = tahunAjaranPada as (d: Date, z?: string | null) => string;
      // 30 Jun 2026 16:30 UTC: 23.30 WIB on 30 June, but 00.30 WITA and 01.30 WIT on 1 July
      const d = new Date("2026-06-30T16:30:00Z");
      c.expect(ta(d) === "2025/2026" && ta(d, "Asia/Jakarta") === "2025/2026" && ta(d, "Asia/Makassar") === "2026/2027" && ta(d, "Asia/Jayapura") === "2026/2027",
        `the academic year at 30 Jun 16.30 UTC reads ${ta(d)} (WIB), ${ta(d, "Asia/Makassar")} (WITA), ${ta(d, "Asia/Jayapura")} (WIT)`);
      const { batasHari } = await import("../src/lib/hle");
      c.expect(batasHari("2026-12-31", "akhir", "Asia/Jayapura") === "2026-12-31T23:59:59+09:00", "a WIT school's last day does not end at 23.59.59 +09:00");
      const aksi = kode(readFileSync(join(ctx.repoRoot, "src/app/konfigurasi/actions.ts"), "utf8"));
      c.expect(!/\+07:00/.test(aksi), "Konfigurasi's actions still write a hard-coded +07:00");
      c.expect((aksi.match(/p_valid_until: batasHari\([^)]*"akhir", [^)]*\)/g) ?? []).length === 2,
        "a role's last day is not sent as the end of that day on the school's clock (batasHari) in both grants");
      c.expect(/waktuSekolah\(mulaiTeks, zona\)/.test(aksi) && /waktuSekolah\(str\(fd, "selesai"\), zona\)/.test(aksi)
        && /waktuSekolah\(terbitTeks, zona\)/.test(aksi) && /waktuSekolah\(str\(fd, "sampai"\), zona\)/.test(aksi),
        "a maintenance window's or notice's typed times are not read on the clock of the school it is for");
      return c.verdict("a typed maintenance time for one school is read on its clock (WIB when none); the default academic year turns on 1 July on the school's clock; a role's last day ends at 23.59.59 on the school's clock, no +07:00 left in the actions");
    },
  },
  {
    id: "ZONA-03",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (f: string) => kode(readFileSync(join(ctx.repoRoot, f), "utf8"));
      const mentah = (f: string) => readFileSync(join(ctx.repoRoot, f), "utf8");
      /** every call of the date helper in the file carries a zone (a 4th argument) */
      const semuaBerzona = (f: string, min = 1) => {
        const isi = baca(f);
        const panggil = [...isi.matchAll(/\btanggal\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g)].map((m) => m[1]);
        const tanpa = panggil.filter((a) => a.split(/,(?![^(]*\))/).length < 4);
        c.expect(panggil.length >= min && tanpa.length === 0, `${f}: ${tanpa.length} of ${panggil.length} dates are written without the school's zone: ${tanpa.slice(0, 3).join(" | ")}`);
      };
      // SCHOOL: every date the page writes is its school's
      for (const f of [
        "src/app/mengajar/[kelas]/page.tsx", "src/app/mengajar/[kelas]/siapkan/page.tsx", "src/app/mengajar/[kelas]/ulang/page.tsx",
        "src/app/edukator/ringkasan/page.tsx", "src/app/dekan/ringkasan/page.tsx", "src/components/pimpinan/KartuKeputusan.tsx",
        "src/app/pimpinan/[simpul]/murid/[orang]/page.tsx", "src/app/konfigurasi/staf/page.tsx", "src/app/konfigurasi/sertifikat/page.tsx",
        "src/app/pendataan/page.tsx", "src/components/bukti/KeadaanHariIni.tsx", "src/components/studio/LangkahTerbit.tsx",
        "src/components/kenaikan/KenaikanKelas.tsx", "src/components/siklus/OrientasiAsesmen.tsx",
        "src/app/belajar/sertifikat/page.tsx", "src/app/lapor/saya/page.tsx", "src/app/mengajar/page.tsx", "src/app/belajar/page.tsx",
      ]) semuaBerzona(f);
      // the wrappers bind the zone
      c.expect(/tanggal\(iso, bentuk, locale, zona\)/.test(baca("src/app/konfigurasi/page.tsx")), "Konfigurasi's when() does not write on a zone");
      c.expect(/tanggal\(iso, "cap", locale, zona\)/.test(baca("src/app/studio/_lib.ts")), "Studio's when() takes no zone");
      c.expect(/export const zonaStudio = cache\(async \(\) =>\s*zonaSekolahBanyak\(/.test(baca("src/app/studio/_lib.ts")), "Studio's schools are read without their zone");
      c.expect(/tanggal\(a\.dibuka, "cap", locale, zona\)/.test(baca("src/lib/judul-asesmen.ts")), "judulAsesmen takes no zone");
      for (const [f, pola] of [
        ["src/app/mengajar/[kelas]/uji-cepat/page.tsx", /judulAsesmen\(hidup, locale, zona\)[\s\S]*judulAsesmen\(terakhir, locale, zona\)/],
        ["src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx", /judulAsesmen\(tugas, locale, zona\)/],
        ["src/components/bukti/KeadaanHariIni.tsx", /judulAsesmen\(a, locale, zona\)/],
        ["src/app/studio/paket/[course]/page.tsx", /zonaSekolah\(supabase, course\.institution_id\)/],
        ["src/app/studio/tinjau/page.tsx", /when\(c\.created_at, locale, zonaDari\(c\.institution_id\)\)/],
        ["src/app/studio/integritas/page.tsx", /when\(g\.observed_at, locale, zonaDari\(g\.institution_id\)\)[\s\S]*when\(g\.case_decided_at, locale, zona\)/],
        ["src/app/studio/kanonik/page.tsx", /when\(r\.authorized_at, locale, zonaDari\(r\.consuming_institution_id\)\)/],
        ["src/components/sertifikat/KartuSertifikat.tsx", /format\.date\([^)]*, cred\.zona\)/],
        ["src/app/konfigurasi/page.tsx", /tahunAjaranPada\(new Date\(\), zonaKonteks\)/],
        ["src/lib/pengajar.ts", /export function waktu\(zona\?: string \| null\)[\s\S]{0,300}bagianJakarta\(now, geserZona\(zona\)\)/],
        ["src/app/mengajar/page.tsx", /ajar\.waktu\(zona\)/],
      ] as const) c.expect(pola.test(baca(f)), `${f} does not write its school's dates on its clock (${pola.source.slice(0, 60)})`);
      // PLATFORM rows: each in its own school's zone, WIB when it has none
      const konf = baca("src/app/konfigurasi/page.tsx");
      c.expect(/when\(r\.at, "cap", zonaBaris\(r\.institution_id\)\)/.test(konf), "the audit trail does not write each row on its own school's clock");
      // PERSONAL and PLATFORM moments tied to no school: WIB, as the convention says, and the comments say so
      for (const f of ["src/components/keamanan/CatatanKeamanan.tsx", "src/lib/email/identitas.ts"]) {
        c.expect(!/the school's time zone/i.test(mentah(f)), `${f}: a comment claims «the school's time zone» over a WIB-only write`);
      }
      // the maintenance form's labels name the zone the form is read in
      const { t } = await import("../src/lib/hle");
      for (const k of ["config.pemeliharaan.mulai", "config.pemeliharaan.selesai", "config.pemeliharaan.pengumuman.terbit", "config.pemeliharaan.pengumuman.sampai"] as const) {
        c.expect(t(k, "staff").includes("{zona}") && t(k, "staff", { locale: "en" }).includes("{zona}") && !/WIB/.test(t(k, "staff")), `«${k}» still says WIB whatever the school`);
      }
      c.expect((konf.match(/\.replace\("\{zona\}", kataZona\(zonaPm\)\)/g) ?? []).length === 4, "Konfigurasi does not name the maintenance form's zone in its four time labels");
      c.expect((konf.match(/locale=\{locale\} zona=\{zonaPm\}/g) ?? []).length === 4, "the maintenance form's echoes do not write the form's zone");
      return c.verdict("the school pages and components write every date with their school's zone; the wrappers (Konfigurasi, Studio, judulAsesmen, the certificate card) carry it; the audit trail writes each row on its own school's clock; the teacher's home reads today on the school's clock; no comment claims the school's zone over WIB; the maintenance form names its zone");
    },
  },
];
