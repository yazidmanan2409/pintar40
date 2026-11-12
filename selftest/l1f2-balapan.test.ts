/**
 * L1-F2 and L1-R2 · THE RACES, on two real connections (selftest/balapan.ts, the shared harness; Sharon's §2a test 3
 * and §2b test 2, SUSPENSION-COVERS-NEW-ACCOUNTS.md). Each commits what it makes (the other connection must see it)
 * and ends by removing it and proving it gone (THE PLAN §4.1 P3).
 *
 *   L1F2-R01  a suspension and an account creation for the same person, in both orders: the account ends locked
 *             either way. The test then removes the link trigger's FOR SHARE (the plant) and runs the order it
 *             guards: the account ends unlocked, so the race is what the lock decides
 *   L1R2-R01  a password-write permit's issue and a lock, in both orders: issuer first, the permit is gone after the
 *             lock; lock first, the issuer is refused ACCOUNT_LOCKED and writes none. The test then removes the
 *             issuer's FOR SHARE (the plant): issuer first, the permit survives the lock
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { balapan, psqlLain, tidur } from "./balapan";

const db = () => process.env.SUPABASE_DB_URL!;
function psql(sql: string): string {
  const r = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error((r.stderr || "").trim().split("\n").filter((l) => /ERROR/.test(l)).slice(-2).join(" | "));
  return (r.stdout ?? "").trim().split("\n").pop() ?? "";
}
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable02.sql", "fable03.sql", "fable06.sql", "fable11.sql", "l1f2.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}
const SYS = "sysadmin@synthetic.pintar.test";
const orangBaru = (nama: string) => psql(`select selftest.l1f2_orang(${lit(nama)})`);
const akunUntuk = (p: string, email: string) => `select selftest.l1f2_akun(${lit(p)}::uuid, ${lit(email)})`;
const tangguh = (p: string) => `select selftest.as_user(${lit(SYS)}); select public.tangguhkan_akun(${lit(p)}::uuid, 'ADMINISTRATIVE', 'uji L1-F2: balapan dua koneksi'); select selftest.as_owner()`;
const kunci = (email: string) => psql(`select coalesce(selftest.l1f2_kunci(u.id), 'no user') from auth.users u where u.email = ${lit(email)} union all select 'no user' limit 1`);
const uidDari = (email: string) => psql(`select id from auth.users where email = ${lit(email)}`);
/** Everything a race made, by its names, removed past the guards (the harness's hand, never a product path), and counted. */
function bersihkan(awalan: string): string {
  const orang = `(select p.id from public.persons p where p.display_name like ${lit(awalan + "%")})`;
  psql(`begin; set local session_replication_role = replica;
    delete from public.password_write_permits where auth_user_id in (select a.auth_user_id from public.accounts a where a.person_id in ${orang});
    delete from public.person_suspensions where person_id in ${orang};
    delete from public.account_requests where person_id in ${orang};
    delete from public.account_activation_grants where person_id in ${orang};
    delete from public.account_setup where account_id in (select a.id from public.accounts a where a.person_id in ${orang});
    delete from auth.users where id in (select a.auth_user_id from public.accounts a where a.person_id in ${orang});
    delete from public.accounts where person_id in ${orang};
    delete from public.audit_log where target_id in (select id::text from ${orang} x(id));
    delete from public.persons where id in ${orang};
    commit;`);
  return psql(`select count(*) from public.persons where display_name like ${lit(awalan + "%")}`);
}
/** A function's definition, replaced for the plant and put back exactly afterwards. */
function tanam(fn: string, dari: string, ke: string): () => void {
  const asli = spawnSync("psql", ["-X", "-At", db(), "-c", `select pg_get_functiondef(${lit(fn)}::regprocedure)`], { encoding: "utf8" }).stdout ?? "";
  if (!asli.includes(dari)) throw new Error(`the plant's fragment is not in ${fn}`);
  const kirim = (def: string) => { const r = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: def + ";\n" }); if (r.status !== 0) throw new Error(r.stderr); };
  kirim(asli.replace(dari, ke));
  return () => kirim(asli);
}

