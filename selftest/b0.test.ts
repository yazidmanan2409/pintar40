/**
 * B0 · ADMINISTRATOR LOCK-OUT PROTECTION, the database half (docs/completion-4.1/batches/B0-COMPLETION.md; migration
 * 20270113170000). Synthetic Alpha and the synthetic platform admin; every scenario but the race is rolled back.
 *
 *   B0-S01  db, rolled back: the last-holder rule in role_assignments_guard. The platform's last usable SYSTEM_ADMIN
 *           role is revoked by nobody (its holder, the database owner, one statement over every holder); a school's
 *           last usable INSTITUTION_ADMIN role is not revoked by a school admin (revoke_role), by a path with no
 *           actor, or through «Akhiri tugas» and «Ubah peran»; a platform admin may (revoke_role, «Akhiri tugas»,
 *           buka_kembali_akun); a second holder who is suspended, closed, anonymised or expired is not the remaining
 *           one; with a usable second holder each revocation is accepted; a refusal is recorded afterwards, and only
 *           a true one.
 *   B0-S02  db, rolled back: perpanjang_peran. One transaction, exactly one live assignment, audited with its reason;
 *           the last school admin renewed without tripping the rule; never one's own role, except the platform's only
 *           usable administrator (refused once a usable second exists; allowed while the second is suspended); every
 *           other self-grant still refused, a forged marker included.
 *   B0-S03  db, rolled back: operator_appoint_platform_admin. Refused while a usable platform admin exists and for a
 *           person who does not exist, writing nothing; never a signed-in caller's; with no usable platform admin it
 *           appoints one existing person, audited with the reason and the operator's reference, once.
 *   B0-S04  db, rolled back: peran_akan_berakhir. A role ending in 30 days is listed at 30 and one ending in 31 is
 *           not; the holder reads their own, a school's admin that school's, a platform admin the platform's; nobody
 *           else's; peran_pemegang_terakhir for whoever may revoke.
 *   B0-K01  reads the source: every code peran_tolak raises is either a signed-in caller's (src/lib/peran-kontrak.ts, each
 *           with its sentence in hle.ts, Indonesian and English), the operator's, or the recorder's own; the guard asks
 *           the last-holder rule on the revocation; no revoking function carries a check of its own.
 *   B0-C01  db, two real connections: two administrators revoke each other. The first holds its transaction; the
 *           second waits on the school's row (the platform's for SYSTEM_ADMIN) and is refused once the first commits,
 *           whichever path it took (revoke_role, «Akhiri tugas», «Ubah peran»). The refused side always rolls back,
 *           so the seeded administrators stand afterwards.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import { KODE_PERAN, KODE_PERAN_DB, KODE_PERAN_DICATAT, kodePeranDariGalat, kunciKodePeran } from "../src/lib/peran-kontrak";

const MIGRASI = "supabase/migrations/20270113170000_the_last_administrator_is_never_removed.sql";

const EMAIL = {
  sys: "sysadmin@synthetic.pintar.test",
  admin: "alpha-admin@synthetic.pintar.test",
  guru: "alpha-guru@synthetic.pintar.test",
  hod: "alpha-hod@synthetic.pintar.test",
  dean: "alpha-dean@synthetic.pintar.test",
  lain: "beta-admin@synthetic.pintar.test",
} as const;

type Ids = { inst: string; s: string; a: string; g: string; h: string; d: string; ra_s: string; ra_a: string; ra_gu: string; pid_h: string; pid_s: string };

const ALASAN = "uji B0: alasan yang cukup panjang";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}
function psql(sql: string): { ok: boolean; out: string; err: string } {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
  const err = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop() ?? "";
  return { ok: r.status === 0, out: (r.stdout || "").trim(), err };
}

/** The role-switch helpers (selftest.as_user, as_owner) and the people and assignments every scenario names. */
function siapkan(repoRoot: string): Ids | string {
  spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", "fable01.sql"), db()], { encoding: "utf8" });
  const orang = (e: string) => `(select ac.person_id from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = '${e}')`;
  const r = psql(`
    with o as (select ${orang(EMAIL.sys)} as s, ${orang(EMAIL.admin)} as a, ${orang(EMAIL.guru)} as g, ${orang(EMAIL.hod)} as h, ${orang(EMAIL.dean)} as d),
         i as (select ra.institution_id as inst, ra.id as ra_a from public.role_assignments ra, o
                where ra.person_id = o.a and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id)
    select jsonb_build_object('inst', i.inst, 's', o.s, 'a', o.a, 'g', o.g, 'h', o.h, 'd', o.d, 'ra_a', i.ra_a,
             'ra_s', (select ra.id from public.role_assignments ra where ra.person_id = o.s and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until),
             'ra_gu', (select ra.id from public.role_assignments ra where ra.person_id = o.g and ra.role = 'EDUCATOR' and ra.institution_id = i.inst and ra.revoked_at is null order by ra.created_at limit 1),
             'pid_h', (select p.pintar_id from public.persons p where p.id = o.h),
             'pid_s', (select p.pintar_id from public.persons p where p.id = o.s),
             'sys_lain', (select count(*) from public.role_assignments ra where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null and now() < ra.valid_until and ra.person_id <> o.s),
             'admin_lain', (select count(*) from public.role_assignments ra where ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = i.inst and ra.revoked_at is null and now() < ra.valid_until and ra.person_id <> o.a))::text
      from o, i`);
  if (!r.ok || !r.out) return `the synthetic world could not be read: ${r.err || "no Alpha administrator"}`;
  const v = JSON.parse(r.out) as Ids & { sys_lain: number; admin_lain: number };
  for (const k of ["inst", "s", "a", "g", "h", "d", "ra_s", "ra_a", "ra_gu", "pid_h", "pid_s"] as const) if (!v[k]) return `the synthetic world has no ${k}`;
  if (Number(v.sys_lain) !== 0 || Number(v.admin_lain) !== 0) {
    return `the synthetic world is not as seeded: ${v.sys_lain} other platform admin(s), ${v.admin_lain} other Alpha administrator(s)`;
  }
  return v;
}

// ------------------------------------------------------------------ one rolled-back scenario
type Opsi = { tetap?: boolean; prep?: string; cek?: string };
const q = (s: string) => `$q$${s}$q$`;
/** One probe: as `email` (the database owner when null) run `sql`; undone unless `tetap`; `prep` first, as the owner; `cek` read after, as the owner. */
function langkah(k: string, email: string | null, sql: string, o: Opsi = {}): string {
  return `v := v || jsonb_build_object('${k}', pg_temp.coba(${email ? `'${email}'` : "null"}, ${q(sql)}, ${o.tetap ? "false" : "true"}, ${o.prep ? q(o.prep) : "null"}, ${o.cek ? q(o.cek) : "null"}));`;
}

/**
 * pg_temp.coba answers «ok:<value>[|<check>]» or «<SQLSTATE>:<DETAIL, or the message's first 60 characters>». A probe
 * runs in its own subtransaction and is undone whatever it answered (unless kept), so an accepted revocation never
 * changes what the next probe meets.
 */
