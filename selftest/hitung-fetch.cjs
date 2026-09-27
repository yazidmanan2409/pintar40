/**
 * BOB-18 (D-046) — THE SELFTEST'S COUNT OF SUPABASE CALLS.
 *
 * Preloaded (`node --require`) into the selftest's own `next start` and nothing
 * else: `startApp` in selftest/run.ts sets it, and a deployed build never loads
 * this file. It appends one line, `METHOD /path`, for every request the app's
 * server makes to Supabase, so an app test can read how many calls one click
 * cost. It records the path and, for a table read, the column list it asked
 * for (`select=`), and nothing else: no filter value, header, body or token.
 *
 * It wraps the fetch that exists before Next starts, so Next's own fetch patch
 * wraps it in turn and every Supabase client sees it.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- a CommonJS preload, loaded by `node --require`
const fs = require("node:fs");

const berkas = process.env.SELFTEST_FETCH_LOG;
const pangkal = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (berkas && pangkal && typeof globalThis.fetch === "function") {
  const asli = globalThis.fetch;
  globalThis.fetch = function hitung(input, init) {
    try {
      const alamat = typeof input === "string" ? input : input instanceof URL ? input.href : input && input.url;
      if (typeof alamat === "string" && alamat.startsWith(pangkal)) {
        const metode = (init && init.method) || (input && typeof input === "object" && input.method) || "GET";
        const u = new URL(alamat);
        const kolom = u.searchParams.get("select");
        fs.appendFileSync(berkas, `${String(metode).toUpperCase()} ${u.pathname}${kolom ? ` select=${kolom}` : ""}\n`);
      }
    } catch {
      /* counting never changes a request */
    }
    return asli.apply(this, arguments);
  };
}
