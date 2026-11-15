/**
 * A2a D6.9 · an O1 refusal is recorded afterwards. A refusal raises, so its transaction keeps nothing; the screen's
 * action, having been refused SITTING_CLASS_STOPPED, ASSIGN_CLASS_STOPPED or PROMO_STOPPED, calls
 * catat_penolakan_henti once, which writes the row only if the refusal still stands for this caller (as
 * catat_penolakan_peran, B0). Recording never changes the answer the screen gives; a failure to record is logged.
 */
export const KODE_HENTI_DICATAT = ["SITTING_CLASS_STOPPED", "ASSIGN_CLASS_STOPPED", "PROMO_STOPPED"] as const;
export type KodeHentiDicatat = (typeof KODE_HENTI_DICATAT)[number];

type Rpc = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { code?: string | null } | null }> };

export async function catatPenolakanHenti(db: Rpc, sasaran: string, kode: string, asal: string): Promise<void> {
  if (!(KODE_HENTI_DICATAT as readonly string[]).includes(kode)) return;
  const { error } = await db.rpc("catat_penolakan_henti", { p_sasaran: sasaran, p_kode: kode });
  if (error) console.error(`[${asal}] the refusal ${kode} was not recorded`, error.code);
}
