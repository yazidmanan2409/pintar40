/**
 * Render the built Experience components to static HTML, once per interface
 * language. Review tooling, not product code — see ./README.md for why it
 * renders components rather than driving the routes.
 *
 * EVERY NAME, NUMBER AND VERIFICATION TOKEN BELOW IS INVENTED. The QR codes
 * are real and decode to these example links.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { t, format, type Locale, type HleEvent } from "@/lib/hle";
import KartuSertifikat from "@/components/sertifikat/KartuSertifikat";
import { AngkaBerdiri, KartuKetiadaan, BarisKesiapan, BarisLingkup, type Envelope } from "@/components/bukti";
import HalamanKomitmen from "@/components/HalamanKomitmen";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KakiPintar from "@/components/KakiPintar";
import MerekPintar from "@/components/MerekPintar";
import JejakSiklus from "@/components/siklus/JejakSiklus";
import KartuTugas from "@/components/siklus/KartuTugas";
import PetaBacaan from "@/components/siklus/PetaBacaan";
import OrientasiAsesmen from "@/components/siklus/OrientasiAsesmen";
import { LANGKAH, type Posisi } from "@/lib/siklus";
import type { AssignmentEntry, ReadingMapCard, Orientation } from "@/lib/assessment-engine/types";

const OUT = process.argv[2];
if (!OUT || !existsSync(join(OUT, "pintar.css"))) {
  console.error("usage: npx tsx claude/tools/render-screens/screens.tsx <out-dir>  (run stylesheet.mjs first)");
  process.exit(2);
}
const css = readFileSync(join(OUT, "pintar.css"), "utf8");

const INST = "SMA Peragaan Nusantara";
const NAME = "Rani Kusumawati";
const TOKEN = "k7QmX2vR9pLwB4tHs8NcY1eDfZ6uJ0aGqKo3iVbMnTx";
const TOKEN2 = "Hm2Rw7Kp0Tq5Xz9Lb3Nc8Vy4Js6Df1Ga0Ue7Io2Pk5Q";
const LINK = `https://pintar.sekolah-peragaan.sch.id/verifikasi/${TOKEN}`;
const ISSUED_AT = "2026-09-14T09:12:40+07:00";

type L = "id" | "en";
const COURSE: Record<L, Record<string, string>> = {
  id: { mat: "Matematika · Bab 4: Sistem Persamaan Linear", geo: "Geografi · Bab 2: Dinamika Litosfer",
        fis: "Fisika · Bab 1: Besaran dan Satuan", mat3: "Matematika · Bab 3: Fungsi Kuadrat" },
  en: { mat: "Mathematics · Chapter 4: Systems of Linear Equations", geo: "Geography · Chapter 2: Lithosphere Dynamics",
        fis: "Physics · Chapter 1: Quantities and Units", mat3: "Mathematics · Chapter 3: Quadratic Functions" },
};
const SUBJ: Record<L, Record<string, string>> = {
  id: { mat: "Matematika · Kelas 10", geo: "Geografi · Kelas 10", fis: "Fisika · Kelas 10" },
  en: { mat: "Mathematics · Grade 10", geo: "Geography · Grade 10", fis: "Physics · Grade 10" },
};
const CHAP: Record<L, Record<string, string>> = {
  id: { c4: "Bab 4: Sistem Persamaan Linear", c2: "Bab 2: Dinamika Litosfer",
        c3: "Bab 3: Fungsi Kuadrat", c1: "Bab 1: Besaran dan Satuan" },
  en: { c4: "Chapter 4: Systems of Linear Equations", c2: "Chapter 2: Lithosphere Dynamics",
        c3: "Chapter 3: Quadratic Functions", c1: "Chapter 1: Quantities and Units" },
};

const s = (k: HleEvent, locale: Locale, persona: "learner" | "public" | "educator" = "learner") =>
  t(k, persona, { locale });

/** The shell, restated here so the harness needs no router context. */
function Shell({ locale, kind = "learner", current }: {
  locale: Locale; kind?: "learner" | "public"; current?: "belajar" | "sertifikat";
}) {
  const lang = (
    <div className="pin-lang" role="group" aria-label={s("bahasa.label", locale, "public")}>
      <button type="button" aria-pressed={locale === "id"}>{s("bahasa.id", locale, "public")}</button>
      <button type="button" aria-pressed={locale === "en"}>{s("bahasa.en", locale, "public")}</button>
    </div>
  );
  if (kind === "public") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <span className="pin-sub">{s("verifikasi.situs", locale, "public")}</span>
        <span className="pin-spacer" />{lang}
      </header>
    );
  }
  return (
    <header className="pin-top pin-shell pin-noprint">
      <MerekPintar />
      <nav className="pin-tabs" aria-label="PINTAR">
        <a href="#" aria-current={current === "belajar" ? "page" : undefined}>{s("nav.belajar", locale)}</a>
        <a href="#" aria-current={current === "sertifikat" ? "page" : undefined}>{s("nav.sertifikat", locale)}</a>
        <a href="#">{s("nav.akun", locale)}</a>
      </nav>
      <span className="pin-spacer" />{lang}
    </header>
  );
}

