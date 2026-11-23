import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import TombolKirim from "@/components/TombolKirim";
import { putuskanDrafAiAksi } from "@/app/studio/soal-actions";
import type { HleEvent } from "@/lib/hle";

/** One generated draft's provenance, as ai_asal_paket answers it (20270122180000). */
export type AsalAi = {
  item: string;
  lesson: string;
  keputusan: "ACCEPTED" | "EDITED" | null;
  oleh: string | null;
  pada: string | null;
  diubah: boolean;
  model: string;
  sumber: "PELAJARAN" | "TEMPEL";
  sumber_judul: string | null;
  pemohon: string | null;
  diminta_pada: string;
};

export function bacaAsalAi(x: unknown): AsalAi[] {
  return Array.isArray(x) ? (x as AsalAi[]).filter((a) => a && typeof a.item === "string") : [];
}

/**
 * C3w-1 · A GENERATED DRAFT ON ITS CARD (Daisy, C3W-1-WORDS.md §3 and C3W-1-WORDS-TAMBAHAN.md §2). Staff only: the
 * chip («Draf dari AI» until decided, then who accepted it, edited or not, derived by the database), the provenance line
 * with the option's display name (ruling 40), and while undecided the waiting line and the two decisions. «Hapus» asks
 * first (KonfirmasiBahaya). Editing stays the card's ordinary «Ubah», never a third decision.
 */
export default function AsalAiKartu({
  s, a, course, pelajaran, posisi, bolehPutuskan, waktu,
}: {
  s: (k: HleEvent) => string;
  a: AsalAi;
  course: string;
  pelajaran: number;
  posisi: string;
  bolehPutuskan: boolean;
  waktu: (iso: string) => string;
}) {
  const isi = (k: HleEvent, v: Record<string, string>) => Object.entries(v).reduce((x, [p, q]) => x.split(`{${p}}`).join(q), s(k));
  const sumber = a.sumber === "PELAJARAN" ? isi("studio.ai.asal.pelajaran", { judul: a.sumber_judul ?? "—" }) : s("studio.ai.asal.tempel");
  const chip = a.keputusan === "ACCEPTED" ? isi("studio.ai.diterima", { nama: a.oleh ?? "—" })
    : a.keputusan === "EDITED" ? isi("studio.ai.diubah_diterima", { nama: a.oleh ?? "—" })
    : s("studio.ai.chip");
  const tersembunyi = (keputusan: "TERIMA" | "HAPUS") => (
    <>
      <input type="hidden" name="course" value={course} />
      <input type="hidden" name="item" value={a.item} />
      <input type="hidden" name="keputusan" value={keputusan} />
      <input type="hidden" name="pelajaran" value={String(pelajaran)} />
    </>
  );
  return (
    <div className="pin-draf-ai-asal" data-draf-ai-asal={a.item}>
      <p><span className="pin-pill" data-draf-ai-chip={a.keputusan ?? "BELUM"}>{chip}</span></p>
      <p className="pin-meta">{isi("studio.ai.asal", { model: a.model, sumber, nama: a.pemohon ?? "—", waktu: waktu(a.diminta_pada) })}</p>
      {a.keputusan === null ? (
        <>
          <p className="pin-meta" data-draf-ai-menunggu="">{s(a.diubah ? "studio.ai.menunggu_diubah" : "studio.ai.menunggu")}</p>
          {bolehPutuskan ? (
            <div className="pin-actions">
              <form action={putuskanDrafAiAksi} className="pin-draf-ai-putus">
                {tersembunyi("TERIMA")}
                <TombolKirim className="pin-btn pin-primary" sibuk={s("studio.langkah.sibuk")}>{s("studio.ai.terima")}<span className="pin-sr"> · {posisi}</span></TombolKirim>
              </form>
              <form action={putuskanDrafAiAksi} className="pin-draf-ai-putus">
                {tersembunyi("HAPUS")}
                <KonfirmasiBahaya id={`hapus-ai-${a.item}`} tombol={<>{s("studio.ai.hapus")}<span className="pin-sr"> · {posisi}</span></>} tanya={s("studio.ai.hapus_tanya")}
                  ya={s("studio.ai.hapus")} batal={s("bahaya.batal")} sibuk={s("studio.langkah.sibuk")} />
              </form>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
