/**
 * THE SHARED TWO-CONNECTION HARNESS (THE PLAN §5.3 H's "shared multi-connection helper", built once in L1-F2; Addendum
 * 1: used by L1-F2, L1-F4, A2a and A3). Two real connections, so two real transactions: the first takes its locks and
 * holds them (it ends with a pause before its commit); the second starts while the first holds them, and must either
 * wait or see what the first committed. Each race is run in both orders.
 *
 * A race is only proven when it overlapped: the second connection's statement must have waited for the first's
 * commit. `berlaku` says whether it did, measured on the clock: the second took at least the first's remaining hold.
 */
import { spawn, spawnSync } from "node:child_process";

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

/**
 * THE THIRD ORDER (L1-F4, Sharon's interim review of ea3c4b6f): the first transaction BEGINS before the second, but
 * writes after the second has committed. `awal` runs at its start (its now() is fixed there), then it waits `jedaMs`,
 * then runs `akhir` and commits; `tengah` runs on its own connection `tundaMs` after the first began. `berlaku` says the
 * order really happened: `tengah` had finished before the first's wait was over.
 */
export async function mulaiLebihDulu(awal: string, akhir: string, tengah: string, jedaMs = 2500, tundaMs = 400): Promise<{ satu: Hasil; dua: Hasil; berlaku: boolean }> {
  const satu = psqlLain(`begin; ${awal}; select pg_sleep(${jedaMs / 1000}); ${akhir}; commit;`);
  await tidur(tundaMs);
  const dua = psqlLain(tengah);
  const [a, b] = await Promise.all([satu, dua]);
  return { satu: a, dua: b, berlaku: b.ok && tundaMs + b.ms < jedaMs - 200 };
}

/** A function's definition, with `dari` replaced by `ke` (a plant), committed; the returned call puts it back exactly. */
export function gantiFungsi(fn: string, dari: string, ke: string): () => void {
  const url = process.env.SUPABASE_DB_URL!;
  const asli = spawnSync("psql", ["-X", "-At", url, "-c", `select pg_get_functiondef('${fn.replace(/'/g, "''")}'::regprocedure)`], { encoding: "utf8" }).stdout ?? "";
  if (!asli.includes(dari)) throw new Error(`the plant's fragment is not in ${fn}`);
  const kirim = (def: string) => { const r = spawnSync("psql", ["-X", "-q", "-v", "ON_ERROR_STOP=1", url], { encoding: "utf8", input: def + ";\n" }); if (r.status !== 0) throw new Error(r.stderr); };
  kirim(asli.replace(dari, ke));
  return () => kirim(asli);
}
