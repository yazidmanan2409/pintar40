/**
 * CI-2 (ruling 98, OD-1 ruling 100; docs/post-4.1/ci-1/CI-2-SPEC.md @4a52d61d with Sharon's binding §6, her pre-build record
 * CI-2-PREBUILD-918ed195.md, Daisy's words CI2-KATA.md f15f33e2). Closes L-78: a closed or suspended account was banned in
 * Supabase Auth, and Auth's token endpoint, public with the anon key, answered «user_banned» before it checked the password,
 * so anyone who knew an email (or a card number) learnt the account's state.
 *
 * The fix (Sharon's option (iii)): a lock ROTATES the account's Auth password to a random secret of the same bcrypt cost,
 * clears its one-time tokens and revokes its sessions and refresh tokens; nothing is banned. Every password then reads
 * Auth's ordinary «invalid_credentials», with the same timing, for email and card alike. The per-request check
 * (pintar_permintaan.periksa, V6) still refuses a locked person's surviving token. Reinstatement and reopening re-key again
 * (ruling 100: a fresh credential, always), so nothing set during the lock is a way back in.
 *
 *   CI2-K01  reads the source, no database: the migration's functions never name banned_until; every lock and unlock
 *            path goes through the one rotation; the anonymisation rotates and never unlocks; Daisy's words (ID and EN)
 *            in hle.ts; the sign-in, card and recovery screens carry §3's line and F-6 (or its learner variant) as static
 *            lines, never as a refusal's text; the admin confirmations carry §1 and §2; the staging counts are read only.
 *   CI2-U01  the four calls straight to Auth (locked or ordinary × right or wrong), 20 each, for an email account and a
 *            class card: status, error_code and body identical to an ordinary wrong password, medians within the bound.
 *            Plants Q1 (the lock still bans) and Q2 (no rotation) are caught.
 *   CI2-R01  revocation: a refresh token from before the lock is refused by Auth (Q3 caught); an access token from before
 *            it is refused by periksa on PostgREST (Q9, periksa without its suspension rule, caught).
 *   CI2-T01  one-time tokens: a recovery link and a magic link issued before the lock fail after it (Q4 caught); a link
 *            issued during the lock gives a session that periksa refuses.
 *   CI2-B01  during the lock, a password written through a permit is stored as a secret nobody holds (Q10 caught);
 *            reinstatement and reopening re-key: a password put in during the lock past the guard, the one from before it
 *            and the permit's do not sign in after aktifkan_kembali_akun or buka_kembali_akun (Q5 caught); a fresh one does.
 *   CI2-P01  the learner (Sharon (b)): reinstated, the old card and PIN read the ordinary mismatch; the school's re-issue
 *            through its route writes the derived Auth password, so the new card and PIN sign in (Q6 caught); a re-issue
 *            during the suspension is re-keyed away by the reinstatement.
 *   CI2-N01  an account created for a locked person is rotated and revoked at once, never banned (Q7, the old
 *            pintar_kunci_tetap_jaga and the banning akun_baru_terkunci put back, caught).
 *   CI2-Z01  banned_until is null for every Auth user; no function names it (Q8, the old admin_akun_dapat_masuk, caught);
 *            admin_akun_dapat_masuk reads PINTAR's own state (an account, and the person not locked).
 *   CI2-H01  anonymisation (Sharon (d)): every account of the person is rotated, its one-time tokens cleared, its sessions
 *            and refresh tokens gone; the person stays locked.
 *   CI2-F01  F-4: the migration run again over planted bans of the old kind ('2999-12-31' and 'infinity') unbans, rotates
 *            and revokes exactly the accounts of locked persons; Sharon's read-only counts read the expected AFTER values.
 *
 * The harness's hand (never a product path): fixture accounts made through Auth's admin API from an activation grant
 * (handle_new_auth_user's own first path); a password set during a lock with a planted one-minute permit, as the routes'
 * permit would be; plants written into a function and put back in `finally`. Auth reads committed state, so these tests
 * commit, and each leaves its people unlocked and without sessions.
 */
import { spawnSync } from "node:child_process";
import { randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type Context, type SelfTest } from "./lib";
import { Peramban, ipUji, lit, psql } from "./bob26.test";
import { pilihKonteksPeramban } from "./konteks-uji";
import { t } from "../src/lib/hle";

export const MIGRASI_CI2 = "supabase/migrations/20270126100000_a_locked_account_reads_as_any_wrong_password.sql";
const HITUNG_STAGING = "docs/post-4.1/ci-2/evidence/staging-counts-CI2.sql";
/** Daisy's words (CI2-KATA.md f15f33e2; EN confirmed at 35cc08eb, «Forgot your password?» = auth.pw_lupa; §5 at 6697120b), exactly. */
export const KATA_CI2 = {
  "akun.dibuka.kredensial_staf": {
    default: "✓ Akun {nama} dapat dipakai lagi. Password lamanya tidak berlaku lagi. Beri tahu {nama}: buat password baru lewat «Lupa password?» di halaman masuk, dengan email akun ini.",
    en: "✓ {nama}'s account can be used again. The old password no longer works. Tell {nama}: make a new password with «Forgot your password?» on the sign-in page, using this account's email.",
  },
  "akun.dibuka.kredensial_murid": {
    default: "✓ {nama} dapat masuk lagi setelah mendapat PIN baru. PIN dan kartu lamanya tidak berlaku lagi. Buat PIN baru di Aktivasi akun, lalu berikan kepada {nama} sendiri.",
    en: "✓ {nama} can sign in again once they have a new PIN. The old PIN and card no longer work. Make a new PIN in Account activation, then give it to {nama} in person.",
  },
  "masuk.dibuka_kembali_baru": {
    default: "Akun yang baru dibuka kembali memakai password atau PIN baru. Staf: buat password baru lewat «Lupa password?». Murid: minta PIN baru kepada sekolah.",
    en: "An account that was just reopened uses a new password or PIN. Staff: make a new password with «Forgot your password?». Learners: ask your school for a new PIN.",
  },
  "masuk.f6": { default: "Bila akun Anda ditutup atau ditangguhkan, Anda dapat meminta dibuka kembali." },
  "masuk.f6_murid": {
    default: "Bila akun Anda ditutup atau ditangguhkan, tanyakan kepada admin sekolah Anda.",
    en: "If your account was closed or suspended, ask your school admin.",
  },
  // Sharon V-1: one neutral line, no category. PLACEHOLDER until Daisy's words arrive (not to be frozen with it)
  "aktivasi.ulang.terkunci": {
    default: "Kartu baru untuk {nama} tidak dapat dibuat sekarang.",
    en: "A new card for {nama} can't be made right now.",
  },
} as const;

type JawabanAuth = { status: number; code: string | null; body: string; ms: number };
const SYS_EMAIL = "sysadmin@synthetic.pintar.test";
const uidDari = (email: string) => psql(`select id from auth.users where email = ${lit(email)}`);
const orangDari = (uid: string) => psql(`select person_id from public.accounts where auth_user_id = ${lit(uid)}`);
/** As one person, by their Auth user (the request's claims, as PostgREST sets them), in one committed transaction. */
const sebagaiUid = (uid: string, sql: string) => psql(`begin; set local role authenticated;
  select set_config('request.jwt.claims', json_build_object('sub', ${lit(uid)}, 'role', 'authenticated')::text, true);
  select set_config('request.jwt.claim.sub', ${lit(uid)}, true);
  ${sql}; commit;`);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const kunciLayanan = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const kepalaLayanan = () => ({ apikey: kunciLayanan(), authorization: `Bearer ${kunciLayanan()}`, "content-type": "application/json" });

