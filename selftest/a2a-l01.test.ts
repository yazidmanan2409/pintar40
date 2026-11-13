/**
 * A2A-L01 — THE ACCOUNT LIFECYCLE TAKES ITS ROWS IN ONE ORDER (A2a's page §6; the owner's decision after the 4.0
 * look-back; Sharon's catalogue test, with her early read of 7b3b3d31: the order, R1 to R3, and B1's rule).
 *
 * 4.0 declared no lock order for a person's rows. L1-F2 and L1-F4 each found a cycle by review. This test makes the
 * order permanent, from the catalogue: every function and procedure in `public`, and every trigger on the ranked
 * tables, is read; nothing is a list of names, so a function A2a or A3 adds falls under it the day it lands.
 *
 * For each function, the ordered list of the row locks it takes, each with its strength:
 *   * directly: SELECT/PERFORM … FOR UPDATE | NO KEY UPDATE | SHARE | KEY SHARE; UPDATE; DELETE; INSERT … ON CONFLICT
 *     DO UPDATE and MERGE (as updates); a call to a fence function;
 *   * R1, foreign keys (from pg_constraint): an insert, and an update of a foreign-key column, take FOR KEY SHARE on
 *     the table referred to; a delete takes a lock on every table that refers to it with ON DELETE CASCADE or SET NULL,
 *     after the deleted row, and fires that table's triggers;
 *   * transitively, through every function it calls (by name, cycle-safe) and the row triggers its writes fire;
 *   * R2: a trigger function read on its own starts with its table's rank held for UPDATE and DELETE, nothing for INSERT;
 *   * Auth's own update and insert of auth.users (GoTrue) are read as writers: Auth holds the row while our triggers run.
 * It fails when:
 *   * a later lock has a lower rank than an earlier one (the order);
 *   * a weaker lock on a table is followed by a stronger one (an upgrade: two such transactions on one row deadlock);
 *   * B1: a function that takes the fence has locked a row of any table other than ranks 1 to 6 before it;
 *   * R3: the per-function report differs from the committed selftest/a2a-l01-laporan.txt (regenerate it with
 *     `npx tsx scripts/dev/a2a-l01-laporan.ts`, and read the difference).
 * An insert of a new row is not a lock on that row (no one else can see it); its foreign keys and triggers are read.
 *
 * WHAT IT DOES NOT ESTABLISH (the page §6): branches are read together in text order (it over-reports; an over-report
 * is a declared exception, with its reason); the order between rows of one table is the race tests' job.
 *
 * Plants, each inside this test's own rolled-back transaction (DDL is transactional), must all be reported before the
 * reading of the real code is trusted: P1 accounts then persons; P1b FOR SHARE then UPDATE on persons; P2 akun_kunci
 * locking accounts before auth.users; P3 a fenced function locking accounts after the fence; P5 a fenced function
 * locking learning_assignments before the fence (B1's rule).
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

// ── THE ORDER, AS DATA (Sharon, early read of 7b3b3d31, ruling 1)
export const URUTAN: Record<string, number> = {
  persons: 1,
  // C2 (Sharon, A2A-CHANGE-A-C3C4-40753420.md): every enrolment write fires enrollments_programme_alone, which takes the
  // person FOR UPDATE, so the enrolment is part of the person's order: immediately after it (1.5 keeps the other ranks)
  enrollments: 1.5,
  account_requests: 2,
  person_suspensions: 3,
  "auth.users": 4,
  accounts: 5,
  password_write_permits: 6,
  FENCE: 7,
  maintenance_windows: 8,
  assessment_sessions: 9,
};
/** B1: the fence is the first lock after ranks 1 to 6, for every table. */
const SIKLUS_HIDUP = 6;
/** R1 (Sharon's ruling 2): foreign keys count. */
export const KUNCI_FK = true;
/** The fence functions (A2a §2); a call to one is the fence's lock. */
const PAGAR = /^pagar_darurat(?:_eksklusif|_bersama)?$/;

export type Katalog = {
  fns: Map<string, string[]>;
  pemicu: Map<string, string[]>;
  /** referring table -> [the table it refers to, its foreign-key columns] */
  fkKeluar: Map<string, { ke: string; kolom: string[] }[]>;
  /** referred table -> [the referring table, the delete action: c cascade, n set null, d set default] */
  fkMasuk: Map<string, { dari: string; aksi: string }[]>;
};
/** Reports read and found safe: the writer, the path it reaches, why, and (where the safety is in code) the condition
 *  the catalogue must still show, so the exception lapses the moment that code does. */
const JAGA_TANPA_ORANG = "if public.current_person_id() is null or public.current_person_id() = p_person then return null;";
/** The recovery path (change A, commit 2): safe only while recovery_assist_school answers null, for no person and for
 *  oneself, before it can reach sekolah_memegang (migration 20270118100000). A2A-L02 shows it on two connections. */
const syaratJaga = (kat: Katalog) => {
  const srcs = kat.fns.get("recovery_assist_school") ?? [];
  return srcs.length > 0 && srcs.every((src) => {
    const b = bersih(src), jaga = b.indexOf(JAGA_TANPA_ORANG);
    return jaga >= 0 && jaga < b.indexOf("sekolah_memegang");
  });
};
const ALASAN_JAGA = "Auth's password write runs with no PINTAR person, and recovery_assist_school answers null without one (and for "
  + "oneself) before it can reach sekolah_memegang: migration 20270118100000, shown on two connections by A2A-L02";
/** audit_write's foreign key to persons (Sharon's condition on the class): audit_log refers to persons only through
 *  evaluation_actor_person_id, and audit_write fills it only from an open evaluation session whose persona is the
 *  acting user (it is the evaluator, never the persona); outside an evaluation it is null and a null key locks nothing. */
const syaratAudit = (kat: Katalog) => {
  const ke = (kat.fkKeluar.get("audit_log") ?? []).filter((f) => f.ke === "persons");
  if (ke.length !== 1 || ke[0].kolom.join() !== "evaluation_actor_person_id") return false;
  const srcs = kat.fns.get("audit_write") ?? [];
  if (srcs.length !== 1) return false;
  const b = bersih(srcs[0]).replace(/\s+/g, " ");
  const isi = b.match(/\bv_eval_actor\b/g)?.length ?? 0;
  return b.includes("select s.evaluator_person_id, s.id into v_eval_actor, v_eval_session from public.evaluation_sessions s "
      + "where s.persona_auth_user_id = auth.uid() and s.ended_at is null")
    && b.includes("v_eval_actor := null") && /evaluation_actor_person_id, evaluation_session_id\) values \([^;]*v_eval_actor, v_eval_session\)/.test(b)
    && isi === 4;   // declared, selected into, cleared, inserted: nowhere else
};
const ALASAN_AUDIT = "audit_write's only foreign key to persons, evaluation_actor_person_id, is filled only while the acting user is "
  + "a persona in an open evaluation session (synthetic human evaluation), and then names the evaluator; outside one it is "
  + "null and takes no lock. Within one, the persona's act holds the persona's rows and the rows it acts on, never the "
  + "evaluator's, and no lifecycle act on the evaluator takes a row the persona's act holds (the page, §6)";
/** The late lock of a breach: the path after "— via" (order) or "then N via" (upgrade). */
const lewatAkhir = (v: string) => v.match(/ — via (.*?); earlier via /)?.[1] ?? v.match(/, then \d via (.*)$/)?.[1] ?? "";
/** An upgrade's first, weaker lock: the path after "strength N via". */
const lewatAwalNaik = (v: string) => v.match(/^an upgrade on \S+: strength \d via (.*?), then \d via /)?.[1] ?? "";
/** The permit's condition 1 (Sharon, A2A-CHANGE-A-PERMIT-KEY.md), in A2A-F01's form: no migration, nothing under src/
 *  (or supabase/functions/), deletes from auth.users, takes it FOR UPDATE, or calls Auth's user deletion. */
