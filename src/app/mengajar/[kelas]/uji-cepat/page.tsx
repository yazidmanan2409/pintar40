import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import { sediakanUjiCepat } from "../../actions";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import TahapKomitmen from "@/components/mengajar/TahapKomitmen";
import { bacaGagalUjiCepat } from "@/lib/ujicepat-kontrak";
import { kalimatTolakUjiCepat } from "@/components/mengajar/tolakUjiCepat";
import { TeksBaris } from "@/components/teks/Teks";
import { kataAnggota } from "@/lib/mengajar";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/uji-cepat");

export const dynamic = "force-dynamic";

/**
 * SCREEN D — the Quick Assessment.
 *
 * THE ONE EDUCATOR COMMITMENT THE DATABASE BOUNDS TO THE CLASS.
 * `launch_quick_assessment` authorizes on `can_on_node('CAN_QUICK_ASSESSMENT',
 * p_node)` — subtree containment, not institution membership — so unlike every
 * other act on this surface the scope below is enforced and not merely chosen.
 *
 * THE BOUNDS ARE READ, NEVER RESTATED. 3-to-20 items is not a number in this
 * file: it comes from `assessment_definition_bounds` for QUICK, and the RPC
 * checks the same bound again on arrival, so a hand-posted 40 is refused by the
 * database rather than by this form. The minute windows are three presets
 * inside the launcher's own 5-to-60 range.
 *
 * CHOOSE → TICK → REVIEW → LAUNCH (D-085 T2), AND ONLY THE LAST ONE WRITES.
 * The teacher chooses the chapter and sees its questions (quick_assessment_choices:
 * stem, options, topic; no key), ticks the ones to give, and reviews exactly
 * those. All of that is GET renders whose choices ride in the query string. The
 * commitment is one RPC (launch_selected_quick_assessment) that launches as
 * before, checks every ticked question against the instrument's own eligible
 * set, stores the choice and writes the audit lines in a single transaction --
 * so a refusal leaves nothing half-built, and every learner's paper is exactly
 * the ticked questions, each in a shuffled order.
 *
 * WHAT THE CLASS FOUND HARD. Since D-088(k) (M5) a teacher has a read of the
 * class's handed-in answers question by question (teacher_question_evidence),
 * so the running Uji Cepat, and the last one once it closes, lead there. The
 * live panel itself still carries only its two counted facts.
 *
 * AND WHAT IT NO LONGER CLAIMS. The concept said a Quick Assessment does not
 * enter a certificate. `mode_policy` has `certifies = true` for QUICK and its
 * own note reads "evidence is ordinary evidence", so the copy now says what is
 * true: the result is scored like any other, it may contribute to the evidence
 * certificate eligibility is decided from, and one Quick Assessment does not
 * issue a certificate — the school issues.
 */
