"use client";

import type { ReactNode } from "react";

/**
 * W3.4 (Batch 2): the Collection's toolbar is a plain GET form, so a search is sent with Enter and works with no
 * script at all. With script, choosing a filter shows it at once (Daisy, Table: the filter changes what is shown, never
 * what is saved): the segments and the select, which carry the same choice at two widths, are made equal, and the form
 * is sent. A search still waits for Enter (Daisy, Search: «otherwise on Enter»), because the rows are read on the server.
 * It has no `action`: it is sent to the page it is on, which reads it (hidden fields keep that page's own place). It saves
 * nothing, so it is not a server-action form and carries no TombolKirim (DAISY-17).
 */
export default function FormKoleksi({ saring, children }: { saring: string; children: ReactNode }) {
  return (
    <form
      method="get" className="pin-koleksi-alat"
      onChange={(e) => {
        const el: EventTarget = e.target;
        if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement) || el.name !== saring) return;
        for (const lain of Array.from(e.currentTarget.elements)) {
          if (lain instanceof HTMLSelectElement && lain.name === saring) lain.value = el.value;
          if (lain instanceof HTMLInputElement && lain.name === saring && lain.type === "radio") lain.checked = lain.value === el.value;
        }
        e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
