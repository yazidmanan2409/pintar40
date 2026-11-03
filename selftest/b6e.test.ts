/**
 * Batch 6 (D-159(f), D-160(d)): an email's status says exactly what PINTAR has evidence for.
 *
 *   B6E-K01  every send outcome the log can hold is shown in exactly one of the four states PINTAR can prove —
 *            «Dalam antrean» (reserved, no answer yet), «Diserahkan» (accepted by the email server), «Gagal»
 *            (refused or unreachable), «Tidak dikirim» (a sending limit) — executed through kunciHasil; the
 *            «Diserahkan» state says arrival is not confirmed; the history carries a legend saying PINTAR never
 *            learns of inbox delivery; and no outcome, key or word claims delivery.
 *   B6E-K02  the screens that report a send to its owner (the activation welcome, Akun saya's «kirim kartu», the
 *            Email uji result) say the email was handed to the email server and that PINTAR cannot confirm it
 *            arrives — never «sudah dikirim ke email Anda» / «terkirim ke» (rendered copy table, both languages).
 *   B6E-K03  no «delivered» state exists anywhere: the send log's outcome check holds no DELIVERED value (migration
 *            source), and no source under src/ names one.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { t, type HleEvent } from "../src/lib/hle";
import { kunciHasil } from "../src/components/email-uji/status";
import { Checks, type SelfTest } from "./lib";

const kode = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const id = (k: HleEvent) => t(k, "staff", { locale: "id" });
const en = (k: HleEvent) => t(k, "staff", { locale: "en" });

const KEADAAN = [
  { nama: "Dalam antrean", en: "Queued", awal: /^(Dalam antrean|Tertahan)\b/, awalEn: /^(Queued|Stuck)\b/ },
  { nama: "Diserahkan", en: "Handed off", awal: /^Diserahkan\b/, awalEn: /^Handed off\b/ },
  { nama: "Gagal", en: "Unsuccessful", awal: /^Gagal\b/, awalEn: /^Unsuccessful\b/ },
  { nama: "Tidak dikirim", en: "Not sent", awal: /^Tidak dikirim\b/, awalEn: /^Not sent\b/ },
];
const KLAIM_SAMPAI = /\b(sudah sampai|telah sampai|sampai di kotak masuk Anda|terkirim ke|sudah dikirim ke email|delivered|has been sent to your|was sent to)\b/i;

function semuaFile(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? semuaFile(join(dir, d.name)) : /\.(ts|tsx)$/.test(d.name) ? [join(dir, d.name)] : []);
}

export const b6eTests: SelfTest[] = [
  {
    id: "B6E-K01",
    run: async (ctx) => {
      const c = new Checks();
      const ROOT = ctx.repoRoot;
      const sekarang = Date.parse("2026-11-04T10:00:00Z");
      const kasus: Array<[string, Parameters<typeof kunciHasil>[0], string]> = [
        ["PENDING, just now", { hasil: "PENDING", batas: null, diminta: "2026-11-04T09:59:00Z" } as never, "Dalam antrean"],
        ["PENDING, 30 minutes", { hasil: "PENDING", batas: null, diminta: "2026-11-04T09:30:00Z" } as never, "Dalam antrean"],
        ["SENT", { hasil: "SENT", batas: null, diminta: "2026-11-04T09:59:00Z" } as never, "Diserahkan"],
        ["REFUSED_BY_HOST", { hasil: "REFUSED_BY_HOST", batas: null, diminta: "2026-11-04T09:59:00Z" } as never, "Gagal"],
        ["FAILED", { hasil: "FAILED", batas: null, diminta: "2026-11-04T09:59:00Z" } as never, "Gagal"],
        ["REFUSED_LIMIT address", { hasil: "REFUSED_LIMIT", batas: "ADDRESS", diminta: "2026-11-04T09:59:00Z" } as never, "Tidak dikirim"],
        ["REFUSED_LIMIT global", { hasil: "REFUSED_LIMIT", batas: "GLOBAL", diminta: "2026-11-04T09:59:00Z" } as never, "Tidak dikirim"],
      ];
      for (const [nama, baris, mau] of kasus) {
        const k = kunciHasil(baris, sekarang);
        const di = id(k), de = en(k);
        const cocok = KEADAAN.filter((x) => x.awal.test(di));
        c.expect(cocok.length === 1 && cocok[0].nama === mau, `${nama} reads «${di}»: want the state «${mau}»`);
        const cocokEn = KEADAAN.filter((x) => x.awalEn.test(de));
        c.expect(cocokEn.length === 1 && cocokEn[0].nama === mau, `${nama} (en) reads «${de}»: want «${KEADAAN.find((x) => x.nama === mau)?.en}»`);
        c.expect(!KLAIM_SAMPAI.test(di) && !KLAIM_SAMPAI.test(de), `${nama} claims delivery: «${di}» / «${de}»`);
      }
      const serah = id(kunciHasil({ hasil: "SENT", batas: null, diminta: "2026-11-04T09:59:00Z" } as never, sekarang));
      c.expect(/belum dipastikan sampai/.test(serah), `«Diserahkan» does not say arrival is unconfirmed: «${serah}»`);
      const src = kode(readFileSync(join(ROOT, "src/components/email-uji/RiwayatEmail.tsx"), "utf8"));
      c.expect(/s\("emailuji\.r\.arti"\)/.test(src), "the history does not render its legend (emailuji.r.arti)");
      const arti = id("emailuji.r.arti" as HleEvent);
      c.expect(KEADAAN.every((x) => arti.includes(`«${x.nama}»`)) && /tidak pernah|tidak tahu|tidak menerima kabar/.test(arti),
        `the legend does not name the four states and say delivery is never known: «${arti}»`);
      return c.verdict(`${kasus.length} outcomes, each in one of the four provable states; «Diserahkan» unconfirmed; the legend`);
    },
  },
  {
    id: "B6E-K02",
    run: async () => {
      const c = new Checks();
      for (const k of ["aktifkan.w_kartu_terkirim", "akun.terkirim", "emailuji.terkirim"] as HleEvent[]) {
        const di = id(k), de = en(k);
        c.expect(/diserahkan ke server email/i.test(di), `${k} does not say it was handed to the email server: «${di}»`);
        c.expect(/handed (off )?to the email server/i.test(de), `${k} (en) does not say it was handed to the email server: «${de}»`);
        c.expect(!KLAIM_SAMPAI.test(di) && !KLAIM_SAMPAI.test(de), `${k} claims delivery: «${di}» / «${de}»`);
      }
      for (const k of ["aktifkan.w_kartu_terkirim", "akun.terkirim"] as HleEvent[]) {
        c.expect(/tidak bisa memastikan/.test(id(k)) && /can't confirm|cannot confirm/i.test(en(k)),
          `${k} does not say PINTAR cannot confirm arrival: «${id(k)}» / «${en(k)}»`);
      }
      return c.verdict("the welcome, Akun saya and Email uji say handed to the email server, arrival not confirmed");
    },
  },
  {
    id: "B6E-K03",
    run: async (ctx) => {
      const c = new Checks();
      const ROOT = ctx.repoRoot;
      const mig = readFileSync(join(ROOT, "supabase/migrations/20261026100000_pintar_sends_its_own_email.sql"), "utf8");
      const cek = /outcome[^;]*check\s*\(\s*outcome\s+in\s*\(([^)]*)\)/i.exec(mig);
      c.expect(!!cek && /'SENT'/.test(cek[1]) && !/DELIVER/i.test(cek[1]), `the send log's outcome check: ${cek ? cek[1] : "not found"}`);
      const bocor = semuaFile(join(ROOT, "src")).filter((f) => /["'`](DELIVERED|TERKIRIM_SAMPAI|SAMPAI)["'`]/.test(kode(readFileSync(f, "utf8"))));
      c.expect(bocor.length === 0, `a source names a delivered state: ${bocor.join(", ")}`);
      return c.verdict("the send log holds no delivered outcome and no source names one");
    },
  },
];
