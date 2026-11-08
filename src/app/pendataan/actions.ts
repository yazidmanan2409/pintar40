"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { wajibDalamKonteks } from "@/lib/konteks-server";
import type { Kemajuan } from "@/lib/pendataan-kontrak";

/**
 * THE SIX ACTS OF AN INTAKE, AND EVERY ONE OF THEM IS A WP5A CALL.
 *
 * Nothing here decides anything. Authorization is `CAN_PROVISION_PEOPLE`
 * checked inside each endpoint; validation is `import_row_problems`;
 * confirmation revalidates the world as it is now; the pilot ceiling lives in
 * `import_advance`; and every number comes back from `import_progress`. This
 * file carries requests and turns refusals into sentences.
 *
 * ═══ THE LOST RESPONSE, WHICH IS THE HARD PART ═══
 *
 * A request can succeed at the database and the response can still be lost —
 * the laptop sleeps, the tunnel drops, the proxy times out. The browser then
 * knows nothing, and the one thing it must not do is conclude "failed":
 * `import_confirm` may have committed, fifty people may exist,
 * `import_verify_pilot` may already have released the remainder.
 *
 * So no action in this file reports failure from a thrown error alone. Each
 * one RE-READS `import_progress` and lets the durable state answer. If the
 * write landed, the re-read shows it and the administrator simply carries on;
 * if it did not, the re-read shows the earlier state and the same button is
 * still there. WP5A makes that safe from its side too — confirming twice is
 * one confirmation and verifying twice is one verification, both answered
 * before anything moves.
 */

async function progress(pekerjaan: string): Promise<Kemajuan | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("import_progress", { p_job: pekerjaan });
  if (error || !data) return null;
  return data as Kemajuan;
}

/**
 * §2.11 (D-132(k)): AN INTAKE'S ACT, ITS SCHOOL IN THE ACTIVE CONTEXT. The job's school is `import_progress`'s own
 * answer; a job this person may not see has none, and the endpoint refuses it as before.
 */
async function pekerjaanDalamKonteks(pekerjaan: string): Promise<void> {
  await wajibDalamKonteks({ sekolah: (await progress(pekerjaan))?.institution_id ?? null });
}

/** The school's three-character code. Refused once one ID has been issued. */
export async function simpanKodeAksi(formData: FormData): Promise<void> {
  const institusi = String(formData.get("institusi") ?? "").trim();
  const kode = String(formData.get("kode") ?? "").trim();
  if (!institusi || !kode) redirect("/pendataan?galat=kode");
  await wajibDalamKonteks({ sekolah: institusi });

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("reserve_institution_namespace", {
    p_institution: institusi,
    p_namespace: kode,
  });
  // A code somebody else already holds, a code of the wrong shape, and a
  // school that has already issued IDs are three different refusals from the
  // database; the screen tells them apart by asking again rather than by
  // guessing here.
  if (error) redirect(`/pendataan?galat=kode&kenapa=${encodeURIComponent(kode)}`);
  revalidatePath("/pendataan");
  // Daisy (8 Nov): a saved code says so, and where the list goes next
  redirect("/pendataan?kode=tersimpan");
}

/**
 * THE MAPPED FILE BECOMES A DRAFT JOB — and provisions nothing. `import_open`
 * writes `import_rows` in state PENDING and leaves the job DRAFT; no person, no
 * identity, no membership and no role exists yet, which is what lets an
 * administrator change their mind on the next screen.
 */
export async function bukaPendataanAksi(formData: FormData): Promise<void> {
  const institusi = String(formData.get("institusi") ?? "").trim();
  const mentah = String(formData.get("baris") ?? "");
  if (!institusi || !mentah) redirect("/pendataan?galat=baris");

  let baris: unknown;
  try {
    baris = JSON.parse(mentah);
  } catch {
    redirect("/pendataan?galat=baris");
  }
  if (!Array.isArray(baris) || baris.length === 0) redirect("/pendataan?galat=baris");
  await wajibDalamKonteks({ sekolah: institusi });

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("import_open", {
    p_institution: institusi,
    p_rows: baris,
  });
  if (error || !data) redirect("/pendataan?galat=baris");
  revalidatePath("/pendataan");
  redirect(`/pendataan/${String(data)}`);
}

export type HasilPeriksa = {
  ok: boolean;
  /** Present when the check itself could not run, rather than when rows failed. */
  galat?: string;
  rows: Array<{ ordinal: number; ok: boolean; problems: string[] }>;
};

