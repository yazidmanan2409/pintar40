/**
 * BOB-06 (D-010; audit B6b, B6c) — REPORTS A SCHOOL CAN OPEN, AND MANAGEMENT'S
 * CLASS FIGURES ASKED OF CLASSES.
 *
 * The database half (every school carries its standard reports) is F14 in
 * selftest/db/fable14.sql; the landing half is BOB06-A01/R01 in
 * selftest/app.test.ts. This file drives the two TypeScript decisions with
 * recorded inputs: which template a summary reads, and at which node each
 * Management figure is asked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { pilihTemplat, type BarisTemplat } from "../src/lib/laporan-kontrak";

const I = "10000000-0000-4000-8000-000000000001";
const J = "10000000-0000-4000-8000-000000000002";

/** One school's tree: I › D › K1, K2 and I › E › K3; D and E are departments. */
const SIMPUL = [
  { id: I, name: "Sekolah", kind: "INSTITUTION", institution_id: I, jalur: [I], is_active: true },
  { id: "d", name: "Departemen D", kind: "DEPARTMENT", institution_id: I, jalur: [I, "d"], is_active: true },
  { id: "k1", name: "Kelas 1", kind: "CLASS", institution_id: I, jalur: [I, "d", "k1"], is_active: true },
  { id: "k2", name: "Kelas 2", kind: "CLASS", institution_id: I, jalur: [I, "d", "k2"], is_active: true },
  { id: "k9", name: "Kelas lama", kind: "CLASS", institution_id: I, jalur: [I, "d", "k9"], is_active: false },
  { id: "e", name: "Departemen E", kind: "DEPARTMENT", institution_id: I, jalur: [I, "e"], is_active: true },
  { id: "k3", name: "Kelas 3", kind: "CLASS", institution_id: I, jalur: [I, "e", "k3"], is_active: true },
];

/**
 * A client that answers org_nodes reads from SIMPUL (filters applied as
 * PostgREST would) and records every metric_evaluate it is asked, answering
 * each with a figure.
 */
function klien() {
  const diminta: Array<{ metric: string; node: string }> = [];
  const from = (tabel: string) => {
    let baris = tabel === "org_nodes" ? [...SIMPUL] : [];
    const b = {
      select: () => b,
      eq: (k: string, v: unknown) => { baris = baris.filter((r) => (r as Record<string, unknown>)[k] === v); return b; },
      in: (k: string, v: unknown[]) => { baris = baris.filter((r) => v.includes((r as Record<string, unknown>)[k])); return b; },
      overlaps: (k: string, v: string[]) => { baris = baris.filter((r) => ((r as Record<string, unknown>)[k] as string[]).some((x) => v.includes(x))); return b; },
      order: () => b,
      limit: (n: number) => { baris = baris.slice(0, n); return b; },
      maybeSingle: async () => ({ data: baris[0] ?? null, error: null }),
      then: (ok: (x: { data: unknown; error: null }) => unknown) => Promise.resolve({ data: baris, error: null }).then(ok),
    };
    return b;
  };
  const rpc = async (fn: string, a: { p_metric_id: string; p_node: string }) => {
    if (fn !== "metric_evaluate") return { data: null, error: { message: `unexpected ${fn}` } };
    diminta.push({ metric: a.p_metric_id, node: a.p_node });
    return { data: { status: "ok", metric_id: a.p_metric_id, value: 1 }, error: null };
  };
  return { client: { from, rpc }, diminta };
}

const baris = (o: Partial<BarisTemplat>): BarisTemplat => ({
  id: "t", institution_id: I, standard_report: "class_learning_intelligence", template_version: 1,
  is_standard: false, title_key: "laporan.kelas.judul", ...o,
});

