/**
 * BOB-12 (identity Gate 1, D-058) -- A SCHOOL'S MORNING SIGN-IN.
 *
 *   BOB12-K01  the card sign-in route (POST /masuk/kartu) answers every case
 *              with its contract code, asks the card's cooldown before Auth,
 *              never tells a card that exists from one that does not, and is
 *              the only way a card signs in (the server action is gone).
 *   BOB12-K02  Auth sees the student's address, and only Auth: the real
 *              Supabase client, driven through the forwarding fetch with a
 *              recording fetch, sends the secret key and `sb-forwarded-for` on
 *              the password sign-in, the refresh and the code check, and on no
 *              data request, lookalike path, other method or other grant; a
 *              forged address header is never believed.
 *
 * The cooldown's own rules and its race are the database's (F15-*).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createServerClient } from "@supabase/ssr";
import { Checks, type SelfTest } from "./lib";

type Mod = Record<string, unknown>;

async function muat(path: string): Promise<Mod | null> {
  try {
    return (await import(path)) as Mod;
  } catch {
    return null;
  }
}

/** Run `f` with these environment values, restoring what was there. */
async function denganEnv<T>(nilai: Record<string, string | undefined>, f: () => Promise<T>): Promise<T> {
  const lama: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(nilai)) {
    lama[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await f();
  } finally {
    for (const [k, v] of Object.entries(lama)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function tanpaKomentar(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const PEPPER = { CARD_PEPPER: process.env.CARD_PEPPER ?? "selftest-card-pepper-bob12-32-characters-long" };

export const bob12Tests: SelfTest[] = [
  {
    id: "BOB12-K01",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (f: string) => (existsSync(join(ctx.repoRoot, f)) ? tanpaKomentar(readFileSync(join(ctx.repoRoot, f), "utf8")) : "");

      // ---- the wiring, read from the source
      const aksi = baca("src/app/masuk/actions.ts");
      c.expect(!/signInWithCard|signInWithPassword/.test(aksi),
        "the server action signInWithCard still signs a card in: it is a public endpoint and walks around the card's cooldown");
      const rute = baca("src/app/api/masuk/kartu/route.ts");
      c.expect(rute !== "", "there is no card sign-in route: src/app/api/masuk/kartu/route.ts does not exist");
      const konfig = baca("next.config.ts");
      c.expect(/source:\s*["']\/masuk\/kartu["'][^}]*destination:\s*["']\/api\/masuk\/kartu["']/.test(konfig),
        "POST /masuk/kartu does not reach the route: next.config.ts does not rewrite it to /api/masuk/kartu");
      c.expect(/["']\/masuk\/kartu["']/.test(baca("src/proxy.ts").match(/PUBLIC_PATHS\s*=\s*new Set\(\[[^\]]*\]/)?.[0] ?? ""),
        "the proxy no longer lists /masuk/kartu as public, so a signed-out card could not reach it");
      c.expect(/masukDenganKartu\(/.test(rute) && /rpc\(\s*["']card_signin_attempt["']/.test(rute)
          && /rpc\(\s*["']card_signin_settle["']/.test(rute) && /supabaseService\(\)/.test(rute),
        "the route does not ask and settle the card's cooldown (card_signin_attempt, card_signin_settle, service role)");
      c.expect(/supabaseServer\(\{\s*fetch:\s*fetchBerpenerus\(alamatKlien\(request\.headers\)/.test(rute) && /signInWithPassword\(/.test(rute),
        "the route's sign-in does not go through the forwarding fetch with the address Vercel saw");
      c.expect(/status:\s*303[^}]*location:\s*["']\/masuk["']/.test(rute), "GET /masuk/kartu does not send the browser to /masuk (303)");
      c.expect(/const origin = asalSendiri\(request\.headers,/.test(rute) && /masukDenganKartu\(\s*\{\s*origin,/.test(rute),
        "the route does not decide same-origin from the request's own headers");
      // approval (A): one service-role client per request, for the cooldown's two calls only
      const diPOST = rute.slice(rute.indexOf("export async function POST"));
      const layananDipakai = [...rute.matchAll(/\blayanan\.([a-zA-Z]+)\(\s*["']?([a-z_]*)/g)].map((m) => `${m[1]}:${m[2]}`);
      c.expect((rute.match(/supabaseService\(\)/g) ?? []).length === 1 && /const layanan = supabaseService\(\);/.test(diPOST),
        "the service-role client is not made once, inside the request's own handler");
      c.expect(JSON.stringify(layananDipakai.sort()) === JSON.stringify(["rpc:card_signin_attempt", "rpc:card_signin_settle"]),
        `the service-role client is used for more than the cooldown's record and settle: ${layananDipakai.join(", ")}`);
      c.expect(!/supabase\/service|supabaseService/.test(baca("src/lib/kartu-masuk.ts")), "the decision module reaches the service-role client");
      c.expect(/AbortSignal\.timeout\(BATAS_AUTH_MS\)/.test(rute) && /fetchBerpenerus\(alamatKlien\(request\.headers\), rekam\)/.test(rute),
        "Auth's answer is not bounded by a timeout, so a hung Auth hangs the student's sign-in");
      // no other server action signs anyone in with a password
      const semua: string[] = [];
      const jalan = (d: string) => {
        for (const f of readdirSync(d, { withFileTypes: true })) {
          const p = join(d, f.name);
          if (f.isDirectory()) jalan(p);
          else if (/\.(ts|tsx)$/.test(f.name)) semua.push(p);
        }
      };
      jalan(join(ctx.repoRoot, "src"));
      const aksiLain = semua.filter((f) => /^\s*["']use server["']/m.test(readFileSync(f, "utf8"))
        && /signInWithPassword\(/.test(tanpaKomentar(readFileSync(f, "utf8"))));
      c.expect(aksiLain.length === 0, `a server action signs in with a password: ${aksiLain.map((f) => f.slice(ctx.repoRoot.length + 1)).join(", ")}`);

      // ---- the decisions, driven with every outside call recorded
      const inti = await muat("../src/lib/kartu-masuk");
      const kartuMod = await muat("../src/lib/card");
      if (!c.expect(inti !== null && typeof inti.masukDenganKartu === "function",
        "there is no card sign-in decision: src/lib/kartu-masuk.ts has no masukDenganKartu")) {
        return c.verdict("");
      }
      const masuk = inti!.masukDenganKartu as (m: object, a: object) => Promise<{ status: number; body: Record<string, unknown>; retryAfter?: number }>;
      const asalSendiri = inti!.asalSendiri as (h: Headers, a: string | null) => boolean;

      await denganEnv({ ...PEPPER, CARD_EMAIL_DOMAIN: process.env.CARD_EMAIL_DOMAIN ?? "cards.synthetic.pintar.test" }, async () => {
        const cardEmail = kartuMod!.cardEmail as (n: string) => string;
        const derive = kartuMod!.deriveCardSecret as (n: string, p: string) => string;
        const kunciJeda = kartuMod!.kunciJedaKartu as ((n: string) => string) | undefined;
        c.expect(typeof kunciJeda === "function", "src/lib/card.ts has no kunciJedaKartu: the cooldown has no key");

        type Catatan = { catat: string[]; selesai: string[]; masuk: { email: string; sandi: string }[]; log: string[] };
        const coba = async (masukan: object, perilaku: { tunggu?: number | "gagal"; auth?: object | null; jeda?: string | null; lempar?: boolean }) => {
          const cat: Catatan = { catat: [], selesai: [], masuk: [], log: [] };
          const h = await masuk({ origin: true, kartu: "7001", pin: "2468", lanjut: "/belajar", ...masukan }, {
            catat: async (k: string) => {
              cat.catat.push(k);
              if (perilaku.tunggu === "gagal") throw new Error("database unreachable");
              return perilaku.tunggu ?? 0;
            },
            selesaikan: async (k: string, hasil: string) => { cat.selesai.push(`${hasil}:${k}`); },
            masuk: async (email: string, sandi: string) => {
              cat.masuk.push({ email, sandi });
              if (perilaku.lempar) throw new Error("unexpected");
              return { error: perilaku.auth ?? null, jeda: perilaku.jeda ?? null };
            },
            tujuan: async (l: unknown) => (l === "/belajar" ? "/belajar" : "/beranda-peran"),
            // CR-91 (D-145(a)): a learner's card, asked as the new session (selftest/cr91.test.ts drives the refusal)
            bukanStaf: async () => true,
            keluar: async () => {},
            catatGalat: (ref: string, apa: string) => cat.log.push(`${ref} ${apa}`),
          });
          return { h, cat };
        };
        const tidakCocok = { status: 400, code: "invalid_credentials", name: "AuthApiError" };

        // 1. not PINTAR's own page: refused before anything is asked
        const asing = await coba({ origin: false }, {});
        c.expect(asing.h.status === 403 && asing.h.body.code === "CARD_REQUEST_REFUSED" && asing.cat.catat.length + asing.cat.masuk.length === 0,
          `a foreign page's request → ${asing.h.status} ${JSON.stringify(asing.h.body)}, asked ${asing.cat.catat.length + asing.cat.masuk.length} thing(s)`);
        // 2. empty or absurd: the one non-match, nothing asked
        for (const [kartu, pin] of [["", "2468"], ["7001", ""], ["abc", "xyz"], ["7".repeat(40), "2468"], [undefined, undefined]]) {
          const r = await coba({ kartu, pin }, {});
          c.expect(r.h.status === 401 && r.h.body.code === "CARD_NOT_MATCHED" && r.cat.catat.length + r.cat.masuk.length === 0,
            `card ${JSON.stringify(kartu)?.slice(0, 12)} / PIN ${JSON.stringify(pin)} → ${r.h.status} ${JSON.stringify(r.h.body)}, asked ${r.cat.catat.length + r.cat.masuk.length}`);
        }
        // 3. a wrong PIN and a card nobody holds: one answer, both counted, neither taken back
        const salahPin = await coba({}, { auth: tidakCocok });
        const takAda = await coba({ kartu: "1099887766" }, { auth: tidakCocok });
        c.expect(salahPin.h.status === 401 && salahPin.h.body.code === "CARD_NOT_MATCHED",
          `a wrong PIN → ${salahPin.h.status} ${JSON.stringify(salahPin.h.body)}`);
        c.expect(JSON.stringify(salahPin.h) === JSON.stringify(takAda.h),
          `a wrong PIN and a card nobody holds answer differently: ${JSON.stringify(salahPin.h)} / ${JSON.stringify(takAda.h)}`);
        c.expect(salahPin.cat.catat.length === 1 && takAda.cat.catat.length === 1 && salahPin.cat.selesai.length + takAda.cat.selesai.length === 0,
          "a non-match was not counted against its card number, or was taken back");
        for (const e of [{ status: 400, code: "email_not_confirmed" }, { status: 400, code: "user_banned" }, { status: 422, code: "validation_failed" }]) {
          const r = await coba({}, { auth: e });
          c.expect(r.h.status === 401 && r.h.body.code === "CARD_NOT_MATCHED", `a card whose account cannot sign in (${e.code}) → ${r.h.status} ${JSON.stringify(r.h.body)}`);
        }
        // 4. the cooldown is asked first, and a wait keeps Auth out of it
        const jeda = await coba({}, { tunggu: 30 });
        c.expect(jeda.h.status === 429 && jeda.h.body.code === "CARD_COOLDOWN" && jeda.h.body.tunggu === 30 && jeda.h.retryAfter === 30,
          `a card in its cooldown → ${jeda.h.status} ${JSON.stringify(jeda.h.body)} Retry-After ${jeda.h.retryAfter}`);
        c.expect(jeda.cat.masuk.length === 0, "Auth was asked for a card in its cooldown");
        const jedaTakAda = await coba({ kartu: "1099887766" }, { tunggu: 30 });
        c.expect(JSON.stringify(jeda.h) === JSON.stringify(jedaTakAda.h), "a cooldown on a card nobody holds answers differently");
        // 5. Auth's own limit: a wait, never a non-match, and the attempt taken back
        const ramai = await coba({}, { auth: { status: 429, code: "over_request_rate_limit", name: "AuthApiError" }, jeda: "60" });
        c.expect(ramai.h.status === 429 && ramai.h.body.code === "CARD_RATE_LIMITED" && ramai.h.body.tunggu === 60 && ramai.h.retryAfter === 60,
          `Auth's rate limit with a wait → ${ramai.h.status} ${JSON.stringify(ramai.h.body)}`);
        const ramaiTanpa = await coba({}, { auth: { status: 429, code: "over_request_rate_limit" } });
        c.expect(ramaiTanpa.h.status === 429 && ramaiTanpa.h.body.code === "CARD_RATE_LIMITED" && !("tunggu" in ramaiTanpa.h.body) && !ramaiTanpa.h.retryAfter,
          `Auth's rate limit with no wait → ${JSON.stringify(ramaiTanpa.h)}: the route invented a wait`);
        c.expect(ramai.cat.selesai.length === 1 && ramai.cat.selesai[0].startsWith("TIDAK_DINILAI:"),
          `Auth's rate limit judged no PIN but the attempt was ${ramai.cat.selesai.join(",") || "kept"}`);
        // 6. unreachable: the calm failure with a reference, logged without the card or PIN
        for (const [apa, perilaku] of [
          ["Auth unreachable", { auth: { status: 0, name: "AuthRetryableFetchError" } }],
          ["Auth failing", { auth: { status: 503, code: "unexpected_failure" } }],
          ["the database unreachable", { tunggu: "gagal" as const }],
        ] as const) {
          const r = await coba({}, perilaku);
          const ref = String(r.h.body.ref ?? "");
          c.expect(r.h.status === 503 && r.h.body.code === "CARD_UNAVAILABLE" && /^[A-Z0-9]{6}$/.test(ref),
            `${apa} → ${r.h.status} ${JSON.stringify(r.h.body)}`);
          c.expect(r.cat.log.some((l) => l.startsWith(ref)), `${apa}: the reference ${ref} is not in the server log`);
          c.expect(!r.cat.log.some((l) => l.includes("7001") || l.includes("2468")), `${apa}: the log carries the card number or PIN`);
        }
        // approval (B): ONLY an answer that says nothing about the credential is taken back
        for (const [apa, e] of [
          ["Auth's rate limit", { status: 429, code: "over_request_rate_limit", name: "AuthApiError" }],
          ["Auth failing (500)", { status: 500, code: "unexpected_failure", name: "AuthApiError" }],
          ["Auth's gateway timing out (504)", { status: 504, name: "AuthRetryableFetchError" }],
          ["no answer (network failure or this route's timeout)", { status: 0, name: "AuthRetryableFetchError" }],
        ] as const) {
          const r = await coba({}, { auth: e });
          c.expect(r.cat.selesai.length === 1 && r.cat.selesai[0].startsWith("TIDAK_DINILAI:"),
            `${apa} judged no PIN, but the attempt was ${r.cat.selesai.join(",") || "kept"}`);
        }
        for (const [apa, e] of [
          ["a wrong PIN", { status: 400, code: "invalid_credentials", name: "AuthApiError" }],
          ["an unconfirmed account", { status: 400, code: "email_not_confirmed", name: "AuthApiError" }],
          ["a banned account", { status: 400, code: "user_banned", name: "AuthApiError" }],
          ["a 401", { status: 401, name: "AuthApiError" }],
          ["a 403", { status: 403, name: "AuthApiError" }],
          ["a 422", { status: 422, code: "validation_failed", name: "AuthApiError" }],
          ["an error that says nothing of itself", { name: "AuthUnknownError" }],
        ] as const) {
          const r = await coba({}, { auth: e });
          c.expect(r.cat.selesai.length === 0, `${apa} was taken back: a judged attempt must always count`);
        }
        const dilempar = await coba({}, { lempar: true });
        c.expect(dilempar.h.status === 503 && dilempar.cat.selesai.length === 0,
          `a sign-in that threw → ${dilempar.h.status}, taken back ${dilempar.cat.selesai.length} time(s): nothing shows the PIN went unjudged`);
        const dbMati = await coba({}, { tunggu: "gagal" });
        c.expect(dbMati.cat.masuk.length === 0, "Auth was asked although the card's cooldown could not be");
        // 7. a match: signed in as the card's own address with the derived secret, the record cleared
        const ok = await coba({}, {});
        c.expect(ok.h.status === 200 && ok.h.body.ok === true && ok.h.body.tujuan === "/belajar",
          `a matching card → ${ok.h.status} ${JSON.stringify(ok.h.body)}`);
        c.expect(ok.cat.masuk[0]?.email === cardEmail("7001") && ok.cat.masuk[0]?.sandi === derive("7001", "2468") && ok.cat.masuk[0]?.sandi !== "2468",
          "the sign-in is not the card's own address with the server-derived secret; the PIN must never be the password");
        c.expect(ok.cat.selesai.length === 1 && ok.cat.selesai[0].startsWith("MASUK:"), `a signed-in card's record was ${ok.cat.selesai.join(",") || "not cleared"}`);
        const tanpaTujuan = await coba({ lanjut: null }, {});
        c.expect(tanpaTujuan.h.body.tujuan === "/beranda-peran", "no destination asked for is not the role's home (tujuanMasuk)");
        // 8. the key: the card's, never its number, not the PIN's
        if (typeof kunciJeda === "function") {
          const k = ok.cat.catat[0] ?? "";
          c.expect(/^[0-9a-f]{64}$/.test(k) && k === kunciJeda("7001") && !k.includes("7001"), `the cooldown key is not an HMAC of the card number: ${k.slice(0, 16)}…`);
          c.expect(salahPin.cat.catat[0] === k && takAda.cat.catat[0] !== k, "the cooldown key depends on the PIN, or two cards share one");
          c.expect(kunciJeda("7001") !== (await denganEnv({ CARD_PEPPER: PEPPER.CARD_PEPPER + "-lain" }, async () => kunciJeda("7001"))),
            "the cooldown key does not depend on the server's pepper, so anyone could compute a card's key");
        }
      });

      // ---- same origin
      const h = (o: Record<string, string>) => new Headers(o);
      c.expect(asalSendiri(h({ origin: "https://app.pintarselalu.com", host: "x.vercel.app" }), "https://app.pintarselalu.com"), "PINTAR's own origin is refused");
      c.expect(asalSendiri(h({ origin: "http://127.0.0.1:3999", host: "127.0.0.1:3999" }), null), "the origin the request was addressed to is refused");
      c.expect(!asalSendiri(h({ origin: "https://contoh.example", host: "app.pintarselalu.com" }), "https://app.pintarselalu.com"), "a foreign origin is accepted");
      c.expect(!asalSendiri(h({ host: "app.pintarselalu.com" }), "https://app.pintarselalu.com"), "a request with no Origin is accepted");
      c.expect(!asalSendiri(h({ origin: "null", host: "app.pintarselalu.com" }), "https://app.pintarselalu.com"), "an opaque (null) origin is accepted");
      c.expect(!asalSendiri(h({ origin: "https://app.pintarselalu.com.contoh.example", host: "app.pintarselalu.com" }), "https://app.pintarselalu.com"),
        "a lookalike origin is accepted");
      const APP = "https://app.pintarselalu.com";
      c.expect(!asalSendiri(h({ origin: "https://contoh.example", "sec-fetch-site": "cross-site", host: "app.pintarselalu.com" }), APP),
        "a cross-site POST (foreign Origin, Sec-Fetch-Site cross-site) is accepted");
      c.expect(!asalSendiri(h({ "sec-fetch-site": "cross-site", host: "app.pintarselalu.com" }), APP), "a cross-site POST with no Origin is accepted");
      c.expect(!asalSendiri(h({ origin: APP, "sec-fetch-site": "cross-site", host: "app.pintarselalu.com" }), APP),
        "Sec-Fetch-Site cross-site is overruled by a matching Origin");
      c.expect(!asalSendiri(h({ origin: APP, "sec-fetch-site": "same-site", host: "app.pintarselalu.com" }), APP), "a same-site (sibling subdomain) POST is accepted");
      c.expect(!asalSendiri(h({ "sec-fetch-site": "none", host: "app.pintarselalu.com" }), APP), "a POST no page started (Sec-Fetch-Site none) is accepted");
      c.expect(asalSendiri(h({ "sec-fetch-site": "same-origin", host: "app.pintarselalu.com" }), APP), "a same-origin POST that sends only Sec-Fetch-Site is refused");
      c.expect(asalSendiri(h({ origin: APP, "sec-fetch-site": "same-origin", host: "app.pintarselalu.com" }), APP), "a same-origin POST with both signals is refused");
      c.expect(!asalSendiri(h({ origin: "https://contoh.example", "sec-fetch-site": "same-origin", host: "app.pintarselalu.com" }), APP),
        "a foreign Origin is accepted because Sec-Fetch-Site says same-origin");

      return c.verdict(
        "POST /masuk/kartu (next.config.ts rewrites it to src/app/api/masuk/kartu/route.ts) answers every case with its code: " +
          "a foreign or missing Origin 403 CARD_REQUEST_REFUSED and an empty or absurd card 401 CARD_NOT_MATCHED, both with nothing " +
          "asked, same origin decided by Origin and Sec-Fetch-Site (a cross-site, same-site or page-less POST refused); the card's " +
          "cooldown asked first, a wait 429 CARD_COOLDOWN with Retry-After and Auth not asked; a wrong PIN, a card " +
          "nobody holds and an account that cannot sign in one and the same 401 CARD_NOT_MATCHED, counted; Auth's own limit 429 " +
          "CARD_RATE_LIMITED, its wait only when Auth gave one; only Auth's 429, a 5xx, a network failure or a timeout is taken " +
          "back, and every 4xx, an unexplained error and a throw count; Auth or the database unreachable 503 " +
          "CARD_UNAVAILABLE with a logged reference and no card or PIN in the log; a match signs in as the card's address with the " +
          "server-derived secret and clears the record; the key is an HMAC of the card number under the pepper; the service-role " +
          "client is made once per request for the cooldown's two calls only, and Auth's answer is time-bounded; and no server action " +
          "signs anyone in with a password (signInWithCard is gone)",
      );
    },
  },
  {
    id: "BOB12-K02",
    run: async (ctx) => {
      const c = new Checks();
      const f = await muat("../src/lib/auth-forwarding");
      if (!c.expect(f !== null && typeof f.fetchBerpenerus === "function" && typeof f.alamatKlien === "function",
        "there is no forwarding: src/lib/auth-forwarding.ts has no fetchBerpenerus and alamatKlien")) {
        return c.verdict("");
      }
      const fetchBerpenerus = f!.fetchBerpenerus as (a: string | null, d: typeof fetch) => typeof fetch;
      const alamatKlien = f!.alamatKlien as (h: Headers) => string | null;
      const PROYEK = "https://proyek.supabase.test";
      const PUBLIK = "sb_publishable_selftestBOB12";
      const RAHASIA = "sb_secret_selftestBOB12forwarding";
      const ALAMAT = "203.0.113.7";

      type Terkirim = { method: string; url: string; headers: Headers };
      const terkirim: Terkirim[] = [];
      const jwt = (sub: string) => {
        const b = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
        return `${b({ alg: "HS256", typ: "JWT" })}.${b({ sub, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated" })}.c2ln`;
      };
      const pengguna = { id: "00000000-0000-4000-8000-000000000012", aud: "authenticated", role: "authenticated", email: "card-7001@cards.test",
        app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      const sesi = () => ({ access_token: jwt(pengguna.id), refresh_token: "segar-" + terkirim.length, token_type: "bearer",
        expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: pengguna });
      const perekam: typeof fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const headers = new Headers(init?.headers);
        terkirim.push({ method: (init?.method ?? "GET").toUpperCase(), url, headers });
        const u = new URL(url);
        const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { "content-type": "application/json" } });
        if (u.pathname === "/auth/v1/token" || u.pathname === "/auth/v1/verify") return json(sesi());
        if (u.pathname === "/auth/v1/user") return json(pengguna);
        if (u.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
        return json([]);
      };
      const kunciDi = (t: Terkirim) => [...t.headers.entries()].some(([, v]) => v.includes(RAHASIA));
      const alamatDi = (t: Terkirim) => t.headers.get("sb-forwarded-for");
      const nama = (t: Terkirim) => `${t.method} ${new URL(t.url).pathname}${new URL(t.url).search}`;

      await denganEnv({ NEXT_PUBLIC_SUPABASE_URL: PROYEK, NEXT_PUBLIC_SUPABASE_ANON_KEY: PUBLIK, SUPABASE_AUTH_FORWARDING_KEY: RAHASIA }, async () => {
        // ---- the real client, as the card route and the proxy build it
        const jar = new Map<string, string>();
        const klien = createServerClient(PROYEK, PUBLIK, {
          global: { fetch: fetchBerpenerus(ALAMAT, perekam), headers: { "sb-forwarded-for": "6.6.6.6" } },
          cookies: {
            getAll: () => [...jar].map(([name, value]) => ({ name, value })),
            setAll: (cs) => cs.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
          },
        });
        const langkah: [string, () => Promise<unknown>, boolean][] = [
          ["the password sign-in", () => klien.auth.signInWithPassword({ email: "card-7001@cards.test", password: "turunan" }), true],
          ["a table read", async () => klien.from("persons").select("id"), false],
          ["a function call (POST)", async () => klien.rpc("my_profile"), false],
          ["a table write (POST)", async () => klien.from("lesson_progress").insert({ x: 1 }), false],
          ["reading the user (GET /user)", () => klien.auth.getUser(), false],
          ["the refresh", () => klien.auth.refreshSession(), true],
          ["the code check", () => klien.auth.verifyOtp({ email: "guru@contoh.test", token: "123456", type: "email" }), true],
          ["signing out", () => klien.auth.signOut({ scope: "local" }), false],
        ];
        for (const [apa, jalankan, diteruskan] of langkah) {
          const awal = terkirim.length;
          await jalankan();
          const baru = terkirim.slice(awal);
          c.expect(baru.length > 0 || apa === "signing out", `${apa} sent nothing`);
          for (const t of baru) {
            if (diteruskan) {
              c.expect(alamatDi(t) === ALAMAT && t.headers.get("apikey") === RAHASIA && t.headers.get("authorization") === `Bearer ${RAHASIA}`,
                `${apa} (${nama(t)}) did not carry the secret key and the student's address (sb-forwarded-for ${alamatDi(t)})`);
            } else {
              c.expect(!kunciDi(t), `${apa} (${nama(t)}) carried the secret forwarding key: a data or other request ran with it`);
              c.expect(alamatDi(t) === null, `${apa} (${nama(t)}) carried sb-forwarded-for ${alamatDi(t)}`);
            }
          }
        }
        const dataReqs = terkirim.filter((t) => new URL(t.url).pathname.startsWith("/rest/"));
        c.expect(dataReqs.length >= 3 && dataReqs.every((t) => !kunciDi(t) && t.headers.get("apikey") === PUBLIK),
          `${dataReqs.filter(kunciDi).length} of ${dataReqs.length} data request(s) ran with the forwarding key`);

        // ---- lookalikes, other methods, other grants, other hosts: never
        const bungkus = fetchBerpenerus(ALAMAT, perekam);
        const tidak: [string, string][] = [
          ["POST", `${PROYEK}/auth/v1/token/?grant_type=password`],
          ["POST", `${PROYEK}/auth/v1/tokens?grant_type=password`],
          ["POST", `${PROYEK}/auth/v1/token?grant_type=pkce`],
          ["POST", `${PROYEK}/auth/v1/token?grant_type=id_token`],
          ["POST", `${PROYEK}/auth/v1/token?grant_type=password&grant_type=refresh_token`],
          ["POST", `${PROYEK}/auth/v1/token`],
          ["POST", `${PROYEK}/auth/v1/verify/extra`],
          ["POST", `${PROYEK}/rest/v1/auth/v1/token?grant_type=password`],
          ["POST", `${PROYEK}/auth/v1/otp`],
          ["POST", `${PROYEK}/auth/v1/recover`],
          ["POST", `${PROYEK}/auth/v1/admin/generate_link`],
          ["GET", `${PROYEK}/auth/v1/token?grant_type=password`],
          ["PUT", `${PROYEK}/auth/v1/verify`],
          ["POST", `https://contoh.example/auth/v1/token?grant_type=password`],
          ["POST", `https://proyek.supabase.test.contoh.example/auth/v1/token?grant_type=password`],
          ["POST", `http://proyek.supabase.test/auth/v1/token?grant_type=password`],
          ["POST", `https://user:pw@proyek.supabase.test/auth/v1/token?grant_type=password`],
        ];
        for (const [method, url] of tidak) {
          const awal = terkirim.length;
          await bungkus(url, { method, headers: { apikey: PUBLIK, authorization: `Bearer ${PUBLIK}`, "sb-forwarded-for": "6.6.6.6" } }).catch(() => null);
          const t = terkirim[awal];
          c.expect(t !== undefined && !kunciDi(t) && alamatDi(t) === null, `${method} ${url} carried the key or an address`);
        }
        // a user's own token is never replaced, even on a forwarded path
        {
          const awal = terkirim.length;
          await bungkus(`${PROYEK}/auth/v1/verify`, { method: "POST", headers: { apikey: PUBLIK, authorization: "Bearer pengguna.jwt.token" } });
          c.expect(terkirim[awal]?.headers.get("authorization") === "Bearer pengguna.jwt.token", "a user's bearer token was replaced by the secret key");
        }

        // ---- without the key, a legacy key, or an address: nothing forwarded
        for (const [apa, kunci, alamat] of [
          ["no key set", undefined, ALAMAT],
          ["a legacy service-role JWT as the key", "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.x", ALAMAT],
          ["no usable address", RAHASIA, null],
        ] as const) {
          await denganEnv({ SUPABASE_AUTH_FORWARDING_KEY: kunci }, async () => {
            const awal = terkirim.length;
            await fetchBerpenerus(alamat, perekam)(`${PROYEK}/auth/v1/token?grant_type=password`,
              { method: "POST", headers: { apikey: PUBLIK, "sb-forwarded-for": "6.6.6.6" } });
            const t = terkirim[awal];
            c.expect(t !== undefined && alamatDi(t) === null && t.headers.get("apikey") === PUBLIK && !/eyJ|sb_secret/.test(t.headers.get("authorization") ?? ""),
              `${apa}: the sign-in went out with ${t?.headers.get("apikey")?.slice(0, 12)}… and sb-forwarded-for ${alamatDi(t!)}`);
          });
        }
      });

      // ---- the address: Vercel's x-real-ip only, and only an IP
      const kasus: [Record<string, string>, string | null][] = [
        [{ "x-real-ip": ALAMAT }, ALAMAT],
        [{ "x-real-ip": "2001:db8::7" }, "2001:db8::7"],
        [{ "x-real-ip": ALAMAT, "x-forwarded-for": "9.9.9.9", "sb-forwarded-for": "8.8.8.8" }, ALAMAT],
        [{ "x-forwarded-for": "9.9.9.9" }, null],
        [{ "sb-forwarded-for": "8.8.8.8" }, null],
        [{ "x-real-ip": "1.2.3.4, 5.6.7.8" }, null],
        [{ "x-real-ip": "sekolah.contoh" }, null],
        [{ "x-real-ip": "" }, null],
      ];
      for (const [h, harap] of kasus) {
        const dapat = alamatKlien(new Headers(h));
        c.expect(dapat === harap, `headers ${JSON.stringify(h)} give the address ${dapat}, expected ${harap}`);
      }

      // ---- the wiring: the proxy's refresh and the card route use it; the service client never does
      const baca = (p: string) => tanpaKomentar(readFileSync(join(ctx.repoRoot, p), "utf8"));
      c.expect(/fetch:\s*fetchBerpenerus\(alamatKlien\(request\.headers\)\)/.test(baca("src/proxy.ts")),
        "the proxy's session refresh does not go through the forwarding fetch");
      c.expect(!/auth-forwarding|fetchBerpenerus/.test(baca("src/lib/supabase/service.ts")), "the service-role client uses the forwarding fetch");

      return c.verdict(
        "the real Supabase client, through fetchBerpenerus with a recording fetch, sends the secret key and sb-forwarded-for " +
          "(the address Vercel saw) on POST /auth/v1/token for password and refresh_token and on POST /auth/v1/verify, and on " +
          "nothing else: no table read, function call or write, no GET /user or sign-out, no lookalike path, other method, other " +
          "grant, other host or embedded credential carries the key or an address, and every data request keeps the publishable " +
          "key; a client's own sb-forwarded-for is always removed and a user's bearer is never replaced; with no key, a legacy JWT " +
          "or no usable address nothing is forwarded; the address is x-real-ip only, and only a single IP; and the proxy's " +
          "refresh uses the forwarding fetch while the service-role client never does",
      );
    },
  },
];
