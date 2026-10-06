/**
 * The shell a staff page outside any one place wears (the problem report, the professional-learning record): a
 * teacher's, Management's, or -- for an administrator whose home is Konfigurasi, which draws its own header -- none
 * but the mark, the language and the session. And the home to go back to. From the roles already read; decides nothing.
 */
export function cangkangStaf(peran: readonly string[] | null): { kind: "pengajar" | "pimpinan" | "focus"; kembali: string } {
  if (peran?.includes("EDUCATOR")) return { kind: "pengajar", kembali: "/mengajar" };
  if (peran?.some((p) => p === "HEAD_OF_DEPARTMENT" || p === "DEAN")) return { kind: "pimpinan", kembali: "/pimpinan" };
  if (peran?.some((p) => p === "INSTITUTION_ADMIN" || p === "SYSTEM_ADMIN")) return { kind: "focus", kembali: "/konfigurasi" };
  return { kind: "focus", kembali: "/" };
}
