import { currentViewer, type Viewer } from "@/lib/auth";
import { peranSaya } from "@/lib/tur-negara";
import type { Locale, Persona } from "@/lib/hle";
import BarisSesi from "./BarisSesi";
import { namaUntukStrip } from "./sesi";

/**
 * The session strip for whoever is signed in (DAISY-02). Nothing is drawn for
 * somebody who is not signed in: there is nobody to sign out, and the public
 * verification page must offer no way into PINTAR at all.
 *
 * WHETHER TO NAME THE READER is decided by their own roles (./sesi.ts): staff
 * are named, a student never is, on whatever page they are reading (S15,
 * D-020). The name is only read into the render when that rule allows it.
 *
 * ONE READ. A caller that has already read the viewer and their roles -- the
 * Experience shell does, for its tabs -- passes both in, and nothing is read
 * twice. A caller that has not gets both here, in parallel.
 */
export default async function SesiSaya({
  locale,
  persona,
  varian,
  viewer,
  peran,
}: {
  locale: Locale;
  persona: Persona;
  varian?: "kepala" | "penolakan";
  /** Already read by the caller; left undefined, it is read here. */
  viewer?: Viewer | null;
  /** The reader's active roles, already read; left undefined, read here. */
  peran?: readonly string[] | null;
}) {
  const [v, p] = await Promise.all([
    viewer === undefined ? currentViewer() : Promise.resolve(viewer),
    peran === undefined ? peranSaya() : Promise.resolve(peran),
  ]);
  if (!v) return null;
  return <BarisSesi locale={locale} persona={persona} nama={namaUntukStrip(v.displayName, p)} varian={varian} />;
}
