import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import {
  KODE_KARTU_JADI_EMAIL_DARI_DB, STATUS_KARTU_JADI_EMAIL, type JawabanKartuJadiEmail, type KodeKartuJadiEmail,
} from "@/lib/kartu-jadi-email-kontrak";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";

/**
 * D-152(a) (Batch 4): A CLASS-CARD LEARNER WHO BECOMES STAFF GETS AN EMAIL ACCOUNT, AS THE SAME PERSON.
 *
 * THE SPLIT, the card re-issue's and the email correction's. The DATABASE decides, with the CALLER's own client
 * (authorize_card_conversion: CAN_PROVISION_PEOPLE in the learner's school or the platform admin; a reason; an unused
 * address; a person who holds a class card), and writes a two-minute grant for exactly that address. Only then does
 * this route use the service key, for one thing: Auth's admin write that moves the card's sign-in address to the new
 * address. The card guard on auth.users consumes the grant and, in Auth's own transaction, makes the same account an
 * email account whose set-up is REQUIRED, clears the card's PIN, ends every session and audits the conversion.
 * Nothing is sent from here: the person asks for their activation code at /aktifkan, as every staff member does.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function gagal(code: KodeKartuJadiEmail, apa?: string) {
  const body: JawabanKartuJadiEmail = { ok: false, code };
  if (apa) {
    const ref = rujukan();
    console.error(`[akun/kartu-ke-email ${ref}] ${apa}`);
    Object.assign(body, { ref });
  }
  return jawab({ status: STATUS_KARTU_JADI_EMAIL[code], body });
}

export async function POST(request: NextRequest) {
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) return gagal("PERMINTAAN_DITOLAK");
  const body = (await request.json().catch(() => null)) as { person_id?: unknown; email?: unknown; alasan?: unknown } | null;
  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return gagal("BELUM_MASUK");
  const person = String(body?.person_id ?? "");
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const alasan = typeof body?.alasan === "string" ? body.alasan : "";
  if (!UUID.test(person) || !email) return gagal("PERMINTAAN_TIDAK_SAH");

  const { data, error } = await caller.rpc("authorize_card_conversion", { p_person: person, p_email: email, p_reason: alasan });
  if (error) {
    const d = detailPr040(error);
    if (d && d in KODE_KARTU_JADI_EMAIL_DARI_DB) return gagal(KODE_KARTU_JADI_EMAIL_DARI_DB[d]);
    if (error.code === "42501") return gagal("DITOLAK");
    return gagal("LAYANAN_TIDAK_TERSEDIA", `authorize_card_conversion refused (${error.code})`);
  }
  const r = Array.isArray(data) ? (data[0] as { auth_user_id?: string } | undefined) : undefined;
  if (!r?.auth_user_id) return gagal("LAYANAN_TIDAK_TERSEDIA", "authorize_card_conversion gave no account");
  const { error: tulis } = await supabaseService().auth.admin.updateUserById(r.auth_user_id, { email, email_confirm: true });
  if (tulis) return gagal("LAYANAN_TIDAK_TERSEDIA", `Auth could not move the address (${tulis.code ?? tulis.status})`);
  const jadi: JawabanKartuJadiEmail = { ok: true, email };
  return jawab({ status: 200, body: jadi });
}
