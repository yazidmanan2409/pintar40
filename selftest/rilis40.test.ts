/**
 * PINTAR 4.0's release checklist, the rows code can close without a screen (re-checked 6 Oct against main 808ae6e).
 *
 *  ADM18-K01  N8 and D-085 T4, certificate_prepare (20261126100000): two learners of one school whose certificates are
 *             prepared at the same moment get two different numbers and both are prepared (before, the second failed
 *             on the unique number); one session prepared twice at the same moment gives one certificate (before, the
 *             second failed on one root per session); a learner with a profile photo gets a certificate whose identity
 *             snapshot holds no photo, and whose snapshot hash is the name's alone
 *  ADM18-K02  ADM-18, certificate_prepare (20261128100000): a certificate's number is headed by the prefix the school saved
 *             in Studio (save_certificate_template), the course's over the school's, and PINTAR/<school> where none is saved
 *  STU12-K01  N5, hint_reveals_answer_shape (20261127100000): a hint that names an option (a capital letter, a bracketed
 *             letter, or a letter after an option word) is still refused; a hint that names small-letter variables, or
 *             says "a" as an article, is not
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lit, psql } from "./bob26.test";
import { Checks, type SelfTest } from "./lib";

/** One psql session, run to its end: its stdout, and its error line if it failed. */
const sesi = (sql: string) => new Promise<{ code: number | null; out: string; err: string }>((done) => {
  const p = spawn("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-At", process.env.SUPABASE_DB_URL!]);
  let out = "", err = "";
  p.stdout.on("data", (b) => (out += b)); p.stderr.on("data", (b) => (err += b));
  // the one result line ("<certificate>|<number>"), and the error line if it failed
  p.on("close", (code) => done({ code, out: out.split("\n").find((l) => l.includes("|")) ?? "", err: err.trim().split("\n").filter((l) => /ERROR/.test(l)).join(" ") }));
  p.stdin.end(sql);
});
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Two sessions prepared at the same moment: the first holds its transaction open while the second starts. */
async function bersamaan(a: string, b: string) {
  const pertama = sesi(`begin; select certificate_id || '|' || (canonical_payload->>'certificate_number') from public.certificate_prepare('${a}'::uuid, 1::smallint);
    select pg_sleep(1.5); commit;`);
  await jeda(400);
  const kedua = sesi(`select certificate_id || '|' || (canonical_payload->>'certificate_number') from public.certificate_prepare('${b}'::uuid, 1::smallint);`);
  return Promise.all([pertama, kedua]);
}

/**
 * A second finished sitting of the bootstrap learner, in the same class and school, as BOB49 makes its own: copied
 * from a real one, carried through its statuses, with its result. Its id is the last line.
 */
const SALINAN = (tmpl: string) => `
do $s$
declare v uuid := gen_random_uuid();
begin
  perform selftest.as_owner();
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     assessment_assignment_id, plp_release_id, assessment_definition_id, assessment_definition_version,
     engine_version, scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, deadline_extended_count)
  select v, x.person_id, x.institution_id, x.enrollment_id, x.academic_period_id, x.class_node_id, x.cohort_node_id,
         x.assessment_assignment_id, x.plp_release_id, x.assessment_definition_id, x.assessment_definition_version,
         x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
         now(), 0
    from public.assessment_sessions x where x.id = '${tmpl}'::uuid;
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v;
  update public.assessment_sessions set status = 'SUBMITTED', submitted_at = now() where id = v;
  update public.assessment_sessions set status = 'FINALIZED', finalized_at = now() where id = v;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v, r.institution_id, r.person_id, r.evidence_class, r.engine_version,
         r.scoring_policy_version, r.mastery, r.per_domain, true, r.delta_inputs, now()
    from public.assessment_results r where r.session_id = '${tmpl}'::uuid and r.supersedes_result_id is null;
  perform set_config('selftest.salinan', v::text, false);
end $s$;
select current_setting('selftest.salinan');`;

