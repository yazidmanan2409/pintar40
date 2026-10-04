/**
 * BOB-28 (Gate 5): A FORGOTTEN PASSWORD RECOVERED BY PINTAR ID + PIN, AND A LOST CLASS CARD RE-ISSUED
 * (IDENTITY-4.0 §3-§5, C5-C7, C12, D-056, D-057(b), D-088(e)).
 *
 *   BOB28-K01  the decision (src/lib/pemulihan.ts), tools replaced, and the words: malformed input counts nothing;
 *              the address is counted first; the ladder's answers; a match gives the grant and signs nobody in; the
 *              owner and the platform admin are told after the answer, at a threshold or a recovery only; the ID is
 *              made canonical as the database does; the security email in both voices carries nothing secret
 *   BOB28-S01  the source: the doors, the public ID page that reads nothing, the QR's link, the re-issue and the
 *              admin reset asking the caller's authority before the service key, the notices to both recipients
 *   BOB28-D01  the database (supabase/migrations/20261116100000), rolled back: the ladder through recovery_by_pin
 *              (unknown IDs alike, notices only for a person's ID), suspension and its two restores with a new PIN,
 *              the per-address scope, a notice never silenced by an address limit, the card re-issue (authority,
 *              grant, the auth.users guard, the audit row), the platform admin's lookup and record, no client reach
 *   BOB28-A01  PIN recovery against the running app and Auth: an unknown ID answers as a real one; the right PIN
 *              gives the grant without signing in; the new password ends the other sessions; the owner and the
 *              security recipient are emailed; the /id/ page is the same page for a person's ID and nobody's
 *   BOB28-A02  the ladder end to end: locked, locked longer, suspended (a session elsewhere untouched), email
 *              recovery during the suspension restores it, the old PIN stays dead, a new PIN on Akun saya works;
 *              then the platform admin's audited reset forces another new PIN
 *   BOB28-A03  a lost class card re-issued by the platform admin's screen route: a new number and PIN, the old card
 *              signs nobody in and its session ends, the same person and account, the reason audited
 */
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, kodeDari, lit, Peramban, psql, sandiBagas, sinkTunggu } from "./bob26.test";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const PENERIMA_KEAMANAN = "admin_gt@pintarselalu.com";

