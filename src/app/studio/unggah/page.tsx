import { supabaseServer } from "@/lib/supabase/server";
import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { BATAS_PAKET } from "@/lib/unggah-kontrak";
import { sekolahDitawarkan } from "@/components/sekolah";
import PanelUnggah from "@/components/unggah/PanelUnggah";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions } from "../_lib";
import { confirmMappingAction, easyUploadAction, structuredImportAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";

/**
 * Content Factory (§2). Two paths, both landing at INGESTED and converging on
 * the canonical PLP. The verbs are "Buat Paket / Penilaian / Video" — never
 * "Import", "Parse" or "Validate".
 *
 * Easy Upload never silently guesses a mapping that changes what a learner
 * sees: `propose_easy_upload_mapping` returns open questions, and the batch
 * stays unconfirmed until a human answers them here.
 *
 * Media never reaches storage except through the asset route under
 * /api/assets, which holds the signed-upload contract (INV-15): the browser
 * asks it for a signed upload to one path and sends the file there.
 *
 * DAISY-06. THE WORKBOOK FIRST. A teacher's way in is the Excel template and a
 * file picker (PanelUnggah), checked row by row before anything is saved. The
 * two JSON forms below stay for packages another system produces.
 *
 * THE SCHOOL is one the reader may draft in AND a real, active school
 * (sekolah.ts), never the national library, which sorts first by name and was
 * preselected here (audit S14; D-029: an import writes only into a school).
 * Both the panel and the JSON forms offer that same list, labelled "Sekolah".
 */

type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Unggah({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const [boleh, locale] = await Promise.all([studioInstitutions(), currentLocale()]);
  const menyusun = new Set(boleh.filter((i) => can(i, "CAN_DRAFT")).map((i) => i.id));
  const { data: tenant } = menyusun.size
    ? await supabase.from("institutions").select("id, name, tenant_kind, is_active").in("id", [...menyusun]).order("name")
    : { data: [] as Array<{ id: string; name: string; tenant_kind: string | null; is_active: boolean | null }> };
  const institutions = sekolahDitawarkan(tenant ?? [], (id) => menyusun.has(id)).map(({ id, name }) => ({ id, name }));

  const { data: batches } = await supabase
    .from("ingest_batches")
    .select("id, source_kind, status, open_questions, mapping_confidence, confirmed_at, created_at, institution_id")
    .order("created_at", { ascending: false })
    .limit(10);

  const banner = outcomeLine(sp);
  const pending = (batches ?? []).filter(
    (b) => b.confirmed_at === null && Array.isArray(b.open_questions) && b.open_questions.length > 0,
  );

  const institutionField = (
    <label className={label}>
      <span>{s("studio.unggah.sekolah")}</span>
      <select className={field} name="institution" defaultValue={institutions[0]?.id ?? ""} required>
        {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );

  // Polish batch 2 (UX-12): what another system sends with its package. These
  // stay for integrators, labelled in the copy table rather than in the page.
  const bidangSistem = (
    <div className="flex flex-wrap gap-2">
      {(["produsen", "kontrak", "permintaan"] as const).map((nama) => (
        <input key={nama} className={field} name={nama}
          placeholder={s(`studio.unggah.${nama}`)} aria-label={s(`studio.unggah.${nama}`)} />
      ))}
    </div>
  );
  // A JSON form's answer lands inside the disclosure, so it opens to show it.
  const sistemLainTerbuka = sp.bagian === "mudah" || sp.bagian === "terstruktur";

  return (
    <div className="grid gap-6">
      <h2 className="text-lg font-medium">{s("studio.unggah.judul")}</h2>

      <section className={card} id="buku-kerja">
        <h3 className="font-medium">{t("studio.unggah.buku.judul", "staff", { locale })}</h3>
        <p className="mt-1 text-sm text-ink-2">{t("studio.unggah.buku.arti", "staff", { locale })}</p>
        <div className="mt-4">
          <PanelUnggah locale={locale} sekolah={institutions} batasMb={BATAS_PAKET.berkasMaks.nilai / (1024 * 1024)} />
        </div>
      </section>

      {/* Polish batch 2 (UX-12): the two JSON forms are for packages another
          system produces, so they wait in one closed disclosure below the
          workbook, each form with its own button. */}
      <details className="grid gap-4" id="sistem-lain" open={sistemLainTerbuka}>
        <summary className="cursor-pointer text-lg font-medium">{s("studio.unggah.json_judul")}</summary>
        <p className="mt-2 text-sm text-ink-2">{s("studio.unggah.json_arti")}</p>

        <section className={`${card} mt-4`} id="mudah">
          <h3 className="font-medium">{s("studio.unggah.mudah")}</h3>
          <p className="mt-1 text-sm text-ink-2">{s("studio.unggah.mudah_penjelasan")}</p>
          <form action={easyUploadAction} className="mt-3 grid gap-2">
            {institutionField}
            <label className={label}>
              <span>{s("studio.unggah.isi_json")}</span>
              <textarea className={field} name="isi" rows={6} defaultValue="{}" />
            </label>
            {bidangSistem}
            <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.unggah.periksa_mudah")}</TombolKirim>
          </form>
          <HasilDi q={sp} bagian="mudah" kalimat={banner} />
        </section>

        <section className={`${card} mt-4`} id="terstruktur">
          <h3 className="font-medium">{s("studio.unggah.terstruktur")}</h3>
          <p className="mt-1 text-sm text-ink-2">{s("studio.unggah.terstruktur_penjelasan")}</p>
          <form action={structuredImportAction} className="mt-3 grid gap-2">
            {institutionField}
            <label className={label}>
              <span>{s("studio.unggah.isi_json")}</span>
              <textarea className={field} name="isi" rows={6} defaultValue="{}" />
            </label>
            {bidangSistem}
            <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.unggah.periksa_terstruktur")}</TombolKirim>
          </form>
          <HasilDi q={sp} bagian="terstruktur" kalimat={banner} />
        </section>
      </details>

      {/* DAISY-18: a workbook that was read, or a mapping confirmed, answers here
          -- drawn whether or not questions are still open below. */}
      <HasilDi q={sp} bagian="pertanyaan" kalimat={banner} />
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
                <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.unggah.konfirmasi")}</TombolKirim>
              </form>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
