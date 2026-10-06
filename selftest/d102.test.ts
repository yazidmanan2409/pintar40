/**
 * D-102 (owner ruling, 5 Oct): AN ACTIVATION ENDS ITS OWN FIRST SESSION.
 *
 * The activation wizard runs in the session the emailed code began. Setting the first password moves the person to a
 * new session (Auth ends the old one; the route signs them straight back in), and that move now also ends PINTAR's
 * record of the old one, so a token issued before it is refused by PostgREST's pre-request instead of being served
 * for the rest of its life (the Golden School's finding, JOURNEY-LOG item 33).
 *
 *  D102-S01  the source: migration 20261123100000 ends every session of the person when the password guard takes an
 *            ACTIVATION write, through D-101's own core and with a reason of its own (PASSWORD_PERTAMA), leaves the
 *            RECOVERY and CARD_REISSUE branch and the refusal of a write without a permit as they were, and the route
 *            still signs the person back in only after Auth has set the password
 *  D102-D01  the database, rolled back: before the first password, the wizard's session (recorded, and one PINTAR has
 *            not seen yet) passes PostgREST's pre-request; a write with no permit or an expired one is refused and ends
 *            nothing; the ACTIVATION write ends both (PT401, PASSWORD_PERTAMA, Auth's rows gone, audited) and nobody
 *            else's; a session begun after it passes; a recovery still ends with KREDENSIAL_DIGANTI
 *  D102-A01  the running app (CI): the wizard's token answers PostgREST; a step before the password and a refused
 *            password leave it served; with the fix planted away the first password leaves it served (the gap); with
 *            the fix the first password moves the browser to a new session that is served while the old token and its
 *            refresh are refused, and the wizard carries on to the end and the home on the new one
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, kodeDari, lit, psql, sandiBagas, sinkTunggu } from "./bob26.test";
import { Komputer, postgrest, segarkan } from "./bob29.test";

const MIGRASI = "supabase/migrations/20261123100000_an_activation_ends_its_own_first_session.sql";
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const tanpaKomentarSql = (s: string) => s.replace(/--[^\n]*/g, "");

