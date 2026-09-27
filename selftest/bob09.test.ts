/**
 * BOB-09 (D-006; audit M5) — PICKERS SHOW ONLY BAGIAN, TINGKAT AND KELAS,
 * LABELLED BY PATH. Driven through a recording client over one school's tree,
 * the way the intake's "Tempat" and "Program" and the Lingkup list read it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const I = "i";
const P26 = "p26", P27 = "p27";
const THN: Record<string, string> = { [P26]: "2026/2027", [P27]: "2027/2028" };

/** One school: the hidden root, Jenjang and Reguler; two Bagian; two "Kelas 1" in two years, each with a "1A". */
const SIMPUL = [
  { id: I, name: "Sekolah Contoh", kind: "INSTITUTION", jalur: [I] },
  { id: "j", name: "Jenjang", kind: "FACULTY", jalur: [I, "j"] },
  { id: "sd", name: "SD", kind: "DEPARTMENT", jalur: [I, "j", "sd"] },
  { id: "rsd", name: "Reguler", kind: "PROGRAMME", jalur: [I, "j", "sd", "rsd"] },
  { id: "t1a", name: "Kelas 1", kind: "COHORT", jalur: [I, "j", "sd", "rsd", "t1a"], academic_period_id: P26 },
  { id: "k1a", name: "1A", kind: "CLASS", jalur: [I, "j", "sd", "rsd", "t1a", "k1a"], academic_period_id: P26 },
  { id: "k1x", name: "1B", kind: "CLASS", jalur: [I, "j", "sd", "rsd", "t1a", "k1x"], academic_period_id: P26, is_active: false },
  { id: "t1b", name: "Kelas 1", kind: "COHORT", jalur: [I, "j", "sd", "rsd", "t1b"], academic_period_id: P27 },
  { id: "k1b", name: "1A", kind: "CLASS", jalur: [I, "j", "sd", "rsd", "t1b", "k1b"], academic_period_id: P27 },
  { id: "sma", name: "SMA", kind: "DEPARTMENT", jalur: [I, "j", "sma"] },
  { id: "rsma", name: "Reguler", kind: "PROGRAMME", jalur: [I, "j", "sma", "rsma"] },
  { id: "tx", name: "Kelas X", kind: "COHORT", jalur: [I, "j", "sma", "rsma", "tx"], academic_period_id: P26 },
  { id: "kx", name: "X IPS 1", kind: "CLASS", jalur: [I, "j", "sma", "rsma", "tx", "kx"], academic_period_id: P26 },
].map((n) => ({ institution_id: I, is_active: true, academic_period_id: null, parent_id: n.jalur.at(-2) ?? null, ...n }));
const TERSEMBUNYI = ["i", "j", "rsd", "rsma"];

function klien() {
  const from = (tabel: string) => {
    let baris: Array<Record<string, unknown>> =
      tabel === "org_nodes" ? SIMPUL.map((n) => ({ ...n }))
      : tabel === "academic_periods" ? Object.entries(THN).map(([id, name]) => ({ id, name, institution_id: I }))
      : tabel === "classes" ? [{ node_id: "k1a", subject: "Matematika" }] : [];
    const b = {
      select: () => b,
      eq: (k: string, v: unknown) => { baris = baris.filter((r) => r[k] === v); return b; },
      in: (k: string, v: unknown[]) => { baris = baris.filter((r) => v.includes(r[k])); return b; },
      order: () => b,
      limit: () => b,
      then: (ok: (x: { data: unknown; error: null }) => unknown) => Promise.resolve({ data: baris, error: null }).then(ok),
    };
    return b;
  };
  return { from };
}

export const bob09Tests: SelfTest[] = [
  {
    id: "BOB09-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pendataan = await import("../src/lib/pendataan");
      const lingkup = await import("../src/lib/lingkup");

      // 1. the intake's "Tempat": the visible levels only, each labelled by its path and year
      const tempat = (await pendataan.tempatSekolahDari(klien(), I)) as Array<{ id: string; nama: string; program?: string }>;
      const tersembunyi = tempat.filter((t) => TERSEMBUNYI.includes(t.id)).map((t) => t.nama);
      c.expect(tersembunyi.length === 0, `the intake offers a hidden node: ${JSON.stringify(tersembunyi)}`);
      c.expect(!tempat.some((t) => t.id === "k1x"), "the intake offers a deactivated Kelas");
      const label = Object.fromEntries(tempat.map((t) => [t.id, t.nama]));
      for (const [id, harap] of [
        ["sd", "SD"], ["t1a", "SD · Kelas 1 · 2026/2027"], ["k1a", "SD · Kelas 1 · 1A · 2026/2027"],
        ["k1b", "SD · Kelas 1 · 1A · 2027/2028"], ["kx", "SMA · Kelas X · X IPS 1 · 2026/2027"],
      ] as const) {
        c.expect(label[id] === harap, `${id} is labelled ${JSON.stringify(label[id])}, expected "${harap}"`);
      }
      c.expect(new Set(tempat.map((t) => t.nama)).size === tempat.length, `two places share a label: ${JSON.stringify(tempat.map((t) => t.nama))}`);

      // 2. "Program": each Bagian by its label, carrying its hidden Reguler as the value
      const program = tempat.filter((t) => t.program).map((t) => [t.nama, t.program]);
      c.expect(JSON.stringify(program) === JSON.stringify([["SD", "rsd"], ["SMA", "rsma"]]),
        `the programme choices are ${JSON.stringify(program)}; expected each Bagian carrying its Reguler`);
      const peta = readFileSync(join(ctx.repoRoot, "src", "components", "pendataan", "BacaDanPetakan.tsx"), "utf8");
      c.expect(/programme_id: tempat\.filter\(\(x\) => x\.program\)\.map\(\(x\) => \(\{ nilai: x\.program!?, label: x\.nama \}\)\)/.test(peta),
        "the mapping screen's Program choices are not the Bagian with their Reguler");

      // 3. Lingkup: the same levels and the same labels
      const scopes = await lingkup.myScopesDari(klien());
      c.expect(!scopes.some((s) => TERSEMBUNYI.includes(s.id)), `the Lingkup list offers a hidden node: ${JSON.stringify(scopes.filter((s) => TERSEMBUNYI.includes(s.id)).map((s) => s.label))}`);
      const k1a = scopes.find((s) => s.id === "k1a");
      c.expect(k1a?.label === "SD · Kelas 1 · 1A · 2026/2027" && k1a?.subject === "Matematika" && k1a?.kind === "class",
        `the Lingkup list shows 1A as ${JSON.stringify(k1a)}`);
      c.expect(new Set(scopes.map((s) => s.label)).size === scopes.length, "two scopes share a label");

      return c.verdict("tempatSekolahDari in the source file src/lib/pendataan.ts and myScopesDari in src/lib/lingkup.ts, " +
        "driven over one school's tree, offer only Bagian, Tingkat and Kelas -- never the school root, the hidden " +
        "Jenjang or Reguler, nor a deactivated Kelas -- each labelled by its visible path and its year, so two Kelas " +
        "named 1A in two years are told apart; the intake's Program choices are each Bagian carrying its hidden " +
        "Reguler, and the mapping screen offers them for programme_id");
    },
  },
];
