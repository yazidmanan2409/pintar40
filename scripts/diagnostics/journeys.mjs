// SYSTEM COHERENCE ASSESSMENT — composed-journey probe (diagnostic only).
//
// This is not a test and it is not part of the selftest manifest. It repairs
// nothing and asserts nothing about what SHOULD pass. It drives assembled
// PINTAR journeys through the real runtime -- HTTP request -> middleware ->
// page / server action / route handler -> Supabase -> database -> response --
// against a LOCAL stack, and records, for each step, what the canonical
// specification expects next to what actually happened.
//
// Database access (psql) is used for exactly two things, and each use is
// labelled: DISCOVERY (finding an id the UI would have shown a human) and
// ATTACKER MODEL (a deliberate tamper a hostile database writer could make).
// It is never used to decide whether a journey worked.
//
// Server actions are invoked the way a browser invokes them: by their build-time
// action id (read from .next/server/server-reference-manifest.json), POSTed to
// a page whose worker carries that action. Form actions are posted as the
// no-JavaScript form the page renders.
//
// Usage: node scripts/diagnostics/journeys.mjs <app-dir> <out-json>
// Env:   APP_BASE, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//        SUPABASE_DB_URL, MAILPIT_URL (optional), PROBE_LABEL

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const APP_DIR = resolve(process.argv[2] ?? ".");
const OUT = process.argv[3] ?? "journeys.json";
const BASE = (process.env.APP_BASE ?? "http://127.0.0.1:3999").replace(/\/$/, "");
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const MAILPIT = process.env.MAILPIT_URL || "http://127.0.0.1:54324";
const LABEL = process.env.PROBE_LABEL ?? "unlabelled";

const require_ = createRequire(join(APP_DIR, "package.json"));
const { createServerClient } = require_("@supabase/ssr");

// ------------------------------------------------------------------ recording
const record = { label: LABEL, base: BASE, journeys: [] };
let current = null;
function journey(id, title, canonical) {
  current = { id, title, canonical, steps: [], harness_errors: [] };
  record.journeys.push(current);
}
/** One observation. `match` is null when there is no single expected value. */
function step(name, expected, observed, match = null, extra = undefined) {
  const s = { name, expected, observed, match };
  if (extra !== undefined) s.extra = extra;
  current.steps.push(s);
  const tag = match === null ? "  ·  " : match ? "  ✓  " : "  ✗  ";
  console.log(`${tag}[${current.id}] ${name}\n       expected: ${expected}\n       observed: ${observed}`);
}
function harness(e) {
  const msg = e instanceof Error ? `${e.message}` : String(e);
  current.harness_errors.push(msg);
  console.log(`  !! [${current.id}] HARNESS: ${msg}`);
}

// ------------------------------------------------------------------ plumbing
function psql(sql, label = "DISCOVERY") {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-F", "|", "-c", sql, DB], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql(${label}) failed: ${r.stderr.trim().split("\n").pop()}`);
  return r.stdout.trim();
}
const text = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

class Jar {
  constructor() { this.c = new Map(); }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join("; "); }
  absorb(res) {
    const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const line of set) {
      const [pair] = line.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i).trim(); const v = pair.slice(i + 1).trim();
      if (/max-age=0/i.test(line) || v === "") this.c.delete(k); else this.c.set(k, v);
    }
  }
}

async function http(path, { jar, method = "GET", headers = {}, body } = {}) {
  const res = await fetch(path.startsWith("http") ? path : BASE + path, {
    method, redirect: "manual", body,
    headers: { ...(jar ? { cookie: jar.header() } : {}), ...headers },
  });
  if (jar) jar.absorb(res);
  const t = await res.text();
  return { status: res.status, location: res.headers.get("location"), headers: res.headers, body: t };
}

