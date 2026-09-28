"use client";

import { useLinkStatus } from "next/link";

/**
 * TandaTautan — A MENU LINK SAYS IT WAS HEARD (DAISY-18, D-047).
 *
 * Placed inside a menu <Link>: from the click until the next page is on
 * screen it draws a small working dot beside the label (Next's own
 * useLinkStatus), so a tap on a slow connection is never met with nothing.
 * It takes no room at rest, so the menu does not shift. Hidden from the
 * accessibility tree: the loading shell (MemuatHalaman) says "Memuat…".
 */
export default function TandaTautan() {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={pending ? "pin-tanda-tautan pin-tanda-tautan-sibuk" : "pin-tanda-tautan"} />;
}
