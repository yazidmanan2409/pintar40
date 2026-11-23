/**
 * Z8 item 8 (Sharon's R-15 B0 read of 23 Nov; Bob 13:16Z and 13:22Z): A SCHOOL IS NEVER LEFT WITHOUT A USABLE
 * ADMINISTRATOR, BY CLOSING AN ACCOUNT OR BY REVOKING A ROLE.
 *
 *   Z-R15-08  On the synthetic world (Alpha, one school administrator), each probe in its own rolled-back
 *             subtransaction. minta_akun('CLOSE') by the school's last usable administrator is refused
 *             PR140 ACCOUNT_LAST_SCHOOL_ADMIN, with a message that names no school; revoke_role of their own role is
 *             refused PR160 ROLE_LAST_SCHOOL_ADMIN. A second administrator counts only when usable now: appointed now
 *             (not future-dated), not suspended or closed, not anonymised, with an account, and not locked (no
 *             banned_until in the future; one in the past counts). Every school the caller administers is checked: a
 *             second school with another administrator does not make the first safe. With a usable second
 *             administrator both are allowed, and a platform admin may revoke the last one. Red on 307: the closure
 *             was never checked, and a locked or account-less second administrator counted.
 *   Z-R15-10  Concurrency (Sharon (e)): while one administrator's closure is open, a second connection's closure of the
 *             other administrator, and its revocation of its own role, wait on the school's advisory lock (they time
 *             out under lock_timeout instead of passing). Both roll back. Red on 307: neither waits.
 *   Z-R15-11  Daisy's SIGNIFICANT finding on item 8's row (via Bob 14:53Z): Akun saya's «Meninggalkan PINTAR», rendered for
 *             a signed-in learner and a signed-in admin, offers exactly that person's forms (none for a learner, who asks
 *             through the school; CLOSE and DELETE_PERSONAL_DATA for an admin), never REOPEN (a signed-out act;
 *             minta_akun accepts only the two), and no element reads «—». Red on f970bace.
 *   Z-R15-09  The contract: one definition. admin_sekolah_lain_ada is the only «another usable administrator»
 *             question, called by the guard's locked question and by minta_akun; kunci_admin_sekolah is the only taker
 *             of the advisory lock, in school id order; no revoking function is rewritten; the code is in akun_tolak,
 *             the screens' contract and the copy table in both languages, in Daisy's words.
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { KODE_AKUN_DB } from "../src/lib/akun-kontrak";
import { t } from "../src/lib/hle";

const MIGRASI = "supabase/migrations/20270123170000_a_school_keeps_a_usable_administrator.sql";
const EMAIL = {
  sys: "sysadmin@synthetic.pintar.test",
  admin: "alpha-admin@synthetic.pintar.test",
  guru: "alpha-guru@synthetic.pintar.test",
  lain: "beta-admin@synthetic.pintar.test",
} as const;
const ALASAN = "uji Z-R15: alasan yang cukup panjang";
const db = () => process.env.SUPABASE_DB_URL!;
const q = (s: string) => `$q$${s}$q$`;

type Ids = { inst: string; beta: string; a: string; g: string; ra_a: string; nama: string[] };

function siapkan(repoRoot: string): Ids | string {
  spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", "fable01.sql"), db()], { encoding: "utf8" });
  const orang = (e: string) => `(select ac.person_id from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = '${e}')`;
  const sekolah = (e: string) => `(select ra.institution_id from public.role_assignments ra where ra.person_id = ${orang(e)} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id limit 1)`;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", `select jsonb_build_object(
      'inst', ${sekolah(EMAIL.admin)}, 'beta', ${sekolah(EMAIL.lain)}, 'a', ${orang(EMAIL.admin)}, 'g', ${orang(EMAIL.guru)},
      'ra_a', (select ra.id from public.role_assignments ra where ra.person_id = ${orang(EMAIL.admin)} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id limit 1),
      'nama', (select jsonb_agg(i.name) from public.institutions i),
      'lain', (select count(*) from public.role_assignments ra where ra.role = 'INSTITUTION_ADMIN' and ra.institution_id = ${sekolah(EMAIL.admin)} and ra.revoked_at is null and now() < ra.valid_until and ra.person_id <> ${orang(EMAIL.admin)}))::text`, db()], { encoding: "utf8" });
  if (r.status !== 0 || !r.stdout.trim()) return `the synthetic world could not be read: ${(r.stderr || "").trim().split("\n").pop()}`;
  const v = JSON.parse(r.stdout.trim()) as Ids & { lain: number };
  for (const k of ["inst", "beta", "a", "g", "ra_a"] as const) if (!v[k]) return `the synthetic world has no ${k}`;
  if (Number(v.lain) !== 0) return `the synthetic world is not as seeded: Alpha has ${v.lain} other administrator(s)`;
  return v;
}

/** An INSTITUTION_ADMIN appointment written as the owner (seed intent), from `dari` days from now for 200 days. */
const tunjuk = (orang: string, inst: string, dari = 0) =>
  `select set_config('app.seed_intent', 'synthetic', true); insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) `
  + `values ('${orang}', 'INSTITUTION_ADMIN', '${inst}', now() + interval '${dari} days' - interval '1 minute', now() + interval '200 days')`;
