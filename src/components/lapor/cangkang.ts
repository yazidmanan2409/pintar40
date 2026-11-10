import { permukaanKonteks, type Pasangan } from "@/lib/konteks";

/**
 * The shell a staff page outside any one place wears (the problem report, the professional-learning record): a
 * teacher's, Management's, or -- for an administrator whose home is Konfigurasi, which draws its own header -- none
 * but the mark, the language and the session. And the home to go back to. From the roles already read; decides nothing.
 */
export function cangkangStaf(
  peran: readonly string[] | null,
  /** E-C1-6 (D-132): the working context, when there is one; it decides, and the roles only stand in without it. */
  konteks?: Pasangan | null,
): { kind: "pengajar" | "pimpinan" | "pendataan" | "focus"; kembali: string } {
  if (konteks?.tujuan === "MENGAJAR") return { kind: "pengajar", kembali: "/mengajar" };
  if (konteks?.tujuan === "MENGELOLA") {
    const di = permukaanKonteks(konteks);
    // Readiness C8 (Daisy, 8 Nov): the administrator's own staff shell (navigation), as /akun gives it, not the focus shell
    if (di.includes("/konfigurasi")) return { kind: "pendataan", kembali: "/konfigurasi" };
    if (di.includes("/pimpinan")) return { kind: "pimpinan", kembali: "/pimpinan" };
  }
  if (peran?.includes("EDUCATOR")) return { kind: "pengajar", kembali: "/mengajar" };
  if (peran?.some((p) => p === "HEAD_OF_DEPARTMENT" || p === "DEAN")) return { kind: "pimpinan", kembali: "/pimpinan" };
  if (peran?.some((p) => p === "INSTITUTION_ADMIN" || p === "SYSTEM_ADMIN")) return { kind: "pendataan", kembali: "/konfigurasi" };
  return { kind: "focus", kembali: "/" };
}