export default async function UjiCepat({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ tahap?: string; bab?: string; butir?: string | string[]; menit?: string; cepat?: string; kode?: string; ref?: string }>;
}) {
  const { kelas: id } = await params;
  const q = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }

  const [buka, batas, tugas, fakta] = await Promise.all([
    ajar.berjalan([id]),
    ajar.batasUjiCepat(),
    ajar.penugasan(id),
    ajar.faktaKelas(id),
  ]);
  const hidup = buka.find((b) => b.adHoc) ?? null;

  const soalMin = batas?.soalMin ?? 3;
  const soalMax = batas?.soalMax ?? 20;
  // DAISY-27 (UX-03, with BOB-32): the launch's answer, said in whichever
  // stage renders. A refusal is read through BOB-32's contract (a code it
  // knows, a reference of the right shape, nothing else) and said by its own
  // sentence. A success lands on the running stage, since the Uji Cepat is
  // then running, so its line is drawn there too.
  const gagal = bacaGagalUjiCepat(q);
  const barisHasil = gagal ? (
    <BarisHasil nada="gagal">{kalimatTolakUjiCepat(gagal, s, locale, { soalMin, soalMax, menit: ajar.JENDELA_MENIT })}</BarisHasil>
  ) : q.cepat === "ok" ? (
    <BarisHasil nada="ok">{s("mengajar.cepat.ok")}</BarisHasil>
  ) : null;

  const lingkup = (
    <BarisLingkup
      scope={{
        institution: ctx.konteks.institusi?.nama ?? null,
        path: [ctx.ini.nama],
        period: ctx.konteks.periode,
      }}
      locale={locale}
    />
  );
  const langkah: [HleEvent, HleEvent, HleEvent] = [
    "mengajar.cepat.langkah1", "mengajar.cepat.langkah2", "mengajar.cepat.langkah3",
  ];
  const kepala = (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
    </>
  );

  // ────────────────────────────────────────────────── stage 3: it is running
  if (hidup) {
    const sisa = hidup.sisaMenit;
    return (
      <>
        {kepala}
        <main id="isi" tabIndex={-1} className="pin-col">
          <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
          {lingkup}
          <TahapKomitmen tahap={2} nama={langkah} locale={locale} />
          {barisHasil}
          <div className="pin-hidup">
            <p className="pin-eyebrow">{s("mengajar.cepat.hidup.eyebrow")}</p>
            <h1>{s("mengajar.cepat.hidup.judul")}</h1>
            <p>
              {hidup.judul} · {format.number(hidup.soal, locale)} {s("mengajar.siap.soal")}
            </p>
          </div>
          {/* TWO FACTS, NOT THREE. The reviewed concept carried a third —
              per-item results, "shown after the window ends" — and no contract
              grants an educator one. The row is absent rather than present and
              empty, the same way the estimated duration left Slice 2. */}
          <dl className="pin-facts">
            <div>
              <dt>{s("mengajar.cepat.hidup.kumpul")}</dt>
              <dd className="pin-num">
                {format.number(hidup.mengumpulkan, locale)} / {format.number(fakta.murid.length, locale)}
              </dd>
            </div>
            {sisa != null ? (
              <div>
                <dt>{s("mengajar.cepat.hidup.sisa")}</dt>
                <dd className="pin-num">
                  {format.number(sisa, locale)} {s("mengajar.cepat.menit")}
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="pin-catatan">{s("mengajar.cepat.hidup.catatan")}</p>
          <div className="pin-actions">
            <Link className="pin-btn" href={`/mengajar/${id}/siapa?penugasan=${hidup.id}`}>
              {s("mengajar.cepat.hidup.siapa")}
            </Link>
            {/* W2.4 (D-120 Q8): once something is handed in, the score, the class first */}
            {hidup.mengumpulkan > 0 ? (
              <Link className="pin-btn" href={`/mengajar/${id}/uji-cepat/hasil?penugasan=${hidup.id}`}>
                {s("mengajar.cepat.hasil.lihat")}
              </Link>
            ) : null}
            {/* M5: once something is handed in, the questions the class found hard */}
            {hidup.mengumpulkan > 0 ? (
              <Link className="pin-btn" href={`/mengajar/${id}/soal?penugasan=${hidup.id}`}>
                {s("mengajar.bukti.per_soal")}
              </Link>
            ) : null}
          </div>
          <KakiPintar />
        </main>
      </>
    );
  }

  // the chapters this class may be tested on: the modules of the material the
  // school has already made available to it, and nothing else
  const kursus = [...new Set(tugas.filter((x) => x.status === "ACTIVE").map((x) => x.courseId))];
  const bab = (await Promise.all(kursus.map((c) => ajar.bab(c)))).flat();

  const pilihBab = q.bab && bab.some((b) => b.id === q.bab) ? q.bab : bab[0]?.id;
  const pilihMenit = ajar.JENDELA_MENIT.includes(Number(q.menit) as never)
    ? Number(q.menit)
    : ajar.JENDELA_MENIT[1];
  // D-085 T2: the chapter's questions, and the ones ticked (read back from the address, kept only if the chapter offers them)
  const tersedia = pilihBab ? await ajar.soalUjiCepat(id, pilihBab) : [];
  const dipilih = ajar.pilihanSah(q.butir, tersedia);
  const butir = dipilih.map((x) => x.id);
  const cukup = dipilih.length >= soalMin && dipilih.length <= soalMax;
  const n = (x: number) => format.number(x, locale);
  const rentang = `${s("mengajar.cepat.jumlah.antara")} ${n(soalMin)} ${s("mengajar.cepat.jumlah.dan")} ${n(soalMax)} ${s("mengajar.siap.soal")}.`;
  const ubahPilihan = `/mengajar/${id}/uji-cepat?${new URLSearchParams({ bab: pilihBab ?? "", menit: String(pilihMenit), butir: butir.join(",") }).toString()}`;
  const opsi = (x: ajar.SoalPilihan) => (
    <ul className="pin-soal-opsi">
      {x.opsi.map((o) => (
        <li key={o.label}><span className="pin-num">{o.label}.</span> <TeksBaris teks={o.body} /></li>
      ))}
    </ul>
  );

  // ──────────────────────────────────────────── stage 2: review, no effect
  if (q.tahap === "tinjau" && pilihBab && cukup) {
    const judulBab = bab.find((b) => b.id === pilihBab)?.judul ?? "";
    return (
      <>
        {kepala}
        <main id="isi" tabIndex={-1} className="pin-col">
          <Link className="pin-back" href={ubahPilihan}>← {s("mengajar.cepat.tinjau.ubah")}</Link>
          {lingkup}
          <TahapKomitmen tahap={1} nama={langkah} locale={locale} />
          <div className="pin-head">
            <p className="pin-eyebrow">{s("mengajar.cepat.eyebrow")} · {ctx.ini.nama}</p>
            <h1 className="pin-h1">{s("mengajar.cepat.tinjau")}</h1>
          </div>
          <div className="pin-paket">
            <div className="pin-prow">
              <h2>
                {judulBab} · {n(dipilih.length)} {s("mengajar.siap.soal")} · {n(pilihMenit)} {s("mengajar.cepat.menit")}
              </h2>
              <span className="pin-pill pin-neutral">{s("mengajar.status.belum")}</span>
            </div>
            <ol className="pin-terima">
              {(["mengajar.cepat.rv1", "mengajar.cepat.rv2", "mengajar.cepat.rv3", "mengajar.cepat.rv4"] as HleEvent[]).map(
                (k, i) => (
                  <li key={k}>
                    <span className="pin-n">{n(i + 1)}</span>
                    <span className="pin-d">{s(k)}</span>
                  </li>
                ),
              )}
            </ol>
          </div>
          <section className="pin-sec" aria-labelledby="pin-cepat-dipilih">
            <h2 id="pin-cepat-dipilih">{s("mengajar.cepat.tinjau.soal")}</h2>
            <ol className="pin-soal-kelas pin-cepat-dipilih">
              {dipilih.map((x, i) => (
                <li key={x.id} className="pin-soal-baris" data-butir={x.id}>
                  <p className="pin-soal-tanya"><span className="pin-num">{n(i + 1)}.</span> <TeksBaris teks={x.tanya} /></p>
                  {opsi(x)}
                </li>
              ))}
            </ol>
          </section>
          <div className="pin-commit">
            <p className="pin-akibat">{s("mengajar.cepat.akibat")}</p>
            <form action={sediakanUjiCepat}>
              <input type="hidden" name="kelas" value={id} />
              <input type="hidden" name="bab" value={pilihBab} />
              <input type="hidden" name="butir" value={butir.join(",")} />
              <input type="hidden" name="menit" value={pilihMenit} />
              <div className="pin-actions">
                <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyediakan")}>{s("mengajar.cepat.komit")}</TombolKirim>
                <Link className="pin-btn" href={ubahPilihan}>{s("mengajar.cepat.tinjau.ubah")}</Link>
              </div>
            </form>
          </div>
          <KakiPintar />
        </main>
      </>
    );
  }

  // the last Uji Cepat that closed with something handed in: where the class's answers are read (M5)
  const tutup = (await ajar.berjalan([id], ["CLOSED"])).filter((b) => b.adHoc && b.mengumpulkan > 0);
  const terakhir = tutup.sort((a, b) => String(b.ditutup ?? "").localeCompare(String(a.ditutup ?? "")))[0] ?? null;

  // ───────────────────────────────────── stage 1: choose the chapter, tick the questions
  return (
    <>
      {kepala}
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        {lingkup}
        <TahapKomitmen tahap={0} nama={langkah} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.cepat.eyebrow")} · {ctx.ini.nama}</p>
          <h1 className="pin-h1">{s("mengajar.cepat.judul")}</h1>
          <p className="pin-intro">{s("mengajar.cepat.intro")}</p>
        </div>

        {barisHasil}
        {/* asked to review with too few or too many ticked: the range, said where the ticking is */}
        {q.tahap === "tinjau" && !cukup && !gagal ? <BarisHasil nada="gagal">{rentang}</BarisHasil> : null}
        {terakhir ? (
          <p className="pin-meta pin-cepat-terakhir">
            {s("mengajar.cepat.terakhir")} · {terakhir.judul} ·{" "}
            <Link href={`/mengajar/${id}/uji-cepat/hasil?penugasan=${terakhir.id}`}>{s("mengajar.cepat.hasil.lihat")}</Link> ·{" "}
            <Link href={`/mengajar/${id}/soal?penugasan=${terakhir.id}`}>{s("mengajar.bukti.per_soal")}</Link>
          </p>
        ) : null}

        {bab.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("mengajar.cepat.bab.kosong")} />
        ) : (
          /* A GET FORM. Showing a chapter's questions and continuing to the review are navigation, not a write: the
             choices ride in the query string and the review renders them without touching a table. Two buttons
             name the stage: «Tampilkan soal bab ini» reloads the list for the chapter chosen, «Lanjut ke tinjauan»
             reviews what is ticked. */
          <form method="get">
            <div className="pin-isian">
              <label htmlFor="pin-bab">{s("mengajar.cepat.bab")}</label>
              <select className="pin-input" id="pin-bab" name="bab" defaultValue={pilihBab}>
                {bab.map((b) => (
                  <option key={b.id} value={b.id}>{b.judul}</option>
                ))}
              </select>
              <p className="pin-hint">{s("mengajar.cepat.bab.arti")}</p>
              <div className="pin-actions">
                <button type="submit" className="pin-btn" name="tahap" value="pilih">{s("mengajar.cepat.pilih.tampilkan")}</button>
              </div>
            </div>

            <section className="pin-sec" aria-labelledby="pin-cepat-pilih">
              <h2 id="pin-cepat-pilih">{s("mengajar.cepat.pilih")}</h2>
              <p className="pin-sub">{s("mengajar.cepat.pilih.arti")}</p>
              {tersedia.length === 0 ? (
                <Kosong jenis="belum" kalimat={s("mengajar.cepat.pilih.kosong")} />
              ) : (
                <ol className="pin-soal-kelas pin-cepat-pilih">
                  {tersedia.map((x) => (
                    <li key={x.id} className="pin-soal-baris">
                      <label className="pin-cepat-centang">
                        <input type="checkbox" name="butir" value={x.id} defaultChecked={butir.includes(x.id)} />
                        <span className="pin-soal-tanya"><TeksBaris teks={x.tanya} /></span>
                      </label>
                      {x.stimulus ? <p className="pin-meta"><TeksBaris teks={x.stimulus} /></p> : null}
                      {opsi(x)}
                      <p className="pin-meta">
                        {s("mengajar.cepat.pelajaran")} {n(x.pelajaran)} · {x.topik ?? x.judulPelajaran}
                        {" · "}{s(`mengajar.cepat.tingkat.${x.tingkat}` as HleEvent)}
                        {x.peran === "PRE_TEST" || x.peran === "POST_TEST" ? ` · ${s(`mengajar.cepat.peran.${x.peran}` as HleEvent)}` : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              {/* DAISY-26 (UX-32): the range, as what the teacher may choose */}
              <p className="pin-hint">{butir.length > 0 ? `${n(butir.length)} ${s("mengajar.cepat.dipilih")} · ` : ""}{rentang}</p>
            </section>

            <div className="pin-isian">
              <span className="pin-label">{s("mengajar.cepat.jendela")}</span>
              <div className="pin-seg">
                {ajar.JENDELA_MENIT.map((m) => (
                  <label key={m}>
                    <input type="radio" name="menit" value={m} defaultChecked={m === pilihMenit} />
                    <span>{n(m)} {s("mengajar.cepat.menit")}</span>
                  </label>
                ))}
              </div>
              <p className="pin-hint">{s("mengajar.cepat.jendela.arti")}</p>
            </div>

            <div className="pin-isian">
              <span className="pin-label">{s("mengajar.cepat.untuk")}</span>
              <p className="pin-value">
                {ctx.ini.nama} ({s("mengajar.siap.dipilih")}) ·{" "}
                {n(fakta.murid.length)} {s(kataAnggota("mengajar.siap.terdaftar", ctx.ini.jenis))}
              </p>
            </div>

            <div className="pin-actions">
              <button type="submit" className="pin-btn pin-primary" name="tahap" value="tinjau">{s("mengajar.cepat.lanjut")}</button>
            </div>
          </form>
        )}

        <KakiPintar />
      </main>
    </>
  );
}
