import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import { format, t, type HleEvent } from "@/lib/hle";
import { card, studioInstitutions, tabSaya } from "./_lib";
import { kalimatHasil } from "@/lib/galat-kontrak";
import HasilDi from "@/components/HasilDi";
import { judulHalaman } from "@/lib/judul-halaman";
import { posisiPaket, kunciSalinan } from "@/components/studio/langkah";
import Kosong from "@/components/Kosong";
import Ikon from "@/components/Ikon";
import TandaTautan from "@/components/TandaTautan";
import type { TabStudio } from "@/lib/studio-tab";

export const generateMetadata = judulHalaman("/studio");

/**
 * Studio home — "Beranda" (FABLE-05 §1).
 *
 * Task-first, not a dashboard of everything. `studio_home()` returns no row for
 * an empty bucket, so a card with a zero count cannot render: the emptiness is
 * in the data, not in a `count > 0` the page could forget.
 *
 * W1.7 (Batch 3; UX-34). Each count opens its list: the packages waiting on the reader and those held by a finding
 * are this page's own list, narrowed (`?daftar=`); the review queue, Bank Soal and Pustaka PINTAR are their tabs, and
 * a count whose tab is not this reader's stays a count. The package list says where each package stands, as Daisy's
 * J1Terbit draws Studio's list: «✓ Terbit» (or «Ditarik») as a Badge, otherwise «Sekarang:» and the step it is at
 * (posisiPaket, the steps' own reading of the course and its latest release). Every word in the reader's language
 * (UX-25). A version a correction replaced is not listed or counted: the line is one package, at its newest version.
 */
type Daftar = "ACTION_REQUIRED" | "BLOCKED";
const DAFTAR: readonly Daftar[] = ["ACTION_REQUIRED", "BLOCKED"];

