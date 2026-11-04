"use client";

import { useState } from "react";
import BidangBerkas from "@/components/bentuk/BidangBerkas";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import {
  kunciKodePaket,
  kunciMasalahPaket,
  type HasilPaket,
  type HitunganPaket,
  type MediaPaket,
} from "@/lib/unggah-kontrak";
import { konfirmasiPaketAksi, unggahBukuKerjaAksi } from "@/app/studio/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { NAMA_BERKAS_TEMPLAT, templatPelajaran } from "./templat";
import { NAMA_UNDUHAN_CONTOH, bukuKerjaContohSaja } from "./contoh";
import { lokasiMasalah } from "./lokasi";
import BarisHasil from "@/components/BarisHasil";
import AlasanNonaktif from "@/components/AlasanNonaktif";

type Sekolah = { id: string; name: string };
/** D-085 M10: a locked course, newest of its line, that a corrected workbook may correct. */
type Koreksi = { id: string; sekolah: string; judul: string; versi: string | null };
type StatusMedia = "belum" | "siap" | "naik" | "selesai" | "gagal";
type Sibuk = null | "periksa" | "media" | "simpan";

/** How many problems are listed before the rest are only counted. */
export const MASALAH_TAMPIL = 50;

/**
 * UPLOAD A LESSON WORKBOOK (DAISY-06; D-007, D-029, D-030).
 *
 * Three steps, each named for what it does, on BOB-02's typed actions:
 *   1. "Periksa buku kerja" sends the file; the server reads it and the
 *      database checks every row. Nothing is saved: a workbook with any problem
 *      makes nothing, and the problems come back by code at their sheet and row.
 *   2. "Unggah media", only when the workbook names media: each file goes to
 *      the one signed-upload route, to the exact path the check returned, and
 *      is matched to the workbook by its file name.
 *   3. "Simpan ke Studio" confirms the batch. The course is saved as a draft;
 *      nobody learns from it until it is published.
 *
 * THE SCHOOL is chosen from the schools the page offers (sekolah.ts: active,
 * real schools the reader may draft in, never the national library, D-029),
 * starting on the first. Changing the school or the file starts again.
 *
 * THE TEMPLATE is built here, in the browser, from BOB-02's contract
 * (./templat.ts), so it cannot fall behind what the reader accepts. Beside it, W1.10 (DG-36): an example of the same
 * workbook filled with a small chapter written for the example alone (./contoh.ts), no live item and no live key.
 *
 * Every word comes from the copy table; a problem is its code's sentence and
 * never the database's text (D-011).
 *
 * D-085 M10, A CORRECTION. When the school has locked courses, step 1 asks
 * whether this workbook corrects one, and if so what changed and why. Both go
 * with the file; the database checks them with the rest of the package, and
 * the saved course is the next version of the one it corrects. Changing either
 * starts again, as changing the file does.
 */