export const rilis40Tests: SelfTest[] = [
  {
    id: "ADM18-K01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const siswa = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test'`);
      const fotoLama = psql(`select coalesce(photo_path, '') from public.persons where id = ${lit(siswa)}`);
      try {
        // three finished sittings of one school: the fixture's attempt is freed first, as selftest.issue_material does
        psql("select selftest.purge_certificates()");
        psql(`update public.persons set photo_path = ${lit(`profile/${siswa}/foto-adm18.jpg`)} where id = ${lit(siswa)}`);
        const s1 = psql("select selftest.boot_attempt(true)").split("\n").pop()!;
        const s2 = psql(SALINAN(s1)).split("\n").pop()!;
        const s3 = psql(SALINAN(s1)).split("\n").pop()!;
        const layak = psql(`select string_agg(e.eligible::text, ',') from unnest(array['${s1}','${s2}','${s3}']::uuid[]) s, lateral public.certificate_eligibility(s) e`);
        if (!c.expect(layak === "true,true,true", `the three sittings are not all eligible for a certificate (${layak})`)) return c.verdict("");

        // two learners' certificates at the same moment: two numbers, both prepared
        const [a, b] = await bersamaan(s1, s2);
        const [, nA] = a.out.split("|"), [, nB] = b.out.split("|");
        c.expect(a.code === 0 && b.code === 0 && !!nA && !!nB && nA !== nB,
          `two certificates prepared at the same moment: ${a.code === 0 ? nA : a.err} and ${b.code === 0 ? nB : b.err}; expected two different numbers, both prepared`);

        // one session at the same moment twice: one certificate
        const [x, y] = await bersamaan(s3, s3);
        const idX = x.out.split("|")[0], idY = y.out.split("|")[0];
        const akar = psql(`select count(*) from public.certificates where session_id = '${s3}'::uuid and supersedes_certificate_id is null`);
        c.expect(x.code === 0 && y.code === 0 && idX === idY && akar === "1",
          `one session prepared twice at the same moment: ${x.code === 0 ? "prepared" : x.err}; ${y.code === 0 ? (idX === idY ? "the same certificate" : "ANOTHER certificate") : y.err}; ${akar} certificate(s)`);

        // no photo on the certificate (D-085 T4): the snapshot is the name alone
        const nama = psql(`select display_name from public.persons where id = ${lit(siswa)}`);
        const snap = psql(`select coalesce(i.photo_path, '') || '|' || coalesce(i.photo_content_hash, '') || '|' || i.snapshot_hash || '|' || (c.canonical_payload->>'identity_snapshot_hash')
                             from public.certificates c join public.certificate_identity_snapshots i on i.id = c.snapshot_id where c.session_id = '${s1}'::uuid`);
        const [foto, hashFoto, hashSnap, hashMuatan] = snap.split("|");
        const hanyaNama = createHash("sha256").update(`${nama}||`).digest("hex");
        c.expect(foto === "" && hashFoto === "" && hashSnap === hanyaNama && hashMuatan === hanyaNama,
          `a learner with a profile photo got a certificate whose snapshot ${foto ? "holds the photo" : "holds no photo"} and whose hash ${hashSnap === hanyaNama ? "is" : "is NOT"} the name's alone`);
      } finally {
        psql(`update public.persons set photo_path = ${fotoLama ? lit(fotoLama) : "null"} where id = ${lit(siswa)}`);
        try { psql("select selftest.purge_certificates()"); } catch { /* the F04 suite purges again */ }
      }
      return c.verdict("two learners of one school prepared at the same moment got two different numbers and both were prepared; one session " +
        "prepared twice at the same moment gave one certificate; a learner with a profile photo got a certificate whose snapshot holds no " +
        "photo, its hash the name's alone (D-085 T4)");
    },
  },
  {
    id: "ADM18-K02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      // a template saved as the school's own admin would save it in Studio (save_certificate_template, CAN_PUBLISH)
      const simpan = (awalan: string, lingkup: "sekolah" | "mapel") => psql(`
        do $t$ declare f record; begin
          perform selftest.as_owner();
          select * into f from selftest.boot_fixture();
          perform selftest.as_user('boot-admin@bootstrap.pintar.test');
          perform public.save_certificate_template(f.inst, ${lingkup === "mapel" ? "f.course" : "null"}, null, 'CLASSIC', ${lit(awalan)});
          perform selftest.as_owner();
        end $t$;`);
      // a fresh finished sitting each time, and the number its certificate is prepared with
      const nomor = () => {
        psql("select selftest.purge_certificates()");
        const s = psql("select selftest.boot_attempt(true)").split("\n").pop()!;
        return psql(`select canonical_payload->>'certificate_number' from public.certificate_prepare('${s}'::uuid, 1::smallint)`);
      };
      let tanpa = "", sekolah = "", mapel = "";
      try {
        tanpa = nomor();
        simpan("SDBOOT", "sekolah");
        sekolah = nomor();
        simpan("SDBOOT/MAT", "mapel");
        mapel = nomor();
      } finally {
        psql("delete from public.certificate_templates where institution_id = (select inst from selftest.boot_fixture())");
        try { psql("select selftest.purge_certificates()"); } catch { /* the F04 suite purges again */ }
      }
      c.expect(/^PINTAR\/[A-Z0-9-]+\/\d{4}\/\d{5}$/.test(tanpa), `with no template the number is ${tanpa}, not PINTAR/<school>/<year>/<n>`);
      c.expect(/^SDBOOT\/\d{4}\/\d{5}$/.test(sekolah), `with the school's prefix SDBOOT the number is ${sekolah}`);
      c.expect(/^SDBOOT\/MAT\/\d{4}\/\d{5}$/.test(mapel), `with the course's prefix SDBOOT/MAT over the school's the number is ${mapel}`);
      return c.verdict(`no template: ${tanpa}; the school's prefix: ${sekolah}; the course's, over the school's: ${mapel}`);
    },
  },
  {
    id: "STU12-K01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const menyebut = ["Jawabannya adalah B.", "jawaban: (c)", "The answer is (b)", "The answer is D", "bukan A", "not D", "selain E",
        "pilih A atau C", "(a) atau (b)", "pilihan a atau b", "kunci: (b)"];
      const biasa = ["The answer is a whole number", "Bandingkan nilai a atau b terlebih dahulu", "whether c or d is larger",
        "Jawabannya adalah angka genap", "Ingat: a + b = c", "It is not a fraction", "Hitung a atau b dulu, lalu bandingkan", "Key idea: a = 2b"];
      const nilai = (h: string) => psql(`select public.hint_reveals_answer_shape(${lit(h)})`);
      // the old patterns, as 20260912112712 wrote them: the new predicate refuses nothing they did not
      const lama = (h: string) => psql(`select ${lit(h)} ~* '(jawab\\w*|answer|kunci|key)[^.!?]{0,24}(adalah|ialah|is|:|=)\\s*\\(?[a-e]\\)?\\y'
        or ${lit(h)} ~* '\\y(bukan|not|selain|exclude[sd]?|eliminate)\\s+\\(?[a-e]\\)?\\y' or ${lit(h)} ~* '\\y\\(?[a-e]\\)?\\s+(atau|or)\\s+\\(?[a-e]\\)?\\y'`);
      const baru = [...menyebut, ...biasa, "Eliminate option c first", "not option B"].filter((h) => nilai(h) === "t" && lama(h) !== "t");
      const lolos = menyebut.filter((h) => nilai(h) !== "t");
      const ditolak = biasa.filter((h) => nilai(h) !== "f");
      c.expect(lolos.length === 0, `hints that name an option were not refused: ${JSON.stringify(lolos)}`);
      c.expect(ditolak.length === 0, `ordinary hints were refused as naming an option (N5): ${JSON.stringify(ditolak)}`);
      c.expect(baru.length === 0, `the predicate refuses what the old one did not (a stored hint could stop saving): ${JSON.stringify(baru)}`);
      c.expect(psql("select public.hint_reveals_answer_shape('') || ',' || coalesce(public.hint_reveals_answer_shape(null)::text, 'null')") === "false,false",
        "an empty or missing hint is not refused");
      return c.verdict(`${menyebut.length} hints that name an option are refused (a capital, a bracketed letter, a letter after an option word); ` +
        `${biasa.length} ordinary hints with small-letter variables or the article "a" are not; nothing is refused that the old patterns did not refuse`);
    },
  },
];