export const bob06Tests: SelfTest[] = [
  {
    // =======================================================================
    // BOB06-K01 — A SUMMARY READS ITS OWN SCHOOL'S TEMPLATE: THE SCHOOL'S OWN
    // LATEST ASSEMBLY, ELSE PINTAR'S STANDARD ONE (B6b).
    // =======================================================================
    id: "BOB06-K01",
    run: async (ctx) => {
      const c = new Checks();
      const standar = baris({ id: "std", is_standard: true });
      const lain = baris({ id: "lain", institution_id: J, template_version: 9 });
      const sekolah = baris({ id: "std-s", is_standard: true, standard_report: "institution_learning_intelligence" });
      c.expect(pilihTemplat([lain, standar, sekolah], I, "class_learning_intelligence")?.id === "std",
        "with no assembly of its own, the school does not read PINTAR's standard class report");
      const v1 = baris({ id: "v1" }), v3 = baris({ id: "v3", template_version: 3 });
      c.expect(pilihTemplat([standar, v1, v3, lain], I, "class_learning_intelligence")?.id === "v3",
        "the school's own latest assembly does not win over the standard one");
      c.expect(pilihTemplat([lain], I, "class_learning_intelligence") === null,
        "another school's template was read");
      c.expect(pilihTemplat([standar], I, "institution_learning_intelligence") === null,
        "a class template was read for the school summary");

      // both summaries read through the one helper, and no bare "first template" read is left
      for (const [f, std, param] of [
        ["src/app/dekan/ringkasan/page.tsx", "institution_learning_intelligence", "simpul"],
        ["src/app/edukator/ringkasan/page.tsx", "class_learning_intelligence", "kelas"],
      ] as const) {
        const src = readFileSync(join(ctx.repoRoot, f), "utf8");
        c.expect(src.includes(`templatUntuk("${std}", ${param})`), `${f} does not read its school's template through templatUntuk`);
        c.expect(!/from\("report_templates"\)/.test(src), `${f} still reads report_templates directly`);
      }
      const helper = readFileSync(join(ctx.repoRoot, "src", "lib", "laporan.ts"), "utf8");
      c.expect(/\.eq\("institution_id", institusi\)/.test(helper) && /pilihTemplat\(/.test(helper),
        "src/lib/laporan.ts does not narrow to the node's school and choose with pilihTemplat");
      return c.verdict("pilihTemplat, driven with rows of two schools, gives the school's own latest assembly, else " +
        "PINTAR's standard one, never another school's and never the other standard report; the source files of " +
        "both summary pages read their template through templatUntuk in src/lib/laporan.ts, which narrows to the " +
        "scope node's school, and neither reads report_templates directly");
    },
  },
  {
    // =======================================================================
    // BOB06-K02 — MANAGEMENT'S CLASS FIGURES ARE ASKED OF CLASSES (B6c).
    // The class calculators count sessions whose class is exactly the node
    // asked, so a class figure asked at a department is structurally empty.
    // =======================================================================
    id: "BOB06-K02",
    run: async () => {
      const c = new Checks();
      // loaded here, not at the top: the module is server-only, and the runner
      // sets the react-server condition only after the static imports ran
      const pim = await import("../src/lib/pimpinan");
      const kelasAt = (d: Array<{ metric: string; node: string }>) =>
        [...new Set(d.filter((x) => x.metric.startsWith("class.")).map((x) => x.node))].sort();

      // at a department: no class figure asked of it; the school's figures of the school
      const a = klien();
      await pim.buktiPimpinanDari(a.client, "d", I);
      c.expect(kelasAt(a.diminta).length === 0,
        `a class figure was asked at the department itself: ${JSON.stringify(kelasAt(a.diminta))}`);
      c.expect(a.diminta.filter((x) => x.metric.startsWith("institution.")).every((x) => x.node === I)
        && a.diminta.some((x) => x.metric.startsWith("institution.")), "the school's figures were not asked of the school");

      // at a class: the class figures of that class
      const b = klien();
      await pim.buktiPimpinanDari(b.client, "k1", I);
      c.expect(JSON.stringify(kelasAt(b.diminta)) === JSON.stringify(["k1"]),
        `at a class, class figures were asked at ${JSON.stringify(kelasAt(b.diminta))}`);

      // below a department: each active class of the branch, and no class outside it
      const perKelas = (pim as Record<string, unknown>).buktiPerKelasDari as
        | ((c: unknown, node: string) => Promise<Array<{ kelas: { id: string; nama: string }; bukti: Array<{ metric_id?: string }> }>>)
        | undefined;
      c.expect(typeof perKelas === "function", "there is no per-class evidence read (buktiPerKelasDari)");
      if (perKelas) {
        const k = klien();
        const hasil = await perKelas(k.client, "d");
        c.expect(JSON.stringify(kelasAt(k.diminta)) === JSON.stringify(["k1", "k2"]),
          `below the department, class figures were asked at ${JSON.stringify(kelasAt(k.diminta))}, expected k1 and k2`);
        c.expect(k.diminta.every((x) => x.metric.startsWith("class.")), "the per-class read asked a figure that is not a class figure");
        c.expect(JSON.stringify(hasil.map((h) => h.kelas.nama)) === JSON.stringify(["Kelas 1", "Kelas 2"])
          && hasil.every((h) => h.bukti.length === 4),
          `the per-class read returned ${JSON.stringify(hasil.map((h) => [h.kelas.nama, h.bukti.length]))}`);
        // at a class, the class is its own branch
        const s = klien();
        const satu = await perKelas(s.client, "k3");
        c.expect(JSON.stringify(kelasAt(s.diminta)) === JSON.stringify(["k3"]) && satu.length === 1,
          `at a class, the per-class read asked ${JSON.stringify(kelasAt(s.diminta))}`);
      }
      return c.verdict("driven with a recording client over one school's tree: at a department no class figure is " +
        "asked of the department and the school's figures are asked of the school; at a class its class figures are " +
        "asked of it; buktiPerKelasDari asks the four class figures of each active class in the branch (k1, k2) and " +
        "of no class outside it or inactive, returning them per class by name; at a class it asks that class alone");
    },
  },
];
