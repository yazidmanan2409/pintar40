/**
 * C3w-1 · THE ONE PROVIDER INTERFACE (D8). Pure types: no network, no database, no React. The request carries content
 * only (R-3 control 1 and 4): never a person, a school or a learner-derived value.
 */
export type PermintaanPenyedia = {
  excerpt: string;
  excerptSha256: string;
  tujuan: string;
  jumlah: number;
};

/** Sharon's closed usage shape, as ai_selesaikan and ai_rekonsiliasi take it (D-1b). */
export type Penggunaan = { token_masuk: number; token_keluar: number; biaya_mikro: number; id_penyedia?: string };

export type SoalDraf = { stem: string; options: Array<{ label: string; text: string; correct: boolean }> };

export type HasilPenyedia =
  | { ok: true; soal: SoalDraf[]; penggunaan: Penggunaan }
  | { ok: false; sebab: "GAGAL"; penggunaan: Penggunaan | null };
