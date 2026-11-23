"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BarisHasil from "@/components/BarisHasil";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { Tebal } from "@/components/studio/ai-kata";
import { kodeAi, kunciKode } from "@/lib/galat-kontrak";

const MAKS_TEKS = 20000;

/**
 * C3w-1 · «BUAT DRAF SOAL DENGAN AI» (Daisy, C3W-1-WORDS.md §1-§2 and C3W-1-WORDS-TAMBAHAN.md §1). The button, then the
 * form in place, on the lesson on screen. It posts to the drafting route (src/app/api/draf-ai), which asks the
 * database for every right; this form decides nothing. One idempotency key per opening of the form (D11), so a second
 * press of the same form is the first request's outcome, never a second call.
 *
 * Every refusal is its code's sentence in the form's result slot (role="alert"), and the form keeps what was typed,
 * except the rights box after AI_DATA_PRIBADI, because the source has to change. Success says how many drafts are
 * ready, and where (linked) when the target is not the lesson on screen; else focus moves to the first new card once the
 * page has re-read. The objectives listed are the chosen target's, the first ticked (Daisy's C-1); a target with none
 * says so under the legend, and the server refuses the same (AI_TANPA_TUJUAN).
 */
export default function DrafAi({
  locale, course, lessonKini, pelajaran, tujuanPer, adaTeks,
}: {
  locale: Locale;
  course: string;
  /** the lesson on screen: the target by default */
  lessonKini: string;
  /** the package's lessons, by title, and their position in the pager */
  pelajaran: Array<{ id: string; judul: string; ke: number }>;
  /** each lesson's objectives, by statement: the list follows the chosen target (Daisy's C-1, C3W-D4) */
  tujuanPer: Record<string, string[]>;
  /** whether each lesson has text of its own */
  adaTeks: Record<string, boolean>;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [sasaran, setSasaran] = useState(lessonKini);
  const [sumber, setSumber] = useState<"PELAJARAN" | "TEMPEL">("PELAJARAN");
  const [teks, setTeks] = useState("");
  const tujuan = tujuanPer[sasaran] ?? [];
  const [dipilih, setDipilih] = useState<string[]>((tujuanPer[lessonKini] ?? []).slice(0, 1));
  // §1.3: on success focus lands on the first new card, once the page has re-read it
  const [fokus, setFokus] = useState<string | null>(null);
  useEffect(() => {
    if (!fokus) return;
    let n = 0;
    const t0 = setInterval(() => {
      const el = document.getElementById(`pin-soal-${fokus}`);
      if (el || ++n > 40) { clearInterval(t0); el?.focus(); if (el) setFokus(null); }
    }, 100);
    return () => clearInterval(t0);
  }, [fokus]);
  const [jumlah, setJumlah] = useState(3);
  const [hak, setHak] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState<{ nada: "ok" | "gagal"; isi: ReactNode } | null>(null);
  const kunci = useRef<string | null>(null);
  const tombol = useRef<HTMLButtonElement>(null);

  const tanpaTeks = sumber === "PELAJARAN" && adaTeks[sasaran] === false;
  const tanpaTujuan = tujuan.length === 0;
  const ganti = (id: string) => { setSasaran(id); setDipilih((tujuanPer[id] ?? []).slice(0, 1)); };
  const judulSasaran = pelajaran.find((p) => p.id === sasaran)?.judul ?? "";

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sibuk) return;
    if (!kunci.current) kunci.current = crypto.randomUUID().replace(/-/g, "");
    if (tanpaTujuan) { setHasil({ nada: "gagal", isi: s("galat.ai_tanpa_tujuan") }); return; }
    if (tanpaTeks) { setHasil({ nada: "gagal", isi: s("studio.ai.tanpa_teks") }); return; }
    setSibuk(true);
    setHasil(null);
    try {
      const r = await fetch("/api/draf-ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          course, lesson: sasaran, sumber, teks: sumber === "TEMPEL" ? teks : undefined,
          objectives: dipilih, jumlah, kunci: kunci.current, hakSumber: hak,
        }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; kode?: string; items?: unknown[] | null; terkirim?: boolean } | null;
      if (j?.ok) {
        const n = Array.isArray(j.items) ? j.items.length : jumlah;
        const di = sasaran !== lessonKini;
        // the target named and linked when it is not the lesson on screen (TAMBAHAN §1); else focus moves to the first card
        const ke = pelajaran.find((p) => p.id === sasaran)?.ke ?? 1;
        const [awal, akhir] = (n === 1 ? s("studio.ai.siap_di_satu") : s("studio.ai.siap_di").replace("{n}", format.number(n, locale))).split("{judul}");
        const kal: ReactNode = di
          ? <>{awal}<Link href={`/studio/paket/${encodeURIComponent(course)}?pelajaran=${ke}#pin-soal-pelajaran`} data-draf-ai-sasaran="">{judulSasaran}</Link>{akhir}</>
          : (n === 1 ? s("studio.ai.siap_satu") : s("studio.ai.siap").replace("{n}", format.number(n, locale)));
        setHasil({ nada: "ok", isi: kal });
        const pertama = Array.isArray(j.items) && typeof j.items[0] === "string" ? j.items[0] : null;
        if (!di && pertama) setFokus(pertama);
        kunci.current = null;
        router.refresh();
        return;
      }
      const kode = kodeAi(j?.kode ?? "AI_GAGAL");
      // the package was checked during the call: that state's sentence, without «Tidak ada yang dikirim» (§5)
      const kal = kode === "AI_PAKET_LOLOS_PERIKSA" && j?.terkirim ? s("galat.ai_paket_lolos_periksa_setelah") : s(kunciKode(kode));
      setHasil({ nada: "gagal", isi: <Tebal teks={kal} /> });
      if (kode === "AI_DATA_PRIBADI") setHak(false);
    } catch {
      setHasil({ nada: "gagal", isi: s("galat.ai_gagal") });
    } finally {
      setSibuk(false);
    }
  };

  if (!buka) {
    return (
      <p className="pin-draf-ai-buka">
        <button ref={tombol} type="button" className="pin-btn" data-draf-ai="" onClick={() => { setBuka(true); setHasil(null); }}>
          {s("studio.ai.tombol")}
        </button>
      </p>
    );
  }
  return (
    <form className="pin-draf-ai" aria-labelledby="draf-ai-judul" onSubmit={kirim} data-draf-ai-form="">
      <h4 id="draf-ai-judul" className="pin-soal-pelajaran-judul">{s("studio.ai.judul")}</h4>
      <label className="pin-lt-isian">
        <span className="pin-meta">{s("studio.ai.pelajaran_tujuan")}</span>
        <select className="pin-input" value={sasaran} onChange={(e) => ganti(e.target.value)} aria-describedby="draf-ai-tujuan-arti">
          {pelajaran.map((p) => <option key={p.id} value={p.id}>{p.judul}</option>)}
        </select>
        <span id="draf-ai-tujuan-arti" className="pin-hint">{s("studio.ai.pelajaran_tujuan_petunjuk")}</span>
      </label>
      <fieldset className="pin-lt-isian">
        <legend className="pin-meta">{s("studio.ai.sumber")}</legend>
        <label><input type="radio" name="sumber" checked={sumber === "PELAJARAN"} onChange={() => setSumber("PELAJARAN")} /> {s("studio.ai.sumber.tujuan")}</label>
        <label><input type="radio" name="sumber" checked={sumber === "TEMPEL"} onChange={() => setSumber("TEMPEL")} /> {s("studio.ai.sumber.tempel")}</label>
        {tanpaTeks ? <p className="pin-alasan" id="draf-ai-tanpa">{s("studio.ai.tanpa_teks")}</p> : null}
      </fieldset>
      {sumber === "TEMPEL" ? (
        <label className="pin-lt-isian">
          <span className="pin-meta">{s("studio.ai.teks")}</span>
          <textarea className="pin-input" value={teks} onChange={(e) => setTeks(e.target.value)} required maxLength={MAKS_TEKS} rows={6}
            aria-describedby="draf-ai-teks-arti" />
          <span id="draf-ai-teks-arti" className="pin-hint">{s("studio.ai.teks_petunjuk").replace("{n}", format.number(MAKS_TEKS, locale))}</span>
        </label>
      ) : null}
      <fieldset className="pin-lt-isian">
        <legend className="pin-meta">{s("studio.ai.tujuan")}</legend>
        {tanpaTujuan ? <p className="pin-alasan" id="draf-ai-tanpa-tujuan" data-draf-ai-tanpa-tujuan="">{s("galat.ai_tanpa_tujuan")}</p> : null}
        {tujuan.map((x, i) => (
          <label key={i}>
            <input type="checkbox" checked={dipilih.includes(x)}
              onChange={(e) => setDipilih(e.target.checked ? [...dipilih, x] : dipilih.filter((y) => y !== x))} /> {x}
          </label>
        ))}
      </fieldset>
      <label className="pin-lt-isian">
        <span className="pin-meta">{s("studio.ai.jumlah")}</span>
        <input className="pin-input" type="number" min={1} max={10} value={jumlah} required
          onChange={(e) => setJumlah(Math.min(10, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))} />
      </label>
      <label className="pin-lt-isian">
        <span><input type="checkbox" checked={hak} onChange={(e) => setHak(e.target.checked)} aria-describedby="draf-ai-hak-arti" /> {s("studio.ai.hak")}</span>
        <span id="draf-ai-hak-arti" className="pin-hint">{s("studio.ai.hak_petunjuk")}</span>
      </label>
      {sibuk ? <BarisHasil nada="netral">{s("studio.ai.bekerja").replace("{n}", format.number(jumlah, locale))}</BarisHasil> : null}
      {hasil ? <BarisHasil nada={hasil.nada}>{hasil.isi}</BarisHasil> : null}
      <div className="pin-actions">
        {/* busy, never disabled: a disabled button drops the keyboard's focus to the page; a second press is ignored (kirim) */}
        <button type="submit" className="pin-btn pin-primary" aria-disabled={sibuk || undefined} aria-busy={sibuk || undefined}>{s("studio.ai.buat")}</button>
        <button type="button" className="pin-btn pin-quiet" onClick={() => { setBuka(false); setHasil(null); kunci.current = null; }}>{s("studio.ai.batal")}</button>
      </div>
    </form>
  );
}
