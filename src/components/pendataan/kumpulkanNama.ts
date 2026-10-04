import type { NamaDicatat } from "./DaftarNama";

/**
 * D-077(3): EVERY NAME AN INTAKE WILL RECORD, gathered page by page.
 *
 * Pure: it is given the one read (BOB-26's `import_preview_names`, wired in
 * src/app/pendataan/nama.ts) and asks it, in row order, from after the last row
 * read, until a page comes back short.
 *
 * ALL OR NOTHING. The approval is for the whole batch, so the list it is given
 * on must be the whole batch: a refusal, a row that is not the expected shape,
 * rows out of order, or a read that never ends, is null, and the page then
 * offers no approval.
 */
export type HalamanNama = (setelah: number, batas: number) => Promise<{ data: unknown; error: unknown }>;

export const HALAMAN_NAMA = 500;
/** A ceiling on pages, so a read that never ends is a failure, not a hang. */
export const HALAMAN_TERBANYAK = 200;

function baris(x: unknown): NamaDicatat | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const n = Number(r.baris);
  if (!Number.isInteger(n) || typeof r.nama !== "string" || typeof r.peran !== "string" || typeof r.baru !== "boolean") return null;
  return { baris: n, nama: r.nama, peran: r.peran, baru: r.baru };
}

export async function kumpulkanNama(ambil: HalamanNama): Promise<NamaDicatat[] | null> {
  const semua: NamaDicatat[] = [];
  let setelah = 0;
  for (let h = 0; h < HALAMAN_TERBANYAK; h++) {
    let jawab: { data: unknown; error: unknown };
    try {
      jawab = await ambil(setelah, HALAMAN_NAMA);
    } catch {
      return null;
    }
    if (jawab.error || !Array.isArray(jawab.data)) return null;
    const halaman = jawab.data.map(baris);
    for (const r of halaman) {
      if (r === null || r.baris <= setelah) return null; // not the shape, or out of order
      semua.push(r);
      setelah = r.baris;
    }
    if (halaman.length < HALAMAN_NAMA) return semua;
  }
  return null;
}
