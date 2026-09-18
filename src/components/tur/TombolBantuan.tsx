"use client";

import { usePathname, useRouter } from "next/navigation";
import { t, type Locale, type Persona } from "@/lib/hle";

/** The event the control fires when Help is already on the right page. */
export const BUKA_BANTUAN = "pintar:bantuan";

/** The query the control uses to ask a landing to open Help on arrival. */
export const PARAM_BANTUAN = "bantuan";

/**
 * BANTUAN / HELP — the shell's one utility control (§F, L-5).
 *
 * WHY IT EXISTS AT ALL. The built shell had no help entry: the learner header
 * carries Belajar and Sertifikat, the educator header carries Kelas, and the
 * only other control is the language switch. So the tour's last step — "help
 * can always be found here" — had nowhere true to point, and Daisy's proposal
 * stands rather than being withdrawn. It adds one control; no tab and no door
 * changes.
 *
 * WHY IT SOMETIMES NAVIGATES. Replay runs on the landing of the experience the
 * person is in, and from anywhere else it returns there first (§F). The panel
 * therefore lives with the landing's launcher, and from another page this
 * control is a journey back rather than a panel opened in the wrong place. It
 * is a button in both cases, because it is a button in one of them, and a
 * control that changes element between pages is a control that changes
 * keyboard behaviour between pages.
 *
 * IT IS NOT ON EVERY SHELL. The focus shell (an assessment in progress) and the
 * public verification shell do not carry it: §G-3 forbids a tour or a tip in
 * both places, and a Help entry whose only content is "start the tour" would be
 * offering exactly that.
 */
export default function TombolBantuan({
  locale,
  persona,
  beranda,
}: {
  locale: Locale;
  persona: Persona;
  /** The landing of this experience — where Help and replay belong. */
  beranda: string;
}) {
  const path = usePathname();
  const router = useRouter();

  function buka() {
    if (path === beranda) {
      window.dispatchEvent(new CustomEvent(BUKA_BANTUAN));
      return;
    }
    router.push(`${beranda}?${PARAM_BANTUAN}=1`);
  }

  return (
    <button type="button" className="pin-bantuan-tombol" data-tur="bantuan" onClick={buka}>
      {/* The glyph repeats the label; it never replaces it (§K-11). */}
      <span className="pin-bantuan-glif" aria-hidden="true">?</span>
      {t("nav.bantuan", persona, { locale })}
    </button>
  );
}
