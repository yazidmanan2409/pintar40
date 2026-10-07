#!/usr/bin/env node
// #150 WP-C (B8, D-106(f)): DOES THE RECONSTRUCTED APPLICATION WORK? FOUR CHECKS, THROUGH THE APPLICATION ITSELF.
//
// RUNBOOK-NATIVE-RESTORE.md step 8, the clause "proved that it worked". Each check goes through the application's own
// routes, as a person's browser would (same origin, its own cookies), never around it:
//   F1  a staff sign-in: /masuk/password with the person's own name or address and password, then the page it sends
//       them to opens, through /mulai's own redirect (no way back to /masuk); a person holding several purposes ·
//       places answers the chooser as they would for this work («Seluruh platform» when held, else its one door)
//   F2  a class-card sign-in: the staff person re-issues one learner's card as damaged («Kartu hilang atau rusak»,
//       /api/akun/kartu-kelas), and the new card signs in at /masuk/kartu and opens /belajar. REHEARSAL ONLY: on a
//       real school it would retire a child's printed card, so `check` refuses it without --rehearsal
//   F3  a certificate verified by its token: /api/verifikasi/<token> says BERLAKU (the application recomputes the seal
//       with its own key: a key that is not the issuing one says TIDAK SAH) and /verifikasi/<token> renders it
//   F4  a file served from Storage: /api/assets/read-url signs an object for a signed-in person (the staff person, then
//       F2's learner), and the bytes it serves hash to the SHA-256 the independent bundle recorded for it
//
//   pick <db-url> [--staff-like <pattern>]
//                        read only (one READ ONLY transaction): the newest Golden School's admin (or the newest school
//                        admin whose address matches the pattern), a card learner of that school and an issued
//                        certificate; under Actions masked into $GITHUB_ENV, elsewhere as JSON
//   check --rehearsal    the four checks; exit 0 only when all four pass
//   certificate          F3 alone: no sign-in, no write, no identity, so production's step 8 runs it too (D-113)
//
// Environment (no value is ever printed; under Actions each is masked first):
//   APP_ORIGIN           the application's address (https://…; http only on loopback)
//   FC_STAFF, FC_STAFF_PASSWORD   the staff person's name or address, and password
//   FC_LEARNER           the person whose card F2 re-issues
//   FC_CERT_TOKEN        an issued certificate's token
//   FC_OBJECTS           the bundle's storage/manifest.jsonl ({bucket, name, sha256} per line)
//   FC_BYPASS            optional: a deployment-protection bypass value the platform asks for, sent as a header
import { createHash, randomInt } from "node:crypto";
import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const tutupi = (s) => { if (process.env.GITHUB_ACTIONS && s) console.log(`::add-mask::${s}`); return s; };

/** A person's browser on the application: same origin, its own cookies, redirects not followed. */
export class Peramban {
  constructor(asal, { bypass } = {}) {
    this.asal = asal;
    this.kue = new Map();
    // one address per browser, as separate people on separate devices (the sign-in limits count by address)
    this.ip = `198.51.100.${randomInt(1, 251)}`;
    this.bypass = bypass;
  }
  async kirim(path, { form, json, method } = {}) {
    const headers = { origin: this.asal, "sec-fetch-site": "same-origin", "x-real-ip": this.ip, accept: "application/json" };
    if (this.bypass) headers["x-vercel-protection-bypass"] = this.bypass;
    if (this.kue.size) headers.cookie = [...this.kue].map(([k, v]) => `${k}=${v}`).join("; ");
    let body;
    if (form) { body = new FormData(); for (const [k, v] of Object.entries(form)) body.set(k, v); }
    if (json !== undefined) { body = JSON.stringify(json); headers["content-type"] = "application/json"; }
    const r = await fetch(this.asal + path, { method: method ?? (body ? "POST" : "GET"), headers, body, redirect: "manual", signal: AbortSignal.timeout(60000) });
    for (const c of r.headers.getSetCookie()) {
      const [pasangan, ...atribut] = c.split(";");
      const i = pasangan.indexOf("=");
      const nama = pasangan.slice(0, i).trim(), nilai = pasangan.slice(i + 1);
      if (!nilai || atribut.some((a) => /^\s*max-age=0\s*$/i.test(a))) this.kue.delete(nama); else this.kue.set(nama, nilai);
    }
    return r;
  }
  async json(path, opsi) {
    const r = await this.kirim(path, opsi);
    return { status: r.status, body: await r.json().catch(() => null) };
  }
}

