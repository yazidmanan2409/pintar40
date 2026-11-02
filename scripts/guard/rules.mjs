// Batch 0 (B0-C): the rules of scripts/guard/sensitive-scan.mjs. Each rule has an id, a global pattern (the value
// to fingerprint is the named group `v` when present), optional path filters, and an optional `saring` (filter)
// that returns false for a match that is not sensitive (a placeholder, a demo key, a synthetic domain).
//
// Classes:
//   kredensial      a working secret: refuse, never allow by path; rotate if it was ever pushed
//   data-pribadi    real-person data: an address or identity number of a real person
//   kunci-jawaban   restricted assessment-answer material (answer keys) outside the synthetic fixtures
//
// A rule may also say `minimal` (it fires only when the file holds at least that many matches, as ONE finding for the
// file, fingerprinted by its path: data, not code that merely names the field) and `barisPertama` (only the first
// line is read: a CSV header).

/** Domains that are synthetic, reserved or organisational role addresses (not a person). */
const DOMAIN_SINTETIS = /(\.test|\.invalid|\.example|\.local|\.internal|example\.(com|org|net|co)|localhost)$/i;
const SEKOLAH_CONTOH = /^((sekolah|school|sman1contoh|sd-negeri-1\.jakarta|b|c)\.(sch\.)?id|[a-z]\.(co|id|com))$/i;
const ALAMAT_PERAN = /^(info|noreply|no-reply|security|support|admin|uji|lain|goldenschool(\+[a-z0-9%._-]*)?|-?admin|-?guru|admin_gt|name|nama|guru|a|b)$/i;

