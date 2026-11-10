/**
 * SHARON'S PAGING RULING (10 Nov; PROPOSAL-AUDIT-RUN-PAGING.md): A YEAR-END RUN IS ONE ENTRY IN JEJAK AUDIT. The trail is
 * paged by entries (a run's related rows take no slot; its promotion.applied row stands for it), and the run's related
 * rows are read under it, never all at once:
 *   - n, exactly, by one count per run on the page (count: exact, head: true), all asked together, so n never depends on
 *     PostgREST's max_rows (1000) and the page waits for one round of them, not one after another;
 *   - the rows, only for the run the reader opened (?run=), a sub-page of UKURAN_ANAK_RUN at a time (hal_run), ordered
 *     as the trail is (at desc, id).
 * Every read is of audit_log through the reader's own client, so audit_log_select decides as it does for the page, and
 * each names the run's school and the run by the stored run_id column (the composite index audit_log_run_idx: under the
 * row policy a filter on summary ->> 'run_id' can use no index; one school by eq, as the page's own read does). Nothing here is a second authority: a run id the reader cannot read counts 0 and lists nothing.
 */
import { rentang, tautanHalaman } from "@/components/koleksi/halaman";

export const UKURAN_ANAK_RUN = 100;
export const KOLOM_ANAK_RUN = "id, at, action, target_table, target_id, institution_id, summary";

type Tanya = {
  eq(k: string, v: string): Tanya; neq(k: string, v: string): Tanya;
  order(k: string, o?: { ascending?: boolean }): Tanya; range(a: number, b: number): Tanya;
  then: PromiseLike<{ data: unknown[] | null; count?: number | null; error: unknown }>["then"];
};
type Klien = { from(t: "audit_log"): { select(k: string, o?: { count?: "exact"; head?: boolean }): Tanya } };

const anakDari = (db: Klien, run: string, sekolah: string, kolom: string, o?: { count: "exact"; head: boolean }) =>
  db.from("audit_log").select(kolom, o).eq("institution_id", sekolah).eq("run_id", run).neq("action", "promotion.applied");

/** n per run on the page, exact; a count that cannot be read is null (the page then says nothing about that run's rows). */
export async function hitungAnakRun(db: Klien, runs: ReadonlyArray<{ run: string; sekolah: string }>): Promise<Map<string, number | null>> {
  const hasil = await Promise.all(runs.map(async ({ run, sekolah }) => {
    const r = await anakDari(db, run, sekolah, "id", { count: "exact", head: true });
    return [run, r.error ? null : r.count ?? 0] as const;
  }));
  return new Map(hasil);
}

/** One sub-page of the run's related rows, the newest first, and whether another follows. */
export async function bacaAnakRun(db: Klien, run: string, sekolah: string, hal: number): Promise<{ baris: Array<Record<string, unknown>>; lagi: boolean; galat: boolean }> {
  const r = await anakDari(db, run, sekolah, KOLOM_ANAK_RUN).order("at", { ascending: false }).order("id").range(...rentang(hal, UKURAN_ANAK_RUN));
  const semua = (r.data ?? []) as Array<Record<string, unknown>>;
  return { baris: semua.slice(0, UKURAN_ANAK_RUN), lagi: semua.length > UKURAN_ANAK_RUN, galat: Boolean(r.error) };
}

/** The link that opens a run's related rows at sub-page `hal`, keeping the trail's own page, landing on the run's row. */
export function tautanRun(jalan: string, sp: Record<string, string | string[] | undefined>, run: string, hal: number): string {
  const [dasar, jangkar] = tautanHalaman(jalan, sp, "hal_run", hal, `jejak-run-${run}`).split("#");
  return `${dasar}&run=${encodeURIComponent(run)}#${jangkar}`;
}

/** The link that closes it again, on the same page of the trail, at the run's row. */
export function tautanTutupRun(jalan: string, sp: Record<string, string | string[] | undefined>, run: string): string {
  const { hal_run: _abaikan, run: _run, ...lain } = sp;
  void _abaikan; void _run;
  const n = Number(Array.isArray(sp.hal_jejak) ? sp.hal_jejak[0] : sp.hal_jejak) || 1;
  return tautanHalaman(jalan, lain, "hal_jejak", n, `jejak-run-${run}`);
}
