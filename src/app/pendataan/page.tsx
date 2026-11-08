import Link from "next/link";
import Kosong from "@/components/Kosong";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as data from "@/lib/pendataan";
import { tahap } from "@/lib/pendataan-kontrak";
import { bukaPendataanAksi, simpanKodeAksi } from "./actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import TandaTautan from "@/components/TandaTautan";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import BacaDanPetakan from "@/components/pendataan/BacaDanPetakan";
import BidangTeks from "@/components/bentuk/BidangTeks";
import { tanggal } from "@/lib/tanggal";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pendataan");

export const dynamic = "force-dynamic";

/**
 * ADDING PEOPLE — the institutional administrator's way in.
 *
 * THREE THINGS IN ORDER, and the first one gates the rest. A school cannot be
 * given institutional IDs before it has a code to build them from, so the code
 * comes first; then any intake still running, because somebody returning after
 * a closed laptop needs that before they need a new file; then the new file.
 *
 * WHO SEES IT: `can_on_node('CAN_PROVISION_PEOPLE', …)`. WP5A puts that on
 * INSTITUTION_ADMIN and SYSTEM_ADMIN and says in the migration why a head of
 * department and a dean do not get it — "Management is academic judgement and
 * provisioning is not". So a WP4 Management reader meets the one refusal page,
 * and nothing on this page reads a role name to reach that answer.
 *
 * NOTHING ON THIS PAGE WRITES. The code form and the intake form are both
 * server actions reached by a submit; rendering reads and nothing else.
 */
export default async function Pendataan({
  searchParams,
}: {
  searchParams: Promise<{ sekolah?: string; galat?: string }>;
}) {
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });

  const sekolah = await data.sekolahPendataan();
  if (sekolah.length === 0) {
    return (
      <HalamanPenolakan
        messageKey="pendataan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/"
        backKey="galat.beranda"
      />
    );
  }

  const dipilih = sekolah.find((x) => x.id === sp.sekolah) ?? sekolah[0];
  const [pekerjaan, tempat] = await Promise.all([
    data.pekerjaanSekolah(dipilih.id),
    dipilih.kode ? data.tempatSekolah(dipilih.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" current="pendataan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("pendataan.eyebrow")}</p>
          <h1 className="pin-h1">{s("pendataan.judul")}</h1>
          <p className="pin-intro">{s("pendataan.intro")}</p>
        </div>

        {sekolah.length > 1 ? (
          <nav className="pin-lingkup" aria-label={s("pendataan.sekolah")}>
            <span className="pin-meta">{s("pendataan.sekolah")}</span>
            <ul>
              {sekolah.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/pendataan?sekolah=${encodeURIComponent(x.id)}`}
                    aria-current={x.id === dipilih.id ? "true" : undefined}
                  >
                    {x.nama}
                    <TandaTautan />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* ── THE CODE ──────────────────────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-kode">
          <h2 id="pin-kode">{s("pendataan.kode.judul")}</h2>

          {dipilih.kode && dipilih.beku ? (
            // FROZEN IS IDENTITY, NOT A SETTING. No field, no save button,
            // nothing that looks editable: a database trigger refuses a change
            // once one ID has been issued, and a form that would be refused is
            // a promise the product cannot keep.
            <>
              <p className="pin-data-kode">{dipilih.kode}</p>
              <p className="pin-mm">{s("pendataan.kode.beku")}</p>
            </>
          ) : (
            <>
              {!dipilih.kode ? <p className="pin-empty">{s("pendataan.kode.belum")}</p> : null}
              <p className="pin-mm">{s("pendataan.kode.arti")}</p>
              {/* SAID BEFORE THE FIRST ISSUANCE, which is the only time saying
                  it can help. */}
              <p className="pin-msg pin-msg-note">{s("pendataan.kode.peringatan")}</p>
              {sp.galat === "kode" ? <BarisHasil nada="gagal">{s("pendataan.kode.gagal")}</BarisHasil> : null}
              {/* W3.7 (Batch 4; RV-22): Daisy's TextField: the label in sentence case, the hint directly under it and named
                  by the field, the field and its button on one row at the same height */}
              <form action={simpanKodeAksi} className="pin-baris-aksi">
                <input type="hidden" name="institusi" value={dipilih.id} />
                <BidangTeks id="pin-kode-isi" name="kode" label={s("pendataan.kode.label")} petunjuk={s("pendataan.kode.bentuk")}
                  defaultValue={dipilih.kode ?? ""} maxLength={3} size={3} autoComplete="off" spellCheck={false} />
                <TombolKirim className="pin-btn" sibuk={s("tombol.menyimpan")}>{s("pendataan.kode.simpan")}</TombolKirim>
              </form>
            </>
          )}

          {dipilih.kode ? (
            <p className="pin-meta">
              {s("pendataan.kode.contoh")}: <span className="pin-mono">{dipilih.kode}000001AB</span>
            </p>
          ) : null}
          {/* §3. The number says who, at this school. It does not say what. */}
          <p className="pin-mm">{s("pendataan.nomor.arti")}</p>
        </section>

        {/* ── WHAT IS ALREADY RUNNING ───────────────────────────────────── */}
        <section className="pin-sec" aria-labelledby="pin-riwayat">
          <h2 id="pin-riwayat">{s("pendataan.daftar.judul")}</h2>
          {pekerjaan.length === 0 ? (
            <Kosong jenis="belum" kalimat={s("pendataan.daftar.kosong")} />
          ) : (
            <ul className="pin-list pin-data-riwayat">
              {pekerjaan.map((j) => {
                const fase = tahap(j);
                return (
                  <li key={j.id}>
                    <Link href={`/pendataan/${encodeURIComponent(j.id)}`}>
                      <span className="pin-ml">
                        {/* W3.6 / RV-16: a record's moment through the one date helper, on WIB */}
                        {format.number(j.total, locale)} · {tanggal(j.dibuat, "cap", locale) || j.dibuat}
                      </span>
                      {/* The job's own state, as a sentence. The enum never
                          renders. */}
                      <span className="pin-mm">
                        {fase ? s(`pendataan.keadaan.${fase}` as HleEvent) : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── A NEW FILE ────────────────────────────────────────────────── */}
        {/* E-K4: a file that could not be opened as an intake used to be answered nowhere (?galat=baris was read by
            no page); it is said here, at the form that sent it */}
        {sp.galat === "baris" ? <BarisHasil nada="gagal">{s("pendataan.buka.gagal")}</BarisHasil> : null}
        {dipilih.kode ? (
          <BacaDanPetakan
            institusi={dipilih.id}
            tempat={tempat}
            aksi={bukaPendataanAksi}
            locale={locale}
          />
        ) : (
          // Readiness B3 (Daisy, 8 Nov): the upload waits for the school code; say so where the upload would be
          <p className="pin-msg pin-msg-note" data-perlu-kode="">{s("pendataan.unggah.perlu_kode")}</p>
        )}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
