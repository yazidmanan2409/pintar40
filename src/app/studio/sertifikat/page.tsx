import { supabaseServer } from "@/lib/supabase/server";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions } from "../_lib";
import { saveCertificateTemplateAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";

/**
 * Certificate template manager (§10).
 *
 * Layouts and numbering prefixes only. Identity presentation is name-only and
 * is not offered as a choice, because OD-10 has not been answered — the
 * database refuses any other value, so the absent control and the refusal say
 * the same thing. Nothing here touches the public verification payload, which
 * stays fixed at {pass, predikat, institution, date, validity}.
 */
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Sertifikat({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = (await studioInstitutions()).filter((i) => can(i, "CAN_PUBLISH"));

  const [{ data: templates }, { data: courses }] = await Promise.all([
    supabase.from("certificate_templates")
      .select("id, institution_id, course_id, module_id, layout, number_prefix, identity_presentation"),
    supabase.from("courses").select("id, title, institution_id").order("title"),
  ]);

  const banner = outcomeLine(sp);

  return (
    <div className="grid gap-4" id="sertifikat">
      <h2 className="text-lg font-medium">{s("studio.sertifikat.judul")}</h2>
      <p className="text-sm text-ink-2">{s("studio.sertifikat.identitas")}</p>
      {banner ? <p className={card}>{banner}</p> : null}

      <section className={card}>
        <form action={saveCertificateTemplateAction} className="grid gap-2">
          <label className={label}>
            <span>{s("config.section.roles")}</span>
            <select className={field} name="institution" defaultValue={institutions[0]?.id ?? ""} required>
              {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </label>
          <label className={label}>
            <span>{s("studio.paket.judul")}</span>
            <select className={field} name="course" defaultValue="">
              <option value="">—</option>
              {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className={label}>
            <span>{s("studio.sertifikat.tata_letak")}</span>
            <select className={field} name="tata_letak" defaultValue="CLASSIC">
              {["CLASSIC", "MODERN", "MINIMAL"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className={label}>
            <span>{s("studio.sertifikat.awalan")}</span>
            <input className={field} name="awalan" placeholder="PNT/2026" required />
          </label>
          <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.sertifikat.simpan")}</TombolKirim>
        </form>
      </section>

      {(templates ?? []).length > 0 ? (
        <ul className="grid gap-2">
          {(templates ?? []).map((t) => (
            <li key={t.id} className={card}>
              <p className="font-medium">{t.number_prefix}</p>
              <p className="mt-1 text-sm text-ink-3">{t.layout}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
