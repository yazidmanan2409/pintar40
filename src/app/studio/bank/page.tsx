import { pitaKesulitan, rentangPita } from "@/lib/unggah-kontrak";
import { redirect } from "next/navigation";
import Ikon from "@/components/Ikon";
import { enumLabel } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import Kosong from "@/components/Kosong";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, card, field, kataStudio, label, outcomeLine, short, studioInstitutions, tabSaya } from "../_lib";
import { recordQuestionHealthReviewAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import { TeksBaris } from "@/components/teks/Teks";
import { pilihanTinjauan, SEDANG_DITINJAU } from "@/lib/kesehatan-soal";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/bank");

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
 *
 * CR-52 (QN5, D-123): the bank is browsed, narrowed and reviewed. A plain GET
 * form narrows the list by what a question is used for (its bank) and by the
 * author's estimate of its difficulty (the same band pitaKesulitan draws).
 * Each question shows its key and every option's reason, read exactly as the
 * package page reads them (D-088(h)): with the reader's own client, under
 * item_options' row security, and only where the reader holds CAN_DRAFT in
 * that question's school. Nothing here writes a question.
 *
 * F-7 (owner ruling, 2 Nov, Batch 3 closure; QN5, J4.8, W1.11): the bank is for the teachers who author too. A reader
 * with CAN_DRAFT browses their own school's questions, keys and reasons (items and item_options are CAN_DRAFT's under
 * row security, school by school). Question Health stays the reviewer's (J4.9): the evidence figures, the health state
 * and the review form are shown only in a school where the reader holds CAN_REVIEW_QUESTION_HEALTH, and
 * question_health's own row security reads nothing to anyone else.
 */
const BANK = ["PRACTICE", "TEST", "EXAM"] as const;
const PITA = ["MUDAH", "SEDANG", "SULIT"] as const;
type Saringan = {
  eq(kolom: string, nilai: string): Saringan;
  lte(kolom: string, nilai: number): Saringan; gt(kolom: string, nilai: number): Saringan;
  lt(kolom: string, nilai: number): Saringan; gte(kolom: string, nilai: number): Saringan;
};
type Opsi = { item_id: string; label: string; body: string; is_correct: boolean; rationale: string };
const LABEL_TINJAUAN = {
  UNDER_REVIEW: "studio.bank.kesehatan",
  ACKNOWLEDGED_OK: "studio.bank.akui_ok",
  ACTION_TAKEN: "studio.bank.tindakan",
} as const;

type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string; bank?: string; tingkat?: string }>;

