import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import { asalSendiri, masukDenganKartu, type HasilRuteKartu } from "@/lib/kartu-masuk";
import { tujuanMasuk } from "@/app/masuk/actions";

/**
 * BOB-12: THE CLASS CARD'S SIGN-IN, served at `/masuk/kartu` (next.config.ts
 * rewrites it here; the proxy lists `/masuk/kartu` as public). It lives under
 * src/app/api/ because the card's cooldown is service-role only (F01-S03): the
 * anonymous principal executes nothing. It replaces the server action
 * `signInWithCard`, which is gone, so the cooldown cannot be walked around.
 *
 * The decisions are src/lib/kartu-masuk.ts; the codes src/lib/kartu-kontrak.ts.
 * Always JSON, always no-store. On a match the session cookies are set on this
 * response, with a card's 60-minute lifetime (supabaseServer, BOB-05).
 */
export const dynamic = "force-dynamic";

/** A browser that lands here has nothing to see. */
export async function GET() {
  return new NextResponse(null, { status: 303, headers: { location: "/masuk", "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  // Auth's own wait, when its answer carries one
  let jeda: string | null = null;
  const rekam: typeof fetch = async (input, init) => {
    const r = await fetch(input, init);
    if (r.status === 429) jeda = r.headers.get("retry-after");
    return r;
  };
  const hasil = await masukDenganKartu(
    { origin, kartu: fd?.get("kartu"), pin: fd?.get("pin"), lanjut: fd?.get("lanjut") ?? null },
    {
      catat: async (kunci) => {
        const { data, error } = await supabaseService().rpc("card_signin_attempt", { p_kunci: kunci });
        if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
        return data;
      },
      selesaikan: async (kunci, hasil) => {
        const { error } = await supabaseService().rpc("card_signin_settle", { p_kunci: kunci, p_hasil: hasil });
        if (error) throw new Error(error.code ?? "refused");
      },
      masuk: async (email, password) => {
        const supabase = await supabaseServer({ fetch: fetchBerpenerus(alamatKlien(request.headers), rekam) });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? { status: error.status, code: error.code, name: error.name } : null, jeda };
      },
      tujuan: tujuanMasuk,
      catatGalat: (ref, apa) => console.error(`[masuk/kartu] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}

function jawab(h: HasilRuteKartu): NextResponse {
  const headers: Record<string, string> = { "cache-control": "no-store" };
  if (h.retryAfter) headers["retry-after"] = String(h.retryAfter);
  return NextResponse.json(h.body, { status: h.status, headers });
}
