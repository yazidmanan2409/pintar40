"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { kalimatHambatan, kunciKodeTerbitan, type HasilTerbitan } from "@/lib/terbitan-kontrak";
import {
  advanceContentAction, buatTerbitanAksi, kunciTerbitanAksi, tarikTerbitanAksi, terbitkanAksi,
} from "@/app/studio/actions";
import {
  bolehMengambil, keadaanLangkah, kunciSalinan, posisiPaket,
  type FaktaPaket, type KunciLangkah, type Langkah,
} from "./langkah";

type Terbitan = { id: string; status: string; terbitPada: string | null };

/** What the release step last answered, and for which step, so a stale answer is never shown against the next one. */
type Jawaban = { langkah: KunciLangkah | "tarik"; hasil: HasilTerbitan } | null;

/**
 * THE STEPS TO "TERBIT", ON THE PACKAGE PAGE (DAISY-06, audit M11).
 *
 * Seven steps in the database's order (./langkah.ts), each named for what it
 * does, the current one marked, and beside each the roles that take it. Only
 * the current step offers a button, and only to a reader who may take it; the
 * author of the course is told that the two second-person steps are a
 * colleague's, rather than being shown a button the database would refuse.
 *
 * Steps 1-4 move the content through advanceContentAction and come back to the
 * page with its result. Steps 5-7 and the withdrawal are BOB-03's typed
 * actions: a refusal is its code's sentence (never the database's words), a
 * lock the validators hold back lists what holds it, and a success re-reads
 * the page so the next step becomes current.
 */
