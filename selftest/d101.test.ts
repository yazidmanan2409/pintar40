/**
 * D-101 (answers of 5 Oct): THE NEAREST SAFE AUTHORITY RECOVERS A CREDENTIAL, AND A REPLACED CREDENTIAL ENDS ITS SESSIONS.
 *
 *  D101-S01  the source: migration 20261122100000 asks one authority question for a recovery lookup and reset (the
 *            Platform Admin; or an active School Admin of a school that has the person, by BOB-21's own definition; never
 *            oneself; never a Platform Admin from a school), ends every session of the person where a credential is
 *            replaced (the password guard's RECOVERY and CARD_REISSUE writes and the assisted reset; not ACTIVATION), and
 *            lets a School Admin appoint another at the school itself only; the screens offer what the database allows
 *            (Keamanan akun's lookup and reset, «Admin sekolah» confirmed by a second press, the quiet second-admin line)
 *  D101-D01  the database, rolled back: PostgREST's own pre-request (pintar_permintaan.periksa) with a session's claims
 *            passes before a reset, a card's re-issue and a recovered password, and refuses after (PT401), as it
 *            does after an activation's first password (D-102, 20261123100000); a School Admin assists a teacher
 *            and an email learner of the school, is refused another school's person, a Platform Admin the school has, and themselves; the Platform Admin is
 *            refused only themselves; a teacher nothing; each reset audited with its authority; a second School Admin
 *            appointed at the school, never below it, at another school, to a stranger, as Platform Admin or oneself
 *  D101-A01  the running app (CI): an access token issued before a replacement makes a direct PostgREST request; with
 *            the fix planted away the old card's token is still served after its re-issue (the gap), and with it the
 *            token is refused (401) after a card's re-issue, a recovery by PIN and the Platform Admin's reset
 *  D101-A02  the running app (CI): a School Admin looks up and resets a teacher of the school through Keamanan akun
 *            (her token then refused, the reset audited as the school's), and is refused herself, another school's
 *            learner, and a teacher's lookup; Konfigurasi gives her the page and «Admin sekolah», never Admin platform
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, lit, Peramban, psql, sandiBagas } from "./bob26.test";
import { aktifkan, cobaPin, pintarIdDari } from "./bob28.test";
import { Komputer, postgrest } from "./bob29.test";
import { pilihKonteksPeramban } from "./konteks-uji";

const MIGRASI = "supabase/migrations/20261122100000_a_school_resolves_its_own_recovery.sql";
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const tanpaKomentarSql = (s: string) => s.replace(/--[^\n]*/g, "");

