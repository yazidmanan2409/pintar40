import "server-only";
import type { Templat } from "@/lib/email/templat";

/**
 * BOB-25: Gate 2E's deliverability proof, UJI_PENGIRIMAN. A plain placeholder
 * until DAISY-19's frame is in src/components/email/; Daisy may then give this
 * email the frame, which makes it the M6 render. It is sent only to a
 * platform admin's chosen inbox (route: /api/email/uji), never to a user.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const templatUjiPengiriman: Templat<{ waktu: string }> = (data, konteks) => {
  const baris = [
    "Ini email uji dari PINTAR.",
    "Jika email ini sampai, pengiriman email PINTAR berfungsi. Anda tidak perlu melakukan apa pun.",
    ...(konteks.staging ? ["Email ini dikirim dari lingkungan uji PINTAR, bukan dari PINTAR yang dipakai sekolah."] : []),
    `Dikirim: ${data.waktu}`,
    "PINTAR tidak pernah meminta PIN atau password lewat email.",
  ];
  return {
    subjek: konteks.staging ? "Uji pengiriman email PINTAR (uji)" : "Uji pengiriman email PINTAR",
    teks: baris.join("\n\n") + "\n",
    html:
      `<!doctype html><html lang="id"><body style="font-family:Arial,Helvetica,sans-serif;color:#1F2A33;">` +
      baris.map((b) => `<p style="margin:0 0 16px 0;">${esc(b)}</p>`).join("") +
      `</body></html>`,
  };
};
