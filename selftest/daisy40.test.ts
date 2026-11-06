/**
 * DAISY-40: the learner's certificate list opens each certificate.
 *
 *   DAISY-40-SERTIFIKAT-01  a certificate row finds its learning assignment
 *                           through its session, by the read the certificate
 *                           page itself uses (my_cycle_state's post_session),
 *                           so its title shows and its link opens that page; a
 *                           row whose assignment is no longer current links
 *                           through the learner's own sitting (cross-batch,
 *                           6 Nov); only a row with neither is not a link. The old
 *                           keying (the map by learning_assignment_id, looked
 *                           up by session_id) is kept as the control: it finds
 *                           nothing, which is the defect.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { petaSesi, type SiklusTugas } from "../src/components/sertifikat/asalSertifikat";

/** Source with comments removed: a rule about code is tested against code. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

export const daisy40Tests: SelfTest[] = [
  {
    id: "DAISY-40-SERTIFIKAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // Three assignments as the learner reads them, with their Uji Penguasaan
      // sessions as my_cycle_state reports them: one certified, one whose post
      // test is not taken yet, one with no post test at all. Assignment and
      // session ids are different values, as they are in the database.
      const tugas = (id: string, judul: string) => ({ learning_assignment_id: id, subject: "Matematika", grade_label: "Kelas VIII", title: judul });
      const SIKLUS: SiklusTugas[] = [
        { assignment: tugas("la-0001", "Bab 4: Sistem Persamaan Linear"), postSession: "ses-9001" },
        { assignment: tugas("la-0002", "Bab 5: Fungsi"), postSession: null },
        { assignment: tugas("la-0003", "Bab 6: Statistika"), postSession: "ses-9003" },
      ];
      const peta = petaSesi(SIKLUS);

      // 1. A ROW FINDS ITS ASSIGNMENT BY ITS SESSION, with the title, and the
      //    link is that assignment's certificate page
      const a = peta.get("ses-9001"), b = peta.get("ses-9003");
      c.expect(a?.tugas === "la-0001" && a.title === "Bab 4: Sistem Persamaan Linear" && a.subject === "Matematika" && a.grade === "Kelas VIII",
        `the certificate of session ses-9001 does not find its assignment: ${JSON.stringify(a)}`);
      c.expect(b?.tugas === "la-0003", "a second certified assignment is not found by its own session");
      c.expect(peta.size === 2 && !peta.has("la-0001") && !peta.has("la-0002"), "the map is not keyed by session, or an assignment with no post session is in it");
      // a session no assignment reports (an old attempt, or an assignment the
      // learner can no longer read) finds nothing, so its row is not a link
      c.expect(peta.get("ses-7777") === undefined, "a session no assignment reports finds an assignment");
      // one session, one assignment: a second claim does not overwrite the first
      const dua = petaSesi([...SIKLUS, { assignment: tugas("la-0099", "Lain"), postSession: "ses-9001" }]);
      c.expect(dua.get("ses-9001")?.tugas === "la-0001", "a second assignment claiming a session replaces the first");

      // 2. THE CONTROL: the old keying, by learning_assignment_id looked up by
      //    session_id, finds nothing for these rows. That is the defect.
      const lama = new Map(SIKLUS.map((s) => [s.assignment.learning_assignment_id, s.assignment]));
      c.expect(lama.get("ses-9001") === undefined && lama.get("ses-9003") === undefined, "the control does not reproduce the defect");

      // 3. THE PAGE: the map is built from each assignment's post session by
      //    the engine's own cycle read, looked up by the row's session; the
      //    link is the found assignment's page and nothing else; a row with
      //    nothing found is not a link
      const hal = code(readFileSync(join(repoRoot, "src", "app", "belajar", "sertifikat", "page.tsx"), "utf8"));
      c.expect(/petaSesi\(/.test(hal) && /engine\.cycleState\(db, assignment\.learning_assignment_id\)[\s\S]{0,80}\?\.post_session/.test(hal),
        "the list does not map sessions through the certificate page's own read (my_cycle_state's post_session)");
      c.expect(/const meta = bySession\.get\(row\.session_id\);/.test(hal), "a row is not looked up by its session");
      // RESTATED (cross-batch, 6 Nov): a row whose assignment is no longer current (a new school year, a transfer) still
      // links, to the chapter its own sitting belongs to (tugasSertifikatSaya); the current assignment wins when there is one
      const tautan = [...hal.matchAll(/href=\{`([^`]*)`\}/g)].map((m) => m[1]);
      c.expect(tautan.length === 1 && tautan[0] === "/belajar/${ke}/sertifikat"
        && /const ke = meta\?\.tugas \?\? tugasDari\.get\(row\.session_id\);/.test(hal) && /tugasSertifikatSaya\(rows\.map\(\(r\) => r\.session_id\)\)/.test(hal),
        `the list links somewhere other than the found assignment's page, or not through the learner's own sitting: ${tautan.join(", ")}`);
      c.expect(!/row\.session_id\}\/sertifikat|\?\? row\.session_id/.test(hal), "a row still links to /belajar/<session id>/sertifikat");
      c.expect(/return ke \? \(\s*<Link key=\{row\.id\} className="pin-row"[\s\S]*?\) : \(\s*<div key=\{row\.id\} className="pin-row pin-row-diam">/.test(hal),
        "a row with neither a current assignment nor a sitting of the learner's is still drawn as a link");
      // the certificate page it opens reads the same session from the same place
      const detail = code(readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8"));
      // RESTATED (cross-batch, 6 Nov): my_cycle_state first, as before; when it answers nothing (the chapter no longer
      // assigned), the learner's own certificate whose own sitting belongs to this chapter (tugasSertifikatSaya)
      c.expect(/const state = await engine\.cycleState\(db, tugas\)\.catch\(\(\) => null\);\s*let sessionId = state\?\.post_session \?\? null;/.test(detail)
        && /if \(!sessionId\) \{[\s\S]{0,260}tugasSertifikatSaya\(milik\.map\(\(c\) => c\.session_id\)\)[\s\S]{0,160}tugasDari\.get\(c\.session_id\) === tugas/.test(detail),
        "the certificate page no longer finds its session by my_cycle_state's post_session first and the learner's own sitting after, so the list's links no longer open it");
      // the helper reads only the learner's own sessions, by the ids of their own certificates
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "sertifikat.ts"), "utf8"));
      c.expect(/export async function tugasSertifikatSaya\(sessionIds: string\[\]\)[\s\S]{0,400}\.from\("assessment_sessions"\)\.select\("id, learning_assignment_id"\)\.in\("id", ids\)/.test(lib),
        "tugasSertifikatSaya does not read the learner's sessions by their certificates' session ids");
      // the ten-column read is untouched (Q-11)
      c.expect(!/\.select\(/.test(hal), "the list page reads certificates itself instead of through myCertificates");

      return c.verdict(
        "a certificate row finds its learning assignment through its session, by the inverse of the certificate page's own read " +
        "(each assignment's my_cycle_state post_session), so it shows the assignment's subject, grade and title and links to " +
        "/belajar/<assignment>/sertifikat, the page that reads the same session; an assignment with no post session, a session no " +
        "assignment reports and a second claim on a session change nothing, and a row that finds no assignment is not a link. " +
        "The control, the old map keyed by learning_assignment_id and looked up by session_id, finds nothing: the defect",
      );
    },
  },
];
