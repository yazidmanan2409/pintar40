/**
 * BOB-26 (identity Gate 3): ACTIVATION AND PASSWORD SIGN-IN, proven through the
 * running app, real Auth, PostgREST and the Mailpit sink. The database's own
 * half (the Ironman test's refusals, the permit, the correction and the
 * certificates) is selftest/db/fable18.sql.
 *
 *   BOB26-A01  the journey: a person the platform admin registers («Bagas
 *              Saputro») asks for a code, receives it in the sink with its real
 *              validity, types it spaced («482 913»), is held to the wizard, and
 *              walks username → password → PIN → name («Ubah nama», «Sudah
 *              benar») → finish; the card email goes; the hold lifts and the
 *              D-010 home follows; then signs in by username and by email
 *   BOB26-A02  nothing tells a known address or name from an unknown one: the
 *              code request answers every address the same and sends only to
 *              the unfinished one (no email, no Auth user for a stranger); a
 *              wrong password and an unknown name get one code, no sooner than
 *              the floor, in similar time; the counters hold a sixth try either
 *              way
 *   BOB26-A03  the Gate 0 findings and the Ironman test through the API: a
 *              signed-in session cannot change its own password through Auth's
 *              endpoint (and the new one does not sign in); Bagas and a Guru
 *              cannot rename themselves «Ironman» through PostgREST
 *   BOB26-A04  a card the limits refuse is not lost (D-079): set-up completes,
 *              the card is BELUM_TERKIRIM, and Akun saya sends it later
 *   BOB26-K01  the decisions, driven with their tools replaced
 *              (src/lib/aktivasi.ts): one answer whatever the lookup finds; the
 *              code read as digits; the floor; the same key for an email and a
 *              username of one account
 *   BOB26-S01  the one canonical setting (D-079 addendum): config.toml equals
 *              supabase/auth-identitas.json; the email's «berlaku … menit»
 *              follows the canonical value when it changes; no validity is
 *              typed anywhere in src; the settings workflow writes the file and
 *              identity-facts.yml fails on drift
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const SINK_API = "http://127.0.0.1:54324/api/v1";
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

function psql(sql: string): string {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;

type PesanSink = { ID: string; To: Array<{ Address: string }>; Subject: string; Text: string; HTML: string };
async function sinkCari(alamat: string): Promise<PesanSink[]> {
  const r = await fetch(`${SINK_API}/search?query=${encodeURIComponent(`to:"${alamat}"`)}`);
  const d = (await r.json()) as { messages?: Array<{ ID: string }> };
  const out: PesanSink[] = [];
  for (const m of d.messages ?? []) out.push((await (await fetch(`${SINK_API}/message/${m.ID}`)).json()) as PesanSink);
  return out;
}
async function sinkTunggu(alamat: string, n: number, ms = 8000): Promise<PesanSink[]> {
  const batas = Date.now() + ms;
  let p: PesanSink[] = [];
  while (Date.now() < batas) {
    p = await sinkCari(alamat);
    if (p.length >= n) return p;
    await new Promise((r) => setTimeout(r, 250));
  }
  return p;
}
const kodeDari = (p: PesanSink | undefined) => /\b(\d{3}) ?(\d{3})\b/.exec(p?.Text ?? "")?.slice(1).join("") ?? "";

/** A browser on PINTAR's own page: same origin, its own cookies, redirects not followed. */
class Peramban {
  kue = new Map<string, string>();
  constructor(readonly asal: string, readonly ip: string) {}
  async kirim(path: string, opsi: { form?: Record<string, string>; json?: unknown; method?: string } = {}): Promise<Response> {
    const headers: Record<string, string> = { origin: this.asal, "sec-fetch-site": "same-origin", "x-real-ip": this.ip, accept: "application/json" };
    if (this.kue.size) headers.cookie = [...this.kue].map(([k, v]) => `${k}=${v}`).join("; ");
    let body: BodyInit | undefined;
    if (opsi.form) { const fd = new FormData(); for (const [k, v] of Object.entries(opsi.form)) fd.set(k, v); body = fd; }
    if (opsi.json !== undefined) { body = JSON.stringify(opsi.json); headers["content-type"] = "application/json"; }
    const r = await fetch(this.asal + path, { method: opsi.method ?? (body ? "POST" : "GET"), headers, body, redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const [pasangan, ...atribut] = c.split(";");
      const i = pasangan.indexOf("=");
      const nama = pasangan.slice(0, i).trim(), nilai = pasangan.slice(i + 1);
      if (!nilai || atribut.some((a) => /^\s*max-age=0\s*$/i.test(a))) this.kue.delete(nama); else this.kue.set(nama, nilai);
    }
    return r;
  }
  async jsonDari(path: string, opsi: Parameters<Peramban["kirim"]>[1] = {}) {
    const r = await this.kirim(path, opsi);
    return { status: r.status, retry: r.headers.get("retry-after"), body: (await r.json().catch(() => null)) as Record<string, unknown> | null };
  }
}

const ipUji = () => `198.51.100.${1 + (randomBytes(1)[0] % 250)}`;

async function authMasuk(url: string, anon: string, email: string, password: string): Promise<string | null> {
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: anon, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  return r.ok ? ((await r.json()) as { access_token: string }).access_token : null;
}

/** «Orang baru»: the platform admin registers a person (the real route), then a fixture EDUCATOR role. */
async function daftar(asal: string, nama: string, email: string): Promise<string> {
  const admin = new Peramban(asal, ipUji());
  const m = await admin.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } });
  if (m.status !== 200) throw new Error(`the platform admin could not sign in by username (${m.status} ${JSON.stringify(m.body)})`);
  const a = await admin.jsonDari("/api/akun/aktivasi", { json: { mode: "NEW_PERSON", email, display_name: nama } });
  if (a.status !== 200) throw new Error(`«Orang baru» refused (${a.status})`);
  return psql(`
    do $$ declare v_p uuid; v_node uuid; v_inst uuid; begin
      select a.person_id into v_p from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)};
      select ra.scope_node_id, ra.institution_id into v_node, v_inst from public.role_assignments ra
        join public.accounts a on a.person_id = ra.person_id join auth.users u on u.id = a.auth_user_id
       where u.email = 'alpha-guru@synthetic.pintar.test' and ra.role = 'EDUCATOR' limit 1;
      perform set_config('app.seed_intent', 'synthetic', true);
      insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
      values (v_p, 'EDUCATOR', v_node, v_inst, now() - interval '1 day', now() + interval '365 days');
    end $$;
    select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)};`).split("\n").pop()!;
}

