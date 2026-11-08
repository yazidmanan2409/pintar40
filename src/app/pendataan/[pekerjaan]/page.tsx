import Link from "next/link";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as data from "@/lib/pendataan";
import { AKUN_AKTIF, bolehLanjut, percontohanMenunggu, tahap } from "@/lib/pendataan-kontrak";
import {
  kemajuanAksi, konfirmasiAksi, majukanAksi, periksaAksi, periksaPercontohanAksi,
} from "../actions";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import PeriksaDaftar from "@/components/pendataan/PeriksaDaftar";
import Penggerak from "@/components/pendataan/Penggerak";
import IsianSetuju from "@/components/pendataan/IsianSetuju";
import DaftarNama from "@/components/pendataan/DaftarNama";
import { semuaNama } from "../nama";
import { tawarkanSekolahLain } from "@/lib/konteks-server";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/pendataan/[pekerjaan]");

export const dynamic = "force-dynamic";

/**
 * ONE INTAKE, WHEREVER IT HAS GOT TO.
 *
 * THE PAGE IS A FUNCTION OF DURABLE STATE AND NOTHING ELSE. It reads
 * `import_progress` and renders the phase that answer names — which is what
 * makes recovery uneventful rather than a feature. A browser that died mid-run,
 * a different machine, a week later: all of them arrive here, read the same
 * row, and are offered the same next act. The browser never owned the job, so
 * there is nothing for it to have lost.
 *
 * THIS IS ALSO WHY THERE IS NO "RESUME" SCREEN. Resuming is not a special
 * case; it is what this page does every time it renders. An interrupted
 * thousand-row job shows 100 recorded and 900 to go because that is what the
 * database says, and the button says Continue rather than Start because
 * `completed` is above zero.
 *
 * A JOB OF ANOTHER SCHOOL AND A JOB ID THAT IS NOBODY'S are the same refusal:
 * `import_job_for_admin` raises one sentence for both, `import_progress`
 * returns nothing, and this renders the one refusal page, which has no slot for
 * a reason.
 */
