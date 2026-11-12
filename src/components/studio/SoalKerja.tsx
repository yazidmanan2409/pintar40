import Link from "next/link";
import Ikon from "@/components/Ikon";
import BarisHasil from "@/components/BarisHasil";
import SimpanIsian from "@/components/SimpanIsian";
import TombolKirim from "@/components/TombolKirim";
import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import FokusJudul from "@/components/studio/FokusJudul";
import { TeksBaris } from "@/components/teks/Teks";
import { format, type HleEvent, type Locale } from "@/lib/hle";
import type { SoalTinjauan } from "@/lib/soal-tinjauan";
import type { DampakKoreksi, MasalahSoal, PerubahanSoal } from "@/lib/soal-kontrak";
import { LABEL_PILIHAN, bidangMasalah, kalimatDampak, kalimatMasalah, kataPerubahan } from "@/lib/soal-layar";
import { ajukanKoreksiAksi, hapusSoalAksi, simpanSoalAksi, tambahSoalAksi } from "@/app/studio/soal-actions";

/**
 * C1w on the screens: one question of «Soal dalam paket ini» at work (Daisy, TINJAUAN-A1-C1W Q5 and Q6).
 *
 * THE EDITOR (Q5). In a draft its author may change (before submission, or after it is sent back), «Ubah soal ini»
 * turns this one article into a form in place (`?ubah={item}#soal-{item}`), focus on the form's heading, its fields in
 * the order the article reads: «Bacaan», «Pertanyaan», «Pilihan» A–E, «Kunci jawaban» (radios), «Alasan» per option,
 * «Kode miskonsepsi» per option, «Tujuan». Its problems are listed at the top, each linked to its field and said again
 * beside it. «Hapus soal» is in the form, through KonfirmasiBahaya. The save carries the revision the form was drawn
 * from, so a second author's save refuses it (DRAFT_EDIT_CONFLICT) and the page names who saved since.
 *
 * THE HISTORY (Q5, C1-R1). «Riwayat soal (n versi)», collapsed, newest first, what changed said in words, each version
 * readable as it was; no statistic, so none is compared.
 *
 * THE WRONG KEY (Q6). «Kunci jawaban keliru?» opens «Perbaiki kunci jawaban» under the question in three steps carried
 * in the address (`?kunci={item}&langkah=n`), so each works without script and the counts are read afresh: the key and
 * the reason; «Yang terdampak», the exact counts by the recalculation's own rule (pratinjau_koreksi_kunci); then «Kirim
 * untuk konfirmasi». Every act is the database's own function; nothing here decides.
 */

export type Suntingan = { item: string; revisi: number; diubah_pada: string | null; diubah_oleh: string | null; nama_pengubah: string | null };
export type Tujuan = { id: string; code: string; statement: string; lesson_id: string };
export type VersiSoal = {
  item: string; versi: number; ini: boolean; sebelumnya?: string; status_paket?: string;
  terbitan?: { versi?: string; terbit_pada?: string; status?: string };
  dibuat_pada?: string; nama_pembuat?: string; diubah_pada?: string; nama_pengubah?: string;
  perubahan?: PerubahanSoal; koreksi_kunci?: { alasan: string; pada: string } | null;
  isi?: { bacaan: string | null; pertanyaan: string; pilihan: Array<{ label: string; teks: string; kunci: boolean }> };
};
export type KoreksiTerakhir = {
  item: string; koreksi: string; status: "PENDING" | "CONFIRMED" | "DECLINED"; diajukan_pada: string;
  alasan_tolak: string | null; nama_pemutus: string | null; milik_sendiri: boolean;
};

type S = (k: HleEvent) => string;
const isi = (teks: string, v: Record<string, string>) => Object.entries(v).reduce((x, [a, b]) => x.split(`{${a}}`).join(b), teks);

// ───────────────────────────────────────────────────────────── the form (edit and add)