const tangguh = (orang: string) => `insert into public.person_suspensions (person_id, category, started_by) values ('${orang}', 'SECURITY', '${orang}')`;
const kunci = (orang: string, hari: number) =>
  `update auth.users set banned_until = now() + interval '${hari} days' where id in (select ac.auth_user_id from public.accounts ac where ac.person_id = '${orang}')`;
const tanpaAkun = (orang: string) => `set local session_replication_role = replica; delete from public.accounts where person_id = '${orang}'; set local session_replication_role = origin`;
const anonim = (orang: string) => `update public.persons set anonymized_at = now() where id = '${orang}'`;
const tutup = `select (public.minta_akun('CLOSE', true) ->> 'ok')`;
const cabut = (id: string) => `select public.revoke_role('${id}', '${ALASAN}')::text`;
const milikSendiri = `(select ra.id from public.role_assignments ra where ra.person_id = public.current_person_id() and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id order by ra.created_at limit 1)`;
const cabutSendiri = `select public.revoke_role(${milikSendiri}, '${ALASAN}')::text`;

/** One rolled-back probe: «ok» or «SQLSTATE:DETAIL», and the message after a tab. */
function skenario(probe: Array<[string, string, string, string?]>): Record<string, string> | string {
  const baris = probe.map(([k, email, sql, prep]) =>
    `v := v || jsonb_build_object('${k}', pg_temp.coba('${email}', ${q(sql)}, ${prep ? q(prep) : "null"}));`).join("\n  ");
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", `
begin;
create function pg_temp.coba(p_email text, p_sql text, p_prep text) returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text;
begin
  begin
    perform selftest.as_owner();
    if p_prep is not null then execute p_prep; end if;
    perform selftest.as_user(p_email);
    execute p_sql;
    v_out := 'ok';
    raise exception using errcode = 'ZRUND', message = 'undo';
  exception
    when sqlstate 'ZRUND' then null;
    when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
      v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 60)) || chr(9) || v_msg;
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
create temp table zr_snap (v jsonb) on commit drop;
do $zr$
declare v jsonb := '{}'::jsonb;
begin
  ${baris}
  perform selftest.as_owner();
  insert into zr_snap values (v);
