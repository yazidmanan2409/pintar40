import { currentViewer } from "@/lib/auth";
import type { Locale, Persona } from "@/lib/hle";
import BarisSesi from "./BarisSesi";

/**
 * The session strip for whoever is signed in (DAISY-02). Nothing is drawn for
 * somebody who is not signed in: there is nobody to sign out, and the public
 * verification page must offer no way into PINTAR at all.
 *
 * `sebut` ("name them") is true on staff screens only. When it is false the
 * display name is not read into the render at all, so it cannot reach the
 * page's HTML by any route (S15).
 */
export default async function SesiSaya({
  locale,
  persona,
  sebut,
  varian,
}: {
  locale: Locale;
  persona: Persona;
  sebut: boolean;
  varian?: "kepala" | "penolakan";
}) {
  const viewer = await currentViewer();
  if (!viewer) return null;
  return <BarisSesi locale={locale} persona={persona} nama={sebut ? viewer.displayName : null} varian={varian} />;
}