export default function PanelUnggah({
  locale,
  sekolah,
  batasMb,
  koreksi = [],
  revisiAwal = null,
}: {
  locale: Locale;
  sekolah: Sekolah[];
  /** The workbook's size limit, in MB (BATAS_PAKET.berkasMaks). */
  batasMb: number;
  /** D-085 M10: the courses a correction may correct, in the schools offered. */
  koreksi?: Koreksi[];
  /** D-085 M10: the course a course page sent the reader here to correct (`?revisi=`). */
  revisiAwal?: string | null;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const awal = koreksi.find((k) => k.id === revisiAwal && sekolah.some((x) => x.id === k.sekolah));
  const [pilihan, setPilihan] = useState(awal?.sekolah ?? sekolah[0]?.id ?? "");
  const [revisi, setRevisi] = useState(awal?.id ?? "");
  const [ringkasan, setRingkasan] = useState("");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [periksa, setPeriksa] = useState<HasilPaket | null>(null);
  const [simpan, setSimpan] = useState<HasilPaket | null>(null);
  const [media, setMedia] = useState<Record<string, File>>({});
  const [status, setStatus] = useState<Record<string, StatusMedia>>({});
  const [sibuk, setSibuk] = useState<Sibuk>(null);

  const mulaiLagi = () => {
    setPeriksa(null); setSimpan(null); setMedia({}); setStatus({});
  };

  const koreksiSekolah = koreksi.filter((k) => k.sekolah === pilihan);
  const perluMedia: MediaPaket[] = periksa?.ok ? periksa.media : [];
  const mediaTerunggah = perluMedia.filter((m) => status[m.path] === "selesai").length;
  const mediaLengkap = perluMedia.length === mediaTerunggah;
  const tersimpan = simpan?.ok === true;
  const langkahKini = tersimpan ? 4 : !periksa?.ok ? 1 : !mediaLengkap ? 2 : 3;

  function unduhTemplat() {
    unduh(templatPelajaran(), NAMA_BERKAS_TEMPLAT);
  }

  /** W1.10 (DG-36): the example-only workbook, built here as the template is (./contoh.ts). */
  function unduhContoh() {
    unduh(bukuKerjaContohSaja(), NAMA_UNDUHAN_CONTOH);
  }

  function unduh(isi: Uint8Array, nama: string) {
    const blob = new Blob([isi as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nama;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function jalankanPeriksa() {
    if (!berkas || !pilihan) return;
    mulaiLagi();
    setSibuk("periksa");
    const fd = new FormData();
    fd.set("institusi", pilihan);
    fd.set("berkas", berkas);
    if (revisi) {
      fd.set("revisi", revisi);
      fd.set("ringkasan", ringkasan);
    }
    try {
      const h = await unggahBukuKerjaAksi(null, fd);
      setPeriksa(h);
      if (h.ok) setStatus(Object.fromEntries(h.media.map((m) => [m.path, "belum" as StatusMedia])));
    } catch {
      setPeriksa({ ok: false, code: "PACKAGE_FAILED" });
    } finally {
      setSibuk(null);
    }
  }

  function pilihMedia(files: FileList | null) {
    if (!files) return;
    const daftar = Array.from(files);
    const cocok: Record<string, File> = { ...media };
    for (const m of perluMedia) {
      const f = daftar.find((x) => x.name === m.file)
        ?? daftar.find((x) => x.name.toLowerCase() === m.file.toLowerCase())
        ?? daftar.find((x) => x.name.toLowerCase() === m.name.toLowerCase());
      if (f) cocok[m.path] = f;
    }
    setMedia(cocok);
    setStatus((st) => Object.fromEntries(perluMedia.map((m) => [
      m.path, st[m.path] === "selesai" ? "selesai" : cocok[m.path] ? "siap" : "belum",
    ])) as Record<string, StatusMedia>);
  }

  async function unggahMedia() {
    setSibuk("media");
    const klien = supabaseBrowser();
    for (const m of perluMedia) {
      const f = media[m.path];
      if (!f || status[m.path] === "selesai") continue;
      setStatus((st) => ({ ...st, [m.path]: "naik" }));
      let ok = false;
      try {
        const r = await fetch("/api/assets/upload-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: m.path }),
        });
        if (r.ok) {
          const { path, token } = (await r.json()) as { path: string; token: string };
          const { error } = await klien.storage.from("assets").uploadToSignedUrl(path, token, f, {
            contentType: f.type || undefined,
          });
          ok = !error;
        }
      } catch {
        ok = false;
      }
      setStatus((st) => ({ ...st, [m.path]: ok ? "selesai" : "gagal" }));
    }
    setSibuk(null);
  }

  async function jalankanSimpan() {
    if (!periksa?.ok) return;
    setSibuk("simpan");
    const fd = new FormData();
    fd.set("batch", periksa.batch);
    try {
      setSimpan(await konfirmasiPaketAksi(null, fd));
    } catch {
      setSimpan({ ok: false, code: "PACKAGE_FAILED" });
    } finally {
      setSibuk(null);
    }
  }

  if (sekolah.length === 0) {
    return <p className="pin-ung-catatan">{s("studio.unggah.tanpa_sekolah")}</p>;
  }

  const langkah: Array<[number, HleEvent]> = [
    [1, "studio.unggah.langkah.periksa"],
    [2, "studio.unggah.langkah.media"],
    [3, "studio.unggah.langkah.simpan"],
  ];

  return (
    <div className="pin-ung">
      <div className="pin-ung-templat">
        <button type="button" className="pin-btn" onClick={unduhTemplat}>
          {s("studio.unggah.templat")}
        </button>
        <p className="pin-hint">{s("studio.unggah.templat_arti")}</p>
      </div>
      {/* W1.10 (DG-36): beside the blank template, an example filled with made-up content only */}
      <div className="pin-ung-templat" data-contoh-saja="">
        <button type="button" className="pin-btn" onClick={unduhContoh}>
          {s("studio.unggah.contoh")}
        </button>
        <p className="pin-hint">{s("studio.unggah.contoh_arti")}</p>
      </div>

      <ol className="pin-ung-langkah" aria-label={s("studio.unggah.buku.judul")}>
        {langkah.map(([n, k]) => (
          <li
            key={n}
            className={n === langkahKini ? "pin-ung-kini" : n < langkahKini ? "pin-ung-lewat" : undefined}
            aria-current={n === langkahKini ? "step" : undefined}
          >
            <span className="pin-ung-no">{n}</span> {s(k)}
          </li>
        ))}
      </ol>

      {/* 1. The school and the workbook, checked. */}
      <div className="pin-ung-langkah-isi">
        <div className="pin-ung-isian">
          <label htmlFor="ung-sekolah">{s("studio.unggah.sekolah")}</label>
          <select
            id="ung-sekolah"
            name="institusi"
            className="pin-input"
            value={pilihan}
            onChange={(e) => { setPilihan(e.target.value); setRevisi(""); mulaiLagi(); }}
            disabled={sibuk !== null}
          >
            {sekolah.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div className="pin-ung-isian">
          {/* W3.3: Daisy's FileField (RV-5): the browser's own «Choose File» never shows */}
          <BidangBerkas
            id="ung-berkas" name="berkas" label={s("studio.unggah.berkas")} locale={locale}
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            batas={`${s("studio.unggah.berkas_batas")} ${format.number(batasMb, locale)} MB.`}
            onPilih={(fs) => { setBerkas(fs[0] ?? null); mulaiLagi(); }}
            disabled={sibuk !== null}
          />
        </div>
        {koreksiSekolah.length > 0 && (
          <div className="pin-ung-isian">
            <label htmlFor="ung-revisi">{s("studio.unggah.revisi")}</label>
            <select
              id="ung-revisi"
              name="revisi"
              className="pin-input"
              value={revisi}
              onChange={(e) => { setRevisi(e.target.value); mulaiLagi(); }}
              disabled={sibuk !== null}
            >
              <option value="">{s("studio.unggah.revisi_bukan")}</option>
              {koreksiSekolah.map((k) => <option key={k.id} value={k.id}>{k.judul}{k.versi ? ` · ${k.versi}` : ""}</option>)}
            </select>
            {revisi && <p className="pin-hint">{s("studio.unggah.revisi_arti")}</p>}
          </div>
        )}
        {revisi && (
          <div className="pin-ung-isian">
            <label htmlFor="ung-ringkasan">{s("studio.unggah.ringkasan")}</label>
            <textarea
              id="ung-ringkasan"
              name="ringkasan"
              className="pin-input"
              rows={3}
              maxLength={1000}
              value={ringkasan}
              onChange={(e) => { setRingkasan(e.target.value); mulaiLagi(); }}
              disabled={sibuk !== null}
            />
            <p className="pin-hint">{s("studio.unggah.ringkasan_arti")}</p>
          </div>
        )}
        <button
          type="button"
          className="pin-btn pin-primary"
          onClick={() => void jalankanPeriksa()}
          disabled={!berkas || sibuk !== null || tersimpan}
          aria-describedby={!berkas ? "periksa-alasan" : undefined}
        >
          {sibuk === "periksa" ? s("studio.unggah.sibuk.periksa") : s("studio.unggah.langkah.periksa")}
        </button>
        {/* E3 #4: «Periksa» before a workbook is chosen says why */}
        {!berkas ? <AlasanNonaktif id="periksa-alasan">{s("alasan.nonaktif.periksa")}</AlasanNonaktif> : null}
        <div aria-live="polite">
          {periksa && <HasilPeriksa hasil={periksa} locale={locale} />}
        </div>
      </div>

      {/* 2. The media the workbook names, when it names any. */}
      {periksa?.ok && perluMedia.length > 0 && !tersimpan && (
        <div className="pin-ung-langkah-isi">
          <p className="pin-ung-catatan">{s("studio.unggah.media_arti")}</p>
          <div className="pin-ung-isian">
            <BidangBerkas
              id="ung-media" multiple label={s("studio.unggah.media_pilih")} locale={locale}
              onPilih={(_fs, e) => pilihMedia(e.target.files)} disabled={sibuk !== null}
            />
          </div>
          <ul className="pin-ung-media">
            {perluMedia.map((m) => (
              <li key={m.path}>
                <span className="pin-num">{m.file}</span>
                <span className={`pin-ung-status pin-ung-status-${status[m.path] ?? "belum"}`}>
                  {s(`studio.unggah.media.${status[m.path] ?? "belum"}` as HleEvent)}
                </span>
              </li>
            ))}
          </ul>
          <p className="pin-hint" aria-live="polite">
            {format.number(mediaTerunggah, locale)} / {format.number(perluMedia.length, locale)} {s("studio.unggah.media_progres")}
          </p>
          <button
            type="button"
            className="pin-btn pin-primary"
            onClick={() => void unggahMedia()}
            disabled={sibuk !== null || mediaLengkap || !perluMedia.some((m) => media[m.path] && status[m.path] !== "selesai")}
          >
            {sibuk === "media" ? s("studio.unggah.sibuk.media") : s("studio.unggah.langkah.media")}
          </button>
        </div>
      )}

      {/* 3. Saved to Studio as a draft. */}
      {periksa?.ok && mediaLengkap && (
        <div className="pin-ung-langkah-isi">
          {!tersimpan && <p className="pin-ung-catatan">{s("studio.unggah.simpan_arti")}</p>}
          {!tersimpan && (
            <button type="button" className="pin-btn pin-primary" onClick={() => void jalankanSimpan()} disabled={sibuk !== null}>
              {sibuk === "simpan" ? s("studio.unggah.sibuk.simpan") : s("studio.unggah.langkah.simpan")}
            </button>
          )}
          <div aria-live="polite">
            {simpan?.ok && (
              <BarisHasil nada="ok" kelas="pin-ung-hasil">
                <p className="pin-ung-lolos">{s("studio.unggah.tersimpan")}</p>
                <Hitungan counts={simpan.counts} locale={locale} />
                <p className="pin-ung-tautan">
                  {simpan.courses?.[0] && <a className="pin-btn pin-primary" href={`/studio/paket/${simpan.courses[0]}`}>{s("studio.unggah.buka_kursus")}</a>}
                  <button type="button" className="pin-btn" onClick={() => { setBerkas(null); mulaiLagi(); }}>{s("studio.unggah.ulang")}</button>
                </p>
              </BarisHasil>
            )}
            {simpan && !simpan.ok && <HasilPeriksa hasil={simpan} locale={locale} />}
          </div>
        </div>
      )}
    </div>
  );
}

/** The counts a check or a save reports, as "Kursus 1 · Bab 2 · …". */
function Hitungan({ counts, locale }: { counts: HitunganPaket; locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const urut: Array<keyof HitunganPaket> = ["courses", "modules", "lessons", "items", "options", "media"];
  return (
    <p className="pin-ung-hitung">
      {urut.map((k, i) => (
        <span key={k}>
          {i > 0 ? " · " : ""}
          {s(`studio.unggah.hitung.${k}` as HleEvent)} <strong className="pin-num">{format.number(counts[k] ?? 0, locale)}</strong>
        </span>
      ))}
    </p>
  );
}

/** The answer to a check or a save: passed, a refusal, or the problems by row. */
function HasilPeriksa({ hasil, locale }: { hasil: HasilPaket; locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  if (hasil.ok) {
    return (
      <BarisHasil nada="ok" kelas="pin-ung-hasil">
        <p className="pin-ung-lolos">{s("studio.unggah.lolos")}</p>
        <Hitungan counts={hasil.counts} locale={locale} />
      </BarisHasil>
    );
  }
  const masalah = hasil.problems ?? [];
  return (
    <BarisHasil nada="gagal" kelas="pin-ung-hasil pin-ung-gagal">
      <p className="pin-ung-judul-masalah">
        {s(kunciKodePaket(hasil.code))}
        {hasil.ref ? ` ${s("studio.unggah.rujukan")} ${hasil.ref}` : ""}
      </p>
      {masalah.length > 0 && (
        <>
          <p className="pin-hint">{s("studio.unggah.masalah_judul")}</p>
          <ul className="pin-ung-masalah">
            {masalah.slice(0, MASALAH_TAMPIL).map((p, i) => {
              const di = lokasiMasalah(p, locale);
              return (
                <li key={i}>
                  {di && <span className="pin-ung-lokasi">{di}</span>}
                  <span>{s(kunciMasalahPaket(p.code))}</span>
                </li>
              );
            })}
          </ul>
          {masalah.length > MASALAH_TAMPIL && (
            <p className="pin-hint">+{format.number(masalah.length - MASALAH_TAMPIL, locale)} {s("studio.unggah.masalah_lain")}</p>
          )}
        </>
      )}
    </BarisHasil>
  );
}
