"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import type {
  HasilStruktur,
  KodeStruktur,
  SimpulStruktur,
  TingkatanStruktur,
} from "@/lib/struktur-kontrak";
import {
  buatBagianAksi,
  buatKelasAksi,
  buatTingkatAksi,
  nonaktifkanStrukturAksi,
  ubahNamaStrukturAksi,
} from "@/app/konfigurasi/actions";
import {
  bolehDiubah,
  bolehDitambahi,
  jumlahMurid,
  kalimatGagal,
  kalimatGagalBaca,
  KUNCI_CONTOH,
  KUNCI_JENIS,
  KUNCI_TAMBAH,
  pohonStruktur,
} from "./tampilan";

type Aksi = (prev: HasilStruktur | null, fd: FormData) => Promise<HasilStruktur>;
/** What a form remembers of its last press: the answer, and the name it was about. */
type Jejak = { hasil: HasilStruktur; nama: string } | null;
type Apa = "dibuat" | "diubah" | "dinonaktifkan";

/**
 * STRUKTUR SEKOLAH (DAISY-05; D-006, D-022, D-027). One school's Bagian,
 * Tingkat and Kelas, and the five acts on them, on BOB-01's contract.
 *
 * THE LIST IS RE-READ AFTER EVERY ANSWER, success or refusal (BOB-08(d)). The
 * list on screen is never patched from a result: a create whose response was
 * lost has still happened, and only the database's list says so. A success
 * comes back with the page already re-read (the action revalidates it); every
 * other answer asks the page to read again here.
 *
 * DEACTIVATING ASKS FIRST (D-022). "Nonaktifkan" only opens a question in the
 * row; the one form that sends the deactivation is inside that question. There
 * is no way back from this screen in sprint 1, and the question says so.
 *
 * Nothing here decides who may do what: every act is decided again in the
 * database, and a refusal comes back as a code with its own sentence.
 */
