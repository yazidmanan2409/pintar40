import { redirect } from "next/navigation";
import { enumLabel } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import Kosong from "@/components/Kosong";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, card, field, kataStudio, label, outcomeLine, studioInstitutions, when, tabSaya } from "../_lib";
import { recordIntegrityReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import BidangTeks from "@/components/bentuk/BidangTeks";
import Penomoran, { halamanDiminta, tautanHalaman } from "@/components/koleksi/Penomoran";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import { judulHalaman } from "@/lib/judul-halaman";
import { langkahRujukan, type Tinjauan } from "@/lib/integritas-kontrak";

export const generateMetadata = judulHalaman("/studio/integritas");

/**
 * Integrity review centre (§10).
 *
 * Signals are grouped per session and framed as material for a human, never as
 * a verdict. The three decisions describe what the REVIEWER did; none of them
 * says anything about the learner, and none of them writes an outcome back
 * onto the signal, the session or the result. There is no surveillance control
 * to configure here because none exists to configure. *
 * FD-7 (DG-32): the list is the observations still WAITING (integrity_signals_awaiting_review), so «Tidak ada catatan
 * yang menunggu tinjauan» is true when it is said; and «Diteruskan ke pihak sekolah» is offered only where the server
 * accepts it (never for a professional-learning sitting, and only over the reviewer's own classes).
 *
 * W2.7 (Batch 5; CR-75, CR-76, CR-77; Daisy 11-validation §3 and GQ2):
 *  - ONE DECISION PER OBSERVATION. Each waiting observation of a sitting has its own form (DAISY-18: one form per item):
 *    the decision, a labelled note, «Catat tinjauan». The database keeps it waiting until a decision is on IT.
 *  - A SITTING IS NAMED by its learner first, the PINTAR ID beneath, then class and assessment; its state is a badge
 *    with words («Menunggu tinjauan», «Sudah ditinjau»).
 *  - A VISIBLE REVIEWED STATE: «Sudah ditinjau» lists the decided observations (integrity_reviews_recorded), each with
 *    its decision, who and when, and its note.
 *  - THE REFERRER SEES THE OUTCOME: a referred observation carries the case's named steps (Diteruskan → Ditinjau
 *    pimpinan → Diputuskan) and its state in words; once decided, the outcome, when, and the decision's note; while
 *    waiting, who decides (CR-76: another leader, or nobody yet). Only where the database lets this reader see the case.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string; hal_tinjau?: string }>;

type Menunggu = { signal_id: string; session_id: string; institution_id: string; category: string; observed_at: string; may_refer: boolean };

export default async function Integritas({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("integritas")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // W1.9 (UX-25): every word in the reader's language, a time with its year and WIB in it too
  const locale = await currentLocale();
  const s = kataStudio(locale);
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const halTinjau = halamanDiminta(sp.hal_tinjau);
  const [{ data: signals }, { data: tercatat }] = await Promise.all([
    supabase.rpc("integrity_signals_awaiting_review"),
    supabase.rpc("integrity_reviews_recorded", { p_hal: halTinjau }),
  ]);
  // L3 (D-127 Q2): the working context's school only (studioInstitutions is narrowed to it)
  const sekolah = new Set((await studioInstitutions()).map((i) => i.id));

  const rows = ((signals ?? []) as Menunggu[]).filter((r) => sekolah.has(r.institution_id)).map((r) => ({ ...r, id: r.signal_id }));
  const bySession = new Map<string, typeof rows>();
  for (const r of rows) bySession.set(r.session_id, [...(bySession.get(r.session_id) ?? []), r]);
  const sudah = ((tercatat ?? []) as Tinjauan[]).filter((r) => sekolah.has(r.institution_id));
  const lagiTinjau = sudah.some((r) => r.lagi);
  const sudahBySession = new Map<string, Tinjauan[]>();
  for (const r of sudah) sudahBySession.set(r.session_id, [...(sudahBySession.get(r.session_id) ?? []), r]);

  // L4 (CR-85, investigation §E item 8): a sitting is named by its learner, class and assessment, which the reviewer
  // may read (assessment_sessions_select admits CAN_REVIEW_INTEGRITY); never by a fragment of its id. W2.7 (CR-75): the
  // learner's name first, the PINTAR ID beneath. The learner is named through the sitting's own person (its person_id
  // key): a sitting has a second key to persons (who terminated it, 20260914094500), so an unnamed embed was ambiguous,
  // PostgREST refused the read and every sitting showed «—» (found by the Batch 5 walk). A sitting this read cannot
  // name shows the dash, and the observations under it still say what was seen and when.
  const semuaSesi = [...new Set([...bySession.keys(), ...sudahBySession.keys()])];
  const { data: sesi } = semuaSesi.length > 0
    ? await supabase.from("assessment_sessions")
        .select("id, persons!assessment_sessions_person_id_fkey(display_name, pintar_id), kelas:org_nodes!assessment_sessions_class_node_id_fkey(name), assessment_definitions(title)")
        .in("id", semuaSesi)
    : { data: [] };
  const satu = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const namaSesi = new Map(((sesi ?? []) as Array<Record<string, unknown>>).map((r) => {
    const orang = satu(r.persons as { display_name?: string; pintar_id?: string | null } | null);
    return [String(r.id), {
      nama: orang?.display_name ?? "",
      pintarId: orang?.pintar_id ? tampilPintarId(orang.pintar_id) : "",
      tempat: [satu(r.kelas as { name?: string } | null)?.name, satu(r.assessment_definitions as { title?: string } | null)?.title]
        .filter((x): x is string => typeof x === "string" && x.length > 0).join(" · "),
    }];
  }));
  const kepala = (session: string, keadaan: "menunggu" | "ditinjau") => {
    const n = namaSesi.get(session);
    return (
      <div className="pin-integritas-kepala">
        <div>
          <p className="pin-judul-baris">{n?.nama || "—"}</p>
          {n?.pintarId ? <p className="pin-meta pin-num">{n.pintarId}</p> : null}
          {n?.tempat ? <p className="pin-meta">{n.tempat}</p> : null}
        </div>
        <span className={keadaan === "menunggu" ? "pin-pill pin-attention" : "pin-pill pin-ok"} data-keadaan-integritas={keadaan}>
          {s(keadaan === "menunggu" ? "studio.integritas.keadaan.menunggu" : "studio.integritas.keadaan.ditinjau")}
        </span>
      </div>
    );
  };

  const banner = outcomeLine(sp, locale);

  return (
    <div className="pin-studio-halaman" id="integritas">
      <div>
        <h2 className="pin-studio-h2">{s("studio.integritas.judul")}</h2>
        <p className="pin-ket">{s("studio.integritas.penjelasan")}</p>
      </div>
      {/* DAISY-18: one form per item; the answer heads the list it came from */}
      <HasilDi q={sp} bagian="integritas" kalimat={banner} />

      <section aria-labelledby="integritas-menunggu" className="pin-studio-halaman">
        <h3 id="integritas-menunggu" className="pin-studio-h3">{s("studio.integritas.menunggu.judul")}</h3>
        {bySession.size === 0 ? (
          // W3.2 (Empty state, «not yet»): nothing is waiting, which is good news; there is no action to offer
          <Kosong jenis="belum" kalimat={s("studio.integritas.kosong")} />
        ) : (
          <ul className="pin-daftar">
            {[...bySession.entries()].map(([session, group]) => (
              <li key={session} className={card} id={`integritas-${session}`} data-sesi-integritas={session}>
                {kepala(session, "menunggu")}
                <ul className="pin-daftar-rapat">
                  {group.map((g) => (
                    <li key={g.id} className="pin-integritas-catatan">
                      <p className="pin-ket">{enumLabel("integritas", g.category, locale)} · {when(g.observed_at, locale)}</p>
                      <form action={recordIntegrityReviewAction} id={`integritas-sinyal-${g.id}`} className="pin-baris-aksi">
                        <input type="hidden" name="sinyal" value={g.id} />
                        <label className={label}>
                          <span>{s("studio.integritas.tindak")}</span>
                          <select className={field} name="keputusan" defaultValue="NO_CONCERN">
                            {["NO_CONCERN", "DISCUSSED_WITH_LEARNER", ...(g.may_refer ? ["REFERRED_TO_INSTITUTION"] : [])].map((d) => (
                              <option key={d} value={d}>{s(`studio.integritas.${d}` as never)}</option>
                            ))}
                          </select>
                        </label>
                        <BidangTeks id={`integritas-catatan-${g.id}`} name="catatan" maxLength={500}
                          label={s("studio.paket.catatan")} opsional={s("bentuk.opsional")} petunjuk={s("studio.integritas.catatan.arti")} />
                        <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
                      </form>
                      <SimpanIsian form={`integritas-sinyal-${g.id}`} ditolak={ditolak("integritas")} pemilik={pemilik} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="integritas-ditinjau" className="pin-studio-halaman" id="ditinjau">
        <h3 id="integritas-ditinjau" className="pin-studio-h3">{s("studio.integritas.ditinjau.judul")}</h3>
        {sudahBySession.size === 0 ? (
          <Kosong jenis="belum" kalimat={s("studio.integritas.ditinjau.kosong")} />
        ) : (
          <ul className="pin-daftar">
            {[...sudahBySession.entries()].map(([session, group]) => (
              <li key={session} className={card} data-sesi-ditinjau={session}>
                {kepala(session, "ditinjau")}
                <ul className="pin-daftar-rapat">
                  {group.map((g) => (
                    <li key={g.signal_id} className="pin-integritas-catatan" data-sinyal-ditinjau={g.signal_id} data-keputusan={g.decision}>
                      <p className="pin-ket">{enumLabel("integritas", g.category, locale)} · {when(g.observed_at, locale)}</p>
                      <p><span className="pin-pill pin-neutral">{s(`studio.integritas.${g.decision}` as never)}</span></p>
                      <p className="pin-meta">
                        {s("studio.integritas.oleh").replace("{nama}", g.reviewer_name ?? "—").replace("{waktu}", when(g.reviewed_at, locale))}
                      </p>
                      {g.note ? <p className="pin-meta">{s("studio.integritas.catatan_tercatat")} {g.note}</p> : null}
                      {g.case_id ? <Rujukan g={g} s={s} locale={locale} /> : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        <Penomoran locale={locale} halaman={halTinjau} lagi={lagiTinjau} ke={(n) => tautanHalaman("/studio/integritas", sp, "hal_tinjau", n, "ditinjau")}
          benda={s("koleksi.benda.tinjauan")} jumlah={sudahBySession.size} />
      </section>
    </div>
  );
}

/**
 * CR-77 (Daisy GQ2): the referred case's named steps on the page it was referred from, and its state in words. Only
 * what the database lets this reader see of the case (integrity_reviews_recorded.case_visible); otherwise one line
 * that it was referred.
 */
function Rujukan({ g, s, locale }: { g: Tinjauan; s: ReturnType<typeof kataStudio>; locale: Awaited<ReturnType<typeof currentLocale>> }) {
  if (!g.case_visible) return <p className="pin-meta" data-rujukan="tersembunyi">{s("studio.integritas.rujukan.tak_terlihat")}</p>;
  const { langkah, kini, kalimat } = langkahRujukan(g);
  return (
    <div className="pin-integritas-rujukan" data-rujukan={g.case_state ?? ""}>
      <ol className="pin-tahap" aria-label={s("studio.integritas.rujukan.judul")}>
        {langkah.map((l, i) => (
          <li key={l} className={i < kini || g.case_state === "DECIDED" ? "pin-done" : undefined} aria-current={i === kini && g.case_state !== "DECIDED" ? "step" : undefined}>
            {s(`studio.integritas.rujukan.langkah.${l}` as never)}
          </li>
        ))}
      </ol>
      {g.case_state === "DECIDED" && g.case_outcome ? (
        <>
          <p data-hasil-rujukan={g.case_outcome}>
            {s("studio.integritas.rujukan.hasil").replace("{hasil}", s(`studio.integritas.rujukan.hasil.${g.case_outcome}` as never))}
            {g.case_decided_at ? ` · ${when(g.case_decided_at, locale)}` : ""}
          </p>
          {g.case_note ? <p className="pin-meta">{s("studio.integritas.rujukan.catatan")} {g.case_note}</p> : null}
        </>
      ) : null}
      <p className="pin-meta">{s(kalimat as never)}</p>
    </div>
  );
}
