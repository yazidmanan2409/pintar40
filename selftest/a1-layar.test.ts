/**
 * A1 · SITTING CONTROL, the screens (docs/completion-4.1/batches/A1-COMPLETION.md, «Pre-build review: outcome»; Daisy,
 * TINJAUAN-A1-C1W Q4, Q5, §A1·N1, §A1·N2, A1-B1, A1-R1). The database half is selftest/a1.test.ts.
 *
 *   A1-K02  reads the source and runs the pure helpers: Daisy's sentences are in the copy table word for word, each with
 *           its English; a held sitting is «Ditahan» and never «ditangguhkan»; the learner is never shown a reason or
 *           «ditolak»; only the acts that apply to a row are offered (tindakanUntuk); the row's lines (metaBaris); the
 *           three learner notices are three keys told apart by the refusal's DETAIL and by pengerjaan_saya, and the
 *           open player asks every 45 seconds and on every send; a professional-learning class asks no list.
 *   A1-A01  the running app, as the class's teacher: «Siapa yang sudah mengumpulkan» for a class with every state, the
 *           instrument choice, «Atur» only where an act applies, each act through its form, the refusals (a short
 *           reason; the sitting ended before the change was saved), a held sitting before and after reinstatement, no
 *           «Atur» in a professional-learning class, another class's teacher refused, «Ubah jadwal» on the class page.
 *   A1-A02  the running app, the approver's queue: a head of department who asked sees their own row with no button
 *           and cannot decide it; the school admin reads the line under «Yang menunggu», the queue, «Tolak» without a
 *           reason refused, «Setujui» recorded; the head's own home carries the same line; the empty state.
 *   A1-A03  the running app, as the learner on Belajar: a held sitting, one ended as not counted, one ended at its
 *           deadline and an approved further attempt each say their own sentence and offer only what applies; a
 *           waiting and a declined request say nothing; no reason is ever on the page.
 *   A1-J01  the journey «a power cut during Uji Penguasaan», with no engineer: the learner starts the Uji Penguasaan
 *           through the app; the teacher ends that sitting as not counted from «Atur»; the learner's Belajar says so
 *           and the Uji Penguasaan opens again; the learner starts again. Nothing is written past the product's own
 *           paths once the fixture stands.
 */
import { randomBytes } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { ipUji, lit, psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { pilihKonteksPeramban, tersusun } from "./konteks-uji";
import { t, type HleEvent } from "../src/lib/hle";
import {
  KUNCI_AKHIR_PEMAIN, akhirDariGalat, akhirDariKeadaan, catatanDari, tindakanUntuk, type BarisPengerjaan, type PengerjaanSaya,
} from "../src/lib/pengerjaan-kontrak";
import { lencanaA1, metaBaris } from "../src/lib/pengerjaan-tampil";

const GURU = { identitas: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" };
const KADEP = { identitas: "siklus-kaprodi@synthetic.pintar.test", password: "Sintetis-SiklusKaprodi-22!" };
const ADMIN = { identitas: "siklus-admin@synthetic.pintar.test", password: "Sintetis-SiklusAdmin-33!" };
const GURU_LAIN = { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" };
const ALASAN = "uji A1: alasan yang cukup panjang";
/** The sign-in of the fixture's own learner (synthetic, made and removed with the fixture's class). */
const muridUji = (tag: string) => ({ identitas: `a1-murid-${tag}@synthetic.pintar.test`, password: `Sintetis-A1Murid-${tag}!` });

const id = (k: string, untuk: "educator" | "staff" | "learner" = "educator") => t(k as HleEvent, untuk, { locale: "id" });
const en = (k: string, untuk: "educator" | "staff" | "learner" = "educator") => t(k as HleEvent, untuk, { locale: "en" });
/**
 * tersusun(), and the one streamed shape it does not put back: a table's cells. React sends a late cell as
 * <table hidden><tbody><tr id="S:x">…</tr></tbody></table> for its <template id="P:x">; which cells arrive late is the
 * size of the page, not its shape.
 */
function rapi(html: string): string {
  return tersusun(html).replace(/<template id="P:([0-9a-z]+)"><\/template>/g, (semua, x: string) => {
    const m = new RegExp(`<(tr|tbody|thead|table|colgroup)\\b[^>]*\\bid="S:${x}"[^>]*>([\\s\\S]*?)</\\1>`).exec(html);
    return m ? m[2] : semua;
  });
}
const teks = (html: string) => rapi(html).replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const baca = (root: string, f: string) => { try { return readFileSync(join(root, f), "utf8"); } catch { return ""; } };

/** A form of a rendered page, found by a mark it holds, as a browser would send it: its hidden fields, then `isi`. */
function formDengan(html: string, penanda: string, isi: Record<string, string>): Record<string, string> | string {
  const bentuk = rapi(html).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0]).filter((b) => b.includes(penanda));
  if (bentuk.length !== 1) return `${bentuk.length} form(s) hold ${penanda}`;
  const out: Record<string, string> = {};
  for (const m of bentuk[0].matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)) {
    const nama = /\bname="([^"]*)"/.exec(m[0])?.[1];
    const nilai = (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (nama) out[nama] = nilai;
  }
  return { ...out, ...isi };
}
/** One learner's row of the rendered Table (its <tr>), by the name it carries. */
const baris = (html: string, nama: string) => (rapi(html).match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).find((r) => r.includes(nama)) ?? "";
const ke = (r: Response) => (r.headers.get("location") ?? "").replace(/&amp;/g, "&");

export async function masuk(asal: string, siapa: { identitas: string; password: string }, konteks: string): Promise<Komputer | string> {
  const k = new Komputer(asal, ipUji());
  const m = await k.jsonDari("/masuk/password", { form: siapa });
  if (m.status !== 200) return `${siapa.identitas} could not sign in (${m.status})`;
  await k.halaman("/");
  await k.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
  try { await pilihKonteksPeramban(k, konteks); } catch (e) { return `${siapa.identitas} could not choose ${konteks}: ${(e as Error).message.slice(0, 200)}`; }
  return k;
}

// ------------------------------------------------------------------ the fixture: a class of the test's own
export type Dunia = { inst: string; kelas: string; pd: string; la: string; pre: string; post: string; pdAa: string; murid: Record<string, { uid: string; pid: string; nama: string }> };
const NAMA = ["belum", "buka", "serah", "dinilai", "tidak", "tenggat", "tahan", "lagi"] as const;

export function muat(repoRoot: string): void {
  for (const f of ["fable01.sql", "fable03.sql", "fable06.sql", "fable09.sql"]) psql(`\\i ${join(repoRoot, "selftest", "db", f)}`);
}

/**
 * In the seeded learning-cycle school: a Kelas of the test's own under the fixture's Tingkat, taught by the cycle's
 * teacher, given the fixture's lesson (its Pemetaan Awal and Uji Penguasaan, open for thirty days); eight learners of
 * its own, and a ninth who can sign in; a professional-learning Kelas with one assessment.
 * Written past the triggers where the product has no shorter path (as PENUGASAN-A01's fixture is).
 */
export function dunia(tag: string): Dunia | string {
  bersihkan();
  const out = psql(`
    do $$ declare f record; v_i uuid; v_k5 uuid; v_par uuid; v_per uuid; v_k uuid; v_pd uuid; v_g uuid; v_la uuid; v_la2 uuid; v_pre uuid; v_post uuid; v_pdaa uuid;
                  v_u uuid; v_p uuid; v_e uuid; v_prog uuid; j jsonb := '{}'::jsonb; n text; begin
      perform set_config('app.seed_intent', 'synthetic', true);
      select * into f from selftest.cycle_fixture();
      select la.node_id, la.institution_id, la.academic_period_id into v_k5, v_i, v_per from public.learning_assignments la where la.id = f.la;
      select n2.parent_id into v_par from public.org_nodes n2 where n2.id = v_k5;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_par, 'CLASS', 'Kelas A1 ' || ${lit(tag)}, v_per) returning id into v_k;
      set local session_replication_role = replica;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id, learning_context, jalur)
      select v_i, v_par, 'CLASS', 'Kelas PD A1 ' || ${lit(tag)}, v_per, 'PROFESSIONAL_DEVELOPMENT', k.jalur from public.org_nodes k where k.id = v_k returning id into v_pd;
      update public.org_nodes set jalur = (select array_replace(k.jalur, v_k, v_pd) from public.org_nodes k where k.id = v_k) where id = v_pd;
      set local session_replication_role = origin;
      select a.person_id into v_g from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(GURU.identitas)};
      insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
      values (v_g, 'EDUCATOR', v_k, v_i, now() - interval '1 day', now() + interval '365 days'), (v_g, 'EDUCATOR', v_pd, v_i, now() - interval '1 day', now() + interval '365 days');
      set local session_replication_role = replica;
      insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at, available_from, available_until, learning_cycle)
      select x.institution_id, x.plp_release_id, x.course_id, v_k, v_per, 'ACTIVE', now(), now() - interval '1 day', now() + interval '30 days', x.learning_cycle
        from public.learning_assignments x where x.id = f.la returning id into v_la;
      insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, closes_at, status, assigned_at, pass_mark, pass_mark_source, school_pass_mark_id)
      select x.institution_id, x.assessment_definition_id, v_la, v_k, v_per, now() - interval '1 day', now() + interval '30 days', 'OPEN', now(), x.pass_mark, x.pass_mark_source, x.school_pass_mark_id
        from public.assessment_assignments x where x.id = f.aa_pre returning id into v_pre;
      insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, closes_at, status, assigned_at, pass_mark, pass_mark_source, school_pass_mark_id)
      select x.institution_id, x.assessment_definition_id, v_la, v_k, v_per, now() - interval '1 day', now() + interval '30 days', 'OPEN', now(), x.pass_mark, x.pass_mark_source, x.school_pass_mark_id
        from public.assessment_assignments x where x.id = f.aa_post returning id into v_post;
      -- the professional-learning Kelas: one assessment open in it, with a sitting under way
      insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, closes_at, status, assigned_at, pass_mark, pass_mark_source, school_pass_mark_id)
      select x.institution_id, x.assessment_definition_id, null, v_pd, v_per, now() - interval '1 day', now() + interval '30 days', 'OPEN', now(), x.pass_mark, x.pass_mark_source, x.school_pass_mark_id
        from public.assessment_assignments x where x.id = f.aa_pre returning id into v_pdaa;
      set local session_replication_role = origin;
      select e.programme_id into v_prog from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id where mm.node_id = v_k5 and mm.valid_to is null limit 1;
      foreach n in array array[${NAMA.map((x) => `'${x}'`).join(", ")}] loop
        v_u := selftest.f06p10_person('a1l-' || n || '-' || ${lit(tag)});
        select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
        update public.persons set display_name = 'Murid A1 ' || initcap(n) || ' ' || ${lit(tag)} where id = v_p;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_p, v_i, v_per, v_prog, 'ACTIVE') returning id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_k, v_per);
        if n = 'belum' then
          -- (a professional-learning place takes staff only, D-070(c); the fixture needs only a name in that list)
          set local session_replication_role = replica;
          insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_pd, v_per);
          set local session_replication_role = origin;
        end if;
        j := j || jsonb_build_object(n, jsonb_build_object('uid', v_u, 'pid', v_p, 'nama', 'Murid A1 ' || initcap(n) || ' ' || ${lit(tag)}));
      end loop;
      -- a learner of the test's own who signs in, made as the cycle's seed makes its own (supabase/seed/learning_cycle.sql):
      -- the seeded cycle learner has used this definition's attempts and this bank's questions in other tests
      v_u := gen_random_uuid();
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, recovery_token, email_change_token_new, email_change)
      values (v_u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${lit(muridUji(tag).identitas)}, extensions.crypt(${lit(muridUji(tag).password)}, extensions.gen_salt('bf', 4)), now(),
              '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', 'Murid A1 Masuk ' || ${lit(tag)}), now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_u, v_u::text, jsonb_build_object('sub', v_u::text, 'email', ${lit(muridUji(tag).identitas)}, 'email_verified', true), 'email', now(), now(), now());
      select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
      update public.persons set display_name = 'Murid A1 Masuk ' || ${lit(tag)} where id = v_p;
      -- ... and already activated, as supabase/seed/activated_staff.sql marks the seeded people who have a password
      insert into public.person_usernames (person_id, username) values (v_p, 'uji.a1.' || ${lit(tag)}) on conflict do nothing;
      insert into public.person_pins (person_id, pin_hash) values (v_p, extensions.crypt('2817', extensions.gen_salt('bf', 6))) on conflict do nothing;
      update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
       where account_id = (select a.id from public.accounts a where a.auth_user_id = v_u);
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_p, v_i, v_per, v_prog, 'ACTIVE') returning id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_k, v_per);
      j := j || jsonb_build_object('masuk', jsonb_build_object('uid', v_u, 'pid', v_p, 'nama', 'Murid A1 Masuk ' || ${lit(tag)}));
      perform set_config('a1.dunia', jsonb_build_object('inst', v_i, 'kelas', v_k, 'pd', v_pd, 'la', v_la, 'pre', v_pre, 'post', v_post, 'pdAa', v_pdaa, 'murid', j)::text, false);
    end $$;
    select current_setting('a1.dunia');`).split("\n").pop() ?? "";
  try {
    const d = JSON.parse(out) as Dunia;
    return d.kelas && d.pre && d.post && Object.keys(d.murid ?? {}).length === NAMA.length + 1 ? d : `the fixture is incomplete: ${out.slice(0, 200)}`;
  } catch {
    return `the fixture was not made: ${out.slice(0, 300)}`;
  }
}