const DB_SKRIP = `
begin;
create temp table b28 (v jsonb) on commit drop;
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return case when v_state = 'PR040' then v_detail else v_state end;
end $f$;
create function pg_temp.coba(p_id text, p_pin text) returns text language sql as $f$
  select r.outcome || '/' || coalesce(r.wait_seconds::text, '-') || '/' || coalesce(r.notice, '-') || '/' || (r.owner_auth_user is not null)::text
    from public.recovery_by_pin(p_id, p_pin, encode(extensions.gen_random_bytes(32), 'hex')) r
$f$;
create function pg_temp.lewat(p_id text) returns void language sql as $f$
  update public.recovery_ladder set locked_until = clock_timestamp() - interval '1 second' where typed_id = p_id
$f$;
do $b28$
declare v jsonb := '{}'::jsonb; v_staf uuid; v_uid uuid; v_id text; v_wajib uuid; v_wajib_id text;
        v_tiada text := 'ZZZZ' || 'ZZZ9'; v_dulu bigint; t text := repeat('c', 64); h text;
        v_kartu public.accounts; v_inst uuid; v_admin uuid; v_baru text := '8' || lpad((floor(random() * 1e9))::bigint::text, 9, '0');
begin
  perform selftest.as_owner();
  select coalesce(max(id), 0) into v_dulu from public.audit_log;

  -- ── a staff member with a known PIN, and one whose set-up is not finished
  select a.person_id, a.auth_user_id, p.pintar_id into v_staf, v_uid, v_id
    from public.accounts a join auth.users u on u.id = a.auth_user_id join public.persons p on p.id = a.person_id
   where u.email = 'alpha-admin@synthetic.pintar.test';
  update public.person_pins set pin_hash = extensions.crypt('2817', extensions.gen_salt('bf', 4)), reset_required = false where person_id = v_staf;
  delete from public.recovery_ladder where typed_id in (v_id, v_tiada);
  -- an account whose set-up is not finished: the dean's, made so inside the rolled-back transaction
  select a.person_id, p.pintar_id into v_wajib, v_wajib_id from public.accounts a join auth.users u on u.id = a.auth_user_id
    join public.persons p on p.id = a.person_id where u.email = 'alpha-dean@synthetic.pintar.test';
  update public.account_setup s set state = 'REQUIRED', completed_at = null
    from public.accounts a where a.id = s.account_id and a.person_id = v_wajib;
  if v_wajib is not null then
    insert into public.person_pins (person_id, pin_hash) values (v_wajib, extensions.crypt('5193', extensions.gen_salt('bf', 4)))
    on conflict (person_id) do update set pin_hash = excluded.pin_hash, reset_required = false;
  end if;

  v := v || jsonb_build_object(
    'ada', v_id is not null and v_wajib is not null,
    'rusak', pg_temp.coba('A14CD7S', '2817'),
    'tiada', jsonb_build_array(pg_temp.coba(v_tiada, '2817'), pg_temp.coba(v_tiada, '2817'), pg_temp.coba(v_tiada, '2817'), pg_temp.coba(v_tiada, '2817')),
    'salah', jsonb_build_array(pg_temp.coba(lower(v_id), '1357'), pg_temp.coba(v_id, '1357')),
    'benar', pg_temp.coba(substr(v_id, 1, 4) || '-' || substr(v_id, 5), '2817'),
    'wajib', pg_temp.coba(v_wajib_id, '5193'));
  -- read in a statement of its own: a statement's subqueries do not see what its own calls wrote
  v := v || jsonb_build_object(
    'audit_benar', (select count(*) from public.audit_log where id > v_dulu and action = 'identity.recovery_verified'
                                                       and target_id = v_uid::text and summary ->> 'via' = 'PIN'),
    'izin_pin', (select count(*) from public.password_recovery_grants where auth_user_id = v_uid and via = 'PIN'),
    'tangga_nol', (select level = 0 and failures = 0 from public.recovery_ladder where typed_id = v_id));

  -- ── the ladder: 1 hour, 4 hours, suspended; a notice only when a threshold is crossed
  v := v || jsonb_build_object('naik1', jsonb_build_array(pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '2817')));
  perform pg_temp.lewat(v_id);
  v := v || jsonb_build_object('naik2', jsonb_build_array(pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357')));
  perform pg_temp.lewat(v_id);
  v := v || jsonb_build_object('naik3', jsonb_build_array(pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '1357'), pg_temp.coba(v_id, '2817')));
  v := v || jsonb_build_object('pin_mati', (select reset_required from public.person_pins where person_id = v_staf));

  -- ── restore (1): an EMAIL recovery's password write while suspended
  perform public.recovery_grant_issue(v_uid, t, 'EMAIL');
  perform public.recovery_grant_permit(t);
  update auth.users set encrypted_password = extensions.crypt('Pulih-2026-x', extensions.gen_salt('bf', 4)) where id = v_uid;
  v := v || jsonb_build_object(
    'pulih_tangga', (select level || '/' || coalesce(suspended_at::text, '-') from public.recovery_ladder where typed_id = v_id),
    'pulih_pin_lama', pg_temp.coba(v_id, '2817'),
    'pulih_audit', (select count(*) from public.audit_log where id > v_dulu and action = 'identity.recovery_restored'
                                                        and target_id = v_staf::text and summary ->> 'via' = 'EMAIL_RECOVERY'));
  -- a PIN grant's write restores nothing (the ladder was never suspended)
  update public.recovery_ladder set level = 0, failures = 0, locked_until = null where typed_id = v_id;

  -- ── restore (2): the platform admin's lookup and reset; nobody else's
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  v := v || jsonb_build_object(
    'guru_status', pg_temp.kode(format('select * from public.recovery_status(%L)', v_id)),
    'guru_catatan', pg_temp.kode('select * from public.security_event_list(5)'),
    'guru_reset', pg_temp.kode(format('select public.admin_reset_recovery(%L, %L)', v_staf, 'uji')));
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  v := v || jsonb_build_object(
    'status', (select to_jsonb(r) from public.recovery_status(lower(v_id)) r),
    'status_tiada', (select count(*) from public.recovery_status(v_tiada)),
    'catatan_id', (select count(*) from public.security_event_list(500) e where e.pintar_id = v_id),
    'catatan_tiada', (select count(*) from public.security_event_list(500) e where e.pintar_id = v_tiada));
  perform selftest.as_owner();

  -- ── a security notice is never silenced by other email to the same address
  h := encode(extensions.digest('notice-' || v_dulu, 'sha256'), 'hex');
  insert into public.email_send_log (kind, recipient_hash, outcome, settled_at)
  select 'KODE_ULANG', h, 'SENT', now() from generate_series(1, 6);
  v := v || jsonb_build_object(
    'kode_ditolak', public.email_send_reserve('KODE_AKTIVASI', h) ->> 'limit_scope',
    'notice_boleh', (public.email_send_reserve('PEMBERITAHUAN_KEAMANAN', h) ->> 'allowed')::boolean,
    'notice_lagi', (public.email_send_reserve('PEMBERITAHUAN_KEAMANAN', h) ->> 'allowed')::boolean,
    'notice_kira', public.email_send_would_allow('PEMBERITAHUAN_KEAMANAN', h));

  -- ── the card re-issue
  select a.* into v_kartu from public.accounts a where a.kind = 'CLASSROOM_CARD' order by a.card_number limit 1;
  select ra.institution_id into v_inst from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
    join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' limit 1;
  -- the fixture schools reserve no namespace; this one does, inside the rolled-back transaction, to number the learner
  update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5('b28' || g), 1, 3)) x) q
                                               where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
   where id = v_inst and namespace is null;
  if not exists (select 1 from public.institutional_identities where person_id = v_kartu.person_id and institution_id = v_inst) then
    perform public.issue_institutional_id(v_kartu.person_id, v_inst);
  end if;
  -- a person of the same school with no class card (the dean, numbered by the school here)
  if not exists (select 1 from public.institutional_identities where person_id = v_wajib and institution_id = v_inst) then
    perform public.issue_institutional_id(v_wajib, v_inst);
  end if;
  select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test';
  perform selftest.as_user('alpha-guru@synthetic.pintar.test');
  v := v || jsonb_build_object(
    'guru_daftar', (select count(*) from public.card_holders() c where c.person_id = v_kartu.person_id),
    'guru_ulang', pg_temp.kode(format('select * from public.authorize_card_reissue(%L, %L, %L)', v_kartu.person_id, 'HILANG', v_baru)));
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  v := v || jsonb_build_object(
    'daftar', (select to_jsonb(c) - 'person_id' - 'institution_id' from public.card_holders() c where c.person_id = v_kartu.person_id),
    'alasan_salah', pg_temp.kode(format('select * from public.authorize_card_reissue(%L, %L, %L)', v_kartu.person_id, 'DICURI', v_baru)),
    'bukan_kartu', pg_temp.kode(format('select * from public.authorize_card_reissue(%L, %L, %L)', v_wajib, 'HILANG', v_baru)),
    'ulang_untuk', (select r.auth_user_id = v_kartu.auth_user_id from public.authorize_card_reissue(v_kartu.person_id, 'RUSAK', v_baru) r));
  -- a number with a live re-issue grant is taken (asked before the person's own unfinished grant is replaced)
  v := v || jsonb_build_object('nomor_terpakai', pg_temp.kode(format('select * from public.authorize_card_reissue(%L, %L, %L)', v_kartu.person_id, 'HILANG', v_baru)));
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'permit', (select purpose from public.password_write_permits where auth_user_id = v_kartu.auth_user_id),
    'alamat_lain', pg_temp.kode(format('update auth.users set email = %L where id = %L', 'card-1234567890@elsewhere.invalid', v_kartu.auth_user_id)));
  update auth.users set email = 'card-' || v_baru || '@' || split_part(email, '@', 2),
                        encrypted_password = extensions.crypt('derived', extensions.gen_salt('bf', 4))
   where id = v_kartu.auth_user_id;
  v := v || jsonb_build_object(
    'kartu_sekarang', (select card_number = v_baru and person_id = v_kartu.person_id and id = v_kartu.id from public.accounts where auth_user_id = v_kartu.auth_user_id),
    'kartu_audit', (select jsonb_build_object('reason', summary ->> 'reason', 'from', summary #>> '{from,card_number}', 'to', summary #>> '{to,card_number}',
                                              'by', (summary ->> 'authorized_by')::uuid = v_admin, 'role', summary ->> 'actor_role')
                      from public.audit_log where id > v_dulu and action = 'account.card_reissued' and target_id = v_kartu.person_id::text),
    'kartu_lagi', pg_temp.kode(format('update auth.users set email = %L where id = %L',
                                      'card-' || v_baru || '1@' || split_part((select email from auth.users where id = v_kartu.auth_user_id), '@', 2), v_kartu.auth_user_id)),
    'email_bebas', pg_temp.kode(format('update auth.users set email = %L where id = %L', 'alpha-admin-x@synthetic.pintar.test', v_uid)));

  -- ── nobody else reaches any of it
  v := v || jsonb_build_object(
    'anon_pin', has_function_privilege('anon', 'public.recovery_by_pin(text,text,text)', 'execute'),
    'auth_pin', has_function_privilege('authenticated', 'public.recovery_by_pin(text,text,text)', 'execute'),
    'service_pin', has_function_privilege('service_role', 'public.recovery_by_pin(text,text,text)', 'execute'),
    'anon_daftar', has_function_privilege('anon', 'public.card_holders()', 'execute'),
    'baca_ulang', has_table_privilege('authenticated', 'public.card_reissues', 'select') or has_table_privilege('service_role', 'public.card_reissues', 'select'),
    'lingkup', pg_temp.kode(format('select public.identity_attempt(%L, %L)', 'RECOVERY_PIN', repeat('d', 64))));
  insert into b28 values (v);
end $b28$;
select v::text from b28;
rollback;
`;