// ═══════════════════════════════════════════════════════════════ the database half
const DB_SKRIP = `
begin;
create temp table d102 (v jsonb) on commit drop;
create function pg_temp.jawab(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return 'E:' || case when v_state = 'PR040' and coalesce(v_detail, '') <> '' then v_detail else v_state end;
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
-- an Auth session, recorded by PINTAR (a page was opened in it) or not yet
create function pg_temp.sesi(p_email text, p_mode text) returns uuid language plpgsql as $f$
declare s uuid := gen_random_uuid();
begin
  insert into auth.sessions (id, user_id) values (s, pg_temp.uid(p_email));
  if p_mode is not null then
    insert into public.device_sessions (session_id, auth_user_id, mode) values (s, pg_temp.uid(p_email), p_mode);
  end if;
  return s;
end $f$;
create function pg_temp.sandi(p_email text) returns text language sql as $f$
  select format('update auth.users set encrypted_password = extensions.crypt(%L, extensions.gen_salt(''bf'', 4)) where id = %L',
                'Pertama-D102-' || gen_random_uuid()::text, pg_temp.uid(p_email))
$f$;
do $d$
declare
  v jsonb := '{}'::jsonb; v_dulu bigint;
  e_baru text := 'alpha-dean@synthetic.pintar.test'; e_lain text := 'alpha-guru@synthetic.pintar.test';
  e_pulih text := 'alpha-hod@synthetic.pintar.test';
  u_baru uuid; u_lain uuid; u_pulih uuid; s_wiz uuid; s_belum uuid; s_lain uuid; s_baru uuid; s_pulih uuid;
begin
  perform selftest.as_owner();
  u_baru := pg_temp.uid(e_baru); u_lain := pg_temp.uid(e_lain); u_pulih := pg_temp.uid(e_pulih);
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  -- the person is mid-activation: set-up REQUIRED, the wizard's session open (recorded), and one PINTAR has not seen
  update public.account_setup s set state = 'REQUIRED', completed_at = null, password_set_at = null
    from public.accounts a where a.id = s.account_id and a.auth_user_id = u_baru;
  s_wiz := pg_temp.sesi(e_baru, 'SHARED');
  s_belum := pg_temp.sesi(e_baru, null);
  s_lain := pg_temp.sesi(e_lain, 'PERSONAL');
  v := v || jsonb_build_object('ada', u_baru is not null and u_lain is not null and u_pulih is not null,
    'sebelum', jsonb_build_array(pg_temp.pintu(u_baru, s_wiz), pg_temp.pintu(u_baru, s_belum), pg_temp.pintu(u_lain, s_lain)));

  -- (1) a write that is not a successful activation ends nothing: no permit, then an expired one
  v := v || jsonb_build_object('tanpa_izin', pg_temp.jawab(pg_temp.sandi(e_baru)));
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (u_baru, 'ACTIVATION', clock_timestamp() - interval '1 second');
  v := v || jsonb_build_object('izin_lewat', pg_temp.jawab(pg_temp.sandi(e_baru)));
  delete from public.password_write_permits where auth_user_id = u_baru;
  v := v || jsonb_build_object(
    'gagal_sesudah', jsonb_build_array(pg_temp.pintu(u_baru, s_wiz), pg_temp.pintu(u_baru, s_belum)),
    'gagal_auth', (select count(*) from auth.sessions where user_id = u_baru),
    'gagal_terakhir', (select count(*) from public.device_sessions where auth_user_id = u_baru and ended_at is not null));

  -- (2) the first password, as the activation route writes it: its permit, then the hash
  perform public.password_write_permit(u_baru, 'ACTIVATION');
  v := v || jsonb_build_object('tulis', pg_temp.jawab(pg_temp.sandi(e_baru)));
  v := v || jsonb_build_object(
    'sesudah', jsonb_build_array(pg_temp.pintu(u_baru, s_wiz), pg_temp.pintu(u_baru, s_belum)),
    'rekaman', (select jsonb_agg(coalesce(d.ended_reason, '-') order by d.session_id = s_wiz desc)
                  from public.device_sessions d where d.session_id in (s_wiz, s_belum)),
    'auth', (select count(*) from auth.sessions where user_id = u_baru),
    'audit', (select count(*) from public.audit_log a where a.id > v_dulu and a.action = 'identity.session_ended'
                and a.target_id = u_baru::text and a.summary ->> 'reason' = 'PASSWORD_PERTAMA'),
    'langkah', (select s.password_set_at is not null and s.state::text = 'REQUIRED' from public.account_setup s
                  join public.accounts a on a.id = s.account_id where a.auth_user_id = u_baru),
    'lain', pg_temp.pintu(u_lain, s_lain),
    'lain_auth', (select count(*) from auth.sessions where id = s_lain));

  -- (3) the session the route signs the person into right after: served, recorded or not
  s_baru := pg_temp.sesi(e_baru, null);
  v := v || jsonb_build_object('baru', pg_temp.pintu(u_baru, s_baru));
  insert into public.device_sessions (session_id, auth_user_id, mode) values (s_baru, u_baru, 'SHARED');
  v := v || jsonb_build_object('baru_tercatat', pg_temp.pintu(u_baru, s_baru));

  -- (4) a recovery still ends its sessions as a replaced credential (D-101(3)), not as a first password
  s_pulih := pg_temp.sesi(e_pulih, 'PERSONAL');
  insert into public.password_write_permits (auth_user_id, purpose, expires_at)
  values (u_pulih, 'RECOVERY', clock_timestamp() + interval '1 minute');
  v := v || jsonb_build_object('pulih_tulis', pg_temp.jawab(pg_temp.sandi(e_pulih)));
  v := v || jsonb_build_object('pulih', pg_temp.pintu(u_pulih, s_pulih),
    'pulih_rekaman', (select ended_reason from public.device_sessions where session_id = s_pulih));

  -- (5) the guard is no client's
  v := v || jsonb_build_object('klien', has_function_privilege('authenticated', 'public.auth_password_write_guard()', 'execute'));
  insert into d102 values (v);
end $d$;
select v::text from d102;
rollback;
`;