function List({ locale }: { locale: Locale }) {
  const l = locale as L;
  const rows = [
    { st: "ISSUED", subj: SUBJ[l].mat, ch: CHAP[l].c4, date: ISSUED_AT, pill: "pin-ok" },
    { st: "ELIGIBLE", subj: SUBJ[l].geo, ch: CHAP[l].c2, date: "2026-09-16T08:03:11+07:00", pill: "pin-info" },
    { st: "SUPERSEDED", subj: SUBJ[l].mat, ch: CHAP[l].c3, date: "2026-08-28T13:40:02+07:00", pill: "pin-neutral" },
    { st: "REVOKED", subj: SUBJ[l].fis, ch: CHAP[l].c1, date: "2026-08-11T11:22:19+07:00", pill: "pin-neutral" },
  ];
  return (
    <>
      <Shell locale={locale} current="sertifikat" />
      <div className="pin-col">
        <BarisLingkup locale={locale} scope={{
          institution: INST,
          path: [locale === "en" ? "Class 10A" : "Kelas 10A"],
          period: locale === "en" ? "Academic year 2026/2027" : "Tahun ajaran 2026/2027",
        }} />
        <div className="pin-head">
          <p className="pin-eyebrow">{s("sertifikat.daftar.eyebrow", locale)}</p>
          <h1 className="pin-h1">{s("sertifikat.daftar.judul", locale)}</h1>
          <p className="pin-intro">{s("sertifikat.daftar.pengantar", locale)}</p>
        </div>
        <div className="pin-list">
          {rows.map((r) => {
            const pill = (
              <span className={`pin-pill ${r.pill}`}>
                {s(`sertifikat.status.${r.st}` as HleEvent, locale)}
              </span>
            );
            const when = r.st === "ELIGIBLE"
              ? `${s("sertifikat.daftar.selesai", locale)} · ${format.date(r.date, locale)}`
              : `${s("sertifikat.daftar.terbit", locale)} ${format.date(r.date, locale)}`;
            return (
              <a key={r.ch} className="pin-row" href="#">
                <span className="pin-eyebrow">{r.subj}</span>
                <span className="pin-title">{r.ch}</span>
                <span className="pin-rowmeta"><span className="pin-num">{when}</span>{pill}</span>
                {pill}
              </a>
            );
          })}
        </div>
        <KakiPintar className="pin-noprint" />
      </div>
    </>
  );
}

function credential(locale: Locale, opts: { verify?: boolean; number?: string; course?: string } = {}) {
  const l = locale as L;
  return {
    institution: INST,
    nameAsIssued: NAME,
    course: opts.course ?? COURSE[l].mat,
    predikat: locale === "en" ? "Good" : "Baik",
    issuedAtIso: ISSUED_AT,
    certificateNumber: opts.number ?? "SPN-2026-000418",
    verificationUrl: opts.verify === false ? null : LINK,
  };
}

