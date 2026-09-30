/**
 * DAISY-20 (Gate 3, D-054(a)(b), D-077, D-079 addendum): «Aktifkan akun PINTAR
 * Anda», the password door on «Masuk ke PINTAR», Akun saya, and the name checks,
 * on BOB-26's published contract.
 *
 *   DAISY-20-KODE-01   every code BOB-26 can answer is read the same way and
 *                      said as its own sentence in both languages: never the
 *                      code word, never the server's text; a wait says the
 *                      route's own duration and never invents one; a reference
 *                      only when the server failed; the code field's «482 913»
 *   DAISY-20-LAYAR-01  the screens RENDERED in both languages: the step line,
 *                      a label for every field, the rules shown before typing
 *                      and read from the canonical setting, the reveal toggles,
 *                      a judged field marked and described, a form that cannot
 *                      submit saying so, the welcome with and without a card,
 *                      no code word and no internal word anywhere
 *   DAISY-20-C17-01    no PINTAR-ID screen reaches a learner: Akun saya refuses
 *                      before it asks, the wizard asks for the card only for
 *                      staff, the welcome without a card shows no ID, the door
 *                      to Akun saya is only on a staff strip, and nothing a
 *                      learner or an intake administrator reads mentions a card
 *   DAISY-20-NAMA-01   D-077: the wizard's name shown large with «Sudah benar»
 *                      first and «Ubah nama» beside it, sending no name for a
 *                      confirmation; «Orang baru» confirmed before it is made;
 *                      the intake's complete, scrollable name list before its
 *                      one approval, all or nothing
 *   DAISY-20-ALUR-01   the wiring: every request goes through the contract's
 *                      reader, the code screen's duration and countdown are the
 *                      route's numbers, a destination stays inside PINTAR, and
 *                      activation screens point to /aktifkan (D-019 amended)
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { t, format, allKeys, telling, TANPA_SALINAN, INTERNAL_WORDS, type HleEvent, type Locale } from "../src/lib/hle";
import { STATUS, LANGKAH, type Rute } from "../src/components/aktifkan/kontrak";
import { baca, kalimat, menunggu, hanyaAngka, id44, tujuanAman, bentukEmail, type Gagal } from "../src/components/aktifkan/jawaban";
import { kumpulkanNama, HALAMAN_NAMA, type HalamanNama } from "../src/components/pendataan/kumpulkanNama";

const LOCALES: Locale[] = ["id", "en"];

/** Source with comments removed: a rule about code is tested against code. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}
const baca1 = (root: string, ...p: string[]) => readFileSync(join(root, ...p), "utf8");
const bersih = (x: string) => x.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
/** What a reader sees: the text, and the words carried by aria-label, alt, title and placeholder. */
const terlihat = (html: string) =>
  bersih([
    html.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " "),
    ...[...html.matchAll(/\b(?:aria-label|alt|title|placeholder)="([^"]*)"/g)].map((m) => m[1]),
  ].join(" ")).replace(/\s+/g, " ");
/** A contract code, or any word shaped like one, reaching a reader. */
const KATA_KODE = /\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/;

const KARTU = {
  nama: "Nadia Putri Maharani",
  pintarId: "A14CD7ST",
  tautanId: "https://app.pintarselalu.com/id/A14CD7ST",
  konteks: [{ peran: "EDUCATOR", institusi: "SMA Negeri 1 Contoh" }, { peran: "SYSTEM_ADMIN", institusi: null }],
};
const ATURAN = { panjangMin: 8, karakterWajib: [], cekBocor: true, panjangMaks: 72 };

type Kasus = { nama: string; komponen: string; props: Record<string, unknown> };

/**
 * Renders each case in a child process, as the page would draw it before any
 * script runs. Every prop named on* is given a function that does nothing.
 */
