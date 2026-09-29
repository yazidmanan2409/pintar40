/**
 * WHERE A PERSON SIGNS IN, as an address they can type (polish batch 2, UX-11).
 *
 * The activation screen used to send the person to «halaman /masuk»: a path,
 * not an address anyone can type or tap. This is the environment's own public
 * address (NEXT_PUBLIC_APP_URL, the one sign-in links are built from) without
 * its scheme, plus /masuk, so production reads «app.pintarselalu.com/masuk» and
 * staging reads its own. Null when the environment has no usable address; the
 * sentence then names «halaman Masuk PINTAR» (`aktivasi.halaman_masuk`).
 */
export function alamatMasuk(asal: string | undefined = process.env.NEXT_PUBLIC_APP_URL): string | null {
  if (!asal) return null;
  try {
    const u = new URL(asal);
    return u.protocol === "https:" || u.protocol === "http:" ? `${u.host}/masuk` : null;
  } catch {
    return null;
  }
}
