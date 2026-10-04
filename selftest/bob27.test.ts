/**
 * BOB-27 (Gate 4): «LUPA PASSWORD?», A FORGOTTEN PASSWORD RECOVERED BY EMAIL (IDENTITY-4.0 §9, D-055(f), C14).
 *
 *   BOB27-K01  the decisions (src/lib/pemulihan.ts), tools replaced: asking answers alike for every name, D-098(c)'s
 *              waits first, a code only for an active account; checking asks Auth for nobody's name too, gives the
 *              grant only on a match and never signs in; the new password needs a live grant, keeps the rules,
 *              spends the grant, tells the owner after the answer and signs this browser in
 *   BOB27-S01  the source: the check runs on a client that keeps no session and ends the one it made; the grant is
 *              an httpOnly, same-site, ten-minute cookie whose SHA-256 alone is stored; the password is written only
 *              after recovery_grant_permit; «Lupa password?» is the recovery and the email link's switch is off (C14);
 *              the screens say "is sending", never "has been sent", in both languages
 *   BOB27-D01  the database (supabase/migrations/20261115100000), rolled back: who may recover; the grant (one per
 *              person, single use, ten minutes, audited); the permit only from a live grant; the guard spends the
 *              grant on the write; no client reaches any of it
 *   BOB27-A01  the whole journey against the running app and Auth: two other sessions end, the old password stops,
 *              the new one works, the owner's email arrives; nobody's name gets the same answer and no email
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, kodeDari, lit, Peramban, psql, sandiBagas, sinkTunggu } from "./bob26.test";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

const DB_SKRIP = `
begin;
create temp table b27 (k text, v jsonb) on commit drop;
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return null;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return case when v_state = 'PR040' then v_detail else v_state end;
end $f$;
create function pg_temp.tulis(p_uid uuid, p_hash text) returns void language sql as $f$
  update auth.users set encrypted_password = p_hash where id = p_uid
$f$;
do $b27$
declare v jsonb := '{}'::jsonb; v_aktif uuid; v_email text; v_user text; v_wajib uuid; v_kartu uuid;
        t1 text := repeat('a', 64); t2 text := repeat('b', 64); v_dulu bigint;
begin
  perform selftest.as_owner();
  select coalesce(max(id), 0) into v_dulu from public.audit_log;
  select a.auth_user_id, u.email, pu.username into v_aktif, v_email, v_user
    from public.accounts a join public.account_setup s on s.account_id = a.id and s.state = 'COMPLETE'
    join auth.users u on u.id = a.auth_user_id join public.person_usernames pu on pu.person_id = a.person_id
   where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id) order by u.email limit 1;
  select a.auth_user_id into v_wajib from public.accounts a join public.account_setup s on s.account_id = a.id and s.state = 'REQUIRED'
   where a.kind = 'EMAIL' and not public.adalah_persona(a.person_id) limit 1;
  select a.auth_user_id into v_kartu from public.accounts a where a.kind = 'CLASSROOM_CARD' limit 1;
  v := v || jsonb_build_object(
    'ada_aktif', v_aktif is not null, 'ada_wajib', v_wajib is not null, 'ada_kartu', v_kartu is not null,
    'email', (select count(*) from public.recovery_code_target(upper(v_email)) r where r.auth_user_id = v_aktif),
    'username', (select count(*) from public.recovery_code_target('  ' || upper(v_user) || ' ') r where r.auth_user_id = v_aktif),
    'wajib', (select count(*) from public.recovery_code_target((select email from auth.users where id = v_wajib))),
    'kartu', (select count(*) from public.recovery_code_target((select email from auth.users where id = v_kartu))),
    'tiada', (select count(*) from public.recovery_code_target('tiada@nowhere.invalid')),
    'kosong', (select count(*) from public.recovery_code_target('   ')));

  v := v || jsonb_build_object('beri_wajib', pg_temp.kode(format('select public.recovery_grant_issue(%L, %L, %L)', v_wajib, t1, 'EMAIL')));
  perform public.recovery_grant_issue(v_aktif, t1, 'EMAIL');
  perform public.recovery_grant_issue(v_aktif, t2, 'EMAIL');
  v := v || jsonb_build_object(
    'izin_jumlah', (select count(*) from public.password_recovery_grants where auth_user_id = v_aktif),
    'izin_t2', exists (select 1 from public.password_recovery_grants where token_hash = t2
                         and expires_at between now() + interval '9 minutes' and clock_timestamp() + interval '10 minutes'),
    'audit_verified', (select count(*) from public.audit_log where id > v_dulu and action = 'identity.recovery_verified'
                                                                and target_id = v_aktif::text and summary ->> 'via' = 'EMAIL'),
    'izin_lama', pg_temp.kode(format('select public.recovery_grant_permit(%L)', t1)),
    'tulis_tanpa', pg_temp.kode(format('select pg_temp.tulis(%L, %L)', v_aktif, extensions.crypt('x', extensions.gen_salt('bf', 4)))));
  v := v || jsonb_build_object('izin_untuk', public.recovery_grant_permit(t2)::text = v_aktif::text);
  v := v || jsonb_build_object('tulis_dengan', pg_temp.kode(format('select pg_temp.tulis(%L, %L)', v_aktif, extensions.crypt('Baru-2026-x', extensions.gen_salt('bf', 4)))));
  v := v || jsonb_build_object(
    'izin_sesudah', (select count(*) from public.password_recovery_grants where auth_user_id = v_aktif),
    'permit_sesudah', (select count(*) from public.password_write_permits where auth_user_id = v_aktif),
    'audit_set', (select count(*) from public.audit_log where id > v_dulu and action = 'identity.password_set'
                                                         and target_id = v_aktif::text and summary ->> 'purpose' = 'RECOVERY'),
    'setup', (select s.state from public.account_setup s join public.accounts a on a.id = s.account_id where a.auth_user_id = v_aktif),
    'izin_terpakai', pg_temp.kode(format('select public.recovery_grant_permit(%L)', t2)));
  perform public.recovery_grant_issue(v_aktif, t1, 'EMAIL');
  update public.password_recovery_grants set expires_at = now() - interval '1 second' where token_hash = t1;
  v := v || jsonb_build_object('izin_lewat', pg_temp.kode(format('select public.recovery_grant_permit(%L)', t1)));
  v := v || jsonb_build_object(
    'anon_target', has_function_privilege('anon', 'public.recovery_code_target(text)', 'execute'),
    'auth_target', has_function_privilege('authenticated', 'public.recovery_code_target(text)', 'execute'),
    'auth_beri', has_function_privilege('authenticated', 'public.recovery_grant_issue(uuid,text,text)', 'execute'),
    'auth_permit', has_function_privilege('authenticated', 'public.recovery_grant_permit(text)', 'execute'),
    'service_permit', has_function_privilege('service_role', 'public.recovery_grant_permit(text)', 'execute'),
    'baca_izin', has_table_privilege('authenticated', 'public.password_recovery_grants', 'select')
               or has_table_privilege('service_role', 'public.password_recovery_grants', 'select'));
  insert into b27 values ('DB', v);
end $b27$;
select v::text from b27;
rollback;
`;

export const bob27AppTests: SelfTest[] = [
  {
    id: "BOB27-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `bob27-sari-${tag}@local.invalid`;
      await daftar(asal, "Sari Lestari", email);

      // an active account, made the way a person makes one (Gate 3)
      const w = new Peramban(asal, ipUji());
      await w.jsonDari("/aktifkan/kode", { form: { email } });
      const kodeAktif = kodeDari((await sinkTunggu(email, 1))[0]);
      const masuk = await w.jsonDari("/aktifkan/periksa", { form: { email, kode: kodeAktif } });
      const lama = sandiBagas();
      const langkah = [
        await w.jsonDari("/api/aktifkan/username", { form: { username: `sari.${tag}` } }),
        await w.jsonDari("/api/aktifkan/password", { form: { password: lama } }),
        await w.jsonDari("/api/aktifkan/pin", { form: { pin: "2817" } }),
        await w.jsonDari("/api/aktifkan/nama", { form: {} }),
        await w.jsonDari("/api/aktifkan/selesai", { form: {} }),
      ];
      if (!c.expect(masuk.status === 200 && langkah.every((l) => l.status === 200), `the person could not be activated first (${JSON.stringify([masuk.status, ...langkah.map((l) => l.status)])})`)) {
        return c.verdict("");
      }
      await sinkTunggu(email, 2);

      // two other devices, signed in
      const x = new Peramban(asal, ipUji());
      const y = new Peramban(asal, ipUji());
      for (const b of [x, y]) {
        const m = await b.jsonDari("/masuk/password", { form: { identitas: email, password: lama, lanjut: "/mengajar" } });
        c.expect(m.status === 200 && (await b.kirim("/mengajar")).status === 200, `another device could not sign in first (${m.status})`);
      }

      // 1. asking: the same answer for a real name and nobody's; one email, to the account
      const z = new Peramban(asal, ipUji());
      const minta = await z.jsonDari("/masuk/lupa/kode", { form: { nama: `  SARI.${tag.toUpperCase()} ` } });
      const tiada = await new Peramban(asal, ipUji()).jsonDari("/masuk/lupa/kode", { form: { nama: `tiada.${tag}` } });
      c.expect(minta.status === 200 && JSON.stringify(minta.body) === JSON.stringify(tiada.body),
        `a real name and nobody's were answered differently (${minta.status} ${JSON.stringify(minta.body)} / ${tiada.status} ${JSON.stringify(tiada.body)})`);
      const surat = await sinkTunggu(email, 3);
      const pulih = surat.find((p) => /password baru/i.test(p.Subject));
      const kode = kodeDari(pulih);
      c.expect(!!pulih && kode.length === 6, `no recovery code arrived for the account (${surat.map((p) => p.Subject).join(" | ")})`);

      // 2. checking: a wrong code; the right one, spaced, gives the grant and signs NOBODY in
      const salah = await z.jsonDari("/masuk/lupa/periksa", { form: { nama: `sari.${tag}`, kode: kode === "000000" ? "111111" : "000000" } });
      c.expect(salah.status === 400 && salah.body?.code === "KODE_TIDAK_COCOK", `a wrong code was not KODE_TIDAK_COCOK (${salah.status})`);
      const benar = await z.jsonDari("/masuk/lupa/periksa", { form: { nama: `sari.${tag}`, kode: `${kode.slice(0, 3)} ${kode.slice(3)}` } });
      c.expect(benar.status === 200 && benar.body?.ok === true && z.kue.has("pintar_pulih"), `the right code gave no grant (${benar.status} ${JSON.stringify(benar.body)})`);
      const tanpaSesi = await z.kirim("/mengajar");
      c.expect(tanpaSesi.status >= 300 && tanpaSesi.status < 400 && new URL(tanpaSesi.headers.get("location") ?? "", asal).pathname === "/masuk",
        `a checked recovery code signed the browser in (/mengajar answered ${tanpaSesi.status})`);

      // 3. the new password: the rules, then the change; every other session ends
      const pendek = await z.jsonDari("/masuk/lupa/password", { form: { password: "pendek" } });
      c.expect(pendek.status === 422 && pendek.body?.code === "PASSWORD_LEMAH", `a short password was not PASSWORD_LEMAH (${JSON.stringify(pendek.body)})`);
      const baru = sandiBagas();
      const ganti = await z.jsonDari("/masuk/lupa/password", { form: { password: baru } });
      c.expect(ganti.status === 200 && ganti.body?.tujuan === "/mengajar" && !z.kue.has("pintar_pulih"),
        `the new password was not set and the grant not spent (${ganti.status} ${JSON.stringify(ganti.body)})`);
      c.expect((await z.kirim("/mengajar")).status === 200, "this browser is not signed in with the new password");
      for (const [nama, b] of [["the first", x], ["the second", y]] as const) {
        const r = await b.kirim("/mengajar");
        c.expect(r.status >= 300 && r.status < 400 && new URL(r.headers.get("location") ?? "", asal).pathname === "/masuk",
          `${nama} other device is still signed in after the reset (${r.status})`);
      }
      const ulang = await z.jsonDari("/masuk/lupa/password", { form: { password: sandiBagas() } });
      c.expect(ulang.status === 410 && ulang.body?.code === "PEMULIHAN_BERAKHIR", `the grant worked twice (${ulang.status})`);

      // 4. the old password stops, the new one works
      const pakaiLama = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: lama } });
      const pakaiBaru = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: `sari.${tag}`, password: baru, lanjut: "/mengajar" } });
      c.expect(pakaiLama.status === 401 && pakaiBaru.status === 200, `old ${pakaiLama.status}, new ${pakaiBaru.status}; expected 401 and 200`);

      // 5. the owner is told, and the record says what happened
      const semua = await sinkTunggu(email, 4);
      const diubah = semua.find((p) => /sudah diganti/i.test(p.Subject));
      c.expect(!!diubah && /keluar dari semua perangkat/i.test(diubah.Text), `the password-changed email did not arrive or does not say every session ended (${semua.map((p) => p.Subject).join(" | ")})`);
      const catatan = psql(`select string_agg(a.action || ':' || coalesce(a.summary ->> 'purpose', a.summary ->> 'via', ''), ',' order by a.id)
                              from public.audit_log a join public.accounts ac on a.target_id = ac.auth_user_id::text
                              join auth.users u on u.id = ac.auth_user_id
                             where u.email = ${lit(email)} and a.action in ('identity.recovery_verified', 'identity.password_set')`);
      c.expect(/identity\.recovery_verified:EMAIL/.test(catatan) && /identity\.password_set:RECOVERY/.test(catatan),
        `the audit log reads «${catatan}»; expected the verified recovery and the RECOVERY password write`);
      return c.verdict(
        "an active staff member signed in on two other devices asked by username (any case and spacing) and got the answer nobody's name gets; the "
        + "recovery code arrived; a wrong code was KODE_TIDAK_COCOK and the right one, spaced, gave the grant without signing in; a short password "
        + "was refused; the new one was set, this browser signed in with it, both other devices were signed out, the grant could not be used "
        + "again; the old password stopped and the new one signs in; the owner's email says every session ended; the audit log has both steps");
    },
  },
];

export const bob27Tests: SelfTest[] = [
  {
    id: "BOB27-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      process.env.CARD_PEPPER ??= "selftest-card-pepper-bob27-32plus-chars";
      const p = await import("../src/lib/pemulihan");

      // ── asking
      const minta = async (opsi: { kirim?: number; minta?: number }, ada: boolean, nama = ada ? "Sari.Uji" : "tiada.uji") => {
        const tanya: string[] = []; const nanti: Array<() => Promise<void>> = []; const kunci: string[] = [];
        const h = await p.mintaKodePemulihan({ origin: true, nama }, {
          jedaPengiriman: async () => { tanya.push("kirim"); return opsi.kirim ?? 0; },
          catatPermintaan: async (k) => { tanya.push("minta"); kunci.push(k); return opsi.minta ?? 0; },
          jedaKirimUlang: async () => 60,
          sasaran: async () => { tanya.push("sasaran"); return ada ? { authUserId: "00000000-0000-0000-0000-0000000000a1", nama: "Sari" } : null; },
          kirim: async () => {}, nanti: (k) => { nanti.push(k); }, catatGalat: () => {},
        });
        return { h, tanya, nanti: nanti.length, kunci };
      };
      const a1 = await minta({}, true), a0 = await minta({}, false);
      c.expect(JSON.stringify(a1.h) === JSON.stringify(a0.h) && a1.h.status === 200 && a1.nanti === 1 && a0.nanti === 0,
        `asking: ${JSON.stringify([a1.h, a0.h])}, sends ${a1.nanti}/${a0.nanti}; expected one answer, a send for the account only`);
      c.expect(a1.tanya.indexOf("kirim") < a1.tanya.indexOf("sasaran") && a1.tanya.indexOf("minta") < a1.tanya.indexOf("sasaran"),
        `the waits are asked after the lookup: ${JSON.stringify(a1.tanya)}`);
      const w1 = await minta({ kirim: 120 }, true), w0 = await minta({ kirim: 120 }, false);
      c.expect(w1.h.status === 503 && (w1.h.body as { code?: string }).code === "EMAIL_TUNGGU" && JSON.stringify(w1.h) === JSON.stringify(w0.h) && w1.nanti === 0,
        `PINTAR unable to send was answered ${JSON.stringify([w1.h, w0.h])}`);
      const m1 = await minta({ minta: 30 }, true);
      c.expect(m1.h.status === 429 && (m1.h.body as { code?: string }).code === "MINTA_KODE_TUNGGU" && m1.nanti === 0 && !m1.tanya.includes("sasaran"),
        `asked too often was answered ${JSON.stringify(m1.h)}`);
      const kecil = await minta({}, true, "  sari.UJI ");
      c.expect(kecil.kunci[0] === a1.kunci[0] && /^[0-9a-f]{64}$/.test(a1.kunci[0]), "the pace is not counted on the keyed hash of the normalised name");
      const kosong = await minta({}, true, "   ");
      c.expect(kosong.h.status === 400 && (kosong.h.body as { code?: string }).code === "IDENTITAS_KOSONG" && kosong.tanya.length === 0, "an empty name was asked about");

      // ── checking
      const periksa = async (o: { ada: boolean; authStatus?: number; kodeSah?: boolean; tunggu?: number }) => {
        const jejak: string[] = []; let izinUntuk: string | null = null;
        const h = await p.periksaKodePemulihan({ origin: true, nama: o.ada ? "sari.uji" : "tiada.uji", kode: o.kodeSah === false ? "12" : "482 913" }, {
          catat: async () => { jejak.push("catat"); return o.tunggu ?? 0; },
          selesaikan: async (_k, hasil) => { jejak.push(`selesai:${hasil}`); },
          sasaran: async () => { jejak.push("sasaran"); return o.ada ? { authUserId: "00000000-0000-0000-0000-0000000000a1", email: "sari@uji.invalid" } : null; },
          verifikasi: async (email, kode) => {
            jejak.push(`auth:${email.endsWith("@pulih.pintar.invalid") ? "tiada" : email}:${kode}`);
            return { error: o.authStatus ? { status: o.authStatus, code: "otp_expired", name: "AuthApiError" } : null, jeda: o.authStatus === 429 ? "40" : null };
          },
          beriIzin: async (id) => { jejak.push("izin"); izinUntuk = id; },
          catatGalat: () => {},
        });
        return { h, jejak, izinUntuk };
      };
      const benar = await periksa({ ada: true });
      c.expect(benar.h.status === 200 && benar.izinUntuk === "00000000-0000-0000-0000-0000000000a1" && benar.jejak.includes("selesai:OK")
        && benar.jejak.includes("auth:sari@uji.invalid:482913"), `a right code: ${JSON.stringify(benar)}`);
      const tiada = await periksa({ ada: false, authStatus: 403 });
      const salah = await periksa({ ada: true, authStatus: 403 });
      c.expect(JSON.stringify(tiada.h) === JSON.stringify(salah.h) && (tiada.h.body as { code?: string }).code === "KODE_TIDAK_COCOK"
        && tiada.jejak.some((j) => j.startsWith("auth:tiada:")) && tiada.izinUntuk === null && salah.izinUntuk === null,
        `nobody's name and a wrong code: ${JSON.stringify([tiada, salah])}; expected one answer, Auth asked both times, no grant`);
      const tiadaCocok = await periksa({ ada: false });
      c.expect((tiadaCocok.h.body as { code?: string }).code === "KODE_TIDAK_COCOK" && tiadaCocok.izinUntuk === null,
        "an Auth match for an address nobody has gave a grant");
      const rusak = await periksa({ ada: true, kodeSah: false });
      c.expect((rusak.h.body as { code?: string }).code === "KODE_TIDAK_COCOK" && rusak.jejak.length === 0, "a malformed code was counted or asked about");
      const tunggu = await periksa({ ada: true, tunggu: 90 });
      c.expect(tunggu.h.status === 429 && JSON.stringify(tunggu.h.body) === JSON.stringify({ ok: false, code: "KODE_TUNGGU", tunggu: 90 }) && !tunggu.jejak.some((j) => j.startsWith("auth")),
        `a counted-out name: ${JSON.stringify(tunggu)}`);
      const dibatasi = await periksa({ ada: true, authStatus: 429 });
      c.expect(JSON.stringify(dibatasi.h.body) === JSON.stringify({ ok: false, code: "KODE_DIBATASI", tunggu: 40 }) && dibatasi.jejak.includes("selesai:NOT_JUDGED"),
        `Auth's own limit: ${JSON.stringify(dibatasi)}`);

      // ── the new password
      const ganti = async (o: { izin: boolean; password?: string; authError?: { code: string; reasons?: string[] }; masukGagal?: boolean }) => {
        const jejak: string[] = []; const nanti: Array<() => Promise<void>> = [];
        const h = await p.gantiPasswordPemulihan({ origin: true, password: o.password ?? "Kuat-Sekali-2026" }, {
          izin: async () => { jejak.push("izin"); return o.izin ? { authUserId: "00000000-0000-0000-0000-0000000000a1", email: "sari@uji.invalid" } : null; },
          setel: async () => { jejak.push("setel"); return { error: o.authError ?? null }; },
          masuk: async () => { jejak.push("masuk"); return { error: o.masukGagal ? { status: 400, code: "invalid_credentials" } : null }; },
          buangIzin: async () => { jejak.push("buang"); },
          kabari: async () => { jejak.push("kabari"); },
          nanti: (k) => { nanti.push(k); },
          tujuan: async () => "/mengajar",
          catatGalat: () => {},
        });
        for (const k of nanti) await k();
        return { h, jejak };
      };
      const pendek = await ganti({ izin: true, password: "pendek" });
      c.expect((pendek.h.body as { code?: string }).code === "PASSWORD_LEMAH" && !pendek.jejak.includes("izin"), `a short password: ${JSON.stringify(pendek)}`);
      const habis = await ganti({ izin: false });
      c.expect(habis.h.status === 410 && (habis.h.body as { code?: string }).code === "PEMULIHAN_BERAKHIR" && habis.jejak.includes("buang") && !habis.jejak.includes("setel"),
        `no live grant: ${JSON.stringify(habis)}`);
      const bocor = await ganti({ izin: true, authError: { code: "weak_password", reasons: ["pwned"] } });
      c.expect(JSON.stringify(bocor.h.body) === JSON.stringify({ ok: false, code: "PASSWORD_LEMAH", alasan: ["BOCOR"] }) && !bocor.jejak.includes("buang"),
        `Auth's leaked-password refusal: ${JSON.stringify(bocor)}; the grant must stay for another try`);
      const jadi = await ganti({ izin: true });
      c.expect(jadi.h.status === 200 && (jadi.h.body as { tujuan?: string }).tujuan === "/mengajar"
        && JSON.stringify(jadi.jejak) === JSON.stringify(["izin", "setel", "buang", "masuk", "kabari"]),
        `the change: ${JSON.stringify(jadi)}; expected permit, write, the grant gone, sign-in, and the owner told after the answer`);
      const tanpaMasuk = await ganti({ izin: true, masukGagal: true });
      c.expect(tanpaMasuk.h.status === 200 && (tanpaMasuk.h.body as { tujuan?: string }).tujuan === "/masuk", "a changed password reported a failure when only the sign-in after it failed");
      return c.verdict("asking answers alike, waits first, sends for an active account only; checking asks Auth for nobody's name too, gives the grant only on a real match and never signs in; the new password keeps the rules, needs a live grant, spends it only when the write succeeds, signs this browser in and tells the owner after the answer");
    },
  },
  {
    id: "BOB27-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => tanpaKomentar(readFileSync(join(repoRoot, ...p), "utf8"));
      const periksa = baca("src", "app", "api", "masuk", "lupa", "periksa", "route.ts");
      c.expect(/persistSession:\s*false/.test(periksa) && /akhiriSesiVerifikasi\(layanan,\s*token\)/.test(periksa) && !/supabaseServer\(/.test(periksa),
        "the recovery check signs in, or keeps the session it made");
      const izin = baca("src", "app", "api", "masuk", "lupa", "_izin.ts");
      c.expect(/httpOnly:\s*true/.test(izin) && /sameSite:\s*"strict"/.test(izin) && /UMUR_DETIK = 600/.test(izin) && /createHash\("sha256"\)/.test(izin),
        "the grant is not an httpOnly, same-site, ten-minute cookie stored by its SHA-256");
      const sandi = baca("src", "app", "api", "masuk", "lupa", "password", "route.ts");
      c.expect(sandi.indexOf("recovery_grant_permit") > 0 && sandi.indexOf("recovery_grant_permit") < sandi.indexOf("updateUserById"),
        "the password is written other than after recovery_grant_permit");
      const kontrak = baca("src", "lib", "aktivasi-kontrak.ts");
      c.expect(/export const TAUTAN_MASUK_CADANGAN = false;/.test(kontrak), "the email link's switch is still on (C14)");
      const layar = baca("src", "components", "masuk", "LayarMasuk.tsx");
      c.expect(/href=\{HALAMAN_PEMULIHAN\}>\{s\("auth\.pw_lupa"\)\}/.test(layar), "«Lupa password?» does not lead to the recovery");
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["lupa.kode_terkirim", "lupa.kode_ulang_ok"] as const) {
          const kal = t(k, "public", { locale });
          c.expect(/sedang mengirim|is sending/i.test(kal) && !/sudah dikirim|has been sent/i.test(kal), `${locale} ${k} claims a send PINTAR has not made: «${kal}»`);
        }
      }
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261115100000_a_forgotten_password_is_recovered_by_email.sql"), "utf8");
      for (const pintu of ["/masuk/lupa/kode", "/masuk/lupa/periksa", "/masuk/lupa/password"]) {
        c.expect(new RegExp(`'ROUTE',\\s*'${pintu}'`).test(mig) && new RegExp(`'ENDPOINT',\\s*'/api${pintu}'`).test(mig), `${pintu} is not declared with its handler`);
      }
      return c.verdict("the check signs nobody in and ends the session it made; the grant is an httpOnly, same-site, ten-minute cookie kept by its SHA-256; the password is written only after the grant's permit; the email link's switch is off and «Lupa password?» is the recovery; the screens say PINTAR is sending; the three doors are declared");
    },
  },
  {
    id: "BOB27-D01",
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
      if (!c.expect(v.ada_aktif && v.ada_wajib && v.ada_kartu, `the fixture lacks an active, a required or a card account (${JSON.stringify(v)})`)) return c.verdict("");
      c.expect(v.email === 1 && v.username === 1, `an active account by its address (any case) ${v.email}, by its username (any case, spaced) ${v.username}; expected 1 and 1`);
      c.expect(v.wajib === 0 && v.kartu === 0 && v.tiada === 0 && v.kosong === 0,
        `an account still in activation ${v.wajib}, a class card ${v.kartu}, nobody ${v.tiada}, an empty name ${v.kosong}; expected none`);
      c.expect(v.beri_wajib === "RECOVERY_NOT_ELIGIBLE", `a grant for an account in activation was answered ${v.beri_wajib}`);
      c.expect(v.izin_jumlah === 1 && v.izin_t2 === true && v.audit_verified === 2,
        `grants ${v.izin_jumlah} (expected the newest only, ten minutes), audited ${v.audit_verified} (expected 2)`);
      c.expect(v.izin_lama === "RECOVERY_GRANT_INVALID", `a replaced grant gave a permit (${v.izin_lama})`);
      c.expect(v.tulis_tanpa === "PASSWORD_WRITE_REFUSED", `a password written with a grant but no permit: ${v.tulis_tanpa}`);
      c.expect(v.izin_untuk === true && v.tulis_dengan === null, `the grant's permit (${v.izin_untuk}) or its write (${v.tulis_dengan}) failed`);
      c.expect(v.izin_sesudah === 0 && v.permit_sesudah === 0 && v.audit_set === 1 && v.setup === "COMPLETE",
        `after the write: grants ${v.izin_sesudah}, permits ${v.permit_sesudah}, RECOVERY writes audited ${v.audit_set}, set-up ${v.setup}`);
      c.expect(v.izin_terpakai === "RECOVERY_GRANT_INVALID" && v.izin_lewat === "RECOVERY_GRANT_INVALID",
        `a spent grant (${v.izin_terpakai}) or an expired one (${v.izin_lewat}) gave a permit`);
      c.expect(!v.anon_target && !v.auth_target && !v.auth_beri && !v.auth_permit && v.service_permit && !v.baca_izin,
        `the grants: ${JSON.stringify({ anon_target: v.anon_target, auth_target: v.auth_target, auth_beri: v.auth_beri, auth_permit: v.auth_permit, service_permit: v.service_permit, baca_izin: v.baca_izin })}`);
      return c.verdict("an active account recovers by its address or username (any case), never one in activation, a card or nobody; a grant is one per person, ten minutes, audited, refused for an account in activation; only a live grant gives the permit; the write needs the permit and spends the grant and the permit, audited as RECOVERY; spent and expired grants give nothing; no client reaches any of it");
    },
  },
];
