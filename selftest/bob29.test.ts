/**
 * BOB-29 (Gate 6; IDENTITY-4.0 C4, C11, §3, §7; D-085 T1, D-086(c)) — A SHARED COMPUTER LOCKS AND RESUMES WITH THE PIN.
 *
 *  K01  the decisions, run: what the proxy reads from the database's answer, where a locked session may go, what a
 *       page load is, the browser's value and the PERSONAL mark, the cookie lifetime by mode, the PIN's shape, the
 *       lock screen's answer; the screen's timings are the migration's; the copy says it in both languages.
 *  S01  the source: the proxy asks sesi_periksa and sends a locked page to «PINTAR terkunci» and a locked request a
 *       423; PostgREST's pre-request is the session check; leaving ends PINTAR's record first; the PIN route asks the
 *       database with the token's own session; the inactivity clock is on every page; no phone anywhere in it.
 *  D01  migration 20261117100000 against the database, rolled back.
 *  A01–A03 the running app, Auth and PostgREST (CI): a staff person on a shared computer, a class card, and the ends.
 *
 * Owner, 4 Oct: SD/SMP students have no phone at school; the shared computer is the normal case. Nothing here may
 * need a phone, a message or a second device.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stringFromBase64URL } from "@supabase/ssr";
import { Checks, type SelfTest } from "./lib";
import { ipUji, lit, Peramban, psql } from "./bob26.test";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import {
  adalahPrefetch, bacaJawabanBuka, bacaPenjagaan, BATAS_SESI, hashPerangkat, idSesiDariToken, jalurBebasPilih,
  jalurSaatTerkunci, mintaHalaman, navigasiHalaman, nilaiPribadi, perangkatBaru, pinSahUntuk, pribadiTersimpan,
  umurSesiMode,
} from "../src/lib/penjaga-sesi";
import { UMUR_SESI } from "../src/lib/sesi";

const MIGRASI = "supabase/migrations/20261117100000_a_shared_computer_locks_and_resumes_with_the_pin.sql";
const kepala = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null });
const token = (isi: Record<string, unknown>) =>
  `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(isi)).toString("base64url")}.tanda`;

// ═══════════════════════════════════════════════════════════════ the database half
const DB_SKRIP = `
begin;
create temp table b29 (v jsonb) on commit drop;
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return case when v_state = 'PR040' then v_detail else v_state end;
end $f$;
-- a request of this person in this Auth session, as PostgREST would make it
create function pg_temp.sebagai(p_uid uuid, p_sesi uuid) returns void language plpgsql as $f$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated', 'session_id', p_sesi)::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  set local role authenticated;
end $f$;
-- PostgREST's pre-request, for a request of this role, session and path
create function pg_temp.pintu(p_uid uuid, p_sesi uuid, p_peran text, p_jalur text) returns text language plpgsql as $f$
declare v_state text; v_msg text;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_peran, 'session_id', p_sesi)::text, true);
  perform set_config('request.path', p_jalur, true);
  perform pintar_permintaan.periksa();
  return 'LEWAT';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
  return v_state || ':' || v_msg;
end $f$;
do $b29$
declare v jsonb := '{}'::jsonb; j jsonb; t text; v_dulu bigint;
        u_staf uuid; p_staf uuid; u_lain uuid; u_kartu uuid; u_persona uuid;
        s1 uuid := gen_random_uuid(); s2 uuid := gen_random_uuid(); s3 uuid := gen_random_uuid(); s4 uuid := gen_random_uuid();
        s5 uuid := gen_random_uuid(); k1 uuid := gen_random_uuid(); l1 uuid := gen_random_uuid(); p1 uuid := gen_random_uuid();
        alat text := repeat('a', 64); alat_lain text := repeat('b', 64); rahasia text;
begin
  perform selftest.as_owner();
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  select a.auth_user_id, a.person_id into u_staf, p_staf from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-admin@synthetic.pintar.test';
  select a.auth_user_id into u_lain from public.accounts a join auth.users u on u.id = a.auth_user_id
   where u.email = 'alpha-guru@synthetic.pintar.test';
  -- card 7001, whose Auth password is the seed's own derivation (supabase/seed/synthetic.sql, the synthetic pepper)
  select a.auth_user_id into u_kartu from public.accounts a where a.kind = 'CLASSROOM_CARD' and a.card_number = '7001';
  rahasia := encode(extensions.digest('synthetic-card-pepper-fable01-32plus|7001|2468', 'sha256'), 'hex');
  select a.auth_user_id into u_persona from public.accounts a join public.evaluation_personas e on e.person_id = a.person_id limit 1;
  v := v || jsonb_build_object('ada', u_staf is not null and u_lain is not null and u_kartu is not null and u_persona is not null);
  -- this transaction's own world: no session left by another test, so every count below is this test's
  delete from public.device_sessions;
  delete from auth.sessions where user_id in (u_staf, u_lain, u_kartu, u_persona);
  insert into auth.sessions (id, user_id) values (s1, u_staf), (s2, u_staf), (s3, u_staf), (s4, u_staf), (s5, u_staf),
                                                 (k1, u_kartu), (l1, u_lain);
  update public.person_pins set pin_hash = extensions.crypt('2817', extensions.gen_salt('bf', 4)), reset_required = false
   where person_id = p_staf;
  v := v || jsonb_build_object('pre_request', exists (select 1 from pg_db_role_setting d join pg_roles r on r.oid = d.setrole
    where r.rolname = 'authenticator' and 'pgrst.db_pre_request=pintar_permintaan.periksa' = any (d.setconfig)));

  -- (1) the first look: a staff person on an unknown browser is SHARED and asked; a card is CARD and never asked
  perform pg_temp.sebagai(u_staf, s1);
  j := public.sesi_periksa(null, true);
  v := v || jsonb_build_object('staf_awal', concat_ws('/', j->>'keadaan', j->>'mode', j->>'perlu_pilih', j->>'sisa_detik'));
  v := v || jsonb_build_object('baca', pg_temp.kode('select count(*) from public.device_sessions'),
    'buka_klien', pg_temp.kode(format('select public.sesi_buka(%L, %L, %L)', s1, u_staf, '2817')));
  perform pg_temp.sebagai(u_kartu, k1);
  j := public.sesi_periksa(null, true);
  v := v || jsonb_build_object('kartu_awal', concat_ws('/', j->>'keadaan', j->>'mode', j->>'perlu_pilih'),
    'kartu_pilih', pg_temp.kode(format('select public.sesi_tetapkan_perangkat(%L, %L)', alat, 'PERSONAL')));
  perform pg_temp.sebagai(u_persona, p1);
  j := public.sesi_periksa(alat, true);
  v := v || jsonb_build_object('persona', j->>'keadaan');

  -- (2) «Komputer siapa ini?»: this browser declared personal; the session follows; the next session here starts
  --     personal; another browser is still shared and asked
  perform pg_temp.sebagai(u_staf, s2);
  j := public.sesi_periksa(alat, true);
  t := j->>'perlu_pilih';
  v := v || jsonb_build_object('pilih', public.sesi_tetapkan_perangkat(alat, 'PERSONAL'));
  j := public.sesi_periksa(alat, false);
  v := v || jsonb_build_object('pribadi', concat_ws('/', t, j->>'keadaan', j->>'mode', j->>'perlu_pilih'));
  perform pg_temp.sebagai(u_staf, s3);
  v := v || jsonb_build_object('pribadi_baru', public.sesi_periksa(alat, true)->>'mode');
  perform pg_temp.sebagai(u_staf, s4);
  j := public.sesi_periksa(alat_lain, true);
  v := v || jsonb_build_object('alat_lain', concat_ws('/', j->>'mode', j->>'perlu_pilih'));
  perform selftest.as_owner();

  -- (3) a personal computer never locks
  update public.device_sessions set last_activity_at = now() - interval '6 days' where session_id = s3;
  v := v || jsonb_build_object('pribadi_lama', pg_temp.pintu(u_staf, s3, 'authenticated', '/accounts'));

  -- (4) shared, 5 minutes without activity: locked. The database refuses its data and its calls; the lock screen's
  --     two questions pass; the same person's other session, the service role and a stranger are not touched
  update public.device_sessions set last_activity_at = now() - interval '5 minutes 1 second' where session_id = s1;
  v := v || jsonb_build_object(
    'kunci_data', pg_temp.pintu(u_staf, s1, 'authenticated', '/accounts'),
    'kunci_rpc', pg_temp.pintu(u_staf, s1, 'authenticated', '/rpc/sesi_detak'),
    'kunci_periksa', pg_temp.pintu(u_staf, s1, 'authenticated', '/rpc/sesi_periksa'),
    'kunci_keluar', pg_temp.pintu(u_staf, s1, 'authenticated', '/rpc/sesi_akhiri_saya'),
    'kunci_lain', pg_temp.pintu(u_staf, s4, 'authenticated', '/accounts'),
    'kunci_service', pg_temp.pintu(u_staf, s1, 'service_role', '/accounts'),
    'kunci_anon', pg_temp.pintu(u_staf, s1, 'anon', '/accounts'));
  -- activity and a page visit never unlock; the lock is recorded; a staff person is named on it, with the PIN tries
  perform pg_temp.sebagai(u_staf, s1);
  perform public.sesi_detak();
  j := public.sesi_periksa(null, true);
  v := v || jsonb_build_object('terkunci', concat_ws('/', j->>'keadaan', j->>'percobaan_sisa', (j->>'nama' is not null)::text, j->>'bisa_pin'));
  perform selftest.as_owner();
  v := v || jsonb_build_object('kunci_tercatat', (select locked_at is not null from public.device_sessions where session_id = s1));
  -- a card locks the same way and is never named
  update public.device_sessions set last_activity_at = now() - interval '6 minutes' where session_id = k1;
  perform pg_temp.sebagai(u_kartu, k1);
  j := public.sesi_periksa(null, true);
  v := v || jsonb_build_object('kartu_terkunci', concat_ws('/', j->>'keadaan', coalesce(j->>'nama', '-'), j->>'bisa_pin'));
  perform selftest.as_owner();

  -- (5) the PIN: the service role's, for the session the route read; a wrong one counts, the right one opens it
  set local role service_role;
  j := public.sesi_buka(s1, u_staf, '0000');
  v := v || jsonb_build_object('salah1', concat_ws('/', j->>'keadaan', j->>'percobaan_sisa'));
  v := v || jsonb_build_object('benar', public.sesi_buka(s1, u_staf, '2817')->>'keadaan');
  -- a card with its own secret (the route derives it with the pepper)
  t := public.sesi_buka(k1, u_kartu, 'bukan-rahasianya')->>'keadaan';
  v := v || jsonb_build_object('kartu_buka', t || '/' || (public.sesi_buka(k1, u_kartu, rahasia)->>'keadaan'));
  -- nobody resumes another person's session
  v := v || jsonb_build_object('orang_lain', public.sesi_buka(s1, u_lain, '2817')->>'keadaan');
  reset role;
  v := v || jsonb_build_object('benar_nol', (select failures = 0 and locked_at is null from public.device_sessions where session_id = s1),
    'benar_lewat', pg_temp.pintu(u_staf, s1, 'authenticated', '/accounts'));

  -- (6) three wrong PINs end that session only: its Auth session is gone, its token refused; the other stays
  update public.device_sessions set last_activity_at = now() - interval '6 minutes' where session_id = s1;
  set local role service_role;
  v := v || jsonb_build_object('tiga', jsonb_build_array(public.sesi_buka(s1, u_staf, '1111')->>'keadaan',
    public.sesi_buka(s1, u_staf, '2222')->>'keadaan', public.sesi_buka(s1, u_staf, '3333')->>'keadaan'));
  v := v || jsonb_build_object('tiga_lalu_benar', public.sesi_buka(s1, u_staf, '2817')->>'keadaan');
  reset role;
  v := v || jsonb_build_object(
    'tiga_alasan', (select ended_reason from public.device_sessions where session_id = s1),
    'tiga_auth', exists (select 1 from auth.sessions where id = s1),
    'tiga_data', pg_temp.pintu(u_staf, s1, 'authenticated', '/accounts'),
    'tiga_lain', pg_temp.pintu(u_staf, s4, 'authenticated', '/accounts'),
    'tiga_lain_auth', exists (select 1 from auth.sessions where id = s4));

  -- (7) 60 minutes locked end it, when it returns; and an abandoned session ends on someone else's request
  update public.device_sessions set locked_at = now() - interval '61 minutes', last_activity_at = now() - interval '70 minutes'
   where session_id = k1;
  insert into public.device_sessions (session_id, auth_user_id, mode, last_activity_at) values (s5, u_staf, 'SHARED', now() - interval '66 minutes');
  -- (abandoned 66 minutes ago: past 5 + 60)
  perform pg_temp.sebagai(u_kartu, k1);
  v := v || jsonb_build_object('enam_puluh', public.sesi_periksa(null, true)->>'keadaan');
  perform pg_temp.sebagai(u_lain, l1);
  perform public.sesi_periksa(null, true);
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'enam_puluh_alasan', (select ended_reason from public.device_sessions where session_id = k1),
    'enam_puluh_auth', exists (select 1 from auth.sessions where id = k1),
    'enam_puluh_data', pg_temp.pintu(u_kartu, k1, 'authenticated', '/accounts'),
    'terbengkalai', (select ended_reason from public.device_sessions where session_id = s5),
    'terbengkalai_auth', exists (select 1 from auth.sessions where id = s5));

  -- (8) the screen's clock locks now; never on a personal computer
  perform pg_temp.sebagai(u_staf, s4);
  v := v || jsonb_build_object('kunci_sekarang', public.sesi_kunci_saya()->>'keadaan');
  perform pg_temp.sebagai(u_staf, s3);
  v := v || jsonb_build_object('kunci_pribadi', public.sesi_kunci_saya()->>'keadaan');

  -- (9) leaving ends this session (Keluar, «Bukan akun Anda?»); «Keluar dari semua perangkat» ends every one
  perform pg_temp.sebagai(u_lain, l1);
  perform public.sesi_akhiri_saya();
  perform selftest.as_owner();
  v := v || jsonb_build_object('keluar', (select ended_reason from public.device_sessions where session_id = l1),
    'keluar_auth', exists (select 1 from auth.sessions where id = l1));
  perform pg_temp.sebagai(u_staf, s2);
  v := v || jsonb_build_object('semua', public.sesi_akhiri_semua());
  perform selftest.as_owner();
  v := v || jsonb_build_object('semua_auth', (select count(*) from auth.sessions where user_id = u_staf),
    'semua_terbuka', (select count(*) from public.device_sessions where auth_user_id = u_staf and ended_at is null));

  -- (10) audited; and who may call what
  v := v || jsonb_build_object('audit', (select jsonb_object_agg(action, n) from (select action, count(*) n from public.audit_log
     where id > v_dulu and (action like 'identity.session%' or action like 'identity.device%') group by action) x));
  v := v || jsonb_build_object('hak', jsonb_build_object(
    'anon_periksa', has_function_privilege('anon', 'public.sesi_periksa(text,boolean)', 'execute'),
    'auth_buka', has_function_privilege('authenticated', 'public.sesi_buka(uuid,uuid,text)', 'execute'),
    'service_buka', has_function_privilege('service_role', 'public.sesi_buka(uuid,uuid,text)', 'execute'),
    'auth_inti', has_function_privilege('authenticated', 'public.sesi_akhiri_inti(uuid,text)', 'execute'),
    'auth_periksa', has_function_privilege('authenticated', 'public.sesi_periksa(text,boolean)', 'execute'),
    'auth_tabel', has_table_privilege('authenticated', 'public.device_sessions', 'select')
                  or has_table_privilege('authenticated', 'public.device_contexts', 'select'),
    'pintu_rpc', exists (select 1 from information_schema.routines where routine_schema = 'public' and routine_name = 'periksa')));
  insert into b29 values (v);
end $b29$;
select v from b29;
rollback;
`;

// ═══════════════════════════════════════════════════════════════ the running app
/** A browser at PINTAR: Peramban's cookies, and a page load as a browser makes it (Sec-Fetch-Dest: document). */
export class Komputer extends Peramban {
  async halaman(path: string): Promise<Response> {
    const headers: Record<string, string> = { "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "x-real-ip": this.ip };
    if (this.kue.size) headers.cookie = [...this.kue].map(([k, v]) => `${k}=${v}`).join("; ");
    const r = await fetch(this.asal + path, { headers, redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const [pasangan, ...atribut] = c.split(";");
      const i = pasangan.indexOf("=");
      const nama = pasangan.slice(0, i).trim(), nilai = pasangan.slice(i + 1);
      if (!nilai || atribut.some((a) => /^\s*max-age=0\s*$/i.test(a))) this.kue.delete(nama); else this.kue.set(nama, nilai);
    }
    return r;
  }
  /** The Auth session this browser holds, read from its cookies as @supabase/ssr wrote them. */
  sesi(): { access: string; refresh: string; id: string } | null {
    const bagian = [...this.kue].filter(([k]) => /^sb-.+-auth-token(\.\d+)?$/.test(k))
      .sort(([a], [b]) => Number(/\.(\d+)$/.exec(a)?.[1] ?? -1) - Number(/\.(\d+)$/.exec(b)?.[1] ?? -1)).map(([, v]) => v).join("");
    if (!bagian) return null;
    try {
      const s = JSON.parse(bagian.startsWith("base64-") ? stringFromBase64URL(bagian.slice(7)) : decodeURIComponent(bagian)) as { access_token: string; refresh_token: string };
      const id = idSesiDariToken(s.access_token);
      return id ? { access: s.access_token, refresh: s.refresh_token, id } : null;
    } catch {
      return null;
    }
  }
}

const tempat = (r: Response) => r.headers.get("location") ?? "";
const diam = (idSesi: string, menit: number) =>
  psql(`update public.device_sessions set last_activity_at = now() - make_interval(secs => ${Math.round(menit * 60)}) where session_id = ${lit(idSesi)}`);

export async function postgrest(url: string, anon: string, akses: string): Promise<number> {
  return (await fetch(`${url}/rest/v1/accounts?select=kind&limit=1`, { headers: { apikey: anon, authorization: `Bearer ${akses}` } })).status;
}
export async function segarkan(url: string, anon: string, refresh: string): Promise<{ ok: boolean; akses: string | null }> {
  const r = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ refresh_token: refresh }) });
  const isi = (await r.json().catch(() => null)) as { access_token?: string } | null;
  return { ok: r.ok, akses: isi?.access_token ?? null };
}