export function FormSoal({
  s, course, pelajaran, judul, soal, lesson, suntingan, tujuan, objektifKini, masalah, basi, pemilik, ditolak, bolehHapus, adaKegunaan,
}: {
  s: S; course: string; pelajaran: number; judul: string;
  /** the question edited; null for «Tambah soal» */
  soal: SoalTinjauan | null;
  lesson: string;
  suntingan: Suntingan | null;
  tujuan: readonly Tujuan[];
  objektifKini: readonly string[];
  masalah: readonly MasalahSoal[];
  /** the stale save: who saved this question since the form was opened */
  basi: string | null;
  pemilik: string; ditolak: boolean; bolehHapus: boolean;
  /** «Tambah soal» only: the package's tests a new question may join */
  adaKegunaan: readonly ("PRE_TEST" | "POST_TEST")[];
}) {
  const kunci = soal ? soal.id : `baru-${lesson}`;
  const formId = `soal-form-${kunci}`;
  const fid = (b: string) => `f-${kunci}-${b}`;
  const judulId = `soal-form-judul-${kunci}`;
  const galatDi = new Map<string, string[]>();
  for (const m of masalah) {
    const b = bidangMasalah(m);
    galatDi.set(b, [...(galatDi.get(b) ?? []), kalimatMasalah(m, s)]);
  }
  const galat = (b: string) => galatDi.get(b) ?? [];
  const sifat = (b: string, petunjuk?: string) => ({
    id: fid(b),
    "aria-invalid": galat(b).length > 0 ? true : undefined,
    "aria-describedby": [petunjuk, galat(b).length > 0 ? `${fid(b)}-galat` : null].filter(Boolean).join(" ") || undefined,
  });
  const pesanBidang = (b: string) => galat(b).length > 0 ? (
    <p className="pin-galat-bidang" id={`${fid(b)}-galat`}><Ikon nama="circle-alert" />{galat(b).join(" ")}</p>
  ) : null;
  const opsi = (x: string) => soal?.opsi.find((o) => o.label === x);
  const kunciKini = soal?.opsi.find((o) => o.kunci)?.label ?? "";
  const pilihTujuan = tujuan.filter((t) => t.lesson_id === lesson);
  const satuTujuan = objektifKini.length === 1 ? objektifKini[0] : "";
  const batal = `/studio/paket/${encodeURIComponent(course)}?pelajaran=${pelajaran}#${soal ? `soal-${soal.id}` : `tambah-${lesson}`}`;

  return (
    <div className="pin-panel pin-soal-form" data-soal-form={kunci}>
      <FokusJudul id={masalah.length > 0 || basi ? `${judulId}-ringkasan` : judulId} />
      <h4 id={judulId} tabIndex={-1} className="pin-studio-h3">{judul}</h4>
      {basi ? (
        <div id={`${judulId}-ringkasan`} tabIndex={-1} data-soal-basi="">
          <BarisHasil nada="gagal" kelas="pin-banner pin-blocked">
            <Ikon nama="circle-alert" />
            <p>{isi(s("studio.soal.basi"), { nama: basi })} <Link className="pin-studio-tautan" href={batal}>{s("studio.soal.basi.muat")}</Link></p>
          </BarisHasil>
        </div>
      ) : masalah.length > 0 ? (
        <div id={`${judulId}-ringkasan`} tabIndex={-1} data-soal-ringkasan-galat="">
          <BarisHasil nada="gagal" kelas="pin-banner pin-blocked">
          <Ikon nama="circle-alert" />
          <div>
            <p><strong>{s("studio.soal.ringkasan_galat")}</strong></p>
            <ul className="pin-daftar-titik">
              {masalah.map((m, i) => (
                <li key={`${m.code}-${m.label ?? ""}-${i}`}><a className="pin-studio-tautan" href={`#${fid(bidangMasalah(m))}`}>{kalimatMasalah(m, s)}</a></li>
              ))}
            </ul>
          </div>
          </BarisHasil>
        </div>
      ) : null}
      <form id={formId} action={soal ? simpanSoalAksi : tambahSoalAksi} className="pin-formulir" noValidate>
        <input type="hidden" name="course" value={course} />
        <input type="hidden" name="pelajaran" value={String(pelajaran)} />
        {soal ? <>
          <input type="hidden" name="item" value={soal.id} />
          <input type="hidden" name="revisi" value={String(suntingan?.revisi ?? 1)} />
        </> : <input type="hidden" name="lesson" value={lesson} />}

        <div className="pin-bidang">
          <label htmlFor={fid("bacaan")} className="pin-bidang-label">{s("studio.soal.f.bacaan")} <span className="pin-opsional">({s("studio.soal.f.bacaan.arti")})</span></label>
          <textarea className="pin-input pin-alasan-isian" name="bacaan" rows={3} defaultValue={soal?.stimulus ?? ""} {...sifat("bacaan")} />
          {pesanBidang("bacaan")}
        </div>
        <div className="pin-bidang">
          <label htmlFor={fid("pertanyaan")} className="pin-bidang-label">{s("studio.soal.f.pertanyaan")}</label>
          <textarea className="pin-input pin-alasan-isian" name="pertanyaan" rows={3} defaultValue={soal?.pertanyaan ?? ""} {...sifat("pertanyaan")} />
          {pesanBidang("pertanyaan")}
        </div>

        <fieldset className="pin-fieldset">
          <legend>{s("studio.soal.f.pilihan")}</legend>
          <p className="pin-hint" id={fid("pilihan-arti")}>{s("studio.soal.f.pilihan.arti")}</p>
          {LABEL_PILIHAN.map((x) => (
            <div key={x} className="pin-bidang">
              <label htmlFor={fid(`pilihan_${x}`)} className="pin-bidang-label">{isi(s("studio.soal.f.pilihan_x"), { x })}</label>
              <textarea className="pin-input" name={`pilihan_${x}`} rows={2} defaultValue={opsi(x)?.isi ?? ""} {...sifat(`pilihan_${x}`)} />
              {pesanBidang(`pilihan_${x}`)}
            </div>
          ))}
        </fieldset>

        <fieldset className="pin-fieldset" id={fid("kunci")} aria-describedby={galat("kunci").length > 0 ? `${fid("kunci")}-galat` : undefined}>
          <legend>{s("studio.soal.f.kunci")}</legend>
          {LABEL_PILIHAN.map((x) => (
            <label key={x} className="pin-pilihan">
              <input type="radio" name="kunci" value={x} defaultChecked={x === kunciKini} />
              <span>{isi(s("studio.soal.f.pilihan_x"), { x })}</span>
            </label>
          ))}
          {pesanBidang("kunci")}
        </fieldset>

        <fieldset className="pin-fieldset">
          <legend>{s("studio.soal.alasan")}</legend>
          {LABEL_PILIHAN.map((x) => (
            <div key={x} className="pin-bidang">
              <label htmlFor={fid(`alasan_${x}`)} className="pin-bidang-label">{isi(s("studio.soal.f.alasan_x"), { x })}</label>
              <textarea className="pin-input" name={`alasan_${x}`} rows={2} defaultValue={opsi(x)?.alasan ?? ""} {...sifat(`alasan_${x}`)} />
              {pesanBidang(`alasan_${x}`)}
            </div>
          ))}
        </fieldset>

        <fieldset className="pin-fieldset">
          <legend>{s("studio.soal.miskonsepsi")}</legend>
          <p className="pin-hint" id={fid("miskonsepsi-arti")}>{s("studio.soal.f.miskonsepsi.arti")}</p>
          {LABEL_PILIHAN.map((x) => (
            <div key={x} className="pin-bidang">
              <label htmlFor={fid(`miskonsepsi_${x}`)} className="pin-bidang-label">{isi(s("studio.soal.f.miskonsepsi_x"), { x })}</label>
              <input className="pin-input" name={`miskonsepsi_${x}`} defaultValue={opsi(x)?.miskonsepsi?.kode ?? ""} {...sifat(`miskonsepsi_${x}`, fid("miskonsepsi-arti"))} />
              {pesanBidang(`miskonsepsi_${x}`)}
            </div>
          ))}
        </fieldset>

        <div className="pin-bidang">
          <label htmlFor={fid("tujuan")} className="pin-bidang-label">{s("studio.soal.f.tujuan")}</label>
          <select className="pin-input" name="tujuan" defaultValue={satuTujuan} {...sifat("tujuan")}>
            {/* a question with several objectives (or a new one, which takes its lesson's) keeps them unless one is chosen */}
            <option value="">{s("studio.soal.f.tujuan.tetap")}</option>
            {pilihTujuan.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.statement}</option>)}
          </select>
          {pesanBidang("tujuan")}
        </div>

        {!soal ? (
          <div className="pin-bidang">
            <label htmlFor={fid("kegunaan")} className="pin-bidang-label">{s("studio.soal.f.kegunaan")}</label>
            <select className="pin-input" name="kegunaan" id={fid("kegunaan")} defaultValue="">
              <option value="">{s("studio.soal.f.kegunaan.latihan")}</option>
              {adaKegunaan.map((g) => <option key={g} value={g}>{s(`mode.${g}` as HleEvent)}</option>)}
            </select>
          </div>
        ) : null}

        <div className="pin-actions">
          <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyimpan")}>{s("studio.soal.simpan")}</TombolKirim>
          <Link className="pin-btn pin-quiet" href={batal}>{s("studio.soal.batal")}</Link>
        </div>
      </form>
      <SimpanIsian form={formId} ditolak={ditolak} pemilik={pemilik} />
      {soal && bolehHapus ? (
        <form action={hapusSoalAksi} className="pin-actions" data-soal-hapus={soal.id}>
          <input type="hidden" name="course" value={course} />
          <input type="hidden" name="pelajaran" value={String(pelajaran)} />
          <input type="hidden" name="item" value={soal.id} />
          <input type="hidden" name="revisi" value={String(suntingan?.revisi ?? 1)} />
          <KonfirmasiBahaya id={`hapus-${soal.id}`} tombol={s("studio.soal.hapus")} tanya={s("studio.soal.hapus.tanya")}
            ya={s("studio.soal.hapus.ya")} batal={s("studio.soal.batal")} sibuk={s("tombol.memproses")} />
        </form>
      ) : null}
    </div>
  );
}

