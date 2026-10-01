import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import BarisHasil from "@/components/BarisHasil";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import PemilihKelas from "@/components/mengajar/PemilihKelas";
import DaftarMurid from "@/components/mengajar/DaftarMurid";

export const dynamic = "force-dynamic";

/**
 * SCREEN B — one class, as a teaching context.
 *
 * THE TITLE NAMES WHAT IS BEING LOOKED AT, NOT WHO OWNS IT. "Anda sedang
 * melihat" over the class name, and an intro that says why this class appears
 * at all: the school assigned this reader to a scope that contains it. PINTAR
 * has no concept of a class belonging to a teacher and this screen does not
 * invent one — which is also the honest thing to say, because the authority
 * behind most of what follows is institution-wide rather than class-bound.
 *
 * MAKING AVAILABLE IS NOT PUBLISHING, said where an educator would ask. An
 * EDUCATOR holds CAN_DRAFT and CAN_ASSIGN_LEARNING and does not hold
 * CAN_PUBLISH; the sentence under the material list says so in the product's
 * own words rather than leaving a teacher to discover it at a refusal.
 *
 * MATERIAL IS LISTED AS THE SCHOOL PUBLISHES IT. The reviewed concept listed
 * chapters with their own availability. PINTAR publishes a `plp_releases` row
 * per COURSE and the chapters are `modules` inside it, so a per-chapter window
 * would be a fact no row carries. The rows are therefore the material the
 * school actually released, with the window the assignment actually holds.
 */
