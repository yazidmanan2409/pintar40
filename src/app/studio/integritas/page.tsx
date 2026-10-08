import { redirect } from "next/navigation";
import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, card, field, label, outcomeLine, s, studioInstitutions, when, tabSaya } from "../_lib";
import { recordIntegrityReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";

/**
 * Integrity review centre (§10).
 *
 * Signals are grouped per session and framed as material for a human, never as
 * a verdict. The three decisions describe what the REVIEWER did; none of them
 * says anything about the learner, and none of them writes an outcome back
 * onto the signal, the session or the result. There is no surveillance control
 * to configure here because none exists to configure. *
 * FD-7 (DG-32): the list is the observations still WAITING (integrity_signals_awaiting_review): a sitting leaves once
 * a review is recorded on it, so «Tidak ada catatan yang menunggu tinjauan» is true when it is said; and «Diteruskan
 * ke pihak sekolah» is offered only where the server accepts it (never for a professional-learning sitting, and only
 * over the reviewer's own classes).
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Integritas({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("integritas")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const { data: signals } = await supabase.rpc("integrity_signals_awaiting_review");
  // L3 (D-127 Q2): the working context's school only (studioInstitutions is narrowed to it)
  const sekolah = new Set((await studioInstitutions()).map((i) => i.id));

  const rows = ((signals ?? []) as Array<{
    signal_id: string; session_id: string; institution_id: string; category: string; observed_at: string; may_refer: boolean;
  }>).filter((r) => sekolah.has(r.institution_id)).map((r) => ({ ...r, id: r.signal_id }));
  const bySession = new Map<string, typeof rows>();
  for (const r of rows) bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]);

  // L4 (CR-85, investigation §E item 8): a sitting is named by its learner, class and assessment, which the reviewer
  // may read (assessment_sessions_select admits CAN_REVIEW_INTEGRITY); never by a fragment of its id. A sitting this
  // read cannot name shows the dash, and the observations under it still say what was seen and when.
  const { data: sesi } = bySession.size > 0
    ? await supabase.from("assessment_sessions")
        .select("id, persons(display_name), kelas:org_nodes!assessment_sessions_class_node_id_fkey(name), assessment_definitions(title)")
        .in("id", [...bySession.keys()])
    : { data: [] };
  const satu = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const namaSesi = new Map(((sesi ?? []) as Array<Record<string, unknown>>).map((r) => [String(r.id), [
    satu(r.persons as { display_name?: string } | null)?.display_name,
    satu(r.kelas as { name?: string } | null)?.name,
    satu(r.assessment_definitions as { title?: string } | null)?.title,
  ].filter((x): x is string => typeof x === "string" && x.length > 0).join(" · ")]));

  const banner = outcomeLine(sp);

  return (
    <div className="grid gap-4" id="integritas">
      <div>
        <h2 className="text-lg font-medium">{s("studio.integritas.judul")}</h2>
        <p className="mt-1 text-sm text-ink-2">{s("studio.integritas.penjelasan")}</p>
      </div>
      {/* DAISY-18: one form per item; the answer heads the list it came from */}
      <HasilDi q={sp} bagian="integritas" kalimat={banner} />

      {bySession.size === 0 ? (
        <p className={card}>{s("studio.integritas.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {[...bySession.entries()].map(([session, group]) => (
            <li key={session} className={card}>
              <p className="text-sm text-ink-2">{namaSesi.get(session) || "\u2014"}</p>
              <ul className="mt-2 grid gap-1 text-sm text-ink-2">
                {group.map((g) => <li key={g.id}>{enumLabel("integritas", g.category)} · {when(g.observed_at)}</li>)}
              </ul>
              <form action={recordIntegrityReviewAction} id={`integritas-${session}`} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="sinyal" value={group[0].id} />
                <label className={label}>
                  <span>{s("studio.integritas.catat")}</span>
                  <select className={field} name="keputusan" defaultValue="NO_CONCERN">
                    {["NO_CONCERN", "DISCUSSED_WITH_LEARNER", ...(group[0].may_refer ? ["REFERRED_TO_INSTITUTION"] : [])].map((d) => (
                      <option key={d} value={d}>{s(`studio.integritas.${d}` as never)}</option>
                    ))}
                  </select>
                </label>
                <input className={field} name="catatan" placeholder="catatan" />
                <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
              </form>
              <SimpanIsian form={`integritas-${session}`} ditolak={ditolak("integritas")} pemilik={pemilik} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
