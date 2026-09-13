import { supabaseServer } from "@/lib/supabase/server";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions } from "../_lib";
import { confirmMappingAction, easyUploadAction, structuredImportAction } from "../actions";

/**
 * Content Factory (§2). Two paths, both landing at INGESTED and converging on
 * the canonical PLP. The verbs are "Buat Paket / Penilaian / Video" — never
 * "Import", "Parse" or "Validate".
 *
 * Easy Upload never silently guesses a mapping that changes what a learner
 * sees: `propose_easy_upload_mapping` returns open questions, and the batch
 * stays unconfirmed until a human answers them here.
 *
 * Media never leaves the browser to storage directly — the asset routes under
 * /api/assets hold the signed-upload contract (INV-15), and this page holds no
 * storage client at all.
 */

type Search = Promise<{ hasil?: string; detail?: string; bagian?: string }>;

export default async function Unggah({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = (await studioInstitutions()).filter((i) => can(i, "CAN_DRAFT"));

  const { data: batches } = await supabase
    .from("ingest_batches")
    .select("id, source_kind, status, open_questions, mapping_confidence, confirmed_at, created_at, institution_id")
    .order("created_at", { ascending: false })
    .limit(10);

  const banner = outcomeLine(sp.hasil, sp.detail);
  const pending = (batches ?? []).filter(
    (b) => b.confirmed_at === null && Array.isArray(b.open_questions) && b.open_questions.length > 0,
  );

  const institutionField = (
    <label className={label}>
      <span>{s("config.section.roles")}</span>
      <select className={field} name="institution" defaultValue={institutions[0]?.id ?? ""} required>
        {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );

  return (
    <div className="grid gap-6">
      <h2 className="text-lg font-medium">{s("studio.unggah.judul")}</h2>
      {banner ? <p className={card}>{banner}</p> : null}
      <p className="text-sm text-ink-2">{s("studio.unggah.media_catatan")}</p>

      <section className={card} id="mudah">
        <h3 className="font-medium">{s("studio.unggah.mudah")}</h3>
        <p className="mt-1 text-sm text-ink-2">{s("studio.unggah.mudah_penjelasan")}</p>
        <form action={easyUploadAction} className="mt-3 grid gap-2">
          {institutionField}
          <label className={label}>
            <span>{s("studio.unggah.buat_paket")}</span>
            <textarea className={field} name="isi" rows={6} defaultValue="{}" />
          </label>
          <div className="flex flex-wrap gap-2">
            <input className={field} name="produsen" placeholder="produsen" />
            <input className={field} name="kontrak" placeholder="kontrak kemampuan" />
            <input className={field} name="permintaan" placeholder="id permintaan" />
          </div>
          <button className={button} type="submit">{s("studio.unggah.buat_paket")}</button>
        </form>
      </section>

      <section className={card} id="terstruktur">
        <h3 className="font-medium">{s("studio.unggah.terstruktur")}</h3>
        <p className="mt-1 text-sm text-ink-2">{s("studio.unggah.terstruktur_penjelasan")}</p>
        <form action={structuredImportAction} className="mt-3 grid gap-2">
          {institutionField}
          <label className={label}>
            <span>{s("studio.unggah.buat_penilaian")}</span>
            <textarea className={field} name="isi" rows={6} defaultValue="{}" />
          </label>
          <div className="flex flex-wrap gap-2">
            <input className={field} name="produsen" placeholder="produsen" />
            <input className={field} name="kontrak" placeholder="kontrak kemampuan" />
            <input className={field} name="permintaan" placeholder="id permintaan" />
          </div>
          <button className={button} type="submit">{s("studio.unggah.buat_paket")}</button>
        </form>
      </section>

      {pending.length > 0 ? (
        <section className="grid gap-2" id="pertanyaan">
          <h3 className="text-lg font-medium">{s("studio.unggah.pertanyaan")}</h3>
          {pending.map((b) => (
            <div key={b.id} className={card}>
              <ul className="list-disc pl-5 text-sm text-ink-2">
                {(b.open_questions as Array<Record<string, unknown>>).map((q, i) => (
                  <li key={i}>{typeof q === "string" ? q : String(q.question ?? JSON.stringify(q))}</li>
                ))}
              </ul>
              <form action={confirmMappingAction} className="mt-3">
                <input type="hidden" name="batch" value={b.id} />
                <button className={button} type="submit">{s("studio.unggah.konfirmasi")}</button>
              </form>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