function Detail({ locale, state }: {
  locale: Locale; state: "ISSUED" | "ELIGIBLE" | "REVOKED" | "SUPERSEDED";
}) {
  const l = locale as L;
  const back = <a className="pin-back pin-noprint" href="#">← {s("sertifikat.kembali", locale)}</a>;

  if (state === "ELIGIBLE") {
    return (
      <>
        <Shell locale={locale} current="sertifikat" />
        <div className="pin-col">{back}
          <section className="pin-pending">
            <div className="pin-dots" aria-hidden="true"><i /><i /><i /></div>
            <p className="pin-eyebrow">{COURSE[l].geo}</p>
            <h2>{s("sertifikat.disiapkan.judul", locale)}</h2>
            <p>{s("sertifikat.disiapkan.arti", locale)}</p>
            <p>{s("sertifikat.disiapkan.tenang", locale)}</p>
            <div className="pin-actions">
              <button type="button" className="pin-btn">{s("sertifikat.disiapkan.hasil", locale)}</button>
            </div>
          </section>
          <KakiPintar className="pin-noprint" />
        </div>
      </>
    );
  }

  const issued = state === "ISSUED";
  return (
    <>
      <Shell locale={locale} current="sertifikat" />
      <div className="pin-col">{back}
        {state === "REVOKED" ? (
          <div className="pin-banner pin-neutral pin-noprint" role="status">
            <h2>{s("sertifikat.dicabut.judul", locale)}</h2>
            <p>{s("sertifikat.dicabut.arti", locale)}</p>
            <p>{s("sertifikat.dicabut.bantuan", locale)}</p>
          </div>
        ) : null}
        {state === "SUPERSEDED" ? (
          <div className="pin-banner pin-info pin-noprint" role="status">
            <h2>{s("sertifikat.digantikan.judul", locale)}</h2>
            <p>{s("sertifikat.digantikan.arti", locale)}</p>
            <div className="pin-cta">
              <a className="pin-btn pin-primary" href={`/verifikasi/${TOKEN2}`}>
                {s("sertifikat.digantikan.buka", locale)}
              </a>
              <span className="pin-mono">SPN-2026-000402</span>
            </div>
          </div>
        ) : null}
        <KartuSertifikat locale={locale} cred={credential(locale, {
          verify: issued,
          number: state === "SUPERSEDED" ? "SPN-2026-000377" : state === "REVOKED" ? "SPN-2026-000291" : undefined,
          course: state === "SUPERSEDED" ? COURSE[l].mat3 : state === "REVOKED" ? COURSE[l].fis : COURSE[l].mat,
        })} />
        {issued ? (
          <div className="pin-actions pin-noprint">
            <button type="button" className="pin-btn pin-primary">{s("sertifikat.cetak", locale)}</button>
            <button type="button" className="pin-btn">{s("sertifikat.salin", locale)}</button>
          </div>
        ) : null}
        <KakiPintar className="pin-noprint" />
      </div>
    </>
  );
}

function Print({ locale }: { locale: Locale }) {
  return (
    <>
      <Shell locale={locale} current="sertifikat" />
      <div className="pin-col pin-wide">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("sertifikat.cetak.eyebrow", locale)}</p>
          <h1 className="pin-h1">{s("sertifikat.cetak.judul", locale)}</h1>
          <p className="pin-intro">{s("sertifikat.cetak.arti", locale)}</p>
        </div>
        <div className="pin-printwell">
          <div className="pin-sheetbox" id="sheetbox">
            <KartuSertifikat locale={locale} cred={credential(locale)} variant="sheet" />
          </div>
        </div>
      </div>
    </>
  );
}

const VERIFY_CASES = {
  berlaku: { key: "BERLAKU", tone: "", facts: true },
  dicabut: { key: "DICABUT", tone: "pin-neutral", facts: true },
  digantikan: { key: "DIGANTIKAN", tone: "pin-info", facts: true },
  tidaksah: { key: "TIDAK_SAH", tone: "pin-blocked", facts: false },
  none: { key: "", tone: "pin-neutral", facts: false },
} as const;

const MEANING: Record<string, HleEvent> = {
  BERLAKU: "verifikasi.status.BERLAKU.arti",
  DICABUT: "verifikasi.status.DICABUT.arti",
  DIGANTIKAN: "verifikasi.status.DIGANTIKAN.arti",
  TIDAK_SAH: "verifikasi.tidak_sah",
};

