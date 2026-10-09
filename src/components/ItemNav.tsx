import Link from "next/link";
import TandaTautan from "@/components/TandaTautan";
import Ikon from "./Ikon";
import { IKON_TEMPAT } from "./ikon-tempat";

/**
 * One place in the staff navigation (AppShell's navigation item, D-138 step 3): its icon, its word and the working
 * dot. The word is always in the link, so it is the link's name; in the rail it is hidden visually and kept for
 * screen readers, and `title` gives the tooltip. `aria-current` marks the place the reader is in.
 */
export default function ItemNav({ href, label, kini }: { href: string; label: string; kini?: boolean }) {
  const ikon = IKON_TEMPAT[href];
  return (
    <Link href={href} className="pin-nav-item" title={label} aria-current={kini ? "page" : undefined}>
      {ikon ? <Ikon nama={ikon} /> : null}
      <span className="pin-nav-label">{label}</span>
      <TandaTautan />
    </Link>
  );
}
