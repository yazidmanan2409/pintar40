/**
 * THE SHARED TWO-CONNECTION HARNESS (THE PLAN §5.3 H's "shared multi-connection helper", built once in L1-F2; Addendum
 * 1: used by L1-F2, L1-F4, A2a and A3). Two real connections, so two real transactions: the first takes its locks and
 * holds them (it ends with a pause before its commit); the second starts while the first holds them, and must either
 * wait or see what the first committed. Each race is run in both orders.
 *
 * A race is only proven when it overlapped: the second connection's statement must have waited for the first's
 * commit. `berlaku` says whether it did, measured on the clock: the second took at least the first's remaining hold.
 */
import { spawn } from "node:child_process";

export type Hasil = { ok: boolean; out: string; err: string; ms: number };

/** psql in a connection of its own, as a promise: stdout, the last stderr lines, success, and how long it took. */
export function psqlLain(sql: string): Promise<Hasil> {
  const t0 = Date.now();
  return new Promise((selesai) => {
    const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql, process.env.SUPABASE_DB_URL!], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (b) => { out += b; });
    p.stderr.on("data", (b) => { err += b; });
    p.on("close", (code) => selesai({ ok: code === 0, out: out.trim(), err: err.trim().split("\n").filter((l) => /ERROR|DETAIL/.test(l)).slice(-3).join(" | "), ms: Date.now() - t0 }));
  });
}

export const tidur = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * One race: `pertama` runs in a transaction of its own and holds what it took for `tahanMs` before committing;
 * `kedua` starts `tundaMs` after it. Returns both results and whether they overlapped (the second waited).
 */
export async function balapan(pertama: string, kedua: string, tahanMs = 2500, tundaMs = 700): Promise<{ satu: Hasil; dua: Hasil; berlaku: boolean }> {
  const satu = psqlLain(`begin; ${pertama}; select pg_sleep(${tahanMs / 1000}); commit;`);
  await tidur(tundaMs);
  const dua = psqlLain(kedua);
  const [a, b] = await Promise.all([satu, dua]);
  return { satu: a, dua: b, berlaku: b.ms >= tahanMs - tundaMs - 300 };
}
