/**
 * BOB-08 — the two TypeScript halves of the structure follow-ups. The
 * database halves are F10-S07..S10 (selftest/db/fable10.sql) and the races
 * F10-C01..C03 (selftest/run.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const I = "10000000-0000-4000-8000-000000000001";
const HARI = 24 * 60 * 60 * 1000;

/** Grants of one reader, and the nodes they name. */
function klien(kini: Date) {
  const iso = (d: number) => new Date(kini.getTime() + d).toISOString();
  const hibah = [
    { scope_node_id: "aktif", revoked_at: null, valid_from: iso(-30 * HARI), valid_until: iso(300 * HARI) },
    { scope_node_id: "dicabut", revoked_at: iso(-HARI), valid_from: iso(-30 * HARI), valid_until: iso(300 * HARI) },
    { scope_node_id: "berakhir", revoked_at: null, valid_from: iso(-400 * HARI), valid_until: iso(-HARI) },
    { scope_node_id: "belum", revoked_at: null, valid_from: iso(HARI), valid_until: iso(300 * HARI) },
  ];
  const simpul = ["aktif", "dicabut", "berakhir", "belum"].map((id) => ({
    id, name: `Simpul ${id}`, kind: "DEPARTMENT", institution_id: I, jalur: [I, id],
  }));
  const from = (tabel: string) => {
    let baris: Array<Record<string, unknown>> = tabel === "role_assignments" ? [...hibah] : tabel === "org_nodes" ? [...simpul] : [];
    const b = {
      select: () => b,
      is: (k: string, v: unknown) => { baris = baris.filter((r) => r[k] === v); return b; },
      lte: (k: string, v: string) => { baris = baris.filter((r) => String(r[k]) <= v); return b; },
      gt: (k: string, v: string) => { baris = baris.filter((r) => String(r[k]) > v); return b; },
      in: (k: string, v: unknown[]) => { baris = baris.filter((r) => v.includes(r[k])); return b; },
      then: (ok: (x: { data: unknown; error: null }) => unknown) => Promise.resolve({ data: baris, error: null }).then(ok),
    };
    return b;
  };
  // the database would refuse the three that are not in force; the picker must
  // not offer them in the first place, so this answers yes to every node
  const rpc = async () => ({ data: true, error: null });
  return { from, rpc };
}

export const bob08Tests: SelfTest[] = [
  {
    // =======================================================================
    // BOB08-K01 — (d) THE STRUCTURE LIST IS RE-READ AFTER EVERY RESULT, and
    // (g) THE PIMPINAN PICKER OFFERS ONLY GRANTS IN FORCE.
    // =======================================================================
    id: "BOB08-K01",
    run: async (ctx) => {
      const c = new Checks();

      // (d) revalidation comes before any return in the structure helper
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8")
        .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
      const tubuh = /async function struktur\([\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(tubuh.length > 0, "the structure helper struktur() was not found");
      // the refusal path: the block after the error test re-reads before its first return
      const gagal = /if \(error \|\| typeof data !== "string"\) \{([\s\S]*?)\n  \}/.exec(tubuh)?.[1] ?? "";
      const ulang = gagal.indexOf('revalidatePath("/konfigurasi", "layout")');
      const kembali = gagal.search(/\breturn\b/);
      c.expect(gagal.length > 0 && ulang >= 0 && kembali > ulang,
        "the structure list is not re-read before the helper returns a refusal");
      // the success path: re-read, then the id (DAISY-05-STRUKTUR-01 holds the same line)
      c.expect(/revalidatePath\("\/konfigurasi", "layout"\);\s*return \{ ok: true, id: data \};/.test(tubuh),
        "the structure list is not re-read after a success");
      c.expect((tubuh.match(/revalidatePath\(/g) ?? []).length === 2, "the structure helper re-reads the list other than once per path");

      // (g) driven: of four grants, only the one in force is offered
      const pim = await import("../src/lib/pimpinan");
      const f = (pim as Record<string, unknown>).lingkupPimpinanDari as
        | ((c: unknown, kini?: Date) => Promise<Array<{ id: string }>>) | undefined;
      c.expect(typeof f === "function", "there is no lingkupPimpinanDari to drive");
      if (f) {
        const kini = new Date("2026-09-27T03:00:00Z");
        const ada = (await f(klien(kini), kini)).map((n) => n.id).sort();
        c.expect(JSON.stringify(ada) === JSON.stringify(["aktif"]),
          `the Pimpinan picker offers ${JSON.stringify(ada)}; only the grant in force should be offered`);
      }
      return c.verdict("the structure helper struktur() in the source file src/app/konfigurasi/actions.ts re-reads the " +
        "list once on each path, before a refusal returns as well as after a success; lingkupPimpinanDari in src/lib/pimpinan.ts, driven " +
        "with a revoked, an expired, a not-yet-begun and an active grant, offers only the active one's node");
    },
  },
];
