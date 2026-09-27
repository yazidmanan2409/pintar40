import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { button, card, field, label, outcomeLine, s, studioInstitutions, when } from "../_lib";
import { grantDistributionAction, withdrawDistributionAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";

/**
 * The PINTAR library — distributed canonical content (this phase's §5.3).
 *
 * Visible, assignable, previewable, and offering no authoring action at all:
 * there is no edit, approve, freeze, publish or withdraw control on this page,
 * because a school holds no role assignment in the canonical tenant and every
 * such write would be refused. The absence is the point, and it is structural
 * rather than a hidden button.
 *
 * A withdrawn grant is still listed, with its plain-language consequence:
 * learners already working continue, new sessions do not open (INV-27).
 */

type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

export default async function Kanonik({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const institutions = await studioInstitutions();

  const [{ data: rows }, { data: isSys }, { data: canonicalReleases }] = await Promise.all([
    supabase.rpc("distributed_releases"),
    supabase.rpc("is_system_admin"),
    supabase.from("plp_releases").select("id, version_label, status, course_id, institution_id")
      .eq("status", "PUBLISHED"),
  ]);

  const catalogue = (rows ?? []) as Array<{
    plp_release_id: string; version_label: string; published_at: string | null;
    course_id: string; course_title: string; subject: string; stage: string; grade_label: string;
    owner_institution_id: string; owner_name: string; consuming_institution_id: string;
    distribution_status: string; authorized_at: string; withdrawn_at: string | null;
  }>;

  const banner = outcomeLine(sp);

  // The grant form appears only for a caller the database would accept: a
  // system administrator, or a publisher in a canonical tenant.
  const canonicalOwners = institutions.filter((i) => i.capabilities.includes("CAN_PUBLISH"));
  const mayGrant = isSys === true || canonicalOwners.length > 0;

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-lg font-medium">{s("studio.kanonik.judul")}</h2>
        <p className="mt-1 text-sm text-ink-2">{s("studio.kanonik.penjelasan")}</p>
      </div>
      {banner ? <p className={card}>{banner}</p> : null}

      {catalogue.length === 0 ? (
        <p className={card}>{s("studio.kanonik.kosong")}</p>
      ) : (
        <ul className="grid gap-2">
          {catalogue.map((r) => (
            <li key={`${r.plp_release_id}:${r.consuming_institution_id}`} className={card}>
              <p className="font-medium">{r.course_title}</p>
              <p className="mt-1 text-sm text-ink-3">
                {r.subject} · {r.stage} · {r.grade_label} · {r.owner_name}
              </p>
              <p className="mt-2 text-sm text-ink-2">{s("studio.kanonik.hanya_baca")}</p>
              {r.distribution_status === "WITHDRAWN" ? (
                <p className="mt-2 text-sm text-ink-2">{s("studio.kanonik.ditarik")}</p>
              ) : (
                <p className="mt-2 text-sm text-ink-3">{when(r.authorized_at)}</p>
              )}
              <p className="mt-2 text-sm">
                <Link href={`/studio/kanonik/${r.plp_release_id}`} className="underline underline-offset-4">
                  {s("studio.paket.pratinjau")}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}

      {mayGrant ? (
        <section className={card} id="izin">
          <h3 className="font-medium">{s("studio.kanonik.judul")}</h3>
          <form action={grantDistributionAction} className="mt-3 flex flex-wrap items-end gap-2">
            <label className={label}>
              <span>{s("studio.paket.terbitkan")}</span>
              <select className={field} name="release" defaultValue="" required>
                <option value="" disabled>—</option>
                {(canonicalReleases ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.id.slice(0, 8)}</option>
                ))}
              </select>
            </label>
            <input className={field} name="institution" placeholder="id sekolah" required />
            <input className={field} name="alasan" placeholder="alasan" />
            <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
          </form>
          <form action={withdrawDistributionAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input className={field} name="distribusi" placeholder="id izin" required />
            <input className={field} name="alasan" placeholder="alasan" required />
            <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.paket.tarik")}</TombolKirim>
          </form>
        </section>
      ) : null}
    </div>
  );
}
