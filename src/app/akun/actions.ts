"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kodeAkunDariGalat } from "@/lib/akun-kontrak";

/**
 * L2 / L3 (owner, 9 Nov): the person's own request, «Hapus data pribadi saya» or «Tutup akun saya», with its one
 * confirmation. minta_akun decides (a learner's request goes through the school; one open request of a kind). A
 * closure is executed at once: every session ends and sign-in is refused, so the person is taken to sign out.
 */
export async function mintaAkunAksi(fd: FormData): Promise<void> {
  const jenis = String(fd.get("jenis") ?? "");
  const konfirmasi = fd.get("konfirmasi") === "ya";
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("minta_akun", { p_kind: jenis, p_konfirmasi: konfirmasi });
  if (error) redirect(`/akun?${new URLSearchParams({ hasil: "gagal", kode: kodeAkunDariGalat(error) }).toString()}#meninggalkan`);
  if (jenis === "CLOSE") redirect("/keluar?akun=ditutup");
  redirect("/akun?hasil=ok#meninggalkan");
}