export default function LangkahTerbit({ locale, course, fakta, terbitan, kemampuan, saya, penyusun }: {
  locale: Locale;
  course: string;
  fakta: FaktaPaket;
  terbitan: Terbitan | null;
  /** The capabilities the reader holds in the course's school. */
  kemampuan: readonly string[];
  /** The reader's person id, and the course's author's. */
  saya: string | null;
  penyusun: string | null;
}) {
  const router = useRouter();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const posisi = posisiPaket(fakta);
  const daftar = keadaanLangkah(posisi);
  const [alasan, setAlasan] = useState("");

  const [jawaban, jalankan, sibuk] = useActionState<Jawaban, FormData>(async (_prev, fd) => {
    const langkah = String(fd.get("langkah") ?? "") as KunciLangkah | "tarik";
    const aksi = langkah === "buat" ? buatTerbitanAksi
      : langkah === "kunci" ? kunciTerbitanAksi
      : langkah === "terbitkan" ? terbitkanAksi
      : langkah === "tarik" ? tarikTerbitanAksi
      : null;
    if (!aksi) return null;
    return { langkah, hasil: await aksi(null, fd) };
  }, null);

  // a step taken re-reads the page, so the next one becomes current (and a
  // withdrawal's form, with the reason typed into it, is gone with its step)
  useEffect(() => {
    if (jawaban?.hasil.ok) router.refresh();
  }, [jawaban, router]);

  const atau = s("studio.langkah.atau");
  const siapa = (l: Langkah) => {
    const nama = l.peran.map((p) => t(`role.${p}` as HleEvent, "staff", { locale }));
    const daftarNama = nama.length <= 1 ? nama.join("") : `${nama.slice(0, -1).join(", ")} ${atau} ${nama[nama.length - 1]}`;
    return l.orangKedua ? `${daftarNama}, ${s("studio.langkah.bukan_penyusun")}` : daftarNama;
  };

  const gagal = (langkah: KunciLangkah | "tarik") =>
    jawaban && jawaban.langkah === langkah && !jawaban.hasil.ok ? jawaban.hasil : null;

  const tombolTerbitan = (l: Langkah) => (
    <form action={jalankan}>
      <input type="hidden" name="langkah" value={l.kunci} />
      <input type="hidden" name="course" value={course} />
      {terbitan ? <input type="hidden" name="release" value={terbitan.id} /> : null}
      <TombolKirim className="pin-btn pin-primary" disabled={sibuk} sibuk={s("studio.langkah.sibuk")}>
        {s(kunciSalinan(l.kunci, "tombol"))}
      </TombolKirim>
    </form>
  );

  const tombolIsi = (l: Langkah & { jalan: { isi: string } }) => (
    <form action={advanceContentAction}>
      <input type="hidden" name="course" value={course} />
      <input type="hidden" name="to" value={l.jalan.isi} />
      <TombolKirim className="pin-btn pin-primary" sibuk={s("studio.langkah.sibuk")}>{s(kunciSalinan(l.kunci, "tombol"))}</TombolKirim>
    </form>
  );

  const pesanGagal = (langkah: KunciLangkah | "tarik") => {
    const h = gagal(langkah);
    if (!h || h.ok) return null;
    return (
      <BarisHasil nada="gagal">
        <p>{s(kunciKodeTerbitan(h.code))}{h.ref ? ` (${s("studio.unggah.rujukan")} ${h.ref})` : ""}</p>
        {h.hambatan && h.hambatan.length > 0 ? (
          <>
            <p className="pin-lt-hambatan">{s("studio.langkah.hambatan")}</p>
            {/* BOB-17 (D-011): each blocker is a code; its line comes from the copy table */}
            <ul>{h.hambatan.map((x, i) => <li key={`${x.code}-${x.lesson_id ?? ""}-${x.pattern ?? ""}-${i}`}>{kalimatHambatan(x, s, (n) => format.number(n, locale))}</li>)}</ul>
          </>
        ) : null}
      </BarisHasil>
    );
  };

  return (
    <section className="pin-lt" aria-labelledby="lt-judul">
      <h3 id="lt-judul" className="pin-lt-kepala">{s("studio.langkah.judul")}</h3>
      <p className="pin-hint">{s("studio.langkah.arti")}</p>
      <ol className="pin-lt-daftar">
        {daftar.map(({ langkah: l, keadaan }, n) => {
          const boleh = bolehMengambil(l, kemampuan, saya, penyusun);
          return (
            <li key={l.kunci} className={`pin-lt-langkah pin-lt-${keadaan}`} aria-current={keadaan === "kini" ? "step" : undefined}>
              <span className="pin-lt-no" aria-hidden="true">{n + 1}</span>
              <div className="pin-lt-isi">
                <p className="pin-lt-judul">
                  {s(kunciSalinan(l.kunci, "judul"))}
                  <span className="pin-lt-tanda">{s(`studio.langkah.keadaan.${keadaan}` as HleEvent)}</span>
                </p>
                <p className="pin-lt-oleh">{s("studio.langkah.oleh")} {siapa(l)}</p>
                {keadaan === "kini" ? (
                  <div className="pin-lt-kerja">
                    <p>{s(kunciSalinan(l.kunci, "arti"))}</p>
                    {l.kunci === "susun" && posisi.dikembalikan ? <p className="pin-lt-catatan">{s("studio.langkah.dikembalikan")}</p> : null}
                    {boleh === "boleh"
                      ? ("isi" in l.jalan ? tombolIsi(l as Langkah & { jalan: { isi: string } }) : tombolTerbitan(l))
                      : <p className="pin-lt-catatan">{s(boleh === "penyusun" ? "studio.langkah.tunggu.penyusun" : "studio.langkah.tunggu.wewenang")}</p>}
                    {pesanGagal(l.kunci)}
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
        <li className={`pin-lt-langkah pin-lt-akhir pin-lt-${posisi.kini === "terbit" || posisi.kini === "ditarik" ? "selesai" : "nanti"}`}
          aria-current={posisi.kini === "terbit" || posisi.kini === "ditarik" ? "step" : undefined}>
          <span className="pin-lt-no" aria-hidden="true">✓</span>
          <div className="pin-lt-isi">
            <p className="pin-lt-judul">{s(posisi.kini === "ditarik" ? "studio.langkah.ditarik.judul" : "studio.langkah.terbit.judul")}</p>
            {posisi.kini === "terbit" ? (
              <div className="pin-lt-kerja">
                <p>
                  {terbitan?.terbitPada ? `${s("studio.langkah.terbit.sejak")} ${format.date(terbitan.terbitPada, locale)}. ` : ""}
                  {s("studio.paket.terbit_bukan_tugas")}
                </p>
                {kemampuan.includes("CAN_PUBLISH") && terbitan ? (
                  <form action={jalankan} className="pin-lt-tarik">
                    <input type="hidden" name="langkah" value="tarik" />
                    <input type="hidden" name="release" value={terbitan.id} />
                    <label className="pin-lt-isian">
                      <span className="pin-meta">{s("studio.langkah.tarik.alasan")}</span>
                      <input className="pin-input" name="alasan" value={alasan} onChange={(e) => setAlasan(e.target.value)} required />
                    </label>
                    <TombolKirim className="pin-btn" disabled={sibuk} sibuk={s("studio.langkah.sibuk")}>
                      {s("studio.paket.tarik")}
                    </TombolKirim>
                  </form>
                ) : null}
                {pesanGagal("tarik")}
              </div>
            ) : posisi.kini === "ditarik" ? (
              <p className="pin-lt-kerja">{s("studio.langkah.ditarik.arti")}</p>
            ) : (
              <p className="pin-lt-oleh">{s("studio.langkah.terbit.nanti")}</p>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}