export default async function StudioBeranda({ searchParams }: { searchParams: Promise<{ daftar?: string; bagian?: string; hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string }> }) {
  const sp = await searchParams;
  const daftar = (DAFTAR as readonly string[]).includes(sp.daftar ?? "") ? sp.daftar as Daftar : null;
  const supabase = await supabaseServer();
  const [institutions, locale, tab] = await Promise.all([studioInstitutions(), currentLocale(), tabSaya()]);
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const byId = new Map(institutions.map((i) => [i.id, i.name]));

  // L3 (D-127 Q2): the working context's place only; studioInstitutions is already narrowed to it (an evaluation
  // persona keeps every school, C10), so what is shown here is read for those places alone
  const ids = institutions.map((i) => i.id);
  const menyusun = institutions.filter((i) => i.capabilities.includes("CAN_DRAFT")).map((i) => i.id);
  // W1.7: a narrowed list reads exactly what its count counts (studio_home): drafts waiting on their author, and
  // packages an unacknowledged blocking finding holds
  const { data: tertahan } = daftar === "BLOCKED"
    ? await supabase.from("mcq_quality_findings").select("course_id").in("institution_id", menyusun)
      .eq("severity", "ERROR").is("acknowledged_at", null)
    : { data: [] as Array<{ course_id: string }> };
  // W1.7 (Batch 3 closure): a package is its line's newest version; a version a correction replaced is history, opened
  // from «Riwayat perbaikan», never a package of its own here (studio_home counts the same way, 20261216100000)
  const { data: digantikan } = await supabase.from("courses").select("supersedes_course_id")
    .in("institution_id", daftar ? menyusun : ids).not("supersedes_course_id", "is", null);
  const lama = [...new Set((digantikan ?? []).map((x) => x.supersedes_course_id as string))];
  let kursusQ = supabase.from("courses").select("id, title, subject, grade_label, institution_id, status")
    .in("institution_id", daftar ? menyusun : ids);
  if (lama.length > 0) kursusQ = kursusQ.not("id", "in", `(${lama.join(",")})`);
  if (daftar === "ACTION_REQUIRED") kursusQ = kursusQ.in("status", ["INGESTED", "STRUCTURED", "VALIDATION_FAILED"]);
  if (daftar === "BLOCKED") kursusQ = kursusQ.in("id", [...new Set((tertahan ?? []).map((f) => f.course_id as string))]);
  const [{ data: buckets }, { data: courses }] = await Promise.all([
    supabase.rpc("studio_home"),
    kursusQ.order("created_at", { ascending: false }).limit(30),
  ]);

  // where each package stands: its own status and its latest release's
  const kursusIds = (courses ?? []).map((c) => c.id as string);
  const { data: rilisRows } = kursusIds.length > 0
    ? await supabase.from("plp_releases").select("course_id, status, published_at, created_at").in("course_id", kursusIds)
      .order("created_at", { ascending: true })
    : { data: [] as Array<{ course_id: string; status: string; published_at: string | null; created_at: string }> };
  const rilis = new Map(((rilisRows ?? []) as Array<{ course_id: string; status: string; published_at: string | null }>)
    .map((r) => [r.course_id, r]));
  // A5 C1 (D-173(a)): a package a reviewer sent back carries why it is back, beside the step it is at; its latest review
  // outcome, read under the reader's own row security as the package page reads it (W1.8)
  const { data: tinjauanRows } = kursusIds.length > 0
    ? await supabase.from("content_review_outcomes").select("course_id, outcome, decided_at").in("course_id", kursusIds)
      .order("decided_at", { ascending: true })
    : { data: [] as Array<{ course_id: string; outcome: string; decided_at: string }> };
  const tinjauanTerakhir = new Map(((tinjauanRows ?? []) as Array<{ course_id: string; outcome: string }>).map((o) => [o.course_id, o.outcome]));

  const rows = ((buckets ?? []) as Array<{ bucket: string; institution_id: string; count: number }>)
    .filter((r) => byId.has(r.institution_id));
  // W1.7: where each count opens, and only when that list is the reader's
  const keDaftar = (bucket: string): string | null => {
    const lewat = (t_: TabStudio, href: string) => (tab.includes(t_) ? href : null);
    switch (bucket) {
      case "ACTION_REQUIRED": return "/studio?daftar=ACTION_REQUIRED#paket";
      case "BLOCKED": return "/studio?daftar=BLOCKED#paket";
      case "AWAITING_MY_REVIEW": return lewat("tinjau", "/studio/tinjau");
      case "QUESTION_HEALTH": return lewat("bank", "/studio/bank#kesehatan");
      case "DISTRIBUTED_CANONICAL": return lewat("kanonik", "/studio/kanonik");
      default: return null;
    }
  };

  const isiKartu = (r: { bucket: string; institution_id: string; count: number }) => (
    <>
      <p className="pin-ket-3">{byId.get(r.institution_id) ?? "—"}</p>
      <p className="pin-judul-baris">{s(`studio.bucket.${r.bucket}` as HleEvent)}</p>
      <p className="pin-studio-angka">{format.number(r.count, locale)}</p>
    </>
  );

  return (
    <div className="pin-studio-halaman">
      {/* E-K4: an action that arrived without its package (a broken or stale form) comes back here, and is answered
          here rather than nowhere */}
      <HasilDi q={sp} bagian={["paket", "temuan", "koreksi"]} kalimat={kalimatHasil(sp, s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" })} />
      {/* RV-10 (D-140): no task waiting is not «no package»; the packages are listed below */}
      {rows.length === 0 ? (
        <p className={card}>{s("studio.beranda.tak_ada_tugas")}</p>
      ) : (
        <section className="pin-studio-hitungan">
          {rows.map((r) => {
            const href = keDaftar(r.bucket);
            return href ? (
              <Link key={`${r.bucket}:${r.institution_id}`} href={href} className={`${card} pin-kartu-tautan`}
                aria-current={daftar !== null && href.startsWith(`/studio?daftar=${daftar}#`) ? "page" : undefined}>
                {isiKartu(r)}<TandaTautan />
              </Link>
            ) : (
              <div key={`${r.bucket}:${r.institution_id}`} className={card}>{isiKartu(r)}</div>
            );
          })}
        </section>
      )}

      <section className="pin-studio-halaman" id="paket">
        <h2 className="pin-studio-h3">{s("studio.paket.judul")}</h2>
        {daftar ? (
          <p className="pin-meta">
            {s(`studio.bucket.${daftar}` as HleEvent)}
            {" · "}
            <Link href="/studio#paket" className="pin-studio-tautan">{s("koleksi.saring.semua")}</Link>
          </p>
        ) : null}
        {(courses ?? []).length === 0 ? (
          <Kosong jenis={daftar ? "tidak_cocok" : "belum"} kalimat={s("studio.paket.kosong")}
            aksi={daftar ? { href: "/studio#paket", label: s("koleksi.saring.semua") } : null} />
        ) : (
          <div className="pin-list">
            {(courses ?? []).map((c) => {
              const r = rilis.get(c.id as string) ?? null;
              const posisi = posisiPaket({ statusKursus: c.status as string, terbitan: r ? { status: r.status } : null });
              // Daisy, Badge: one per row, the word carries it; a published package is done (✓), a withdrawn one neutral
              // one badge, drawn twice: beside the row, and as its marked narrow copy in the meta line (R3-LENCANA-01)
              const lencana = (sempit: boolean) => posisi.kini === "terbit"
                ? <span className="pin-pill pin-ok" data-salinan-sempit={sempit ? "" : undefined}>{s("studio.langkah.terbit.judul")}</span>
                : posisi.kini === "ditarik" ? <span className="pin-pill pin-neutral" data-salinan-sempit={sempit ? "" : undefined}>{s("studio.langkah.ditarik.judul")}</span>
                : null;
              return (
                <Link key={c.id} href={`/studio/paket/${c.id}`} className="pin-row" data-posisi={posisi.kini ?? ""}>
                  <span className="pin-title">{c.title}</span>
                  <span className="pin-rowmeta">
                    <span>{c.subject} · {c.grade_label} · {byId.get(c.institution_id) ?? "\u2014"}</span>
                    {posisi.kini && posisi.kini !== "terbit" && posisi.kini !== "ditarik"
                      ? <span>{s("studio.langkah.keadaan.kini")}: {s(kunciSalinan(posisi.kini, "judul"))}</span> : null}
                    {c.status === "VALIDATION_FAILED" && tinjauanTerakhir.get(c.id as string) === "SENT_BACK"
                      ? <span className="pin-pill pin-attention pin-pill-ikon" data-dikembalikan=""><Ikon nama="triangle-alert" />{s("studio.paket.riwayat.dikembalikan")}</span> : null}
                    {/* under 560 px the row's badge sits in its meta line (experience.css) */}
                    {lencana(true)}
                  </span>
                  {lencana(false)}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
