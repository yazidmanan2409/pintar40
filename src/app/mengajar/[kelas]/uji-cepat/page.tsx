import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import { sediakanUjiCepat } from "../../actions";
import BarisHasil from "@/components/BarisHasil";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import TahapKomitmen from "@/components/mengajar/TahapKomitmen";
import { bacaGagalUjiCepat } from "@/lib/ujicepat-kontrak";
import { kalimatTolakUjiCepat } from "@/components/mengajar/tolakUjiCepat";

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
 * ATUR → TINJAU → SEDIAKAN, AND ONLY THE LAST ONE WRITES. The first two stages
 * are GET renders whose choices ride in the query string. The commitment is one
 * RPC that creates the definition, draws the paper, opens the assignment and
 * writes the audit line in a single transaction — so a refusal leaves nothing
 * half-built and there is no state for this page to reconcile.
 *
 * WHAT THIS SCREEN DOES NOT PROMISE. The reviewed concept offered per-item
 * results once the window closed. `responses_select` and
 * `presented_items_select` are CAN_REVIEW_INTEGRITY only and an EDUCATOR does
 * not hold it; the service statistics views are revoked from `authenticated`
 * outright. There is no read path, so there is no promise — the live panel
 * carries the two facts it genuinely has, and the route to what the class
 * learned is Screen E.
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
  searchParams: Promise<{ tahap?: string; bab?: string; soal?: string; menit?: string; cepat?: string; kode?: string; ref?: string }>;
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
        <main className="pin-col">
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
  const pilihSoal = Math.min(Math.max(Number(q.soal) || soalMin, soalMin), soalMax);
  const pilihMenit = ajar.JENDELA_MENIT.includes(Number(q.menit) as never)
    ? Number(q.menit)
    : ajar.JENDELA_MENIT[1];

  // ──────────────────────────────────────────── stage 2: review, no effect
  if (q.tahap === "tinjau" && pilihBab) {
    const judulBab = bab.find((b) => b.id === pilihBab)?.judul ?? "";
    return (
      <>
        {kepala}
        <main className="pin-col">
          <Link className="pin-back" href={`/mengajar/${id}/uji-cepat`}>← {s("mengajar.cepat.ubah")}</Link>
          {lingkup}
          <TahapKomitmen tahap={1} nama={langkah} locale={locale} />
          <div className="pin-head">
            <p className="pin-eyebrow">{s("mengajar.cepat.eyebrow")} · {ctx.ini.nama}</p>
            <h1 className="pin-h1">{s("mengajar.cepat.tinjau")}</h1>
          </div>
          <div className="pin-paket">
            <div className="pin-prow">
              <h2>
                {judulBab} · {format.number(pilihSoal, locale)} {s("mengajar.siap.soal")}
              </h2>
              <span className="pin-pill pin-neutral">{s("mengajar.status.belum")}</span>
            </div>
            <ol className="pin-terima">
              {(["mengajar.cepat.rv1", "mengajar.cepat.rv2", "mengajar.cepat.rv3", "mengajar.cepat.rv4"] as HleEvent[]).map(
                (k, i) => (
                  <li key={k}>
                    <span className="pin-n">{format.number(i + 1, locale)}</span>
                    <span className="pin-d">{s(k)}</span>
                  </li>
                ),
              )}
            </ol>
          </div>
          <div className="pin-commit">
            <p className="pin-akibat">{s("mengajar.cepat.akibat")}</p>
            <form action={sediakanUjiCepat}>
              <input type="hidden" name="kelas" value={id} />
              <input type="hidden" name="bab" value={pilihBab} />
              <input type="hidden" name="soal" value={pilihSoal} />
              <input type="hidden" name="menit" value={pilihMenit} />
              <div className="pin-actions">
                <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyediakan")}>{s("mengajar.cepat.komit")}</TombolKirim>
                <Link className="pin-btn" href={`/mengajar/${id}/uji-cepat`}>{s("mengajar.cepat.ubah")}</Link>
              </div>
            </form>
          </div>
          <KakiPintar />
        </main>
      </>
    );
  }

  // ───────────────────────────────────────────────────── stage 1: configure
  return (
    <>
      {kepala}
      <main className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}`}>← {ctx.ini.nama}</Link>
        {lingkup}
        <TahapKomitmen tahap={0} nama={langkah} locale={locale} />
        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.cepat.eyebrow")} · {ctx.ini.nama}</p>
          <h1 className="pin-h1">{s("mengajar.cepat.judul")}</h1>
          <p className="pin-intro">{s("mengajar.cepat.intro")}</p>
        </div>

        {barisHasil}

        {bab.length === 0 ? (
          <p className="pin-empty">{s("mengajar.cepat.bab.kosong")}</p>
        ) : (
          /* A GET FORM. Continuing to the review is navigation, not a write:
             the choices ride in the query string and the review page renders
             them without touching a table. */
          <form method="get">
            <input type="hidden" name="tahap" value="tinjau" />
            <div className="pin-isian">
              <label htmlFor="pin-bab">{s("mengajar.cepat.bab")}</label>
              <select className="pin-input" id="pin-bab" name="bab" defaultValue={pilihBab}>
                {bab.map((b) => (
                  <option key={b.id} value={b.id}>{b.judul}</option>
                ))}
              </select>
              <p className="pin-hint">{s("mengajar.cepat.bab.arti")}</p>
            </div>

            <div className="pin-isian">
              <label htmlFor="pin-soal">{s("mengajar.cepat.jumlah")}</label>
              <input
                className="pin-input" id="pin-soal" type="number" name="soal"
                min={soalMin} max={soalMax} defaultValue={pilihSoal}
              />
              {/* DAISY-26 (UX-32): the range, as what the teacher may choose */}
              <p className="pin-hint">
                {s("mengajar.cepat.jumlah.antara")} {format.number(soalMin, locale)} {s("mengajar.cepat.jumlah.dan")}{" "}
                {format.number(soalMax, locale)} {s("mengajar.siap.soal")}.
              </p>
            </div>

            <div className="pin-isian">
              <span className="pin-label">{s("mengajar.cepat.jendela")}</span>
              <div className="pin-seg">
                {ajar.JENDELA_MENIT.map((m) => (
                  <label key={m}>
                    <input type="radio" name="menit" value={m} defaultChecked={m === pilihMenit} />
                    <span>{format.number(m, locale)} {s("mengajar.cepat.menit")}</span>
                  </label>
                ))}
              </div>
              <p className="pin-hint">{s("mengajar.cepat.jendela.arti")}</p>
            </div>

            <div className="pin-isian">
              <span className="pin-label">{s("mengajar.cepat.untuk")}</span>
              <p className="pin-value">
                {ctx.ini.nama} ({s("mengajar.siap.dipilih")}) ·{" "}
                {format.number(fakta.murid.length, locale)} {s("mengajar.siap.terdaftar")}
              </p>
            </div>

            <div className="pin-actions">
              <button type="submit" className="pin-btn">{s("mengajar.cepat.lanjut")}</button>
            </div>
          </form>
        )}

        <KakiPintar />
      </main>
    </>
  );
}