export const bob29AppTests: SelfTest[] = [
  {
    // A staff person on a shared computer: asked «Komputer siapa ini?» once, shared by default; 5 minutes idle lock
    // the pages, the routes and PostgREST itself (a refreshed token too); the PIN resumes; the person's other
    // session is never touched.
    id: "BOB29-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      const pc = new Komputer(asal, ipUji());
      const m = await pc.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } });
      if (!c.expect(m.status === 200, `the teacher could not sign in (${m.status})`)) return c.verdict("");
      const tanya = await pc.halaman("/mengajar");
      c.expect(tanya.status === 307 && /\/perangkat\?lanjut=%2Fmengajar$/.test(tempat(tanya)),
        `an unknown browser's first page → ${tanya.status} ${tempat(tanya)}, expected «Komputer siapa ini?» before /mengajar`);
      const layar = await pc.halaman("/perangkat?lanjut=%2Fmengajar");
      const html = await layar.text();
      c.expect(layar.status === 200 && html.includes(t("perangkat.judul", "staff", { locale: "id" })) && /value="SHARED"[^>]*checked|checked[^>]*value="SHARED"/.test(html),
        `«Komputer siapa ini?» did not render with the shared computer chosen (${layar.status})`);
      const pilih = await pc.jsonDari("/api/sesi/perangkat", { form: { mode: "SHARED" } });
      c.expect(pilih.status === 200 && pilih.body?.mode === "SHARED", `declaring a shared computer → ${pilih.status} ${JSON.stringify(pilih.body)}`);
      const buka = await pc.halaman("/mengajar");
      c.expect(buka.status === 200 && pc.kue.get("pintar_jaga") === "SHARED",
        `after the answer /mengajar → ${buka.status}, the screen's mark ${pc.kue.get("pintar_jaga")}`);
      const s = pc.sesi();
      if (!c.expect(s !== null, "the browser holds no readable Auth session")) return c.verdict("");
      c.expect(await postgrest(url, anon, s!.access) === 200, "an open session's token was refused by PostgREST");

      // the same person on another computer, signed in too
      const lain = new Komputer(asal, ipUji());
      await lain.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } });
      await lain.halaman("/mengajar");
      const sLain = lain.sesi();

      // 5 minutes without activity
      diam(s!.id, 5.1);
      const kunci = await pc.halaman("/mengajar");
      c.expect(kunci.status === 307 && /\/terkunci\?lanjut=%2Fmengajar$/.test(tempat(kunci)), `a locked page → ${kunci.status} ${tempat(kunci)}`);
      const detak = await pc.kirim("/api/sesi/detak", { method: "POST" });
      c.expect(detak.status === 423, `a locked session's activity → ${detak.status}, expected 423 (activity never unlocks)`);
      c.expect(await postgrest(url, anon, s!.access) === 423, "PostgREST served a locked session's token");
      const segar = await segarkan(url, anon, s!.refresh);
      c.expect(segar.ok && segar.akses !== null && await postgrest(url, anon, segar.akses!) === 423,
        "a refreshed token of the locked session was served (the lock is the session's, not the token's)");
      c.expect(sLain !== null && await postgrest(url, anon, sLain!.access) === 200, "the same person's other computer was locked too");
      const layarKunci = await (await pc.halaman("/terkunci?lanjut=%2Fmengajar")).text();
      c.expect(layarKunci.includes(t("kunci.judul", "staff", { locale: "id" })) && layarKunci.includes(t("kunci.pin_label", "staff", { locale: "id" }))
        && layarKunci.includes('action="/keluar"'), "«PINTAR terkunci» did not render the PIN and «Bukan akun Anda?»");

      // the PIN
      const salah = await pc.jsonDari("/api/sesi/buka", { form: { pin: "0000" } });
      c.expect(salah.status === 403 && salah.body?.code === "PIN_SALAH" && salah.body?.percobaanSisa === 2, `a wrong PIN → ${salah.status} ${JSON.stringify(salah.body)}`);
      const benar = await pc.jsonDari("/api/sesi/buka", { form: { pin: "2817" } });
      c.expect(benar.status === 200 && benar.body?.keadaan === "BUKA", `the right PIN → ${benar.status} ${JSON.stringify(benar.body)}`);
      c.expect((await pc.halaman("/mengajar")).status === 200 && await postgrest(url, anon, segar.akses ?? s!.access) === 200,
        "the resumed session's page or data was still refused");
      return c.verdict("a staff person's unknown browser is asked «Komputer siapa ini?» before /mengajar (shared chosen); declared shared, " +
        "5 minutes without activity send its pages to /terkunci, its activity route a 423 and PostgREST a 423, a refreshed token too, " +
        "while the same person's other computer is served; «PINTAR terkunci» renders the PIN and Keluar; a wrong PIN leaves 2 tries, " +
        "the right one opens the page and the data again");
    },
  },
  {
    // A class card (T1, D-086(c)): never asked about the computer; locks; the learner is never named; the card PIN
    // resumes; «Bukan akun Anda?» hands the computer over; three wrong PINs end that session only. No phone.
    id: "BOB29-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      const masuk = async (k: Komputer) => (await k.jsonDari("/masuk/kartu", { form: { kartu: "7001", pin: "2468" } })).status;
      const pc = new Komputer(asal, ipUji());
      if (!c.expect(await masuk(pc) === 200, "card 7001 could not sign in")) return c.verdict("");
      const belajar = await pc.halaman("/belajar");
      c.expect(belajar.status === 200 && pc.kue.get("pintar_jaga") === "CARD", `a card's /belajar → ${belajar.status} ${tempat(belajar)}, mark ${pc.kue.get("pintar_jaga")}`);
      const s = pc.sesi()!;
      const nama = psql(`select p.display_name from public.accounts a join public.persons p on p.id = a.person_id where a.card_number = '7001'`);
      diam(s.id, 6);
      const kunci = await pc.halaman("/belajar");
      c.expect(kunci.status === 307 && /\/terkunci/.test(tempat(kunci)), `a locked card's page → ${kunci.status} ${tempat(kunci)}`);
      const layar = await (await pc.halaman("/terkunci?lanjut=%2Fbelajar")).text();
      c.expect(layar.includes(t("kunci.pin_label.kartu", "learner", { locale: "id" })) && !layar.includes(nama) && !/perangkat\.judul|Komputer siapa ini/.test(layar),
        "the card's lock screen does not ask for the card's PIN, or names the learner, or asks about the computer");
      c.expect(await postgrest(url, anon, s.access) === 423, "PostgREST served a locked card's token");
      const salah = await pc.jsonDari("/api/sesi/buka", { form: { pin: "1357" } });
      const benar = await pc.jsonDari("/api/sesi/buka", { form: { pin: "2468" } });
      c.expect(salah.body?.code === "PIN_SALAH" && benar.status === 200 && (await pc.halaman("/belajar")).status === 200,
        `the card's PIN: wrong ${JSON.stringify(salah.body)}, right ${benar.status}`);

      // «Bukan akun Anda?»: the next learner signs this computer out; the session is over, not just forgotten
      diam(s.id, 6);
      const keluar = await pc.kirim("/keluar", { method: "POST" });
      c.expect([302, 303, 307].includes(keluar.status) && !(await segarkan(url, anon, s.refresh)).ok
        && psql(`select ended_reason from public.device_sessions where session_id = ${lit(s.id)}`) === "KELUAR",
        `«Bukan akun Anda?» → ${keluar.status}; the session ${psql(`select coalesce(ended_reason, 'still open') from public.device_sessions where session_id = ${lit(s.id)}`)}`);

      // three wrong PINs end that session; the same card on another computer carries on
      const a = new Komputer(asal, ipUji()), b = new Komputer(asal, ipUji());
      await masuk(a); await masuk(b);
      await a.halaman("/belajar"); await b.halaman("/belajar");
      const sa = a.sesi()!, sb = b.sesi()!;
      diam(sa.id, 6);
      await a.halaman("/belajar");
      const tiga = [];
      for (const pin of ["1111", "2222", "3333"]) tiga.push((await a.jsonDari("/api/sesi/buka", { form: { pin } })).body?.code);
      c.expect(JSON.stringify(tiga) === JSON.stringify(["PIN_SALAH", "PIN_SALAH", "BERAKHIR"]), `three wrong PINs: ${JSON.stringify(tiga)}`);
      const sesudah = await a.halaman("/belajar");
      c.expect(sesudah.status === 307 && /\/masuk/.test(tempat(sesudah)) && !(await segarkan(url, anon, sa.refresh)).ok
        && await postgrest(url, anon, sa.access) !== 200, `after three wrong PINs /belajar → ${sesudah.status} ${tempat(sesudah)}`);
      c.expect((await b.halaman("/belajar")).status === 200 && await postgrest(url, anon, sb.access) === 200,
        "three wrong PINs on one computer ended the same card's session on another");
      return c.verdict("card 7001 is never asked about the computer and gets the CARD mark; 5 minutes idle send /belajar to /terkunci, " +
        "whose html asks for the card's PIN, never names the learner and PostgREST refuses the token; a wrong card PIN counts, the right one " +
        "opens /belajar; «Bukan akun Anda?» (POST /keluar) ends the session (KELUAR) and its refresh; three wrong PINs end that session " +
        "(BERAKHIR, sent to /masuk, refresh and data refused) while the same card on another computer carries on");
    },
  },
  {
    // The ends: 60 minutes locked; «Keluar dari semua perangkat»; a personal computer that never locks.
    id: "BOB29-A03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!, url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      // the synthetic platform admin, as daftar() signs in (selftest/bob26.test.ts)
      const pc = new Komputer(asal, ipUji());
      const m = await pc.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
      if (!c.expect(m.status === 200, `the platform admin could not sign in (${m.status})`)) return c.verdict("");
      await pc.halaman("/konfigurasi"); // a shared computer until answered: the first page makes the session's row
      const s = pc.sesi()!;
      psql(`update public.device_sessions set locked_at = now() - interval '61 minutes', last_activity_at = now() - interval '70 minutes' where session_id = ${lit(s.id)}`);
      const habis = await pc.halaman("/konfigurasi");
      c.expect(habis.status === 307 && /\/masuk\?sesi=berakhir$/.test(tempat(habis)) && !(await segarkan(url, anon, s.refresh)).ok
        && psql(`select ended_reason from public.device_sessions where session_id = ${lit(s.id)}`) === "KUNCI_HABIS",
        `60 minutes locked: ${habis.status} ${tempat(habis)}`);

      // a personal computer: 6 days without use, still open
      const pribadi = new Komputer(asal, ipUji());
      await pribadi.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
      await pribadi.halaman("/konfigurasi");
      const p = await pribadi.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      const sp = pribadi.sesi()!;
      psql(`update public.device_sessions set last_activity_at = now() - interval '6 days' where session_id = ${lit(sp.id)}`);
      c.expect(p.status === 200 && (await pribadi.halaman("/konfigurasi")).status === 200 && await postgrest(url, anon, sp.access) === 200,
        "a computer declared personal locked after 6 days without use");

      // «Keluar dari semua perangkat» from one computer ends the other's session too
      const kedua = new Komputer(asal, ipUji());
      await kedua.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
      await kedua.halaman("/konfigurasi");
      const sk = kedua.sesi()!;
      const semua = await pribadi.jsonDari("/api/sesi/keluar-semua", { method: "POST" });
      c.expect(semua.status === 200 && !(await segarkan(url, anon, sp.refresh)).ok && !(await segarkan(url, anon, sk.refresh)).ok
        && await postgrest(url, anon, sk.access) !== 200,
        `«Keluar dari semua perangkat» → ${semua.status}; another computer's session survived`);
      return c.verdict("a shared session locked 60 minutes is ended on its next page (/masuk?sesi=berakhir, KUNCI_HABIS, refresh refused); " +
        "a computer declared personal is served after 6 days without use; «Keluar dari semua perangkat» ends this computer's and another " +
        "computer's sessions (both refreshes refused, the other's token refused by PostgREST)");
    },
  },
];

