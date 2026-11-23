import "server-only";
/**
 * C3w-1 · THE PROVIDER MODULE (D8). The only module that may reach a provider. In C3w-1 there is no real adapter: the
 * local stub answers under the harness's flag (pilih-penyedia.ts), and anywhere else the answer is AI_TIDAK_TERSEDIA.
 *
 * BATAS_PANGGILAN_MS is the call's hard timeout. The database's ai_batas_kirim_tanpa_akhir() is this plus 5 minutes,
 * and C3W-D3 holds the two together.
 */
import { pilihPenyedia } from "@/lib/ai/pilih-penyedia";
import { panggilStub } from "@/lib/ai/stub";
import type { HasilPenyedia, PermintaanPenyedia } from "@/lib/ai/kontrak";

export const BATAS_PANGGILAN_MS = 120_000;

export type Penyedia = { panggil: (p: PermintaanPenyedia) => Promise<HasilPenyedia> };

export function penyedia(): Penyedia | { kode: "AI_TIDAK_TERSEDIA" } {
  const pilihan = pilihPenyedia(process.env);
  if (!pilihan.ok) return { kode: pilihan.kode };
  return { panggil: panggilStub };
}