end $zr$;
select 'ZR' || chr(9) || v::text from zr_snap;
rollback;`, db()], { encoding: "utf8" });
  if (r.status !== 0) return `the scenario could not run: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? r.stderr}`;
  const l = r.stdout.split("\n").find((x) => x.startsWith("ZR\t"));
  return l ? (JSON.parse(l.slice(3)) as Record<string, string>) : "the scenario returned no snapshot";
}

const kode = (v: string | undefined) => (v ?? "missing").split("\t")[0];

/** A transaction that holds `sql` open as `email` for `detik` seconds, then rolls back. */
function tahan(email: string, sql: string, detik: number): Promise<string> {
  return new Promise((res) => {
    const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c",
      `begin; select selftest.as_user('${email}'); ${sql}; select 'HELD'; select pg_sleep(${detik}); rollback;`, db()]);
    let out = "", err = "";
    p.stdout.on("data", (d) => { out += String(d); });
    p.stderr.on("data", (d) => { err += String(d); });
    p.on("close", (code) => res(code === 0 && out.includes("HELD") ? "held" : `failed: ${err.trim().split("\n").pop()}`));
  });
}
function coba(email: string, sql: string, prep: string): string {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c",
    `begin; ${prep}; select selftest.as_user('${email}'); set local lock_timeout = '1500ms'; ${sql}; rollback;`, db()], { encoding: "utf8" });
  if (r.status === 0) return "ok";
  const e = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim();
  return /lock timeout/.test(e) ? "waited" : e;
}

export const zR15Tests: SelfTest[] = [
  {
    id: "Z-R15-08",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      const G = tunjuk(id.g, id.inst);
      const H = skenario([
        // the last usable administrator
        ["c_sendiri", EMAIL.admin, tutup],
        ["r_sendiri", EMAIL.admin, cabutSendiri],
        // a second administrator who is usable: both allowed
        ["c_dua", EMAIL.admin, tutup, G],
        ["r_dua", EMAIL.admin, cabutSendiri, G],
        // a second administrator who is not usable now: refused
        ["c_ditangguhkan", EMAIL.admin, tutup, `${G}; ${tangguh(id.g)}`],
        ["r_ditangguhkan", EMAIL.admin, cabutSendiri, `${G}; ${tangguh(id.g)}`],
        ["c_dikunci", EMAIL.admin, tutup, `${G}; ${kunci(id.g, 365)}`],
        ["r_dikunci", EMAIL.admin, cabutSendiri, `${G}; ${kunci(id.g, 365)}`],
        ["c_tanpa_akun", EMAIL.admin, tutup, `${G}; ${tanpaAkun(id.g)}`],
        ["r_tanpa_akun", EMAIL.admin, cabutSendiri, `${G}; ${tanpaAkun(id.g)}`],
        ["c_anonim", EMAIL.admin, tutup, `${G}; ${anonim(id.g)}`],
        ["c_mendatang", EMAIL.admin, tutup, tunjuk(id.g, id.inst, 5)],
        ["r_mendatang", EMAIL.admin, cabutSendiri, tunjuk(id.g, id.inst, 5)],
        // a lock that has ended does not make the second administrator unusable
        ["c_kunci_lewat", EMAIL.admin, tutup, `${G}; ${kunci(id.g, -1)}`],
        // every school the caller administers: Beta has another administrator, Alpha does not
        ["c_dua_sekolah", EMAIL.admin, tutup, tunjuk(id.a, id.beta)],
        ["c_dua_sekolah_aman", EMAIL.admin, tutup, `${tunjuk(id.a, id.beta)}; ${G}`],
        // a platform admin may revoke the last one
        ["r_platform", EMAIL.sys, cabut(id.ra_a)],
      ]);
      if (typeof H === "string") { c.expect(false, H); return c.verdict(""); }
      const TUTUP = "PR140:ACCOUNT_LAST_SCHOOL_ADMIN", CABUT = "PR160:ROLE_LAST_SCHOOL_ADMIN";
      const harap: Record<string, string> = {
        c_sendiri: TUTUP, r_sendiri: CABUT, c_dua: "ok", r_dua: "ok",
        c_ditangguhkan: TUTUP, r_ditangguhkan: CABUT, c_dikunci: TUTUP, r_dikunci: CABUT, c_tanpa_akun: TUTUP, r_tanpa_akun: CABUT,
        c_anonim: TUTUP, c_mendatang: TUTUP, r_mendatang: CABUT, c_kunci_lewat: "ok",
        c_dua_sekolah: TUTUP, c_dua_sekolah_aman: "ok", r_platform: "ok",
      };
      for (const [k, v] of Object.entries(harap)) c.expect(kode(H[k]) === v, `${k}: expected ${v}, got ${H[k]}`);
      const pesan = (H.c_sendiri ?? "").split("\t")[1] ?? "";
      for (const n of id.nama) c.expect(!pesan.includes(n), `the closure's refusal names a school («${n}»): ${pesan}`);
      return c.verdict("the last usable school administrator's closure is refused ACCOUNT_LAST_SCHOOL_ADMIN (naming no school) and their own revocation "
        + "ROLE_LAST_SCHOOL_ADMIN; a second administrator counts only appointed now, unsuspended, not anonymised, with an account and not locked; "
        + "every school is checked; a usable second administrator allows both; a platform admin may revoke the last one");
    },
  },
  {
    id: "Z-R15-10",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = siapkan(repoRoot);
      if (typeof id === "string") { c.expect(false, id); return c.verdict(""); }
      // the second administrator is written and kept for this test only, then revoked as the owner
      const G = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", `${tunjuk(id.g, id.inst)} returning id`, db()], { encoding: "utf8" });
      const raG = G.stdout.trim().split("\n").pop() ?? "";
      if (!c.expect(G.status === 0 && /^[0-9a-f-]{36}$/.test(raG), `the second administrator could not be appointed: ${G.stderr}`)) return c.verdict("");
      try {
        for (const [k, sql] of [["tutup", tutup], ["cabut", cabutSendiri]] as const) {
          const pegang = tahan(EMAIL.admin, tutup, 4);
          await new Promise((r) => setTimeout(r, 1200));
          const hasil = coba(EMAIL.guru, sql, "select 1");
          c.expect(hasil === "waited", `${k}: the other administrator's ${k === "tutup" ? "closure" : "revocation"} did not wait for the open closure (${hasil})`);
          c.expect((await pegang) === "held", `${k}: the first closure did not hold`);
        }
      } finally {
        spawnSync("psql", ["-qAt", "-c", `set session_replication_role = replica; update public.role_assignments set revoked_at = now(), revoked_reason = '${ALASAN}' where id = '${raG}'`, db()]);
      }
      return c.verdict("while one administrator's closure is open, the other's closure and own revocation wait on the school's lock");
    },
  },
  {
    id: "Z-R15-11",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const r = spawnSync(process.execPath, ["--import", "tsx", "-e", `(async () => {
        const { createElement: h } = await import("react"); const { renderToStaticMarkup } = await import("react-dom/server");
        const m = await import("file://" + process.cwd() + "/src/components/akun/MeninggalkanPintar.tsx"); const K = m.default?.default ?? m.default;
        const p = { permintaan: [], hasil: "gagal", kode: "ACCOUNT_LAST_SCHOOL_ADMIN" };
        const out = {};
        for (const locale of ["id", "en"]) {
          out["murid-" + locale] = renderToStaticMarkup(h(K, { ...p, locale, bisaMinta: false, persona: "learner" }));
          out["admin-" + locale] = renderToStaticMarkup(h(K, { ...p, locale, bisaMinta: true, persona: "staff" }));
        }
        process.stdout.write(JSON.stringify(out));
      })().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`], { cwd: repoRoot, encoding: "utf8" });
      if (!c.expect(r.status === 0, `Meninggalkan PINTAR could not be rendered: ${(r.stderr || "").split("\n").slice(0, 3).join(" ")}`)) return c.verdict("");
      const out = JSON.parse(r.stdout) as Record<string, string>;
      for (const [k, html] of Object.entries(out)) {
        const formulir = [...html.matchAll(/data-minta-akun="([A-Z_]+)"/g)].map((x) => x[1]).join(",");
        const mau = k.startsWith("murid") ? "" : "CLOSE,DELETE_PERSONAL_DATA";
        c.expect(formulir === mau, `${k}: the section offers [${formulir}] (expected [${mau}])`);
        c.expect(!/>\s*—\s*</.test(html), `${k}: an element on the section reads «—»`);
        if (k.startsWith("murid")) c.expect(html.includes("data-tinggal-lewat-sekolah"), `${k}: the learner is not told the request goes through the school`);
      }
      return c.verdict("Meninggalkan PINTAR, rendered in ID and EN: a signed-in learner is offered no form and told to ask through the school; a signed-in admin "
        + "exactly CLOSE and DELETE_PERSONAL_DATA; never REOPEN; no element reads «—»");
    },
  },
  {
    id: "Z-R15-09",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let sql = "";
      try { sql = readFileSync(join(repoRoot, MIGRASI), "utf8"); } catch { c.expect(false, `${MIGRASI} is missing`); return c.verdict(""); }
      const badan = sql.replace(/--[^\n]*/g, "");
      const fungsi = (n: string) => new RegExp(`create or replace function public\\.${n}\\b[\\s\\S]*?\\$(function)?\\$;`, "i").exec(badan)?.[0] ?? "";
      c.expect(/create or replace function public\.admin_sekolah_lain_ada\b/i.test(badan), "no admin_sekolah_lain_ada");
      c.expect(/pg_advisory_xact_lock\(hashtextextended\('institution_admin:' \|\| /.test(fungsi("kunci_admin_sekolah")) && /order by/i.test(fungsi("kunci_admin_sekolah")),
        "kunci_admin_sekolah does not take the school's advisory lock in id order");
      c.expect((badan.match(/pg_advisory_xact_lock/g) ?? []).length === 1, "the advisory lock is taken somewhere other than kunci_admin_sekolah");
      for (const n of ["peran_terakhir_kode", "minta_akun"]) {
        c.expect(/admin_sekolah_lain_ada\(/.test(fungsi(n)), `${n} does not ask admin_sekolah_lain_ada`);
        c.expect(/kunci_admin_sekolah\(/.test(fungsi(n)), `${n} does not take the school's lock`);
      }
      const minta = fungsi("minta_akun");
      c.expect(minta.indexOf("from public.persons where id = v_me for update") >= 0
        && minta.indexOf("from public.persons where id = v_me for update") < minta.indexOf("kunci_admin_sekolah("), "minta_akun takes the school's lock before the person's");
      c.expect(!/admin_dapat_dipakai\('INSTITUTION_ADMIN'/.test(fungsi("peran_terakhir_kode").replace(/where a\.id = r\.id/, "")) || /admin_sekolah_lain_ada/.test(fungsi("peran_terakhir_kode")),
        "the guard asks «another usable administrator» itself");
      c.expect(!/create or replace function public\.(revoke_role|akhiri_tugas_staf|ubah_peran|buka_kembali_akun|role_assignments_guard)\b/i.test(badan), "a revoking function or the guard was rewritten");
      c.expect(/when 'ACCOUNT_LAST_SCHOOL_ADMIN'/.test(fungsi("akun_tolak")) && /akun_tolak\('ACCOUNT_LAST_SCHOOL_ADMIN'\)/.test(minta), "akun_tolak does not know, or minta_akun does not raise, ACCOUNT_LAST_SCHOOL_ADMIN");
      c.expect((KODE_AKUN_DB as readonly string[]).includes("ACCOUNT_LAST_SCHOOL_ADMIN"), "the screens' contract does not know ACCOUNT_LAST_SCHOOL_ADMIN");
      for (const f of ["admin_sekolah_lain_ada", "kunci_admin_sekolah", "admin_akun_dapat_masuk", "admin_dapat_dipakai", "peran_terakhir_kode", "minta_akun", "akun_tolak"]) {
        c.expect(new RegExp(`revoke execute on function public\\.${f}\\([^)]*\\) from public`).test(badan), `${f} is not revoked from PUBLIC after its create (F06-S01)`);
      }
      const k = "akun.tinggal.galat.account_last_school_admin";
      c.expect(t(k as never, "staff") === "Permintaan ini tidak diajukan: Anda satu-satunya Admin sekolah yang masih aktif di sekolah Anda, jadi akun Anda belum dapat ditutup. Tunjuk Admin sekolah lain lebih dulu di Peran & akses, lalu ajukan lagi. Bila tidak ada orang lain, hubungi Admin PINTAR.",
        `${k} (ID) is not Daisy's: «${t(k as never, "staff")}»`);
      c.expect(t(k as never, "staff", { locale: "en" }) === "This request was not made: you are the only active school administrator at your school, so your account cannot be closed yet. Appoint another school administrator in Roles & access first, then ask again. If there is no one else, contact an Admin PINTAR.",
        `${k} (EN) is not Daisy's: «${t(k as never, "staff", { locale: "en" })}»`);
      return c.verdict("one «another usable administrator» question and one advisory lock taker, used by the guard's locked question and by minta_akun after "
        + "the person's lock; no revoking function rewritten; ACCOUNT_LAST_SCHOOL_ADMIN in akun_tolak, the contract and the copy table in Daisy's words");
    },
  },
];
