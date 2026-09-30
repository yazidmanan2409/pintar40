/**
 * BOB-50 (D-082(d)): A SINGLE UJI CEPAT DOES NOT ISSUE A CERTIFICATE, through
 * the running app. The database's half (eligibility, preparation, the policy and
 * its lint) is selftest/db/fable19.sql.
 *
 *   BOB50-A01  the direct path: the learner finishes a real Uji Cepat, then asks
 *              POST /api/certificates/issue for it herself; the route answers
 *              not_eligible and no certificate exists for the session
 *   BOB50-S01  the player: only the cycle's Uji Penguasaan (POST_TEST) asks
 *              for a certificate after Finish; the Uji Cepat that borrows its
 *              treatment does not
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

function psql(sql: string): string {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}

/**
 * A real Uji Cepat, committed: the bootstrap teacher launches it in the class,
 * the bootstrap learner sits and finishes it all correct. Its session id is the
 * last line.
 */
const UJI_CEPAT = `
do $b50$
declare f record; v_kelas uuid; q record; v_s uuid;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select n.id into v_kelas from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' order by n.created_at, n.id limit 1;
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select * into q from public.launch_quick_assessment(v_kelas, f.modul, 3, 20);
  perform selftest.as_owner();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  v_s := public.start_learning_session(q.assessment_assignment_id);
  perform selftest.answer_paper(v_s, true);
  perform public.finish_my_session(v_s);
  perform selftest.as_owner();
  perform set_config('bob50.sesi', v_s::text, false);
end $b50$;
select current_setting('bob50.sesi');`;

export const bob50AppTests: SelfTest[] = [
  {
    id: "BOB50-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(ctx.repoRoot, "selftest", "db", `${f}.sql`), process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
      }
      const sesi = psql(UJI_CEPAT).split("\n").pop()!;
      c.expect(psql(`select mode from public.assessment_sessions where id = '${sesi}'`) === "QUICK", "the fixture's session is not an Uji Cepat");
      // the learner, signed in as herself (BOB-26's password door)
      const masuk = await fetch(`${asal}/masuk/password`, {
        method: "POST", redirect: "manual",
        headers: { origin: asal, "sec-fetch-site": "same-origin", "x-real-ip": "198.51.100.250" },
        body: (() => { const fd = new FormData(); fd.set("identitas", "uji.boot.siswa"); fd.set("password", "Bootstrap-Siswa-3082!"); return fd; })(),
      });
      const kue = masuk.headers.getSetCookie().map((k) => k.split(";")[0]).filter((k) => !k.endsWith("=")).join("; ");
      if (!c.expect(masuk.status === 200 && kue !== "", `the learner could not sign in (${masuk.status})`)) return c.verdict("");
      const r = await fetch(`${asal}/api/certificates/issue`, {
        method: "POST", headers: { cookie: kue, "content-type": "application/json", origin: asal },
        body: JSON.stringify({ session_id: sesi }),
      });
      const isi = (await r.json().catch(() => null)) as { status?: string } | null;
      c.expect(r.status === 200 && isi?.status === "not_eligible", `the issue route answered ${r.status} ${JSON.stringify(isi)} for an Uji Cepat`);
      c.expect(psql(`select count(*) from public.certificates where session_id = '${sesi}'`) === "0", "a certificate exists for the Uji Cepat");
      return c.verdict("the bootstrap learner finished a real Uji Cepat all correct, signed in as herself and asked POST /api/certificates/issue "
        + "for it: the route answered not_eligible and no certificate row exists for the session");
    },
  },
];

export const bob50Tests: SelfTest[] = [
  {
    id: "BOB50-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => tanpaKomentar(readFileSync(join(repoRoot, f), "utf8"));
      const pemain = baca("src/app/belajar/_components/ItemPlayer.tsx");
      const permukaan = baca("src/app/belajar/_components/PermukaanAsesmen.tsx");
      const minta = /if\s*\(\s*([A-Za-z]+)\s*\)\s*\{\s*void fetch\(\s*["']\/api\/certificates\/issue["']/.exec(pemain);
      c.expect(!!minta, "the player's certificate request is not behind one condition");
      c.expect(minta?.[1] === "memintaSertifikat", `the player asks for a certificate when ${minta?.[1] ?? "?"}, not only for the cycle's Uji Penguasaan`);
      c.expect((pemain.match(/\/api\/certificates\/issue/g) ?? []).length === 1, "the player asks for a certificate from more than one place");
      c.expect(/memintaSertifikat=\{\s*session\?\.mode\s*===\s*["']POST_TEST["']\s*\}/.test(permukaan),
        "the surface does not tell the player to ask only for a POST_TEST session");
      const migrasi = "supabase/migrations/20261031100000_a_quick_assessment_does_not_certify.sql";
      c.expect(existsSync(join(repoRoot, migrasi)), `${migrasi} is missing`);
      const mig = existsSync(join(repoRoot, migrasi)) ? baca(migrasi) : "";
      c.expect(/set certifies = false[\s\S]*where mode = 'QUICK'/.test(mig) && /c\.status = 'ELIGIBLE' and s\.mode = 'QUICK'/.test(mig),
        "the migration does not stop QUICK certifying, or does not refuse over an unsigned Uji Cepat certificate");
      return c.verdict("the player asks for a certificate from one place, only when memintaSertifikat is set, and the surface sets it only for a "
        + "POST_TEST session; the migration sets QUICK certifies = false and refuses to apply over an unsigned Uji Cepat certificate");
    },
  },
];
