import type { NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { periksaPassword, type AlasanPasswordLemah } from "@/lib/pengaturan-auth";
import { jawab } from "../_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "../_wizard";

/**
 * BOB-26: SET THE PASSWORD, at activation only.
 *
 * The rules (supabase/auth-identitas.json) are checked here first, then by
 * Auth. The write goes through the one door the database leaves open: a
 * single-use permit for this user (password_write_permit, service-role), then
 * Auth's admin endpoint. The database's guard on auth.users consumes the
 * permit and records the step on the set-up row, in the hash's own
 * transaction. Without a permit, no session can set or change a password.
 * The password is never logged or echoed.
 */
export const dynamic = "force-dynamic";

const ALASAN_AUTH: Record<string, AlasanPasswordLemah> = { length: "PANJANG", characters: "KARAKTER", pwned: "BOCOR" };

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: true });
  if (!("supabase" in w)) return w;
  const password = w.fd?.get("password");
  if (typeof password !== "string") return jawab({ status: 422, body: { ok: false, code: "PASSWORD_LEMAH", alasan: ["PANJANG"] } });
  const cek = periksaPassword(password);
  if (cek.terlaluPanjang) return jawab({ status: 422, body: { ok: false, code: "PASSWORD_TERLALU_PANJANG" } });
  if (cek.alasan.length) return jawab({ status: 422, body: { ok: false, code: "PASSWORD_LEMAH", alasan: cek.alasan } });

  const layanan = supabaseService();
  const { error: galatIzin } = await layanan.rpc("password_write_permit", { p_auth_user: w.userId, p_purpose: "ACTIVATION" });
  if (galatIzin) {
    if (detailPr040(galatIzin) === "SETUP_NOT_REQUIRED") return jawab({ status: 409, body: { ok: false, code: "SETUP_SUDAH_SELESAI" } });
    return tidakTersedia("the password permit could not be given", galatIzin.code);
  }
  const { error } = await layanan.auth.admin.updateUserById(w.userId, { password });
  if (!error) return jawab({ status: 200, body: { ok: true } });
  if (error.code === "weak_password") {
    const alasan = ((error as { reasons?: string[] }).reasons ?? []).map((r) => ALASAN_AUTH[r]).filter(Boolean);
    return jawab({ status: 422, body: { ok: false, code: "PASSWORD_LEMAH", alasan: alasan.length ? [...new Set(alasan)] : ["PANJANG"] } });
  }
  return tidakTersedia("the password could not be set", error.code ?? String(error.status ?? ""));
}
