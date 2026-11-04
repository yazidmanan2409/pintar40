/**
 * M4 (D-085) -- A TEACHER'S VIEW OF ONE LEARNER IN THEIR CLASS.
 *
 * "A teacher may open an individual learning view for a student within that
 * teacher's authorised teaching scope ... an educational view, NOT a general
 * personal-information dossier ... Question-level answer visibility is governed
 * separately by M5." The teacher's roster was names only (journey cross-check
 * EDU-J04: MISSING). This executes how the record is put together, renders the
 * roster's names as the way in, and reads the page's and the catalogue's source
 * for the bounds.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const m4Tests: SelfTest[] = [
  {
    id: "M4-K01",
    run: async (ctx) => {
      const c = new Checks();
      const ajar = (await import("../src/lib/pengajar")) as Record<string, unknown> as {
        susunCatatan?: (orang: string, tugas: unknown[], sesi: unknown[], hasil: unknown) => {
          tugas: Array<{ id: string; keadaan: string }>; daftarHasil: Array<{ sesi: string; judul: string | null; penguasaan: number | null; mode: string; batas?: number | null }>;
        };
      };
      const susun = ajar.susunCatatan;
      if (!c.expect(typeof susun === "function", "there is no record of one learner for the teacher (susunCatatan)") || !susun) return c.verdict("");
      const tugas = [
        { id: "pre", judul: "Pemetaan Awal · Bab 1", mode: "PRE_TEST" },
        { id: "post", judul: "Uji Penguasaan · Bab 1", mode: "POST_TEST" },
        { id: "cepat", judul: "Uji Cepat · 1 Okt", mode: "QUICK" },
      ];
      const sesi = [
        { id: "s1", assessment_assignment_id: "pre", person_id: "ani", status: "FINALIZED" },
        { id: "s2", assessment_assignment_id: "post", person_id: "ani", status: "IN_PROGRESS" },
        { id: "s9", assessment_assignment_id: "cepat", person_id: "budi", status: "SUBMITTED" }, // another learner's: never Ani's
      ];
      const hasil = { status: "ok", value: [
        { session_id: "s1", mode: "PRE_TEST", mastery: 0.5, safety_gate_passed: true },
        { session_id: "lain", mode: "POST_TEST", mastery: "0.875" },       // a result from another class of the school
      ] };
      const r = susun("ani", tugas, sesi, hasil);
      c.expect(JSON.stringify(r.tugas.map((x) => [x.id, x.keadaan])) === JSON.stringify([["pre", "sudah"], ["post", "sedang"], ["cepat", "belum"]]),
        `Ani's place on the class's assessments reads ${JSON.stringify(r.tugas.map((x) => [x.id, x.keadaan]))}; expected handed in, started, not attempted (Budi's session is not hers)`);
      c.expect(JSON.stringify(r.daftarHasil) === JSON.stringify([
        { sesi: "s1", mode: "PRE_TEST", penguasaan: 0.5, judul: "Pemetaan Awal · Bab 1", batas: null },
        { sesi: "lain", mode: "POST_TEST", penguasaan: 0.875, judul: null, batas: null },
      ]), `Ani's results read ${JSON.stringify(r.daftarHasil)}; expected each official result with its recorded mastery, named by this class's assessment where it is one`);
      // D-085 M3, D-088(b): a sitting of this class carries the mark sealed on its assignment, so the teacher sees the
      // target beside the mastery and a result below it as below it
      const r2 = susun("ani", tugas.map((x) => (x.id === "post" ? { ...x, batas: 0.6 } : x)),
        [{ id: "s5", assessment_assignment_id: "post", person_id: "ani", status: "FINALIZED" }],
        { status: "ok", value: [{ session_id: "s5", mode: "POST_TEST", mastery: 0.5 }] });
      c.expect(r2.daftarHasil.length === 1 && r2.daftarHasil[0].batas === 0.6,
        `a sitting sealed at 60% reads ${JSON.stringify(r2.daftarHasil)}; expected its target 0.6 beside the mastery`);
      c.expect(!JSON.stringify(r.daftarHasil).includes("safety"), "the record carries more than the recorded mastery (a safety-gate or integrity field)");
      const tanpa = susun("ani", tugas, sesi, { status: "below_minimum", needed: 1, have: 0 });
      c.expect(tanpa.daftarHasil.length === 0 && tanpa.tugas.length === 3, "an absent result costs the record its assessments, or invents results");

      // the roster's names are the way in, and only the name
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/mengajar/DaftarMurid.tsx");' +
        "  const D = m.default?.default ?? m.default;" +
        "  const murid = [{ id: 'ani', nama: 'Ani Murid' }, { id: 'budi', nama: 'Budi Murid' }];" +
        "  process.stdout.write(JSON.stringify([renderToStaticMarkup(h(D, { murid, kelas: 'k1a' })), renderToStaticMarkup(h(D, { murid }))]));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], { cwd: ctx.repoRoot, encoding: "utf8" });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 2, `the roster could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const li = (x: string) => [...x.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
        c.expect(JSON.stringify(li(html[0])) === JSON.stringify(['<a href="/mengajar/k1a/murid/ani">Ani Murid</a>', '<a href="/mengajar/k1a/murid/budi">Budi Murid</a>']),
          `with the class, the roster reads ${JSON.stringify(li(html[0]))}; expected each name, and only the name, opening that learner's record`);
        c.expect(JSON.stringify(li(html[1])) === JSON.stringify(["Ani Murid", "Budi Murid"]), "without the class, the roster is no longer names only");
      }

      // the bounds: a learner of this class only; the catalogue's educator read; no integrity, no answers
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const page = buang(readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx"), "utf8"));
      c.expect(/const murid = fakta\?\.murid\.find\(\(m\) => m\.id === orang\) \?\? null;\s*if \(!ctx \|\| !murid\) \{\s*return <HalamanPenolakan/.test(page),
        "the record opens for someone who is not a learner of this teacher's class");
      const lib = buang(readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const fungsi = lib.slice(lib.indexOf("export async function catatanMurid("), lib.indexOf("export function susunCatatan("));
      c.expect(/p_metric_id: "learner\.result"/.test(fungsi) && !/from\("(assessment_results|responses|integrity_signals|session_events)"\)/.test(fungsi + page),
        "the record reads results other than through the catalogue's learner.result, or reads answers or integrity");
      const katalog = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20260918100000_metric_catalogue.sql"), "utf8");
      c.expect(/'learner\.result'[\s\S]{0,200}'LEARNER_IN_INSTITUTION'[\s\S]{0,80}'EDUCATOR'/.test(katalog), "the catalogue does not give an EDUCATOR a learner's result");
      for (const [nama, f] of [["the class page", ["[kelas]", "page.tsx"]], ["/siapa", ["[kelas]", "siapa", "page.tsx"]]] as const) {
        // RESTATED FOR DAISY-33 (a changed requirement, D-069(k)): the empty line is «murid» or «peserta» by the class's kind
        // RESTATED FOR W3.5 (Batch 4, D-152; Daisy, J2Kelas): the roster is a Table whose row is named by the learner's name,
        // and that name is the link to their record, nothing added to it
        // RESTATED FOR E-C2-1 (D-069(b)): a learner's name opens their record; a PD participant has none (the same rule
        // as the per-question evidence, adaBuktiSoal), so only a learner's name is a link
        c.expect(/nama: adaBuktiSoal\(ctx\.ini\.jenis\) \? <Link href=\{`\/mengajar\/\$\{id\}\/murid\/\$\{m\.id\}`\}>\{m\.nama\}<\/Link> : m\.nama/.test(readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", ...f), "utf8")),
          `${nama} does not open a learner's record from the names`);
      }

      return c.verdict(
        "executed: susunCatatan (src/lib/pengajar.ts) gives one learner's place on each of the class's assessments (handed " +
          "in, started, not attempted; another learner's session never counted) and each official result with its recorded " +
          "mastery, named by the class's assessment where it is one, and nothing else (no safety-gate or integrity field); " +
          "an absent result leaves the assessments. Rendered: with the class, each roster name opens that learner's record, " +
          "the name alone. Source: the page refuses anyone not on this teacher's class roster, the record reads results only " +
          "through the catalogue's learner.result (EDUCATOR, LEARNER_IN_INSTITUTION in the migration) and no answers or " +
          "integrity; the class page and /siapa link the names",
      );
    },
  },
];
