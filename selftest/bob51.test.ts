/**
 * BOB-51 (D-057, REL-08): «KIRIM EMAIL UJI», the platform admin's delivery
 * proof as a click. M6 and the C-11 production send need no typed commands.
 *
 *   BOB51-A01  through the running app: the platform admin opens the page from
 *              Konfigurasi and sends one proof to the sink: it arrives, the
 *              answer reads «terkirim» with its reference and the send log says
 *              SENT; a second send in the same minute reads the address limit
 *              with its reference; a school administrator is shown no link, is
 *              refused the page, and the route refuses them (403) with nothing
 *              sent
 *   BOB51-S01  the reader and the source: every answer the route can give has
 *              its own plain sentence in both languages; a setting is shown by
 *              name only, and only a name the sending module reads; the form
 *              posts to /api/email/uji alone; the page asks is_system_admin and
 *              Konfigurasi links it only for the platform admin
 */
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";
import { Checks, visibleText, type Context, type SelfTest } from "./lib";
import { INTERNAL_WORDS, t, TANPA_SALINAN, type HleEvent } from "../src/lib/hle";
import { bacaHasilUji } from "../src/components/email-uji/hasil";
import { pilihKonteksCookie } from "./konteks-uji";

const SINK_API = "http://127.0.0.1:54324/api/v1";
const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const HALAMAN = "/konfigurasi/email-uji";

