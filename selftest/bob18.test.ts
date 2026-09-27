/**
 * BOB-18 (D-046) — the TypeScript halves of "PINTAR answers quickly" that need
 * no network. The counted halves, through the running app, are BOB18-A01
 * (selftest/app.test.ts); the database half is F01-T20 (selftest/db/fable01.sql).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** A client that records every call and answers `studio_capabilities` from `jawab`. */
function klien(jawab: { data: unknown; error: unknown }) {
  const panggilan: Array<{ jenis: string; nama: string; arg?: unknown }> = [];
  const rpc = async (nama: string, arg?: unknown) => {
    panggilan.push({ jenis: "rpc", nama, arg });
    return nama === "studio_capabilities" ? jawab : { data: true, error: null };
  };
  const from = (nama: string) => {
    panggilan.push({ jenis: "from", nama });
    const b: Record<string, unknown> = {};
    for (const k of ["select", "is", "gt", "eq", "in", "order", "limit"]) b[k] = () => b;
    b.then = (ok: (x: { data: unknown; error: null }) => unknown) =>
      Promise.resolve({ data: nama === "institutions" ? [{ id: "a", name: "Alpha" }] : [{ institution_id: "a" }], error: null }).then(ok);
    return b;
  };
  return { rpc, from, panggilan };
}

const tanpaKomentar = (s: string) => s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");

