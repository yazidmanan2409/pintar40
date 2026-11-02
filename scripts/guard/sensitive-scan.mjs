#!/usr/bin/env node
// Batch 0 (B0-C; D-142, D-143): the repository is public, so nothing secret, keyed or personal may be committed.
//
// One scanner, three modes:
//   --staged   (pre-commit hook)  the staged additions: refuses the commit on any finding not allowed
//   --tree     (CI, selftest)     every tracked file at HEAD
//   --history  (one-off audit)    every unique blob reachable from any ref, i.e. everything the public can read
//
// It NEVER prints a matched value. A finding is reported as: rule, class, path (and, in --history, one commit
// that holds the blob), and a short sha256 fingerprint of the value, so a person can find and judge it without
// the scan itself leaking it again (owner authorisation B0-C(4)).
//
// What it looks for (scripts/guard/rules.mjs): private keys; provider tokens with a fixed shape (GitHub, AWS,
// Supabase, Stripe, Slack, Google, Resend, npm); JWTs whose payload says service_role or an unknown issuer;
// database URLs with an inline password on a non-local host; assignments of a password, secret or token to a
// literal in env-like and config files; real-person data (an email at a domain not on the synthetic list; a
// 16-digit NIK); and restricted assessment-answer material (answer keys outside the synthetic fixtures): every
// .paket.json and .xlsx by its path, and, in any text file (F-4, D-145(b)), keyed content: three or more
// `"is_correct": true` markers, a generator's keyed option tuples, a misconception CSV mapping distractors.
//
// The allow list (scripts/guard/allowlist.json) names what is public on purpose: the Supabase local stack's
// well-known demo keys, synthetic fixture directories, example domains, and every file declared to carry keys on
// purpose (synthetic). F-4 removed the real keyed files from the tree; `f4_riwayat` names them so --history can
// count them (already public; never treated as confidential again). Anything else is a finding.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { aturan, kelas } from "./rules.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const muatIzin = (berkas = join(here, "allowlist.json")) => JSON.parse(readFileSync(berkas, "utf8"));

export const sidik = (v) => createHash("sha256").update(v).digest("hex").slice(0, 12);
const cocokPola = (p, pola) => pola.some((g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "§").replace(/\*/g, "[^/]*").replace(/§/g, ".*") + "$").test(p));

/** Is this finding allowed (public on purpose, or already public and registered awaiting a decision)? */
export function diizinkan(t, izin) {
  if (izin.nilai_sidik.some((n) => n.sidik === t.sidik)) return true;
  // Answer-key material is never allowed by its directory alone: audit/fixtures held two copies of real chapters
  // (B0-C finding). Every keyed package and workbook is declared by path: real (F-4 inventory), synthetic, or no keys.
  if (kelas[t.aturan] === "kunci-jawaban") return izin.berkas_kerja_terdaftar.some((f) => f.path === t.path);
  if (cocokPola(t.path, izin.jalur_sintetis) && kelas[t.aturan] !== "kredensial") return true;
  return false;
}

/** Scan one text for every rule. Never returns a value, only its fingerprint. */
export function pindai(path, teks, izin) {
  const hasil = [];
  for (const r of aturan) {
    if (r.jalur && !r.jalur.test(path)) continue;
    if (r.bukanJalur && r.bukanJalur.test(path)) continue;
    const sumber = r.barisPertama ? teks.split("\n", 1)[0] : teks;
    if (r.minimal) {
      // data-shaped: one finding for the file, only past the threshold, fingerprinted by rule and path
      if ([...sumber.matchAll(r.pola)].length >= r.minimal) hasil.push({ aturan: r.id, kelas: kelas[r.id], path, sidik: sidik(`${r.id}:${path}`) });
      continue;
    }
    for (const m of sumber.matchAll(r.pola)) {
      const nilai = m.groups?.v ?? m[0];
      if (r.saring && !r.saring(nilai, m, izin)) continue;
      hasil.push({ aturan: r.id, kelas: kelas[r.id], path, sidik: sidik(nilai) });
    }
  }
  return hasil;
}

const biner = (buf) => buf.subarray(0, 8000).includes(0);

/** Scan one file's bytes: a keyed package or workbook is flagged by its path, then any text is scanned. */
export function pindaiBerkas(path, buf, izin) {
  const hasil = [];
  if (/\.paket\.json$|\.xlsx$/i.test(path)) hasil.push({ aturan: "kunci-jawaban", kelas: kelas["kunci-jawaban"], path, sidik: sidik(path) });
  if (!biner(buf)) hasil.push(...pindai(path, buf.toString("utf8"), izin));
  return hasil;
}

