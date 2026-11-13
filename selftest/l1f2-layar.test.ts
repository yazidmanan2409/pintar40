/**
 * L1-F2 through the running app (SUSPENSION-COVERS-NEW-ACCOUNTS.md §2b "Card reissue" and §5c "P-1"), against real Auth
 * and the mail sink.
 *
 *   L1F2-A01  CARD REISSUE FOR A LOCKED LEARNER IS INTENDED (Sharon, settled 12 Nov): a school's reissue of a suspended
 *             learner's card answers as for a learner who is not suspended (the same status and shape) and writes the
 *             same account.card_reissued row; banned_until stays akun_terkunci_sampai(); the new card signs nothing in
 *             until reinstatement (and the refused attempt leaves the lock), and signs in after it
 *   L1F2-A02  P-1's guarding test: an account created for a suspended person (EMAIL) and for a closed person (a class
 *             card) answers as an ordinary creation, sends nothing to anyone (the mail sink), and is created locked
 */
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { ipUji, lit, Peramban, psql, sinkCari } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { muridBerkartu } from "./d101.test";
import { pilihKonteksPeramban } from "./konteks-uji";

const SYS = "sysadmin@synthetic.pintar.test";
const sebagaiSys = (sql: string) => psql(`select selftest.as_user(${lit(SYS)}); ${sql}; select selftest.as_owner();`);
const kunciDari = (person: string) => psql(`select coalesce(string_agg(case when u.banned_until = public.akun_terkunci_sampai() then 'locked' when u.banned_until is null then 'open' else 'other' end, ',' order by u.id), 'none')
  from public.accounts a join auth.users u on u.id = a.auth_user_id where a.person_id = ${lit(person)}`);
const auditKartu = (person: string) => psql(`select count(*) || ':' || coalesce(string_agg(distinct (select string_agg(k, ',' order by k) from jsonb_object_keys(l.summary) k), '|'), '-')
  from public.audit_log l where l.action = 'account.card_reissued' and l.target_id = ${lit(person)}`);
const kunciJson = (x: Record<string, unknown> | null) => Object.keys(x ?? {}).sort().join(",");

async function sysMasuk(asal: string): Promise<Peramban> {
  const sys = new Peramban(asal, ipUji());
  const m = await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
  if (m.status !== 200) throw new Error(`the Platform Admin could not sign in (${m.status})`);
  await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");
  return sys;
}

