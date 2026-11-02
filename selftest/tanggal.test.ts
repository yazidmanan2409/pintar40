/**
 * W3.3 · ONE DATE HELPER, AND THE DATE FIELD'S ECHO (Batch 2; RV-16; Daisy, components/Dates and
 * components/DateTime, accepted 5 Oct). Each guard is RED on the code before it (the exit gate).
 *
 *  TANGGAL-01  THE GRAMMAR. src/lib/tanggal.ts writes every form in both languages for fixed instants: «9 Okt 2026»,
 *              «Jumat, 9 Okt 2026», «Jumat, 9 Okt 2026, 07.30 WIB», «9 Okt 2026, 07.30 WIB», «09/10/2026»,
 *              «9 Oktober 2026», and «Friday, 9 Oct 2026, 07.30 WIB» in English; the twelve months and the seven
 *              days by their names; always WIB, whatever the server's zone (a UTC late evening is the next day in
 *              Jakarta; the same answers under TZ=America/Los_Angeles); a field's yyyy-mm-dd is never shifted; an
 *              impossible day is nothing. The copy table's format.date and the maintenance clock come from it, and
 *              the emails keep their formal form.
 *  TANGGAL-02  NO SURFACE FORMATS A DATE ON ITS OWN. No toLocale…String or Intl.DateTimeFormat in src outside the
 *              helper, but for two stated exceptions in src/lib/hle.ts that write no date a person reads.
 *  TANGGAL-03  EVERY DATE FIELD HAS ITS ECHO. No native date, datetime-local or time input in src outside
 *              TanggalDenganGema; each use is labelled by its caller; rendered, the field is described by the echo
 *              first, and the echo says the date in words with the day (with WIB for a time), «Belum ada tanggal.»
 *              when empty, politely; name, id, value, required, min and max pass through.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { render } from "./ux2.test";

function berkas(dir: string, cocok: RegExp): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...berkas(p, cocok));
    else if (cocok.test(n)) out.push(p);
  }
  return out;
}
/** Source without its comments, so a comment that names a call is not the call. */
const kode = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

/** 2026-10-09 07:30 WIB (a Friday) */
const PAGI = "2026-10-09T00:30:00Z";
/** 2026-10-08 17:30 UTC: still Thursday in London, already Friday 00.30 in Jakarta */
const MALAM_UTC = "2026-10-08T17:30:00Z";
/** 2026-12-31 20:15 UTC: New Year's Day 2027, 03.15 WIB (a Friday) */
const TAHUN_BARU = "2026-12-31T20:15:00Z";

const HARAP: Array<[string, string, "id" | "en", string]> = [
  [PAGI, "baca", "id", "9 Okt 2026"],
  [PAGI, "hari", "id", "Jumat, 9 Okt 2026"],
  [PAGI, "hariJam", "id", "Jumat, 9 Okt 2026, 07.30 WIB"],
  [PAGI, "cap", "id", "9 Okt 2026, 07.30 WIB"],
  [PAGI, "ringkas", "id", "09/10/2026"],
  [PAGI, "resmi", "id", "9 Oktober 2026"],
  [PAGI, "resmiJam", "id", "9 Oktober 2026 pukul 07.30 WIB"],
  [PAGI, "baca", "en", "9 Oct 2026"],
  [PAGI, "hari", "en", "Friday, 9 Oct 2026"],
  [PAGI, "hariJam", "en", "Friday, 9 Oct 2026, 07.30 WIB"],
  [PAGI, "cap", "en", "9 Oct 2026, 07.30 WIB"],
  [PAGI, "ringkas", "en", "09/10/2026"],
  [PAGI, "resmi", "en", "9 October 2026"],
  [MALAM_UTC, "hariJam", "id", "Jumat, 9 Okt 2026, 00.30 WIB"],
  [MALAM_UTC, "hariJam", "en", "Friday, 9 Oct 2026, 00.30 WIB"],
  [MALAM_UTC, "ringkas", "id", "09/10/2026"],
  [TAHUN_BARU, "hariJam", "id", "Jumat, 1 Jan 2027, 03.15 WIB"],
  [TAHUN_BARU, "cap", "en", "1 Jan 2027, 03.15 WIB"],
  // a field's own values: a day as written, a wall-clock time on the school's clock as written
  ["2026-10-09", "hari", "id", "Jumat, 9 Okt 2026"],
  ["2026-10-09", "hariJam", "id", "Jumat, 9 Okt 2026"],
  ["2026-10-09", "ringkas", "id", "09/10/2026"],
  ["2026-10-09T07:30", "hariJam", "id", "Jumat, 9 Okt 2026, 07.30 WIB"],
  ["2026-10-09T23:59", "cap", "en", "9 Oct 2026, 23.59 WIB"],
  ["2026-02-30", "baca", "id", ""],
  ["", "baca", "id", ""],
  ["bukan tanggal", "baca", "id", ""],
];

