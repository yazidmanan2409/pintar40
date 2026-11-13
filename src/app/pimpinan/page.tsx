import PeranSayaBerakhir from "@/components/peran/PeranSayaBerakhir";
import DaftarAntrean from "@/components/kesempatan/DaftarAntrean";
import FokusPanel from "@/components/FokusPanel";
import { jumlahKesempatanMenunggu } from "@/lib/pengerjaan";
import Link from "next/link";
import KisiTopik, { susunKisi, type KolomKisi } from "@/components/laporan/KisiTopik";
import { JudulBagian } from "@/components/laporan/tata";
import KepalaCetak from "@/components/laporan/KepalaCetak";
import Kosong from "@/components/Kosong";
import Ikon from "@/components/Ikon";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as pim from "@/lib/pimpinan";
import { berstruktur, nilaiMetrik } from "@/lib/nilai-metrik";
import NilaiLaporan from "@/components/bukti/NilaiLaporan";
import { menunggu, urutan } from "@/lib/pimpinan-kontrak";
import { putuskanAksi } from "./actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KartuKeputusan from "@/components/pimpinan/KartuKeputusan";
import RingkasKesiapan, { adaKesiapan } from "@/components/pimpinan/RingkasKesiapan";
import { BarisLingkup, KartuKetiadaan } from "@/components/bukti";
import AngkaTerkelola from "@/components/pimpinan/AngkaTerkelola";
import BarisHasil from "@/components/BarisHasil";
import TandaTautan from "@/components/TandaTautan";
import { lingkupAwal } from "@/components/pimpinan/lingkup";
import { alamatCatatan, tempatCatatan } from "@/lib/pengembangan";
import { judulHalaman } from "@/lib/judul-halaman";
import { zonaSekolahBanyak } from "@/lib/zona-sekolah";
import { supabaseServer } from "@/lib/supabase/server";

export const generateMetadata = judulHalaman("/pimpinan");

export const dynamic = "force-dynamic";

/**
 * THE MANAGEMENT HOME — "what do I need to know, and what needs my attention?"
 *
 * SIXTY SECONDS, AND THE ORDER IS THE ANSWER. Context, then what is waiting,
 * then what the evidence supports, then where the evidence is not ready yet,
 * then a way deeper. A reader who stops after the first two sections has the
 * answer to the question the page exists for; everything below is there for the
 * reader who does not stop.
 *
 * IT IS NOT A DASHBOARD, AND THE ABSENCES ARE THE DESIGN. No tiles, no chart, no
 * gauge, no counter standing alone: the only bare numbers on the page are the
 * count of waiting decisions, which is the headline sentence, and the readiness
 * tallies, which each carry their own words. Every figure comes through the
 * catalogue and arrives with its meaning and its standing attached.
 *
 * MANAGEMENT IS NOT EDUCATOR HIGHER UP. The educator's home asks what needs
 * attention in a class today; this one asks what DECISIONS are waiting. An item
 * reaches this page because a human is owed something — never because PINTAR
 * can aggregate one level further — and the suppression line says so on the
 * page rather than only in a document.
 *
 * WHO SEES IT: `management_scope_over_node` decides, which is the WP1 role set —
 * HEAD_OF_DEPARTMENT and DEAN — over an assigned node. An INSTITUTION_ADMIN
 * outranks both and holds no Management authority, so they meet the same one
 * refusal page an educator or a learner meets. Nothing on this page reads a role
 * name to reach that answer.
 */
