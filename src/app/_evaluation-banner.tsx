import Link from "next/link";
import { evaluationState } from "@/lib/evaluation";
import { t } from "@/lib/hle";
import { exitPersonaAction } from "./evaluasi/actions";

const e = (k: Parameters<typeof t>[0]) => t(k, "staff");

/**
 * EVALUATION MODE — rendered from the SESSION, never from client state
 * (ADR-0020). It is a server component in the root layout, so it appears on
 * every page, survives a refresh, and cannot be dismissed: there is no client
 * state to dismiss. Its presence is a property of the session.
 */
export default async function EvaluationBanner() {
  const state = await evaluationState();
  if (!state) return null;
  return (
    <div className="border-b border-line-1 bg-surface-2 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1">
        <strong className="tracking-wide">{e("evaluasi.mode")}</strong>
        <span className="text-ink-2">
          {e("evaluasi.sebagai")}: <strong className="text-ink-1">{state.label}</strong>
        </span>
        {state.expired ? <span className="text-ink-2">{e("evaluasi.sesi_habis")}</span> : null}
        <span className="ml-auto flex items-center gap-3">
          <Link href="/evaluasi">{e("evaluasi.ganti")}</Link>
          <form action={exitPersonaAction}>
            <button className="underline">{e("evaluasi.keluar")}</button>
          </form>
        </span>
      </div>
    </div>
  );
}
