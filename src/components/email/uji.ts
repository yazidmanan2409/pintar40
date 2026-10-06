/**
 * DAISY-19 × BOB-25: UJI_PENGIRIMAN, Gate 2E's delivery test, in the PINTAR
 * frame. A platform admin sends it once on staging (BOB-25 §4, `POST
 * /api/email/uji`); it arrives in the M6 inboxes (one Gmail, one Outlook), and
 * that arrival is the real-client render DAISY-19's acceptance asks for.
 *
 * The sending module sends this template: `src/app/api/_email/uji.ts`
 * re-exports it, so the route's import is unchanged (D-079: Bob owns the pipe,
 * Daisy owns the email). It stays a test email, sent only to the inbox the
 * admin names. Its one piece of data is the route's own send time, shown as a
 * row so each arrival can be told from the last; everything else is fixed
 * copy, and the environment comes from `konteks`, so a staging send carries
 * the test line and staging's own logo.
 */
import type { Templat } from "@/lib/email/templat";
import { bingkaiEmail, kata } from "./bingkai";

export const templatUjiPengiriman: Templat<{ waktu: string }> = (data, konteks) =>
  bingkaiEmail(
    {
      subjek: kata("email.uji.subjek"),
      pratinjau: kata("email.uji.pratinjau"),
      judul: kata("email.uji.judul"),
      isi: [
        { jenis: "paragraf", teks: kata("email.uji.isi") },
        { jenis: "rincian", baris: [[kata("email.uji.dikirim"), data.waktu]] },
        { jenis: "paragraf", teks: kata("email.uji.tenang") },
      ],
      alasan: kata("email.uji.alasan"),
    },
    konteks,
  );