/**
 * VALIDATION, WHICH TOUCHES NOTHING DURABLE EXCEPT THE JOB'S OWN STATE.
 *
 * Returns the per-row findings to the caller instead of redirecting, because
 * §6 wants a problem tied to the row it is about and a redirect has nowhere to
 * put fifty of them. No row is discarded: a row that fails is reported against
 * its ordinal and stays in the job, so the administrator fixes their file and
 * starts a new intake rather than silently provisioning the survivors.
 */
export async function periksaAksi(pekerjaan: string): Promise<HasilPeriksa> {
  await pekerjaanDalamKonteks(pekerjaan);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("import_validate", { p_job: pekerjaan });
  if (error || !data) return { ok: false, galat: "tak_terbaca", rows: [] };
  const hasil = data as { ok?: boolean; rows?: Array<{ ordinal: number; ok: boolean; problems: string[] }> };
  return {
    ok: hasil.ok === true,
    rows: Array.isArray(hasil.rows) ? hasil.rows : [],
  };
}

/**
 * THE HUMAN SAYS GO — and WP5A revalidates the world as it is now rather than
 * trusting the preview. §20: a node may have moved, a grant may have been
 * revoked, somebody else may have provisioned the same person since the
 * preview was drawn. If that revalidation refuses, the refusal is NOT
 * suppressed: the administrator is returned to the job in a state they can
 * understand and correct from.
 */
export async function konfirmasiAksi(formData: FormData): Promise<void> {
  const pekerjaan = String(formData.get("pekerjaan") ?? "").trim();
  if (!pekerjaan) redirect("/pendataan");
  await pekerjaanDalamKonteks(pekerjaan);

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("import_confirm", { p_job: pekerjaan });
  if (error) {
    // THE RE-READ, NOT A VERDICT. The confirmation may have committed and the
    // answer been lost; only durable state knows. A job that is now importing
    // needs no second confirmation and gets no error screen.
    const k = await progress(pekerjaan);
    if (k && k.confirmed_at) redirect(`/pendataan/${pekerjaan}`);
    redirect(`/pendataan/${pekerjaan}?galat=konfirmasi`);
  }
  revalidatePath(`/pendataan/${pekerjaan}`);
  redirect(`/pendataan/${pekerjaan}`);
}

/**
 * THE HUMAN HAS LOOKED AT THE FIFTY. This is the only thing that releases the
 * remainder — never a timer, never a page that stayed open, never a count that
 * looked right.
 */
export async function periksaPercontohanAksi(formData: FormData): Promise<void> {
  const pekerjaan = String(formData.get("pekerjaan") ?? "").trim();
  if (!pekerjaan) redirect("/pendataan");
  await pekerjaanDalamKonteks(pekerjaan);

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("import_verify_pilot", { p_job: pekerjaan });
  if (error) {
    // Same reasoning as confirmation, and it matters more here: a lost
    // response after a successful verification must not make an administrator
    // verify a second time, so the re-read asks whether it is already done.
    const k = await progress(pekerjaan);
    if (k && k.pilot_verified) redirect(`/pendataan/${pekerjaan}`);
    redirect(`/pendataan/${pekerjaan}?galat=percontohan`);
  }
  revalidatePath(`/pendataan/${pekerjaan}`);
  redirect(`/pendataan/${pekerjaan}`);
}

/**
 * ONE CHUNK, AND THEN THE TRUTH ABOUT WHERE THE JOB STANDS.
 *
 * Returns `import_progress`'s own answer — never a number this function
 * composed. On an error it returns the RE-READ rather than null, because a
 * chunk may have committed and the response been lost; the caller then sees
 * completed go up and carries on, which is exactly what should happen.
 *
 * It does not loop. The pilot ceiling and the state machine live in
 * `import_advance`, and a loop in here would be this file deciding how far an
 * import gets.
 */
export async function majukanAksi(pekerjaan: string): Promise<Kemajuan | null> {
  await pekerjaanDalamKonteks(pekerjaan);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("import_advance", { p_job: pekerjaan, p_max_rows: 25 });
  if (error || !data) return progress(pekerjaan);
  return data as Kemajuan;
}

/** A plain re-read, for the driver to settle on after an uncertain outcome. It acts on nothing (§2.11 is for acts). */
export async function kemajuanAksi(pekerjaan: string): Promise<Kemajuan | null> {
  return progress(pekerjaan);
}
