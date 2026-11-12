/**
 * L1-F4 · THE THIRD ORDER, on two real connections (selftest/balapan.ts, the shared harness; Sharon's interim review of
 * ea3c4b6f, ANONYMISED-PERSON-IS-TERMINAL.md §0 item 9). Commits what it makes, and ends by removing it and proving it
 * gone (THE PLAN §4.1 P3).
 *
 *   L1F4-R01  a school's role grant whose transaction BEGAN before the person's closure, and inserted after the closure
 *             committed: the role's created_at is earlier than the closure's started_at, and the deletion is still
 *             refused ACCOUNT_LIVE_ATTACHMENT, with nothing anonymised. Then the plant: the timestamp comparison put
 *             back, the same order lets the deletion through and the person is anonymised
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { gantiFungsi, mulaiLebihDulu } from "./balapan";

const db = () => process.env.SUPABASE_DB_URL!;
function psql(sql: string): string {
  const r = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error((r.stderr || "").trim().split("\n").filter((l) => /ERROR/.test(l)).slice(-2).join(" | "));
  return (r.stdout ?? "").trim().split("\n").pop() ?? "";
}
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable04.sql", "fable06.sql", "fable11.sql", "fable13.sql", "l1f4.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}
const SYS = "sysadmin@synthetic.pintar.test";
const uid = (email: string) => psql(`select id from auth.users where email = ${lit(email)}`);
const sebagai = (u: string, sql: string) => `select selftest.l1f4_sebagai(${lit(u)}::uuid, ${lit(sql)})`;

/** A teacher at the fixture's school who has asked for deletion (not yet closed), and the place for a new role. */
function guru(awalan: string, nama: string): { u: string; p: string; req: string; tempat: string; inst: string; email: string } {
  const email = `${awalan}${nama}-${randomBytes(3).toString("hex")}@local.invalid`;
  const out = psql(`
    do $$ declare v_inst uuid; v_root uuid; v_u uuid; v_p uuid; v_t text; begin
      perform selftest.as_owner();
      select (selftest.boot_fixture()).inst into v_inst;
      select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
      v_u := selftest.f11_user(${lit(email)}, 'EDUCATOR', v_root);
      select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
      update public.persons set display_name = ${lit(`${awalan}${nama}`)} where id = v_p;
      v_t := selftest.l1f4_sebagai(v_u, 'select public.minta_akun(''DELETE_PERSONAL_DATA'', true)');
      if v_t <> 'OK' then raise exception 'the teacher could not ask for deletion: %', v_t; end if;
      insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_root, 'FACULTY', ${lit(`${awalan}${nama} bagian`)});
    end $$;
    select a.auth_user_id || '|' || a.person_id || '|' || q.id || '|' || n.id || '|' || n.institution_id
      from public.accounts a join auth.users u on u.id = a.auth_user_id
      join public.account_requests q on q.person_id = a.person_id and q.kind = 'DELETE_PERSONAL_DATA'
      join public.org_nodes n on n.name = ${lit(`${awalan}${nama} bagian`)}
     where u.email = ${lit(email)};`);
  const [u, p, req, tempat, inst] = out.split("|");
  return { u, p, req, tempat, inst, email };
}

/** One run of the order: the school's grant begins, the person closes, the grant inserts; then the deletion. */
async function urutan(g: ReturnType<typeof guru>, admin: string) {
  const tulis = `select selftest.l1f4_sebagai_pemilik(${lit(admin)}::uuid, ${lit(
    `insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by) values ('${g.p}', 'EDUCATOR', '${g.tempat}', '${g.inst}', now(), now() + interval '1 year', (select a.person_id from public.accounts a where a.auth_user_id = '${admin}'))`)})`;
  const r = await mulaiLebihDulu("select now()", tulis, sebagai(g.u, "select public.minta_akun('CLOSE', true)"));
  const dulu = psql(`select (select min(ra.created_at) from public.role_assignments ra where ra.person_id = ${lit(g.p)} and ra.scope_node_id = ${lit(g.tempat)})
                       < (select x.started_at from public.person_suspensions x where x.person_id = ${lit(g.p)} and x.ended_at is null)`);
  const hapus = psql(sebagai(uid(SYS), `select public.hapus_data_pribadi('${g.req}', 'sesuai permintaan')`));
  const anonim = psql(`select (anonymized_at is not null)::text from public.persons where id = ${lit(g.p)}`);
  return { r, dulu, hapus, anonim };
}