export const bob29Tests: SelfTest[] = [
  {
    id: "BOB29-K01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // what the proxy reads from sesi_periksa
      const j = bacaPenjagaan({ keadaan: "TERKUNCI", mode: "SHARED", perlu_pilih: false, percobaan_sisa: 2, nama: "Bu Sari", bisa_pin: true });
      c.expect(j?.keadaan === "TERKUNCI" && j.mode === "SHARED" && j.percobaanSisa === 2 && j.nama === "Bu Sari" && j.bisaPin,
        `a locked answer read as ${JSON.stringify(j)}`);
      c.expect(bacaPenjagaan(null) === null && bacaPenjagaan({ keadaan: "TERBUKA" }) === null && bacaPenjagaan({ keadaan: "BUKA", mode: "LAIN" })?.mode === null,
        "an unknown answer is not refused, or an unknown mode is kept");
      // where a locked session may go
      c.expect(["/terkunci", "/api/sesi/buka", "/keluar"].every(jalurSaatTerkunci)
        && !["/", "/belajar", "/api/sesi/detak", "/api/sesi/kunci", "/terkunci/x", "/masuk", "/perangkat"].some(jalurSaatTerkunci),
        "a locked session may go somewhere other than «PINTAR terkunci», its PIN and Keluar");
      c.expect(["/perangkat", "/terkunci", "/keluar", "/api/x", "/aktifkan", "/aktifkan/x"].every(jalurBebasPilih)
        && !["/", "/mengajar", "/akun"].some(jalurBebasPilih), "«Komputer siapa ini?» interrupts the wrong paths");
      // a page load, and not a guess or a script
      c.expect(navigasiHalaman("GET", kepala({ "sec-fetch-dest": "document" })) && !navigasiHalaman("GET", kepala({}))
        && !navigasiHalaman("POST", kepala({ "sec-fetch-dest": "document" }))
        && !navigasiHalaman("GET", kepala({ "sec-fetch-dest": "document", "sec-purpose": "prefetch;prerender" }))
        && adalahPrefetch(kepala({ "next-router-prefetch": "1" })) && !adalahPrefetch(kepala({})),
        "a page load is not exactly a browser's GET document that is not a prefetch");
      c.expect(mintaHalaman("/belajar", kepala({})) && !mintaHalaman("/api/x", kepala({})) && !mintaHalaman("/belajar", kepala({ "next-action": "a" }))
        && !mintaHalaman("/belajar", kepala({ rsc: "1" })), "a refusal is a page where it should be a 423, or the reverse");
      // the session's id from the token Auth verified
      const id = "0b6e1f3c-2a4d-4e5f-8a9b-0c1d2e3f4a5b";
      c.expect(idSesiDariToken(token({ session_id: id })) === id && idSesiDariToken(token({ session_id: "x" })) === null
        && idSesiDariToken(token({})) === null && idSesiDariToken("a.b") === null && idSesiDariToken(null) === null,
        "the session id is not read exactly from the token");
      // this browser
      const alat = perangkatBaru();
      c.expect(/^[A-Za-z0-9_-]{43}$/.test(alat) && perangkatBaru() !== alat && /^[0-9a-f]{64}$/.test(hashPerangkat(alat) ?? "")
        && hashPerangkat(alat) === hashPerangkat(alat) && hashPerangkat("pendek") === null && hashPerangkat(undefined) === null,
        "the browser's value or what the database keeps of it is wrong");
      // the PERSONAL mark: this server's, this session's
      const lada = process.env.CARD_PEPPER;
      process.env.CARD_PEPPER = "synthetic-card-pepper-fable01-32plus";
      const tanda = nilaiPribadi(id)!;
      c.expect(pribadiTersimpan(id, tanda) && !pribadiTersimpan("1b6e1f3c-2a4d-4e5f-8a9b-0c1d2e3f4a5b", tanda)
        && !pribadiTersimpan(id, `${id}.palsu`) && !pribadiTersimpan(null, tanda) && !pribadiTersimpan(id, undefined),
        "a forged or another session's PERSONAL mark verifies");
      process.env.CARD_PEPPER = "";
      c.expect(nilaiPribadi(id) === null && !pribadiTersimpan(id, tanda), "without a pepper a PERSONAL mark is still made or believed");
      if (lada === undefined) delete process.env.CARD_PEPPER; else process.env.CARD_PEPPER = lada;
      // the lifetime by mode
      c.expect(umurSesiMode("PERSONAL", "guru@sekolah.test") === UMUR_SESI.email && umurSesiMode("SHARED", "guru@sekolah.test") === UMUR_SESI.kartu
        && umurSesiMode("CARD", "x") === UMUR_SESI.kartu && umurSesiMode(null, "guru@sekolah.test") === UMUR_SESI.email,
        "the cookie lifetime is not 7 days on a personal computer and 60 minutes on a shared one and a card");
      // the PIN's shape
      c.expect(pinSahUntuk("SHARED", "2817") && !pinSahUntuk("SHARED", "28170") && !pinSahUntuk("SHARED", "28a7")
        && pinSahUntuk("CARD", "246801") && pinSahUntuk("CARD", "2468") && !pinSahUntuk("CARD", "") && !pinSahUntuk("CARD", "12ab"),
        "a PIN of the wrong shape is taken");
      // the lock screen's answer
      c.expect(bacaJawabanBuka({ ok: true, keadaan: "BUKA" }).ok && bacaJawabanBuka({ ok: false, code: "PIN_SALAH", percobaanSisa: 1 }).ok === false
        && (bacaJawabanBuka({ ok: false, code: "PIN_SALAH", percobaanSisa: 7 }) as { code: string }).code === "LAYANAN_TIDAK_TERSEDIA"
        && (bacaJawabanBuka({ ok: false, code: "BERAKHIR" }) as { code: string }).code === "BERAKHIR"
        && (bacaJawabanBuka("rusak") as { code: string }).code === "LAYANAN_TIDAK_TERSEDIA",
        "the lock screen reads an answer the route never gives");
      // the screen's timings are the migration's
      const mig = readFileSync(join(repoRoot, MIGRASI), "utf8");
      c.expect(BATAS_SESI.kunciDetik === 300 && /last_activity_at \+ interval '5 minutes'\) \+ interval '60 minutes' <= p_nu/.test(mig)
        && BATAS_SESI.peringatanDetik < BATAS_SESI.kunciDetik && BATAS_SESI.detakDetik === 60,
        "the screen's clock and the database's timings (5 minutes, then 60) are not the same");
      // the words, in both languages; a card's are its own and name nobody
      const KUNCI: HleEvent[] = ["kunci.judul", "kunci.lede", "kunci.lede.kartu", "kunci.pin_label", "kunci.pin_label.kartu", "kunci.kosong",
        "kunci.kosong.kartu", "kunci.tidak_cocok.1", "kunci.tidak_cocok.2", "kunci.berakhir", "kunci.tanpa_pin", "kunci.lupa", "kunci.lupa.kartu",
        "kunci.gagal", "jaga.peringatan", "jaga.masih", "perangkat.judul", "perangkat.bersama", "perangkat.bersama.arti", "perangkat.pribadi",
        "perangkat.pribadi.arti", "perangkat.catatan", "akun.semua.judul", "akun.semua.arti", "akun.semua.yakin", "masuk.sesi_berakhir"];
      for (const locale of LOCALES) {
        for (const k of KUNCI) {
          const v = t(k, k.endsWith(".kartu") ? "learner" : "staff", { locale });
          c.expect(v.trim() !== "" && !/notifikasi|pemberitahuan|SMS|WhatsApp|ponsel|HP\b|phone|text message/i.test(v),
            `(${locale}) ${k}: "${v}" is empty or asks for a phone or a message`);
        }
        c.expect(/5/.test(t("kunci.lede", "staff", { locale })) && /5/.test(t("perangkat.bersama.arti", "staff", { locale }))
          && /7/.test(t("perangkat.pribadi.arti", "staff", { locale })), `(${locale}) the timings are not said where the person decides`);
        c.expect(/guru|teacher/i.test(t("kunci.lupa.kartu", "learner", { locale })) && !/password/i.test(t("kunci.lupa.kartu", "learner", { locale })),
          `(${locale}) a learner who forgot the card's PIN is not sent to the teacher`);
      }
      return c.verdict("bacaPenjagaan, jalurSaatTerkunci (only /terkunci, /api/sesi/buka, /keluar), jalurBebasPilih, navigasiHalaman (a browser's GET " +
        "document, never a prefetch), mintaHalaman, idSesiDariToken, the device value and its SHA-256, the PERSONAL mark (bound to the session, " +
        "nothing without a pepper), umurSesiMode (7 days personal, 60 minutes shared and card), pinSahUntuk and bacaJawabanBuka decide as stated; " +
        "BATAS_SESI matches migration 20261117100000's 5 and 60 minutes; every hle line of the lock, the warning, the device question and Akun saya " +
        "has words in id and en, none asks for a phone, and a card's forgotten PIN goes to the teacher");
    },
  },
  {
    id: "BOB29-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (p: string) => readFileSync(join(repoRoot, p), "utf8");
      const proxy = baca("src/proxy.ts");
      c.expect(/supabase\.rpc\("sesi_periksa"/.test(proxy) && /jaga\?\.keadaan === "TERKUNCI" && !jalurSaatTerkunci\(path\)/.test(proxy)
        && /NextResponse\.redirect\(alamatTerkunci\(request\)\)/.test(proxy) && /status: 423/.test(proxy),
        "the proxy does not send a locked page to «PINTAR terkunci» and refuse anything else with a 423");
      c.expect(/jaga\?\.keadaan === "BERAKHIR"\) \{\s*await keluarPerangkatIni\(supabase\)/.test(proxy) && /\/masuk\?sesi=berakhir/.test(proxy),
        "the proxy does not sign an ended session out of this computer");
      c.expect(/perluPilih && !jalurBebasPilih\(path\) && navigasiHalaman\(request\.method, request\.headers\)/.test(proxy),
        "«Komputer siapa ini?» is asked of something other than a browser's page load");
      c.expect(/const aksi = Boolean\(request\.headers\.get\("next-action"\)\)/.test(proxy) && (proxy.match(/!aksi/g) ?? []).length >= 4,
        "the proxy writes its cookies on a server action (each one redraws the page, BOB-23)");
      const mig = baca(MIGRASI);
      c.expect(/alter role authenticator set pgrst\.db_pre_request to 'pintar_permintaan\.periksa'/.test(mig) && /notify pgrst, 'reload config'/.test(mig)
        && /raise exception using errcode = 'PT423'/.test(mig) && /raise exception using errcode = 'PT401'/.test(mig)
        && /in \('\/rpc\/sesi_periksa', '\/rpc\/sesi_akhiri_saya'\)/.test(mig),
        "PostgREST's pre-request is not the session check, or lets more than the lock screen's two questions through");
      const keluar = baca("src/lib/keluar.ts").replace(/\/\*[\s\S]*?\*\//g, "");
      c.expect(/rpc\("sesi_akhiri_saya"\)[\s\S]*?signOut\(\{ scope: "local" \}\)/.test(keluar) && /rpc\("sesi_akhiri_semua"\)/.test(keluar),
        "leaving does not end PINTAR's own record of the session before Auth's");
      const buka = baca("src/app/api/sesi/buka/route.ts");
      c.expect(/supabaseService\(\)\.rpc\("sesi_buka", \{\s*p_sesi: s\.idSesi, p_auth_user: s\.user\.id, p_rahasia: rahasia \}\)/.test(buka)
        && /deriveCardSecret\(nomor, pin\)/.test(buka) && /pinSahUntuk\(jaga\.mode, pin\)/.test(buka),
        "the PIN route does not ask the database for the verified token's own session, or a card's PIN is not derived as at sign-in");
      c.expect(/idSesiDariToken\(\(await supabase\.auth\.getSession\(\)\)\.data\.session\?\.access_token\)/.test(baca("src/app/api/sesi/_sesi.ts"))
        && /if \(!user\)/.test(baca("src/app/api/sesi/_sesi.ts")), "the session routes do not read the session from the user Auth verified");
      const layout = baca("src/app/layout.tsx");
      const jaga = baca("src/components/PenjagaSesi.tsx");
      c.expect(/<PenjagaSesi locale=\{locale\} \/>/.test(layout) && /fetch\("\/api\/sesi\/kunci"/.test(jaga) && /fetch\("\/api\/sesi\/detak"/.test(jaga)
        && /BroadcastChannel/.test(jaga) && /e\.persisted\) window\.location\.reload\(\)/.test(jaga) && /video, audio/.test(jaga)
        && /window\.location\.replace\(`\$\{HALAMAN_TERKUNCI\}/.test(jaga),
        "the inactivity clock is not on every page, or does not lock the server first, share its clock across tabs, reload a page from the back-forward cache, count a playing video, or leave with a full load");
      const terkunci = baca("src/app/terkunci/page.tsx");
      c.expect(/nama=\{kartu \? null : jaga\.nama\}/.test(terkunci), "«PINTAR terkunci» could name a learner");
      c.expect(/action="\/keluar" method="post"/.test(baca("src/components/sesi/LayarTerkunci.tsx")), "«Bukan akun Anda?» is not a real form to /keluar");
      // owner, 4 Oct: nothing in the lock, the resume or the device question needs a phone or a second device
      const berkas = ["src/proxy.ts", "src/lib/penjaga-sesi.ts", "src/lib/penjaga-sesi-kontrak.ts", "src/components/PenjagaSesi.tsx",
        "src/components/sesi/LayarTerkunci.tsx", "src/components/sesi/PilihPerangkat.tsx", "src/app/terkunci/page.tsx", "src/app/perangkat/page.tsx",
        "src/app/api/sesi/buka/route.ts", MIGRASI];
      const ponsel = berkas.filter((f) => /\b(sms|whatsapp|wa\.me|otp|qr|ponsel|telepon|phone)\b/i.test(baca(f).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|--[^\n]*/g, "")));
      c.expect(ponsel.length === 0, `the lock or the resume reaches for a phone: ${ponsel.join(", ")}`);
      return c.verdict("src/proxy.ts asks sesi_periksa, sends a locked page to /terkunci and refuses the rest with 423, signs an ended session out " +
        "(/masuk?sesi=berakhir), asks «Komputer siapa ini?» of a browser's page load only and writes no cookie on a server action; migration " +
        "20261117100000 makes pintar_permintaan.periksa PostgREST's pre-request (PT423, PT401; only sesi_periksa and sesi_akhiri_saya pass); " +
        "src/lib/keluar.ts ends PINTAR's record before Auth's; /api/sesi/buka asks sesi_buka for the verified token's session with the card " +
        "secret derived as at sign-in; PenjagaSesi is in the root layout and locks the server first, shares one clock across tabs, counts a " +
        "playing video and reloads a restored page; «PINTAR terkunci» never names a learner; no phone, message or code anywhere in it");
    },
  },
  {
    id: "BOB29-D01",
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
      if (!c.expect(v.ada === true, `the fixture lacks a staff member, a card or a persona (${JSON.stringify(v)})`)) return c.verdict("");
      c.expect(v.pre_request === true, "PostgREST's pre-request is not set to pintar_permintaan.periksa");
      c.expect(v.staf_awal === "BUKA/SHARED/true/300" && v.kartu_awal === "BUKA/CARD/false" && v.persona === "TANPA",
        `the first look: staff ${v.staf_awal}, card ${v.kartu_awal}, persona ${v.persona}`);
      c.expect(v.baca === "42501" && v.buka_klien === "42501" && v.kartu_pilih === "PERANGKAT_TIDAK_BERLAKU",
        `a client reads the table (${v.baca}) or resumes (${v.buka_klien}); a card declares a computer (${v.kartu_pilih})`);
      c.expect(v.pilih === "PERSONAL" && v.pribadi === "true/BUKA/PERSONAL/false" && v.pribadi_baru === "PERSONAL" && v.alat_lain === "SHARED/true",
        `«Komputer siapa ini?»: ${JSON.stringify([v.pilih, v.pribadi, v.pribadi_baru, v.alat_lain])}`);
      c.expect(v.pribadi_lama === "LEWAT", `a personal computer 6 days idle: ${v.pribadi_lama}`);
      c.expect(v.kunci_data === "PT423:SESI_TERKUNCI" && v.kunci_rpc === "PT423:SESI_TERKUNCI" && v.kunci_periksa === "LEWAT" && v.kunci_keluar === "LEWAT"
        && v.kunci_lain === "LEWAT" && v.kunci_service === "LEWAT" && v.kunci_anon === "LEWAT",
        `locked: data ${v.kunci_data}, a call ${v.kunci_rpc}, the lock screen ${v.kunci_periksa}/${v.kunci_keluar}, the other session ${v.kunci_lain}, service ${v.kunci_service}, anon ${v.kunci_anon}`);
      c.expect(v.terkunci === "TERKUNCI/3/true/true" && v.kunci_tercatat === true && v.kartu_terkunci === "TERKUNCI/-/true",
        `the lock seen: staff ${v.terkunci} (recorded ${v.kunci_tercatat}), card ${v.kartu_terkunci}`);
      c.expect(v.salah1 === "TERKUNCI/2" && v.benar === "BUKA" && v.benar_nol === true && v.benar_lewat === "LEWAT" && v.kartu_buka === "TERKUNCI/BUKA"
        && v.orang_lain === "TANPA", `resume: ${JSON.stringify([v.salah1, v.benar, v.benar_nol, v.benar_lewat, v.kartu_buka, v.orang_lain])}`);
      c.expect(JSON.stringify(v.tiga) === JSON.stringify(["TERKUNCI", "TERKUNCI", "BERAKHIR"]) && v.tiga_lalu_benar === "BERAKHIR"
        && v.tiga_alasan === "PIN_GAGAL" && v.tiga_auth === false && v.tiga_data === "PT401:SESI_BERAKHIR" && v.tiga_lain === "LEWAT" && v.tiga_lain_auth === true,
        `three wrong: ${JSON.stringify([v.tiga, v.tiga_lalu_benar, v.tiga_alasan, v.tiga_auth, v.tiga_data, v.tiga_lain, v.tiga_lain_auth])}`);
      c.expect(v.enam_puluh === "BERAKHIR" && v.enam_puluh_alasan === "KUNCI_HABIS" && v.enam_puluh_auth === false && v.enam_puluh_data === "PT401:SESI_BERAKHIR"
        && v.terbengkalai === "KUNCI_HABIS" && v.terbengkalai_auth === false,
        `60 minutes: ${JSON.stringify([v.enam_puluh, v.enam_puluh_alasan, v.enam_puluh_auth, v.enam_puluh_data, v.terbengkalai, v.terbengkalai_auth])}`);
      c.expect(v.kunci_sekarang === "TERKUNCI" && v.kunci_pribadi === "BUKA", `lock now: shared ${v.kunci_sekarang}, personal ${v.kunci_pribadi}`);
      c.expect(v.keluar === "KELUAR" && v.keluar_auth === false && v.semua === 3 && Number(v.semua_auth) === 0 && Number(v.semua_terbuka) === 0,
        `leaving: ${JSON.stringify([v.keluar, v.keluar_auth, v.semua, v.semua_auth, v.semua_terbuka])}`);
      c.expect(v.audit?.["identity.device_declared"] === 1 && v.audit?.["identity.session_pin_wrong"] === 4 && v.audit?.["identity.session_resumed"] === 2
        && v.audit?.["identity.session_ended"] === 7, `the audit: ${JSON.stringify(v.audit)}`);
      c.expect(v.hak && !v.hak.anon_periksa && !v.hak.auth_buka && v.hak.service_buka && !v.hak.auth_inti && v.hak.auth_periksa && !v.hak.auth_tabel && !v.hak.pintu_rpc,
        `privileges: ${JSON.stringify(v.hak)}`);
      return c.verdict("migration 20261117100000 against the database, rolled back: PostgREST's pre-request is pintar_permintaan.periksa; " +
        "sesi_periksa makes a staff person's first session SHARED and asks, a card's CARD and never asks, a persona's nothing; a client reads no " +
        "device_sessions row, resumes nothing, and a card declares no computer; sesi_tetapkan_perangkat makes this browser PERSONAL for the person, " +
        "the session and the next one here follow, another browser stays SHARED; a personal session 6 days idle passes; a shared session 5 minutes " +
        "idle is refused PT423 for data and calls, its lock screen's two questions pass, the person's other session, the service role and anon pass; " +
        "activity and a page visit never unlock; staff are named and a card never; sesi_buka counts a wrong PIN, opens with the right one (staff PIN, " +
        "card secret), never for another person; three wrong end it (PIN_GAGAL, Auth session deleted, PT401) and the right PIN then too, the other " +
        "session untouched; 60 minutes locked end it (KUNCI_HABIS) and an abandoned one ends on another's request; sesi_kunci_saya locks a shared " +
        "session now and never a personal one; sesi_akhiri_saya ends this session (KELUAR) and sesi_akhiri_semua all three left; audit_log holds " +
        "each; only the service role resumes, no client reads the tables or reaches sesi_akhiri_inti, and the pre-request is no RPC");
    },
  },
];