export function authUsersDihapus(berkas: { path: string; text: string }[]): string[] {
  const salah: string[] = [];
  for (const f of berkas) {
    const t = f.path.endsWith(".sql") ? bersih(f.text) : f.text.replace(/\/\/[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
    if (/delete\s+from\s+(?:only\s+)?auth\.users\b/i.test(t)) salah.push(`${f.path}: deletes from auth.users`);
    if (f.path.endsWith(".sql") && /\bfrom\s+auth\.users\b[^;]*\bfor\s+update\b/.test(t))
      salah.push(`${f.path}: takes auth.users FOR UPDATE`);
    if (/\bdeleteUser\s*\(/.test(t) || /\/admin\/users\/[^'"`]*['"`]\s*,\s*\{\s*method:\s*['"`]DELETE/i.test(t))
      salah.push(`${f.path}: calls Auth's user deletion`);
  }
  return salah;
}
let repoAuthUsers: string[] | null = null;
function bacaRepoAuthUsers(): string[] {
  if (repoAuthUsers) return repoAuthUsers;
  const berkas: { path: string; text: string }[] = [];
  const jalan = (d: string) => {
    let isi: string[] = [];
    try { isi = readdirSync(d); } catch { return; }
    for (const n of isi) {
      const q = join(d, n);
      if (statSync(q).isDirectory()) { if (n !== "node_modules") jalan(q); }
      else if (/\.(sql|ts|tsx|js|mjs)$/.test(n)) berkas.push({ path: q, text: readFileSync(q, "utf8") });
    }
  };
  for (const d of ["supabase/migrations", "src", "supabase/functions"]) jalan(join(process.cwd(), d));
  return (repoAuthUsers = authUsersDihapus(berkas));
}
const syaratIzin = (kat: Katalog, l?: Kunci[]) => {
  // 1. the repository: nothing deletes auth users, nor takes them FOR UPDATE
  if (bacaRepoAuthUsers().length) return false;
  // 2. akun_kunci's auth.users lock is FOR NO KEY UPDATE (asserted here, from the catalogue: 20270117190000 is deployed)
  const ak = (kat.fns.get("akun_kunci") ?? []).map((b) => bersih(b).replace(/\s+/g, " "));
  if (ak.length !== 1 || !/from auth\.users u where u\.id in \([^;]*\) order by u\.id for no key update/.test(ak[0])
      || /\bfrom auth\.users\b[^;]*\bfor update\b/.test(ak[0])) return false;
  // 3. the permit function takes the person before the account (the existing check of 20270117190000 holds it)
  const i = l?.findIndex((x) => x.t === "persons") ?? -1, j = l?.findIndex((x) => x.t === "accounts") ?? -1;
  return i >= 0 && j > i;
};
type Lewat = string | RegExp | ((v: string) => boolean);
/** A same-row re-lock's mechanical half: the writer took the late lock's table, at least as strongly, before anything of a
 *  higher rank. (Its other half, that it is the same row, is the variable each entry names.) */
const dipegangDulu = (l: Kunci[], v: string) => {
  const t = v.split(" ")[0], akhir = lewatAkhir(v);
  if (!(t in URUTAN) || !akhir) return false;
  const k = Math.max(...l.filter((x) => x.t === t && x.lewat === akhir).map((x) => x.kuat));
  const i = l.findIndex((x) => x.t in URUTAN && URUTAN[x.t] > URUTAN[t]);
  return i > 0 && l.slice(0, i).some((x) => x.t === t && x.kuat >= k);
};
/** One same-row re-lock: the lock site (the late path's end), the variable that makes it the row already held. */
const samaBaris = (site: string, variabel: string) => ({
  penulis: "*", lewat: new RegExp(`(^| > )${site.replace(/[[\]]/g, "\\$&")}$`),
  alasan: `same row: ${variabel}`, syarat: (_k: Katalog, l?: Kunci[], v?: string) => !!l && !!v && dipegangDulu(l, v),
});
export const PENGECUALIAN: { penulis: string; lewat: Lewat; alasan: string; syarat?: (kat: Katalog, l?: Kunci[], v?: string) => boolean }[] = [
  // the class (the Chief Architect, 13 Nov: one exception, one assertion): every writer, a lock through audit_write —
  // the late lock of a breach, or the first lock of an upgrade (a null key took no lock, so there is nothing to upgrade)
  { penulis: "*", lewat: (v) => /(^| > )audit_write$/.test(lewatAkhir(v)) || /(^| > )audit_write$/.test(lewatAwalNaik(v)),
    alasan: ALASAN_AUDIT, syarat: syaratAudit },
  // a new auth.users row (the Chief Architect: one exception): handle_new_auth_user runs only on Auth's insert of
  // auth.users, and the row it holds is the one being inserted, which no other transaction can see
  ...["(GoTrue I auth.users)", "handle_new_auth_user"].map((penulis) => ({
    penulis, lewat: (v: string) => (/^persons \(rank 1\) after auth\.users \(rank 4\) — /.test(v)
      && /; earlier via (GoTrue > \[auth\.users I\] )?handle_new_auth_user$/.test(v))
      || /^an upgrade on auth\.users: strength 0 via (GoTrue > \[auth\.users I\] )?handle_new_auth_user, then 2 via .*\[accounts I\] akun_baru_terkunci$/.test(v),
    alasan: "the auth.users row held is the new row Auth is inserting: no other transaction can see it, so none can hold it",
    syarat: (kat: Katalog) => [...kat.pemicu].every(([k, fs]) => !fs.includes("handle_new_auth_user") || /^auth\.users\|I\|/.test(k)),
  })),
  // the window functions (the Chief Architect: one exception, "pending B1", removed in C, where B1 reorders them):
  // the actor's foreign key after the window row; no reverse path was found
  ...["change_maintenance", "publish_notice", "schedule_maintenance"].map((penulis) => ({
    penulis, lewat: /^change_maintenance$|^publish_notice$|^schedule_maintenance$/,
    alasan: "PENDING B1: the actor's key after the window row, no reverse path found; re-read after B1, in change C, and this exception removed there",
  })),
  // same-row re-locks, one by one (Sharon's condition), each naming the variable that makes it the row already held
  samaBaris("finalize_session", "assessment_results.person_id, set from the sitting, is its learner v_s.person_id, taken first by finalize_session or its caller"),
  samaBaris("pengerjaan_putus_tenggat", "the learner of p_session (p.id = a.person_id), taken first by the caller on the same sitting's learner"),
  samaBaris("tutup_asesmen_terbuka", "the enrolment's person (e.person_id), taken first; terminated_by_person_id is v_actor, see the page for the actor's key"),
  samaBaris("[enrollments U] enrollments_programme_alone", "the enrolment's person en.person_id, taken FOR UPDATE first (akhiri_pendaftaran; kenaikan_tetapkan's population)"),
  samaBaris("akhiri_pendaftaran", "en.person_id, in kenaikan_tetapkan's population, taken FOR UPDATE first"),
  samaBaris("[attempt_requests I] orang_lampiran_jaga > orang_dianonimkan", "attempt_requests.person_id is s.person_id, taken FOR SHARE first"),
  samaBaris("[memberships I] orang_lampiran_jaga > orang_dianonimkan", "the new membership's enrolment's person, in the population taken FOR UPDATE first"),
  samaBaris("[portable_visibility I] orang_lampiran_jaga > orang_dianonimkan", "portable_visibility.person_id is t.person_id, taken FOR UPDATE first by the enrolment trigger"),
  samaBaris("minta_percobaan", "attempt_requests.person_id is s.person_id, taken FOR SHARE first"),
  samaBaris("transfer_execute", "portable_visibility.person_id is t.person_id, taken FOR UPDATE first by the enrolment trigger"),
  samaBaris("terminate_session", "the learner v_s.person_id is taken first; terminated_by_person_id is v_actor, the same row or not the hold's"),
  // a trigger function read on its own: it only ever runs as auth.users' UPDATE trigger, read with that row held (R2), where it passes
  ...["auth_card_email_guard", "auth_password_write_guard"].map((penulis) => ({ penulis, lewat: /(^| > )sesi_akhiri_orang$/,
    alasan: "a trigger function only of auth.users UPDATE: its R2 reading, with the row held, passes",
    syarat: (kat: Katalog) => [...kat.pemicu].every(([k, fs]) => !fs.includes(penulis) || /^auth\.users\|U\|/.test(k)) })),
  // KEY SHARE, then FOR SHARE, on one person: compatible (Sharon); raced on two connections, no deadlock
  ...["certificate_prepare", "sertifikat_koreksi_siapkan", "transfer_minta", "transfer_request"].map((penulis) => ({ penulis,
    lewat: (v: string) => /^an upgrade on persons: strength 0 via .*, then 1 via /.test(v),
    alasan: "KEY SHARE then FOR SHARE: the holder strengthens past a FOR UPDATE waiter; raced, no deadlock" })),
  // THE PERMIT'S KEY ON auth.users (Sharon, A2A-CHANGE-A-PERMIT-KEY.md; register: "auth.users FOR KEY SHARE before the
  // account, for the day PINTAR deletes auth users"): a KEY SHARE waits only on a delete or FOR UPDATE of the row, which
  // nothing in PINTAR takes; her three conditions are checked
  ...["password_write_permit", "recovery_grant_permit", "authorize_card_reissue"].map((penulis) => ({ penulis,
    lewat: (v: string) => /^auth\.users \(rank 4\) after accounts \(rank 5\) — /.test(v) && lewatAkhir(v) === penulis,
    alasan: "REGISTER (the permit's key): no delete or FOR UPDATE of auth.users anywhere; akun_kunci takes FOR NO KEY UPDATE; the person is taken first",
    syarat: (kat: Katalog, l?: Kunci[]) => syaratIzin(kat, l) })),
  // ROW 13 (Sharon, A2A-CHANGE-A-76-4530849f.md §2): "the password guard's early return". auth_password_write_guard
  // returns at once when encrypted_password is unchanged; this covers a breach only when every caller reaching it
  // through its own UPDATE of auth.users does not set encrypted_password (Auth's password write, commit 2's real path,
  // stays outside: it is never such a caller)
  { penulis: "*", lewat: (v: string) => /\[auth\.users U\] auth_password_write_guard/.test(v),
    alasan: "the password guard's early return: the caller's update of auth.users leaves encrypted_password as it was",
    syarat: (kat: Katalog, _l?: Kunci[], v?: string) => {
      const jaga = (kat.fns.get("auth_password_write_guard") ?? []).every((b) => bersih(b).replace(/\s+/g, " ")
        .includes("if new.encrypted_password is not distinct from old.encrypted_password or coalesce(new.encrypted_password, '') = '' then return new;"));
      const pemanggil = [...(v ?? "").matchAll(/([a-z_0-9]+|GoTrue) > \[auth\.users U\] auth_password_write_guard/g)].map((m) => m[1]);
      return jaga && pemanggil.length > 0 && pemanggil.every((f) => f !== "GoTrue" && (kat.fns.get(f) ?? []).length > 0
        && (kat.fns.get(f) ?? []).every((b) => bersih(b).split(";").filter((st) => /\bupdate\s+auth\.users\b/.test(st))
          .every((st) => !/\bencrypted_password\b/.test(st))));
    } },
  // ROW 11, REGISTER REG-A2A-01 (Sharon, §3): two enrolments of one person at once (tempatkan_murid, transfer_execute):
  // orang_lampiran_jaga FOR SHARE, then enrollments_programme_alone FOR UPDATE, both BEFORE INSERT on enrollments; a
  // 40P01 only, outside A2a's area. Likely fix: order the triggers by name so the FOR UPDATE fires first.
  ...["tempatkan_murid", "transfer_execute"].map((penulis) => ({ penulis,
    lewat: (v: string) => /^an upgrade on persons: strength 1 via .*\[enrollments I\] orang_lampiran_jaga > orang_dianonimkan, then 3 via .*\[enrollments I\] enrollments_programme_alone$/.test(v),
    alasan: "REGISTER REG-A2A-01: two enrolments of one person at once; 40P01 only; fix: the FOR UPDATE trigger first, by name" })),
  samaBaris("sesi_akhiri_orang", "device_sessions.auth_user_id is p_auth_user, the account's auth.users row its caller holds first (akun_kunci; Auth's own write; the auth.users trigger's row)"),
  samaBaris("orang_dianonimkan", "p_person is the attachment's NEW.person_id (orang_lampiran_jaga), the person the writer took first"),
  samaBaris("authorize_card_conversion", "card_conversions.person_id is p_person, taken FOR UPDATE first by sekolah_memegang"),
  samaBaris("authorize_card_reissue", "card_reissues.person_id is p_person, taken FOR UPDATE first by sekolah_memegang"),
  samaBaris("authorize_email_correction", "email_corrections.person_id is p_person, taken FOR UPDATE first by sekolah_memegang"),
  samaBaris("buka_kembali_akun", "account_requests is r.id, taken FOR UPDATE first"),
  // the actor's key after the person's own rows: the actor's hold takes only the actor's rows, never this person's
  ...["aktifkan_kembali_akun", "buka_kembali_akun"].map((penulis) => ({ penulis,
    lewat: (v: string) => /^persons \(rank 1\) after (person_suspensions|accounts) /.test(v) && lewatAkhir(v) === penulis,
    alasan: "ended_by / revoked_by / decided_by is v_actor: if the actor is the person, the row taken first FOR UPDATE; if not, a hold "
      + "on the actor takes the actor's suspension and accounts, never this person's",
    syarat: (_k: Katalog, l?: Kunci[]) => !!l && l[0]?.t === "persons" && l[0].kuat === 3 })),
  samaBaris("open_assessment_session", "the new sitting's person_id is NEW.person_id, which orang_lampiran_jaga takes FOR SHARE first (its "
    + "person_suspensions key is frozen_suspension_id, null on a new sitting)"),
  samaBaris("hapus_data_pribadi", "p_person, taken FOR UPDATE first"),
  // the deletion's auth.users update never changes the password, so auth_password_write_guard returns at once: what the
  // engine reads after it (the permits, the recovery, sekolah_memegang) is never reached from the deletion
  { penulis: "hapus_data_pribadi", lewat: (v: string) => /\[auth\.users U\] auth_password_write_guard/.test(v),
    alasan: "the deletion does not write encrypted_password; the guard returns when it is unchanged",
    syarat: (kat: Katalog) => !(kat.fns.get("hapus_data_pribadi") ?? []).some((b) => /encrypted_password/.test(bersih(b)))
      && (kat.fns.get("auth_password_write_guard") ?? []).every((b) => bersih(b).replace(/\s+/g, " ")
        .includes("if new.encrypted_password is not distinct from old.encrypted_password or coalesce(new.encrypted_password, '') = '' then return new;")) },
  samaBaris("hitung_ulang_koreksi_kunci", "the recalculated result's person_id is the sitting's learner, taken FOR KEY SHARE first (row 3, migration 20270118130000)"),
  samaBaris("transfer_minta", "the transfer's person_id is e.person_id, taken FOR KEY SHARE first (C1, migration 20270118120000)"),
  samaBaris("transfer_request", "the transfer's person_id is e.person_id, taken FOR KEY SHARE first (C1, migration 20270118120000)"),
  samaBaris("kenaikan_tetapkan", "the population, taken FOR UPDATE first"),
  samaBaris("[enrollments I] enrollments_programme_alone", "the new enrolment's person, in the population taken FOR UPDATE first"),
  // kenaikan_tetapkan's enrolment after the sittings it closed: serialised on the learner it holds FOR UPDATE first;
  // every enrolment writer takes the person first (C1), so none holds the enrolment while waiting for it (Sharon, row 6)
  { penulis: "kenaikan_tetapkan", lewat: (v: string) => /^enrollments \(rank 1\.5\) after assessment_sessions/.test(v),
    alasan: "serialised on the learner: the population is taken FOR UPDATE first, and every enrolment writer takes the person first",
    syarat: (_k: Katalog, l?: Kunci[]) => !!l && l.findIndex((x) => x.t === "persons" && x.kuat === 3) >= 0
      && l.findIndex((x) => x.t === "persons" && x.kuat === 3) < l.findIndex((x) => x.t === "assessment_sessions") },
  // import_advance: the enrolment it holds is the one it inserted (v_enr), a new row no one else can see (Sharon, row 8)
  { penulis: "import_advance", lewat: (v: string) => /^persons \(rank 1\) after enrollments/.test(v),
    alasan: "new row: the enrolment is v_enr, the one this transaction inserted",
    syarat: (kat: Katalog) => (kat.fns.get("import_advance") ?? []).every((b) => /returning enrollments\.id into v_enr/.test(bersih(b))
      && !/\bupdate\s+public\.enrollments\b/.test(bersih(b))) },
  // the trigger's own R2 reading is the shape every enrolment writer must meet by taking the person first; the writers
  // are each read on their own lists above
  { penulis: "enrollments_programme_alone [enrollments U]", lewat: /(^| > )\[enrollments U\] enrollments_programme_alone$/,
    alasan: "the trigger itself: its writers take the person first (C1), and each is read on its own" },
  // the actor's key after the sitting (Sharon: confirm none can act where the actor is the sitting's own learner)
  ...["akhiri_pengerjaan", "akhiri_penugasan"].map((site) => ({ ...samaBaris(site, ""), alasan: "closure_by / terminated_by_person_id is "
    + "v_actor: if the actor is the learner, it is the row taken first (the learner, commit 3, checked); if not, the actor's hold "
    + "takes only the actor's own sittings, and this act holds the learner's", syarat: (_k: Katalog, l?: Kunci[]) =>
      !!l && l.findIndex((x) => x.t === "persons") >= 0 && l.findIndex((x) => x.t === "persons") < l.findIndex((x) => x.t === "assessment_sessions") })),
  ...["lanjutkan_pengerjaan", "tutup_pengerjaan_ditahan"].map((site) => ({ penulis: site, lewat: new RegExp(`^${site}$`),
    alasan: "unfrozen_by / terminated_by_person_id is v_actor, and the sitting is a held (frozen) one, which the hold does not take: "
      + "pengerjaan_ditahan_periksa refuses any other", syarat: (kat: Katalog) => (kat.fns.get("pengerjaan_ditahan_periksa") ?? [])
      .every((b) => bersih(b).replace(/\s+/g, " ").includes("if not public.pengerjaan_ditahan(s) then perform public.pengerjaan_tolak(''); end if;")) })),
  // the hold itself: unfrozen_by_person_id is set to null (a null key takes no lock); frozen_suspension_id is the suspension
  // its only caller, tangguhkan_akun, inserted earlier in the same transaction (a new row no one else can see)
  ...["pengerjaan_tahan_orang", "tangguhkan_akun"].map((penulis) => ({ penulis,
    lewat: (v: string) => /^(persons|person_suspensions) \(rank \d\) after assessment_sessions/.test(v) && /(^| > )pengerjaan_tahan_orang$/.test(lewatAkhir(v)),
    alasan: "persons: unfrozen_by_person_id = null takes no lock; person_suspensions: frozen_suspension_id is the row tangguhkan_akun "
      + "inserted in this transaction", syarat: (kat: Katalog) => {
      const h = (kat.fns.get("pengerjaan_tahan_orang") ?? []).map((b) => bersih(b));
      const t = bersih((kat.fns.get("tangguhkan_akun") ?? [""])[0]);
      const pemanggil = [...kat.fns].filter(([n, bs]) => n !== "pengerjaan_tahan_orang" && bs.some((b) => /\bpengerjaan_tahan_orang\s*\(/.test(bersih(b)))).map(([n]) => n);
      return h.length === 1 && /unfrozen_by_person_id = null/.test(h[0]) && pemanggil.join() === "tangguhkan_akun"
        && t.indexOf("insert into public.person_suspensions") >= 0 && t.indexOf("insert into public.person_suspensions") < t.indexOf("pengerjaan_tahan_orang(");
    } })),
  ...["(GoTrue U auth.users)", "auth_password_write_guard", "auth_password_write_guard [auth.users U]"].map((penulis) => ({
    penulis, lewat: "recovery_assist_school > sekolah_memegang", alasan: ALASAN_JAGA, syarat: syaratJaga,
  })),
];
/** Functions that build SQL with `execute` naming a ranked table, each read by hand. */
export const SQL_DINAMIS: Record<string, string> = {
  assemble_session: "builds the sitting's item query; it locks no ranked row (its dynamic SQL reads items)",
};

// auth.* first, kept whole (found by the first run: the generic name read "from auth.users" as a table "auth")
const TBL = /auth\.[a-z_][a-z0-9_]*|(?:public\.)?[a-z_][a-z0-9_]*/;
const namaTabel = (s: string) => (/^auth\./.test(s) ? s.match(/^auth\.[a-z_][a-z0-9_]*/)![0] : s.replace(/^public\./, ""));
export const bersih = (src: string) =>
  src.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/'(?:[^']|'')*'/g, "''").toLowerCase();

/** The catalogue, read in one psql session; `tanam` is DDL run first, inside a transaction that is rolled back. */
export function bacaKatalog(db: string, tanam = ""): Katalog {
  const sql = `begin;
${tanam}
select 'F' || chr(31) || p.proname || chr(31) || p.prosrc || chr(30) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang where n.nspname = 'public' and l.lanname in ('plpgsql', 'sql') order by p.proname, p.oid;
select 'T' || chr(31) || case when n.nspname = 'auth' then 'auth.users' else c.relname end || chr(31) || t.tgtype || chr(31) || p.proname || chr(30)
  from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace join pg_proc p on p.oid = t.tgfoid
 where not t.tgisinternal and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
 order by n.nspname, c.relname, t.tgname;   -- Postgres fires a table's triggers of one timing in name order
select 'K' || chr(31) || case when sn.nspname = 'auth' then 'auth.' || s.relname else s.relname end || chr(31)
       || case when tn.nspname = 'auth' then 'auth.' || t.relname else t.relname end || chr(31) || k.confdeltype::text || chr(31)
       || (select string_agg(a.attname, ',') from pg_attribute a where a.attrelid = k.conrelid and a.attnum = any (k.conkey)) || chr(30)
  from pg_constraint k join pg_class s on s.oid = k.conrelid join pg_namespace sn on sn.oid = s.relnamespace
  join pg_class t on t.oid = k.confrelid join pg_namespace tn on tn.oid = t.relnamespace
 where k.contype = 'f' and sn.nspname in ('public', 'auth') and tn.nspname in ('public', 'auth')
 order by sn.nspname, s.relname, k.conname;
rollback;`;
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`the catalogue read failed: ${r.stderr.slice(0, 300)}`);
  const kat: Katalog = { fns: new Map(), pemicu: new Map(), fkKeluar: new Map(), fkMasuk: new Map() };
  const tambah = <T>(m: Map<string, T[]>, k: string, v: T) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const baris of r.stdout.split("\x1e")) {
    const b = baris.replace(/^\n+/, "");
    if (!b) continue;
    const [jenis, ...f] = b.split("\x1f");
    if (jenis === "F") tambah(kat.fns, f[0], f.slice(1).join("\x1f"));
    else if (jenis === "T") {
      const tt = Number(f[1]);
      const saat = tt & 2 ? "B" : "A";
      for (const [bit, ev] of [[4, "I"], [8, "D"], [16, "U"]] as const) if (tt & bit) tambah(kat.pemicu, `${f[0]}|${ev}|${saat}`, f[2]);
    } else if (jenis === "K") {
      tambah(kat.fkKeluar, f[0], { ke: f[1], kolom: (f[3] ?? "").split(",") });
      tambah(kat.fkMasuk, f[1], { dari: f[0], aksi: f[2] });
    }
  }
  return kat;
}

type Peristiwa = { k: "KUNCI"; t: string; kuat: number } | { k: "PANGGIL"; f: string } | { k: "PICU"; t: string; ev: string; saat: "B" | "A" };

/** One statement's events, in order: the calls inside it first, then its own locks, then what its writes fire. */
/** A statement's write, past the PL/pgSQL words before it in the same piece of text (found by C2's sweep: "begin insert
 *  into enrollments …" inside an exception block, and "… then update …", were not read as writes: an under-report). */
const KENDALI = /^\s*(?:(?:begin|then|else|loop|end\s+if|end\s+loop|end|exception\s+when\s+[\s\S]*?\bthen|(?:if|elsif)\s+[\s\S]*?\bthen|(?:for|while)\s+[\s\S]*?\bloop|declare\b[\s\S]*?\bbegin|<<[a-z_0-9]+>>)\b\s*)+/;
const tanpaKendali = (stmt: string) => {
  const m = stmt.match(KENDALI);
  if (!m) return stmt;
  const sisa = stmt.slice(m[0].length);
  return /^(?:with\b|insert\b|update\b|delete\b|merge\b)/.test(sisa) ? sisa : stmt;
};
function peristiwa(stmt0: string, kat: Katalog): Peristiwa[] {
  const stmt = tanpaKendali(stmt0);
  const ev: Peristiwa[] = [];
  // the calls, in the order they run: a call's arguments run before it, so each call is placed at its closing
  // parenthesis (found by the first run: "perform audit_write(…, recovery_assist_school(p))" read audit_write first)
  const panggilan: { di: number; e: Peristiwa }[] = [];
  for (const m of stmt.matchAll(/\b([a-z_][a-z0-9_]*)\s*\(/g)) {
    let d = 0, tutup = stmt.length;
    for (let i = m.index! + m[0].length - 1; i < stmt.length; i++) {
      if (stmt[i] === "(") d++;
      else if (stmt[i] === ")" && --d === 0) { tutup = i; break; }
    }
    if (PAGAR.test(m[1])) panggilan.push({ di: tutup, e: { k: "KUNCI", t: "FENCE", kuat: 3 } });
    else if (kat.fns.has(m[1])) panggilan.push({ di: tutup, e: { k: "PANGGIL", f: m[1] } });
  }
  for (const p of panggilan.sort((a, b) => a.di - b.di)) ev.push(p.e);
  const fkKe = (t: string, kolom?: string[]) => {
    if (!KUNCI_FK) return;
    for (const fk of kat.fkKeluar.get(t) ?? []) if (!kolom || fk.kolom.some((c) => kolom.includes(c))) ev.push({ k: "KUNCI", t: fk.ke, kuat: 0 });
  };
  // the order Postgres runs a write in: BEFORE row triggers, the row, the foreign-key checks (RI triggers, which fire
  // AFTER and, being named RI_…, before user AFTER triggers), then AFTER triggers. Found by the first run: reading the
  // foreign keys before the BEFORE triggers invented an upgrade at every insert into a person-attached table.
  const hapus = (t: string) => {
    ev.push({ k: "PICU", t, ev: "D", saat: "B" }, { k: "KUNCI", t, kuat: 3 });
    for (const fk of kat.fkMasuk.get(t) ?? []) {
      if (fk.aksi === "c") ev.push({ k: "PICU", t: fk.dari, ev: "D", saat: "B" }, { k: "KUNCI", t: fk.dari, kuat: 3 }, { k: "PICU", t: fk.dari, ev: "D", saat: "A" });
      else if (fk.aksi === "n" || fk.aksi === "d") ev.push({ k: "PICU", t: fk.dari, ev: "U", saat: "B" }, { k: "KUNCI", t: fk.dari, kuat: 2 }, { k: "PICU", t: fk.dari, ev: "U", saat: "A" });
    }
    ev.push({ k: "PICU", t, ev: "D", saat: "A" });
  };
  const up = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?update\\s+(?:only\\s+)?(${TBL.source})`));
  if (up) {
    const t = namaTabel(up[1]);
    const set = stmt.match(/\bset\b([\s\S]*?)(?:\bwhere\b|\bfrom\b|\breturning\b|$)/);
    const kolom = set ? [...set[1].matchAll(/(?:^|,)\s*\(?([a-z_][a-z0-9_]*)\s*(?:,|=|\))/g)].map((m) => m[1]) : [];
    ev.push({ k: "KUNCI", t, kuat: 2 }, { k: "PICU", t, ev: "U", saat: "B" });
    fkKe(t, kolom);
    ev.push({ k: "PICU", t, ev: "U", saat: "A" });
  }
  const del = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?delete\\s+from\\s+(?:only\\s+)?(${TBL.source})`));
  if (del) hapus(namaTabel(del[1]));
  const ins = stmt.match(new RegExp(`^\\s*(?:with\\b[\\s\\S]*?\\)\\s*)?insert\\s+into\\s+(${TBL.source})`));
  if (ins) {
    const t = namaTabel(ins[1]);
    ev.push({ k: "PICU", t, ev: "I", saat: "B" });
    fkKe(t);
    ev.push({ k: "PICU", t, ev: "I", saat: "A" });
    if (/\bon\s+conflict\b[\s\S]*\bdo\s+update\b/.test(stmt)) ev.push({ k: "KUNCI", t, kuat: 2 }, { k: "PICU", t, ev: "U", saat: "B" }, { k: "PICU", t, ev: "U", saat: "A" });
  }
  const merge = stmt.match(new RegExp(`^\\s*merge\\s+into\\s+(${TBL.source})`));
  if (merge) {
    const t = namaTabel(merge[1]);
    ev.push({ k: "PICU", t, ev: "I", saat: "B" }, { k: "PICU", t, ev: "U", saat: "B" }, { k: "KUNCI", t, kuat: 2 });
    fkKe(t);
    ev.push({ k: "PICU", t, ev: "I", saat: "A" }, { k: "PICU", t, ev: "U", saat: "A" });
  }
  const lk = stmt.match(/\bfor\s+(update|no\s+key\s+update|share|key\s+share)\b(?:\s+of\s+([a-z0-9_.,\s]+?))?(?:\s+(?:nowait|skip\s+locked))?\s*(?:$|\bloop\b|\binto\b|\blimit\b)/);
  if (lk && /\b(select|perform)\b/.test(stmt)) {
    const kuat = lk[1] === "update" ? 3 : lk[1] === "share" ? 1 : lk[1].includes("no") ? 2 : 0;
    const alias = new Map<string, string>();
    const dari: string[] = [];
    const BUKAN = ["where", "on", "join", "for", "order", "limit", "left", "inner", "using", "set", "cross", "lateral", "natural", "group", "having", "union", "into", "unnest"];
    // C2's reading (found by ranking enrollments): without OF, Postgres locks the tables of the top-level FROM, not those
    // of a sub-select in the WHERE clause; a sub-select in FROM is still counted (there the clause reaches into it)
    const atas = tanpaSubWhere(stmt);
    for (const fm of stmt.matchAll(new RegExp(`\\b(?:from|join)\\s+(${TBL.source})(?:\\s+(?:as\\s+)?([a-z_][a-z0-9_]*))?`, "g"))) {
      const t = namaTabel(fm[1]);
      if (BUKAN.includes(t)) continue;
      if (atas.includes(fm[0])) dari.push(t);
      alias.set(t.replace(/^auth\./, ""), t); alias.set(t, t);
      const a = fm[fm.length - 1];
      if (a && !BUKAN.includes(a)) alias.set(a, t);
    }
    const ts = lk[2] ? lk[2].split(/[,\s]+/).filter(Boolean).map((a) => alias.get(a)).filter((x): x is string => !!x) : dari;
    for (const t of ts) ev.push({ k: "KUNCI", t, kuat });
  }
  return ev;
}

/** The statement with every parenthesised sub-select after its top-level WHERE removed. */
function tanpaSubWhere(stmt: string): string {
  let d = 0, w = -1;
  for (let i = 0; i < stmt.length; i++) {
    const ch = stmt[i];
    if (ch === "(") d++; else if (ch === ")") d--;
    else if (d === 0 && /\bwhere\b/.test(stmt.slice(i, i + 6)) && (i === 0 || /\W/.test(stmt[i - 1]))) { w = i; break; }
  }
  if (w < 0) return stmt;
  let out = stmt.slice(0, w), i = w;
  while (i < stmt.length) {
    if (stmt[i] === "(" && /^\(\s*select\b/.test(stmt.slice(i))) {
      let dd = 0, j = i;
      for (; j < stmt.length; j++) { if (stmt[j] === "(") dd++; else if (stmt[j] === ")" && --dd === 0) break; }
      out += "( )"; i = j + 1;
    } else { out += stmt[i]; i++; }
  }
  return out;
}

export type Kunci = { t: string; kuat: number; lewat: string };

/** Every writer's ordered locks: each function, each trigger function in its R2 starting state, and Auth's writes. */
export function semuaKunci(kat: Katalog): Map<string, Kunci[]> {
  const memo = new Map<string, Kunci[]>();
  const tumpukan = new Set<string>();
  const picu = (t: string, ev: string, dari: string, saat?: "B" | "A"): Kunci[] => (saat ? [saat] : ["B", "A"])
    .flatMap((w) => kat.pemicu.get(`${t}|${ev}|${w}`) ?? [])
    .flatMap((tf) => daftar(tf).map((x) => ({ ...x, lewat: `${dari} > [${t} ${ev}] ${x.lewat}` })));
  // a list computed while a caller's call was cut (a cycle) lacks that caller's locks: it is not kept for other callers
  // (found by commit 3's sweep: finalize_session's list, first read under pengerjaan_putus_tenggat, lacked its locks)
  let potong = 0;
  const daftar = (fn: string): Kunci[] => {
    const ada = memo.get(fn);
    if (ada) return ada;
    if (tumpukan.has(fn)) { potong++; return []; }
    const potongAwal = potong;
    tumpukan.add(fn);
    const out: Kunci[] = [];
    for (const src of kat.fns.get(fn) ?? []) {
      for (const stmt of bersih(src).split(";")) {
        for (const e of peristiwa(stmt, kat)) {
          if (e.k === "KUNCI") out.push({ t: e.t, kuat: e.kuat, lewat: fn });
          else if (e.k === "PANGGIL" && e.f !== fn) out.push(...daftar(e.f).map((x) => ({ ...x, lewat: `${fn} > ${x.lewat}` })));
          else if (e.k === "PICU") out.push(...picu(e.t, e.ev, fn, e.saat));
        }
      }
    }
    tumpukan.delete(fn);
    if (potong === potongAwal) memo.set(fn, out);
    return out;
  };
  const semua = new Map<string, Kunci[]>();
  for (const fn of [...kat.fns.keys()].sort()) { const l = daftar(fn); if (l.some((x) => x.t in URUTAN)) semua.set(fn, l); }
  // R2: a trigger function read on its own starts with its table's rank held (UPDATE, DELETE), or nothing (INSERT)
  for (const [kunci, tfs] of [...kat.pemicu].sort(([a], [b]) => a.localeCompare(b))) {
    const [t, ev] = kunci.split("|");   // (the timing, the third part, does not change R2's starting state)
    if (ev === "I" || !(t in URUTAN)) continue;
    for (const tf of tfs) {
      const l: Kunci[] = [{ t, kuat: 2, lewat: `[${t} ${ev}]` }, ...daftar(tf).map((x) => ({ ...x, lewat: `[${t} ${ev}] ${x.lewat}` }))];
      if (l.length > 1) semua.set(`${tf} [${t} ${ev}]`, l);
    }
  }
  // Auth's own writes: it holds auth.users while our triggers on it run
  semua.set("(GoTrue U auth.users)", [{ t: "auth.users", kuat: 2, lewat: "GoTrue" }, ...picu("auth.users", "U", "GoTrue")]);
  const i = picu("auth.users", "I", "GoTrue");
  if (i.length) semua.set("(GoTrue I auth.users)", i);
  return semua;
}

/** Every breach of a list, in order: a row taken before the fence, a lock out of order, an upgrade. (All of them, not
 *  the first: a declared exception covers one breach, never the ones after it.) */
export function pelanggaran(l: Kunci[]): string[] {
  const out: string[] = [];
  const pagar = l.findIndex((x) => x.t === "FENCE");
  if (pagar > 0) {
    const sebelum = l.slice(0, pagar).find((x) => !(x.t in URUTAN) || URUTAN[x.t] > SIKLUS_HIDUP);
    if (sebelum) out.push(`${sebelum.t} locked before the fence (B1: the fence is the first lock after ranks 1 to 6) — via ${sebelum.lewat}`);
  }
  let puncak = 0, di: Kunci | null = null;
  const kuat = new Map<string, Kunci>();
  for (const x of l) {
    if (!(x.t in URUTAN)) continue;
    const r = URUTAN[x.t];
    if (r < puncak) out.push(`${x.t} (rank ${r}) after ${di!.t} (rank ${puncak}) — via ${x.lewat}; earlier via ${di!.lewat}`);
    if (r > puncak) { puncak = r; di = x; }
    const s = kuat.get(x.t);
    if (s && x.kuat > s.kuat && s.kuat < 2) out.push(`an upgrade on ${x.t}: strength ${s.kuat} via ${s.lewat}, then ${x.kuat} via ${x.lewat}`);
    if (!s || x.kuat > s.kuat) kuat.set(x.t, x);
  }
  return [...new Set(out)];
}
const dikecualikan = (kat: Katalog, fn: string, v: string, l?: Kunci[]) =>
  PENGECUALIAN.some((p) => (p.penulis === "*" || fn === p.penulis)
    && (typeof p.lewat === "string" ? v.includes(p.lewat) : typeof p.lewat === "function" ? p.lewat(v) : p.lewat.test(lewatAkhir(v)))
    && (!p.syarat || p.syarat(kat, l, v)));

/** R3: the per-function report, one line per writer, of the ranked tables it locks in order (strength in brackets). */
export function laporan(semua: Map<string, Kunci[]>): string {
  return [...semua].map(([fn, l]) => `${fn}: ${l.filter((x) => x.t in URUTAN).map((x) => `${x.t}(${x.kuat})`).join(" ")}`).join("\n") + "\n";
}

export function bacaUrutan(db: string, tanam = "") {
  const kat = bacaKatalog(db, tanam);
  const semua = semuaKunci(kat);
  const salah: string[] = [];
  for (const [fn, l] of semua) for (const v of pelanggaran(l)) if (!dikecualikan(kat, fn, v, l)) salah.push(`${fn}: ${v}`);
  const disebut = (b: string) => Object.keys(URUTAN).some((t) => t !== "FENCE" && new RegExp(`\\b${t.replace(".", "\\.")}\\b`).test(b));
  const dinamis = [...kat.fns].filter(([, bs]) => bs.some((b) => /\bexecute\b/.test(bersih(b)) && disebut(bersih(b)))).map(([f]) => f);
  return { fungsi: [...kat.fns.values()].reduce((n, b) => n + b.length, 0), menyentuh: semua.size, salah, dinamis, semua, kat };
}

const TANAM = {
  P1: `create function public._a2a_l01_p1(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.accounts a where a.person_id = p for update; perform 1 from public.persons where id = p for update; end $t$;`,
  P1b: `create function public._a2a_l01_p1b(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.persons where id = p for share; update public.persons set updated_at = now() where id = p; end $t$;`,
  P2: `do $t$ declare f oid := 'public.akun_kunci(uuid,boolean)'::regprocedure; begin
  execute format('create or replace function public.akun_kunci(%s) returns %s language plpgsql as %L', pg_get_function_arguments(f),
    pg_get_function_result(f), 'begin perform 1 from public.accounts a where a.person_id = $1 for update; '
    || 'update auth.users set banned_until = null where false; return 0; end');
end $t$;`,
  P3: `create function public._a2a_l01_p3(p uuid) returns void language plpgsql as $t$
begin perform public.pagar_darurat_bersama(); perform 1 from public.accounts a where a.person_id = p for update; end $t$;`,
  P6: `create function public._a2a_l01_p6(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.persons where id = p for update; update auth.users set encrypted_password = 'x' where id = p; end $t$;`,
  P5: `create function public._a2a_l01_p5(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.learning_assignments la where la.id = p for update; perform public.pagar_darurat_bersama(); end $t$;`,
};

// ── A2A-L02: the recovery path on two real connections (Sharon's ruling 3)
const PLANT_TANPA_JAGA = `create or replace function public.recovery_assist_school(p_person uuid) returns uuid language plpgsql stable
  security definer set search_path = public, pg_temp as $t$
begin if public.sekolah_memegang(p_person, gen_random_uuid()) then return null; end if; return null; end $t$`;   // a non-null school: sekolah_memegang returns before its lock on a null one
function psql1(db: string, sql: string) {
  const r = spawnSync("psql", [db, "-XqAt", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr.slice(0, 300));
  return r.stdout.trim();
}
/** A holds the person FOR UPDATE; B, with no PINTAR person, makes Auth's level-3 email-recovery password write with a 1 s
 *  lock timeout and rolls it back. The permit, the grant and the ladder are committed before, and removed after. */
async function balapanPemulihan(db: string, u: string, p: string, pid: string) {
  const { balapan } = await import("./balapan");
  const { randomBytes } = await import("node:crypto");
  const hash = randomBytes(32).toString("hex");   // the grant's token_hash is a 64-character hex digest
  psql1(db, `insert into public.password_write_permits (auth_user_id, purpose, expires_at) values ('${u}', 'RECOVERY', now() + interval '10 min');
    insert into public.password_recovery_grants (token_hash, auth_user_id, via, expires_at) values ('${hash}', '${u}', 'EMAIL', now() + interval '10 min');
    insert into public.recovery_ladder (typed_id, level, suspended_at) values ('${pid}', 3, now())
      on conflict (typed_id) do update set level = 3, suspended_at = now();`);
  try {
    return await balapan(`select 1 from public.persons where id = '${p}' for update`,
      `begin; set local lock_timeout = '1s'; update auth.users set encrypted_password = extensions.crypt('a2a-l02', extensions.gen_salt('bf')) where id = '${u}'; rollback;`);
  } finally {
    psql1(db, `delete from public.password_write_permits where auth_user_id = '${u}' and purpose = 'RECOVERY';
      delete from public.password_recovery_grants where token_hash = '${hash}';
      delete from public.recovery_ladder where typed_id = '${pid}';`);
  }
}

// ── A2A-L03: finalize_session against the hold, on two real connections (Sharon, A2A-L01-FINDING-f09da528.md)
const SESI_L03 = "a2a10300-0000-4000-8000-000000000001";
/** The fixture: a copy of a finalized sitting, IN_PROGRESS and a day past its deadline, committed (replica role: no
 *  trigger; the copy is the only row the test makes, and it is removed after). Returns its learner. */
function sesiL03(db: string): string {
  return psql1(db, `begin; set local session_replication_role = replica;
    insert into public.assessment_sessions
    select (jsonb_populate_record(s, jsonb_build_object('id', '${SESI_L03}', 'status', 'IN_PROGRESS',
      'authoritative_deadline', now() - interval '1 day', 'finalized_at', null, 'submitted_at', null,
      'closure_kind', null, 'closure_at', null, 'frozen_at', null, 'unfrozen_at', null))).*
      from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
    commit;
    select person_id from public.assessment_sessions where id = '${SESI_L03}';`).split("\n").pop()!;
}
/** A: the hold's own order (tangguhkan_akun → pengerjaan_tahan_orang): the learner FOR UPDATE, then, 1.5 s later, the
 *  learner's sittings in the statuses the hold takes, by pengerjaan_tahan_orang's own query; rolled back. B, 0.5 s after
 *  A began: the real finalize_session of the fixture, rolled back. */
async function balapanTahan(db: string, orang: string) {
  const { psqlLain, tidur } = await import("./balapan");
  const a = psqlLain(`begin; select 1 from public.persons where id = '${orang}' for update; select pg_sleep(1.5);
    select count(*) from (select a.id from public.assessment_sessions a where a.person_id = '${orang}'
      and a.status in ('CREATED', 'IN_PROGRESS', 'PAUSED') and not (a.frozen_at is not null and a.unfrozen_at is null)
      order by a.id for update) z; select pg_sleep(0.3); rollback;`);
  await tidur(500);
  const b = psqlLain(`begin; select public.finalize_session('${SESI_L03}'); rollback;`);
  const [satu, dua] = await Promise.all([a, b]);
  return { satu, dua };
}
// the plant: both of the learner's first locks finalize_session reaches removed (its own, and pengerjaan_putus_tenggat's,
// which it calls first) — the code as it was on 245
const KUNCI_FINAL = "  perform 1 from public.persons where id = v_s.person_id for key share;\n";
const KUNCI_TENGGAT = "  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n";

// ── A2A-L04: akhiri_pendaftaran against person → enrolment, on two real connections (Sharon, C1)
const L04_BARU = "  select e.person_id into v_orang from public.enrollments e where e.id = p_enrollment;\n"
  + "  perform 1 from public.persons where id = v_orang for update;\n"
  + "  select e.id, e.person_id, e.institution_id, e.status, e.valid_from into en\n"
  + "    from public.enrollments e where e.id = p_enrollment for update;\n";
// the plant: commit 3's order (the enrolment row, then its person)
const L04_LAMA = "  select e.id, e.person_id, e.institution_id, e.status, e.valid_from into en\n"
  + "    from public.enrollments e where e.id = p_enrollment for update;\n"
  + "  perform 1 from public.persons where id = en.person_id for update;\n";
/** A: kenaikan_tetapkan's and transfer_execute's order, the person FOR UPDATE, then (1.5 s later) the enrolment FOR
 *  UPDATE; rolled back. B, 0.5 s after: the real akhiri_pendaftaran as the school's admin; rolled back. */
async function balapanDaftar(e: string, orang: string, admin: string) {
  const { psqlLain, tidur } = await import("./balapan");
  const a = psqlLain(`begin; select 1 from public.persons where id = '${orang}' for update; select pg_sleep(1.5);
    select 1 from public.enrollments where id = '${e}' for update; select pg_sleep(0.3); rollback;`);
  await tidur(500);
  const b = psqlLain(`begin; select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
    select public.akhiri_pendaftaran('${e}', 'WITHDRAWN', null, null); rollback;`);
  const [satu, dua] = await Promise.all([a, b]);
  return { satu, dua };
}

// ── A2A-L05: a key correction takes the learner first (Sharon, the 76, row 3; migration 20270118130000)
const KOREKSI_L05 = "a2a10500-0000-4000-8000-000000000001";
const KUNCI_KOREKSI = "  perform 1 from public.persons p, public.assessment_sessions a where a.id = p_session and p.id = a.person_id for key share of p;\n";
/** A holds the learner FOR UPDATE for 1.5 s; B, 0.5 s after, runs the real hitung_ulang_koreksi_kunci of a sitting
 *  with a confirmed correction (the fixture: it does not touch this sitting's questions, so B is refused once it holds
 *  the sitting). Both rolled back. B's time says whether it took the learner before the sitting. */
async function balapanKoreksi(sesi: string, orang: string) {
  const { psqlLain, tidur } = await import("./balapan");
  const a = psqlLain(`begin; select 1 from public.persons where id = '${orang}' for update; select pg_sleep(1.5); rollback;`);
  await tidur(500);
  const b = psqlLain(`begin; select public.hitung_ulang_koreksi_kunci('${sesi}', '${KOREKSI_L05}'); rollback;`);
  const [satu, dua] = await Promise.all([a, b]);
  return { satu, dua };
}

// ── A2A-L06: a transfer is requested after its learner (Sharon, C1 rows 7; migration 20270118120000)
const L06_KUNCI = "  perform 1 from public.persons where id = e.person_id for key share;\n";
/** A: akhiri_pendaftaran's order after C1, the person FOR UPDATE, then (1.5 s later) the enrolment FOR UPDATE; B, 0.5 s
 *  after: the real transfer_minta of that enrolment as its school's admin. Both rolled back. */
async function balapanPindah(e: string, orang: string, admin: string, tujuan: string) {
  const { psqlLain, tidur } = await import("./balapan");
  const a = psqlLain(`begin; select 1 from public.persons where id = '${orang}' for update; select pg_sleep(1.5);
    select 1 from public.enrollments where id = '${e}' for update; select pg_sleep(0.3); rollback;`);
  await tidur(500);
  const b = psqlLain(`begin; select set_config('request.jwt.claims', '{"sub":"${admin}","role":"authenticated"}', true);
    select public.transfer_minta('${e}', '${tujuan}', 'A2A-L06 race'); rollback;`);
  const [satu, dua] = await Promise.all([a, b]);
  return { satu, dua };
}

export const a2aL01Tests: SelfTest[] = [
  {
    id: "A2A-L01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      // the plants first: the engine must report each before its reading of the real code is trusted
      const t = bacaUrutan(db, [TANAM.P1, TANAM.P1b, TANAM.P3, TANAM.P5].join("\n"));
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p1:") && /persons \(rank 1\) after accounts/.test(s)), "plant P1 (accounts, then persons) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p1b:") && /an upgrade on persons/.test(s)), "plant P1b (FOR SHARE, then UPDATE, on persons) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p3:") && /accounts \(rank 5\) after FENCE/.test(s)), "plant P3 (accounts after the fence) was not reported");
      c.expect(t.salah.some((s) => s.startsWith("_a2a_l01_p5:") && /learning_assignments locked before the fence/.test(s)), "plant P5 (a row before the fence, B1) was not reported");
      // P6 (row 13's condition): a lifecycle update that sets the password is not covered by the guard's early return
      const p6 = bacaUrutan(db, TANAM.P6);
      c.expect(p6.salah.some((s) => s.startsWith("_a2a_l01_p6:") && /auth_password_write_guard/.test(s)), "plant P6 (an update of auth.users setting the password) was not reported");
      const p2 = bacaUrutan(db, TANAM.P2);
      c.expect(p2.salah.some((s) => s.startsWith("tangguhkan_akun:") && /auth\.users \(rank 4\) after accounts/.test(s)), "plant P2 (akun_kunci locking accounts before auth.users) was not reported at tangguhkan_akun");
      // the permit's condition 1, its plants (A2A-F01's form): each planted text is caught; the repository is clean
      const izinTanam = authUsersDihapus([
        { path: "tanam.sql", text: "delete from auth.users where id = x;" },
        { path: "tanam2.sql", text: "select 1 from auth.users u where u.id = x for update;" },
        { path: "src/tanam.ts", text: "await admin.auth.admin.deleteUser(id);" },
      ]);
      c.expect(izinTanam.length === 3, `the permit's repository check missed a plant: ${izinTanam.join("; ")}`);
      c.expect(authUsersDihapus([{ path: "ok.sql", text: "perform 1 from auth.users u where u.id = x for no key update;" }]).length === 0,
        "the permit's repository check reported FOR NO KEY UPDATE");
      // the real code
      const r = bacaUrutan(db);
      c.expect(r.menyentuh >= 40, `only ${r.menyentuh} writer(s) were found touching the ranked tables: the engine reads too little`);
      for (const fn of ["tangguhkan_akun", "aktifkan_kembali_akun", "akun_kunci", "hapus_data_pribadi", "(GoTrue U auth.users)"])
        c.expect(r.semua.has(fn), `${fn} was not read as a locker: the engine reads too little`);
      c.expect(r.salah.length === 0, `out of the order, upgraded, or a row before the fence (${r.salah.length}):\n  ${r.salah.join("\n  ")}`);
      const baru = r.dinamis.filter((f) => !(f in SQL_DINAMIS));
      c.expect(baru.length === 0, `dynamic SQL naming a ranked table, not declared: ${baru.join(", ")}`);
      // R3: the committed report is the one the code gives
      const tersimpan = readFileSync(join(repoRoot, "selftest", "a2a-l01-laporan.txt"), "utf8");
      const kini = laporan(r.semua);
      if (tersimpan !== kini) {
        const a = new Set(tersimpan.split("\n")), b = new Set(kini.split("\n"));
        const beda = [...[...b].filter((x) => !a.has(x)).map((x) => `+ ${x}`), ...[...a].filter((x) => !b.has(x)).map((x) => `- ${x}`)].slice(0, 12);
        c.expect(false, `the lock report differs from selftest/a2a-l01-laporan.txt (regenerate with npx tsx scripts/dev/a2a-l01-laporan.ts and read the difference):\n  ${beda.join("\n  ")}`);
      }
      return c.verdict(`${r.menyentuh} writers of ${r.fungsi} functions lock the ranked tables in order, no upgrade, no row before the fence; five plants reported; the report as committed`);
    },
  },
  {
    // A2A-L02 — Auth's recovery password write never waits on a person a lifecycle act holds (Sharon's ruling 3):
    // the declared exception's evidence. Red with its plant: recovery_assist_school reaching sekolah_memegang.
    id: "A2A-L02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const [u, p, pid] = psql1(db, `select u.id || '|' || a.person_id || '|' || ps.pintar_id from auth.users u
        join public.accounts a on a.auth_user_id = u.id and a.kind = 'EMAIL' join public.persons ps on ps.id = a.person_id
        where ps.anonymized_at is null and ps.pintar_id is not null order by u.id limit 1`).split("|");
      c.expect(!!u && !!p && !!pid, "no synthetic person with an email account to test with");
      const r = await balapanPemulihan(db, u, p, pid);
      c.expect(r.satu.ok, `connection A did not hold the person: ${r.satu.err}`);
      c.expect(r.dua.ok, `Auth's recovery password write waited on the person A held: ${r.dua.err || "(failed)"}`);
      c.expect(r.dua.ms < 2000, `Auth's recovery password write took ${r.dua.ms} ms while A held the person: it waited`);
      // the plant: the guard removed, so the path reaches sekolah_memegang; the same race must now fail
      const asli = psql1(db, `select pg_get_functiondef('public.recovery_assist_school(uuid)'::regprocedure)`);
      psql1(db, PLANT_TANPA_JAGA);
      let tanam: Awaited<ReturnType<typeof balapanPemulihan>>;
      try { tanam = await balapanPemulihan(db, u, p, pid); } finally { psql1(db, asli); }
      c.expect(!tanam.dua.ok && /lock timeout|canceling statement due to lock/i.test(tanam.dua.err),
        `with the plant (sekolah_memegang reached), the write did not wait on A's lock: ${tanam.dua.ok ? "it succeeded" : tanam.dua.err}`);
      c.expect(psql1(db, `select count(*) from public.password_write_permits where auth_user_id = '${u}' and purpose = 'RECOVERY'`) === "0",
        "the test left a permit behind");
      return c.verdict(`Auth's recovery password write went through in ${r.dua.ms} ms while A held the person; with the plant it waited and timed out`);
    },
  },
  {
    // A2A-L03 — a sitting is written after its learner (Sharon, A2A-L01-FINDING-f09da528.md; migration 20270118110000):
    // finalize_session of a sitting past its deadline, while the hold holds the learner and wants that sitting, waits
    // for the hold and then finishes; no deadlock. Red with its plant (the learner's first locks removed: 245's code).
    id: "A2A-L03",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const orang = sesiL03(db);
      c.expect(/^[0-9a-f-]{36}$/.test(orang), "no finalized sitting to copy for the fixture");
      try {
        const r = await balapanTahan(db, orang);
        c.expect(r.satu.ok, `the hold (A) failed: ${r.satu.err}`);
        c.expect(r.dua.ok, `finalize_session (B) failed while the hold held its learner: ${r.dua.err}`);
        c.expect(r.dua.ms >= 1100, `finalize_session took ${r.dua.ms} ms: it did not wait for the hold, so the race did not overlap`);
        // the plant: 245's order (the sitting first) must deadlock
        const balik1 = gantiFungsi("public.finalize_session(uuid)", KUNCI_FINAL, "");
        let tanam: Awaited<ReturnType<typeof balapanTahan>>;
        try {
          const balik2 = gantiFungsi("public.pengerjaan_putus_tenggat(uuid,boolean)", KUNCI_TENGGAT, "");
          try { tanam = await balapanTahan(db, orang); } finally { balik2(); }
        } finally { balik1(); }
        const mati = [tanam.satu, tanam.dua].filter((x) => !x.ok && /deadlock detected/.test(x.err));
        c.expect(mati.length === 1, `with the plant (the sitting before its learner) there was no deadlock: A ${tanam.satu.ok ? "ok" : tanam.satu.err}; B ${tanam.dua.ok ? "ok" : tanam.dua.err}`);
        return c.verdict(`finalize_session waited ${r.dua.ms} ms for the hold, then finished; with the plant (245's order) "deadlock detected"`);
      } finally {
        psql1(db, `begin; set local session_replication_role = replica; delete from public.assessment_sessions where id = '${SESI_L03}'; commit;`);
      }
    },
  },
  {
    // A2A-L04 — an enrolment is ended after its learner (Sharon, C1; migration 20270118120000): akhiri_pendaftaran,
    // while another transaction holds the learner and wants the enrolment (kenaikan_tetapkan's, transfer_execute's
    // order), waits and then finishes; no deadlock. Red with its plant (commit 3's order: the enrolment, then the person).
    id: "A2A-L04",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const [e, orang, admin] = psql1(db, `select e.id || '|' || e.person_id || '|' || a.auth_user_id from public.enrollments e
        join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = e.institution_id
         and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
        join public.accounts a on a.person_id = r.person_id
       where e.status = 'ACTIVE' and e.valid_to is null and r.person_id <> e.person_id order by e.id limit 1`).split("|");
      c.expect(!!e && !!orang && !!admin, "no live enrolment with a school admin to test with");
      const r = await balapanDaftar(e, orang, admin);
      c.expect(r.satu.ok, `A (person, then enrolment) failed: ${r.satu.err}`);
      c.expect(r.dua.ok, `akhiri_pendaftaran (B) failed while A held the learner: ${r.dua.err}`);
      c.expect(r.dua.ms >= 1100, `akhiri_pendaftaran took ${r.dua.ms} ms: it did not wait for A, so the race did not overlap`);
      const balik = gantiFungsi("public.akhiri_pendaftaran(uuid,text,text,date)", L04_BARU, L04_LAMA);
      let tanam: Awaited<ReturnType<typeof balapanDaftar>>;
      try { tanam = await balapanDaftar(e, orang, admin); } finally { balik(); }
      const mati = [tanam.satu, tanam.dua].filter((x) => !x.ok && /deadlock detected/.test(x.err));
      c.expect(mati.length === 1, `with the plant (the enrolment before its person) there was no deadlock: A ${tanam.satu.ok ? "ok" : tanam.satu.err}; B ${tanam.dua.ok ? "ok" : tanam.dua.err}`);
      return c.verdict(`akhiri_pendaftaran waited ${r.dua.ms} ms for the learner, then finished; with the plant (commit 3's order) "deadlock detected"`);
    },
  },
  {
    // A2A-L05 — a key correction takes the learner before the sitting (Sharon, the 76, row 3): while another
    // transaction holds the learner, hitung_ulang_koreksi_kunci waits before it touches the sitting. No deadlock is
    // claimed: Sharon found no live counterpart. Red with its plant (the learner's line removed: it reaches the sitting).
    id: "A2A-L05",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const [sesi, orang, soal, lain] = psql1(db, `select s.id || '|' || s.person_id || '|' || p.item_id || '|'
          || (select q.id from public.persons q where q.id <> s.person_id order by q.id limit 1)
        from public.assessment_sessions s join public.presented_items p on p.session_id = s.id
       where s.status = 'FINALIZED' order by s.id, p.item_id limit 1`).split("|");
      c.expect(!!sesi && !!orang && !!soal && !!lain, "no finalized sitting with a presented question to test with");
      const nol = "00000000-0000-0000-0000-000000000000";
      psql1(db, `begin; set local session_replication_role = replica;
        insert into public.key_corrections (id, institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id,
          question_digest, key_before, key_after, reason, proposed_by_person_id, status, corrected_item_id, decided_at, decided_by_person_id)
        values ('${KOREKSI_L05}', '${nol}', '${nol}', '${soal}', '${soal}', '${nol}', '${nol}', 'x', '{}', '{${soal}}',
          'A2A-L05 race fixture', '${lain}', 'CONFIRMED', '${soal}', now(), '${orang}') on conflict (id) do nothing; commit;`);
      try {
        const r = await balapanKoreksi(sesi, orang);
        c.expect(r.satu.ok, `A (the learner held) failed: ${r.satu.err}`);
        c.expect(r.dua.ms >= 800, `hitung_ulang_koreksi_kunci took ${r.dua.ms} ms while the learner was held: it did not wait for the learner first`);
        const balik = gantiFungsi("public.hitung_ulang_koreksi_kunci(uuid,uuid)", KUNCI_KOREKSI, "");
        let tanam: Awaited<ReturnType<typeof balapanKoreksi>>;
        try { tanam = await balapanKoreksi(sesi, orang); } finally { balik(); }
        c.expect(tanam.dua.ms < 500 && /not recalculated|did not present/.test(tanam.dua.err),
          `with the plant (the sitting before the learner) B did not reach the sitting while the learner was held: ${tanam.dua.ms} ms, ${tanam.dua.err || "ok"}`);
        return c.verdict(`hitung_ulang_koreksi_kunci waited ${r.dua.ms} ms for the learner before its sitting; with the plant it reached the sitting in ${tanam.dua.ms} ms`);
      } finally {
        psql1(db, `begin; set local session_replication_role = replica; delete from public.key_corrections where id = '${KOREKSI_L05}'; commit;`);
      }
    },
  },
  {
    // A2A-L06 — a transfer is requested after its learner (Sharon, C1 with rows 7 to 9): transfer_minta, while
    // akhiri_pendaftaran's order (person, then enrolment) holds the learner, waits and then finishes; no deadlock.
    // Its plant (the line removed) shows the attachment guard already takes the person first: row 7 was not real.
    id: "A2A-L06",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const { gantiFungsi } = await import("./balapan");
      const [e, orang, admin, tujuan] = psql1(db, `select e.id || '|' || e.person_id || '|' || a.auth_user_id || '|'
          || (select i.id from public.institutions i where i.is_active and i.id <> e.institution_id order by i.id limit 1)
        from public.enrollments e
        join public.role_assignments r on r.role = 'INSTITUTION_ADMIN' and r.institution_id = e.institution_id
         and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until
        join public.accounts a on a.person_id = r.person_id
       where e.status = 'ACTIVE' and e.valid_to is null and r.person_id <> e.person_id
         and not exists (select 1 from public.transfers t where t.from_enrollment_id = e.id and t.status in ('REQUESTED', 'AUTHORIZED'))
       order by e.id limit 1`).split("|");
      c.expect(!!e && !!orang && !!admin && !!tujuan, "no live enrolment, school admin and second school to test with");
      const r = await balapanPindah(e, orang, admin, tujuan);
      c.expect(r.satu.ok, `A (person, then enrolment) failed: ${r.satu.err}`);
      c.expect(r.dua.ok, `transfer_minta (B) failed while A held the learner: ${r.dua.err}`);
      c.expect(r.dua.ms >= 1100, `transfer_minta took ${r.dua.ms} ms: it did not wait for A, so the race did not overlap`);
      const balik = gantiFungsi("public.transfer_minta(uuid,uuid,text)", L06_KUNCI, "");
      let tanam: Awaited<ReturnType<typeof balapanPindah>>;
      try { tanam = await balapanPindah(e, orang, admin, tujuan); } finally { balik(); }
      // FOUND BY THIS RACE (for Sharon): without the line, the transfer's attachment guard (orang_lampiran_jaga, BEFORE
      // INSERT) already takes the person FOR SHARE before the foreign keys check the enrolment, so the plant does not
      // deadlock: row 7 was not real, and the line is redundant (KEY SHARE, then SHARE: compatible). The plant is kept
      // as the evidence of that order: B still waits for the learner before the enrolment.
      c.expect(tanam.satu.ok && tanam.dua.ok && tanam.dua.ms >= 1100,
        `with the plant, the guard did not order the person first: A ${tanam.satu.ok ? "ok" : tanam.satu.err}; B ${tanam.dua.ok ? `ok in ${tanam.dua.ms} ms` : tanam.dua.err}`);
      return c.verdict(`transfer_minta waited ${r.dua.ms} ms for the learner, then finished; without the line it still waited (${tanam.dua.ms} ms): the attachment guard takes the person first`);
    },
  },
];
