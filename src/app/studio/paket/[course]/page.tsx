import { redirect } from "next/navigation";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import Link from "next/link";
import Ikon from "@/components/Ikon";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import LangkahTerbit from "@/components/studio/LangkahTerbit";
import { enumLabel, format, t, type HleEvent } from "@/lib/hle";
import { KODE_HAMBATAN, kalimatHambatan, type Hambatan } from "@/lib/terbitan-kontrak";
import { bacaHasil, kalimatHasil, rujukan } from "@/lib/galat-kontrak";
import { tanggal } from "@/lib/tanggal";
import { button, can, card, field, label, studioInstitutions } from "../../_lib";
import {
  moveReleaseAction, runValidationAction,
} from "../../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import TemuanKelompok from "@/components/studio/TemuanKelompok";
import type { Temuan } from "@/lib/temuan";
import SimpanIsian from "@/components/SimpanIsian";
import { TeksBaris } from "@/components/teks/Teks";
import { soalPaket } from "@/lib/soal-tinjauan";
import FokusSoal from "@/components/studio/FokusSoal";
import { akarGaris } from "@/lib/pengajar";
import { jalurIni, konteksHalaman, tempatSaya } from "@/lib/konteks-server";
import { alamatPilih, melayani } from "@/lib/konteks";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/studio/paket/[course]");

/**
 * Package detail — Publish Readiness (§5), freeze & publish (§6), release
 * correction (§7), revision (this phase's §6).
 *
 * The state and its reasons come from `studio_package_state`, which composes
 * the findings gate with the lifecycle facts server-side. The page renders
 * what it is told: it does not compute readiness, and it does not translate a
 * lifecycle enum, because none reaches it.
 *
 * Controls are shown by capability, but that is courtesy rather than security:
 * every one of them calls a database path that re-decides the same question.
 *
 * DAISY-06, THE TERBIT STEP (audit M11). The lifecycle used to be six buttons
 * side by side -- "Konfirmasi" three times among them -- with nothing to say
 * which came first or whose turn it was. It is now one ordered list of seven
 * named steps (LangkahTerbit, from components/studio/langkah.ts): the current
 * one marked, the roles that take each beside it, a button only on the
 * current step and only for a reader who may take it, and the author told
 * that approving and locking are a second person's. The content check is
 * "Periksa isi sekarang" beside the findings it writes.
 *
 * D-085 M10, A CORRECTION. «Perbaiki kursus ini» used to make a copy "to edit
 * freely", which no screen can edit, and a copy left the line's newest course a
 * draft no workbook could correct. A locked course that is the newest of its
 * line now links to the upload, which brings the corrected workbook in as its
 * next version with what changed and why; «Riwayat perbaikan» lists the line,
 * each version with its release, its summary, who wrote it and when.
 *
 * BATCH 3 (W1.1, W1.6, W1.8, W1.9, W1.12). The steps are Daisy's J1Terbit composition (LangkahTerbit), and a content
 * step's result is said in the current step's panel rather than above it. A reviewer may send the package back with a
 * reason (kembalikan_paket); its author sees the reason there, with the correction upload in the package's line.
 * «Riwayat perbaikan» names every review outcome of each version, who sent it back and why, and who approved it
 * (content_review_outcomes). The author of a package is never offered «Sudah saya tinjau» on its findings (the
 * database refuses it). Every word is in the reader's language (UX-25).
 */

type Params = Promise<{ course: string }>;
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string; baris?: string; pelajaran?: string }>;

type Finding = Temuan;

