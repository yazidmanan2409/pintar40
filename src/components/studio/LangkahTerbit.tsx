"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { KODE_HAMBATAN, kalimatHambatan, kunciKodeTerbitan, type Hambatan, type HasilTerbitan } from "@/lib/terbitan-kontrak";
import { kunciKode, type HasilAksi } from "@/lib/galat-kontrak";
import {
  advanceContentAction, buatTerbitanAksi, kembalikanPaketAksi, kunciTerbitanAksi, tarikTerbitanAksi, terbitkanAksi,
} from "@/app/studio/actions";
import {
  LANGKAH, bolehMengambil, keadaanLangkah, kunciSalinan, posisiPaket,
  type FaktaPaket, type KunciLangkah, type Langkah,
} from "./langkah";

type Terbitan = { id: string; status: string; terbitPada: string | null };

/**
 * What the release step last answered, for which step, and (W1.4) which steps that one press completed, so a stale
 * answer is never shown against the next one and the next step's panel can say what the last press did.
 */
type Jawaban =
  | { langkah: KunciLangkah | "tarik"; hasil: HasilTerbitan; selesai: Array<KunciLangkah | "tarik"> }
  | { langkah: "kembali"; kembali: HasilAksi; selesai: [] }
  | null;

/** What the last press did, said at the top of the panel it led to (W1.4, UX-39; Daisy, Action feedback). */
type Kabar = { jenis: "langkah"; langkah: KunciLangkah[] } | { jenis: "kembali" } | { jenis: "terbit" } | { jenis: "tarik" } | null;

/**
 * THE STEPS TO "TERBIT", ON THE PACKAGE PAGE (DAISY-06, audit M11; W1.1 Batch 3, Daisy's J1Terbit composition).
 *
 * J1TERBIT. The seven steps, in the database's order (./langkah.ts), are Progress's named steps: one line each, done
 * ones filled and read as «Selesai», the current one marked (`aria-current="step"`), the rest still to come. The
 * current step alone opens below them in a panel: «Sekarang», its name, what it does, who takes it, and its one
 * action, or why this reader does not take it. The panel is where every press answers (Daisy, Action feedback): the
 * working word on the button, then the result line beside it, and after the page re-reads, the next step's panel
 * opens with what the last press did (W1.4, UX-39). «Terbitkan» is «Menerbitkan…», then «✓ Diterbitkan».
 *
 * FEWER PRESSES (W1.4, UX-15). Where the reader who creates the release may also lock it (CAN_FREEZE_RELEASE, not the
 * author), one press does both, as BOB-03's two typed actions one after the other; both steps stay in the list as
 * progress, and a lock the validators hold back leaves the release created, at «Kunci terbitan», with what holds it.
 *
 * SEND BACK (W1.6). At «Setujui isi» the second person may instead send the package back to its author with a
 * reason: an in-page confirmation (Daisy, Confirmation: a consequential act that needs a reason is never a Dialog)
 * takes the place of the action area, and `kembalikanPaketAksi` asks the database. The author then sees the reason in
 * the «Susun isi» panel, with the two ways on: a correction upload in the package's line, or marking it put together
 * again.
 *
 * Steps 1-4 move the content through advanceContentAction and come back to the page with its result (`hasilIsi`,
 * read by the page from the address, codes only). Steps 5-7 and the withdrawal are BOB-03's typed actions: a refusal
 * is its code's sentence (never the database's words), a lock the validators hold back lists what holds it, and a
 * success re-reads the page so the next step becomes current. Decides nothing: every button asks the database again.
 */