export default function PanelStruktur({
  locale,
  institusi,
  rows,
  gagalBaca,
  tahunKini,
}: {
  locale: Locale;
  /** The school being built: its id is also the root of its tree. */
  institusi: string;
  /** `bacaStruktur`'s rows, or null when it could not read them. */
  rows: SimpulStruktur[] | null;
  gagalBaca: { code: KodeStruktur; ref?: string } | null;
  /** This school year in Jakarta, worked out on the server for the Tingkat form. */
  tahunKini: string;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });

  if (rows === null) {
    return (
      <p className="pin-msg pin-msg-err" role="alert">
        {kalimatGagalBaca(gagalBaca?.code ?? "STRUCTURE_FAILED", gagalBaca?.ref, locale)}
      </p>
    );
  }

  const pohon = pohonStruktur(rows);
  return (
    <div className="pin-str">
      {/* The order a school is built in, said once: Gladys's sheet reads the
          same way, and a new school sees the path to its first Kelas before
          it has anything to click. */}
      <ol className="pin-str-langkah">
        <li>{s("config.struktur.langkah.bagian")}</li>
        <li>{s("config.struktur.langkah.tingkat")}</li>
        <li>{s("config.struktur.langkah.kelas")}</li>
      </ol>
      {pohon.length === 0 ? (
        <p className="pin-str-kosong">{s("config.struktur.kosong")}</p>
      ) : (
        <ul className="pin-str-pohon">
          {pohon.map((b) => (
            <li key={b.node_id} className="pin-str-simpul">
              <BarisSimpul simpul={b} locale={locale} />
              <ul className="pin-str-anak">
                {b.tingkat.map((tk) => (
                  <li key={tk.node_id} className="pin-str-simpul">
                    <BarisSimpul simpul={tk} locale={locale} />
                    <ul className="pin-str-anak">
                      {tk.kelas.map((k) => (
                        <li key={k.node_id} className="pin-str-simpul">
                          <BarisSimpul simpul={k} locale={locale} />
                        </li>
                      ))}
                      {tk.kelas.length === 0 && <li className="pin-str-kosong">{s("config.struktur.kelas_kosong")}</li>}
                    </ul>
                    {bolehDitambahi(tk) && (
                      <FormTambah
                        locale={locale}
                        tingkatan="KELAS"
                        aksi={buatKelasAksi}
                        induk={{ nama: "tingkat", id: tk.node_id }}
                        tahunIkut={tk.academic_year}
                      />
                    )}
                  </li>
                ))}
                {b.tingkat.length === 0 && <li className="pin-str-kosong">{s("config.struktur.tingkat_kosong")}</li>}
              </ul>
              {bolehDitambahi(b) && (
                <FormTambah
                  locale={locale}
                  tingkatan="TINGKAT"
                  aksi={buatTingkatAksi}
                  induk={{ nama: "bagian", id: b.node_id }}
                  tahunBawaan={tahunKini}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <FormTambah locale={locale} tingkatan="BAGIAN" aksi={buatBagianAksi} induk={{ nama: "institusi", id: institusi }} />
    </div>
  );
}

/**
 * One form's press, and the re-read after it. Returns the last answer and the
 * name it was about. A thrown action (the network dropped) is an answer too:
 * "not saved", and the list is read again all the same.
 */
function useAksi(aksi: Aksi, setelah?: (h: HasilStruktur) => void) {
  const router = useRouter();
  return useActionState(async (_prev: Jejak, fd: FormData): Promise<Jejak> => {
    const nama = String(fd.get("nama") ?? "").trim();
    let hasil: HasilStruktur;
    try {
      hasil = await aksi(null, fd);
    } catch {
      hasil = { ok: false, code: "STRUCTURE_FAILED" };
    }
    setelah?.(hasil);
    // BOB-08(d): the list is read again after EVERY answer. A success is
    // re-read by the action itself (`revalidatePath` sends the fresh page back
    // with the answer); anything else -- a refusal, a failure, a dropped
    // connection -- is re-read here. Exactly one read per press, either way.
    if (!hasil.ok) router.refresh();
    return { hasil, nama };
  }, null);
}

/** The line under a form: what happened, or the refusal's own sentence. */
function Pesan({ jejak, apa, locale }: { jejak: Jejak; apa: Apa; locale: Locale }) {
  if (!jejak) return null;
  const s = (k: HleEvent) => t(k, "staff", { locale });
  if (jejak.hasil.ok) {
    return apa === "diubah" ? (
      <BarisHasil nada="ok">
        {s("config.struktur.ok.diubah")} <strong>{jejak.nama}</strong>.
      </BarisHasil>
    ) : (
      <BarisHasil nada="ok">
        <strong>{jejak.nama}</strong> {s(apa === "dibuat" ? "config.struktur.ok.dibuat" : "config.struktur.ok.dinonaktifkan")}
      </BarisHasil>
    );
  }
  return <BarisHasil nada="gagal">{kalimatGagal(jejak.hasil.code, jejak.hasil.ref, locale)}</BarisHasil>;
}

/** "Tambah Bagian / Tingkat / Kelas" under its parent. The name field stays filled after a refusal. */
function FormTambah({
  locale,
  tingkatan,
  aksi,
  induk,
  tahunBawaan,
  tahunIkut,
}: {
  locale: Locale;
  tingkatan: TingkatanStruktur;
  aksi: Aksi;
  induk: { nama: "institusi" | "bagian" | "tingkat"; id: string };
  /** A Tingkat asks for its school year, starting from this one. */
  tahunBawaan?: string;
  /** A Kelas takes its Tingkat's school year; it is shown, not asked. */
  tahunIkut?: string | null;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  // Controlled, both: React resets an uncontrolled field after every form
  // action, and a refusal must not wipe what was typed.
  const [nama, setNama] = useState("");
  const [tahun, setTahun] = useState(tahunBawaan ?? "");
  const [jejak, kirim, sibuk] = useAksi(aksi, (h) => {
    if (h.ok) setNama("");
  });
  const idNama = `str-nama-${tingkatan}-${induk.id}`;
  const idTahun = `str-tahun-${induk.id}`;
  return (
    <div className={`pin-str-tambah pin-str-tambah-${tingkatan.toLowerCase()}`}>
      <form action={kirim} className="pin-str-tambah-form">
        <input type="hidden" name={induk.nama} value={induk.id} />
        <div className="pin-str-isian">
          <label htmlFor={idNama}>{s(KUNCI_JENIS[tingkatan])}</label>
          <input
            id={idNama}
            name="nama"
            className="pin-input"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder={s(KUNCI_CONTOH[tingkatan])}
            maxLength={80}
            required
            autoComplete="off"
          />
        </div>
        {tahunBawaan !== undefined && (
          <div className="pin-str-isian pin-str-isian-tahun">
            <label htmlFor={idTahun}>{s("config.struktur.tahun")}</label>
            <input
              id={idTahun}
              name="tahun_ajaran"
              className="pin-input"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              inputMode="numeric"
              required
              autoComplete="off"
            />
          </div>
        )}
        <TombolKirim className="pin-btn pin-primary" disabled={sibuk} sibuk={s("config.struktur.sibuk")}>
          {s(KUNCI_TAMBAH[tingkatan])}
        </TombolKirim>
      </form>
      {tahunIkut ? (
        <p className="pin-hint">
          {s("config.struktur.tahun_ikut")} <span className="pin-num">{tahunIkut}</span>
        </p>
      ) : null}
      <div aria-live="polite">
        <Pesan jejak={jejak} apa="dibuat" locale={locale} />
      </div>
    </div>
  );
}

/**
 * One place: its level, name, school year and students, and -- while it is
 * active -- rename and deactivate. Only one of those is open at a time.
 */
function BarisSimpul({ simpul, locale }: { simpul: SimpulStruktur; locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [mode, setMode] = useState<"lihat" | "ubah" | "tanya">("lihat");
  const [namaBaru, setNamaBaru] = useState(simpul.name);
  const [terakhir, setTerakhir] = useState<Apa>("diubah");
  const [jejakUbah, kirimUbah, sibukUbah] = useAksi(ubahNamaStrukturAksi, (h) => {
    setTerakhir("diubah");
    if (h.ok) setMode("lihat");
  });
  const [jejakNonaktif, kirimNonaktif, sibukNonaktif] = useAksi(nonaktifkanStrukturAksi, (h) => {
    setTerakhir("dinonaktifkan");
    if (h.ok) setMode("lihat");
  });
  const murid = jumlahMurid(simpul.active_members, locale);
  const jejak = terakhir === "diubah" ? jejakUbah : jejakNonaktif;

  return (
    <div className={`pin-str-baris${simpul.is_active ? "" : " pin-str-nonaktif"}`}>
      <div className="pin-str-kepala">
        <span className="pin-str-jenis">{s(KUNCI_JENIS[simpul.level])}</span>
        {mode === "ubah" ? (
          <form action={kirimUbah} className="pin-str-ubah">
            <input type="hidden" name="simpul" value={simpul.node_id} />
            <label className="pin-sr" htmlFor={`str-ubah-${simpul.node_id}`}>{s("config.struktur.nama_baru")}</label>
            <input
              id={`str-ubah-${simpul.node_id}`}
              name="nama"
              className="pin-input"
              value={namaBaru}
              onChange={(e) => setNamaBaru(e.target.value)}
              maxLength={80}
              required
              autoComplete="off"
            />
            <TombolKirim className="pin-btn pin-primary" disabled={sibukUbah} sibuk={s("config.struktur.sibuk")}>
              {s("config.struktur.simpan")}
            </TombolKirim>
            <button type="button" className="pin-btn" onClick={() => setMode("lihat")}>
              {s("config.struktur.batal")}
            </button>
          </form>
        ) : (
          <strong className="pin-str-nama">{simpul.name}</strong>
        )}
        {simpul.academic_year && <span className="pin-num pin-str-tahun">{simpul.academic_year}</span>}
        {murid && <span className="pin-str-murid">{murid}</span>}
        {!simpul.is_active && <span className="pin-str-tanda">{s("config.struktur.nonaktif")}</span>}
        {bolehDiubah(simpul) && mode === "lihat" && (
          <span className="pin-str-aksi">
            <button type="button" className="pin-btn pin-quiet" onClick={() => { setNamaBaru(simpul.name); setMode("ubah"); }}>
              {s("config.struktur.ubah_nama")}
            </button>
            <button type="button" className="pin-btn pin-quiet" onClick={() => setMode("tanya")}>
              {s("config.struktur.nonaktifkan")}
            </button>
          </span>
        )}
      </div>
      {mode === "tanya" && (
        <KonfirmasiNonaktif
          simpul={simpul}
          locale={locale}
          kirim={kirimNonaktif}
          sibuk={sibukNonaktif}
          batal={() => setMode("lihat")}
        />
      )}
      <div aria-live="polite">
        <Pesan jejak={jejak} apa={terakhir} locale={locale} />
      </div>
    </div>
  );
}

/** The question before a deactivation (D-022), and the only form that sends one. */
export function KonfirmasiNonaktif({
  simpul,
  locale,
  kirim,
  sibuk,
  batal,
}: {
  simpul: SimpulStruktur;
  locale: Locale;
  kirim: (fd: FormData) => void;
  sibuk: boolean;
  batal: () => void;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const idTanya = `str-tanya-${simpul.node_id}`;
  return (
    <form action={kirim} className="pin-str-tanya" role="group" aria-labelledby={idTanya}>
      <input type="hidden" name="simpul" value={simpul.node_id} />
      <input type="hidden" name="nama" value={simpul.name} />
      <p id={idTanya} className="pin-str-tanya-judul">
        {s("config.struktur.konfirmasi.tanya")} {s(KUNCI_JENIS[simpul.level])} <strong>{simpul.name}</strong>?
      </p>
      <p className="pin-hint">{s("config.struktur.konfirmasi.arti")}</p>
      {/* D-097(a): a deactivation states why; it is kept with the record of what was closed */}
      <div className="pin-str-isian">
        <label htmlFor={`str-alasan-${simpul.node_id}`}>{s("config.label.reason")}</label>
        <input
          id={`str-alasan-${simpul.node_id}`}
          name="alasan"
          className="pin-input"
          maxLength={300}
          required
          autoComplete="off"
        />
      </div>
      <div className="pin-str-tanya-aksi">
        <TombolKirim className="pin-btn pin-str-bahaya" disabled={sibuk} sibuk={s("config.struktur.sibuk")}>
          {s("config.struktur.konfirmasi.ya")}
        </TombolKirim>
        <button type="button" className="pin-btn" onClick={batal}>
          {s("config.struktur.batal")}
        </button>
      </div>
    </form>
  );
}
