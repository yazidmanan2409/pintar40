import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseService } from "@/lib/supabase/service";
import { buildHeaders } from "@/lib/supabase/server";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_PEMULIHAN } from "@/lib/aktivasi-kontrak";
import { periksaKodePemulihan } from "@/lib/pemulihan";
import { akhiriSesiVerifikasi } from "@/lib/keluar";
import { jawab, kembaliKe } from "@/app/api/aktifkan/_jawab";
import { hashIzin, simpanIzin, tokenIzinBaru } from "../_izin";

/**
 * BOB-27: TYPE THE RECOVERY CODE, served at `/masuk/lupa/periksa` (rewritten
 * here; public). Counted per name before Auth is asked (CODE_VERIFY). A match
 * SIGNS NOBODY IN: Auth's verifyOtp runs on a client that keeps no session, the
 * session it makes is ended at once, and the browser gets the single-use,
 * ten-minute recovery grant instead. The decision is src/lib/pemulihan.ts.
 */
export const dynamic = "force-dynamic";

const BATAS_AUTH_MS = 10_000;

export async function GET() {
  return kembaliKe(HALAMAN_PEMULIHAN);
}

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  const layanan = supabaseService();
  let jeda: string | null = null;
  const rekam: typeof fetch = async (input, init) => {
    const batas = AbortSignal.timeout(BATAS_AUTH_MS);
    const r = await fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, batas]) : batas });
    if (r.status === 429) jeda = r.headers.get("retry-after");
    return r;
  };
  const sekali = createClient(publicSupabaseUrl(), publicSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: buildHeaders(), fetch: fetchBerpenerus(alamatKlien(request.headers), rekam) },
  });
  const hasil = await periksaKodePemulihan(
    { origin, nama: fd?.get("nama"), kode: fd?.get("kode") },
    {
      catat: async (kunci) => {
        const { data, error } = await layanan.rpc("identity_attempt", { p_scope: "CODE_VERIFY", p_kunci: kunci });
        if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
        return data;
      },
      selesaikan: async (kunci, h) => {
        const { error } = await layanan.rpc("identity_attempt_settle", { p_scope: "CODE_VERIFY", p_kunci: kunci, p_hasil: h });
        if (error) throw new Error(error.code ?? "refused");
      },
      sasaran: async (nama) => {
        const { data, error } = await layanan.rpc("recovery_code_target", { p_identitas: nama });
        if (error) throw new Error(error.code ?? "no answer");
        const r = Array.isArray(data) ? data[0] : null;
        if (!r?.auth_user_id) return null;
        const { data: pengguna } = await layanan.auth.admin.getUserById(String(r.auth_user_id));
        const email = pengguna?.user?.email;
        return email ? { authUserId: String(r.auth_user_id), email } : null;
      },
      verifikasi: async (email, kode) => {
        const { data, error } = await sekali.auth.verifyOtp({ email, token: kode, type: "email" });
        // the code proves the inbox; it is not a sign-in: the session it made ends here
        const token = data?.session?.access_token;
        if (token) await akhiriSesiVerifikasi(layanan, token).catch(() => undefined);
        return { error: error ? { status: error.status, code: error.code, name: error.name } : null, jeda };
      },
      beriIzin: async (authUserId) => {
        const token = tokenIzinBaru();
        const { error } = await layanan.rpc("recovery_grant_issue", { p_auth_user: authUserId, p_token_hash: hashIzin(token), p_via: "EMAIL" });
        if (error) throw new Error(error.code ?? "refused");
        await simpanIzin(token, request.nextUrl.protocol === "https:");
      },
      catatGalat: (ref, apa) => console.error(`[masuk/lupa/periksa] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