export default function LangkahTerbit({
  locale, course, fakta, terbitan, kemampuan, saya, penyusun, hasilIsi = null, kembali = null, unggahPerbaikan = null,
}: {
  locale: Locale;
  course: string;
  fakta: FaktaPaket;
  terbitan: Terbitan | null;
  /** The capabilities the reader holds in the course's school. */
  kemampuan: readonly string[];
  /** The reader's person id, and the course's author's. */
  saya: string | null;
  penyusun: string | null;
  /** A content step's result, as the page read it back from the address (codes only, the copy table's sentence). */
  hasilIsi?: { ok: boolean; kode: string | null; kalimat: string } | null;
  /** The reviewer's reason, when the package was sent back: who, when (already written in the reader's language). */
  kembali?: { alasan: string; oleh: string | null; pada: string } | null;
  /** Where the corrected workbook is uploaded in this package's line, when this reader may and it is still the newest. */
  unggahPerbaikan?: string | null;
}) {
  const router = useRouter();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const posisi = posisiPaket(fakta);
  const daftar = keadaanLangkah(posisi);
  const [alasan, setAlasan] = useState("");
  const [alasanKembali, setAlasanKembali] = useState("");
  const [mengembalikan, setMengembalikan] = useState(false);
  const isianKembali = useRef<HTMLTextAreaElement>(null);
  const pembuka = useRef<HTMLButtonElement>(null);

  const [jawaban, jalankan, sibuk] = useActionState<Jawaban, FormData>(async (_prev, fd) => {
    const langkah = String(fd.get("langkah") ?? "") as KunciLangkah | "tarik" | "kembali";
    // W1.6: the send-back; once it is done the confirmation closes with its reason, and the page re-reads below
    if (langkah === "kembali") {
      const kembali = await kembalikanPaketAksi(null, fd);
      if (kembali.ok) { setMengembalikan(false); setAlasanKembali(""); }
      return { langkah, kembali, selesai: [] };
    }
    // W1.4: create the release and lock it in one press, for a reader who may take both
    if (langkah === "buat" && fd.get("terus") === "kunci") {
      const dibuat = await buatTerbitanAksi(null, fd);
      if (!dibuat.ok) return { langkah: "buat", hasil: dibuat, selesai: [] };
      fd.set("release", dibuat.release);
      const dikunci = await kunciTerbitanAksi(null, fd);
      return { langkah: "kunci", hasil: dikunci, selesai: dikunci.ok ? ["buat", "kunci"] : ["buat"] };
    }
    const aksi = langkah === "buat" ? buatTerbitanAksi
      : langkah === "kunci" ? kunciTerbitanAksi
      : langkah === "terbitkan" ? terbitkanAksi
      : langkah === "tarik" ? tarikTerbitanAksi
      : null;
    if (!aksi) return null;
    const hasil = await aksi(null, fd);
    return { langkah, hasil, selesai: hasil.ok ? [langkah] : [] };
  }, null);

  const hasilKembali = jawaban?.langkah === "kembali" ? jawaban.kembali : null;
  // what the last press did, read from its answer (W1.4)
  const kabar: Kabar = !jawaban ? null
    : jawaban.langkah === "kembali" ? (jawaban.kembali.ok ? { jenis: "kembali" } : null)
    : jawaban.selesai.includes("tarik") ? { jenis: "tarik" }
    : jawaban.selesai.includes("terbitkan") ? { jenis: "terbit" }
    : jawaban.selesai.length > 0 ? { jenis: "langkah", langkah: jawaban.selesai.filter((x): x is KunciLangkah => x !== "tarik") }
    : null;
  const segarkan = kabar !== null;

  // a step taken re-reads the page, so the next one becomes current (and a withdrawal's form, with the reason typed
  // into it, is gone with its step); a press that completed one step and was refused at the next re-reads it too
  useEffect(() => {
    if (segarkan) router.refresh();
  }, [jawaban, segarkan, router]);

  // the confirmation takes the place of the action area: the reason is where the reader is; «Batal» goes back to it
  useEffect(() => {
    if (mengembalikan) isianKembali.current?.focus();
  }, [mengembalikan]);

  const atau = s("studio.langkah.atau");
  const siapa = (l: Langkah) => {
    const nama = l.peran.map((p) => t(`role.${p}` as HleEvent, "staff", { locale }));
    const daftarNama = nama.length <= 1 ? nama.join("") : `${nama.slice(0, -1).join(", ")} ${atau} ${nama[nama.length - 1]}`;
    return l.orangKedua ? `${daftarNama}, ${s("studio.langkah.bukan_penyusun")}` : daftarNama;
  };

  const gagal = (langkah: KunciLangkah | "tarik") =>
    jawaban && jawaban.langkah !== "kembali" && jawaban.langkah === langkah && !jawaban.hasil.ok ? jawaban.hasil : null;

  const kunciLangkah = LANGKAH.find((x) => x.kunci === "kunci")!;
  // W1.4: the release is created and locked in one press by a reader who may take both
  const sekaligusKunci = (l: Langkah) => l.kunci === "buat" && bolehMengambil(kunciLangkah, kemampuan, saya, penyusun) === "boleh";

  const tombolTerbitan = (l: Langkah) => (
    <form action={jalankan}>
      <input type="hidden" name="langkah" value={l.kunci} />
      <input type="hidden" name="course" value={course} />
      {sekaligusKunci(l) ? <input type="hidden" name="terus" value="kunci" /> : null}
      {terbitan ? <input type="hidden" name="release" value={terbitan.id} /> : null}
      {/* step 7 (question 2; 11-validation.md §4): «Menerbitkan…», then «✓ Diterbitkan» once the server confirms */}
      {l.kunci === "terbitkan" ? (
        <TombolKirim className="pin-btn pin-primary" disabled={sibuk} sibuk={s("tombol.menerbitkan")}
          selesai={jawaban?.langkah === "terbitkan" && jawaban.hasil.ok ? s("studio.langkah.selesai.terbitkan") : undefined}>
          {s(kunciSalinan(l.kunci, "tombol"))}
        </TombolKirim>
      ) : (
        <TombolKirim className="pin-btn pin-primary" disabled={sibuk} sibuk={s("studio.langkah.sibuk")}>
          {s(kunciSalinan(sekaligusKunci(l) ? "kunci" : l.kunci, "tombol"))}
        </TombolKirim>
      )}
    </form>
  );

  const tombolIsi = (l: Langkah & { jalan: { isi: string } }) => (
    <form action={advanceContentAction}>
      <input type="hidden" name="course" value={course} />
      <input type="hidden" name="to" value={l.jalan.isi} />
      <TombolKirim className="pin-btn pin-primary" sibuk={s("studio.langkah.sibuk")}>{s(kunciSalinan(l.kunci, "tombol"))}</TombolKirim>
    </form>
  );

  // W1.6: the reviewer's other outcome, beside «Setujui isi»; looking never commits (opening it changes nothing)
  const bolehKembali = (l: Langkah) => l.kunci === "setujui" && bolehMengambil(l, kemampuan, saya, penyusun) === "boleh";
  const konfirmasiKembali = (
    <div className="pin-konfirmasi" role="group" aria-labelledby="lt-kembali-judul">
      <p id="lt-kembali-judul" className="pin-konfirmasi-judul">{s("studio.kembali.judul")}</p>
      <p>{s("studio.kembali.arti")}</p>
      <form action={jalankan} className="pin-konfirmasi-isi">
        <input type="hidden" name="langkah" value="kembali" />
        <input type="hidden" name="course" value={course} />
        <label className="pin-lt-isian">
          <span className="pin-meta">{s("studio.kembali.alasan")}</span>
          <textarea ref={isianKembali} className="pin-input pin-lt-alasan-isian" name="alasan" required minLength={10} maxLength={1000}
            value={alasanKembali} onChange={(e) => setAlasanKembali(e.target.value)} aria-describedby="lt-kembali-arti" />
          <span id="lt-kembali-arti" className="pin-hint">{s("studio.kembali.alasan_arti")}</span>
        </label>
        <div className="pin-actions">
          <TombolKirim className="pin-btn pin-primary" disabled={sibuk} sibuk={s("tombol.mengembalikan")}>
            {s("studio.kembali.tombol")}
          </TombolKirim>
          <button type="button" className="pin-btn" disabled={sibuk}
            onClick={() => { setMengembalikan(false); requestAnimationFrame(() => pembuka.current?.focus()); }}>
            {s("studio.kembali.batal")}
          </button>
        </div>
      </form>
      {hasilKembali && !hasilKembali.ok ? (
        <BarisHasil nada="gagal">
          {s(kunciKode(hasilKembali.kode))}{hasilKembali.ref ? ` (${s("galat.rujukan")}: ${hasilKembali.ref})` : ""}
        </BarisHasil>
      ) : null}
    </div>
  );

  // DAISY-16: a blocker code the catalogue does not know shows the general
  // line and the reference the server logged it under, never the code itself
  const dikenal = (x: Hambatan) => (KODE_HAMBATAN as readonly string[]).includes(x?.code);
  const pesanGagal = (langkah: KunciLangkah | "tarik") => {
    const h = gagal(langkah);
    if (!h || h.ok) return null;
    const rujukanDiBaris = !!h.ref && (h.hambatan ?? []).some((x) => !dikenal(x));
    return (
      <BarisHasil nada="gagal">
        <p>{s(kunciKodeTerbitan(h.code))}{h.ref && !rujukanDiBaris ? ` (${s("studio.unggah.rujukan")} ${h.ref})` : ""}</p>
        {h.hambatan && h.hambatan.length > 0 ? (
          <>
            <p className="pin-lt-hambatan">{s("studio.langkah.hambatan")}</p>
            {/* BOB-17 (D-011): each blocker is a code; its line comes from the copy table */}
            <ul className="pin-lt-hambatan-daftar">{h.hambatan.map((x, i) => <li key={`${x?.code}-${x?.lesson_id ?? ""}-${x?.pattern ?? ""}-${i}`}>{kalimatHambatan(x, s, (n) => format.number(n, locale))}{rujukanDiBaris && !dikenal(x) ? ` (${s("galat.rujukan")}: ${h.ref})` : null}</li>)}</ul>
          </>
        ) : null}
      </BarisHasil>
    );
  };

  // W1.4: what the last press did, at the top of the panel it led to. A content step comes back through the address
  // (STEP_TAKEN): the step it completed is the one before the current one.
  const iKini = LANGKAH.findIndex((l) => l.kunci === posisi.kini);
  const sebelumnya = iKini > 0 ? LANGKAH[iKini - 1].kunci : posisi.kini === "terbit" ? "terbitkan" : null;
  const selesaiKata = (k: KunciLangkah[]) => k.map((x) => `${s(kunciSalinan(x, "judul"))} · ${s("studio.langkah.keadaan.selesai")}`).join(". ");
  const kabarIni = (): { nada: "ok" | "gagal"; isi: string } | null => {
    if (kabar?.jenis === "kembali") return { nada: "ok", isi: s(kunciKode("SENT_BACK")) };
    if (kabar?.jenis === "langkah" && kabar.langkah.length > 0) return { nada: "ok", isi: selesaiKata(kabar.langkah) };
    if (kabar) return null; // published and withdrawn say it in their own panel
    if (!hasilIsi) return null;
    if (hasilIsi.ok && hasilIsi.kode === "STEP_TAKEN" && sebelumnya) {
      return { nada: "ok", isi: selesaiKata([sebelumnya]) };
    }
    return { nada: hasilIsi.ok ? "ok" : "gagal", isi: hasilIsi.kalimat };
  };
  const kabarBaris = (() => {
    const k = kabarIni();
    return k ? <BarisHasil nada={k.nada}>{k.isi}</BarisHasil> : null;
  })();

  const kini = daftar.find((x) => x.keadaan === "kini")?.langkah ?? null;
  const panelLangkah = (l: Langkah) => {
    const boleh = bolehMengambil(l, kemampuan, saya, penyusun);
    const gabung = boleh === "boleh" && sekaligusKunci(l);
    return (
      <div className="pin-lt-panel" aria-labelledby="lt-kini">
        <p className="pin-eyebrow">{s("studio.langkah.keadaan.kini")}</p>
        <h4 id="lt-kini" className="pin-lt-panel-judul">
          {s(kunciSalinan(l.kunci, "judul"))}{gabung ? ` · ${s(kunciSalinan("kunci", "judul"))}` : null}
        </h4>
        {kabarBaris}
        <p>{s(kunciSalinan(l.kunci, "arti"))}</p>
        {gabung ? <p>{s(kunciSalinan("kunci", "arti"))}</p> : null}
        <p className="pin-lt-oleh">{s("studio.langkah.oleh")} {siapa(l)}{gabung ? `; ${s(kunciSalinan("kunci", "judul"))}: ${siapa(kunciLangkah)}` : ""}</p>
        {l.kunci === "susun" && posisi.dikembalikan ? (
          <>
            <p className="pin-lt-catatan">{s("studio.langkah.dikembalikan")}</p>
            {kembali ? (
              <div className="pin-lt-alasan">
                <p className="pin-lt-alasan-judul">{s("studio.kembali.alasan_dari")}</p>
                <p className="pin-lt-alasan-teks">{kembali.alasan}</p>
                <p className="pin-meta">{kembali.oleh ? `${s("studio.paket.riwayat.oleh")} ${kembali.oleh} · ` : ""}{kembali.pada}</p>
              </div>
            ) : null}
            {unggahPerbaikan ? <p>{s("studio.kembali.jalan_unggah")}</p> : null}
          </>
        ) : null}
        {mengembalikan && bolehKembali(l) ? konfirmasiKembali : (
          <div className="pin-actions">
            {boleh === "boleh"
              ? ("isi" in l.jalan ? tombolIsi(l as Langkah & { jalan: { isi: string } }) : tombolTerbitan(l))
              : <p className="pin-lt-catatan">{s(boleh === "penyusun" ? "studio.langkah.tunggu.penyusun" : "studio.langkah.tunggu.wewenang")}</p>}
            {l.kunci === "susun" && posisi.dikembalikan && unggahPerbaikan
              ? <Link className="pin-btn" href={unggahPerbaikan}>{s("studio.paket.revisi_unggah")}</Link> : null}
            {bolehKembali(l) ? (
              <button ref={pembuka} type="button" className="pin-btn" onClick={() => setMengembalikan(true)}>
                {s("studio.kembali.tombol")}
              </button>
            ) : null}
          </div>
        )}
        {pesanGagal(l.kunci)}
        {gabung ? pesanGagal("kunci") : null}
      </div>
    );
  };

  const selesaiSemua = posisi.kini === "terbit" || posisi.kini === "ditarik";
  return (
    <section className="pin-lt" aria-labelledby="lt-judul">
      <h3 id="lt-judul" className="pin-lt-kepala">{s("studio.langkah.judul")}</h3>
      <p className="pin-hint">{s("studio.langkah.arti")}</p>
      {/* Daisy, Progress («Named steps») as J1Terbit draws them: a word each, done ones read as «Selesai» */}
      <ol className="pin-lt-daftar" aria-label={s("studio.langkah.judul")}>
        {daftar.map(({ langkah: l, keadaan }) => (
          <li key={l.kunci} className={`pin-lt-langkah pin-lt-${keadaan}`} aria-current={keadaan === "kini" ? "step" : undefined}>
            <p className="pin-lt-judul">{s(kunciSalinan(l.kunci, "judul"))}{keadaan === "selesai"
              ? <span className="pin-sr"> ({s("studio.langkah.keadaan.selesai")})</span> : null}</p>
          </li>
        ))}
        <li className={`pin-lt-langkah pin-lt-akhir pin-lt-${selesaiSemua ? "selesai" : "nanti"}`}
          aria-current={selesaiSemua ? "step" : undefined}>
          <p className="pin-lt-judul">{s(posisi.kini === "ditarik" ? "studio.langkah.ditarik.judul" : "studio.langkah.terbit.judul")}</p>
        </li>
      </ol>

      {kini ? panelLangkah(kini) : posisi.kini === "terbit" ? (
        <div className="pin-lt-panel" aria-labelledby="lt-kini">
          <p className="pin-eyebrow">{s("studio.langkah.keadaan.kini")}</p>
          <h4 id="lt-kini" className="pin-lt-panel-judul">{s("studio.langkah.terbit.judul")}</h4>
          {kabarBaris}
          {(() => {
            const kalimat = (
              <p>
                {terbitan?.terbitPada ? `${s("studio.langkah.terbit.sejak")} ${format.date(terbitan.terbitPada, locale)}. ` : ""}
                {s("studio.paket.terbit_bukan_tugas")}
              </p>
            );
            // J1Terbit: just published, the line says what happened, and the way on is the packages
            return kabar?.jenis === "terbit"
              ? <><BarisHasil nada="ok">{kalimat}</BarisHasil><p><Link className="pin-btn" href="/studio">{s("studio.paket.judul")}</Link></p></>
              : kalimat;
          })()}
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
        <div className="pin-lt-panel" aria-labelledby="lt-kini">
          <p className="pin-eyebrow">{s("studio.langkah.keadaan.kini")}</p>
          <h4 id="lt-kini" className="pin-lt-panel-judul">{s("studio.langkah.ditarik.judul")}</h4>
          {kabarBaris}
          {kabar?.jenis === "tarik"
            ? <BarisHasil nada="ok">{s("studio.langkah.ditarik.arti")}</BarisHasil>
            : <p>{s("studio.langkah.ditarik.arti")}</p>}
        </div>
      ) : (
        <>{kabarBaris}<p className="pin-lt-oleh">{s("studio.langkah.terbit.nanti")}</p></>
      )}
    </section>
  );
}