export default async function Bank({ searchParams }: { searchParams: Search }) {
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("bank")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // W1.9 (UX-25): every word in the reader's language
  const locale = await currentLocale();
  const s = kataStudio(locale);
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const institutions = await studioInstitutions();
  const mayReview = institutions.filter((i) => i.capabilities.includes("CAN_REVIEW_QUESTION_HEALTH"));
  // F-7: the schools whose bank this reader browses, as the tab gives it (CAN_DRAFT or Question Health)
  const bisaBank = institutions.filter((i) => i.capabilities.includes("CAN_DRAFT") || i.capabilities.includes("CAN_REVIEW_QUESTION_HEALTH"));
  const sehatDi = new Set(mayReview.map((m) => m.id));

  // CR-52: the two narrowing choices, each only one of its known values
  const bank = (BANK as readonly string[]).includes(sp.bank ?? "") ? sp.bank! : "";
  const tingkat = (PITA as readonly string[]).includes(sp.tingkat ?? "") ? sp.tingkat! : "";
  const pita = rentangPita(tingkat);
  const saring = <T,>(q: T): T => {
    let x = q as unknown as Saringan;
    if (bank) x = x.eq("bank_type", bank);
    if (pita?.lte !== undefined) x = x.lte("predicted_difficulty", pita.lte);
    if (pita?.gt !== undefined) x = x.gt("predicted_difficulty", pita.gt);
    if (pita?.lt !== undefined) x = x.lt("predicted_difficulty", pita.lt);
    if (pita?.gte !== undefined) x = x.gte("predicted_difficulty", pita.gte);
    return x as unknown as T;
  };
  const kolom = "id, stem, bank_type, predicted_difficulty, empirical_difficulty, empirical_discrimination, empirical_evidence_count, institution_id, supersedes_item_id";
  type Sehat = { item_id: string; state: string; evidence_count: number };
  const [{ data: terbaru }, { data: menunggu }] = await Promise.all([
    // L3 (D-127 Q2): the working context's school only (studioInstitutions is narrowed to it)
    saring(supabase.from("items").select(kolom).in("institution_id", bisaBank.map((i) => i.id)))
      .order("created_at", { ascending: false }).limit(40),
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
    ? await saring(supabase.from("items").select(kolom).in("id", lamaIds)).order("created_at", { ascending: false })
    : { data: [] };
  const items = [...baru, ...(lama ?? [])];
  // health for exactly the items shown, and only in a school where the reader reviews Question Health (F-7, J4.9)
  const sehatIds = items.filter((i) => sehatDi.has(i.institution_id)).map((i) => i.id);
  const { data: health } = sehatIds.length
    ? await supabase.from("question_health").select("item_id, state, evidence_count, note").in("item_id", sehatIds)
    : { data: [] };

  // CR-52: each question's key and reasons, for the schools where this reader holds CAN_DRAFT (D-088(h)); the
  // database's row security decides again, and reads a hundred questions at a time as the package page does
  const bolehKunci = new Set(institutions.filter((i) => i.capabilities.includes("CAN_DRAFT")).map((i) => i.id));
  const denganKunci = items.filter((i) => bolehKunci.has(i.institution_id)).map((i) => i.id);
  const opsi: Opsi[] = [];
  for (let k = 0; k < denganKunci.length; k += 100) {
    const { data } = await supabase.from("item_options").select("item_id, label, body, is_correct, rationale")
      .in("item_id", denganKunci.slice(k, k + 100));
    opsi.push(...((data ?? []) as Opsi[]));
  }
  const opsiPerSoal = new Map<string, Opsi[]>();
  for (const o of [...opsi].sort((a, b) => a.label.localeCompare(b.label))) {
    opsiPerSoal.set(o.item_id, [...(opsiPerSoal.get(o.item_id) ?? []), o]);
  }

  const healthByItem = new Map(((health ?? []) as Sehat[]).map((h) => [h.item_id, h]));
  const banner = outcomeLine(sp, locale);

  return (
    <div className="pin-studio-halaman" id="kesehatan">
      <h2 className="pin-studio-h2">{s("studio.bank.judul")}</h2>
      <p className="pin-ket">{s("studio.bank.intro")}</p>
      {/* DAISY-18: one form per item; the answer heads the list it came from */}
      <HasilDi q={sp} bagian="kesehatan" kalimat={banner} />

      {/* CR-52: narrow the list; a GET form, so the choice is in the address and the list is read again */}
      <form method="get" action="/studio/bank" className="pin-baris-aksi">
        <label className={label}>
          <span>{s("studio.bank.saring.untuk")}</span>
          <select className={field} name="bank" defaultValue={bank}>
            <option value="">{s("studio.bank.saring.semua")}</option>
            {BANK.map((b) => <option key={b} value={b}>{enumLabel("bank", b, locale)}</option>)}
          </select>
        </label>
        <label className={label}>
          <span>{s("studio.bank.prediksi")}</span>
          <select className={field} name="tingkat" defaultValue={tingkat}>
            <option value="">{s("studio.bank.saring.semua")}</option>
            {PITA.map((p) => <option key={p} value={p}>{s(`mengajar.cepat.tingkat.${p}`)}</option>)}
          </select>
        </label>
        <button type="submit" className={button}>{s("studio.bank.saring.tombol")}</button>
      </form>

      {items.length === 0 ? (
        // W3.2 (Empty state): «nothing matches» when narrowed, «not yet» otherwise; no action is offered (Daisy, open)
        <Kosong jenis={bank || tingkat ? "tidak_cocok" : "belum"} kalimat={s(bank || tingkat ? "studio.bank.saring.kosong" : "studio.paket.kosong")} />
      ) : (
        <ul className="pin-daftar">
          {items.map((i) => {
            const h = healthByItem.get(i.id);
            const pilihan = pilihanTinjauan(h?.state);
            // F-7 (J4.9): the evidence figures are Question Health's, shown only to its reviewer in that school
            const hasEmpirical = sehatDi.has(i.institution_id) && i.empirical_difficulty !== null && i.empirical_evidence_count !== null;
            return (
              // The short id is not shown; it stays on the row as data-soal, for
              // the staging journey's check of which school's questions are listed
              <li key={i.id} className={card} data-soal={short(i.id)}>
                <p className="pin-judul-baris"><TeksBaris teks={i.stem} /></p>
                <p className="pin-ket-3">{enumLabel("bank", i.bank_type, locale)}</p>
                <p className="pin-ket pin-num">
                  {/* L4 (CR-85): the author's word for it (FD-5's scale), not the number underneath */}
                  {s("studio.bank.prediksi")}: {pitaKesulitan(i.predicted_difficulty) ? s(`mengajar.cepat.tingkat.${pitaKesulitan(i.predicted_difficulty)!}`) : "—"}
                </p>
                {(opsiPerSoal.get(i.id) ?? []).length > 0 ? (
                  <details className="pin-disclosure pin-temuan-lokasi">
                    <summary>{s("studio.bank.kunci_alasan")}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
                    <ul className="pin-daftar-rapat">
                      {(opsiPerSoal.get(i.id) ?? []).map((o) => (
                        <li key={o.label} className={o.is_correct ? "pin-opsi pin-opsi-kunci" : "pin-opsi"}>
                          <span className={o.is_correct ? "pin-judul-baris" : undefined}>{o.label}. <TeksBaris teks={o.body} /></span>
                          {o.is_correct ? <strong className="pin-ket"> · {s("studio.soal.kunci")}</strong> : null}
                          <p className="pin-ket">{s("studio.soal.alasan")}: <TeksBaris teks={o.rationale} /></p>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                {hasEmpirical ? (
                  <p className="pin-ket">
                    {s("studio.bank.empiris")}: {i.empirical_difficulty} · {i.empirical_evidence_count}
                  </p>
                ) : null}
                {pilihan.length > 0 && sehatDi.has(i.institution_id) ? (
                  <form action={recordQuestionHealthReviewAction} id={`kesehatan-${i.id}`} className="pin-baris-aksi">
                    <input type="hidden" name="soal" value={i.id} />
                    <label className={label}>
                      <span>{s("studio.bank.kesehatan")}</span>
                      <select className={field} name="keputusan" defaultValue={pilihan[0]}>
                        {pilihan.map((p) => (
                          <option key={p} value={p}>{s(LABEL_TINJAUAN[p])}</option>
                        ))}
                      </select>
                    </label>
                    <label className={label}><span>{s("studio.paket.catatan")}</span><input className={field} name="catatan" /></label>
                    <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.integritas.catat")}</TombolKirim>
                  </form>
                ) : null}
                {pilihan.length > 0 && sehatDi.has(i.institution_id)
                  ? <SimpanIsian form={`kesehatan-${i.id}`} ditolak={ditolak("kesehatan")} pemilik={pemilik} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
