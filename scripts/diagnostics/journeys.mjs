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
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const APP_DIR = process.argv[2] ?? ".";
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
    `status=${certPage.status} rendered=${state}`, state.startsWith("ISSUED"));

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
    `rpc=${rv.status} ${rv.body.slice(0, 80)} | api=${rApi.body.slice(0, 90)}`, null);
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
  const before = count();
  const res = await fetch(`${SUPA}/auth/v1/signup`, {
    method: "POST", headers: { apikey: ANON, "content-type": "application/json" },
    body: JSON.stringify({ email, password: "Stranger-Probe-4471!", data: { display_name: "Kepala Sekolah (asli)" } }),
  });
  const b = await res.text();
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
        pages.push(`${p}=${r.status}${r.location ? "->" + r.location : ""}`);
      }
      step("what the self-provisioned stranger reaches (HTTP status per surface)", "nothing beyond a refusal", pages.join(" "), null);
    } catch (e) { harness(e); }
    void jar;
  }
  // does it land in an administrator's queue?
  try {
    const A = await signIn("boot-admin@bootstrap.pintar.test", "Bootstrap-Admin-9163!");
    const q = await rest("rpc/persons_awaiting_first_role", { token: A.token, method: "POST", body: {} });
    step("the stranger appears in an INST_ADMIN's 'awaiting first role' queue", "no",
      q.status === 200 ? (q.body.includes("Kepala Sekolah") ? "yes (display name shown to the admin)" : "no") : `rpc ${q.status} ${q.body.slice(0, 80)}`, null);
  } catch (e) { harness(e); }
}

// ======================================================================
// J1b — sign-in: the magic link the production path depends on, end to end.
// ======================================================================
async function j1b() {
  journey("J1b", "magic-link sign-in through the application, end to end",
    "FABLE-01 §2 / L-2: a provisioned address requests a link on /masuk; the email's link returns to " +
    "<APP>/auth/callback; the code exchange creates the session and lands on the role home.");
  const email = "boot-guru@bootstrap.pintar.test";
  const jar = new Jar();
  await http("/masuk", { jar });
  const send = action("src/app/masuk/actions.ts", "sendMagicLink");
  const t0 = Date.now();
  const r = await callFormAction(send, { email, lanjut: "/" }, { jar, path: "/masuk" });
  step("sendMagicLink through the sign-in screen's server action", "terkirim", `status=${r.status} value=${JSON.stringify(r.value)}`, r.value === "terkirim");
  const verifierCookie = [...jar.c.keys()].filter((k) => /code-verifier/.test(k));
  step("the action response set the PKCE code-verifier cookie on THIS browser", "present", verifierCookie.join(",") || "absent", verifierCookie.length > 0);

  let link = null;
  try {
    for (let i = 0; i < 15 && !link; i++) {
      await new Promise((ok) => setTimeout(ok, 1000));
      const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent("to:" + email)}`)).json();
      const msg = (list.messages ?? []).find((m) => Date.parse(m.Created) >= t0 - 5000);
      if (msg) {
        const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
        const body = `${full.HTML ?? ""} ${full.Text ?? ""}`.replace(/&amp;/g, "&");
        link = /https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/.exec(body)?.[0] ?? null;
      }
    }
  } catch (e) { harness(e); }
  step("the email arrived and carries a verify link", "link", link ? link.slice(0, 90) + "…" : "no email/link", Boolean(link));
  if (!link) return;
  const v = await fetch(link, { redirect: "manual" });
  const loc = v.headers.get("location") ?? "";
  step("Auth's verify endpoint redirects back to the APPLICATION's callback", `${BASE}/auth/callback?code=…`,
    loc.slice(0, 120), loc.startsWith(`${BASE}/auth/callback`) && /[?&]code=/.test(loc));
  const code = /[?&]code=([^&]+)/.exec(loc)?.[1];
  if (!code) return;

  const exch = action("src/app/auth/callback/actions.ts", "tukarKode");
  // a different browser first (the phone-mail-app case), then the same one
  const other = new Jar();
  const x = await callAction(exch, [code, "/"], { jar: other, path: "/auth/callback" });
  step("the link opened in a DIFFERENT browser than the one that asked (e.g. phone mail app)", "recorded (PKCE binds to the asking browser)",
    `value=${JSON.stringify(x.value)} redirect=${x.redirect}`, null);
  const y = await callAction(exch, [code, "/"], { jar, path: "/auth/callback" });
  step("the link opened in the SAME browser that asked: code exchange (tukarKode)", "redirect to the role home with a session",
    `status=${y.status} redirect=${y.redirect} value=${JSON.stringify(y.value)}`, Boolean(y.redirect));
  const home = await http(y.redirect?.split(";")[0] || "/mengajar", { jar });
  step("the destination renders under the new session", "200, not a redirect to /masuk", `status=${home.status} location=${home.location}`, home.status === 200);
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
    `UI told: ${said2}; course status ${before2} -> ${after2}; module/item statuses: ${psql(`select string_agg(distinct status::text, ',') from public.items i join public.lessons l on l.id=i.lesson_id join public.modules m on m.id=l.module_id where m.course_id='${course}'`)}`,
    !(said2 === "ok" && before2 === after2));
}

// ======================================================================
async function main() {
  for (const j of [j10, j1a, j1b, j5]) {
    try { await j(); } catch (e) { if (!current || !record.journeys.includes(current)) journey(j.name, "(failed before start)", ""); harness(e); }
  }
  writeFileSync(OUT, JSON.stringify(record, null, 2));
  const mismatches = record.journeys.flatMap((j) => j.steps.filter((s) => s.match === false).map((s) => `${j.id}: ${s.name}`));
  console.log(`\n==== ${LABEL}: ${record.journeys.length} journeys, ${mismatches.length} canonical mismatches ====`);
  mismatches.forEach((m) => console.log("  ✗ " + m));
}
main();
