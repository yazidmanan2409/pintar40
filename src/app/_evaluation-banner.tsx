import Link from "next/link";
import { evaluationState } from "@/lib/evaluation";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { exitPersonaAction } from "./evaluasi/actions";
import TombolKirim from "@/components/TombolKirim";

/**
 * EVALUATION MODE — rendered from the SESSION, never from client state
 * (ADR-0020). It is a server component in the root layout, so it appears on
 * every page, survives a refresh, and cannot be dismissed: there is no client
 * state to dismiss. Its presence is a property of the session.
 *
 * W3.13 (Daisy, J6Peragaan; Accent, «Context»): THE DEEP-INK CONTEXT BAND. One full-width band in `context` /
 * `context-ink`, no new hue, in the flow above the shell (never fixed: the tour's ceiling is measured from it). It is
 * a region named «MODE PERAGAAN», so a screen reader can find it and leave it; its two ways out, «Ganti sudut
 * pandang» and «Keluar dari peragaan», are the first stops after the skip link, because the root layout draws the
 * band directly after it and nothing in the band before them takes focus. Its links are underlined, so nothing is
 * said by colour alone. Inside the room the page title is prefixed as well (F9: src/app/layout.tsx).
 */
export default async function EvaluationBanner() {
  const state = await evaluationState();
  if (!state) return null;
  const locale = await currentLocale();
  const e = (k: HleEvent) => t(k, "staff", { locale });
  return (
    <div className="pin-konteks pin-noprint" role="region" aria-label={e("evaluasi.mode")} data-peragaan="">
      <strong className="pin-konteks-nama">{e("evaluasi.mode")}</strong>
      <span>
        {e("evaluasi.sebagai")}: <strong>{state.label}</strong>
      </span>
      {state.expired ? <span>{e("evaluasi.sesi_habis")}</span> : null}
      <span className="pin-konteks-kanan">
        <Link href="/evaluasi">{e("evaluasi.ganti")}</Link>
        <form action={exitPersonaAction}>
          <TombolKirim className="pin-konteks-tombol" sibuk={e("tombol.memproses")}>{e("evaluasi.keluar")}</TombolKirim>
        </form>
      </span>
    </div>
  );
}