const placeholder = (v) => /^(\$\{?|<|\{\{|xxx|\*{3}|your[-_]|changeme|example|placeholder|dummy|test|fake|redacted|process\.env|env\(|secrets\.)/i.test(v) || /^(.)\1+$/.test(v)
  || /(synthetic|sintetis|audit-|selftest|stand-?in|never[-_](printed|read)|sink-accepts|fixture|contoh|0123456789)/i.test(v);

/** Decode a JWT payload without verifying it. */
function payloadJwt(t) {
  try { return JSON.parse(Buffer.from(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); } catch { return null; }
}

/** The 16-digit NIK has a province code 11–94 and a plausible birth date (day 01–31 or 41–71, month 01–12). */
function nikMasukAkal(v) {
  const prov = Number(v.slice(0, 2)), hari = Number(v.slice(6, 8)), bulan = Number(v.slice(8, 10));
  return prov >= 11 && prov <= 94 && ((hari >= 1 && hari <= 31) || (hari >= 41 && hari <= 71)) && bulan >= 1 && bulan <= 12;
}

const TEKS_KONFIG = /(^|\/)(\.env[^/]*|[^/]*\.(env|ya?ml|toml|ini|cfg|conf|json|properties|sh|ps1|tf|tfvars))$/i;

export const aturan = [
  { id: "kunci-privat", pola: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g },
  { id: "token-github", pola: /\b(?<v>(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g },
  { id: "kunci-aws", pola: /\b(?<v>(?:AKIA|ASIA)[A-Z0-9]{16})\b/g, saring: (v) => !/EXAMPLE$/.test(v) },
  { id: "kunci-supabase", pola: /\b(?<v>sb_secret_[A-Za-z0-9_-]{20,}|sbp_[a-f0-9]{40})\b/g, saring: (v) => !placeholder(v.replace(/^(sb_secret_|sbp_)/, "")) },
  { id: "kunci-stripe", pola: /\b(?<v>(?:sk|rk)_live_[A-Za-z0-9]{20,})\b/g },
  { id: "token-slack", pola: /\b(?<v>xox[abprs]-[A-Za-z0-9-]{10,})\b/g },
  { id: "kunci-google", pola: /\b(?<v>AIza[0-9A-Za-z_-]{35})\b/g },
  { id: "kunci-resend", pola: /\b(?<v>re_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,})\b/g },
  { id: "token-npm", pola: /\b(?<v>npm_[A-Za-z0-9]{36})\b/g },
  {
    // A JWT is a secret when it grants service_role, or when it was issued by a real project. The Supabase
    // local stack's well-known demo keys (iss "supabase-demo") are public by design.
    id: "jwt-layanan",
    pola: /\b(?<v>eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    saring: (v) => { const p = payloadJwt(v); if (!p) return false; if (p.iss === "supabase-demo") return false; return p.role === "service_role" || (typeof p.iss === "string" && /supabase\.co/.test(p.iss) && p.role !== "anon"); },
  },
  {
    id: "url-db-berkata-sandi",
    pola: /\bpostgres(?:ql)?:\/\/[^:\s/@'"`]+:(?<v>[^@\s'"`]+)@(?<h>[^:/\s'"`?]+)/g,
    saring: (v, m) => v.length >= 4 && !placeholder(v) && !/^(postgres|password|pass|secret|\[.*\]|\$.*)$/i.test(v) && !/^(127\.0\.0\.1|localhost|db|postgres|host\.docker\.internal|.*\.test|.*\.invalid|.*\.example|.*stand-in.*|\$.*|<.*)$/i.test(m.groups.h),
  },
  {
    // password / secret / token / api key assigned to a literal, in env-like and config files only
    id: "rahasia-ditugaskan",
    jalur: TEKS_KONFIG,
    bukanJalur: /(^|\/)(package(-lock)?\.json|\.env\.example|tsconfig[^/]*\.json)$/,
    pola: /\b[A-Z0-9_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|SERVICE_ROLE_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*[:=]\s*["']?(?<v>[^\s"'#$]{12,})/g,
    saring: (v) => !placeholder(v) && !/^(true|false|null|none|required|optional)$/i.test(v) && !/^(\$\{\{|[-/.~])/.test(v),
  },
  {
    id: "surel-pribadi",
    pola: /(?<![:/A-Za-z0-9._%+-])(?<v>(?<lokal>[A-Za-z0-9._%+-]+)@(?<dom>[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}))\b/g,
    bukanJalur: /(^|\/)(package-lock\.json|LICENSE[^/]*)$/,
    saring: (v, m) => {
      const dom = m.groups.dom.toLowerCase(), lokal = m.groups.lokal.toLowerCase();
      if (DOMAIN_SINTETIS.test(dom) || SEKOLAH_CONTOH.test(dom)) return false;
      if (/^(pintarselalu\.com|anthropic\.com|users\.noreply\.github\.com|email\.com)$/.test(dom) && (ALAMAT_PERAN.test(lokal) || dom !== "pintarselalu.com")) return false;
      if (/\.(png|jpe?g|svg|webp|gif|js|css)$/.test(dom)) return false; // asset@2x.png and the like
      return true;
    },
  },
  { id: "nik", pola: /(?<![0-9A-Za-z])(?<v>[1-9][0-9]{15})(?![0-9A-Za-z])/g, bukanJalur: /(^|\/)(package-lock\.json|[^/]*\.(svg|lock))$/, saring: nikMasukAkal },
  // Answer keys: every .paket.json and .xlsx is flagged by its path in sensitive-scan.mjs; this rule catches a keyed
  // package by its content: a package JSON with a correct-answer marker.
  { id: "kunci-jawaban", pola: /"is_correct"\s*:\s*true/g, jalur: /\.paket\.json$/, saring: () => true },
  // F-4 (D-145(b)): keyed CONTENT in any text file, whatever its name. Each is refused unless the file is declared in
  // berkas_kerja_terdaftar (a synthetic fixture that carries keys on purpose).
  //  (a) a data-shaped run of correct-answer markers: three or more `"is_correct": true` in one file (a package or an
  //      item list pasted into JSON, code, SQL, CSV or Markdown). Code that reads, writes or tests the field names it
  //      once or twice per file (src/, selftest/, supabase/: at most 1 per file at F-4) and fires nothing;
  {
    id: "kunci-jawaban-penanda",
    pola: /"is_correct"\s*:\s*true/g,
    jalur: /\.(json|ts|tsx|mts|cts|js|mjs|cjs|py|sql|csv|md)$/i,
    bukanJalur: /\.paket\.json$/,
    minimal: 3,
  },
  //  (b) a content generator's keyed option tuple: an option, then True (Python) or true (JS), then a reason
  //      opening «Benar» or «Tepat», which is how the removed chapter generators held every item's key;
  { id: "kunci-jawaban-generator", pola: /,\s*(?:True|true)\s*,\s*["'](?:Benar|Tepat)\b/g, jalur: /\.(py|ts|tsx|mts|cts|js|mjs|cjs|json|md|txt)$/i },
  //  (c) a misconception CSV that maps each question's distractors: a header with both a `code` and a `questions`
  //      column (the questions column lists every wrong letter per item, which gives the key by elimination).
  {
    id: "kunci-jawaban-miskonsepsi",
    pola: /^\uFEFF?(?=(?:[^\n]*[,;\t])?\s*"?code"?\s*(?:[,;\t]|$))(?=(?:[^\n]*[,;\t])?\s*"?questions"?\s*(?:[,;\t]|$))[^\n]*/gi,
    jalur: /\.(csv|tsv)$/i,
    barisPertama: true,
  },
];

export const kelas = {
  "kunci-privat": "kredensial",
  "token-github": "kredensial",
  "kunci-aws": "kredensial",
  "kunci-supabase": "kredensial",
  "kunci-stripe": "kredensial",
  "token-slack": "kredensial",
  "kunci-google": "kredensial",
  "kunci-resend": "kredensial",
  "token-npm": "kredensial",
  "jwt-layanan": "kredensial",
  "url-db-berkata-sandi": "kredensial",
  "rahasia-ditugaskan": "kredensial",
  "surel-pribadi": "data-pribadi",
  "nik": "data-pribadi",
  "kunci-jawaban": "kunci-jawaban",
  "kunci-jawaban-penanda": "kunci-jawaban",
  "kunci-jawaban-generator": "kunci-jawaban",
  "kunci-jawaban-miskonsepsi": "kunci-jawaban",
};