/** Run DDL now, and return the DDL that undoes it (both committed: the other connection must see them). */
function ubah(maju: string, mundur: string): () => void {
  psql(`begin; ${maju}; commit;`);
  return () => { psql(`begin; ${mundur}; commit;`); };
}

export const l1f2BalapanTests: SelfTest[] = [
  {
    id: "L1F2-R01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const awalan = `L1F2B ${randomBytes(3).toString("hex")} `;
      try {
        // order 1: the suspension holds the person's row; the creation's link trigger waits for it, then sees it
        const p1 = orangBaru(awalan + "satu"), e1 = `l1f2b-satu-${randomBytes(3).toString("hex")}@local.invalid`;
        const r1 = await balapan(tangguh(p1), akunUntuk(p1, e1));
        // order 2: the creation holds the person's row FOR SHARE; the suspension waits, then locks the new account
        const p2 = orangBaru(awalan + "dua"), e2 = `l1f2b-dua-${randomBytes(3).toString("hex")}@local.invalid`;
        const r2 = await balapan(akunUntuk(p2, e2), tangguh(p2));
        c.expect(r1.satu.ok && r1.dua.ok && r2.satu.ok && r2.dua.ok, `a step failed: ${[r1.satu, r1.dua, r2.satu, r2.dua].map((x) => x.err).filter(Boolean).join("; ")}`);
        c.expect(r1.berlaku && r2.berlaku, `the race did not overlap (the second connection took ${r1.dua.ms} and ${r2.dua.ms} ms)`);
        c.expect(kunci(e1) === "locked" && kunci(e2) === "locked", `suspension first: ${kunci(e1)}; creation first: ${kunci(e2)} (expected locked both ways)`);
        // Three other locks already serialise this race through the product's creation path: L1-F4's attachment guard
        // on accounts (FOR SHARE on the person, before the insert), the activation grant's row (FOR UPDATE, which the
        // suspension's own act touches) and the foreign key's check (FOR KEY SHARE). The trigger's FOR SHARE must hold
        // without any of them. So, for what follows: L1-F4's guard switched off, the trigger fired before the foreign
        // key's check, and the account created by the seed's path (no grant). Suspension first:
        //   - with the trigger's FOR SHARE: the account still ends locked (it holds by itself);
        //   - without it (the plant): the account is left unlocked.
        const benih = (p: string, email: string) => `select set_config('app.seed_intent', 'synthetic', true);
          insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), ${lit(email)}, jsonb_build_object('person_id', ${lit(p)}, 'account_kind', 'EMAIL'))`;
        const tanpaF4 = ubah("alter table public.accounts disable trigger _l1f4_accounts_person_id", "alter table public.accounts enable trigger _l1f4_accounts_person_id");
        const urut = ubah("drop trigger _l1f2_accounts_terkunci on public.accounts; create trigger \"A_l1f2_tanam\" after insert on public.accounts for each row execute function public.akun_baru_terkunci()",
          "drop trigger \"A_l1f2_tanam\" on public.accounts; create trigger _l1f2_accounts_terkunci after insert on public.accounts for each row execute function public.akun_baru_terkunci()");
        let sendiri = "", tanpa = "";
        try {
          const p4 = orangBaru(awalan + "empat"), e4 = `l1f2b-empat-${randomBytes(3).toString("hex")}@local.invalid`;
          await balapan(tangguh(p4), benih(p4, e4));
          sendiri = kunci(e4);
          const pulih = tanam("public.akun_baru_terkunci()", "  perform 1 from public.persons p where p.id = new.person_id for share;\n", "");
          try {
            const p3 = orangBaru(awalan + "tiga"), e3 = `l1f2b-tiga-${randomBytes(3).toString("hex")}@local.invalid`;
            await balapan(tangguh(p3), benih(p3, e3));
            tanpa = kunci(e3);
          } finally { pulih(); }
        } finally { urut(); tanpaF4(); }
        c.expect(sendiri === "locked", `with the other locks out of the way, suspension first left the account ${sendiri} (expected locked: the trigger's own FOR SHARE holds by itself)`);
        c.expect(tanpa === "open", `with no lock on the person before the trigger reads them, suspension first left the account ${tanpa} (expected open: the plant must turn this red)`);
      } finally {
        c.expect(bersihkan(awalan) === "0", "the race's people are still there");
      }
      return c.verdict("on two real connections, overlapping: a suspension first and the account creation waiting, and the creation first and the suspension waiting, each end with the account locked; with the other locks out of the way (L1-F4's guard off, the trigger before the foreign key's check, the seed's path with no grant) the trigger's own FOR SHARE still locks it; with that removed too, suspension first leaves the account unlocked (the plant); everything the race made is gone");
    },
  },
  {
    id: "L1R2-R01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const awalan = `L1R2B ${randomBytes(3).toString("hex")} `;
      const izin = (uid: string) => psql(`select count(*) from public.password_write_permits where auth_user_id = ${lit(uid)}`);
      const terbit = (uid: string) => `select public.password_write_permit(${lit(uid)}::uuid, 'ACTIVATION')`;
      try {
        // order 1: the issuer holds the account row FOR SHARE and writes its permit; the lock waits, then deletes it
        const p1 = orangBaru(awalan + "satu"), e1 = `l1r2b-satu-${randomBytes(3).toString("hex")}@local.invalid`;
        psql(akunUntuk(p1, e1)); const u1 = uidDari(e1);
        const r1 = await balapan(terbit(u1), tangguh(p1));
        // order 2: the lock holds the account rows; the issuer waits, then its check sees the suspension
        const p2 = orangBaru(awalan + "dua"), e2 = `l1r2b-dua-${randomBytes(3).toString("hex")}@local.invalid`;
        psql(akunUntuk(p2, e2)); const u2 = uidDari(e2);
        const r2 = await balapan(tangguh(p2), terbit(u2));
        c.expect(r1.satu.ok && r1.dua.ok && r2.satu.ok, `a step failed: ${[r1.satu, r1.dua, r2.satu].map((x) => x.err).filter(Boolean).join("; ")}`);
        c.expect(r1.berlaku && r2.berlaku, `the race did not overlap (the second connection took ${r1.dua.ms} and ${r2.dua.ms} ms)`);
        c.expect(izin(u1) === "0", `issuer first: ${izin(u1)} permit(s) survived the lock (expected 0)`);
        c.expect(!r2.dua.ok && /ACCOUNT_LOCKED/.test(r2.dua.err) && izin(u2) === "0", `lock first: the issuer answered ${r2.dua.ok ? "OK" : r2.dua.err}, ${izin(u2)} permit(s) (expected ACCOUNT_LOCKED and none)`);
        // L1-F4's attachment guard on password_write_permits already takes the person FOR SHARE before the insert, which
        // serialises this race too. The issuer's own FOR SHARE must hold without it: the guard switched off, issuer first
        const tanpaF4 = ubah("alter table public.password_write_permits disable trigger _l1f4_password_write_permits_auth_user_id",
          "alter table public.password_write_permits enable trigger _l1f4_password_write_permits_auth_user_id");
        let sendiri = "", tanpa = "";
        try {
          const p4 = orangBaru(awalan + "empat"), e4 = `l1r2b-empat-${randomBytes(3).toString("hex")}@local.invalid`;
          psql(akunUntuk(p4, e4)); const u4 = uidDari(e4);
          await balapan(terbit(u4), tangguh(p4));
          sendiri = izin(u4);
          // the plant: the issuer's locks removed as well, issuer first: the permit survives the lock. RESTATED (Sharon's
          // review of e27f4a77): the issuer now takes the person row, then the account row; either alone serialises it
          // against the suspending act, so the plant removes both
          const pulih = tanam("public.password_write_permit(uuid,text)",
            "  perform 1 from public.persons p where p.id = (select a.person_id from public.accounts a where a.auth_user_id = p_auth_user) for share;\n"
            + "  perform 1 from public.accounts a where a.auth_user_id = p_auth_user for share;\n", "");
          try {
            const p3 = orangBaru(awalan + "tiga"), e3 = `l1r2b-tiga-${randomBytes(3).toString("hex")}@local.invalid`;
            psql(akunUntuk(p3, e3)); const u3 = uidDari(e3);
            await balapan(terbit(u3), tangguh(p3));
            tanpa = izin(u3);
          } finally { pulih(); }
        } finally { tanpaF4(); }
        c.expect(sendiri === "0", `with L1-F4's guard switched off, issuer first left ${sendiri} permit(s) (expected 0: the issuer's own FOR SHARE holds by itself)`);
        c.expect(tanpa === "1", `with no lock before the issuer's check, issuer first left ${tanpa} permit(s) (expected 1: the plant must turn this red)`);
      } finally {
        c.expect(bersihkan(awalan) === "0", "the race's people are still there");
      }
      return c.verdict("on two real connections, overlapping: an activation permit issued first and the lock waiting leaves no permit; the lock first and the issuer waiting is refused ACCOUNT_LOCKED and writes none; with L1-F4's guard on permits switched off the issuer's own FOR SHARE still holds; with that removed as well, issuer first leaves its permit standing after the lock (the plant); everything the race made is gone");
    },
  },
  {
    // Sharon's result review of e27f4a77: the deadlock order. The issuer takes its first lock, then sleeps before its
    // insert (the function swapped by fragment); the suspension starts during that sleep. Both must complete: no 40P01,
    // the suspension committed, no permit left
    id: "L1R2-R02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const awalan = `L1R2C ${randomBytes(3).toString("hex")} `;
      try {
        const p = orangBaru(awalan + "satu"), em = `l1r2c-satu-${randomBytes(3).toString("hex")}@local.invalid`;
        psql(akunUntuk(p, em)); const u = uidDari(em);
        const sisip = "  insert into public.password_write_permits (auth_user_id, purpose, expires_at)\n  values (p_auth_user, p_purpose,";
        const pulih = tanam("public.password_write_permit(uuid,text)", sisip, "  perform pg_sleep(2);\n" + sisip);
        let r: { a: Awaited<ReturnType<typeof psqlLain>>; b: Awaited<ReturnType<typeof psqlLain>> };
        try {
          const a = psqlLain(`select public.password_write_permit(${lit(u)}::uuid, 'ACTIVATION')`);
          await tidur(600);
          const b = psqlLain(tangguh(p));
          r = { a: await a, b: await b };
        } finally { pulih(); }
        const mati = [r.a, r.b].filter((x) => /deadlock|40P01/i.test(x.err)).length;
        c.expect(mati === 0, `a side was aborted for a deadlock: the issuer ${r.a.ok ? "OK" : r.a.err}; the suspension ${r.b.ok ? "OK" : r.b.err}`);
        c.expect(r.b.ok && psql(`select public.orang_ditangguhkan(${lit(p)}::uuid)::text`) === "true", `the suspension did not commit (${r.b.err || "not suspended"})`);
        c.expect(r.b.ms >= 1000, `the suspension did not wait for the issuer (${r.b.ms} ms): the order was not reached`);
        c.expect(psql(`select count(*) from public.password_write_permits where auth_user_id = ${lit(u)}`) === "0", "a permit survived the lock");
      } finally {
        c.expect(bersihkan(awalan) === "0", "the race's people are still there");
      }
      return c.verdict("on two real connections, the issuer holding its first lock and sleeping before its insert while a suspension starts: both complete, no 40P01, the suspension committed after waiting, and no permit survives the lock (the person row is taken first on both sides)");
    },
  },
  {
    // The engineer's search after Sharon's review: Auth's own write of a card (auth_card_email_guard) holds the auth.users
    // row and then updates the accounts row; akun_kunci took the accounts rows and then auth.users. The guard is
    // swapped by fragment to sleep before its accounts update; the suspension starts during that sleep. Both must
    // complete: no 40P01, the suspension committed, the new card number written, the account locked
    id: "L1R2-R03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const awalan = `L1R2D ${randomBytes(3).toString("hex")} `;
      const angka = () => String(1_000_000_000 + Math.floor(Math.random() * 8_999_999_999)).slice(0, 10);
      try {
        const p = orangBaru(awalan + "kartu"), lama = angka(), baru = angka();
        const dom = "cards.synthetic.pintar.test";
        psql(`begin; select set_config('app.seed_intent', 'synthetic', true);
          insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), ${lit(`card-${lama}@${dom}`)},
            jsonb_build_object('person_id', ${lit(p)}, 'account_kind', 'CLASSROOM_CARD', 'card_number', ${lit(lama)}));
          insert into public.card_reissues (person_id, account_id, old_card_number, new_card_number, reason, authorized_by, expires_at)
          select ${lit(p)}, a.id, ${lit(lama)}, ${lit(baru)}, 'HILANG', (select ac.person_id from public.accounts ac join auth.users uu on uu.id = ac.auth_user_id where uu.email = ${lit(SYS)}), now() + interval '10 minutes'
            from public.accounts a where a.person_id = ${lit(p)};
          commit;`);
        const u = psql(`select a.auth_user_id from public.accounts a where a.person_id = ${lit(p)}`);
        const ganti = "  update public.accounts set card_number = r.new_card_number where id = v_akun.id;\n";
        const pulih = tanam("public.auth_card_email_guard()", ganti, "  perform pg_sleep(2);\n" + ganti);
        let r: { a: Awaited<ReturnType<typeof psqlLain>>; b: Awaited<ReturnType<typeof psqlLain>> };
        try {
          const a = psqlLain(`update auth.users set email = ${lit(`card-${baru}@${dom}`)} where id = ${lit(u)}`);
          await tidur(600);
          const b = psqlLain(tangguh(p));
          r = { a: await a, b: await b };
        } finally { pulih(); }
        const mati = [r.a, r.b].filter((x) => /deadlock|40P01/i.test(x.err)).length;
        c.expect(mati === 0, `a side was aborted for a deadlock: the card's Auth write ${r.a.ok ? "OK" : r.a.err}; the suspension ${r.b.ok ? "OK" : r.b.err}`);
        c.expect(r.a.ok && psql(`select card_number from public.accounts where person_id = ${lit(p)}`) === baru, `the card's Auth write did not complete (${r.a.err || "card number unchanged"})`);
        c.expect(r.b.ok && psql(`select public.orang_ditangguhkan(${lit(p)}::uuid)::text`) === "true", `the suspension did not commit (${r.b.err || "not suspended"})`);
        c.expect(r.b.ms >= 1000, `the suspension did not wait for the card's write (${r.b.ms} ms): the order was not reached`);
        c.expect(kunci(`card-${baru}@${dom}`) === "locked", `the account reads ${kunci(`card-${baru}@${dom}`)} after both (expected locked)`);
      } finally {
        psql(`begin; set local session_replication_role = replica;
          delete from public.card_reissues where person_id in (select p.id from public.persons p where p.display_name like ${lit(awalan + "%")});
          commit;`);
        c.expect(bersihkan(awalan) === "0", "the race's people are still there");
      }
      return c.verdict("on two real connections, Auth's write of a reissued card holding its auth.users row and sleeping before its accounts update while a suspension starts: both complete, no 40P01, the new card number written, the suspension committed after waiting, and the account locked (akun_kunci takes auth.users before accounts)");
    },
  },
];
