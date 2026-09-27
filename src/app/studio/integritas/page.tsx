import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { button, card, field, label, outcomeLine, s, short, studioInstitutions, when } from "../_lib";
import { recordIntegrityReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";

/**
 * Integrity review centre (§10).
 *
 * Signals are grouped per session and framed as material for a human, never as
 * a verdict. The three decisions describe what the REVIEWER did; none of them
 * says anything about the learner, and none of them writes an outcome back
 * onto the signal, the session or the result. There is no surveillance control
 * to configure here because none exists to configure.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Integritas({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = (await studioInstitutions())
    .filter((i) => i.capabilities.includes("CAN_REVIEW_INTEGRITY"));

  const { data: signals } = institutions.length
    ? await supabase.from("integrity_signals")
        .select("id, session_id, institution_id, category, observed_at")
        .in("institution_id", institutions.map((i) => i.id))
        .order("observed_at", { ascending: false })
        .limit(50)
    : { data: [] as Array<Record<string, never>> };

  const rows = (signals ?? []) as Array<{
    id: string; session_id: string; institution_id: string; category: string; observed_at: string;
  }>;
  const bySession = new Map<string, typeof rows>();
  for (const r of rows) bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]);

  const banner = outcomeLine(sp);

  return (
    <div className="grid gap-4" id="integritas">
      <div>
        <h2 className="text-lg font-medium">{s("studio.integritas.judul")}</h2>
        <p className="mt-1 text-sm text-ink-2">{s("studio.integritas.penjelasan")}</p>
      </div>
      {banner ? <p className={card}>{banner}</p> : null}

      {bySession.size === 0 ? (
        <p className={card}>{s("studio.integritas.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {[...bySession.entries()].map(([session, group]) => (
            <li key={session} className={card}>
              <p className="text-sm text-ink-3">{short(session)} · {group.length}</p>
              <ul className="mt-2 grid gap-1 text-sm text-ink-2">
                {group.map((g) => <li key={g.id}>{enumLabel("integritas", g.category)} · {when(g.observed_at)}</li>)}
              </ul>
              <form action={recordIntegrityReviewAction} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="sinyal" value={group[0].id} />
                <label className={label}>
                  <span>{s("studio.integritas.catat")}</span>
                  <select className={field} name="keputusan" defaultValue="NO_CONCERN">
                    {["NO_CONCERN", "DISCUSSED_WITH_LEARNER", "REFERRED_TO_INSTITUTION"].map((d) => (
                      <option key={d} value={d}>{s(`studio.integritas.${d}` as never)}</option>
                    ))}
                  </select>
                </label>
                <input className={field} name="catatan" placeholder="catatan" />
                <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
