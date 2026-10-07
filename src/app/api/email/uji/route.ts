import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { GalatPengaturanEmail } from "../../_email/pengaturan";
import { GalatEmail, kirimEmail } from "../../_email/kirim";
import { templatUjiPengiriman } from "../../_email/uji";

export const runtime = "nodejs";

/**
 * BOB-25 (Gate 2E): ONE DELIVERABILITY PROOF, sent by a platform admin to an
 * inbox they name. It proves the deployed functions reach the host on 465 and
 * that the email arrives. It is the same path every PINTAR email takes, limits
 * and send log included.
 *
 *   POST /api/email/uji   { "ke": "<inbox>" }   (JSON, same origin)
 *
 * WHO. A signed-in person the database says is a platform admin
 * (is_system_admin, under their own token). The proxy has already turned away
 * anyone signed out. Anyone else gets 403 and nothing is sent or counted.
 *
 * THE ANSWER says whether the email was sent, and why not. Only a platform
 * admin reads it: a configuration error answers its code and the variable's
 * name, never an error message or a value.
 *
 * L3 (D-132(k)): AN EXPLICITLY PLATFORM-SCOPED OPERATION, governed by its own scope (the platform administrator, asked
 * of the database above), not by a session's working context. Its page is shown in «Seluruh platform» only.
 */
export async function POST(request: NextRequest) {
  const asal = request.headers.get("origin");
  if (!asal || asal !== request.nextUrl.origin) {
    return NextResponse.json({ terkirim: false, galat: "BUKAN_ASAL_SAMA" }, { status: 403 });
  }

  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return NextResponse.json({ terkirim: false, galat: "BELUM_MASUK" }, { status: 401 });
  const { data: adminPlatform } = await caller.rpc("is_system_admin");
  if (adminPlatform !== true) {
    return NextResponse.json({ terkirim: false, galat: "BUKAN_ADMIN_PLATFORM" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const ke = typeof body?.ke === "string" ? body.ke : "";

  try {
    const hasil = await kirimEmail({
      ke,
      jenis: "UJI_PENGIRIMAN",
      susun: (konteks) =>
        templatUjiPengiriman({ waktu: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC" }, konteks),
    });
    return NextResponse.json(hasil, { status: hasil.terkirim ? 200 : 502 });
  } catch (e) {
    if (e instanceof GalatPengaturanEmail) {
      // the code and which variable, both fixed strings; never a message or a value
      return NextResponse.json({ terkirim: false, galat: e.kode, variabel: e.variabel }, { status: 503 });
    }
    if (e instanceof GalatEmail) {
      return NextResponse.json({ terkirim: false, galat: "PERMINTAAN_TIDAK_SAH" }, { status: 400 });
    }
    return NextResponse.json({ terkirim: false, galat: "GAGAL" }, { status: 500 });
  }
}
