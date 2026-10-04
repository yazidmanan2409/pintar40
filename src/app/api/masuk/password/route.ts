import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import { asalSendiri } from "@/lib/kartu-masuk";
import { masukPassword } from "@/lib/aktivasi";
import { tujuanMasuk } from "@/app/masuk/actions";
import { jawab, kembaliKe } from "@/app/api/aktifkan/_jawab";

/**
 * BOB-26: SIGN IN WITH AN EMAIL OR A USERNAME AND A PASSWORD, served at
 * `/masuk/password` (next.config.ts rewrites it here; the proxy lists it as
 * public). Under src/app/api/ because the name's resolution and the backoff
 * are service-role (F01-S03): anon executes nothing, and the sign-in screen's
 * server actions stay free of any account lookup (L2-KONTRAK-01).
 *
 * The username is resolved here only (C9). Every failure is one code, counted
 * per account, and answered no sooner than a fixed floor (src/lib/aktivasi.ts).
 */
export const dynamic = "force-dynamic";

const BATAS_AUTH_MS = 10_000;

export async function GET() {
  return kembaliKe("/masuk");
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
  const hasil = await masukPassword(
    { origin, identitas: fd?.get("identitas"), password: fd?.get("password"), lanjut: fd?.get("lanjut") ?? null },
    {
      resolusi: async (identitas) => {
        const { data, error } = await layanan.rpc("signin_resolve", { p_identitas: identitas });
        if (error) throw new Error(error.code ?? "no answer");
        return typeof data === "string" && data ? data : null;
      },
      catat: async (kunci) => {
        const { data, error } = await layanan.rpc("identity_attempt", { p_scope: "PASSWORD_SIGNIN", p_kunci: kunci });
        if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
        return data;
      },
      selesaikan: async (kunci, h) => {
        const { error } = await layanan.rpc("identity_attempt_settle", { p_scope: "PASSWORD_SIGNIN", p_kunci: kunci, p_hasil: h });
        if (error) throw new Error(error.code ?? "refused");
      },
      masuk: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? { status: error.status, code: error.code, name: error.name } : null, jeda };
      },
      keadaan: async () => {
        const { data } = await supabase.rpc("my_setup_state");
        return typeof data === "string" ? data : "REQUIRED";
      },
      tujuan: tujuanMasuk,
      tunggu: (ms) => new Promise((r) => setTimeout(r, ms)),
      sekarang: () => performance.now(),
      catatGalat: (ref, apa) => console.error(`[masuk/password] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
