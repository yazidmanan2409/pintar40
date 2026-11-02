/**
 * THE PUBLIC-REPOSITORY GUARD (Batch 0, B0-C; D-143: the repository is public by the owner's choice).
 *
 *  SEC-G01  scripts/guard/sensitive-scan.mjs, executed on planted text: every class it exists for is refused (red)
 *           and every public-on-purpose shape is let through (green). Planted values are BUILT at run time from
 *           pieces, so this file holds no secret shape of its own and the tree scan does not flag it.
 *           Red: a private-key header; GitHub, AWS, Supabase, Stripe, Slack, Google, Resend and npm tokens; a JWT
 *           granting service_role from a real project; a database URL with a password on a real host; a secret
 *           assigned in an env file; a credential inside a synthetic fixture directory (never allowed by path); a
 *           personal address; a plausible NIK; an undeclared answer-key package, including one under audit/fixtures
 *           (two real chapters sat there, B0-C finding). F-4 (D-145(b)), keyed CONTENT in any text file, class
 *           kunci-jawaban: (a) three or more "is_correct": true markers in a .ts, .py, .sql, .md or .json file that is
 *           not a package, (b) a generator's keyed option tuple (an option, True, then a reason opening «Benar» or «Tepat»),
 *           (c) a misconception CSV whose header has both `code` and `questions` (its distractor map gives the key by
 *           elimination). Green: the
 *           Supabase local stack's demo JWT, synthetic and reserved domains, organisational role addresses, stand-in
 *           tokens, a localhost database URL, a declared synthetic package, code that merely mentions is_correct
 *           (twice in one file, as src/ and selftest/ do), the same keyed content in a file declared «sintetis», and
 *           a CSV with a `code` column and no `questions`. No finding carries the value: only a 12-hex fingerprint.
 *  SEC-G02  the repository as committed: `--tree` finds nothing not allowed; every .paket.json and .xlsx tracked is
 *           declared in scripts/guard/allowlist.json (and every declaration names a tracked file); since F-4 none is
 *           declared nyata-F4 (real keys) and no real keyed file is found;
 *           every registered fingerprint carries a reason; the pre-commit hook runs the scanner on staged files and
 *           npm's prepare script installs it.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Checks, type SelfTest } from "./lib";

type Temuan = { aturan: string; kelas: string; path: string; sidik: string };
type Modul = {
  pindaiBerkas: (path: string, buf: Buffer, izin: unknown) => Temuan[];
  putuskan: (t: Temuan[], izin: unknown) => { ditolak: Temuan[]; diizinkan: number; f4: string[] };
  pindaiRepo: (root: string, mode: string) => { ditolak: Temuan[]; diizinkan: number; f4: string[] };
  muatIzin: () => Izin;
};
type Izin = { nilai_sidik: { sidik: string; alasan?: string }[]; berkas_kerja_terdaftar: { path: string; jenis: string; alasan?: string }[] };

/** Deterministic filler of a given alphabet, so a planted value looks like the real thing without being one. */
function isi(n: number, abjad = "Ab3Cd5Ef7Gh9Jk2Lm4Np6Qr8St"): string {
  let s = "", x = 7;
  for (let i = 0; i < n; i++) { x = (x * 31 + 11) % 9973; s += abjad[x % abjad.length]; }
  return s;
}
const b64u = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const jwt = (p: object) => `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u(p)}.${isi(43)}`;
const at = "@";
/** F-4: a correct-answer marker, built so this file never holds one literally (the tree scan reads it too). */
const tanda = () => ['"is', '_correct": ', "true"].join("");
/** n options of an item as a package carries them: the first correct. */
const opsiBerkunci = (n: number) => `[${Array.from({ length: n }, (_, i) => (i === 0 ? `{${tanda()}}` : `{${tanda().replace("true", "false")}}`)).join(", ")}]`;
/** n items as a package or a pasted item list carries them, one correct option each. */
const soalBerkunci = (n: number) => `[${Array.from({ length: n }, (_, i) => `{"stem": "Soal ${i + 1}", "options": ${opsiBerkunci(4)}}`).join(",\n")}]`;