/** As one person (their auth user), in one committed transaction: the product's own functions, called as they would be. */
export const sebagai = (uid: string, ...sql: string[]) => psql(["begin", `select selftest.as_user_uid(${lit(uid)})`, ...sql, "commit"].join("; "));
export const sebagaiEmail = (email: string, ...sql: string[]) => psql(["begin", `select selftest.as_user(${lit(email)})`, ...sql, "commit"].join("; "));
/** A learner starts an assessment and answers its first `n` questions; the sitting's id. */
export function mulai(uid: string, aa: string, n: number): string {
  const out = sebagai(uid, `do $m$ declare v uuid; r record; begin
      v := public.start_learning_session(${lit(aa)});
      for r in select p.id from public.presented_items p where p.session_id = v order by p.position limit ${n} loop
        perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, true));
      end loop;
      perform set_config('a1.sesi', v::text, false);
    end $m$`, "select 'SESI=' || current_setting('a1.sesi')");
  return /SESI=([0-9a-f-]{36})/.exec(out)?.[1] ?? "";
}
/** The harness's own clock correction on a sitting (never a product path). */
export const tenggat = (sesi: string, selang: string) =>
  psql(`begin; set local session_replication_role = replica; update public.assessment_sessions set authoritative_deadline = now() ${selang} where id = ${lit(sesi)}; commit;`);

/**
 * Everything the fixture and the test made, removed again: the cycle school is other tests' too. Found by the names the
 * fixture gives (so a run that died half-way is cleared by the next one); the app tests run one after another.
 */
export function bersihkan(): void {
  const kelas = `(select n.id from public.org_nodes n where n.name like 'Kelas A1 %' or n.name like 'Kelas PD A1 %')`;
  const aa = `(select a.id from public.assessment_assignments a where a.node_id in ${kelas})`;
  const sesi = `(select s.id from public.assessment_sessions s where s.class_node_id in ${kelas} or s.assessment_assignment_id in ${aa})`;
  const orang = `(select p.id from public.persons p where p.display_name like 'Murid A1 %')`;
  psql(`begin; set local session_replication_role = replica;
    delete from public.person_suspensions where person_id in ${orang};
    update auth.users set banned_until = null where id in (select a.auth_user_id from public.accounts a where a.person_id in ${orang});
    update public.assessment_sessions set attempt_request_id = null where id in ${sesi};
    delete from public.attempt_requests where assessment_assignment_id in ${aa};
    delete from telemetry.assistance_events where session_id in ${sesi};
    delete from telemetry.hesitation_events where session_id in ${sesi};
    delete from public.assistance_grants where session_id in ${sesi};
    delete from public.integrity_signals where session_id in ${sesi};
    delete from public.evidence_class_overrides where session_id in ${sesi};
    delete from public.result_views where session_id in ${sesi};
    delete from public.certificates where session_id in ${sesi};
    delete from public.assessment_results where session_id in ${sesi};
    delete from public.responses where session_id in ${sesi};
    delete from public.presented_item_views where session_id in ${sesi};
    delete from public.presented_items where session_id in ${sesi};
    delete from public.assessment_sessions where id in ${sesi};
    delete from public.lesson_progress where person_id in ${orang};
    delete from public.memberships where node_id in ${kelas};
    delete from public.enrollments where person_id in ${orang};
    delete from public.assessment_assignments where node_id in ${kelas};
    delete from public.learning_assignment_release_moves where learning_assignment_id in (select l.id from public.learning_assignments l where l.node_id in ${kelas});
    delete from public.learning_assignments where node_id in ${kelas};
    delete from public.role_assignments where scope_node_id in ${kelas};
    delete from public.classes where node_id in ${kelas};
    delete from public.org_nodes where name like 'Kelas A1 %' or name like 'Kelas PD A1 %';
    commit;`);
}

const siapa = (d: Dunia, aa = d.pre) => `/mengajar/${d.kelas}/siapa?penugasan=${aa}`;


// ------------------------------------------------------------------ the scheduler (owner's Option A)
const JOB = "pintar-pengerjaan-tutup-terjadwal";
/** psql in a connection of its own, as a promise: stdout, the last stderr lines, and whether it succeeded. */
function psqlLain(sql: string): Promise<{ ok: boolean; out: string; err: string }> {
  return new Promise((selesai) => {
    const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql, process.env.SUPABASE_DB_URL!], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (b) => { out += b; });
    p.stderr.on("data", (b) => { err += b; });
    p.on("close", (code) => selesai({ ok: code === 0, out: out.trim(), err: err.trim().split("\n").slice(-3).join(" | ") }));
  });
}
const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** One sitting's ending as the database holds it: status/closure/results/deadline-audit rows/teacher-audit rows. */
const akhirSesi = (sesi: string) => psql(`select s.status || '/' || coalesce(s.closure_kind, '-') || '/' || (select count(*) from public.assessment_results r where r.session_id = s.id)
  || '/' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.ended_by_deadline')
  || '/' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action in ('assessment_session.terminated', 'assessment_session.handed_in_by_teacher'))
  from public.assessment_sessions s where s.id = ${lit(sesi)}`);
/** The job's own command, read from pg_cron and executed as pg_cron executes it (no signed-in actor, no claims). */
const PERINTAH = `(select command from cron.job where jobname = '${JOB}')`;