export default async function Pimpinan({
  searchParams,
}: {
  searchParams: Promise<{ lingkup?: string; galat?: string; hasil?: string; keputusan?: string; kesempatan?: string; k_hasil?: string; k_kode?: string; untuk?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });

  const lingkup = await pim.lingkupPimpinan();
  if (lingkup.length === 0) {
    return (
      <HalamanPenolakan
        messageKey="pimpinan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/"
        backKey="galat.beranda"
      />
    );
  }

  // The scope being read. A hand-edited query string is not trusted: an id that
  // is not one of the reader's own confirmed scopes falls back to the default
  // rather than being passed to a read. The default is the broadest of them
  // (DAISY-07): a head of department opens on the department, not on a class
  // inside it that happens to sort first.
  const dipilih = lingkupAwal(lingkup, sp.lingkup) ?? lingkup[0];

  // DAISY-07 (B6c): a class figure is asked of a class. Standing above the
  // classes, each class of the branch answers for itself (BOB-06's
  // buktiPerKelas), never summed; standing at a class, buktiPimpinan asks it.
  const diKelas = dipilih.kind === "CLASS";
  const [keputusan, bukti, perKelas, catatanPd] = await Promise.all([
    pim.keputusanSaya(),
    pim.buktiPimpinan(dipilih.id, dipilih.institusi),
    diKelas ? Promise.resolve([] as pim.BuktiKelas[]) : pim.buktiPerKelas(dipilih.id).catch(() => [] as pim.BuktiKelas[]),
    // DAISY-34 (D-070(a)): the professional-learning records this reader may open; links only, never a figure
    tempatCatatan(),
  ]);

  const nKesempatan = await jumlahKesempatanMenunggu(dipilih.institusi);
  const tertib = urutan(keputusan);
  // the owner's ruling (10 Nov): each decision's dates on its own school's clock
  const zonaDari = await zonaSekolahBanyak(await supabaseServer(), tertib.map((k) => k.institusi));
  const antre = tertib.filter(menunggu);
  const angka = bukti.filter((e) => e.status === "ok");
  const absen = bukti.filter((e) => e.status !== "ok");

  // DAISY-07 (DEA-03, X-12): the full summaries, one click from here. A
  // refusal never reaches `bukti` (it is dropped, see buktiPimpinanDari), so a
  // summary is offered only where the reader may read at least one of its
  // figures, never as a way into a page of refusals. The school's figures are
  // asked at its root whatever node is named (TENANT), so the chosen node only
  // says which school's summary; a class's are asked of the class.
  const bacaSekolah = bukti.some((e) => e.metric_id?.startsWith("institution."));
  const bacaKelas = diKelas && bukti.some((e) => e.metric_id?.startsWith("class."));

  // CONTOH LAPORAN 3-kadep: the grid's columns, each class's own envelopes
  const kolomKisi: KolomKisi[] = perKelas.map(({ kelas, topik, target, bukti: bk }) => ({
            id: kelas.id, nama: kelas.nama, topik, target,
            // KESETIAAN #14: each class's base and its Kenaikan, from the envelopes this page already holds
            populasi: (bk.find((e) => e.metric_id === "class.readiness_distribution")?.population ?? null) as { placed?: number; assessed?: number } | null,
            kenaikan: bk.find((e) => e.metric_id === "class.net_gain") ?? null,
          }));
  // KESETIAAN #4 (G-02): every section of the page lettered A… in reading order, the letter read aloud
  let nHuruf = 0;
  const huruf = () => "ABCDEFGHIJ"[nHuruf++] ?? "";
  const judulBagian = (id: string, judul: string) => <JudulBagian huruf={huruf()} judul={judul} id={id} locale={locale} />;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pimpinan" current="pimpinan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <KepalaCetak bagian={[s("pimpinan.judul"), dipilih.nama]} />
        {/* ── A. MANAGEMENT CONTEXT ─────────────────────────────────────── */}
        <BarisLingkup scope={{ path: [dipilih.nama] }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pimpinan.eyebrow")}</p>
          <h1 className="pin-h1">{s("pimpinan.judul")}</h1>
          <p className="pin-intro">{s("pimpinan.batas")}</p>
        </div>
        {/* B0: the reader's own role ending within seven days (nothing when none) */}
        <PeranSayaBerakhir locale={locale} />
        {/* A1 (O41-16): requests for another attempt this reader may decide, the same line a school admin reads on Konfigurasi */}
        {nKesempatan > 0 ? (
          <p className="pin-noprint" data-menunggu-jenis="kesempatan">
            <Link className="pin-tautan" href="/pimpinan?kesempatan=buka#kesempatan"><span className="pin-num">{format.number(nKesempatan, locale)}</span> {s("kesempatan.menunggu")}</Link>
          </p>
        ) : null}
        {/* the queue itself, on this home, once the line is followed (and after each decision taken from it) */}
        {sp.kesempatan === "buka" ? (
          <>
            <FokusPanel id="kesempatan" kunci={`${sp.k_hasil ?? ""}:${sp.k_kode ?? ""}:${sp.untuk ?? ""}`} />
            <DaftarAntrean tempat="pimpinan" sekolah={dipilih.institusi} locale={locale} hasil={sp.k_hasil} kode={sp.k_kode} untuk={sp.untuk} judulTerlihat />
          </>
        ) : null}

        {/* MORE THAN ONE PART OF THE SCHOOL, AND PLAIN LINKS RATHER THAN A
            SELECT. A picker whose choice is applied by a script is a control
            that looks operational before the script arrives; a link is a link
            in every browser, needs no hydration, and is already in the tab
            order. The list is only ever the scopes the database confirmed. */}
        {lingkup.length > 1 ? (
          <nav className="pin-lingkup" aria-label={s("pimpinan.lingkup.pilih")}>
            <span className="pin-meta">{s("pimpinan.lingkup.pilih")}</span>
            <ul>
              {lingkup.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/pimpinan?lingkup=${encodeURIComponent(n.id)}`}
                    aria-current={n.id === dipilih.id ? "true" : undefined}
                  >
                    {n.nama}
                    <TandaTautan />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* ── B. NEEDS ATTENTION ────────────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-antre">
          {judulBagian("pin-antre", s("pimpinan.menunggu.judul"))}

          {/* A TRUTHFUL NOTHING. An empty queue reads as a finished sentence,
              not as an empty container apologising for itself. */}
          {antre.length === 0 ? (
            <p className="pin-empty">{s("pimpinan.menunggu.nihil")}</p>
          ) : antre.length === 1 ? (
            <p className="pin-lede">{s("pimpinan.menunggu.satu")}</p>
          ) : (
            <p className="pin-lede">
              <span className="pin-num">{format.number(antre.length, locale)}</span>{" "}
              {s("pimpinan.menunggu.banyak")}
            </p>
          )}

          {antre.length > 1 ? <p className="pin-meta">{s("pimpinan.urutan")}</p> : null}

          {/* DAISY-18: the answer sits on the card that was moved; an answer
              for a card not on this page is said once, above the cards */}
          {(sp.galat === "1" || sp.hasil === "ok") && !tertib.some((k) => k.id === sp.keputusan) ? (
            <BarisHasil nada={sp.galat === "1" ? "gagal" : "ok"}>
              {s(sp.galat === "1" ? "pimpinan.aksi.gagal" : "pimpinan.aksi.tercatat")}
            </BarisHasil>
          ) : null}
          {tertib.map((k) => (
            <KartuKeputusan
              key={k.id}
              keputusan={k}
              aksi={putuskanAksi}
              locale={locale}
              galat={sp.galat === "1" && sp.keputusan === k.id}
              tercatat={sp.hasil === "ok" && sp.keputusan === k.id}
              zona={zonaDari(k.institusi)}
            />
          ))}

          <p className="pin-mm">{s("pimpinan.memutuskan")}</p>
        </section>

        {/* ── C. WHAT THE EVIDENCE SUPPORTS ─────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-bukti">
          {judulBagian("pin-bukti", s("pimpinan.bukti.judul"))}
          {bukti.length === 0 ? (
            // W10: a head of department reads no school-wide figure, but the classes below may have theirs
            <Kosong jenis="belum" kalimat={s(perKelas.some(({ bukti: bk }) => bk.some((e) => e.status === "ok")) ? "pimpinan.bukti.di_kelas" : "pimpinan.bukti.kosong")} />
          ) : (
            // W3.9 (RV-9): the figures and the absence cards under them are spaced by the layout gap, never touching
            <div className="pin-bukti-tumpuk">
              {angka.length > 0 ? (
                <div className="pin-grid2">
                  {angka.map((e, i) => (
                    <AngkaTerkelola
                      key={e.metric_id ?? `angka-${i}`}
                      entry={e}
                      value={nilaiMetrik(e.metric_id, e.value, locale)}
                      rincian={berstruktur(e.value) ? <NilaiLaporan entry={e} locale={locale} persona="staff" /> : undefined}
                      locale={locale}
                    />
                  ))}
                </div>
              ) : null}
              {/* An absent figure keeps its own sentence — the evaluator's, not
                  a variant map's — so NOT_YET_EVALUABLE and INSUFFICIENT_EVIDENCE
                  read as the two different facts WP3 separated them into. */}
              {absen.map((e, i) => (
                <KartuKetiadaan
                  key={e.metric_id ?? `absen-${i}`}
                  entry={e}
                  locale={locale}
                  persona="staff"
                />
              ))}
            </div>
          )}
        </section>

        {/* ── C2. CLASS BY CLASS (DAISY-07) ──────────────────────────────────
            Above the classes, each class answers for its own figures, and a
            class is a disclosure the reader opens: the summary line says
            whether it has any figure yet, and inside, every absent figure says
            what will make it appear. A class whose figures are not the
            reader's says so once, without counting what was withheld. */}
        {/* CONTOH LAPORAN 3-kadep (approved 7 Nov): above the classes, the topics × classes grid, each cell that class's own
            figure; a pattern across the branch, or one class */}
        {!diKelas && susunKisi(kolomKisi).kolom.length > 0 ? (
          <KisiTopik huruf={huruf()} kolom={kolomKisi} locale={locale} />
        ) : null}
        {!diKelas ? (
          <section className="pin-sec" aria-labelledby="pin-perkelas">
            {judulBagian("pin-perkelas", s("pimpinan.kelas.judul"))}
            <p className="pin-mm">{s("pimpinan.kelas.arti")}</p>
            {perKelas.length === 0 ? (
              <Kosong jenis="belum" kalimat={s("pimpinan.kelas.kosong")} />
            ) : (
              perKelas.map(({ kelas, bukti: bk, murid }) => {
                // Daisy (9 Nov): «Ada angka» means a performance figure is shown. «Peserta» is a headcount, so a class whose
                // only «ok» is that count has evidence but no figure yet, which is what the grid beside it says too
                const ada = bk.filter((e) => e.status === "ok" && e.metric_id !== "class.participants");
                const adaBukti = bk.some((e) => (e.status === "ok" && e.metric_id === "class.participants" && Number(e.value) > 0)
                  || (e.status === "below_minimum" && Number(e.have) > 0));
                return (
                  <details key={kelas.id} className="pin-kelas-bukti">
                    <summary>
                      <span className="pin-kelas-nama">{kelas.nama}</span>
                      <span className="pin-kelas-tanda">
                        {s(bk.length === 0 ? "laporan.metrik.bukan_untuk_anda" : ada.length > 0 ? "pimpinan.kelas.ada" : adaBukti ? "pimpinan.kelas.bukti_saja" : "pimpinan.kelas.belum")}
                      </span>
                      <Ikon nama="chevron-down" kelas="pin-chevron" />
                    </summary>
                    {bk.length > 0 ? (
                      <div className="pin-kelas-isi">
                        {/* HOD-J05: «Peserta» read against the class it counts in */}
                        {murid !== null ? (
                          <p className="pin-mm">{s("pimpinan.kelas.murid")} · <span className="pin-num">{format.number(murid, locale)}</span></p>
                        ) : null}
                        {ada.length > 0 ? (
                          <div className="pin-grid2">
                            {ada.map((e, i) => (
                              <AngkaTerkelola key={e.metric_id ?? `angka-${i}`} entry={e} value={nilaiMetrik(e.metric_id, e.value, locale)}
                    rincian={berstruktur(e.value) ? <NilaiLaporan entry={e} locale={locale} persona="staff" /> : undefined} locale={locale} />
                            ))}
                          </div>
                        ) : null}
                        {bk.filter((e) => e.status !== "ok").map((e, i) => (
                          <KartuKetiadaan key={e.metric_id ?? `absen-${i}`} entry={e} locale={locale} persona="staff" />
                        ))}
                        <Link className="pin-btn pin-quiet" href={`/edukator/ringkasan?kelas=${encodeURIComponent(kelas.id)}&dari=pimpinan`}>
                          {s("pimpinan.laporan.kelas")}
                        </Link>
                      </div>
                    ) : null}
                  </details>
                );
              })
            )}
          </section>
        ) : null}

        {/* ── D. EVIDENCE READINESS ─────────────────────────────────────── */}
        {adaKesiapan(bukti) ? <RingkasKesiapan entries={bukti} locale={locale} huruf={huruf()} /> : null}

        {/* ── E. DELIBERATELY DEEPER ────────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-lanjut">
          {judulBagian("pin-lanjut", s("pimpinan.perlu_diketahui"))}
          <p className="pin-mm">{s("pimpinan.perlu_diketahui.sub")}</p>
          <div className="pin-actions">
            <Link className="pin-btn" href={`/pimpinan/${encodeURIComponent(dipilih.id)}`}>
              {s("pimpinan.buka.simpul")}
            </Link>
            {bacaKelas ? (
              <Link className="pin-btn" href={`/edukator/ringkasan?kelas=${encodeURIComponent(dipilih.id)}&dari=pimpinan`}>
                {s("pimpinan.laporan.kelas")}
              </Link>
            ) : null}
            {bacaSekolah ? (
              <Link className="pin-btn" href={`/dekan/ringkasan?simpul=${encodeURIComponent(dipilih.id)}&dari=pimpinan`}>
                {s("pimpinan.laporan.sekolah")}
              </Link>
            ) : null}
          </div>
        </section>

        {/* ── F. EDUCATORS' PROFESSIONAL LEARNING (DAISY-34, D-069(b)G) ──── *
            Outside the decision queue and the figures: a link to each record, read-only. */}
        {catatanPd.length > 0 ? (
          <section className="pin-sec" aria-labelledby="pin-pengembangan">
            {judulBagian("pin-pengembangan", s("config.peserta.catatan"))}
            <div className="pin-actions">
              {catatanPd.map((k) => (
                <Link key={k.id} className="pin-btn" href={alamatCatatan(k.id)}>
                  {k.nama}{k.tahun ? ` (${k.tahun})` : ""}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}

