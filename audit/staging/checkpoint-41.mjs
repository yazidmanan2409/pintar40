// STAGING ONLY. The 4.1 staging checkpoint's acting steps (STAGING-CHECKPOINT-BEFORE-A2A.md §3c; the page
// docs/completion-4.1/checkpoint/PROMOTION-PRECONDITIONS.md, items 1, 2, 3, 6 and 4 in its order). Run by
// .github/workflows/staging-checkpoint-41.yml, dispatched by the Chief Architect AFTER the merge, on staging's existing
// secrets. No credential passes through any person, and none is created.
//
// HOW IT RUNS:
//   * It stops at the first result that differs from the page. Each step's result goes to OUT_DIR/checkpoint-41.json
//     and to the job summary.
//   * Never printed: a secret, a card number, a PIN, a password or a token (each is masked before use).
//
// WHO ACTS, AND HOW:
//   * Synthetic people only. The actors are the Golden School's own staff (goldenschool+<slug>-…@pintarselalu.com):
//     - SA: the school's administrator;
//     - S: its teacher, whose password is derived from GS_MAILBOX_PASSWORD, as every walk derives it;
//     - PA: the Platform Operator (D-088(a)).
//   * Each actor signs in as the walks do (masuk.mjs: the password, or an emailed code), never by a server-made
//     session.
//   * L, the synthetic learner, is rostered, suspended, given a class card, reinstated and, at the end, closed and
//     anonymised.
//   * Every act goes through PINTAR's own paths:
//     - the app's routes (/pendataan, /api/akun/aktivasi, /api/akun/kartu-kelas, /api/masuk/*, /api/akun/hapus-data);
//     - or the database function a screen calls, with the actor's own session (the screen's server action forwards
//       to that function, and the database decides with the caller's JWT).
//   * Never Auth's Admin API.
//
// NEVER: production. Staging's ref, its database URL and the origin are checked first, as staging.yml checks them.
// Also never: a direct write to a PINTAR table. The only direct statements are item 1's scratch schema and job,
// removed in the same step, and item 2's advisory lock, which writes nothing.
//
// CHECKPOINT_LOCAL=1 runs the same steps against a local stack, for the engineer's test: the actors sign in with a
// server-made session, and every staging name is refused.
import { chromium } from "playwright";
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, session, sessionCookies } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const LOCAL = process.env.CHECKPOINT_LOCAL === "1";
const DB = env("STAGING_SUPABASE_DB_URL");               // staging's session pooler (docs/deployment/STAGING.md)
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
const RUN = (process.env.GITHUB_RUN_ID ?? String(Date.now())).slice(-6);

if (LOCAL) {
  if (![DB, SB, APP].every((u) => /127\.0\.0\.1|localhost/.test(u))) throw new Error("CHECKPOINT_LOCAL runs only against a local stack");
} else {
  if (REF === PRODUCTION_REF || !DB.includes(REF) || DB.includes(PRODUCTION_REF) || !SB.includes(REF)
      || !/^https:\/\/staging\.pintarselalu\.com$/.test(APP)) throw new Error("not staging");
}
mkdirSync(join(OUT, "shots"), { recursive: true });

// ── the record
const hasil = { run: process.env.GITHUB_RUN_ID ?? "local", started: new Date().toISOString(), steps: [], ids: {} };
// NOTHING SECRET LEAVES THE RUN (Bob, 13 Nov): every line logged and the record saved pass through bersih(). A JWT, a
// value under a key that names a token, key, password, PIN, card, cookie or secret, and a setting other than the three
// timeouts are replaced by «redacted». The masks (::add-mask::) stay as a second guard for the log.
const RAHASIA = /(access_token|refresh_token|provider_token|token|api_?key|apikey|secret|password|pin|card|kartu|cookie|authorization|hashed_token)/i;
const bersih = (x) => String(x)
  .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, "«redacted»")
  .replace(/"([A-Za-z_]+)"\s*:\s*("(?:[^"\\]|\\.)*"|\d+)/g, (m, k) => (RAHASIA.test(k) ? `"${k}":"«redacted»"` : m))
  .replace(/\b(app\.settings\.[a-z_]+|jwt_secret)=\S+/gi, "$1=«redacted»");
const log = (s) => { const b = bersih(s); console.log(b); if (SUMMARY) appendFileSync(SUMMARY, `${b}\n`); };
const simpan = () => writeFileSync(join(OUT, "checkpoint-41.json"), bersih(JSON.stringify(hasil, null, 2)));
const tutupi = (s) => { if (s) console.log(`::add-mask::${s}`); return s; };
class Beda extends Error {}
/** One step: PASS, RECORDED (no gate), or the first difference, which ends the run. */
async function langkah(id, judul, fn) {
  const t0 = Date.now();
  try {
    const r = (await fn()) ?? {};
    const v = r.verdict ?? "PASS";
    hasil.steps.push({ id, judul, verdict: v, detail: r.detail ?? "", ms: Date.now() - t0 });
    log(`${v.padEnd(9)} ${id}  ${judul} :: ${r.detail ?? ""}`);
    simpan();
  } catch (e) {
    const detail = String(e?.message ?? e).split("\n")[0].slice(0, 400);
    hasil.steps.push({ id, judul, verdict: "DIFFERS", detail, ms: Date.now() - t0 });
    hasil.stopped = id;
    hasil.halaman = Object.fromEntries([...halaman].map(([n, pg]) => { try { return [n, new URL(pg.url()).pathname]; } catch { return [n, "?"]; } }));
    log(`DIFFERS   ${id}  ${judul} :: ${detail}`);
    log(`STOPPED at ${id}: a result differs from the page. Material discrepancy: record it in the runbook and hold.`);
    simpan();
    await browser?.close().catch(() => {});
    process.exit(1);
  }
}
const harus = (ok, pesan) => { if (!ok) throw new Beda(pesan); };

