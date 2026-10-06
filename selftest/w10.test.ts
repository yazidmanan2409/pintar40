/**
 * W10 -- A HEAD OF DEPARTMENT OVER A DEPARTMENT SEES THEIR CLASSES.
 *
 * Learners are members of classes, never of a department, so the department's
 * roster (/pimpinan/<department>/murid) matched the node exactly and read
 * «Belum ada murid…». And a head of department reads no school-wide figure, so
 * /pimpinan said «Belum ada angka…» above the classes that had theirs (journey
 * cross-check W10; HOD-J01, HOD-J06). This drives the roster read over a
 * school's tree with a client that answers as PostgREST would, and checks the
 * home's wiring.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const I = "11111111-0000-4000-8000-000000000001";
/** I › D › K1, K2 (and an inactive K9); I › E › K3. */
const SIMPUL = [
  { id: I, name: "Sekolah", kind: "INSTITUTION", institution_id: I, jalur: [I], is_active: true },
  { id: "d", name: "Departemen D", kind: "DEPARTMENT", institution_id: I, jalur: [I, "d"], is_active: true },
  { id: "k1", name: "Kelas 1", kind: "CLASS", institution_id: I, jalur: [I, "d", "k1"], is_active: true },
  { id: "k2", name: "Kelas 2", kind: "CLASS", institution_id: I, jalur: [I, "d", "k2"], is_active: true },
  { id: "k9", name: "Kelas lama", kind: "CLASS", institution_id: I, jalur: [I, "d", "k9"], is_active: false },
  { id: "e", name: "Departemen E", kind: "DEPARTMENT", institution_id: I, jalur: [I, "e"], is_active: true },
  { id: "k3", name: "Kelas 3", kind: "CLASS", institution_id: I, jalur: [I, "e", "k3"], is_active: true },
];
const TABEL: Record<string, Array<Record<string, unknown>>> = {
  org_nodes: SIMPUL,
  memberships: [
    { enrollment_id: "en-ani", node_id: "k1" }, { enrollment_id: "en-budi", node_id: "k2" },
    { enrollment_id: "en-budi", node_id: "k1" },            // Budi in two classes of D: listed once
    { enrollment_id: "en-lama", node_id: "k9" },            // a class no longer active
    { enrollment_id: "en-eka", node_id: "k3" },             // department E
    { enrollment_id: "en-keluar", node_id: "k2" },          // left the school
  ],
  enrollments: [
    { id: "en-ani", person_id: "p-ani", status: "ACTIVE" }, { id: "en-budi", person_id: "p-budi", status: "ACTIVE" },
    { id: "en-lama", person_id: "p-lama", status: "ACTIVE" }, { id: "en-eka", person_id: "p-eka", status: "ACTIVE" },
    { id: "en-keluar", person_id: "p-keluar", status: "WITHDRAWN" },
  ],
  persons: [
    { id: "p-ani", display_name: "Ani" }, { id: "p-budi", display_name: "Budi" }, { id: "p-lama", display_name: "Lama" },
    { id: "p-eka", display_name: "Eka" }, { id: "p-keluar", display_name: "Keluar" },
  ],
};

function klien() {
  const from = (tabel: string) => {
    let baris = [...(TABEL[tabel] ?? [])];
    const b = {
      select: () => b,
      eq: (k: string, v: unknown) => { baris = baris.filter((r) => r[k] === v); return b; },
      in: (k: string, v: unknown[]) => { baris = baris.filter((r) => v.includes(r[k])); return b; },
      is: (k: string, v: unknown) => { baris = baris.filter((r) => (r[k] ?? null) === v); return b; },
      overlaps: (k: string, v: string[]) => { baris = baris.filter((r) => (r[k] as string[]).some((x) => v.includes(x))); return b; },
      order: () => b,
      limit: (n: number) => { baris = baris.slice(0, n); return b; },
      maybeSingle: async () => ({ data: baris[0] ?? null, error: null }),
      then: (ok: (x: { data: unknown; error: null }) => unknown) => Promise.resolve({ data: baris, error: null }).then(ok),
    };
    return b;
  };
  return { from };
}

export const w10Tests: SelfTest[] = [
  {
    id: "W10-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pim = (await import("../src/lib/pimpinan")) as Record<string, unknown> as {
        daftarMuridDari?: (c: unknown, node: string) => Promise<Array<{ id: string; nama: string }>>;
      };
      if (!c.expect(typeof pim.daftarMuridDari === "function", "the roster cannot be driven: src/lib/pimpinan.ts has no daftarMuridDari")) {
        return c.verdict("");
      }
      const baca = async (node: string) => (await pim.daftarMuridDari!(klien(), node)).map((m) => m.nama);
      const d = await baca("d");
      c.expect(JSON.stringify(d) === JSON.stringify(["Ani", "Budi"]),
        `department D's roster reads ${JSON.stringify(d)}; expected its active classes' learners, each once, in alphabetical order: ["Ani","Budi"]`);
      const k2 = await baca("k2");
      c.expect(JSON.stringify(k2) === JSON.stringify(["Budi"]), `a class's roster reads ${JSON.stringify(k2)}; expected ["Budi"] (one who left is not listed)`);
      const e = await baca("e");
      c.expect(JSON.stringify(e) === JSON.stringify(["Eka"]), `department E's roster reads ${JSON.stringify(e)}; another department's learner is listed or its own is missing`);
      const sekolah = await baca(I);
      c.expect(JSON.stringify(sekolah) === JSON.stringify(["Ani", "Budi", "Eka"]), `the school's roster reads ${JSON.stringify(sekolah)}`);

      // the home: no school-wide figure for this reader, but classes below with theirs, is not "no figures"
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const rumah = buang(readFileSync(join(ctx.repoRoot, "src", "app", "pimpinan", "page.tsx"), "utf8"));
      c.expect(/bukti\.length === 0 \?[\s\S]{0,200}perKelas\.some\(\(\{ bukti: bk \}\) => bk\.some\(\(e\) => e\.status === "ok"\)\) \? "pimpinan\.bukti\.di_kelas" : "pimpinan\.bukti\.kosong"/.test(rumah),
        "/pimpinan still says «Belum ada angka…» when the classes below have figures");
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const di = t("pimpinan.bukti.di_kelas" as Parameters<typeof t>[0], "staff", { locale });
        c.expect(di !== t("pimpinan.bukti.kosong", "staff", { locale }) && di.length > 10 && !/belum ada angka|no figures/i.test(di),
          `(${locale}) the sentence for figures counted per class reads «${di}»`);
      }

      return c.verdict(
        "daftarMuridDari, driven over a school's tree with a client that filters as PostgREST would: a department's " +
          "roster lists the learners of its active classes, each once and alphabetically, with nobody from another " +
          "department, an inactive class or a withdrawn enrolment; a class and the school read the same way; the source " +
          "of /pimpinan says the figures are counted per class (in both languages) instead of «Belum ada angka…» when a " +
          "class below has figures",
      );
    },
  },
];
