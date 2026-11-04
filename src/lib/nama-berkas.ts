/**
 * E-D2-1 (Daisy, `f33f7beb`): THE SUGGESTED FILE NAME OF A SAVED PDF. «Simpan sebagai PDF» offers the document's title as
 * the file's name, so the title a printed page carries must be a name every system can hold: the characters a file name
 * cannot carry (/ \ : * ? " < > | and control characters) become a hyphen, runs of space and hyphen fold to one, the
 * ends are trimmed, and the whole is capped at 150 characters on a word boundary where one is near. The words are the
 * caller's (a package's title, never a person's name, W3.1).
 */
export const BATAS_NAMA_BERKAS = 150;

export function namaBerkas(judul: string): string {
  let n = judul.replace(/[/\\:*?"<>|\u0000-\u001f\u007f]/g, "-");
  n = n.replace(/\s+/g, " ").replace(/(\s*-\s*){2,}/g, " - ").replace(/^[\s.-]+|[\s.-]+$/g, "");
  if (n.length > BATAS_NAMA_BERKAS) {
    const potong = n.slice(0, BATAS_NAMA_BERKAS);
    const spasi = potong.lastIndexOf(" ");
    n = (spasi > BATAS_NAMA_BERKAS - 30 ? potong.slice(0, spasi) : potong).replace(/[\s.-]+$/g, "");
  }
  return n;
}
