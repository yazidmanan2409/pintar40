/**
 * Z · N-15 (Sharon, Z0 inventory; Bob: stream A, pengajar.ts): «MURID YANG PERLU PENGUATAN» FAILS CLOSED.
 *
 *   Z-N15-01  The class report's learners in the lowest band (KomposisiKelas, section E; pengajar.perluPenguatan).
 *             Each learner's objectives come from tujuan_belum_tercapai, read once per learner (pengajar.tujuanBelum,
 *             null when the read fails, K-03). A learner whose read failed is never shown as having nothing to study
 *             again: perluPenguatan keeps the null (ulang: null), and the rendered section says
 *             mengajar.murid1.tujuan_gagal for that learner, in ID and EN, beside the learners whose objectives were
 *             read. A learner read with none listed shows neither. Red on 18da65de: the null became [] and the line
 *             was silent.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

function render(root: string, skrip: string, env: Record<string, string> = {}) {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    `(async () => {${skrip}})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
  { cwd: root, encoding: "utf8", env: { ...process.env, ...env } });
  return { ok: anak.status === 0, out: anak.stdout, err: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}

export const zN15Tests: SelfTest[] = [
  {
    id: "Z-N15-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // the library: a failed per-learner read stays null, never []
      const ajar = readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8");
      const fn = /export async function perluPenguatan\([\s\S]*?\n\}/.exec(ajar)?.[0] ?? "";
      c.expect(fn !== "", "perluPenguatan was not found");
      c.expect(!/ulang\[i\] \?\? \[\]/.test(fn), "perluPenguatan turns a failed objectives read into [] («nothing to study again»)");
      c.expect(/ulang: ulang\[i\] === null \? null :/.test(fn), "perluPenguatan does not keep a failed objectives read as null");
      // the screen: rendered, with one learner unread, one read with objectives, one read with none
      const pita = { status: "ok", readiness: "SUFFICIENT_EVIDENCE", metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label",
        meaning_key: "metrik.kesiapan.arti", value: { "kesiapan.butuh_pendampingan": 3, "kesiapan.siap_sertifikasi": 4 }, population: { placed: 7, assessed: 7, not_yet: 0 } };
      const orang = [
        { id: "o1", nama: "Ayu Tanjung", ulang: null, benar: 9, total: 20, soalWajibTepat: true },
        { id: "o2", nama: "Budi Santoso", ulang: ["Pecahan campuran"], benar: 10, total: 20, soalWajibTepat: true },
        { id: "o3", nama: "Hana Siregar", ulang: [], benar: 11, total: 20, soalWajibTepat: true },
      ];
      const r = render(repoRoot,
        'const { createElement: h } = await import("react");' +
        'const { renderToStaticMarkup } = await import("react-dom/server");' +
        'const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx");' +
        "const K = m.default?.default ?? m.default; const [a, o] = JSON.parse(process.env.ENTRI);" +
        "const p = { persona: 'educator', jenis: 'LEARNER', namaKelas: 'Kelas 7A', buktiHref: '/mengajar/k/bukti', target: 0.75, entries: [a], penguatan: o, muridHref: '/mengajar/k/murid' };" +
        "process.stdout.write(JSON.stringify([renderToStaticMarkup(h(K, { ...p, locale: 'id' })), renderToStaticMarkup(h(K, { ...p, locale: 'en' }))]));",
        { ENTRI: JSON.stringify([pita, orang]) });
      if (!c.expect(r.ok, `the class composition could not be rendered: ${r.err}`)) return c.verdict("");
      let x: string[] = [];
      try { x = JSON.parse(r.out); } catch { /* reported below */ }
      const { t } = await import("../src/lib/hle");
      const teks = (h: string) => (h ?? "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
      const baris = (h: string) => [...(h ?? "").matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => teks(m[1]));
      const lihat: string[] = [];
      for (const [i, locale] of (["id", "en"] as const).entries()) {
        const gagal = t("mengajar.murid1.tujuan_gagal" as never, "educator", { locale });
        const li = baris(x[i]);
        const ayu = li.find((b) => b.includes("Ayu Tanjung")) ?? "", budi = li.find((b) => b.includes("Budi Santoso")) ?? "", hana = li.find((b) => b.includes("Hana Siregar")) ?? "";
        c.expect(ayu.includes(gagal), `(${locale}) the learner whose objectives could not be read: «${ayu}» (expected «${gagal}»)`);
        c.expect(!budi.includes(gagal) && budi.includes("Pecahan campuran"), `(${locale}) the learner read with an objective: «${budi}»`);
        c.expect(!hana.includes(gagal), `(${locale}) the learner read with none listed says the failure: «${hana}»`);
        lihat.push(`${locale}: «${ayu}»`);
      }
      return c.verdict(`perluPenguatan keeps a failed objectives read as null, and the rendered «Murid yang perlu penguatan» says mengajar.murid1.tujuan_gagal for that learner only (${lihat.join("; ")}), beside a learner read with an objective and one read with none`);
    },
  },
];