class Auth {
  constructor(readonly url: string, readonly anon: string) {}
  async masuk(email: string, password: string): Promise<JawabanAuth> {
    const t0 = performance.now();
    const r = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: this.anon, "content-type": "application/json", "x-forwarded-for": ipUji() },
      body: JSON.stringify({ email, password }) });
    const teks = await r.text();
    const ms = performance.now() - t0;
    let code: string | null = null;
    try { const j = JSON.parse(teks) as { error_code?: string; code?: string | number }; code = j.error_code ?? (typeof j.code === "string" ? j.code : null); } catch { /* not JSON */ }
    return { status: r.status, code, body: r.ok ? "<tokens>" : teks, ms };
  }
  async sesi(email: string, password: string): Promise<{ access: string; refresh: string } | null> {
    const r = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: this.anon, "content-type": "application/json", "x-forwarded-for": ipUji() },
      body: JSON.stringify({ email, password }) });
    if (!r.ok) return null;
    const j = (await r.json()) as { access_token: string; refresh_token: string };
    return { access: j.access_token, refresh: j.refresh_token };
  }
  async segarkan(refresh: string): Promise<number> {
    const r = await fetch(`${this.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST", headers: { apikey: this.anon, "content-type": "application/json", "x-forwarded-for": ipUji() },
      body: JSON.stringify({ refresh_token: refresh }) });
    await r.text();
    return r.status;
  }
  /** A PostgREST read with this token (not one of periksa's two exempt paths). */
  async baca(access: string): Promise<{ status: number; body: string }> {
    const r = await fetch(`${this.url}/rest/v1/persons?select=id&limit=1`, { headers: { apikey: this.anon, authorization: `Bearer ${access}` } });
    return { status: r.status, body: await r.text() };
  }
  async tautan(type: "recovery" | "magiclink", email: string): Promise<string> {
    const r = await fetch(`${this.url}/auth/v1/admin/generate_link`, { method: "POST", headers: kepalaLayanan(), body: JSON.stringify({ type, email }) });
    const j = (await r.json().catch(() => ({}))) as { hashed_token?: string; properties?: { hashed_token?: string } };
    return String(j.hashed_token ?? j.properties?.hashed_token ?? "");
  }
  async verifikasi(type: "recovery" | "magiclink", tokenHash: string): Promise<{ status: number; access: string | null }> {
    const r = await fetch(`${this.url}/auth/v1/verify`, { method: "POST",
      headers: { apikey: this.anon, "content-type": "application/json", "x-forwarded-for": ipUji() }, body: JSON.stringify({ type, token_hash: tokenHash }) });
    const j = (await r.json().catch(() => ({}))) as { access_token?: string };
    return { status: r.status, access: r.ok ? (j.access_token ?? null) : null };
  }
  async buatPengguna(email: string, password: string): Promise<string> {
    const r = await fetch(`${this.url}/auth/v1/admin/users`, { method: "POST", headers: kepalaLayanan(),
      body: JSON.stringify({ email, password, email_confirm: true }) });
    const j = (await r.json().catch(() => ({}))) as { id?: string; msg?: string };
    if (!r.ok || !j.id) throw new Error(`Auth's admin API made no user for the fixture (${r.status} ${j.msg ?? ""})`);
    return j.id;
  }
  async setelSandi(uid: string, password: string): Promise<number> {
    const r = await fetch(`${this.url}/auth/v1/admin/users/${uid}`, { method: "PUT", headers: kepalaLayanan(), body: JSON.stringify({ password }) });
    await r.text();
    return r.status;
  }
}