export default async function Paket({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { course: courseId } = await params;
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;
  // UX-25 (W1.9): every word on this page in the reader's language
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const when = (iso: string | null) => tanggal(iso, "cap", locale) || "—";

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subject, stage, grade_label, institution_id, supersedes_course_id, status, author_person_id")
    .eq("id", courseId).maybeSingle();

  if (!course) {
    // a package that is not there, or not this reader's (row security hides both alike), is refused, never said as
    // empty (Kosong's rule; the same answer Mengajar gives a class it cannot read)
    return <HalamanPenolakan locale={locale} persona="staff" backHref="/studio" backKey="studio.nav.beranda" />;
  }

  const [institutions, { data: saya }] = await Promise.all([
    studioInstitutions(), supabase.rpc("current_person_id"),
  ]);
  const inst = institutions.find((i) => i.id === course.institution_id);
  // L3 (§2.6): a package of another school is never worked on in this context, and the context never switches
  // silently: the chooser offers that school's Studio when the reader holds it there, and continues here
  if (!inst && (await konteksHalaman()) !== "TANPA_KONTEKS") {
    const jalur = await jalurIni();
    const di = (await tempatSaya()).find((p) => p.tempat === course.institution_id && melayani(p, jalur));
    if (di) redirect(alamatPilih({ untuk: di.tujuan, tempat: di.tempat, alasan: "lain", lanjut: jalur }));
  }

  const [{ data: stateRows }, { data: releases }, { data: mcq }, { data: coach }, { data: garisRows }] =
    await Promise.all([
      supabase.rpc("studio_package_state", { p_course: courseId }),
      supabase.from("plp_releases").select("id, version_label, status, published_at, frozen_at, supersedes_release_id")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("mcq_quality_findings")
        .select("id, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki, acknowledged_at")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("coaching_findings")
        .select("id, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki, acknowledged_at")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("courses").select("id, supersedes_course_id").eq("institution_id", course.institution_id),
    ]);

  // D-085 M10: a correction is a new course superseding the one it corrects, so «Koreksi» reads the whole line --
  // every published release of it, and every class given one -- not this course alone (one course has one release,
  // so read alone it never had two to choose between)
  const akar = akarGaris((garisRows ?? []) as Array<{ id: string; supersedes_course_id: string | null }>);
  const garis = [...akar.entries()].filter(([, r]) => r === (akar.get(courseId) ?? courseId)).map(([id]) => id);
  const [{ data: rilisGaris }, { data: assignments }] = await Promise.all([
    supabase.from("plp_releases").select("id, course_id, version_label, status, published_at")
      .in("course_id", garis.length > 0 ? garis : [courseId]).order("published_at", { ascending: true }),
    supabase.from("learning_assignments").select("id, plp_release_id, status, node_id")
      .in("course_id", garis.length > 0 ? garis : [courseId]).eq("status", "ACTIVE"),
  ]);
  // a course this one has been corrected by: the newest of the line after it, when there is one
  const sesudah = ((garisRows ?? []) as Array<{ id: string; supersedes_course_id: string | null }>);
  const penerus = (() => {
    let kini = courseId;
    for (let n = 0; n < 64; n++) {
      const anak = sesudah.find((k) => k.supersedes_course_id === kini);
      if (!anak) break;
      kini = anak.id;
    }
    return kini === courseId ? null : kini;
  })();

  // D-085 M10: the line in order, first version first, each with its release and the note its correction carried
  const urutGaris: string[] = [];
  for (let kini: string | undefined = akar.get(courseId) ?? courseId, n = 0; kini && n < 64; n++) {
    urutGaris.push(kini);
    const k: string = kini;
    kini = sesudah.find((x) => x.supersedes_course_id === k)?.id;
  }
  const [{ data: catatanRows }, { data: tinjauanRows }] = await Promise.all([
    urutGaris.length > 1
      ? supabase.from("course_revision_notes").select("course_id, summary, written_by_person_id, written_at").in("course_id", urutGaris)
      : Promise.resolve({ data: [] as Array<{ course_id: string; summary: string; written_by_person_id: string | null; written_at: string }> }),
    // W1.8 (J4.12): every review outcome of the line's versions, in order: who sent it back and why, who approved it
    supabase.from("content_review_outcomes").select("course_id, outcome, reason, reviewer_person_id, decided_at")
      .in("course_id", urutGaris.length > 0 ? urutGaris : [courseId]).order("decided_at", { ascending: true }),
  ]);
  const catatan = new Map(((catatanRows ?? []) as Array<{ course_id: string; summary: string; written_by_person_id: string | null; written_at: string }>)
    .map((r) => [r.course_id, r]));
  type Tinjauan = { course_id: string; outcome: "SENT_BACK" | "APPROVED"; reason: string | null; reviewer_person_id: string; decided_at: string };
  const tinjauan = (tinjauanRows ?? []) as Tinjauan[];
  const penulisIds = [...new Set([...[...catatan.values()].map((r) => r.written_by_person_id), ...tinjauan.map((o) => o.reviewer_person_id)]
    .filter((x): x is string => !!x))];
  // W1.8: the names the history needs, read through nama_riwayat_paket, so the author sees who sent their version back
  // (their own row security does not reach the reviewer's person row); only the people recorded on these packages
  const { data: penulisRows } = penulisIds.length > 0
    ? await supabase.rpc("nama_riwayat_paket", { p_courses: urutGaris.length > 0 ? urutGaris : [courseId] })
    : { data: [] as Array<{ person_id: string; display_name: string }> };
  const penulis = new Map(((penulisRows ?? []) as Array<{ person_id: string; display_name: string }>).map((p) => [p.person_id, p.display_name]));
  const TERSEGEL = ["FROZEN", "PUBLISHED", "SUPERSEDED"];
  const terkunci = TERSEGEL.includes(course.status as string) || (releases ?? []).some((r) => TERSEGEL.includes(r.status as string));

  // D-088(h): the package's questions with their key and rationale, read under the reader's own row security
  // (CAN_DRAFT in the school, which every reviewer holds), so the person who approves sees what they approve
  const soal = can(inst, "CAN_DRAFT") ? await soalPaket(supabase, courseId) : null;
  // A1 (D-166(b)): one whole lesson on screen at a time, carried in the address (?pelajaran=n#soal)
  const pelajaranSoal = soal?.ok ? soal.pelajaran : [];
  const totalSoal = pelajaranSoal.reduce((n, l) => n + l.soal.length, 0);
  const iniPelajaran = Math.min(Math.max(1, Number.parseInt(sp.pelajaran ?? "1", 10) || 1), Math.max(1, pelajaranSoal.length));
  const sebelumIni = pelajaranSoal.slice(0, iniPelajaran - 1).reduce((n, l) => n + l.soal.length, 0);

  const state = (Array.isArray(stateRows) ? stateRows[0] : stateRows) as
    | { surface_state: string; reasons: Hambatan[]; preview_lesson_id: string | null } | undefined;

  const banner = kalimatHasil(sp, s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
  // a content step's result is said in the current step's panel (W1.4; Daisy, Action feedback), codes only
  const dibaca = sp.bagian === "paket" ? bacaHasil(sp) : null;
  const hasilIsi = dibaca && banner ? { ok: dibaca.ok, kode: dibaca.kode, kalimat: banner } : null;
  // W1.6: the package a reviewer sent back, the reason last given, and the author's correction in the line
  const dikembalikanOleh = course.status === "VALIDATION_FAILED"
    ? tinjauan.filter((o) => o.course_id === courseId && o.outcome === "SENT_BACK").at(-1) ?? null : null;
  const kembali = dikembalikanOleh && dikembalikanOleh.reason ? {
    alasan: dikembalikanOleh.reason,
    oleh: penulis.get(dikembalikanOleh.reviewer_person_id) ?? null,
    pada: when(dikembalikanOleh.decided_at),
  } : null;
  const unggahPerbaikan = can(inst, "CAN_DRAFT") && dikembalikanOleh && !penerus ? `/studio/unggah?revisi=${courseId}#buku-kerja` : null;
  // W1.12: «Sudah saya tinjau» is a second person's; the database refuses the author acknowledging their own finding
  const bukanPenyusun = typeof saya === "string" && typeof course.author_person_id === "string" && saya !== course.author_person_id;
  // DAISY-16: a reason whose code the catalogue does not know shows the general
  // line and a reference; the code goes to the server log under it, never to the page
  const dikenal = (r: Hambatan) => (KODE_HAMBATAN as readonly string[]).includes(r?.code);
  const asing = (state?.reasons ?? []).filter((r) => !dikenal(r));
  const refAlasan = asing.length > 0 ? rujukan() : null;
  // the reasons speak the reader's language, as the Terbit step below them does
  const sl = (k: HleEvent) => t(k, "staff", { locale });
  if (refAlasan) console.error(`[studio ${refAlasan}] studio_package_state returned blocker code(s) the catalogue does not know`, asing.map((r) => r?.code));
  const published = (rilisGaris ?? []).filter((r) => r.status === "PUBLISHED");
  const terakhir = (releases ?? []).at(-1) ?? null;
  const terbitSiap = state?.surface_state === "READY" && terakhir?.status === "PUBLISHED";
  const tersegel = terakhir !== null && !["INGESTED", "STRUCTURED", "VALIDATED", "IN_REVIEW", "APPROVED"].includes(terakhir.status);
  const findings = ((mcq ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);
  const coaching = ((coach ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);

  // Polish batch 2 (UX-16): each move form names the class it moves, and where
  // it is now. The names are read only when the move section is on the page.
  const bolehPindah = can(inst, "CAN_ASSIGN_LEARNING") && (assignments ?? []).length > 0 && published.length > 1;
  const kelasIds = bolehPindah ? [...new Set((assignments ?? []).map((a) => a.node_id as string))] : [];
  const { data: kelasRows } = kelasIds.length > 0
    ? await supabase.from("org_nodes").select("id, name").in("id", kelasIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const namaKelas = new Map(((kelasRows ?? []) as Array<{ id: string; name: string }>).map((k) => [k.id, k.name]));
  const sekarangDi = (rilis: string) => (rilisGaris ?? []).find((r) => r.id === rilis)?.published_at as string | null | undefined;

  return (
    <div className="pin-studio-halaman">
      {/* A5 B10 (J1Terbit): the package's own head, the back link «Studio» above its title as the page's one h1;
          Studio's head and tabs are Studio's index pages' (KepalaStudio). Every heading below is one level under it. */}
      <header className="pin-head">
        <p><Link className="pin-back" href="/studio"><Ikon nama="chevron-left" />{s("studio.nav.beranda")}</Link></p>
        <h1 className="pin-h1">{course.title}</h1>
      </header>
      <section className={card} id="paket" aria-label={course.title}>
        <p className="pin-ket-3">{course.subject} · {course.stage} · {course.grade_label}</p>
        {course.supersedes_course_id ? (
          <p className="pin-ket">
            <Link href={`/studio/paket/${course.supersedes_course_id}`} className="pin-studio-tautan">
              ← {s("studio.paket.revisi_sebelum")}
            </Link>
          </p>
        ) : null}
        {/* D-085 M10: forward too -- this course has been corrected; new learning uses the correction */}
        {penerus ? (
          <p className="pin-ket" data-penerus={penerus}>
            <Link href={`/studio/paket/${penerus}`} className="pin-studio-tautan">
              {s("studio.paket.revisi_terbaru")} →
            </Link>
          </p>
        ) : null}

        <p className="pin-studio-h2">
          {/* RV-10 (D-140): a published package with nothing to fix reads as published, not «siap diterbitkan» */}
          {state ? (terbitSiap ? s("studio.langkah.terbit.judul") : s(`studio.state.${state.surface_state}` as never)) : "—"}
        </p>
        <p className="pin-ket">
          {state ? (terbitSiap ? s("studio.state.explain.TERBIT") : s(`studio.state.explain.${state.surface_state}` as never)) : ""}
        </p>

        {state && state.reasons.length > 0 ? (
          <>
            <p className="pin-judul-baris">{sl("studio.paket.alasan")}</p>
            <ul className="pin-daftar-titik pin-ket">
              {/* BOB-17 (D-011): each reason is a blocker code; its line comes from the copy table */}
              {state.reasons.map((r, i) => (
                <li key={`${r?.code}-${r?.lesson_id ?? ""}-${r?.pattern ?? ""}-${i}`}>{kalimatHambatan(r, sl, (n) => format.number(n, locale))}{refAlasan && !dikenal(r) ? ` (${sl("galat.rujukan")}: ${refAlasan})` : null}</li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="pin-baris-aksi">
          {state?.preview_lesson_id ? (
            <Link className={button} href={`/studio/pratinjau/${state.preview_lesson_id}`}>
              {s("studio.paket.pratinjau")}
            </Link>
          ) : null}
        </div>
      </section>

      {/* D-088(h): before the steps, so «Setujui» comes after the questions were in front of the reviewer. The
          learner preview above stays the sanitised learner view (§5); this is the Studio staff's own view. */}
      {can(inst, "CAN_DRAFT") && soal ? (
        <section className={card} id="soal" aria-labelledby="pin-soal-judul">
          <h2 id="pin-soal-judul" className="pin-studio-h3">{sl("studio.soal.judul")}</h2>
          <p className="pin-ket">{sl("studio.soal.arti")}</p>
          {!soal.ok ? (
            // A1 «gagal»: a read that failed is said so; no partial list, which could be mistaken for the whole
            <BarisHasil nada="gagal">{sl("studio.soal.gagal")}</BarisHasil>
          ) : totalSoal === 0 ? (
            <Kosong jenis="belum" kalimat={sl("studio.soal.kosong")} />
          ) : (() => {
            const l = pelajaranSoal[iniPelajaran - 1];
            const ke = (n: number) => `/studio/paket/${encodeURIComponent(courseId)}?pelajaran=${n}#pin-soal-pelajaran`;
            const isi = (k: HleEvent, v: Record<string, string>) => Object.entries(v).reduce((x, [a, b]) => x.split(`{${a}}`).join(b), sl(k));
            const gerak = (arah: "sebelum" | "sesudah") => {
              const n = arah === "sebelum" ? iniPelajaran - 1 : iniPelajaran + 1;
              const kata = sl(arah === "sebelum" ? "koleksi.sebelumnya" : "koleksi.berikutnya");
              const tanda = arah === "sebelum"
                ? <><Ikon nama="chevron-left" /><span className="pin-pager-teks">{kata}</span></>
                : <><span className="pin-pager-teks">{kata}</span><Ikon nama="chevron-right" /></>;
              return n >= 1 && n <= pelajaranSoal.length
                ? <Link href={ke(n)} className="pin-btn" aria-label={kata} rel={arah === "sebelum" ? "prev" : "next"} data-pager={arah}>{tanda}</Link>
                : <a role="link" aria-disabled="true" className="pin-btn" aria-label={kata} data-pager={arah}>{tanda}</a>;
            };
            return (
              <>
                <p className="pin-meta" data-soal-ringkas="">{isi("studio.soal.ringkas", { soal: format.number(totalSoal, locale), pelajaran: format.number(pelajaranSoal.length, locale) })}</p>
                {/* the jump: a labelled Select and a button (never on change, WCAG 3.2.2); a plain GET to this page, so it works
                    with no script; FokusSoal then puts focus on the lesson's heading */}
                <form method="get" className="pin-soal-lompat">
                  <label htmlFor="pin-soal-pilih">{sl("studio.soal.pelajaran_label")}</label>
                  <select id="pin-soal-pilih" name="pelajaran" className={field} defaultValue={String(iniPelajaran)}>
                    {pelajaranSoal.map((x, n) => (
                      <option key={x.id} value={String(n + 1)}>{x.judul} ({format.number(x.soal.length, locale)} {sl("studio.soal.jumlah")})</option>
                    ))}
                  </select>
                  <button type="submit" className={button}>{sl("studio.soal.buka")}</button>
                </form>
                {sp.pelajaran ? <FokusSoal pelajaran={iniPelajaran} /> : null}
                <section className="pin-soal-pelajaran" aria-labelledby="pin-soal-pelajaran">
                  <h3 id="pin-soal-pelajaran" tabIndex={-1} className="pin-soal-pelajaran-judul">
                    {l.judul} <span className="pin-meta">· {format.number(l.soal.length, locale)} {sl("studio.soal.jumlah")}</span>
                  </h3>
                  {l.soal.length === 0 ? <p className="pin-ket">{sl("studio.soal.kosong")}</p> : (
                    <ol className="pin-soal-daftar">
                      {l.soal.map((q, qi) => {
                        const posisi = isi("studio.soal.posisi", { i: format.number(sebelumIni + qi + 1, locale), n: format.number(totalSoal, locale) });
                        return (
                          <li key={q.id} className="pin-soal">
                            <article aria-labelledby={`pin-soal-${q.id}`}>
                              {/* package-wide numbering, the use and the band as text (A1 decisions 1 and 5) */}
                              <p className="pin-soal-meta">
                                {posisi} · {q.peran ? enumLabel("mode", q.peran, locale) : enumLabel("bank", q.bank, locale)}
                                {q.pita ? <> · {sl(`mengajar.cepat.tingkat.${q.pita}` as HleEvent)}</> : null}
                              </p>
                              {q.stimulus ? (
                                <div className="pin-soal-bacaan"><p className="pin-soal-bacaan-label">{sl("studio.soal.bacaan")}</p><p><TeksBaris teks={q.stimulus} /></p></div>
                              ) : null}
                              <h4 id={`pin-soal-${q.id}`} className="pin-soal-stem"><TeksBaris teks={q.pertanyaan} /></h4>
                              <ol className="pin-opsi-daftar" aria-label={posisi}>
                                {q.opsi.map((o) => (
                                  <li key={o.label} className={o.kunci ? "pin-opsi pin-opsi-kunci" : "pin-opsi"}>
                                    <span className="pin-opsi-huruf" aria-hidden="true">{o.label}</span>
                                    <div className="pin-opsi-isi">
                                      <p className="pin-opsi-teks">
                                        <span className="pin-sr">{o.label}. </span><TeksBaris teks={o.isi} />
                                        {/* the key: icon, word, edge and ground; never colour alone (A1 decision 2) */}
                                        {o.kunci ? <> <strong className="pin-pill pin-ok pin-pill-ikon pin-studio-kunci"><Ikon nama="check" />{sl("studio.soal.kunci")}</strong></> : null}
                                      </p>
                                      <p className="pin-opsi-alasan">{sl("studio.soal.alasan")}: <TeksBaris teks={o.alasan} /></p>
                                      {/* E-A1-1: the misconception the option is coded with, by its name in the school's taxonomy */}
                                      {o.miskonsepsi ? (
                                        <p className="pin-opsi-alasan" data-miskonsepsi={o.miskonsepsi.kode}>
                                          {sl("studio.soal.miskonsepsi")}: {o.miskonsepsi.nama ?? o.miskonsepsi.kode}
                                          {o.miskonsepsi.nama ? <> <span className="pin-kode">{o.miskonsepsi.kode}</span></> : null}
                                        </p>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </article>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
                {pelajaranSoal.length > 1 ? (
                  // the pager's narrow form (its words out of sight, still its name) is a container rule, as Penomoran's
                  <div className="pin-penomoran">
                  <nav className="pin-pager" aria-label={sl("studio.soal.pager_label")} data-soal-pager="">
                    <span className="pin-pager-gerak">
                      {gerak("sebelum")}
                      <span className="pin-pager-posisi" aria-live="polite">{isi("studio.soal.pelajaran_dari", { i: format.number(iniPelajaran, locale), n: format.number(pelajaranSoal.length, locale) })}</span>
                      {gerak("sesudah")}
                    </span>
                  </nav>
                  </div>
                ) : null}
              </>
            );
          })()}
        </section>
      ) : null}

      <HasilDi q={sp} bagian="terbitan" kalimat={banner} />

      <LangkahTerbit
        locale={locale}
        course={courseId}
        fakta={{ statusKursus: course.status as string, terbitan: terakhir ? { status: terakhir.status as string } : null }}
        terbitan={terakhir ? { id: terakhir.id as string, status: terakhir.status as string, terbitPada: (terakhir.published_at as string | null) ?? null } : null}
        kemampuan={inst?.capabilities ?? []}
        saya={typeof saya === "string" ? saya : null}
        penyusun={(course.author_person_id as string | null) ?? null}
        hasilIsi={hasilIsi}
        kembali={kembali}
        unggahPerbaikan={unggahPerbaikan}
      />

      <section className="pin-studio-halaman" id="temuan">
        {/* Polish batch 2 (UX-14): named «Temuan», as both steps above call it */}
        <h2 className="pin-studio-h3">{s("studio.temuan.judul")}</h2>
        {typeof saya === "string" && saya === course.author_person_id ? <p className="pin-meta" data-temuan-orang-kedua="">{s("studio.temuan.orang_kedua")}</p> : null}
        {can(inst, "CAN_DRAFT") && !tersegel ? (
          <form action={runValidationAction} className="pin-baris-aksi">
            <input type="hidden" name="course" value={courseId} />
            <TombolKirim className={button} sibuk={s("tombol.memeriksa")}>{s("studio.paket.periksa_isi")}</TombolKirim>
            <span className="pin-ket">{s("studio.paket.periksa_isi_arti")}</span>
          </form>
        ) : null}
        <HasilDi q={sp} bagian="temuan" kalimat={banner} />
        {findings.length + coaching.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("studio.temuan.kosong")} />
        ) : (
          // W1.5: one group per kind of finding, acknowledged together; W1.12: never offered to the package's author
          <TemuanKelompok course={courseId} mcq={findings} coaching={coaching}
            bolehAkui={can(inst, "CAN_REVIEW") && bukanPenyusun} pemilik={pemilik} ditolak={ditolak("temuan")} locale={locale} />
        )}
      </section>

      {urutGaris.length > 1 || tinjauan.length > 0 ? (
        <section className={card} id="riwayat">
          <h2 className="pin-studio-h3">{sl("studio.paket.riwayat.judul")}</h2>
          <ol className="pin-daftar">
            {urutGaris.map((id, i) => {
              const r = (rilisGaris ?? []).filter((x) => x.course_id === id).at(-1);
              const n = catatan.get(id);
              return (
                <li key={id} className="pin-riwayat" data-versi={id}>
                  <p className="pin-judul-baris">
                    {r?.version_label ?? sl("studio.paket.riwayat.versi_pertama")}
                    {" · "}
                    {r?.published_at ? when(r.published_at as string) : sl("studio.paket.riwayat.belum_terbit")}
                    {" · "}
                    {id === courseId
                      ? <span className="pin-ket-3">{sl("studio.paket.riwayat.ini")}</span>
                      : <Link href={`/studio/paket/${id}`} className="pin-studio-tautan">{sl("studio.paket.riwayat.buka")}</Link>}
                  </p>
                  {i === 0 ? (
                    <p className="pin-ket">{sl("studio.paket.riwayat.asli")}</p>
                  ) : n ? (
                    <>
                      <p className="pin-ket"><TeksBaris teks={n.summary} /></p>
                      <p className="pin-ket-3">
                        {when(n.written_at)}
                        {n.written_by_person_id && penulis.get(n.written_by_person_id)
                          ? ` · ${sl("studio.paket.riwayat.oleh")} ${penulis.get(n.written_by_person_id)}` : ""}
                      </p>
                    </>
                  ) : null}
                  {/* W1.8: who sent this version back and why, and who approved it, in order */}
                  {tinjauan.some((o) => o.course_id === id) ? (
                    <ul className="pin-riwayat-tinjauan">
                      {tinjauan.filter((o) => o.course_id === id).map((o) => (
                        <li key={`${o.outcome}-${o.decided_at}`} data-hasil-tinjauan={o.outcome}>
                          <p className="pin-ket">
                            {sl(o.outcome === "APPROVED" ? "studio.paket.riwayat.disetujui" : "studio.paket.riwayat.dikembalikan")}
                            {penulis.get(o.reviewer_person_id) ? ` · ${sl("studio.paket.riwayat.oleh")} ${penulis.get(o.reviewer_person_id)}` : ""}
                          </p>
                          {o.outcome === "SENT_BACK" && o.reason ? <p className="pin-riwayat-alasan pin-ket">{o.reason}</p> : null}
                          <p className="pin-ket-3">{when(o.decided_at)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {can(inst, "CAN_DRAFT") && terkunci && !penerus ? (
        <section className={card} id="revisi">
          <h2 className="pin-studio-h3">{s("studio.paket.revisi")}</h2>
          <p className="pin-ket">{s("studio.paket.revisi_penjelasan")}</p>
          <p>
            <Link className={button} href={`/studio/unggah?revisi=${courseId}#buku-kerja`}>{sl("studio.paket.revisi_unggah")}</Link>
          </p>
          <HasilDi q={sp} bagian="revisi" kalimat={banner} />
        </section>
      ) : null}

      {bolehPindah ? (
        <section className={card} id="koreksi">
          {/* Polish batch 2 (UX-16): this moves an assignment that exists, and
              each form says which class it moves and where that class is now. */}
          <h2 className="pin-studio-h3">{s("studio.paket.pindah.judul")}</h2>
          {/* E-K4: a move is answered in its assignment's block; here only when it names none on this page */}
          <HasilDi q={sp} bagian="koreksi" kalimat={banner} barisDiHalaman={(assignments ?? []).map((a) => a.id as string)} />
          {(assignments ?? []).map((a) => (
            <div key={a.id}>
            <form action={moveReleaseAction} id={`koreksi-${a.id}`} className="pin-baris-aksi">
              <input type="hidden" name="course" value={courseId} />
              <input type="hidden" name="assignment" value={a.id} />
              <p className="pin-ket">
                {namaKelas.get(a.node_id as string) ?? "—"}
                {sekarangDi(a.plp_release_id as string)
                  ? ` · ${s("studio.paket.pindah.sekarang")} ${when(sekarangDi(a.plp_release_id as string) ?? null)}`
                  : ""}
              </p>
              <label className={label}>
                <span>{s("studio.paket.pindah.tujuan")}</span>
                <select className={field} name="release" defaultValue="">
                  <option value="" disabled>—</option>
                  {published.filter((r) => r.id !== a.plp_release_id).map((r) => (
                    <option key={r.id} value={r.id}>{when(r.published_at)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                <span>{s("studio.paket.koreksi_alasan")}</span>
                <input className={field} name="alasan" required />
              </label>
              <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.paket.pindah.tombol")}</TombolKirim>
            </form>
            <SimpanIsian form={`koreksi-${a.id}`} ditolak={ditolak("koreksi")} pemilik={pemilik} />
            <HasilDi q={sp} bagian="koreksi" baris={a.id as string} kalimat={banner} />
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
