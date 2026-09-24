"use client";

import "./globals.css";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/hle";
import { LOCALE_COOKIE } from "@/lib/locale-kontrak";
import HalamanGalat from "@/components/HalamanGalat";

/**
 * PINTAR's page for a failure in the root layout itself (DAISY-04). It replaces
 * the layout, so it brings its own <html> and stylesheet, and it cannot read a
 * <html lang> nobody rendered: the language comes from the same cookie the
 * language switch writes. Without this file the reader got Next's English
 * default at exactly the moment everything else had failed too.
 */
const tanpaLangganan = () => () => {};
const bahasaKuki = (): Locale =>
  new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=en(?:;|$)`).test(document.cookie) ? "en" : "id";
const bahasaServer = (): Locale => "id";

export default function GalatAkar({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(tanpaLangganan, bahasaKuki, bahasaServer);
  return (
    <html lang={locale}>
      <body>
        <HalamanGalat locale={locale} rujukan={error.digest} ulang={reset} />
      </body>
    </html>
  );
}
