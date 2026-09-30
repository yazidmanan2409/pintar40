/**
 * BOB-25 (Gate 2E, D-057(a), C-09) -- PINTAR SENDS ITS OWN EMAIL.
 *
 *   BOB25-K01  static: the configuration rules, executed (the four variables,
 *              no fallbacks, TLS on 465, plain only to this machine, FROM and
 *              Reply-To fixed, every origin but production's marked); and the
 *              module's own shape read from source (the transport checks the
 *              certificate, nothing logs an address, a reply or a message, code
 *              issuing can never create an Auth user, the proof route is a
 *              platform admin's only)
 *   BOB25-S01  db + mailsink: real sends into the Mailpit sink, logged by the
 *              database's own email_send_reserve / email_send_settle: sent;
 *              refused by the limits; refused by the host (Mailpit's chaos) and
 *              reported as not sent, then sent when asked again later; no
 *              connection; configuration and header errors refused before
 *              anything is counted; the log and the console hold no address,
 *              code or password
 *   BOB25-A01  network + db + mailsink (CI's local stack): a code issued by
 *              Auth's admin generate_link for an existing user verifies; an
 *              unknown id issues nothing and creates no user; the production
 *              path (the service-role RPCs) sends and logs
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Checks, type SelfTest } from "./lib";

const SINK_API = "http://127.0.0.1:54324/api/v1";
const SINK_SMTP = { host: "127.0.0.1", port: "54325" };
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

type Pengaturan = typeof import("../src/app/api/_email/pengaturan");
type Kirim = typeof import("../src/app/api/_email/kirim");

function psql(sql: string): string {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}

/** The send log's two calls, reached through psql: the database's own functions, not a copy of their rules. */
function catatanPsql(): import("../src/app/api/_email/kirim").CatatanKirim {
  return {
    async cadang(jenis, hash) {
      if (!/^[A-Z_]+$/.test(jenis) || !/^[0-9a-f]{64}$/.test(hash)) throw new Error("unexpected reserve argument");
      return JSON.parse(psql(`select public.email_send_reserve('${jenis}', '${hash}')`));
    },
    async selesai(id, akhir, kode) {
      if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("unexpected settle argument");
      psql(`select public.email_send_settle('${id}', '${akhir}', ${kode === null ? "null" : Number(kode)})`);
      return true;
    },
  };
}

type PesanSink = { ID: string; From: { Name: string; Address: string }; To: Array<{ Address: string }>;
  ReplyTo: Array<{ Address: string }>; Subject: string; Text: string; HTML: string };

async function sinkCari(alamat: string): Promise<PesanSink[]> {
  const r = await fetch(`${SINK_API}/search?query=${encodeURIComponent(`to:"${alamat}"`)}`);
  const d = (await r.json()) as { messages?: Array<{ ID: string }> };
  const out: PesanSink[] = [];
  for (const m of d.messages ?? []) out.push((await (await fetch(`${SINK_API}/message/${m.ID}`)).json()) as PesanSink);
  return out;
}
async function sinkChaos(kode: number | null) {
  await fetch(`${SINK_API}/chaos`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ Recipient: { ErrorCode: kode ?? 451, Probability: kode === null ? 0 : 100 } }),
  });
}
async function sinkHapus(ids: string[]) {
  if (ids.length) await fetch(`${SINK_API}/messages`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ IDs: ids }) });
}