function Verify({ locale, vcase }: { locale: Locale; vcase: keyof typeof VERIFY_CASES }) {
  const v = VERIFY_CASES[vcase];
  return (
    <>
      <Shell locale={locale} kind="public" />
      <main className="pin-col pin-narrow">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("verifikasi.eyebrow", locale, "public")}</p>
          <h1 className="pin-h1">{s("verifikasi.judul", locale, "public")}</h1>
          <p className="pin-intro">{s("verifikasi.intro", locale, "public")}</p>
        </div>
        {v.key ? (
          <section className={`pin-status ${v.tone}`}>
            <p className="pin-eyebrow">{s("verifikasi.status", locale, "public")}</p>
            <p className="pin-big">{s(`verifikasi.status.${v.key}` as HleEvent, locale, "public")}</p>
            <p>{s(MEANING[v.key], locale, "public")}</p>
          </section>
        ) : (
          <section className="pin-status pin-neutral">
            <p className="pin-eyebrow">{s("verifikasi.status", locale, "public")}</p>
            <p className="pin-big pin-quietbig">{s("verifikasi.tidak_ditemukan", locale, "public")}</p>
            <p>{s("verifikasi.tidak_ditemukan.arti", locale, "public")}</p>
          </section>
        )}
        {v.facts ? (
          <dl className="pin-dl">
            <div><dt>{s("verifikasi.hasil", locale, "public")}</dt>
                 <dd>{s("verifikasi.lulus", locale, "public")}</dd></div>
            <div><dt>{s("verifikasi.predikat", locale, "public")}</dt>
                 <dd>{locale === "en" ? "Good" : "Baik"}</dd></div>
            <div><dt>{s("verifikasi.institusi", locale, "public")}</dt><dd>{INST}</dd></div>
            <div><dt>{s("verifikasi.tanggal", locale, "public")}</dt>
                 <dd className="pin-num">{format.date(ISSUED_AT, locale)}</dd></div>
          </dl>
        ) : null}
        <p className="pin-foot">{s("verifikasi.catatan", locale, "public")}</p>
        <KakiPintar />
      </main>
    </>
  );
}

