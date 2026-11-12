/**
 * SIGN-IN BY A SUSPENDED, CLOSED OR ANONYMISED ACCOUNT · bounded correction of 4.0 behaviour (owner, 11 Nov 2026;
 * AUTH-SUSPENDED-SIGNIN-CORRECTION.md, «Tests»). Each method answers a locked account with ITS OWN ordinary mismatch
 * (per method): the same status and the same body as that method's wrong credential, whichever credential is given.
 * A genuine Auth failure stays the method's own "unavailable" answer. The lock is one named instant Auth can read
 * (public.akun_terkunci_sampai(), supabase/migrations/20270116130000), and the migration rewrites the old value.
 * These tests depend on no 4.1 object; the accountability event's outcome is B1-A04's (selftest/b1-layar.test.ts).
 *
 *   AUTH-K01  the decisions with their tools replaced (src/lib/aktivasi.ts, kartu-masuk.ts, pemulihan.ts): Auth's
 *             «user_banned» is each method's ordinary non-match, counted like one, logged once with a reference and no
 *             identifier; Auth unreachable is still 503 in each
 *   AUTH-A01  through the running app, with a person activated for the test and a class card made for the test: each
 *             method (password, card, activation code, recovery code, recovery PIN) against the account suspended,
 *             then reinstated (it works again), then closed, then anonymised, with the right and a wrong credential:
 *             the same status and body as the method's wrong credential on an active account; an unknown identifier
 *             unchanged; nothing of the test left live (role, session, suspension)
 *   AUTH-A03  L-1 (Sharon §6b): an activation outstanding for a suspended person creates no credential (the route, and
 *             the permit and Auth's admin write asked for directly); reinstated, the activation goes on. AUTH-A01 also
 *             holds her recovery-grant case: a grant from before a suspension is an expired grant's case in every field
 *             (answer, record, password), during the suspension and after reinstatement; a fresh recovery then works
 *   AUTH-A02  the migration on a database with no locked account, with one locked under the old 'infinity' (Auth fails:
 *             the route still answers 503), and run twice: afterwards the account is refused in the ordinary way and
 *             nothing else changed
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { Peramban, daftar, ipUji, kodeDari, lit, psql, sinkTunggu } from "./bob26.test";
import { aktifkan, pintarIdDari } from "./bob28.test";
import { pilihKonteksPeramban } from "./konteks-uji";

type Jawaban = { status: number; body: Record<string, unknown> | null };
const sama = (a: Jawaban, b: Jawaban) => a.status === b.status && JSON.stringify(a.body) === JSON.stringify(b.body);
const isi = (h: { body: unknown }) => h.body as Record<string, unknown>;
const tampil = (a: Jawaban) => `${a.status} ${JSON.stringify(a.body)}`;
const uidDari = (email: string) => psql(`select id from auth.users where email = ${lit(email)}`);
/** As one person, by their Auth user (the request's claims, as PostgREST sets them), in one committed transaction. */
const sebagaiUid = (uid: string, sql: string) => psql(`begin; set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', ${lit(uid)}, 'role', 'authenticated')::text, true);
  select set_config('request.jwt.claim.sub', ${lit(uid)}, true);
  ${sql}; commit;`);
const MIGRASI = "20270116130000_a_locked_account_is_locked_until_a_date_auth_can_read.sql";
/** The B1 store, when this tree has one (the test depends on no 4.1 object): where its ids stand, and its rows gone. */
const adaB1 = () => psql("select to_regclass('public.accountability_events') is not null") === "t";
const titikB1 = () => adaB1() ? Number(psql("select case when is_called then last_value else last_value - 1 end from public.accountability_events_id_seq")) : 0;
function buangB1(dari: number): string {
  if (!adaB1()) return "0";
  psql(`begin; set local session_replication_role = replica; delete from public.accountability_events where id > ${dari}; commit;`);
  return psql(`select count(*) from public.accountability_events where id > ${dari}`);
}
/** The harness's own hand: a closed person's lock lifted at the end (never a product path), so nothing stays live. */
function lepaskan(orang: string, sys: string) {
  psql(`begin; set local session_replication_role = replica;
    update public.person_suspensions set ended_at = now(), ended_by = (select a.person_id from public.accounts a where a.auth_user_id = ${lit(sys)}),
           end_reason = 'uji: dibersihkan oleh harness' where person_id = ${lit(orang)} and ended_at is null;
    update auth.users set banned_until = null where id in (select a.auth_user_id from public.accounts a where a.person_id = ${lit(orang)});
    update public.role_assignments set revoked_at = now() where person_id = ${lit(orang)} and revoked_at is null;
    delete from auth.sessions where user_id in (select a.auth_user_id from public.accounts a where a.person_id = ${lit(orang)});
    commit;`);
}
const sisaHidup = (orang: string) => psql(`select (select count(*) from public.role_assignments where person_id = ${lit(orang)} and revoked_at is null)
  || '/' || (select count(*) from auth.sessions s join public.accounts a on a.auth_user_id = s.user_id where a.person_id = ${lit(orang)})
  || '/' || (select count(*) from public.person_suspensions where person_id = ${lit(orang)} and ended_at is null)
  || '/' || (select count(*) from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = ${lit(orang)} and u.banned_until is not null)`);