// ═══════════════════════════════════════════════════════════════ the database half
const DB_SKRIP = `
begin;
create temp table d101 (v jsonb) on commit drop;
-- a call's answer: its one value, or E: and the refusal's code (a PR040 or 42501 detail, else the SQLSTATE)
create function pg_temp.jawab(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text; r text;
begin
  execute p_sql into r; return coalesce(r, '-');
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return 'E:' || case when v_state in ('PR040', '42501') and coalesce(v_detail, '') <> '' then v_detail else v_state end;
end $f$;
-- PostgREST's pre-request, for a request of this person in this Auth session, as a token carries them
create function pg_temp.pintu(p_uid uuid, p_sesi uuid) returns text language plpgsql as $f$
declare v_state text; v_msg text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'session_id', p_sesi)::text, true);
  perform set_config('request.path', '/accounts', true);
  perform pintar_permintaan.periksa();
  perform set_config('request.jwt.claims', '', true);
  return 'LEWAT';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
  perform set_config('request.jwt.claims', '', true);
  return v_state || ':' || v_msg;
end $f$;
create function pg_temp.uid(p_email text) returns uuid language sql as $f$
  select a.auth_user_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = p_email
$f$;
create function pg_temp.orang(p_email text) returns uuid language sql as $f$
  select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = p_email
$f$;
create function pg_temp.idp(p_email text) returns text language sql as $f$
  select p.pintar_id from public.persons p where p.id = pg_temp.orang(p_email)
$f$;
-- an open session of this person, as a signed-in browser has one: Auth's row and PINTAR's
create function pg_temp.sesi(p_email text, p_mode text) returns uuid language plpgsql as $f$
declare s uuid := gen_random_uuid();
begin
  insert into auth.sessions (id, user_id) values (s, pg_temp.uid(p_email));
  insert into public.device_sessions (session_id, auth_user_id, mode) values (s, pg_temp.uid(p_email), p_mode);
  return s;
end $f$;
do $d$
declare
  v jsonb := '{}'::jsonb; v_dulu bigint; a_inst uuid; a_dept uuid; a_kelas uuid; b_inst uuid;
  e_adm text := 'alpha-admin@synthetic.pintar.test'; e_guru text := 'alpha-guru@synthetic.pintar.test';
  e_hod text := 'alpha-hod@synthetic.pintar.test'; e_dekan text := 'alpha-dean@synthetic.pintar.test';
  e_siswa text := 'alpha-siswa-1@synthetic.pintar.test'; e_beta text := 'beta-siswa-1@synthetic.pintar.test';
  e_sys text := 'sysadmin@synthetic.pintar.test'; e_kartu text := 'card-7001@cards.synthetic.pintar.test';
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid;
  p_guru uuid; p_adm uuid; p_hod uuid; p_dekan uuid; p_siswa uuid; p_beta uuid; p_sys uuid;
  u_guru uuid; u_hod uuid; u_dekan uuid; u_kartu uuid;
  i_guru text; i_adm text; i_siswa text; i_beta text; i_sys text;
begin
  perform selftest.as_owner();
  p_guru := pg_temp.orang(e_guru); p_adm := pg_temp.orang(e_adm); p_hod := pg_temp.orang(e_hod); p_dekan := pg_temp.orang(e_dekan);
  p_siswa := pg_temp.orang(e_siswa); p_beta := pg_temp.orang(e_beta); p_sys := pg_temp.orang(e_sys);
  u_guru := pg_temp.uid(e_guru); u_hod := pg_temp.uid(e_hod); u_dekan := pg_temp.uid(e_dekan); u_kartu := pg_temp.uid(e_kartu);
  i_guru := pg_temp.idp(e_guru); i_adm := pg_temp.idp(e_adm); i_siswa := pg_temp.idp(e_siswa); i_beta := pg_temp.idp(e_beta); i_sys := pg_temp.idp(e_sys);
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  select i.id into a_inst from public.institutions i where i.name = 'Sekolah Sintetis Alpha';
  select i.id into b_inst from public.institutions i where i.name = 'Sekolah Sintetis Beta';
  select o.id into a_dept from public.org_nodes o where o.institution_id = a_inst and o.kind = 'DEPARTMENT' order by o.id limit 1;
  select o.id into a_kelas from public.org_nodes o where o.institution_id = a_inst and o.kind = 'CLASS' order by o.name limit 1;
  v := v || jsonb_build_object('ada', a_inst is not null and b_inst is not null and a_dept is not null and a_kelas is not null
    and (select count(*) from public.org_nodes o where o.id in (a_inst, b_inst) and o.kind = 'INSTITUTION') = 2);

  -- (1) a School Admin assists a teacher and an email learner of the school; the teacher's two sessions end
  s1 := pg_temp.sesi(e_guru, 'SHARED');
  s2 := pg_temp.sesi(e_guru, 'PERSONAL');
  v := v || jsonb_build_object('guru_sebelum', pg_temp.pintu(u_guru, s1));
  perform selftest.as_user(e_adm);
  v := v || jsonb_build_object(
    'adm_lihat_guru', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_guru)),
    'adm_reset_guru', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_guru, 'Guru lupa PIN (uji D-101)')),
    'adm_lihat_siswa', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_siswa)),
    'adm_reset_siswa', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_siswa, 'Siswa lupa PIN (uji D-101)')),
    'adm_lihat_beta', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_beta)),
    'adm_reset_beta', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_beta, 'uji')),
    'adm_lihat_diri', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_adm)),
    'adm_reset_diri', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_adm, 'uji')),
    'adm_tanpa_alasan', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_hod, '  ')));
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'guru_sesudah', jsonb_build_array(pg_temp.pintu(u_guru, s1), pg_temp.pintu(u_guru, s2)),
    'guru_rekaman', (select jsonb_agg(coalesce(d.ended_reason, '-') order by d.mode) from public.device_sessions d where d.session_id in (s1, s2)),
    'guru_auth', (select count(*) from auth.sessions where user_id = u_guru),
    'guru_pin', (select reset_required from public.person_pins where person_id = p_guru),
    'guru_audit', (select jsonb_build_object('via', a.summary ->> 'via', 'alasan', a.summary ->> 'reason', 'aktor', a.actor_person_id = p_adm,
                                             'peran', a.summary ->> 'actor_role', 'sekolah', a.institution_id = a_inst)
                     from public.audit_log a where a.id > v_dulu and a.action = 'identity.recovery_restored' and a.target_id = p_guru::text
                    order by a.id desc limit 1),
    'guru_akhir', (select count(*) from public.audit_log a where a.id > v_dulu and a.action = 'identity.session_ended'
                     and a.target_id = u_guru::text and a.summary ->> 'reason' = 'KREDENSIAL_DIGANTI'));

  -- (2) the Platform Admin: never assisted by a school, even one that has them; assists anyone else, never themselves
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
  values (p_sys, 'EDUCATOR', a_kelas, a_inst, now() - interval '1 day', now() + interval '30 days');
  perform set_config('app.seed_intent', '', true);
  perform selftest.as_user(e_adm);
  v := v || jsonb_build_object(
    'adm_lihat_sys', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_sys)),
    'adm_reset_sys', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_sys, 'uji')));
  perform selftest.as_user(e_sys);
  v := v || jsonb_build_object(
    'sys_lihat_adm', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_adm)),
    'sys_reset_adm', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_adm, 'Admin sekolah lupa PIN (uji D-101)')),
    'sys_lihat_diri', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_sys)),
    'sys_reset_diri', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_sys, 'uji')));
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'sys_audit', (select jsonb_build_object('via', a.summary ->> 'via', 'peran', a.summary ->> 'actor_role', 'sekolah', a.institution_id)
                    from public.audit_log a where a.id > v_dulu and a.action = 'identity.recovery_restored' and a.target_id = p_adm::text
                   order by a.id desc limit 1));

  -- (3) a teacher holds no recovery authority
  perform selftest.as_user(e_dekan);
  v := v || jsonb_build_object(
    'dekan_lihat', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_guru)),
    'dekan_reset', pg_temp.jawab(format('select ''OK'' from (select public.admin_reset_recovery(%L, %L)) x', p_guru, 'uji')));
  perform selftest.as_owner();

  -- (4) every replacement through the password guard ends the person's sessions; so does an activation's first password,
  -- by a reason of its own (D-102, 20261123100000)
  s3 := pg_temp.sesi(e_kartu, 'CARD');
  s4 := pg_temp.sesi(e_hod, 'PERSONAL');
  s5 := pg_temp.sesi(e_dekan, 'SHARED');
  v := v || jsonb_build_object('tulis_sebelum', jsonb_build_array(pg_temp.pintu(u_kartu, s3),
    pg_temp.pintu(u_hod, s4), pg_temp.pintu(u_dekan, s5)));
  insert into public.password_write_permits (auth_user_id, purpose, expires_at) values
    (u_kartu, 'CARD_REISSUE', clock_timestamp() + interval '1 minute'),
    (u_hod, 'RECOVERY', clock_timestamp() + interval '1 minute'),
    (u_dekan, 'ACTIVATION', clock_timestamp() + interval '1 minute');
  update auth.users set encrypted_password = extensions.crypt('Ganti-D101-' || id::text, extensions.gen_salt('bf', 4))
   where id in (u_kartu, u_hod, u_dekan);
  v := v || jsonb_build_object(
    'tulis_sesudah', jsonb_build_object('kartu', pg_temp.pintu(u_kartu, s3), 'pulih', pg_temp.pintu(u_hod, s4),
                                        'aktivasi', pg_temp.pintu(u_dekan, s5)),
    'tulis_auth', jsonb_build_object('kartu', (select count(*) from auth.sessions where id = s3), 'aktivasi', (select count(*) from auth.sessions where id = s5)));

  -- (5) a School Admin appoints another at the school itself; nowhere else, nobody else, nothing more
  perform selftest.as_user(e_adm);
  v := v || jsonb_build_object(
    'angkat', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_hod, a_inst)),
    'angkat_bawah', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_guru, a_dept)),
    'angkat_beta', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_guru, b_inst)),
    'angkat_asing', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_beta, a_inst)),
    'angkat_sys', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''SYSTEM_ADMIN'', null, now() + interval ''1 year'')) x', p_guru)),
    'angkat_diri', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_adm, a_inst)));
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'angkat_audit', (select jsonb_build_object('aktor', a.actor_person_id = p_adm, 'peran', a.summary ->> 'actor_role',
                                               'oleh', ra.granted_by = p_adm, 'sekolah', a.institution_id = a_inst, 'lingkup', ra.scope_node_id = a_inst)
                       from public.audit_log a join public.role_assignments ra on ra.id::text = a.target_id
                      where a.id > v_dulu and a.action = 'role.granted' and ra.role = 'INSTITUTION_ADMIN' and ra.person_id = p_hod),
    'angkat_sisa', (select count(*) from public.role_assignments ra where ra.role in ('INSTITUTION_ADMIN', 'SYSTEM_ADMIN')
                      and ra.person_id in (p_guru, p_beta) and ra.created_at >= now()));
  -- the one appointed acts as one; a teacher appoints nobody
  perform selftest.as_user(e_hod);
  v := v || jsonb_build_object('baru_lihat', pg_temp.jawab(format('select count(*)::text from public.recovery_status(%L)', i_siswa)));
  perform selftest.as_user(e_guru);
  v := v || jsonb_build_object('guru_angkat', pg_temp.jawab(format('select ''OK'' from (select public.grant_role(%L, ''INSTITUTION_ADMIN'', %L, now() + interval ''1 year'')) x', p_dekan, a_inst)));
  perform selftest.as_owner();

  -- (6) what a client may reach, and what the registry declares
  v := v || jsonb_build_object(
    'klien', jsonb_build_object(
      'akhiri', case when to_regprocedure('public.sesi_akhiri_orang(uuid,text)') is null then null
                     else has_function_privilege('authenticated', 'public.sesi_akhiri_orang(uuid,text)', 'execute') end,
      'boleh', case when to_regprocedure('public.recovery_may_assist(uuid)') is null then null
                    else has_function_privilege('authenticated', 'public.recovery_may_assist(uuid)', 'execute') end),
    'registri', (select jsonb_object_agg(r.function_name, r.authorization_kind || ':' || coalesce(r.authorization_requirement, '-'))
                   from public.client_rpc_registry r where r.function_name in ('recovery_status', 'admin_reset_recovery')));
  insert into d101 values (v);
end $d$;
select v::text from d101;
rollback;
`;

