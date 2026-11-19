/**
 * C3w-1 · THE LOCAL STUB PROVIDER (C3W-1-DESIGN.md §5). It opens no socket and imports no network client: it is
 * deterministic from a seed in the excerpt's hash, and it counts its calls so a test can prove "zero provider calls".
 * Selected only through src/lib/ai/penyedia.ts under the harness's flag (D-5).
 */
import type { HasilPenyedia, PermintaanPenyedia } from "@/lib/ai/kontrak";

let panggilan = 0;

/** How many times the stub has been called in this process (C3-3: a double submit makes one call). */
export function jumlahPanggilanStub(): number {
  return panggilan;
}

/** A deterministic, valid single-answer draft set; the count asked, each with one correct key (D6). */
export async function panggilStub(p: PermintaanPenyedia): Promise<HasilPenyedia> {
  panggilan += 1;
  const benih = Number.parseInt(p.excerptSha256.slice(0, 8), 16) || 1;
  const soal = Array.from({ length: p.jumlah }, (_, i) => {
    const kunci = ["A", "B", "C", "D"][(benih + i) % 4];
    return {
      stem: `Soal latihan ${i + 1}: ${p.tujuan}`,
      options: ["A", "B", "C", "D"].map((label) => ({ label, text: `Pilihan ${label}`, correct: label === kunci })),
    };
  });
  const keluar = 40 * p.jumlah;
  return {
    ok: true,
    soal,
    penggunaan: { token_masuk: 200, token_keluar: keluar, biaya_mikro: 200 + keluar, id_penyedia: `stub-${benih.toString(16)}-${panggilan}` },
  };
}