export const a1LayarTests: SelfTest[] = [
  {
    id: "A1-S08",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tag = randomBytes(3).toString("hex");
      muat(repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const m = d.murid;
        // four sittings past their deadline (x, y: ordinary; z1: its ending will raise; z2: its scoring will raise) and
        // one still within it (w); nobody touches any of them again
        const s: Record<string, string> = {};
        for (const [n, nama] of [["x", "buka"], ["y", "serah"], ["z1", "dinilai"], ["z2", "tidak"], ["w", "tenggat"]] as const) s[n] = mulai(m[nama].uid, d.pre, 2);
        if (!c.expect(Object.values(s).every((x) => /^[0-9a-f-]{36}$/.test(x)), `the sittings could not be started: ${JSON.stringify(s)}`)) return c.verdict("");
        for (const n of ["x", "y", "z1", "z2"]) tenggat(s[n], "- interval '1 hour'");
        tenggat(s.w, "+ interval '1 hour'");
        const ringkas = (n: string) => `(select s.status || '/' || coalesce(s.closure_kind, '-') || '/' || (select count(*) from public.assessment_results r where r.session_id = s.id)
            || '/' || (select count(*) from public.audit_log l where l.target_id = s.id::text and l.action = 'assessment_session.ended_by_deadline')
            from public.assessment_sessions s where s.id = ${lit(s[n])})`;
        const keadaan = `select 'K|' || concat_ws(' ', ${(["x", "y", "z1", "z2", "w"]).map((n) => `'${n}=' || ${ringkas(n)}`).join(", ")})`;
        const hasilnya = (out: string, awalan: string) => out.split("\n").find((l) => l.startsWith(awalan))?.slice(awalan.length) ?? "";
        // one transaction, rolled back: a failure planted for z1 (its ending) and z2 (its scoring); run 1; the plants
        // removed; run 2; run 3; the schedule installed twice
        const r = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", process.env.SUPABASE_DB_URL!], { encoding: "utf8", input: `
begin;
create function selftest.a1_s08_rusak_akhir() returns trigger language plpgsql as $f$
begin
  if new.id = ${lit(s.z1)} and new.status = 'EXPIRED' then raise exception 'A1-S08: planted failure ending z1'; end if;
  return new;
end $f$;
create function selftest.a1_s08_rusak_nilai() returns trigger language plpgsql as $f$
begin
  if new.session_id = ${lit(s.z2)} then raise exception 'A1-S08: planted failure scoring z2'; end if;
  return new;
end $f$;
create trigger a1_s08_rusak before update on public.assessment_sessions for each row execute function selftest.a1_s08_rusak_akhir();
create trigger a1_s08_rusak before insert on public.assessment_results for each row execute function selftest.a1_s08_rusak_nilai();
${keadaan.replace("'K|'", "'K0|'")};
create temp table a1_s08_jalan (n int, hasil jsonb);
do $j$ declare v jsonb; begin execute ${PERINTAH} into v; insert into a1_s08_jalan values (1, v); end $j$;
select 'R1|' || hasil::text from a1_s08_jalan where n = 1;
${keadaan.replace("'K|'", "'K1|'")};
drop trigger a1_s08_rusak on public.assessment_sessions;
drop trigger a1_s08_rusak on public.assessment_results;
do $j$ declare v jsonb; begin execute ${PERINTAH} into v; insert into a1_s08_jalan values (2, v); end $j$;
select 'R2|' || hasil::text from a1_s08_jalan where n = 2;
${keadaan.replace("'K|'", "'K2|'")};
select 'A2|' || (select count(*) from public.audit_log) || '|' || (select count(*) from public.assessment_results);
do $j$ declare v jsonb; begin execute ${PERINTAH} into v; insert into a1_s08_jalan values (3, v); end $j$;
select 'R3|' || hasil::text from a1_s08_jalan where n = 3;
${keadaan.replace("'K|'", "'K3|'")};
select 'A3|' || (select count(*) from public.audit_log) || '|' || (select count(*) from public.assessment_results);
select 'P|' || (public.pengerjaan_jadwal_pasang() ->> 'ok') || '|' || (public.pengerjaan_jadwal_pasang() ->> 'ok') || '|'
  || (select count(*) || ' ' || min(schedule) || ' ' || min(command) from cron.job where jobname = '${JOB}');
rollback;
` });
        const out = r.stdout ?? "", err = r.stderr ?? "";
        if (!c.expect(r.status === 0, `the scenario did not run: ${err.trim().split("\n").slice(-3).join(" | ")}`)) return c.verdict("");
        const R1 = JSON.parse(hasilnya(out, "R1|") || "{}"), R2 = JSON.parse(hasilnya(out, "R2|") || "{}"), R3 = JSON.parse(hasilnya(out, "R3|") || "{}");
        // before: every sitting open, nothing ended
        c.expect(hasilnya(out, "K0|") === "x=IN_PROGRESS/-/0/0 y=IN_PROGRESS/-/0/0 z1=IN_PROGRESS/-/0/0 z2=IN_PROGRESS/-/0/0 w=IN_PROGRESS/-/0/0", `before the job: ${hasilnya(out, "K0|")}`);
        // 1. the job's own command, with no user interaction, ends and scores the abandoned sittings past their deadline
        // 4. one sitting whose ending raises and one whose scoring raises stop nothing else, are reported, and stay to be retried
        c.expect(hasilnya(out, "K1|") === "x=FINALIZED/DEADLINE/1/1 y=FINALIZED/DEADLINE/1/1 z1=IN_PROGRESS/-/0/0 z2=EXPIRED/DEADLINE/0/1 w=IN_PROGRESS/-/0/0",
          `after run 1 (failures planted for z1 and z2): ${hasilnya(out, "K1|")}`);
        c.expect(Array.isArray(R1.gagal) && R1.gagal.some((g: { session_id: string; message: string }) => g.session_id === s.z1 && /planted failure ending z1/.test(g.message)) && R1.menunggu >= 1,
          `run 1 does not report z1's failure or z2's wait: ${JSON.stringify(R1).slice(0, 400)}`);
        c.expect(new RegExp(`pengerjaan_tutup_terjadwal: \\d+ of \\d+ sitting\\(s\\) could not be closed and will be tried again on the next run: .*${s.z1}`).test(err)
          && new RegExp(`A1: sitting ${s.z2} ended by its deadline and could not be scored yet: A1-S08: planted failure scoring z2`).test(err),
          `the failures are not warned to the server log with their sittings: ${err.split("\n").filter((l) => /WARNING/.test(l)).join(" | ").slice(0, 500)}`);
        c.expect(hasilnya(out, "K2|") === "x=FINALIZED/DEADLINE/1/1 y=FINALIZED/DEADLINE/1/1 z1=FINALIZED/DEADLINE/1/1 z2=FINALIZED/DEADLINE/1/1 w=IN_PROGRESS/-/0/0"
          && Array.isArray(R2.gagal) && !R2.gagal.some((g: { session_id: string }) => g.session_id === s.z1 || g.session_id === s.z2),
          `run 2, the failures gone, does not pick both up: ${hasilnya(out, "K2|")}; ${JSON.stringify(R2).slice(0, 300)}`);
        // 2. idempotent: a third run changes nothing (no sitting, no result, no audit row); installing twice leaves one job
        c.expect(hasilnya(out, "K3|") === hasilnya(out, "K2|") && hasilnya(out, "A3|") === hasilnya(out, "A2|") && R3.dinilai === 0,
          `run 3 changed something: ${hasilnya(out, "K3|")}; audit/results ${hasilnya(out, "A2|")} -> ${hasilnya(out, "A3|")}; ${JSON.stringify(R3).slice(0, 300)}`);
        c.expect(hasilnya(out, "P|") === `true|true|1 */5 * * * * select public.pengerjaan_tutup_terjadwal()`, `the schedule installed twice: ${hasilnya(out, "P|")}`);
        // the job's schedule and role, as pg_cron holds them
        c.expect(psql(`select count(*) || '|' || min(schedule) || '|' || bool_and(active) || '|' || min(database) = '1|*/5 * * * *|true|' || current_database() from cron.job where jobname = '${JOB}'`) === "t",
          "the database does not hold exactly one active five-minute job by that name");
        return c.verdict("on the seeded cycle school, with sittings nobody touches again: pg_cron's own command for the one job, executed with no "
          + "signed-in actor, ends and scores every sitting past its deadline once (FINALIZED, closure DEADLINE, one result, one audit row) and "
          + "leaves one within its deadline open; a sitting whose ending raised is listed with its error, warned to the server log, and left open; "
          + "one whose scoring raised is kept EXPIRED with its warning; neither stops the others, and the next run picks both up; a third run "
          + "changes no sitting, result or audit row; installing the schedule twice leaves one job");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "A1-S09",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tag = randomBytes(3).toString("hex");
      muat(repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const m = d.murid;
        const jalankan = `begin; do $j$ begin execute ${PERINTAH}; end $j$; select pg_sleep(3); commit;`;
        const sebagaiTeks = (uid: string, sql: string) => `begin; select selftest.as_user_uid(${lit(uid)}); ${sql}; select pg_sleep(3); commit;`;
        const guru = psql(`select id from auth.users where email = ${lit(GURU.identitas)}`);
        // 3a. two real connections run the job at once on the same overdue sitting
        const a = mulai(m.buka.uid, d.pre, 2);
        tenggat(a, "- interval '1 hour'");
        const [j1, j2] = await Promise.all([psqlLain(jalankan), tidur(1000).then(() => psqlLain(jalankan.replace("select pg_sleep(3);", "")))]);
        c.expect(j1.ok && j2.ok && akhirSesi(a) === "FINALIZED/DEADLINE/1/1/0", `two runs at once: ${akhirSesi(a)} (${j1.err} ${j2.err})`);
        // 3b. the job races the learner's own hand-in arriving after the deadline (the lazy path), each order
        const b = mulai(m.serah.uid, d.pre, 2), b2 = mulai(m.dinilai.uid, d.pre, 2);
        tenggat(b, "- interval '1 hour'"); tenggat(b2, "- interval '1 hour'");
        const [l1, l2] = await Promise.all([psqlLain(sebagaiTeks(m.serah.uid, `select public.finish_my_session(${lit(b)}, null)`)), tidur(1000).then(() => psqlLain(jalankan.replace("select pg_sleep(3);", "")))]);
        const [l3, l4] = await Promise.all([psqlLain(jalankan), tidur(1000).then(() => psqlLain(`begin; select selftest.as_user_uid(${lit(m.dinilai.uid)}); select public.finish_my_session(${lit(b2)}, null); commit;`))]);
        c.expect(akhirSesi(b) === "FINALIZED/DEADLINE/1/1/0" && akhirSesi(b2) === "FINALIZED/DEADLINE/1/1/0",
          `the learner's late hand-in racing the job: learner first ${akhirSesi(b)} (${l1.ok ? "ok" : l1.err} / ${l2.ok ? "ok" : l2.err}); job first ${akhirSesi(b2)} (${l3.ok ? "ok" : l3.err} / ${l4.ok ? "ok" : l4.err})`);
        // 3c. the job races a teacher ending the same overdue sitting, each order: one outcome, never both
        const t1 = mulai(m.tidak.uid, d.pre, 2), t2 = mulai(m.tenggat.uid, d.pre, 2);
        tenggat(t1, "- interval '1 hour'"); tenggat(t2, "- interval '1 hour'");
        const [g1, g2] = await Promise.all([psqlLain(sebagaiTeks(guru, `select public.akhiri_pengerjaan(${lit(t1)}, 'NOT_COUNTED', 'uji A1: berlomba dengan jadwal')`)),
          tidur(1000).then(() => psqlLain(jalankan.replace("select pg_sleep(3);", "")))]);
        const [g3, g4] = await Promise.all([psqlLain(jalankan),
          tidur(1000).then(() => psqlLain(`begin; select selftest.as_user_uid(${lit(guru)}); select public.akhiri_pengerjaan(${lit(t2)}, 'NOT_COUNTED', 'uji A1: berlomba dengan jadwal'); commit;`))]);
        const satu = (x: string) => ["FINALIZED/DEADLINE/1/1/0", "TERMINATED/TEACHER_NOT_COUNTED/0/0/1", "TERMINATED/TEACHER_NOT_COUNTED/0/1/1"].includes(x);
        c.expect(satu(akhirSesi(t1)) && satu(akhirSesi(t2)),
          `a teacher's ending racing the job: teacher first ${akhirSesi(t1)} (${g1.ok ? "ok" : g1.err} / ${g2.ok ? "ok" : g2.err}); job first ${akhirSesi(t2)} (${g3.ok ? "ok" : g3.err} / ${g4.ok ? "ok" : g4.err})`);
        // the refused party in the job-first order is told the sitting had already ended (the race's own sentence)
        c.expect(akhirSesi(t2) !== "FINALIZED/DEADLINE/1/1/0" || /SITTING_ALREADY_ENDED|PR170/.test(g4.err), `the teacher who lost the race is not told the sitting had ended: ${g4.err}`);
        return c.verdict(`with real connections: two runs of the job at once on one overdue sitting end it once (${akhirSesi(a)}: one result, one audit row); `
          + `the learner's late hand-in racing the job, either order, ends it once (${akhirSesi(b)}, ${akhirSesi(b2)}); a teacher's «Akhiri tanpa menghitung» `
          + `racing the job, either order, gives one outcome and never both (teacher first ${akhirSesi(t1)}; job first ${akhirSesi(t2)}); the loser waits on the row lock and `
          + "then finds the sitting ended (status/closure/results/deadline audit rows/teacher audit rows)");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "A1-K02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // 1. Daisy's sentences, word for word, each with its English
      const KATA: Array<[string, "educator" | "staff" | "learner", string]> = [
        ["atur.buka", "educator", "Atur"],
        ["atur.keadaan.ditahan", "educator", "Ditahan"],
        ["atur.keadaan.dinilai", "educator", "Diakhiri guru · dinilai"],
        ["atur.keadaan.tidak_dihitung", "educator", "Diakhiri guru · tidak dihitung"],
        ["atur.keadaan.waktu_habis", "educator", "Waktu habis"],
        ["atur.meta.ditahan_menunggu", "educator", "Ditahan · menunggu keputusan Anda"],
        ["atur.meta.diminta", "educator", "Kesempatan tambahan diminta · menunggu persetujuan"],
        ["atur.waktu.judul", "educator", "Tambah waktu"],
        ["atur.waktu.tanya", "educator", "Tambah {n} menit untuk {nama}? Batas baru {waktu}."],
        ["atur.waktu.ok", "educator", "Waktu {nama} ditambah {n} menit. Batas baru {waktu}."],
        ["atur.akhiri.judul", "educator", "Akhiri sesi"],
        ["atur.akhiri.legenda", "educator", "Bagaimana sesi ini diakhiri?"],
        ["atur.akhiri.dinilai", "educator", "Dinilai: murid sudah selesai, tetapi belum mengumpulkan"],
        ["atur.akhiri.dinilai.arti", "educator", "Jawaban yang sudah tersimpan dinilai. Ini memakai satu kesempatan."],
        ["atur.akhiri.tidak", "educator", "Tidak dihitung: murid yang keliru, atau gangguan teknis"],
        ["atur.akhiri.tidak.arti", "educator", "Tidak ada hasil, dan tidak memakai kesempatan. Jawaban tetap tersimpan. Murid dapat memulai lagi selama jadwalnya masih terbuka."],
        ["atur.akhiri.tombol_nilai", "educator", "Akhiri dan nilai"],
        ["atur.akhiri.tombol_tidak", "educator", "Akhiri tanpa menghitung"],
        ["atur.akhiri.tanya_tidak", "educator", "Akhiri {instrumen} {nama} tanpa menghitung?"],
        ["atur.minta.judul", "educator", "Minta satu kesempatan lagi"],
        ["atur.minta.arti", "educator", "Permintaan ini dikirim untuk disetujui. Sampai disetujui, murid belum dapat mengerjakan lagi. Hasil sebelumnya tetap tersimpan dan tidak berubah."],
        ["atur.minta.sertifikat", "educator", "Karena Uji Penguasaan dapat menghasilkan sertifikat, kesempatan ini perlu disetujui orang lain."],
        ["atur.minta.tombol", "educator", "Kirim permintaan"],
        ["atur.minta.ok", "educator", "Permintaan dikirim, menunggu persetujuan."],
        ["atur.lanjut.arti", "educator", "Murid melanjutkan dengan sisa waktu yang tersimpan, {n} menit. Waktu tidak ditambah."],
        ["jadwal.buka", "educator", "Ubah jadwal"],
        ["jadwal.catatan", "educator", "Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri."],
        ["pengerjaan.galat.sitting_already_ended", "educator", "Sesi ini sudah berakhir sebelum perubahan Anda disimpan. Tidak ada yang diubah."],
        ["kesempatan.judul", "staff", "Permintaan kesempatan tambahan"],
        ["kesempatan.menunggu", "staff", "permintaan kesempatan tambahan menunggu persetujuan"],
        ["kesempatan.setujui", "staff", "Setujui"],
        ["kesempatan.tolak", "staff", "Tolak"],
        ["kesempatan.sendiri", "staff", "Anda yang meminta ini. Orang lain yang menyetujuinya."],
        ["kesempatan.kosong", "staff", "Tidak ada permintaan yang menunggu."],
        ["sync.diakhiri_guru_dinilai", "learner", "Guru Anda mengakhiri asesmen ini. Jawaban yang sudah tersimpan dinilai."],
        ["sync.diakhiri_guru_tidak_dihitung", "learner", "Guru Anda mengakhiri asesmen ini. Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada."],
        ["sync.lihat_hasil", "learner", "Lihat hasil"],
        ["sync.waktu_ditambah", "learner", "Waktu Anda ditambah {n} menit."],
        ["sync.waktu_habis", "learner", "Waktu habis. Jawaban yang sudah tersimpan sudah dinilai."],
        ["siklus.kartu.ditahan", "learner", "Asesmen ini ditahan. Guru Anda akan memutuskan kelanjutannya."],
        ["sync.lanjut_sisa", "learner", "Lanjutkan · sisa {n} menit"],
        ["siklus.kartu.tidak_dihitung", "learner", "Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada."],
        ["siklus.kartu.sekali_lagi", "learner", "{instrumen} dapat dikerjakan sekali lagi."],
      ];
      for (const [k, untuk, kalimat] of KATA) {
        c.expect(id(k, untuk) === kalimat, `${k} says «${id(k, untuk)}», not «${kalimat}»`);
        c.expect(en(k, untuk).trim() !== "" && en(k, untuk) !== k && en(k, untuk) !== kalimat, `${k} has no English`);
      }
      const hle = baca(repoRoot, "src/lib/hle.ts");
      const kunciA1 = [...hle.matchAll(/^ {2}"((?:atur|jadwal|kesempatan|siklus\.kartu|sync\.(?:diakhiri_guru|lihat_hasil|waktu_|lanjut_|mulai_lagi))[a-z_.]*)": \{ default: "((?:[^"\\]|\\.)*)"/gm)].map((m) => [m[1], m[2]] as const);
      c.expect(kunciA1.length >= 80, `${kunciA1.length} A1 screen keys were read from the copy table`);
      for (const [k, kalimat] of kunciA1) {
        // a held sitting is «ditahan»: the teacher never learns of a suspension from these screens (A1-R3)
        c.expect(!/ditangguhkan|penangguhan|suspen/i.test(kalimat), `${k} says a sitting is suspended: «${kalimat}»`);
        // the learner's register: «Anda», «Guru Anda»; never a reason, never «ditolak», never «sesi»
        if (/^(sync|siklus\.kartu)\./.test(k)) c.expect(!/ditolak|alasan|\bsesi\b|disegel/i.test(kalimat), `${k} shows a learner «${kalimat}»`);
      }
      for (const a of ["assessment_session.handed_in_by_teacher", "assessment_session.ended_by_deadline", "assessment_session.frozen", "assessment_session.resumed",
        "attempt_request.requested", "attempt_request.approved", "attempt_request.declined", "learning_assignment.window_changed"]) {
        c.expect(id(`audit.aksi.${a}`, "staff").length > 5 && id(`audit.aksi.${a}`, "staff") !== en(`audit.aksi.${a}`, "staff") && !id(`audit.aksi.${a}`, "staff").includes("audit.aksi"), `the audit action ${a} has no label in both languages`);
      }
      // the deadline's ending is never said as a hand-in, to the teacher or to the learner (O41-20)
      c.expect(!/kumpul/i.test(id("atur.keadaan.waktu_habis")) && !/kumpul/i.test(id("atur.meta.waktu_habis")) && !/kumpul/i.test(id("sync.waktu_habis", "learner")),
        "a sitting ended by its deadline is said to have been handed in");

      // 2. only the acts that apply (absent, never disabled)
      const b = (x: Partial<BarisPengerjaan>): BarisPengerjaan => ({
        person_id: "p", nama: "Murid", sesi_id: "s", jumlah_sesi: 1, keadaan: "OPEN", status: "IN_PROGRESS", mulai: "2026-11-12T02:05:00Z", tenggat: "2026-11-12T03:00:00Z",
        sisa_detik: 725, diperpanjang: 0, ditahan_sejak: null, sisa_ditahan_detik: null, murid_aktif: true, berakhir_pada: null, dihitung: true, percobaan_terpakai: 1,
        batas_percobaan: 1, percobaan_diizinkan: false, izin_belum_dipakai: false, permintaan_id: null, permintaan_status: null, permintaan_pada: null, permintaan_alasan: null,
        permintaan_oleh_saya: null, keputusan_pada: null, keputusan_alasan: null, ...x,
      });
      const sama = (x: Partial<BarisPengerjaan>, harap: string[], apa: string) =>
        c.expect(JSON.stringify(tindakanUntuk(b(x))) === JSON.stringify(harap), `${apa}: offered ${JSON.stringify(tindakanUntuk(b(x)))}; expected ${JSON.stringify(harap)}`);
      sama({}, ["waktu", "akhiri"], "an open sitting");
      sama({ tenggat: null, sisa_detik: null }, ["akhiri"], "an open sitting with no deadline");
      sama({ diperpanjang: 3 }, ["akhiri"], "an open sitting extended three times");
      sama({ keadaan: "NOT_STARTED", sesi_id: null, status: null }, [], "a learner who has not started");
      sama({ keadaan: "FROZEN", murid_aktif: false }, [], "a held sitting while the account is suspended");
      sama({ keadaan: "FROZEN", murid_aktif: true }, ["lanjut", "tutup"], "a held sitting once the learner is reinstated");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED" }, ["minta"], "handed in, the one attempt used");
      sama({ keadaan: "ENDED_BY_DEADLINE", status: "FINALIZED" }, ["minta"], "ended at its deadline, the one attempt used");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED", batas_percobaan: 2 }, [], "handed in with an attempt left");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED", batas_percobaan: null }, [], "handed in, no attempt limit");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED", permintaan_status: "PENDING" }, [], "handed in, a request waiting");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED", permintaan_status: "APPROVED", izin_belum_dipakai: true }, [], "handed in, a granted attempt not yet started");
      sama({ keadaan: "HANDED_IN", status: "FINALIZED", permintaan_status: "DECLINED" }, ["minta"], "handed in, the last request declined (the teacher may ask again)");
      sama({ keadaan: "ENDED_NOT_COUNTED", status: "TERMINATED", percobaan_terpakai: 0 }, [], "ended as not counted (the learner may start again)");

      // 3. the lines under the name, on the school's clock (WITA), with a clock of the test's own
      const o = { locale: "id" as const, zona: "Asia/Makassar", sekarang: new Date("2026-11-12T02:48:00Z") };
      const baris1 = (x: Partial<BarisPengerjaan>) => metaBaris(b(x), o).join(" | ");
      const garis = (x: Partial<BarisPengerjaan>, harap: string) => c.expect(baris1(x) === harap, `the row reads «${baris1(x)}»; expected «${harap}»`);
      garis({}, "Mulai 10.05 WITA · sisa 12 menit");
      garis({ tenggat: null, sisa_detik: null }, "Mulai 10.05 WITA");
      garis({ keadaan: "FROZEN", murid_aktif: false, sisa_ditahan_detik: 725 }, "Ditahan · sisa 12 menit");
      garis({ keadaan: "FROZEN", murid_aktif: true, sisa_ditahan_detik: 725 }, "Ditahan · menunggu keputusan Anda");
      garis({ keadaan: "HANDED_IN", berakhir_pada: "2026-11-12T02:41:00Z" }, "Dikumpulkan 10.41 WITA");
      garis({ keadaan: "ENDED_SCORED", berakhir_pada: "2026-11-12T02:40:00Z" }, "Diakhiri 10.40 WITA · jawaban yang ada dinilai");
      garis({ keadaan: "ENDED_NOT_COUNTED", berakhir_pada: "2026-11-12T02:40:00Z" }, "Diakhiri 10.40 WITA · tidak dihitung, tidak memakai kesempatan");
      garis({ keadaan: "ENDED_BY_DEADLINE", berakhir_pada: "2026-11-12T02:45:00Z" }, "Berakhir 10.45 WITA · jawaban yang ada dinilai");
      garis({ keadaan: "HANDED_IN", berakhir_pada: "2026-11-11T02:41:00Z" }, "Dikumpulkan 11 Nov 2026, 10.41 WITA");
      garis({ keadaan: "HANDED_IN", berakhir_pada: "2026-11-12T02:41:00Z", permintaan_status: "PENDING" }, "Dikumpulkan 10.41 WITA | Kesempatan tambahan diminta · menunggu persetujuan");
      garis({ keadaan: "HANDED_IN", berakhir_pada: "2026-11-12T02:41:00Z", permintaan_status: "DECLINED", keputusan_alasan: "belum perlu {n}" }, "Dikumpulkan 10.41 WITA | Permintaan ditolak · belum perlu {n}");
      garis({ keadaan: "HANDED_IN", berakhir_pada: "2026-11-12T02:41:00Z", permintaan_status: "APPROVED", izin_belum_dipakai: true, keputusan_pada: "2026-11-12T02:45:00Z" },
        "kesempatan tambahan | Kesempatan tambahan disetujui 12 Nov 2026");
      garis({ percobaan_diizinkan: true, permintaan_status: "APPROVED", keputusan_pada: "2026-11-12T02:00:00Z" }, "Mulai 10.05 WITA · sisa 12 menit · kesempatan tambahan | Kesempatan tambahan disetujui 12 Nov 2026");
      c.expect(lencanaA1(b({ keadaan: "FROZEN" })) === "ditahan" && lencanaA1(b({ keadaan: "ENDED_SCORED" })) === "dinilai" && lencanaA1(b({ keadaan: "ENDED_NOT_COUNTED" })) === "tidak_dihitung"
        && lencanaA1(b({ keadaan: "ENDED_BY_DEADLINE" })) === "waktu_habis" && lencanaA1(b({ keadaan: "OPEN" })) === null && lencanaA1(b({ keadaan: "HANDED_IN" })) === null,
        "a row's Badge is not the sitting's own state");

      // 4. three endings, three notices (A1-B1), told apart by the refusal's DETAIL and by pengerjaan_saya
      const kunciAkhir = Object.values(KUNCI_AKHIR_PEMAIN);
      c.expect(new Set(kunciAkhir).size === 4 && new Set(kunciAkhir.map((k) => id(k, "learner"))).size === 4, "two endings share a notice");
      c.expect(akhirDariGalat("PR002", "SESSION_ENDED_SCORED") === "dinilai" && akhirDariGalat("PR002", "SESSION_ENDED_NOT_COUNTED") === "tidak_dihitung"
        && akhirDariGalat("PR003", "SESSION_ENDED_NOT_COUNTED") === "tidak_dihitung" && akhirDariGalat("PR003", "SESSION_ENDED_BY_SCHOOL") === "sekolah"
        && akhirDariGalat("PR002", "SESSION_FINALIZED") === null && akhirDariGalat("PR002", null) === null, "a refusal's code and DETAIL do not name its ending");
      const k = (x: Partial<PengerjaanSaya>): PengerjaanSaya => ({ status: "IN_PROGRESS", ditahan: false, penutupan: null, dihitung: true, tenggat: null, diperpanjang: 0, percobaan_diizinkan: false, ...x });
      c.expect(akhirDariKeadaan(k({ status: "FINALIZED", penutupan: "TEACHER_SCORED" })) === "dinilai" && akhirDariKeadaan(k({ status: "TERMINATED", penutupan: "TEACHER_NOT_COUNTED" })) === "tidak_dihitung"
        && akhirDariKeadaan(k({ status: "TERMINATED", penutupan: "ASSIGNMENT_ENDED" })) === "sekolah" && akhirDariKeadaan(k({ status: "FINALIZED", penutupan: "DEADLINE" })) === "waktu_habis"
        && akhirDariKeadaan(k({ status: "EXPIRED", penutupan: "DEADLINE" })) === null && akhirDariKeadaan(k({})) === null && akhirDariKeadaan(k({ status: "FINALIZED" })) === null,
        "pengerjaan_saya's answer does not name the ending the open player must say");
      const ip = baca(repoRoot, "src/app/belajar/_components/ItemPlayer.tsx");
      c.expect(/if \(!r\.ok && r\.detail === "SESSION_ENDED_NOT_COUNTED"\) \{ akhiri\("tidak_dihitung"\); return; \}\s*\n\s*if \(!r\.ok && r\.code === "PR003"\)/.test(ip),
        "a hand-in refused SESSION_ENDED_NOT_COUNTED is said with the assignment's «tidak dinilai» notice");
      c.expect(/akhir === "dinilai" \|\| akhir === "waktu_habis" \? <> <Link className="pin-tautan" href=\{finishHref\} data-akhir-hasil="">\{kata\("sync\.lihat_hasil"\)\}/.test(ip)
        && /akhir === "tidak_dihitung" \? <> <Link className="pin-tautan" href="\/belajar" data-akhir-kembali="">\{kata\("tolak\.kembali"\)\}/.test(ip),
        "a scored ending does not lead to the result, or a not-counted one back to Belajar");
      // A1-R1: the open player asks every 45 seconds and on every send; added time is a status line that takes no focus
      c.expect(/window\.setInterval\(\(\) => \{ void periksaKeadaan\(\); \}, 45_000\)/.test(ip) && /if \(o !== "offline"\) void periksaKeadaan\(\);/.test(ip),
        "the open player does not ask how its sitting stands every 45 seconds and on every send");
      c.expect(/role="status" data-waktu-ditambah=\{tambahan\}>\{kata\("sync\.waktu_ditambah"\)/.test(ip), "added time is not said in a status line");
      c.expect(/rpc\("pengerjaan_saya", \{ p_session: sessionId \}\)/.test(baca(repoRoot, "src/app/belajar/actions.ts")), "the player's check does not ask pengerjaan_saya");
      // a chapter's card: held, resumed, not counted, at its deadline, one more attempt; nothing for a waiting or declined request
      const cat = (st: string | null, x: Partial<PengerjaanSaya> | null, izin = false) => catatanDari("POST_TEST", st, x ? k(x) : null, izin, Date.parse("2026-11-12T02:48:00Z"))?.jenis ?? null;
      c.expect(cat("IN_PROGRESS", { ditahan: true }) === "ditahan" && cat("IN_PROGRESS", { dilanjutkan: true, tenggat: "2026-11-12T03:00:00Z" }) === "lanjut"
        && catatanDari("POST_TEST", "IN_PROGRESS", k({ dilanjutkan: true, tenggat: "2026-11-12T03:00:30Z" }), false, Date.parse("2026-11-12T02:48:00Z"))?.sisaMenit === 12
        && cat("IN_PROGRESS", {}) === null && cat("TERMINATED", { status: "TERMINATED", penutupan: "TEACHER_NOT_COUNTED" }) === "tidak_dihitung"
        && cat("FINALIZED", { status: "FINALIZED", penutupan: "DEADLINE" }) === "waktu_habis" && cat("FINALIZED", { status: "FINALIZED" }, true) === "sekali_lagi"
        && cat("FINALIZED", { status: "FINALIZED" }) === null && cat("TERMINATED", { status: "TERMINATED", penutupan: "ASSIGNMENT_ENDED" }) === null,
        "a chapter's card does not read its sitting's state");

      // 5. the pages: the list is asked only for an academic class; one link per row, only where an act applies; the panel's acts
      const hal = baca(repoRoot, "src/app/mengajar/[kelas]/siapa/page.tsx");
      c.expect(/adaBuktiSoal\(ctx\.ini\.jenis\) \? daftarPengerjaan\(id, tugasId\) : Promise\.resolve\(null\)/.test(hal), "a professional-learning class asks the teacher's list (and so could show «Atur»)");
      c.expect(/tindakanUntuk\(petaA1\.get\(m\.id\)!\)\.length > 0 \? \(\s*<Link key="a" className="pin-tautan" href=\{`\$\{dasar\}&sesi=\$\{petaA1\.get\(m\.id\)!\.sesi_id\}#atur`\}/.test(hal),
        "«Atur» is drawn for a row no act applies to, or does not open the panel under the list");
      c.expect(/aria-current=\{x\.id === tugasId \? "page" : undefined\}/.test(hal), "the instrument choice does not mark the chosen instrument");
      const panel = baca(repoRoot, "src/components/mengajar/AturPengerjaan.tsx");
      c.expect(!/defaultChecked/.test(panel) && /<input type="radio" name="cara" value=\{nilai\} required/.test(panel), "«Akhiri sesi» has a default, or does not require the choice");
      for (const [tindakan, bahaya] of [["waktu", true], ["akhiri", true], ["tutup", true], ["lanjut", false], ["minta", false]] as const) {
        const bagian = new RegExp(`data-atur-tindakan="${tindakan}"[\\s\\S]*?</form>`).exec(panel)?.[0] ?? "";
        c.expect(bagian !== "" && /\{alasan\("/.test(bagian), `the «${tindakan}» act has no reason field`);
        c.expect(bahaya ? /<KonfirmasiBahaya\b/.test(bagian) && !/<TombolKirim/.test(bagian) : /<TombolKirim className="pin-btn pin-primary"/.test(bagian) && !/KonfirmasiBahaya/.test(bagian),
          `the «${tindakan}» act is ${bahaya ? "not the destructive confirmation" : "drawn as destructive"}`);
      }
      c.expect(/MENIT_TAMBAHAN\.map\(\(n\) => \(\s*<div key=\{n\} className="pin-actions" data-menit-untuk=\{n\}>\s*<KonfirmasiBahaya/.test(panel),
        "«Tambah waktu» does not say each choice's minutes and new deadline back in its confirmation");
      const aksi = baca(repoRoot, "src/app/mengajar/pengerjaan-aksi.ts");
      for (const [f, arg] of [["tambah_waktu_pengerjaan", "p_session, p_menit, p_alasan"], ["akhiri_pengerjaan", "p_session, p_cara, p_alasan"], ["minta_percobaan", "p_session, p_alasan"],
        ["lanjutkan_pengerjaan", "p_session, p_catatan"], ["tutup_pengerjaan_ditahan", "p_session, p_alasan"], ["ubah_jadwal_penugasan", "p_la, p_dari, p_sampai, p_alasan"]] as const) {
        const dikirim = [...(new RegExp(`rpc\\("${f}", \\{([\\s\\S]*?)\\}\\)`).exec(aksi)?.[1] ?? "").matchAll(/(p_\w+):/g)].map((m) => m[1]).join(", ");
        c.expect(dikirim === arg, `${f} is sent ${dikirim || "nothing"}; it takes ${arg}`);
      }
      const antre = baca(repoRoot, "src/components/kesempatan/DaftarAntrean.tsx");
      c.expect(/\{r\.milik_sendiri \? \(\s*<p className="pin-sub" data-kesempatan-sendiri="">\{s\("kesempatan\.sendiri"\)\}<\/p>\s*\) : \(\s*<form action=\{putuskanKesempatanAksi\}/.test(antre),
        "the requester's own row carries the decision's form");
      return c.verdict(`${KATA.length} of Daisy's sentences are in the copy table word for word, each with its English; no A1 sentence says a sitting is suspended and no learner sentence `
        + "shows a reason, «ditolak» or «sesi»; the deadline's ending is never said as a hand-in; the eight new audit actions have labels; tindakanUntuk offers only the acts that "
        + "apply; metaBaris writes the row's lines on the school's clock; the three endings and the deadline's are four notices, told apart by the refusal's DETAIL and by "
        + "pengerjaan_saya; the open player asks every 45 seconds and on every send; a professional-learning class asks no list; one «Atur» per row where an act applies; every act "
        + "has its reason and the destructive ones the destructive confirmation; each action sends its function's declared arguments; the requester's own row has no form");
    },
  },
  {
    id: "A1-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const m = d.murid;
        // the states: an open sitting (30 minutes left), a hand-in, three more open ones for the acts, one past its
        // deadline, one held by a suspension, and one handed in whose one attempt is used
        const s: Record<string, string> = {};
        for (const [n, jawab] of [["buka", 1], ["serah", 5], ["dinilai", 2], ["tidak", 2], ["tenggat", 2], ["tahan", 2], ["lagi", 5]] as const) s[n] = mulai(m[n].uid, d.pre, jawab);
        if (!c.expect(Object.values(s).every((x) => /^[0-9a-f-]{36}$/.test(x)), `the learners' sittings could not be started: ${JSON.stringify(s)}`)) return c.verdict("");
        for (const n of ["serah", "lagi"]) sebagai(m[n].uid, `select public.finish_my_session(${lit(s[n])}, null)`);
        for (const n of ["buka", "dinilai", "tidak", "tahan"]) tenggat(s[n], "+ interval '30 minutes 30 seconds'");
        tenggat(s.tenggat, "- interval '1 hour'");
        sebagaiEmail("sysadmin@synthetic.pintar.test", `select public.tangguhkan_akun(${lit(m.tahan.pid)}, 'ADMINISTRATIVE', 'uji A1: penangguhan sementara')`);
        // a professional-learning class with a sitting under way (of the learner who has none in the academic class)
        psql(`begin; set local session_replication_role = replica;
          insert into public.assessment_sessions (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, plp_release_id, assessment_definition_id,
            assessment_definition_version, engine_version, scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed, started_at, authoritative_deadline,
            deadline_extended_count, assessment_assignment_id)
          select gen_random_uuid(), ${lit(m.belum.pid)}, x.institution_id, (select e.id from public.enrollments e where e.person_id = ${lit(m.belum.pid)}), x.academic_period_id, ${lit(d.pd)}, x.plp_release_id, x.assessment_definition_id,
                 x.assessment_definition_version, x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'IN_PROGRESS', x.shuffle_seed, now(),
                 now() + interval '30 minutes', 0, ${lit(d.pdAa)} from public.assessment_sessions x where x.id = ${lit(s.buka)}; commit;`);

        const guru0 = await masuk(asal, GURU, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Komputer;

        // ---- the list, with every state, the instrument choice, and «Atur» only where an act applies
        const h = await (await guru.halaman(siapa(d))).text();
        const lencanaDi = (html: string, nama: string) => /data-keadaan="([a-z_]+)"/.exec(baris(html, nama))?.[1] ?? "";
        const lencana = (nama: string) => lencanaDi(h, nama);
        const garis = (html: string, nama: string) => [...baris(html, nama).matchAll(/data-atur-meta="">([\s\S]*?)<\/span>/g)].map((x) => teks(x[1]).trim()).join(" | ");
        const atur = (html: string, nama: string) => /data-atur-buka="([0-9a-f-]{36})"/.exec(baris(html, nama))?.[1] ?? "";
        const harap: Record<string, [string, RegExp, boolean]> = {
          belum: ["belum", /^$/, false],
          buka: ["sedang", /^Mulai \d\d\.\d\d \S+ · sisa (29|30) menit$/, true],
          serah: ["sudah", /^Dikumpulkan \d\d\.\d\d \S+$/, true],
          dinilai: ["sedang", /^Mulai \d\d\.\d\d \S+ · sisa (29|30) menit$/, true],
          tenggat: ["waktu_habis", /^Berakhir .*\d\d\.\d\d \S+ · jawaban yang ada dinilai$/, true],
          tahan: ["ditahan", /^Ditahan · sisa (29|30) menit$/, false],
          lagi: ["sudah", /^Dikumpulkan \d\d\.\d\d \S+$/, true],
        };
        for (const [n, [l, g, a]] of Object.entries(harap)) {
          c.expect(lencana(m[n].nama) === l && g.test(garis(h, m[n].nama)) && Boolean(atur(h, m[n].nama)) === a,
            `${n}: Badge ${lencana(m[n].nama)}, line «${garis(h, m[n].nama)}», «Atur» ${atur(h, m[n].nama) ? "offered" : "absent"}; expected ${l}, ${g}, ${a ? "offered" : "absent"}`);
        }
        c.expect(/Ditahan/.test(teks(baris(h, m.tahan.nama))) && !/ditangguhkan|penangguhan/i.test(teks(h)), "the held row does not say «Ditahan», or the page says a sitting is suspended");
        c.expect(/Waktu habis/.test(teks(baris(h, m.tenggat.nama))) && !/kumpul/i.test(teks(baris(h, m.tenggat.nama))), "the sitting past its deadline is not «Waktu habis», or is said to have been handed in");
        const nav = /<nav[^>]*data-instrumen=""[\s\S]*?<\/nav>/.exec(rapi(h))?.[0] ?? "";
        c.expect(/aria-current="page"[^>]*data-instrumen-mode="PRE_TEST"/.test(nav) && nav.includes(`penugasan=${d.post}`) && teks(nav).includes("Pemetaan Awal") && teks(nav).includes("Uji Penguasaan"),
          `the instrument choice is not drawn with the Pemetaan Awal current: ${teks(nav)}`);
        c.expect(!(rapi(h).match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).some((r) => /\d\s?%|\bskor\b|\bnilai \d/i.test(teks(r))), "a row of the list carries a score");
        c.expect(!h.includes('data-atur="'), "a panel is open before any «Atur» was pressed");

        // ---- «Atur» on an open sitting: extra time and ending it, and nothing else
        const hp = await (await guru.halaman(`${siapa(d)}&sesi=${s.buka}`)).text();
        const panel = /<section[^>]*data-atur="[0-9a-f-]{36}"[\s\S]*?<\/section>/.exec(rapi(hp))?.[0] ?? "";
        const tindakan = (html: string) => [...html.matchAll(/data-atur-tindakan="([a-z]+)"/g)].map((x) => x[1]).join(",");
        c.expect(tindakan(panel) === "waktu,akhiri" && teks(panel).includes(`Atur · ${m.buka.nama}`), `an open sitting's panel offers ${tindakan(panel)}: ${teks(panel).slice(0, 120)}`);
        const polos = teks(panel.replace(/<\/?strong>/g, ""));
        c.expect(polos.includes("Bagaimana sesi ini diakhiri?") && polos.includes("Dinilai: murid sudah selesai, tetapi belum mengumpulkan")
          && polos.includes("Tidak dihitung: murid yang keliru, atau gangguan teknis") && (panel.match(/<input\b[^>]*\bname="cara"[^>]*>/g) ?? []).filter((x) => /type="radio"/.test(x) && /\brequired\b/.test(x) && !/\bchecked\b/.test(x)).length === 2, "«Akhiri sesi» does not ask the two ways with no default");
        c.expect(/data-bahaya-buka=""[^>]*>Akhiri dan nilai</.test(panel) && /data-bahaya-buka=""[^>]*>Akhiri tanpa menghitung</.test(panel) && /data-bahaya-buka=""[^>]*>Tambah waktu</.test(panel),
          "the acts do not open as the destructive confirmation");
        // a refusal: a short reason changes nothing and is said beside the act
        const f0 = formDengan(hp, 'data-atur-tindakan="waktu"', { menit: "10", alasan: "pendek" });
        if (!c.expect(typeof f0 !== "string", `the «Tambah waktu» form: ${f0}`)) return c.verdict("");
        const r0 = await guru.kirim(siapa(d), { form: f0 as Record<string, string> });
        c.expect(/kode=SITTING_REASON_REQUIRED/.test(ke(r0)) && /tindakan=waktu/.test(ke(r0)) && ke(r0).endsWith("#atur"), `a 6-character reason: ${r0.status} ${ke(r0)}`);
        const h0 = await (await guru.halaman(ke(r0))).text();
        c.expect(teks(/data-atur-tindakan="waktu"[\s\S]*?<\/form>/.exec(rapi(h0))?.[0] ?? "").includes("Tuliskan alasannya, 10 sampai 300 karakter."), "the refusal's sentence is not beside «Tambah waktu»");
        // extra time: ten minutes, said back with the new deadline on the school's clock
        const sebelum = psql(`select authoritative_deadline from public.assessment_sessions where id = ${lit(s.buka)}`);
        const r1 = await guru.kirim(siapa(d), { form: { ...(f0 as Record<string, string>), alasan: ALASAN } });
        const sesudah = psql(`select (authoritative_deadline = ${lit(sebelum)}::timestamptz + interval '10 minutes')::text || '|' || deadline_extended_count from public.assessment_sessions where id = ${lit(s.buka)}`);
        c.expect(/hasil=waktu/.test(ke(r1)) && sesudah === "true|1", `«Tambah waktu»: ${r1.status} ${ke(r1)}; the deadline moved by ten minutes and counted once: ${sesudah}`);
        const h1 = await (await guru.halaman(ke(r1))).text();
        c.expect(new RegExp(`Waktu ${m.buka.nama} ditambah 10 menit\\. Batas baru \\d\\d\\.\\d\\d \\S+\\.`).test(teks(h1)), "the result line does not say the minutes and the new deadline");
        c.expect(/sisa (39|40) menit/.test(garis(h1, m.buka.nama)), `the row does not show the added time: «${garis(h1, m.buka.nama)}»`);

        // ---- the race: the sitting ended (the learner handed in) between opening the panel and confirming
        const hr = await (await guru.halaman(`${siapa(d)}&sesi=${s.dinilai}`)).text();
        const fr = formDengan(hr, 'data-atur-tindakan="akhiri"', { cara: "SCORED", alasan: ALASAN });
        const fk = formDengan(hr, 'data-atur-tindakan="akhiri"', { alasan: ALASAN });
        const rk = await guru.kirim(siapa(d), { form: fk as Record<string, string> });
        c.expect(/kode=SITTING_END_KIND_INVALID/.test(ke(rk)), `ending with neither way chosen: ${rk.status} ${ke(rk)}`);
        // (the learner «tidak» hands in while the teacher's panel for them is open)
        const ht = await (await guru.halaman(`${siapa(d)}&sesi=${s.tidak}`)).text();
        const ft = formDengan(ht, 'data-atur-tindakan="akhiri"', { cara: "NOT_COUNTED", alasan: ALASAN });
        sebagai(m.tidak.uid, `select public.finish_my_session(${lit(s.tidak)}, null)`);
        const rt = await guru.kirim(siapa(d), { form: ft as Record<string, string> });
        c.expect(/kode=SITTING_ALREADY_ENDED/.test(ke(rt)), `the teacher's ending arriving after the learner handed in: ${rt.status} ${ke(rt)}`);
        const hts = await (await guru.halaman(ke(rt))).text();
        c.expect(teks(hts).includes("Sesi ini sudah berakhir sebelum perubahan Anda disimpan. Tidak ada yang diubah.")
          && psql(`select status || '|' || coalesce(closure_kind, '-') from public.assessment_sessions where id = ${lit(s.tidak)}`) === "FINALIZED|-",
          "the race is not said in its own sentence, or the learner's hand-in was changed");

        // ---- «Akhiri sesi», scored: a hand-in on the learner's behalf
        const rs = await guru.kirim(siapa(d), { form: fr as Record<string, string> });
        const scored = psql(`select s.status || '|' || s.closure_kind || '|' || (select count(*) from public.assessment_results r where r.session_id = s.id) from public.assessment_sessions s where s.id = ${lit(s.dinilai)}`);
        c.expect(/hasil=dinilai/.test(ke(rs)) && scored === "FINALIZED|TEACHER_SCORED|1", `«Akhiri dan nilai»: ${rs.status} ${ke(rs)}; the sitting is ${scored}`);
        const hs = await (await guru.halaman(ke(rs))).text();
        c.expect(teks(hs).includes(`Sesi ${m.dinilai.nama} diakhiri. Jawaban yang ada dinilai.`) && /data-keadaan="dinilai"/.test(baris(hs, m.dinilai.nama))
          && /^Diakhiri \d\d\.\d\d \S+ · jawaban yang ada dinilai$/.test(garis(hs, m.dinilai.nama)) && teks(baris(hs, m.dinilai.nama)).includes("Diakhiri guru · dinilai"),
          `the scored ending is not confirmed and shown on its row: «${garis(hs, m.dinilai.nama)}»`);

        // ---- «Akhiri sesi», not counted, on the sitting that got extra time; then nothing to request (the learner may start again)
        const hb = await (await guru.halaman(`${siapa(d)}&sesi=${s.buka}`)).text();
        const rb = await guru.kirim(siapa(d), { form: formDengan(hb, 'data-atur-tindakan="akhiri"', { cara: "NOT_COUNTED", alasan: ALASAN }) as Record<string, string> });
        const tak = psql(`select s.status || '|' || s.termination_cause || '|' || s.closure_kind || '|' || (select count(*) from public.assessment_results r where r.session_id = s.id) from public.assessment_sessions s where s.id = ${lit(s.buka)}`);
        c.expect(/hasil=tidak_dihitung/.test(ke(rb)) && tak === "TERMINATED|ADMINISTRATIVE_TERMINATION|TEACHER_NOT_COUNTED|0", `«Akhiri tanpa menghitung»: ${rb.status} ${ke(rb)}; the sitting is ${tak}`);
        const hb2 = await (await guru.halaman(ke(rb))).text();
        c.expect(teks(hb2).includes(`Sesi ${m.buka.nama} diakhiri tanpa dihitung. Tidak memakai kesempatan.`) && /data-keadaan="tidak_dihitung"/.test(baris(hb2, m.buka.nama))
          && /^Diakhiri \d\d\.\d\d \S+ · tidak dihitung, tidak memakai kesempatan$/.test(garis(hb2, m.buka.nama)) && !atur(hb2, m.buka.nama),
          `the not-counted ending is not confirmed and shown, or still offers «Atur»: «${garis(hb2, m.buka.nama)}», Badge ${lencanaDi(hb2, m.buka.nama)}, «Atur» ${atur(hb2, m.buka.nama) || "absent"}, result «${teks(/id="pin-siapa-hasil"[\s\S]{0,300}/.exec(rapi(hb2))?.[0] ?? "").slice(0, 160)}»`);
        c.expect(psql(`select count(*) from public.audit_log where target_id in (${lit(s.buka)}, ${lit(s.dinilai)}) and action in ('assessment_session.deadline_extended', 'assessment_session.terminated', 'assessment_session.handed_in_by_teacher') and summary ->> 'reason' = ${lit(ALASAN)}`) === "3",
          "the three acts are not each audited with their reason");

        // ---- a held sitting: nothing while the account is suspended; «Lanjutkan» and «Akhiri tanpa menghitung» once reinstated
        const hh = await (await guru.halaman(`${siapa(d)}&sesi=${s.tahan}`)).text();
        c.expect(tindakan(/<section[^>]*data-atur="[\s\S]*?<\/section>/.exec(rapi(hh))?.[0] ?? "") === "", "a held sitting offers an act while its learner is still suspended");
        sebagaiEmail("sysadmin@synthetic.pintar.test", `select public.aktifkan_kembali_akun(${lit(m.tahan.pid)}, ${lit(ALASAN)})`);
        const hh2 = await (await guru.halaman(`${siapa(d)}&sesi=${s.tahan}`)).text();
        const panelTahan = /<section[^>]*data-atur="[\s\S]*?<\/section>/.exec(rapi(hh2))?.[0] ?? "";
        c.expect(garis(hh2, m.tahan.nama) === "Ditahan · menunggu keputusan Anda" && Boolean(atur(hh2, m.tahan.nama)) && tindakan(panelTahan) === "lanjut,tutup"
          && /Murid melanjutkan dengan sisa waktu yang tersimpan, (29|30) menit\. Waktu tidak ditambah\./.test(teks(panelTahan)),
          `a held sitting after reinstatement: «${garis(hh2, m.tahan.nama)}», acts ${tindakan(panelTahan)}`);
        const rl = await guru.kirim(siapa(d), { form: formDengan(hh2, 'data-atur-tindakan="lanjut"', { alasan: ALASAN }) as Record<string, string> });
        const lanjut = psql(`select (s.unfrozen_at is not null)::text || '|' || s.status || '|' || (s.authoritative_deadline <= now() + make_interval(secs => s.frozen_remaining_seconds))::text from public.assessment_sessions s where s.id = ${lit(s.tahan)}`);
        c.expect(/hasil=dilanjutkan/.test(ke(rl)) && lanjut === "true|IN_PROGRESS|true", `«Lanjutkan»: ${rl.status} ${ke(rl)}; the sitting is ${lanjut}`);
        const hl = await (await guru.halaman(ke(rl))).text();
        c.expect(teks(hl).includes(`Sesi ${m.tahan.nama} dilanjutkan dengan sisa waktu yang tersimpan.`) && /^Mulai .* · sisa (29|30) menit$/.test(garis(hl, m.tahan.nama)),
          `the resumed sitting is not confirmed and shown open with its preserved time: «${garis(hl, m.tahan.nama)}»`);

        // ---- one more attempt: a request, from the row of a learner whose one attempt is used
        const hm = await (await guru.halaman(`${siapa(d)}&sesi=${s.lagi}`)).text();
        const panelMinta = /<section[^>]*data-atur="[\s\S]*?<\/section>/.exec(rapi(hm))?.[0] ?? "";
        c.expect(tindakan(panelMinta) === "minta" && teks(panelMinta).includes("Sampai disetujui, murid belum dapat mengerjakan lagi.") && !teks(panelMinta).includes("dapat menghasilkan sertifikat")
          && />Kirim permintaan</.test(panelMinta.replace(/<!-- -->/g, "")) && !/data-bahaya-buka/.test(panelMinta), `the request's panel: ${tindakan(panelMinta)}`);
        const rm = await guru.kirim(siapa(d), { form: formDengan(hm, 'data-atur-tindakan="minta"', { alasan: ALASAN }) as Record<string, string> });
        const hm2 = await (await guru.halaman(ke(rm))).text();
        c.expect(/hasil=diminta/.test(ke(rm)) && teks(hm2).includes("Permintaan dikirim, menunggu persetujuan.") && garis(hm2, m.lagi.nama).endsWith("Kesempatan tambahan diminta · menunggu persetujuan")
          && !atur(hm2, m.lagi.nama) && psql(`select status from public.attempt_requests where session_id = ${lit(s.lagi)}`) === "PENDING",
          `the request: ${rm.status} ${ke(rm)}; the row reads «${garis(hm2, m.lagi.nama)}»`);

        // ---- the Uji Penguasaan's list is its own; a professional-learning class shows no «Atur»; another class's teacher is refused
        const hpost = await (await guru.halaman(siapa(d, d.post))).text();
        c.expect(/aria-current="page"[^>]*data-instrumen-mode="POST_TEST"/.test(rapi(hpost)) && !/data-atur-buka/.test(hpost) && /data-keadaan="belum"/.test(baris(hpost, m.serah.nama)),
          "the Uji Penguasaan's list is not its own (nobody has started it)");
        const hpd = await (await guru.halaman(`/mengajar/${d.pd}/siapa?penugasan=${d.pdAa}`)).text();
        c.expect(teks(hpd).includes(m.belum.nama) && /data-keadaan="sedang"/.test(baris(hpd, m.belum.nama)) && !/data-atur-buka|data-atur-meta/.test(hpd),
          "a professional-learning class's list offers «Atur», or is not drawn");
        const alpha = psql(`select id from public.institutions where slug like 'synth-alpha-%' and is_active order by created_at desc limit 1`);
        const lain0 = await masuk(asal, GURU_LAIN, `MENGAJAR:${alpha}`);
        if (c.expect(typeof lain0 !== "string", String(lain0))) {
          const hx = await (lain0 as Komputer).halaman(`${siapa(d)}&sesi=${s.tahan}`);
          const tx = hx.status === 200 ? await hx.text() : "";
          c.expect(!tx.includes(m.tahan.nama) && !/data-atur-buka|data-atur=/.test(tx), `another school's teacher reads this class's list (${hx.status})`);
        }

        // ---- «Ubah jadwal» on the class page's material row
        const hk = await (await guru.halaman(`/mengajar/${d.kelas}`)).text();
        c.expect(hk.includes(`data-jadwal-buka="${d.la}"`) && hk.includes(`data-akhiri-buka="${d.la}"`), "the material's row does not offer «Ubah jadwal» beside «Akhiri atau tarik»");
        // (the school is put on WITA for this part, and back afterwards: a time is typed and stored on the school's own clock)
        const zonaAsal = psql(`select zona_waktu from public.institutions where id = ${lit(d.inst)}`);
        psql(`begin; set local session_replication_role = replica; update public.institutions set zona_waktu = 'Asia/Makassar' where id = ${lit(d.inst)}; commit;`);
        try {
          const hj = await (await guru.halaman(`/mengajar/${d.kelas}?jadwal=${d.la}`)).text();
          const fj = /<form[^>]*data-jadwal="[\s\S]*?<\/form>/.exec(rapi(hj))?.[0] ?? "";
          c.expect(/Ubah jadwal · /.test(teks(fj)) && /Mulai \(WITA\)/.test(teks(fj)) && /Sampai \(WITA\)/.test(teks(fj))
            && (fj.match(/<input[^>]*type="datetime-local"[^>]*>/g) ?? []).length === 2 && /class="pin-gema"/.test(fj)
            && teks(fj).includes("Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri."), `the «Ubah jadwal» panel (a date and a time each, labelled WITA, with the echo): ${teks(fj).slice(0, 240)}`);
          const hari = (n: number) => psql(`select ((now() at time zone 'Asia/Makassar')::date + ${n})::text`);
          const tetap = psql(`select authoritative_deadline from public.assessment_sessions where id = ${lit(s.tahan)}`);
          const rj0 = await guru.kirim(`/mengajar/${d.kelas}`, { form: formDengan(hj, `data-jadwal="${d.la}"`, { mulai: `${hari(-2)}T07:30`, sampai: `${hari(-1)}T10:00`, alasan: ALASAN }) as Record<string, string> });
          c.expect(/kode=WINDOW_INVALID/.test(ke(rj0)) && ke(rj0).endsWith("#jadwal"), `a window that has already closed: ${rj0.status} ${ke(rj0)}`);
          c.expect(teks(await (await guru.halaman(ke(rj0))).text()).includes("Waktu tutup harus setelah waktu buka dan setelah saat ini."), "the refused window's sentence is not on the panel");
          const rjx = await guru.kirim(`/mengajar/${d.kelas}`, { form: formDengan(hj, `data-jadwal="${d.la}"`, { mulai: `${hari(-2)}T07:30`, sampai: `${hari(9)}T25:99`, alasan: ALASAN }) as Record<string, string> });
          c.expect(/kode=WINDOW_INVALID/.test(ke(rjx)), `a closing time that is not a time is read as «no end»: ${rjx.status} ${ke(rjx)}`);
          // 07.30 and 15.45 WITA are 23.30 and 07.45 UTC: stored as those instants, to the minute, on the lesson and both assessments
          const rj = await guru.kirim(`/mengajar/${d.kelas}`, { form: formDengan(hj, `data-jadwal="${d.la}"`, { mulai: `${hari(-2)}T07:30`, sampai: `${hari(9)}T15:45`, alasan: ALASAN }) as Record<string, string> });
          const harap = `${psql(`select (${lit(hari(-2) + " 07:30")}::timestamp at time zone 'Asia/Makassar')::text`)}|${psql(`select (${lit(hari(9) + " 15:45")}::timestamp at time zone 'Asia/Makassar')::text`)}`;
          const jadwal = psql(`select la.available_from::text || '|' || la.available_until::text || '|'
              || (select count(*) from public.assessment_assignments aa where aa.learning_assignment_id = la.id and aa.opens_at = la.available_from and aa.closes_at = la.available_until)
              || '|' || (select (s.authoritative_deadline = ${lit(tetap)}::timestamptz)::text from public.assessment_sessions s where s.id = ${lit(s.tahan)})
              || '|' || (select count(*) from public.audit_log l where l.action = 'learning_assignment.window_changed' and l.target_id = la.id::text and l.summary ->> 'reason' = ${lit(ALASAN)})
            from public.learning_assignments la where la.id = ${lit(d.la)}`);
          c.expect(/jadwal_diubah=ok/.test(ke(rj)) && jadwal === `${harap}|2|true|1`,
            `«Ubah jadwal» with times in WITA: ${rj.status} ${ke(rj)}; stored from|until|both assessments|the open sitting's deadline kept|audited: ${jadwal}; expected ${harap}|2|true|1`);
          const hsesudah = teks(await (await guru.halaman(ke(rj))).text());
          c.expect(hsesudah.includes("Jadwal diubah. Murid yang sedang mengerjakan tetap memakai batas waktunya sendiri."), "the class page does not confirm the new schedule");
          const hj2 = await (await guru.halaman(`/mengajar/${d.kelas}?jadwal=${d.la}`)).text();
          c.expect(new RegExp(`id="jadwal-mulai"[^>]*value="${hari(-2)}T07:30"|value="${hari(-2)}T07:30"[^>]*id="jadwal-mulai"`).test(rapi(hj2))
            && new RegExp(`id="jadwal-sampai"[^>]*value="${hari(9)}T15:45"|value="${hari(9)}T15:45"[^>]*id="jadwal-sampai"`).test(rapi(hj2)),
            "the panel opened again does not show the stored times on the school's clock");
        } finally {
          psql(`begin; set local session_replication_role = replica; update public.institutions set zona_waktu = ${lit(zonaAsal)} where id = ${lit(d.inst)}; commit;`);
        }
        return c.verdict("as the class's teacher in the running app: «Siapa yang sudah mengumpulkan» shows each learner's state (not started; open with its start and time left; handed in; "
          + "«Waktu habis» for one past its deadline, never as a hand-in; «Ditahan» for a held one, never «ditangguhkan») with the instrument choice and no score; «Atur» only where an act "
          + "applies, opening one panel under the list with only those acts; «Tambah waktu», «Akhiri dan nilai», «Akhiri tanpa menghitung», «Lanjutkan» and «Kirim permintaan» each "
          + "through its own form, recorded and confirmed in its own sentence; a short reason, no way chosen and the sitting ending before the change was saved each refused with its "
          + "sentence and nothing changed; a held sitting offers nothing until its learner is reinstated; a professional-learning class shows no «Atur»; «Ubah jadwal» on the material's "
          + "row takes a date and a time each on the school's clock (labelled WITA), refuses a window already closed and a closing time that is not "
          + "a time, stores 07.30 and 15.45 WITA as those instants on the lesson and both assessments, keeps the open sitting's deadline and is audited");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "A1-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const m = d.murid;
        // two learners whose one attempt at the Pemetaan Awal is used: the head of department asks for one, the teacher for the other
        const s1 = mulai(m.lagi.uid, d.pre, 5), s2 = mulai(m.serah.uid, d.pre, 5);
        sebagai(m.lagi.uid, `select public.finish_my_session(${lit(s1)}, null)`);
        sebagai(m.serah.uid, `select public.finish_my_session(${lit(s2)}, null)`);
        sebagaiEmail(KADEP.identitas, `select public.minta_percobaan(${lit(s1)}, 'uji A1: diminta kepala departemen')`);
        sebagaiEmail(GURU.identitas, `select public.minta_percobaan(${lit(s2)}, 'uji A1: listrik padam saat mengerjakan')`);
        const req = (sesi: string) => psql(`select id from public.attempt_requests where session_id = ${lit(sesi)}`);
        const r1 = req(s1), r2 = req(s2);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(r1) && /^[0-9a-f-]{36}$/.test(r2), "the two requests were not made")) return c.verdict("");
        const butir = (html: string, idp: string) => new RegExp(`<li[^>]*data-permintaan="${idp}"[\\s\\S]*?</li>`).exec(rapi(html))?.[0] ?? "";

        // ---- the head of department: the line on their own home, their own request with no button, the teacher's with both
        const kadep0 = await masuk(asal, KADEP, `MENGELOLA:${d.inst}`);
        if (!c.expect(typeof kadep0 !== "string", String(kadep0))) return c.verdict("");
        const kadep = kadep0 as Komputer;
        const hp = await (await kadep.halaman("/pimpinan")).text();
        const garisP = /<p[^>]*data-menunggu-jenis="kesempatan"[\s\S]*?<\/p>/.exec(rapi(hp))?.[0] ?? "";
        c.expect(/href="\/pimpinan\?kesempatan=buka#kesempatan"/.test(garisP) && /\d+ permintaan kesempatan tambahan menunggu persetujuan/.test(teks(garisP)), `the head of department's home does not carry the line: ${teks(garisP)}`);
        const hq = await (await kadep.halaman("/pimpinan?kesempatan=buka")).text();
        const milik = butir(hq, r1), lain = butir(hq, r2);
        c.expect(teks(hq).includes("Permintaan kesempatan tambahan") && /data-milik-sendiri="ya"/.test(milik) && teks(milik).includes("Anda yang meminta ini. Orang lain yang menyetujuinya.")
          && !/<form\b|<button\b/.test(milik), `the requester's own row: ${teks(milik).slice(0, 200)}`);
        c.expect(teks(lain).includes(`${m.serah.nama} · Kelas A1 ${tag} · Pemetaan Awal`) && /1 kesempatan dipakai/.test(teks(lain)) && /hasil terakhir \d+%/.test(teks(lain))
          && /Diminta .+, \d{1,2} \S+ \d{4} · Alasan: uji A1: listrik padam saat mengerjakan/.test(teks(lain))
          && />Setujui</.test(lain.replace(/<!-- -->/g, "").replace(/<span class="pin-sr">[^<]*<\/span>/g, "")) && />Tolak</.test(lain.replace(/<!-- -->/g, "").replace(/<span class="pin-sr">[^<]*<\/span>/g, "")),
          `another's row does not give what the decision needs, or its two acts: ${teks(lain).slice(0, 300)}`);
        // the requester cannot decide their own request, whatever is sent
        const fl = formDengan(hq, `data-kesempatan-putus="${r2}"`, { putusan: "setuju" });
        if (!c.expect(typeof fl !== "string", `the decision's form: ${fl}`)) return c.verdict("");
        const rs0 = await kadep.kirim("/pimpinan", { form: { ...(fl as Record<string, string>), permintaan: r1 } });
        c.expect(/kode=ATTEMPT_OWN_REQUEST/.test(ke(rs0)) && psql(`select status from public.attempt_requests where id = ${lit(r1)}`) === "PENDING", `the requester approving their own request: ${rs0.status} ${ke(rs0)}`);
        c.expect(teks(butir(await (await kadep.halaman(ke(rs0))).text(), r1)).includes("Permintaan Anda sendiri diputuskan oleh orang lain."), "the refusal's sentence is not on the requester's row");
        // «Tolak» needs a reason; with one it is recorded and the teacher reads it
        const rt0 = await kadep.kirim("/pimpinan", { form: { ...(fl as Record<string, string>), putusan: "tolak" } });
        c.expect(/kode=ATTEMPT_REASON_REQUIRED/.test(ke(rt0)) && teks(butir(await (await kadep.halaman(ke(rt0))).text(), r2)).includes("Tuliskan alasan tidak menyetujui, 10 sampai 300 karakter."), `«Tolak» without a reason: ${rt0.status} ${ke(rt0)}`);
        const rt = await kadep.kirim("/pimpinan", { form: { ...(fl as Record<string, string>), putusan: "tolak", alasan: "uji A1: belum perlu kesempatan lagi" } });
        c.expect(/hasil=tolak/.test(ke(rt)) && psql(`select status || '|' || decision_reason from public.attempt_requests where id = ${lit(r2)}`) === "DECLINED|uji A1: belum perlu kesempatan lagi", `«Tolak»: ${rt.status} ${ke(rt)}`);
        c.expect(teks(await (await kadep.halaman(ke(rt))).text()).includes("Permintaan ditolak. Guru yang meminta dapat melihat alasannya."), "the decline is not confirmed");

        // ---- the school admin: «Yang menunggu» on Konfigurasi, the queue, «Setujui»
        const admin0 = await masuk(asal, ADMIN, `MENGELOLA:${d.inst}`);
        if (!c.expect(typeof admin0 !== "string", String(admin0))) return c.verdict("");
        const admin = admin0 as Komputer;
        const hkon = await (await admin.halaman("/konfigurasi")).text();
        const garisK = /<li[^>]*data-menunggu-jenis="kesempatan"[\s\S]*?<\/li>/.exec(rapi(hkon))?.[0] ?? "";
        c.expect(/href="\/konfigurasi\/kesempatan"/.test(garisK) && /1 permintaan kesempatan tambahan menunggu persetujuan/.test(teks(garisK)), `«Yang menunggu» does not carry the line: ${teks(garisK)}`);
        const ha = await (await admin.halaman("/konfigurasi/kesempatan")).text();
        const untukAdmin = butir(ha, r1);
        // a school admin is not shown a learner's result (20260924100000): the row decides without it
        c.expect(teks(untukAdmin).includes(m.lagi.nama) && /1 kesempatan dipakai/.test(teks(untukAdmin)) && !/hasil terakhir/.test(teks(untukAdmin)) && /data-milik-sendiri="tidak"/.test(untukAdmin),
          `the school admin's row: ${teks(untukAdmin).slice(0, 200)}`);
        const ra = await admin.kirim("/konfigurasi/kesempatan", { form: formDengan(ha, `data-kesempatan-putus="${r1}"`, { putusan: "setuju" }) as Record<string, string> });
        c.expect(/hasil=setuju/.test(ke(ra)) && psql(`select r.status || '|' || (select count(*) from public.audit_log l where l.action = 'attempt_request.approved' and l.target_id = r.id::text) from public.attempt_requests r where r.id = ${lit(r1)}`) === "APPROVED|1",
          `«Setujui»: ${ra.status} ${ke(ra)}`);
        const ha2 = await (await admin.halaman(ke(ra))).text();
        c.expect(teks(ha2).includes("Permintaan disetujui. Murid dapat mengerjakan sekali lagi.") && teks(ha2).includes("Tidak ada permintaan yang menunggu.") && !ha2.includes("data-permintaan="),
          "the approval is not confirmed, or the empty queue does not say so");
        c.expect(!(await (await admin.halaman("/konfigurasi")).text()).includes('data-menunggu-jenis="kesempatan"'), "«Yang menunggu» still counts a decided request");

        // ---- the teacher's list says what was decided, with the reason of the decline; the teacher may ask again
        const guru0 = await masuk(asal, GURU, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const hg = await (await (guru0 as Komputer).halaman(siapa(d))).text();
        const garis = (nama: string) => [...baris(hg, nama).matchAll(/data-atur-meta="">([\s\S]*?)<\/span>/g)].map((x) => teks(x[1]).trim()).join(" | ");
        c.expect(/^kesempatan tambahan \| Kesempatan tambahan disetujui \d{1,2} \S+ \d{4}$/.test(garis(m.lagi.nama)) && /data-keadaan="belum"/.test(baris(hg, m.lagi.nama))
          && !/data-atur-buka/.test(baris(hg, m.lagi.nama)), `the approved row reads «${garis(m.lagi.nama)}» (${/data-keadaan="([a-z_]+)"/.exec(baris(hg, m.lagi.nama))?.[1]})`);
        c.expect(garis(m.serah.nama).endsWith("Permintaan ditolak · uji A1: belum perlu kesempatan lagi") && /data-atur-buka/.test(baris(hg, m.serah.nama)), `the declined row reads «${garis(m.serah.nama)}»`);
        // the queue is nobody else's: a teacher reaches neither address
        for (const alamat of ["/konfigurasi/kesempatan", "/pimpinan?kesempatan=buka"]) {
          const rx = await (guru0 as Komputer).halaman(alamat);
          const tx = rx.status === 200 ? await rx.text() : "";
          c.expect(!tx.includes("data-kesempatan-putus"), `a teacher is drawn the decision's form at ${alamat}`);
        }
        return c.verdict("in the running app: the head of department's home and the school admin's «Yang menunggu» each carry «… permintaan kesempatan tambahan menunggu persetujuan», opening the "
          + "queue (the admin's own page, the head's own home); a row gives the learner, class and instrument, the attempts used, who asked, when and why (the last result only to a reader who may see results); the "
          + "requester's own row has no button and says someone else approves it, and a forged approval of it is refused ATTEMPT_OWN_REQUEST; «Tolak» without a reason is refused with its "
          + "sentence and with one is recorded; «Setujui» is recorded and audited; the decided requests leave the queue, which then says nothing waits; the teacher's list shows the approved learner as not started again with «kesempatan tambahan» "
          + "and the decline with its reason; a teacher is drawn no decision in either place");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "A1-A03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const uid = d.murid.masuk.uid;
        const murid0 = await masuk(asal, muridUji(tag), "BELAJAR");
        if (!c.expect(typeof murid0 !== "string", String(murid0))) return c.verdict("");
        const murid = murid0 as Komputer;
        /** The chapter's card on Belajar for this fixture's lesson (the cycle learner has the fixture's own lesson too). */
        const kartu = async () => {
          const h = rapi(await (await murid.halaman("/belajar")).text());
          const semua = [...(h.match(/<article class="pin-tugas"[\s\S]*?<\/article>/g) ?? []), ...(h.match(/<section class="pin-lanjut"[\s\S]*?<\/section>/g) ?? [])];
          return semua.filter((k) => k.includes(`/belajar/${d.la}`));
        };
        const kata = (ks: string[]) => ks.map((k) => teks(k)).join(" ¦ ");
        const reasonFree = (ks: string[]) => !/alasan|ditolak|uji A1/i.test(kata(ks));

        // ---- a held sitting: its own sentence and no way in; resumed: «Lanjutkan · sisa … menit»
        const s2 = mulai(uid, d.pre, 2);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(s2), "the learner's Pemetaan Awal could not be started")) return c.verdict("");
        tenggat(s2, "+ interval '20 minutes 30 seconds'");
        psql(`begin; set local session_replication_role = replica; update public.assessment_sessions set frozen_at = now(), frozen_cause = 'ACCOUNT_SUSPENDED', frozen_remaining_seconds = 1230 where id = ${lit(s2)}; commit;`);
        const k2 = await kartu();
        c.expect(k2.length > 0 && k2.every((k) => teks(k).includes("Asesmen ini ditahan. Guru Anda akan memutuskan kelanjutannya.") && !/href="\/belajar\/[0-9a-f-]{36}\/pemetaan"/.test(k)) && reasonFree(k2)
          && !/ditangguhkan/i.test(kata(k2)), `while held the card reads: ${kata(k2).slice(0, 300)}`);
        const hh = await (await murid.halaman(`/belajar/${d.la}/pemetaan`)).text();
        c.expect(teks(hh).includes("Asesmen ini ditahan. Guru Anda akan memutuskan kelanjutannya.") && !rapi(hh).includes('name="penugasan"'), "a held sitting can be entered from its own address");
        sebagaiEmail(GURU.identitas, `select public.lanjutkan_pengerjaan(${lit(s2)}, null)`);
        const k3 = await kartu();
        c.expect(k3.length > 0 && k3.every((k) => /Lanjutkan · sisa (19|20) menit/.test(teks(k)) && k.includes(`href="/belajar/${d.la}/pemetaan"`)), `once resumed the card reads: ${kata(k3).slice(0, 300)}`);

        // ---- ended at its deadline: said as the deadline's, never as a hand-in
        tenggat(s2, "- interval '1 hour'");
        psql(`select public.pengerjaan_tutup_terjadwal(1000)`);
        const k4 = await kartu();
        c.expect(psql(`select status || '|' || closure_kind from public.assessment_sessions where id = ${lit(s2)}`) === "FINALIZED|DEADLINE"
          && k4.length > 0 && k4.some((k) => teks(k).includes("Waktu habis. Jawaban yang sudah tersimpan sudah dinilai.")) && !/Anda (sudah )?mengumpulkan/i.test(kata(k4)) && reasonFree(k4),
          `after the deadline's ending the card reads: ${kata(k4).slice(0, 300)}`);

        // ---- a request waiting and a request declined: nothing; an approval: «… dapat dikerjakan sekali lagi.» and «Mulai»
        const menunggu = () => psql(`select id from public.attempt_requests where session_id = ${lit(s2)} and status = 'PENDING'`);
        sebagaiEmail(GURU.identitas, `select public.minta_percobaan(${lit(s2)}, 'uji A1: waktu habis karena gangguan')`);
        const k5 = await kartu();
        c.expect(k5.length > 0 && !/sekali lagi|diminta|menunggu persetujuan/i.test(kata(k5)) && reasonFree(k5), `while a request waits the card reads: ${kata(k5).slice(0, 300)}`);
        sebagaiEmail(KADEP.identitas, `select public.putuskan_percobaan(${lit(menunggu())}, false, 'uji A1: belum perlu kesempatan lagi')`);
        const k6 = await kartu();
        c.expect(k6.length > 0 && !/sekali lagi|ditolak|belum perlu/i.test(kata(k6)) && reasonFree(k6), `after a decline the card reads: ${kata(k6).slice(0, 300)}`);
        sebagaiEmail(GURU.identitas, `select public.minta_percobaan(${lit(s2)}, 'uji A1: diminta sekali lagi')`);
        sebagaiEmail(KADEP.identitas, `select public.putuskan_percobaan(${lit(menunggu())}, true, null)`);
        const k7 = await kartu();
        c.expect(k7.length > 0 && k7.every((k) => teks(k).includes("Pemetaan Awal dapat dikerjakan sekali lagi.") && new RegExp(`href="/belajar/${d.la}/pemetaan"[^>]*>Mulai<`).test(k.replace(/<!-- -->/g, ""))) && reasonFree(k7),
          `after an approval the card reads: ${kata(k7).slice(0, 300)}`);
        const hs = await (await murid.halaman(`/belajar/${d.la}/pemetaan`)).text();
        c.expect(rapi(hs).includes('name="penugasan"'), "the granted attempt's orientation is not offered at the instrument's address (it leads to the map of the finished sitting)");
        // ---- the Uji Penguasaan, ended by the teacher as not counted: its own sentence, and the instrument opens again
        // (the Uji Penguasaan, because this fixture's bank cannot draw a second Pemetaan Awal for one learner)
        const s1 = mulai(uid, d.post, 2);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(s1), "the learner's Uji Penguasaan could not be started")) return c.verdict("");
        sebagaiEmail(GURU.identitas, `select public.akhiri_pengerjaan(${lit(s1)}, 'NOT_COUNTED', 'uji A1: murid yang keliru masuk')`);
        const k1 = await kartu();
        c.expect(k1.length > 0 && k1.every((k) => teks(k).includes("Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada.")) && reasonFree(k1),
          `after a not-counted ending the card reads: ${kata(k1).slice(0, 300)}`);
        const hp = await (await murid.halaman(`/belajar/${d.la}/penguasaan`)).text();
        c.expect(rapi(hp).includes('name="penugasan"') && !rapi(hp).includes("pin-soal"), "the Uji Penguasaan does not open its orientation again after a not-counted ending");
        return c.verdict("as the learner on Belajar in the running app: a sitting the teacher ended as not counted says «Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda…» and its "
          + "instrument opens the orientation again; a held one says «Asesmen ini ditahan. Guru Anda akan memutuskan kelanjutannya.», offers no way in and cannot be entered by its address; "
          + "once the teacher resumes it the card offers «Lanjutkan · sisa … menit»; one ended at its deadline says «Waktu habis. Jawaban yang sudah tersimpan sudah dinilai.», never a "
          + "hand-in; a waiting and a declined request say nothing; an approval says «… dapat dikerjakan sekali lagi.» with «Mulai» and the orientation; no reason is ever on the page");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "A1-J01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const d0 = dunia(tag);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const uid = d.murid.masuk.uid;
        const pid = d.murid.masuk.pid;
        const namaMurid = d.murid.masuk.nama;
        // the fixture: the learner has finished the Pemetaan Awal, so the Uji Penguasaan is theirs to start
        const pre = mulai(uid, d.pre, 5);
        sebagai(uid, `select public.finish_my_session(${lit(pre)}, null)`);
        const sesiPost = () => psql(`select coalesce(string_agg(s.id::text || ':' || s.status || ':' || coalesce(s.closure_kind, '-'), ',' order by s.created_at, s.id), '') from public.assessment_sessions s
          where s.person_id = ${lit(pid)} and s.assessment_assignment_id = ${lit(d.post)}`);

        // 1. the learner starts the Uji Penguasaan, through the app
        const murid0 = await masuk(asal, muridUji(tag), "BELAJAR");
        if (!c.expect(typeof murid0 !== "string", String(murid0))) return c.verdict("");
        const murid = murid0 as Komputer;
        const h1 = await (await murid.halaman(`/belajar/${d.la}/penguasaan`)).text();
        const f1 = formDengan(h1, 'name="penugasan"', {});
        if (!c.expect(typeof f1 !== "string", `the Uji Penguasaan's orientation: ${f1}`)) return c.verdict("");
        const r1 = await murid.kirim(`/belajar/${d.la}/penguasaan`, { form: f1 as Record<string, string> });
        const pertama = /^([0-9a-f-]{36}):(CREATED|IN_PROGRESS):-$/.exec(sesiPost())?.[1] ?? "";
        if (!c.expect(Boolean(pertama), `the learner's start: ${r1.status} ${ke(r1)}; sittings ${sesiPost()}`)) return c.verdict("");
        // ... answers two questions (the player's own call, record_answer, as the learner) and then the power goes
        sebagai(uid, `do $m$ declare r record; begin for r in select p.id from public.presented_items p where p.session_id = ${lit(pertama)} order by p.position limit 2 loop
          perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, true)); end loop; end $m$`);

        // 2. the teacher finds the sitting on «Siapa yang sudah mengumpulkan» and ends it as not counted
        const guru0 = await masuk(asal, GURU, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Komputer;
        const h2 = await (await guru.halaman(siapa(d, d.post))).text();
        const tautan = /href="([^"]*)"[^>]*data-atur-buka="([0-9a-f-]{36})"/.exec(baris(h2, namaMurid)) ?? /data-atur-buka="([0-9a-f-]{36})"[^>]*href="([^"]*)"/.exec(baris(h2, namaMurid));
        c.expect(Boolean(tautan) && baris(h2, namaMurid).includes(pertama), `the teacher's list does not offer «Atur» on the learner's open sitting: ${teks(baris(h2, namaMurid))}`);
        const h3 = await (await guru.halaman(`${siapa(d, d.post)}&sesi=${pertama}`)).text();
        c.expect(teks(h3).includes(`Akhiri Uji Penguasaan ${namaMurid} tanpa menghitung?`) || rapi(h3).includes('data-atur-tindakan="akhiri"'), "the panel does not offer «Akhiri sesi»");
        const f3 = formDengan(h3, 'data-atur-tindakan="akhiri"', { cara: "NOT_COUNTED", alasan: "listrik padam saat Uji Penguasaan" });
        if (!c.expect(typeof f3 !== "string", `the «Akhiri sesi» form: ${f3}`)) return c.verdict("");
        const r3 = await guru.kirim(siapa(d, d.post), { form: f3 as Record<string, string> });
        c.expect(/hasil=tidak_dihitung/.test(ke(r3)) && sesiPost() === `${pertama}:TERMINATED:TEACHER_NOT_COUNTED`, `the teacher's ending: ${r3.status} ${ke(r3)}; sittings ${sesiPost()}`);
        c.expect(psql(`select count(*) || '|' || (select count(*) from public.assessment_results r where r.session_id = ${lit(pertama)}) from public.responses where session_id = ${lit(pertama)}`) === "2|0",
          "the ended sitting lost its answers, or has a result");

        // 3. the learner is told, and starts again
        const h4 = rapi(await (await murid.halaman("/belajar")).text());
        c.expect(teks(h4).includes("Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda. Jawaban yang sudah tersimpan tetap ada."), "Belajar does not tell the learner the sitting was not counted");
        const h5 = await (await murid.halaman(`/belajar/${d.la}/penguasaan`)).text();
        const f5 = formDengan(h5, 'name="penugasan"', {});
        if (!c.expect(typeof f5 !== "string", `the Uji Penguasaan does not open again after the not-counted ending: ${f5}`)) return c.verdict("");
        const r5 = await murid.kirim(`/belajar/${d.la}/penguasaan`, { form: f5 as Record<string, string> });
        const semua = sesiPost().split(",");
        c.expect(semua.length === 2 && semua[0] === `${pertama}:TERMINATED:TEACHER_NOT_COUNTED` && /:(CREATED|IN_PROGRESS):-$/.test(semua[1]), `the learner's second start: ${r5.status} ${ke(r5)}; sittings ${sesiPost()}`);
        const h6 = await (await murid.halaman(`/belajar/${d.la}/penguasaan`)).text();
        c.expect(!rapi(h6).includes('name="penugasan"') && h6.includes(semua[1]?.split(":")[0] ?? "x"), "the learner is not in the player of the new sitting");
        // the teacher's list now shows the new sitting, open; both attempts' accounting is the database's (one used)
        const h7 = await (await guru.halaman(siapa(d, d.post))).text();
        c.expect(/data-keadaan="sedang"/.test(baris(h7, namaMurid)) && psql(`select public.percobaan_terpakai(${lit(pid)}, ${lit(d.post)})`) === "1", "the teacher's list does not show the new sitting open, or the ended one used an attempt");
        return c.verdict("«a power cut during Uji Penguasaan», through the running app with no engineer: the learner starts the Uji Penguasaan from its orientation and answers two questions; the "
          + "class's teacher finds the open sitting on «Siapa yang sudah mengumpulkan», opens «Atur» and ends it as not counted with a reason (TERMINATED, its two answers kept, no result, no "
          + "attempt used); Belajar tells the learner it was not counted; the Uji Penguasaan opens its orientation again and the learner starts a second sitting, which the teacher's list "
          + "shows as open");
      } finally {
        bersihkan();
      }
    },
  },
];
