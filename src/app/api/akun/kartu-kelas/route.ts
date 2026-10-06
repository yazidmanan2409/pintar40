import type { NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { cardEmail, deriveCardSecret } from "@/lib/card";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import { ALASAN_KARTU_ULANG, STATUS_KARTU_ULANG, type JawabanKartuUlang, type KodeKartuUlang } from "@/lib/kartu-ulang-kontrak";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";

/**
 * BOB-28 (D-088(e)): RE-ISSUE A LOST OR DAMAGED CLASS CARD.
 *
 * THE SPLIT, activation's. The DATABASE decides, with the CALLER's own client
 * (authorize_card_reissue: CAN_PROVISION_PEOPLE in the learner's school, or a
 * SYSTEM_ADMIN), and writes a two-minute re-issue grant and a one-minute
 * password permit. Only then does this route use the service key, for one
 * thing: Auth's admin write that moves the card's sign-in address to the new
 * number and sets the new PIN's derived password. Auth ends every session of
 * the old card; the guards on auth.users consume the grant and the permit,
 * move accounts.card_number and audit the re-issue in Auth's own transaction.
 * The same account stays: the same person, sign-in identity and history.
 * The PIN leaves once, in this answer, and is never stored.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function gagal(code: KodeKartuUlang, apa?: string) {
  const body: JawabanKartuUlang = { ok: false, code };
  if (apa) {
    const ref = rujukan();
    console.error(`[akun/kartu-kelas ${ref}] ${apa}`);
    Object.assign(body, { ref });
  }
  return jawab({ status: STATUS_KARTU_ULANG[code], body });
}

export async function POST(request: NextRequest) {
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) return gagal("PERMINTAAN_DITOLAK");
  const body = (await request.json().catch(() => null)) as { person_id?: unknown; alasan?: unknown } | null;
  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return gagal("BELUM_MASUK");
  const person = String(body?.person_id ?? "");
  const alasan = String(body?.alasan ?? "");
  if (!UUID.test(person) || !(ALASAN_KARTU_ULANG as readonly string[]).includes(alasan)) return gagal("ALASAN_TIDAK_SAH");

  const layanan = supabaseService();
  // a fresh number until one is free; each is granted before Auth is asked
  for (let percobaan = 0; percobaan < 5; percobaan++) {
    const card = String(randomInt(1_000_000_000, 9_999_999_999));
    const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { data, error } = await caller.rpc("authorize_card_reissue", { p_person: person, p_reason: alasan, p_new_card: card });
    if (error) {
      const d = detailPr040(error);
      if (d === "CARD_NUMBER_TAKEN") continue;
      if (d === "CARD_NOT_FOUND") return gagal("KARTU_TIDAK_ADA");
      if (d === "REASON_INVALID") return gagal("ALASAN_TIDAK_SAH");
      if (error.code === "42501") return gagal("DITOLAK");
      return gagal("LAYANAN_TIDAK_TERSEDIA", `authorize_card_reissue refused (${error.code})`);
    }
    const r = Array.isArray(data) ? (data[0] as { auth_user_id?: string; display_name?: string } | undefined) : undefined;
    if (!r?.auth_user_id) return gagal("LAYANAN_TIDAK_TERSEDIA", "authorize_card_reissue gave no account");
    const { error: tulis } = await layanan.auth.admin.updateUserById(r.auth_user_id, {
      email: cardEmail(card), password: deriveCardSecret(card, pin), email_confirm: true,
    });
    if (!tulis) {
      const jadi: JawabanKartuUlang = { ok: true, kartu: { nama: String(r.display_name ?? ""), card, pin } };
      return jawab({ status: 200, body: jadi });
    }
    if (!/already|exists|registered/i.test(tulis.message)) {
      return gagal("LAYANAN_TIDAK_TERSEDIA", `Auth could not move the card (${tulis.code ?? tulis.status})`);
    }
  }
  return gagal("LAYANAN_TIDAK_TERSEDIA", "no free card number in five tries");
}