function skenario(langkah2: string[]): string {
  return `
begin;
create function pg_temp.coba(p_email text, p_sql text, p_undo boolean, p_prep text, p_cek text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text; v_cek text;
begin
  begin
    perform selftest.as_owner();
    if p_prep is not null then execute p_prep; end if;
    if p_email is not null then perform selftest.as_user(p_email); end if;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
    perform selftest.as_owner();
    if p_cek is not null then execute p_cek into v_cek; v_out := v_out || '|' || coalesce(v_cek, ''); end if;
    if p_undo then raise exception using errcode = 'B0UND', message = 'undo'; end if;
  exception
    when sqlstate 'B0UND' then null;
    when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
      v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 60));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create temp table b0_snap (v jsonb) on commit drop;
do $b0$
declare v jsonb := '{}'::jsonb;
begin
  ${langkah2.join("\n  ")}
  perform selftest.as_owner();
  insert into b0_snap values (v);
end $b0$;
select 'B0' || chr(9) || v::text from b0_snap;
rollback;
`;
}

function jalankan(c: Checks, langkah2: string[]): Record<string, string> | null {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(langkah2), db()], { encoding: "utf8" });
  const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
  if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return null;
  for (const l of r.stdout.split("\n")) {
    const [k, v] = l.split("\t");
    if (k === "B0" && v) return JSON.parse(v) as Record<string, string>;
  }
  c.expect(false, "the database half returned no snapshot");
  return null;
}

const cabut = (id: string) => `select public.revoke_role(${id}, '${ALASAN}')`;
const mentah = (where: string) => `with u as (update public.role_assignments set revoked_at = now(), revoked_reason = '${ALASAN}' where ${where} returning 1) select count(*) from u`;
const tangguh = (orang: string, kategori = "SECURITY") =>
  `insert into public.person_suspensions (person_id, category, started_by) values ('${orang}', '${kategori}', '${orang}')`;
const anonim = (orang: string) => `update public.persons set anonymized_at = now() where id = '${orang}'`;
const TAKBISA: Array<[string, (o: string) => string]> = [
  ["ditangguhkan", (o) => tangguh(o)], ["ditutup", (o) => tangguh(o, "CLOSED_AT_REQUEST")], ["anonim", (o) => anonim(o)],
];
const hidup = (peran: string, where: string) =>
  `select count(*) from public.role_assignments ra where ra.role = '${peran}' and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until and ${where}`;
const PLATFORM = "PR160:ROLE_LAST_PLATFORM_ADMIN";
const SEKOLAH = "PR160:ROLE_LAST_SCHOOL_ADMIN";