async function signIn(email, password) {
  const jar = new Jar();
  const client = createServerClient(SUPA, ANON, {
    cookies: {
      getAll: () => [...jar.c].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => jar.c.set(name, value)),
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return { jar, token: data.session.access_token, userId: data.user.id };
}

async function rest(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${SUPA}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON, authorization: `Bearer ${token ?? ANON}`, "content-type": "application/json",
      prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await res.text();
  let json = null; try { json = JSON.parse(t); } catch { /* not json */ }
  return { status: res.status, json, body: t };
}

// ---------------------------------------------------------- server actions
const manifest = JSON.parse(readFileSync(join(APP_DIR, ".next/server/server-reference-manifest.json"), "utf8"));
function action(file, exportedName) {
  for (const [id, v] of Object.entries(manifest.node ?? {})) {
    if (v.filename === file && v.exportedName === exportedName) return { id, workers: Object.keys(v.workers ?? {}) };
  }
  throw new Error(`no server action ${file}#${exportedName} in this build`);
}
/** Turns a worker key like app/belajar/[tugas]/page into a concrete path. */
function workerPath(worker, params = {}) {
  let p = worker.replace(/^app/, "").replace(/\/page$/, "") || "/";
  p = p.replace(/\[\[?\.\.\.(\w+)\]?\]/g, (_, k) => params[k] ?? "x").replace(/\[(\w+)\]/g, (_, k) => params[k] ?? "00000000-0000-0000-0000-000000000000");
  return p.replace(/\/\([^/]+\)/g, "") || "/";
}
function pickWorker(a, prefer, params) {
  const w = a.workers.find((x) => prefer && x.includes(prefer)) ?? a.workers[0];
  return workerPath(w, params);
}
/** The React Flight reply for plain JSON arguments, as `callServer` sends it. */
async function callAction(a, args, { jar, path }) {
  const res = await http(path, {
    jar, method: "POST", body: JSON.stringify(args),
    headers: { "next-action": a.id, accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
  });
  return { ...res, value: flightValue(res.body), redirect: res.headers.get("x-action-redirect") };
}
/** A single FormData argument, as `callServer` sends it (root "$K1", fields "1_<name>"). */
async function callFormAction(a, fields, { jar, path }) {
  const fd = new FormData();
  fd.append("0", JSON.stringify(["$K1"]));
  for (const [k, v] of Object.entries(fields)) fd.append(`1_${k}`, v);
  const res = await http(path, { jar, method: "POST", body: fd, headers: { "next-action": a.id, accept: "text/x-component" } });
  return { ...res, value: flightValue(res.body), redirect: res.headers.get("x-action-redirect") };
}
/** The no-JavaScript <form action={serverAction}> submission. */
async function postForm(a, fields, { jar, path }) {
  const fd = new FormData();
  fd.append(`$ACTION_ID_${a.id}`, "");
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return http(path, { jar, method: "POST", body: fd });
}
function flightValue(body) {
  for (const line of body.split("\n")) {
    const m = /^1:(.*)$/.exec(line);
    if (m) { try { return JSON.parse(m[1]); } catch { return m[1]; } }
  }
  return undefined;
}

// ======================================================================
// J10 — certificate: eligibility -> issue -> QR -> anonymous verification
//       -> tamper -> revocation. The OFFICIAL bootstrap learner, POST_TEST.
// ======================================================================
async function j10() {
  journey("J10", "certificate eligibility -> issue -> QR -> anonymous verification -> tamper -> revocation",
    "doc 04 §7: a FINALIZED, OFFICIAL, passed POST_TEST reaches ELIGIBLE and the SYSTEM issues it " +
    "(idempotent, keyed on session); the one public route verifies it anonymously; altering the " +
    "payload fails verification; an INST_ADMIN can revoke and the public route then says revoked.");
  const L = await signIn("boot-siswa@bootstrap.pintar.test", "Bootstrap-Siswa-3082!");
  const person = psql(`select person_id from public.accounts where auth_user_id = '${L.userId}'`);
  // DISCOVERY: the learner's open POST_TEST assignment and its learning assignment
  const row = psql(`select aa.id, la.id from public.assessment_assignments aa
                      join public.learning_assignments la on (la.learning_cycle->>'post_test')::uuid = aa.assessment_definition_id
                     where aa.status = 'OPEN' and la.status = 'ACTIVE'
                       and aa.institution_id = (select institution_id from public.enrollments where person_id='${person}' and status='ACTIVE' limit 1)
                     limit 1`);
  const [aa, la] = row.split("|");
  step("discovery: open POST_TEST assignment for the OFFICIAL learner", "one", aa && la ? `aa=${aa} la=${la}` : "none", Boolean(aa && la));
  if (!aa) return;

  const home = await http("/belajar", { jar: L.jar });
  step("GET /belajar as the learner", "200", String(home.status), home.status === 200);

  // start: the no-JS form the orientation page renders
  const start = action("src/app/belajar/actions.ts", "mulaiAsesmen");
  const startPath = pickWorker(start, "asesmen", { penugasan: aa, tugas: la });
  const st = await postForm(start, { penugasan: aa, kembali: `/belajar/${la}` }, { jar: L.jar, path: startPath });
  const session = psql(`select id from public.assessment_sessions where person_id='${person}' and assessment_assignment_id='${aa}' order by created_at desc limit 1`);
  step("start the POST_TEST through the orientation form (mulaiAsesmen)", "303 redirect and one new session",
    `status=${st.status} location=${st.location} session=${session || "none"}`, Boolean(session) && st.status >= 300 && st.status < 400,
    { posted_to: startPath });
  if (!session) return;

  // answer every presented item correctly (DISCOVERY of the key: this is the driver, not the product)
  const items = psql(`select pi.id, (select d.display_position from public.option_display_order(pi.session_id, pi.item_id) d
                                        join public.item_options o on o.item_id = pi.item_id and o.label = d.label and o.is_correct limit 1)
                        from public.presented_items pi where pi.session_id = '${session}' order by pi.position`)
    .split("\n").filter(Boolean).map((l) => l.split("|"));
  const submit = action("src/app/belajar/actions.ts", "submitAnswer");
  const playPath = pickWorker(submit, "penguasaan", { tugas: la, penugasan: aa });
  let okCount = 0; const outcomes = [];
  for (const [pid, pos] of items) {
    const r = await callAction(submit, [pid, 1, { posisi: Number(pos) }, "LIVE"], { jar: L.jar, path: playPath });
    outcomes.push(JSON.stringify(r.value)?.slice(0, 80));
    if (r.value && r.value.ok) okCount++;
  }
  step("submit a correct answer to every presented item (submitAnswer action)", `${items.length}/${items.length} ok`,
    `${okCount}/${items.length} ok`, okCount === items.length && items.length > 0, { outcomes: outcomes.slice(0, 3) });

  const fin = action("src/app/belajar/actions.ts", "finishSession");
  const f = await callAction(fin, [session], { jar: L.jar, path: playPath });
  const sStatus = psql(`select status from public.assessment_sessions where id='${session}'`);
  step("finish the session (finishSession action)", "ok, session FINALIZED",
    `value=${JSON.stringify(f.value)?.slice(0, 120)} status=${sStatus}`, Boolean(f.value?.ok) && sStatus === "FINALIZED");

  const eligible = psql(`select eligible||'|'||coalesce(reason,'')||'|'||coalesce(predikat,'') from public.certificate_eligibility('${session}')`);
  step("certificate_eligibility for the finalized session", "eligible=true", eligible, eligible.startsWith("t"));

  const before = psql(`select count(*)||'|'||coalesce(string_agg(status::text, ','),'') from public.certificates where session_id='${session}'`);
  step("certificate rows after finalization, BEFORE any caller issues", "an ISSUED certificate (the SYSTEM issues, doc 04 §7)", before, null);

  const certPage = await http(`/belajar/${la}/sertifikat`, { jar: L.jar });
  const certText = text(certPage.body);
  const state = /sedang disiapkan|being prepared/i.test(certText) ? "ELIGIBLE (sedang disiapkan)"
    : /\/verifikasi\//.test(certPage.body) ? "ISSUED (verification link present)" : "other";
  step("the learner's certificate page after finishing, with no further action", "ISSUED, with QR and verification link",
    `status=${certPage.status} rendered=${state}`, state.startsWith("ISSUED"),
    { visible_text: certText.slice(0, 400) });

  console.log(`       page text: ${certText.slice(0, 300)}`);
  const results = await http(`/belajar/${la}/hasil`, { jar: L.jar });
  step("the learner's results page", "200 (issuance never blocks results, §7)", String(results.status), results.status === 200);

  // Is anything in the product going to issue it? Re-load twice (the "retry on next load" clause).
  await http(`/belajar/${la}/sertifikat`, { jar: L.jar });
  await http(`/belajar/${la}/hasil`, { jar: L.jar });
  const afterReload = psql(`select count(*)||'|'||coalesce(string_agg(status::text, ','),'') from public.certificates where session_id='${session}'`);
  step("certificate rows after re-loading results and certificate pages (the §7 retry clause)", "ISSUED", afterReload, /ISSUED/.test(afterReload));

  // The issuance route exists; nothing calls it. Call it as the learner would have to.
  const issue = await http("/api/certificates/issue", {
    jar: L.jar, method: "POST", body: JSON.stringify({ session_id: session }), headers: { "content-type": "application/json" },
  });
  step("POST /api/certificates/issue as the learner (the route no page calls)", "issued",
    `status=${issue.status} body=${issue.body.slice(0, 120)}`, /issued/.test(issue.body));

  const certPage2 = await http(`/belajar/${la}/sertifikat`, { jar: L.jar });
  const link = /(https?:\/\/[^"'<\s]+)?\/verifikasi\/([A-Za-z0-9_\-]{20,})/.exec(certPage2.body);
  step("the learner's certificate page after issuance", "verification link to the one canonical route",
    link ? `link=${link[0].slice(0, 80)}…` : `no link (status ${certPage2.status})`, Boolean(link));
  const token = link?.[2] ?? psql(`select verification_token from public.certificates where session_id='${session}' limit 1`);
  if (!token) return;

  const anonApi = await http(`/api/verifikasi/${token}`);
  step("anonymous GET /api/verifikasi/<token> (the endpoint the page reads)", "200 {validity: BERLAKU}",
    `status=${anonApi.status} body=${anonApi.body.slice(0, 160)}`, anonApi.status === 200 && /BERLAKU/.test(anonApi.body));
  const anonPage = await http(`/verifikasi/${token}`);
  const pageSays = /Berlaku\b/.test(text(anonPage.body)) && !/tidak ditemukan/i.test(text(anonPage.body)) ? "Berlaku"
    : /tidak ditemukan/i.test(text(anonPage.body)) ? "tidak ditemukan (not found)" : text(anonPage.body).slice(0, 120);
  step("anonymous GET /verifikasi/<token> (what a QR scan shows)", "Berlaku", `status=${anonPage.status} shows=${pageSays}`, pageSays === "Berlaku");

  // ATTACKER MODEL: alter the stored payload behind the signature
  psql(`set session_replication_role = replica;
        update public.certificates set canonical_payload = jsonb_set(canonical_payload, '{result,score}', '"999"'::jsonb, true)
         where verification_token = '${token}';`, "ATTACKER MODEL");
  const tApi = await http(`/api/verifikasi/${token}`);
  const tPage = await http(`/verifikasi/${token}`);
  step("after tampering the stored payload: anonymous endpoint and page", "TIDAK SAH on both",
    `api=${tApi.status} ${tApi.body.slice(0, 90)} | page shows ${/Tidak sah/i.test(text(tPage.body)) ? "Tidak sah" : text(tPage.body).slice(0, 80)}`,
    /TIDAK SAH/.test(tApi.body) && /Tidak sah/i.test(text(tPage.body)));

  // Revocation: is there a product path? (inventory) and does the RPC work for the admin?
  const A = await signIn("boot-admin@bootstrap.pintar.test", "Bootstrap-Admin-9163!");
  const certId = psql(`select id from public.certificates where verification_token='${token}'`);
  const srcHits = spawnSync("grep", ["-rl", "revoke_certificate", join(APP_DIR, "src")], { encoding: "utf8" }).stdout.trim();
  step("a product surface that revokes a certificate (source inventory)", "an INST_ADMIN surface (doc 05 Certificates: Revoke)",
    srcHits ? srcHits.replace(APP_DIR, "") : "none: no file under src/ calls revoke_certificate", Boolean(srcHits));
  const rv = await rest("rpc/revoke_certificate", { token: A.token, method: "POST", body: { p_certificate: certId, p_reason: "coherence probe" } });
  const rApi = await http(`/api/verifikasi/${token}`);
  step("INST_ADMIN revokes via the RPC directly; anonymous endpoint afterwards", "DICABUT (or TIDAK SAH, since tampered)",
    `rpc=${rv.status} ${rv.body.slice(0, 80)} | api validity=${/"validity":"([^"]*)"/.exec(rApi.body)?.[1] ?? rApi.body.slice(0, 60)}`, null);
  record.j10 = { session };
}

// ======================================================================
// J1a — identity: can a stranger self-provision a PINTAR identity without
//       the sign-in form, straight at the Auth service?
// ======================================================================
async function j1a() {
  journey("J1a", "identity provisioning boundary at the Auth service, not the form",
    "L-2 / doc 05: the product is institution-provisioned; an unknown address can never become an " +
    "auth user and therefore never a PINTAR person or account. PUBLIC may do nothing but verification and Mini-PINTAR.");
  const email = `stranger-${Date.now()}@contoh.invalid`;
  const count = () => psql(`select (select count(*) from auth.users)||'|'||(select count(*) from public.persons)||'|'||(select count(*) from public.accounts)`);
  // The local stack carries the fixtures marker so its seeds can create
  // people; a real installation never does. Probe as the installation would be.
  const marker = psql(`select local_fixtures_enabled from public.platform_environment`);
  psql(`update public.platform_environment set local_fixtures_enabled = false`, "SETUP");
  const before = count();
  const res = await fetch(`${SUPA}/auth/v1/signup`, {
    method: "POST", headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Stranger-Probe-4471!", data: { display_name: "Kepala Sekolah (asli)" } }),
  });
  const b = await res.text();
  psql(`update public.platform_environment set local_fixtures_enabled = ${marker === "t"}`, "RESTORE");
  const after = count();
  step("anonymous POST /auth/v1/signup with the PUBLIC anon key (no form, no app)", "refused; users|persons|accounts unchanged",
    `status=${res.status} before=${before} after=${after}`, before === after);
  const made = psql(`select p.display_name from public.persons p join public.accounts a on a.person_id=p.id join auth.users u on u.id=a.auth_user_id where u.email='${email}'`);
  step("a PINTAR person exists for the stranger, with a display name the stranger chose", "no",
    made ? `yes: display_name="${made}"` : "no", !made);
  let session = null; try { session = JSON.parse(b).access_token ?? null; } catch { /* none */ }
  step("the signup returned a live session (local stack: confirmations off; hosted: mailer_autoconfirm=false)", "no session",
    session ? "session issued" : "no session", !session);
  if (session) {
    const jar = new Jar();
    // the app's cookie format is the @supabase/ssr one; sign in through it
    try {
      const S = await signIn(email, "Stranger-Probe-4471!");
      const pages = [];
      for (const p of ["/belajar", "/mengajar", "/studio", "/konfigurasi", "/pimpinan"]) {
        const r = await http(p, { jar: S.jar });
        const t = text(r.body);
        pages.push(`${p}=${r.status}${r.location ? "->" + r.location : ""}[${t.slice(0, 70)}]`);
      }
      step("what the self-provisioned stranger reaches (HTTP status per surface)", "nothing beyond a refusal", pages.join(" "), null);
    } catch (e) { harness(e); }
    void jar;
  }
  // does it land in an administrator's queue?
  try {
    // the queue is a SYSTEM_ADMIN read (INST_ADMIN is refused by name, observed in attempt 2)
    const A = await signIn("sysadmin@synthetic.pintar.test", "Sintetis-Sys-91!");
    const q = await rest("rpc/persons_awaiting_first_role", { token: A.token, method: "POST", body: {} });
    step("the stranger appears in a SYSTEM_ADMIN's 'awaiting first role' queue (where a first role is granted)", "no",
      q.status === 200 ? (q.body.includes("Kepala Sekolah") ? "yes (display name shown to the admin)" : "no") : `rpc ${q.status} ${q.body.slice(0, 80)}`, null);
  } catch (e) { harness(e); }
}

// ======================================================================
// J1b — sign-in: the magic link the production path depends on, end to end.
// ======================================================================
async function j1b() {
  journey("J1b", "magic-link sign-in through the application, end to end, in a real browser",
    "FABLE-01 §2 / L-2: a provisioned address requests a link on /masuk; the email's link returns to " +
    "<APP>/auth/callback; the code exchange creates the session and lands on the role home.");
  // attempt 3's direct server-action call answered "gagal" while the identical library call succeeded:
  // classified HARNESS DEFECT (probable FormData encoding). This run uses the real form in a real browser.
  let b; try { b = await browser(); } catch (e) { harness(`Playwright unavailable: ${e.message}`); return; }
  const email = "boot-guru@bootstrap.pintar.test";
  const latestLink = async (after) => {
    for (let i = 0; i < 15; i++) {
      await new Promise((ok) => setTimeout(ok, 1000));
      const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + email)}`)).json();
      const msg = (list.messages ?? []).find((m) => Date.parse(m.Created) >= after - 2000);
      if (msg) {
        const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
        return /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/.exec(`${full.HTML ?? ""} ${full.Text ?? ""}`.replace(/&amp;/g, "&"))?.[0] ?? null;
      }
    }
    return null;
  };
  const ask = async (page) => {
    const t0 = Date.now();
    await page.goto(`${BASE}/masuk`);
    await page.fill("#email", email);
    await page.press("#email", "Enter");
    await page.waitForTimeout(2500);
    return { t0, said: text(await page.content()).slice(0, 160) };
  };
  try {
    // (a) asked in browser A, opened in browser B (the phone-mail-app case)
    const A = await b.newContext(); const pa = await A.newPage();
    const r1 = await ask(pa);
    const l1 = await latestLink(r1.t0);
    step("browser A submits the /masuk form; an email with a verify link arrives", "link", l1 ? l1.slice(0, 80) + "…" : `no link (screen said: ${r1.said})`, Boolean(l1));
    if (l1) {
      const B = await b.newContext(); const pb = await B.newPage();
      await pb.goto(l1); await pb.waitForTimeout(3500);
      step("the link opened in browser B (not the one that asked)", "(recorded: PKCE binds the code to browser A)",
        `landed on ${pb.url().replace(BASE, "")} | ${text(await pb.content()).slice(0, 120)}`, null);
      await B.close();
    }
    // (b) asked and opened in the same browser
    const r2 = await ask(pa);
    const l2 = await latestLink(r2.t0);
    step("browser A asks again; a second link arrives", "link", l2 ? l2.slice(0, 80) + "…" : `no link (screen said: ${r2.said})`, Boolean(l2));
    if (l2) {
      await pa.goto(l2); await pa.waitForTimeout(4000);
      const at = pa.url().replace(BASE, "");
      const cookies = (await A.cookies()).map((c) => c.name).filter((n) => /auth-token/.test(n));
      step("the link opened in browser A: callback, code exchange, landing", "a role home (/mengajar for an educator) under a session",
        `landed on ${at} | session cookie=${cookies.length > 0} | ${text(await pa.content()).slice(0, 120)}`, !/masuk|callback/.test(at) && cookies.length > 0);
    }
    await A.close();
  } catch (e) { harness(e); } finally { await b.close(); }
}

// ======================================================================
// J5 — Studio lifecycle writes: does "ok" mean the write happened?
// ======================================================================
async function j5() {
  journey("J5", "Studio lifecycle transition reported to the author vs. what the database holds",
    "doc 04 §1 / doc 05: a transition by a role without the capability is REFUSED and the refusal is " +
    "shown; the UI never reports success for a write that did not happen (never trust 2xx).");
  const S = await signIn("boot-siswa@bootstrap.pintar.test", "Bootstrap-Siswa-3082!");
  const course = psql(`select id from public.courses where institution_id = (select institution_id from public.enrollments e join public.accounts a on a.person_id=e.person_id where a.auth_user_id='${S.userId}' and e.status='ACTIVE' limit 1) limit 1`);
  const before = psql(`select status from public.courses where id='${course}'`);
  const adv = action("src/app/studio/actions.ts", "advanceContentAction");
  const r = await postForm(adv, { course, to: "IN_REVIEW" }, { jar: S.jar, path: `/studio/paket/${course}` });
  const after = psql(`select status from public.courses where id='${course}'`);
  const said = /hasil=ok/.test(r.location ?? "") ? "ok" : /hasil=gagal/.test(r.location ?? "") ? "gagal" : `status ${r.status} ${r.location ?? ""}`;
  step("a STUDENT posts the Studio 'advance content' form for their institution's published course", "refused: hasil=gagal, status unchanged",
    `UI told: ${said}; course status ${before} -> ${after}`, said === "gagal" && before === after, { location: r.location });

  const G = await signIn("boot-guru@bootstrap.pintar.test", "Bootstrap-Guru-7741!");
  const before2 = psql(`select status from public.courses where id='${course}'`);
  const r2 = await postForm(adv, { course, to: "STRUCTURED" }, { jar: G.jar, path: `/studio/paket/${course}` });
  const after2 = psql(`select status from public.courses where id='${course}'`);
  const said2 = /hasil=ok/.test(r2.location ?? "") ? "ok" : /hasil=gagal/.test(r2.location ?? "") ? "gagal" : `status ${r2.status}`;
  step("an EDUCATOR asks to move an APPROVED (released) course back to STRUCTURED", "refused and shown, or performed — never 'ok' without the change",
    `UI told: ${said2}; course status ${before2} -> ${after2}; module/item statuses: ${psql(`select string_agg(distinct i.status::text, ',') from public.items i join public.lessons l on l.id=i.lesson_id join public.modules m on m.id=l.module_id where m.course_id='${course}'`)}`,
    !(said2 === "ok" && before2 === after2));
}

// ======================================================================
// J5b — Studio approve / freeze by an actor outside the object's scope.
// ======================================================================
async function j5b() {
  journey("J5b", "Studio approve and freeze by an out-of-scope actor: reported outcome vs persisted state",
    "doc 04 §1 / doc 05: IN_REVIEW -> APPROVED needs CAN_REVIEW (not the author); APPROVED -> FROZEN needs " +
    "CAN_FREEZE_RELEASE; an actor without them, or in another tenant, is refused and the refusal is shown.");
  // the seeds hold no pre-freeze object; make one THROUGH THE PRODUCT: an authorized HoD opens a revision
  try {
    // attempt 4: the HoD was refused by name ("requires CAN_DRAFT in the owning institution"); the author holds it
    const H = await signIn("boot-guru@bootstrap.pintar.test", "Bootstrap-Guru-7741!");
    const published = psql(`select id from public.courses where institution_id=(select institution_id from public.courses where status='APPROVED' order by created_at limit 1) and status='APPROVED' order by created_at limit 1`);
    const rv = action("src/app/studio/actions.ts", "createRevisionAction");
    const r = await postForm(rv, { course: published }, { jar: H.jar, path: `/studio/paket/${published}` });
    step("the authoring EDUCATOR opens a revision of a released course (createRevisionAction)", "a new pre-freeze course", `status=${r.status} location=${r.location}`, /hasil=ok/.test(r.location ?? ""));
  } catch (e) { harness(e); }
  const course = psql(`select id||'|'||status||'|'||institution_id from public.courses where status in ('INGESTED','STRUCTURED','VALIDATED','IN_REVIEW') order by created_at desc limit 1`);
  const rel = psql(`select r.id||'|'||r.status||'|'||r.course_id||'|'||r.institution_id from public.plp_releases r where r.status in ('STRUCTURED','VALIDATED','IN_REVIEW','APPROVED') order by r.created_at limit 1`);
  step("discovery: a pre-freeze course and a pre-freeze release exist to act on", "both", `course=${course || "none"} release=${rel || "none"}`, Boolean(course && rel));
  const actors = [
    ["STUDENT of the owning tenant", "boot-siswa@bootstrap.pintar.test", "Bootstrap-Siswa-3082!"],
    ["EDUCATOR of the owning tenant (holds no CAN_REVIEW)", "boot-guru@bootstrap.pintar.test", "Bootstrap-Guru-7741!"],
    ["HEAD_OF_DEPARTMENT of ANOTHER tenant (synthetic)", "siklus-kaprodi@synthetic.pintar.test", "Sintetis-SiklusKaprodi-22!"],
  ];
  const adv = action("src/app/studio/actions.ts", "advanceContentAction");
  const frz = action("src/app/studio/actions.ts", "freezeReleaseAction");
  const told = (loc) => /hasil=ok/.test(loc ?? "") ? "ok" : /hasil=gagal/.test(loc ?? "") ? `gagal (${decodeURIComponent(/detail=([^&#]*)/.exec(loc ?? "")?.[1] ?? "").slice(0, 80)})` : `no outcome (${loc})`;
  for (const [who, email, pw] of actors) {
    let S; try { S = await signIn(email, pw); } catch (e) { harness(e); continue; }
    if (course) {
      const [cid, cst] = course.split("|");
      const r = await postForm(adv, { course: cid, to: "APPROVED" }, { jar: S.jar, path: `/studio/paket/${cid}` });
      const after = psql(`select status from public.courses where id='${cid}'`);
      step(`${who}: 'approve' a ${cst} course (advanceContentAction to=APPROVED)`, "refused and shown; status unchanged",
        `UI told: ${told(r.location)}; persisted ${cst} -> ${after}`, !(told(r.location) === "ok" && after === cst) && after === cst);
    }
    if (rel) {
      const [rid, rst, rcourse] = rel.split("|");
      const r = await postForm(frz, { course: rcourse, release: rid }, { jar: S.jar, path: `/studio/paket/${rcourse}` });
      const after = psql(`select status from public.plp_releases where id='${rid}'`);
      step(`${who}: 'freeze' a ${rst} release (freezeReleaseAction)`, "refused and shown; status unchanged",
        `UI told: ${told(r.location)}; persisted ${rst} -> ${after}`, !(told(r.location) === "ok" && after === rst) && after === rst);
    }
  }
  const audits = psql(`select count(*) from public.audit_log where at > now() - interval '2 minutes' and action ilike any (array['%approv%','%freez%','%content%'])`);
  step("audit rows written for these attempts (information)", "none if nothing changed", audits, null);
}

// ======================================================================
// J1-onboard — an INSTITUTION_ADMIN onboards people through the product.
// ======================================================================
async function j1onboard() {
  journey("J1onboard", "institution onboarding -> provisioned person -> Auth identity -> PINTAR sign-in",
    "doc 05 (Identity row) / doc 02: an institution provisions its people; a provisioned person can then " +
    "authenticate (magic link needs an Auth identity with their address; card sign-in needs a card account).");
  const A = await signIn("boot-admin@bootstrap.pintar.test", "Bootstrap-Admin-9163!");
  const person = psql(`select person_id from public.accounts where auth_user_id='${A.userId}'`);
  const inst = psql(`select distinct institution_id from public.role_assignments where person_id='${person}' and role='INSTITUTION_ADMIN' and revoked_at is null limit 1`);
  const node = psql(`select id from public.org_nodes where institution_id='${inst}' order by (kind::text='CLASS') desc, created_at limit 1`);
  step("discovery: the admin's institution and a node to provision into", "both", `inst=${inst} node=${node}`, Boolean(inst && node));
  const ns = action("src/app/pendataan/actions.ts", "simpanKodeAksi");
  const r0 = await postForm(ns, { institusi: inst, kode: "PRB" }, { jar: A.jar, path: "/pendataan" });
  step("reserve the institution's ID namespace (simpanKodeAksi)", "redirect to /pendataan", `status=${r0.status} location=${r0.location}`, null);
  const tag = Date.now().toString(36);
  const rows = [
    { display_name: `Guru Onboarding ${tag}`, role: "EDUCATOR", node_id: node },
    { display_name: `Siswa Onboarding ${tag}`, role: "STUDENT", node_id: node },
    { display_name: `Siswa Tanpa Peran ${tag}`, node_id: node },
  ];
  const open = action("src/app/pendataan/actions.ts", "bukaPendataanAksi");
  const r1 = await postForm(open, { institusi: inst, baris: JSON.stringify(rows) }, { jar: A.jar, path: "/pendataan" });
  const job = /\/pendataan\/([0-9a-f-]{36})/.exec(r1.location ?? "")?.[1];
  step("open an import with one teacher and one learner (bukaPendataanAksi)", "redirect to /pendataan/<job>", `status=${r1.status} location=${r1.location}`, Boolean(job));
  if (!job) return;
  const check = action("src/app/pendataan/actions.ts", "periksaAksi");
  const v = await callAction(check, [job], { jar: A.jar, path: `/pendataan/${job}` });
  step("validate (periksaAksi)", "ok", JSON.stringify(v.value)?.slice(0, 200), v.value?.ok === true);
  const conf = action("src/app/pendataan/actions.ts", "konfirmasiAksi");
  const r2 = await postForm(conf, { pekerjaan: job }, { jar: A.jar, path: `/pendataan/${job}` });
  step("confirm (konfirmasiAksi)", "redirect back to the job without galat", `status=${r2.status} location=${r2.location}`, r2.location && !/galat/.test(r2.location));
  const adv = action("src/app/pendataan/actions.ts", "majukanAksi");
  let k = null;
  for (let i = 0; i < 10; i++) { k = (await callAction(adv, [job], { jar: A.jar, path: `/pendataan/${job}` })).value; if (!k || k.pending === 0 || k.state === "COMPLETED" || /COMPLETE|DONE/i.test(String(k?.state))) break; }
  step("provision (majukanAksi until done)", "completed", JSON.stringify(k)?.slice(0, 240), null);
  step("the intake's own per-row outcome (import_rows.state / failure_reason)", "(recorded)",
    psql(`select string_agg(ordinal||':'||state||':'||coalesce(failure_reason,''), ' | ' order by ordinal) from public.import_rows where job_id='${job}'`), null);
  const page = await http(`/pendataan/${job}`, { jar: A.jar });
  step("what the job page tells the administrator afterwards", "(recorded)", text(page.body).slice(0, 300), null);
  for (const r of rows) {
    const p = psql(`select id from public.persons where display_name='${r.display_name}'`);
    const acc = p ? psql(`select count(*) from public.accounts where person_id='${p}'`) : "n/a";
    const au = p ? psql(`select count(*) from auth.users u join public.accounts a on a.auth_user_id=u.id where a.person_id='${p}'`) : "n/a";
    const role = p ? psql(`select coalesce(string_agg(role::text, ','),'') from public.role_assignments where person_id='${p}' and revoked_at is null`) : "";
    const iid = p ? psql(`select coalesce(string_agg(x::text, ','),'') from (select to_jsonb(t) ->> 'institutional_id' as x from public.institutional_identities t where t.person_id='${p}') q`).trim() : "";
    step(`${r.role} "${r.display_name}": person / role / accounts / auth identities`, "person + role + an account that can sign in",
      `person=${p ? "yes" : "no"} role=${role || "-"} accounts=${acc} auth_identities=${au} institutional_id=${iid || "-"}`, p && acc !== "0" && au !== "0");
  }
  // F-01: the administrator activates them through the product
  const learner = psql(`select id from public.persons where display_name='Siswa Onboarding ${tag}'`);
  const teacher = psql(`select id from public.persons where display_name='Guru Onboarding ${tag}'`);
  const list = await http("/aktivasi", { jar: A.jar });
  step("the activation screen offers the provisioned people", "both names listed",
    `status=${list.status}`, list.status === 200 && text(list.body).includes(`Siswa Onboarding ${tag}`) && text(list.body).includes(`Guru Onboarding ${tag}`));
  const activate = (body) => http("/api/akun/aktivasi", { jar: A.jar, method: "POST",
    headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify(body) });
  const ac = await activate({ mode: "CLASSROOM_CARD", person_id: learner });
  let issued = null; try { issued = JSON.parse(ac.body); } catch { /* not json */ }
  step("activate the learner with a classroom card (/api/akun/aktivasi)", "a card number and a PIN, once",
    `status=${ac.status} ok=${issued?.ok} card=${issued?.card ? "yes" : "no"} pin=${issued?.pin ? "yes" : "no"}`, issued?.ok === true && Boolean(issued?.card && issued?.pin));
  const te = `guru-onboarding-${tag}@contoh.invalid`;
  const ae = await activate({ mode: "EMAIL", person_id: teacher, email: te });
  step("activate the teacher by email (/api/akun/aktivasi)", "ok", `status=${ae.status} ${ae.body.slice(0, 120)}`, ae.status === 200);
  step("the learner's enrolment after activation", "ACTIVE",
    learner ? psql(`select coalesce(string_agg(status::text, ','),'none') from public.enrollments where person_id='${learner}'`) : "no person",
    learner ? /ACTIVE/.test(psql(`select coalesce(string_agg(status::text, ','),'') from public.enrollments where person_id='${learner}'`)) : false);
  // a stranger cannot use the door
  const sj = new Jar();
  const sa = await http("/api/akun/aktivasi", { jar: sj, method: "POST", headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ mode: "CLASSROOM_CARD", person_id: learner }) });
  step("an anonymous caller asks the activation route", "refused", `status=${sa.status}`, sa.status === 401 || sa.status === 403);

  // every product sign-in door, as the activated learner would try it
  const card = action("src/app/masuk/actions.ts", "signInWithCard");
  const cj = new Jar(); await http("/masuk/kartu", { jar: cj });
  const c = await callFormAction(card, { kartu: issued?.card ?? "0", pin: issued?.pin ?? "000000", lanjut: "/belajar" }, { jar: cj, path: "/masuk/kartu" });
  step("the activated learner signs in with the card and PIN they were given", "a redirect into the product, no error",
    `value=${JSON.stringify(c.value)} redirect=${c.redirect}`, Boolean(c.redirect) && !/galat|error/i.test(String(c.redirect)));
  const home = await http("/belajar", { jar: cj });
  step("the signed-in learner's /belajar", "200, their own learning surface", `status=${home.status}${home.location ? "->" + home.location : ""}`, home.status === 200);
  const srcDoors = spawnSync("grep", ["-rlE", "auth\\.admin\\.(createUser|inviteUserByEmail)|signUp\\(|insert into auth\\.users", join(APP_DIR, "src"), join(APP_DIR, "supabase", "migrations")], { encoding: "utf8" }).stdout.trim();
  step("any product path that creates an Auth identity for a provisioned person (inventory, src + migrations)", "one",
    srcDoors ? srcDoors.split("\n").map((f) => f.replace(APP_DIR, "")).join(", ") : "none", null);
}

// ======================================================================
// J6 — assessment answers under interruption (browser). Needs Playwright.
// ======================================================================
async function browser() {
  const pw = createRequire(join(process.env.PW_DIR ?? "/nonexistent", "package.json"))("playwright");
  return pw.chromium.launch();
}
async function browserFor(b, jar) {
  const ctx = await b.newContext();
  const url = new URL(BASE);
  await ctx.addCookies([...jar.c].map(([name, value]) => ({ name, value, domain: url.hostname, path: "/" })));
  return ctx;
}
/** The learner's own discovery through the product's reads: a startable assessment of the given mode. */
async function startable(L, mode) {
  const las = await rest("rpc/my_learning_assignments", { token: L.token, method: "POST", body: {} });
  for (const la of Array.isArray(las.json) ? las.json : []) {
    const id = la.learning_assignment_id;
    const st = await rest("rpc/my_cycle_state", { token: L.token, method: "POST", body: { p_learning_assignment: id } });
    const row = Array.isArray(st.json) ? st.json[0] : st.json;
    const aa = mode === "PRE" ? row?.pre_assignment : row?.post_assignment;
    if (!aa) continue;
    const ok = await rest("rpc/may_start_assessment", { token: L.token, method: "POST", body: { p_assessment_assignment: aa } });
    const r = Array.isArray(ok.json) ? ok.json[0] : ok.json;
    if (r?.ok) return { la: id, aa };
  }
  return null;
}
async function startSessionFor(L, la, aa) {
  const start = action("src/app/belajar/actions.ts", "mulaiAsesmen");
  await postForm(start, { penugasan: aa, kembali: `/belajar/${la}` }, { jar: L.jar, path: pickWorker(start, "asesmen", { penugasan: aa, tugas: la }) });
  const person = psql(`select person_id from public.accounts where auth_user_id='${L.userId}'`);
  return psql(`select id from public.assessment_sessions where person_id='${person}' and assessment_assignment_id='${aa}' order by created_at desc limit 1`);
}
const responses = (session) => psql(`select coalesce(string_agg(pi.position||':'||r.client_seq||':'||coalesce(r.value::text,'null'), ' ' order by pi.position, r.client_seq),'') from public.responses r join public.presented_items pi on pi.id=r.presented_item_id where r.session_id='${session}'`);

async function j6outbox() {
  journey("J6", "assessment answers under interruption: pending work at Finish, and a changed answer after replay",
    "INV-28 / doc 04 §5: no legitimate completed work is lost; reconnect/replay never duplicates or silently " +
    "drops a response; final submission is exactly once. Finalization must not silently omit pending learner work.");
  let b; try { b = await browser(); } catch (e) { harness(`Playwright unavailable: ${e.message}`); return; }
  try {
    const L = await signIn("siklus-email@synthetic.pintar.test", "Sintetis-SiklusEmail-84!");
    const submitId = action("src/app/belajar/actions.ts", "submitAnswer").id;

    // ---- S2 (Second Eye's case): pending answer, sync unavailable, Finish reaches the server
    const pre = await startable(L, "PRE");
    step("discovery (product reads): a startable PRE_TEST for the learner", "one", JSON.stringify(pre), Boolean(pre));
    if (pre) {
      const session = await startSessionFor(L, pre.la, pre.aa);
      const n = Number(psql(`select count(*) from public.presented_items where session_id='${session}'`));
      const ctx = await browserFor(b, L.jar);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/belajar/${pre.la}/pemetaan`);
      await page.locator("button.pin-op").first().click();
      await page.waitForTimeout(1500);
      step("S2: answer item 1 online", "1 response recorded", responses(session) || "none", responses(session).split(" ").filter(Boolean).length === 1);
      // Answer sync becomes unavailable: every submitAnswer request fails at the network; nothing else does.
      await page.route("**/*", (route) => {
        const h = route.request().headers();
        if (route.request().method() === "POST" && h["next-action"] === submitId) return route.abort("failed");
        return route.continue();
      });
      for (let i = 1; i < n; i++) {
        await page.getByRole("button", { name: /Berikutnya|Next/ }).click();
        await page.locator("button.pin-op").nth(1).click();
        await page.waitForTimeout(400);
      }
      const outbox = await page.evaluate((k) => localStorage.getItem(k), `pintar.outbox.${session}`);
      step(`S2: answer items 2..${n} while answer sync is unavailable`, "held in the durable outbox, not on the server",
        `server=${responses(session)} | outbox entries=${Object.keys(JSON.parse(outbox ?? "{}")).length}`, null);
      const finishBtn = () => page.getByRole("button", { name: /Selesaikan pemetaan|Finish the mapping/ }).click();
      const observe = async (label, variant) => {
        const st = psql(`select status from public.assessment_sessions where id='${session}'`);
        const res = psql(`select coalesce((select to_jsonb(r) - 'id' from public.assessment_results r where r.session_id='${session}' limit 1)::text,'none')`);
        const ob = Object.keys(JSON.parse((await page.evaluate((k) => localStorage.getItem(k), `pintar.outbox.${session}`)) ?? "{}")).length;
        step(label, "Finish refused or deferred; never a FINALIZED session that omits pending work",
          `[${variant}] session=${st} | server responses=${responses(session)} | outbox still holds=${ob} | page=${page.url().replace(BASE, "")}`,
          !(st === "FINALIZED" && ob > 0), { result: res.slice(0, 500) });
        return st;
      };
      // S2a: the answer requests fail at the NETWORK (aborted)
      await finishBtn(); await page.waitForTimeout(2500);
      const s2a = await observe("S2a: press Finish while pending answers cannot reach the server (network failure)", "EMULATED: submitAnswer aborted");
      if (s2a !== "FINALIZED") {
        // S2b: the server ANSWERS the pending replay with {ok:false} -- the shape submitAnswer itself returns
        // whenever record_answer raises -- in the build's own Flight format, while Finish is untouched.
        await page.unroute("**/*");
        const buildId = readFileSync(join(APP_DIR, ".next/BUILD_ID"), "utf8").trim();
        await page.route("**/*", (route) => {
          const h = route.request().headers();
          if (route.request().method() === "POST" && h["next-action"] === submitId) {
            return route.fulfill({ status: 200, contentType: "text/x-component",
              body: `0:{"a":"$@1","f":"","q":"","i":false,"b":"${buildId}"}\n1:{"ok":false,"message":"probe: answer refused"}\n` });
          }
          return route.continue();
        });
        await finishBtn(); await page.waitForTimeout(2500);
        await observe("S2b: press Finish while the server refuses the pending replays ({ok:false})", "EMULATED: submitAnswer -> {ok:false}");
      }
      await ctx.close();
    }

    // ---- S1 (Bob's earlier hypothesis): reload with an unacknowledged answer, then change it
    const post = await startable(L, "POST");
    step("discovery (product reads): a startable POST_TEST for the learner", "one", JSON.stringify(post), Boolean(post));
    if (post) {
      const session = await startSessionFor(L, post.la, post.aa);
      const ctx = await browserFor(b, L.jar);
      let page = await ctx.newPage();
      await page.goto(`${BASE}/belajar/${post.la}/penguasaan`);
      const confirm = () => page.getByRole("button", { name: /Kunci jawaban ini|Confirm this answer/ }).click();
      await page.locator("button.pin-op").nth(0).click(); await confirm(); await page.waitForTimeout(1200);
      await ctx.setOffline(true);
      await page.getByRole("button", { name: /Berikutnya|Next/ }).click();
      await page.locator("button.pin-op").nth(0).click(); await confirm(); await page.waitForTimeout(800);
      step("S1: item 1 online, item 2 offline", "server has item 1 only; item 2 in the outbox", responses(session), null);
      await page.close();
      await ctx.setOffline(false);
      page = await ctx.newPage();
      await page.goto(`${BASE}/belajar/${post.la}/penguasaan`);
      await page.waitForTimeout(2500);
      step("S1: return online in a fresh page (the mount replay)", "item 2 replayed exactly once", responses(session), null);
      await page.getByRole("button", { name: /Berikutnya|Next/ }).click();
      await page.locator("button.pin-op").nth(1).click(); await confirm(); await page.waitForTimeout(2500);
      // a category-7 behaviour on the live player, for J8: the tab is hidden and shown again
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await page.waitForTimeout(800);
      const outbox = await page.evaluate((k) => localStorage.getItem(k), `pintar.outbox.${session}`);
      const offline = await page.locator(".pin-luring").count();
      step("S1: change item 2 to a different option after the replay", "the change is recorded with a new client_seq and becomes authoritative",
        `server=${responses(session)} | outbox=${outbox} | offline banner shown=${offline > 0}`, !JSON.parse(outbox ?? "{}") || Object.keys(JSON.parse(outbox ?? "{}")).length === 0);
      // continue as the learner would: answer the rest online, then submit
      const n = Number(psql(`select count(*) from public.presented_items where session_id='${session}'`));
      for (let i = 2; i < n; i++) {
        await page.getByRole("button", { name: /Berikutnya|Next/ }).click();
        await page.locator("button.pin-op").nth(0).click(); await confirm(); await page.waitForTimeout(500);
      }
      await page.getByRole("button", { name: /^Kumpulkan$|^Submit$/ }).click();
      await page.waitForTimeout(3000);
      const st = psql(`select status from public.assessment_sessions where id='${session}'`);
      const item2 = psql(`select coalesce(string_agg(r.client_seq||'='||r.value::text||' '||r.receipt_mode::text, ' ; ' order by r.client_seq),'none') from public.responses r join public.presented_items pi on pi.id=r.presented_item_id where r.session_id='${session}' and pi.position=2`);
      const ob2 = await page.evaluate((k) => localStorage.getItem(k), `pintar.outbox.${session}`);
      const labels = psql(`select string_agg(d.display_position||'='||d.label, ',' order by d.display_position) from public.presented_items pi, public.option_display_order(pi.session_id, pi.item_id) d where pi.session_id='${session}' and pi.position=2`);
      const want = /(?:^|,)2=([^,]+)/.exec(labels)?.[1];
      const last = item2.split(" ; ").pop() ?? "";
      step("S1: submit the session; item 2's authoritative answer", `the learner's last choice (display position 2 = label ${want}) is the latest recorded answer`,
        `session=${st} | display order ${labels} | item 2 on the server: ${item2} | outbox after submit=${ob2}`, Boolean(want) && last.includes(`"${want}"`));
      await ctx.close();
    }
    // ---- S3 (control for Second Eye's observation): change an answer in the SAME page, no reload
    const post2 = await startable(L, "POST");
    step("discovery (product reads): a second POST_TEST attempt for S3", "one (attempt_limit 2)", JSON.stringify(post2), Boolean(post2));
    if (post2) {
      const session = await startSessionFor(L, post2.la, post2.aa);
      const ctx = await browserFor(b, L.jar);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/belajar/${post2.la}/penguasaan`);
      const confirm = () => page.getByRole("button", { name: /Kunci jawaban ini|Confirm this answer/ }).click();
      await page.locator("button.pin-op").nth(0).click(); await confirm(); await page.waitForTimeout(1200);
      await page.locator("button.pin-op").nth(1).click(); await confirm(); await page.waitForTimeout(1500);
      step("S3: answer item 1, then change it in the same page (no reload)", "two receipts, client_seq 1 then 2; the change is latest",
        responses(session), /1:1:.* 1:2:/.test(responses(session)));
      await ctx.close();
    }
  } finally { await b.close(); }
}

// ======================================================================
// J8 — integrity observation lifecycle.
// ======================================================================
async function j8integrity() {
  journey("J8", "learner behaviour -> integrity signal -> educator review surface (never a verdict)",
    "doc 07 'Integrity evidence' / doc 09 V1: category-7 events (visibility change, navigation, reconnect, " +
    "rapid option change, submission anomaly) raise review signals for a human with CAN_REVIEW_INTEGRITY.");
  const before = "(run start: 0 on a fresh reset)";
  const after = psql(`select count(*) from public.integrity_signals`);
  const bySession = psql(`select coalesce(string_agg(category::text||'x'||n, ','),'none') from (select category, count(*) n from public.integrity_signals group by 1) q`);
  step("integrity_signals rows produced by every learner behaviour in this whole run (J10 finish, J6 offline/reconnect/navigation/answer changes, visibility change)",
    "at least one signal for the reconnect / navigation / visibility events", `before=${before} after=${after} by category=${bySession}`, Number(after) > 0);
  const H = await signIn("siklus-kaprodi@synthetic.pintar.test", "Sintetis-SiklusKaprodi-22!");
  const surf = await http("/studio/integritas", { jar: H.jar });
  const t = text(surf.body);
  step("the educator review surface (HEAD_OF_DEPARTMENT, /studio/integritas)", "lists the signals for review",
    `status=${surf.status} empty-state shown=${/Tidak ada catatan yang menunggu tinjauan/.test(t)}`, !/Tidak ada catatan yang menunggu tinjauan/.test(t));
  const emitters = spawnSync("grep", ["-rlE", "recordIntegritySignal\\(|record_integrity_signal", join(APP_DIR, "src")], { encoding: "utf8" }).stdout.trim();
  step("callers of the one signal writer in the application (inventory)", "the assessment client", emitters ? emitters.split("\n").map((f) => f.replace(APP_DIR, "")).join(", ") : "none", null);
  const dbWriters = psql(`select coalesce(string_agg(p.proname, ','),'') from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and pg_get_functiondef(p.oid) ilike '%insert into public.integrity_signals%'`);
  step("database functions/triggers that insert integrity signals (inventory)", "(recorded)", dbWriters || "none", null);
}

// ======================================================================
async function main() {
  for (const j of [j10, j1a, j1b, j5, j5b, j1onboard, j6outbox, j8integrity]) {
    try { await j(); } catch (e) { if (!current || !record.journeys.includes(current)) journey(j.name, "(failed before start)", ""); harness(e); }
  }
  writeFileSync(OUT, JSON.stringify(record, null, 2));
  const mismatches = record.journeys.flatMap((j) => j.steps.filter((s) => s.match === false).map((s) => `${j.id}: ${s.name}`));
  console.log(`\n==== ${LABEL}: ${record.journeys.length} journeys, ${mismatches.length} canonical mismatches ====`);
  mismatches.forEach((m) => console.log("  ✗ " + m));
}
main();