const sandiBagas = () => `Bagas-${randomBytes(6).toString("hex")}`;

export const bob26AppTests: SelfTest[] = [
  {
    id: "BOB26-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const { PENGATURAN } = await import("../src/lib/pengaturan-auth");
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `bob26-bagas-${tag}@local.invalid`;
      const pid = await daftar(asal, "Bagas Saputro", email);
      const b = new Peramban(asal, ipUji());

      // 1. the code
      const minta = await b.jsonDari("/aktifkan/kode", { form: { email: `  ${email.toUpperCase()} ` } });
      c.expect(minta.status === 200 && minta.body?.ok === true && minta.body.berlakuMenit === PENGATURAN.berlakuMenit
        && minta.body.kirimUlangDalam === 60, `the code request did not answer the uniform 200 (${minta.status} ${JSON.stringify(minta.body)})`);
      const surat = await sinkTunggu(email, 1);
      const kode = kodeDari(surat[0]);
      c.expect(surat.length === 1 && kode.length === PENGATURAN.panjangKode, `no ${PENGATURAN.panjangKode}-digit code arrived in the sink (${surat.length} email(s))`);
      // RESTATED AT THE JOINT GATE (DAISY-20's copy, D-079(a)): the email says
      // «berlaku selama N menit», the addendum's own wording; the number is
      // still the canonical one, checked here
      c.expect(new RegExp(`berlaku (?:selama )?${PENGATURAN.berlakuMenit} menit`).test(surat[0]?.Text ?? ""), "the code email does not state the canonical validity");
      c.expect(!/\b(?:5|60|3600) menit/.test(surat[0]?.Text ?? ""), "the code email states a validity that is not the canonical one");

      // 2. a wrong code, then the right one typed with a space
      const salah = await b.jsonDari("/aktifkan/periksa", { form: { email, kode: kode === "000000" ? "111111" : "000000" } });
      c.expect(salah.status === 400 && salah.body?.code === "KODE_TIDAK_COCOK", `a wrong code was not KODE_TIDAK_COCOK (${salah.status})`);
      const benar = await b.jsonDari("/aktifkan/periksa", { form: { email, kode: `${kode.slice(0, 3)} ${kode.slice(3)}` } });
      c.expect(benar.status === 200 && benar.body?.tujuan === "/aktifkan", `the spaced code did not sign in to the wizard (${benar.status} ${JSON.stringify(benar.body)})`);

      // 3. the hold
      const halaman = await b.kirim("/mengajar");
      c.expect(halaman.status >= 300 && halaman.status < 400 && new URL(halaman.headers.get("location") ?? "", asal).pathname === "/aktifkan",
        `a set-up REQUIRED session reached /mengajar (${halaman.status} ${halaman.headers.get("location")})`);
      const api = await b.jsonDari("/api/akun/kartu");
      c.expect(api.status === 403 && api.body?.error === "setup_required", `a set-up REQUIRED session reached an API route (${api.status})`);
      let k = await b.jsonDari("/api/aktifkan/keadaan");
      c.expect(k.status === 200 && k.body?.keadaan === "REQUIRED" && k.body.berikutnya === "USERNAME" && k.body.staf === true
        && typeof k.body.pintarId === "string", `the wizard's state is not REQUIRED at USERNAME for a staff person (${JSON.stringify(k.body)})`);

      // 4. the steps
      const u1 = await b.jsonDari("/api/aktifkan/username", { form: { username: "uji.alpha.guru" } });
      c.expect(u1.status === 409 && u1.body?.code === "USERNAME_TAKEN", `a taken username was not USERNAME_TAKEN (${u1.status} ${JSON.stringify(u1.body)})`);
      const u2 = await b.jsonDari("/api/aktifkan/username", { form: { username: "admin" } });
      c.expect(u2.status === 422 && u2.body?.code === "USERNAME_RESERVED", "a reserved username was not refused by its code");
      const u3 = await b.jsonDari("/api/aktifkan/username", { form: { username: `Bagas.${tag}` } });
      c.expect(u3.status === 200 && u3.body?.username === `bagas.${tag}`, `the username was not claimed in canonical lowercase (${JSON.stringify(u3.body)})`);
      const p1 = await b.jsonDari("/api/aktifkan/password", { form: { password: "pendek" } });
      c.expect(p1.status === 422 && p1.body?.code === "PASSWORD_LEMAH" && JSON.stringify(p1.body.alasan) === '["PANJANG"]',
        `a password under the canonical minimum was not PASSWORD_LEMAH PANJANG (${JSON.stringify(p1.body)})`);
      const sandi = sandiBagas();
      const p2 = await b.jsonDari("/api/aktifkan/password", { form: { password: sandi } });
      c.expect(p2.status === 200, `the password was not set (${p2.status} ${JSON.stringify(p2.body)})`);
      const n1 = await b.jsonDari("/api/aktifkan/pin", { form: { pin: "1234" } });
      c.expect(n1.status === 422 && n1.body?.code === "PIN_SEQUENCE", `a weak PIN was not refused by its code (${JSON.stringify(n1.body)})`);
      const n2 = await b.jsonDari("/api/aktifkan/pin", { form: { pin: "2817" } });
      c.expect(n2.status === 200, "the PIN was not set");
      const s0 = await b.jsonDari("/api/aktifkan/selesai", { form: {} });
      c.expect(s0.status === 409 && s0.body?.code === "SETUP_BELUM_LENGKAP" && JSON.stringify(s0.body.kurang) === '["NAMA"]',
        `finishing before the name step did not say the name is missing (${JSON.stringify(s0.body)})`);
      k = await b.jsonDari("/api/aktifkan/keadaan");
      c.expect(k.body?.berikutnya === "NAMA" && (k.body.langkah as { nama: { nama: string } }).nama.nama === "Bagas Saputro",
        "the name step does not show the name as registered");
      const nm = await b.jsonDari("/api/aktifkan/nama", { form: { nama: "Bagas  Saputra" } });
      c.expect(nm.status === 200 && nm.body?.nama === "Bagas Saputra" && nm.body.diubah === true, `«Ubah nama» then «Sudah benar» did not take (${JSON.stringify(nm.body)})`);
      const nm2 = await b.jsonDari("/api/aktifkan/nama", { form: { nama: "Ironman" } });
      c.expect(nm2.status === 409 && nm2.body?.code === "NAMA_SUDAH_DIKONFIRMASI", "the name could be changed after its confirmation");
      const sl = await b.jsonDari("/api/aktifkan/selesai", { form: {} });
      c.expect(sl.status === 200 && sl.body?.tujuan === "/mengajar" && sl.body.kartu === "TERKIRIM",
        `finishing did not send the card and go to the Guru's home (${JSON.stringify(sl.body)})`);
      const kartu = (await sinkTunggu(email, 2)).find((p) => p.Subject !== surat[0]?.Subject);
      const pintarId = String(k.body?.pintarId ?? "");
      c.expect(!!kartu && kartu.Text.includes("Bagas Saputra") && kartu.Text.includes(`${pintarId.slice(0, 4)} ${pintarId.slice(4)}`),
        "the card email did not carry the confirmed name and the PINTAR ID 4+4");

      // 5. the hold lifts; the card's data; a finished wizard is closed
      const rumah = await b.kirim("/mengajar");
      c.expect(rumah.status === 200, `the Guru's home did not open once set-up was complete (${rumah.status})`);
      const kd = await b.jsonDari("/api/akun/kartu");
      const dk = kd.body?.kartu as { nama?: string; pintarId?: string; tautanId?: string; konteks?: Array<{ peran: string }> } | undefined;
      c.expect(kd.status === 200 && dk?.nama === "Bagas Saputra" && dk.pintarId === pintarId && dk.tautanId === `${asal}/id/${pintarId}`
        && dk.konteks?.[0]?.peran === "EDUCATOR", `Akun saya's card data is not the current identity (${JSON.stringify(kd.body)})`);
      const lagi = await b.jsonDari("/api/aktifkan/password", { form: { password: sandiBagas() } });
      c.expect(lagi.status === 409 && lagi.body?.code === "SETUP_SUDAH_SELESAI", "the wizard's password step was open after set-up");

      // 6. sign in by username and by email
      for (const identitas of [`BAGAS.${tag}`, email]) {
        const baru = new Peramban(asal, ipUji());
        const m = await baru.jsonDari("/masuk/password", { form: { identitas, password: sandi, lanjut: "/mengajar" } });
        c.expect(m.status === 200 && m.body?.tujuan === "/mengajar", `signing in with ${identitas.includes("@") ? "the email" : "the username"} failed (${m.status} ${JSON.stringify(m.body)})`);
        c.expect((await baru.kirim("/mengajar")).status === 200, "the signed-in session does not open the home");
      }
      c.expect(psql(`select count(*) from public.persons where display_name in ('Bagas Saputro', 'Bagas Saputra') and id = ${lit(pid)}`) === "1"
        && psql(`select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`) === "1",
        "the journey made another person or account");
      return c.verdict(
        "a person the platform admin registered as «Bagas Saputro» asked for a code (any case and spacing) and got the uniform answer; the code arrived "
        + `in the sink stating «berlaku ${PENGATURAN.berlakuMenit} menit» from the canonical setting; a wrong code was KODE_TIDAK_COCOK and the right one, `
        + "typed with a space, signed in to /aktifkan; the session was held there (a page redirects, an API answers setup_required); a taken and a "
        + "reserved username, a short password and a weak PIN were refused by their codes; finishing before the name said NAMA was missing; «Ubah nama» "
        + "made it «Bagas Saputra», once; finishing sent the card (the confirmed name, the PINTAR ID 4+4) and went to /mengajar, which then opened; "
        + "Akun saya's card reads the current identity; the wizard is closed afterwards; the username and the email each sign in; one person, one account");
    },
  },
  {
    id: "BOB26-A02",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const { LANTAI_GAGAL_MS } = await import("../src/lib/aktivasi");
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const asing = `bob26-asing-${tag}@local.invalid`;
      const users = () => psql("select count(*) from auth.users");
      const sebelum = users();
      const b = new Peramban(asal, ipUji());
      const jawab: string[] = [];
      for (const e of [asing, "alpha-guru@synthetic.pintar.test", "card-7001@cards.synthetic.pintar.test"]) {
        const r = await b.jsonDari("/aktifkan/kode", { form: { email: e } });
        jawab.push(`${r.status} ${JSON.stringify(r.body)}`);
      }
      c.expect(new Set(jawab).size === 1 && jawab[0].startsWith("200 "), `the code request answered addresses differently: ${jawab.join(" | ")}`);
      await new Promise((r) => setTimeout(r, 2500));
      c.expect((await sinkCari(asing)).length === 0 && (await sinkCari("alpha-guru@synthetic.pintar.test")).length === 0,
        "a stranger or a finished account was sent a code");
      c.expect(users() === sebelum, "asking for a code created an Auth user");
      const salahAlamat = await b.jsonDari("/aktifkan/kode", { form: { email: "bukan alamat" } });
      c.expect(salahAlamat.status === 400 && salahAlamat.body?.code === "EMAIL_TIDAK_SAH", "a non-address was not EMAIL_TIDAK_SAH");
      const asingLain = new Peramban("https://asing.example", ipUji());
      const csrf = await fetch(`${asal}/aktifkan/kode`, { method: "POST", headers: { origin: asingLain.asal }, body: new URLSearchParams({ email: asing }) });
      c.expect(csrf.status === 403, `a foreign page's request was not refused (${csrf.status})`);

      // one code, the floor, similar time: a wrong password and an unknown name
      const ukur = async (identitas: string) => {
        const p = new Peramban(asal, ipUji());
        const t0 = performance.now();
        const r = await p.jsonDari("/masuk/password", { form: { identitas, password: `Salah-${randomBytes(4).toString("hex")}` } });
        return { ms: performance.now() - t0, j: `${r.status} ${JSON.stringify(r.body)}` };
      };
      const tahu: number[] = [], tidak: number[] = [], bentuk = new Set<string>();
      for (let i = 0; i < 4; i++) {
        const a = await ukur("uji.alpha.guru"), z = await ukur(`tidak.ada.${tag}${i}`);
        tahu.push(a.ms); tidak.push(z.ms); bentuk.add(a.j); bentuk.add(z.j);
      }
      const median = (x: number[]) => [...x].sort((p, q) => p - q)[Math.floor(x.length / 2)];
      c.expect(bentuk.size === 1 && [...bentuk][0] === '401 {"ok":false,"code":"MASUK_TIDAK_COCOK"}', `the failures were not one answer: ${[...bentuk].join(" | ")}`);
      c.expect(Math.min(...tahu, ...tidak) >= LANTAI_GAGAL_MS - 5, `a failure came back before the floor (${Math.round(Math.min(...tahu, ...tidak))} ms)`);
      const beda = Math.abs(median(tahu) - median(tidak));
      c.expect(beda < 150, `a wrong password and an unknown name differ by ${Math.round(beda)} ms in the median`);

      // the counters, for a name that exists nowhere and for an address nobody has
      const p = new Peramban(asal, ipUji());
      let akhir: { status: number; retry: string | null; body: Record<string, unknown> | null } | null = null;
      for (let i = 0; i < 6; i++) akhir = await p.jsonDari("/masuk/password", { form: { identitas: `hantu.${tag}`, password: "Apa-saja-123" } });
      c.expect(akhir?.status === 429 && akhir.body?.code === "MASUK_TUNGGU" && Number(akhir.retry) > 0, `a sixth sign-in within 15 minutes was not MASUK_TUNGGU with Retry-After (${akhir?.status})`);
      for (let i = 0; i < 6; i++) akhir = await p.jsonDari("/aktifkan/periksa", { form: { email: asing, kode: "123 456" } });
      c.expect(akhir?.status === 429 && akhir.body?.code === "KODE_TUNGGU" && Number(akhir.retry) > 0, `a sixth code for an address within 15 minutes was not KODE_TUNGGU (${akhir?.status})`);
      c.note(`failure medians: wrong password ${Math.round(median(tahu))} ms, unknown name ${Math.round(median(tidak))} ms`);
      return c.verdict(
        `a stranger's address, a finished Guru's and a class card's got the identical 200 from the code request, nobody was sent anything and no Auth `
        + `user was made; a non-address is EMAIL_TIDAK_SAH and a foreign page is refused; a wrong password and an unknown username are the one `
        + `MASUK_TIDAK_COCOK, each no sooner than ${LANTAI_GAGAL_MS} ms, their medians within 150 ms; a sixth try is held (MASUK_TUNGGU, KODE_TUNGGU, `
        + `Retry-After) for a name and an address that exist nowhere`);
    },
  },
  {
    id: "BOB26-A03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const url = ctx.supabaseUrl!, anon = ctx.supabaseAnonKey!;
      // the Guru of the fixture: activated (a password, a username, a PIN)
      const email = "alpha-guru@synthetic.pintar.test", lama = "Sintetis-AlphaGuru-52!";
      const token = await authMasuk(url, anon, email, lama);
      c.expect(!!token, "the Guru could not sign in to Auth");
      const baru = `Diganti-${randomBytes(6).toString("hex")}`;
      const ubah = await fetch(`${url}/auth/v1/user`, {
        method: "PUT", headers: { apikey: anon, authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ password: baru }) });
      c.expect(!ubah.ok, `a signed-in session changed its own password through Auth's endpoint (${ubah.status})`);
      c.expect(!(await authMasuk(url, anon, email, baru)) && !!(await authMasuk(url, anon, email, lama)),
        "the password changed: the new one signs in, or the old one no longer does");
      // the Ironman test, through the API as the Guru
      const pid = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`);
      const nama = psql(`select display_name from public.persons where id = ${lit(pid)}`);
      const patch = await fetch(`${url}/rest/v1/persons?id=eq.${pid}`, {
        method: "PATCH", headers: { apikey: anon, authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=minimal" },
        body: JSON.stringify({ display_name: "Ironman" }) });
      c.expect(!patch.ok, `the Guru renamed themselves through PostgREST (${patch.status})`);
      c.expect(psql(`select display_name from public.persons where id = ${lit(pid)}`) === nama, "the Guru's name changed");
      // the photo stays the person's own: written back as it is, so the fixture is unchanged
      const fotoKini = psql(`select coalesce(to_json(photo_path)::text, 'null') from public.persons where id = ${lit(pid)}`);
      const foto = await fetch(`${url}/rest/v1/persons?id=eq.${pid}`, {
        method: "PATCH", headers: { apikey: anon, authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=minimal" },
        body: `{"photo_path":${fotoKini}}` });
      c.expect(foto.ok, `the Guru's own photo is no longer theirs to change (${foto.status})`);
      return c.verdict(
        "a signed-in Guru's session asked Auth to change its own password and was refused; the new password does not sign in and the old one "
        + "still does; the same session asked PostgREST to rename the Guru «Ironman» and was refused, the name unchanged, while the Guru's own photo "
        + "stays theirs");
    },
  },
  {
    id: "BOB26-A04",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `bob26-kartu-${tag}@local.invalid`;
      await daftar(asal, "Sari Wulandari", email);
      const b = new Peramban(asal, ipUji());
      await b.jsonDari("/aktifkan/kode", { form: { email } });
      const kode = kodeDari((await sinkTunggu(email, 1))[0]);
      const m = await b.jsonDari("/aktifkan/periksa", { form: { email, kode } });
      c.expect(m.status === 200, `the code did not sign in (${m.status})`);
      await b.jsonDari("/api/aktifkan/username", { form: { username: `sari.${tag}` } });
      await b.jsonDari("/api/aktifkan/password", { form: { password: sandiBagas() } });
      await b.jsonDari("/api/aktifkan/pin", { form: { pin: "7394" } });
      await b.jsonDari("/api/aktifkan/nama", { form: {} });
      // the address's hourly limit, used up (BOB-25's six an hour)
      const hash = psql(`select encode(sha256(convert_to(${lit(email)}, 'UTF8')), 'hex')`);
      psql(`insert into public.email_send_log (kind, recipient_hash, outcome, settled_at)
            select 'UJI_PENGIRIMAN', ${lit(hash)}, 'SENT', now() from generate_series(1, 6)`);
      const sl = await b.jsonDari("/api/aktifkan/selesai", { form: {} });
      c.expect(sl.status === 200 && sl.body?.kartu === "BELUM_TERKIRIM", `a refused card was not BELUM_TERKIRIM (${JSON.stringify(sl.body)})`);
      c.expect(psql(`select s.state from public.account_setup s join public.accounts a on a.id = s.account_id join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`) === "COMPLETE",
        "the set-up did not complete when the card could not be sent");
      c.expect((await sinkCari(email)).length === 1, "a card email was sent over the limit");
      const tetap = await b.jsonDari("/api/akun/kartu/kirim", { form: {} });
      c.expect(tetap.status === 200 && tetap.body?.kartu === "BELUM_TERKIRIM", "Akun saya claimed to send a card over the limit");
      psql(`delete from public.email_send_log where recipient_hash = ${lit(hash)} and kind = 'UJI_PENGIRIMAN'`);
      const kirim = await b.jsonDari("/api/akun/kartu/kirim", { form: {} });
      c.expect(kirim.status === 200 && kirim.body?.kartu === "TERKIRIM", `Akun saya did not send the card later (${JSON.stringify(kirim.body)})`);
      c.expect((await sinkTunggu(email, 2)).some((p) => p.Text.includes("Sari Wulandari")), "the card sent later did not arrive");
      return c.verdict(
        "with the address's hourly limit used up, finishing the wizard completed the set-up and answered BELUM_TERKIRIM, and nothing was sent; "
        + "Akun saya's send said BELUM_TERKIRIM while the limit held, and once it had passed sent the card, which arrived");
    },
  },
];

