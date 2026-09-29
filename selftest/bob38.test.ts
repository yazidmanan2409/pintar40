/**
 * BOB-38 (post-login review #1, D-061) -- A SUCCESSFUL EMAIL SIGN-IN NEVER
 * SHOWS THE FAILED-LINK SCREEN. `tukarKode` redirected on success, a server
 * action's redirect rejects its caller's promise, and TukarTautan read every
 * settled promise, rejection included, as a dead link: each successful
 * exchange drew S14 («Tautan ini sudah tidak berlaku … Minta tautan baru»)
 * until the role home rendered. Success is now an answer the page acts on.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

export const bob38Tests: SelfTest[] = [
  {
    id: "BOB38-K01",
    run: async (ctx) => {
      const c = new Checks();
      let mod: Record<string, unknown> | null = null;
      try { mod = (await import("../src/lib/tukar-kontrak")) as Record<string, unknown>; } catch { mod = null; }
      const sesudah = mod?.sesudahTukar as ((h: unknown) => { pergi: string } | { mati: true }) | undefined;

      // 1. the page's decision, executed: success leaves for the destination, never S14
      if (c.expect(typeof sesudah === "function", "the callback page has no way to tell a successful exchange from a refused one: src/lib/tukar-kontrak.ts has no sesudahTukar")) {
        const jadi = (h: unknown) => JSON.stringify(sesudah!(h));
        c.expect(jadi({ ok: true, tujuan: "/mengajar" }) === JSON.stringify({ pergi: "/mengajar" }), `a successful exchange is read as ${jadi({ ok: true, tujuan: "/mengajar" })}, not a departure for /mengajar`);
        c.expect(jadi({ ok: true, tujuan: "/belajar/tugas?tab=2#soal" }) === JSON.stringify({ pergi: "/belajar/tugas?tab=2#soal" }), "a carried destination does not survive whole");
        c.expect(jadi({ ok: true, tujuan: "//asing.example/x" }) === JSON.stringify({ pergi: "/" }), "a destination that is not a path is followed, or shows S14, instead of landing on the role's home (/)");
        // preserved: every refusal is still S14
        for (const h of [{ ok: false }, undefined, null, "x", { ok: "true" }]) {
          c.expect(jadi(h) === JSON.stringify({ mati: true }), `${JSON.stringify(h)} is read as ${jadi(h)}, not S14`);
        }
      }

      // 2. the action answers success rather than redirecting (a redirect rejects the page's promise)
      const aksi = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "app", "auth", "callback", "actions.ts"), "utf8"));
      const fn = /export async function tukarKode[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(fn !== "" && !/\bredirect\(/.test(fn), "tukarKode still redirects on success, which rejects the page's promise into S14");
      c.expect(/return \{ ok: true, tujuan: await tujuanMasuk\(lanjut\) \};/.test(fn), "tukarKode does not answer success with tujuanMasuk's destination");
      c.expect(/if \(error\) return \{ ok: false \};/.test(fn), "a refused exchange no longer answers { ok: false }");

      // 3. the page: success leaves with location.replace; only a refusal or a failed request is S14
      const tukar = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "components", "masuk", "TukarTautan.tsx"), "utf8"));
      c.expect(!/\.then\(\(\) => setMati\(true\)\)/.test(tukar), "TukarTautan still shows S14 when the exchange settles, success included");
      c.expect(/const lanjutan = sesudahTukar\(hasil\);/.test(tukar) && /if \("pergi" in lanjutan\) window\.location\.replace\(lanjutan\.pergi\);\s*else setMati\(true\);/.test(tukar),
        "TukarTautan does not leave for the destination on success (replacing the used callback in history)");
      c.expect(/\.catch\(\(\) => setMati\(true\)\)/.test(tukar), "a request that never came back no longer shows S14");

      // 4. preserved: S14 at once for a missing code or the provider's error parameters, and a clean new link
      const halaman = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "app", "auth", "callback", "page.tsx"), "utf8"));
      c.expect(/const mati = Boolean\(sp\.error \|\| sp\.error_code\) \|\| !sp\.code;/.test(halaman), "the callback no longer shows S14 at once for a missing code or an error parameter");
      c.expect(/href="\/masuk"/.test(tukar) && !/lanjut=/.test(tukar), "«Minta tautan baru» no longer starts clean (D1)");

      return c.verdict(
        "the exchange answers { ok: true, tujuan } with tujuanMasuk's destination instead of redirecting, and the callback page, " +
          "deciding through sesudahTukar (executed here), leaves for it with location.replace so S14 never renders on success and the " +
          "used callback is not left in history; a carried destination survives whole and a non-path lands on the role's home; a " +
          "refusal (expired, used, another browser) or a request that never came back is still S14; S14 still shows at once for a " +
          "missing code or an error parameter, and «Minta tautan baru» still goes to /masuk with no destination",
      );
    },
  },
];
