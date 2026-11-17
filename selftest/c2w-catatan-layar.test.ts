/**
 * C2w · REVIEWER NOTES («Catatan peninjau»), the screens, written red first (PLAN-A2B-C2W.md §3.4 B3; Sharon's D4,
 * 3a2de775; Daisy's words, C2W-CATATAN-KATA.md at 535561ed). The database half is selftest/c2w-catatan.test.ts.
 *
 *   C2W-K01  reads the source: every code catatan_tolak (PR210) raises is the screens' contract's
 *            (src/lib/catatan-kontrak.ts) and has its sentence in Indonesian and English; Daisy's words are in the copy
 *            table word for word; the notes' disclosures never print (pin-noprint) and «anotasi» appears in no string.
 *   C2W-B3   the running app, on a package the cycle's people publish: the school's head of department finds
 *            «Catatan peninjau (0)» after «Riwayat soal» with a «Tulis catatan» per option; an empty note is refused in
 *            Daisy's words and the typed text is kept; a note is saved («Catatan tersimpan.»), its markup shown as text
 *            (D4), attributed «{nama} · {tanggal} · versi 1»; «Ganti catatan» replaces it and the old one moves under
 *            «Catatan sebelumnya (1)» with «Diganti pada …»; the package's author (CAN_DRAFT only) reads the note with no
 *            form; the class's learner's pages carry no note.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { type Komputer } from "./bob29.test";
import { tersusun } from "./konteks-uji";
import { GURU, KADEP, type Dunia, bersihkan, dunia, masuk, muat, muridUji, soalDi, terbitkan } from "./c1w-layar.test";
import { t, type HleEvent } from "../src/lib/hle";

const MIGRASI = "supabase/migrations/20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql";
const KONTRAK = "src/lib/catatan-kontrak.ts";
const id = (k: string, untuk: "educator" | "staff" = "staff") => t(k as HleEvent, untuk, { locale: "id" });
const en = (k: string, untuk: "educator" | "staff" = "staff") => t(k as HleEvent, untuk, { locale: "en" });
const baca = (root: string, f: string) => { try { return readFileSync(join(root, f), "utf8"); } catch { return ""; } };
const teks = (html: string) => tersusun(html).replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const ke = (r: Response) => (r.headers.get("location") ?? "").replace(/&amp;/g, "&");
function formDengan(html: string, penanda: string, isi: Record<string, string>): Record<string, string> | string {
  const bentuk = tersusun(html).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0]).filter((b) => b.includes(penanda));
  if (bentuk.length !== 1) return `${bentuk.length} form(s) hold ${penanda}`;
  const out: Record<string, string> = {};
  for (const m of bentuk[0].matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)) {
    const nama = /\bname="([^"]*)"/.exec(m[0])?.[1];
    const nilai = (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (nama) out[nama] = nilai;
  }
  return { ...out, ...isi };
}

/** Daisy's words (C2W-CATATAN-KATA.md §1 to §3, and the I-5 lines of A2B-C2W-KATA.md §3), word for word. */
export const KATA_CATATAN: Array<[string, string, string]> = [
  ["studio.catatan.judul", "Catatan peninjau ({n})", "Reviewer notes ({n})"],
  ["studio.catatan.pilihan", "Pilihan {label}", "Option {label}"],
  ["studio.catatan.sebelumnya", "Catatan sebelumnya ({n})", "Earlier notes ({n})"],
  ["studio.catatan.diganti_pada", "Diganti pada {tanggal}", "Replaced on {tanggal}"],
  ["studio.catatan.tulis", "Tulis catatan", "Write a note"],
  ["studio.catatan.ganti", "Ganti catatan", "Replace the note"],
  ["studio.catatan.label", "Catatan untuk pilihan {label}", "Note on option {label}"],
  ["studio.catatan.petunjuk", "Apa yang ditunjukkan pilihan ini tentang cara berpikir murid? Catatan ini tidak dilihat murid dan tidak mengubah soal atau nilai. Sampai 1000 karakter.",
    "What does this option show about how learners think? Learners never see this note, and it changes no question or score. Up to 1000 characters."],
  ["studio.catatan.petunjuk_ganti", "Catatan lama tetap tersimpan dan terlihat di Catatan sebelumnya.", "The old note stays saved and visible under Earlier notes."],
  ["studio.catatan.simpan", "Simpan catatan", "Save the note"],
  ["studio.catatan.batal", "Batal", "Cancel"],
  ["studio.catatan.tersimpan", "Catatan tersimpan.", "Note saved."],
  ["studio.catatan.oleh", "{nama} · {tanggal} · versi {n}", "{nama} · {tanggal} · version {n}"],
  ["studio.catatan.pintar", "Peninjau PINTAR", "PINTAR reviewer"],
  ["studio.catatan.oleh_guru", "Peninjau: {nama} · {tanggal}", "Reviewer: {nama} · {tanggal}"],
  ["studio.catatan.i5", "Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Catatan ini tentang versi {n}; kunci yang berlaku sekarang {kunci_kini}.",
    "Written before this question's key was corrected, when its key was still {kunci_saat_itu}. This note is about version {n}; the key in force now is {kunci_kini}."],
  ["studio.catatan.i5_guru", "Ditulis sebelum kunci soal ini diperbaiki, saat kuncinya masih {kunci_saat_itu}. Kunci yang berlaku sekarang {kunci_kini}.",
    "Written before this question's key was corrected, when its key was still {kunci_saat_itu}. The key in force now is {kunci_kini}."],
  ["studio.catatan.galat.note_text_invalid", "Tulis catatannya, 1 sampai 1000 karakter. Tidak ada yang disimpan.", "Write the note, 1 to 1000 characters. Nothing was saved."],
  ["studio.catatan.galat.note_not_sealed", "Catatan peninjau hanya dapat ditulis untuk soal yang sudah diterbitkan. Tidak ada yang disimpan.",
    "Reviewer notes can only be written on a published question. Nothing was saved."],
  ["studio.catatan.galat.note_not_allowed", "Hanya peninjau sekolah pemilik soal ini yang dapat menulis catatan peninjau. Tidak ada yang disimpan.",
    "Only a reviewer at the school that owns this question can write reviewer notes. Nothing was saved."],
  ["studio.catatan.galat.note_library_content", "Soal Pustaka PINTAR hanya diberi catatan oleh peninjau PINTAR. Tidak ada yang disimpan.",
    "PINTAR Library questions are annotated only by PINTAR's reviewers. Nothing was saved."],
  ["studio.catatan.galat.note_not_current", "Catatan ini baru saja diganti oleh peninjau lain. Muat ulang halaman untuk membaca catatan terbarunya. Tidak ada yang disimpan.",
    "Another reviewer has just replaced this note. Reload the page to read the latest note. Nothing was saved."],
];

