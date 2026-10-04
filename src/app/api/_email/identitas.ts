import "server-only";
import { supabaseService } from "@/lib/supabase/service";
import { PENGATURAN } from "@/lib/pengaturan-auth";
import { templatKartu, templatKode, templatPasswordDiubah, templatPemulihan } from "@/components/email/identitas";
import { HALAMAN_PEMULIHAN, type DataKartu, type PeranKartu } from "@/lib/aktivasi-kontrak";
import { appUrl } from "@/lib/env";
import { hashAlamat, kirimEmail, normalisasiAlamat, type HasilKirim } from "./kirim";
import { terbitkanKodeEmail } from "./kode";

/**
 * BOB-26: GATE 3'S TWO SENDS, through BOB-25's one module (D-057(a), D-079).
 * Bob's half: the data and the send. The words are the templates' (DAISY-20).
 */

/**
 * An activation code, to an account activation_code_target has already
 * named. THE LIMITS ARE ASKED FIRST (email_send_would_allow): issuing a code
 * replaces the one already in the person's inbox, so a code is issued only for
 * a send the limits would let go. kirimEmail's own reservation still decides.
 */
export async function kirimKodeAktivasi(sasaran: { authUserId: string; nama: string }, ulang: boolean): Promise<HasilKirim | null> {
  const db = supabaseService();
  const jenis = ulang ? "KODE_ULANG" : "KODE_AKTIVASI";
  const { data: pengguna } = await db.auth.admin.getUserById(sasaran.authUserId);
  const alamat = pengguna?.user?.email ? normalisasiAlamat(pengguna.user.email) : null;
  if (!alamat) return null;
  const { data: boleh, error } = await db.rpc("email_send_would_allow", { p_kind: jenis, p_recipient_hash: hashAlamat(alamat) });
  if (error || boleh !== true) return null;
  const kode = await terbitkanKodeEmail(sasaran.authUserId);
  if (!kode) return null;
  return kirimEmail({
    ke: kode.email,
    jenis,
    susun: (k) => templatKode({ kode: kode.kode, berlakuMenit: PENGATURAN.berlakuMenit, nama: sasaran.nama, ulang }, k),
  });
}

/**
 * BOB-27: a recovery code, to an account recovery_code_target has already
 * named; the limits asked first, as for activation.
 */
export async function kirimKodePemulihan(sasaran: { authUserId: string; nama: string }): Promise<HasilKirim | null> {
  const db = supabaseService();
  const { data: pengguna } = await db.auth.admin.getUserById(sasaran.authUserId);
  const alamat = pengguna?.user?.email ? normalisasiAlamat(pengguna.user.email) : null;
  if (!alamat) return null;
  const { data: boleh, error } = await db.rpc("email_send_would_allow", { p_kind: "PEMULIHAN_PASSWORD", p_recipient_hash: hashAlamat(alamat) });
  if (error || boleh !== true) return null;
  const kode = await terbitkanKodeEmail(sasaran.authUserId);
  if (!kode) return null;
  return kirimEmail({
    ke: kode.email,
    jenis: "PEMULIHAN_PASSWORD",
    susun: (k) => templatPemulihan({ kode: kode.kode, berlakuMenit: PENGATURAN.berlakuMenit, nama: sasaran.nama }, k),
  });
}

/** BOB-27 (D-055(f)): the owner is told their password changed and that every session ended. */
export async function kirimPasswordDiubah(authUserId: string): Promise<HasilKirim | null> {
  const db = supabaseService();
  const { data: pengguna } = await db.auth.admin.getUserById(authUserId);
  const alamat = pengguna?.user?.email ? normalisasiAlamat(pengguna.user.email) : null;
  if (!alamat) return null;
  // no name: this send reads no person row (L2-KONTRAK-01); the template greets only when there is one
  return kirimEmail({
    ke: alamat,
    jenis: "PASSWORD_DIUBAH",
    susun: (k) => templatPasswordDiubah({ nama: "", waktu: new Date().toISOString(), tautanLupa: `${appUrl()}${HALAMAN_PEMULIHAN}` }, k),
  });
}

/** my_identity_card's answer, as the contract's DataKartu. */
export function kartuDariDb(d: unknown, asal: string): DataKartu | null {
  const o = (d ?? {}) as { name?: unknown; pintar_id?: unknown; contexts?: unknown };
  if (typeof o.name !== "string" || typeof o.pintar_id !== "string") return null;
  const konteks = (Array.isArray(o.contexts) ? o.contexts : []).map((c: { role?: unknown; institution?: unknown }) => ({
    peran: String(c.role) as PeranKartu,
    institusi: typeof c.institution === "string" ? c.institution : null,
  }));
  return { nama: o.name, pintarId: o.pintar_id, tautanId: `${asal}/id/${o.pintar_id}`, konteks };
}

/** The PINTAR Digital Card, to the signed-in staff person's own address. */
export async function kirimKartu(ke: string, kartu: DataKartu, asal: string): Promise<HasilKirim> {
  return kirimEmail({
    ke,
    jenis: "KARTU_DIGITAL",
    susun: (k) => templatKartu({ ...kartu, tautanAkun: `${asal}/akun` }, k),
  });
}
