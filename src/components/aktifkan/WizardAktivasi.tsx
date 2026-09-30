"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { useSiap } from "@/components/masuk/siap";
import { kirim, kalimat, menunggu, tujuanAman, type Gagal, type Jawaban } from "./jawaban";
import type { DataKartu, KeadaanAktivasi, Langkah, Rute, StatusKartu } from "./kontrak";
import { Berhenti, LangkahNama, LangkahPassword, LangkahPin, LangkahUsername, Selamat, type Pesan } from "./Langkah";

/**
 * THE ACTIVATION WIZARD (DAISY-20, BOB-26 §3), for a signed-in email account
 * whose set-up is REQUIRED. The proxy holds such an account here (§1), so this
 * is the only page it can reach until it finishes.
 *
 * THE SERVER KEEPS THE ORDER. The wizard asks where it stands
 * (`GET /api/aktifkan/keadaan`) on arrival and again after every step, and
 * shows `berikutnya`. A step already done (a reload, a second tab) is simply
 * not shown again: its «…_ALREADY_SET» answer re-reads the state and moves on.
 * When the four steps are done it finishes (`POST /api/aktifkan/selesai`), and
 * a staff member then sees their PINTAR ID and card (§4); a learner-only
 * account sees neither (C17).
 *
 * FOCUS goes to each new surface's heading, once per surface, through one
 * effect.
 */
type Tahap =
  | { k: "memuat" }
  | { k: "langkah"; keadaan: KeadaanAktivasi; langkah: Langkah; ubahNama: boolean; pesan: Pesan; sibuk: boolean }
  | { k: "menyelesaikan" }
  | { k: "selamat"; kartu: DataKartu | null; status: StatusKartu; tujuan: string }
  | { k: "berhenti"; teks: string; tindakan: "masuk" | "ulangi" | "beranda" };

