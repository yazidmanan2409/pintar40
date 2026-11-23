/**
 * S-12 (SAPU-VERIFIED): WHAT «MINTA AKUN DIBUKA KEMBALI» ACCEPTS, checked by the route BEFORE it uses the network's pace.
 *
 * It restates minta_buka_kembali's own first check (20270113130000_an_account_is_suspended_closed_or_anonymised_on_the_record.sql):
 * the identity, trimmed of spaces, is 1 to 254 characters, and the message, trimmed of spaces, 10 to 500. That check
 * depends only on what was typed, never on an account, so answering it before the pace tells no one anything; and a
 * refused try no longer spends the pace, so the person is never told «a request was just sent» when none was.
 *
 * Postgres' btrim() with no characters trims spaces only, and char_length() counts characters: both are mirrored here,
 * so this never refuses what the database would accept. The database keeps its own check as the last line.
 */
const btrim = (s: string) => s.replace(/^ +| +$/g, "");
const panjang = (s: string) => [...s].length;

export function isianBukaKembaliSah(identitas: string, pesan: string): boolean {
  const id = panjang(btrim(identitas)), p = panjang(btrim(pesan));
  return id >= 1 && id <= 254 && p >= 10 && p <= 500;
}