const keMasuk = (r, asal) => r.status >= 300 && r.status < 400 && new URL(r.headers.get("location") ?? "/", asal).pathname.startsWith("/masuk");
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
// the three kinds of path /api/assets/read-url signs (src/app/api/assets/read-url/route.ts)
const DIBACA = [/^profile\/[0-9a-f-]{36}\/[a-z0-9_.-]{1,120}$/i, /^pelajaran\/(?:[0-9a-f-]{36}\/[0-9a-f-]{36}\/)?[a-z0-9_.-]{1,160}$/i,
  /^laporan\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:png|jpg|jpeg|webp)$/];

// L3 (D-132 C3, C7): a person who holds several purposes · places is asked on the chooser (`/`) what they are here to
// do, and the check answers as that person would for this work, by pressing the door's own form: «Seluruh platform»
// when it is held (re-issuing a learner's card is the platform's work there), else the one door offered. A person
// holding one pair (a school's admin, as `pick` chooses) is never asked.
const nilaiAtribut = (tag, nama) => (new RegExp(`\\b${nama}="([^"]*)"`).exec(tag)?.[1] ?? "")
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
function pintuPemilih(html) {
  const pintu = [];
  for (const bagian of html.split(/<form\b/).slice(1)) {
    const isi = bagian.split(/<\/form>/)[0];
    const kunci = /<button\b[^>]*\bdata-konteks="([^"]*)"/.exec(isi)?.[1];
    if (!kunci) continue;
    pintu.push({ kunci, isian: Object.fromEntries([...isi.matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)]
      .map((m) => [nilaiAtribut(m[0], "name"), nilaiAtribut(m[0], "value")])) });
  }
  return pintu.find((p) => p.kunci === "MENGELOLA:PLATFORM") ?? (pintu.length === 1 ? pintu[0] : null);
}

export async function f1(asal, opsi, { staf, password }) {
  const b = new Peramban(asal, opsi);
  const m = await b.json("/masuk/password", { form: { identitas: staf, password } });
  if (m.status !== 200 || m.body?.ok !== true) return { ok: false, line: `/masuk/password answered ${m.status} ${m.body?.code ?? ""}`.trim() };
  let tujuan = typeof m.body.tujuan === "string" && m.body.tujuan.startsWith("/") ? m.body.tujuan : "/";
  // every sign-in arrives through /mulai, which sets the working context and sends the person on (L3, D-132 C4, C9):
  // the application's own redirects are followed, a few hops at most and never to /masuk. Only their path is taken
  // and asked of this same origin (the application names its own host, which behind a proxy is not this address)
  let r = await b.kirim(tujuan);
  for (let hop = 0; hop < 3 && r.status >= 300 && r.status < 400 && !keMasuk(r, asal); hop++) {
    const ke = new URL(r.headers.get("location") ?? "/", asal);
    tujuan = ke.pathname + ke.search;
    r = await b.kirim(tujuan);
  }
  if (r.status !== 200 || keMasuk(r, asal)) return { ok: false, line: `signed in, but ${tujuan.replace(/[0-9a-f-]{36}/g, "<id>")} answered ${r.status}` };
  let dipilih = "";
  if (new URL(tujuan, asal).pathname === "/") {
    const pintu = pintuPemilih(await r.text());
    if (!pintu) return { ok: false, line: "signed in, but the chooser offers no door this check can answer for" };
    const p = await b.kirim("/", { form: pintu.isian });
    const ke = new URL(p.headers.get("location") ?? "/", asal);
    const di = await b.kirim(ke.pathname + ke.search);
    if (p.status < 300 || p.status >= 400 || di.status !== 200 || keMasuk(di, asal)) {
      return { ok: false, line: `signed in, but choosing on the chooser answered ${p.status} and its page ${di.status}` };
    }
    dipilih = `; on the chooser chose ${pintu.kunci === "MENGELOLA:PLATFORM" ? "«Seluruh platform»" : "the one door"} and ${ke.pathname.replace(/[0-9a-f-]{36}/g, "<id>")} opened`;
  }
  return { ok: true, line: `the staff person signed in with their password and ${tujuan.replace(/[0-9a-f-]{36}/g, "<id>")} opened${dipilih}`, b };
}

export async function f2(asal, opsi, staf, learner) {
  if (!staf) return { ok: false, line: "not run: F1 gave no signed-in staff person" };
  const u = await staf.json("/api/akun/kartu-kelas", { json: { person_id: learner, alasan: "RUSAK" } });
  const k = u.body?.kartu ?? {};
  if (u.status !== 200 || !/^\d{10}$/.test(k.card ?? "") || !/^\d{6}$/.test(k.pin ?? "")) return { ok: false, line: `the re-issue answered ${u.status} ${u.body?.code ?? ""}`.trim() };
  tutupi(k.card); tutupi(k.pin);
  const b = new Peramban(asal, opsi);
  const m = await b.json("/masuk/kartu", { form: { kartu: k.card, pin: k.pin } });
  if (m.status !== 200 || m.body?.ok !== true) return { ok: false, line: `the re-issued card was refused at /masuk/kartu: ${m.status} ${m.body?.code ?? ""}`.trim() };
  const r = await b.kirim("/belajar");
  if (r.status !== 200 || keMasuk(r, asal)) return { ok: false, line: `the card signed in, but /belajar answered ${r.status}` };
  return { ok: true, line: "the staff person re-issued a learner's card as damaged; the new card signed in and /belajar opened (number and PIN not recorded)", b };
}