/** Each attempt from its own address, so the per-address count is not what is being tested. */
async function cobaPin(asal: string, id: string, pin: string, b = new Peramban(asal, ipUji())) {
  return { b, r: await b.jsonDari("/masuk/lupa/pin", { form: { id, pin } }) };
}

const tanpaId = (html: string, id: string) => html.split(id).join("@").split(`${id.slice(0, 4)} ${id.slice(4)}`).join("@");
const utama = (html: string) => /<main[\s\S]*<\/main>/.exec(html)?.[0] ?? "";

/** Gate 3's activation, as a person does it, with a known PIN. */
async function aktifkan(c: Checks, asal: string, email: string, username: string, pin: string): Promise<string | null> {
  const w = new Peramban(asal, ipUji());
  await w.jsonDari("/aktifkan/kode", { form: { email } });
  const kode = kodeDari((await sinkTunggu(email, 1))[0]);
  const masuk = await w.jsonDari("/aktifkan/periksa", { form: { email, kode } });
  const sandi = sandiBagas();
  const langkah = [
    await w.jsonDari("/api/aktifkan/username", { form: { username } }),
    await w.jsonDari("/api/aktifkan/password", { form: { password: sandi } }),
    await w.jsonDari("/api/aktifkan/pin", { form: { pin } }),
    await w.jsonDari("/api/aktifkan/nama", { form: {} }),
    await w.jsonDari("/api/aktifkan/selesai", { form: {} }),
  ];
  const ok = c.expect(masuk.status === 200 && langkah.every((l) => l.status === 200),
    `the person could not be activated first (${JSON.stringify([masuk.status, ...langkah.map((l) => l.status)])})`);
  await sinkTunggu(email, 2);
  return ok ? sandi : null;
}

const pintarIdDari = (email: string) =>
  psql(`select p.pintar_id from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`);

