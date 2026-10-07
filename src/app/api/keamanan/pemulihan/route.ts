import { after, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import { kanonikPintarId } from "@/lib/aktivasi-kontrak";
import { STATUS_PEMULIHAN_ADMIN, type KodePemulihanAdmin, type StatusPemulihan } from "@/lib/keamanan-kontrak";
import { kirimPemberitahuanKeamanan } from "@/app/api/_email/keamanan";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";
import { sasaranDalamKonteks, sekolahOrang } from "@/lib/konteks-server";

/**
 * BOB-28 (C5 path (2)), D-101 (1)(3): THE NEAREST AUTHORITY'S AUDITED RESET OF
 * A PERSON'S PIN RECOVERY. GET ?id= looks one PINTAR ID up (recovery_status);
 * POST resets it with a stated reason (admin_reset_recovery, BOB-24: the ladder
 * to 0, a new PIN required, every session of the person ended, audited with the
 * reason and the school that acted). Both ask the database with the CALLER's
 * own client, which admits the Platform Admin, or a School Admin for a person
 * their school has, and refuses one's own ID (SENDIRI). The
 * service key reads one thing after a reset: the owner's account, to tell them
 * (C7); the security recipient is told too.
 *
 * §2.11 (D-132(k)): the reset's person is of the working context's school (any school's under «Seluruh platform»).
 * A narrowing, never a permit. Otherwise the route's own «reload this page» (PERMINTAAN_DITOLAK), marked
 * CONTEXT_OTHER_PLACE, and nothing is reset.
 */
export const dynamic = "force-dynamic";

function gagal(code: KodePemulihanAdmin, apa?: string) {
  const body: Record<string, unknown> = { ok: false, code };
  if (apa) {
    body.ref = rujukan();
    console.error(`[keamanan/pemulihan ${body.ref}] ${apa}`);
  }
  return jawab({ status: STATUS_PEMULIHAN_ADMIN[code], body });
}

type Klien = Awaited<ReturnType<typeof supabaseServer>>;

async function status(caller: Klien, pintarId: string): Promise<StatusPemulihan | KodePemulihanAdmin> {
  const { data, error } = await caller.rpc("recovery_status", { p_typed_id: pintarId });
  if (error) {
    if (detailPr040(error) === "RECOVERY_SELF") return "SENDIRI";
    return error.code === "42501" ? "DITOLAK" : "LAYANAN_TIDAK_TERSEDIA";
  }
  const r = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
  if (!r) return "TIDAK_ADA";
  return {
    personId: String(r.person_id), nama: String(r.display_name ?? ""), pintarId: String(r.pintar_id),
    keadaan: (["NORMAL", "LOCKED", "SUSPENDED"].includes(String(r.state)) ? r.state : "NORMAL") as StatusPemulihan["keadaan"],
    terkunciSampai: typeof r.locked_until === "string" ? r.locked_until : null,
    pinBaruDitunggu: r.new_pin_required === true, akunEmail: r.has_email_account === true,
  };
}

export async function GET(request: NextRequest) {
  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return gagal("BELUM_MASUK");
  const pintarId = kanonikPintarId(request.nextUrl.searchParams.get("id"));
  if (!pintarId) return gagal("ID_TIDAK_SAH");
  const s = await status(caller, pintarId);
  if (typeof s === "string") return gagal(s, s === "LAYANAN_TIDAK_TERSEDIA" ? "recovery_status could not be asked" : undefined);
  return jawab({ status: 200, body: { ok: true, status: s } });
}

export async function POST(request: NextRequest) {
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) return gagal("PERMINTAAN_DITOLAK");
  const body = (await request.json().catch(() => null)) as { id?: unknown; alasan?: unknown } | null;
  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return gagal("BELUM_MASUK");
  const pintarId = kanonikPintarId(body?.id);
  if (!pintarId) return gagal("ID_TIDAK_SAH");
  const alasan = typeof body?.alasan === "string" ? body.alasan.trim() : "";
  if (!alasan || alasan.length > 500) return gagal("ALASAN_KOSONG");
  const s = await status(caller, pintarId);
  if (typeof s === "string") return gagal(s, s === "LAYANAN_TIDAK_TERSEDIA" ? "recovery_status could not be asked" : undefined);
  if (!(await sasaranDalamKonteks({ sekolah: await sekolahOrang(s.personId), atauPlatform: true }))) {
    return jawab({ status: STATUS_PEMULIHAN_ADMIN.PERMINTAAN_DITOLAK, body: { ok: false, code: "PERMINTAAN_DITOLAK", sebab: "CONTEXT_OTHER_PLACE" } });
  }
  const { error } = await caller.rpc("admin_reset_recovery", { p_person: s.personId, p_reason: alasan });
  if (error) {
    if (error.code === "42501") return gagal("DITOLAK");
    if (detailPr040(error) === "RECOVERY_SELF") return gagal("SENDIRI");
    if (detailPr040(error) === "REASON_REQUIRED") return gagal("ALASAN_KOSONG");
    return gagal("LAYANAN_TIDAK_TERSEDIA", `admin_reset_recovery refused (${error.code})`);
  }
  const { data: akun } = await supabaseService().from("accounts").select("auth_user_id")
    .eq("person_id", s.personId).eq("kind", "EMAIL").limit(1).maybeSingle();
  const pemilik = akun?.auth_user_id ? String(akun.auth_user_id) : null;
  after(() => kirimPemberitahuanKeamanan("DIATUR_ULANG", s.pintarId, pemilik).catch((e) =>
    console.error(`[keamanan/pemulihan] the reset's notice was not sent: ${e instanceof Error ? e.name : "unknown"}`)));
  const sesudah = await status(caller, pintarId);
  return jawab({ status: 200, body: { ok: true, status: typeof sesudah === "string" ? s : sesudah } });
}
