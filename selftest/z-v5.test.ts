/**
 * Z · V5 (R-24, PETE-22; Sharon VERIFY-58): A TRANSFER WHOSE SOURCE ENROLMENT HAS CLOSED IS REFUSED BY NAME.
 *
 *   Z-V5-01  On the seeded human-evaluation school, rolled back: peraga-siswa's enrolment is closed (as a rollover
 *            closes it) under an AUTHORIZED transfer to another school's year. Her school's administrator runs
 *            transfer_execute: refused PR040 with DETAIL TRANSFER_SOURCE_CLOSED, never the raw «a closed enrollment is
 *            immutable»; the transfer stays AUTHORIZED and no enrolment is written at the receiving school. The action's
 *            contract maps the code to galat.transfer_source_closed, in ID and EN. Red on 305 (the raw error).
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const SISWA = "peraga-siswa@evaluasi.pintar.test";
const ADMIN = "peraga-admin@evaluasi.pintar.test";

export const zV5Tests: SelfTest[] = [
  {
    id: "Z-V5-01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      let hasil = "";
      hasil = psql(`begin;
create temp table t_e on commit drop as select e.* from public.enrollments e join public.accounts a on a.person_id = e.person_id join auth.users u on u.id = a.auth_user_id
 where u.email = ${lit(SISWA)} and e.status = 'ACTIVE' limit 1;
create temp table t_ke on commit drop as select i.id as inst, (select p.id from public.academic_periods p where p.institution_id = i.id order by p.starts_on desc limit 1) as periode
  from public.institutions i where i.id <> (select institution_id from t_e) and exists (select 1 from public.academic_periods p where p.institution_id = i.id) order by i.id limit 1;
create temp table t_t on commit drop as select gen_random_uuid() as id;
grant select on t_e, t_ke, t_t to authenticated;
set local session_replication_role = replica;
update public.enrollments set status = 'ENDED', end_reason = 'COMPLETED', valid_to = now() where id = (select id from t_e);
insert into public.transfers (id, person_id, from_enrollment_id, from_institution_id, to_institution_id, to_academic_period_id, status, record_classes, consent, reason, created_at)
select (select id from t_t), e.person_id, e.id, e.institution_id, k.inst, k.periode, 'AUTHORIZED', '{}', '{}'::jsonb, 'Z-V5-01: a transfer across a rollover', now() from t_e e, t_ke k;
set local session_replication_role = origin;
create function pg_temp.jalankan() returns text language plpgsql as $f$
declare v_detail text;
begin
  perform public.transfer_execute((select id from t_t));
  return 'dijalankan';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return 'ditolak|' || sqlstate || '|' || coalesce(nullif(v_detail, ''), '-') || '|' || sqlerrm;
end $f$;
select selftest.as_user(${lit(ADMIN)});
select 'hasil|' || pg_temp.jalankan();
reset role;
select 'status|' || (select status::text from public.transfers where id = (select id from t_t))
  || '|' || (select count(*) from public.enrollments e where e.person_id = (select person_id from t_e) and e.institution_id = (select inst from t_ke));
rollback;`);
      const baris = Object.fromEntries(hasil.split("\n").filter((b) => /^(hasil|status)\|/.test(b)).map((b) => [b.slice(0, b.indexOf("|")), b.slice(b.indexOf("|") + 1)]));
      c.expect(/^ditolak\|PR040\|TRANSFER_SOURCE_CLOSED\|/.test(baris.hasil ?? ""), `transfer_execute on a closed source enrolment: ${baris.hasil} (refused PR040, TRANSFER_SOURCE_CLOSED)`);
      c.expect(!/closed enrollment is immutable/.test(baris.hasil ?? ""), `the raw guard error reaches the caller: ${baris.hasil}`);
      c.expect(baris.status === "AUTHORIZED|0", `after the refusal: ${baris.status} (the transfer still AUTHORIZED, no enrolment at the receiving school)`);
      // the action's contract: the code, its key, its words
      const { kodeAntarSekolah, kunciKode } = await import("../src/lib/galat-kontrak");
      const { t } = await import("../src/lib/hle");
      const kode = kodeAntarSekolah({ code: "PR040", details: "TRANSFER_SOURCE_CLOSED", message: "x" } as never);
      const k = kode ? kunciKode(kode) : "";
      c.expect(kode === "TRANSFER_SOURCE_CLOSED" && k === "galat.transfer_source_closed", `the action maps the refusal to ${kode} → ${k}`);
      const id = k ? t(k as never, "staff", { locale: "id" }) : "", en = k ? t(k as never, "staff", { locale: "en" }) : "";
      // Daisy's final words (Bob 11:02Z), exactly: the next step names the sending school
      c.expect(id === "Pendaftaran murid ini di sekolah asalnya sudah ditutup setelah permintaan pindah ini dibuat, misalnya karena kenaikan kelas. Perpindahan tidak dijalankan, dan tidak ada yang berubah. Sekolah asal perlu mengajukan perpindahan baru dari pendaftaran murid yang berlaku sekarang.", `its ID words are not Daisy's: «${id}»`);
      c.expect(en === "This student's enrolment at the sending school closed after this transfer was requested, for example at the year-end promotion. The transfer was not carried out, and nothing changed. The sending school needs to request a new transfer from the student's current enrolment.", `its EN words are not Daisy's: «${en}»`);
      return c.verdict(`an AUTHORIZED transfer from an enrolment closed since (rolled back): the school's administrator is refused ${baris.hasil?.split("|").slice(0, 3).join("|")}, never the raw guard error; the transfer stays AUTHORIZED and nothing is written at the receiving school; the action maps it to ${k} («${id.slice(0, 60)}…»)`);
    },
  },
];