// ───────────────────────────────────────────────────────────── the history

export function RiwayatSoal({ s, versi, day }: {
  s: S; versi: readonly VersiSoal[] | null; day: (iso: string | null | undefined) => string;
}) {
  if (versi === null) return <p className="pin-ket" data-riwayat-soal-gagal="">{s("studio.soal.riwayat.gagal")}</p>;
  if (versi.length === 0) return null;
  const pertama = versi[versi.length - 1];
  return (
    <details className="pin-disclosure pin-riwayat-soal" data-riwayat-soal={versi.length}>
      <summary>{isi(s("studio.soal.riwayat"), { n: String(versi.length) })}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
      <ol className="pin-daftar">
        {versi.map((v) => {
          const kata = kataPerubahan(v.perubahan, s);
          const asli = v.versi === 1;
          // a question first written in this version of the package (its line began here, after the package's first)
          const baru = asli && pertama.status_paket !== undefined && versi.length === 1 && v.terbitan?.versi && !/^v?1\.0$/.test(v.terbitan.versi);
          return (
            <li key={v.item} className="pin-riwayat" data-versi-soal={v.versi}>
              <p className="pin-ket">
                <strong>{isi(s("studio.soal.riwayat.versi"), { n: String(v.versi) })}{v.ini ? ` · ${s("studio.soal.riwayat.ini")}` : ""}{asli ? ` · ${s(baru ? "studio.soal.riwayat.baru" : "studio.soal.riwayat.asli")}` : ""}</strong>
                {" · "}
                {asli
                  ? isi(s("studio.soal.riwayat.diunggah"), { nama: v.nama_pembuat ?? "—", tanggal: day(v.dibuat_pada) })
                  : isi(s("studio.soal.riwayat.diperbaiki"), { nama: v.nama_pengubah ?? v.nama_pembuat ?? "—", tanggal: day(v.diubah_pada ?? v.dibuat_pada) })}
                {" · "}
                {v.terbitan?.terbit_pada ? isi(s("studio.soal.riwayat.terbit"), { tanggal: day(v.terbitan.terbit_pada) }) : s("studio.soal.riwayat.belum_terbit")}
                {!asli ? <> · <em>{kata.length > 0 ? kata.join(" · ") : s("studio.soal.riwayat.tetap")}</em></> : null}
              </p>
              {v.isi ? (
                <details className="pin-disclosure" data-lihat-versi={v.versi}>
                  <summary>{s("studio.soal.riwayat.lihat")}<span className="pin-sr"> · {isi(s("studio.soal.riwayat.versi"), { n: String(v.versi) })}</span><Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
                  {v.isi.bacaan ? <p className="pin-ket"><TeksBaris teks={v.isi.bacaan} /></p> : null}
                  <p><TeksBaris teks={v.isi.pertanyaan} /></p>
                  <ol className="pin-daftar-rapat" aria-label={isi(s("studio.soal.riwayat.versi"), { n: String(v.versi) })}>
                    {v.isi.pilihan.map((o) => (
                      <li key={o.label} className="pin-ket">
                        {o.label}. <TeksBaris teks={o.teks} />
                        {o.kunci ? <> <strong className="pin-pill pin-ok pin-pill-ikon pin-studio-kunci"><Ikon nama="check" />{s("studio.soal.kunci")}</strong></> : null}
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

// ───────────────────────────────────────────────────────────── the wrong key

export function PerbaikiKunci({
  s, locale, course, pelajaran, soal, langkah, baru, alasan, dampak, galat,
}: {
  s: S; locale: Locale; course: string; pelajaran: number; soal: SoalTinjauan;
  langkah: 1 | 2 | 3; baru: string; alasan: string;
  /** step 2 and 3's counts (pratinjau_koreksi_kunci), or the refusal's sentence */
  dampak: (Omit<DampakKoreksi, "koreksi" | "status" | "alasan" | "boleh_tegaskan" | "milik_sendiri">) | null;
  galat: string | null;
}) {
  const judulId = `kunci-judul-${soal.id}`;
  const dasar = `/studio/paket/${encodeURIComponent(course)}`;
  const ke = (n: number) => `${dasar}?${new URLSearchParams({ pelajaran: String(pelajaran), kunci: soal.id, langkah: String(n), baru, alasan }).toString()}#kunci-${soal.id}`;
  const kini = soal.opsi.find((o) => o.kunci)?.label ?? "";
  const angka = (n: number) => format.number(n, locale);
  const daftarLangkah = (
    <ol className="pin-langkah-daftar pin-ket" aria-label={s("studio.kunci.judul")}>
      {(["studio.kunci.l1", "studio.kunci.l2", "studio.kunci.l3"] as const).map((k, i) => (
        <li key={k} aria-current={i + 1 === langkah ? "step" : undefined}>{i + 1}. {s(k)}</li>
      ))}
    </ol>
  );
  return (
    <section className="pin-panel pin-perbaiki-kunci" id={`kunci-${soal.id}`} aria-labelledby={judulId} data-perbaiki-kunci={langkah}>
      {/* keyed by the step: each step's arrival puts the keyboard on its heading again */}
      <FokusJudul key={langkah} id={judulId} />
      <h4 id={judulId} tabIndex={-1} className="pin-studio-h3">{s("studio.kunci.judul")} · {isi(s("studio.kunci.langkah"), { i: String(langkah) })}</h4>
      {daftarLangkah}
      {galat ? <p className="pin-galat-bidang" data-kunci-galat=""><Ikon nama="circle-alert" />{galat}</p> : null}
      {langkah === 1 || galat ? (
        <form method="get" className="pin-formulir">
          <input type="hidden" name="pelajaran" value={String(pelajaran)} />
          <input type="hidden" name="kunci" value={soal.id} />
          <input type="hidden" name="langkah" value="2" />
          <fieldset className="pin-fieldset">
            <legend>{s("studio.kunci.l1")}</legend>
            {soal.opsi.map((o) => (
              <label key={o.label} className="pin-pilihan">
                <input type="radio" name="baru" value={o.label} required disabled={o.label === kini} defaultChecked={o.label === baru && o.label !== kini} />
                <span>{o.label}. <TeksBaris teks={o.isi} />{o.label === kini ? <> <strong className="pin-pill pin-neutral">{s("studio.kunci.sekarang")}</strong></> : null}</span>
              </label>
            ))}
          </fieldset>
          <div className="pin-bidang">
            <label htmlFor={`kunci-alasan-${soal.id}`} className="pin-bidang-label">{s("studio.kunci.alasan")}</label>
            <p className="pin-hint" id={`kunci-alasan-arti-${soal.id}`}>{s("studio.kunci.alasan.arti")}</p>
            <textarea id={`kunci-alasan-${soal.id}`} name="alasan" className="pin-input pin-alasan-isian" required minLength={10} maxLength={300}
              defaultValue={alasan} aria-describedby={`kunci-alasan-arti-${soal.id}`} />
          </div>
          <div className="pin-actions">
            <button type="submit" className="pin-btn pin-primary">{s("studio.kunci.lanjut")}</button>
            <Link className="pin-btn pin-quiet" href={`${dasar}?pelajaran=${pelajaran}#soal-${soal.id}`}>{s("studio.soal.batal")}</Link>
          </div>
        </form>
      ) : dampak ? (
        <>
          <dl className="pin-facts">
            <div><dt>{s("studio.kunci.kunci_lama")}</dt><dd>{dampak.kunci_lama.join(", ")}</dd></div>
            <div><dt>{s("studio.kunci.kunci_baru")}</dt><dd>{dampak.kunci_baru.join(", ")}</dd></div>
            <div><dt>{s("studio.kunci.alasan")}</dt><dd>{alasan}</dd></div>
          </dl>
          <div data-kunci-dampak="" data-sesi={dampak.sesi_selesai}>
            <p className="pin-studio-h3">{s("studio.kunci.l2")}</p>
            {kalimatDampak(dampak, s, angka).map((k) => <p key={k}>{k}</p>)}
            {dampak.sesi_terbuka > 0 ? <p className="pin-ket">{isi(s("studio.kunci.dampak.terbuka"), { n: angka(dampak.sesi_terbuka) })}</p> : null}
            {dampak.konten_platform ? <p className="pin-ket">{s("studio.kunci.dampak.platform")}</p> : null}
            {langkah === 2 && dampak.daftar && dampak.daftar.length > 0 ? <DaftarDampak s={s} locale={locale} daftar={dampak.daftar} /> : null}
          </div>
          {langkah === 2 ? (
            <div className="pin-actions">
              <Link className="pin-btn pin-primary" href={ke(3)}>{s("studio.kunci.lanjut")}</Link>
              <Link className="pin-btn pin-quiet" href={ke(1)}>{s("studio.kunci.kembali")}</Link>
            </div>
          ) : (
            <form action={ajukanKoreksiAksi} className="pin-actions" data-kunci-kirim="">
              <input type="hidden" name="course" value={course} />
              <input type="hidden" name="pelajaran" value={String(pelajaran)} />
              <input type="hidden" name="item" value={soal.id} />
              <input type="hidden" name="kunci" value={baru} />
              <input type="hidden" name="alasan" value={alasan} />
              <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memproses")}>{s("studio.kunci.kirim")}</TombolKirim>
              <Link className="pin-btn pin-quiet" href={ke(2)}>{s("studio.kunci.kembali")}</Link>
            </form>
          )}
        </>
      ) : null}
    </section>
  );
}

/** Step 2's list, for school content only (platform content arrives with counts only): by class, names as granted. */
export function DaftarDampak({ s, locale, daftar }: { s: S; locale: Locale; daftar: NonNullable<DampakKoreksi["daftar"]> }) {
  const pct = (n: number | null) => (n === null ? "—" : format.percent(n, locale));
  const lulus = (b: boolean | null) => (b === null ? "—" : s(b ? "studio.kunci.dampak.tercapai" : "studio.kunci.dampak.belum"));
  const urut = [...daftar].sort((a, b) => (a.nama_tempat ?? "").localeCompare(b.nama_tempat ?? "") || (a.nama ?? "").localeCompare(b.nama ?? ""));
  return (
    <div className="pin-tabel-bingkai" role="region" tabIndex={0} aria-label={s("studio.kunci.l2")}>
      <table className="pin-tabel" data-kunci-daftar={daftar.length}>
        <thead><tr>
          <th scope="col">{s("studio.kunci.dampak.kolom.kelas")}</th>
          <th scope="col">{s("studio.kunci.dampak.kolom.murid")}</th>
          <th scope="col">{s("studio.kunci.dampak.kolom.hasil")}</th>
          <th scope="col">{s("studio.kunci.dampak.kolom.target")}</th>
          <th scope="col">{s("studio.kunci.dampak.kolom.sertifikat")}</th>
        </tr></thead>
        <tbody>
          {urut.map((r) => (
            <tr key={r.sesi}>
              <td>{r.nama_tempat ?? "—"}</td>
              <td>{r.nama ?? "—"}</td>
              <td className="pin-num">{r.berubah ? `${pct(r.sebelum)} → ${pct(r.sesudah)}` : `${pct(r.sebelum)} · ${s("studio.kunci.dampak.tetap")}`}</td>
              <td>{r.lulus_sebelum === r.lulus_sesudah ? lulus(r.lulus_sesudah) : `${lulus(r.lulus_sebelum)} → ${lulus(r.lulus_sesudah)}`}</td>
              <td>{r.sertifikat_tidak_diterbitkan ? s("studio.kunci.dampak.tidak_diterbitkan")
                : r.sertifikat_ditinjau ? s("studio.kunci.dampak.ditinjau") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The question's waiting, declined or done line under its article (Daisy Q6), for the owner and the confirmers. */
export function BarisKoreksi({ s, k, when }: { s: S; k: KoreksiTerakhir; when: (iso: string | null) => string }) {
  if (k.status === "PENDING") {
    return (
      <p className="pin-meta" data-kunci-menunggu={k.koreksi}>
        {isi(s("studio.kunci.menunggu"), { waktu: when(k.diajukan_pada) })}
        {k.milik_sendiri ? <> · {s("studio.kunci.orang_kedua")}</> : <> · <Link className="pin-studio-tautan" href={`/studio/tinjau/kunci/${k.koreksi}`}>{s("studio.kunci.halaman")}</Link></>}
      </p>
    );
  }
  if (k.status === "DECLINED" && k.milik_sendiri) {
    return <p className="pin-meta" data-kunci-ditolak={k.koreksi}>{isi(s("studio.kunci.ditolak"), { nama: k.nama_pemutus ?? "—", alasan: k.alasan_tolak ?? "—" })}</p>;
  }
  return null;
}
