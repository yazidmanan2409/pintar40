/**
 * W2.8 (Batch 4, CR-07, J8.8): A STAFF MEMBER'S PROFILE PHOTO, ON THEIR PROFILE ONLY.
 *
 * The photo is stored in PINTAR's private bucket under the person's own folder (profile/<person_id>/<id>.<ext>, the
 * one signed upload route decides the folder), its path is kept on the person (persons.photo_path, which only the
 * person may update: persons_update_own), and it is read back through a short-lived signed URL. It is never printed on
 * a certificate (the certificate reads no photo, D-077). PNG, JPEG or WebP, at most 2 MB.
 */
export const BATAS_FOTO = 2 * 1024 * 1024;
const JENIS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** The path a new photo is uploaded to, or null for a file that is not a picture PINTAR keeps. */
export function jalurFotoBaru(personId: string, id: string, mime: string): string | null {
  const ext = JENIS[mime];
  if (!ext || !/^[0-9a-f-]{36}$/i.test(personId) || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return `profile/${personId}/${id}.${ext}`;
}

/** Whether a path is a photo in this person's own folder, as the upload route signs it. */
export function fotoMilik(personId: string, path: string): boolean {
  return new RegExp(`^profile/${personId.replace(/[^0-9a-f-]/gi, "")}/[0-9a-f-]{36}\\.(png|jpg|webp)$`, "i").test(path);
}