export default async function Kelas({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ sedia?: string }>;
}) {
  const { kelas: id } = await params;
  const { sedia } = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });

  const ctx = await ajar.kelas(id);
  if (!ctx) {
    return (
      <HalamanPenolakan
        locale={locale}
        persona="educator"
        backHref="/mengajar"
        backKey="mengajar.kembali"
      />
    );
  }

  const [fakta, tugas, buka, terbit] = await Promise.all([
    ajar.faktaKelas(id),
    ajar.penugasan(id),
    ajar.berjalan([id]),
    ajar.terbitan(ctx.ini.institusi),
  ]);

  const punya = new Set(tugas.map((x) => x.releaseId));
  const aktif = tugas.filter((x) => x.status === "ACTIVE" && !x.berakhir);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main className="pin-col">
        <Link className="pin-back" href="/mengajar">
          ← {s("mengajar.kembali")}
        </Link>
        <BarisLingkup
          scope={{
            institution: ctx.konteks.institusi?.nama ?? null,
            path: [ctx.ini.nama],
            period: ctx.konteks.periode,
          }}
          locale={locale}
        />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("mengajar.melihat")}</p>
          <h1 className="pin-h1">{ctx.ini.nama}</h1>
          <p className="pin-intro">{s("mengajar.kelas.intro")}</p>
        </div>

        <PemilihKelas kelas={ctx.konteks.kelas} terpilih={id} locale={locale} />

        <dl className="pin-facts">
          <div>
            <dt>{s("mengajar.fakta.mapel")}</dt>
            <dd>{fakta.mapel ?? "—"}</dd>
          </div>
          <div>
            <dt>{s("mengajar.fakta.murid")}</dt>
            <dd className="pin-num">{format.number(fakta.murid.length, locale)}</dd>
          </div>
          <div>
            <dt>{s("mengajar.fakta.materi")}</dt>
            <dd>
              {aktif.length > 0
                ? format.number(aktif.length, locale)
                : s("mengajar.fakta.materi.kosong")}
            </dd>
          </div>
        </dl>

        <div className="pin-actions">
          <Link className="pin-btn pin-primary" href={`/mengajar/${id}/siapkan`}>
            {s("mengajar.siap.eyebrow")}
          </Link>
          <Link className="pin-btn" href={`/mengajar/${id}/uji-cepat`}>
            {s("mengajar.aksi.uji_cepat")}
          </Link>
          <Link className="pin-btn" href={`/mengajar/${id}/bukti`}>
            {s("mengajar.aksi.bukti")}
          </Link>
          <Link className="pin-btn" href={`/mengajar/${id}/langkah`}>
            {s("mengajar.aksi.langkah")}
          </Link>
          {/* WP7C. The class's own feedback, beside the class's own evidence:
              a reading rather than an act, which is what `bukti` is too. Always
              offered, because whether a round has been held is a fact the
              subject of one is entitled to, and the page behind it says plainly
              when there has not been one. */}
          <Link className="pin-btn" href={`/mengajar/${id}/umpan-balik`}>
            {s("umpanbalik.guru.judul")}
          </Link>
        </div>

        <div className="pin-sec">
          <h2>{s("mengajar.berjalan.kelas")}</h2>
          {buka.length === 0 ? (
            <p className="pin-empty">{s("mengajar.berjalan.kosong")}</p>
          ) : (
            <div className="pin-list">
              {buka.map((b) => (
                <div key={b.id} className="pin-row">
                  <span className="pin-title">{b.judul}</span>
                  <span className="pin-rowmeta">
                    {b.ditutup ? <span>{format.date(b.ditutup, locale)}</span> : null}
                    <span>
                      {format.number(b.mengumpulkan, locale)}/
                      {format.number(fakta.murid.length, locale)}{" "}
                      {s("mengajar.bukti.kumpul").toLowerCase()}
                    </span>
                  </span>
                  <span className="pin-pill pin-neutral">{s("mengajar.status.berjalan")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pin-sec">
          <h2>{s("mengajar.materi.judul")}</h2>
          <p className="pin-sub">{s("mengajar.materi.sub")}</p>
          {/* DAISY-18: "Sediakan" lands here, beside the material it made available */}
          {sedia === "ok" ? <BarisHasil nada="ok">{s("mengajar.sedia.ok")}</BarisHasil> : null}
          {tugas.length === 0 && terbit.length === 0 ? (
            <p className="pin-empty">{s("mengajar.materi.kosong")}</p>
          ) : (
            <div className="pin-list">
              {tugas.map((x) => (
                <div key={x.id} className="pin-row">
                  <span className="pin-title">{x.kursus}</span>
                  <span className="pin-rowmeta">
                    {x.mulai ? <span>{format.date(x.mulai, locale)}</span> : null}
                    {x.sampai ? <span>{format.date(x.sampai, locale)}</span> : null}
                  </span>
                  <span className="pin-pill pin-neutral">{s(ajar.statusMateri(x))}</span>
                </div>
              ))}
              {terbit
                .filter((r) => !punya.has(r.id))
                .map((r) => (
                  <Link
                    key={r.id}
                    className="pin-row"
                    href={`/mengajar/${id}/siapkan?terbitan=${r.id}`}
                  >
                    <span className="pin-title">{r.kursus}</span>
                    {/* DAISY-26 (UX-20): the date says which release; its version number means nothing to a teacher */}
                    <span className="pin-rowmeta">
                      {r.terbitPada ? (
                        <span>
                          {s("mengajar.siap.diterbitkan")} {format.date(r.terbitPada, locale)}
                        </span>
                      ) : null}
                    </span>
                    <span className="pin-pill pin-info">{s("mengajar.status.siap")}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <div className="pin-sec">
          <h2>{s("mengajar.murid.judul")}</h2>
          <p className="pin-sub">
            {format.number(fakta.murid.length, locale)} {s("mengajar.fakta.murid").toLowerCase()}.{" "}
            {s("mengajar.murid.sub")}
            {fakta.rosterBerubah
              ? ` ${s("mengajar.fakta.berubah")} ${format.date(fakta.rosterBerubah, locale)}.`
              : ""}
          </p>
          <DaftarMurid murid={fakta.murid} locale={locale} kelas={id} />
        </div>

        <KakiPintar />
      </main>
    </>
  );
}