/** De-duplicate (rule, path, fingerprint) and split into refused and allowed. */
export function putuskan(temuan, izin) {
  const kunciUnik = new Set();
  const rapi = temuan.filter((t) => { const k = `${t.aturan}|${t.path}|${t.sidik}`; if (kunciUnik.has(k)) return false; kunciUnik.add(k); return true; });
  const ditolak = rapi.filter((t) => !diizinkan(t, izin));
  const f4 = new Set(rapi.filter((t) => kelas[t.aturan] === "kunci-jawaban" && izin.berkas_kerja_terdaftar.some((f) => f.path === t.path && f.jenis === "nyata-F4")).map((t) => t.path));
  // F-4: keyed findings in the files F-4 removed (only --history sees them: they are no longer in the tree)
  const riwayat = new Set(ditolak.filter((t) => kelas[t.aturan] === "kunci-jawaban" && cocokPola(t.path, izin.f4_riwayat ?? [])).map((t) => t.path));
  return { ditolak, diizinkan: rapi.length - ditolak.length, f4: [...f4], f4Riwayat: [...riwayat] };
}

function daftar(root, mode) {
  if (mode === "--tree") {
    const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
    return files.map((p) => ({ path: p, isi: () => existsSync(join(root, p)) ? readFileSync(join(root, p)) : Buffer.alloc(0) }));
  }
  if (mode === "--staged") {
    const files = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
    return files.map((p) => ({ path: p, isi: () => execFileSync("git", ["show", `:${p}`], { cwd: root, maxBuffer: 1 << 28 }) }));
  }
  // --history: every unique blob reachable from any ref, with one path that holds it
  const objek = execFileSync("git", ["rev-list", "--all", "--objects"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 30 })
    .split("\n").filter((l) => l.includes(" ")).map((l) => { const i = l.indexOf(" "); return { sha: l.slice(0, i), path: l.slice(i + 1) }; });
  const unik = new Map();
  for (const o of objek) if (!unik.has(o.sha)) unik.set(o.sha, o.path);
  const tipe = spawnSync("git", ["cat-file", "--batch-check=%(objectname) %(objecttype) %(objectsize)"], { cwd: root, input: [...unik.keys()].join("\n"), encoding: "utf8", maxBuffer: 1 << 30 }).stdout
    .split("\n").filter(Boolean).map((l) => l.split(" "));
  return tipe.filter(([, t, n]) => t === "blob" && Number(n) < 5 * 1024 * 1024)
    .map(([sha]) => ({ path: unik.get(sha), sha, isi: () => execFileSync("git", ["cat-file", "blob", sha], { cwd: root, maxBuffer: 1 << 28 }) }));
}

/** Scan a repository in one mode. */
export function pindaiRepo(root, mode, izin = muatIzin()) {
  const temuan = [];
  for (const b of daftar(root, mode)) {
    if (izin.abaikan_jalur.some((g) => cocokPola(b.path, [g]))) continue;
    temuan.push(...pindaiBerkas(b.path, b.isi(), izin).map((t) => (b.sha ? { ...t, blob: b.sha } : t)));
  }
  return putuskan(temuan, izin);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const mode = process.argv.find((a) => ["--staged", "--tree", "--history"].includes(a)) ?? "--staged";
  const { ditolak, diizinkan: n, f4, f4Riwayat } = pindaiRepo(root, mode);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ mode, temuan: ditolak, diizinkan: n, f4_terpapar: f4, f4_riwayat: f4Riwayat }, null, 1));
  } else {
    for (const t of ditolak) console.log(`${t.kelas.padEnd(12)} ${t.aturan.padEnd(22)} ${t.path}  [${t.sidik}]${t.blob ? ` blob ${t.blob.slice(0, 10)}` : ""}`);
    console.log(`sensitive-scan ${mode}: ${ditolak.length} finding(s) not allowed; ${n} allowed by scripts/guard/allowlist.json`);
    if (f4.length) console.log(`  of which ${f4.length} file(s) hold REAL answer keys already public (F-4 inventory; awaiting the owner's F-4 decision, not approved)`);
    if (f4Riwayat.length) console.log(`  ${f4Riwayat.length} path(s) among the findings are real keyed files F-4 removed from the tree (f4_riwayat; still in history, so already public: D-145(b))`);
  }
  if (mode !== "--history" && ditolak.length > 0) {
    console.error("Refused: the repository is public (D-143). Remove the value, or, if it is public on purpose, add its fingerprint to scripts/guard/allowlist.json with a reason.");
    process.exit(1);
  }
}
