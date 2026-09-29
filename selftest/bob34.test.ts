/**
 * BOB-34 (UX-03, found by Daisy at DAISY-27) -- A REFUSED UJI CEPAT KEEPS THE
 * TEACHER'S CHOICES. The refusal redirect carried the code but not the chapter,
 * count and time the teacher picked, so the form reset, even when the sentence
 * said «choose fewer questions». It now carries them, as sent, encoded; the page
 * reads and validates them itself and, with no stage parameter, lands on the
 * form where the choice is changed.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const bob34Tests: SelfTest[] = [
  {
    id: "BOB34-K01",
    run: async (ctx) => {
      const c = new Checks();
      let mod: Record<string, unknown> | null = null;
      try { mod = (await import("../src/lib/ujicepat-kontrak")) as Record<string, unknown>; } catch { mod = null; }
      const alamat = mod?.alamatTolakUjiCepat as
        ((k: string, p: { bab: string; soal: string; menit: string }, ref?: string | null) => string) | undefined;
      const baca = mod?.bacaGagalUjiCepat as ((q: Record<string, string>) => { kode: string | null; ref: string | null } | null) | undefined;

      // 1. the address carries the code, the reference only when given, and the choices as sent
      if (c.expect(typeof alamat === "function", "there is no refusal address that keeps the choices: src/lib/ujicepat-kontrak.ts has no alamatTolakUjiCepat")) {
        const bab = "0b5e9c1e-7a3d-4c2b-9f00-1a2b3c4d5e6f";
        const a = alamat!("QUICK_BANK_TOO_SMALL", { bab, soal: "15", menit: "20" });
        c.expect(a.startsWith("/uji-cepat?"), `the refusal goes to ${a}, not the Uji Cepat page`);
        const q = Object.fromEntries(new URLSearchParams(a.split("?")[1] ?? ""));
        c.expect(q.cepat === "gagal" && q.kode === "QUICK_BANK_TOO_SMALL" && q.bab === bab && q.soal === "15" && q.menit === "20" && !("ref" in q),
          `the refusal address reads back as ${JSON.stringify(q)}`);
        c.expect(!("tahap" in q), "the refusal lands on the review stage instead of the form where the choice is changed");
        const b = Object.fromEntries(new URLSearchParams(alamat!("QUICK_FAILED", { bab, soal: "5", menit: "10" }, "AB12CD").split("?")[1] ?? ""));
        c.expect(b.ref === "AB12CD" && b.kode === "QUICK_FAILED" && b.soal === "5", `the catch-all's address reads back as ${JSON.stringify(b)}`);
        // encoded: whatever was sent comes back as it was, and nothing escapes its parameter
        const aneh = { bab: "a&b=c d?#", soal: "15&kode=QUICK_NOT_ALLOWED", menit: "20" };
        const r = Object.fromEntries(new URLSearchParams(alamat!("QUICK_COUNT_OUT_OF_RANGE", aneh).split("?")[1] ?? ""));
        c.expect(r.bab === aneh.bab && r.soal === aneh.soal && r.kode === "QUICK_COUNT_OUT_OF_RANGE",
          `a sent value with & = ? # is not carried as sent, or overrode the code: ${JSON.stringify(r)}`);
        const kosong = Object.fromEntries(new URLSearchParams(alamat!("QUICK_NOT_FOUND", { bab: "", soal: "", menit: "" }).split("?")[1] ?? ""));
        c.expect(!("bab" in kosong) && !("soal" in kosong) && !("menit" in kosong), "an empty choice is carried as an empty parameter");
        // the page still reads the refusal from it
        if (typeof baca === "function") {
          c.expect(JSON.stringify(baca(q)) === JSON.stringify({ kode: "QUICK_BANK_TOO_SMALL", ref: null }), "the page no longer reads the code from the address");
        }
      }

      // 2. the action sends the teacher's own choices, as sent, on both refusal paths
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const fn = /export async function sediakanUjiCepat[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/const pilihan = \{ bab, soal: bersih\(formData\.get\("soal"\)\), menit: bersih\(formData\.get\("menit"\)\) \}/.test(fn),
        "sediakanUjiCepat does not keep the chapter, count and time as the teacher sent them");
      c.expect(/alamatTolakUjiCepat\(kode, pilihan\)/.test(fn) && /alamatTolakUjiCepat\(kode, pilihan, ref\)/.test(fn),
        "a refusal of sediakanUjiCepat does not carry the teacher's choices back to the form");

      // 3. the page reopens the form from them: it reads bab, soal and menit and validates each
      const halaman = readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8");
      c.expect(/const pilihBab = q\.bab && bab\.some\(/.test(halaman) && /const pilihSoal = Math\.min\(Math\.max\(Number\(q\.soal\)/.test(halaman)
          && /const pilihMenit = ajar\.JENDELA_MENIT\.includes\(Number\(q\.menit\)/.test(halaman),
        "the Uji Cepat page no longer reads and validates bab, soal and menit, so carried choices would not reopen the form");

      return c.verdict(
        "a refused launch goes to /uji-cepat?cepat=gagal&kode=… carrying bab, soal and menit exactly as the teacher sent them " +
          "(encoded, so a value with & = ? # comes back whole and cannot override the code; an empty one is left out), the " +
          "reference only for QUICK_FAILED, and no stage, so the page opens its form; the page still reads the code; " +
          "sediakanUjiCepat builds both refusal addresses from the choices as sent; and the page reads and validates bab, " +
          "soal and menit to reopen the form",
      );
    },
  },
];