export const c2wCatatanLayarTests: SelfTest[] = [
  {
    id: "C2W-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const m = baca(repoRoot, MIGRASI), k = baca(repoRoot, KONTRAK);
      if (!c.expect(m.length > 0 && k.length > 0, `${MIGRASI} or ${KONTRAK} does not exist`)) return c.verdict("");
      const blok = /create or replace function public\.catatan_tolak[\s\S]*?end \$\$;/.exec(m)?.[0] ?? "";
      const kode = [...blok.matchAll(/when '([A-Z_]+)'/g)].map((x) => x[1]);
      const kontrak = /KODE_CATATAN_DB = \[([\s\S]*?)\]/.exec(k)?.[1] ?? "";
      const diKontrak = [...kontrak.matchAll(/"([A-Z_]+)"/g)].map((x) => x[1]);
      c.expect(kode.length >= 9, `catatan_tolak names ${kode.length} code(s)`);
      for (const x of kode) c.expect(diKontrak.includes(x), `catatan_tolak raises ${x}, which the screens' contract does not know`);
      for (const x of diKontrak) c.expect(kode.includes(x), `the contract names ${x}, which catatan_tolak does not raise`);
      c.expect(/errcode = 'PR210'/.test(blok), "catatan_tolak does not raise PR210");
      for (const [kunci, i, e] of KATA_CATATAN) {
        c.expect(id(kunci) === i, `${kunci} is not Daisy's: «${id(kunci)}»`);
        c.expect(en(kunci) === e, `${kunci}'s English is not Daisy's: «${en(kunci)}»`);
      }
      const hle = baca(repoRoot, "src/lib/hle.ts");
      c.expect(!/"studio\.catatan[^"]*":\s*\{[^}]*anotasi/i.test(hle), "a notes string says «anotasi»");
      const komponen = baca(repoRoot, "src/components/studio/CatatanPeninjau.tsx");
      c.expect(/pin-noprint/.test(komponen) && (komponen.match(/<details\b/g) ?? []).length >= 2, "the notes' disclosures are not pin-noprint (O-3), or the nested «Catatan sebelumnya» is missing");
      return c.verdict("every code catatan_tolak (PR210) raises is the contract's and the reverse; Daisy's words are in the copy table word for word, each with her English; no notes string says «anotasi»; the notes' disclosures never print");
    },
  },
  {
    id: "C2W-B3",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag, `C1W layar catatan ${tag}`);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        terbitkan(d.course);
        const item = soalDi(d.course, "Pertanyaan awal nomor 1");
        const paket = (q = "") => `/studio/paket/${d.course}${q}`;
        const kadep0 = await masuk(asal, KADEP, `MENGELOLA:${d.inst}`);
        if (!c.expect(typeof kadep0 !== "string", String(kadep0))) return c.verdict("");
        const kadep = kadep0 as Komputer;
        // the disclosure, after «Riwayat soal», with a «Tulis catatan» per option
        const h0 = tersusun(await (await kadep.halaman(paket())).text());
        const iRiwayat = h0.indexOf('data-riwayat-soal="'), iCatatan = h0.indexOf(`data-catatan-peninjau="${item}"`);
        c.expect(iCatatan > 0 && iRiwayat > 0 && iCatatan > iRiwayat, `«Catatan peninjau» is not after «Riwayat soal» on the question (${iRiwayat}, ${iCatatan})`);
        c.expect(teks(h0).includes("Catatan peninjau (0)") && new RegExp(`data-catatan-tulis="${item}:B"`).test(h0) && new RegExp(`data-catatan-tulis="${item}:A"`).test(h0),
          "the reviewer is not offered «Catatan peninjau (0)» with a «Tulis catatan» on each option");
        c.expect(/class="[^"]*pin-noprint[^"]*"[^>]*data-catatan-peninjau|data-catatan-peninjau[^>]*class="[^"]*pin-noprint/.test(h0), "the notes' disclosure prints (O-3)");
        // the form, in place
        const h1 = tersusun(await (await kadep.halaman(paket(`?pelajaran=1&catatan=${item}:B`))).text());
        c.expect(teks(h1).includes("Catatan untuk pilihan B") && teks(h1).includes(id("studio.catatan.petunjuk")) && /name="isi"/.test(h1) && /maxlength="1000"/.test(h1),
          "the note's form for option B has not Daisy's label, hint, a text field and its 1000-character bound");
        // empty: refused in Daisy's words, the typed text kept, nothing saved
        const f0 = formDengan(h1, `data-catatan-form="${item}:B"`, { isi: "   " });
        if (!c.expect(typeof f0 !== "string", `the note's form: ${f0}`)) return c.verdict("");
        const r0 = await kadep.kirim(paket(), { form: f0 as Record<string, string> });
        const h2 = tersusun(await (await kadep.halaman(ke(r0).replace(asal, ""))).text());
        c.expect(/role="alert"/.test(h2) && teks(h2).includes(id("studio.catatan.galat.note_text_invalid"))
          && psql(`select count(*) from public.catatan_peninjau where item_id = ${lit(item)}`) === "0", `an empty note: ${ke(r0)}`);
        // a note with markup: saved, shown as text (D4), attributed with its version
        const ISI = "Banyak murid memilih <b>B</b> karena mengira penyebut besar berarti pecahan besar.";
        const r1 = await kadep.kirim(paket(), { form: { ...(f0 as Record<string, string>), isi: ISI } });
        const h3 = tersusun(await (await kadep.halaman(ke(r1).replace(asal, ""))).text());
        c.expect(teks(h3).includes("Catatan tersimpan.") && /role="status"/.test(h3), `the note was not saved: ${ke(r1)}`);
        c.expect(h3.includes("&lt;b&gt;B&lt;/b&gt;") && !h3.includes("<b>B</b>"), "the note's markup is rendered, not shown as text (D4)");
        c.expect(teks(h3).includes("Catatan peninjau (1)") && / · versi 1/.test(teks(h3)), "the saved note is not counted, or not attributed with its version");
        // replaced: the old one under «Catatan sebelumnya (1)»
        const lama = psql(`select id from public.catatan_peninjau where item_id = ${lit(item)} and opsi_label = 'B'`);
        c.expect(new RegExp(`data-catatan-ganti="${item}:B"`).test(h3), "the current note offers no «Ganti catatan»");
        const h4 = tersusun(await (await kadep.halaman(paket(`?pelajaran=1&catatan=${item}:B`))).text());
        c.expect(teks(h4).includes(id("studio.catatan.petunjuk_ganti")), "replacing does not say the old note stays");
        const f1 = formDengan(h4, `data-catatan-form="${item}:B"`, { isi: "Catatan pengganti untuk pilihan B." });
        if (!c.expect(typeof f1 !== "string" && (f1 as Record<string, string>).menggantikan === lama, `the replacing form does not name the note it replaces: ${typeof f1 === "string" ? f1 : (f1 as Record<string, string>).menggantikan}`)) return c.verdict("");
        const r2 = await kadep.kirim(paket(), { form: f1 as Record<string, string> });
        const h5 = tersusun(await (await kadep.halaman(ke(r2).replace(asal, ""))).text());
        c.expect(teks(h5).includes("Catatan sebelumnya (1)") && teks(h5).includes("Diganti pada ") && teks(h5).includes("Catatan pengganti untuk pilihan B."),
          `the replaced note is not under «Catatan sebelumnya (1)» with «Diganti pada …»: ${ke(r2)}`);
        // the package's author (CAN_DRAFT only): reads, writes nothing
        const guru0 = await masuk(asal, GURU, `MENGELOLA:${d.inst}`, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const h6 = tersusun(await (await (guru0 as Komputer).halaman(paket())).text());
        c.expect(teks(h6).includes("Catatan pengganti untuk pilihan B.") && !/data-catatan-tulis=|data-catatan-ganti=/.test(h6),
          "the author (CAN_DRAFT only) does not read the note, or is offered a form");
        // the class's learner: no page carries a note
        const murid0 = await masuk(asal, muridUji(tag), "BELAJAR");
        if (!c.expect(typeof murid0 !== "string", String(murid0))) return c.verdict("");
        for (const p of ["/belajar", "/"]) {
          const h = await (await (murid0 as Komputer).halaman(p)).text();
          c.expect(!h.includes("Catatan pengganti") && !h.includes("penyebut besar") && !/data-catatan-peninjau/.test(h), `the learner's ${p} carries a note`);
        }
        return c.verdict("in the running app, on a published package: the head of department finds «Catatan peninjau (0)» after «Riwayat soal», never printed, with «Tulis catatan» on each option; the form has Daisy's label, hint and a 1000-character bound; an empty note is refused in her words and nothing saved; a note with markup is saved and shown as text, attributed with version 1; «Ganti catatan» says the old note stays, and the old one moves under «Catatan sebelumnya (1)» with «Diganti pada …»; the author (CAN_DRAFT only) reads it with no form; the class's learner's pages carry none");
      } finally {
        bersihkan();
        psql(`begin; set local session_replication_role = replica; delete from public.catatan_peninjau c where not exists (select 1 from public.items i where i.id = c.item_id); commit;`);
      }
    },
  },
];