export default function WizardAktivasi({ locale }: { locale: Locale }) {
  const s = useCallback((k: HleEvent) => t(k, "public", { locale }), [locale]);
  const siap = useSiap();
  const [tahap, setTahap] = useState<Tahap>({ k: "memuat" });
  /** The surface on screen, for the one decision that needs the previous one: whether focus moves. */
  const tahapRef = useRef<Tahap>(tahap);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const [fokus, setFokus] = useState(0);

  useEffect(() => {
    tahapRef.current = tahap;
  }, [tahap]);
  useEffect(() => {
    if (fokus) judulRef.current?.focus();
  }, [fokus]);

  /** A refusal that ends the wizard here, or null when the step should say it. */
  const akhir = useCallback(<R extends Rute>(g: Gagal<R>): Tahap | null => {
    const teks = kalimat(g, s, locale);
    if (g.kode === "BELUM_MASUK") return { k: "berhenti", teks, tindakan: "ulangi" };
    if (g.kode === "TIDAK_BERLAKU") return { k: "berhenti", teks, tindakan: "masuk" };
    if (g.kode === "SETUP_SUDAH_SELESAI") return { k: "berhenti", teks, tindakan: "beranda" };
    return null;
  }, [s, locale]);

  const selesaikan = useCallback(async (keadaan: KeadaanAktivasi) => {
    setTahap({ k: "menyelesaikan" });
    const r = await kirim<"selesai", { tujuan: string; kartu: StatusKartu }>("selesai", new FormData());
    if (!r.ok) {
      const henti = akhir(r);
      if (henti) { setTahap(henti); setFokus((n) => n + 1); return; }
      // a step is missing after all: back to the first one the route named
      const langkah = r.kode === "SETUP_BELUM_LENGKAP" && r.kurang.length ? r.kurang[0] : null;
      const pesan: Pesan = { teks: kalimat(r, s, locale), salah: false, tunggu: menunggu(r) };
      if (langkah) setTahap({ k: "langkah", keadaan, langkah, ubahNama: false, pesan, sibuk: false });
      else setTahap({ k: "berhenti", teks: pesan.teks, tindakan: "ulangi" });
      setFokus((n) => n + 1);
      return;
    }
    // C17: only staff have a card, and only staff are shown one
    let kartu: DataKartu | null = null;
    if (keadaan.staf) {
      const k = await kirim<"kartu", { kartu: DataKartu }>("kartu");
      if (k.ok) kartu = { ...k.kartu, konteks: k.kartu.konteks ?? [] };
    }
    setTahap({ k: "selamat", kartu, status: keadaan.staf ? r.kartu : "TIDAK_ADA", tujuan: tujuanAman(r.tujuan) });
    setFokus((n) => n + 1);
  }, [akhir, s, locale]);

  /** Where the wizard stands, from the server; then the next step, or the end. */
  const terapkan = useCallback(async (r: Jawaban<"keadaan", KeadaanAktivasi>, pesan: Pesan = null) => {
    if (!r.ok) {
      const henti = akhir(r);
      setTahap(henti ?? { k: "berhenti", teks: kalimat(r, s, locale), tindakan: "ulangi" });
      setFokus((n) => n + 1);
      return;
    }
    if (r.keadaan === "NOT_APPLICABLE") { setTahap({ k: "berhenti", teks: s("aktifkan.tidak_berlaku"), tindakan: "masuk" }); setFokus((n) => n + 1); return; }
    if (r.keadaan === "COMPLETE" || r.berikutnya === null) { setTahap({ k: "berhenti", teks: s("aktifkan.sudah_selesai"), tindakan: "beranda" }); setFokus((n) => n + 1); return; }
    if (r.berikutnya === "SELESAI") { await selesaikan(r); return; }
    // the same step again keeps focus where it is; a new one takes it to its heading
    const lama = tahapRef.current;
    setTahap({ k: "langkah", keadaan: r, langkah: r.berikutnya as Langkah, ubahNama: false, pesan, sibuk: false });
    if (!(lama.k === "langkah" && lama.langkah === r.berikutnya)) setFokus((n) => n + 1);
  }, [akhir, selesaikan, s, locale]);
  const muat = useCallback(
    async (pesan: Pesan = null) => terapkan(await kirim<"keadaan", KeadaanAktivasi>("keadaan"), pesan),
    [terapkan],
  );

  // The first read, when the page opens; its answer is applied only while mounted.
  useEffect(() => {
    let batal = false;
    void kirim<"keadaan", KeadaanAktivasi>("keadaan").then((r) => {
      if (!batal) void terapkan(r);
    });
    return () => { batal = true; };
  }, [terapkan]);

  /** A step's answer: on success (or «already done») the server says what is next. */
  async function langkah<R extends Rute>(rute: R, isian: Record<string, string>) {
    if (tahap.k !== "langkah" || tahap.sibuk) return;
    setTahap({ ...tahap, sibuk: true, pesan: null });
    const fd = new FormData();
    for (const [k, v] of Object.entries(isian)) fd.set(k, v);
    const r = await kirim(rute, fd);
    if (r.ok || /_ALREADY_SET$|_SUDAH_DIKONFIRMASI$/.test(r.kode)) { await muat(); return; }
    const henti = akhir(r);
    if (henti) { setTahap(henti); setFokus((n) => n + 1); return; }
    setTahap({ ...tahap, sibuk: false, pesan: { teks: kalimat(r, s, locale), salah: !menunggu(r) && !/TIDAK_TERSEDIA|DITOLAK|PUTUS/.test(r.kode), tunggu: menunggu(r) } });
  }

  /** A check made before anything is sent: it judged the fields. */
  function tolak(k: HleEvent) {
    if (tahap.k === "langkah") setTahap({ ...tahap, pesan: { teks: s(k), salah: true, tunggu: false } });
  }

  if (tahap.k === "memuat" || tahap.k === "menyelesaikan") {
    return (
      <div className="pin-form">
        <p className="pin-lede-m" role="status">
          <span className="pin-putar" aria-hidden="true" />
          {s(tahap.k === "memuat" ? "aktifkan.memuat" : "aktifkan.menyelesaikan")}
        </p>
      </div>
    );
  }

  if (tahap.k === "selamat") {
    return <Selamat locale={locale} judulRef={judulRef} kartu={tahap.kartu} status={tahap.status} tujuan={tahap.tujuan} />;
  }

  if (tahap.k === "berhenti") {
    // «ulangi» starts again from the code; the others go to the entry page, which sends each person home (D-010)
    const tindakan = tahap.tindakan === "ulangi"
      ? { href: "/aktifkan", label: "aktifkan.mulai_lagi" as HleEvent }
      : { href: "/", label: "aktifkan.w_masuk" as HleEvent };
    return <Berhenti locale={locale} judulRef={judulRef} teks={tahap.teks} tindakan={tindakan} />;
  }

  const umum = { locale, siap, sibuk: tahap.sibuk, pesan: tahap.pesan, judulRef };
  let isi;
  if (tahap.langkah === "USERNAME") {
    isi = <LangkahUsername {...umum} onKirim={(u) => (u.trim() ? void langkah("username", { username: u.trim() }) : tolak("aktifkan.kode.USERNAME_LENGTH"))} />;
  } else if (tahap.langkah === "PASSWORD") {
    isi = (
      <LangkahPassword {...umum} aturan={tahap.keadaan.aturanPassword} onKirim={(p, u) => {
        if (!p || !u) return tolak("aktifkan.p_kosong");
        if (p !== u) return tolak("aktifkan.p_beda");
        void langkah("password", { password: p });
      }} />
    );
  } else if (tahap.langkah === "PIN") {
    isi = (
      <LangkahPin {...umum} onKirim={(p, u) => {
        if (!/^\d{4}$/.test(p)) return tolak("aktifkan.kode.PIN_FORMAT");
        if (p !== u) return tolak("aktifkan.n_beda");
        void langkah("pin", { pin: p });
      }} />
    );
  } else {
    const nama = tahap.keadaan.langkah?.nama.nama ?? "";
    isi = (
      <LangkahNama {...umum} nama={nama} ubah={tahap.ubahNama}
        onBenar={() => void langkah("nama", {})}
        onUbah={() => { setTahap({ ...tahap, ubahNama: true, pesan: null }); setFokus((n) => n + 1); }}
        onBatal={() => { setTahap({ ...tahap, ubahNama: false, pesan: null }); setFokus((n) => n + 1); }}
        onKirimUbah={(n) => {
          const bersih = n.trim().replace(/\s+/g, " ");
          if (!bersih) return tolak("aktifkan.kode.NAMA_TIDAK_SAH");
          // an unchanged name is the name as it is: «Sudah benar»
          void langkah("nama", bersih === nama ? {} : { nama: bersih });
        }} />
    );
  }
  return (
    <>
      {isi}
      {/* Stopping is allowed: the set-up waits, and the next sign-in returns here. */}
      <form action="/keluar" method="post" className="pin-akt-keluar">
        <button type="submit" className="pin-tautan">{s("aktifkan.keluar")}</button>
      </form>
    </>
  );
}