export const bob28AppTests: SelfTest[] = [
  {
    id: "BOB28-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `bob28-dewi-${tag}@local.invalid`;
      await daftar(asal, "Dewi Anggraini", email);
      const lama = await aktifkan(c, asal, email, `dewi.${tag}`, "2817");
      if (!lama) return c.verdict("");
      const id = pintarIdDari(email);
      const tiada = `${randomBytes(8).toString("hex").slice(0, 7).toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g, "Z")}Z`;
      c.expect(/^[0-9A-HJKMNP-TV-Z]{8}$/.test(id) && psql(`select count(*) from public.persons where pintar_id = ${lit(tiada)}`) === "0",
        `the IDs to compare are not one person's and nobody's (${id}, ${tiada})`);

      // two other devices, signed in
      const x = new Peramban(asal, ipUji());
      const y = new Peramban(asal, ipUji());
      for (const b of [x, y]) {
        const m = await b.jsonDari("/masuk/password", { form: { identitas: email, password: lama, lanjut: "/mengajar" } });
        c.expect(m.status === 200, `another device could not sign in first (${m.status})`);
      }

      // 1. nobody's ID and a person's ID answer alike
      const salahAda = await cobaPin(asal, id.toLowerCase(), "1357");
      const salahTiada = await cobaPin(asal, tiada, "1357");
      c.expect(salahAda.r.status === 400 && JSON.stringify(salahAda.r.body) === JSON.stringify(salahTiada.r.body)
        && (salahAda.r.body as { code?: string }).code === "PIN_TIDAK_COCOK",
        `a wrong PIN for a person's ID ${JSON.stringify(salahAda.r.body)} and nobody's ${JSON.stringify(salahTiada.r.body)}`);
      const rusak = await cobaPin(asal, "ABC", "2817");
      c.expect(rusak.r.status === 400 && (rusak.r.body as { code?: string }).code === "ID_TIDAK_SAH", `a malformed ID: ${JSON.stringify(rusak.r.body)}`);

      // 2. the right PIN (typed spaced, from the QR's page) gives the grant and signs nobody in
      const z = new Peramban(asal, ipUji());
      const benar = await z.jsonDari("/masuk/lupa/pin", { form: { id: `${id.slice(0, 4)} ${id.slice(4)}`, pin: "2817" } });
      c.expect(benar.status === 200 && z.kue.has("pintar_pulih"), `the right PIN gave no grant (${benar.status} ${JSON.stringify(benar.body)})`);
      const tanpaSesi = await z.kirim("/mengajar");
      c.expect(tanpaSesi.status >= 300 && tanpaSesi.status < 400 && new URL(tanpaSesi.headers.get("location") ?? "", asal).pathname === "/masuk",
        `a matched PIN signed the browser in (/mengajar answered ${tanpaSesi.status})`);

      // 3. the new password, through Gate 4's door: every other session ends
      const baru = sandiBagas();
      const ganti = await z.jsonDari("/masuk/lupa/password", { form: { password: baru } });
      c.expect(ganti.status === 200 && (await z.kirim("/mengajar")).status === 200, `the new password was not set or did not sign in (${ganti.status})`);
      for (const [nama, b] of [["the first", x], ["the second", y]] as const) {
        const r = await b.kirim("/mengajar");
        c.expect(r.status >= 300 && r.status < 400, `${nama} other device is still signed in after the PIN recovery (${r.status})`);
      }

      // 4. the owner and the security recipient are told; nothing secret is in either
      const milik = await sinkTunggu(email, 4);
      const ke = milik.find((p) => /dipakai untuk memulihkan/i.test(p.Subject));
      c.expect(!!ke && ke.Text.includes(`${id.slice(0, 4)} ${id.slice(4)}`) && !/2817/.test(ke.Text) && milik.some((p) => /sudah diganti/i.test(p.Subject)),
        `the owner's mail: ${milik.map((p) => p.Subject).join(" | ")}`);
      const admin = await sinkTunggu(PENERIMA_KEAMANAN, 1, 12000);
      const keAdmin = admin.find((p) => p.Subject.includes(`${id.slice(0, 4)} ${id.slice(4)}`) && /berhasil/i.test(p.Subject));
      c.expect(!!keAdmin && !keAdmin.Text.includes(email) && !/2817/.test(keAdmin.Text),
        `the security recipient's mail: ${admin.map((p) => p.Subject).join(" | ")}`);
      c.expect(!admin.some((p) => p.Subject.includes(`${tiada.slice(0, 4)} ${tiada.slice(4)}`)), "a notice went out for an ID nobody holds");

      // 5. the card's page is the same page for a person's ID and nobody's, and names nobody
      const [hA, hT] = await Promise.all([fetch(`${asal}/id/${id}`), fetch(`${asal}/id/${tiada}`)]);
      const [tA, tT] = [utama(await hA.text()), utama(await hT.text())];
      c.expect(hA.status === 200 && hT.status === 200 && tA.length > 0 && tanpaId(tA, id) === tanpaId(tT, tiada),
        `/id/ for a person's ID (${hA.status}) and nobody's (${hT.status}) are not the same page`);
      c.expect(!tA.includes("Dewi") && tA.includes(`/masuk/lupa?id=${id}`), "the ID page names its holder or does not lead to recovery with the PIN");
      const hR = await fetch(`${asal}/id/bukan-id`, { redirect: "manual" });
      c.expect(hR.status === 404, `a malformed ID's page answered ${hR.status}, expected the not-found page`);
      return c.verdict(
        "nobody's ID and a person's answered a wrong PIN alike; the right PIN gave the grant without signing in; the new password ended the "
        + "other sessions and signed this browser in; the owner and the security recipient were emailed without the PIN or the address, "
        + "and nobody was emailed about an ID nobody holds; the card's page is the same for both IDs, names nobody and leads to the PIN recovery");
    },
  },
  {
    id: "BOB28-A02",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `bob28-rudi-${tag}@local.invalid`;
      await daftar(asal, "Rudi Hartono", email);
      const lama = await aktifkan(c, asal, email, `rudi.${tag}`, "2817");
      if (!lama) return c.verdict("");
      const id = pintarIdDari(email);
      const lewat = () => psql(`update public.recovery_ladder set locked_until = clock_timestamp() - interval '1 second' where typed_id = ${lit(id)}`);
      const tetap = new Peramban(asal, ipUji());
      c.expect((await tetap.jsonDari("/masuk/password", { form: { identitas: email, password: lama, lanjut: "/mengajar" } })).status === 200, "a device could not sign in first");

      // 1. three wrong: locked an hour; three more: four hours; three more: suspended
      const jawaban: string[] = [];
      for (let tingkat = 0; tingkat < 3; tingkat++) {
        for (let i = 0; i < 3; i++) {
          const { r } = await cobaPin(asal, id, "1357");
          jawaban.push(`${r.status}:${(r.body as { code?: string; tunggu?: number }).code}:${(r.body as { tunggu?: number }).tunggu ?? "-"}`);
        }
        if (tingkat < 2) {
          const { r } = await cobaPin(asal, id, "2817");
          jawaban.push(`benar:${r.status}:${(r.body as { code?: string }).code}`);
          lewat();
        }
      }
      c.expect(JSON.stringify(jawaban) === JSON.stringify([
        "400:PIN_TIDAK_COCOK:-", "400:PIN_TIDAK_COCOK:-", "423:PIN_TERKUNCI:3600", "benar:423:PIN_TERKUNCI",
        "400:PIN_TIDAK_COCOK:-", "400:PIN_TIDAK_COCOK:-", "423:PIN_TERKUNCI:14400", "benar:423:PIN_TERKUNCI",
        "400:PIN_TIDAK_COCOK:-", "400:PIN_TIDAK_COCOK:-", "423:PIN_DITANGGUHKAN:-",
      ]), `the ladder answered ${JSON.stringify(jawaban)}`);
      const ditangguhkan = await cobaPin(asal, id, "2817");
      c.expect((ditangguhkan.r.body as { code?: string }).code === "PIN_DITANGGUHKAN", `the right PIN while suspended: ${JSON.stringify(ditangguhkan.r.body)}`);
      c.expect((await tetap.kirim("/mengajar")).status === 200, "a lock or the suspension ended a session elsewhere");
      const kabar = await sinkTunggu(email, 5);
      c.expect(kabar.filter((p) => /ditutup sementara/i.test(p.Subject)).length === 2 && kabar.filter((p) => /dihentikan/i.test(p.Subject)).length === 1,
        `the owner was told: ${kabar.map((p) => p.Subject).join(" | ")}; expected two locks and one suspension`);

      // 2. email recovery works during the suspension, restores it, and the old PIN stays dead
      const z = new Peramban(asal, ipUji());
      await z.jsonDari("/masuk/lupa/kode", { form: { nama: email } });
      const kodeP = kodeDari((await sinkTunggu(email, 6)).find((p) => /password baru/i.test(p.Subject)));
      const periksa = await z.jsonDari("/masuk/lupa/periksa", { form: { nama: email, kode: kodeP } });
      const sandi = sandiBagas();
      const ganti = await z.jsonDari("/masuk/lupa/password", { form: { password: sandi } });
      c.expect(periksa.status === 200 && ganti.status === 200, `email recovery during the suspension (${periksa.status}, ${ganti.status})`);
      c.expect(psql(`select level from public.recovery_ladder where typed_id = ${lit(id)}`) === "0", "the email recovery did not restore PIN recovery");
      const lamaMati = await cobaPin(asal, id, "2817");
      c.expect((lamaMati.r.body as { code?: string }).code === "PIN_TIDAK_COCOK", `the old PIN after the restore: ${JSON.stringify(lamaMati.r.body)}`);

      // 3. a new PIN on Akun saya, and it recovers
      const akun = await z.kirim("/akun");
      const pinBaru = await z.jsonDari("/api/akun/pin", { form: { pin: "6042" } });
      const pinUlang = await z.jsonDari("/api/akun/pin", { form: { pin: "2817" } });
      c.expect(akun.status === 200 && pinBaru.status === 200 && pinUlang.status === 409,
        `Akun saya ${akun.status}, the new PIN ${pinBaru.status}, a second one ${pinUlang.status} (${JSON.stringify(pinUlang.body)})`);
      const pulih = await cobaPin(asal, id, "6042");
      c.expect(pulih.r.status === 200, `the new PIN did not recover (${JSON.stringify(pulih.r.body)})`);

      // 4. the platform admin's audited reset forces another new PIN
      const sys = new Peramban(asal, ipUji());
      c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200, "the platform admin could not sign in");
      const tanpaAlasan = await sys.jsonDari("/api/keamanan/pemulihan", { json: { id, alasan: "  " } });
      const reset = await sys.jsonDari("/api/keamanan/pemulihan", { json: { id, alasan: "Pemilik kehilangan PIN (uji)" } });
      const s = (reset.body as { status?: { pinBaruDitunggu?: boolean; keadaan?: string } }).status;
      c.expect(tanpaAlasan.status === 400 && reset.status === 200 && s?.pinBaruDitunggu === true && s?.keadaan === "NORMAL",
        `the reset: without a reason ${tanpaAlasan.status}, with one ${reset.status} ${JSON.stringify(reset.body)}`);
      c.expect((await cobaPin(asal, id, "6042")).r.status === 400, "the PIN still recovers after the platform admin's reset");
      // the person themself, signed in again by the email recovery (which ended every other session)
      const bukanAdmin = await z.jsonDari("/api/keamanan/pemulihan", { json: { id, alasan: "x" } });
      c.expect(bukanAdmin.status === 403, `a staff member who is not the platform admin reset recovery (${bukanAdmin.status})`);
      const audit = psql(`select count(*) from public.audit_log a join public.persons p on p.id::text = a.target_id
                           where p.pintar_id = ${lit(id)} and a.action = 'identity.recovery_restored'
                             and a.summary ->> 'via' = 'ADMIN_RESET' and a.summary ->> 'reason' = 'Pemilik kehilangan PIN (uji)'`);
      c.expect(audit === "1", `the reset is audited ${audit} time(s) with its reason; expected 1`);
      // activation's two, three thresholds, the recovery code, the password changed, the PIN recovery, the reset: nine
      c.expect((await sinkTunggu(email, 9, 12000)).some((p) => /diatur ulang/i.test(p.Subject)), "the owner was not told of the reset");
      return c.verdict(
        "three wrong PINs locked PIN recovery an hour, three more four hours, three more suspended it, and a right PIN did nothing meanwhile; a "
        + "session elsewhere stayed; the owner was told at each threshold; email recovery during the suspension restored it and the old PIN stayed "
        + "dead; a new PIN set on Akun saya recovered; the platform admin's reset needed a reason, was audited with it, forced another new PIN, "
        + "was refused to anyone else and told the owner");
    },
  },
  {
    id: "BOB28-A03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const nama = `Murid Kartu ${tag}`;
      // a learner of a synthetic school of its own (with a namespace, as a real one reserves), provisioned as the intake does
      const murid = psql(`
        do $$ declare v_p uuid; v_inst uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.institutions (name, slug, is_synthetic, is_active)
          values (${lit(`Sekolah Kartu ${tag}`)}, ${lit(`sekolah-kartu-${tag}`)}, true, true) returning id into v_inst;
          update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                      where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
           where id = v_inst;
          insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
          perform public.issue_institutional_id(v_p, v_inst);
        end $$;
        select id from public.persons where display_name = ${lit(nama)};`).split("\n").pop()!;
      const sys = new Peramban(asal, ipUji());
      c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200, "the platform admin could not sign in");
      const buat = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
      const k1 = buat.body as { card?: string; pin?: string };
      if (!c.expect(buat.status === 200 && /^\d{10}$/.test(k1.card ?? ""), `the first card could not be made (${buat.status})`)) return c.verdict("");
      const akunSebelum = psql(`select id || '/' || auth_user_id from public.accounts where person_id = ${lit(murid)}`);

      const keMasuk = (r: Response) => r.status >= 300 && r.status < 400 && new URL(r.headers.get("location") ?? "", asal).pathname === "/masuk";
      const lamaB = new Peramban(asal, ipUji());
      const m1 = await lamaB.jsonDari("/masuk/kartu", { form: { kartu: k1.card!, pin: k1.pin! } });
      c.expect(m1.status === 200 && !keMasuk(await lamaB.kirim("/belajar")), `the first card could not sign in (${m1.status})`);

      // the screen's list, then the re-issue
      const halaman = await sys.kirim("/aktivasi");
      c.expect(halaman.status === 200 && (await halaman.text()).includes(nama), "Aktivasi does not list the learner under «Kartu hilang atau rusak»");
      const tanpaAlasan = await sys.jsonDari("/api/akun/kartu-kelas", { json: { person_id: murid, alasan: "DICURI" } });
      const ulang = await sys.jsonDari("/api/akun/kartu-kelas", { json: { person_id: murid, alasan: "HILANG" } });
      const k2 = (ulang.body as { kartu?: { card?: string; pin?: string } }).kartu ?? {};
      c.expect(tanpaAlasan.status === 400 && ulang.status === 200 && /^\d{10}$/.test(k2.card ?? "") && /^\d{6}$/.test(k2.pin ?? "") && k2.card !== k1.card,
        `the re-issue: a wrong reason ${tanpaAlasan.status}, the re-issue ${ulang.status} ${JSON.stringify(ulang.body).slice(0, 120)}`);

      // the old card is dead and its session ended; the new one works, as the same person and account
      const habis = await lamaB.kirim("/belajar");
      c.expect(keMasuk(habis), `the old card's session survived the re-issue (${habis.status})`);
      const mLama = await new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: k1.card!, pin: k1.pin! } });
      const baruB = new Peramban(asal, ipUji());
      const mBaru = await baruB.jsonDari("/masuk/kartu", { form: { kartu: k2.card!, pin: k2.pin! } });
      c.expect(mLama.status !== 200 && mBaru.status === 200 && !keMasuk(await baruB.kirim("/belajar")),
        `the old card answered ${mLama.status}, the new one ${mBaru.status}; expected refused and signed in`);
      c.expect(psql(`select id || '/' || auth_user_id from public.accounts where person_id = ${lit(murid)}`) === akunSebelum
        && psql(`select card_number from public.accounts where person_id = ${lit(murid)}`) === k2.card,
        "the re-issue made a new account or did not move the card number");
      const audit = psql(`select summary ->> 'reason' || '/' || (summary #>> '{from,card_number}') || '/' || (summary #>> '{to,card_number}')
                            from public.audit_log where action = 'account.card_reissued' and target_id = ${lit(murid)}`);
      c.expect(audit === `HILANG/${k1.card}/${k2.card}`, `the re-issue is audited as «${audit}»`);
      const guru = new Peramban(asal, ipUji());
      c.expect((await guru.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } })).status === 200,
        "the teacher could not sign in");
      const bukanAdmin = await guru.jsonDari("/api/akun/kartu-kelas", { json: { person_id: murid, alasan: "RUSAK" } });
      c.expect(bukanAdmin.status === 403, `a teacher re-issued a card (${bukanAdmin.status})`);
      return c.verdict(
        "a learner's card re-issued with a reason: a new ten-digit number and six-digit PIN; the old card's session ended and the old card signs "
        + "nobody in; the new card signs in as the same person, on the same account, with the card number moved; the re-issue is audited with "
        + "its reason and both numbers; a wrong reason and a teacher are refused");
    },
  },
];

