"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/hle";
import HalamanGalat from "@/components/HalamanGalat";

/**
 * PINTAR's page for a failure anywhere under the root layout (DAISY-04). The
 * layout has already declared the reader's language on <html lang>, server-side,
 * so that is read rather than guessed; the server snapshot is Indonesian, the
 * product's default, and the client corrects it without an effect.
 */
const tanpaLangganan = () => () => {};
const bahasaHalaman = (): Locale => (document.documentElement.lang === "en" ? "en" : "id");
const bahasaServer = (): Locale => "id";

export default function Galat({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(tanpaLangganan, bahasaHalaman, bahasaServer);
  return <HalamanGalat locale={locale} rujukan={error.digest} ulang={reset} />;
}
