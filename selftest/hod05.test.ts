/**
 * HOD-J05 -- A CLASS'S PARTICIPATION IS READ AGAINST THE CLASS.
 *
 * /pimpinan's class panel said «Peserta 5» and nothing to read it against; the
 * class size was on the teacher's «Lihat bukti» only (journey cross-check
 * HOD-J05: PARTIAL). And the management roster it would come from counted a
 * learner who had left the class: its membership read had no `valid_to is null`,
 * which the teacher's roster and Aktivasi both have. This drives the per-class
 * read and the roster with a client that answers as PostgREST would, and reads
 * the home's source.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const I = "11111111-0000-4000-8000-000000000001";
const TABEL: Record<string, Array<Record<string, unknown>>> = {
  org_nodes: [
    { id: I, name: "Sekolah", kind: "INSTITUTION", institution_id: I, jalur: [I], is_active: true },
    { id: "d", name: "Kelas Rendah", kind: "DEPARTMENT", institution_id: I, jalur: [I, "d"], is_active: true },
    { id: "k1", name: "Kelas 1A", kind: "CLASS", institution_id: I, jalur: [I, "d", "k1"], is_active: true },
    { id: "k2", name: "Kelas 1B", kind: "CLASS", institution_id: I, jalur: [I, "d", "k2"], is_active: true },
  ],
  memberships: [
    { enrollment_id: "en-ani", node_id: "k1", valid_to: null },
    { enrollment_id: "en-budi", node_id: "k1", valid_to: null },
    { enrollment_id: "en-citra", node_id: "k1", valid_to: "2026-09-30T00:00:00Z" }, // left 1A ...
    { enrollment_id: "en-citra", node_id: "k2", valid_to: null },                    // ... for 1B
  ],
  enrollments: [
    { id: "en-ani", person_id: "p-ani", status: "ACTIVE" }, { id: "en-budi", person_id: "p-budi", status: "ACTIVE" },
    { id: "en-citra", person_id: "p-citra", status: "PENDING" },   // recorded, not yet signed in: still in the class
  ],
  persons: [{ id: "p-ani", display_name: "Ani" }, { id: "p-budi", display_name: "Budi" }, { id: "p-citra", display_name: "Citra" }],
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
  const rpc = async (_f: string, a: { p_metric_id: string; p_node: string }) => ({
    data: { status: "ok", metric_id: a.p_metric_id, value: a.p_metric_id === "class.participants" ? 2 : 0.5 }, error: null,
  });
  return { from, rpc };
}

export const hod05Tests: SelfTest[] = [
  {
    id: "HOD05-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pim = (await import("../src/lib/pimpinan")) as Record<string, unknown> as {
        buktiPerKelasDari: (c: unknown, node: string) => Promise<Array<{ kelas: { id: string }; bukti: unknown[]; murid?: number | null }>>;
        daftarMuridDari: (c: unknown, node: string) => Promise<Array<{ nama: string }>>;
      };
      const per = await pim.buktiPerKelasDari(klien(), "d");
      const murid = Object.fromEntries(per.map((k) => [k.kelas.id, k.murid]));
      c.expect(murid.k1 === 2 && murid.k2 === 1,
        `the classes' sizes read ${JSON.stringify(murid)}; expected Kelas 1A 2 (Ani, Budi; Citra left) and Kelas 1B 1 (Citra)`);
      c.expect(per.every((k) => k.bukti.length === 4), "a class's figures are no longer asked beside its size");
      const d = (await pim.daftarMuridDari(klien(), "d")).map((m) => m.nama);
      const k1 = (await pim.daftarMuridDari(klien(), "k1")).map((m) => m.nama);
      c.expect(JSON.stringify(k1) === JSON.stringify(["Ani", "Budi"]), `Kelas 1A's roster reads ${JSON.stringify(k1)}; a learner who left the class is listed`);
      c.expect(JSON.stringify(d) === JSON.stringify(["Ani", "Budi", "Citra"]), `the department's roster reads ${JSON.stringify(d)}`);
      const rusak = { ...klien(), from: (x: string) => (x === "memberships" ? (() => { throw new Error("roster unreadable"); })() : klien().from(x)) };
      const tanpa = await pim.buktiPerKelasDari(rusak, "d").catch(() => null);
      c.expect(tanpa !== null && tanpa.every((k) => k.murid === null && k.bukti.length === 4),
        "an unreadable roster costs the class its figures, or reads as a size");

      for (const locale of ["id", "en"] as const) {
        const k = t("pimpinan.kelas.murid", "staff", { locale });
        c.expect(k.length > 5 && k !== t("metrik.peserta.label", "staff", { locale }), `(${locale}) the class size is labelled «${k}»`);
      }
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const rumah = buang(readFileSync(join(ctx.repoRoot, "src", "app", "pimpinan", "page.tsx"), "utf8"));
      c.expect(/perKelas\.map\(\(\{ kelas, bukti: bk, murid \}\)/.test(rumah)
        && /murid !== null \? \(\s*<p className="pin-mm">\{s\("pimpinan\.kelas\.murid"\)\} · <span className="pin-num">\{format\.number\(murid, locale\)\}<\/span><\/p>/.test(rumah),
        "the class panel on /pimpinan does not show the class's size beside its figures");

      return c.verdict(
        "executed with a client that filters as PostgREST would: buktiPerKelasDari gives each class of a department its " +
          "size now beside its four figures (Kelas 1A 2, Kelas 1B 1, after a learner moved from 1A to 1B), and an " +
          "unreadable roster leaves the figures and no size; daftarMuridDari reads open memberships only, so a learner " +
          "who left a class is not on its roster and is on the department's once. The copy table labels the size in id " +
          "and en apart from «Peserta»; the source of /pimpinan draws it in each class panel",
      );
    },
  },
];