export const akunTerkunciTests: SelfTest[] = [
  {
    id: "AUTH-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      process.env.CARD_PEPPER ??= "auth-k01-pepper-for-the-key-shape-only-32";
      const a = await import("../src/lib/aktivasi");
      const k = await import("../src/lib/kartu-masuk");
      const p = await import("../src/lib/pemulihan");
      const TERKUNCI = { status: 400, code: "user_banned", name: "AuthApiError" };
      const TERKUNCI_403 = { status: 403, code: "user_banned", name: "AuthApiError" };
      const PUTUS = { status: 0, name: "AuthRetryableFetchError" };
      const RAHASIA = ["ina.uji@local.invalid", "Ina-Rahasia-1!", "7001", "2468", "482913", "ina.uji"];
      const bersih = (log: string[]) => !log.some((l) => RAHASIA.some((r) => l.includes(r)));
      const terkunciDicatat = (log: string[]) => log.length === 1 && /locked/i.test(log[0]) && /^[A-Z0-9]{6}$/.test(log[0].split(" ")[0]) && bersih(log);

      // 1. the password
      const sandi = async (galat: { status?: number; code?: string; name?: string }) => {
        const log: string[] = []; const selesai: string[] = []; const t = { n: 0 };
        const h = await a.masukPassword({ origin: true, identitas: "ina.uji@local.invalid", password: "Ina-Rahasia-1!", lanjut: null }, {
          resolusi: async () => "ina.uji@local.invalid", catat: async () => 0, selesaikan: async (_k, x) => { selesai.push(x); },
          masuk: async () => ({ error: galat }), keadaan: async () => "COMPLETE", tujuan: async () => "/", tunggu: async (ms) => { t.n += ms; },
          sekarang: () => t.n, catatGalat: (ref, apa) => log.push(`${ref} ${apa}`) });
        return { h, log, selesai };
      };
      const sSalah = await sandi({ status: 400, code: "invalid_credentials", name: "AuthApiError" });
      for (const [apa, g] of [["user_banned (400)", TERKUNCI], ["user_banned (403)", TERKUNCI_403]] as const) {
        const s = await sandi(g);
        c.expect(JSON.stringify(s.h) === JSON.stringify(sSalah.h), `password, ${apa}: ${JSON.stringify(s.h)}, a wrong password ${JSON.stringify(sSalah.h)}`);
        c.expect(s.selesai.length === 0, `password, ${apa}: the attempt was taken back (${s.selesai.join(",")}); a wrong password counts`);
        c.expect(terkunciDicatat(s.log), `password, ${apa}: the true reason is not logged once with a reference and no identifier: ${JSON.stringify(s.log)}`);
      }
      c.expect(sSalah.log.length === 0, "password: a wrong password is logged as a locked account");
      const sPutus = await sandi(PUTUS);
      c.expect(sPutus.h.status === 503 && isi(sPutus.h).code === "LAYANAN_TIDAK_TERSEDIA", `password, Auth unreachable → ${JSON.stringify(sPutus.h)}`);

      // 2. a code (activation and recovery)
      const kode = async (galat: object | null, pulih: boolean) => {
        const log: string[] = []; const selesai: string[] = [];
        const alat = { catat: async () => 0, selesaikan: async (_k: string, x: string) => { selesai.push(x); },
          verifikasi: async () => ({ error: galat }), catatGalat: (ref: string, apa: string) => log.push(`${ref} ${apa}`) };
        const h = pulih
          ? await p.periksaKodePemulihan({ origin: true, nama: "ina.uji", kode: "482 913" }, {
              ...alat, sasaran: async () => ({ authUserId: "00000000-0000-0000-0000-000000000001", email: "ina.uji@local.invalid" }), beriIzin: async () => {} })
          : await a.verifikasiKode({ origin: true, email: "ina.uji@local.invalid", kode: "482 913" }, {
              ...alat, keadaan: async () => "COMPLETE", tujuan: async () => "/" });
        return { h, log, selesai };
      };
      for (const pulih of [false, true]) {
        const nama = pulih ? "recovery code" : "activation code";
        const salah = await kode({ status: 403, code: "otp_expired", name: "AuthApiError" }, pulih);
        const kunci = await kode(TERKUNCI_403, pulih);
        c.expect(JSON.stringify(kunci.h) === JSON.stringify(salah.h) && isi(salah.h).code === "KODE_TIDAK_COCOK",
          `${nama}, user_banned: ${JSON.stringify(kunci.h)}, a wrong code ${JSON.stringify(salah.h)}`);
        c.expect(kunci.selesai.length === 0, `${nama}, user_banned: the attempt was taken back`);
        c.expect(terkunciDicatat(kunci.log), `${nama}, user_banned: not logged once without the identifier: ${JSON.stringify(kunci.log)}`);
        const putus = await kode(PUTUS, pulih);
        c.expect(putus.h.status === 503 && isi(putus.h).code === "LAYANAN_TIDAK_TERSEDIA", `${nama}, Auth unreachable → ${JSON.stringify(putus.h)}`);
      }

      // 3. the card
      const kartu = async (galat: object) => {
        const log: string[] = []; const selesai: string[] = [];
        const h = await k.masukDenganKartu({ origin: true, kartu: "7001", pin: "2468", lanjut: null }, {
          catat: async () => 0, selesaikan: async (_k, x) => { selesai.push(x); }, masuk: async () => ({ error: galat }),
          tujuan: async () => "/", bukanStaf: async () => true, keluar: async () => {}, catatGalat: (ref, apa) => log.push(`${ref} ${apa}`) });
        return { h, log, selesai };
      };
      const kSalah = await kartu({ status: 400, code: "invalid_credentials", name: "AuthApiError" });
      const kKunci = await kartu(TERKUNCI);
      c.expect(JSON.stringify(kKunci.h) === JSON.stringify(kSalah.h) && isi(kSalah.h).code === "CARD_NOT_MATCHED",
        `card, user_banned: ${JSON.stringify(kKunci.h)}, a wrong PIN ${JSON.stringify(kSalah.h)}`);
      c.expect(kKunci.selesai.length === 0 && terkunciDicatat(kKunci.log), `card, user_banned: taken back or not logged as it should be: ${JSON.stringify(kKunci)}`);
      const kPutus = await kartu(PUTUS);
      c.expect(kPutus.h.status === 503 && isi(kPutus.h).code === "CARD_UNAVAILABLE", `card, Auth unreachable → ${JSON.stringify(kPutus.h)}`);

      // 4. the new password after recovery: the sign-in after it, refused as locked, is the ordinary «sign in again»
      const baru = async (galat: object | null) => {
        const log: string[] = [];
        const h = await p.gantiPasswordPemulihan({ origin: true, password: "Kata-Sandi-Baru-2026!" }, {
          izin: async () => ({ authUserId: "00000000-0000-0000-0000-000000000001", email: "ina.uji@local.invalid" }),
          setel: async () => ({ error: null }), masuk: async () => ({ error: galat as never }), buangIzin: async () => {},
          kabari: async () => {}, nanti: () => {}, tujuan: async () => "/mulai", catatGalat: (ref, apa) => log.push(`${ref} ${apa}`) });
        return { h, log };
      };
      const bSalah = await baru({ status: 400, code: "invalid_credentials", name: "AuthApiError" });
      const bKunci = await baru(TERKUNCI);
      c.expect(JSON.stringify(bKunci.h) === JSON.stringify(bSalah.h) && isi(bSalah.h).ok === true && isi(bSalah.h).tujuan === "/masuk",
        `recovery's new password, user_banned: ${JSON.stringify(bKunci.h)}, a refused sign-in ${JSON.stringify(bSalah.h)}`);
      c.expect(terkunciDicatat(bKunci.log), `recovery's new password, user_banned: not logged once without the identifier: ${JSON.stringify(bKunci.log)}`);
      return c.verdict("Auth's «user_banned» (400 or 403) is, in the password, activation code, recovery code and card decisions, exactly the method's "
        + "own non-match (MASUK_TIDAK_COCOK, KODE_TIDAK_COCOK, CARD_NOT_MATCHED), counted and never taken back, and logged once with a reference "
        + "and no identifier; after recovery's new password it is the ordinary «sign in again»; Auth unreachable stays 503 in each");
    },
  },
];