export const d102Tests: SelfTest[] = [
  {
    id: "D102-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      let mig = "";
      try { mig = tanpaKomentarSql(baca(MIGRASI)); } catch { /* absent: the checks below say so */ }
      const fungsi = (nama: string) => {
        const i = mig.search(new RegExp(`function public\\.${nama}\\(`));
        return i < 0 ? "" : mig.slice(i, mig.indexOf("$$;", i));
      };
      const penjaga = fungsi("auth_password_write_guard");
      c.expect(/elsif v_purpose = 'ACTIVATION' then\s+perform public\.sesi_akhiri_orang\(new\.id, 'PASSWORD_PERTAMA'\);/.test(penjaga),
        "the password guard does not end the person's sessions when it takes an activation's first password");
      c.expect(/if v_purpose in \('RECOVERY', 'CARD_REISSUE'\) then\s+perform public\.sesi_akhiri_orang\(new\.id, 'KREDENSIAL_DIGANTI'\);/.test(penjaga)
        && /PASSWORD_WRITE_REFUSED/.test(penjaga) && /delete from public\.password_write_permits p/.test(penjaga)
        && /p\.expires_at > clock_timestamp\(\)/.test(penjaga),
        "the guard no longer refuses a write without a live permit, or no longer ends a replaced credential's sessions as before");
      c.expect(/revoke all on function public\.auth_password_write_guard\(\) from public/.test(mig), "the guard is not revoked from public in the same migration");
      const alasan = mig.slice(mig.indexOf("device_sessions_ended_reason_check"));
      c.expect(/'PASSWORD_PERTAMA'/.test(alasan) && ["PIN_GAGAL", "KUNCI_HABIS", "KELUAR", "KELUAR_SEMUA", "KREDENSIAL_DIGANTI"].every((r) => alasan.includes(`'${r}'`)),
        "device_sessions does not accept the first password as a reason a session ended, or lost one of its reasons");
      // the route: the move to the new session is the same step, and it happens only once Auth has set the password
      const rute = tanpaKomentar(baca("src/app/api/aktifkan/password/route.ts"));
      c.expect(/rpc\("password_write_permit", \{ p_auth_user: w\.userId, p_purpose: "ACTIVATION" \}\)/.test(rute)
        && /updateUserById\(w\.userId, \{ password \}\);\s+if \(!error\) \{[\s\S]{0,200}signInWithPassword\(\{ email: w\.email, password \}\)/.test(rute),
        "the activation route does not sign the person back in right after Auth has set the first password, and only then");
      return c.verdict("the source: migration 20261123100000 ends every session of the person when the password guard takes an activation's " +
        "first password (D-101's core, reason PASSWORD_PERTAMA), keeps the replaced credential's branch and the refusal of a write without a " +
        "live permit as they were, and is revoked from public; device_sessions accepts the new reason beside the five it had; the activation " +
        "route signs the person back in right after Auth has set the password, and only then");
    },
  },
  {
    id: "D102-D01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, process.env.SUPABASE_DB_URL!], { encoding: "utf8", maxBuffer: 1 << 24 });
      const baris = (r.stdout || "").trim().split("\n").filter((l) => l.startsWith("{"));
      if (!c.expect(r.status === 0 && baris.length > 0, `the database half could not run: ${(r.stderr || "").trim().split("\n").slice(-3).join(" | ")}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(baris.at(-1)!);
      const tolak = "PT401:SESI_BERAKHIR";
      c.expect(v.ada === true, "the fixture people are missing");
      c.expect(JSON.stringify(v.sebelum) === JSON.stringify(["LEWAT", "LEWAT", "LEWAT"]), `the sessions before anything happened: ${JSON.stringify(v.sebelum)}`);
      // (1)
      c.expect(v.tanpa_izin === "E:PASSWORD_WRITE_REFUSED" && v.izin_lewat === "E:PASSWORD_WRITE_REFUSED",
        `a write with no permit and with an expired one: ${v.tanpa_izin}, ${v.izin_lewat}`);
      c.expect(JSON.stringify(v.gagal_sesudah) === JSON.stringify(["LEWAT", "LEWAT"]) && Number(v.gagal_auth) === 2 && Number(v.gagal_terakhir) === 0,
        `a refused write ended a session: ${JSON.stringify([v.gagal_sesudah, v.gagal_auth, v.gagal_terakhir])}`);
      // (2)
      c.expect(v.tulis === "OK" && v.langkah === true, `the first password was not taken as the activation's step (${v.tulis}, ${v.langkah})`);
      c.expect(JSON.stringify(v.sesudah) === JSON.stringify([tolak, tolak]),
        `after the first password, the wizard's tokens at PostgREST's pre-request: ${JSON.stringify(v.sesudah)} (the gap: still served)`);
      c.expect(JSON.stringify(v.rekaman) === JSON.stringify(["PASSWORD_PERTAMA", "PASSWORD_PERTAMA"]) && Number(v.auth) === 0 && Number(v.audit) === 2,
        `the wizard's sessions: recorded ${JSON.stringify(v.rekaman)}, Auth rows left ${v.auth}, audited ${v.audit}`);
      c.expect(v.lain === "LEWAT" && Number(v.lain_auth) === 1, `another person's session was touched: ${v.lain}, Auth row ${v.lain_auth}`);
      // (3)
      c.expect(v.baru === "LEWAT" && v.baru_tercatat === "LEWAT", `the session begun after the first password: ${v.baru}, recorded ${v.baru_tercatat}`);
      // (4)
      c.expect(v.pulih_tulis === "OK" && v.pulih === tolak && v.pulih_rekaman === "KREDENSIAL_DIGANTI",
        `a recovery: ${v.pulih_tulis}, its old token ${v.pulih}, recorded ${v.pulih_rekaman}`);
      // (5)
      c.expect(v.klien === false, "a client can run the password guard");
      return c.verdict("the password guard against the database, rolled back: a person mid-activation had the wizard's session recorded and one " +
        "PINTAR had not seen yet, both served by PostgREST's own pre-request; a password write with no permit and with an expired one was refused " +
        "(PASSWORD_WRITE_REFUSED) and ended nothing; the activation's first password, through its own permit, was taken as the step and ended both " +
        "(PT401, recorded PASSWORD_PERTAMA, Auth's rows gone, audited twice) and nobody else's; the session begun after it is served, recorded or " +
        "not; a recovery still ends its session as a replaced credential (KREDENSIAL_DIGANTI); the guard is no client's");
    },
  },
];

// ═══════════════════════════════════════════════════════════════ the running app
/** The guard without the activation's branch, for one step; then the migration's own back. */
async function tanpaPerbaikan<T>(langkah: () => Promise<T>): Promise<T> {
  const asli = psql(`select pg_get_functiondef('public.auth_password_write_guard()'::regprocedure)`);
  const cabang = /\n\s*elsif v_purpose = 'ACTIVATION' then\n\s*perform public\.sesi_akhiri_orang\(new\.id, 'PASSWORD_PERTAMA'\);/;
  if (!cabang.test(asli)) throw new Error("the activation's branch is not there to withdraw");
  psql(asli.replace(cabang, ""));
  try {
    return await langkah();
  } finally {
    psql(asli);
  }
}

/** A person the Platform Admin registered, through «Aktifkan akun» to the wizard, in a browser of their own. */
async function keWizard(c: Checks, asal: string, nama: string, email: string) {
  await daftar(asal, nama, email);
  const w = new Komputer(asal, ipUji());
  await w.jsonDari("/aktifkan/kode", { form: { email } });
  const kode = kodeDari((await sinkTunggu(email, 1))[0]);
  const masuk = await w.jsonDari("/aktifkan/periksa", { form: { email, kode } });
  c.expect(masuk.status === 200 && !!w.sesi(), `${nama} could not reach the wizard (${masuk.status})`);
  return w;
}

const diakhiri = (idSesi: string) => psql(`select coalesce(ended_reason, 'OPEN') from public.device_sessions where session_id = ${lit(idSesi)}`) || "NOT_RECORDED";

export const d102AppTests: SelfTest[] = [
  {
    id: "D102-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      const tag = randomBytes(4).toString("hex");

      // 1. the gap, on this very stack: the activation's branch withdrawn, the wizard's token outlives the first password
      const lama = await keWizard(c, asal, "Ayu Lestari", `d102-ayu-${tag}@local.invalid`);
      await lama.jsonDari("/api/aktifkan/username", { form: { username: `ayu.${tag}` } });
      const tA = lama.sesi()?.access ?? "";
      const { tulis: tulisA, sesudah: sesudahA } = await tanpaPerbaikan(async () => {
        const tulis = await lama.jsonDari("/api/aktifkan/password", { form: { password: sandiBagas() } });
        return { tulis, sesudah: await postgrest(url, anon, tA) };
      });
      c.expect(tulisA.status === 200 && sesudahA === 200,
        `the planted control (no activation branch): the first password ${tulisA.status}, the wizard's old token ${sesudahA} after; expected 200, 200`);

      // 2. with the fix: the wizard's token is served until the first password, and only that ends it
      const w = await keWizard(c, asal, "Budi Santoso", `d102-budi-${tag}@local.invalid`);
      const awal = w.sesi()!;
      const p0 = await postgrest(url, anon, awal.access);
      const u = await w.jsonDari("/api/aktifkan/username", { form: { username: `budi.${tag}` } });
      const p1 = await postgrest(url, anon, awal.access);
      const lemah = await w.jsonDari("/api/aktifkan/password", { form: { password: "pendek" } });
      const p2 = await postgrest(url, anon, awal.access);
      const sebelum = diakhiri(awal.id);
      c.expect(p0 === 200 && u.status === 200 && p1 === 200 && lemah.status === 422 && p2 === 200 && !/PASSWORD_PERTAMA/.test(sebelum),
        `before the first password: the token ${p0}, the username ${u.status} then the token ${p1}, a refused password ${lemah.status} then the ` +
        `token ${p2}, the record ${sebelum}; expected 200, 200, 200, 422, 200 and not ended`);
      const tulis = await w.jsonDari("/api/aktifkan/password", { form: { password: sandiBagas() } });
      const baru = w.sesi();
      const lamaKini = await postgrest(url, anon, awal.access);
      const segar = await segarkan(url, anon, awal.refresh);
      const baruKini = baru ? await postgrest(url, anon, baru.access) : 0;
      c.expect(tulis.status === 200 && !!baru && baru.id !== awal.id && lamaKini === 401 && !segar.ok && baruKini === 200,
        `the first password ${tulis.status}: a new session ${!!baru && baru.id !== awal.id}, the old token ${lamaKini} and its refresh ` +
        `${segar.ok ? "accepted" : "refused"}, the new token ${baruKini}; expected 200, a new session, 401, refused, 200`);
      c.expect(diakhiri(awal.id) === "PASSWORD_PERTAMA" && Number(psql(`select count(*) from public.audit_log where action = 'identity.session_ended'
          and summary ->> 'reason' = 'PASSWORD_PERTAMA' and target_id = (select a.auth_user_id::text from public.accounts a
          join auth.users x on x.id = a.auth_user_id where x.email = ${lit(`d102-budi-${tag}@local.invalid`)})`)) >= 1,
        `the wizard's session is recorded ${diakhiri(awal.id)} and audited as ended by the first password`);

      // 3. the transition is seamless: the wizard carries on to the end on the new session, and the home follows
      const langkah = [
        await w.jsonDari("/api/aktifkan/pin", { form: { pin: "2817" } }),
        await w.jsonDari("/api/aktifkan/nama", { form: {} }),
        await w.jsonDari("/api/aktifkan/selesai", { form: {} }),
      ];
      const rumah = await w.halaman("/mengajar");
      c.expect(langkah.every((l) => l.status === 200) && (rumah.status === 200 || (rumah.status === 307 && /\/perangkat\?/.test(rumah.headers.get("location") ?? ""))),
        `after the first password the wizard went on: ${JSON.stringify(langkah.map((l) => l.status))}, the home ${rumah.status} ${rumah.headers.get("location") ?? ""}; ` +
        "expected 200 each, then the home or «Komputer siapa ini?» (Gate 6)");
      c.expect(w.sesi()?.id === baru?.id && diakhiri(baru!.id) !== "PASSWORD_PERTAMA",
        "a later step of the wizard ended the session the first password began");
      return c.verdict("on the running app: with the activation's branch planted away, the wizard's token was still served after the first " +
        "password (200, the gap); with the fix, the wizard's token was served through the username step and a refused password (no clean-up " +
        "there), and the first password moved the browser to a new session that is served (200) while the old token is refused (401) and its " +
        "refresh too, recorded and audited PASSWORD_PERTAMA; the wizard then took the PIN, the name and the finish on the new session, and the " +
        "home opened (or asked «Komputer siapa ini?», Gate 6)");
    },
  },
];