export async function f3(asal, opsi, token) {
  const b = new Peramban(asal, opsi);
  const api = await b.json(`/api/verifikasi/${encodeURIComponent(token)}`);
  if (api.status !== 200 || api.body?.validity !== "BERLAKU") return { ok: false, line: `/api/verifikasi/<token> answered ${api.status}, validity ${JSON.stringify(api.body?.validity ?? null)}` };
  const halaman = await b.kirim(`/verifikasi/${encodeURIComponent(token)}`);
  const teks = halaman.status === 200 ? await halaman.text() : "";
  if (!/Berlaku/.test(teks)) return { ok: false, line: `the seal holds, but /verifikasi/<token> answered ${halaman.status}${halaman.status === 200 ? " without «Berlaku»" : ""}` };
  return { ok: true, line: "the application recomputed the seal with its own key (BERLAKU) and the public page says «Berlaku»" };
}

export async function f4(asal, opsi, browsers, objects) {
  const calon = objects.filter((o) => o.bucket === "assets" && DIBACA.some((p) => p.test(o.name ?? "")) && /^[0-9a-f]{64}$/.test(o.sha256 ?? "")).slice(0, 25);
  if (!browsers.length) return { ok: false, line: "not run: nobody is signed in" };
  if (!calon.length) return { ok: false, line: "the bundle names no object the application serves" };
  const ditolak = {};
  for (const o of calon) {
    for (const [siapa, b] of browsers) {
      const r = await b.json(`/api/assets/read-url?path=${encodeURIComponent(o.name)}`);
      if (r.status !== 200) { ditolak[r.status] = (ditolak[r.status] ?? 0) + 1; continue; }
      if (typeof r.body?.url !== "string") return { ok: false, line: `read-url answered 200 without an address, for ${siapa}` };
      const f = await fetch(r.body.url, { signal: AbortSignal.timeout(60000) });
      const bytes = Buffer.from(await f.arrayBuffer());
      if (f.status !== 200) return { ok: false, line: `the signed address answered ${f.status}, for ${siapa}` };
      if (sha256(bytes) !== o.sha256) return { ok: false, line: `the file served to ${siapa} (${bytes.length} bytes) does not hash to the bundle's SHA-256` };
      return { ok: true, line: `a ${o.name.split("/")[0]} file was signed for ${siapa} and served, ${bytes.length} bytes, hashing to the bundle's SHA-256` };
    }
  }
  return { ok: false, line: `none of ${calon.length} object(s) was served: ${JSON.stringify(ditolak)}` };
}

/** The four checks, in order; F2 and F4 use the browsers F1 and F2 signed in. */
export async function check({ asal, bypass, staf, password, learner, token, objects }) {
  const opsi = { bypass };
  const rows = [];
  const a = await f1(asal, opsi, { staf, password });
  rows.push({ id: "F1", what: "a staff sign-in", ...a });
  const b = await f2(asal, opsi, a.b, learner);
  rows.push({ id: "F2", what: "a class-card sign-in", ...b });
  rows.push({ id: "F3", what: "a certificate verified by its token", ...(await f3(asal, opsi, token)) });
  const browsers = [["the staff person", a.b], ["the learner", b.b]].filter(([, x]) => x);
  rows.push({ id: "F4", what: "a file served from Storage", ...(await f4(asal, opsi, browsers, objects)) });
  // the browsers stay here: only what each check found leaves
  return rows.map((r) => ({ id: r.id, what: r.what, ok: r.ok, line: r.line }));
}

// the staging Golden School's admins, as its walks register them (audit/staging/golden-school.mjs)
export const GOLDEN_ADMIN = "goldenschool+%-admin@pintarselalu.com";