function Foundations({ locale }: { locale: Locale }) {
  const env = (o: Partial<Envelope> & { status: string }): Envelope => o as Envelope;
  const ed = (k: HleEvent) => t(k, "educator", { locale });
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <div className="pin-col pin-wide">
        <div className="pin-head">
          <p className="pin-eyebrow">{locale === "en" ? "Foundations" : "Fondasi"}</p>
          <h1 className="pin-h1">{locale === "en" ? "Evidence components" : "Komponen bukti"}</h1>
          <p className="pin-intro">{locale === "en"
            ? "A number never stands alone. Absence is designed with the same care as a value."
            : "Angka tidak pernah berdiri sendiri. Ketiadaan dirancang sama teliti dengan angka."}</p>
        </div>

        <div className="pin-grid2" style={{ marginBottom: "var(--space-6)" }}>
          <AngkaBerdiri locale={locale} value={format.percent(0.72, locale)}
            action={ed("tindakan.lanjut")}
            entry={env({ status: "ok", label_key: "metrik.pemahaman.label",
              meaning_key: "metrik.pemahaman.arti", sample: 24, needed: 5 })} />
          <KartuKetiadaan locale={locale} action={ed("tindakan.tunggu")}
            entry={env({ status: "below_minimum", label_key: "metrik.kenaikan.label",
              statement_key: "laporan.metrik.belum_cukup_data", have: 3, needed: 5 })} />
          <KartuKetiadaan locale={locale}
            entry={env({ status: "not_permitted", label_key: "metrik.kesiapan.label" })} />
          <KartuKetiadaan locale={locale}
            entry={env({ status: "deprecated", label_key: "metrik.kesiapan.label" })} />
        </div>

        <div className="pin-metric" style={{ maxWidth: "var(--measure-narrow)", marginBottom: "var(--space-6)" }}>
          <span className="pin-ml">{ed("metrik.kesiapan.label")}</span>
          <div className="pin-readiness">
            <BarisKesiapan locale={locale} tierKey="kesiapan.siap_sertifikasi" count={9} total={24} />
            <BarisKesiapan locale={locale} tierKey="kesiapan.perlu_review" count={8} total={24} />
            <BarisKesiapan locale={locale} tierKey="kesiapan.butuh_pendampingan" count={4} total={24} />
            <BarisKesiapan locale={locale} tierKey="kesiapan.belum_post_test" count={3} total={24} />
          </div>
          <span className="pin-ma">{ed("tindakan.fokus")}</span>
        </div>

        <HalamanKomitmen
          locale={locale}
          eyebrow={locale === "en"
            ? "Mastery Check · Mathematics Grade 10 · Chapter 4"
            : "Uji Penguasaan · Matematika Kelas 10 · Bab 4"}
          heading={locale === "en" ? "Submit your Mastery Check now?" : "Kumpulkan Uji Penguasaan sekarang?"}
          consequence={s("posttest.submit_confirm", locale)}
          facts={[
            { label: s("posttest.answered", locale), value: "18" },
            { label: s("posttest.unanswered", locale), value: "2" },
            { label: s("posttest.flagged", locale), value: "1" },
          ]}
          action={<button type="button" className="pin-btn pin-primary">
            {s("posttest.submit", locale)} {s("posttest.title", locale)}</button>}
          back={<a className="pin-btn" href="#">{s("komitmen.kembali", locale)}</a>} />

        <div style={{ marginTop: "var(--space-6)" }}>
          <HalamanPenolakan locale={locale} />
        </div>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════ UX-1 Slice 2 · the learner cycle
   The seven screens A–G, composed from the SAME components the routes render.
   The routes themselves are server components that need a database, so the
   harness supplies the rows the engine would have returned and arranges them
   exactly as the pages do. Every name, count and date below is invented. */

const POSISI = (indeks: number, selesai = 3, total = 5): Posisi => ({
  langkah: LANGKAH[indeks], indeks,
  pelajaranSelesai: selesai, pelajaranTotal: total,
  selesai: indeks === 4,
});

const TUGAS = (locale: Locale, key: "mat" | "geo" | "fis", chap: string): AssignmentEntry => ({
  learning_assignment_id: key, course_id: key, plp_release_id: key,
  subject: SUBJ[locale as L][key].split(" · ")[0],
  stage: "SMA", grade_label: SUBJ[locale as L][key].split(" · ")[1],
  title: CHAP[locale as L][chap],
  pre_test_assignment: "pre", post_test_assignment: "post",
});

/** A. the learner's home — one next action, then everything quiet. */
function Beranda({ locale }: { locale: Locale }) {
  const l = locale as L;
  const mat = TUGAS(locale, "mat", "c4");
  const geo = TUGAS(locale, "geo", "c2");
  const fis = TUGAS(locale, "fis", "c1");
  const pMat = POSISI(2), pGeo = POSISI(3, 5, 5), pFis = POSISI(4, 5, 5);
  const n = (x: number) => format.number(x, locale);
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <main className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("siklus.beranda", locale)}</p>
          <h1 className="pin-h1">{s("siklus.halo", locale)}, Rani</h1>
          <p className="pin-intro">{s("siklus.hari_ini", locale)}</p>
        </div>

        <section className="pin-lanjut">
          <p className="pin-eyebrow">{s("siklus.lanjutkan", locale)}</p>
          <p className="pin-where">{COURSE[l].mat}</p>
          <h2>{s("siklus.di.pelajaran", locale)} — {n(3)} {s("siklus.dari", locale)} {n(5)} {s("siklus.selesai_n", locale)}</h2>
          <JejakSiklus posisi={pMat} locale={locale} />
          <div className="pin-actions">
            <a className="pin-btn pin-primary" href="#">{s("siklus.lanjutkan", locale)}</a>
            <a className="pin-btn" href="#">{s("siklus.buka", locale)}</a>
          </div>
        </section>

        <section className="pin-sec">
          <h2>{s("siklus.perhatian", locale)}</h2>
          <div className="pin-perhatian">
            <span className="pin-what">{CHAP[l].c2}</span>
            <span className="pin-why">{s("siklus.di.penguasaan", locale)}</span>
            <div className="pin-actions"><a className="pin-btn" href="#">{s("siklus.mulai", locale)}</a></div>
          </div>
        </section>

        <section className="pin-sec">
          <h2>{s("siklus.milik_anda", locale)}</h2>
          <KartuTugas tugas={mat} posisi={pMat} locale={locale} aksi={{ href: "#", labelKey: "siklus.lanjutkan" }} />
          <KartuTugas tugas={geo} posisi={pGeo} locale={locale} aksi={{ href: "#", labelKey: "siklus.mulai" }} />
          <KartuTugas tugas={fis} posisi={pFis} locale={locale} aksi={{ href: "#", labelKey: "siklus.buka" }} />
        </section>

        <section className="pin-sec">
          <h2>{s("siklus.terbuka", locale)}</h2>
          <div className="pin-tugas">
            <span className="pin-ttitle">{l === "id" ? "Penilaian cepat · Bab 5: Statistika Dasar" : "Quick assessment · Chapter 5: Basic Statistics"}</span>
            <div className="pin-tfoot">
              <span className="pin-tstatus">
                {n(10)} {s("siklus.soal", locale)} · {l === "id" ? "Kelas 10A" : "Class 10A"} · {s("siklus.ditutup", locale)} {format.date("2026-09-19T16:00:00+07:00", locale)}
              </span>
              <a className="pin-btn" href="#">{s("siklus.buka", locale)}</a>
            </div>
          </div>
        </section>
        <KakiPintar />
      </main>
    </>
  );
}

