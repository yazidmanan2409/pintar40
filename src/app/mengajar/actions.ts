"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kelas as kelasKonteks } from "@/lib/pengajar";
import { kodeGalatPenugasan } from "@/lib/penugasan-kontrak";
import { batasHari } from "@/lib/hle";

/**
 * THE EDUCATOR'S COMMITMENTS — every write the Slice-3 surface can make, and
 * there are exactly two.
 *
 * LOOKING IS NOT COMMITTING (ruled for the learner in Slice 2; the same rule
 * governs an educator here). No page under `/mengajar` writes anything while
 * rendering. Both stages that precede a commitment — "choose material" and
 * "review what learners receive" — are GET renders carrying their choices in
 * the query string, so a reload, a prefetch, a back button or a thumb brushing
 * a link cannot make something available to twenty-four children. The
 * commitment is a form POST into one of the two functions below, and each one
 * is reached by a button whose words repeat the verb.
 *
 * NOTHING HERE AUTHORIZES ANYTHING, and that is deliberate. The context check
 * at the top of each function is a presentation guard: it stops a mistyped or
 * stale class id from reaching the database with this educator's session
 * attached. It is NOT the authorization, and removing it would not grant
 * anybody anything:
 *
 *   sediakanMateri   → `assign_release` (BOB-04, D-008) refuses without
 *                      `can_in_institution('CAN_ASSIGN_LEARNING', …)`, and its
 *                      own DRAFT→ACTIVE update fires `enforce_assignment_status`,
 *                      which refuses the same way. It makes the learning
 *                      assignment and BOTH tests of the cycle, or nothing.
 *   sediakanUjiCepat → `launch_quick_assessment` refuses without
 *                      `can_on_node('CAN_QUICK_ASSESSMENT', p_node)`, which is
 *                      subtree-bound, and re-checks the item and minute bounds
 *                      itself.
 *
 * So the database decides, twice, and this module carries no privilege: it uses
 * the caller's own session and never imports the service-role client.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function bersih(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** A yyyy-mm-dd from a date input, or null. Never a parsed free-text date. */
function tanggal(v: FormDataEntryValue | null): string | null {
  const s = bersih(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * The only class ids this session may be sent back to.
 *
 * A redirect target is built from the teaching context rather than taken from
 * the form: a `kembali` field a caller controls is a redirect a caller
 * controls, and the learner side already carries that as an open finding. Here
 * the destination is derived, so there is nothing to validate.
 */
function ke(kelasId: string, sisa = ""): never {
  redirect(`/mengajar/${encodeURIComponent(kelasId)}${sisa}`);
}

// ────────────────────────────────────────────────────────── make material available
export async function sediakanMateri(formData: FormData): Promise<void> {
  const kelasId = bersih(formData.get("kelas"));
  const terbitan = bersih(formData.get("terbitan"));
  const kursus = bersih(formData.get("kursus"));
  const mulai = tanggal(formData.get("mulai"));
  const sampai = tanggal(formData.get("sampai"));
  if (!kelasId) redirect("/mengajar");

  const ctx = await kelasKonteks(kelasId);
  if (!ctx || !terbitan || !kursus) ke(kelasId);

  const db = (await supabaseServer()) as any;

  // THE COMMITMENT (BOB-04, D-008). One call: the learning assignment, born at
  // DRAFT and activated in its own statement inside assign_release, and the
  // cycle's two tests with it -- or a PR050 refusal and nothing at all. The
  // teacher is sent back to the review with the refusal's code, whose sentence
  // says what the lesson is missing.
  const { data, error } = await db.rpc("assign_release", {
    p_release: terbitan,
    p_node: kelasId,
    // DAISY-14 (M10): the teacher's days on the school's clock, not London's
    p_from: mulai ? batasHari(mulai, "awal") : null,
    p_until: sampai ? batasHari(sampai, "akhir") : null,
  });
  if (error || !data?.ok) {
    const kode = kodeGalatPenugasan(error);
    if (kode === "ASSIGN_FAILED") console.error("[sediakan] assign_release failed", error?.code, error?.message);
    ke(kelasId, `/siapkan?terbitan=${encodeURIComponent(terbitan)}&kode=${kode}`);
  }

  ke(kelasId, "?sedia=ok");
}

// ─────────────────────────────────────────────────────── launch a quick assessment
export async function sediakanUjiCepat(formData: FormData): Promise<void> {
  const kelasId = bersih(formData.get("kelas"));
  const bab = bersih(formData.get("bab"));
  const soal = Number(bersih(formData.get("soal")));
  const menit = Number(bersih(formData.get("menit")));
  if (!kelasId) redirect("/mengajar");

  const ctx = await kelasKonteks(kelasId);
  if (!ctx || !bab || !Number.isInteger(soal) || !Number.isInteger(menit)) {
    ke(kelasId, "/uji-cepat");
  }

  const db = (await supabaseServer()) as any;
  // One call. It creates the definition, draws against the bank, opens the
  // assignment and writes the audit line as one transaction — so a refusal
  // leaves nothing half-built and this function has no cleanup to get wrong.
  const { error } = await db.rpc("launch_quick_assessment", {
    p_node: kelasId,
    p_module: bab,
    p_item_count: soal,
    p_minutes: menit,
  });
  if (error) ke(kelasId, "/uji-cepat?cepat=gagal");
  ke(kelasId, "/uji-cepat");
}
