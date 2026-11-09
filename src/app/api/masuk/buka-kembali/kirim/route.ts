import { type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { alamatKlien } from "@/lib/auth-forwarding";
import { kunciIdentitas } from "@/lib/card";

/**
 * OWNER RULING 2 (9 Nov): «MINTA AKUN DIBUKA KEMBALI», served at `/masuk/buka-kembali/kirim` (next.config.ts rewrites it
 * here; the proxy lists it as public). A person whose account is closed cannot sign in, so the request is made signed
 * out: their sign-in email or PINTAR ID, and how they can be reached. minta_buka_kembali (service role, its one use
 * here) records it in the PINTAR Administrator's queue only for a closed account, and reopens nothing; the answer is the
 * same for every address, and no sooner than a fixed wait, so it tells no one whether an account exists. Flooding is
 * paced by the code requests' own pace (code_request_pace: one at a time, five an hour), keyed by the caller's address
 * through kunciIdentitas as recovery by PIN is, so no new mechanism. POST only, same origin only; the answer is a 303
 * back to the page by a relative address.
 */
export const dynamic = "force-dynamic";
const TUNGGU_MS = 800;

function kembali(q: Record<string, string>): Response {
  return new Response(null, { status: 303, headers: { Location: `/masuk/buka-kembali?${new URLSearchParams(q).toString()}` } });
}

export async function GET() {
  return kembali({});
}

export async function POST(request: NextRequest) {
  const mulai = Date.now();
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) return kembali({ kode: "DITOLAK" });
  const fd = await request.formData().catch(() => null);
  const identitas = String(fd?.get("identitas") ?? "").slice(0, 254);
  const pesan = String(fd?.get("pesan") ?? "").slice(0, 600);
  const layanan = supabaseService();
  const { data: tunggu, error: e0 } = await layanan.rpc("code_request_pace", { p_kunci: kunciIdentitas("buka-kembali-alamat", alamatKlien(request.headers) ?? "tanpa-alamat") });
  if (e0 || typeof tunggu !== "number") {
    console.error("[masuk/buka-kembali] code_request_pace failed", e0?.code);
    return kembali({ kode: "GAGAL" });
  }
  if (tunggu > 0) return kembali({ kode: "TUNGGU" });
  const { data, error } = await layanan.rpc("minta_buka_kembali", { p_identitas: identitas, p_pesan: pesan });
  const sisa = TUNGGU_MS - (Date.now() - mulai);
  if (sisa > 0) await new Promise((r) => setTimeout(r, sisa));
  if (error) {
    console.error("[masuk/buka-kembali] minta_buka_kembali failed", error.code);
    return kembali({ kode: "GAGAL" });
  }
  return (data as { ok?: boolean } | null)?.ok ? kembali({ hasil: "terkirim" }) : kembali({ kode: "ISIAN" });
}