export const b0Tests: SelfTest[] = [
  {
    id: "B0-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const sql = readFileSync(join(repoRoot, MIGRASI), "utf8");
      const tolak = /create or replace function public\.peran_tolak[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      const kode = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((x) => x[1]);
      c.expect(kode.length >= 10, `peran_tolak names ${kode.length} code(s)`);
      const dipakai = new Set([...sql.matchAll(/peran_tolak\('([A-Z_]+)'\)/g)].map((x) => x[1]));
      for (const k of dipakai) c.expect(kode.includes(k), `${k} is raised without a message of its own`);
      for (const k of kode) {
        c.expect((KODE_PERAN_DB as readonly string[]).includes(k) || k.startsWith("OPERATOR_") || k === "ROLE_REFUSAL_NOT_FOUND",
          `the database raises ${k}, which the screens' contract does not know`);
      }
      for (const k of KODE_PERAN_DB) c.expect(kode.includes(k), `the contract names ${k}, which the database does not raise`);
      for (const k of KODE_PERAN_DICATAT) c.expect(new RegExp(`'${k}'`).test(/create or replace function public\.catat_penolakan_peran[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? ""), `${k} cannot be recorded`);
      for (const k of KODE_PERAN) {
        const id = t(kunciKodePeran(k), "staff"), en = t(kunciKodePeran(k), "staff", { locale: "en" });
        c.expect(id.length > 10 && en.length > 10 && id !== en, `${k} has no sentence in both languages («${id}» / «${en}»)`);
      }
      c.expect(kodePeranDariGalat({ code: "PR160", details: "ROLE_LAST_SCHOOL_ADMIN" }) === "ROLE_LAST_SCHOOL_ADMIN"
        && kodePeranDariGalat({ code: "PR160", details: "OPERATOR_ADMIN_EXISTS" }) === "ROLE_FAILED"
        && kodePeranDariGalat({ code: "PR130", details: "ROLE_LAST_SCHOOL_ADMIN" }) === "ROLE_FAILED" && kodePeranDariGalat(null) === "ROLE_FAILED"
        && kodePeranDariGalat({ code: "40P01", details: null }) === "ROLE_BUSY",
        "a refusal is not read by its PR160 DETAIL alone");
      // blocker 1: the rule is the guard's, on the revocation; no revoking function asks it for itself
      const guard = /create or replace function public\.role_assignments_guard\(\)[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? "";
      c.expect(/if new\.revoked_at is not null[\s\S]{0,200}peran_terakhir_kode\(old\.id, true\)/.test(guard), "the guard does not ask the last-holder rule, under its lock, on the revocation");
      c.expect(/for update/.test(/create or replace function public\.peran_terakhir_kode[\s\S]*?end \$\$;/.exec(sql)?.[0] ?? ""), "«last» is not decided under a row lock");
      c.expect(!/create or replace function public\.(revoke_role|akhiri_tugas_staf|ubah_peran|buka_kembali_akun)\b/.test(sql), "a revoking function was rewritten to carry the rule itself");
      c.expect([...sql.matchAll(/peran_terakhir_kode\(([^)]*)\)/g)].filter((x) => /true/.test(x[1])).length === 1, "the locked last-holder question is asked somewhere other than the guard");
      return c.verdict("every code peran_tolak raises is a signed-in caller's with its Indonesian and English sentence, the operator's or the recorder's own; the guard asks "
        + "the last-holder rule under its lock on the revocation, and no revoking function carries a check of its own");
    },
  },
  {
    id: "B0-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      const raH = "current_setting('b0.ra_h')::uuid", raG = "current_setting('b0.ra_g')::uuid";
      const sidikG = `(select md5(coalesce(string_agg(x.id::text, ',' order by x.id), '')) from public.role_assignments x where x.person_id = '${id.g}' and x.institution_id = '${id.inst}' and x.role <> 'SYSTEM_ADMIN' and x.revoked_at is null and now() >= x.valid_from and now() < x.valid_until)`;
      const akhiri = (orang: string) => `select public.akhiri_tugas_staf('${orang}', '${id.inst}', 'RESIGNATION', '${ALASAN}', null) ->> 'ok'`;
      const ubah = (orang: string, ra: string, sidik: string) =>
        `select public.ubah_peran('${orang}', '${id.inst}', '[]'::jsonb, array[${ra}], '${ALASAN}', ${sidik}, true, true) ->> 'ok'`;
      const kedaluwarsa = (orang: string, peran: string, node: string | null) =>
        `select set_config('app.seed_intent', 'synthetic', true); insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) `
        + `values ('${orang}', '${peran}', ${node ? `'${node}'` : "null"}, now() - interval '10 days', now() - interval '1 day')`;
      const L: string[] = [
        // ---- the platform, one administrator
        langkah("p_sendiri", EMAIL.sys, cabut(`'${id.ra_s}'`)),
        langkah("p_pemilik", null, mentah(`id = '${id.ra_s}'`)),
        langkah("p_kedaluwarsa", EMAIL.sys, cabut(`'${id.ra_s}'`), { prep: kedaluwarsa(id.h, "SYSTEM_ADMIN", null) }),
        langkah("p_catat", EMAIL.sys, `select public.catat_penolakan_peran('${id.ra_s}', 'ROLE_LAST_PLATFORM_ADMIN') is not null`,
          { cek: `select count(*) from public.audit_log l where l.action = 'role.revocation_refused' and l.target_id = '${id.ra_s}' and l.summary ->> 'refusal' = 'ROLE_LAST_PLATFORM_ADMIN'` }),
        // ---- the platform, a second administrator
        langkah("p_tunjuk", EMAIL.sys, `select set_config('b0.ra_h', public.grant_role('${id.h}', 'SYSTEM_ADMIN', null, now() + interval '200 days')::text, true)`, { tetap: true }),
        langkah("p_kedua_dicabut", EMAIL.sys, cabut(raH), { cek: hidup("SYSTEM_ADMIN", "true") }),
        langkah("p_pertama_dicabut", EMAIL.hod, cabut(`'${id.ra_s}'`), { cek: hidup("SYSTEM_ADMIN", "true") }),
        langkah("p_semua_sekaligus", null, mentah("role = 'SYSTEM_ADMIN' and revoked_at is null")),
        ...TAKBISA.flatMap(([n, f]) => [
          langkah(`p_${n}`, EMAIL.sys, cabut(`'${id.ra_s}'`), { prep: f(id.h) }),
          langkah(`p_${n}_dicabut`, EMAIL.sys, cabut(raH), { prep: f(id.h) }),
        ]),
        // ---- the school, one administrator
        langkah("s_sendiri", EMAIL.admin, cabut(`'${id.ra_a}'`)),
        langkah("s_pemilik", null, mentah(`id = '${id.ra_a}'`)),
        langkah("s_platform", EMAIL.sys, cabut(`'${id.ra_a}'`), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_platform_akhiri", EMAIL.sys, akhiri(id.a), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_kedaluwarsa", EMAIL.admin, cabut(`'${id.ra_a}'`), { prep: kedaluwarsa(id.h, "INSTITUTION_ADMIN", id.inst) }),
        langkah("s_catat", EMAIL.admin, `select public.catat_penolakan_peran('${id.ra_a}', 'ROLE_LAST_SCHOOL_ADMIN') is not null`,
          { cek: `select count(*) from public.audit_log l where l.action = 'role.revocation_refused' and l.target_id = '${id.ra_a}' and l.actor_person_id = '${id.a}' and l.summary ->> 'refusal' = 'ROLE_LAST_SCHOOL_ADMIN' and l.institution_id = '${id.inst}'` }),
        langkah("s_catat_platform", EMAIL.sys, `select public.catat_penolakan_peran('${id.ra_a}', 'ROLE_LAST_SCHOOL_ADMIN') is not null`),
        // ---- the school, a second administrator (appointed by the first, D-101)
        langkah("s_tunjuk", EMAIL.admin, `select set_config('b0.ra_g', public.grant_role('${id.g}', 'INSTITUTION_ADMIN', '${id.inst}', now() + interval '200 days')::text, true)`, { tetap: true }),
        langkah("s_kedua_dicabut", EMAIL.admin, cabut(raG), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_pertama_dicabut", EMAIL.guru, cabut(`'${id.ra_a}'`), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_catat_tak_benar", EMAIL.admin, `select public.catat_penolakan_peran('${id.ra_a}', 'ROLE_LAST_SCHOOL_ADMIN') is not null`),
        ...TAKBISA.flatMap(([n, f]) => [
          langkah(`s_${n}`, EMAIL.admin, cabut(`'${id.ra_a}'`), { prep: f(id.g) }),
          langkah(`s_${n}_dicabut`, EMAIL.admin, cabut(raG), { prep: f(id.g) }),
        ]),
        // «Akhiri tugas» and «Ubah peran», by a school admin whose own account is suspended: the other is the last usable one
        langkah("s_akhiri", EMAIL.admin, akhiri(id.g), { prep: tangguh(id.a) }),
        langkah("s_ubah", EMAIL.admin, ubah(id.g, raG, sidikG), { prep: tangguh(id.a) }),
        langkah("s_akhiri_biasa", EMAIL.admin, akhiri(id.g), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_ubah_biasa", EMAIL.admin, ubah(id.g, raG, sidikG), { cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        // buka_kembali_akun: the PINTAR Administrator's alone, so the one exception applies to it
        langkah("s_buka_kembali", EMAIL.sys,
          `select public.buka_kembali_akun(current_setting('b0.req')::uuid, 'uji B0: diverifikasi lewat telepon sekolah') ->> 'ok'`,
          { prep: `update public.role_assignments set revoked_at = now(), revoked_reason = '${ALASAN}' where id = '${id.ra_a}'; ${tangguh(id.g, "CLOSED_AT_REQUEST")}; `
              + `with r as (insert into public.account_requests (person_id, kind, pesan) values ('${id.g}', 'REOPEN', 'uji B0: mohon dibuka kembali') returning id) `
              + `select set_config('b0.req', (select r.id::text from r), true)`,
            cek: hidup("INSTITUTION_ADMIN", `ra.institution_id = '${id.inst}'`) }),
        langkah("s_buka_kembali_admin_sekolah", EMAIL.admin,
          `select public.buka_kembali_akun(gen_random_uuid(), 'uji B0: diverifikasi lewat telepon sekolah') ->> 'ok'`),
      ];
      const m = jalankan(c, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      // the platform
      harap("p_sendiri", PLATFORM, "the only platform admin revoking their own role");
      harap("p_pemilik", PLATFORM, "the database owner revoking the only platform admin's role");
      harap("p_kedaluwarsa", PLATFORM, "the only platform admin revoking their own role beside an expired second holder");
      c.expect(/^ok:[0-9a-f-]{36}$/.test(m.p_tunjuk ?? ""), `a second platform admin could not be appointed: ${m.p_tunjuk}`);
      harap("p_kedua_dicabut", "ok:|1", "with two platform admins, the first revoking the second");
      harap("p_pertama_dicabut", "ok:|1", "with two platform admins, the second revoking the first");
      harap("p_semua_sekaligus", PLATFORM, "one statement revoking every platform admin");
      for (const [n] of TAKBISA) {
        harap(`p_${n}`, PLATFORM, `the platform admin revoking their own role while the second is ${n}`);
        harap(`p_${n}_dicabut`, "ok:", `revoking the role of a platform admin who is ${n}`);
      }
      // the school
      harap("s_sendiri", SEKOLAH, "a school's only administrator revoking their own role");
      harap("s_pemilik", SEKOLAH, "a path with no actor revoking a school's only administrator");
      harap("s_platform", "ok:|0", "a platform admin revoking a school's only administrator");
      harap("s_platform_akhiri", "ok:true|0", "a platform admin ending a school's only administrator's duties");
      harap("s_kedaluwarsa", SEKOLAH, "a school's only administrator revoking their own role beside an expired second holder");
      harap("s_catat", "ok:true|1", "recording the school admin's refused revocation");
      harap("s_catat_platform", "PR160:ROLE_REFUSAL_NOT_FOUND", "a platform admin recording a refusal they would not meet");
      harap("p_catat", "ok:true|1", "recording the platform admin's refused revocation");
      c.expect(/^ok:[0-9a-f-]{36}$/.test(m.s_tunjuk ?? ""), `a second school administrator could not be appointed: ${m.s_tunjuk}`);
      harap("s_kedua_dicabut", "ok:|1", "with two school administrators, the first revoking the second");
      harap("s_pertama_dicabut", "ok:|1", "with two school administrators, the second revoking the first");
      harap("s_catat_tak_benar", "PR160:ROLE_REFUSAL_NOT_FOUND", "recording a refusal that does not stand");
      for (const [n] of TAKBISA) {
        harap(`s_${n}`, SEKOLAH, `a school administrator revoking their own role while the second is ${n}`);
        harap(`s_${n}_dicabut`, "ok:", `revoking the role of a school administrator who is ${n}`);
      }
      harap("s_akhiri", SEKOLAH, "«Akhiri tugas» on the school's last usable administrator, by a school admin");
      harap("s_ubah", SEKOLAH, "«Ubah peran» releasing the school's last usable administrator role, by a school admin");
      harap("s_akhiri_biasa", "ok:true|1", "«Akhiri tugas» on one of two administrators");
      harap("s_ubah_biasa", "ok:true|1", "«Ubah peran» releasing one of two administrator roles");
      harap("s_buka_kembali", "ok:true|0", "the PINTAR Administrator reopening the account of a school's last administrator (its roles end)");
      harap("s_buka_kembali_admin_sekolah", "PR140:ACCOUNT_NOT_ALLOWED", "a school admin reopening an account");
      return c.verdict("the platform's last usable SYSTEM_ADMIN role is revoked by nobody (its holder, the owner, one statement over all); a school's last usable "
        + "INSTITUTION_ADMIN role is not revoked by a school admin, a path with no actor, «Akhiri tugas» or «Ubah peran», and is by a platform admin (revoke_role, "
        + "«Akhiri tugas», buka_kembali_akun); a suspended, closed, anonymised or expired second holder is not the remaining one; with a usable second holder each "
        + "revocation is accepted; a refusal is recorded afterwards and only a true one");
    },
  },
  {
    id: "B0-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      const perpanjang = (ra: string, sampai = "(select x.valid_until + interval '365 days' from public.role_assignments x where x.id = %)", alasan = ALASAN) =>
        `select public.perpanjang_peran(${ra}, ${sampai.replace("%", ra)}, '${alasan}') ->> 'ok'`;
      const raG = "current_setting('b0.ra_g')::uuid";
      // after a renewal of `lama`: live assignments of that person, role and place; the old one revoked at the instant
      // the new one begins, by one transaction (one xmin); the renewal's audit row with its reason; the per-row ones
      const sesudah = (lama: string) => `
        select (select count(*) from public.role_assignments n, public.role_assignments o where o.id = ${lama} and n.person_id = o.person_id and n.role = o.role
                   and n.scope_node_id is not distinct from o.scope_node_id and n.revoked_at is null and now() >= n.valid_from and now() < n.valid_until)
          || ',' || (select (o.revoked_at is not null and o.revoked_at = n.valid_from and o.xmin::text = n.xmin::text and n.valid_until = o.valid_until + interval '365 days'
                             and o.revoked_reason = '${ALASAN}')::text
                       from public.role_assignments o join public.audit_log l on l.action = 'role.renewed' and l.summary #>> '{from,assignment}' = o.id::text
                       join public.role_assignments n on n.id::text = l.target_id where o.id = ${lama})
          || ',' || (select count(*) from public.audit_log l where l.action = 'role.renewed' and l.summary #>> '{from,assignment}' = (${lama})::text and l.summary ->> 'reason' = '${ALASAN}')
          || ',' || (select count(*) from public.audit_log l join public.audit_log r on r.action = 'role.renewed' and r.summary #>> '{from,assignment}' = (${lama})::text
                      where (l.action = 'role.granted' and l.target_id = r.target_id) or (l.action = 'role.revoked' and l.target_id = (${lama})::text))
          || ',' || (select l.summary ->> 'self' from public.audit_log l where l.action = 'role.renewed' and l.summary #>> '{from,assignment}' = (${lama})::text)`;
      const jumlah = `select (select count(*) from public.role_assignments) || ',' || (select count(*) from public.audit_log where action like 'role.%')`;
      const L: string[] = [
        langkah("awal", null, jumlah),
        // a school admin renews a teacher's role; the platform admin renews the school's only administrator
        langkah("guru", EMAIL.admin, perpanjang(`'${id.ra_gu}'`), { cek: sesudah(`'${id.ra_gu}'`) }),
        langkah("admin_terakhir", EMAIL.sys, perpanjang(`'${id.ra_a}'`), { cek: sesudah(`'${id.ra_a}'`) }),
        // refusals, each leaving nothing
        langkah("sendiri_sekolah", EMAIL.admin, perpanjang(`'${id.ra_a}'`)),
        langkah("bukan_wewenang", EMAIL.guru, perpanjang(`'${id.ra_a}'`)),
        langkah("sekolah_lain", EMAIL.lain, perpanjang(`'${id.ra_gu}'`)),
        langkah("platform_oleh_sekolah", EMAIL.admin, perpanjang(`'${id.ra_s}'`)),
        langkah("tak_ada", EMAIL.sys, perpanjang("gen_random_uuid()", "now() + interval '30 days'")),
        langkah("sampai_mundur", EMAIL.admin, perpanjang(`'${id.ra_gu}'`, "(select x.valid_until - interval '1 day' from public.role_assignments x where x.id = %)")),
        langkah("alasan_pendek", EMAIL.admin, perpanjang(`'${id.ra_gu}'`, undefined, "pendek")),
        langkah("sudah_dicabut", EMAIL.admin, perpanjang(`'${id.ra_gu}'`), { prep: `update public.role_assignments set revoked_at = now(), revoked_reason = '${ALASAN}' where id = '${id.ra_gu}'` }),
        langkah("catat_sendiri", EMAIL.admin, `select public.catat_penolakan_peran('${id.ra_a}', 'ROLE_RENEW_SELF') is not null`,
          { cek: `select count(*) from public.audit_log l where l.action = 'role.renewal_refused' and l.target_id = '${id.ra_a}' and l.actor_person_id = '${id.a}'` }),
        langkah("sesudah_tolak", null, jumlah),
        // the only self-grant: the platform's only usable administrator
        langkah("sendiri_platform", EMAIL.sys, perpanjang(`'${id.ra_s}'`), { cek: sesudah(`'${id.ra_s}'`) }),
        langkah("catat_sendiri_platform", EMAIL.sys, `select public.catat_penolakan_peran('${id.ra_s}', 'ROLE_RENEW_SELF') is not null`),
        langkah("hibah_sendiri", EMAIL.sys, `select public.grant_role('${id.s}', 'SYSTEM_ADMIN', null, now() + interval '900 days') is not null`),
        langkah("hibah_sendiri_sekolah", EMAIL.admin, `select public.grant_role('${id.a}', 'EDUCATOR', '${id.inst}', now() + interval '30 days') is not null`),
        langkah("penanda_palsu", EMAIL.admin,
          `select public.grant_role('${id.a}', 'INSTITUTION_ADMIN', '${id.inst}', now() + interval '900 days') is not null`,
          { prep: `select set_config('pintar.peran_perpanjang', '${id.ra_a}', true)` }),
        langkah("penanda_palsu_platform", EMAIL.admin,
          `select public.grant_role('${id.a}', 'SYSTEM_ADMIN', null, now() + interval '900 days') is not null`,
          { prep: `select set_config('pintar.peran_perpanjang', '${id.ra_s}', true)` }),
        // a second platform admin
        langkah("p_tunjuk", EMAIL.sys, `select set_config('b0.ra_h', public.grant_role('${id.h}', 'SYSTEM_ADMIN', null, now() + interval '200 days')::text, true)`, { tetap: true }),
        langkah("sendiri_ada_kedua", EMAIL.sys, perpanjang(`'${id.ra_s}'`)),
        langkah("penanda_ada_kedua", EMAIL.sys, `select public.grant_role('${id.s}', 'SYSTEM_ADMIN', null, now() + interval '900 days') is not null`,
          { prep: `select set_config('pintar.peran_perpanjang', '${id.ra_s}', true)` }),
        langkah("catat_ada_kedua", EMAIL.sys, `select public.catat_penolakan_peran('${id.ra_s}', 'ROLE_RENEW_SELF') is not null`,
          { cek: `select count(*) from public.audit_log l where l.action = 'role.renewal_refused' and l.target_id = '${id.ra_s}' and l.actor_person_id = '${id.s}'` }),
        langkah("oleh_kedua", EMAIL.hod, perpanjang(`'${id.ra_s}'`), { cek: sesudah(`'${id.ra_s}'`) }),
        ...TAKBISA.map(([n, f]) => langkah(`sendiri_kedua_${n}`, EMAIL.sys, perpanjang(`'${id.ra_s}'`), { prep: f(id.h), cek: hidup("SYSTEM_ADMIN", `ra.person_id = '${id.s}'`) })),
        // a second school administrator renews the first
        langkah("s_tunjuk", EMAIL.admin, `select set_config('b0.ra_g', public.grant_role('${id.g}', 'INSTITUTION_ADMIN', '${id.inst}', now() + interval '200 days')::text, true)`, { tetap: true }),
        langkah("admin_oleh_admin", EMAIL.guru, perpanjang(`'${id.ra_a}'`), { cek: sesudah(`'${id.ra_a}'`) }),
        langkah("sendiri_sekolah_ada_kedua", EMAIL.guru, perpanjang(raG)),
        langkah("ganda_tetap_ditolak", EMAIL.sys, `select public.grant_role('${id.h}', 'SYSTEM_ADMIN', null, now() + interval '900 days') is not null`),
      ];
      const m = jalankan(c, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      const SATU = "ok:true|1,true,1,2,";
      harap("guru", SATU + "false", "a school admin renewing a teacher's role (one live assignment, the old one revoked at the new one's start in one transaction, audited with its reason)");
      harap("admin_terakhir", SATU + "false", "the platform admin renewing a school's only administrator");
      harap("sendiri_sekolah", "PR160:ROLE_RENEW_SELF", "a school admin renewing their own role");
      harap("bukan_wewenang", "PR160:ROLE_RENEW_NOT_ALLOWED", "a teacher renewing an administrator's role");
      harap("sekolah_lain", "PR160:ROLE_RENEW_NOT_ALLOWED", "another school's admin renewing a role here");
      harap("platform_oleh_sekolah", "PR160:ROLE_RENEW_NOT_ALLOWED", "a school admin renewing a platform role");
      harap("tak_ada", "PR160:ROLE_RENEW_NOT_ALLOWED", "renewing an assignment that does not exist");
      harap("sampai_mundur", "PR160:ROLE_RENEW_UNTIL_INVALID", "a renewal ending before the role's current end");
      harap("alasan_pendek", "PR160:ROLE_RENEW_REASON_REQUIRED", "a renewal with a five-character reason");
      harap("sudah_dicabut", "PR160:ROLE_RENEW_NOT_LIVE", "renewing a revoked role");
      harap("catat_sendiri", "ok:true|1", "recording the refused self-renewal");
      c.expect(!!m.awal && m.awal === m.sesudah_tolak, `the refused renewals left something: ${m.awal} assignments and role audit rows before, ${m.sesudah_tolak} after`);
      harap("sendiri_platform", SATU + "true", "the platform's only administrator renewing their own role");
      harap("catat_sendiri_platform", "PR160:ROLE_REFUSAL_NOT_FOUND", "recording a self-renewal refusal that does not stand");
      c.expect(/^P0001:self-grant is never allowed/.test(m.hibah_sendiri ?? ""), `the platform's only administrator granting themselves a role outside a renewal answered ${m.hibah_sendiri}`);
      c.expect(/^P0001:self-grant is never allowed/.test(m.hibah_sendiri_sekolah ?? ""), `a school admin granting themselves a role answered ${m.hibah_sendiri_sekolah}`);
      c.expect(/^P0001:self-grant is never allowed/.test(m.penanda_palsu ?? ""), `a self-grant under a forged renewal marker answered ${m.penanda_palsu}`);
      c.expect(/^P0001:self-grant is never allowed/.test(m.penanda_palsu_platform ?? ""), `a platform self-grant under a forged renewal marker answered ${m.penanda_palsu_platform}`);
      c.expect(/^ok:[0-9a-f-]{36}$/.test(m.p_tunjuk ?? ""), `a second platform admin could not be appointed: ${m.p_tunjuk}`);
      harap("sendiri_ada_kedua", "PR160:ROLE_RENEW_SELF", "a platform admin renewing their own role while a second usable one exists");
      c.expect(/^P0001:self-grant is never allowed/.test(m.penanda_ada_kedua ?? ""), `a platform admin's self-grant under a renewal marker while a second usable one exists answered ${m.penanda_ada_kedua}`);
      harap("catat_ada_kedua", "ok:true|1", "recording that refused self-renewal");
      harap("oleh_kedua", SATU + "false", "the second platform admin renewing the first");
      for (const [n] of TAKBISA) harap(`sendiri_kedua_${n}`, "ok:true|1", `a platform admin renewing their own role while the second is ${n}`);
      c.expect(/^ok:[0-9a-f-]{36}$/.test(m.s_tunjuk ?? ""), `a second school administrator could not be appointed: ${m.s_tunjuk}`);
      harap("admin_oleh_admin", SATU + "false", "a school admin renewing another school admin");
      harap("sendiri_sekolah_ada_kedua", "PR160:ROLE_RENEW_SELF", "the second school admin renewing their own role");
      harap("ganda_tetap_ditolak", "23505:GRANT_ALREADY_ACTIVE", "a second standing grant outside a renewal");
      return c.verdict("a renewal is one transaction leaving exactly one live assignment (the old one revoked at the instant the new one begins), audited role.renewed "
        + "with its reason beside the per-row rows; whoever may grant renews, nobody else; the school's only administrator is renewed without tripping the last-holder "
        + "rule; nobody renews their own role except the platform's only usable administrator, refused once a usable second exists and allowed while the second is "
        + "suspended, closed or anonymised; every other self-grant, a forged marker included, and a duplicate standing grant stay refused");
    },
  },
  {
    id: "B0-S03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      const RUJUKAN = "uji B0: recover-platform-admin run 1";
      const tunjuk = (pid: string, sampai = "now() + interval '90 days'", alasan = ALASAN, rujukan = RUJUKAN) =>
        `select public.operator_appoint_platform_admin('${pid}', ${sampai}, '${alasan}', '${rujukan}') is not null`;
      const jumlah = `select (select count(*) from public.role_assignments) || ',' || (select count(*) from public.audit_log)`;
      const takAda = psql("select v from (values ('22222222'), ('33333333'), ('44444444'), ('55555555')) t(v) where not exists (select 1 from public.persons p where p.pintar_id = t.v) limit 1").out;
      if (!c.expect(/^[2-5]{8}$/.test(takAda), "no PINTAR ID that nobody holds could be chosen")) return c.verdict("");
      const L: string[] = [
        langkah("awal", null, jumlah),
        // refused while a usable platform admin exists, and for a person who does not exist: nothing written
        langkah("ada_admin", null, tunjuk(id.pid_h)),
        langkah("orang_tak_ada", null, tunjuk(takAda)),
        langkah("orang_tak_ada_tanpa_admin", null, tunjuk(takAda), { prep: tangguh(id.s) }),
        langkah("alasan_pendek", null, tunjuk(id.pid_h, undefined, "pendek"), { prep: tangguh(id.s) }),
        langkah("tanpa_rujukan", null, tunjuk(id.pid_h, undefined, undefined, "x"), { prep: tangguh(id.s) }),
        langkah("sampai_lewat", null, tunjuk(id.pid_h, "now() - interval '1 day'"), { prep: tangguh(id.s) }),
        langkah("orang_ditangguhkan", null, tunjuk(id.pid_s), { prep: tangguh(id.s) }),
        langkah("masuk", EMAIL.sys, tunjuk(id.pid_h)),
        langkah("masuk_tanpa_admin", EMAIL.admin, tunjuk(id.pid_h), { prep: tangguh(id.s) }),
        langkah("klaim_pengguna", null, `select public.operator_appoint_platform_admin('${id.pid_h}', now() + interval '90 days', '${ALASAN}', '${RUJUKAN}') is not null `
          + `from (select set_config('request.jwt.claims', json_build_object('sub', (select ac.auth_user_id from public.accounts ac where ac.person_id = '${id.a}' limit 1), 'role', 'authenticated')::text, true)) z`,
          { prep: tangguh(id.s) }),
        langkah("sesudah_tolak", null, jumlah),
        // with no usable platform admin (the only one suspended, closed or anonymised): one existing person, audited, once
        ...TAKBISA.map(([n, f]) => langkah(`pulih_${n}`, null, tunjuk(id.pid_h), {
          prep: f(id.s),
          cek: `select (${hidup("SYSTEM_ADMIN", `ra.person_id = '${id.h}' and ra.granted_by is null and ra.scope_node_id is null and ra.valid_until > now() + interval '89 days'`)})
                 || ',' || (select count(*) from public.audit_log l where l.action = 'role.platform_admin_recovered' and l.actor_person_id is null
                              and l.summary ->> 'person_id' = '${id.h}' and l.summary ->> 'reason' = '${ALASAN}' and l.summary ->> 'operator_ref' = '${RUJUKAN}'
                              and l.target_id = (select ra.id::text from public.role_assignments ra where ra.person_id = '${id.h}' and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null))
                 || ',' || (select count(*) from public.audit_log l where l.action = 'role.granted' and l.actor_person_id is null
                              and l.target_id = (select ra.id::text from public.role_assignments ra where ra.person_id = '${id.h}' and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null))`,
        })),
        langkah("pulih_tetap", null, tunjuk(id.pid_h), { tetap: true, prep: tangguh(id.s) }),
        langkah("pulih_lagi", null, tunjuk(id.pid_s.toLowerCase())),
        langkah("hibah_tanpa_pelaku", null, `with x as (insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values ('${id.d}', 'SYSTEM_ADMIN', null, now() + interval '30 days') returning 1) select count(*) from x`,
          { prep: `${tangguh(id.h)}; select set_config('pintar.operator_admin', '${id.a}', true)` }),
      ];
      const m = jalankan(c, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("ada_admin", "PR160:OPERATOR_ADMIN_EXISTS", "the operator naming a person while a usable platform admin exists");
      harap("orang_tak_ada", "PR160:OPERATOR_PERSON_UNKNOWN", "the operator naming a person who does not exist (a platform admin exists)");
      harap("orang_tak_ada_tanpa_admin", "PR160:OPERATOR_PERSON_UNKNOWN", "the operator naming a person who does not exist (no usable platform admin)");
      harap("alasan_pendek", "PR160:OPERATOR_REASON_REQUIRED", "the operator's appointment with a five-character reason");
      harap("tanpa_rujukan", "PR160:OPERATOR_REF_REQUIRED", "the operator's appointment without its run reference");
      harap("sampai_lewat", "PR160:OPERATOR_UNTIL_INVALID", "the operator's appointment ending yesterday");
      harap("orang_ditangguhkan", "PR160:OPERATOR_PERSON_UNUSABLE", "the operator naming a suspended person");
      c.expect(/^42501:/.test(m.masuk ?? ""), `a signed-in platform admin calling the operator's function answered ${m.masuk}`);
      c.expect(/^42501:/.test(m.masuk_tanpa_admin ?? ""), `a signed-in school admin calling the operator's function answered ${m.masuk_tanpa_admin}`);
      harap("klaim_pengguna", "PR160:OPERATOR_NOT_OPERATOR", "the operator's function reached with a signed-in person's claims");
      c.expect(!!m.awal && m.awal === m.sesudah_tolak, `the refused appointments wrote something: ${m.awal} assignments and audit rows before, ${m.sesudah_tolak} after`);
      for (const [n] of TAKBISA) harap(`pulih_${n}`, "ok:true|1,1,1", `the operator's appointment while the only platform admin is ${n} (one live grant with no grantor, audited with reason and reference)`);
      harap("pulih_tetap", "ok:true", "the operator's appointment");
      harap("pulih_lagi", "PR160:OPERATOR_ADMIN_EXISTS", "a second operator appointment once a usable platform admin exists");
      c.expect(/^P0001:role assignments require an authenticated grantor/.test(m.hibah_tanpa_pelaku ?? ""),
        `a grant with no actor under a marker naming someone else answered ${m.hibah_tanpa_pelaku}`);
      return c.verdict("the operator's function refuses while a usable platform admin exists and for a person who does not exist, writing nothing, and is never a "
        + "signed-in caller's; with the only platform admin suspended, closed or anonymised it appoints one existing, usable person, audited "
        + "role.platform_admin_recovered with the reason and the run's reference, and refuses a second appointment");
    },
  },
  {
    id: "B0-S04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      // the last second of the day N days from today, on the school's clock
      const akhirHari = (n: number, inst: string | null) =>
        `((((now() at time zone coalesce((select i.zona_waktu from public.institutions i where i.id = ${inst ? `'${inst}'` : "null"}), 'Asia/Jakarta'))::date + ${n + 1})::timestamp - interval '1 second') `
        + `at time zone coalesce((select i.zona_waktu from public.institutions i where i.id = ${inst ? `'${inst}'` : "null"}), 'Asia/Jakarta'))`;
      const baca = (inst: string | null, hari: number, where = "true") =>
        `select coalesce(string_agg(x.person_id || ':' || x.role || ':' || x.sisa_hari || ':' || x.milik_sendiri || ':' || x.pemegang_terakhir, ',' order by x.valid_until, x.person_id, x.role), '-') `
        + `from public.peran_akan_berakhir(${inst ? `'${inst}'` : "null"}, ${hari}) x where ${where}`;
      const L: string[] = [
        langkah("h30", EMAIL.admin, `select public.grant_role('${id.h}', 'EDUCATOR', '${id.inst}', ${akhirHari(30, id.inst)}) is not null`, { tetap: true }),
        langkah("h31", EMAIL.admin, `select public.grant_role('${id.d}', 'EDUCATOR', '${id.inst}', ${akhirHari(31, id.inst)}) is not null`, { tetap: true }),
        langkah("p7", EMAIL.sys, `select public.grant_role('${id.h}', 'SYSTEM_ADMIN', null, ${akhirHari(7, null)}) is not null`, { tetap: true }),
        langkah("sekolah_30", EMAIL.admin, baca(id.inst, 30)),
        langkah("sekolah_31", EMAIL.admin, baca(id.inst, 31)),
        langkah("sekolah_29", EMAIL.admin, baca(id.inst, 29)),
        langkah("sekolah_platform", EMAIL.sys, baca(id.inst, 30)),
        langkah("sendiri_7", EMAIL.hod, baca(null, 7)),
        langkah("sendiri_30", EMAIL.hod, baca(null, 30)),
        langkah("sendiri_guru", EMAIL.guru, baca(null, 366, `x.person_id <> '${id.g}'`)),
        langkah("admin_tanpa_sekolah", EMAIL.admin, baca(null, 366, `x.person_id <> '${id.a}'`)),
        langkah("platform_7", EMAIL.sys, baca(null, 7)),
        langkah("platform_6", EMAIL.sys, baca(null, 6)),
        langkah("guru_sekolah", EMAIL.guru, baca(id.inst, 30)),
        langkah("sekolah_lain", EMAIL.lain, baca(id.inst, 30)),
        langkah("hari_nol", EMAIL.admin, baca(id.inst, 0)),
        langkah("hari_banyak", EMAIL.admin, baca(id.inst, 367)),
        langkah("anon", null, `select count(*) from public.peran_akan_berakhir(null, 30)`),
        langkah("terakhir_admin", EMAIL.admin, `select public.peran_pemegang_terakhir('${id.ra_a}')`),
        langkah("terakhir_platform", EMAIL.sys, `select public.peran_pemegang_terakhir('${id.ra_a}') || ',' || public.peran_pemegang_terakhir('${id.ra_s}') || ',' || public.peran_pemegang_terakhir('${id.ra_gu}')`),
        langkah("terakhir_guru", EMAIL.guru, `select public.peran_pemegang_terakhir('${id.ra_a}')`),
        langkah("terakhir_sendirian", EMAIL.sys, `select public.peran_pemegang_terakhir('${id.ra_s}')`, { prep: tangguh(id.h) }),
        langkah("sendiri_terakhir", EMAIL.hod, baca(null, 7), { prep: tangguh(id.s) }),
      ];
      const m = jalankan(c, L);
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      for (const k of ["h30", "h31", "p7"]) harap(k, "ok:true", `the fixture grant ${k}`);
      const H30 = `${id.h}:EDUCATOR:30:false:false`, D31 = `${id.d}:EDUCATOR:31:false:false`;
      harap("sekolah_30", `ok:${H30}`, "the school's admin reading roles ending within 30 days");
      harap("sekolah_31", `ok:${H30},${D31}`, "the school's admin reading roles ending within 31 days");
      harap("sekolah_29", "ok:-", "the school's admin reading roles ending within 29 days");
      harap("sekolah_platform", `ok:${H30}`, "a platform admin reading a school's roles ending within 30 days");
      harap("sendiri_7", `ok:${id.h}:SYSTEM_ADMIN:7:true:false`, "the holder reading their own roles ending within 7 days");
      harap("sendiri_30", `ok:${id.h}:SYSTEM_ADMIN:7:true:false,${id.h}:EDUCATOR:30:true:false`, "the holder reading their own roles ending within 30 days");
      harap("sendiri_guru", "ok:-", "a teacher reading, without a school, any role but their own");
      harap("admin_tanpa_sekolah", "ok:-", "a school admin reading, without a school, any role but their own");
      harap("platform_7", `ok:${id.h}:SYSTEM_ADMIN:7:false:false`, "a platform admin reading the platform's roles ending within 7 days");
      harap("platform_6", "ok:-", "a platform admin reading the platform's roles ending within 6 days");
      harap("guru_sekolah", "PR160:ROLE_READ_NOT_ALLOWED", "a teacher reading the school's expiring roles");
      harap("sekolah_lain", "PR160:ROLE_READ_NOT_ALLOWED", "another school's admin reading this school's expiring roles");
      harap("hari_nol", "PR160:ROLE_EXPIRY_DAYS_INVALID", "the read asked for 0 days");
      harap("hari_banyak", "PR160:ROLE_EXPIRY_DAYS_INVALID", "the read asked for 367 days");
      harap("anon", "PR160:ROLE_READ_NOT_ALLOWED", "the read with no person");
      harap("terakhir_admin", "ok:true", "the school's only admin asking whether theirs is the last administrator role");
      harap("terakhir_platform", "ok:true,false,false", "a platform admin asking about the school's only admin, one of two platform admins and a teacher's role");
      harap("terakhir_guru", "PR160:ROLE_READ_NOT_ALLOWED", "a teacher asking whether an administrator's role is the last");
      harap("terakhir_sendirian", "ok:true", "a platform admin asking about their own role while the second is suspended");
      harap("sendiri_terakhir", `ok:${id.h}:SYSTEM_ADMIN:7:true:true`, "the holder reading their own expiring platform role while the other platform admin is suspended");
      return c.verdict("a role ending in 30 days on the school's clock is listed at 30 and not at 29, one ending in 31 only from 31; the holder reads their own roles, "
        + "a school's admin (or a platform admin) that school's, a platform admin the platform's, nobody anyone else's; each row says whether it is the caller's own "
        + "and the last usable administrator role; days outside 1 to 366 are refused");
    },
  },
  {
    id: "B0-C01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      const lomba = (sql: string) =>
        new Promise<{ code: number; out: string; ms: number }>((done) => {
          const t0 = Date.now();
          const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { stdio: ["ignore", "pipe", "pipe"] });
          let buf = "";
          p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
          p.stdout.on("data", (d: string) => (buf += d)); p.stderr.on("data", (d: string) => (buf += d));
          p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim(), ms: Date.now() - t0 }));
        });
      const tunggu = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
      const TAHAN = 1.5;
      const sementara: string[] = [];
      /** A second holder, appointed and committed by the platform admin (ended again by the winner of its race). */
      const tunjuk = (orang: string, peran: string, node: string | null): string => {
        const r = psql(`begin; select selftest.as_user('${EMAIL.sys}'); select 'ID=' || public.grant_role('${orang}', '${peran}', ${node ? `'${node}'` : "null"}, now() + interval '30 days'); commit;`);
        const ra = /ID=([0-9a-f-]{36})/.exec(r.out)?.[1] ?? "";
        if (ra) sementara.push(ra);
        return ra;
      };
      /**
       * One race. The first connection revokes the second holder and holds its transaction; the other, started while
       * it holds, revokes the first holder by `kalah`, reports what it was answered and how many usable administrators
       * its own transaction would leave, and ROLLS BACK whatever it was answered.
       */
      const satu = async (nama: string, menang: { email: string; sql: string }, kalah: { email: string; sql: string }, sisa: string, harap: string) => {
        const a = lomba(`begin; select selftest.as_user('${menang.email}'); ${menang.sql}; select pg_sleep(${TAHAN}); commit;`);
        await tunggu(400);
        const b = lomba(`begin; select selftest.as_user('${kalah.email}');
          do $r$ declare v_o text; v_s text; v_d text; v_m text;
          begin
            begin ${kalah.sql.replace(/^select /, "perform ")}; v_o := 'accepted';
            exception when others then get stacked diagnostics v_s = returned_sqlstate, v_d = pg_exception_detail, v_m = message_text;
              v_o := v_s || ':' || coalesce(nullif(v_d, ''), left(v_m, 60)); end;
            perform set_config('b0.hasil', v_o, true);
          end $r$;
          reset role;
          select 'HASIL=' || current_setting('b0.hasil') || '|' || (${sisa});
          rollback;`);
        const [ra, rb] = await Promise.all([a, b]);
        const hasil = /HASIL=(.*)$/m.exec(rb.out)?.[1] ?? rb.out.slice(0, 160);
        c.expect(ra.code === 0, `${nama}: the first revocation did not commit (${ra.out.slice(0, 120)})`);
        c.expect(hasil === `${harap}|1`, `${nama}: the concurrent revocation was answered ${hasil}; expected ${harap} with one usable administrator left`);
        c.expect(rb.ms >= (TAHAN - 0.6) * 1000, `${nama}: the concurrent revocation answered in ${rb.ms} ms, without waiting for the first to commit`);
      };
      const sisaSekolah = `select count(*) from public.role_assignments ra where ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = '${id.inst}' and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until`;
      const sisaPlatform = `select count(*) from public.role_assignments ra where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until`;
      const cabutSql = (ra: string) => `select public.revoke_role('${ra}', '${ALASAN}')`;
      try {
        // 1. revoke_role against revoke_role
        let g = tunjuk(id.g, "INSTITUTION_ADMIN", id.inst);
        if (!c.expect(!!g, "the second school administrator could not be appointed")) return c.verdict("");
        await satu("revoke_role", { email: EMAIL.admin, sql: cabutSql(g) }, { email: EMAIL.guru, sql: cabutSql(id.ra_a) }, sisaSekolah, SEKOLAH);
        // 2. «Ubah peran» first, «Akhiri tugas» refused
        g = tunjuk(id.g, "INSTITUTION_ADMIN", id.inst);
        if (!c.expect(!!g, "the second school administrator could not be appointed again")) return c.verdict("");
        const sidik = (orang: string) => psql(`select public.staf_sidik('${orang}', '${id.inst}')`).out;
        await satu("«Akhiri tugas»",
          { email: EMAIL.admin, sql: `select public.ubah_peran('${id.g}', '${id.inst}', '[]'::jsonb, array['${g}'::uuid], '${ALASAN}', '${sidik(id.g)}', true, true)` },
          { email: EMAIL.guru, sql: `select public.akhiri_tugas_staf('${id.a}', '${id.inst}', 'RESIGNATION', '${ALASAN}', null)` }, sisaSekolah, SEKOLAH);
        // 3. revoke_role first, «Ubah peran» refused
        g = tunjuk(id.g, "INSTITUTION_ADMIN", id.inst);
        if (!c.expect(!!g, "the second school administrator could not be appointed a third time")) return c.verdict("");
        await satu("«Ubah peran»", { email: EMAIL.admin, sql: cabutSql(g) },
          { email: EMAIL.guru, sql: `select public.ubah_peran('${id.a}', '${id.inst}', '[]'::jsonb, array['${id.ra_a}'::uuid], '${ALASAN}', '${sidik(id.a)}', true, true)` }, sisaSekolah, SEKOLAH);
        // 4. the platform
        const h = tunjuk(id.h, "SYSTEM_ADMIN", null);
        if (!c.expect(!!h, "the second platform admin could not be appointed")) return c.verdict("");
        await satu("the platform", { email: EMAIL.sys, sql: cabutSql(h) }, { email: EMAIL.hod, sql: cabutSql(id.ra_s) }, sisaPlatform, PLATFORM);
      } finally {
        // whatever happened, no temporary holder stays: each is ended by the platform admin if its race did not end it
        for (const ra of sementara) {
          psql(`begin; select selftest.as_user('${EMAIL.sys}'); select public.revoke_role('${ra}', '${ALASAN}') from public.role_assignments x where x.id = '${ra}' and x.revoked_at is null; commit;`);
        }
      }
      const akhir = psql(`select (select count(*) from public.role_assignments ra where ra.id in ('${id.ra_a}', '${id.ra_s}') and ra.revoked_at is null) || ',' || (${sisaSekolah}) || ',' || (${sisaPlatform})`).out;
      c.expect(akhir === "2,1,1", `after the races the seeded administrators read ${akhir}; expected both standing, one per school and platform`);
      return c.verdict("over two real connections, two administrators revoking each other cannot both succeed: the second waits for the first to commit and is refused "
        + "as the last usable holder, by revoke_role, «Akhiri tugas» and «Ubah peran» at a school and by revoke_role at the platform; the seeded administrators stand");
    },
  },
];
