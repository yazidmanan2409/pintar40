"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * R0-5 (W2.12, RV-8: one rule for every lesson medium). A lesson's PDF is offered only while its file is there.
 * The address is the read route with `alih=1`; asked without it, the same route answers whether the file exists
 * (its JSON, or 404), checking the reader's permission and the file itself, so the service role never leaves the
 * route (INV-37). A recording already says it is unavailable when its file is not there; a missing PDF is simply not
 * offered, as when the reader may not read it. Drawn at once (it works before script), withdrawn on a 404.
 */
export default function TautanBerkas({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const [ada, setAda] = useState(true);
  useEffect(() => {
    let aktif = true;
    fetch(href.replace(/&alih=1\b/, ""), { credentials: "same-origin", cache: "no-store" })
      .then((r) => { if (aktif && r.status === 404) setAda(false); })
      .catch(() => { /* the network decides nothing: the link stays */ });
    return () => { aktif = false; };
  }, [href]);
  if (!ada) return null;
  return <a href={href} target="_blank" rel="noreferrer" className={className} data-berkas="">{children}</a>;
}
