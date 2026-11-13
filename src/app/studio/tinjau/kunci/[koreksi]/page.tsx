import Link from "next/link";
import Ikon from "@/components/Ikon";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import BarisHasil from "@/components/BarisHasil";
import TombolKirim from "@/components/TombolKirim";
import SimpanIsian from "@/components/SimpanIsian";
import { currentViewer } from "@/lib/auth";
import KonfirmasiDialog from "@/components/studio/KonfirmasiDialog";
import { DaftarDampak, PenjelasanHilang } from "@/components/studio/SoalKerja";
import { TeksBaris } from "@/components/teks/Teks";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import { format, t, type HleEvent } from "@/lib/hle";
import { judulHalaman } from "@/lib/judul-halaman";
import { kalimatDampak, kalimatKodeC1 } from "@/lib/soal-layar";
import type { DampakKoreksi } from "@/lib/soal-kontrak";
import { tegaskanKoreksiAksi, tolakKoreksiAksi } from "../../../soal-actions";
import { when } from "../../../_lib";

export const generateMetadata = judulHalaman("/studio/tinjau/kunci/[koreksi]");
export const dynamic = "force-dynamic";

type Dampak = DampakKoreksi & {
  paket: string | null; course: string | null; nama_pengaju: string | null; diajukan_pada: string;
  diputuskan_pada: string | null; alasan_tolak: string | null; nama_pemutus: string | null;
  soal: { bacaan: string | null; pertanyaan: string; pilihan: Array<{ label: string; teks: string }> } | null;
};

/**
 * C1w (Daisy Q6): THE SECOND PERSON'S PAGE, from «Antrean Tinjauan» › «Perbaikan kunci menunggu konfirmasi».
 *
 * The question as students saw it, the old and the new key side by side, the reason, who proposed it and when, and
 * step 2's counts (koreksi_kunci_dampak: the recalculation's own rule while it waits, what the confirmation recorded
 * after). «Konfirmasi perbaikan» goes through THE ONE DIALOG («Hasil {n} sesi dihitung ulang. Hasil asli tetap
 * tersimpan.»); «Tolak» needs a reason and returns the proposal to its proposer. The proposer opening it sees Daisy's
 * sentence and no button. The database decides every one of these (tegaskan_koreksi_kunci, tolak_koreksi_kunci).
 */
