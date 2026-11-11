"use client";

import { useEffect } from "react";

/**
 * A1: A PANEL OPENED UNDER A LIST TAKES FOCUS WHEN IT OPENS.
 *
 * «Atur» and «Ubah jadwal» open their panel under the list by a link (`?sesi=…#atur`, `?jadwal=…#jadwal`). The link is
 * followed inside the application, so the browser scrolls to the panel and leaves focus on the link: a keyboard reader
 * then walks every remaining row to reach it. This puts focus on the panel itself (it carries `tabindex="-1"` and is
 * named by its heading) each time a panel for another row opens, unless focus is already inside it.
 *
 * It renders nothing. It exists to do the one thing a server component cannot.
 */
export default function FokusPanel({ id, kunci }: { id: string; kunci: string }) {
  useEffect(() => {
    const el = document.getElementById(id);
    if (el instanceof HTMLElement && !el.contains(document.activeElement)) el.focus();
  }, [id, kunci]);
  return null;
}
