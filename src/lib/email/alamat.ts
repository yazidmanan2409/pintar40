import "server-only";
import { createHash } from "node:crypto";

/**
 * AN ADDRESS, AS THE SEND LOG KNOWS IT (BOB-25). The log never holds an
 * address, only its SHA-256 after this normalisation, so the sending module and
 * the platform admin's lookup (D-098(c), «Kirim email uji») must agree on both.
 * Pure; kept apart from the sending module so a page can hash without it.
 */
export class GalatEmail extends Error {
  constructor(pesan: string) {
    super(pesan);
    this.name = "GalatEmail";
  }
}

/** One address, trimmed and lower-cased: the same person hashes the same whatever they typed. */
export function normalisasiAlamat(ke: string): string {
  const alamat = ke.trim().toLowerCase();
  if (!/^[^\s@<>"(),;:\\[\]]+@[^\s@<>"(),;:\\[\]]+\.[^\s@<>"(),;:\\[\]]+$/.test(alamat) || alamat.length > 254) {
    throw new GalatEmail("the recipient is not one email address");
  }
  return alamat;
}

export function hashAlamat(alamat: string): string {
  return createHash("sha256").update(alamat, "utf8").digest("hex");
}
