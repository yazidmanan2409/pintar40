import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { tanggal } from "@/lib/tanggal";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import TombolKirim from "@/components/TombolKirim";
import { antreanKesempatan } from "@/lib/pengerjaan";
import { kodePengerjaanDari, kunciKodePengerjaan, type TempatAntrean } from "@/lib/pengerjaan-kontrak";
import { isi } from "@/lib/pengerjaan-tampil";
import { putuskanKesempatanAksi } from "@/app/konfigurasi/kesempatan/actions";

/**
 * A1 (O41-16) «Permintaan kesempatan tambahan»: THE APPROVER'S QUEUE (Daisy, TINJAUAN-A1-C1W §A1·N1). One list, drawn
 * in two places: on its own page for a school admin (from «Yang menunggu» on Konfigurasi), and on a head of
 * department's own home, under the same line (`/pimpinan?kesempatan=buka#kesempatan`). The rows are the database's (percobaan_antrean: the waiting requests over places the reader may
 * decide), newest first.
 *
 * WHAT A DECISION NEEDS, AND NOTHING THAT RANKS A CHILD: who, which class and instrument, how many attempts are used,
 * who asked, when and why. The last result and its target are shown only to a reader the database lets see that
 * learner's results (a head of department; a school admin decides without them).
 *
 * THE REQUESTER DOES NOT DECIDE THEIR OWN REQUEST. Their row carries no button and says so; the database refuses it
 * whatever is sent. «Tolak» needs a reason, which the requesting teacher reads and the student never does.
 */
export default async function DaftarAntrean({ tempat, sekolah, locale, hasil, kode: kodeMentah, untuk, judulTerlihat = false }: {
  tempat: TempatAntrean;
  /** the school the reader's working context names */
  sekolah: string;
  locale: Locale;
  hasil?: string;
  kode?: string;
  untuk?: string;
  /** on a page that has its own heading the list's is for screen readers only; on a home it is drawn */
  judulTerlihat?: boolean;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [baris, zona] = await Promise.all([antreanKesempatan(sekolah), supabaseServer().then((c) => zonaSekolah(c, sekolah))]);
  const urut = [...baris].sort((a, b) => b.diminta_pada.localeCompare(a.diminta_pada));
  const kode = kodePengerjaanDari(kodeMentah);
  const persen = (x: number) => format.percent(x, locale);

  return (
    <>
    {hasil === "setuju" || hasil === "tolak" ? (
      <BarisHasil nada="ok" id="pin-kesempatan-hasil">{s(hasil === "setuju" ? "kesempatan.ok_setuju" : "kesempatan.ok_tolak")}</BarisHasil>
    ) : null}
    {/* a refusal whose request is no longer listed (decided meanwhile) is still said */}
    {kode && !urut.some((r) => r.id === untuk) ? <BarisHasil nada="gagal">{s(kunciKodePengerjaan(kode))}</BarisHasil> : null}

    <section id="kesempatan" className="pin-sec" aria-labelledby="pin-kesempatan-daftar" data-kesempatan={urut.length} tabIndex={-1}>
      <h2 id="pin-kesempatan-daftar" className={judulTerlihat ? undefined : "pin-sr"}>{s("kesempatan.judul")}</h2>
      {judulTerlihat ? <p className="pin-sub">{s("kesempatan.arti")}</p> : null}
      {urut.length === 0 ? (
        <Kosong jenis="belum" kalimat={s("kesempatan.kosong")} />
      ) : (
        <ul className="pin-antrean">
          {urut.map((r) => {
            const instrumen = r.mode === "PRE_TEST" || r.mode === "POST_TEST" ? s(`jenis.mode.${r.mode}` as HleEvent) : r.judul;
            const dipakai = isi(s("kesempatan.baris.dipakai"), { n: format.number(r.percobaan_terpakai, locale) });
            const hasil = r.hasil_terakhir === null ? ""
              : r.target === null ? isi(s("kesempatan.baris.hasil_saja"), { hasil: persen(Number(r.hasil_terakhir)) })
              : isi(s("kesempatan.baris.hasil"), { hasil: persen(Number(r.hasil_terakhir)), target: persen(Number(r.target)) });
            return (
              <li key={r.id} id={`k-${r.id}`} data-permintaan={r.id} data-milik-sendiri={r.milik_sendiri ? "ya" : "tidak"}>
                <span className="pin-title">{[r.nama, r.kelas, [instrumen, r.kursus].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</span>
                <span className="pin-meta">{[dipakai, hasil].filter(Boolean).join(" · ")}</span>
                <span className="pin-meta">
                  {isi(s("kesempatan.baris.diminta"), { guru: r.nama_peminta, tanggal: tanggal(r.diminta_pada, "baca", locale, zona), alasan: r.alasan })}
                </span>
                {kode && untuk === r.id ? <BarisHasil nada="gagal">{s(kunciKodePengerjaan(kode))}</BarisHasil> : null}
                {r.milik_sendiri ? (
                  <p className="pin-sub" data-kesempatan-sendiri="">{s("kesempatan.sendiri")}</p>
                ) : (
                  <form action={putuskanKesempatanAksi} className="pin-ulang" data-kesempatan-putus={r.id}>
                    <input type="hidden" name="permintaan" value={r.id} />
                    <input type="hidden" name="tempat" value={tempat} />
                  {r.kelas_id ? <input type="hidden" name="kelas" value={r.kelas_id} /> : null}
                    <div className="pin-isian">
                      <label htmlFor={`k-alasan-${r.id}`}>{s("kesempatan.tolak.alasan")}<span className="pin-sr"> · {r.nama}</span></label>
                      <textarea id={`k-alasan-${r.id}`} name="alasan" className="pin-input" rows={2} maxLength={300} aria-describedby={`k-alasan-arti-${r.id}`} />
                      <p id={`k-alasan-arti-${r.id}`} className="pin-hint">{s("kesempatan.tolak.alasan.arti")}</p>
                    </div>
                    <div className="pin-actions">
                      <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyimpan")} name="putusan" value="setuju">
                        {s("kesempatan.setujui")}<span className="pin-sr"> · {r.nama}</span>
                      </TombolKirim>
                      <TombolKirim className="pin-btn" sibuk={s("tombol.menyimpan")} name="putusan" value="tolak">
                        {s("kesempatan.tolak")}<span className="pin-sr"> · {r.nama}</span>
                      </TombolKirim>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
    </>
  );
}
