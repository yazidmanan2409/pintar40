/**
 * C3w-1 · THE DRAFTING ROUTE, its core (src/lib/ai/jalur.ts), red first (design §2 step 3; Sharon's F-2 of her build
 * review of 992b568f; C3-3; Bob's decisions of 21 Nov). The core takes every database call and the provider as
 * arguments, so each case below runs the real order of steps against recording fakes: what is called, in what order,
 * with what, and how often the provider is reached.
 *
 *   C3W-R01  the happy path calls request, reserve, claim, provider, write, in that order, the provider once.
 *            F-2: a text checked on one version and sent with another is refused before the claim, the provider never
 *            reached and the reservation released; a lesson's text is read once and sent exactly as checked.
 *            A refused request, a repeated key (D11) and an absent provider each reach no reservation and no provider.
 *            A claim that fails reaches no provider. A provider failure with usage is settled PROVIDER_FAILED and
 *            retried as a new attempt, at most 3 attempts in all; a timeout with no usage is left to the sweep and not
 *            retried; an output the write refuses is settled INVALID_OUTPUT and not retried.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

type Panggilan = { fn: string; args: Record<string, unknown> };
type Rpc = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; details?: string } | null }>;
type Penyedia = { panggil: (p: { excerpt: string; objectives: string[]; itemSchema: { maxItems: number }; promptVersion: string }) => Promise<unknown> };

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const SOAL = (n: number) => Array.from({ length: n }, (_, i) => ({
  stem: `Soal ${i + 1}`,
  options: [{ label: "A", text: "Satu", correct: true }, { label: "B", text: "Dua", correct: false }],
}));
const PAKAI = { token_masuk: 200, token_keluar: 80, biaya_mikro: 280 };

/** A recording world: what the database answers, and every call made. */
function dunia(o: {
  minta?: Record<string, unknown>; cadang?: string[]; kirim?: boolean; tulis?: { error?: string };
  penyedia?: Array<"ok" | "gagal" | "habis" | "dua-kunci"> | "tidak-ada"; bahan?: string;
}) {
  const log: Panggilan[] = [];
  let ke = 0;
  const cadang = [...(o.cadang ?? ["p1", "p2", "p3"])];
  const pengguna: Rpc = async (fn, args) => {
    log.push({ fn, args });
    if (fn === "c3w_bahan") return { data: { judul: "Pelajaran", teks: o.bahan ?? "Isi pelajaran.", tujuan: [] }, error: null };
    if (fn === "ai_minta_draf") return { data: o.minta ?? { ok: true, permintaan: "m1", sidik: sha(String(args.p_teks)) }, error: null };
    return { data: null, error: { message: `unknown ${fn}` } };
  };
  const layanan: Rpc = async (fn, args) => {
    log.push({ fn, args });
    if (fn === "ai_cadangkan") { const id = cadang.shift(); return id ? { data: id, error: null } : { data: null, error: { message: "x", details: "AI_GAGAL" } }; }
    if (fn === "ai_tandai_kirim") return { data: o.kirim ?? true, error: null };
    if (fn === "ai_tulis_draf") return o.tulis?.error ? { data: null, error: { message: "x", details: o.tulis.error } } : { data: { ok: true, items: ["i1", "i2"] }, error: null };
    if (fn === "ai_gagal" || fn === "ai_lepaskan") return { data: { ok: true }, error: null };
    return { data: null, error: { message: `unknown ${fn}` } };
  };
  const mode = o.penyedia ?? ["ok"];
  const penyedia: Penyedia | { kode: "AI_TIDAK_TERSEDIA" } = mode === "tidak-ada" ? { kode: "AI_TIDAK_TERSEDIA" } : {
    panggil: async (p) => {
      log.push({ fn: "PENYEDIA", args: { excerpt: p.excerpt } });
      const m = mode[Math.min(ke++, mode.length - 1)];
      if (m === "ok") return { ok: true, soal: SOAL(p.itemSchema.maxItems), penggunaan: PAKAI };
      if (m === "dua-kunci") return { ok: true, soal: SOAL(p.itemSchema.maxItems).map((s) => ({ ...s, options: s.options.map((x) => ({ ...x, correct: true })) })), penggunaan: PAKAI };
      if (m === "gagal") return { ok: false, sebab: "GAGAL", penggunaan: PAKAI };
      return new Promise(() => undefined); // never answers: the core's own timeout ends it
    },
  };
  return { log, pengguna, layanan, penyedia, urut: () => log.map((x) => x.fn) };
}

const MASUK = { course: "c1", lesson: "l1", sumber: "TEMPEL" as const, teks: "Budi membeli lima apel.", objectives: ["Membandingkan pecahan"], jumlah: 2, kunci: "k1", hakSumber: true };

