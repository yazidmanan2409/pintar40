/**
 * W9.19 (CAP-09; W6.2, U-PERF) -- THE PROXY VERIFIES THE SESSION'S TOKEN INSTEAD OF ASKING AUTH ON EVERY REQUEST.
 *
 *   W919-KLAIM-01  src/lib/pengguna-proksi.ts, executed through the real Supabase client (createServerClient, as the
 *                  proxy builds it) against a recording fake of Auth, with tokens really signed:
 *                  - an ES256 token signed by the project's published key is read locally, as its subject and
 *                    address: no GET /auth/v1/user, the key set fetched at most once, and a second client asks nothing;
 *                  - a token signed by another key under the same kid, or a token whose payload was altered after
 *                    signing, is nobody, and Auth is not asked to vouch for it;
 *                  - an HS256 token is still checked by Auth's server (GET /auth/v1/user): accepted when Auth
 *                    accepts it, nobody when Auth refuses it;
 *                  - an expired token is refreshed first (POST /auth/v1/token?grant_type=refresh_token) and the new
 *                    cookies are written;
 *                  - no session, or a verified token with no subject, is nobody.
 *   W919-KLAIM-02  src/proxy.ts reads who is signed in only through penggunaTerverifikasi, never auth.getUser(), and
 *                  still asks the database (sesi_periksa) on every signed-in request but a prefetch; a planted
 *                  getUser() and a planted removal of the session check are each caught.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { webcrypto } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { Checks, type SelfTest } from "./lib";

const b64u = (b: ArrayBuffer | Uint8Array | string) =>
  Buffer.from(typeof b === "string" ? b : b instanceof Uint8Array ? b : new Uint8Array(b)).toString("base64url");

type Jwk = webcrypto.JsonWebKey & { kid?: string; use?: string };
type Kunci = { publik: Jwk; privat: webcrypto.CryptoKey };
async function kunciBaru(kid: string): Promise<Kunci> {
  const p = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const publik = await webcrypto.subtle.exportKey("jwk", p.publicKey);
  return { publik: { ...publik, kid, alg: "ES256", use: "sig", key_ops: ["verify"] }, privat: p.privateKey };
}
async function tandaES256(k: Kunci, kid: string, isi: object): Promise<string> {
  const kepala = b64u(JSON.stringify({ alg: "ES256", typ: "JWT", kid }));
  const badan = b64u(JSON.stringify(isi));
  const tanda = await webcrypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k.privat, Buffer.from(`${kepala}.${badan}`));
  return `${kepala}.${badan}.${b64u(tanda)}`;
}
const hs256 = (isi: object) => `${b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64u(JSON.stringify(isi))}.c2lnbmF0dXJl`;
const sekarang = () => Math.floor(Date.now() / 1000);
const ID = "00000000-0000-4000-8000-000000000919";
const SUREL = "guru-w919@contoh.test";
const isiSah = (lain: object = {}) => ({ sub: ID, email: SUREL, role: "authenticated", aud: "authenticated", exp: sekarang() + 3600,
  iat: sekarang(), session_id: "11111111-1111-4111-8111-111111111111", ...lain });

type Terkirim = { method: string; path: string };
type Palsu = { token: string; segar?: string; userStatus?: number; jwks: Jwk[] };

/** One project: a fake Auth that records what it is asked, and a cookie jar shared by the clients built on it. */
function proyek(nama: string, palsu: Palsu) {
  const URL_PROYEK = `https://${nama}.supabase.test`;
  const terkirim: Terkirim[] = [];
  const jar = new Map<string, string>();
  let ditulis = 0;
  const sesi = (token: string) => ({ access_token: token, refresh_token: `segar-${terkirim.length}`, token_type: "bearer", expires_in: 3600,
    expires_at: (JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { exp: number }).exp,
    user: { id: ID, aud: "authenticated", role: "authenticated", email: SUREL, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
  const rekam: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    terkirim.push({ method: (init?.method ?? "GET").toUpperCase(), path: `${url.pathname}${url.search}` });
    const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
    if (url.pathname === "/auth/v1/.well-known/jwks.json") return json({ keys: palsu.jwks });
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") return json(sesi(palsu.token));
    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") return json(sesi(palsu.segar ?? palsu.token));
    if (url.pathname === "/auth/v1/user") {
      return (palsu.userStatus ?? 200) === 200 ? json(sesi(palsu.token).user) : json({ code: 401, msg: "invalid JWT" }, 401);
    }
    return json({});
  };
  const klien = () => createServerClient(URL_PROYEK, "sb_publishable_selftestW919", {
    global: { fetch: rekam },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => { ditulis++; if (value) jar.set(name, value); else jar.delete(name); }),
    },
  });
  return {
    terkirim, klien,
    ditulis: () => ditulis,
    masuk: async () => { await klien().auth.signInWithPassword({ email: SUREL, password: "selftest" }); terkirim.length = 0; ditulis = 0; },
  };
}

