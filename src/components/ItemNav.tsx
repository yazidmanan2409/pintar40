import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import Ikon from "./Ikon";
import { IKON_TEMPAT } from "./ikon-tempat";

/**
 * One place in the staff navigation (AppShell's navigation item, D-138 step 3): its icon, its word and the working
 * dot. The word is always in the link, so it is the link's name; in the rail it is hidden visually and kept for
 * screen readers (E-E1-1, never `display: none`, never repeated as an `aria-label`). `aria-current` marks the place
 * the reader is in.
 *
 * E1 (D-171(a)): the tooltip is the same word, `aria-hidden`, shown only while the shell is the rail (its state, by
 * CSS), on hover and at once on keyboard focus; Escape hides it (TombolCiut). No `title`: a browser's own tooltip
 * shows only on hover, and a screen reader would hear it a second time as the description.
 */
export default function ItemNav({ href, label, kini }: { href: string; label: string; kini?: boolean }) {
  const ikon = IKON_TEMPAT[href];
  return (
    <Link href={href} className="pin-nav-item" data-tip-host="" aria-current={kini ? "page" : undefined}>
      {ikon ? <Ikon nama={ikon} /> : null}
      <span className="pin-nav-label">{label}</span>
      <span className="pin-nav-tip" aria-hidden="true">{label}</span>
      <TandaTautan />
    </Link>
  );
}