export const l1f2AppTests: SelfTest[] = [
  {
    id: "L1F2-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      const sys = await sysMasuk(asal);
      const terkunci = await muridBerkartu(c, asal, sys, `l1f2a${tag}`);
      const biasa = await muridBerkartu(c, asal, sys, `l1f2b${tag}`);
      sebagaiSys(`select public.tangguhkan_akun(${lit(terkunci.murid)}, 'ADMINISTRATIVE', 'uji L1-F2: kartu ditahan sementara')`);
      const kunciAwal = kunciDari(terkunci.murid);
      const auditA0 = auditKartu(terkunci.murid), auditB0 = auditKartu(biasa.murid);
      const ulangA = await sys.jsonDari("/api/akun/kartu-kelas", { json: { person_id: terkunci.murid, alasan: "HILANG" } });
      const ulangB = await sys.jsonDari("/api/akun/kartu-kelas", { json: { person_id: biasa.murid, alasan: "HILANG" } });
      c.expect(kunciAwal === "locked", `the suspended learner's account reads ${kunciAwal} before the reissue`);
      c.expect(ulangA.status === 200 && ulangA.status === ulangB.status && kunciJson(ulangA.body) === kunciJson(ulangB.body),
        `the reissue answered ${ulangA.status} {${kunciJson(ulangA.body)}} for the suspended learner and ${ulangB.status} {${kunciJson(ulangB.body)}} for one who is not (expected the same)`);
      const auditA = auditKartu(terkunci.murid), auditB = auditKartu(biasa.murid);
      c.expect(Number(auditA.split(":")[0]) === Number(auditA0.split(":")[0]) + 1 && Number(auditB.split(":")[0]) === Number(auditB0.split(":")[0]) + 1
        && auditA.split(":")[1] === auditB.split(":")[1], `the account.card_reissued rows: suspended ${auditA0} → ${auditA}, not suspended ${auditB0} → ${auditB} (expected one each, the same fields)`);
      c.expect(kunciDari(terkunci.murid) === "locked", `after the reissue the suspended learner's account reads ${kunciDari(terkunci.murid)} (expected locked)`);
      const baru = (ulangA.body as { kartu?: { card?: string; pin?: string } } | null)?.kartu;
      c.expect(!!baru?.card && !!baru?.pin, `the reissue gave no new card and PIN for the suspended learner`);
      const coba = () => new Komputer(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: baru?.card ?? "", pin: baru?.pin ?? "" } });
      const ditahan = await coba();
      c.expect(ditahan.status !== 200, `the new card signed the suspended learner in (${ditahan.status})`);
      c.expect(kunciDari(terkunci.murid) === "locked", `after a refused sign-in the account reads ${kunciDari(terkunci.murid)} (expected locked: Sharon §2a test 4)`);
      sebagaiSys(`select public.aktifkan_kembali_akun(${lit(terkunci.murid)}, 'uji L1-F2: kartu dibuka kembali')`);
      const dibuka = await coba();
      c.expect(dibuka.status === 200, `after reinstatement the new card does not sign in (${dibuka.status})`);
      return c.verdict("a school's reissue of a suspended learner's card answered as for a learner who is not suspended (status and shape) and wrote the same account.card_reissued row; the account stayed locked until akun_terkunci_sampai(); the new card signed nothing in until reinstatement and signed in after it");
    },
  },
  {
    id: "L1F2-A02",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      const sys = await sysMasuk(asal);
      // two people of a synthetic school with no account yet: one suspended, one closed at their own request
      const orang = (nama: string) => psql(`
        do $$ declare v_p uuid; v_inst uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.institutions (name, slug, is_synthetic, is_active)
          values (${lit(`Sekolah L1F2 ${nama}`)}, ${lit(`sekolah-l1f2-${nama}`)}, true, true) returning id into v_inst;
          update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(nama)} || g), 1, 3)) x) q
                                                      where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
           where id = v_inst;
          insert into public.persons (display_name) values (${lit(`Orang L1F2 ${nama}`)}) returning id into v_p;
          perform public.issue_institutional_id(v_p, v_inst);
        end $$;
        select id from public.persons where display_name = ${lit(`Orang L1F2 ${nama}`)};`).split("\n").pop()!;
      const ditangguhkan = orang(`t${tag}`), ditutup = orang(`c${tag}`), biasa = orang(`b${tag}`);
      sebagaiSys(`select public.tangguhkan_akun(${lit(ditangguhkan)}, 'ADMINISTRATIVE', 'uji L1-F2: ditangguhkan sebelum punya akun')`);
      psql(`insert into public.person_suspensions (person_id, category, started_by) values (${lit(ditutup)}, 'CLOSED_AT_REQUEST', ${lit(ditutup)})`);
      const surel = (n: string) => `l1f2-${n}-${tag}@local.invalid`;
      const satu = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "EMAIL", person_id: ditangguhkan, email: surel("t") } });
      const pembanding = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "EMAIL", person_id: biasa, email: surel("b") } });
      const dua = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: ditutup } });
      await new Promise((r) => setTimeout(r, 1500));
      const kirimT = await sinkCari(surel("t")), kirimB = await sinkCari(surel("b"));
      c.expect(satu.status === 200 && satu.status === pembanding.status && kunciJson(satu.body) === kunciJson(pembanding.body),
        `the suspended person's EMAIL account answered ${satu.status} {${kunciJson(satu.body)}}, an ordinary one ${pembanding.status} {${kunciJson(pembanding.body)}} (expected the same)`);
      c.expect(dua.status === 200 && kunciJson(dua.body) === "card,mode,ok,pin", `the closed person's class card answered ${dua.status} {${kunciJson(dua.body)}}`);
      c.expect(kirimT.length === 0 && kirimB.length === 0, `messages sent: to the suspended person ${kirimT.length}, to the ordinary one ${kirimB.length} (expected none: no creation path sends)`);
      c.expect(kunciDari(ditangguhkan) === "locked" && kunciDari(ditutup) === "locked" && kunciDari(biasa) === "open",
        `the accounts read: suspended ${kunciDari(ditangguhkan)}, closed ${kunciDari(ditutup)}, ordinary ${kunciDari(biasa)} (expected locked, locked, open)`);
      return c.verdict("an EMAIL account for a suspended person and a class card for a closed person answered as ordinary creations, nothing was sent to anyone (the mail sink, as for an ordinary creation), and both accounts were created locked while the ordinary one was not");
    },
  },
];