const ke = (t: Terkirim[], path: string) => t.filter((x) => x.path.startsWith(path)).length;

export const w919Tests: SelfTest[] = [
  {
    id: "W919-KLAIM-01",
    run: async () => {
      const c = new Checks();
      let f: typeof import("../src/lib/pengguna-proksi").penggunaTerverifikasi;
      try { f = (await import("../src/lib/pengguna-proksi")).penggunaTerverifikasi; } catch (e) {
        c.expect(false, `src/lib/pengguna-proksi.ts does not load: ${String(e)}`);
        return c.verdict("");
      }
      const kid = "kunci-w919";
      const kunci = await kunciBaru(kid);
      const lain = await kunciBaru(kid);
      const baris: string[] = [];

      // 1. an ES256 token signed by the published key: read locally
      {
        const p = proyek("w919a", { token: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik] });
        await p.masuk();
        const u = await f(p.klien());
        c.expect(u?.id === ID && u?.email === SUREL, `a verified ES256 token was not read as its subject and address (${JSON.stringify(u)})`);
        c.expect(ke(p.terkirim, "/auth/v1/user") === 0, "a verified ES256 token still asked Auth's server (GET /auth/v1/user)");
        c.expect(ke(p.terkirim, "/auth/v1/.well-known/jwks.json") <= 1, "the key set was fetched more than once for one request");
        const sebelum = p.terkirim.length;
        const u2 = await f(p.klien());
        c.expect(u2?.id === ID && p.terkirim.length === sebelum, `a second request's client asked ${p.terkirim.length - sebelum} more time(s): the key set is not cached`);
        baris.push(`ES256: local, ${ke(p.terkirim, "/auth/v1/.well-known/jwks.json")} key-set fetch, 0 Auth calls`);
      }
      // 2. signed by another key under the same kid: nobody, and Auth is not asked to vouch
      {
        const p = proyek("w919b", { token: await tandaES256(lain, kid, isiSah()), jwks: [kunci.publik] });
        await p.masuk();
        const u = await f(p.klien());
        c.expect(u === null, "a token signed by another key was accepted");
        c.expect(ke(p.terkirim, "/auth/v1/user") === 0, "a token with a bad signature was sent to Auth's server to vouch for it");
      }
      // 3. the payload altered after signing (another subject): nobody
      {
        const sah = await tandaES256(kunci, kid, isiSah());
        const [h, , s] = sah.split(".");
        const ubah = `${h}.${b64u(JSON.stringify(isiSah({ sub: "00000000-0000-4000-8000-0000000000ff" })))}.${s}`;
        const p = proyek("w919c", { token: ubah, jwks: [kunci.publik] });
        await p.masuk();
        c.expect((await f(p.klien())) === null, "a token whose payload was altered after signing was accepted");
      }
      // 4. HS256: Auth's server still decides
      {
        const p = proyek("w919d", { token: hs256(isiSah()), jwks: [] });
        await p.masuk();
        const u = await f(p.klien());
        c.expect(u?.id === ID && ke(p.terkirim, "/auth/v1/user") === 1, `an HS256 token Auth accepts: read ${JSON.stringify(u)}, ${ke(p.terkirim, "/auth/v1/user")} Auth call(s)`);
        const q = proyek("w919e", { token: hs256(isiSah()), jwks: [], userStatus: 401 });
        await q.masuk();
        c.expect((await f(q.klien())) === null && ke(q.terkirim, "/auth/v1/user") === 1, "an HS256 token Auth refuses was accepted, or Auth was not asked");
        baris.push("HS256: Auth's server asked, its answer kept");
      }
      // 5. expired: refreshed first, the new cookies written
      {
        const p = proyek("w919f", { token: await tandaES256(kunci, kid, isiSah({ exp: sekarang() - 60, iat: sekarang() - 3700 })),
          segar: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik] });
        await p.masuk();
        const u = await f(p.klien());
        c.expect(u?.id === ID, `an expired token with a good refresh token was not refreshed and read (${JSON.stringify(u)})`);
        c.expect(ke(p.terkirim, "/auth/v1/token?grant_type=refresh_token") === 1, "an expired token was not refreshed first");
        c.expect(p.ditulis() > 0, "the refreshed session's cookies were not written");
      }
      // 6. no session; a verified token with no subject
      {
        const p = proyek("w919g", { token: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik] });
        c.expect((await f(p.klien())) === null && p.terkirim.length === 0, "no session was not nobody, or it asked the network");
        const q = proyek("w919h", { token: await tandaES256(kunci, kid, isiSah({ sub: "" })), jwks: [kunci.publik] });
        await q.masuk();
        c.expect((await f(q.klien())) === null, "a verified token with no subject was taken as someone");
      }
      return c.verdict(`penggunaTerverifikasi through the real client: ${baris.join("; ")}; another key's signature, an altered payload, Auth's refusal, no session and no subject are nobody; an expired token is refreshed first`);
    },
  },
  {
    id: "W919-KLAIM-02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tanpaKomentar = (s: string) => s.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const periksa = (src: string) => {
        const k = tanpaKomentar(src);
        return {
          lewatPembantu: /const user = await penggunaTerverifikasi\(supabase\);/.test(k),
          tanpaGetUser: !/\.auth\.getUser\(/.test(k),
          sesiDitanya: /else if \(!adalahPrefetch\(request\.headers\)\) \{\s*const \{ data, error \} = await supabase\.rpc\("sesi_periksa"/.test(k),
        };
      };
      const asli = readFileSync(join(repoRoot, "src", "proxy.ts"), "utf8");
      const r = periksa(asli);
      c.expect(r.lewatPembantu, "src/proxy.ts does not read who is signed in through penggunaTerverifikasi");
      c.expect(r.tanpaGetUser, "src/proxy.ts still calls auth.getUser()");
      c.expect(r.sesiDitanya, "src/proxy.ts no longer asks sesi_periksa on every signed-in request but a prefetch");
      const tanamGetUser = periksa(asli.replace("const user = await penggunaTerverifikasi(supabase);", "const { data: { user } } = await supabase.auth.getUser();"));
      c.expect(!tanamGetUser.lewatPembantu && !tanamGetUser.tanpaGetUser, "a planted auth.getUser() in the proxy is not caught");
      const tanamTanpaSesi = periksa(asli.replace('await supabase.rpc("sesi_periksa"', 'await Promise.resolve(null) && supabase.rpc("sesi_lain"'));
      c.expect(!tanamTanpaSesi.sesiDitanya, "a planted removal of the session check is not caught");
      return c.verdict("src/proxy.ts reads who is signed in through penggunaTerverifikasi, never auth.getUser(), and still asks sesi_periksa on every signed-in request but a prefetch; both plants are caught");
    },
  },
];