export const tanggalTests: SelfTest[] = [
  {
    id: "TANGGAL-01",
    run: async (ctx) => {
      const c = new Checks();
      const { tanggal, gemaTanggal, jam } = await import("../src/lib/tanggal");
      type B = Parameters<typeof tanggal>[1];
      for (const [nilai, bentuk, locale, harap] of HARAP) {
        const v = tanggal(nilai, bentuk as B, locale);
        c.expect(v === harap, `tanggal(«${nilai}», ${bentuk}, ${locale}) is «${v}», not «${harap}»`);
      }
      c.expect(tanggal(new Date(MALAM_UTC), "hari") === "Jumat, 9 Okt 2026", "a Date is not read on Jakarta's clock");
      c.expect(tanggal(null) === "", "nothing is not written as nothing");
      const BULAN_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const BULAN_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      for (let b = 1; b <= 12; b++) {
        const hari = `2026-${String(b).padStart(2, "0")}-15`;
        c.expect(tanggal(hari, "baca", "id") === `15 ${BULAN_ID[b - 1]} 2026` && tanggal(hari, "baca", "en") === `15 ${BULAN_EN[b - 1]} 2026`,
          `month ${b} reads «${tanggal(hari, "baca", "id")}» / «${tanggal(hari, "baca", "en")}»`);
        c.expect(!/\./.test(tanggal(hari, "baca", "id")), `month ${b} carries a full stop`);
      }
      const HARI_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
      const HARI_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      for (let i = 0; i < 7; i++) {
        const hari = `2026-10-${String(5 + i).padStart(2, "0")}`; // Monday 5 Oct … Sunday 11 Oct
        c.expect(tanggal(hari, "hari", "id").startsWith(`${HARI_ID[i]}, `) && tanggal(hari, "hari", "en").startsWith(`${HARI_EN[i]}, `),
          `${hari} reads «${tanggal(hari, "hari", "id")}» / «${tanggal(hari, "hari", "en")}»`);
      }
      // the echo: a field's value only, in words with the day
      c.expect(gemaTanggal("2026-10-09", "id") === "Jumat, 9 Okt 2026" && gemaTanggal("2026-10-09T07:30", "en") === "Friday, 9 Oct 2026, 07.30 WIB",
        `the echo reads «${gemaTanggal("2026-10-09", "id")}» / «${gemaTanggal("2026-10-09T07:30", "en")}»`);
      c.expect(gemaTanggal("") === "" && gemaTanggal("2026-02-30") === "" && gemaTanggal(PAGI) === "", "the echo writes a date for an empty, impossible or non-field value");
      c.expect(jam("2026-10-05T15:00:00Z") === "22.00" && jam("2026-10-09") === "", `the time reads «${jam("2026-10-05T15:00:00Z")}»`);

      // whatever the server's zone: the same answers in a process on Los Angeles time
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => { const m = await import('file://' + process.cwd() + '/src/lib/tanggal.ts');" +
        " const t = m.tanggal ?? m.default?.tanggal;" +
        ` process.stdout.write(JSON.stringify([t('${MALAM_UTC}', 'hariJam'), t('2026-10-09', 'hari'), t('2026-10-09T07:30', 'cap'), new Date('${MALAM_UTC}').getDate()])); })()`,
      ], { cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, TZ: "America/Los_Angeles" } });
      const la = (() => { try { return JSON.parse(anak.stdout) as [string, string, string, number]; } catch { return null; } })();
      c.expect(la !== null && la[0] === "Jumat, 9 Okt 2026, 00.30 WIB" && la[1] === "Jumat, 9 Okt 2026" && la[2] === "9 Okt 2026, 07.30 WIB",
        `on a Los Angeles server the dates read ${anak.stdout || anak.stderr.split("\n")[0]}`);
      c.expect(la !== null && la[3] === 8, "the control: on Los Angeles time the device's own date for the instant should be the 8th");

      // the surfaces built on it
      const { format } = await import("../src/lib/hle");
      c.expect(format.date(PAGI, "id") === "9 Oktober 2026" && format.date(MALAM_UTC, "en") === "9 October 2026",
        `format.date reads «${format.date(PAGI, "id")}» / «${format.date(MALAM_UTC, "en")}»`);
      const { jamWib } = await import("../src/lib/pemeliharaan-kontrak");
      c.expect(jamWib("2026-10-05T15:00:00Z") === "22.00", `the maintenance clock reads «${jamWib("2026-10-05T15:00:00Z")}»`);
      const { templatKeamanan } = await import("../src/components/email/keamanan");
      const e = templatKeamanan({ peristiwa: "TERKUNCI", untuk: "PEMILIK", pintarId: "A14CD7ST", waktu: "2026-10-04T08:00:00Z", tautanLupa: "https://uji.invalid/masuk/lupa" },
        { asal: "https://uji.invalid", staging: true });
      c.expect(e.teks.includes("4 Oktober 2026 pukul 15.00 WIB"), "the security email does not write its moment in the formal form, on WIB");
      return c.verdict(`${HARAP.length} fixed values read in every form and both languages (a UTC late evening is the next day in Jakarta, on any server's zone); twelve months and seven days by name; format.date, the maintenance clock and the emails come from the one helper`);
    },
  },
  {
    id: "TANGGAL-02",
    run: async (ctx) => {
      const c = new Checks();
      const PENGECUALIAN: Record<string, { jumlah: number; sebab: string; pola: RegExp }> = {
        // asks the zone's offset on a day (so a zone with daylight saving would still be right), and writes a date
        // field's value (yyyy-mm-dd); neither is a date a person reads
        "src/lib/hle.ts": { jumlah: 2, sebab: "selisihZona and hariIniSekolah", pola: /function selisihZona[\s\S]*?Intl\.DateTimeFormat\("en-US"[\s\S]*?function hariIniSekolah[\s\S]*?Intl\.DateTimeFormat\("en-CA"/ },
      };
      let n = 0;
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.(ts|tsx)$/)) {
        const r = relative(ctx.repoRoot, f).split("\\").join("/");
        n++;
        const isi = kode(readFileSync(f, "utf8"));
        const temu = isi.match(/\.toLocale(?:Date|Time)?String\(|Intl\.DateTimeFormat\b/g) ?? [];
        const boleh = PENGECUALIAN[r];
        if (boleh) {
          c.expect(temu.length === boleh.jumlah && boleh.pola.test(isi), `${r}: ${temu.length} date formatting calls; only ${boleh.sebab} may ask Intl`);
        } else {
          c.expect(temu.length === 0, `${r} formats a date on its own (${temu.join(", ")}): use src/lib/tanggal.ts`);
        }
      }
      // the places RV-16 named now ask the helper
      const ASAL: Array<[string, RegExp]> = [
        ["src/app/konfigurasi/page.tsx", /tanggal\(iso, bentuk, locale\)/],
        ["src/app/studio/_lib.ts", /tanggal\(iso, "cap"\)/],
        ["src/components/email-uji/RiwayatEmail.tsx", /tanggal\(iso, "cap", locale\)/],
        ["src/components/keamanan/CatatanKeamanan.tsx", /tanggal\(iso, "cap", locale\)/],
        ["src/components/keamanan/PemulihanPin.tsx", /tanggal\(iso, "hariJam", locale\)/],
        ["src/lib/pengajar.ts", /bagianJakarta\(now\)/],
        ["src/lib/pemeliharaan-kontrak.ts", /return jam\(iso\)/],
        ["src/components/email/identitas.ts", /tanggal\(data\.waktu, "resmiJam"\)/],
        ["src/components/email/keamanan.ts", /tanggal\(data\.waktu, "resmiJam"\)/],
      ];
      for (const [f, pola] of ASAL) c.expect(pola.test(kode(readFileSync(join(ctx.repoRoot, f), "utf8"))), `${f} does not write its date through src/lib/tanggal.ts`);
      const konf = kode(readFileSync(join(ctx.repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      c.expect(!/valid_until\.slice\(0, 10\)/.test(konf), "Konfigurasi shows a role's end as a raw yyyy-mm-dd");
      c.expect(!/\{when\([^)]*\)\} \{sl\("pemeliharaan\.zona"\)\}/.test(konf), "Konfigurasi writes «WIB» twice after a moment");
      const jalanHelper = join(ctx.repoRoot, "src/lib/tanggal.ts");
      if (c.expect(existsSync(jalanHelper), "there is no one date helper (src/lib/tanggal.ts)")) {
        c.expect(!/Intl\.|toLocale|getHours\(|getDate\(|getDay\(/.test(kode(readFileSync(jalanHelper, "utf8"))), "the helper leans on the device's zone or locale data");
      }
      return c.verdict(`${n} source files: no date formatted outside src/lib/tanggal.ts (hle.ts asks Intl only for an offset and a field value); the RV-16 places ask the helper`);
    },
  },
  {
    id: "TANGGAL-03",
    run: async (ctx) => {
      const c = new Checks();
      const KOMPONEN = join("bentuk", "TanggalDenganGema.tsx");
      let pakai = 0;
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.tsx$/)) {
        const r = relative(ctx.repoRoot, f);
        const isi = kode(readFileSync(f, "utf8"));
        if (!f.endsWith(KOMPONEN)) {
          c.expect(!/type=["{]+\s*["']?(?:date|datetime-local|time)["'}]/.test(isi), `${r}: a native date or time field without its echo (RV-16)`);
        }
        for (const m of isi.matchAll(/<TanggalDenganGema\b([^>]*)\/>/g)) {
          pakai++;
          const id = /\bid="([^"]+)"/.exec(m[1])?.[1];
          c.expect(Boolean(id) && isi.includes(`htmlFor="${id}"`), `${r}: ${m[0].slice(0, 80)} is not named by a label of its own`);
          c.expect(/\blocale=\{locale\}/.test(m[1]), `${r}: ${m[0].slice(0, 80)} is not in the reader's language`);
        }
      }
      // the fields RV-16 named, each with its echo, under the same names and ids the forms, tests and audits use
      const siapkan = kode(readFileSync(join(ctx.repoRoot, "src/app/mengajar/[kelas]/siapkan/page.tsx"), "utf8"));
      // RESTATED FOR W3.11 (Batch 3): «mulai» starts on `mulaiAwal` (the dates a refusal sent back, the window made
      // available, else the school's today: DAISY-14-TANGGAL-01 holds that); both fields keep their echo, ids and names.
      c.expect(/<TanggalDenganGema id="pin-mulai" name="mulai" defaultValue=\{mulaiAwal\}/.test(siapkan) && /<TanggalDenganGema id="pin-sampai" name="sampai"/.test(siapkan),
        "Siapkan's «mulai» and «sampai» have no echo");
      const konf = kode(readFileSync(join(ctx.repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      for (const [nama, n, jenis] of [["pm_mulai", 1, "datetime-local"], ["pm_selesai", 1, "datetime-local"], ["terbit", 1, "datetime-local"], ["sampai", 1, "datetime-local"], ["valid_until", 2, null]] as const) {
        const k = konf.match(new RegExp(`<TanggalDenganGema ${jenis ? `jenis="${jenis}" ` : ""}id="[^"]+" name="${nama}"`, "g")) ?? [];
        c.expect(k.length === n, `Konfigurasi's «${nama}» has ${k.length} echoed field(s), not ${n}`);
      }
      c.expect(pakai >= 8, `only ${pakai} echoed date fields`);

      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const kosong = t("tanggal.belum", "staff", { locale });
        c.expect(locale === "en" || kosong === "Belum ada tanggal.", `the empty echo says «${kosong}»`);
        const r = render(ctx.repoRoot, "src/components/bentuk/TanggalDenganGema.tsx",
          { id: "uji", name: "mulai", defaultValue: "2026-10-09", required: true, min: "2026-01-01", max: "2026-12-31", keterangan: "uji-catatan", locale });
        if (!c.expect(r.ok, `TanggalDenganGema could not be rendered: ${r.galat}`)) continue;
        const x = r.html;
        const input = /<input\b[^>]*>/.exec(x)?.[0] ?? "";
        c.expect(/type="date"/.test(input) && /id="uji"/.test(input) && /name="mulai"/.test(input) && /value="2026-10-09"/.test(input)
          && /required=""/.test(input) && /min="2026-01-01"/.test(input) && /max="2026-12-31"/.test(input),
          `(${locale}) the field does not pass its name, id, value, required, min and max through: ${input}`);
        c.expect(/aria-describedby="uji-gema uji-catatan"/.test(input), `(${locale}) the field is not described by its echo first: ${input}`);
        const hari = locale === "en" ? "Friday, 9 Oct 2026" : "Jumat, 9 Okt 2026";
        c.expect(new RegExp(`<p class="pin-gema" aria-live="polite">.*<span id="uji-gema">${hari}</span></p>`).test(x),
          `(${locale}) the echo does not say «${hari}» politely after the field`);
        c.expect(x.indexOf("<input") < x.indexOf('class="pin-gema"'), `(${locale}) the echo is not after the field`);

        const k = render(ctx.repoRoot, "src/components/bentuk/TanggalDenganGema.tsx", { id: "kosong", locale });
        c.expect(k.ok && new RegExp(`<span id="kosong-gema" class="is-kosong">${kosong.replace(/\./g, "\\.")}</span>`).test(k.html),
          `(${locale}) an empty field's echo does not say «${kosong}»`);
        const j = render(ctx.repoRoot, "src/components/bentuk/TanggalDenganGema.tsx", { jenis: "datetime-local", id: "jam", defaultValue: "2026-10-09T07:30", locale });
        const waktu = locale === "en" ? "Friday, 9 Oct 2026, 07.30 WIB" : "Jumat, 9 Okt 2026, 07.30 WIB";
        c.expect(j.ok && /type="datetime-local"/.test(j.html) && j.html.includes(`<span id="jam-gema">${waktu}</span>`),
          `(${locale}) a date and time field's echo does not say «${waktu}»`);
      }
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\n\.pin-gema \{[^}]*display: flex;[^}]*font-weight: var\(--weight-strong\);[^}]*color: var\(--ink-1\);/.test(css)
        && /\.pin-gema \.is-kosong \{[^}]*font-weight: var\(--weight-normal\);[^}]*color: var\(--ink-3\);/.test(css),
        "the echo is not drawn as Daisy's line (strong, ink-1; empty quieter, ink-3)");
      return c.verdict(`no native date or time field in src without its echo; ${pakai} echoed fields, each labelled; rendered in id and en the echo follows the field, describes it first and says the date in words with the day (WIB with a time), «Belum ada tanggal.» when empty`);
    },
  },
];
