import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { buatDrafAi, sebagaiRpc, type MasukDraf } from "@/lib/ai/jalur";
import { sasaranDalamKonteks, sekolahDari } from "@/lib/konteks-server";
import { BATAS_PANGGILAN_MS, penyedia } from "@/lib/ai/penyedia";

/**
 * C3w-1 · THE DRAFTING ROUTE (design §2 step 3). A thin wrapper: the order of steps is buatDrafAi's (src/lib/ai/jalur.ts,
 * C3W-R01). It lives under src/app/api because F01-S03 permits the service-role client only here, and outside
 * src/lib/ai because R3-07 holds that folder to its own imports.
 *
 * The split is certificate issuance's: the teacher's own client asks c3w_bahan (an invoker) and ai_minta_draf (a
 * definer reading current_person_id()), so every right is the database's, asked as the teacher; only the ledger and
 * the write run with the service client, and they take ids alone (D-1). Context-bound (§2.11): outside the package's
 * school, CONTEXT_OTHER_PLACE (409) and nothing is asked.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bacaMasuk(b: unknown): MasukDraf | null {
  if (typeof b !== "object" || b === null) return null;
  const o = b as Record<string, unknown>;
  const sumber = o.sumber === "PELAJARAN" ? "PELAJARAN" : o.sumber === "TEMPEL" ? "TEMPEL" : null;
  if (!sumber || typeof o.course !== "string" || !UUID.test(o.course) || typeof o.lesson !== "string" || !UUID.test(o.lesson)) return null;
  if (!Array.isArray(o.objectives) || o.objectives.some((x) => typeof x !== "string")) return null;
  if (typeof o.jumlah !== "number" || typeof o.kunci !== "string" || typeof o.hakSumber !== "boolean") return null;
  if (sumber === "TEMPEL" && typeof o.teks !== "string") return null;
  return {
    course: o.course, lesson: o.lesson, sumber, teks: sumber === "TEMPEL" ? String(o.teks) : undefined,
    objectives: o.objectives as string[], jumlah: o.jumlah, kunci: o.kunci, hakSumber: o.hakSumber,
  };
}

export async function POST(request: NextRequest) {
  const masuk = bacaMasuk(await request.json().catch(() => null));
  if (!masuk) return NextResponse.json({ ok: false, kode: "AI_PERMINTAAN_TIDAK_SAH" }, { status: 400 });

  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, kode: "DRAFT_NOT_ALLOWED" }, { status: 401 });

  // §2.11: a package is its school's, so it is drafted into only in that school's working context
  if (!(await sasaranDalamKonteks({ sekolah: await sekolahDari("kursus", masuk.course) }))) {
    return NextResponse.json({ ok: false, kode: "CONTEXT_OTHER_PLACE" }, { status: 409 });
  }

  const hasil = await buatDrafAi({
    pengguna: sebagaiRpc(caller), layanan: sebagaiRpc(supabaseService()), penyedia: penyedia(), batasMs: BATAS_PANGGILAN_MS,
  }, masuk);
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 422 });
}
