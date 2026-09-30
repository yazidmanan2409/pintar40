/**
 * WHERE A PERSON GOES NEXT, as an address they can type (polish batch 2,
 * UX-11; D-019 amended by D-054).
 *
 * The activation screen used to send the person to «halaman /masuk»: a path,
 * not an address anyone can type or tap. This is the environment's own public
 * address (NEXT_PUBLIC_APP_URL, the one sign-in links are built from) without
 * its scheme, plus the page, so production reads «app.pintarselalu.com/masuk»
 * and staging reads its own. Null when the environment has no usable address;
 * the sentence then names the page instead (`aktivasi.halaman_masuk`,
 * `aktivasi.halaman_aktifkan`).
 *
 * Two pages (D-019 amended): an email account starts at «Aktifkan akun PINTAR
 * Anda» (/aktifkan), where its code is sent; a class card is used at /masuk.
 */
function alamatDi(jalur: "/masuk" | "/aktifkan", asal: string | undefined): string | null {
  if (!asal) return null;
  try {
    const u = new URL(asal);
    return u.protocol === "https:" || u.protocol === "http:" ? `${u.host}${jalur}` : null;
  } catch {
    return null;
  }
}

/** The sign-in page's address: where a class card is used. */
export function alamatMasuk(asal: string | undefined = process.env.NEXT_PUBLIC_APP_URL): string | null {
  return alamatDi("/masuk", asal);
}

/** «Aktifkan akun PINTAR Anda»'s address: where an email account starts. */
export function alamatAktifkan(asal: string | undefined = process.env.NEXT_PUBLIC_APP_URL): string | null {
  return alamatDi("/aktifkan", asal);
}