export default async function KoreksiKunci({ params, searchParams }: {
  params: Promise<{ koreksi: string }>; searchParams: Promise<{ hasil?: string; kode?: string; ref?: string }>;
}) {
  const { koreksi } = await params;
  const sp = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const supabase = await supabaseServer();
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(koreksi);
  const { data, error } = ok ? await supabase.rpc("koreksi_kunci_dampak", { p_correction: koreksi }) : { data: null, error: { code: "PR190" } };
  if (error || !data) {
    return <HalamanPenolakan locale={locale} persona="staff" backHref="/studio/tinjau" backKey="studio.kunci.kembali_antrean" />;
  }
  const d = data as Dampak;
  const pemilik = (await currentViewer())?.personId ?? "";
  const angka = (n: number) => format.number(n, locale);
  const kalimat = sp.hasil === "ok" || sp.hasil === "gagal"
    ? (sp.kode === "DITEGASKAN" ? null : sp.kode === "DITOLAK" ? s("studio.kunci.tolak.ok") : kalimatKodeC1(sp.kode, s))
    : null;

  return (
    <div className="pin-studio-halaman">
      <header className="pin-head">
        <p><Link className="pin-back" href="/studio/tinjau"><Ikon nama="chevron-left" />{s("studio.kunci.kembali_antrean")}</Link></p>
        <h1 className="pin-h1">{s("studio.kunci.halaman")}</h1>
        {d.paket ? <p className="pin-intro">{d.paket}</p> : null}
      </header>

      <section className="pin-panel" aria-labelledby="pin-kunci-soal">
        <h2 id="pin-kunci-soal" className="pin-studio-h3">{s("studio.soal.f.pertanyaan")}</h2>
        {d.soal?.bacaan ? <div className="pin-soal-bacaan"><p className="pin-soal-bacaan-label">{s("studio.soal.bacaan")}</p><p><TeksBaris teks={d.soal.bacaan} /></p></div> : null}
        {d.soal ? <p><TeksBaris teks={d.soal.pertanyaan} /></p> : null}
        <ol className="pin-daftar-rapat">
          {(d.soal?.pilihan ?? []).map((o) => (
            <li key={o.label} className="pin-ket">{o.label}. <TeksBaris teks={o.teks} /></li>
          ))}
        </ol>
        <dl className="pin-facts pin-kunci-banding">
          <div><dt>{s("studio.kunci.kunci_lama")}</dt><dd data-kunci-lama="">{d.kunci_lama.join(", ")}</dd></div>
          <div><dt>{s("studio.kunci.kunci_baru")}</dt><dd data-kunci-baru="">{d.kunci_baru.join(", ")}</dd></div>
          <div><dt>{s("studio.kunci.alasan")}</dt><dd>{d.alasan}</dd></div>
          <div><dt>{s("studio.kunci.pengaju")}</dt><dd>{d.nama_pengaju ?? "—"} · {when(d.diajukan_pada, locale)}</dd></div>
        </dl>
      </section>

      <section className="pin-panel" aria-labelledby="pin-kunci-dampak" data-kunci-dampak="" data-sesi={d.sesi_selesai}>
        <h2 id="pin-kunci-dampak" className="pin-studio-h3">{s("studio.kunci.l2")}</h2>
        {kalimatDampak(d, s, angka).map((k) => <p key={k}>{k}</p>)}
        {d.konten_platform ? <p className="pin-ket">{s("studio.kunci.dampak.platform")}</p> : null}
        {d.penjelasan_hilang && d.penjelasan_hilang.length > 0 ? <PenjelasanHilang s={s} daftar={d.penjelasan_hilang} /> : null}
        {d.daftar && d.daftar.length > 0 ? <DaftarDampak s={s} locale={locale} daftar={d.daftar} /> : null}
      </section>

      <section className="pin-panel" id="hasil" aria-labelledby="pin-kunci-putusan" data-koreksi-status={d.status}>
        <h2 id="pin-kunci-putusan" className="pin-studio-h3">{s("studio.kunci.konfirmasi")}</h2>
        {kalimat ? <BarisHasil nada={sp.hasil === "ok" ? "ok" : "gagal"}>{kalimat}{sp.ref && /^[A-Z0-9]{6}$/.test(sp.ref) ? ` ${s("galat.rujukan")}: ${sp.ref}.` : ""}</BarisHasil> : null}
        {d.status === "CONFIRMED" ? (
          <p data-kunci-selesai="">{s("studio.kunci.selesai").replace("{n}", angka(d.sesi_selesai)).replace("{waktu}", when(d.diputuskan_pada, locale))}</p>
        ) : d.status === "DECLINED" ? (
          <p data-kunci-ditolak="">{s("studio.kunci.ditolak").replace("{nama}", d.nama_pemutus ?? "—").replace("{alasan}", d.alasan_tolak ?? "—")}</p>
        ) : d.milik_sendiri ? (
          // the existing pattern of studio.temuan.orang_kedua: the proposer reads why, and is offered nothing
          <p className="pin-meta" data-kunci-orang-kedua="">{s("studio.kunci.orang_kedua")}</p>
        ) : d.boleh_tegaskan ? (
          <>
            <p className="pin-meta">{s("studio.kunci.menunggu").replace("{waktu}", when(d.diajukan_pada, locale))}</p>
            <form action={tegaskanKoreksiAksi} className="pin-actions" data-kunci-tegaskan="">
              <input type="hidden" name="koreksi" value={d.koreksi} />
              <input type="hidden" name="course" value={d.course ?? ""} />
              <KonfirmasiDialog id="kunci-konfirmasi" tombol={s("studio.kunci.konfirmasi")} judul={s("studio.kunci.konfirmasi")}
                isi={s("studio.kunci.konfirmasi.tanya").replace("{n}", angka(d.sesi_selesai))}
                ya={<TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memproses")}>{s("studio.kunci.konfirmasi.ya")}</TombolKirim>}
                batal={s("studio.soal.batal")} />
            </form>
            <form action={tolakKoreksiAksi} className="pin-formulir" id="kunci-tolak" data-kunci-tolak="">
              <input type="hidden" name="koreksi" value={d.koreksi} />
              <input type="hidden" name="course" value={d.course ?? ""} />
              <div className="pin-bidang">
                <label htmlFor="kunci-tolak-alasan" className="pin-bidang-label">{s("studio.kunci.tolak.alasan")}</label>
                <p className="pin-hint" id="kunci-tolak-arti">{s("studio.kunci.tolak.arti")}</p>
                <textarea id="kunci-tolak-alasan" name="alasan" className="pin-input pin-alasan-isian" required minLength={10} maxLength={300} aria-describedby="kunci-tolak-arti" />
              </div>
              <TombolKirim className="pin-btn pin-btn-awal" sibuk={s("tombol.memproses")}>{s("studio.kunci.tolak")}</TombolKirim>
            </form>
            {/* CR-84 (3): a refused decline keeps its reason */}
            <SimpanIsian form="kunci-tolak" ditolak={sp.hasil === "gagal"} pemilik={pemilik} />
          </>
        ) : (
          <p className="pin-meta">{s("studio.koreksi.galat.correction_confirm_not_allowed")}</p>
        )}
      </section>
    </div>
  );
}
