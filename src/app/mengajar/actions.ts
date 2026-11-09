"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kelas as kelasKonteks } from "@/lib/pengajar";
import { kodeGalatPenugasan } from "@/lib/penugasan-kontrak";
import { batasHari } from "@/lib/hle";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { alamatTolakUjiCepat, kodeUjiCepat } from "@/lib/ujicepat-kontrak";
import { rujukan } from "@/lib/galat-kontrak";
import { kodeUlang } from "@/lib/ulang-kontrak";

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

/** The shape of an id; anything else from a form is dropped before it reaches the database. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // Sharon F1: and on that school's own clock (WIB, WITA or WIT)
    p_from: mulai ? batasHari(mulai, "awal", await zonaSekolah(db, ctx!.ini.institusi)) : null,
    p_until: sampai ? batasHari(sampai, "akhir", await zonaSekolah(db, ctx!.ini.institusi)) : null,
  });
  if (error || !data?.ok) {
    const kode = kodeGalatPenugasan(error);
    if (kode === "ASSIGN_FAILED") console.error("[sediakan] assign_release failed", error?.code, error?.message);
    // W3.11 (J5): the dates the teacher chose go back with the refusal, so the form reopens with them (each already
    // read as a yyyy-mm-dd above, or dropped) and a refusal about the window is told under its field
    const q = new URLSearchParams({ terbitan, kode });
    if (mulai) q.set("mulai", mulai);
    if (sampai) q.set("sampai", sampai);
    ke(kelasId, `/siapkan?${q.toString()}`);
  }

  // W3.11 (J1 part two): «Menyediakan…», then «✓ Disediakan» at the button that sent it and the line with the window
  // in words, then the way on to the class. The review reads back what the database now holds before it says so.
  ke(kelasId, `/siapkan?disediakan=${encodeURIComponent(terbitan)}`);
}

// ───────────────────────────────────────── W2.21: end or withdraw an assignment on the record
/**
 * `akhiri_penugasan` decides everything: CAN_ASSIGN_LEARNING over the class the lesson was given to, the kind, the
 * reason, and the open sittings (refused ASSIGN_IN_PROGRESS unless the teacher ticked the confirmation). This action
 * only passes the form on and returns the teacher to the class page with the outcome.
 */
export async function akhiriPenugasanAction(formData: FormData): Promise<void> {
  const kelasId = bersih(formData.get("kelas"));
  const penugasan = bersih(formData.get("penugasan"));
  const jenis = bersih(formData.get("jenis"));
  const alasan = bersih(formData.get("alasan"));
  const konfirmasi = formData.get("akhiri_berjalan") === "ya";
  if (!kelasId || !UUID.test(kelasId)) redirect("/mengajar");
  if (!UUID.test(penugasan)) ke(kelasId);

  const ctx = await kelasKonteks(kelasId);
  if (!ctx) ke(kelasId);

  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("akhiri_penugasan", {
    p_la: penugasan, p_jenis: jenis, p_alasan: alasan, p_akhiri_yang_berjalan: konfirmasi,
  });
  if (error) {
    const kode = kodeGalatPenugasan(error);
    if (kode === "ASSIGN_FAILED") console.error("[akhiri] akhiri_penugasan failed", error?.code, error?.message);
    ke(kelasId, `?${new URLSearchParams({ akhiri: penugasan, kode }).toString()}#akhiri`);
  }
  ke(kelasId, "?diakhiri=ok#materi");
}

// ─────────────────────────────────────────────────────── launch a quick assessment
export async function sediakanUjiCepat(formData: FormData): Promise<void> {
  const kelasId = bersih(formData.get("kelas"));
  const bab = bersih(formData.get("bab"));
  // D-085 T2: the questions the teacher ticked and reviewed, comma-joined; the database checks each one again
  const butir = bersih(formData.get("butir")).split(",").map((x) => x.trim()).filter((x) => UUID.test(x));
  const menit = Number(bersih(formData.get("menit")));
  if (!kelasId) redirect("/mengajar");

  const ctx = await kelasKonteks(kelasId);
  if (!ctx || !bab || !Number.isInteger(menit)) {
    ke(kelasId, "/uji-cepat");
  }

  const db = (await supabaseServer()) as any;
  // One call. It launches as launch_quick_assessment always did, checks every chosen question against the
  // instrument's own eligible set, stores the choice and writes the audit lines as one transaction, so a refusal
  // leaves nothing half-built and this function has no cleanup to get wrong.
  const { error } = await db.rpc("launch_selected_quick_assessment", {
    p_node: kelasId,
    p_module: bab,
    p_items: butir,
    p_minutes: menit,
  });
  // BOB-32 (UX-03, D-011): the refusal's cause as a code, so the page can say
  // which it was; one nobody named also carries a reference, logged here.
  // BOB-34: and the teacher's own choices, as they sent them, so the form
  // reopens with them instead of resetting.
  if (error) {
    const kode = kodeUjiCepat(error);
    const pilihan = { bab, butir: bersih(formData.get("butir")), menit: bersih(formData.get("menit")) };
    if (kode !== "QUICK_FAILED") ke(kelasId, alamatTolakUjiCepat(kode, pilihan));
    const ref = rujukan();
    console.error(`[uji-cepat ${ref}] launch_selected_quick_assessment failed`, error.code, error.message);
    ke(kelasId, alamatTolakUjiCepat(kode, pilihan, ref));
  }
  ke(kelasId, "/uji-cepat?cepat=ok");
}

/**
 * D-085 M3 (J5.12): «Minta membaca lagi». The learners and lessons the teacher ticked go to request_lesson_review,
 * which decides again: the class's own teacher, learners placed in the class now, lessons of that chapter. A refusal
 * comes back as its code (PR050 with REVIEW_* in DETAIL), one nobody named with a reference the server log carries.
 */
export async function mintaBacaUlang(formData: FormData): Promise<void> {
  const kelasId = bersih(formData.get("kelas"));
  const penugasan = bersih(formData.get("penugasan"));
  const tugas = bersih(formData.get("tugas"));
  if (!kelasId) redirect("/mengajar");
  if (!UUID.test(tugas) || !UUID.test(penugasan)) ke(kelasId, "/bukti");
  const pilih = (k: string) => [...new Set(formData.getAll(k).map((v) => bersih(v)).filter((x) => UUID.test(x)))];
  const murid = pilih("murid");
  const pelajaran = pilih("pelajaran");
  // §2.11 (D-132(k)): the class is the active context's, as for the two acts above; the database still decides
  if (!(await kelasKonteks(kelasId))) ke(kelasId, "/bukti");

  const db = (await supabaseServer()) as any;
  const { data, error } = await db.rpc("request_lesson_review", { p_learning_assignment: tugas, p_people: murid, p_lessons: pelajaran });
  const q = new URLSearchParams({ penugasan });
  if (error) {
    const kode = kodeUlang(error);
    q.set("ulang", "gagal");
    q.set("kode", kode);
    if (kode === "REVIEW_FAILED") {
      const ref = rujukan();
      console.error(`[ulang ${ref}] request_lesson_review failed`, error.code, error.message);
      q.set("ref", ref);
    }
  } else {
    q.set("ulang", "ok");
    q.set("n", String(Number(data) || 0));
  }
  ke(kelasId, `/ulang?${q.toString()}`);
}