/** Synthetic personas (supabase/seed/synthetic.sql). Passwords are seed constants, not secrets. */
const ADMIN_PLATFORM = { email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" };
const ADMIN_SEKOLAH = { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };

function psql(sql: string): string {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}

async function masuk(ctx: Context, orang: { email: string; password: string }): Promise<string> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await client.auth.signInWithPassword(orang);
  if (error) throw new Error(`sign-in failed for ${orang.email}: ${error.message}`);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

async function sinkCari(alamat: string): Promise<Array<{ ID: string }>> {
  const r = await fetch(`${SINK_API}/search?query=${encodeURIComponent(`to:"${alamat}"`)}`);
  return ((await r.json()) as { messages?: Array<{ ID: string }> }).messages ?? [];
}
async function sinkTunggu(alamat: string, n: number, ms = 8000): Promise<Array<{ ID: string }>> {
  const batas = Date.now() + ms;
  let p: Array<{ ID: string }> = [];
  while (Date.now() < batas) {
    p = await sinkCari(alamat);
    if (p.length >= n) return p;
    await new Promise((r) => setTimeout(r, 250));
  }
  return p;
}

const kalimat = (k: HleEvent) => t(k, "staff", { locale: "id" });

export const bob51AppTests: SelfTest[] = [
  {
    id: "BOB51-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      // The journey runs at the origin the route itself is addressed by. `next start` builds a route's request
      // URL from its own hostname (localhost), where Vercel trusts the Host header (trustHostHeader,
      // next/dist/server/config.js), and the route (unchanged) accepts a press only from that origin: a browser
      // sends the origin it was served the page from, so the page is opened there too.
      const app = new URL(ctx.appUrl!);
      if (app.hostname === "127.0.0.1") app.hostname = "localhost";
      const asal = app.origin;
      const { NAMA_PENGATURAN_EMAIL: NAMA } = await import("../src/app/api/_email/pengaturan");
      const ke = `bob51-a01-${randomBytes(5).toString("hex")}@local.invalid`;
      const hash = createHash("sha256").update(ke, "utf8").digest("hex");
      try {
        const sys = await masuk(ctx, ADMIN_PLATFORM);
        const sekolah = await masuk(ctx, ADMIN_SEKOLAH);
        // L3 (D-132 C7): the page is «Seluruh platform»'s, which the platform admin chooses on the chooser
        await pilihKonteksCookie(asal, sys, "MENGELOLA:PLATFORM");

        // the way in: Konfigurasi links the page for the platform admin only
        const konf = await (await fetch(`${asal}/konfigurasi`, { headers: { cookie: sys } })).text();
        c.expect(konf.includes(`href="${HALAMAN}"`), "Konfigurasi offers the platform admin no link to «Kirim email uji»");
        const konfSekolah = await (await fetch(`${asal}/konfigurasi`, { headers: { cookie: sekolah } })).text();
        c.expect(!konfSekolah.includes(`href="${HALAMAN}"`), "Konfigurasi links «Kirim email uji» for a school administrator");

        // the page itself
        const hal = await fetch(`${asal}${HALAMAN}`, { headers: { cookie: sys }, redirect: "manual" });
        const teks = visibleText(await hal.text());
        c.expect(hal.status === 200 && teks.includes(kalimat("emailuji.judul")) && teks.includes(kalimat("emailuji.ke"))
          && !teks.includes(kalimat("emailuji.ditolak")), `the platform admin's page answered ${hal.status} without the form`);
        for (const w of INTERNAL_WORDS) c.expect(!teks.includes(w), `the platform admin's page shows the internal word «${w}»`);
        const halSekolah = visibleText(await (await fetch(`${asal}${HALAMAN}`, { headers: { cookie: sekolah } })).text());
        c.expect(halSekolah.includes(kalimat("emailuji.ditolak")) && !halSekolah.includes(kalimat("emailuji.ke")),
          "a school administrator was shown the form rather than the refusal");

        // the press, as the form makes it: one POST to the route, read by the page's own reader
        const tekan = async (cookie: string) => {
          const r = await fetch(`${asal}/api/email/uji`, {
            method: "POST", headers: { cookie, origin: asal, "content-type": "application/json" }, body: JSON.stringify({ ke }),
          });
          const isi = await r.json().catch(() => null);
          return { status: r.status, isi, hasil: bacaHasilUji(r.status, isi, NAMA) };
        };
        const satu = await tekan(sys);
        c.expect(satu.hasil.nada === "ok" && satu.hasil.kunci === "emailuji.terkirim" && !!satu.hasil.rujukan,
          `the first send read ${JSON.stringify(satu.hasil)} (the route answered ${satu.status} ${JSON.stringify(satu.isi)})`);
        const tiba = await sinkTunggu(ke, 1);
        c.expect(tiba.length === 1, `${tiba.length} message(s) arrived in the sink for the proof`);
        const log = psql(`select coalesce(string_agg(outcome::text, ',' order by requested_at), '') from public.email_send_log where recipient_hash = '${hash}'`);
        c.expect(log === "SENT", `the send log reads «${log}» after one proof`);

        const dua = await tekan(sys);
        c.expect(dua.status === 502 && dua.hasil.kunci === "emailuji.alasan.batas_alamat" && !!dua.hasil.rujukan,
          `a second send within the minute read ${JSON.stringify(dua.hasil)} (the route answered ${dua.status} ${JSON.stringify(dua.isi)})`);

        const tiga = await tekan(sekolah);
        c.expect(tiga.status === 403 && tiga.hasil.kunci === "emailuji.galat.ditolak",
          `a school administrator's press read ${JSON.stringify(tiga.hasil)} (${tiga.status})`);
        c.expect((await sinkCari(ke)).length === 1, "more than the one proof arrived");
        const logAkhir = psql(`select count(*) from public.email_send_log where recipient_hash = '${hash}'`);
        c.expect(logAkhir === "2", `the send log holds ${logAkhir} row(s) for the address, not the proof and the limit's refusal`);
      } finally {
        const ids = (await sinkCari(ke).catch(() => [])).map((m) => m.ID);
        if (ids.length) {
          await fetch(`${SINK_API}/messages`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ IDs: ids }) }).catch(() => undefined);
        }
        try { psql(`delete from public.email_send_log where recipient_hash = '${hash}'`); } catch { /* the verdict already says */ }
      }
      return c.verdict("Konfigurasi links «Kirim email uji» for the platform admin and not for a school administrator; the page shows the platform "
        + "admin the form and a school administrator the refusal; one press sent the proof into the sink and read «terkirim» with its "
        + "reference, logged SENT; a second press within the minute read the address limit with its reference; a school administrator's "
        + "press was refused (403) and nothing more was sent");
    },
  },
];

