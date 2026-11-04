import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { button, card, field, kataStudio, label, outcomeLine, peranStudio, studioInstitutions, when, tabSaya } from "../_lib";
import { currentLocale } from "@/lib/locale";
import Kosong from "@/components/Kosong";
import TandaTautan from "@/components/TandaTautan";
import { grantDistributionAction, withdrawDistributionAction } from "../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/kanonik");

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
  // CR-87: a tab not this person's sends them to Studio's home (src/lib/studio-tab.ts); the database still decides
  if (!(await tabSaya()).includes("kanonik")) redirect("/studio");
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // W1.9 (UX-25): every word in the reader's language, a date with its year and WIB in it too
  const locale = await currentLocale();
  const s = kataStudio(locale);
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  const institutions = await studioInstitutions();

  const [{ data: rows }, { data: isSys }, peran] = await Promise.all([
    supabase.rpc("distributed_releases"),
    supabase.rpc("is_system_admin"),
    peranStudio(),
  ]);
  // L3 (D-127 Q2; D-132 C7): the working context's place (studioInstitutions is narrowed to it): in a school, what
  // the library gives that school; in Pustaka PINTAR, that library's packages wherever they were given
  const ids = new Set(institutions.map((i) => i.id));
  const { data: jenisTempat } = ids.size
    ? await supabase.from("institutions").select("id, tenant_kind").in("id", [...ids])
    : { data: [] as Array<{ id: string; tenant_kind: string }> };
  const pustakaIni = (jenisTempat ?? []).filter((t) => t.tenant_kind === "PLATFORM_CANONICAL").map((t) => t.id as string);

  const catalogue = ((rows ?? []) as Array<{
    plp_release_id: string; version_label: string; published_at: string | null;
    course_id: string; course_title: string; subject: string; stage: string; grade_label: string;
    owner_institution_id: string; owner_name: string; consuming_institution_id: string;
    distribution_status: string; authorized_at: string; withdrawn_at: string | null;
  }>).filter((r) => ids.has(r.consuming_institution_id) || ids.has(r.owner_institution_id));

  const banner = outcomeLine(sp, locale);

  // CR-87 (4), FD-8 (D-127; ADR-0015): granting and withdrawing the library is the platform operator's alone, by names.
  // Every school admin was shown the form (CAN_PUBLISH in their own school), which the database refused, and it asked
  // for «id sekolah» and an «id izin» no screen shows. Now only Admin platform sees it, and every choice is a name: the
  // library's published packages, the schools, and the grants still open, each read for this form.
  // L3 (D-132 C7, C8): and in the library's own context, Pustaka PINTAR, by Admin platform's grant there; the receiving
  // school is named in the form (Q11). The database decides the grant either way (grant_release_distribution).
  const mayGrant = isSys === true && peran.includes("SYSTEM_ADMIN") && pustakaIni.length > 0;
  type Pilihan = { id: string; nama: string };
  let paketPustaka: Pilihan[] = [];
  let sekolahTujuan: Pilihan[] = [];
  let izinBerlaku: Pilihan[] = [];
  if (mayGrant) {
    const { data: tenant } = await supabase.from("institutions").select("id, name, tenant_kind, is_active").order("name");
    const pustaka = pustakaIni;
    sekolahTujuan = (tenant ?? []).filter((t) => t.tenant_kind === "INSTITUTION" && t.is_active !== false)
      .map((t) => ({ id: t.id as string, nama: t.name as string }));
    const [{ data: rilis }, { data: izin }] = await Promise.all([
      pustaka.length
        ? supabase.from("plp_releases").select("id, version_label, course_id").eq("status", "PUBLISHED").in("institution_id", pustaka)
        : Promise.resolve({ data: [] as Array<{ id: string; version_label: string; course_id: string }> }),
      supabase.from("release_distributions").select("id, plp_release_id, institution_id").eq("status", "ACTIVE"),
    ]);
    const rilisSemua = (rilis ?? []) as Array<{ id: string; version_label: string; course_id: string }>;
    const { data: kursus } = rilisSemua.length
      ? await supabase.from("courses").select("id, title").in("id", [...new Set(rilisSemua.map((r) => r.course_id))])
      : { data: [] as Array<{ id: string; title: string }> };
    const judul = new Map((kursus ?? []).map((k) => [k.id as string, k.title as string]));
    const namaRilis = new Map(rilisSemua.map((r) => [r.id, `${judul.get(r.course_id) ?? "—"} · ${r.version_label}`]));
    const namaSekolah = new Map(sekolahTujuan.map((x) => [x.id, x.nama]));
    paketPustaka = rilisSemua.map((r) => ({ id: r.id, nama: namaRilis.get(r.id)! })).sort((a, b) => a.nama.localeCompare(b.nama));
    izinBerlaku = ((izin ?? []) as Array<{ id: string; plp_release_id: string; institution_id: string }>)
      .filter((d) => namaRilis.has(d.plp_release_id) && namaSekolah.has(d.institution_id))
      .map((d) => ({ id: d.id, nama: `${namaRilis.get(d.plp_release_id)} · ${namaSekolah.get(d.institution_id)}` }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  return (
    <div className="pin-studio-halaman">
      <div>
        <h2 className="pin-studio-h2">{s("studio.kanonik.judul")}</h2>
        <p className="pin-ket">{s("studio.kanonik.penjelasan")}</p>
      </div>

      {catalogue.length === 0 ? (
        // W3.2 (Empty state, «not yet»): what will appear here; a school cannot itself make the library give it more
        <Kosong jenis="belum" kalimat={s("studio.kanonik.kosong")} />
      ) : (
        <ul className="pin-daftar">
          {catalogue.map((r) => (
            <li key={`${r.plp_release_id}:${r.consuming_institution_id}`} className={card}>
              <p className="pin-judul-baris">{r.course_title}</p>
              <p className="pin-ket-3">
                {r.subject} · {r.stage} · {r.grade_label} · {r.owner_name}
              </p>
              <p className="pin-ket">{s("studio.kanonik.hanya_baca")}</p>
              {r.distribution_status === "WITHDRAWN" ? (
                <p className="pin-ket">{s("studio.kanonik.ditarik")}</p>
              ) : (
                <p className="pin-ket-3">{when(r.authorized_at, locale)}</p>
              )}
              <p className="pin-ket">
                <Link href={`/studio/kanonik/${r.plp_release_id}`} className="pin-tautan">
                  {s("studio.paket.pratinjau")}<TandaTautan />
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}

      {mayGrant ? (
        <section className={card} id="izin">
          <h3 className="pin-studio-h3">{s("studio.kanonik.judul")}</h3>
          <form action={grantDistributionAction} id="izin-beri" className="pin-baris-aksi">
            <label className={label}>
              <span>{s("studio.paket.judul")}</span>
              <select className={field} name="release" defaultValue="" required>
                <option value="" disabled>—</option>
                {paketPustaka.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
            </label>
            <label className={label}>
              <span>{s("studio.sekolah")}</span>
              <select className={field} name="institution" defaultValue="" required>
                <option value="" disabled>—</option>
                {sekolahTujuan.map((x) => <option key={x.id} value={x.id}>{x.nama}</option>)}
              </select>
            </label>
            <label className={label}>
              <span>{s("config.ketuntasan.alasan")}</span>
              <input className={field} name="alasan" />
            </label>
            <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.definisi.simpan")}</TombolKirim>
          </form>
          <SimpanIsian form="izin-beri" ditolak={ditolak("izin-beri")} pemilik={pemilik} />
          <HasilDi q={sp} bagian="izin-beri" kalimat={banner} />
          {izinBerlaku.length > 0 ? (
            <form action={withdrawDistributionAction} id="izin-tarik" className="pin-baris-aksi">
              <label className={label}>
                <span>{s("studio.paket.judul")}</span>
                <select className={field} name="distribusi" defaultValue="" required>
                  <option value="" disabled>—</option>
                  {izinBerlaku.map((d) => <option key={d.id} value={d.id}>{d.nama}</option>)}
                </select>
              </label>
              <label className={label}>
                <span>{s("studio.langkah.tarik.alasan")}</span>
                <input className={field} name="alasan" required />
              </label>
              <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.paket.tarik")}</TombolKirim>
            </form>
          ) : null}
          {izinBerlaku.length > 0 ? <SimpanIsian form="izin-tarik" ditolak={ditolak("izin-tarik")} pemilik={pemilik} /> : null}
          {/* E-K4: a withdrawal is answered under its form (drawn also when the last permission has gone with it) */}
          <HasilDi q={sp} bagian="izin-tarik" kalimat={banner} />
        </section>
      ) : null}
    </div>
  );
}