/** The fixtures: through Auth's admin API from an activation grant, as handle_new_auth_user's first path takes them. */
type Akun = { uid: string; orang: string; email: string; sandi: string; kartu?: string };
const tag = () => randomBytes(4).toString("hex");
const orangSistem = () => orangDari(uidDari(SYS_EMAIL));
function domainKartu(): string {
  return psql("select coalesce((select split_part(email, '@', 2) from auth.users where email like 'card-%@%' order by email limit 1), '')")
    || (process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal").toLowerCase();
}
async function buatStaf(a: Auth, nama: string): Promise<Akun> {
  const email = `ci2-${nama}-${tag()}@local.invalid`, sandi = `Ci2-${randomBytes(6).toString("hex")}-Aa1!`;
  psql(`insert into public.account_activation_grants (email, display_name, kind, authorized_by)
        values (${lit(email)}, ${lit(`CI2 ${nama}`)}, 'EMAIL', ${lit(orangSistem())})`);
  const uid = await a.buatPengguna(email, sandi);
  return { uid, orang: orangDari(uid), email, sandi };
}
async function buatKartu(a: Auth, nama: string): Promise<Akun> {
  const kartu = String(randomInt(1_000_000_000, 9_999_999_999));
  const email = `card-${kartu}@${domainKartu()}`, sandi = randomBytes(32).toString("hex");
  const orang = orangBaru(`CI2 Murid ${nama} ${tag()}`);
  psql(`insert into public.account_activation_grants (email, person_id, kind, card_number, authorized_by)
        values (${lit(email)}, ${lit(orang)}, 'CLASSROOM_CARD', ${lit(kartu)}, ${lit(orangSistem())})`);
  const uid = await a.buatPengguna(email, sandi);
  return { uid, orang, email, sandi, kartu };
}
/** A person with no account yet (the synthetic seed's hand), by the id the insert returns. */
function orangBaru(nama: string): string {
  const out = psql(`do $$ begin perform set_config('app.seed_intent', 'synthetic', true); end $$;
    insert into public.persons (display_name) values (${lit(nama)}) returning id`);
  const id = out.split("\n").find((l) => /^[0-9a-f-]{36}$/.test(l));
  if (!id) throw new Error(`no person was made for the fixture (${out.slice(0, 80)})`);
  return id;
}
const tangguhkan = (orang: string, catatan = "uji CI-2: akun ditangguhkan sementara") =>
  sebagaiUid(uidDari(SYS_EMAIL), `select public.tangguhkan_akun(${lit(orang)}, 'SECURITY', ${lit(catatan)})`);
const aktifkanKembali = (orang: string) =>
  sebagaiUid(uidDari(SYS_EMAIL), `select public.aktifkan_kembali_akun(${lit(orang)}, 'uji CI-2: akun dipakai kembali')`);
/** The harness's hand: a one-minute permit, as the recovery route's own, then Auth's admin write. */
async function sandiLewatIzin(a: Auth, uid: string, password: string): Promise<number> {
  psql(`insert into public.password_write_permits (auth_user_id, purpose, expires_at) values (${lit(uid)}, 'RECOVERY', clock_timestamp() + interval '1 minute')
        on conflict (auth_user_id) do update set purpose = excluded.purpose, expires_at = excluded.expires_at`);
  return a.setelSandi(uid, password);
}
/** The harness's hand: a credential put straight into Auth's row, past every trigger, as a write the guard never saw. */
function sandiLangsung(uid: string, password: string) {
  psql(`begin; set local session_replication_role = replica;
    update auth.users set encrypted_password = extensions.crypt(${lit(password)}, extensions.gen_salt('bf', 10)) where id = ${lit(uid)}; commit;`);
}
const GUARD = "public.auth_password_write_guard()";
const ATURAN_TERKUNCI = "if exists (select 1 from public.accounts a where a.auth_user_id = new.id and public.orang_ditangguhkan(a.person_id)) then";
/** The harness's hand at the end: the person's lock lifted and sessions gone (never a product path). */
function lepaskan(orang: string) {
  if (!orang) return;
  psql(`begin; set local session_replication_role = replica;
    update public.person_suspensions set ended_at = now(), ended_by = ${lit(orangSistem())}, end_reason = 'uji CI-2: dibersihkan oleh harness'
     where person_id = ${lit(orang)} and ended_at is null;
    update public.account_requests set status = 'DECLINED', decided_at = now() where person_id = ${lit(orang)} and status in ('RECEIVED', 'IN_PROGRESS');
    update auth.users set banned_until = null where id in (select a.auth_user_id from public.accounts a where a.person_id = ${lit(orang)}) and banned_until is not null;
    delete from auth.sessions where user_id in (select a.auth_user_id from public.accounts a where a.person_id = ${lit(orang)});
    delete from public.password_write_permits where auth_user_id in (select a.auth_user_id from public.accounts a where a.person_id = ${lit(orang)});
    commit;`);
}
const hash = (uid: string) => psql(`select coalesce(encrypted_password, '-') from auth.users where id = ${lit(uid)}`);
const dilarang = (uid: string) => psql(`select banned_until is not null from auth.users where id = ${lit(uid)}`) === "t";

/**
 * A plant: a function's definition with each [from, to] written in (each must occur once), committed; the returned
 * hand puts the saved definition back. A plant that cannot be written is a failure of the test, never a skip.
 */
function tanam(c: Checks, fungsi: string, ganti: Array<[string, string]>, nama: string): (() => void) | null {
  const asli = spawnSync("psql", ["-X", "-At", process.env.SUPABASE_DB_URL!, "-c", `select pg_get_functiondef(${lit(fungsi)}::regprocedure)`], { encoding: "utf8" });
  if (!c.expect(asli.status === 0 && asli.stdout.trim() !== "", `${nama}: ${fungsi} is not in the database to plant`)) return null;
  let def = asli.stdout;
  for (const [dari, ke] of ganti) {
    const n = def.split(dari).length - 1;
    if (!c.expect(n === 1, `${nama}: «${dari.slice(0, 70)}» occurs ${n} times in ${fungsi}, so the plant cannot be written`)) return null;
    def = def.replace(dari, ke);
  }
  const r = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", process.env.SUPABASE_DB_URL!], { encoding: "utf8", input: `${def};\n` });
  if (!c.expect(r.status === 0, `${nama}: the plant did not apply (${(r.stderr || "").trim().split("\n").pop()})`)) return null;
  return () => { spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", process.env.SUPABASE_DB_URL!], { encoding: "utf8", input: `${asli.stdout};\n` }); };
}
async function denganTanaman(c: Checks, fungsi: string, ganti: Array<[string, string]>, nama: string, uji: () => Promise<boolean>): Promise<void> {
  const pulihkan = tanam(c, fungsi, ganti, nama);
  if (!pulihkan) return;
  try { c.expect(await uji(), `${nama} was not caught`); } finally { pulihkan(); }
}

// ---------------------------------------------------------------------------------------------------------------------
// The four calls, for one locked account and one ordinary account of the same kind
async function empatPanggilan(a: Auth, terkunci: Akun, biasa: Akun, n: number) {
  const salah = (s: string) => `${s}-salah`;
  const kasus: Array<[string, string, string]> = [
    ["locked + right", terkunci.email, terkunci.sandi],
    ["locked + wrong", terkunci.email, salah(terkunci.sandi)],
    ["ordinary + wrong", biasa.email, salah(biasa.sandi)],
  ];
  const hasil: Record<string, JawabanAuth[]> = {};
  for (const [k] of kasus) hasil[k] = [];
  // interleaved, so a slow moment of the stack weighs on every case alike
  for (let i = 0; i < n; i++) for (const [k, e, s] of kasus) hasil[k].push(await a.masuk(e, s));
  const benarBiasa = await a.masuk(biasa.email, biasa.sandi);
  return { hasil, benarBiasa, med: Object.fromEntries(Object.entries(hasil).map(([k, v]) => [k, median(v.map((x) => x.ms))])) as Record<string, number> };
}
/** The answers alike in status, error_code and body; the medians within max(12 ms, 35 %) of the ordinary wrong password's. */
function seragam(c: Checks, apa: string, r: Awaited<ReturnType<typeof empatPanggilan>>): boolean {
  const acuan = r.hasil["ordinary + wrong"][0];
  let ok = c.expect(acuan.status === 400 && acuan.code === "invalid_credentials", `${apa}: an ordinary wrong password reads ${acuan.status} ${acuan.code}`);
  for (const [k, v] of Object.entries(r.hasil)) {
    const beda = v.filter((x) => x.status !== acuan.status || x.code !== acuan.code || x.body !== acuan.body);
    ok = c.expect(beda.length === 0, `${apa}, ${k}: ${beda.length} of ${v.length} calls differ from an ordinary wrong password (first: ${beda[0]?.status} ${beda[0]?.code} ${beda[0]?.body.slice(0, 80)})`) && ok;
  }
  const m0 = r.med["ordinary + wrong"];
  for (const k of ["locked + right", "locked + wrong"]) {
    const d = Math.abs(r.med[k] - m0);
    ok = c.expect(d <= Math.max(12, 0.35 * m0), `${apa}, ${k}: median ${r.med[k].toFixed(1)} ms against ${m0.toFixed(1)} ms for an ordinary wrong password`) && ok;
  }
  ok = c.expect(r.benarBiasa.status === 200, `${apa}: the ordinary account's right password does not sign in (${r.benarBiasa.status} ${r.benarBiasa.code})`) && ok;
  return ok;
}
const ringkas = (r: Awaited<ReturnType<typeof empatPanggilan>>) => Object.entries(r.med).map(([k, v]) => `${k} ${v.toFixed(1)} ms`).join(", ");

function authDari(ctx: Context, c: Checks): Auth | null {
  if (!c.expect(Boolean(ctx.supabaseUrl && ctx.supabaseAnonKey && kunciLayanan()), "no Supabase URL, anon key or service key for Auth's own endpoints")) return null;
  return new Auth(ctx.supabaseUrl!, ctx.supabaseAnonKey!);
}
const ROTASI = "public.akun_rotasi(uuid,text)";
const KUNCI = "public.akun_kunci(uuid,boolean)";

// ---------------------------------------------------------------------------------------------------------------------
export const ci2StaticTests: SelfTest[] = [
  {
    id: "CI2-K01",
    requires: [],
    run: async (ctx) => {
      const c = new Checks();
      const baca = (f: string) => { const p = join(ctx.repoRoot, f); return existsSync(p) ? readFileSync(p, "utf8") : ""; };
      const mig = baca(MIGRASI_CI2);
      if (!c.expect(mig !== "", `${MIGRASI_CI2} is not in the tree`)) return c.verdict("");
      // every function the migration defines, body by body: none names banned_until (Sharon addition 4, Q8's static half)
      const fungsi = [...mig.matchAll(/create or replace function ([a-z_]+\.[a-z_]+)\([^)]*\)[\s\S]*?\$\$([\s\S]*?)\$\$/g)];
      c.expect(fungsi.length >= 8, `the migration defines ${fungsi.length} functions; the rotation, the lock, the new-account rotation, the guard, the reader and the anonymisation are expected`);
      for (const [, nama, isi] of fungsi) c.expect(!/banned_until/.test(isi), `${nama} names banned_until`);
      const def = (nama: string) => fungsi.find((f) => f[1] === nama)?.[2] ?? "";
      const rot = def("public.akun_rotasi");
      c.expect(/extensions\.crypt\(/.test(rot) && /gen_salt\('bf',/.test(rot), "akun_rotasi does not write a bcrypt hash");
      for (const kol of ["recovery_token", "confirmation_token", "email_change_token_new", "email_change_token_current", "reauthentication_token"]) {
        c.expect(new RegExp(`${kol} = ''`).test(rot), `akun_rotasi does not clear ${kol}`);
      }
      c.expect(/delete from auth\.one_time_tokens/.test(rot) && /delete from auth\.refresh_tokens/.test(rot) && /sesi_akhiri_orang\(/.test(rot),
        "akun_rotasi does not clear the one-time tokens, the refresh tokens and the sessions");
      c.expect(/public\.akun_rotasi\(a\.auth_user_id, case when p_kunci/.test(def("public.akun_kunci")) && !/if p_kunci then[^;]*akun_rotasi/.test(def("public.akun_kunci")),
        "akun_kunci does not rotate on the lock AND the unlock (ruling 100: reinstatement and reopening re-key)");
      c.expect(/akun_rotasi\(/.test(def("public.akun_baru_terkunci")), "an account created for a locked person is not rotated (Sharon addition 1)");
      c.expect(/drop trigger if exists pintar_kunci_tetap_jaga on auth\.users/.test(mig) && /drop function if exists public\.kunci_tetap_jaga\(\)/.test(mig),
        "pintar_kunci_tetap_jaga is left in place (Sharon addition 1)");
      c.expect(/orang_ditangguhkan/.test(def("public.admin_akun_dapat_masuk")), "admin_akun_dapat_masuk does not read PINTAR's own lock (Sharon addition 2)");
      const hapus = def("public.hapus_data_pribadi");
      c.expect(/akun_rotasi\(/.test(hapus) && !/akun_kunci\([^)]*false/.test(hapus), "the anonymisation does not rotate, or reaches the unlock (Sharon (d))");
      c.expect(/pintar\.kunci_rotasi/.test(def("public.auth_password_write_guard")), "the password guard does not know the rotation's own write");
      c.expect(def("public.auth_password_write_guard").includes(ATURAN_TERKUNCI) && /new\.encrypted_password := extensions\.crypt\(/.test(def("public.auth_password_write_guard")),
        "the password guard stores what it is given for a locked person (Sharon (a) 3)");
      // F-5: PINTAR's own code doors leave a locked person out (Auth no longer refuses them)
      for (const f of ["public.recovery_code_target", "public.activation_code_target"]) {
        c.expect(/not public\.orang_ditangguhkan\(a\.person_id\)/.test(def(f)), `${f} still answers for a locked person (F-5)`);
      }
      const aktivasi = baca("src/lib/aktivasi.ts"), rutePeriksa = baca("src/app/api/aktifkan/periksa/route.ts");
      c.expect(/if \(alat\.terkunci && \(await alat\.terkunci\(\)/.test(aktivasi) && /rpc\("akun_auth_terkunci"/.test(rutePeriksa) && /keluarPerangkatIni\(supabase\)/.test(rutePeriksa)
        && /orang_ditangguhkan\(a\.person_id\)/.test(def("public.akun_auth_terkunci")),
        "the activation door does not answer a locked person's accepted code as the ordinary wrong code (F-5)");
      // Sharon CI-2-SPEC §8 2: akun_auth_terkunci is asked for the VERIFIED session's user only, never a value of the request.
      // In the route's terkunci closure: the user is read from supabase.auth.getUser(), p_auth_user is that user's id, and
      // nothing of the request (the form, the request, its headers or cookies) is read there. Q13 plants a foreign uuid
      const dariSesi = (src: string) => {
        const awal = src.indexOf("terkunci: async () => {");
        const akhir = awal < 0 ? -1 : src.indexOf("\n      },\n", awal);
        const tubuh = awal < 0 || akhir < 0 ? "" : src.slice(awal, akhir);
        const panggil = tubuh.match(/rpc\("akun_auth_terkunci",\s*\{([^}]*)\}\)/);
        return /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);/.test(tubuh)
          && panggil !== null && panggil[1].trim() === "p_auth_user: user.id"
          && !/\b(fd|request|masukan|headers|cookies|searchParams)\b/.test(tubuh.replace(/\/\/.*$/gm, ""));
      };
      c.expect(dariSesi(rutePeriksa), "the activation check does not ask akun_auth_terkunci for the verified session's own user alone (Sharon §8 2)");
      const q13 = rutePeriksa.replace('{ p_auth_user: user.id }', '{ p_auth_user: String(fd?.get("akun") ?? user.id) }');
      c.expect(q13 !== rutePeriksa && !dariSesi(q13), "Q13 (the route fed a foreign uuid from the request) was not caught");
      // F-4 bounded, and the end state asserted
      c.expect(/banned_until is not null/.test(mig) && /raise exception/.test(mig), "the migration does not assert that no account is left banned");
      // Daisy's words, ID and EN, exactly
      for (const [k, v] of Object.entries(KATA_CI2)) {
        c.expect(t(k as never, "public", { locale: "id" }) === v.default, `${k} (ID) is not Daisy's: «${t(k as never, "public", { locale: "id" })}»`);
        if ("en" in v) c.expect(t(k as never, "public", { locale: "en" }) === v.en, `${k} (EN) is not Daisy's: «${t(k as never, "public", { locale: "en" })}»`);
      }
      // Sharon §7 binding: §3 and F-6 are static lines of the page, never a refusal's text
      const layar = baca("src/components/masuk/LayarMasuk.tsx");
      const lupa = baca("src/components/aktifkan/LupaPassword.tsx");
      const jumlah = (s: string, k: string) => s.split(`s("${k}")`).length - 1;
      c.expect(jumlah(layar, "masuk.dibuka_kembali_baru") === 2 && jumlah(layar, "masuk.f6") === 1 && jumlah(layar, "masuk.f6_murid") === 1,
        "the sign-in screen does not carry §3 on the password and card views, F-6 on the password view and the learner variant on the card view");
      c.expect(jumlah(lupa, "masuk.dibuka_kembali_baru") === 3 && jumlah(lupa, "masuk.f6") === 2 && jumlah(lupa, "masuk.f6_murid") === 1,
        "the recovery screen does not carry §3 on the name, code and PIN views, F-6 on the first two and the learner variant on the PIN view");
      for (const [f, s] of [["kalimat", layar], ["kalimatKartu", layar]] as const) {
        const m = s.match(new RegExp(`function ${f}\\([\\s\\S]*?\\n}`));
        c.expect(!m || !/dibuka_kembali_baru|masuk\.f6/.test(m[0]), `the refusal's own sentence (${f}) carries §3 or F-6`);
      }
      for (const src of [baca("src/app/api/masuk/password/route.ts"), baca("src/app/api/masuk/kartu/route.ts"), baca("src/app/api/masuk/lupa/pin/route.ts")]) {
        c.expect(!/dibuka_kembali_baru|masuk\.f6/.test(src), "a refusal route returns §3 or F-6");
      }
      // §1 and §2 on the decider's confirmation, by the account's kind; §2 links to the school's re-issue
      const panel = baca("src/components/keamanan/AkunPlatform.tsx");
      c.expect(/akun\.dibuka\.kredensial_staf/.test(panel) && /akun\.dibuka\.kredensial_murid/.test(panel) && /\/aktivasi\?cari_kartu=/.test(panel),
        "the reinstatement and reopening confirmations do not carry Daisy's §1 and §2 with the re-issue link");
      // the staging counts: read only
      const hitung = baca(HITUNG_STAGING);
      c.expect(/^begin transaction read only;/m.test(hitung) && /^rollback;/m.test(hitung) && !/\b(update|insert|delete)\b/i.test(hitung.replace(/--.*$/gm, "")),
        `${HITUNG_STAGING} is not Sharon's read-only count`);
      return c.verdict("the migration's functions never name banned_until; PINTAR's code doors leave a locked person out (F-5); the rotation writes a bcrypt hash, clears the five one-time token "
        + "columns, the one-time tokens, the refresh tokens and the sessions; the lock and the unlock both rotate; a new account of a locked "
        + "person is rotated and pintar_kunci_tetap_jaga is dropped; admin_akun_dapat_masuk reads PINTAR's lock; the anonymisation rotates "
        + "and never unlocks; the end state is asserted; Daisy's words in ID and EN; §3 and F-6 (or the learner variant) are static lines of "
        + "the sign-in, card and recovery views and never a refusal's text; §1 and §2 on the confirmations; the staging counts read only");
    },
  },
];

// ---------------------------------------------------------------------------------------------------------------------
export const ci2AppTests: SelfTest[] = [
  {
    // Sharon CI-2-SPEC §8 1(c): the rotation's GUC is confined to the pair that uses it, and no SECURITY DEFINER function
    // lets a caller name the setting it sets. Read from pg_proc (every schema but the catalogue), each with its plant
    id: "CI2-G01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      // Sharon's V-2: the definition as Postgres prints it (pg_get_functiondef), never p.prosrc, which is EMPTY for a
      // BEGIN ATOMIC body (its parsed body is in prosqlbody); functions and procedures only (aggregates have no definition)
      const katalog = "n.nspname not in ('pg_catalog', 'information_schema') and p.prokind in ('f', 'p')";
      // each call is its own session: a plant written after an open «begin» is rolled back when the session ends
      const gucDi = (tanaman = "") => psql(`${tanaman} select coalesce(string_agg(n.nspname || '.' || p.proname, ',' order by n.nspname, p.proname), '')
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace where ${katalog} and pg_get_functiondef(p.oid) like '%pintar.kunci_rotasi%'`)
        .split("\n").pop()!.split(",").filter(Boolean);
      // set_config whose first argument is not a string literal: the setting's NAME supplied by whoever calls
      const NAMA_BEBAS = "set_config[[:space:]]*\\([[:space:]]*[^'[:space:]]";
      const namaBebas = (tanaman = "") => psql(`${tanaman} select coalesce(string_agg(distinct n.nspname || '.' || p.proname, ','), '')
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace where ${katalog} and p.prosecdef and pg_get_functiondef(p.oid) ~* ${lit(NAMA_BEBAS)}`)
        .split("\n").pop()!.split(",").filter(Boolean);
      const di = gucDi();
      c.expect(di.join(",") === "public.akun_rotasi,public.auth_password_write_guard",
        `the bodies naming pintar.kunci_rotasi are ${di.join(", ") || "none"}; only akun_rotasi and auth_password_write_guard may (Sharon §8 1(c))`);
      const bebas = namaBebas();
      c.expect(bebas.length === 0, `SECURITY DEFINER functions setting a caller-named setting: ${bebas.join(", ")} (Sharon §8 1(c))`);
      // the rotation's own use, as Sharon §8 1(a) and (b) read it: transaction-local, cleared after its one-row update; the
      // guard's test is equality with the row, and only after an unchanged password has returned
      const rot = psql(`select pg_get_functiondef('public.akun_rotasi(uuid, text)'::regprocedure)`);
      const set = rot.indexOf("set_config('pintar.kunci_rotasi', p_auth_user::text, true)");
      const tulis = rot.indexOf("update auth.users u set encrypted_password = v_hash");
      const kosong = rot.indexOf("set_config('pintar.kunci_rotasi', '', true)");
      c.expect(set > 0 && tulis > set && kosong > tulis && /where u\.id = p_auth_user;/.test(rot.slice(tulis, kosong)),
        "akun_rotasi does not set the GUC transaction-locally to the one user, write that one row, then clear it (Sharon §8 1(a))");
      const jaga = psql(`select pg_get_functiondef('public.auth_password_write_guard()'::regprocedure)`);
      const tetap = jaga.indexOf("if new.encrypted_password is not distinct from old.encrypted_password");
      const guc = jaga.indexOf("if current_setting('pintar.kunci_rotasi', true) = new.id::text then");
      c.expect(tetap > 0 && guc > tetap && (jaga.match(/kunci_rotasi/g) ?? []).length === 1,
        "the guard does not test the GUC once, for equality with the row, after its unchanged-password return (Sharon §8 1(b))");
      // Q11: a second setter of the GUC; Q12: a SECURITY DEFINER function that sets whatever setting it is told
      const q11 = gucDi(`begin; create function public.ci2_q11_penyetel(p uuid) returns void language plpgsql security definer
          set search_path = public, pg_temp as $q$ begin perform set_config('pintar.kunci_rotasi', p::text, true); end $q$;`);
      c.expect(q11.includes("public.ci2_q11_penyetel"), "Q11 (a second setter of pintar.kunci_rotasi) was not caught");
      const q12 = namaBebas(`begin; create function public.ci2_q12_penyetel(p_nama text, p_nilai text) returns void language plpgsql
          security definer set search_path = public, pg_temp as $q$ begin perform set_config(p_nama, p_nilai, true); end $q$;`);
      c.expect(q12.includes("public.ci2_q12_penyetel"), "Q12 (a SECURITY DEFINER function setting a caller-named setting) was not caught");
      // Q14 (Sharon's V-2): the second setter written as BEGIN ATOMIC, whose p.prosrc is empty
      const q14 = gucDi(`begin; create function public.ci2_q14_atomik(p uuid) returns text language sql security definer
          set search_path = public, pg_temp begin atomic select set_config('pintar.kunci_rotasi', p::text, true); end;`);
      c.expect(q14.includes("public.ci2_q14_atomik"), "Q14 (a BEGIN ATOMIC setter of pintar.kunci_rotasi, empty prosrc) was not caught");
      c.expect(psql(`select count(*) from pg_proc where proname in ('ci2_q11_penyetel', 'ci2_q12_penyetel', 'ci2_q14_atomik')`) === "0", "a plant was left in the database");
      return c.verdict("only akun_rotasi and auth_password_write_guard name pintar.kunci_rotasi; no SECURITY DEFINER function sets a "
        + "caller-named setting; the rotation sets the GUC to its one user, writes that row and clears it, and the guard tests it for "
        + "equality only after an unchanged password returned (Sharon §8 1(a)-(c)); Q11 (a second setter), Q12 (a caller-named "
        + "setting) and Q14 (a BEGIN ATOMIC setter, read through pg_get_functiondef: V-2) are each caught, and rolled back");
    },
  },
  {
    id: "CI2-U01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        const sk = await buatStaf(a, "u01-kunci"), sb = await buatStaf(a, "u01-biasa");
        const kk = await buatKartu(a, "u01-kunci"), kb = await buatKartu(a, "u01-biasa");
        orang.push(sk.orang, sb.orang, kk.orang, kb.orang);
        tangguhkan(sk.orang); tangguhkan(kk.orang);
        c.expect(!dilarang(sk.uid) && !dilarang(kk.uid), "the lock still sets banned_until");
        const e = await empatPanggilan(a, sk, sb, 20);
        const k = await empatPanggilan(a, kk, kb, 20);
        seragam(c, "email", e);
        seragam(c, "card", k);
        // Q1: the lock still bans. Q2: no rotation (the ban gone, nothing in its place).
        await denganTanaman(c, ROTASI, [["set encrypted_password = v_hash,", "set banned_until = public.akun_terkunci_sampai(), encrypted_password = v_hash,"]], "Q1 (the lock still bans)", async () => {
          tangguhkan(sb.orang);
          const r = await a.masuk(sb.email, `${sb.sandi}-salah`);
          lepaskan(sb.orang);
          return r.code === "user_banned";
        });
        const sb2 = await buatStaf(a, "u01-q2");
        orang.push(sb2.orang);
        await denganTanaman(c, ROTASI, [["set encrypted_password = v_hash,", "set encrypted_password = u.encrypted_password,"]], "Q2 (no rotation)", async () => {
          tangguhkan(sb2.orang);
          const r = await a.masuk(sb2.email, sb2.sandi);
          return r.status === 200;
        });
        return c.verdict(`the four calls straight to Auth, 20 each, interleaved: the locked account's right and wrong passwords read exactly an `
          + `ordinary wrong password (400 invalid_credentials, the same body) for email (${ringkas(e)}) and card (${ringkas(k)}); no ban is set; `
          + "Q1 (the lock still bans) and Q2 (no rotation: the old password signs in during the lock) are caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-R01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        const s = await buatStaf(a, "r01");
        orang.push(s.orang);
        const sesi = await a.sesi(s.email, s.sandi);
        if (!c.expect(sesi !== null, "the fixture cannot sign in before the lock")) return c.verdict("");
        c.expect((await a.baca(sesi!.access)).status === 200, "before the lock, the token reads nothing");
        tangguhkan(s.orang);
        const segar = await a.segarkan(sesi!.refresh);
        c.expect(segar >= 400, `a refresh token from before the lock still works at Auth (${segar})`);
        c.expect(psql(`select count(*) from auth.refresh_tokens where user_id = ${lit(s.uid)} and revoked is not true`) === "0"
          && psql(`select count(*) from auth.sessions where user_id = ${lit(s.uid)}`) === "0", "the lock left a live refresh token or session");
        const b = await a.baca(sesi!.access);
        c.expect(b.status === 403 && /AKUN_DITANGGUHKAN/.test(b.body), `an access token from before the lock is served (${b.status} ${b.body.slice(0, 80)})`);
        aktifkanKembali(s.orang);
        // Q3: sessions and refresh tokens not revoked
        const s3 = await buatStaf(a, "r01-q3");
        orang.push(s3.orang);
        await denganTanaman(c, ROTASI, [["n := public.sesi_akhiri_orang(p_auth_user, p_alasan);", "n := 0;"],
          ["delete from auth.refresh_tokens t where t.user_id = p_auth_user::text;", ""]], "Q3 (sessions not revoked)", async () => {
          const x = await a.sesi(s3.email, s3.sandi);
          tangguhkan(s3.orang);
          return x !== null && (await a.segarkan(x.refresh)) === 200;
        });
        // Q9: periksa without its suspension rule
        const s9 = await buatStaf(a, "r01-q9");
        orang.push(s9.orang);
        tangguhkan(s9.orang);
        // a session that survives the lock is one made during it (a link reaches the email's owner): the one periksa must refuse
        const x9 = await a.verifikasi("magiclink", await a.tautan("magiclink", s9.email));
        c.expect(x9.access !== null && (await a.baca(x9.access!)).status === 403, "a session made during the lock is served");
        await denganTanaman(c, "pintar_permintaan.periksa()", [["if v_orang is not null and public.orang_ditangguhkan(v_orang) then", "if false then"]],
          "Q9 (periksa disabled)", async () => x9.access !== null && (await a.baca(x9.access!)).status === 200);
        return c.verdict("a refresh token from before the lock is refused by Auth and none is left live; an access token from before it is "
          + "refused by periksa (403 AKUN_DITANGGUHKAN); Q3 (sessions not revoked: the refresh token works) and Q9 (periksa disabled: the "
          + "token is served) are caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-T01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        const s = await buatStaf(a, "t01");
        orang.push(s.orang);
        const pulih = await a.tautan("recovery", s.email);
        if (!c.expect(/^[0-9a-f]{20,}$/.test(pulih), "Auth issued no recovery link for the fixture")) return c.verdict("");
        tangguhkan(s.orang);
        const v1 = await a.verifikasi("recovery", pulih);
        c.expect(v1.status >= 400, `a recovery link from before the lock signs in after it (${v1.status})`);
        c.expect(psql(`select coalesce(recovery_token, '') || coalesce(confirmation_token, '') || coalesce(email_change_token_new, '')
          || coalesce(email_change_token_current, '') || coalesce(reauthentication_token, '') from auth.users where id = ${lit(s.uid)}`) === ""
          && psql(`select count(*) from auth.one_time_tokens where user_id = ${lit(s.uid)}`) === "0", "the lock left a one-time token");
        // a link issued DURING the lock: whoever holds the email gets a session, and periksa refuses it everywhere
        const selama = await a.tautan("magiclink", s.email);
        const v2 = await a.verifikasi("magiclink", selama);
        if (c.expect(v2.access !== null, `a link issued during the lock gave no session to the email's owner (${v2.status}); Sharon (a) 2 expects one, refused by periksa`)) {
          const b = await a.baca(v2.access!);
          c.expect(b.status === 403 && /AKUN_DITANGGUHKAN/.test(b.body), `a session from a link issued during the lock is served (${b.status})`);
        }
        aktifkanKembali(s.orang);
        // Q4: one-time tokens not cleared
        const s4 = await buatStaf(a, "t01-q4");
        orang.push(s4.orang);
        await denganTanaman(c, ROTASI, [["delete from auth.one_time_tokens t where t.user_id = p_auth_user;", ""],
          ["recovery_token = '', ", ""]], "Q4 (one-time tokens not cleared)", async () => {
          const l = await a.tautan("recovery", s4.email);
          tangguhkan(s4.orang);
          return (await a.verifikasi("recovery", l)).status === 200;
        });
        return c.verdict("a recovery link issued before the lock fails after it and the lock leaves no one-time token (the five columns and "
          + "auth.one_time_tokens); a link issued during the lock gives a session that periksa refuses; Q4 (tokens not cleared: the link from "
          + "before signs in) is caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-B01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        // reinstatement
        const s = await buatStaf(a, "b01");
        orang.push(s.orang);
        tangguhkan(s.orang);
        // through a permit during the lock: the write is taken, and what is stored is a secret nobody holds (the guard)
        const lewatIzin = `Ci2-Izin-${randomBytes(5).toString("hex")}-Aa1!`;
        c.expect(await sandiLewatIzin(a, s.uid, lewatIzin) === 200, "the harness could not ask for a password write during the lock");
        const ri = await a.masuk(s.email, lewatIzin);
        c.expect(ri.status === 400 && ri.code === "invalid_credentials", `a password written through a permit during the lock signs in (${ri.status} ${ri.code})`);
        // Q10: the guard writes what it is given for a locked person
        const s10 = await buatStaf(a, "b01-q10");
        orang.push(s10.orang);
        tangguhkan(s10.orang);
        await denganTanaman(c, GUARD, [[ATURAN_TERKUNCI, "if false then"]], "Q10 (a credential written for a locked person is usable)", async () => {
          const p = `Ci2-Q10-${randomBytes(5).toString("hex")}-Aa1!`;
          await sandiLewatIzin(a, s10.uid, p);
          return (await a.masuk(s10.email, p)).status === 200;
        });
        // one put past the guard (a write it never saw): the reinstatement must still replace it
        const selama = `Ci2-Selama-${randomBytes(5).toString("hex")}-Aa1!`;
        sandiLangsung(s.uid, selama);
        const sebelum = hash(s.uid);
        aktifkanKembali(s.orang);
        c.expect(hash(s.uid) !== sebelum, "reinstatement did not re-key");
        for (const [apa, p] of [["the password set during the lock", selama], ["the password from before the lock", s.sandi], ["the one written through a permit", lewatIzin]] as const) {
          const r = await a.masuk(s.email, p);
          c.expect(r.status === 400 && r.code === "invalid_credentials", `reinstated, ${apa} reads ${r.status} ${r.code}`);
        }
        const segar = `Ci2-Segar-${randomBytes(5).toString("hex")}-Aa1!`;
        c.expect(await sandiLewatIzin(a, s.uid, segar) === 200 && (await a.masuk(s.email, segar)).status === 200, "reinstated, a fresh password does not sign in");
        // reopening (a closure at the person's request, reopened from its request)
        const t2 = await buatStaf(a, "b01-buka");
        orang.push(t2.orang);
        sebagaiUid(t2.uid, "select public.minta_akun('CLOSE', true)");
        const minta = psql(`select public.minta_buka_kembali(${lit(t2.email)}, 'uji CI-2: mohon dibuka kembali')`);
        const req = psql(`select id from public.account_requests where person_id = ${lit(t2.orang)} and kind = 'REOPEN' and status in ('RECEIVED', 'IN_PROGRESS')`);
        if (c.expect(/^[0-9a-f-]{36}$/.test(req), `no reopening request was made (${minta.slice(0, 60)})`)) {
          const selama2 = `Ci2-Tutup-${randomBytes(5).toString("hex")}-Aa1!`;
          sandiLangsung(t2.uid, selama2);
          sebagaiUid(uidDari(SYS_EMAIL), `select public.buka_kembali_akun(${lit(req)}, 'uji CI-2: identitas dipastikan lewat telepon')`);
          for (const p of [selama2, t2.sandi]) {
            const r = await a.masuk(t2.email, p);
            c.expect(r.status === 400 && r.code === "invalid_credentials", `reopened, an old password reads ${r.status} ${r.code}`);
          }
        }
        // Q5: the unlock re-keys nothing
        const s5 = await buatStaf(a, "b01-q5");
        orang.push(s5.orang);
        await denganTanaman(c, KUNCI, [["n := n + public.akun_rotasi(a.auth_user_id, case when p_kunci then 'DITANGGUHKAN' else 'KREDENSIAL_DIGANTI' end);",
          "if p_kunci then n := n + public.akun_rotasi(a.auth_user_id, 'DITANGGUHKAN'); end if;"]], "Q5 (the unlock re-keys nothing)", async () => {
          tangguhkan(s5.orang);
          const p = `Ci2-Q5-${randomBytes(5).toString("hex")}-Aa1!`;
          sandiLangsung(s5.uid, p);
          aktifkanKembali(s5.orang);
          return (await a.masuk(s5.email, p)).status === 200;
        });
        return c.verdict("during the lock a password written through a permit is stored as a secret nobody holds (it reads invalid_credentials; "
          + "Q10, the guard writing it as given, is caught); reinstated (aktifkan_kembali_akun) and reopened (buka_kembali_akun), the account is "
          + "re-keyed: a password put in during the lock past the guard, the one from before it and the one written through a permit read "
          + "invalid_credentials; a fresh password set afterwards signs in; Q5 (the unlock re-keys nothing: the password put in during the lock "
          + "signs in) is caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-P01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const asal = ctx.appUrl!;
      const orang: string[] = [];
      const admin = new Peramban(asal, ipUji());
      try {
        const m = await admin.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
        if (!c.expect(m.status === 200, `the platform admin could not sign in (${m.status})`)) return c.verdict("");
        await pilihKonteksPeramban(admin, "MENGELOLA:PLATFORM");
        const terbit = async (o: string) => {
          const r = await admin.jsonDari("/api/akun/kartu-kelas", { json: { person_id: o, alasan: "HILANG" } });
          const b = (r.body ?? {}) as { ok?: boolean; code?: string; kartu?: { card?: string; pin?: string } };
          return { status: r.status, body: { card: b.kartu?.card, pin: b.kartu?.pin, code: b.code } };
        };
        const kartuMasuk = (kartu: string, pin: string) => new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu, pin } });
        const k = await buatKartu(a, "p01");
        orang.push(k.orang);
        // Bob (principle 3, C-7) and Sharon's V-1 (AUDIT79-CI2-VERIFY.md; CI-2-SPEC §10): the re-issue list shows a locked
        // learner ONE NEUTRAL LINE in place of the button and draws no card, and neither the list nor the page says WHY the
        // learner is locked (a closure at their request or a suspension is not the provisioner's to read). The learner
        // needs a school identity to be listed (card_holders)
        // the harness's hand: a school identity written directly (a fresh database's schools have reserved no namespace, and
        // reserving one would change the world for later tests), a number of its own shape that nothing else issues
        const urut = randomInt(900_000, 999_999);
        psql(`begin; set local session_replication_role = replica;
          insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number)
          values (${lit(k.orang)}, (select id from public.institutions order by created_at, id limit 1), ${lit(`ZC2${String(urut)}UJ`)}, ${urut}); commit;`);
        const nama = psql(`select display_name from public.persons where id = ${lit(k.orang)}`);
        const barisDaftar = async () => {
          const h = await (await admin.kirim(`/aktivasi?cari_kartu=${encodeURIComponent(nama)}`)).text();
          const i = h.indexOf(`<strong>${nama}</strong>`);
          return { baris: i < 0 ? "" : h.slice(i, h.indexOf("</li>", i)), kartu: h.includes("pin-akt-lembar") };
        };
        // what card_holders() says of this learner, as the platform admin reads it, beyond the columns it always had
        const daftarLebih = (kategori: string | null) => psql(`begin;
          ${kategori ? `set local session_replication_role = replica;
          update public.person_suspensions set category = ${lit(kategori)} where person_id = ${lit(k.orang)} and ended_at is null;
          set local session_replication_role = origin;` : ""}
          select set_config('request.jwt.claims', json_build_object('sub', ${lit(uidDari(SYS_EMAIL))}, 'role', 'authenticated')::text, true);
          select set_config('request.jwt.claim.sub', ${lit(uidDari(SYS_EMAIL))}, true);
          set local role authenticated;
          select 'LEBIH:' || coalesce((select (to_jsonb(c) - 'person_id' - 'display_name' - 'institutional_id' - 'institution_id' - 'card_last4')::text
            from public.card_holders() c where c.person_id = ${lit(k.orang)}), '-'); rollback;`).split("\n").filter((l) => l.startsWith("LEBIH:")).pop()?.slice(6) ?? "";
        const sebelumKunci = await barisDaftar();
        c.expect(sebelumKunci.baris.includes(t("aktivasi.ulang.pilih", "staff")) && !sebelumKunci.baris.includes("data-kartu-terkunci"),
          `before the lock, the learner's row does not offer «${t("aktivasi.ulang.pilih", "staff")}» (the control): ${sebelumKunci.baris.slice(0, 200)}`);
        c.expect(daftarLebih(null) === '{"terkunci": false}', `before the lock, card_holders() adds ${daftarLebih(null)} for the learner; only {"terkunci": false} (V-1)`);
        tangguhkan(k.orang);
        const saatKunci = await barisDaftar();
        const kalimat = KATA_CI2["aktivasi.ulang.terkunci"].default.split("{nama}").join(nama);
        c.expect(saatKunci.baris.includes('data-kartu-terkunci="ya"') && saatKunci.baris.includes(kalimat)
          && !saatKunci.baris.includes(t("aktivasi.ulang.pilih", "staff")) && !saatKunci.baris.includes("<button") && !saatKunci.kartu,
          `suspended, the learner's row is not the one neutral line in place of the button with no card drawn: ${saatKunci.baris.slice(0, 300)}`);
        c.expect(!/ditangguhkan|ditutup|DITANGGUHKAN|DITUTUP|suspend|closed/i.test(saatKunci.baris),
          `suspended, the learner's row names why they are locked: ${saatKunci.baris.slice(0, 300)} (V-1)`);
        // the list itself carries no category, for a suspension or for a closure at the person's request alike
        for (const kategori of ["SECURITY", "CLOSED_AT_REQUEST"]) {
          const lebih = daftarLebih(kategori);
          c.expect(lebih === '{"terkunci": true}', `a learner locked ${kategori} is listed by card_holders() with ${lebih}; only {"terkunci": true}, no category (V-1)`);
        }
        // a re-issue DURING the suspension: whatever it gives is re-keyed away by the reinstatement
        const selama = await terbit(k.orang);
        c.expect(selama.status === 200 && Boolean(selama.body.card), `the school's re-issue during the suspension answered ${selama.status} (it answers as for anyone)`);
        if (selama.body.card) {
          const r = await kartuMasuk(selama.body.card, selama.body.pin!);
          c.expect(r.status === 401 && r.body?.code === "CARD_NOT_MATCHED", `during the suspension, the card re-issued in it signs in (${r.status} ${JSON.stringify(r.body)})`);
        }
        aktifkanKembali(k.orang);
        if (selama.status === 200 && selama.body.card) {
          const r = await kartuMasuk(selama.body.card, selama.body.pin!);
          c.expect(r.status === 401 && r.body?.code === "CARD_NOT_MATCHED", `reinstated, the card re-issued during the suspension signs in (${r.status} ${JSON.stringify(r.body)})`);
        }
        const lama = await a.masuk(psql(`select email from auth.users where id = ${lit(k.uid)}`), k.sandi);
        c.expect(lama.status === 400 && lama.code === "invalid_credentials", `reinstated, the old card's secret reads ${lama.status} ${lama.code}`);
        // the school's re-issue: the PIN and the derived Auth password, so the new card signs in (Sharon (b))
        const baru = await terbit(k.orang);
        if (c.expect(baru.status === 200 && /^\d{10}$/.test(baru.body.card ?? "") && /^\d{4,6}$/.test(baru.body.pin ?? ""), `the re-issue answered ${baru.status} ${JSON.stringify(baru.body)}`)) {
          const r = await kartuMasuk(baru.body.card!, baru.body.pin!);
          c.expect(r.status === 200 && r.body?.ok === true, `reinstated, the new card and PIN do not sign in (${r.status} ${JSON.stringify(r.body)})`);
        }
        // Q6: the PIN reset leaves the Auth password random
        const k6 = await buatKartu(a, "p01-q6");
        orang.push(k6.orang);
        tangguhkan(k6.orang); aktifkanKembali(k6.orang);
        await denganTanaman(c, "public.auth_password_write_guard()", [["if v_purpose in ('RECOVERY', 'CARD_REISSUE') then",
          "if v_purpose = 'CARD_REISSUE' then new.encrypted_password := extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf', 10)); end if;\n  if v_purpose in ('RECOVERY', 'CARD_REISSUE') then"]],
          "Q6 (the PIN reset leaves the Auth password random)", async () => {
            const b = await terbit(k6.orang);
            if (b.status !== 200 || !b.body.card) return false;
            const r = await kartuMasuk(b.body.card, b.body.pin!);
            return r.status === 401;
          });
        return c.verdict("the re-issue list offers the button before the lock and, for the suspended learner, one neutral line in its place with no "
          + "button and no card drawn, naming no reason; card_holders() adds only terkunci, for a suspension and a closure alike (V-1); a card re-issued during the suspension answers as for anyone and signs in neither during it nor after it; reinstated, "
          + "the learner's old card secret reads invalid_credentials; the school's re-issue through /api/akun/kartu-kelas writes the derived Auth password, so the new card and PIN sign "
          + "in at /masuk/kartu; Q6 (the re-issue's Auth password left random) is caught");
      } finally {
        await admin.kirim("/keluar", { method: "POST" }).catch(() => null);
        for (const o of orang) lepaskan(o);
      }
    },
  },
  {
    id: "CI2-N01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      const kartuBaru = async (o: string) => {
        const kartu = String(randomInt(1_000_000_000, 9_999_999_999));
        const email = `card-${kartu}@${domainKartu()}`, sandi = randomBytes(32).toString("hex");
        psql(`insert into public.account_activation_grants (email, person_id, kind, card_number, authorized_by)
              values (${lit(email)}, ${lit(o)}, 'CLASSROOM_CARD', ${lit(kartu)}, ${lit(orangSistem())})`);
        const uid = await a.buatPengguna(email, sandi);
        return { uid, email, sandi };
      };
      try {
        // a learner person with no account yet, suspended; then an account is made for them
        const o = orangBaru(`CI2 Murid n01 ${tag()}`);
        orang.push(o);
        tangguhkan(o);
        const n = await kartuBaru(o);
        c.expect(!dilarang(n.uid), "an account created for a locked person is banned");
        const r = await a.masuk(n.email, n.sandi);
        c.expect(r.status === 400 && r.code === "invalid_credentials", `an account created for a locked person signs in or reads otherwise (${r.status} ${r.code})`);
        // Q7: the old guard and the banning akun_baru_terkunci put back
        const o7 = orangBaru(`CI2 Murid n01-q7 ${tag()}`);
        orang.push(o7);
        tangguhkan(o7);
        const pulihkan = tanam(c, "public.akun_baru_terkunci()", [["perform public.akun_rotasi(new.auth_user_id, 'DITANGGUHKAN');",
          "update auth.users set banned_until = public.akun_terkunci_sampai() where id = new.auth_user_id;"]], "Q7 (the banning guard left in place)");
        if (pulihkan) {
          try {
            const n7 = await kartuBaru(o7);
            c.expect(dilarang(n7.uid), "Q7 (the banning guard left in place) was not caught");
          } finally { pulihkan(); }
        }
        return c.verdict("an account created for a suspended person is never banned and is rotated at once (its password reads "
          + "invalid_credentials); Q7 (the banning guard put back: the new account is banned) is caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-Z01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        c.expect(psql("select count(*) from auth.users where banned_until is not null") === "0", "an Auth user is banned");
        const nama = () => psql(`select coalesce(string_agg(n.nspname || '.' || p.proname, ', ' order by 1), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname not in ('auth', 'selftest', 'pg_catalog', 'information_schema', 'extensions', 'graphql', 'graphql_public', 'storage', 'realtime', 'vault', 'pgsodium', 'supabase_functions', 'net', 'cron')
            and p.prokind in ('f', 'p') and pg_get_functiondef(p.oid) ~ 'banned_until'`);
        c.expect(nama() === "", `a function names banned_until: ${nama()}`);
        // admin_akun_dapat_masuk: PINTAR's own state
        const s = await buatStaf(a, "z01");
        orang.push(s.orang);
        const dapat = (o: string) => psql(`select public.admin_akun_dapat_masuk(${lit(o)})`);
        c.expect(dapat(s.orang) === "t", "a person with an account and no lock reads as unable to sign in");
        tangguhkan(s.orang);
        c.expect(dapat(s.orang) === "f", "a locked person reads as able to sign in");
        aktifkanKembali(s.orang);
        const tanpa = orangBaru("CI2 tanpa akun");
        c.expect(dapat(tanpa) === "f", "a person with no account reads as able to sign in");
        // Q8: the old reader
        const pulihkan = tanam(c, "public.admin_akun_dapat_masuk(uuid)", [["and not public.orang_ditangguhkan(p_person)", "and (u.banned_until is null or u.banned_until <= now())"]], "Q8 (the old reader)");
        if (pulihkan) { try { c.expect(nama() !== "", "Q8 (admin_akun_dapat_masuk reads banned_until) was not caught"); } finally { pulihkan(); } }
        return c.verdict("no Auth user is banned; no product function (outside Auth's own schemas and the harness's selftest schema) names banned_until; admin_akun_dapat_masuk is true for an account "
          + "of an unlocked person and false for a locked person or a person with no account; Q8 (the old reader) is caught");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
  {
    id: "CI2-H01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const orang: string[] = [];
      try {
        const s = await buatStaf(a, "h01");
        orang.push(s.orang);
        sebagaiUid(s.uid, "select public.minta_akun('DELETE_PERSONAL_DATA', true)");
        sebagaiUid(s.uid, "select public.minta_akun('CLOSE', true)");
        // the harness's hand: what a session and a link left behind would be, after the closure
        psql(`begin; set local session_replication_role = replica;
          update auth.users set recovery_token = 'ci2-sisa-' || md5(random()::text), reauthentication_token = 'ci2-sisa-' || md5(random()::text) where id = ${lit(s.uid)};
          insert into auth.sessions (id, user_id, created_at, updated_at, aal) values (gen_random_uuid(), ${lit(s.uid)}, now(), now(), 'aal1');
          commit;`);
        const sebelum = hash(s.uid);
        const req = psql(`select id from public.account_requests where person_id = ${lit(s.orang)} and kind = 'DELETE_PERSONAL_DATA'`);
        sebagaiUid(uidDari(SYS_EMAIL), `select public.hapus_data_pribadi(${lit(req)}, null)`);
        c.expect(hash(s.uid) !== sebelum, "the anonymisation did not rotate");
        c.expect(psql(`select coalesce(recovery_token, '') || coalesce(reauthentication_token, '') from auth.users where id = ${lit(s.uid)}`) === ""
          && psql(`select count(*) from auth.sessions where user_id = ${lit(s.uid)}`) === "0"
          && psql(`select count(*) from auth.refresh_tokens where user_id = ${lit(s.uid)}`) === "0", "the anonymisation left a token or a session");
        c.expect(psql(`select public.orang_ditangguhkan(${lit(s.orang)})`) === "t" && !dilarang(s.uid), "the anonymised person is not locked, or is banned");
        return c.verdict("the anonymisation rotates the account, clears its one-time tokens and leaves no session or refresh token; the person "
          + "stays locked and nobody is banned");
      } finally { /* an anonymised person stays locked for ever (L1-F4): nothing to lift */ }
    },
  },
  {
    id: "CI2-F01",
    requires: ["network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const a = authDari(ctx, c);
      if (!a) return c.verdict("");
      const berkas = join(ctx.repoRoot, MIGRASI_CI2);
      if (!c.expect(existsSync(berkas), `${MIGRASI_CI2} is not in the tree`)) return c.verdict("");
      const orang: string[] = [];
      const hitung = () => {
        const r = spawnSync("psql", ["-X", "-q", "-At", "-F", "|", "-f", join(ctx.repoRoot, HITUNG_STAGING), process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
        return (r.stdout.trim().split("\n").find((l) => /^\d+\|\d+\|\d+\|\d+$/.test(l)) ?? "?");
      };
      try {
        const s1 = await buatStaf(a, "f01-a"), s2 = await buatKartu(a, "f01-b"), s3 = await buatStaf(a, "f01-biasa");
        orang.push(s1.orang, s2.orang, s3.orang);
        tangguhkan(s1.orang); tangguhkan(s2.orang);
        const x = await a.sesi(s3.email, s3.sandi);
        // the harness's hand: bans of the old kind, and a live refresh token of a locked person, past every trigger
        psql(`begin; set local session_replication_role = replica;
          update auth.users set banned_until = '2999-12-31 00:00:00+00' where id = ${lit(s1.uid)};
          update auth.users set banned_until = 'infinity' where id = ${lit(s2.uid)};
          insert into auth.sessions (id, user_id, created_at, updated_at, aal) values (gen_random_uuid(), ${lit(s1.uid)}, now(), now(), 'aal1');
          commit;`);
        const sesiTanam = psql(`select id from auth.sessions where user_id = ${lit(s1.uid)} limit 1`);
        psql(`begin; set local session_replication_role = replica;
          insert into auth.refresh_tokens (instance_id, token, user_id, revoked, created_at, updated_at, session_id)
          values ('00000000-0000-0000-0000-000000000000', 'ci2-' || md5(random()::text), ${lit(s1.uid)}, false, now(), now(), ${lit(sesiTanam)}); commit;`);
        const sebelum = hitung().split("|");
        const hash1 = hash(s1.uid), hash2 = hash(s2.uid), hashBiasa = hash(s3.uid);
        const r = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", "--single-transaction", "-f", berkas, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
        c.expect(r.status === 0, `the migration run again failed (${(r.stderr || "").trim().split("\n").pop()})`);
        const sesudah = hitung().split("|");
        c.expect(sebelum[0] === sebelum[1] || Number(sebelum[0]) >= 2, `BEFORE: ${sebelum.join("|")} (banned, accounts of locked persons, banned but not locked, live refresh tokens of locked)`);
        c.expect(sesudah[0] === "0" && sesudah[1] === sebelum[1] && sesudah[3] === "0",
          `AFTER: ${sesudah.join("|")} against BEFORE ${sebelum.join("|")}: banned 0, accounts of locked persons unchanged, live refresh tokens of locked 0 expected`);
        c.expect(hash(s1.uid) !== hash1 && hash(s2.uid) !== hash2 && hash(s3.uid) === hashBiasa, "F-4 rotated the wrong accounts");
        c.expect(x !== null && (await a.segarkan(x.refresh)) === 200, "F-4 touched an ordinary account's session");
        return c.verdict(`the migration run again over bans of the old kind (2999-12-31 and infinity) and a planted live refresh token: BEFORE `
          + `${sebelum.join("|")}, AFTER ${sesudah.join("|")} (banned 0, accounts of locked persons unchanged, live refresh tokens of locked 0); `
          + "exactly the locked accounts were rotated; an ordinary account and its session untouched");
      } finally { for (const o of orang) lepaskan(o); }
    },
  },
];