export const d101Tests: SelfTest[] = [
  {
    id: "D101-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const mig = tanpaKomentarSql(baca(MIGRASI));
      const fungsi = (nama: string) => {
        const i = mig.search(new RegExp(`function public\\.${nama}\\(`));
        return i < 0 ? "" : mig.slice(i, mig.indexOf("$$;", i));
      };
      // the authority question: never oneself; a Platform Admin only by another; a school by BOB-21's own definition
      const boleh = fungsi("recovery_may_assist");
      const sekolah = fungsi("recovery_assist_school");
      c.expect(/p_person = v_me/.test(boleh) && /role = 'SYSTEM_ADMIN'[\s\S]{0,200}return public\.is_system_admin\(\)/.test(boleh)
        && /recovery_assist_school\(p_person\) is not null/.test(boleh),
        "recovery_may_assist does not refuse oneself, keep a Platform Admin to another Platform Admin, or ask the school");
      c.expect(/mine\.role = 'INSTITUTION_ADMIN'/.test(sekolah) && /has_scope\('INSTITUTION_ADMIN', o\.id\)/.test(sekolah)
        && /institutional_identities ii/.test(sekolah) && /ra\.role <> 'SYSTEM_ADMIN'/.test(sekolah) && /e\.status in \('PENDING', 'ACTIVE'\)/.test(sekolah),
        "recovery_assist_school is not a School Admin's school that has the person by its number, a role there or a learner there");
      // the lookup and the reset ask it; oneself is a code of its own; the reset ends the person's sessions
      const lihat = fungsi("recovery_status");
      const reset = fungsi("admin_reset_recovery");
      c.expect(/RECOVERY_SELF/.test(lihat) && /recovery_may_assist\(/.test(lihat) && !/if not public\.is_system_admin\(\) then/.test(lihat),
        "recovery_status still answers the Platform Admin only, or does not refuse oneself by its code");
      c.expect(/RECOVERY_SELF/.test(reset) && /recovery_may_assist\(p_person\)/.test(reset) && /REASON_REQUIRED/.test(reset)
        && /sesi_akhiri_orang\(a\.auth_user_id, 'KREDENSIAL_DIGANTI'\)/.test(reset),
        "admin_reset_recovery does not ask the authority question, refuse oneself, need a reason, or end the person's sessions");
      c.expect(/public\.audit_write\('identity\.recovery_restored', 'persons', p_person::text, public\.recovery_assist_school\(p_person\)/.test(fungsi("recovery_restore_core"))
        && /update public\.person_pins pp set reset_required = true where pp\.person_id = p_person;/.test(fungsi("recovery_restore_core")),
        "the restore's audit row does not name the school whose admin acted, or the restore no longer forces a new PIN");
      // the session-ending core, and the password guard calling it for a replacement only
      const akhiri = fungsi("sesi_akhiri_orang");
      c.expect(/from auth\.sessions s where s\.user_id = p_auth_user/.test(akhiri) && /sesi_akhiri_inti\(x\.session_id, p_alasan\)/.test(akhiri)
        && /delete from auth\.sessions where user_id = p_auth_user/.test(akhiri),
        "sesi_akhiri_orang does not record and end every Auth session of the person");
      const penjaga = fungsi("auth_password_write_guard");
      c.expect(/if v_purpose in \('RECOVERY', 'CARD_REISSUE'\) then\s+perform public\.sesi_akhiri_orang\(new\.id, 'KREDENSIAL_DIGANTI'\);/.test(penjaga)
        && /PASSWORD_WRITE_REFUSED/.test(penjaga),
        "the password guard does not end the sessions on a recovery or a card's re-issue (and only there)");
      c.expect(/'KREDENSIAL_DIGANTI'/.test(mig.slice(mig.indexOf("device_sessions_ended_reason_check"))),
        "device_sessions does not accept the replaced credential as a reason a session ended");
      // a second School Admin: at the school itself, by its School Admin; below it, the Platform Admin's as before
      const peran = fungsi("role_assignments_guard");
      c.expect(/elsif new\.role = 'INSTITUTION_ADMIN'\s+and not exists \(select 1 from public\.org_nodes o where o\.id = new\.scope_node_id and o\.kind = 'INSTITUTION'\) then/.test(peran)
        && /if not public\.has_scope\('INSTITUTION_ADMIN', new\.scope_node_id\) then/.test(peran)
        && /if v_actor = new\.person_id then raise exception 'self-grant is never allowed \(INV-16\)'/.test(peran)
        && /if new\.role = 'SYSTEM_ADMIN' or new\.scope_node_id is null then/.test(peran),
        "the role guard does not keep SYSTEM_ADMIN the Platform Admin's, or let a School Admin appoint at the school itself only");
      for (const f of ["recovery_may_assist", "recovery_assist_school", "sesi_akhiri_orang", "recovery_status", "admin_reset_recovery",
        "recovery_restore_core", "auth_password_write_guard", "role_assignments_guard"]) {
        c.expect(new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public`).test(mig), `${f} is not revoked from public in the same migration`);
      }
      c.expect(/'recovery_status'[\s\S]{0,40}'SCOPE'[\s\S]{0,10}'INSTITUTION_ADMIN'/.test(mig) && /'admin_reset_recovery'[\s\S]{0,40}'SCOPE'[\s\S]{0,10}'INSTITUTION_ADMIN'/.test(mig),
        "the registry does not declare the lookup and the reset as the School Admin's scope");

      // the screens: the route says «oneself» by its code; the page opens to a School Admin; the record stays the platform's
      const rute = tanpaKomentar(baca("src/app/api/keamanan/pemulihan/route.ts"));
      c.expect(/detailPr040\(error\) === "RECOVERY_SELF"/.test(rute) && /"SENDIRI"/.test(rute), "the recovery route does not answer oneself as SENDIRI");
      c.expect(/SENDIRI: 403/.test(baca("src/lib/keamanan-kontrak.ts")), "the contract has no SENDIRI");
      const halaman = tanpaKomentar(baca("src/app/konfigurasi/keamanan/page.tsx"));
      c.expect(/"INSTITUTION_ADMIN"/.test(halaman) && /security_event_list/.test(halaman) && /sistem === true \? \(/.test(halaman),
        "Keamanan akun is not open to a School Admin, or shows a School Admin the security record");
      const konf = tanpaKomentar(baca("src/app/konfigurasi/page.tsx"));
      // L3 (D-132 C7): Keamanan in «Seluruh platform» (the Platform Admin) and in a school's context (its School Admin)
      // (D-138 step 3: a place in the staff navigation is an ItemNav, a Link with its icon)
      c.expect(/\(platformIni \|\| sekolahIni\.length > 0\) \? <(?:Link|ItemNav) href="\/konfigurasi\/keamanan"/.test(konf),
        "Konfigurasi does not link a School Admin to Keamanan akun");
      // L3: «Admin sekolah» in a school's context (an evaluation persona as before); Admin platform in «Seluruh platform» alone
      c.expect(/\.\.\.\(sekolahIni\.length > 0 \|\| \(lama && isSys === true\) \? \["INSTITUTION_ADMIN"\] : \[\]\), \.\.\.\(platformIni \? \["SYSTEM_ADMIN"\] : \[\]\)/.test(konf),
        "Peran & akses does not offer «Admin sekolah» to a School Admin, or offers Admin platform to anyone but the Platform Admin");
      c.expect(/sp\.angkat/.test(konf) && /name="yakin" value="ya"/.test(konf) && /config\.angkat\.ya/.test(konf),
        "Peran & akses has no confirming step for «Admin sekolah»");
      c.expect(/jumlahAdminSekolah\(/.test(konf) && /config\.persiapan\.admin_kedua/.test(konf), "Persiapan sekolah has no quiet second-admin line");
      const aksi = tanpaKomentar(baca("src/app/konfigurasi/actions.ts"));
      c.expect(/role === "INSTITUTION_ADMIN" && str\(fd, "yakin"\) !== "ya"/.test(aksi) && /is_system_admin/.test(aksi) && /angkat/.test(aksi),
        "grantRoleAction does not ask a School Admin to confirm «Admin sekolah» before granting");
      return c.verdict("the source: migration 20261122100000 asks one authority question for the recovery lookup and reset (the Platform Admin; " +
        "an active School Admin of a school that has the person by its number, a role there or a learner there; never oneself; a Platform Admin " +
        "only by another), audits the reset with the school that acted, ends every session of the person on a recovery, a card's re-issue and an " +
        "assisted reset (not an activation), and lets a School Admin appoint another at the school itself only; every function is revoked from " +
        "public and the two declared as the School Admin's scope; the route answers oneself SENDIRI; Keamanan akun and «Admin sekolah» (confirmed " +
        "by a second press) are a School Admin's, the security record and Admin platform the Platform Admin's; Persiapan sekolah has its quiet line");
    },
  },
  {
    id: "D101-D01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, process.env.SUPABASE_DB_URL!], { encoding: "utf8", maxBuffer: 1 << 24 });
      const baris = (r.stdout || "").trim().split("\n").filter((l) => l.startsWith("{"));
      if (!c.expect(r.status === 0 && baris.length > 0, `the database half could not run: ${(r.stderr || "").trim().split("\n").slice(-3).join(" | ")}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(baris.at(-1)!);
      const tolak = "PT401:SESI_BERAKHIR";
      c.expect(v.ada === true, "the fixture schools, their places or their top nodes are missing");
      // (1)
      c.expect(v.guru_sebelum === "LEWAT", `an open session of the teacher was refused before anything happened (${v.guru_sebelum})`);
      c.expect(v.adm_lihat_guru === "1" && v.adm_reset_guru === "OK" && v.adm_lihat_siswa === "1" && v.adm_reset_siswa === "OK",
        `the School Admin assisting the school's teacher and email learner: ${JSON.stringify([v.adm_lihat_guru, v.adm_reset_guru, v.adm_lihat_siswa, v.adm_reset_siswa])}`);
      c.expect(JSON.stringify(v.guru_sesudah) === JSON.stringify([tolak, tolak]),
        `after the reset, the teacher's tokens at PostgREST's pre-request: ${JSON.stringify(v.guru_sesudah)} (the gap: a token still served)`);
      c.expect(JSON.stringify(v.guru_rekaman) === JSON.stringify(["KREDENSIAL_DIGANTI", "KREDENSIAL_DIGANTI"]) && Number(v.guru_auth) === 0 && Number(v.guru_akhir) === 2,
        `the teacher's sessions: recorded ${JSON.stringify(v.guru_rekaman)}, Auth rows left ${v.guru_auth}, audited ${v.guru_akhir}`);
      c.expect(v.guru_pin === true && v.guru_audit?.via === "ADMIN_RESET" && v.guru_audit?.alasan === "Guru lupa PIN (uji D-101)" && v.guru_audit?.aktor === true
        && v.guru_audit?.peran === "INSTITUTION_ADMIN" && v.guru_audit?.sekolah === true,
        `the reset's record: new PIN required ${v.guru_pin}; audit ${JSON.stringify(v.guru_audit)}`);
      c.expect(v.adm_lihat_beta === "0" && v.adm_reset_beta === "E:42501", `another school's learner: lookup ${v.adm_lihat_beta}, reset ${v.adm_reset_beta}`);
      c.expect(v.adm_lihat_diri === "E:RECOVERY_SELF" && v.adm_reset_diri === "E:RECOVERY_SELF", `the School Admin on herself: ${v.adm_lihat_diri}, ${v.adm_reset_diri}`);
      c.expect(v.adm_tanpa_alasan === "E:REASON_REQUIRED", `a reset without a reason: ${v.adm_tanpa_alasan}`);
      // (2)
      c.expect(v.adm_lihat_sys === "0" && v.adm_reset_sys === "E:42501", `the School Admin on a Platform Admin the school has: ${v.adm_lihat_sys}, ${v.adm_reset_sys}`);
      c.expect(v.sys_lihat_adm === "1" && v.sys_reset_adm === "OK" && v.sys_lihat_diri === "E:RECOVERY_SELF" && v.sys_reset_diri === "E:RECOVERY_SELF",
        `the Platform Admin: a School Admin ${v.sys_lihat_adm}/${v.sys_reset_adm}, herself ${v.sys_lihat_diri}/${v.sys_reset_diri}`);
      c.expect(v.sys_audit?.via === "ADMIN_RESET" && v.sys_audit?.peran === "SYSTEM_ADMIN" && v.sys_audit?.sekolah === null,
        `the Platform Admin's reset is audited ${JSON.stringify(v.sys_audit)}`);
      // (3)
      c.expect(v.dekan_lihat === "E:42501" && v.dekan_reset === "E:42501", `a dean: lookup ${v.dekan_lihat}, reset ${v.dekan_reset}`);
      // (4)
      c.expect(JSON.stringify(v.tulis_sebelum) === JSON.stringify(["LEWAT", "LEWAT", "LEWAT"]), `the three sessions before the writes: ${JSON.stringify(v.tulis_sebelum)}`);
      c.expect(v.tulis_sesudah?.kartu === tolak && v.tulis_sesudah?.pulih === tolak,
        `after a card's re-issue and a recovered password, the old tokens at the pre-request: ${JSON.stringify(v.tulis_sesudah)} (the gap: still served)`);
      // RESTATED FOR D-102 (owner ruling, 5 Oct): an activation's first password now ends the wizard's session too
      // (20261123100000), so the old token is refused and Auth's row is gone; it was "ends nothing" under D-101.
      c.expect(v.tulis_sesudah?.aktivasi === tolak && Number(v.tulis_auth?.aktivasi) === 0 && Number(v.tulis_auth?.kartu) === 0,
        `an activation's first password left its session served (D-102), or a re-issue left Auth's row: ${JSON.stringify([v.tulis_sesudah?.aktivasi, v.tulis_auth])}`);
      // (5)
      c.expect(v.angkat === "OK", `a School Admin appointing a teacher of the school at the school itself: ${v.angkat}`);
      c.expect(v.angkat_bawah === "E:P0001" && v.angkat_beta === "E:P0001" && v.angkat_asing === "E:GRANT_NO_SCHOOL_RELATIONSHIP"
        && v.angkat_sys === "E:P0001" && v.angkat_diri === "E:P0001" && v.guru_angkat === "E:P0001" && Number(v.angkat_sisa) === 0,
        `refused: below the school ${v.angkat_bawah}, another school ${v.angkat_beta}, a stranger ${v.angkat_asing}, Admin platform ${v.angkat_sys}, ` +
        `herself ${v.angkat_diri}, by a teacher ${v.guru_angkat}; roles left behind ${v.angkat_sisa}`);
      c.expect(v.angkat_audit?.aktor === true && v.angkat_audit?.peran === "INSTITUTION_ADMIN" && v.angkat_audit?.oleh === true
        && v.angkat_audit?.sekolah === true && v.angkat_audit?.lingkup === true,
        `the appointment's record: ${JSON.stringify(v.angkat_audit)}`);
      c.expect(v.baru_lihat === "1", `the School Admin just appointed could not assist a learner of the school (${v.baru_lihat})`);
      // (6)
      c.expect(v.klien?.akhiri === false && v.klien?.boleh === false, `a client reaches the internal functions: ${JSON.stringify(v.klien)}`);
      c.expect(v.registri?.recovery_status === "SCOPE:INSTITUTION_ADMIN" && v.registri?.admin_reset_recovery === "SCOPE:INSTITUTION_ADMIN",
        `the registry declares ${JSON.stringify(v.registri)}`);
      return c.verdict("migration 20261122100000 against the database, rolled back: PostgREST's own pre-request with a session's claims passed a " +
        "teacher's two sessions before her School Admin's reset and refused both after (PT401, recorded KREDENSIAL_DIGANTI, Auth's rows gone, " +
        "audited), and likewise a class card's after its re-issue and a staff member's after a recovered password, and an activation's first " +
        "password (D-102); the School Admin assisted the school's teacher and email learner (each reset audited with her, INSTITUTION_ADMIN and the " +
        "school), and was refused another school's learner, a Platform Admin the school has, herself (RECOVERY_SELF) and a reset without a reason; " +
        "the Platform Admin assisted a School Admin (audited SYSTEM_ADMIN) and was refused only herself; a dean nothing; a School Admin appointed a " +
        "teacher School Admin at the school itself (audited with her and her role) and was refused below it, at another school, for a stranger, " +
        "as Admin platform and for herself, a teacher appointed nobody, and the one appointed then assisted a learner; the internal functions are " +
        "no client's and the registry declares the lookup and the reset as the School Admin's scope");
    },
  },
];

// ═══════════════════════════════════════════════════════════════ the running app
/** A learner of a synthetic school of their own, with a class card from the Platform Admin; signed in on a browser. */
async function muridBerkartu(c: Checks, asal: string, sys: Peramban, tag: string) {
  const nama = `Murid D101 ${tag}`;
  const murid = psql(`
    do $$ declare v_p uuid; v_inst uuid; begin
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.institutions (name, slug, is_synthetic, is_active)
      values (${lit(`Sekolah D101 ${tag}`)}, ${lit(`sekolah-d101-${tag}`)}, true, true) returning id into v_inst;
      update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                  where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
       where id = v_inst;
      insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
      perform public.issue_institutional_id(v_p, v_inst);
    end $$;
    select id from public.persons where display_name = ${lit(nama)};`).split("\n").pop()!;
  const buat = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
  const k = buat.body as { card?: string; pin?: string };
  c.expect(buat.status === 200 && /^\d{10}$/.test(k.card ?? ""), `a card could not be made (${buat.status})`);
  const b = new Komputer(asal, ipUji());
  const m = await b.jsonDari("/masuk/kartu", { form: { kartu: k.card ?? "", pin: k.pin ?? "" } });
  c.expect(m.status === 200, `the card could not sign in (${m.status})`);
  return { murid, b, sesi: b.sesi() };
}

const ulangKartu = (sys: Peramban, murid: string) => sys.jsonDari("/api/akun/kartu-kelas", { json: { person_id: murid, alasan: "HILANG" } });

/** Replace the session-ending core with one that ends nothing, for one step; then put the migration's own back. */
async function tanpaPerbaikan<T>(langkah: () => Promise<T>): Promise<T> {
  const asli = psql(`select pg_get_functiondef('public.sesi_akhiri_orang(uuid,text)'::regprocedure)`);
  if (!/sesi_akhiri_inti/.test(asli)) throw new Error("the session-ending core is not there to withdraw");
  psql(`create or replace function public.sesi_akhiri_orang(p_auth_user uuid, p_alasan text) returns integer
          language sql security definer set search_path = public, pg_temp as $f$ select 0 $f$`);
  try {
    return await langkah();
  } finally {
    psql(asli);
  }
}

export const d101AppTests: SelfTest[] = [
  {
    // An access token a browser already holds, asked of PostgREST directly, before and after its credential is replaced.
    id: "D101-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      const tag = randomBytes(4).toString("hex");
      const sys = new Peramban(asal, ipUji());
      if (!c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200,
        "the Platform Admin could not sign in")) return c.verdict("");
      // L3 (D-132 C7): the platform admin's acts across schools are «Seluruh platform»'s, chosen on the chooser
      await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");

      // 1. the gap, shown on this very stack: the fix withdrawn, a re-issued card's old token is still served
      const satu = await muridBerkartu(c, asal, sys, `${tag}a`);
      const tA = satu.sesi?.access ?? "";
      const awalA = await postgrest(url, anon, tA);
      const { ulang: ulangA, sesudah: sesudahA } = await tanpaPerbaikan(async () => {
        const ulang = await ulangKartu(sys, satu.murid);
        return { ulang, sesudah: await postgrest(url, anon, tA) };
      });
      c.expect(awalA === 200 && ulangA.status === 200 && sesudahA === 200,
        `the planted control (no session-ending): the old card's token ${awalA} before, the re-issue ${ulangA.status}, the old token ${sesudahA} after; expected 200, 200, 200`);

      // 2. a card re-issued with the fix: the old token is refused at once
      const dua = await muridBerkartu(c, asal, sys, `${tag}b`);
      const tB = dua.sesi?.access ?? "";
      const awalB = await postgrest(url, anon, tB);
      const ulangB = await ulangKartu(sys, dua.murid);
      const sesudahB = await postgrest(url, anon, tB);
      c.expect(awalB === 200 && ulangB.status === 200 && sesudahB === 401,
        `a card's re-issue: the old token ${awalB} before, the re-issue ${ulangB.status}, the old token ${sesudahB} after; expected 200, 200, 401`);

      // 3. a staff member's own recovery by PINTAR ID + PIN: the token of their other browser is refused
      const email = `d101-tono-${tag}@local.invalid`;
      await daftar(asal, "Tono Wibowo", email);
      const lama = await aktifkan(c, asal, email, `tono.${tag}`, "2817");
      if (!lama) return c.verdict("");
      const id = pintarIdDari(email);
      const x = new Komputer(asal, ipUji());
      c.expect((await x.jsonDari("/masuk/password", { form: { identitas: email, password: lama, lanjut: "/mengajar" } })).status === 200, "Tono could not sign in");
      const tX = x.sesi()?.access ?? "";
      const awalX = await postgrest(url, anon, tX);
      const z = new Komputer(asal, ipUji());
      const benar = await cobaPin(asal, id, "2817", z);
      const ganti = await z.jsonDari("/masuk/lupa/password", { form: { password: sandiBagas() } });
      const sesudahX = await postgrest(url, anon, tX);
      c.expect(awalX === 200 && benar.r.status === 200 && ganti.status === 200 && sesudahX === 401,
        `a recovery by PIN: the other browser's token ${awalX} before, the PIN ${benar.r.status}, the new password ${ganti.status}, the old token ${sesudahX} after; expected 200, 200, 200, 401`);

      // 4. the Platform Admin's assisted reset: the browser that just recovered is signed out, its token refused
      const tZ = z.sesi()?.access ?? "";
      const awalZ = await postgrest(url, anon, tZ);
      const reset = await sys.jsonDari("/api/keamanan/pemulihan", { json: { id, alasan: "Pemilik kehilangan PIN (uji D-101)" } });
      const sesudahZ = await postgrest(url, anon, tZ);
      const halaman = await z.kirim("/mengajar");
      c.expect(awalZ === 200 && reset.status === 200 && sesudahZ === 401 && halaman.status >= 300 && halaman.status < 400,
        `the Platform Admin's reset: Tono's token ${awalZ} before, the reset ${reset.status}, the token ${sesudahZ} after, his page ${halaman.status}; expected 200, 200, 401, a redirect`);

      const alasan = psql(`select coalesce(string_agg(a.summary ->> 'reason', ',' order by a.id), '') from public.audit_log a
                             where a.action = 'identity.session_ended' and a.target_id in (
                               select ac.auth_user_id::text from public.accounts ac where ac.person_id in (${lit(dua.murid)}::uuid,
                                 (select p.id from public.persons p where p.pintar_id = ${lit(id)}))) and a.summary ->> 'reason' = 'KREDENSIAL_DIGANTI'`);
      c.expect(alasan.split(",").filter(Boolean).length >= 3, `the ended sessions are audited as a replaced credential: «${alasan}»`);
      return c.verdict(
        "an access token a browser already held answered a direct PostgREST request (200); with the session-ending planted away, a re-issued "
        + "card's old token was still served (200, the gap); with the fix, the old token was refused at once (401) after a card's re-issue, after "
        + "a recovery by PINTAR ID + PIN (the person's other browser), and after the Platform Admin's assisted reset (the recovering browser too, "
        + "its page sent to sign-in); each ended session is audited as a replaced credential");
    },
  },
  {
    // The School Admin's own recovery authority, through the screens' route, and its edges.
    id: "D101-A02",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      const tag = randomBytes(4).toString("hex");
      // Sekar, a School Admin of Alpha; Rina, a teacher there
      const sekarEmail = `d101-sekar-${tag}@local.invalid`, rinaEmail = `d101-rina-${tag}@local.invalid`;
      const sekarOrang = await daftar(asal, "Sekar Ayu", sekarEmail);
      psql(`do $$ begin
              perform set_config('app.seed_intent', 'synthetic', true);
              insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
              select ${lit(sekarOrang)}::uuid, 'INSTITUTION_ADMIN', i.id, i.id, now() - interval '1 day', now() + interval '365 days'
                from public.institutions i where i.name = 'Sekolah Sintetis Alpha';
            end $$;`);
      await daftar(asal, "Rina Lestari", rinaEmail);
      const sandiSekar = await aktifkan(c, asal, sekarEmail, `sekar.${tag}`, "4826");
      const sandiRina = await aktifkan(c, asal, rinaEmail, `rina.${tag}`, "5937");
      if (!sandiSekar || !sandiRina) return c.verdict("");
      const sekar = new Komputer(asal, ipUji());
      const rina = new Komputer(asal, ipUji());
      c.expect((await sekar.jsonDari("/masuk/password", { form: { identitas: sekarEmail, password: sandiSekar } })).status === 200, "Sekar could not sign in");
      c.expect((await rina.jsonDari("/masuk/password", { form: { identitas: rinaEmail, password: sandiRina, lanjut: "/mengajar" } })).status === 200, "Rina could not sign in");
      const idRina = pintarIdDari(rinaEmail), idSekar = pintarIdDari(sekarEmail), idBeta = pintarIdDari("beta-siswa-1@synthetic.pintar.test");

      // 1. a teacher looks nobody up
      const guruLihat = await rina.jsonDari(`/api/keamanan/pemulihan?id=${idSekar}`);
      c.expect(guruLihat.status === 403 && guruLihat.body?.code === "DITOLAK", `a teacher's lookup: ${guruLihat.status} ${JSON.stringify(guruLihat.body)}`);

      // 2. Sekar assists Rina: the lookup, the reset, Rina's token refused, the record names Sekar and the school
      const tRina = rina.sesi()?.access ?? "";
      const awal = await postgrest(url, anon, tRina);
      const lihat = await sekar.jsonDari(`/api/keamanan/pemulihan?id=${idRina}`);
      const reset = await sekar.jsonDari("/api/keamanan/pemulihan", { json: { id: idRina, alasan: "Rina lupa PIN (uji D-101)" } });
      const sesudah = await postgrest(url, anon, tRina);
      c.expect(lihat.status === 200 && reset.status === 200 && (reset.body as { status?: { pinBaruDitunggu?: boolean } }).status?.pinBaruDitunggu === true,
        `the School Admin's lookup ${lihat.status} ${JSON.stringify(lihat.body).slice(0, 120)} and reset ${reset.status} ${JSON.stringify(reset.body).slice(0, 120)}`);
      c.expect(awal === 200 && sesudah === 401, `Rina's token: ${awal} before the reset, ${sesudah} after; expected 200 and 401`);
      const catatan = psql(`select a.summary ->> 'via' || '/' || coalesce(a.summary ->> 'actor_role', '-') || '/' || (a.actor_person_id = ${lit(sekarOrang)}::uuid)::text
                                   || '/' || coalesce(i.name, '-')
                              from public.audit_log a left join public.institutions i on i.id = a.institution_id
                              join public.persons p on p.id::text = a.target_id
                             where a.action = 'identity.recovery_restored' and p.pintar_id = ${lit(idRina)} order by a.id desc limit 1`);
      c.expect(catatan === "ADMIN_RESET/INSTITUTION_ADMIN/true/Sekolah Sintetis Alpha", `the reset is recorded as «${catatan}»`);

      // 3. herself, and another school's learner, are not hers to assist
      const diri = await sekar.jsonDari(`/api/keamanan/pemulihan?id=${idSekar}`);
      const diriReset = await sekar.jsonDari("/api/keamanan/pemulihan", { json: { id: idSekar, alasan: "uji" } });
      c.expect(diri.status === 403 && diri.body?.code === "SENDIRI" && diriReset.status === 403 && diriReset.body?.code === "SENDIRI",
        `Sekar on herself: ${diri.status} ${JSON.stringify(diri.body)}, ${diriReset.status} ${JSON.stringify(diriReset.body)}`);
      const luar = await sekar.jsonDari(`/api/keamanan/pemulihan?id=${idBeta}`);
      const luarReset = await sekar.jsonDari("/api/keamanan/pemulihan", { json: { id: idBeta, alasan: "uji" } });
      c.expect(luar.status === 404 && luarReset.status === 404, `another school's learner: lookup ${luar.status}, reset ${luarReset.status}; expected 404 each`);

      // 4. the screens give her what the database allows, and no more. Her browser answers Gate 6's «Komputer siapa
      // ini?» first, as a person does before their first page (BOB29-A01)
      await sekar.halaman("/konfigurasi");
      const perangkat = await sekar.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      c.expect(perangkat.status === 200, `Sekar's computer could not be declared (${perangkat.status})`);
      const halaman = await sekar.halaman("/konfigurasi/keamanan");
      const html = await halaman.text();
      c.expect(halaman.status === 200 && html.includes("Keamanan akun") && !html.includes("pin-keamanan-catatan"),
        `Keamanan akun for a School Admin: ${halaman.status}; the security record shown ${html.includes("pin-keamanan-catatan")}`);
      // B1: the role list is Peran & akses's own page; the way to Keamanan akun is the shell's, on every Konfigurasi page
      const konf = await (await sekar.halaman("/konfigurasi")).text();
      const peran = await (await sekar.halaman("/konfigurasi/roles")).text();
      c.expect(konf.includes('href="/konfigurasi/keamanan"') && peran.includes('href="/konfigurasi/keamanan"') && peran.includes('value="INSTITUTION_ADMIN"') && !peran.includes('value="SYSTEM_ADMIN"'),
        "Konfigurasi does not give a School Admin Keamanan akun and «Admin sekolah», or offers Admin platform");
      return c.verdict(
        "a teacher was refused a lookup; a School Admin looked up and reset a teacher of her school through Keamanan akun's route (a new PIN "
        + "required), the teacher's token was then refused (401), and the reset is recorded with her, INSTITUTION_ADMIN and the school; she was "
        + "refused herself (SENDIRI) and another school's learner (404, as an ID nobody holds); her Konfigurasi links Keamanan akun without the "
        + "security record and offers «Admin sekolah» but never Admin platform");
    },
  },
];