export const bob28Tests: SelfTest[] = [
  {
    id: "BOB28-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      process.env.CARD_PEPPER ??= "selftest-card-pepper-bob28-32plus-chars";
      const p = await import("../src/lib/pemulihan");
      const { kanonikPintarId } = await import("../src/lib/aktivasi-kontrak");

      // the ID made canonical as pintar_id_canonical makes it (BOB-24's own cases)
      c.expect(kanonikPintarId(" a14c-d7st ") === "A14CD7ST" && kanonikPintarId("0I1L0OO0") === "01110000"
        && kanonikPintarId("A14CD7SU") === null && kanonikPintarId("A14CD7S") === null && kanonikPintarId(42) === null,
        "the PINTAR ID is not made canonical as the database makes it");

      type Hasil = Awaited<ReturnType<typeof p.periksaPinPemulihan>>;
      const coba = async (o: { origin?: boolean; id?: string; pin?: string; alamat?: string | null; tunggu?: number;
                               hasil?: Partial<import("../src/lib/pemulihan").HasilCobaPin>; lempar?: boolean }) => {
        const jejak: string[] = []; const nanti: Array<() => Promise<void>> = []; let disimpan: string | null = null;
        let kunciDicatat = ""; let hashDitanya = "";
        const h: Hasil = await p.periksaPinPemulihan({ origin: o.origin ?? true, id: o.id ?? "a14c d7st", pin: o.pin ?? "2817", alamat: o.alamat === undefined ? "198.51.100.7" : o.alamat }, {
          catat: async (k) => { jejak.push("catat"); kunciDicatat = k; return o.tunggu ?? 0; },
          selesaikan: async (_k, hasil) => { jejak.push(`selesai:${hasil}`); },
          izinBaru: () => ({ token: "TOKEN", hash: createHash("sha256").update("TOKEN").digest("hex") }),
          coba: async (id, pin, hash) => {
            jejak.push(`coba:${id}:${pin}`); hashDitanya = hash;
            if (o.lempar) throw new Error("down");
            return { outcome: "WRONG", tunggu: null, notice: null, pemilik: null, ...o.hasil };
          },
          simpanIzin: async (token) => { jejak.push("izin"); disimpan = token; },
          kabari: async (peristiwa, id, pemilik) => { jejak.push(`kabari:${peristiwa}:${id}:${pemilik}`); },
          nanti: (k) => { jejak.push("nanti"); nanti.push(k); },
          catatGalat: () => {},
        });
        const sebelumKabar = [...jejak];
        for (const k of nanti) await k();
        return { h, jejak, sebelumKabar, disimpan, kunciDicatat, hashDitanya };
      };
      const kode = (h: Hasil) => (h.body as { code?: string }).code;

      const asal = await coba({ origin: false });
      c.expect(kode(asal.h) === "PERMINTAAN_DITOLAK" && asal.jejak.length === 0, `another origin: ${JSON.stringify(asal)}`);
      for (const [id, pin, harap] of [["ABC", "2817", "ID_TIDAK_SAH"], ["A14CD7SU", "2817", "ID_TIDAK_SAH"], ["A14CD7ST", "12", "PIN_KOSONG"], ["A14CD7ST", "28a7", "PIN_KOSONG"]]) {
        const r = await coba({ id, pin });
        c.expect(kode(r.h) === harap && r.h.status === 400 && r.jejak.length === 0, `«${id}» with «${pin}»: ${JSON.stringify(r)}; expected ${harap}, nothing counted`);
      }
      const tunggu = await coba({ tunggu: 120 });
      c.expect(JSON.stringify(tunggu.h.body) === JSON.stringify({ ok: false, code: "PIN_TUNGGU", tunggu: 120 }) && tunggu.h.status === 429
        && !tunggu.jejak.some((j) => j.startsWith("coba")), `the address counted out: ${JSON.stringify(tunggu)}`);
      const sama = await coba({ alamat: "198.51.100.7", id: "zzzz zzz9" }); const lain = await coba({ alamat: "203.0.113.9" }); const tanpa = await coba({ alamat: null });
      c.expect(sama.kunciDicatat === (await coba({})).kunciDicatat && sama.kunciDicatat !== lain.kunciDicatat && /^[0-9a-f]{64}$/.test(tanpa.kunciDicatat),
        "the per-address key is not one keyed hash per address, whatever the ID");
      const spasi = await coba({ id: " a14c-d7st ", pin: " 2 8 1 7 " });
      c.expect(spasi.jejak.includes("coba:A14CD7ST:2817"), `the ID and PIN as typed were not made canonical: ${JSON.stringify(spasi.jejak)}`);

      const salah = await coba({}); const salahTiada = await coba({ id: "ZZZZ ZZZ9" });
      c.expect(JSON.stringify(salah.h) === JSON.stringify(salahTiada.h) && kode(salah.h) === "PIN_TIDAK_COCOK" && !salah.jejak.some((j) => j.startsWith("kabari") || j === "izin"),
        `a wrong PIN: ${JSON.stringify([salah, salahTiada])}`);
      const benar = await coba({ hasil: { outcome: "OK", notice: "PULIH_PIN", pemilik: "u-1" } });
      c.expect(benar.h.status === 200 && JSON.stringify(benar.h.body) === JSON.stringify({ ok: true }) && benar.disimpan === "TOKEN"
        && benar.hashDitanya === createHash("sha256").update("TOKEN").digest("hex") && benar.jejak.includes("selesai:OK")
        && !benar.sebelumKabar.some((j) => j.startsWith("kabari")) && benar.jejak.includes("kabari:PULIH_PIN:A14CD7ST:u-1"),
        `a match: ${JSON.stringify(benar)}; expected the grant by its hash, the address cleared, the owner told after the answer`);
      const kunci = await coba({ hasil: { outcome: "LOCKED", tunggu: 3600, notice: "TERKUNCI", pemilik: "u-1" } });
      c.expect(kunci.h.status === 423 && JSON.stringify(kunci.h.body) === JSON.stringify({ ok: false, code: "PIN_TERKUNCI", tunggu: 3600 })
        && kunci.jejak.includes("kabari:TERKUNCI:A14CD7ST:u-1") && kunci.disimpan === null, `the third wrong: ${JSON.stringify(kunci)}`);
      const masihKunci = await coba({ hasil: { outcome: "LOCKED", tunggu: 1200 } });
      c.expect(kode(masihKunci.h) === "PIN_TERKUNCI" && !masihKunci.jejak.some((j) => j.startsWith("kabari")), "a try while locked told someone");
      const henti = await coba({ hasil: { outcome: "SUSPENDED", notice: "DITANGGUHKAN", pemilik: null } });
      c.expect(henti.h.status === 423 && kode(henti.h) === "PIN_DITANGGUHKAN" && henti.jejak.includes("kabari:DITANGGUHKAN:A14CD7ST:null"),
        `suspended: ${JSON.stringify(henti)}`);
      const belum = await coba({ hasil: { outcome: "NOT_ELIGIBLE" } });
      c.expect(belum.h.status === 409 && kode(belum.h) === "AKUN_BELUM_AKTIF" && belum.disimpan === null, `an account not finished: ${JSON.stringify(belum)}`);
      const putus = await coba({ lempar: true });
      c.expect(putus.h.status === 503 && kode(putus.h) === "LAYANAN_TIDAK_TERSEDIA" && /^[A-Z0-9]{6}$/.test(String((putus.h.body as { ref?: string }).ref)),
        `the database unreachable: ${JSON.stringify(putus.h)}`);

      // the security email: both voices, every event, the ID 4+4, nothing secret, the owner's way to email recovery
      const { templatKeamanan } = await import("../src/components/email/keamanan");
      for (const peristiwa of ["TERKUNCI", "DITANGGUHKAN", "PULIH_PIN", "DIATUR_ULANG"] as const) {
        for (const untuk of ["PEMILIK", "ADMIN"] as const) {
          const e = templatKeamanan({ peristiwa, untuk, pintarId: "A14CD7ST", waktu: "2026-10-04T08:00:00Z", tautanLupa: "https://uji.invalid/masuk/lupa" },
            { asal: "https://uji.invalid", staging: true });
          const semua = `${e.subjek}\n${e.teks}\n${e.html}`;
          c.expect(semua.includes("A14C D7ST") && !/—|undefined|null/.test(`${e.subjek}${e.teks}`) && (untuk === "PEMILIK") === e.html.includes("https://uji.invalid/masuk/lupa"),
            `${peristiwa} to ${untuk}: «${e.subjek}» lacks the ID, has an empty line, or the way to recover is ${untuk === "PEMILIK" ? "missing" : "given to the admin"}`);
        }
      }
      // the words: every refusal said in both languages, the same for every ID, with the wait where there is one
      const { t } = await import("../src/lib/hle");
      const { kalimat } = await import("../src/components/aktifkan/jawaban");
      for (const locale of ["id", "en"] as const) {
        const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
        for (const k of ["ID_TIDAK_SAH", "PIN_KOSONG", "PIN_TIDAK_COCOK", "PIN_TERKUNCI", "PIN_DITANGGUHKAN", "PIN_TUNGGU", "AKUN_BELUM_AKTIF"]) {
          const kal = kalimat({ kode: k as never, tunggu: k === "PIN_TERKUNCI" ? 3600 : null, ref: null, alasan: [], kurang: [] }, s, locale);
          c.expect(kal.length > 10 && !kal.includes("—"), `${locale} ${k} has no sentence: «${kal}»`);
        }
      }
      return c.verdict(
        "malformed IDs and PINs and other origins count nothing; the address is counted first under one keyed hash; a wrong PIN answers alike "
        + "for every ID; a match gives the grant by its hash, clears the address and tells the owner after the answer; a lock and a suspension "
        + "say so and tell at the threshold only; an unfinished account activates; the ID is canonical as the database makes it; the security "
        + "email carries the ID in both voices and the way to recover only to the owner; every refusal has words in both languages");
    },
  },
  {
    id: "BOB28-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => tanpaKomentar(readFileSync(join(repoRoot, ...p), "utf8"));
      const pin = baca("src", "app", "api", "masuk", "lupa", "pin", "route.ts");
      c.expect(/"RECOVERY_PIN"/.test(pin) && /rpc\("recovery_by_pin"/.test(pin) && /simpanIzin\(/.test(pin) && !/supabaseServer\(|signIn/.test(pin),
        "the PIN door does not count per address, ask recovery_by_pin and give the grant, or it touches a session");
      const proxy = baca("src", "proxy.ts");
      c.expect(/"\/masuk\/lupa\/pin"/.test(proxy) && /PUBLIC_PREFIXES = \[[^\]]*"\/id\/"/.test(proxy), "the PIN door or the ID page is not public in the proxy");
      c.expect(/source: "\/masuk\/lupa\/pin", destination: "\/api\/masuk\/lupa\/pin"/.test(baca("next.config.ts")), "/masuk/lupa/pin is not rewritten to its handler");
      const idPage = baca("src", "app", "id", "[pintarId]", "page.tsx");
      c.expect(!/supabase|rpc\(|fetch\(|from "@\/lib\/supabase/.test(idPage) && /kanonikPintarId\(/.test(idPage) && /notFound\(\)/.test(idPage)
        && /href="\/masuk"/.test(idPage) && /\$\{HALAMAN_PEMULIHAN\}\?id=\$\{id\}/.test(idPage),
        "the ID page reads something, is not the same for every ID, or does not offer sign-in and the PIN recovery");
      c.expect(/tautanId: `\$\{asal\}\/id\/\$\{o\.pintar_id\}`/.test(baca("src", "app", "api", "_email", "identitas.ts")), "the card's QR does not name the public ID page");
      const ulang = baca("src", "app", "api", "akun", "kartu-kelas", "route.ts");
      c.expect(ulang.indexOf('caller.rpc("authorize_card_reissue"') > 0 && ulang.indexOf('caller.rpc("authorize_card_reissue"') < ulang.indexOf("updateUserById")
        && !/createUser|CLASSROOM_CARD/.test(ulang), "the re-issue writes before the caller's authority is asked, or creates an identity");
      const reset = baca("src", "app", "api", "keamanan", "pemulihan", "route.ts");
      c.expect(/caller\.rpc\("recovery_status"/.test(reset) && /caller\.rpc\("admin_reset_recovery"/.test(reset) && !/supabaseService\(\)\.rpc/.test(reset),
        "the platform admin's reset is not asked with the caller's own authority");
      const kabar = baca("src", "app", "api", "_email", "keamanan.ts");
      c.expect(/kirim\(PENERIMA_KEAMANAN, "ADMIN"\)/.test(kabar) && /if \(pemilik\)/.test(kabar) && /"PEMBERITAHUAN_KEAMANAN"/.test(kabar),
        "a security notice does not go to the security recipient always and to the owner when there is one");
      c.expect(/PENERIMA_KEAMANAN = "admin_gt@pintarselalu\.com"/.test(baca("src", "app", "api", "_email", "pengaturan.ts")), "the security recipient is not C7's");
      const layar = baca("src", "components", "aktifkan", "LupaPassword.tsx");
      c.expect(/kirim<"lupaPin"/.test(layar) && /idAwal/.test(layar) && /onClick=\{kePin\}/.test(layar), "«Lupa password?» has no PINTAR ID + PIN way in");
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261116100000_a_forgotten_password_is_recovered_by_pintar_id_and_pin.sql"), "utf8");
      c.expect(/'ROUTE',\s*'\/masuk\/lupa\/pin'/.test(mig) && /'ENDPOINT',\s*'\/api\/masuk\/lupa\/pin'/.test(mig) && /'ROUTE',\s*'\/id\/\[pintarId\]'/.test(mig),
        "the PIN door and the ID page are not declared in public_surface_registry");
      return c.verdict("the PIN door counts per address, asks recovery_by_pin, gives the grant and touches no session; it and the ID page are public and declared; the ID page reads nothing and offers sign-in and the PIN recovery; the QR names it; the re-issue and the reset ask the caller's authority first; a notice goes to the security recipient and the owner");
    },
  },
  {
    id: "BOB28-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", "fable01.sql"), db], { encoding: "utf8" });
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the database half could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
      if (!c.expect(v.ada === true, `the fixture lacks a staff member or an unfinished account (${JSON.stringify(v)})`)) return c.verdict("");
      c.expect(v.rusak === "MALFORMED/-/-/false", `a malformed ID: ${v.rusak}`);
      c.expect(JSON.stringify(v.tiada) === JSON.stringify(["WRONG/-/-/false", "WRONG/-/-/false", "LOCKED/3600/-/false", "LOCKED/3600/-/false"]),
        `nobody's ID: ${JSON.stringify(v.tiada)}; expected the ladder's own steps and no notice`);
      c.expect(JSON.stringify(v.salah) === JSON.stringify(["WRONG/-/-/false", "WRONG/-/-/false"]) && v.benar === "OK/-/PULIH_PIN/true"
        && v.audit_benar === 1 && v.izin_pin === 1 && v.tangga_nol === true,
        `a person's ID: ${JSON.stringify([v.salah, v.benar])}, grant ${v.izin_pin}, audited ${v.audit_benar}, ladder reset ${v.tangga_nol}`);
      c.expect(v.wajib === "NOT_ELIGIBLE/-/-/false", `the right PIN of an unfinished account: ${v.wajib}`);
      c.expect(JSON.stringify(v.naik1) === JSON.stringify(["WRONG/-/-/false", "WRONG/-/-/false", "LOCKED/3600/TERKUNCI/true", "LOCKED/3600/-/false"])
        || /^LOCKED\/3[56]\d\d\/-\/false$/.test(v.naik1?.[3] ?? ""), `level 1: ${JSON.stringify(v.naik1)}`);
      c.expect(v.naik1?.[2] === "LOCKED/3600/TERKUNCI/true" && v.naik2?.[2] === "LOCKED/14400/TERKUNCI/true"
        && v.naik3?.[2] === "SUSPENDED/-/DITANGGUHKAN/true" && v.naik3?.[3] === "SUSPENDED/-/-/false" && v.pin_mati === true,
        `the ladder: ${JSON.stringify([v.naik1, v.naik2, v.naik3])}, the PIN dead ${v.pin_mati}`);
      c.expect(/^0\/-$/.test(v.pulih_tangga) && v.pulih_pin_lama === "WRONG/-/-/false" && v.pulih_audit === 1,
        `restore (1): ladder ${v.pulih_tangga}, the old PIN ${v.pulih_pin_lama}, audited ${v.pulih_audit}`);
      c.expect(v.guru_status === "42501" && v.guru_catatan === "42501" && v.guru_reset === "42501",
        `a teacher: status ${v.guru_status}, record ${v.guru_catatan}, reset ${v.guru_reset}; expected 42501 each`);
      c.expect(v.status?.state === "NORMAL" && v.status?.has_email_account === true && v.status_tiada === 0 && v.catatan_id > 0 && v.catatan_tiada > 0,
        `the platform admin: ${JSON.stringify([v.status, v.status_tiada, v.catatan_id, v.catatan_tiada])}`);
      c.expect(v.kode_ditolak === "ADDRESS" && v.notice_boleh === true && v.notice_lagi === true && v.notice_kira === true,
        `after six sends to an address: a code ${v.kode_ditolak}, a notice ${v.notice_boleh} then ${v.notice_lagi}, asked ${v.notice_kira}`);
      c.expect(v.guru_daftar === 0 && v.guru_ulang === "42501", `a teacher sees ${v.guru_daftar} card holder(s), re-issues: ${v.guru_ulang}`);
      c.expect(v.daftar && /^\d{1,4}$/.test(v.daftar.card_last4) && !("card_number" in v.daftar), `the admin's list: ${JSON.stringify(v.daftar)}`);
      c.expect(v.alasan_salah === "REASON_INVALID" && v.bukan_kartu === "CARD_NOT_FOUND" && v.nomor_terpakai === "CARD_NUMBER_TAKEN" && v.ulang_untuk === true && v.permit === "CARD_REISSUE",
        `the re-issue's refusals and grant: ${JSON.stringify([v.alasan_salah, v.bukan_kartu, v.nomor_terpakai, v.ulang_untuk, v.permit])}`);
      c.expect(v.alamat_lain === "CARD_ADDRESS_REFUSED" && v.kartu_sekarang === true && v.kartu_lagi === "CARD_ADDRESS_REFUSED" && v.email_bebas === null,
        `the guard: another address ${v.alamat_lain}, the grant's own ${v.kartu_sekarang}, again ${v.kartu_lagi}, an email account ${v.email_bebas}`);
      c.expect(v.kartu_audit?.reason === "RUSAK" && v.kartu_audit?.by === true && v.kartu_audit?.role === "INSTITUTION_ADMIN" && v.kartu_audit?.to !== v.kartu_audit?.from,
        `the re-issue's audit row: ${JSON.stringify(v.kartu_audit)}`);
      c.expect(!v.anon_pin && !v.auth_pin && v.service_pin && !v.anon_daftar && !v.baca_ulang && v.lingkup === null,
        `privileges: ${JSON.stringify({ anon_pin: v.anon_pin, auth_pin: v.auth_pin, service_pin: v.service_pin, anon_daftar: v.anon_daftar, baca_ulang: v.baca_ulang, lingkup: v.lingkup })}`);
      return c.verdict(
        "recovery_by_pin walks the typed ID's ladder (nobody's alike, no notice), gives a PIN grant on a match (audited, ladder reset), refuses an "
        + "unfinished account; three wrong lock 1 h, then 4 h, then suspend with the PIN dead, a notice at each threshold only; an EMAIL recovery's "
        + "write restores a suspension and the old PIN stays dead; the lookup, record and reset are the platform admin's; a notice passes an address "
        + "limit; the re-issue asks the school's authority and a reason, the guard moves the card only to the grant's own address and audits who, "
        + "as what and why; no client reaches recovery or the re-issues");
    },
  },
];