export const c3wJalurTests: SelfTest[] = [
  {
    id: "C3W-R01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const berkas = join(repoRoot, "src", "lib", "ai", "jalur.ts");
      if (!c.expect(existsSync(berkas), "src/lib/ai/jalur.ts is missing: the drafting route has no core")) return c.verdict("");
      const m = await import(berkas) as { buatDrafAi?: (dep: unknown, masuk: unknown) => Promise<{ ok: boolean; kode?: string; items?: unknown }> };
      if (!c.expect(typeof m.buatDrafAi === "function", "jalur.ts does not export buatDrafAi(dep, masuk)")) return c.verdict("");
      const jalan = (w: ReturnType<typeof dunia>, masuk: object = MASUK) =>
        m.buatDrafAi!({ pengguna: w.pengguna, layanan: w.layanan, penyedia: w.penyedia, batasMs: 50 }, { ...MASUK, ...masuk });
      const kali = (w: ReturnType<typeof dunia>, fn: string) => w.log.filter((x) => x.fn === fn).length;

      // the happy path
      let w = dunia({});
      let r = await jalan(w);
      c.expect(r.ok === true && JSON.stringify(w.urut()) === JSON.stringify(["ai_minta_draf", "ai_cadangkan", "ai_tandai_kirim", "PENYEDIA", "ai_tulis_draf"]),
        `the happy path: ${JSON.stringify(r)} via ${w.urut().join(" > ")} (request > reserve > claim > provider > write)`);
      const tulis = w.log.find((x) => x.fn === "ai_tulis_draf")?.args ?? {};
      c.expect(JSON.stringify(tulis.p_penggunaan) === JSON.stringify(PAKAI) && Array.isArray(tulis.p_soal) && (tulis.p_soal as unknown[]).length === 2
        && JSON.stringify(Object.keys((tulis.p_soal as Array<{ options: object[] }>)[0].options[0]).sort()) === JSON.stringify(["body", "is_correct", "label"]),
        `the write's arguments: ${JSON.stringify(tulis)} (the usage as reported; each option label, body, is_correct)`);
      // F-2: checked on one version, sent with another
      w = dunia({ minta: { ok: true, permintaan: "m1", sidik: sha("Teks versi lama.") } });
      r = await jalan(w);
      c.expect(r.ok === false && r.kode === "AI_TEKS_BERUBAH" && kali(w, "PENYEDIA") === 0 && kali(w, "ai_tandai_kirim") === 0 && kali(w, "ai_lepaskan") === 1,
        `F-2, a text checked on one version and sent with another: ${JSON.stringify(r)}; claims ${kali(w, "ai_tandai_kirim")}, provider ${kali(w, "PENYEDIA")}, releases ${kali(w, "ai_lepaskan")} (refused before the claim, released)`);
      // a lesson's text: read once, sent exactly as checked
      w = dunia({ bahan: "Teks pelajaran yang diperiksa." });
      r = await jalan(w, { sumber: "PELAJARAN", teks: undefined });
      const minta = w.log.find((x) => x.fn === "ai_minta_draf")?.args ?? {};
      const kirimTeks = w.log.find((x) => x.fn === "PENYEDIA")?.args.excerpt;
      c.expect(r.ok === true && kali(w, "c3w_bahan") === 1 && minta.p_teks === "Teks pelajaran yang diperiksa." && kirimTeks === minta.p_teks && minta.p_sumber === "PELAJARAN",
        `a lesson's text: ${kali(w, "c3w_bahan")} read(s), checked «${String(minta.p_teks)}», sent «${String(kirimTeks)}» (one read, the checked text sent)`);
      // nothing reserved, nothing sent
      for (const [nama, opsi] of [
        ["a refused request (personal data)", { minta: { ok: false, kode: "AI_DATA_PRIBADI", kelas: ["NAME"], rentang: ["[8,25)"] } }],
        ["a repeated key (D11)", { minta: { ok: true, permintaan: "m1", ulang: true } }],
        ["no provider available", { penyedia: "tidak-ada" as const }],
      ] as const) {
        w = dunia(opsi as Parameters<typeof dunia>[0]);
        r = await jalan(w);
        c.expect(kali(w, "ai_cadangkan") === 0 && kali(w, "PENYEDIA") === 0, `${nama}: ${JSON.stringify(r)}; reserved ${kali(w, "ai_cadangkan")}, provider ${kali(w, "PENYEDIA")} (neither)`);
      }
      w = dunia({ kirim: false });
      r = await jalan(w);
      c.expect(r.ok === false && kali(w, "PENYEDIA") === 0, `a claim that fails: ${JSON.stringify(r)}; provider ${kali(w, "PENYEDIA")} (not reached)`);
      // failures
      w = dunia({ penyedia: ["gagal", "gagal", "gagal"] });
      r = await jalan(w);
      const gagal = w.log.filter((x) => x.fn === "ai_gagal").map((x) => x.args.p_hasil);
      c.expect(r.ok === false && r.kode === "AI_GAGAL" && kali(w, "PENYEDIA") === 3 && kali(w, "ai_cadangkan") === 3 && JSON.stringify(gagal) === JSON.stringify(["PROVIDER_FAILED", "PROVIDER_FAILED", "PROVIDER_FAILED"]),
        `a provider failing with usage: ${JSON.stringify(r)}; attempts ${kali(w, "ai_cadangkan")}, calls ${kali(w, "PENYEDIA")}, settled ${JSON.stringify(gagal)} (3, 3, each PROVIDER_FAILED)`);
      w = dunia({ penyedia: ["gagal", "ok"] });
      r = await jalan(w);
      c.expect(r.ok === true && kali(w, "PENYEDIA") === 2 && kali(w, "ai_tulis_draf") === 1, `a failure then a success: ${JSON.stringify(r)}; calls ${kali(w, "PENYEDIA")} (2, one write)`);
      w = dunia({ penyedia: ["habis"] });
      r = await jalan(w);
      c.expect(r.ok === false && kali(w, "PENYEDIA") === 1 && kali(w, "ai_gagal") === 0 && kali(w, "ai_cadangkan") === 1,
        `a timeout with no usage: ${JSON.stringify(r)}; calls ${kali(w, "PENYEDIA")}, settled ${kali(w, "ai_gagal")} (1, none: the sweep holds it; no retry)`);
      w = dunia({ penyedia: ["dua-kunci"], tulis: { error: "AI_KELUARAN_TIDAK_SAH" } });
      r = await jalan(w);
      c.expect(r.ok === false && r.kode === "AI_KELUARAN_TIDAK_SAH" && kali(w, "PENYEDIA") === 1
        && JSON.stringify(w.log.filter((x) => x.fn === "ai_gagal").map((x) => x.args.p_hasil)) === JSON.stringify(["INVALID_OUTPUT"]),
        `an output the write refuses: ${JSON.stringify(r)}; calls ${kali(w, "PENYEDIA")} (1, settled INVALID_OUTPUT, not retried)`);
      return c.verdict("imports src/lib/ai/jalur.ts and executes buatDrafAi against recording fakes of the database and the provider: the happy path calls request, reserve, claim, provider, write in order, the provider once, the write given the usage as reported and options of label, body, is_correct; F-2: a text checked on one version and sent with another is refused AI_TEKS_BERUBAH before the claim, the provider never reached and the reservation released; a lesson's text is read once and sent exactly as checked; a refused request, a repeated key and an absent provider reach no reservation and no provider; a failed claim reaches no provider; a provider failing with usage is settled PROVIDER_FAILED and retried, 3 attempts at most; a timeout with no usage is left to the sweep, not retried; an output the write refuses is settled INVALID_OUTPUT, not retried");
    },
  },
  {
    id: "C3W-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // C-3 (Daisy, round 2): the working line is a note while it works, never a result: neutral tone, no ✓
      const sumber = readFileSync(join(repoRoot, "src", "components", "studio", "DrafAi.tsx"), "utf8");
      const baris = /<BarisHasil\b[^>]*>\{s\("studio\.ai\.bekerja"\)/.exec(sumber)?.[0] ?? "";
      c.expect(baris !== "", "the working line «Menyusun {n} draf soal…» is not drawn through BarisHasil");
      c.expect(/nada="netral"/.test(baris), `the working line's tone: ${baris} (nada="netral": no ✓ while still working)`);
      // and BarisHasil draws its ✓ only for the ok tone, so a neutral line carries none
      const komponen = readFileSync(join(repoRoot, "src", "components", "BarisHasil.tsx"), "utf8");
      c.expect(/\{nada === "ok" && !kelas \? <span className="pin-centang" aria-hidden="true">✓<\/span>/.test(komponen),
        "BarisHasil's ✓ is not drawn only for nada=\"ok\"");
      // N-12: AI_TUJUAN_LAIN has its own sentence, ID and EN
      const { t } = await import("../src/lib/hle");
      const { kodeAi, kunciKode } = await import("../src/lib/galat-kontrak");
      const k = kunciKode(kodeAi("AI_TUJUAN_LAIN"));
      c.expect(kodeAi("AI_TUJUAN_LAIN") === "AI_TUJUAN_LAIN" && k === "galat.ai_tujuan_lain"
        && t(k, "staff", { locale: "id" }) === "Tujuan pembelajaran pelajaran ini sudah berubah. Muat ulang halaman, lalu pilih lagi."
        && t(k, "staff", { locale: "en" }) === "This lesson's learning objectives have changed. Reload the page, then choose again.",
        `AI_TUJUAN_LAIN reads ${kodeAi("AI_TUJUAN_LAIN")} → ${k}: «${t(k, "staff", { locale: "id" })}» / «${t(k, "staff", { locale: "en" })}» (Daisy's N-12, word for word)`);
      return c.verdict("reads the source of src/components/studio/DrafAi.tsx and src/components/BarisHasil.tsx (Daisy's C-3): the working line «Menyusun {n} draf soal…» is drawn with nada=\"netral\", whose only ✓ is drawn for the ok tone, so the working line carries none; and imports the copy table and the action contract (N-12): AI_TUJUAN_LAIN maps to its own key, galat.ai_tujuan_lain, whose ID and EN are Daisy's words");
    },
  },
];
