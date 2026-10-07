import { after, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import { KODE_DARI_DB, STATUS_KOREKSI_EMAIL, type JawabanKoreksiEmail, type KodeKoreksiEmail } from "@/lib/koreksi-email-kontrak";
import { kirimPemberitahuanKeamanan } from "@/app/api/_email/keamanan";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";

/**
 * CR-13 (D-120 QN1): CORRECT A STAFF MEMBER'S WRONG EMAIL.
 *
 * THE SPLIT, the card re-issue's. The DATABASE decides, with the CALLER's own
 * client (authorize_email_correction: before activation CAN_PROVISION_PEOPLE in
 * the person's school or the platform admin, after it the platform admin only;
 * a reason always), and writes a two-minute grant for exactly the new address.
 * Only then does this route use the service key, for one thing: Auth's admin
 * write that moves the address. The guard on auth.users consumes the grant,
 * ends every outstanding code and session, undoes a set-up begun before
 * activation and audits the correction, in Auth's own transaction. After
 * activation the old and the new address are told, and PINTAR's security
 * recipient, after the answer has gone.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function gagal(code: KodeKoreksiEmail, apa?: string) {
  const body: JawabanKoreksiEmail = { ok: false, code };
  if (apa) {
    const ref = rujukan();
    console.error(`[akun/email ${ref}] ${apa}`);
    Object.assign(body, { ref });
  }
  return jawab({ status: STATUS_KOREKSI_EMAIL[code], body });
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

  const { data, error } = await caller.rpc("authorize_email_correction", { p_person: person, p_email: email, p_reason: alasan });
  if (error) {
    const d = detailPr040(error);
    if (d && d in KODE_DARI_DB) return gagal(KODE_DARI_DB[d]);
    if (error.code === "42501") return gagal("DITOLAK");
    return gagal("LAYANAN_TIDAK_TERSEDIA", `authorize_email_correction refused (${error.code})`);
  }
  const r = Array.isArray(data)
    ? (data[0] as { auth_user_id?: string; old_email?: string; activated?: boolean; pintar_id?: string | null } | undefined)
    : undefined;
  if (!r?.auth_user_id) return gagal("LAYANAN_TIDAK_TERSEDIA", "authorize_email_correction gave no account");
  const { error: tulis } = await supabaseService().auth.admin.updateUserById(r.auth_user_id, { email, email_confirm: true });
  if (tulis) return gagal("LAYANAN_TIDAK_TERSEDIA", `Auth could not move the address (${tulis.code ?? tulis.status})`);
  if (r.activated === true && r.pintar_id) {
    const { pintar_id: pintarId, old_email: lama, auth_user_id: pemilik } = r;
    after(() => kirimPemberitahuanKeamanan("EMAIL_DIKOREKSI", pintarId, pemilik, lama ?? null).catch((e) =>
      console.error(`[akun/email] the correction's notices failed: ${e instanceof Error ? e.name : "unknown"}`)));
  }
  const jadi: JawabanKoreksiEmail = { ok: true, sudahAktif: r.activated === true };
  return jawab({ status: 200, body: jadi });
}