function gambar(repoRoot: string, kasus: Kasus[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const dari = (f) => import("file://" + process.cwd() + f);' +
    '  const L = await dari("/src/components/aktifkan/Langkah.tsx");' +
    "  const mod = {" +
    "    LangkahUsername: L.LangkahUsername ?? L.default?.LangkahUsername, LangkahPassword: L.LangkahPassword ?? L.default?.LangkahPassword," +
    "    LangkahPin: L.LangkahPin ?? L.default?.LangkahPin, LangkahNama: L.LangkahNama ?? L.default?.LangkahNama," +
    "    Selamat: L.Selamat ?? L.default?.Selamat, Berhenti: L.Berhenti ?? L.default?.Berhenti," +
    "  };" +
    '  for (const [n, f] of [["IdentitasSaya", "/src/components/aktifkan/IdentitasSaya.tsx"], ["MintaKode", "/src/components/aktifkan/MintaKode.tsx"],' +
    '    ["WizardAktivasi", "/src/components/aktifkan/WizardAktivasi.tsx"], ["AkunSaya", "/src/components/aktifkan/AkunSaya.tsx"],' +
    '    ["DaftarNama", "/src/components/pendataan/DaftarNama.tsx"], ["FormAktivasi", "/src/components/aktivasi/FormAktivasi.tsx"]]) {' +
    "    const m = await dari(f); mod[n] = m.default?.default ?? m.default;" +
    "  }" +
    "  const fungsi = () => {};" +
    '  const { readFileSync } = await import("node:fs");' +
    "  const out = JSON.parse(readFileSync(0, \"utf8\")).map((k) => {" +
    "    const p = { ...k.props };" +
    '    for (const x of ["onKirim", "onBenar", "onUbah", "onBatal", "onKirimUbah"]) p[x] = fungsi;' +
    '    if (p.tindakanKlik) { p.tindakan = { onClick: fungsi, label: p.tindakanKlik }; delete p.tindakanKlik; }' +
    "    return renderToStaticMarkup(h(mod[k.komponen], p));" +
    "  });" +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    // the cases go on stdin: a thousand-row list is past what one environment variable may hold
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 26, input: JSON.stringify(kasus),
    env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://app.contoh.sch.id" },
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

export const aktifkanTests: SelfTest[] = [
  {
    id: "DAISY-20-KODE-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      const rute = Object.keys(STATUS) as Rute[];
      c.expect(rute.length === 11, `${rute.length} route(s) in the contract's status map; BOB-26 has 11`);

      // 1. EVERY CODE, EVERY ROUTE, BOTH LANGUAGES: read back as itself, and
      //    said as a sentence -- never the dash, never a code word, never the
      //    server's own text, which rides along on every answer and must stay off.
      let jumlah = 0;
      for (const r of rute) {
        const peta = STATUS[r] as Record<string, number>;
        for (const [kode, status] of Object.entries(peta)) {
          jumlah++;
          const g = baca(r, status, { ok: false, code: kode, tunggu: 45, ref: "PTR-7F3A", alasan: ["PANJANG", "BOCOR"], message: "duplicate key value violates unique constraint" });
          c.expect(!g.ok && (g as Gagal<Rute>).kode === kode, `${r} ${status} ${kode} is not read back as itself`);
          for (const locale of LOCALES) {
            const s = (k: HleEvent) => t(k, "public", { locale });
            const x = kalimat(g as Gagal<Rute>, s, locale);
            c.expect(x !== TANPA_SALINAN && !x.includes(TANPA_SALINAN) && x.length > 10 && !KATA_KODE.test(x) && !/duplicate|constraint/.test(x),
              `${r} ${kode} (${locale}) is not a plain sentence: «${x}»`);
            for (const w of INTERNAL_WORDS) c.expect(!new RegExp(`\\b${w}\\b`).test(x), `${r} ${kode} (${locale}) shows the internal word ${w}`);
          }
        }
      }
      // what the person typed is judged by its own sentence: every username
      // and PIN refusal reads differently from the others, in both languages
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        for (const [r, awalan] of [["username", "USERNAME_"], ["pin", "PIN_"]] as const) {
          const kode = Object.keys(STATUS[r]).filter((k) => k.startsWith(awalan));
          const kal = new Set(kode.map((k) => kalimat(baca(r, (STATUS[r] as Record<string, number>)[k], { ok: false, code: k }) as Gagal<Rute>, s, locale)));
          c.expect(kode.length >= 7 && kal.size === kode.length, `${r} (${locale}): ${kode.length} refusals read as ${kal.size} sentence(s)`);
        }
      }

      // 2. HOW AN ANSWER IS READ (BOB-26 §0): a known code wins over the
      //    status; an unknown code falls back to the status; nothing at all,
      //    or a status the route never gives, is «not reached».
      c.expect(baca("kode", 200, { ok: true, kirimUlangDalam: 60, berlakuMenit: 10 }).ok === true, "a 200 with ok:true is not read as success");
      c.expect((baca("kode", 500, { ok: false, code: "EMAIL_TIDAK_SAH" }) as Gagal<"kode">).kode === "EMAIL_TIDAK_SAH", "a known code does not win over the status");
      c.expect((baca("kode", 400, { ok: false, code: "SESUATU_BARU" }) as Gagal<"kode">).kode === "EMAIL_TIDAK_SAH", "an unknown code is not read by its status");
      c.expect((baca("kode", 418, { ok: false }) as Gagal<"kode">).kode === "PUTUS" && (baca("kode", 0, null) as Gagal<"kode">).kode === "PUTUS",
        "no answer, or a status the route never gives, is not «not reached»");
      c.expect((baca("verifikasi", 200, { ok: false, code: "KODE_TIDAK_COCOK" }) as Gagal<"verifikasi">).kode === "KODE_TIDAK_COCOK",
        "a 200 that says ok:false is taken as success");
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        c.expect(kalimat(baca("kode", 0, null) as Gagal<"kode">, s, locale) === s("auth.card_putus"), `(${locale}) no answer is not told as a lost connection`);
      }

      // 3. A WAIT IS THE ROUTE'S OWN, NEVER INVENTED. From the body, else
      //    from Retry-After; «a moment» when neither says; never on an answer
      //    that is not a wait; and a wait is a note, not a judgement.
      const tunggu = (b: Record<string, unknown>, h: string | null = null) => (baca("verifikasi", 429, { ok: false, ...b }, h) as Gagal<"verifikasi">).tunggu;
      c.expect(tunggu({ code: "KODE_TUNGGU", tunggu: 45 }) === 45 && tunggu({ code: "KODE_TUNGGU" }, "120") === 120 && tunggu({ code: "KODE_TUNGGU" }) === null,
        "the wait is not the body's, then Retry-After's, then none");
      c.expect(tunggu({ code: "KODE_TUNGGU", tunggu: "lama" }) === null && tunggu({ code: "KODE_TUNGGU", tunggu: -5 }) === null && tunggu({ code: "KODE_TUNGGU", tunggu: 999999 }) === null,
        "a wait that is not a sensible number of seconds is shown");
      c.expect((baca("verifikasi", 400, { ok: false, code: "KODE_TIDAK_COCOK", tunggu: 45 }) as Gagal<"verifikasi">).tunggu === null, "a wait is read on an answer that is not a wait");
      c.expect(menunggu({ kode: "KODE_TUNGGU" }) && menunggu({ kode: "MASUK_DIBATASI" }) && !menunggu({ kode: "KODE_TIDAK_COCOK" }), "a wait and a refusal are not told apart");
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const a = kalimat(baca("verifikasi", 429, { ok: false, code: "KODE_TUNGGU", tunggu: 45 }) as Gagal<"verifikasi">, s, locale);
        const b = kalimat(baca("masukPassword", 429, { ok: false, code: "MASUK_TUNGGU" }) as Gagal<"masukPassword">, s, locale);
        c.expect(a.includes(format.durasi(45, locale)) && a.startsWith(s("aktifkan.kode_sering")), `(${locale}) the code's wait does not say the route's 45 seconds: «${a}»`);
        c.expect(b.includes(s("auth.card_tunggu_sebentar")) && !/\d/.test(b), `(${locale}) a wait with no duration invents one: «${b}»`);
      }

      // 4. A REFERENCE ONLY WHEN THE SERVER FAILED, and only a reference
      const ref = (b: Record<string, unknown>, st = 503) => (baca("kode", st, { ok: false, ...b }) as Gagal<"kode">).ref;
      c.expect(ref({ code: "LAYANAN_TIDAK_TERSEDIA", ref: "PTR-7F3A" }) === "PTR-7F3A", "the server's reference is lost");
      c.expect(ref({ code: "EMAIL_TIDAK_SAH", ref: "PTR-7F3A" }, 400) === null && ref({ code: "LAYANAN_TIDAK_TERSEDIA", ref: "<b>x</b> y" }) === null,
        "a reference is shown on an answer that is not a failure, or something that is not a reference is");
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const x = kalimat(baca("kode", 503, { ok: false, code: "LAYANAN_TIDAK_TERSEDIA", ref: "PTR-7F3A" }) as Gagal<"kode">, s, locale);
        c.expect(x.includes("PTR-7F3A") && x.includes(s("aktifkan.rujukan_arti")), `(${locale}) the reference is not given with what to do with it`);
        c.expect(/yang mengurus PINTAR di sekolah Anda|looks after PINTAR at your school/.test(s("aktifkan.rujukan_arti")),
          `(${locale}) the help line does not name who looks after PINTAR at the school (Terminology v1)`);
      }

      // 5. PASSWORD_LEMAH says each reason the route gave, in its order
      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const x = kalimat(baca("password", 422, { ok: false, code: "PASSWORD_LEMAH", alasan: ["PANJANG", "BOCOR", "LAIN"] }) as Gagal<"password">, s, locale);
        c.expect(x === `${s("aktifkan.kode.PASSWORD_LEMAH.PANJANG")} ${s("aktifkan.kode.PASSWORD_LEMAH.BOCOR")}`, `(${locale}) a weak password's reasons are not said in order: «${x}»`);
      }

      // 6. WHAT IS TYPED: «482 913», «482913» and «482-913» are one code; the
      //    ID is shown 4 + 4; a destination never leaves PINTAR
      c.expect(["482 913", "482913", "482-913", " 482 913 "].every((v) => hanyaAngka(v) === "482913"), "the code field does not accept «482 913» as typed or pasted");
      c.expect(id44("A14CD7ST") === "A14C D7ST" && id44("bukan") === "bukan", "the PINTAR ID is not shown 4 + 4");
      for (const [v, w] of [["/aktifkan", "/aktifkan"], ["/belajar?x=1", "/belajar?x=1"], ["//jahat.id", "/"], ["/\\jahat.id", "/"], ["https://jahat.id", "/"], ["javascript:alert(1)", "/"], [null, "/"]] as const) {
        c.expect(tujuanAman(v) === w, `the destination ${String(v)} becomes ${tujuanAman(v)}, not ${w}`);
      }
      c.expect(bentukEmail(" guru@sd-negeri-1.jakarta.sch.id ") && !bentukEmail("guru@sekolah") && !bentukEmail("guru.sekolah.sch.id"), "the address check refuses a real address or passes a broken one");

      c.note(`${jumlah} code(s) over ${rute.length} route(s)`);
      return c.verdict(
        "every code BOB-26's contract names, on every route, is read back as itself (a known code over its status, an unknown one by " +
        "its status, no answer as «not reached») and said as a plain sentence in both languages with no code word, no internal word " +
        "and none of the server's own text; each username and PIN refusal reads differently; a wait is the route's own (body, then " +
        "Retry-After) and «a moment» when it gave none, never on a refusal; a reference only on a server failure, with who to give it " +
        "to; a weak password gives each reason in order; «482 913» is the code as typed or pasted; the ID shows 4 + 4; a destination " +
        "never leaves PINTAR",
      );
    },
  },

  {
    id: "DAISY-20-LAYAR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const PESAN = { teks: "Username ini sudah dipakai orang lain. Pilih yang lain.", salah: true, tunggu: false };
      const umum = { siap: true, sibuk: false, pesan: null };
      const kasus: Kasus[] = LOCALES.flatMap((locale) => [
        { nama: `username (${locale})`, komponen: "LangkahUsername", props: { locale, ...umum } },
        { nama: `username refused (${locale})`, komponen: "LangkahUsername", props: { locale, ...umum, pesan: PESAN } },
        { nama: `username not started (${locale})`, komponen: "LangkahUsername", props: { locale, ...umum, siap: false } },
        { nama: `password (${locale})`, komponen: "LangkahPassword", props: { locale, ...umum, aturan: ATURAN } },
        { nama: `password, planted rules (${locale})`, komponen: "LangkahPassword", props: { locale, ...umum, aturan: { panjangMin: 12, karakterWajib: ["ANGKA", "SIMBOL"], cekBocor: false, panjangMaks: 72 } } },
        { nama: `PIN (${locale})`, komponen: "LangkahPin", props: { locale, ...umum } },
        { nama: `name (${locale})`, komponen: "LangkahNama", props: { locale, ...umum, nama: "Nadia Putri Maharani", ubah: false } },
        { nama: `name, changing (${locale})`, komponen: "LangkahNama", props: { locale, ...umum, nama: "Nadia Putri Maharani", ubah: true } },
        { nama: `welcome, staff (${locale})`, komponen: "Selamat", props: { locale, kartu: KARTU, status: "TERKIRIM", tujuan: "/mengajar" } },
        { nama: `welcome, card not sent (${locale})`, komponen: "Selamat", props: { locale, kartu: KARTU, status: "BELUM_TERKIRIM", tujuan: "/mengajar" } },
        { nama: `stop (${locale})`, komponen: "Berhenti", props: { locale, teks: t("aktifkan.belum_masuk", "public", { locale }), tindakan: { href: "/aktifkan", label: "aktifkan.mulai_lagi" } } },
        { nama: `ask for a code (${locale})`, komponen: "MintaKode", props: { locale } },
        { nama: `the wizard, loading (${locale})`, komponen: "WizardAktivasi", props: { locale } },
        { nama: `Akun saya, loading (${locale})`, komponen: "AkunSaya", props: { locale } },
        { nama: `identity (${locale})`, komponen: "IdentitasSaya", props: { locale, kartu: KARTU } },
      ]);
      const { html, galat } = gambar(repoRoot, kasus);
      if (!c.expect(galat === "", `the DAISY-20 screens could not be rendered: ${galat}`)) return c.verdict("");
      const R = Object.fromEntries(kasus.map((k, i) => [k.nama, html[i]]));

      for (const locale of LOCALES) {
        const s = (k: HleEvent) => t(k, "public", { locale });
        const L = (n: string) => R[`${n} (${locale})`] ?? "";

        // 1. THE STEP LINE: «Langkah N dari 4», N the step's own place
        for (const [n, langkah] of [["username", "USERNAME"], ["password", "PASSWORD"], ["PIN", "PIN"], ["name", "NAMA"]] as const) {
          const baris = `${s("aktifkan.langkah")} ${LANGKAH.indexOf(langkah) + 1} ${s("aktifkan.dari")} ${LANGKAH.length}`;
          c.expect(terlihat(L(n)).includes(baris), `${n} (${locale}) does not say «${baris}»`);
          c.expect(/<h1 class="pin-mh1" tabindex="-1">/.test(L(n)), `${n} (${locale}) has no heading that can take focus`);
        }

        // 2. EVERY FIELD HAS ITS LABEL, and the credentials fill as they should
        for (const k of kasus.filter((k) => k.props.locale === locale)) {
          const x = R[k.nama];
          for (const m of x.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
            if (/type="hidden"/.test(m[0])) continue;
            c.expect(x.includes(`for="${m[1]}"`), `${k.nama}: the field #${m[1]} has no label`);
          }
        }
        c.expect(/name="username"[^>]*autoComplete="username"|autoComplete="username"[^>]*name="username"/i.test(L("username").replace(/autocomplete/g, "autoComplete")), `username (${locale}) is not filled as a username`);
        c.expect((L("password").match(/autocomplete="new-password"/gi) ?? []).length === 2, `password (${locale}): both fields are not new-password`);
        c.expect(/inputmode="numeric"[^>]*maxlength="4"|maxlength="4"[^>]*inputmode="numeric"/i.test(L("PIN")), `PIN (${locale}) is not a four-digit numeric field`);
        c.expect(/autocomplete="one-time-code"/i.test(code(baca1(repoRoot, "src", "components", "aktifkan", "MintaKode.tsx")).replace(/autoComplete/g, "autocomplete")),
          `the code field (${locale}) is not filled from the message`);

        // 3. THE RULES BEFORE TYPING, from the canonical setting: 8 and a
        //    leak check today; a planted 12 with two kinds and no leak check
        //    changes the screen with it
        const aturan = terlihat(L("password"));
        c.expect(aturan.includes(`${s("aktifkan.p_min")} ${format.number(8, locale)} ${s("aktifkan.p_min_lalu")}`) && aturan.includes(s("aktifkan.p_bocor")) && !aturan.includes(s("aktifkan.p_wajib")),
          `password (${locale}) does not show today's rules (8, the leak check, no required kinds)`);
        const tanam = terlihat(L("password, planted rules"));
        c.expect(tanam.includes(`${s("aktifkan.p_min")} ${format.number(12, locale)} ${s("aktifkan.p_min_lalu")}`)
          && tanam.includes(`${s("aktifkan.p_wajib")} ${s("aktifkan.p_k.ANGKA" as HleEvent)}, ${s("aktifkan.p_k.SIMBOL" as HleEvent)}.`) && !tanam.includes(s("aktifkan.p_bocor")),
          `password (${locale}): the rules do not follow the setting (a planted 12, two kinds, no leak check)`);
        c.expect(/aria-describedby="password-aturan"/.test(L("password")), `password (${locale}): the field is not described by its rules`);

        // 4. THE REVEALS ARE LABELLED TOGGLES, one per secret
        c.expect(/<button type="button" class="pin-lihat" aria-pressed="false" aria-label="[^"]+"/.test(L("password")) && terlihat(L("password")).includes(s("auth.pw_show"))
          && terlihat(L("PIN")).includes(s("auth.card_show")),
          `(${locale}) a reveal is not a labelled pressed-state toggle saying what it shows`);
        c.expect((L("password").match(/aria-pressed=/g) ?? []).length === 1 && (L("PIN").match(/aria-pressed=/g) ?? []).length === 1,
          `(${locale}) a secret has more than one reveal, or none`);

        // 5. A JUDGED FIELD IS MARKED AND DESCRIBED; a form that cannot submit says why
        const tolak = L("username refused");
        c.expect(/aria-invalid="true"/.test(tolak) && /aria-describedby="username-aturan username-err"/.test(tolak) && /role="alert" id="username-err"/.test(tolak),
          `username refused (${locale}): the field is not marked invalid and described by its sentence`);
        c.expect(!/aria-invalid/.test(L("username")), `username (${locale}) is marked invalid before anything was judged`);
        c.expect(terlihat(L("username not started")).includes(s("auth.belum_siap")) && /<button type="submit"[^>]*disabled=""/.test(L("username not started")),
          `username not started (${locale}): the form looks live, or does not say why it is not`);

        // 6. THE WELCOME: the name, the ID 4 + 4, the QR as a labelled image,
        //    where the card went, and «Masuk ke PINTAR» to the route's home
        const w = L("welcome, staff");
        c.expect(terlihat(w).includes(s("auth.title")) && terlihat(w).includes("Nadia Putri Maharani") && w.includes(">A14C D7ST<"),
          `welcome (${locale}) does not show the name and the ID 4 + 4`);
        c.expect(/<svg[^>]*role="img"[^>]*aria-label="[^"]+"/.test(w), `welcome (${locale}): the QR is not a labelled image`);
        c.expect(terlihat(w).includes(s("aktifkan.w_kartu_terkirim")) && !terlihat(w).includes(s("aktifkan.w_kartu_belum")), `welcome (${locale}) does not say the card was sent`);
        c.expect(terlihat(L("welcome, card not sent")).includes(s("aktifkan.w_kartu_belum")), `welcome (${locale}) does not say a refused card waits in Akun saya`);
        c.expect(w.includes(`href="/mengajar"`) && terlihat(w).includes(s("aktifkan.w_masuk")), `welcome (${locale}): «${s("aktifkan.w_masuk")}» does not go to the route's home`);
        c.expect(terlihat(w).includes(`${t("role.EDUCATOR", "staff", { locale })} · SMA Negeri 1 Contoh`) && terlihat(w).includes(t("role.SYSTEM_ADMIN", "staff", { locale })),
          `welcome (${locale}): the context lines are not the data's (role · school; the platform role alone)`);

        // 7. THE FIRST SCREEN: the email, the way to sign in, and no code or countdown yet
        const minta = L("ask for a code");
        c.expect(terlihat(minta).includes(s("aktifkan.judul")) && /type="email"/.test(minta) && /href="\/masuk"/.test(minta) && !terlihat(minta).includes(s("aktifkan.kirim_ulang_dalam")),
          `ask for a code (${locale}) is not the email, one action and the way to sign in`);
        c.expect(terlihat(L("the wizard, loading")).includes(s("aktifkan.memuat")) && terlihat(L("Akun saya, loading")).includes(s("aktifkan.memuat")),
          `(${locale}) a screen that is still asking does not say so`);
      }

      // 8. NO CODE WORD, NO INTERNAL WORD, NO DASH anywhere a reader looks
      for (const k of kasus) {
        const x = terlihat(R[k.nama]);
        c.expect(!KATA_KODE.test(x), `${k.nama} shows a code word: ${KATA_KODE.exec(x)?.[0]}`);
        c.expect(!x.split(" ").includes(TANPA_SALINAN), `${k.nama} shows a key with no copy`);
        for (const w of INTERNAL_WORDS) c.expect(!new RegExp(`\\b${w}\\b`).test(x), `${k.nama} shows the internal word ${w}`);
      }

      // 9. THE COPY: every key the new screens use is declared in both
      //    languages; every activation line a person reads before signing in
      //    is plain, and none says «segera» or types a duration
      const berkas = ["Langkah.tsx", "MintaKode.tsx", "WizardAktivasi.tsx", "AkunSaya.tsx", "IdentitasSaya.tsx", "jawaban.ts"].map((f) => code(baca1(repoRoot, "src", "components", "aktifkan", f)));
      const kunci = allKeys();
      const dipakai = new Set(berkas.flatMap((b) => [...b.matchAll(/"((?:aktifkan|akun|auth|sesi)\.[A-Za-z0-9_.]+)"/g)].map((m) => m[1])));
      for (const k of dipakai) {
        c.expect(kunci.includes(k as HleEvent), `the activation screens use ${k}, which the copy table does not declare`);
        const row = kunci.includes(k as HleEvent) ? telling(k as HleEvent) : null;
        c.expect(Boolean(row?.default?.trim()) && Boolean(row?.en?.trim()), `${k} is missing a language`);
      }
      for (const k of ["aktifkan.lede", "aktifkan.kode_terkirim", "aktifkan.berlaku", "aktifkan.berlaku_lalu", "aktifkan.kirim_ulang_dalam", "aktifkan.kode_ulang_ok", "aktifkan.kode_bantu"] as HleEvent[]) {
        for (const locale of LOCALES) {
          const x = t(k, "public", { locale });
          c.expect(!/\d/.test(x) && !/segera|soon|immediately/i.test(x), `${k} (${locale}) types a duration or says «segera»: «${x}»`);
        }
      }

      c.note(`${kasus.length} screen(s) rendered, ${dipakai.size} key(s)`);
      return c.verdict(
        "RENDERED in both languages: each wizard step says «Langkah N dari 4» in the journey's order with a heading that takes focus; " +
        "every field has its label; the username, the new password (twice) and the PIN (numeric, four digits) fill as they should, and " +
        "the code fills from the message; the password rules are shown before typing and follow the canonical setting (8 and the leak " +
        "check today; a planted 12 with two kinds and no leak check changes the screen); each secret has one labelled reveal; a judged " +
        "field is marked invalid and described by its sentence, and a form whose script has not started is held and says why; the " +
        "welcome shows the name, the ID 4 + 4, a labelled QR, where the card went and the role · school lines as the data gives them, " +
        "and «Masuk ke PINTAR» goes to the route's home; the first screen is the email, one action and the way to sign in; nothing " +
        "shows a code word, an internal word or an empty key; every key used is declared in both languages and no pre-sign-in line " +
        "types a duration or says «segera»",
      );
    },
  },

  {
    id: "DAISY-20-C17-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. AKUN SAYA REFUSES BEFORE IT ASKS: the staff test comes first, the
      //    refusal page is returned, and only after it is the card component
      //    (the one thing that requests the card) drawn. A learner is not staff.
      const akun = code(baca1(repoRoot, "src", "app", "akun", "page.tsx"));
      const iTolak = akun.search(/if \(!staf\) \{\s*return <HalamanPenolakan/);
      c.expect(iTolak > 0 && iTolak < akun.indexOf("<AkunSaya"), "Akun saya draws the card before refusing someone who is not staff");
      c.expect(/const staf = Boolean\(peran\?\.some\(\(p\) => PERAN_STAF\.includes\(p\)\)\);/.test(akun), "Akun saya decides by something other than a staff role");
      let PERAN_STAF: readonly string[] = [];
      try { PERAN_STAF = (await import("../src/components/sesi")).PERAN_STAF; } catch { /* reported below */ }
      c.expect(PERAN_STAF.length >= 5 && !PERAN_STAF.includes("STUDENT"), `the staff roles are ${PERAN_STAF.join(", ") || "unreadable"}`);

      // 2. THE CARD IS ASKED FOR ONLY TWICE, EACH TIME FOR STAFF: Akun saya,
      //    and the wizard's welcome inside `if (keadaan.staf)`
      const berkas = ["WizardAktivasi.tsx", "AkunSaya.tsx", "MintaKode.tsx", "Langkah.tsx", "IdentitasSaya.tsx"];
      const tanya = berkas.flatMap((f) => [...code(baca1(repoRoot, "src", "components", "aktifkan", f)).matchAll(/kirim<"kartu"/g)].map(() => f));
      c.expect(tanya.length === 2 && tanya.includes("AkunSaya.tsx") && tanya.includes("WizardAktivasi.tsx"), `the card is requested from ${tanya.join(", ")}`);
      const wiz = code(baca1(repoRoot, "src", "components", "aktifkan", "WizardAktivasi.tsx"));
      c.expect(/if \(keadaan\.staf\) \{\s*const k = await kirim<"kartu", DataKartu>\("kartu"\);/.test(wiz) && /status: keadaan\.staf \? r\.kartu : "TIDAK_ADA"/.test(wiz),
        "the wizard asks for a card, or reports one, for an account that is not staff");

      // 3. RENDERED: the welcome a learner-only account gets shows no ID, no
      //    QR and no word about a card, in both languages
      const kasus: Kasus[] = LOCALES.map((locale) => ({ nama: `welcome, learner (${locale})`, komponen: "Selamat", props: { locale, kartu: null, status: "TIDAK_ADA", tujuan: "/belajar" } }));
      const { html, galat } = gambar(repoRoot, kasus);
      if (c.expect(galat === "", `the learner's welcome could not be rendered: ${galat}`)) {
        LOCALES.forEach((locale, i) => {
          const x = html[i], teks = terlihat(x);
          const s = (k: HleEvent) => t(k, "staff", { locale });
          c.expect(!/pin-idn|<svg/.test(x) && !teks.includes(s("akun.id")) && !/kartu|card/i.test(teks) && x.includes('href="/belajar"'),
            `the learner's welcome (${locale}) shows an ID, a QR or a card: ${teks.slice(0, 200)}`);
        });
      }

      // 4. THE DOOR TO AKUN SAYA IS ON A STAFF STRIP ONLY: it is drawn with
      //    the name, and a learner's strip never carries a name (S15)
      const strip = code(baca1(repoRoot, "src", "components", "BarisSesi.tsx"));
      c.expect(/\{nama \? <a className="pin-sesi-akun" href="\/akun">\{s\("sesi\.akun"\)\}<\/a> : null\}/.test(strip), "the door to Akun saya is drawn without the staff name");
      c.expect(/nama=\{namaUntukStrip\(v\.displayName, p\)\}/.test(code(baca1(repoRoot, "src", "components", "SesiSaya.tsx"))), "the strip's name is not the staff-only rule's");

      // 5. NO WORD ABOUT A CARD WHERE A LEARNER OR AN INTAKE READS: the
      //    wizard's own steps (every account walks them), the intake's name
      //    list and its approval
      const umum = allKeys().filter((k) => /^aktifkan\.(u_|p_|n_|m_|langkah|dari|w_siap|w_masuk|judul|lede|kode|berlaku|kirim|sudah|belum|tidak|mulai|keluar)/.test(k) || /^pendataan\.(nama|pratinjau)\./.test(k));
      for (const k of umum) {
        for (const locale of LOCALES) {
          const x = t(k as HleEvent, "staff", { locale });
          c.expect(!/kartu pintar|pintar card|pintar id\b|\bkartu\b.*(nama|name)|nama.*\bkartu\b|\bcard\b/i.test(x), `${k} (${locale}) mentions a card or a PINTAR ID: «${x}»`);
        }
      }

      return c.verdict(
        "no PINTAR-ID screen reaches a learner (C17): Akun saya returns the refusal page for anyone without a staff role before it " +
        "draws the one component that asks for the card, and STUDENT is not a staff role; the card is requested in exactly two places, " +
        "Akun saya and the wizard's welcome inside `if (keadaan.staf)`, which reports no card otherwise; RENDERED in both languages, a " +
        "learner-only account's welcome has no ID, no QR and no word about a card; the door to Akun saya is drawn only with the " +
        "staff-only name; and no wizard step, intake name list or approval line mentions a card or a PINTAR ID",
      );
    },
  },

  {
    id: "DAISY-20-NAMA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. THE WIZARD'S NAME (D-077(1)), RENDERED: shown large and whole,
      //    «Sudah benar» the submit, «Ubah nama» beside it, the once-only line
      //    before either is pressed; changing opens one field with the name in it
      const kasus: Kasus[] = LOCALES.flatMap((locale) => [
        { nama: `name (${locale})`, komponen: "LangkahNama", props: { locale, siap: true, sibuk: false, pesan: null, nama: "Nadia Putri Maharani", ubah: false } },
        { nama: `name, changing (${locale})`, komponen: "LangkahNama", props: { locale, siap: true, sibuk: false, pesan: null, nama: "Nadia Putri Maharani", ubah: true } },
      ]);
      const baris = Array.from({ length: 1234 }, (_, i) => ({ baris: i + 1, nama: `Murid Sintetis ${i + 1}`, peran: i % 10 === 0 ? "EDUCATOR" : "STUDENT", baru: i % 7 !== 0 }));
      kasus.push(...LOCALES.map((locale) => ({ nama: `names (${locale})`, komponen: "DaftarNama", props: { locale, nama: baris } })));
      kasus.push({ nama: "the activation form", komponen: "FormAktivasi", props: { locale: "id", adminSistem: true, orang: [] } });
      const { html, galat } = gambar(repoRoot, kasus);
      if (c.expect(galat === "", `the name checks could not be rendered: ${galat}`)) {
        const R = Object.fromEntries(kasus.map((k, i) => [k.nama, html[i]]));
        for (const locale of LOCALES) {
          const s = (k: HleEvent) => t(k, "public", { locale });
          const v = R[`name (${locale})`], e = R[`name, changing (${locale})`];
          c.expect(/<p class="pin-akt-nama"[^>]*>Nadia Putri Maharani<\/p>/.test(v), `name (${locale}): the name is not shown whole in its large line`);
          const iBenar = v.indexOf(`>${bersih(s("aktifkan.m_benar"))}<`.replace(/'/g, "&#x27;")), iUbah = v.indexOf(`>${s("aktifkan.m_ubah")}<`);
          c.expect(/<button type="submit"[^>]*>[^<]*<\/button>/.test(v) && iBenar > 0 && iUbah > iBenar && /<button type="button"[^>]*>[^<]*<\/button>/.test(v),
            `name (${locale}): «${s("aktifkan.m_benar")}» is not the submit, first, with «${s("aktifkan.m_ubah")}» a button beside it`);
          c.expect(terlihat(v).indexOf(s("aktifkan.m_sekali")) >= 0 && terlihat(v).indexOf(s("aktifkan.m_sekali")) < terlihat(v).indexOf(s("aktifkan.m_benar")),
            `name (${locale}) does not say it is confirmed once before the confirmation`);
          c.expect(/<input[^>]*id="nama"[^>]*value="Nadia Putri Maharani"|<input[^>]*value="Nadia Putri Maharani"[^>]*id="nama"/.test(e) && e.includes('for="nama"') && terlihat(e).includes(s("aktifkan.m_batal")),
            `name, changing (${locale}): the field does not open with the name in it, or there is no way back`);

          // 3. THE INTAKE'S LIST, RENDERED: every row, in order, in a region
          //    that scrolls and takes keyboard focus, labelled; the registered
          //    ones marked; never a word about a card
          const d = R[`names (${locale})`], st = (k: HleEvent) => t(k, "staff", { locale });
          const li = d.match(/<li>/g) ?? [];
          c.expect(li.length === baris.length && d.indexOf("Murid Sintetis 1<") < d.indexOf("Murid Sintetis 1234<"), `names (${locale}): ${li.length} of ${baris.length} rows drawn, or not in order`);
          c.expect(/<div class="pin-data-nama" role="region" aria-labelledby="pin-data-nama" tabindex="0">/.test(d) && /<h3 id="pin-data-nama"/.test(d),
            `names (${locale}): the list is not a labelled region a keyboard can scroll`);
          const sudah = (d.match(new RegExp(` · ${st("pendataan.nama.sudah")}<`, "g")) ?? []).length;
          c.expect(sudah === baris.filter((b) => !b.baru).length, `names (${locale}): ${sudah} rows marked registered, not ${baris.filter((b) => !b.baru).length}`);
          c.expect(!/kartu|card/i.test(terlihat(d)), `names (${locale}) mentions a card (C17)`);
        }

        // 2. «ORANG BARU» (D-077(2)): the form shows the fields and
        //    «Buat dan aktifkan», which checks and sends nothing; the one send
        //    is «Sudah benar, buat dan aktifkan», with what was shown
        const f = R["the activation form"], s = (k: HleEvent) => t(k, "staff", { locale: "id" });
        c.expect(terlihat(f).includes(s("aktivasi.baru.tombol")) && !terlihat(f).includes(s("aktivasi.baru.benar")), "the new-person form shows its confirmation before anything was pressed");
      }
      const form = code(baca1(repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"));
      const periksa = /function periksaBaru\(\) \{[\s\S]*?\n  \}/.exec(form)?.[0] ?? "";
      c.expect(periksa.length > 0 && !/kirim\(|fetch\(/.test(periksa) && /isianKurang\("NEW_PERSON", baru\)/.test(periksa) && /setPeriksa\(\{ nama: baru\.nama\.trim\(\), surel: baru\.surel\.trim\(\) \}\)/.test(periksa),
        "«Buat dan aktifkan» for a new person sends something, or does not check first");
      const kirimBaru = [...form.matchAll(/kirim\("baru", "NEW_PERSON", ([^)]*)\)/g)].map((m) => m[1]);
      c.expect(kirimBaru.length === 1 && kirimBaru[0] === "{ display_name: periksa.nama, email: periksa.surel }, periksa",
        `a new person is created other than from the confirmation, with what it showed: ${kirimBaru.join(" | ")}`);
      c.expect(/onClick=\{periksaBaru\}>\s*\{s\("aktivasi\.baru\.tombol"\)\}/.test(form) && /s\("aktivasi\.baru\.benar"\)/.test(form) && /onClick=\{ubahBaru\}/.test(form),
        "the new person's two steps are not «Buat dan aktifkan», then «Sudah benar» or «Ubah»");

      // the wizard sends no name for «Sudah benar», and the corrected name,
      // normalised, only after «Ubah nama» (BOB-26 §3.5)
      const wiz = code(baca1(repoRoot, "src", "components", "aktifkan", "WizardAktivasi.tsx"));
      c.expect(/onBenar=\{\(\) => void langkah\("nama", \{\}\)\}/.test(wiz) && /void langkah\("nama", bersih === nama \? \{\} : \{ nama: bersih \}\);/.test(wiz),
        "«Sudah benar» sends a name, or a correction is not sent as the one field");

      // 4. ALL OR NOTHING: the page reads every name, page by page, and a
      //    list that is not whole is no list
      const halaman = (semua: unknown[], opsi: { gagalDi?: number; rusakDi?: number; acakDi?: number } = {}): HalamanNama => {
        let n = 0;
        return async (setelah, batas) => {
          n++;
          if (opsi.gagalDi === n) return { data: null, error: { message: "permission denied" } };
          const i = semua.findIndex((b) => (b as { baris: number }).baris > setelah);
          const hal = (i < 0 ? [] : semua.slice(i, i + batas)).map((b) => ({ ...(b as object) }));
          if (opsi.rusakDi === n && hal.length) (hal[0] as Record<string, unknown>).baru = "ya";
          if (opsi.acakDi === n && hal.length > 1) hal.reverse();
          return { data: hal, error: null };
        };
      };
      const penuh = await kumpulkanNama(halaman(baris));
      c.expect(penuh !== null && penuh.length === 1234 && penuh[1233].baris === 1234, `a 1234-row intake is not read whole (${penuh?.length ?? "null"})`);
      const pas = Array.from({ length: HALAMAN_NAMA * 2 }, (_, i) => ({ baris: i + 1, nama: `N${i}`, peran: "STUDENT", baru: true }));
      c.expect((await kumpulkanNama(halaman(pas)))?.length === HALAMAN_NAMA * 2, "an intake of exactly two full pages is not read whole");
      c.expect((await kumpulkanNama(halaman([])))?.length === 0, "an empty intake is not an empty list");
      c.expect(await kumpulkanNama(halaman(baris, { gagalDi: 2 })) === null, "a refusal on the second page still gives a list");
      c.expect(await kumpulkanNama(halaman(baris, { rusakDi: 3 })) === null, "a row of the wrong shape still gives a list");
      c.expect(await kumpulkanNama(halaman(baris, { acakDi: 1 })) === null, "rows out of order still give a list");
      c.expect(await kumpulkanNama(async () => ({ data: pas.slice(0, HALAMAN_NAMA), error: null })) === null, "a read that never ends gives a list");
      c.expect(await kumpulkanNama(async () => { throw new Error("jaringan"); }) === null, "a read that throws gives a list");
      const nama = code(baca1(repoRoot, "src", "app", "pendataan", "nama.ts"));
      c.expect(/import "server-only";/.test(nama) && /c\.rpc\("import_preview_names", \{ p_job: pekerjaan, p_after: setelah, p_limit: batas \}\)/.test(nama),
        "the name list is not BOB-26's import_preview_names, read in the caller's own session");
      const hal = code(baca1(repoRoot, "src", "app", "pendataan", "[pekerjaan]", "page.tsx"));
      c.expect(/const namaLengkap = nama !== null && nama\.length === Number\(pratinjau\?\.row_count \?\? -1\);/.test(hal)
        && /\{namaLengkap \? \([\s\S]*?<DaftarNama locale=\{locale\} nama=\{nama!\} \/>[\s\S]*?<form action=\{konfirmasiAksi\}>[\s\S]*?\) : \([\s\S]*?pendataan\.nama\.gagal/.test(hal),
        "the approval is offered without the complete list (as long as WP5A's own count), or the list comes after it");
      c.expect((hal.match(/action=\{konfirmasiAksi\}/g) ?? []).length === 1, "the intake has more than one approval");

      return c.verdict(
        "D-077, RENDERED in both languages: the wizard shows the name whole in its large line, says it is confirmed once, makes «Sudah " +
        "benar» the submit with «Ubah nama» a button beside it, and changing opens one labelled field holding the name with a way back; " +
        "«Sudah benar» sends no name and a correction sends the normalised name alone. «Orang baru»: «Buat dan aktifkan» checks and " +
        "sends nothing, the one request is «Sudah benar, buat dan aktifkan» with exactly what was shown, «Ubah» goes back. The intake " +
        "draws every one of 1234 names in order in a labelled region a keyboard can scroll, marks the registered ones, never mentions " +
        "a card, and offers its one approval only under a complete list as long as WP5A's count; the list is read page by page and is " +
        "no list at all on a refusal, a malformed row, rows out of order, a read that never ends or a thrown read",
      );
    },
  },

  {
    id: "DAISY-20-ALUR-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "components", "aktifkan");

      // 1. ONE WAY TO THE SERVER: every request is jawaban.ts's `kirim`, to
      //    the contract's path, JSON, no-store, same origin; no screen fetches
      //    for itself, and nothing reads a server message
      const jaw = code(baca1(repoRoot, "src", "components", "aktifkan", "jawaban.ts"));
      c.expect((jaw.match(/fetch\(/g) ?? []).length === 1 && /fetch\(JALUR\[rute\], \{/.test(jaw) && /cache: "no-store"/.test(jaw) && /credentials: "same-origin"/.test(jaw),
        "the one request is not to the contract's path, no-store and same-origin");
      for (const f of ["Langkah.tsx", "MintaKode.tsx", "WizardAktivasi.tsx", "AkunSaya.tsx", "IdentitasSaya.tsx"]) {
        const src = code(readFileSync(join(dir, f), "utf8"));
        c.expect(!/fetch\(/.test(src), `${f} reaches the server by itself`);
        c.expect(!/\.message\b|\.detail\b|\.error\b/.test(src), `${f} reads the server's own words`);
      }
      const masuk = code(baca1(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"));
      c.expect(!/\.message\b|\.detail\b/.test(masuk), "the sign-in screen reads the server's own words");

      // 2. THE CODE SCREEN'S NUMBERS ARE THE ROUTE'S (BOB-26 §2.1, D-079
      //    addendum): «berlaku selama N menit» from berlakuMenit, the resend
      //    countdown from kirimUlangDalam; nothing on the screen types either
      const minta = code(readFileSync(join(dir, "MintaKode.tsx"), "utf8"));
      c.expect(/\{s\("aktifkan\.berlaku"\)\} \{format\.durasi\(layar\.berlakuMenit \* 60, locale\)\}\{s\("aktifkan\.berlaku_lalu"\)\}/.test(minta)
        && (minta.match(/berlakuMenit: r\.berlakuMenit/g) ?? []).length === 2,
        "the code's lifetime on screen is not the route's berlakuMenit, on the first code and on a resend");
      c.expect((minta.match(/bolehUlangPada: kini \+ r\.kirimUlangDalam \* 1000/g) ?? []).length === 2 && /disabled=\{!siap \|\| sisa > 0 \|\| layar\.ulang === "sibuk"\}/.test(minta),
        "the resend countdown is not the route's kirimUlangDalam, or the resend is not held while it runs");
      // minutes to seconds and seconds to milliseconds are units, not durations
      c.expect(!/\b(60|600|10)\b/.test(minta.replace(/\* 60\b/g, "").replace(/\* 1000\b/g, "").replace(/\/ 1000\b/g, "")), "the code screen types a number of seconds or minutes");
      c.expect(/fd\.set\("kode", kode\);/.test(minta) && /const kode = hanyaAngka\(/.test(minta) && !/maxLength|pattern=/.test(minta),
        "the code is not sent as digits, or the field refuses «482 913» as typed");
      // a real destination, inside PINTAR, as a whole-page load
      c.expect(/window\.location\.assign\(tujuanAman\(r\.tujuan\)\)/.test(minta) && /window\.location\.assign\(tujuanAman\(jawaban\.tujuan\)\)/.test(masuk),
        "a signed-in answer's destination is followed without narrowing it to PINTAR");

      // 3. THE SIGNED-OUT ANSWER IS UNIFORM (D2): the code screen says «if
      //    this address is registered», whatever the address, and no branch
      //    of the email form depends on the address having an account
      for (const locale of LOCALES) {
        c.expect(/jika alamat ini terdaftar|if this address is registered/i.test(t("aktifkan.kode_terkirim", "public", { locale })),
          `(${locale}) the code screen says a code was sent to this address in particular`);
      }
      c.expect(!/terdaftar\s*[?:]|ada_akun|punyaAkun|exists/i.test(minta), "the code screen branches on whether the address has an account");

      // 4. ACTIVATION POINTS TO /aktifkan (D-019 amended): the proxy lets it
      //    be reached signed out once BOB-26 lands; the page is the two
      //    screens, chosen by the session
      const hal = code(baca1(repoRoot, "src", "app", "aktifkan", "page.tsx"));
      c.expect(/viewer \? <WizardAktivasi locale=\{locale\} \/> : <MintaKode locale=\{locale\} \/>/.test(hal), "/aktifkan does not choose between the email and the wizard by the session");
      c.expect(/href="\/aktifkan"/.test(masuk) && /s\("auth\.aktifkan_go"\)/.test(masuk), "«Masuk ke PINTAR» does not lead to «Aktifkan akun»");
      const kontrak = code(baca1(repoRoot, "src", "components", "aktifkan", "kontrak.ts"));
      c.expect(/export const TAUTAN_MASUK_CADANGAN = true;/.test(kontrak) || existsSync(join(repoRoot, "src", "lib", "aktivasi-kontrak.ts")),
        "the email-link fallback switch is neither the transcription's nor BOB-26's");

      return c.verdict(
        "every DAISY-20 request is jawaban.ts's one fetch to the contract's path, no-store and same-origin, and no screen reads a " +
        "server message; the code screen's «berlaku selama N menit» is format.durasi of the route's berlakuMenit and its resend " +
        "countdown the route's kirimUlangDalam, on the first code and on a resend, the resend held while it runs, with no number " +
        "typed; the code goes as digits from a field that takes «482 913»; every destination is narrowed to PINTAR; the code screen " +
        "says «jika alamat ini terdaftar» for every address and nothing branches on an account existing (D2); /aktifkan chooses the " +
        "email or the wizard by the session, and «Masuk ke PINTAR» leads to «Aktifkan akun» (D-019 amended)",
      );
    },
  },
];
