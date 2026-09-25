/**
 * BOB-05 (D-009) — SIGN-OUT ENDS THIS DEVICE; AN IDLE SESSION ENDS BY ITS
 * ACCOUNT'S LIMIT. Read from the sources and run against the real supabase-js
 * with a recording fetch, so the scope the helper sends is observed, not
 * assumed. The live half (two sessions of one person, and the lifetime the
 * running proxy writes) is BOB05-R01 in selftest/app.test.ts.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createChunks, stringToBase64URL } from "@supabase/ssr";
import { Checks, type SelfTest } from "./lib";
import { keluarPerangkatIni } from "../src/lib/keluar";
import { UMUR_SESI, adalahAlamatKartu, adalahCookieSesi, alamatDariCookieSesi, umurSesi } from "../src/lib/sesi";

function semua(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semua(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

/** A supabase-js client holding one session in memory, recording every request it makes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function klien(): { client: any; permintaan: string[]; simpanan: Map<string, string> } {
  const permintaan: string[] = [];
  const simpanan = new Map<string, string>();
  const sesi = {
    access_token: "header.payload.signature", token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "segar",
    user: { id: "00000000-0000-4000-8000-000000000001", email: "guru@sekolah.test", aud: "authenticated",
            app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
  };
  simpanan.set("sb-bob05-auth-token", JSON.stringify(sesi));
  const client = createClient("https://bob05.supabase.test", "kunci-anon", {
    auth: {
      storageKey: "sb-bob05-auth-token", persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      storage: {
        getItem: (k: string) => simpanan.get(k) ?? null,
        setItem: (k: string, v: string) => { simpanan.set(k, v); },
        removeItem: (k: string) => { simpanan.delete(k); },
      },
    },
    global: {
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        permintaan.push(`${init?.method ?? "GET"} ${typeof input === "string" ? input : input.toString()}`);
        return new Response(null, { status: 204 });
      },
    },
  });
  return { client, permintaan, simpanan };
}

export const sesiTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB05-K01 — "KELUAR" ENDS THIS DEVICE ONLY, AND A SESSION'S IDLE LIFE IS
    // ITS ACCOUNT'S: 60 MINUTES FOR A CLASSROOM CARD, 7 DAYS FOR EMAIL.
    // =======================================================================
    id: "BOB05-K01",
    run: async (ctx) => {
      const c = new Checks();
      const src = join(ctx.repoRoot, "src");

      // 1. the helper, run for real: it asks Auth to end THIS session only
      const a = klien();
      await keluarPerangkatIni(a.client);
      const logout = a.permintaan.filter((p) => /\/auth\/v1\/logout/.test(p));
      c.expect(logout.length === 1 && /\/auth\/v1\/logout\?scope=local$/.test(logout[0]),
        `keluarPerangkatIni sent ${JSON.stringify(logout)}, expected one POST …/auth/v1/logout?scope=local`);
      c.expect(!a.simpanan.has("sb-bob05-auth-token"), "keluarPerangkatIni left this device's session in place");
      // the default the helper must not use: the same client, signOut() bare, ends every device
      const b = klien();
      await b.client.auth.signOut();
      c.expect(b.permintaan.some((p) => /\/auth\/v1\/logout\?scope=global$/.test(p)),
        `supabase-js's default sign-out sent ${JSON.stringify(b.permintaan)}; the premise of this test (default = global) no longer holds`);

      // 2. every sign-out in src/ goes through the helper
      const liar: string[] = [];
      for (const f of semua(src)) {
        const rel = relative(ctx.repoRoot, f).replace(/\\/g, "/");
        const teks = readFileSync(f, "utf8");
        if (rel === "src/lib/keluar.ts") continue;
        if (/\.signOut\s*\(/.test(teks)) liar.push(rel);
      }
      c.expect(liar.length === 0, `sign-out outside src/lib/keluar.ts: ${liar.join(", ")}`);
      const helper = readFileSync(join(src, "lib", "keluar.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      c.expect(/\.signOut\(\{ scope: "local" \}\)/.test(helper) && (helper.match(/\.signOut\(/g) ?? []).length === 1,
        "src/lib/keluar.ts does not make exactly one signOut({ scope: \"local\" }) call");
      for (const f of [join(src, "app", "keluar", "route.ts"), join(src, "app", "masuk", "actions.ts")]) {
        c.expect(/keluarPerangkatIni\(supabase\)/.test(readFileSync(f, "utf8")),
          `${relative(ctx.repoRoot, f)} does not sign out through keluarPerangkatIni`);
      }

      // 3. the lifetime of each account kind, and nothing that merely looks like a card
      const domain = (process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal").toLowerCase();
      c.expect(UMUR_SESI.kartu === 3600 && UMUR_SESI.email === 604800, `the limits are ${JSON.stringify(UMUR_SESI)}, not 60 min and 7 days`);
      for (const [alamat, kartu] of [
        [`card-7001@${domain}`, true], [`CARD-0012345678@${domain.toUpperCase()}`, true],
        ["guru@sekolah.test", false], [`card-7001@${domain}.evil.test`, false], [`card-70a1@${domain}`, false],
        [`xcard-7001@${domain}`, false], [`card-7001@x${domain}`, false], ["", false],
      ] as const) {
        c.expect(adalahAlamatKartu(alamat) === kartu, `${alamat || "(empty)"} read as ${kartu ? "not a card" : "a card"}`);
        c.expect(umurSesi(alamat) === (kartu ? 3600 : 604800), `${alamat || "(empty)"} got ${umurSesi(alamat)} s`);
      }

      // 4. the address is read from the auth cookie as @supabase/ssr writes it, whole or in chunks
      const sesiPanjang = { access_token: "x".repeat(5000), refresh_token: "r", user: { email: `card-42@${domain}` } };
      const nilai = "base64-" + stringToBase64URL(JSON.stringify(sesiPanjang));
      const potong = createChunks("sb-proj-auth-token", nilai);
      c.expect(potong.length > 1, "the long session did not chunk; the chunked path is untested");
      c.expect(alamatDariCookieSesi([...potong].reverse()) === `card-42@${domain}`, "a chunked card session was not read back");
      c.expect(alamatDariCookieSesi([{ name: "sb-proj-auth-token",
        value: "base64-" + stringToBase64URL(JSON.stringify({ user: { email: "guru@sekolah.test" } })) }]) === "guru@sekolah.test",
        "a whole email session was not read back");
      c.expect(alamatDariCookieSesi([{ name: "sb-proj-auth-token-code-verifier", value: "base64-abc" }]) === null,
        "the PKCE code verifier was taken for a session");
      c.expect(adalahCookieSesi("sb-proj-auth-token.3") && !adalahCookieSesi("sb-proj-auth-token-code-verifier"),
        "the auth cookie matcher is wrong");

      // 5. the lifetime is applied where the cookies are written
      const proxy = readFileSync(join(src, "proxy.ts"), "utf8");
      c.expect(/umurSesi\(user\.email\)/.test(proxy) && /DEFAULT_COOKIE_OPTIONS, maxAge: umur/.test(proxy),
        "the proxy does not re-send the auth cookies with the account's lifetime");
      const server = readFileSync(join(src, "lib", "supabase", "server.ts"), "utf8");
      c.expect(/alamatDariCookieSesi\(cookiesToSet\)/.test(server) && /maxAge: umurSesi\(alamat\)/.test(server),
        "the server client does not give sign-in and refresh cookies the account's lifetime");
      const config = readFileSync(join(ctx.repoRoot, "supabase", "config.toml"), "utf8");
      c.expect(/\[auth\.sessions\][\s\S]*?inactivity_timeout = "168h"/.test(config),
        "Auth's own idle backstop is not the email account's 7 days");

      return c.verdict(
        "keluarPerangkatIni in the source file src/lib/keluar.ts, run against the real supabase-js with a recording " +
        "fetch, asks Auth for POST /auth/v1/logout?scope=local and forgets this device's session (the bare default " +
        "sends scope=global); no other sign-out exists in src/, and /keluar and S15's keluarDariSesi both use it; a " +
        "classroom card's session lives 60 minutes idle and an email account's 7 days, lookalike addresses are not " +
        "cards, the address is read from @supabase/ssr's own cookie format whole and chunked, the proxy re-sends the " +
        "auth cookies with that lifetime on every signed-in request, the server client applies it to sign-in and " +
        "refresh, and Auth's own idle backstop is 7 days");
    },
  },
];