async function modul(root: string): Promise<Modul> {
  return import(pathToFileURL(join(root, "scripts/guard/sensitive-scan.mjs")).href) as Promise<Modul>;
}

export const secguardTests: SelfTest[] = [
  {
    id: "SEC-G01",
    run: async (ctx) => {
      const c = new Checks();
      const m = await modul(ctx.repoRoot);
      const izin = { ...m.muatIzin(), nilai_sidik: [] };
      const nilai = (path: string, teks: string) => m.putuskan(m.pindaiBerkas(path, Buffer.from(teks), izin), izin);

      const merah: [string, string, string, string][] = [
        ["kunci-privat", "kredensial", "deploy/id.pem", ["-----BEGIN", "RSA PRIVATE KEY-----"].join(" ") + "\n" + isi(64)],
        ["token-github", "kredensial", "scripts/x.mjs", `const t = "${"gh" + "p_" + isi(36)}";`],
        ["kunci-aws", "kredensial", "infra/x.json", `{"k": "${"AK" + "IA" + isi(16, "ABCDEFGHJKLMNPQRSTUVWXYZ234567")}"}`],
        ["kunci-supabase", "kredensial", "scripts/y.mjs", `KEY="${"sb_" + "secret_" + isi(32)}"`],
        ["kunci-stripe", "kredensial", "src/pay.ts", `const k = "${"sk_" + "live_" + isi(24)}";`],
        ["token-slack", "kredensial", "ops/notify.sh", `curl -H "Authorization: Bearer ${"xo" + "xb-" + isi(24)}"`],
        ["kunci-google", "kredensial", "src/maps.ts", `const g = "${"AI" + "za" + isi(35)}";`],
        ["kunci-resend", "kredensial", "src/mail.ts", `const r = "${"re" + "_" + isi(10) + "_" + isi(20)}";`],
        ["token-npm", "kredensial", ".npmrc", `//registry.npmjs.org/:_authToken=${"np" + "m_" + isi(36)}`],
        ["jwt-layanan", "kredensial", "src/admin.ts", `const svc = "${jwt({ iss: "supabase", ref: "abcdefghijklmnopqrst", role: "service_role" })}";`],
        ["url-db-berkata-sandi", "kredensial", "scripts/db.sh", `psql "${"postgres" + "ql://postgres.abc:" + isi(20) + at + "aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"}"`],
        ["rahasia-ditugaskan", "kredensial", ".env.production", `RESEND_API_KEY=${isi(28)}`],
        ["kunci-supabase", "kredensial", "selftest/fixtures/leak.ts", `x = "${"sb_" + "secret_" + isi(32)}"`],
        ["surel-pribadi", "data-pribadi", "docs/notes.md", `contact ${"siti.rahma" + at + "gmail.com"} for access`],
        ["nik", "data-pribadi", "docs/murid.csv", `nama,nik\nAni,${"3174" + "05" + "12" + "08" + "15" + "0001"}`],
        ["kunci-jawaban", "kunci-jawaban", "audit/fixtures/sd5-matematika-bab9.paket.json", `{${tanda()}}`],
        ["kunci-jawaban", "kunci-jawaban", "content/baru/Bab1.paket.json", `{${tanda()}}`],
        // F-4 (a): keyed items pasted into files that are not packages, wherever they sit (a fixture directory too)
        ["kunci-jawaban-penanda", "kunci-jawaban", "docs/notes/bab3-items.json", `{"items": ${soalBerkunci(3)}}`],
        ["kunci-jawaban-penanda", "kunci-jawaban", "src/lib/contoh-soal.ts", `export const SOAL = ${soalBerkunci(4)};`],
        ["kunci-jawaban-penanda", "kunci-jawaban", "supabase/seed/bab9.sql", `insert into t values ('${soalBerkunci(3)}'::jsonb);`],
        ["kunci-jawaban-penanda", "kunci-jawaban", "selftest/fixtures/bab9.md", "```json\n" + soalBerkunci(3) + "\n```"],
        // F-4 (b): a chapter generator's keyed option tuples
        ["kunci-jawaban-generator", "kunci-jawaban", "docs/onboarding/konten/sd5_matematika_bab10.py",
          ["OPSI = [", `    ("${isi(8)}", ${"Tr" + "ue"}, "${"Ben" + "ar"}. ${isi(20)}", ""),`, `    ("${isi(8)}", False, "${isi(20)}", "K-1"),`, "]"].join("\n")],
        ["kunci-jawaban-generator", "kunci-jawaban", "docs/onboarding/konten/sma11_geografi_bab9.py",
          `SOAL_1 = [\n    ("${isi(8)}", ${"Tr" + "ue"}, "${"Tep" + "at"}. ${isi(20)}", "", "k_1"),\n]`],
        ["kunci-jawaban-generator", "kunci-jawaban", "scripts/bab10.mjs", `const o = ["${isi(6)}", ${"tr" + "ue"}, '${"Ben" + "ar"}: ${isi(12)}'];`],
        // F-4 (c): a misconception CSV with its distractor map
        ["kunci-jawaban-miskonsepsi", "kunci-jawaban", "docs/onboarding/konten/SD5-Matematika-Bab10-miskonsepsi.csv",
          `${["co" + "de", "label", "description", "remediation", "ques" + "tions"].join(",")}\nK-1,${isi(6)},${isi(10)},${isi(10)},S1:C;S2:A`],
        ["kunci-jawaban-miskonsepsi", "kunci-jawaban", "data/m.csv", `\uFEFF"${"co" + "de"}";"${"ques" + "tions"}"\nK-2;S3:B`],
      ];
      for (const [aturan, kelas, path, teks] of merah) {
        const r = nilai(path, teks);
        const kena = r.ditolak.find((t) => t.aturan === aturan);
        c.expect(kena && kena.kelas === kelas, `planted ${aturan} in ${path} was not refused (${JSON.stringify(r.ditolak.map((t) => t.aturan))})`);
        c.expect(r.ditolak.every((t) => /^[0-9a-f]{12}$/.test(t.sidik) && !teks.includes(t.sidik) && !Object.values(t).some((v) => typeof v === "string" && v.length > 16 && teks.includes(v) && v !== path)),
          `a finding for ${aturan} carries more than a fingerprint`);
      }

      const hijau: [string, string, string][] = [
        ["the local stack's demo key", "supabase/config.ts", `const k = "${jwt({ iss: "supabase-demo", role: "service_role", exp: 1983812996 })}";`],
        ["a synthetic address", "src/x.ts", `const e = "${"guru" + at + "synthetic.pintar.test"}";`],
        ["a reserved domain", "docs/a.md", `${"someone" + at + "example.com"} and ${"x" + at + "masuk.pintar.invalid"}`],
        ["an organisational role address", "src/lib/hle.ts", `${"noreply" + at + "pintarselalu.com"} ${"info" + at + "pintarselalu.com"}`],
        ["a stand-in token", "selftest/x.test.ts", `const T = "${"sbp_" + "standin_token_never_printed_0123456789"}";`],
        ["a localhost database URL", ".github/workflows/x.yml", `DB: ${"postgres" + "ql://postgres:postgres" + at + "127.0.0.1:54322/postgres"}`],
        ["a secret read from the environment", ".env.example", `RESEND_API_KEY=\${RESEND_API_KEY}`],
        ["a workflow secret reference", ".github/workflows/y.yml", "TOKEN: ${{ secrets.VERCEL_TOKEN }}"],
        ["a declared synthetic package", "audit/fixtures/pd-uji-bab1.paket.json", `{${tanda()}}`],
        // F-4: code that merely mentions is_correct, as src/, selftest/ and supabase/ do (at most twice per file)
        ["code that reads the field", "src/lib/nilai.ts", `const benar = opsi.filter((o) => o.is_correct);\nconst x = { ${tanda()} };`],
        ["a test that plants one option", "selftest/x.test.ts", `const o = JSON.parse('{${tanda()}, "label": "A"}');\nexpect(o.is_correct).toBe(true);\nconst p = '{${tanda()}}';`],
        ["a migration that names the column", "supabase/migrations/2026_x.sql", `select count(*) from item_options where is_correct; -- {${tanda()}}`],
        ["a declared synthetic corpus file", "docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.paket.json", `{"items": ${soalBerkunci(5)}}`],
        ["a CSV with a code column and no question map", "docs/kode.csv", `${"co" + "de"},label,remediation\nK-1,x,y`],
        ["a generator tuple that is not a key", "scripts/x.py", `ROW = ("a", ${"Tr" + "ue"}, "Benarkah ini", "Tepatnya")\nOK = ("b", False, "${"Ben" + "ar"}")`],
        ["a synthetic fixture's example name", "selftest/fixtures/nama.csv", `${"ani.putri" + at + "sekolah.sch.id"}`],
      ];
      for (const [apa, path, teks] of hijau) {
        const r = nilai(path, teks);
        c.expect(r.ditolak.length === 0, `${apa} (${path}) was refused: ${JSON.stringify(r.ditolak.map((t) => t.aturan))}`);
      }
      return c.verdict(`${merah.length} planted findings refused by fingerprint, ${hijau.length} public-on-purpose shapes allowed`);
    },
  },
  {
    id: "SEC-G02",
    run: async (ctx) => {
      const c = new Checks();
      const m = await modul(ctx.repoRoot);
      const r = m.pindaiRepo(ctx.repoRoot, "--tree");
      c.expect(r.ditolak.length === 0,
        `the committed tree holds ${r.ditolak.length} finding(s) not allowed: ${r.ditolak.slice(0, 8).map((t) => `${t.kelas} ${t.aturan} ${t.path} [${t.sidik}]`).join("; ")}`);

      const izin = m.muatIzin();
      const terlacak = execFileSync("git", ["ls-files", "*.paket.json", "*.xlsx"], { cwd: ctx.repoRoot, encoding: "utf8" }).split("\n").filter(Boolean);
      const terdaftar = new Set(izin.berkas_kerja_terdaftar.map((f) => f.path));
      const tanpa = terlacak.filter((p) => !terdaftar.has(p));
      c.expect(tanpa.length === 0, `keyed or workbook file(s) not declared in scripts/guard/allowlist.json: ${tanpa.join(", ")}`);
      // F-4: a declaration may name any file that carries keys on purpose (not only a package or workbook)
      const semua = new Set(execFileSync("git", ["ls-files"], { cwd: ctx.repoRoot, encoding: "utf8" }).split("\n").filter(Boolean));
      const hantu = [...terdaftar].filter((p) => !semua.has(p));
      c.expect(hantu.length === 0, `allowlist declares file(s) no longer tracked (remove the entry): ${hantu.join(", ")}`);
      c.expect(izin.berkas_kerja_terdaftar.every((f) => ["nyata-F4", "sintetis", "tanpa-kunci"].includes(f.jenis) && (f.alasan ?? "").length > 10),
        "every declared file names its kind (nyata-F4, sintetis, tanpa-kunci) and a reason");
      c.expect(izin.nilai_sidik.every((n) => /^[0-9a-f]{12}$/.test(n.sidik) && (n.alasan ?? "").length > 20), "every registered fingerprint carries a reason");

      const hook = join(ctx.repoRoot, ".githooks/pre-commit");
      c.expect(existsSync(hook) && (statSync(hook).mode & 0o111) !== 0 && /sensitive-scan\.mjs --staged/.test(readFileSync(hook, "utf8")),
        ".githooks/pre-commit is missing, not executable, or does not scan the staged files");
      const pkg = JSON.parse(readFileSync(join(ctx.repoRoot, "package.json"), "utf8"));
      c.expect(/core\.hooksPath \.githooks/.test(pkg.scripts?.prepare ?? ""), "npm's prepare script does not install the hook (core.hooksPath .githooks)");
      // F-4 (D-145(b)): the real keyed files left the tree; none may be declared, or found, again
      c.expect(r.f4.length === 0 && izin.berkas_kerja_terdaftar.every((f) => f.jenis !== "nyata-F4"),
        `real answer-key file(s) are in the tree again (F-4): ${r.f4.join(", ")}`);
      return c.verdict(`tree clean; ${terlacak.length} keyed/workbook files all declared, none of them real (F-4); hook installed by prepare`);
    },
  },
];
