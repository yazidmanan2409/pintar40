"use server";

import { redirect } from "next/navigation";
import { tujuanInternal } from "@/lib/tujuan";
import { alamatPilih, bacaKunciPasangan, berandaPasangan, melayani, samaPasangan } from "@/lib/konteks";
import { tempatSaya, tetapkanKonteks } from "@/lib/konteks-server";

/**
 * L3 · THE PERSON'S OWN CHOICE (§2.4, §2.5; D-132 C3). The one place a working context changes after arriving: a
 * door on the chooser (`/`), posted. The database writes it only for the caller's own session and only a pair they
 * hold (konteks_tetapkan, PILIHAN); then the context's home, or the page that sent the person here when this pair
 * serves it.
 */
export async function pilihKonteks(formData: FormData): Promise<void> {
  const dipilih = bacaKunciPasangan(formData.get("pasangan"));
  const lanjut = tujuanInternal(formData.get("lanjut"), "");
  if (!dipilih) redirect("/");
  const pasangan = (await tempatSaya()).find((p) => samaPasangan(p, dipilih));
  if (!pasangan && dipilih.tujuan !== "BELAJAR") redirect(alamatPilih({ alasan: "tidak_dipegang" }));
  if (!(await tetapkanKonteks({ ...dipilih, sebab: "PILIHAN" }))) redirect(alamatPilih({ alasan: "tidak_dipegang" }));
  const p = pasangan ?? { ...dipilih, nama: null, jenis: null, peran: [], kemampuan: [] };
  redirect(lanjut && melayani(p, lanjut) ? lanjut : berandaPasangan(p));
}
