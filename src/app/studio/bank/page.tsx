import { enumLabel } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { button, card, field, label, outcomeLine, s, short, studioInstitutions } from "../_lib";
import { recordQuestionHealthReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";

/**
 * Content & Question Banks, and the Question Health surface (§8, §10).
 *
 * Predicted difficulty is shown as AUTHORED. Empirical fields are shown only
 * when they are legitimately present; while FABLE-06 has computed nothing they
 * are NULL, and the surface says "not enough evidence yet" rather than
 * borrowing a number from somewhere. Nothing on this page computes a
 * statistic, and nothing here states that a question is "too easy" or "wrong":
 * a reviewer sees the evidence and records what they decided.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Bank({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = await studioInstitutions();
  const mayReview = institutions.filter((i) => i.capabilities.includes("CAN_REVIEW_QUESTION_HEALTH"));

  const [{ data: items }, { data: health }] = await Promise.all([
    supabase.from("items")
      .select("id, stem, bank_type, predicted_difficulty, empirical_difficulty, empirical_discrimination, empirical_evidence_count, institution_id, supersedes_item_id")
      .order("created_at", { ascending: false }).limit(40),
    supabase.from("question_health").select("item_id, state, evidence_count, note").limit(200),
  ]);

  const healthByItem = new Map(((health ?? []) as Array<{ item_id: string; state: string; evidence_count: number }>)
    .map((h) => [h.item_id, h]));
  const banner = outcomeLine(sp);

  return (
    <div className="grid gap-4" id="kesehatan">
      <h2 className="text-lg font-medium">{s("studio.bank.judul")}</h2>
      {/* DAISY-18: one form per item; the answer heads the list it came from */}
      <HasilDi q={sp} bagian="kesehatan" kalimat={banner} />

      {(items ?? []).length === 0 ? (
        <p className={card}>{s("studio.paket.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {(items ?? []).map((i) => {
            const h = healthByItem.get(i.id);
            const hasEmpirical = i.empirical_difficulty !== null && i.empirical_evidence_count !== null;
            return (
              <li key={i.id} className={card}>
                <p className="font-medium">{i.stem}</p>
                <p className="mt-1 text-sm text-ink-3">{enumLabel("bank", i.bank_type)} · {short(i.id)}</p>
                <p className="mt-2 text-sm text-ink-2 tabular-nums">
                  {s("studio.bank.prediksi")}: {i.predicted_difficulty ?? "—"}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {hasEmpirical
                    ? `${s("studio.bank.empiris")}: ${i.empirical_difficulty} · ${i.empirical_evidence_count}`
                    : s("studio.bank.belum_cukup")}
                </p>
                {h && h.state === "SIGNAL_RAISED" && mayReview.some((m) => m.id === i.institution_id) ? (
                  <form action={recordQuestionHealthReviewAction} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="soal" value={i.id} />
                    <label className={label}>
                      <span>{s("studio.bank.kesehatan")}</span>
                      <select className={field} name="keputusan" defaultValue="UNDER_REVIEW">
                        <option value="UNDER_REVIEW">{s("studio.bank.kesehatan")}</option>
                        <option value="ACKNOWLEDGED_OK">{s("studio.bank.akui_ok")}</option>
                        <option value="ACTION_TAKEN">{s("studio.bank.tindakan")}</option>
                      </select>
                    </label>
                    <input className={field} name="catatan" placeholder="catatan" />
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