/** Runs `f` with these process variables set, then puts every one back as it was. */
async function denganEnv<T>(env: Record<string, string | undefined>, f: () => Promise<T>): Promise<T> {
  const lama: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    lama[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
  try {
    return await f();
  } finally {
    for (const k of Object.keys(lama)) {
      if (lama[k] === undefined) delete process.env[k];
      else process.env[k] = lama[k];
    }
  }
}

/** Captures what the module writes to the console while `f` runs. */
async function tangkapKonsol<T>(f: () => Promise<T>): Promise<{ hasil: T; keluaran: string }> {
  const asli = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  let keluaran = "";
  const catat = (...a: unknown[]) => { keluaran += a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n"; };
  console.log = console.error = console.warn = console.info = catat;
  try {
    return { hasil: await f(), keluaran };
  } finally {
    Object.assign(console, asli);
  }
}

export const bob25Tests: SelfTest[] = [
  {
    id: "BOB25-K01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let p: Pengaturan | null = null;
      try { p = await import("../src/app/api/_email/pengaturan"); } catch { p = null; }
      if (!c.expect(!!p?.bacaPengaturanEmail, "src/app/api/_email/pengaturan.ts has no bacaPengaturanEmail: nothing reads PINTAR's SMTP settings")) {
        return c.verdict("");
      }
      const RAHASIA = "rahasia-" + randomBytes(6).toString("hex");
      const dasar = { PINTAR_SMTP_HOST: "pintarselalu.com", PINTAR_SMTP_PORT: "465", PINTAR_SMTP_USER: "noreply@pintarselalu.com", PINTAR_SMTP_PASSWORD: RAHASIA };
      const baca = (env: Record<string, string | undefined>, asal = "https://staging.pintarselalu.com") => {
        try { return { ok: p!.bacaPengaturanEmail(env, asal) }; } catch (e) { return { galat: e as { kode?: string; message: string } }; }
      };

      // the four, each required, with no fallback, and never echoed
      for (const nama of Object.keys(dasar)) {
        for (const kosong of [undefined, ""]) {
          const r = baca({ ...dasar, [nama]: kosong });
          c.expect(r.galat?.kode === "VARIABEL_HILANG" && r.galat.message.includes(nama) && (r.galat as { variabel?: string }).variabel === nama,
            `${nama} ${kosong === undefined ? "missing" : "empty"} was answered ${JSON.stringify(r.ok ? { ...r.ok, password: "(redacted)" } : r.galat?.message)}, not refused by name`);
        }
      }
      // TLS on 465, plain only to this machine, anything else refused before connecting
      c.expect(baca(dasar).ok?.jalur === "TLS", "pintarselalu.com:465 is not TLS from the first byte");
      for (const host of ["127.0.0.1", "localhost", "::1"]) {
        c.expect(baca({ ...dasar, PINTAR_SMTP_HOST: host, PINTAR_SMTP_PORT: "54325" }).ok?.jalur === "SINK", `${host}:54325 is not the local sink`);
      }
      for (const [host, port] of [["pintarselalu.com", "587"], ["pintarselalu.com", "25"], ["smtp.example.com", "2525"], ["10.0.0.5", "1025"]]) {
        const r = baca({ ...dasar, PINTAR_SMTP_HOST: host, PINTAR_SMTP_PORT: port });
        c.expect(r.galat?.kode === "KONEKSI_TIDAK_AMAN", `${host}:${port} was answered ${JSON.stringify(r.ok?.jalur ?? r.galat?.kode)}, not refused as unencrypted`);
      }
      for (const [nama, nilai] of [["PINTAR_SMTP_PORT", "465x"], ["PINTAR_SMTP_PORT", "70000"], ["PINTAR_SMTP_HOST", "smtp://pintarselalu.com"], ["PINTAR_SMTP_USER", "noreply"]]) {
        c.expect(baca({ ...dasar, [nama]: nilai }).galat?.kode === "NILAI_TIDAK_SAH", `${nama}=${nilai} was accepted`);
      }
      c.expect(baca(dasar, "http://staging.pintarselalu.com").galat?.kode === "NILAI_TIDAK_SAH", "a plain-http origin other than this machine was accepted");
      // no message ever carries the password
      const semua = [undefined, "", "465x"].flatMap((v) => Object.keys(dasar).map((n) => baca({ ...dasar, [n]: v })));
      c.expect(semua.every((r) => !(r.galat?.message ?? "").includes(RAHASIA)), "a configuration error carries the password");
      // FROM is the SMTP user; «(Staging)» on every origin but production's; Reply-To fixed
      const prod = baca(dasar, "https://app.pintarselalu.com").ok;
      const stg = baca(dasar, "https://staging.pintarselalu.com/masuk").ok;
      const lokal = baca({ ...dasar, PINTAR_SMTP_HOST: "127.0.0.1", PINTAR_SMTP_PORT: "54325" }, "http://localhost:3999").ok;
      c.expect(prod?.dari.name === "Tim PINTAR" && prod.dari.address === "noreply@pintarselalu.com" && prod.staging === false,
        `production's sender is ${JSON.stringify(prod?.dari)}`);
      c.expect(stg?.dari.name === "Tim PINTAR (Staging)" && stg.staging && stg.asal === "https://staging.pintarselalu.com",
        `staging's sender is ${JSON.stringify(stg?.dari)} at ${stg?.asal}`);
      c.expect(lokal?.dari.name === "Tim PINTAR (Staging)" && lokal.staging, "a local origin is not marked as a test");
      c.expect([prod, stg, lokal].every((x) => x?.balasKe === "info@pintarselalu.com"), "Reply-To is not info@pintarselalu.com");
      c.expect(baca({ ...dasar, PINTAR_SMTP_USER: "lain@pintarselalu.com" }, "https://app.pintarselalu.com").ok?.dari.address === "lain@pintarselalu.com",
        "FROM is not the SMTP user");

      // the module's own shape, read from source
      const baca_ = (f: string) => tanpaKomentar(readFileSync(join(repoRoot, f), "utf8"));
      const kirim = baca_("src/app/api/_email/kirim.ts");
      c.expect(/secure:\s*p\.jalur === "TLS"/.test(kirim) && /rejectUnauthorized:\s*true/.test(kirim) && /servername:\s*p\.host/.test(kirim),
        "the transport does not use TLS from the first byte with the certificate checked against the host");
      c.expect(/ignoreTLS:\s*p\.jalur === "SINK"/.test(kirim), "the transport may skip TLS outside the local sink");
      c.expect(/disableFileAccess:\s*true/.test(kirim) && /disableUrlAccess:\s*true/.test(kirim), "the transport may read a file or a URL into a message");
      for (const m of kirim.matchAll(/console\.\w+\(([^;]*)\);/g)) {
        const argumen = m[1].replace(/"[^"]*"/g, '""');   // the fixed tag is not what is logged
        c.expect(!/\b(alamat|ke|email|p\.|info|e\b|e\.message|password)/.test(argumen), `the module logs more than its reference and outcome: console(${m[1].trim()})`);
      }
      c.expect(/bacaPengaturanEmail\(\)[\s\S]*periksaEmailJadi\(email\)[\s\S]*catatan\.cadang/.test(kirim),
        "configuration and the finished email are not checked before the send is counted");
      const kode = baca_("src/app/api/_email/kode.ts");
      c.expect(/getUserById\(authUserId\)[\s\S]*generateLink\(\{\s*type:\s*"magiclink",\s*email\s*\}\)/.test(kode) && /email_otp/.test(kode),
        "code issuing does not read an existing user's email before asking generate_link for its email_otp");
      c.expect(!/createUser|inviteUserByEmail|signInWithOtp|signUp\(|console\./.test(kode), "code issuing can create a user, send through Auth, or log");
      const rute = baca_("src/app/api/email/uji/route.ts");
      c.expect(/origin[\s\S]*is_system_admin[\s\S]*kirimEmail/.test(rute) && /adminPlatform !== true/.test(rute),
        "the proof route can send before checking the origin and that the caller is a platform admin");
      return c.verdict("the four variables, each required and never echoed; TLS on 465, plain only to this machine, anything else refused; "
        + "FROM the SMTP user as «Tim PINTAR», «Tim PINTAR (Staging)» on every other origin, Reply-To info@pintarselalu.com; the transport "
        + "checks the certificate and reads no file or URL; nothing logs an address, a reply or a message; code issuing reads an existing "
        + "user and can create none; the proof route is a same-origin platform admin's only");
    },
  },
  {
    id: "BOB25-S01",
    requires: ["db", "mailsink"],
    run: async () => {
      const c = new Checks();
      let k: Kirim | null = null;
      let p: Pengaturan | null = null;
      try { k = await import("../src/app/api/_email/kirim"); p = await import("../src/app/api/_email/pengaturan"); } catch { k = null; }
      if (!c.expect(!!k?.kirimEmail, "src/app/api/_email/kirim.ts has no kirimEmail: PINTAR cannot send its own email")) return c.verdict("");
      const tag = randomBytes(5).toString("hex");
      const RAHASIA = "sandi-" + randomBytes(8).toString("hex");
      const KODE = "48" + String(1000 + Math.floor(Math.random() * 8999));
      const alamat = (x: string) => `bob25-${tag}-${x}@local.invalid`;
      const hash = (a: string) => k!.hashAlamat(a);
      const env = { PINTAR_SMTP_HOST: SINK_SMTP.host, PINTAR_SMTP_PORT: SINK_SMTP.port, PINTAR_SMTP_USER: "noreply@pintarselalu.com",
        PINTAR_SMTP_PASSWORD: RAHASIA, NEXT_PUBLIC_APP_URL: "https://staging.pintarselalu.com" };
      const surel = (konteks: { asal: string; staging: boolean }) => ({
        subjek: `Kode aktivasi ${tag}`,
        teks: `Kode Anda: ${KODE}\n${konteks.asal}\n`,
        html: `<p>Kode Anda: <b>${KODE}</b></p><p>${konteks.asal}</p>`,
      });
      const kirim = (ke: string, jenis: import("../src/lib/email/templat").JenisEmail = "KODE_AKTIVASI") =>
        k!.kirimEmail({ ke, jenis, susun: surel }, catatanPsql());
      const baris = (a: string) => psql(`select coalesce(json_agg(row_to_json(l) order by requested_at), '[]') from public.email_send_log l where recipient_hash = '${hash(a)}'`);
      const semuaBaris = () => psql(`select count(*) from public.email_send_log`);
      const sinkIds: string[] = [];
      let konsol = "";
      try {
        await sinkChaos(null);
        await denganEnv(env, async () => {
          // 1. sent, as staging: the sink holds it, FROM, Reply-To and both parts as fixed
          const t1 = await tangkapKonsol(() => kirim("  " + alamat("a").toUpperCase() + " "));
          konsol += t1.keluaran;
          c.expect(t1.hasil.terkirim === true, `a send to the sink was answered ${JSON.stringify(t1.hasil)}`);
          const [m] = await sinkCari(alamat("a"));
          if (c.expect(!!m, "the sink holds no message for the address")) {
            sinkIds.push(m.ID);
            c.expect(m.From.Name === "Tim PINTAR (Staging)" && m.From.Address === "noreply@pintarselalu.com", `FROM is ${JSON.stringify(m.From)}`);
            c.expect(m.ReplyTo?.[0]?.Address === "info@pintarselalu.com", `Reply-To is ${JSON.stringify(m.ReplyTo)}`);
            c.expect(m.To?.[0]?.Address === alamat("a"), "the address was not trimmed and lower-cased");
            c.expect(m.Subject === `Kode aktivasi ${tag}` && m.Text.includes(KODE) && m.HTML.includes(`<b>${KODE}</b>`), "the subject or a body did not arrive whole");
            c.expect(m.Text.includes("https://staging.pintarselalu.com") , "the template was not given the environment's origin");
          }
          const r1 = JSON.parse(baris(alamat("a")));
          c.expect(r1.length === 1 && r1[0].outcome === "SENT" && r1[0].smtp_code === 250 && r1[0].kind === "KODE_AKTIVASI",
            `the send was logged as ${JSON.stringify(r1)}`);

          // 2. production's origin: «Tim PINTAR»
          await denganEnv({ NEXT_PUBLIC_APP_URL: "https://app.pintarselalu.com" }, async () => {
            const t = await kirim(alamat("b"));
            c.expect(t.terkirim, `a send as production was answered ${JSON.stringify(t)}`);
          });
          const [mb] = await sinkCari(alamat("b"));
          if (mb) sinkIds.push(mb.ID);
          c.expect(mb?.From.Name === "Tim PINTAR", `production's FROM is ${JSON.stringify(mb?.From)}`);

          // 3. the limits refuse before the host is asked: logged, nothing sent
          const t3 = await kirim(alamat("a"));
          c.expect(!t3.terkirim && t3.alasan === "BATAS_ALAMAT", `a second code to the same address within a minute was answered ${JSON.stringify(t3)}`);
          c.expect((await sinkCari(alamat("a"))).length === 1, "a send refused by the limits reached the host");
          c.expect(JSON.parse(baris(alamat("a"))).some((r: { outcome: string; limit_scope: string }) => r.outcome === "REFUSED_LIMIT" && r.limit_scope === "ADDRESS_KIND"),
            "the limit's refusal was not logged");

          // 4. the host refuses (Mailpit's chaos, 451): not sent, logged, and asking again later works
          await sinkChaos(451);
          const t4 = await tangkapKonsol(() => kirim(alamat("c")));
          konsol += t4.keluaran;
          await sinkChaos(null);
          c.expect(!t4.hasil.terkirim && t4.hasil.alasan === "DITOLAK_SERVER", `a send the host refused with 451 was answered ${JSON.stringify(t4.hasil)}`);
          c.expect((await sinkCari(alamat("c"))).length === 0, "the host's refusal still delivered a message");
          const r4 = JSON.parse(baris(alamat("c")));
          c.expect(r4.length === 1 && r4[0].outcome === "REFUSED_BY_HOST" && r4[0].smtp_code === 451, `the host's refusal was logged as ${JSON.stringify(r4)}`);
          psql(`update public.email_send_log set requested_at = requested_at - interval '61 seconds' where recipient_hash = '${hash(alamat("c"))}'`);
          const t4b = await kirim(alamat("c"));
          const mc = await sinkCari(alamat("c"));
          sinkIds.push(...mc.map((x) => x.ID));
          c.expect(t4b.terkirim && mc.length === 1, `asking again after the minute was answered ${JSON.stringify(t4b)} with ${mc.length} message(s)`);

          // 5. no connection at all: not sent, logged as FAILED
          await denganEnv({ PINTAR_SMTP_PORT: "1" }, async () => {
            const t = await kirim(alamat("d"));
            c.expect(!t.terkirim && t.alasan === "GAGAL_KIRIM", `a send with nothing listening was answered ${JSON.stringify(t)}`);
          });
          const r5 = JSON.parse(baris(alamat("d")));
          c.expect(r5.length === 1 && r5[0].outcome === "FAILED" && r5[0].smtp_code === null, `the failed connection was logged as ${JSON.stringify(r5)}`);

          // 6. refused before anything is counted: configuration, and a subject carrying a header
          const sebelum = semuaBaris();
          for (const [label, e] of [["PINTAR_SMTP_HOST missing", { PINTAR_SMTP_HOST: undefined }],
                                    ["PINTAR_SMTP_PASSWORD missing", { PINTAR_SMTP_PASSWORD: undefined }],
                                    ["an unencrypted connection to smtp.example.com:587", { PINTAR_SMTP_HOST: "smtp.example.com", PINTAR_SMTP_PORT: "587" }]] as const) {
            let kodeGalat = "";
            await denganEnv(e as Record<string, string | undefined>, async () => {
              try { await kirim(alamat("e")); kodeGalat = "SENT"; } catch (x) { kodeGalat = x instanceof p!.GalatPengaturanEmail ? x.kode : String(x); }
            });
            c.expect(kodeGalat === "VARIABEL_HILANG" || kodeGalat === "KONEKSI_TIDAK_AMAN", `${label} was answered ${kodeGalat}`);
          }
          let injeksi = "";
          try {
            await k!.kirimEmail({ ke: alamat("f"), jenis: "UJI_PENGIRIMAN", susun: () => ({ subjek: "Uji\r\nBcc: orang@lain.test", teks: "x", html: "<p>x</p>" }) }, catatanPsql());
            injeksi = "sent";
          } catch (x) { injeksi = x instanceof k!.GalatEmail ? "refused" : String(x); }
          c.expect(injeksi === "refused", `a subject carrying a header was ${injeksi}`);
          c.expect(semuaBaris() === sebelum, "a refused configuration or email was counted in the send log");
          c.expect((await sinkCari(alamat("e"))).length === 0 && (await sinkCari(alamat("f"))).length === 0, "a refused configuration or email reached the sink");
        });

        // 7. the log and the console hold no address, code or password
        const log = [..."abcd"].map((x) => baris(alamat(x))).join("\n");
        for (const [apa, nilai] of [["an address", `bob25-${tag}`], ["the code", KODE], ["the password", RAHASIA]]) {
          c.expect(!log.toLowerCase().includes(nilai.toLowerCase()), `the send log holds ${apa}`);
          c.expect(!konsol.toLowerCase().includes(nilai.toLowerCase()), `the module's console output holds ${apa}`);
        }
        c.expect(/\[email\] not sent/.test(konsol), "a refused send left no line at all for the operator");
      } finally {
        await sinkChaos(null).catch(() => undefined);
        await sinkHapus(sinkIds).catch(() => undefined);
        try { psql(`delete from public.email_send_log where recipient_hash in (${[..."abcdef"].map((x) => `'${hash(alamat(x))}'`).join(",")})`); } catch { /* the verdict already says */ }
      }
      return c.verdict("sent into the sink with FROM «Tim PINTAR (Staging)» or «Tim PINTAR» as the SMTP user, Reply-To info@pintarselalu.com, "
        + "the address normalised and both parts whole, logged SENT 250; the minute's limit refused the second code before the host, logged "
        + "REFUSED_LIMIT; the host's 451 (Mailpit chaos) answered DITOLAK_SERVER, delivered nothing, logged REFUSED_BY_HOST 451, and after the "
        + "minute the same address was sent; no listener answered GAGAL_KIRIM, logged FAILED; a missing variable, an unencrypted non-local "
        + "host and a subject carrying a header were refused before anything was counted; the log and the console hold no address, code "
        + "or password");
    },
  },
  {
    id: "BOB25-A01",
    requires: ["network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      if (!c.expect(!!ctx.supabaseServiceRoleKey, "the runner has no service-role key: the production path cannot be driven")) return c.verdict("");
      const kodeMod = await import("../src/app/api/_email/kode");
      const k = await import("../src/app/api/_email/kirim");
      const pengguna = psql(`select id || '|' || email from auth.users where email = 'sysadmin@synthetic.pintar.test'`).split("|");
      const jumlahPengguna = () => psql(`select count(*) from auth.users`);
      const sebelum = jumlahPengguna();

      const hasil = await kodeMod.terbitkanKodeEmail(pengguna[0]);
      c.expect(!!hasil && hasil.email === pengguna[1] && /^\d{6,10}$/.test(hasil.kode), "generate_link issued no code for an existing user");
      if (hasil) {
        const anon = createClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, { auth: { persistSession: false } });
        let v = await anon.auth.verifyOtp({ email: hasil.email, token: hasil.kode, type: "email" });
        if (v.error) v = await anon.auth.verifyOtp({ email: hasil.email, token: hasil.kode, type: "magiclink" });
        c.expect(!v.error && !!v.data.session, `the issued code did not verify: ${v.error?.message ?? "no session"}`);
      }
      c.expect((await kodeMod.terbitkanKodeEmail("00000000-0000-4000-8000-" + randomBytes(6).toString("hex"))) === null, "an unknown user id issued a code");
      c.expect((await kodeMod.terbitkanKodeEmail("guru@contoh.test")) === null, "an address was taken for a user id");
      c.expect(jumlahPengguna() === sebelum, "issuing codes created an Auth user");

      // the production path: the service-role RPCs, into the sink
      const tag = randomBytes(5).toString("hex");
      const ke = `bob25-a01-${tag}@local.invalid`;
      const t = await denganEnv({ PINTAR_SMTP_HOST: SINK_SMTP.host, PINTAR_SMTP_PORT: SINK_SMTP.port, PINTAR_SMTP_USER: "noreply@pintarselalu.com",
        PINTAR_SMTP_PASSWORD: "sink-" + tag, NEXT_PUBLIC_APP_URL: "https://staging.pintarselalu.com" }, () =>
        k.kirimEmail({ ke, jenis: "KODE_AKTIVASI", susun: () => ({ subjek: "Kode", teks: `Kode: ${hasil?.kode ?? "0"}`, html: `<p>${hasil?.kode ?? "0"}</p>` }) }));
      const ms = await sinkCari(ke);
      c.expect(t.terkirim && ms.length === 1, `the production path was answered ${JSON.stringify(t)} with ${ms.length} message(s) in the sink`);
      const log = psql(`select coalesce(json_agg(row_to_json(l)), '[]') from public.email_send_log l where recipient_hash = '${k.hashAlamat(ke)}'`);
      c.expect(/"outcome":"SENT"/.test(log) && !(hasil && log.includes(hasil.kode)), `the production path logged ${log}`);
      await sinkHapus(ms.map((m) => m.ID)).catch(() => undefined);
      psql(`delete from public.email_send_log where recipient_hash = '${k.hashAlamat(ke)}'`);
      return c.verdict("generate_link issued a code for an existing user and it verified; an unknown id and an address issued nothing and no "
        + "Auth user was created; the service-role path reserved, sent into the sink and logged SENT without the code");
    },
  },
];