/** Read only: who and what the checks use, on the copy. */
export function pick(db, { staffLike = GOLDEN_ADMIN } = {}) {
  const lit = (x) => `'${String(x).replace(/'/g, "''")}'`;
  const sql = `
    with s as (
      select u.email, ra.institution_id from auth.users u
        join public.accounts a on a.auth_user_id = u.id
        join public.role_assignments ra on ra.person_id = a.person_id and ra.role = 'INSTITUTION_ADMIN'
         and ra.revoked_at is null and now() < coalesce(ra.valid_until, 'infinity')
        join public.institutions i on i.id = ra.institution_id
       where lower(u.email) like lower(${lit(staffLike)})
       order by i.created_at desc limit 1)
    select json_build_object(
      'staff', (select email from s),
      'learner', (select a.person_id from s join public.institutional_identities ii on ii.institution_id = s.institution_id
                    join public.accounts a on a.person_id = ii.person_id and a.kind = 'CLASSROOM_CARD' and a.card_number is not null
                   order by a.created_at limit 1),
      'token', (select c.verification_token from public.certificates c where c.status = 'ISSUED' and c.signature is not null
                 order by c.issued_at desc limit 1))`;
  const r = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-At", db], { input: `begin read only;\n${sql};\ncommit;\n`, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`the copy could not be read: ${(r.stderr || "").trim().split("\n").pop()}`);
  const out = JSON.parse(r.stdout.trim().split("\n").find((l) => l.startsWith("{")));
  const missing = ["staff", "learner", "token"].filter((k) => !out[k]);
  if (missing.length) throw new Error(`the copy holds no ${missing.join(", ")} for the checks`);
  return out;
}

function origin(v) {
  let u;
  try { u = new URL(v ?? ""); } catch { return null; }
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname);
  return u.origin === v && (u.protocol === "https:" || (u.protocol === "http:" && loopback)) ? v : null;
}

async function main([cmd, ...rest]) {
  if (cmd === "pick") {
    const db = rest[0];
    if (!db) { console.error("usage: functional.mjs pick <db-url> [--staff-like <address pattern>]"); return 2; }
    const i = rest.indexOf("--staff-like");
    const p = pick(db, i > 0 ? { staffLike: rest[i + 1] } : {});
    if (!process.env.GITHUB_ENV) { console.log(JSON.stringify(p)); return 0; }
    // under Actions: masked first, then into the job's environment, never onto the log
    tutupi(p.staff); tutupi(p.token);
    appendFileSync(process.env.GITHUB_ENV, `FC_STAFF=${p.staff}\nFC_LEARNER=${p.learner}\nFC_CERT_TOKEN=${p.token}\n`);
    console.log("picked on the copy, read only: the newest Golden School's admin, a card learner of that school, an issued certificate");
    return 0;
  }
  if (cmd === "certificate") {
    const asal = origin(process.env.APP_ORIGIN);
    if (!asal || !process.env.FC_CERT_TOKEN) { console.log("::error::not set: APP_ORIGIN (https://…, or http on loopback, no path) and FC_CERT_TOKEN"); return 1; }
    tutupi(process.env.FC_CERT_TOKEN); tutupi(process.env.FC_BYPASS);
    const r = await f3(asal, { bypass: process.env.FC_BYPASS }, process.env.FC_CERT_TOKEN);
    console.log(`F3 ${r.ok ? "PASS" : "FAIL"}  a certificate verified by its token: ${r.line}`);
    if (!r.ok) console.log(`::error::F3 a certificate verified by its token: ${r.line}`);
    return r.ok ? 0 : 1;
  }
  if (cmd === "check") {
    if (!rest.includes("--rehearsal")) { console.log("::error::F2 re-issues a learner's card: the checks run on a rehearsal copy only (--rehearsal)"); return 1; }
    const env = process.env;
    const asal = origin(env.APP_ORIGIN);
    const miss = ["FC_STAFF", "FC_STAFF_PASSWORD", "FC_LEARNER", "FC_CERT_TOKEN", "FC_OBJECTS"].filter((k) => !env[k]);
    if (!asal) miss.unshift("APP_ORIGIN (https://…, or http on loopback, no path)");
    if (miss.length) { console.log(`::error::not set: ${miss.join(", ")}`); return 1; }
    for (const k of ["FC_STAFF", "FC_STAFF_PASSWORD", "FC_CERT_TOKEN", "FC_BYPASS"]) tutupi(env[k]);
    const objects = readFileSync(env.FC_OBJECTS, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    const rows = await check({ asal, bypass: env.FC_BYPASS, staf: env.FC_STAFF, password: env.FC_STAFF_PASSWORD, learner: env.FC_LEARNER,
      token: env.FC_CERT_TOKEN, objects });
    for (const r of rows) console.log(`${r.id} ${r.ok ? "PASS" : "FAIL"}  ${r.what}: ${r.line}`);
    const bad = rows.filter((r) => !r.ok);
    for (const r of bad) console.log(`::error::${r.id} ${r.what}: ${r.line}`);
    if (!bad.length) console.log(`IT WORKS: ${asal} passed all four checks`);
    return bad.length ? 1 : 0;
  }
  console.error("usage: functional.mjs pick <db-url> [--staff-like <pattern>] | check --rehearsal | certificate");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