const PETA_KARTU: Record<L, ReadingMapCard[]> = {
  id: [
    { peringkat: 1, tingkat: "PERLU_SEGERA", kode: "A", pernyataan: "Menyusun persamaan dari soal cerita", modul: "M2", pelajaran: "L3", halaman: "112", alasan: "Pada Pemetaan Awal, dua soal jenis ini belum tepat." },
    { peringkat: 2, tingkat: "WAJIB", kode: "B", pernyataan: "Metode eliminasi", modul: "M2", pelajaran: "L4", halaman: "118", alasan: "Dipakai pada bagian akhir bab ini." },
    { peringkat: 3, tingkat: "KUAT", kode: "C", pernyataan: "Metode substitusi", modul: "M2", pelajaran: "L2", halaman: "104", alasan: "Semua soal jenis ini sudah tepat." },
  ],
  en: [
    { peringkat: 1, tingkat: "PERLU_SEGERA", kode: "A", pernyataan: "Building equations from word problems", modul: "M2", pelajaran: "L3", halaman: "112", alasan: "On the Initial Mapping, two questions of this kind were not right yet." },
    { peringkat: 2, tingkat: "WAJIB", kode: "B", pernyataan: "The elimination method", modul: "M2", pelajaran: "L4", halaman: "118", alasan: "Used in the last part of this chapter." },
    { peringkat: 3, tingkat: "KUAT", kode: "C", pernyataan: "The substitution method", modul: "M2", pelajaran: "L2", halaman: "104", alasan: "Every question of this kind was right." },
  ],
};

/** B. one assignment: the trail, the step, the map. */
function Tugas({ locale }: { locale: Locale }) {
  const l = locale as L;
  const p = POSISI(2);
  const n = (x: number) => format.number(x, locale);
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <main className="pin-col">
        <a className="pin-back" href="#">← {s("siklus.beranda", locale)}</a>
        <div className="pin-head">
          <p className="pin-eyebrow">{SUBJ[l].mat}</p>
          <h1 className="pin-h1">{CHAP[l].c4}</h1>
          <p className="pin-intro">{s("siklus.langkah_dari", locale)}</p>
        </div>
        <JejakSiklus posisi={p} locale={locale} />
        <section className="pin-lanjut">
          <p className="pin-eyebrow">{s("siklus.sekarang", locale)}</p>
          <h2>{s("siklus.di.pelajaran", locale)} — {n(3)} {s("siklus.dari", locale)} {n(5)} {s("siklus.selesai_n", locale)}</h2>
          <p className="pin-sub">{s("map.intro", locale)}</p>
          <div className="pin-actions"><a className="pin-btn pin-primary" href="#">{s("siklus.lanjutkan", locale)}</a></div>
        </section>
        <section className="pin-sec">
          <h2>{s("siklus.peta_anda", locale)}</h2>
          <PetaBacaan kartu={PETA_KARTU[l]} locale={locale} />
        </section>
        <KakiPintar />
      </main>
    </>
  );
}

/** D. orientation — two real facts, and Q-15 on the well. */
function Mulai({ locale }: { locale: Locale }) {
  const l = locale as L;
  const orientasi: Orientation = {
    mode: "POST_TEST", title: "Uji Penguasaan", item_count: 24, allows_pause: true,
    hesitation_window_seconds: 45, opens_at: "2026-09-12T00:00:00+07:00",
    closes_at: "2026-09-19T16:00:00+07:00", attempt_limit: 1, attempts_used: 0,
  };
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <main className="pin-col">
        <a className="pin-back" href="#">← {CHAP[l].c2}</a>
        <OrientasiAsesmen
          orientasi={orientasi}
          locale={locale}
          eyebrow={`${SUBJ[l].geo} · ${CHAP[l].c2}`}
          judul={s("posttest.title", locale)}
          mulai={<button type="button" className="pin-btn pin-primary">{s("cycle.open", locale)} {s("posttest.title", locale)}</button>}
          kembali={{ href: "#", label: s("siklus.nanti", locale) }}
        />
        <KakiPintar />
      </main>
    </>
  );
}

