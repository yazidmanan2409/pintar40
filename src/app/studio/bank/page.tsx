import { redirect } from "next/navigation";
import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, card, field, label, outcomeLine, s, short, studioInstitutions, tabSaya } from "../_lib";
import { recordQuestionHealthReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import { TeksBaris } from "@/components/teks/Teks";
import { pilihanTinjauan, SEDANG_DITINJAU } from "@/lib/kesehatan-soal";

/**
 * Content & Question Banks, and the Question Health surface (§8, §10).
 *
 * Predicted difficulty is shown as AUTHORED. Empirical fields are shown only
 * when they are legitimately present; while FABLE-06 has computed nothing they
 * are NULL, and the surface says "not enough evidence yet" rather than
 * borrowing a number from somewhere. Nothing on this page computes a
 * statistic, and nothing here states that a question is "too easy" or "wrong":
 * a reviewer sees the evidence and records what they decided.
 *
 * Polish batch 2 (UX-02): what the page is for in this phase is said once, at
 * the top, with how a question is changed (a corrected workbook). A question
 * with no evidence yet shows nothing in its place, rather than "not enough
 * evidence" under every row, and no database id is shown.
 *
 * BOB-41 (post-login review #6, D-061): a review can be concluded. The form
 * offers only what is legal from the item's current state (taking it up at
 * SIGNAL_RAISED; «Sudah ditinjau, soal ini wajar» or «… diperbaiki» at
 * UNDER_REVIEW), and every item waiting on a reviewer in their schools is
 * listed whatever its age, not only when it is among the latest 40. Health is
 * read for exactly the items shown, not the first 200 rows.
 */
const LABEL_TINJAUAN = {
  UNDER_REVIEW: "studio.bank.kesehatan",
  ACKNOWLEDGED_OK: "studio.bank.akui_ok",
  ACTION_TAKEN: "studio.bank.tindakan",
} as const;

type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Bank({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("bank")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const institutions = await studioInstitutions();
  const mayReview = institutions.filter((i) => i.capabilities.includes("CAN_REVIEW_QUESTION_HEALTH"));

  const kolom = "id, stem, bank_type, predicted_difficulty, empirical_difficulty, empirical_discrimination, empirical_evidence_count, institution_id, supersedes_item_id";
  type Sehat = { item_id: string; state: string; evidence_count: number };
  const [{ data: terbaru }, { data: menunggu }] = await Promise.all([
    supabase.from("items").select(kolom).order("created_at", { ascending: false }).limit(40),
    // BOB-41: every item waiting on a reviewer in their schools, whatever its age
    mayReview.length
      ? supabase.from("question_health").select("item_id, state, evidence_count, note")
          .in("state", [...SEDANG_DITINJAU]).in("institution_id", mayReview.map((m) => m.id))
      : Promise.resolve({ data: [] }),
  ]);
  const baru = terbaru ?? [];
  const dilihat = new Set(baru.map((i) => i.id));
  const lamaIds = ((menunggu ?? []) as Sehat[]).map((h) => h.item_id).filter((id) => !dilihat.has(id));
  const { data: lama } = lamaIds.length
    ? await supabase.from("items").select(kolom).in("id", lamaIds).order("created_at", { ascending: false })
    : { data: [] };
  const items = [...baru, ...(lama ?? [])];
  // health for exactly the items shown
  const { data: health } = items.length
    ? await supabase.from("question_health").select("item_id, state, evidence_count, note").in("item_id", items.map((i) => i.id))
    : { data: [] };

  const healthByItem = new Map(((health ?? []) as Sehat[]).map((h) => [h.item_id, h]));
  const banner = outcomeLine(sp);

  return (
    <div className="grid gap-4" id="kesehatan">
      <h2 className="text-lg font-medium">{s("studio.bank.judul")}</h2>
      <p className="text-sm text-ink-2">{s("studio.bank.intro")}</p>
      {/* DAISY-18: one form per item; the answer heads the list it came from */}
      <HasilDi q={sp} bagian="kesehatan" kalimat={banner} />

      {items.length === 0 ? (
        <p className={card}>{s("studio.paket.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((i) => {
            const h = healthByItem.get(i.id);
            const pilihan = pilihanTinjauan(h?.state);
            const hasEmpirical = i.empirical_difficulty !== null && i.empirical_evidence_count !== null;
            return (
              // The short id is not shown; it stays on the row as data-soal, for
              // the staging journey's check of which school's questions are listed
              <li key={i.id} className={card} data-soal={short(i.id)}>
                <p className="font-medium"><TeksBaris teks={i.stem} /></p>
                <p className="mt-1 text-sm text-ink-3">{enumLabel("bank", i.bank_type)}</p>
                <p className="mt-2 text-sm text-ink-2 tabular-nums">
                  {s("studio.bank.prediksi")}: {i.predicted_difficulty ?? "—"}
                </p>
                {hasEmpirical ? (
                  <p className="mt-1 text-sm text-ink-2">
                    {s("studio.bank.empiris")}: {i.empirical_difficulty} · {i.empirical_evidence_count}
                  </p>
                ) : null}
                {pilihan.length > 0 && mayReview.some((m) => m.id === i.institution_id) ? (
                  <form action={recordQuestionHealthReviewAction} id={`kesehatan-${i.id}`} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="soal" value={i.id} />
                    <label className={label}>
                      <span>{s("studio.bank.kesehatan")}</span>
                      <select className={field} name="keputusan" defaultValue={pilihan[0]}>
                        {pilihan.map((p) => (
                          <option key={p} value={p}>{s(LABEL_TINJAUAN[p])}</option>
                        ))}
                      </select>
                    </label>
                    <input className={field} name="catatan" placeholder={s("studio.paket.catatan")} aria-label={s("studio.paket.catatan")} />
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
                  </form>
                ) : null}
                {pilihan.length > 0 && mayReview.some((m) => m.id === i.institution_id)
                  ? <SimpanIsian form={`kesehatan-${i.id}`} ditolak={ditolak("kesehatan")} pemilik={pemilik} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
