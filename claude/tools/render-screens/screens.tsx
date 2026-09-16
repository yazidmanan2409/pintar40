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
        <span className="pin-wordmark">{s("app.name", locale, "public")}</span>
        <span className="pin-sub">{s("verifikasi.situs", locale, "public")}</span>
        <span className="pin-spacer" />{lang}
      </header>
    );
  }
  return (
    <header className="pin-top pin-shell pin-noprint">
      <span className="pin-wordmark">{s("app.name", locale)}</span>
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