export default async function SatuPendataan({
  params,
  searchParams,
}: {
  params: Promise<{ pekerjaan: string }>;
  searchParams: Promise<{ galat?: string }>;
}) {
  const { pekerjaan } = await params;
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: string) => t(k as HleEvent, "staff", { locale });

  const kemajuan = await data.kemajuan(pekerjaan);
  if (!kemajuan) {
    return (
      <HalamanPenolakan
        messageKey="pendataan.ditolak"
        persona="staff"
        locale={locale}
        backHref="/pendataan"
      />
    );
  }
  // L3 (§2.6): an intake of another school the reader provisions for is never shown in this context; the chooser offers it
  await tawarkanSekolahLain(kemajuan.institution_id);

  const fase = tahap(kemajuan);
  const menungguPercontohan = percontohanMenunggu(kemajuan);
  // The pilot rows themselves, and only when they are what the administrator
  // is being asked to look at. A checkpoint with nothing to inspect is a
  // dialog box, and reading fifty rows on every other phase would be a read
  // nobody asked for.
  const barisPercontohan = menungguPercontohan
    ? await data.barisPekerjaan(pekerjaan, { sampai: kemajuan.pilot_size })
    : [];
  const barisGagal = fase === "gagal"
    ? await data.barisPekerjaan(pekerjaan, { keadaan: "FAILED" })
    : [];
  const pratinjau = fase === "menunggu_konfirmasi" ? await data.pratinjau(pekerjaan) : null;
  // D-077(3): the approval is given on every name, or not offered. The list
  // must be complete (`semuaNama` is null otherwise) and as long as WP5A's
  // own count of rows.
  const nama = pratinjau ? await semuaNama(pekerjaan) : null;
  const namaLengkap = nama !== null && nama.length === Number(pratinjau?.row_count ?? -1);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pendataan" current="pendataan" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href="/pendataan">← {s("nav.pendataan")}</Link>

        <div className="pin-head">
          <p className="pin-eyebrow">{s("pendataan.eyebrow")}</p>
          <h1 className="pin-h1">
            {format.number(kemajuan.total, locale)} · {fase ? s(`pendataan.keadaan.${fase}`) : ""}
          </h1>
        </div>

        {/* ── DRAFT: the check has not run, or found problems ───────────── */}
        {fase === "menyusun" ? (
          <PeriksaDaftar pekerjaan={pekerjaan} aksi={periksaAksi} locale={locale} />
        ) : null}

        {/* ── AWAITING CONFIRMATION: the authoritative preview ──────────── */}
        {fase === "menunggu_konfirmasi" && pratinjau ? (
          <section className="pin-sec" aria-labelledby="pin-pratinjau">
            <h2 id="pin-pratinjau">{s("pendataan.pratinjau.judul")}</h2>

            {/* WP5A'S OWN NUMBERS. Nothing here is recomputed from the rows:
                the preview is what a human is deciding on, so it has to be the
                answer the database gave. */}
            <dl className="pin-facts">
              <div>
                <dt>{s("pendataan.pratinjau.total")}</dt>
                <dd className="pin-num">{format.number(Number(pratinjau.row_count ?? 0), locale)}</dd>
              </div>
              <div>
                <dt>{s("pendataan.pratinjau.baru")}</dt>
                <dd className="pin-num">{format.number(Number(pratinjau.new_persons ?? 0), locale)}</dd>
              </div>
              <div>
                <dt>{s("pendataan.pratinjau.tertaut")}</dt>
                <dd className="pin-num">
                  {format.number(Number(pratinjau.existing_persons_linked ?? 0), locale)}
                </dd>
              </div>
              <div>
                <dt>{s("pendataan.pratinjau.nomor")}</dt>
                <dd className="pin-num">
                  {format.number(Number(pratinjau.institutional_ids_to_assign ?? 0), locale)}
                </dd>
              </div>
              {/* §16. THE NUMBER IS ZERO AND IT IS SHOWN, not omitted. An
                  administrator about to record six hundred people is most
                  likely to assume this one wrongly, so PINTAR says it. */}
              <div>
                <dt>{s("pendataan.pratinjau.akun")}</dt>
                <dd className="pin-num">
                  {format.number(Number(pratinjau.accounts_activated ?? AKUN_AKTIF), locale)}
                </dd>
              </div>
            </dl>
            <p className="pin-mm">{s("pendataan.pratinjau.akun_arti")}</p>

            {pratinjau.by_role && typeof pratinjau.by_role === "object" ? (
              <>
                <h3 className="pin-ml">{s("pendataan.pratinjau.peran")}</h3>
                <ul className="pin-list pin-data-peran">
                  {Object.entries(pratinjau.by_role as Record<string, unknown>).map(([r, n]) => (
                    <li key={r}>
                      <span>{t(`role.${r}` as HleEvent, "staff", { locale })}</span>
                      <span className="pin-num">{format.number(Number(n), locale)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {kemajuan.pilot_required ? (
              <p className="pin-msg pin-msg-note">{s("pendataan.percontohan.arti")}</p>
            ) : null}

            {/* D-077(3): EVERY NAME, THEN ONE APPROVAL. With no complete
                list there is nothing to approve on, so no form is drawn. */}
            {namaLengkap ? (
              <>
                <DaftarNama locale={locale} nama={nama!} />
                <p className="pin-mm">{s("pendataan.pratinjau.tanya")}</p>
                {/* E-K4: a refused confirmation is said at its button, not above the whole preview */}
                {sp.galat === "konfirmasi" ? <BarisHasil nada="gagal">{s("pendataan.konfirmasi.gagal")}</BarisHasil> : null}
                {/* A PLAIN FORM. The consequential act needs no script to work, and
                    it calls WP5A's confirmation rather than moving a flag here.
                    UX-08: its press also starts the recording (IsianSetuju). */}
                <form action={konfirmasiAksi}>
                  <IsianSetuju pekerjaan={pekerjaan} />
                  <TombolKirim className="pin-btn pin-go pin-data-btn" sibuk={s("tombol.memproses")}>{s("pendataan.pratinjau.setuju")}</TombolKirim>
                </form>
              </>
            ) : (
              <BarisHasil nada="gagal">{s("pendataan.nama.gagal")}</BarisHasil>
            )}
          </section>
        ) : null}

        {/* ── THE FIFTY, COMMITTED AND WAITING FOR A HUMAN ──────────────── */}
        {menungguPercontohan ? (
          <section className="pin-sec pin-data-periksa" aria-labelledby="pin-pilot">
            <h2 id="pin-pilot">{s("pendataan.percontohan.judul")}</h2>
            <p className="pin-lede">{s("pendataan.percontohan.nyata")}</p>
            <p className="pin-mm">{s("pendataan.percontohan.arti")}</p>

            {/* THE CHECK IS ONLY REAL IF THERE IS SOMETHING TO CHECK. Each of
                the fifty with the identity number PINTAR generated for them. */}
            <ol className="pin-list pin-data-pilot">
              {barisPercontohan.map((r) => (
                <li key={r.ordinal}>
                  <span className="pin-num">{format.number(r.ordinal, locale)}</span>
                  <span>{r.nama ?? "—"}</span>
                  <span className="pin-mono">{r.identitas ?? "—"}</span>
                </li>
              ))}
            </ol>

            <p className="pin-meta">
              <span className="pin-num">{format.number(kemajuan.remaining, locale)}</span>{" "}
              {s("pendataan.percontohan.sisa")}
            </p>

            {/* E-K4: a refused check is said at its button, below the fifty it is about */}
            {sp.galat === "percontohan" ? <BarisHasil nada="gagal">{s("pendataan.percontohan.gagal")}</BarisHasil> : null}
            {/* UX-08: «lanjutkan sisanya» continues the recording itself. */}
            <form action={periksaPercontohanAksi}>
              <IsianSetuju pekerjaan={pekerjaan} />
              <TombolKirim className="pin-btn pin-go pin-data-btn" sibuk={s("tombol.memeriksa")}>{s("pendataan.percontohan.tanya")}</TombolKirim>
            </form>
          </section>
        ) : null}

        {/* ── PROVISIONING, OR WAITING TO BE CONTINUED ──────────────────── */}
        {/* The driver says itself whether the job stopped part-way: only it
            knows whether it is running now (UX-08). */}
        {bolehLanjut(kemajuan) ? (
          <Penggerak
            awal={kemajuan}
            pekerjaan={pekerjaan}
            majukan={majukanAksi}
            bacaUlang={kemajuanAksi}
            locale={locale}
          />
        ) : null}

        {kemajuan.pilot_verified && fase !== "periksa_percontohan" ? (
          <p className="pin-meta">{s("pendataan.percontohan.sudah")}</p>
        ) : null}

        {/* ── DONE ──────────────────────────────────────────────────────── */}
        {fase === "selesai" ? (
          <section className="pin-sec" aria-labelledby="pin-usai">
            <h2 id="pin-usai">{s("pendataan.selesai.judul")}</h2>
            <p className="pin-lede">
              <span className="pin-num">{format.number(kemajuan.completed, locale)}</span>{" "}
              {s("pendataan.selesai.arti")}
            </p>
            {/* Repeated here rather than only on the preview: this is the
                screen an administrator screenshots and sends to a colleague. */}
            <p className="pin-mm">{s("pendataan.pratinjau.akun_arti")}</p>
            {/* Readiness B2/B3 (Daisy, 8 Nov): the way on, in the order that works: a teacher's role before their
                account (so they are never counted for a class card), a learner's class card on Aktivasi */}
            <h3 className="pin-h3">{s("pendataan.lanjut.judul")}</h3>
            <ol className="pin-daftar-titik" data-lanjut="">
              <li>{s("pendataan.lanjut.staf")} <Link href="/konfigurasi/roles">{s("config.section.roles")}</Link></li>
              <li>{s("pendataan.lanjut.aktif")} <Link href="/aktivasi">{s("nav.aktivasi")}</Link></li>
            </ol>
          </section>
        ) : null}

        {/* ── STOPPED ───────────────────────────────────────────────────── */}
        {fase === "gagal" ? (
          <section className="pin-sec" aria-labelledby="pin-gagal">
            <h2 id="pin-gagal">{s("pendataan.gagal.judul")}</h2>
            <p className="pin-lede">
              <span className="pin-num">{format.number(kemajuan.completed, locale)}</span>{" "}
              {s("pendataan.maju.selesai")}
              {" · "}
              <span className="pin-num">{format.number(kemajuan.failed, locale)}</span>{" "}
              {s("pendataan.maju.gagal_baris")}
            </p>
            {barisGagal.length > 0 ? (
              <>
                <p className="pin-mm">{s("pendataan.gagal.baris")}</p>
                <ul className="pin-list pin-data-masalah">
                  {barisGagal.map((r) => (
                    <li key={r.ordinal}>
                      <span className="pin-ml">
                        {s("pendataan.periksa.baris")} {format.number(r.ordinal, locale)}
                      </span>
                      <span>{r.nama ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}
      </main>
      <KakiPintar className="pin-noprint" />
    </>
  );
}