export const bob26Tests: SelfTest[] = [
  {
    id: "BOB26-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      const a = await import("../src/lib/aktivasi");
      const { kunciIdentitas } = await import("../src/lib/card");
      const nanti: Array<() => Promise<void>> = [];
      const alatKode = (ada: boolean) => ({
        sasaran: async () => (ada ? { authUserId: "00000000-0000-0000-0000-000000000001", nama: "X" } : null),
        jedaKirimUlang: async () => 60,
        jedaPengiriman: async () => 0, // D-098(c): PINTAR can send; its own case is EMAILJUJUR-K01
        catatPermintaan: async () => 0,
        kirim: async () => { throw new Error("the host refused"); },
        nanti: (k: () => Promise<void>) => { nanti.push(k); },
        catatGalat: () => {},
      });
      const h1 = await a.mintaKode({ origin: true, email: "ada@local.invalid", ulang: null }, alatKode(true));
      const h0 = await a.mintaKode({ origin: true, email: "tiada@local.invalid", ulang: null }, alatKode(false));
      c.expect(JSON.stringify(h1) === JSON.stringify(h0), "the code request answers differently when the lookup finds an account");
      c.expect(nanti.length === 1, "the send was not left for after the answer, or was scheduled for nobody");
      await Promise.all(nanti.map((k) => k()));
      c.expect(a.angkaKode("482 913") === "482913" && a.angkaKode("482-913") === "482913" && a.angkaKode(" 482913\n") === "482913",
        "the code is not read as its digits");
      let dipanggil = "";
      const waktu = { t: 0 };
      const hasil = await a.masukPassword({ origin: true, identitas: "Siapa.Saja", password: "x", lanjut: null }, {
        resolusi: async () => null, catat: async () => 0, selesaikan: async () => {},
        masuk: async (e) => { dipanggil = e; waktu.t += 30; return { error: { status: 400, code: "invalid_credentials" } }; },
        keadaan: async () => "COMPLETE", tujuan: async () => "/", tunggu: async (ms) => { waktu.t += ms; }, sekarang: () => waktu.t, catatGalat: () => {},
      });
      c.expect(dipanggil === a.ALAMAT_TIADA, "an unknown name does not take the same call to Auth");
      c.expect(hasil.status === 401 && waktu.t >= a.LANTAI_GAGAL_MS, "an unknown name's failure is not answered at the floor");
      process.env.CARD_PEPPER ??= "k01-pepper-for-the-key-shape-only-32chars";
      c.expect(kunciIdentitas("masuk-password", "akun|x@y.z") !== kunciIdentitas("kode-alamat", "akun|x@y.z"), "the two counters share keys");
      return c.verdict("the code request answers alike whether the lookup finds an account or not and sends only after answering; the code is read as "
        + "its digits («482 913», «482-913»); an unknown name makes the same call to Auth and waits for the floor; the two counters keep separate keys");
    },
  },
  {
    id: "BOB26-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const kanonik = JSON.parse(baca("supabase/auth-identitas.json")) as { settings: Record<string, unknown>; config_toml: Record<string, string | null> };
      const toml = baca("supabase/config.toml");
      const nilaiToml = (kunci: string): string | null => {
        const [bagian, ...jalan] = kunci.split(".");
        const nama = jalan.pop()!;
        const judul = `[${[bagian, ...jalan].join(".")}]`;
        const i = toml.indexOf(`\n${judul}\n`);
        if (i < 0) return null;
        const isi = toml.slice(i + judul.length + 2).split(/\n\[/)[0];
        return new RegExp(`^${nama}\\s*=\\s*(.+)$`, "m").exec(isi)?.[1].trim().replace(/^"(.*)"$/, "$1") ?? null;
      };
      for (const [k, v] of Object.entries(kanonik.settings)) {
        const tempat = kanonik.config_toml[k];
        if (tempat === undefined) { c.expect(false, `${k} has no place named in config_toml`); continue; }
        if (tempat === null) continue;
        c.expect(nilaiToml(tempat) === String(v), `config.toml's ${tempat} is ${nilaiToml(tempat)}, not the canonical ${v}`);
      }
      // change the canonical value: the email's validity follows it
      const { bacaPengaturan } = await import("../src/lib/pengaturan-auth");
      const { templatKode } = await import("../src/components/email/identitas");
      const konteks = { asal: "https://app.pintarselalu.com", staging: false };
      for (const detik of [600, 900, 300]) {
        const p = bacaPengaturan({ settings: { ...(kanonik.settings as Record<string, unknown>), mailer_otp_exp: detik } as never });
        const e = templatKode({ kode: "482913", berlakuMenit: p.berlakuMenit, nama: "Sari", ulang: false }, konteks);
        // RESTATED AT THE JOINT GATE: DAISY-20's wording, «berlaku selama N menit»
        const berlaku = new RegExp(`berlaku (?:selama )?${detik / 60} menit`);
        c.expect(berlaku.test(e.teks) && berlaku.test(e.html),
          `with mailer_otp_exp ${detik}, the email does not say «berlaku selama ${detik / 60} menit»`);
      }
      // no validity typed anywhere else: the routes and the send read PENGATURAN
      const kirim = tanpaKomentar(baca("src/app/api/_email/identitas.ts")), inti = tanpaKomentar(baca("src/lib/aktivasi.ts"));
      c.expect(/berlakuMenit:\s*PENGATURAN\.berlakuMenit/.test(kirim) && /berlakuMenit:\s*PENGATURAN\.berlakuMenit/.test(inti),
        "the code email or the code screen does not take its validity from the canonical setting");
      c.expect(!/berlaku[^`\n]{0,20}\b\d+\s*menit/.test(tanpaKomentar(baca("src/components/email/identitas.ts"))),
        "a validity is typed into the code email");
      // the workflows: written from the file, read back, drift fails
      const staging = baca(".github/workflows/staging.yml"), facts = baca(".github/workflows/identity-facts.yml");
      c.expect(/auth-identitas-banding\.py --body/.test(staging) && /auth-identitas-banding\.py \/tmp\/after\.json staging/.test(staging)
        && /supabase\/auth-identitas\.json/.test(staging), "staging.yml does not write Gate 3's settings from the canonical file and read them back");
      c.expect(/auth-identitas-banding\.py \/tmp\/auth\.json staging\n/.test(facts) && /production_applied/.test(facts),
        "identity-facts.yml does not fail staging on drift, or ignores production_applied");
      const skrip = baca("scripts/auth-identitas-banding.py");
      c.expect(/return 1/.test(skrip) && /::error::/.test(skrip), "the comparison does not fail on a difference");
      return c.verdict("config.toml carries every canonical Gate 3 setting it can hold (the two it cannot are named); with mailer_otp_exp 600, 900 and "
        + "300 the code email says 10, 15 and 5 minutes; the code screen and the send read the validity from the canonical setting and none is typed; "
        + "staging.yml writes the file's settings and asserts them back, and identity-facts.yml fails staging on any drift and production once applied");
    },
  },
];
