/**
 * W9.19, REVERSED (6 Nov) -- AUTH'S SERVER DECIDES WHO IS SIGNED IN AT THE PROXY.
 *
 * W9.19 had the proxy verify the session's token locally (getClaims). On staging the Golden School walk's GS-21 R2
 * and R3 (run 42195722895, main 4d325a33) found the defect: on a computer marked PERSONAL the proxy skips the
 * database's session check, so after the password was replaced elsewhere (KREDENSIAL_DIGANTI) the old browser still
 * reached /mengajar. Its token still verified; Auth was no longer asked. These tests hold the correction.
 *
 *   W919-CABUT-01  src/lib/pengguna-proksi.ts, executed through the real Supabase client (createServerClient, as the
 *                  proxy builds it) against a recording fake of Auth, with an ES256 token really signed by the
 *                  project's published key: when Auth's server reports the session gone, the reader is nobody,
 *                  although the token verifies; when Auth accepts it, the reader is its subject and address; Auth is
 *                  asked on every read; no session is nobody, with no call. Red against the getClaims() read.
 *   W919-CABUT-02  src/proxy.ts reads who is signed in only through penggunaTerverifikasi, which asks auth.getUser()
 *                  and never getClaims(), and still asks sesi_periksa on every signed-in request but a prefetch and a
 *                  PERSONAL session; a planted getClaims() and a planted removal of the session check are each caught.
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
    id: "W919-CABUT-01",
    run: async () => {
      const c = new Checks();
      let f: typeof import("../src/lib/pengguna-proksi").penggunaTerverifikasi;
      try { f = (await import("../src/lib/pengguna-proksi")).penggunaTerverifikasi; } catch (e) {
        c.expect(false, `src/lib/pengguna-proksi.ts does not load: ${String(e)}`);
        return c.verdict("");
      }
      const kid = "kunci-w919";
      const kunci = await kunciBaru(kid);
      // 1. the session ended at Auth (a password replaced elsewhere, «Keluar semua»): the token still verifies
      {
        const p = proyek("w919a", { token: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik], userStatus: 403 });
        await p.masuk();
        const u = await f(p.klien());
        c.expect(u === null, `a session Auth reports gone was taken as ${JSON.stringify(u)}: its token verifies, so only Auth's answer can refuse it`);
        c.expect(ke(p.terkirim, "/auth/v1/user") === 1, `Auth's server was asked ${ke(p.terkirim, "/auth/v1/user")} time(s), not once`);
      }
      // 2. the session alive: its subject and address, and Auth asked on every read
      {
        const p = proyek("w919b", { token: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik] });
        await p.masuk();
        const u = await f(p.klien());
        const u2 = await f(p.klien());
        c.expect(u?.id === ID && u?.email === SUREL && u2?.id === ID, `a live session was not read as its subject and address (${JSON.stringify(u)})`);
        c.expect(ke(p.terkirim, "/auth/v1/user") === 2, `two reads asked Auth's server ${ke(p.terkirim, "/auth/v1/user")} time(s): a read was answered without it`);
      }
      // 3. no session: nobody, and nothing asked
      {
        const p = proyek("w919c", { token: await tandaES256(kunci, kid, isiSah()), jwks: [kunci.publik] });
        c.expect((await f(p.klien())) === null && p.terkirim.length === 0, "no session was not nobody, or it asked the network");
      }
      return c.verdict("penggunaTerverifikasi through the real client: a session Auth reports gone is nobody although its ES256 token verifies; a live one is its subject and address; Auth's server is asked on every read; no session is nobody, with no call");
    },
  },
  {
    id: "W919-CABUT-02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tanpaKomentar = (s: string) => s.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      const periksa = (proxy: string, pembantu: string) => {
        const k = tanpaKomentar(proxy), h = tanpaKomentar(pembantu);
        return {
          lewatPembantu: /const user = await penggunaTerverifikasi\(supabase\);/.test(k) && !/\.auth\.getClaims\(/.test(k),
          tanyaAuth: /\.auth\.getUser\(\)/.test(h) && !/getClaims/.test(h),
          sesiDitanya: /else if \(!adalahPrefetch\(request\.headers\)\) \{\s*const \{ data, error \} = await supabase\.rpc\("sesi_periksa"/.test(k),
        };
      };
      const proxy = readFileSync(join(repoRoot, "src", "proxy.ts"), "utf8");
      const pembantu = readFileSync(join(repoRoot, "src", "lib", "pengguna-proksi.ts"), "utf8");
      const r = periksa(proxy, pembantu);
      c.expect(r.lewatPembantu, "src/proxy.ts does not read who is signed in through penggunaTerverifikasi, or verifies a token itself");
      c.expect(r.tanyaAuth, "src/lib/pengguna-proksi.ts does not ask Auth's server (auth.getUser()), or verifies the token locally (getClaims)");
      c.expect(r.sesiDitanya, "src/proxy.ts no longer asks sesi_periksa on every signed-in request but a prefetch");
      const tanamKlaim = periksa(proxy, pembantu.replace("supabase.auth.getUser()", "supabase.auth.getClaims()"));
      c.expect(!tanamKlaim.tanyaAuth, "a planted getClaims() in the proxy's read is not caught");
      const tanamTanpaSesi = periksa(proxy.replace('await supabase.rpc("sesi_periksa"', 'await Promise.resolve(null) && supabase.rpc("sesi_lain"'), pembantu);
      c.expect(!tanamTanpaSesi.sesiDitanya, "a planted removal of the session check is not caught");
      return c.verdict("src/proxy.ts reads who is signed in through penggunaTerverifikasi, which asks Auth's server (auth.getUser(), never getClaims), and still asks sesi_periksa on every signed-in request but a prefetch and a PERSONAL session; both plants are caught");
    },
  },
];