/** Everything the race made, by its names and emails, removed past the guards (the harness's hand), and counted. */
function bersihkan(awalan: string): string {
  const orang = `(select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email like ${lit(awalan + "%")})`;
  psql(`begin; set local session_replication_role = replica;
    create temp table l1f4b_orang on commit drop as select * from ${orang} x(id);
    delete from public.role_assignments where person_id in (select id from l1f4b_orang);
    delete from public.person_suspensions where person_id in (select id from l1f4b_orang);
    delete from public.account_requests where person_id in (select id from l1f4b_orang);
    delete from public.account_setup where account_id in (select a.id from public.accounts a where a.person_id in (select id from l1f4b_orang));
    delete from public.audit_log where target_id in (select id::text from l1f4b_orang);
    delete from auth.users where id in (select a.auth_user_id from public.accounts a where a.person_id in (select id from l1f4b_orang));
    delete from public.accounts where person_id in (select id from l1f4b_orang);
    delete from public.persons where id in (select id from l1f4b_orang);
    delete from public.org_nodes where name like ${lit(awalan + "%")};
    commit;`);
  return psql(`select (select count(*) from auth.users where email like ${lit(awalan + "%")}) + (select count(*) from public.org_nodes where name like ${lit(awalan + "%")})`);
}

export const l1f4BalapanTests: SelfTest[] = [
  {
    id: "L1F4-R01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const awalan = `l1f4b${randomBytes(3).toString("hex")}-`;
      try {
        const admin = psql(`select selftest.f11_user(${lit(`${awalan}admin@local.invalid`)}, 'INSTITUTION_ADMIN',
                              (select o.id from selftest.boot_fixture() b join public.org_nodes o on o.institution_id = b.inst where o.kind = 'INSTITUTION'))`);
        // the fix: the role's time is earlier than the closure's, and the deletion is refused all the same
        const g1 = guru(awalan, "satu");
        const a = await urutan(g1, admin);
        c.expect(a.r.satu.ok && a.r.satu.out.includes("OK") && a.r.dua.ok && a.r.dua.out.includes("OK"),
          `a step failed: the grant ${a.r.satu.out || a.r.satu.err}; the closure ${a.r.dua.out || a.r.dua.err}`);
        c.expect(a.r.berlaku, `the order did not happen: the closure took ${a.r.dua.ms} ms, so it had not committed before the grant wrote`);
        c.expect(a.dulu === "t", `the role's created_at is not earlier than the closure's started_at (${a.dulu}): this is not the case Sharon named`);
        c.expect(a.hapus === "PR140:ACCOUNT_LIVE_ATTACHMENT" && a.anonim === "false",
          `the deletion answered ${a.hapus} and the person reads anonymised=${a.anonim} (expected PR140:ACCOUNT_LIVE_ATTACHMENT and false)`);
        // the plant: the timestamp comparison put back; the same order lets the deletion through
        const def = spawnSync("psql", ["-X", "-At", db(), "-c", "select pg_get_functiondef('public.hapus_data_pribadi(uuid,text)'::regprocedure)"], { encoding: "utf8" }).stdout ?? "";
        const i = def.indexOf("  -- L1-F4 (Sharon, interim review of ea3c4b6f)");
        const j = def.indexOf("    perform public.akun_tolak('ACCOUNT_LIVE_ATTACHMENT');\n  end if;\n");
        if (!c.expect(i > 0 && j > i, "the deletion does not measure where this test expects")) return c.verdict("");
        const pulih = gantiFungsi("public.hapus_data_pribadi(uuid,text)", def.slice(i, j),
          "  if exists (select 1 from public.person_suspensions x where x.person_id = r.person_id and x.ended_at is null\n"
          + "               and x.category = 'CLOSED_AT_REQUEST'\n"
          + "               and exists (select 1 from public.role_assignments ra where ra.person_id = r.person_id and ra.revoked_at is null\n"
          + "                             and (ra.valid_until is null or ra.valid_until > now()) and ra.created_at > x.started_at)) then\n");
        let b: Awaited<ReturnType<typeof urutan>>;
        try { b = await urutan(guru(awalan, "dua"), admin); } finally { pulih(); }
        c.expect(b.r.berlaku && b.dulu === "t", `the plant's run did not repeat the order (overlap ${b.r.berlaku}, earlier ${b.dulu})`);
        c.expect(b.hapus === "OK" && b.anonim === "true",
          `with the timestamp comparison put back, the deletion answered ${b.hapus}, anonymised=${b.anonim} (expected OK and true: the plant must turn this red)`);
      } finally {
        c.expect(bersihkan(awalan) === "0", "the race's people and places are still there");
      }
      return c.verdict("on two real connections: a school's role grant whose transaction began before the closure and inserted after it carries the earlier time, and the deletion is still refused ACCOUNT_LIVE_ATTACHMENT with nothing anonymised; with the timestamp comparison put back (the plant), the same order lets the deletion through; everything the race made is gone");
    },
  },
];