export const bob18Tests: SelfTest[] = [
  {
    // =======================================================================
    // BOB18-K01 — STUDIO ASKS ITS CAPABILITIES IN ONE CALL, AND THE VIEWER,
    // ROLES AND CAPABILITIES ARE READ ONCE PER REQUEST.
    // =======================================================================
    id: "BOB18-K01",
    run: async (ctx) => {
      const c = new Checks();
      const lib = (await import("../src/app/studio/_lib")) as Record<string, unknown>;
      const dari = lib.studioInstitutionsDari as ((c: unknown) => Promise<Array<{ id: string; name: string; capabilities: string[] }>>) | undefined;
      c.expect(typeof dari === "function", "there is no studioInstitutionsDari to drive");
      if (dari) {
        // one call, carrying every Studio capability, and nothing else
        const k = klien({
          data: [
            { institution_id: "b", name: "Beta", capabilities: ["CAN_DRAFT", "CAN_PUBLISH"] },
            { institution_id: "a", name: "Alpha", capabilities: ["CAN_REVIEW"] },
            { institution_id: "k", name: "Kosong", capabilities: [] },
          ],
          error: null,
        });
        const hasil = await dari(k);
        const nama = k.panggilan.map((p) => `${p.jenis}:${p.nama}`);
        c.expect(JSON.stringify(nama) === JSON.stringify(["rpc:studio_capabilities"]),
          `Studio's capability read made ${k.panggilan.length} call(s): ${JSON.stringify(nama)}; expected one studio_capabilities call`);
        const arg = (k.panggilan[0]?.arg ?? {}) as { p_capabilities?: string[] };
        const harap = ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH", "CAN_ASSIGN_LEARNING",
          "CAN_REVIEW_QUESTION_HEALTH", "CAN_REVIEW_INTEGRITY", "CAN_QUICK_ASSESSMENT"];
        c.expect(JSON.stringify(arg.p_capabilities) === JSON.stringify(harap),
          `studio_capabilities was asked about ${JSON.stringify(arg.p_capabilities)}; expected the eight Studio capabilities`);
        c.expect(JSON.stringify(hasil) === JSON.stringify([
          { id: "a", name: "Alpha", capabilities: ["CAN_REVIEW"] },
          { id: "b", name: "Beta", capabilities: ["CAN_DRAFT", "CAN_PUBLISH"] },
        ]), `the schools offered were ${JSON.stringify(hasil)}; expected Alpha then Beta, and no school without a capability`);
        // a failed call is no capability anywhere: the refusal, as before
        const gagal = await dari(klien({ data: null, error: { message: "canceling statement due to statement timeout" } }));
        c.expect(Array.isArray(gagal) && gagal.length === 0, `a failed capability call offered ${JSON.stringify(gagal)}`);
      }

      // once per request: each read is React's per-render cache
      const src = (f: string) => tanpaKomentar(readFileSync(join(ctx.repoRoot, ...f.split("/")), "utf8"));
      for (const [berkas, nama] of [
        ["src/lib/auth.ts", "currentViewer"], ["src/lib/auth.ts", "isSystemAdmin"],
        ["src/lib/tur-negara.ts", "peranSaya"], ["src/app/studio/_lib.ts", "studioInstitutions"],
      ] as const) {
        c.expect(new RegExp(`export const ${nama} = cache\\(`).test(src(berkas)) && /import \{ cache \} from "react";/.test(src(berkas)),
          `${nama} in ${berkas} is not read once per request (React cache)`);
      }
      // the roles are asked for with the viewer's person, not a second round trip
      c.expect(!/rpc\("current_person_id"\)/.test(/export const peranSaya[\s\S]*?\n\}\);/.exec(src("src/lib/tur-negara.ts"))?.[0] ?? "rpc(\"current_person_id\")"),
        "peranSaya asks current_person_id again instead of using the viewer's person");

      // (d) the viewer: no session cookie, no call; with one, the check and the profile side by side
      const auth = (await import("../src/lib/auth")) as Record<string, unknown>;
      const viewerDari = auth.viewerDari as ((c: unknown) => Promise<{ personId: string | null } | null>) | undefined;
      c.expect(typeof viewerDari === "function", "there is no viewerDari to drive");
      if (viewerDari) {
        const jejak: string[] = [];
        let tertunda = 0, palingBanyak = 0;
        const lambat = <T,>(nama: string, nilai: T) => {
          jejak.push(nama); tertunda++; palingBanyak = Math.max(palingBanyak, tertunda);
          return new Promise<T>((ok) => setTimeout(() => { tertunda--; ok(nilai); }, 20));
        };
        const klienViewer = (sesi: boolean) => ({
          auth: {
            getSession: async () => { jejak.push("getSession"); return { data: { session: sesi ? { access_token: "t" } : null } }; },
            getUser: () => lambat("getUser", { data: { user: { id: "u" } } }),
          },
          from: (t: string) => ({ select: () => ({ maybeSingle: () => lambat(`from:${t}`, { data: { person_id: "p", display_name: "X", display_role: null } }) }) }),
        });
        const anon = await viewerDari(klienViewer(false));
        c.expect(anon === null && JSON.stringify(jejak) === JSON.stringify(["getSession"]),
          `with no session cookie the viewer read made ${JSON.stringify(jejak)} and gave ${JSON.stringify(anon)}; expected only the cookie read, and null`);
        jejak.length = 0; palingBanyak = 0;
        const ada = await viewerDari(klienViewer(true));
        c.expect(ada?.personId === "p" && jejak.includes("getUser") && jejak.includes("from:my_profile") && palingBanyak === 2,
          `with a session the viewer read made ${JSON.stringify(jejak)} with at most ${palingBanyak} in flight; expected the user check and my_profile side by side`);
      }

      // (a) the server beside the database: both Supabase projects are in Singapore
      let wilayah: unknown = null;
      try {
        wilayah = (JSON.parse(readFileSync(join(ctx.repoRoot, "vercel.json"), "utf8")) as { regions?: unknown }).regions ?? null;
      } catch {
        wilayah = "(no vercel.json)";
      }
      c.expect(JSON.stringify(wilayah) === JSON.stringify(["sin1"]),
        `the functions' region in vercel.json is ${JSON.stringify(wilayah)}; expected ["sin1"], beside Supabase in ap-southeast-1`);

      return c.verdict("vercel.json runs the functions in sin1, beside both Supabase projects; studioInstitutionsDari in the source file src/app/studio/_lib.ts, driven with a recording client, asks " +
        "studio_capabilities once with the eight Studio capabilities and nothing else, offers only schools holding a capability, " +
        "sorted by name, and none when the call fails; currentViewer and isSystemAdmin (src/lib/auth.ts), peranSaya " +
        "(src/lib/tur-negara.ts) and studioInstitutions are React per-request caches, and peranSaya takes the person from the viewer; viewerDari (src/lib/auth.ts) asks nothing without a session cookie and, with one, " +
        "asks for the user and the profile side by side");
    },
  },
];
