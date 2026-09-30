/**
 * DAISY-19 × BOB-25: UJI_PENGIRIMAN, Gate 2E's delivery test, in the PINTAR
 * frame. A platform admin sends it once on staging (BOB-25 §4, `POST
 * /api/email/uji`); it arrives in the M6 inboxes (one Gmail, one Outlook), and
 * that arrival is the real-client render DAISY-19's acceptance asks for.
 *
 * Until the sending module uses it, BOB-25 sends a plain placeholder; the
 * contract (§1) lets this template replace it once the frame is here. It takes
 * no data: everything it says is fixed copy, and the environment comes from
 * `konteks`, so a staging send carries the test line and staging's own logo.
 */
import type { Templat } from "@/lib/email/templat";
import { bingkaiEmail, kata } from "./bingkai";

export const templatUjiPengiriman: Templat<Record<string, never>> = (_data, konteks) =>
  bingkaiEmail(
    {
      subjek: kata("email.uji.subjek"),
      pratinjau: kata("email.uji.pratinjau"),
      judul: kata("email.uji.judul"),
      isi: [
        { jenis: "paragraf", teks: kata("email.uji.isi") },
        { jenis: "paragraf", teks: kata("email.uji.tenang") },
      ],
      alasan: kata("email.uji.alasan"),
    },
    konteks,
  );