/** F. the result — four things kept apart. */
function Hasil({ locale }: { locale: Locale }) {
  const l = locale as L;
  const n = (x: number) => format.number(x, locale);
  const doms: Array<[string, number, number]> = l === "id"
    ? [["Struktur bumi", 7, 8], ["Tektonik lempeng", 6, 9], ["Bentuk muka bumi", 5, 7]]
    : [["Earth's structure", 7, 8], ["Plate tectonics", 6, 9], ["Landforms", 5, 7]];
  const items: Array<[string, string, string, boolean]> = l === "id"
    ? [["04", "Lapisan bumi yang paling tebal adalah…", "Mantel", true],
       ["11", "Pergerakan dua lempeng yang saling menjauh menghasilkan…", "Palung laut", false]]
    : [["04", "The thickest layer of the Earth is…", "The mantle", true],
       ["11", "Two plates moving apart produce…", "An ocean trench", false]];
  const why = l === "id"
    ? ["Tepat. Mantel mengisi sekitar 84% volume bumi.",
       "Belum tepat. Lempeng yang saling menjauh membentuk punggung tengah samudra; palung terbentuk saat lempeng bertumbukan. Baca lagi kartu “Batas lempeng” di peta bacaan Anda."]
    : ["Right. The mantle is about 84% of the Earth's volume.",
       "Not right yet. Plates moving apart form a mid-ocean ridge; a trench forms where plates collide. Read the “Plate boundaries” card in your reading map again."];
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <main className="pin-col">
        <a className="pin-back" href="#">← {s("cycle.title", locale)}</a>
        <div className="pin-head">
          <p className="pin-eyebrow">{COURSE[l].geo}</p>
          <h1 className="pin-h1">{s("hasil.title", locale)}</h1>
        </div>
        <section className="pin-hasil">
          <p className="pin-eyebrow">{s("hasil.mastery", locale)}</p>
          <p className="pin-big2 pin-num">{format.percent(0.75, locale)}</p>
          <p className="pin-mean">
            {s("siklus.tepat_dari", locale)} {n(18)} {s("siklus.dari", locale)} {n(24)} {s("siklus.soal", locale)}.{" "}
            {s("siklus.ambang", locale)} {format.percent(0.7, locale)}.
          </p>
        </section>
        <div className="pin-banner pin-ok" role="status"><p>{s("hasil.safety.ok", locale)}</p></div>
        <section className="pin-sec">
          <h2>{s("hasil.domain", locale)}</h2>
          <div className="pin-domain">
            {doms.map(([name, a, b]) => (
              <div className="pin-drow" key={name}>
                <span>{name}</span><span className="pin-cnt pin-num">{n(a)}/{n(b)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="pin-sec">
          <h2>{s("hasil.review", locale)}</h2>
          <div className="pin-tinjau">
            {items.map(([pos, stem, ans, ok], i) => (
              <details className="pin-item" key={pos} open={!ok}>
                <summary className="pin-ihead">
                  <span className="pin-pos">{pos}</span>
                  <span className="pin-q">{stem}</span>
                  <span className={`pin-pill ${ok ? "pin-ok" : "pin-neutral"}`}>
                    {ok ? s("hasil.answer_right", locale) : s("hasil.answer_notyet", locale)}
                  </span>
                </summary>
                <span className="pin-mine">{s("hasil.answer_yours", locale)}: {ans}</span>
                <span className="pin-why">{why[i]}</span>
              </details>
            ))}
          </div>
        </section>
        <section className="pin-sec">
          <h2>{s("hasil.delta.LENGKAP", locale)}</h2>
          <div className="pin-metric">
            <span className="pin-mv pin-num">{format.percent(0.52, locale)} → {format.percent(0.75, locale)}</span>
            <span className="pin-mm">{s("siklus.delta_arti", locale)}</span>
          </div>
        </section>
        <div className="pin-actions"><a className="pin-btn pin-primary" href="#">{s("siklus.berikutnya", locale)} →</a></div>
        <KakiPintar />
      </main>
    </>
  );
}

/** G. what next, and the honest end beside it. */
function Lanjut({ locale, kosong }: { locale: Locale; kosong?: boolean }) {
  const l = locale as L;
  const n = (x: number) => format.number(x, locale);
  return (
    <>
      <Shell locale={locale} current="belajar" />
      <main className="pin-col">
        <a className="pin-back" href="#">← {s("hasil.title", locale)}</a>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("siklus.setelah", locale)}</p>
          <h1 className="pin-h1">{s("siklus.berikutnya", locale)}</h1>
          {!kosong ? <p className="pin-intro">{s("siklus.terbuka_kini", locale)}</p> : null}
        </div>
        {kosong ? (
          <section className="pin-sec">
            <h2>{s("siklus.habis.judul", locale)}</h2>
            <div className="pin-tugas"><span className="pin-tstatus">{s("siklus.habis.isi", locale)}</span></div>
          </section>
        ) : (
          <div className="pin-next">
            <div className="pin-nrow">
              <span><span className="pin-nt">{s("siklus.lihat_sertifikat", locale)}</span><br />
                <span className="pin-nw">{CHAP[l].c2}</span></span>
              <a className="pin-btn" href="#">{s("siklus.buka", locale)}</a>
            </div>
            <div className="pin-nrow">
              <span><span className="pin-nt">{COURSE[l].mat}</span><br />
                <span className="pin-nw">{s("siklus.di.pelajaran", locale)}</span></span>
              <a className="pin-btn" href="#">{s("siklus.buka", locale)}</a>
            </div>
            <div className="pin-nrow">
              <span><span className="pin-nt">{l === "id" ? "Penilaian cepat · Bab 5: Statistika Dasar" : "Quick assessment · Chapter 5: Basic Statistics"}</span><br />
                <span className="pin-nw">{n(10)} {s("siklus.soal", locale)} · {l === "id" ? "Kelas 10A" : "Class 10A"}</span></span>
              <a className="pin-btn" href="#">{s("siklus.buka", locale)}</a>
            </div>
          </div>
        )}
        <KakiPintar />
      </main>
    </>
  );
}

const SCREENS: Record<string, (l: Locale) => React.ReactElement> = {
  "01-daftar": (l) => <List locale={l} />,
  "02-sertifikat-berlaku": (l) => <Detail locale={l} state="ISSUED" />,
  "03-sertifikat-disiapkan": (l) => <Detail locale={l} state="ELIGIBLE" />,
  "04-sertifikat-dicabut": (l) => <Detail locale={l} state="REVOKED" />,
  "05-sertifikat-digantikan": (l) => <Detail locale={l} state="SUPERSEDED" />,
  "06-cetak-a4": (l) => <Print locale={l} />,
  "07-verifikasi-berlaku": (l) => <Verify locale={l} vcase="berlaku" />,
  "08-verifikasi-dicabut": (l) => <Verify locale={l} vcase="dicabut" />,
  "09-verifikasi-digantikan": (l) => <Verify locale={l} vcase="digantikan" />,
  "10-verifikasi-tidak-sah": (l) => <Verify locale={l} vcase="tidaksah" />,
  "11-verifikasi-tidak-ditemukan": (l) => <Verify locale={l} vcase="none" />,
  "12-fondasi-bukti": (l) => <Foundations locale={l} />,
  "13-siklus-beranda": (l) => <Beranda locale={l} />,
  "14-siklus-tugas": (l) => <Tugas locale={l} />,
  "15-siklus-mulai": (l) => <Mulai locale={l} />,
  "16-siklus-hasil": (l) => <Hasil locale={l} />,
  "17-siklus-lanjut": (l) => <Lanjut locale={l} />,
  "18-siklus-habis": (l) => <Lanjut locale={l} kosong />,
};

// LembarA4's own scaling runs in a useEffect, which static rendering does not
// execute. This is the same arithmetic, so the sheet is screenshotted at the
// scale the component would have given it.
const FIT = `<script>(function(){var b=document.getElementById("sheetbox");if(!b)return;
var sh=b.firstElementChild,s=Math.min(1,b.clientWidth/794);
sh.style.transform="scale("+s+")";b.style.height=Math.round(1123*s)+"px";})();</script>`;

let written = 0;
for (const [name, make] of Object.entries(SCREENS)) {
  for (const locale of ["id", "en"] as Locale[]) {
    writeFileSync(join(OUT, `${name}.${locale}.html`),
      `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${name} ${locale}</title><style>${css}</style></head>` +
      `<body class="min-h-dvh bg-surface-0 text-ink-1">` +
      `${renderToStaticMarkup(make(locale))}${FIT}</body></html>`);
    written++;
  }
}
console.log(`screens: ${written} → ${OUT}`);