export const bob51Tests: SelfTest[] = [
  {
    id: "BOB51-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { NAMA_PENGATURAN_EMAIL: NAMA } = await import("../src/app/api/_email/pengaturan");
      const baca = (f: string) => tanpaKomentar(readFileSync(join(repoRoot, f), "utf8"));
      const berkas = ["src/components/email-uji/hasil.ts", "src/components/email-uji/FormEmailUji.tsx", "src/app/konfigurasi/email-uji/page.tsx"];
      const hilang = berkas.filter((f) => !existsSync(join(repoRoot, f)));
      if (!c.expect(hilang.length === 0, `there is no «Kirim email uji»: ${hilang.join(", ")} missing`)) return c.verdict("");
      const rute = baca("src/app/api/email/uji/route.ts");
      const kirim = baca("src/app/api/_email/kirim.ts");
      const pengaturan = baca("src/app/api/_email/pengaturan.ts");
      const ada = (k: HleEvent) => ["id", "en"].every((l) => { const v = t(k, "staff", { locale: l as "id" | "en" }); return v !== TANPA_SALINAN && v.trim() !== ""; });

      // every answer the route can give, read out of its source and the sending module's
      const galatRute = [...rute.matchAll(/galat: "([A-Z_]+)"/g)].map((m) => m[1]);
      const alasan = [...(/alasan: ([^;]+);/.exec(kirim)?.[1] ?? "").matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
      const kodePengaturan = [...(/export type KodeGalatPengaturan = ([^;]+);/.exec(pengaturan)?.[1] ?? "").matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
      c.expect(galatRute.length >= 5 && alasan.length === 4 && kodePengaturan.length === 3,
        `the route's answers were not all found (${galatRute.length} codes, ${alasan.length} reasons, ${kodePengaturan.length} setting codes)`);
      const rujukan = "3f2b8c1e-6a4d-4f7b-9c2e-1d5a7b9e0f12";
      const kunci = new Set<HleEvent>();
      const terkirim = bacaHasilUji(200, { terkirim: true, rujukan }, NAMA);
      c.expect(terkirim.nada === "ok" && terkirim.kunci === "emailuji.terkirim" && terkirim.rujukan === rujukan, `a sent proof reads ${JSON.stringify(terkirim)}`);
      kunci.add(terkirim.kunci);
      for (const a of alasan) {
        const h = bacaHasilUji(502, { terkirim: false, alasan: a, rujukan }, NAMA);
        c.expect(h.nada === "gagal" && h.kunci.startsWith("emailuji.alasan.") && h.rujukan === rujukan, `reason ${a} reads ${JSON.stringify(h)}`);
        kunci.add(h.kunci);
      }
      for (const g of kodePengaturan) {
        for (const nama of NAMA) {
          const h = bacaHasilUji(503, { terkirim: false, galat: g, variabel: nama }, NAMA);
          c.expect(h.kunci.startsWith("emailuji.pengaturan.") && h.kunci !== "emailuji.pengaturan.umum" && h.variabel === nama,
            `setting code ${g} for ${nama} reads ${JSON.stringify(h)}`);
          kunci.add(h.kunci);
        }
        // a value in the name's place is never shown
        for (const nilai of ["smtp.hostinger.com", "rahasia-123", "465", ""]) {
          const h = bacaHasilUji(503, { terkirim: false, galat: g, variabel: nilai }, NAMA);
          c.expect(h.variabel === undefined && h.kunci === "emailuji.pengaturan.umum", `setting code ${g} with «${nilai}» in the name's place reads ${JSON.stringify(h)}`);
          kunci.add(h.kunci);
        }
      }
      const perKode = new Map<string, HleEvent>();
      for (const g of galatRute.filter((x) => x !== "GAGAL")) {
        const h = bacaHasilUji(400, { terkirim: false, galat: g }, NAMA);
        c.expect(h.kunci !== "emailuji.galat.umum", `the route's code ${g} has no sentence of its own`);
        perKode.set(g, h.kunci);
        kunci.add(h.kunci);
      }
      // a refused origin is not told as «only the platform admin»: the two are different faults
      c.expect(new Set(perKode.values()).size === perKode.size, `two of the route's codes share one sentence (${JSON.stringify(Object.fromEntries(perKode))})`);
      kunci.add(bacaHasilUji(500, { terkirim: false, galat: "GAGAL" }, NAMA).kunci);
      const tanpa = bacaHasilUji(null, null, NAMA);
      c.expect(tanpa.kunci === "emailuji.galat.jaringan", `no answer reads ${JSON.stringify(tanpa)}`);
      kunci.add(tanpa.kunci);
      c.expect(bacaHasilUji(200, { terkirim: true, rujukan: "<script>" }, NAMA).rujukan === undefined, "a reference that is not a send-log id is shown");
      for (const k of kunci) c.expect(ada(k), `${k} has no words in both languages`);

      // the names a setting may show are exactly what the sending module reads (outside its own list)
      const tanpaDaftar = pengaturan.replace(/export const NAMA_PENGATURAN_EMAIL = \[[^\]]*\]/, "");
      const dibaca = new Set([...tanpaDaftar.matchAll(/\b(PINTAR_SMTP_[A-Z]+|NEXT_PUBLIC_APP_URL)\b/g)].map((m) => m[1]));
      c.expect([...dibaca].sort().join(",") === [...NAMA].sort().join(","),
        `the names the page may show (${[...NAMA].join(", ")}) are not what the sending module reads (${[...dibaca].join(", ")})`);
      c.expect(/namaPengaturan=\{NAMA_PENGATURAN_EMAIL\}/.test(baca("src/app/konfigurasi/email-uji/page.tsx")),
        "the page does not hand the form the sending module's own list of names");

      // the form, the page and the way in
      const form = baca("src/components/email-uji/FormEmailUji.tsx");
      c.expect((form.match(/fetch\(/g) ?? []).length === 1 && /fetch\("\/api\/email\/uji"/.test(form) && /JSON\.stringify\(\{ ke: alamat \}\)/.test(form),
        "the form does not make exactly one request, to /api/email/uji, with the inbox alone");
      c.expect(/bacaHasilUji\(status, jawaban, namaPengaturan\)/.test(form) && !/isi\.|jawaban\.(galat|alasan|variabel|detail)/.test(form),
        "the form reads the answer other than through bacaHasilUji");
      const halaman = baca("src/app/konfigurasi/email-uji/page.tsx");
      c.expect(/rpc\("is_system_admin"\)/.test(halaman) && /if \(sistem !== true\) \{[\s\S]*?HalamanPenolakan/.test(halaman),
        "the page does not ask is_system_admin and refuse everyone else");
      const konf = baca("src/app/konfigurasi/page.tsx");
      // L3 (D-132 C7): the link is «Seluruh platform»'s (platformIni: Admin platform in that context; a persona as before)
      // (D-138 step 3: a place in the staff navigation is an ItemNav, a Link with its icon)
      c.expect(/\{platformIni \? <(?:Link|ItemNav) href="\/konfigurasi\/email-uji"/.test(konf), "Konfigurasi does not link the page for the platform admin alone");
      return c.verdict(`every answer the route can give (${galatRute.length} codes, ${alasan.length} reasons, ${kodePengaturan.length} setting codes, a sent proof, `
        + `no answer) reads as its own sentence, in both languages (${kunci.size} sentences); a setting is shown by name only, one of the five the `
        + "sending module reads, and a value in its place is never shown; a reference is shown only as a send-log id; the form makes one "
        + "request, to /api/email/uji, with the inbox alone, and reads it only through bacaHasilUji; the page asks is_system_admin and refuses "
        + "anyone else; Konfigurasi links it for the platform admin alone");
    },
  },
];
