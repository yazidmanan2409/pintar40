/**
 * C3w-1 · THE ONE PROVIDER INTERFACE (D8). Pure types: no network, no database, no React. The request is R-3's closed
 * record (control 1): content only, never a person, a school or a learner-derived value (controls 3 and 4).
 */
export type PermintaanPenyedia = {
  excerpt: string;
  objectives: string[];
  /** The JSON shape of the answer: an array of single-answer questions, minItems = maxItems = the count asked. */
  itemSchema: SkemaSoal;
  promptVersion: string;
};

export type SkemaSoal = {
  type: "array";
  minItems: number;
  maxItems: number;
  items: { type: "object"; required: ["stem", "options"] };
};

/** Sharon's closed usage shape, as ai_selesaikan and ai_rekonsiliasi take it (D-1b). */
export type Penggunaan = { token_masuk: number; token_keluar: number; biaya_mikro: number; id_penyedia?: string };

export type SoalDraf = { stem: string; options: Array<{ label: string; text: string; correct: boolean }> };

export type HasilPenyedia =
  | { ok: true; soal: SoalDraf[]; penggunaan: Penggunaan }
  | { ok: false; sebab: "GAGAL"; penggunaan: Penggunaan | null };