// ── the database: a read in a read-only transaction; item 1's and item 2's statements as written on the page
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const baca = (q, url = DB) => execFileSync("psql", [url, "-qAtX", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const tulis = (q, url = DB) => execFileSync("psql", [url, "-qAtX", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the actors' sessions: a browser context each, signed in as a person signs in
let browser;
const konteks = async () => browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
const keadaanDari = (email) => {
  const r = baca(`select coalesce((select s.state::text from public.account_setup s join public.accounts a on a.id = s.account_id
      where a.auth_user_id = u.id limit 1), 'NONE') from auth.users u where lower(u.email) = lower(${lit(email)}) limit 1`);
  return r === "" ? null : r;
};
async function masuk(email, { platform = false } = {}) {
  const ctx = await konteks();
  const page = await ctx.newPage();
  if (LOCAL) {
    await ctx.addCookies(sessionCookies(await session(email)));
    await page.goto(`${APP}/`, { timeout: SLOW });
    await page.waitForLoadState("networkidle").catch(() => {});
    if (["/perangkat", "/aktifkan"].includes(new URL(page.url()).pathname)) {
      const { selesaikan, kredensial } = await import("./masuk.mjs");
      await selesaikan(page, kredensial(email));
    }
  } else {
    const { masukStaf } = await import("./masuk.mjs");
    await page.goto(`${APP}/masuk`, { timeout: SLOW });
    await masukStaf(page, email, keadaanDari);
  }
  if (platform) {
    // a platform administrator acts in «Seluruh platform» (D-132 C7), chosen as a person chooses it
    await page.goto(`${APP}/`, { timeout: SLOW, waitUntil: "networkidle" });
    if (await page.locator('[data-pemilih="konteks"]').count()) {
      const { pilihKonteks } = await import("./masuk.mjs");
      await pilihKonteks(page, { tujuan: "MENGELOLA", platform: true });
    }
  }
  halaman.set(email.split("@")[0], page);
  return { ctx, page, email };
}
const halaman = new Map();
/** The actor's own access token, from PINTAR's session cookie (@supabase/ssr: base64-, chunked). */
async function token(ctx) {
  const c = (await ctx.cookies()).filter((x) => /^sb-[a-z0-9]+-auth-token(\.\d+)?$/.test(x.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  if (!c.length) throw new Error("no session cookie");
  const v = c.map((x) => x.value).join("");
  const j = JSON.parse(Buffer.from(v.replace(/^base64-/, ""), "base64url").toString("utf8"));
  tutupi(j.access_token); tutupi(j.refresh_token);
  return j;
}
/** The database function a screen calls, with the actor's own session. */
async function fungsi(akt, nama, args) {
  const t = await token(akt.ctx);
  const r = await fetch(`${SB}/rest/v1/rpc/${nama}`, {
    method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const teks = await r.text();
  let body; try { body = JSON.parse(teks); } catch { body = teks; }
  return { status: r.status, body };
}
/** One of the app's own routes, from the actor's browser (same origin, its cookies). */
async function rute(ctx, path, { json, form } = {}) {
  const r = await ctx.request.post(`${APP}${path}`, { headers: { Origin: APP, ...(LOCAL ? { "x-real-ip": "203.0.113.7" } : {}) }, data: json, form, maxRedirects: 0, timeout: SLOW });
  const teks = await r.text();
  let body; try { body = JSON.parse(teks); } catch { body = teks; }
  return { status: r.status(), body, location: r.headers()["location"] ?? null };
}
/** A refusal by the sign-in route itself (its own code), never a refusal before it (the proxy's 401 has no code). */
const penolakanRute = (a, apa) => harus(a.body && typeof a.body === "object" && a.body.ok === false && typeof a.body.code === "string",
  `${apa} was not answered by the sign-in route: ${a.status} ${JSON.stringify(a.body).slice(0, 160)}`);
/** A sign-in answer as the page compares it: the status and the body, without the per-request reference. */
const jawaban = (a) => JSON.stringify({ status: a.status, body: typeof a.body === "object" && a.body ? Object.fromEntries(Object.entries(a.body).filter(([k]) => k !== "ref")) : a.body });

const MAIL = (who) => (LOCAL ? env(`LOCAL_${who.toUpperCase()}_EMAIL`) : `goldenschool+${env("GS_SLUG")}-${who}@pintarselalu.com`);
const SA_EMAIL = MAIL("admin");
const S_EMAIL = MAIL("guru");
const PA_EMAIL = LOCAL ? env("LOCAL_OPERATOR_EMAIL") : env("OPERATOR_EMAIL");
const KELAS = env("GS_KELAS");
// a name the roster accepts (letters only) and that is this run's alone
const L_NAMA = `Sintetis Pemeriksaan ${[...RUN].map((d) => "abcdefghij"[Number(d) || 0]).join("")}`;
const TERKUNCI = "2999-12-31 23:59:59+00";

// ═══════════════════════════════════════════════════════════════════════════ A · the promotion, read first
await langkah("A1", "staging is at 244", async () => {
  const r = baca(`select count(*) || ' ' || max(version) || ' ' || md5(string_agg(version, ',' order by version)) from supabase_migrations.schema_migrations`);
  harus(r === "244 20270117200000 1f41d1a48f39e5544ba5d88b79b463d8", `the migration history reads ${r}`);
  return { detail: r };
});
await langkah("A2", "pg_cron is installed; the two jobs once each; the health read clean", async () => {
  const ext = baca(`select coalesce((select extversion from pg_extension where extname = 'pg_cron'), 'absent')`);
  harus(ext !== "absent", "pg_cron is not installed");
  const jobs = baca(`select string_agg(jobname || ' ' || n, ', ' order by jobname) from (select jobname, count(*) n from cron.job where jobname like 'pintar-%' group by 1) j`);
  harus(jobs === "pintar-akuntabilitas-buang-lama 1, pintar-pengerjaan-tutup-terjadwal 1", `cron.job reads ${jobs}`);
  const h = baca(`select concat_ws(' ', k ->> 'ok', k -> 'pg_cron', k -> 'hilang', k -> 'berbeda', k -> 'tidak_dideklarasikan') from public.pintar_periksa_kesehatan() k`);
  harus(h === "true true [] [] []", `the health read reads ${h}`);
  return { detail: `pg_cron ${ext}; ${jobs}; health ${h}` };
});

// ═══════════════════════════════════════════════════════════════════════════ item 1 · the committing procedure
await langkah("1e", "the scratch job: a procedure that commits between two inserts, scheduled once", async () => {
  harus(baca(`select count(*) from pg_namespace where nspname = 'uji_cron_41'`) === "0", "uji_cron_41 exists already");
  tulis(`create schema uji_cron_41;
    create table uji_cron_41.catatan (n int primary key, pada timestamptz not null default clock_timestamp());
    create procedure uji_cron_41.dua_kali() language plpgsql as $$
    begin
      if exists (select 1 from uji_cron_41.catatan) then return; end if;
      insert into uji_cron_41.catatan (n) values (1);
      commit;
      insert into uji_cron_41.catatan (n) values (2);
      commit;
    end $$;`);
  hasil.ids.jobid = tulis(`select cron.schedule('uji-41-prosedur-komit', '* * * * *', 'call uji_cron_41.dua_kali()')`);
  return { detail: `jobid ${hasil.ids.jobid}` };
});
await langkah("1f", "its first run succeeded, and both rows are there in order", async () => {
  let run = "";
  for (let i = 0; i < 30 && !/^(succeeded|failed)\|/.test(run); i++) {
    await tunggu(10_000);
    run = baca(`select status || '|' || coalesce(return_message, '') from cron.job_run_details where jobid = ${Number(hasil.ids.jobid)}
                  and status in ('succeeded', 'failed') order by start_time limit 1`);
  }
  harus(run !== "", "the job did not run within five minutes");
  if (run.startsWith("failed") && /COMMIT|transaction termination/i.test(run)) {
    hasil.transactionControl = "FAILED";
    throw new Beda(`the procedure failed because of transaction control (${run}): A2a is not released, its page returns to Sharon`);
  }
  harus(run.startsWith("succeeded"), `the first run: ${run}`);
  const rows = baca(`select string_agg(n::text, ',' order by pada) from uji_cron_41.catatan`);
  harus(rows === "1,2", `uji_cron_41.catatan holds ${rows}`);
  return { detail: `${run}; rows ${rows}` };
});
await langkah("1g", "the clean-up, and the catalogue shows nothing left", async () => {
  const j = Number(hasil.ids.jobid);
  tulis(`select cron.unschedule('uji-41-prosedur-komit')`);
  tulis(`delete from cron.job_run_details where jobid = ${j}`);
  tulis(`drop schema uji_cron_41 cascade`);
  const r = baca(`select (select count(*) from cron.job where jobname = 'uji-41-prosedur-komit') || ' ' ||
      (select count(*) from cron.job_run_details where jobid = ${j}) || ' ' ||
      (select count(*) from pg_namespace where nspname = 'uji_cron_41') || ' ' || (select count(*) from pg_proc where proname = 'dua_kali')`);
  harus(r === "0 0 0 0", `left behind: ${r}`);
  const jobs = baca(`select string_agg(jobname || ' ' || n, ', ' order by jobname) from (select jobname, count(*) n from cron.job where jobname like 'pintar-%' group by 1) j`);
  harus(jobs === "pintar-akuntabilitas-buang-lama 1, pintar-pengerjaan-tutup-terjadwal 1", `cron.job then reads ${jobs}`);
  return { detail: `${r}; ${jobs}` };
});

// ═══════════════════════════════════════════════════════════════════════════ item 2 · locks and timeouts
const KUNCI = 4141004100;
async function duaSambungan(url, label) {
  const a = spawn("psql", [url, "-qAtX", "-v", "ON_ERROR_STOP=1", "-c",
    `begin; select pg_advisory_xact_lock(${KUNCI}); select pg_sleep(20); commit;`], { stdio: ["ignore", "pipe", "pipe"] });
  let aSelesai = false, aKode = null, aGalat = "";
  a.stderr.on("data", (b) => (aGalat += b));
  const aDone = new Promise((ok) => a.on("exit", (c) => { aSelesai = true; aKode = c; ok(); }));
  // B asks only once A is seen holding the lock
  let dipegang = false;
  for (let i = 0; i < 20 && !dipegang && !aSelesai; i++) {
    await tunggu(500);
    dipegang = baca(`select count(*) from pg_locks where locktype = 'advisory' and objid = ${KUNCI % 2 ** 32} and granted`) !== "0";
  }
  harus(dipegang, `${label}: connection A never held the lock (${aGalat.trim().slice(0, 200) || "no error"})`);
  const selama = tulis(`select pg_try_advisory_xact_lock(${KUNCI})`, url);
  await aDone;
  harus(aKode === 0, `${label}: connection A ended with ${aKode} (${aGalat.trim().slice(0, 200)})`);
  const sesudah = tulis(`select pg_try_advisory_xact_lock(${KUNCI})`, url);
  harus(selama === "f" && sesudah === "t", `${label}: during A's sleep ${selama}, after A's commit ${sesudah} (expected f, t)`);
  return `${label}: f then t`;
}
await langkah("2a", "two connections through the transaction pooler (6543), then direct", async () => {
  const u = new URL(DB);
  const pooler = new URL(DB); if (!LOCAL) pooler.port = "6543";   // a local stack has no transaction pooler: its one port stands in
  const out = [await duaSambungan(pooler.toString(), "transaction pooler :6543")];
  // direct: db.<ref>.supabase.co, user postgres. A runner has no IPv6, and the direct host may have no IPv4 address.
  // When it cannot be reached, that is recorded, and the session pooler (one server connection per client, the
  // secret's own URL) is used instead.
  const direct = new URL(DB);
  if (!LOCAL) { direct.hostname = `db.${REF}.supabase.co`; direct.port = "5432"; direct.username = "postgres"; }
  let bisa = true;
  try { tulis("select 1", direct.toString()); } catch { bisa = false; }
  if (bisa) out.push(await duaSambungan(direct.toString(), `direct ${direct.hostname}`));
  else {
    hasil.directUnreachable = `db.${REF}.supabase.co could not be reached from the runner`;
    out.push(`direct host unreachable from the runner (recorded); ${await duaSambungan(u.toString(), "session pooler :5432 (the secret's own)")}`);
  }
  return { detail: out.join("; ") };
});
await langkah("2c", "the timeouts of the five roles (recorded, against D6.1)", async () => {
  const r = baca(`select string_agg(r.rolname || ' ' || coalesce(array_to_string(array(select x from unnest(r.rolconfig) x
      where x ~ '^(statement_timeout|lock_timeout|idle_in_transaction_session_timeout)='), ' '), '-'), '; ' order by r.rolname)
      from pg_roles r where r.rolname in ('postgres', 'authenticator', 'authenticated', 'anon', 'service_role')`);
  // only the three timeouts: the database's own settings also hold values that are never printed
  const db = baca(`select coalesce((select string_agg(x, ' ') from pg_db_role_setting s, unnest(s.setconfig) x where s.setrole = 0
      and s.setdatabase = (select oid from pg_database where datname = current_database())
      and x ~ '^(statement_timeout|lock_timeout|idle_in_transaction_session_timeout)='), '-')`);
  const srv = baca(`select string_agg(name || '=' || setting || coalesce(unit, ''), ' ' order by name) from pg_settings
      where name in ('statement_timeout', 'lock_timeout', 'idle_in_transaction_session_timeout')`);
  hasil.timeouts = { roles: r, database: db, server: srv };
  return { verdict: "RECORDED", detail: `roles: ${r} | database: ${db} | server: ${srv}` };
});

// ═══════════════════════════════════════════════════════════════════════════ item 3 · Auth with a locked account
browser = await chromium.launch();
const SA = await masuk(SA_EMAIL);
const PA = await masuk(PA_EMAIL, { platform: true });
const lUser = () => baca(`select a.auth_user_id from public.accounts a where a.person_id = ${lit(hasil.ids.L)} order by a.id limit 1`);
const lKunci = () => baca(`select coalesce(u.banned_until::text, 'null') from auth.users u where u.id = ${lit(lUser())}`);
const tangguhkan = async (person) => {
  const r = await fungsi(PA, "tangguhkan_akun", { p_person: person, p_kategori: "ADMINISTRATIVE", p_catatan: "Pemeriksaan staging 4.1 (akun sintetis)" });
  harus(r.status < 300, `tangguhkan_akun answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
};
const pulihkan = async (person) => {
  const r = await fungsi(PA, "aktifkan_kembali_akun", { p_person: person, p_alasan: "Pemeriksaan staging 4.1 selesai untuk langkah ini" });
  harus(r.status < 300, `aktifkan_kembali_akun answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
};
const masukKartu = async (ctx, kartu, pin) => rute(ctx, "/masuk/kartu", { form: { kartu, pin } });

await langkah("3a", "the five triggers on auth.users and the link lock, each as the repository defines it", async () => {
  const t = baca(`select count(*) || ' ' || md5(string_agg(pg_get_triggerdef(oid), '|' order by tgname)) || ' ' || bool_and(tgenabled = 'O')
      from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal`);
  harus(t === "5 c72efdfe64954caf38c5ca55bd7786a6 true", `auth.users triggers read ${t}`);
  const l = baca(`select md5(pg_get_triggerdef(oid)) || ' ' || (tgenabled = 'O') from pg_trigger where tgrelid = 'public.accounts'::regclass and tgname = '_l1f2_accounts_terkunci'`);
  harus(l === "11db10649d6009f6876bfe724e8aa15a true", `the link lock reads ${l || "absent"}`);
  return { detail: `${t}; link lock ${l}` };
});
await langkah("3.0", `SA rosters L («${L_NAMA}») into «${KELAS}» through /pendataan`, async () => {
  const { catat } = await import("./pendataan.mjs");
  await SA.page.goto(`${APP}/pendataan`, { timeout: SLOW });
  await catat(SA.page, [L_NAMA], { kelas: KELAS });
  const r = baca(`select p.id || ' ' || (select count(*) from public.accounts a where a.person_id = p.id) || ' ' ||
      coalesce((select e.id::text from public.enrollments e where e.person_id = p.id and e.status in ('PENDING', 'ACTIVE') limit 1), '-')
      from public.persons p where p.display_name = ${lit(L_NAMA)}`);
  const [id, n, enr] = r.split(" ");
  harus(r.split("\n").length === 1 && id && n === "0" && enr !== "-", `the roster gave: ${r || "no person"}`);
  hasil.ids.L = id; hasil.ids.enrolment = enr;
  return { detail: `L ${id}, no account, enrolment ${enr}` };
});
await langkah("3.1a", "PA suspends L, who has no account", async () => {
  await tangguhkan(hasil.ids.L);
  const r = baca(`select count(*) from public.person_suspensions where person_id = ${lit(hasil.ids.L)} and ended_at is null and category = 'ADMINISTRATIVE'`);
  harus(r === "1", `open suspensions: ${r}`);
  return { detail: "one open ADMINISTRATIVE suspension" };
});
let kartu, pin;
await langkah("3.1b", "SA gives L a class card: hosted Auth inserts the user, and the account is locked at the first read", async () => {
  const r = await rute(SA.ctx, "/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: hasil.ids.L } });
  harus(r.status === 200 && r.body?.ok && r.body?.card, `the activation answered ${r.status} ${String(r.body?.error ?? r.body?.code ?? "(no code)")}`);
  kartu = tutupi(String(r.body.card)); pin = tutupi(String(r.body.pin));
  const k = lKunci();
  hasil.ids.L_user = lUser();
  harus(k === TERKUNCI, `L's new account, first read: banned_until ${k} (an open account is a material discrepancy)`);
  return { detail: `one account; banned_until ${k} at the first read` };
});
await langkah("3.2", "SA reissues L's card while L is locked (Auth's admin password write): the lock stays", async () => {
  const sebelum = lKunci();
  const r = await rute(SA.ctx, "/api/akun/kartu-kelas", { json: { person_id: hasil.ids.L, alasan: "HILANG" } });
  harus(r.status === 200 && r.body?.ok && r.body?.kartu?.card, `the reissue answered ${r.status} ${String(r.body?.code ?? "(no code)")}`);
  kartu = tutupi(String(r.body.kartu.card)); pin = tutupi(String(r.body.kartu.pin));
  const sesudah = lKunci();
  harus(sebelum === TERKUNCI && sesudah === TERKUNCI, `banned_until before ${sebelum}, after ${sesudah}`);
  return { detail: `password written; banned_until ${sesudah} before and after` };
});
let terkunciBenar;
await langkah("3.3a", "L's card with its right PIN, while locked: refused", async () => {
  const c = await konteks();
  terkunciBenar = await masukKartu(c, kartu, pin);
  await c.close();
  harus(!terkunciBenar.body?.ok, `a locked card signed in: ${terkunciBenar.status}`);
  penolakanRute(terkunciBenar, "the locked card's sign-in");
  return { detail: `answered ${jawaban(terkunciBenar)} (compared at 3.4b)` };
});
await langkah("3.3b", "password sign-in on a locked synthetic staff account (S), right and wrong password, field by field", async () => {
  const { kredensial } = LOCAL ? { kredensial: () => ({ password: env("LOCAL_GURU_PASSWORD") }) } : await import("./masuk.mjs");
  const pw = tutupi(kredensial(S_EMAIL).password);
  const sid = baca(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = lower(${lit(S_EMAIL)}) limit 1`);
  harus(sid, "S has no account");
  harus(baca(`select count(*) from public.role_assignments where person_id = ${lit(sid)} and role = 'SYSTEM_ADMIN' and revoked_at is null
      and now() >= valid_from and now() < valid_until`) === "0", "S holds a platform role (the page says: not a platform administrator)");
  const c0 = await konteks();
  const hidup = await rute(c0, "/masuk/password", { form: { identitas: S_EMAIL, password: pw } });
  await c0.close();
  if (!(hidup.status === 200 && hidup.body?.ok)) {
    // the derived password does not open S: no existing secret holds S's password. The page sends this step to the owner.
    hasil.passwordStep = "OWNER";
    return { verdict: "OWNER", detail: `S's derived password does not sign in (${jawaban(hidup)}): no existing secret holds it; this step goes to the owner` };
  }
  hasil.ids.S = sid;
  await tangguhkan(sid);
  const c1 = await konteks();
  const benar = await rute(c1, "/masuk/password", { form: { identitas: S_EMAIL, password: pw } });
  const salah = await rute(c1, "/masuk/password", { form: { identitas: S_EMAIL, password: `${pw}x` } });
  await c1.close();
  await pulihkan(sid);
  penolakanRute(benar, "the locked password sign-in"); penolakanRute(salah, "the wrong password");
  harus(jawaban(benar) === jawaban(salah), `locked, right password ${jawaban(benar)} ≠ wrong password ${jawaban(salah)}`);
  harus(!benar.body?.ok, "a locked staff account signed in with its password");
  return { detail: `both ${jawaban(benar)}; S reinstated` };
});
let lSesi;
await langkah("3.4", "PA reinstates L; the card's wrong-PIN answer equals 3.3a's; the right PIN signs in", async () => {
  await pulihkan(hasil.ids.L);
  const k = lKunci();
  harus(k === "null", `after reinstatement banned_until ${k}`);
  const c = await konteks();
  const salah = await masukKartu(c, kartu, pin === "000000" ? "111111" : "000000");
  penolakanRute(salah, "the wrong PIN");
  harus(jawaban(salah) === jawaban(terkunciBenar), `live, wrong PIN ${jawaban(salah)} ≠ locked, right PIN ${jawaban(terkunciBenar)}`);
  const benar = await masukKartu(c, kartu, pin);
  harus(benar.status === 200 && benar.body?.ok, `the right PIN answered ${jawaban(benar)}`);
  lSesi = { ctx: c };
  return { detail: `wrong PIN ${jawaban(salah)} = 3.3a; the right PIN signs in` };
});
await langkah("3.5", "a refresh while L is locked again: refused, no new session; then reinstated", async () => {
  const t = await token(lSesi.ctx);
  await tangguhkan(hasil.ids.L);
  const r = await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: t.refresh_token }),
  });
  const j = await r.json().catch(() => ({}));
  await pulihkan(hasil.ids.L);
  harus(!j.access_token, "the refresh gave a new session to a locked account");
  // the suspension ends L's sessions (akun_kunci deletes them), so Auth may find no token to call banned: either code is a
  // refusal with no new session; which one is recorded (the page, 3.5)
  harus(r.status >= 400 && ["user_banned", "refresh_token_not_found"].includes(j.error_code), `the refresh answered ${r.status} ${j.error_code ?? j.error ?? ""}`);
  hasil.refresh = j.error_code;
  // a fresh sign-in for item 6 and item 4 (the suspension ended L's sessions)
  await lSesi.ctx.close();
  const c = await konteks();
  const benar = await masukKartu(c, kartu, pin);
  harus(benar.status === 200 && benar.body?.ok, `L's sign-in after reinstatement answered ${jawaban(benar)}`);
  lSesi = { ctx: c };
  return { detail: `refused ${r.status} ${j.error_code}, no new session; reinstated; L signed in again` };
});

// ═══════════════════════════════════════════════════════════════════════════ item 6 · the origin and the endpoint's time
await langkah("6a", "L's sign-in record has its network origin", async () => {
  const r = baca(`select coalesce(network_origin, '-') from public.accountability_events where person_id = ${lit(hasil.ids.L)}
      and kind = 'SIGN_IN_OK' order by at desc limit 1`);
  harus(/\/(24|48)$/.test(r), `network_origin reads ${r || "no row"}`);
  return { detail: `network_origin in the ${r.endsWith("/24") ? "/24" : "/48"} form` };
});
await langkah("6c", "50 authenticated reads of pintar_status_saya as L: p50 and p95 (recorded, not gated)", async () => {
  const t = await token(lSesi.ctx);
  const ms = [];
  for (let i = 0; i < 50; i++) {
    const t0 = performance.now();
    const r = await fetch(`${SB}/rest/v1/rpc/pintar_status_saya`, { method: "POST",
      headers: { apikey: ANON, Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" }, body: "{}" });
    await r.arrayBuffer();
    harus(r.status === 200, `read ${i + 1} answered ${r.status}`);
    ms.push(performance.now() - t0);
  }
  ms.sort((a, b) => a - b);
  const p = (q) => ms[Math.min(ms.length - 1, Math.ceil(q * ms.length) - 1)].toFixed(1);
  hasil.endpoint = { n: 50, p50: Number(p(0.5)), p95: Number(p(0.95)) };
  return { verdict: "RECORDED", detail: `p50 ${p(0.5)} ms, p95 ${p(0.95)} ms over 50 reads` };
});

// ═══════════════════════════════════════════════════════════════════════════ item 4 · writes to auth while the app runs
await langkah("4a", "the definers' owner may make every auth write item 4 names", async () => {
  const r = baca(`select string_agg(owner || ' ' || (has_table_privilege(owner, 'auth.users', 'UPDATE') and has_table_privilege(owner, 'auth.identities', 'UPDATE')
      and has_table_privilege(owner, 'auth.audit_log_entries', 'UPDATE') and has_table_privilege(owner, 'auth.sessions', 'DELETE')
      and has_table_privilege(owner, 'auth.refresh_tokens', 'DELETE') and has_table_privilege(owner, 'auth.one_time_tokens', 'DELETE')), ', ')
      from (select proowner::regrole::text as owner from pg_proc where oid in ('public.hapus_data_pribadi(uuid,text)'::regprocedure,
            'public.akun_kunci(uuid,boolean)'::regprocedure)) x`);
  harus(/^\S+ true, \S+ true$/.test(r), `the privileges read ${r}`);
  return { detail: r };
});
await langkah("4b.1", "SA ends L's enrolment", async () => {
  const r = await fungsi(SA, "akhiri_pendaftaran", { p_enrollment: hasil.ids.enrolment, p_reason: "OTHER",
    p_explanation: "Pemeriksaan staging 4.1: murid sintetis", p_effective: new Date().toISOString().slice(0, 10) });
  harus(r.status < 300, `akhiri_pendaftaran answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const s = baca(`select status from public.enrollments where id = ${lit(hasil.ids.enrolment)}`);
  harus(!["PENDING", "ACTIVE"].includes(s), `the enrolment reads ${s}`);
  return { detail: `enrolment ${s}` };
});
await langkah("4b.2", "L asks for the deletion of their personal data, then closes their account", async () => {
  const L = { ctx: lSesi.ctx };
  const d = await fungsi(L, "minta_akun", { p_kind: "DELETE_PERSONAL_DATA", p_konfirmasi: true });
  harus(d.status < 300 && d.body?.ok, `the deletion request answered ${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
  hasil.ids.request = d.body.permintaan;
  const c = await fungsi(L, "minta_akun", { p_kind: "CLOSE", p_konfirmasi: true });
  harus(c.status < 300 && c.body?.ok, `the closure answered ${c.status} ${JSON.stringify(c.body).slice(0, 200)}`);
  const r = baca(`select string_agg(kind || ' ' || status, ', ' order by kind) from public.account_requests where person_id = ${lit(hasil.ids.L)}`);
  harus(r === "CLOSE DONE, DELETE_PERSONAL_DATA RECEIVED", `the requests read ${r}`);
  harus(lKunci() === TERKUNCI, "L is not locked after the closure");
  return { detail: `${r}; locked` };
});
await langkah("4b.3", "PA deletes L's personal data (/api/akun/hapus-data): L is anonymised, the card account stays locked", async () => {
  const r = await rute(PA.ctx, "/api/akun/hapus-data", { form: { permintaan: hasil.ids.request, catatan: "Pemeriksaan staging 4.1: orang sintetis" } });
  harus(r.status === 303 && !/gagal/.test(r.location ?? ""), `the deletion answered ${r.status} → ${r.location}`);
  const p = baca(`select (anonymized_at is not null) || ' ' || (photo_path is null) || ' ' || (display_name <> ${lit(L_NAMA)}) from public.persons where id = ${lit(hasil.ids.L)}`);
  harus(p === "true true true", `L reads ${p} (anonymised, no photo, name replaced)`);
  harus(lKunci() === TERKUNCI, "L's card account is not locked after the deletion");
  return { detail: "anonymised; the card account locked (a card account carries no personal address: Auth's rows are rewritten for an email account, 4c)" };
});
await langkah("4b.4", "L is closed and anonymised: terminal", async () => {
  const r = await fungsi(PA, "akun_keadaan", { p_person: hasil.ids.L });
  harus(r.status === 200, `akun_keadaan answered ${r.status}`);
  return { detail: JSON.stringify(r.body).slice(0, 300) };
});

// hapus_data_pribadi rewrites and deletes Auth's rows for an EMAIL account only (a class card's address is the card's,
// not the person's). So item 4's runtime writes are exercised by E: a synthetic person with an email account on the
// staging test mailbox, made by PA through the product, signed in as the walks sign in, then closed and deleted.
const E_EMAIL = LOCAL ? `cp41-${RUN}@synthetic.pintar.test` : `goldenschool+cp41-${RUN}@pintarselalu.com`;
const E_NAMA = `Sintetis Penghapusan ${[...RUN].map((d) => "abcdefghij"[Number(d) || 0]).join("")}`;
let E;
await langkah("4c.0", "PA records E, a new person with an email account (/api/akun/aktivasi, NEW_PERSON); E signs in", async () => {
  const r = await rute(PA.ctx, "/api/akun/aktivasi", { json: { mode: "NEW_PERSON", display_name: E_NAMA, email: E_EMAIL } });
  harus(r.status === 200 && r.body?.ok, `NEW_PERSON answered ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const id = baca(`select a.person_id || ' ' || a.auth_user_id || ' ' || a.kind from public.accounts a join auth.users u on u.id = a.auth_user_id
      where lower(u.email) = lower(${lit(E_EMAIL)})`);
  const [pid, uid, kind] = id.split(" ");
  harus(kind === "EMAIL", `E's account reads ${id || "absent"}`);
  hasil.ids.E = pid; hasil.ids.E_user = uid;
  E = await masuk(E_EMAIL);
  return { detail: `E ${pid}, an EMAIL account; signed in` };
});
await langkah("4c.1", "E asks for the deletion of their personal data, then closes their account", async () => {
  const d = await fungsi(E, "minta_akun", { p_kind: "DELETE_PERSONAL_DATA", p_konfirmasi: true });
  harus(d.status < 300 && d.body?.ok, `the deletion request answered ${d.status} ${JSON.stringify(d.body).slice(0, 200)}`);
  hasil.ids.E_request = d.body.permintaan;
  const c = await fungsi(E, "minta_akun", { p_kind: "CLOSE", p_konfirmasi: true });
  harus(c.status < 300 && c.body?.ok, `the closure answered ${c.status} ${JSON.stringify(c.body).slice(0, 200)}`);
  const k = baca(`select coalesce(banned_until::text, 'null') from auth.users where id = ${lit(hasil.ids.E_user)}`);
  harus(k === TERKUNCI, `E after the closure: banned_until ${k}`);
  return { detail: "requested and closed; locked" };
});
await langkah("4c.2", "PA deletes E's personal data: every auth write of item 4 runs, and none is refused", async () => {
  const u = hasil.ids.E_user;
  const jejak = baca(`select count(*) from auth.audit_log_entries where payload::text ilike ${lit(`%${E_EMAIL}%`)}`);
  const r = await rute(PA.ctx, "/api/akun/hapus-data", { form: { permintaan: hasil.ids.E_request, catatan: "Pemeriksaan staging 4.1: orang sintetis" } });
  harus(r.status === 303 && !/gagal/.test(r.location ?? ""), `the deletion answered ${r.status} → ${r.location} (a refused auth write is a material discrepancy)`);
  const p = baca(`select (anonymized_at is not null) from public.persons where id = ${lit(hasil.ids.E)}`);
  const e = baca(`select email from auth.users where id = ${lit(u)}`);
  const i = baca(`select count(*) from auth.identities where user_id = ${lit(u)} and coalesce(identity_data ->> 'email', '') not like 'anonim-%'`);
  const a = baca(`select count(*) from auth.audit_log_entries where payload::text ilike ${lit(`%${E_EMAIL}%`)}`);
  const s = baca(`select (select count(*) from auth.sessions where user_id = ${lit(u)}) || ' ' || (select count(*) from auth.refresh_tokens where user_id = ${lit(u)}::text)
      || ' ' || (select count(*) from auth.one_time_tokens where user_id = ${lit(u)})`);
  harus(p === "t", "E is not anonymised");
  harus(e === `anonim-${u}@pintar.invalid`, "auth.users: E's email is not anonymised");
  harus(i === "0", `auth.identities: ${i} keep the address`);
  harus(a === "0", `auth.audit_log_entries: ${a} of ${jejak} still name the address`);
  harus(s === "0 0 0", `auth.sessions, refresh_tokens, one_time_tokens: ${s}`);
  return { detail: `auth.users anonymised; identities 0; audit entries naming the address ${jejak} -> 0; sessions and tokens ${s}` };
});
await langkah("4c.3", "E is closed and anonymised: terminal", async () => {
  const r = await fungsi(PA, "akun_keadaan", { p_person: hasil.ids.E });
  harus(r.status === 200, `akun_keadaan answered ${r.status}`);
  return { detail: JSON.stringify(r.body).slice(0, 300) };
});

hasil.finished = new Date().toISOString();
simpan();
log(`ALL STEPS DONE: ${hasil.steps.filter((s) => s.verdict === "PASS").length} PASS, ${hasil.steps.filter((s) => s.verdict === "RECORDED").length} RECORDED, `
  + `${hasil.steps.filter((s) => s.verdict === "OWNER").length} for the owner. L ${hasil.ids.L} and E ${hasil.ids.E} stay anonymised and terminal.`);
await browser.close();