export const akunTerkunciAppTests: SelfTest[] = [
  {
    id: "AUTH-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `auth-ina-${tag}@local.invalid`, username = `ina.${tag}`, PIN = "2817";
      const sys = uidDari("sysadmin@synthetic.pintar.test");
      const awal = titikB1();
      const orang = await daftar(asal, "Ina Kusumawati", email);
      const sandi = await aktifkan(c, asal, email, username, PIN);
      let murid = "";
      let pidAkhir = "";
      try {
        if (!sandi) return c.verdict("");
        let sandiKini = sandi;
        const uid = uidDari(email);
        const pid = pintarIdDari(email);
        pidAkhir = pid;
        const tiadaId = `${randomBytes(8).toString("hex").slice(0, 7).toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g, "Z")}Z`;
        // a learner with a class card, of a synthetic school of its own (B4-KARTU-A01's)
        const nama = `Murid Kunci ${tag}`;
        murid = psql(`
          do $$ declare v_p uuid; v_inst uuid; begin
            perform set_config('app.seed_intent', 'synthetic', true);
            insert into public.institutions (name, slug, is_synthetic, is_active)
            values (${lit(`Sekolah Kunci ${tag}`)}, ${lit(`sekolah-kunci-${tag}`)}, true, true) returning id into v_inst;
            update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                        where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
             where id = v_inst;
            insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
            perform public.issue_institutional_id(v_p, v_inst);
          end $$;
          select id from public.persons where display_name = ${lit(nama)};`).split("\n").pop()!;
        const admin = new Peramban(asal, ipUji());
        await admin.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
        await pilihKonteksPeramban(admin, "MENGELOLA:PLATFORM");
        const buat = await admin.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
        await admin.kirim("/keluar", { method: "POST" });
        const kartu = (buat.body as { card?: string; pin?: string } | null) ?? {};
        if (!c.expect(buat.status === 200 && /^\d{10}$/.test(kartu.card ?? ""), `the card could not be made (${buat.status})`)) return c.verdict("");
        const pinSalah = kartu.pin === "1357" ? "9753" : "1357";

        const pakai = (path: string, form: Record<string, string>) => new Peramban(asal, ipUji()).jsonDari(path, { form });
        const ladderNol = () => psql(`delete from public.recovery_ladder where typed_id = ${lit(pid)}`);
        const salahKode = "000000";
        // the ordinary mismatch of each method, on the active accounts, and an identifier nobody has
        const dasar = {
          sandi: await pakai("/masuk/password", { identitas: email, password: `${sandi}-salah` }),
          kartu: await pakai("/masuk/kartu", { kartu: kartu.card!, pin: pinSalah }),
          aktivasi: await pakai("/aktifkan/periksa", { email, kode: salahKode }),
          pulih: await pakai("/masuk/lupa/periksa", { nama: username, kode: salahKode }),
          pin: await pakai("/masuk/lupa/pin", { id: pid, pin: "1357" }),
        };
        const tiada = {
          sandi: await pakai("/masuk/password", { identitas: `auth-tiada-${tag}@local.invalid`, password: "Apa-Saja-2026!" }),
          kartu: await pakai("/masuk/kartu", { kartu: "1099887766", pin: pinSalah }),
          aktivasi: await pakai("/aktifkan/periksa", { email: `auth-tiada-${tag}@local.invalid`, kode: salahKode }),
          pulih: await pakai("/masuk/lupa/periksa", { nama: `auth.tiada.${tag}`, kode: salahKode }),
          pin: await pakai("/masuk/lupa/pin", { id: tiadaId, pin: "1357" }),
        };
        ladderNol();
        const harap = { sandi: [401, "MASUK_TIDAK_COCOK"], kartu: [401, "CARD_NOT_MATCHED"], aktivasi: [400, "KODE_TIDAK_COCOK"], pulih: [400, "KODE_TIDAK_COCOK"], pin: [400, "PIN_TIDAK_COCOK"] } as const;
        for (const m of Object.keys(dasar) as Array<keyof typeof dasar>) {
          c.expect(dasar[m].status === harap[m][0] && dasar[m].body?.code === harap[m][1] && sama(dasar[m], tiada[m]),
            `${m}: a wrong credential ${tampil(dasar[m])} and an unknown identifier ${tampil(tiada[m])} are not the one ordinary mismatch (unchanged)`);
        }

        // each method against the account in one state, with the right and a wrong credential
        const periksa = async (keadaan: string, alamat: string, kartuJuga: boolean) => {
          const hasil: Array<[string, Jawaban, Jawaban]> = [];
          hasil.push(["password (right)", await pakai("/masuk/password", { identitas: alamat, password: sandiKini }), dasar.sandi]);
          hasil.push(["password (wrong)", await pakai("/masuk/password", { identitas: alamat, password: `${sandiKini}-salah` }), dasar.sandi]);
          if (alamat === email) hasil.push(["password by username", await pakai("/masuk/password", { identitas: username, password: sandiKini }), dasar.sandi]);
          hasil.push(["activation code (wrong)", await pakai("/aktifkan/periksa", { email: alamat, kode: salahKode }), dasar.aktivasi]);
          // by username for the account's own address (the code counter is per name typed, and the address's is spent on the right code)
          hasil.push(["recovery code (wrong)", await pakai("/masuk/lupa/periksa", { nama: alamat === email ? username : alamat, kode: salahKode }), dasar.pulih]);
          hasil.push(["recovery PIN (right)", await pakai("/masuk/lupa/pin", { id: pid, pin: PIN }), dasar.pin]);
          ladderNol();
          if (kartuJuga) {
            hasil.push(["card (right PIN)", await pakai("/masuk/kartu", { kartu: kartu.card!, pin: kartu.pin! }), dasar.kartu]);
            hasil.push(["card (wrong PIN)", await pakai("/masuk/kartu", { kartu: kartu.card!, pin: pinSalah }), dasar.kartu]);
          }
          for (const [apa, r, d] of hasil) c.expect(sama(r, d), `${keadaan}, ${apa}: ${tampil(r)}; the method's own mismatch is ${tampil(d)}`);
        };

        // RESTATED, L-1 (Sharon §6b, her corrected expectation): a grant from before a suspension, used during it, is a
        // genuinely expired grant's case in every field. The baseline: a grant of the active account, expired, used from the
        // same network as the locked one's below, so even the recorded origin must agree.
        const ipIzin = ipUji();
        const izinBaru = () => {
          const t = randomBytes(32).toString("base64url");
          psql(`select public.recovery_grant_issue(${lit(uid)}, encode(sha256(convert_to(${lit(t)}, 'UTF8')), 'hex'), 'PIN')`);
          return t;
        };
        const pakaiIzin = async (token: string, password: string) => {
          const b = new Peramban(asal, ipIzin);
          b.kue.set("pintar_pulih", token);
          const titik = titikB1();
          const h = await b.jsonDari("/masuk/lupa/password", { form: { password } });
          // every column but the row's own id and time
          const baris = adaB1() ? psql(`select coalesce(string_agg(concat_ws(' | ', kind, method, coalesce(person_id::text, '-'),
              coalesce(identifier_hash, '-'), institution_ids::text, outcome, coalesce(network_origin, '-'), coalesce(resource::text, '-'),
              coalesce(print_ref, '-')), ';' order by id), '') from public.accountability_events where id > ${titik}`) : "";
          return { h, baris };
        };
        const hashSandi = () => psql(`select coalesce(md5(encrypted_password), '-') from auth.users where id = ${lit(uid)}`);
        const kedaluwarsa = izinBaru();
        psql(`update public.password_recovery_grants set expires_at = clock_timestamp() - interval '1 second' where auth_user_id = ${lit(uid)}`);
        const sandiAwal = hashSandi();
        const dasarIzin = await pakaiIzin(kedaluwarsa, `Ina-Basi-${randomBytes(6).toString("hex")}`);
        c.expect(dasarIzin.h.status === 410 && JSON.stringify(dasarIzin.h.body) === JSON.stringify({ ok: false, code: "PEMULIHAN_BERAKHIR" })
          && hashSandi() === sandiAwal, `an expired grant: ${tampil(dasarIzin.h)}, or the password changed (unchanged rule)`);
        if (adaB1()) c.expect(/^SIGN_IN_FAILED \| PASSWORD \| - \| - \| \{\} \| PEMULIHAN_BERAKHIR \| [^;|]+ \| - \| -$/.test(dasarIzin.baris),
          `an expired grant was recorded «${dasarIzin.baris}», not a failure naming no one, with no school`);
        // the grant obtained before the suspension (planted as recovery_grant_issue gives it after a right PIN)
        const izinToken = izinBaru();
        // 1. suspended (the staff member and the learner)
        sebagaiUid(sys, `select public.tangguhkan_akun(${lit(orang)}, 'SECURITY', 'uji auth: akun diduga diambil alih')`);
        sebagaiUid(sys, `select public.tangguhkan_akun(${lit(murid)}, 'ADMINISTRATIVE', 'uji auth: kartu ditahan sementara')`);
        await periksa("suspended", email, true);
        // a code that is the right one (issued by Auth as PINTAR's own email issues it, through the admin link): the
        // ordinary mismatch too, at the recovery door and at the activation door
        const kodeAuth = async () => {
          const r = await fetch(`${ctx.supabaseUrl}/auth/v1/admin/generate_link`, { method: "POST",
            headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "content-type": "application/json" },
            body: JSON.stringify({ type: "magiclink", email }) });
          return String(((await r.json().catch(() => ({}))) as { email_otp?: string }).email_otp ?? "");
        };
        const benar1 = await kodeAuth();
        c.expect(/^\d{6}$/.test(benar1), "Auth issued no code for the suspended account to try");
        const rk = await pakai("/masuk/lupa/periksa", { nama: email, kode: benar1 });
        c.expect(sama(rk, dasar.pulih), `suspended, recovery code (right): ${tampil(rk)}; a wrong code is ${tampil(dasar.pulih)}`);
        const ra = await pakai("/aktifkan/periksa", { email, kode: await kodeAuth() });
        c.expect(sama(ra, dasar.aktivasi), `suspended, activation code (right): ${tampil(ra)}; a wrong code is ${tampil(dasar.aktivasi)}`);
        // the grant from before the suspension, used now (RESTATED, L-1, Sharon §6b): exactly an expired grant's answer and
        // record, field by field; the password byte-identical (the permit refuses a locked person's grant)
        const sebelumIzin = hashSandi();
        const izinTerkunci = await pakaiIzin(izinToken, `Ina-Baru-${randomBytes(6).toString("hex")}`);
        c.expect(sama(izinTerkunci.h, dasarIzin.h), `suspended, a grant from before used after: ${tampil(izinTerkunci.h)}; an expired grant is ${tampil(dasarIzin.h)}`);
        c.expect(hashSandi() === sebelumIzin, "suspended, a grant from before used after changed the password");
        if (adaB1()) c.expect(izinTerkunci.baris === dasarIzin.baris,
          `suspended, a grant from before used after was recorded «${izinTerkunci.baris}»; an expired grant «${dasarIzin.baris}»: a school admin could tell them apart`);
        // 2. reinstated: refused, then works (each method that signs in)
        sebagaiUid(sys, `select public.aktifkan_kembali_akun(${lit(orang)}, 'uji auth: akun sudah aman kembali')`);
        sebagaiUid(sys, `select public.aktifkan_kembali_akun(${lit(murid)}, 'uji auth: kartu dipakai kembali')`);
        const p1 = new Peramban(asal, ipUji());
        const lagi = await p1.jsonDari("/masuk/password", { form: { identitas: email, password: sandiKini } });
        await p1.kirim("/keluar", { method: "POST" });
        const k1 = new Peramban(asal, ipUji());
        const kLagi = await k1.jsonDari("/masuk/kartu", { form: { kartu: kartu.card!, pin: kartu.pin! } });
        await k1.kirim("/keluar", { method: "POST" });
        c.expect(lagi.status === 200 && lagi.body?.ok === true, `reinstated, the password does not sign in again: ${tampil(lagi)}`);
        c.expect(kLagi.status === 200 && kLagi.body?.ok === true, `reinstated, the card does not sign in again: ${tampil(kLagi)}`);
        // L-1 (Sharon §6b): reinstated, the grant from before the suspension is still no grant (a lock covered its life),
        // and a fresh recovery works: the password is set and this browser signs in with it
        const sebelumLama = hashSandi();
        const izinLama = await pakaiIzin(izinToken, `Ina-Lama-${randomBytes(6).toString("hex")}`);
        c.expect(sama(izinLama.h, dasarIzin.h) && hashSandi() === sebelumLama && (!adaB1() || izinLama.baris === dasarIzin.baris),
          `reinstated, the grant from before the suspension: ${tampil(izinLama.h)}, «${izinLama.baris}»; an expired grant is ${tampil(dasarIzin.h)}, «${dasarIzin.baris}»`);
        const segar = `Ina-Segar-${randomBytes(6).toString("hex")}`;
        const izinSegar = await pakaiIzin(izinBaru(), segar);
        c.expect(izinSegar.h.status === 200 && isi(izinSegar.h).ok === true && isi(izinSegar.h).tujuan !== "/masuk" && hashSandi() !== sebelumLama,
          `reinstated, a fresh recovery: ${tampil(izinSegar.h)}; a new password that signs in is expected`);
        if (adaB1()) c.expect(/^SIGN_IN_OK \| PASSWORD \| [0-9a-f-]{36} \| /.test(izinSegar.baris), `reinstated, a fresh recovery was recorded «${izinSegar.baris}»`);
        sandiKini = segar;
        // 3. closed at the person's own request (with a deletion request for step 4)
        sebagaiUid(uid, "select public.minta_akun('DELETE_PERSONAL_DATA', true)");
        sebagaiUid(uid, "select public.minta_akun('CLOSE', true)");
        await periksa("closed", email, false);
        // 4. anonymised (L4): the retired address is the account's now; the old one is nobody's
        const req = psql(`select id from public.account_requests where person_id = ${lit(orang)} and kind = 'DELETE_PERSONAL_DATA'`);
        sebagaiUid(sys, `select public.hapus_data_pribadi(${lit(req)}, null)`);
        const anonim = psql(`select email from auth.users where id = ${lit(uid)}`);
        c.expect(anonim !== email && anonim.startsWith("anonim-"), `the address was not retired (${anonim})`);
        await periksa("anonymised", anonim, false);
        const lama = await pakai("/masuk/password", { identitas: email, password: sandiKini });
        c.expect(sama(lama, dasar.sandi), `anonymised, the old address: ${tampil(lama)}; a wrong password is ${tampil(dasar.sandi)}`);
        c.expect(psql(`select isfinite(banned_until) and banned_until > now() + interval '500 years' from auth.users where id = ${lit(uid)}`) === "t",
          "the closed account is not locked until a far-future instant Auth can read");
      } finally {
        if (pidAkhir) psql(`delete from public.recovery_ladder where typed_id = ${lit(pidAkhir)}`);
        lepaskan(orang, sys);
        if (murid) lepaskan(murid, sys);
        const sisa = buangB1(awal);
        const hidup = `${sisaHidup(orang)} ${murid ? sisaHidup(murid) : "0/0/0/0"}`;
        c.expect(sisa === "0" && hidup === "0/0/0/0 0/0/0/0", `the test left ${sisa} event row(s) and role/session/suspension/lock ${hidup} behind`);
      }
      return c.verdict("with a person activated for the test and a class card made for it, each method (password by address and by username, the card, "
        + "an activation code, a recovery code, the recovery PIN) answered the account suspended, closed and anonymised, with the right and a wrong "
        + "credential, with exactly its own ordinary mismatch (status and body of a wrong credential on an active account); a wrong credential and "
        + "an unknown identifier are unchanged; reinstated, the password and the card sign in again; the old address of the anonymised account is "
        + "nobody's; nothing of the test is left live");
    },
  },
  {
    id: "AUTH-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const berkas = join(ctx.repoRoot, "supabase", "migrations", MIGRASI);
      if (!c.expect(existsSync(berkas), `the rewrite migration ${MIGRASI} is not in the tree`)) return c.verdict("");
      // the file is run again here: it must still be the last word on what it defines, or running it would undo a later one
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const lebihBaru = readdirSync(dir).filter((f) => f.endsWith(".sql") && f > MIGRASI)
        .filter((f) => /function public\.(akun_kunci|recovery_attempt|akun_terkunci_sampai)\(/.test(readFileSync(join(dir, f), "utf8")));
      if (!c.expect(lebihBaru.length === 0, `a later migration redefines what ${MIGRASI} defines (${lebihBaru.join(", ")}): restate this test before running the file again`)) return c.verdict("");
      const jalankan = () => {
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "--single-transaction", "-f", berkas, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
        return r.status === 0 ? "OK" : (r.stderr || "").trim().split("\n").pop() ?? "failed";
      };
      const potret = () => psql("select coalesce(md5(string_agg(id::text || ':' || coalesce(banned_until::text, '-'), ',' order by id)), '') from auth.users");
      const tag = randomBytes(4).toString("hex");
      const email = `auth-lama-${tag}@local.invalid`, sandi = `Auth-Lama-${tag}-2026!`;
      const sys = uidDari("sysadmin@synthetic.pintar.test");
      const awal = titikB1();
      // an activated staff member of Alpha, planted directly (B1-A04's), so no mail is needed
      const orang = psql(`do $$ declare v_u uuid := gen_random_uuid(); v_p uuid; v_node uuid; begin
        insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                                confirmation_token, recovery_token, email_change_token_new, email_change)
        values (v_u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${lit(email)}, extensions.crypt(${lit(sandi)}, extensions.gen_salt('bf', 4)), now(),
                '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', 'Lama ' || ${lit(tag)}), now(), now(), '', '', '', '');
        insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (gen_random_uuid(), v_u, v_u::text, jsonb_build_object('sub', v_u::text, 'email', ${lit(email)}, 'email_verified', true), 'email', now(), now(), now());
        select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
        update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
         where account_id = (select a.id from public.accounts a where a.auth_user_id = v_u);
        select ra.scope_node_id into v_node from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id join auth.users u on u.id = a.auth_user_id
         where u.email = 'alpha-guru@synthetic.pintar.test' and ra.role = 'EDUCATOR' limit 1;
        perform set_config('app.seed_intent', 'synthetic', true);
        insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) values (v_p, 'EDUCATOR', v_node, now() - interval '1 day', now() + interval '365 days');
      end $$; select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`).split("\n").pop() ?? "";
      const uid = uidDari(email);
      const coba = (s: string) => new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: s } });
      try {
        const salah = await coba(`${sandi}-salah`);
        c.expect(salah.status === 401 && salah.body?.code === "MASUK_TIDAK_COCOK", `a wrong password first: ${tampil(salah)}`);
        // (a) no account locked with the old value: the migration changes nothing
        c.expect(psql("select count(*) from auth.users where banned_until = 'infinity'") === "0", "an account is already on the old value before the test");
        const sebelum = potret();
        const a = jalankan();
        c.expect(a === "OK" && potret() === sebelum, `on a database with no old value the migration answered «${a}» or changed a lock`);
        // (b) one account locked as before the correction: Auth fails on it, and the route says so (503, not a mismatch)
        sebagaiUid(sys, `select public.tangguhkan_akun(${lit(orang)}, 'SECURITY', 'uji auth: nilai kunci lama')`);
        psql(`update auth.users set banned_until = 'infinity'::timestamptz where id = ${lit(uid)}`);
        const gagal = await coba(sandi);
        c.expect(gagal.status === 503 && gagal.body?.code === "LAYANAN_TIDAK_TERSEDIA",
          `Auth failing on the old value is not the route's 503: ${tampil(gagal)} (a real Auth failure must not become a mismatch)`);
        const lainSebelum = psql(`select coalesce(md5(string_agg(id::text || ':' || coalesce(banned_until::text, '-'), ',' order by id)), '') from auth.users where id <> ${lit(uid)}`);
        const b = jalankan();
        c.expect(b === "OK" && psql(`select banned_until = public.akun_terkunci_sampai() from auth.users where id = ${lit(uid)}`) === "t"
          && psql("select count(*) from auth.users where banned_until = 'infinity'") === "0",
          `the migration did not rewrite the old value to the one instant («${b}»)`);
        c.expect(psql(`select coalesce(md5(string_agg(id::text || ':' || coalesce(banned_until::text, '-'), ',' order by id)), '') from auth.users where id <> ${lit(uid)}`) === lainSebelum,
          "the migration changed another account's lock");
        const benar = await coba(sandi);
        const salah2 = await coba(`${sandi}-salah`);
        c.expect(sama(benar, salah) && sama(salah2, salah), `after the rewrite the right password ${tampil(benar)} and a wrong one ${tampil(salah2)} are not a wrong password's ${tampil(salah)}`);
        // (c) run twice: nothing left to rewrite, nothing changed
        const kedua = potret();
        const d = jalankan();
        c.expect(d === "OK" && potret() === kedua, `run a second time the migration answered «${d}» or changed a lock`);
        // reinstated: it works again
        sebagaiUid(sys, `select public.aktifkan_kembali_akun(${lit(orang)}, 'uji auth: nilai kunci lama dibuka')`);
        const p = new Peramban(asal, ipUji());
        const ok = await p.jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
        await p.kirim("/keluar", { method: "POST" });
        c.expect(ok.status === 200 && ok.body?.ok === true, `reinstated after the rewrite, the password does not sign in: ${tampil(ok)}`);
      } finally {
        lepaskan(orang, sys);
        const sisa = buangB1(awal);
        const hidup = sisaHidup(orang);
        c.expect(sisa === "0" && hidup === "0/0/0/0", `the test left ${sisa} event row(s) and role/session/suspension/lock ${hidup} behind`);
      }
      return c.verdict("the migration run on a database with no account on the old value changed nothing; with one locked as before (banned_until "
        + "'infinity'), Auth failed and the route answered 503, not a mismatch; the migration rewrote that one to akun_terkunci_sampai() and no "
        + "other; the right and a wrong password were then exactly a wrong password's answer; run a second time it changed nothing; reinstated, "
        + "the account signs in; nothing of the test is left live");
    },
  },
  {
    id: "AUTH-A03",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      // L-1 (Sharon §6b): an activation outstanding for a locked person creates no credential. The wizard's session is
      // ended by the lock, so the route answers as for any locked person in the wizard; and the two calls the route
      // makes (the ACTIVATION permit, then Auth's admin password write) are made directly, as in the moment between a
      // lock committing and the route's permit, and neither gives a password.
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `auth-tari-${tag}@local.invalid`;
      const sys = uidDari("sysadmin@synthetic.pintar.test");
      const awal = titikB1();
      const orang = await daftar(asal, "Tari Wulandari", email);
      try {
        const w = new Peramban(asal, ipUji());
        await w.jsonDari("/aktifkan/kode", { form: { email } });
        const masuk = await w.jsonDari("/aktifkan/periksa", { form: { email, kode: kodeDari((await sinkTunggu(email, 1))[0]) } });
        const uid = uidDari(email);
        if (!c.expect(masuk.status === 200 && /^[0-9a-f-]{36}$/.test(uid), `the activation could not start (${tampil(masuk)})`)) return c.verdict("");
        const hash = () => psql(`select coalesce(md5(encrypted_password), '-') from auth.users where id = ${lit(uid)}`);
        const izin = () => psql(`create function pg_temp.coba(u uuid) returns text language plpgsql as $f$
            declare d text; begin perform public.password_write_permit(u, 'ACTIVATION'); return 'OK';
            exception when others then get stacked diagnostics d = pg_exception_detail; return coalesce(nullif(d, ''), sqlstate); end $f$;
          select pg_temp.coba(${lit(uid)});`).split("\n").pop();
        const tulisAuth = async (password: string) => (await fetch(`${ctx.supabaseUrl}/auth/v1/admin/users/${uid}`, { method: "PUT",
          headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "content-type": "application/json" },
          body: JSON.stringify({ password }) })).status;
        const awalSandi = hash();
        sebagaiUid(sys, `select public.tangguhkan_akun(${lit(orang)}, 'SECURITY', 'uji auth: aktivasi diduga diambil alih')`);
        // through the route: the wizard's session ended with the lock
        const r = await w.jsonDari("/api/aktifkan/password", { form: { password: `Tari-Baru-${randomBytes(6).toString("hex")}` } });
        const tanpaSesi = await new Peramban(asal, ipUji()).jsonDari("/api/aktifkan/password", { form: { password: `Tari-Asing-${randomBytes(6).toString("hex")}` } });
        c.expect(r.status === 401 && sama(r, tanpaSesi) && hash() === awalSandi,
          `suspended, the activation's password step: ${tampil(r)}; a browser that never signed in gets ${tampil(tanpaSesi)}, and nothing is written`);
        // the route's own two calls, as in the moment after the lock
        const jawab = izin();
        c.expect(jawab === "ACCOUNT_LOCKED", `suspended, the ACTIVATION permit answered «${jawab}», not ACCOUNT_LOCKED`);
        const st = await tulisAuth(`Tari-Lain-${randomBytes(6).toString("hex")}`);
        c.expect(st >= 400 && hash() === awalSandi, `suspended, Auth's admin password write answered ${st}, or the password changed: a credential was created`);
        // reinstated: the activation goes on as before
        sebagaiUid(sys, `select public.aktifkan_kembali_akun(${lit(orang)}, 'uji auth: aktivasi aman kembali')`);
        const w2 = new Peramban(asal, ipUji());
        // a fresh code as PINTAR's own email issues it (Auth's admin link; a second email would wait out the resend interval)
        const gl = await fetch(`${ctx.supabaseUrl}/auth/v1/admin/generate_link`, { method: "POST",
          headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "content-type": "application/json" },
          body: JSON.stringify({ type: "magiclink", email }) });
        const kode2 = String(((await gl.json().catch(() => ({}))) as { email_otp?: string }).email_otp ?? "");
        const masuk2 = await w2.jsonDari("/aktifkan/periksa", { form: { email, kode: kode2 } });
        const p2 = await w2.jsonDari("/api/aktifkan/password", { form: { password: `Tari-Pulih-${randomBytes(6).toString("hex")}` } });
        c.expect(masuk2.status === 200 && p2.status === 200 && p2.body?.ok === true && hash() !== awalSandi,
          `reinstated, the activation does not go on: ${tampil(masuk2)}, ${tampil(p2)}`);
        await w2.kirim("/keluar", { method: "POST" });
      } finally {
        lepaskan(orang, sys);
        const sisa = buangB1(awal);
        const hidup = sisaHidup(orang);
        c.expect(sisa === "0" && hidup === "0/0/0/0", `the test left ${sisa} event row(s) and role/session/suspension/lock ${hidup} behind`);
      }
      return c.verdict("with a person whose activation was started for the test, then suspended: the wizard's password step answered 401 "
        + "exactly as to a browser that never signed in, and wrote nothing; the ACTIVATION permit, asked for directly as in the moment after the lock, answered ACCOUNT_LOCKED; "
        + "Auth's admin password write was refused and the password hash stayed byte-identical; reinstated, the activation went on and set "
        + "the password; nothing of the test is left live");
    },
  },
];
