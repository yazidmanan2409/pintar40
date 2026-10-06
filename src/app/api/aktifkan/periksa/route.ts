import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { verifikasiKode } from "@/lib/aktivasi";
import { tujuanMasuk } from "@/app/masuk/actions";
import { jawab, kembaliKe } from "../_jawab";

/**
 * BOB-26: TYPE THE CODE, served at `/aktifkan/periksa` (rewritten here;
 * public). Counted per address before Auth is asked (BOB-24's CODE_VERIFY);
 * a match signs the email account in, with an email account's lifetime
 * (supabaseServer, D-009). The decision is src/lib/aktivasi.ts.
 */
export const dynamic = "force-dynamic";

const BATAS_AUTH_MS = 10_000;

export async function GET() {
  return kembaliKe(HALAMAN_AKTIVASI);
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
  const supabase = await supabaseServer({ fetch: fetchBerpenerus(alamatKlien(request.headers), rekam) });
  const hasil = await verifikasiKode(
    { origin, email: fd?.get("email"), kode: fd?.get("kode") },
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
      verifikasi: async (email, kode) => {
        const { error } = await supabase.auth.verifyOtp({ email, token: kode, type: "email" });
        return { error: error ? { status: error.status, code: error.code, name: error.name } : null, jeda };
      },
      keadaan: async () => {
        const { data } = await supabase.rpc("my_setup_state");
        return typeof data === "string" ? data : "REQUIRED";
      },
      tujuan: tujuanMasuk,
      catatGalat: (ref, apa) => console.error(`[aktifkan/periksa] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
