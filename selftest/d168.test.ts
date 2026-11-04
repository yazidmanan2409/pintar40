/**
 * D-168 (cross-component integrity) and D-172 (one experience): checks that span components, kept in one place
 * inside the existing static suite.
 *
 *   D168-B1-5  Konfigurasi: every school-shaped section (BAGIAN_SEKOLAH) is drawn only where the menu lists it, so
 *              «Seluruh platform» draws none (L3; D-169(a)). Each such <section> carries the same `tampil()` rule the
 *              menu uses — the menu and the sections cannot disagree.
 *   D168-B2-1  the person's number at a school has one name (D-174, D-175): no user-facing string, in either language,
 *              says «nomor induk», «identity number», «school number» or «ID PINTAR»; the approved term and its short
 *              label are used; the five identifiers stay apart (the PINTAR ID is never called a registration number,
 *              «Kode sekolah» stays the school's, the number is never offered as the NIS/NISN, «Keanggotaan» stays
 *              class membership); Pendataan and Aktivasi carry the same approved explanation.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { allKeys, t, type HleEvent } from "../src/lib/hle";

const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const d168Tests: SelfTest[] = [
  {
    id: "D168-B1-5",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      const m = src.match(/const BAGIAN_SEKOLAH = \[([^\]]*)\]/);
      if (!c.expect(m !== null, "BAGIAN_SEKOLAH (the school-shaped sections) is not declared in Konfigurasi") || !m) return c.verdict("");
      const bagian = [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
      c.expect(bagian.length >= 5, `only ${bagian.length} school-shaped sections declared`);
      c.expect(/const nav = navSemua\.filter\(\(\[bagian\]\) => tampil\(bagian\)\)/.test(src), "the menu is not filtered by tampil()");
      for (const b of bagian) {
        const tag = src.match(new RegExp(`<section id="${b}"[^>]*>`));
        if (!tag) continue; // a section drawn elsewhere (or not at all) is not this page's
        c.expect(new RegExp(`hidden=\\{!tampil\\("${b}"\\)`).test(tag[0]), `the section «${b}» is drawn without the menu's rule (tampil): it shows in «Seluruh platform» although L3 hides it`);
      }
      return c.verdict("every school-shaped Konfigurasi section carries the menu's own tampil() rule, so «Seluruh platform» draws none");
    },
  },
  {
    id: "D168-B2-1",
    run: async () => {
      const c = new Checks();
      const semua = allKeys().flatMap((k) => (["id", "en"] as const).map((l) => [k, l, t(k as HleEvent, "staff", { locale: l })] as const));
      const lama = semua.filter(([, , v]) => /nomor induk|identity numbers?|school number|school's number|\bID PINTAR\b/i.test(v));
      c.expect(lama.length === 0, `the old or reversed names remain: ${lama.slice(0, 6).map(([k, l]) => `${k} (${l})`).join(", ")}`);
      const pakai = semua.filter(([, l, v]) => l === "id" && /nomor registrasi sekolah|No\. Registrasi Sekolah/i.test(v)).length;
      c.expect(pakai >= 10, `only ${pakai} Indonesian strings use «Nomor Registrasi Sekolah»`);
      const salah = semua.filter(([, , v]) => /PINTAR ID[^.]{0,40}(registrasi|registration)|(registrasi|registration)[^.]{0,40}\b(adalah|is)\b[^.]{0,20}PINTAR ID/i.test(v)
        || /(nomor registrasi|registration number)[^.]{0,30}\b(NIS|NISN)\b(?![^.]{0,5}\.)/.test(v) && !/Berbeda dari|Different from/.test(v)
        || /Keanggotaan[^.]{0,20}(nomor|number)/i.test(v));
      c.expect(salah.length === 0, `an identifier is presented as another: ${salah.slice(0, 4).map(([k, l]) => `${k} (${l})`).join(", ")}`);
      const arti = "Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.";
      c.expect(t("pendataan.nomor.arti" as HleEvent, "staff", { locale: "id" }).startsWith(arti) && t("aktivasi.tunggu.cari_arti" as HleEvent, "staff", { locale: "id" }) === arti,
        "Pendataan and Aktivasi do not carry the same approved explanation");
      return c.verdict("one name for the person's number at a school, in both languages; the identifiers stay apart; one explanation on both surfaces");
    },
  },
];
