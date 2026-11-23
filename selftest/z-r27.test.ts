/**
 * Z · R-27(b) (Sharon; the shared fixture selftest/fixtures/z/pintar-id-normalisasi.json, used by S-11 too): A
 * REOPENING REQUEST FINDS THE PINTAR ID HOWEVER IT WAS TYPED, AND ONLY THEN.
 *
 *   Z-R27-01  On the seeded world, rolled back: peraga-siswa's PINTAR ID is set to the fixture's account (A14CD7ST)
 *             and her account is closed at her request. For each of the fixture's cases, minta_buka_kembali (as the
 *             server calls it) is given the case's input. A REOPEN request is recorded for her exactly when the case
 *             says «cocok» (the card's grouping, a hyphen, lower case, I or L for 1), and never for a near miss, a
 *             wrong length, a letter outside the alphabet, an email containing the ID, a username or nothing.
 *             pintar_id_canonical gives the case's «kanonik» for every case. The answer is the same for every input
 *             that passes the message check. Red on 306: only the ID as printed is found.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";
type Kasus = { masukan: string; kanonik: string | null; cocok: boolean; arti: string };

export const zR27Tests: SelfTest[] = [
  {
    id: "Z-R27-01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const fx = JSON.parse(readFileSync(join(repoRoot, "selftest", "fixtures", "z", "pintar-id-normalisasi.json"), "utf8")) as { akun: string; kasus: Kasus[] };
      const kasus = fx.kasus.map((k, i) => `(${i}, ${lit(k.masukan)})`).join(", ");
      const hasil = psql(`begin;
create temp table t_p on commit drop as select a.person_id as id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(SISWA)} limit 1;
set local session_replication_role = replica;
update public.persons set pintar_id = 'ZZZZZZZZ' where pintar_id = ${lit(fx.akun)} and id <> (select id from t_p);
update public.persons set pintar_id = ${lit(fx.akun)} where id = (select id from t_p);
delete from public.account_requests where person_id = (select id from t_p) and kind = 'REOPEN';
insert into public.person_suspensions (person_id, category, started_by) select id, 'CLOSED_AT_REQUEST', id from t_p;
set local session_replication_role = origin;
create function pg_temp.coba(p text) returns text language plpgsql as $f$
declare v jsonb; n int;
begin
  v := public.minta_buka_kembali(p, 'Z-R27-01: saya ingin akun saya dibuka kembali');
  select count(*) into n from public.account_requests where person_id = (select id from t_p) and kind = 'REOPEN';
  delete from public.account_requests where person_id = (select id from t_p) and kind = 'REOPEN';
  return v::text || '|' || n || '|' || coalesce(public.pintar_id_canonical(p), '-');
exception when others then return 'galat ' || sqlstate || ' ' || sqlerrm || '|-|-';
end $f$;
select 'kasus|' || i || '|' || pg_temp.coba(m) from (values ${kasus}) v(i, m) order by i;
rollback;`);
      const baris = new Map(hasil.split("\n").filter((b) => b.startsWith("kasus|")).map((b) => { const [, i, jawab, n, kan] = b.split("|"); return [Number(i), { jawab, n: Number(n), kan }]; }));
      const ringkas: string[] = [];
      fx.kasus.forEach((k, i) => {
        const r = baris.get(i);
        c.expect(!!r, `case «${k.masukan}» (${k.arti}): no row`);
        if (!r) return;
        c.expect((r.n === 1) === k.cocok && r.n <= 1, `«${k.masukan}» (${k.arti}): ${r.n} request(s) recorded (${k.cocok ? "one" : "none"} expected)`);
        c.expect((r.kan === "-" ? null : r.kan) === k.kanonik, `«${k.masukan}»: pintar_id_canonical ${r.kan} (expected ${k.kanonik ?? "null"})`);
        const jawabHarus = k.masukan.trim() === "" ? '{"ok": false, "kode": "ACCOUNT_NOTE_REQUIRED"}' : '{"ok": true}';
        c.expect(r.jawab === jawabHarus, `«${k.masukan}»: the answer ${r.jawab} (expected ${jawabHarus}, the same whether or not it matched)`);
        ringkas.push(`${k.masukan || "∅"}→${r.n}`);
      });
      return c.verdict(`the fixture's ${fx.kasus.length} cases against a closed account whose PINTAR ID is ${fx.akun} (rolled back): ${ringkas.join(", ")}; each recorded exactly when «cocok», pintar_id_canonical agrees with «kanonik», and the answer never says which`);
    },
  },
];
