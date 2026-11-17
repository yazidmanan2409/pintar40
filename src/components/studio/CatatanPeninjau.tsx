import Link from "next/link";
import Ikon from "@/components/Ikon";
import BarisHasil from "@/components/BarisHasil";
import SimpanIsian from "@/components/SimpanIsian";
import TombolKirim from "@/components/TombolKirim";
import { TeksBaris } from "@/components/teks/Teks";
import type { HleEvent } from "@/lib/hle";
import { blokCatatan, catatanKiniDi, type Catatan } from "@/lib/catatan-kontrak";
import { tulisCatatanAksi } from "@/app/studio/soal-actions";

/**
 * C2w · «Catatan peninjau» (Daisy, C2W-CATATAN-KATA.md at 535561ed; PLAN-A2B-C2W.md §3.4 B3; Sharon's D4).
 *
 * WHAT A WRONG OPTION REVEALS. A reviewer of the school that owns a published question writes, per option, what
 * choosing it shows of how learners think. A note is never evidence: it changes no question and no score, no learner
 * reads it, and nothing here prints (O-3, `pin-noprint`). Its text is shown as text (TeksBaris: React escapes it), never
 * as markup (D4).
 *
 * STUDIO. A sibling of «Riwayat soal», after it. Per option: the notes that hold now, the I-5 line first when a note was
 * written before the key was corrected, then the text and «{nama} · {tanggal} · versi {n}»; the replaced ones under a
 * nested «Catatan sebelumnya (n)», each with «Diganti pada …». A reviewer sees every option, each with «Tulis catatan»
 * or «Ganti catatan», which opens the form in place through the address (`?catatan={item}:{label}`), so it works with
 * no script. A drafter reads, with no form; with no note and no form, the disclosure is not shown.
 *
 * BESIDE THE CLASS REPORT (`guru`). The current notes only, read only, «Peninjau: {nama} · {tanggal}» and the
 * teacher's I-5 line: a teacher reads what holds now.
 *
 * Who may write, and whether the note on screen is still the current one, are the database's
 * (catatan_peninjau_tulis, PR210); the forms are a courtesy.
 */

type S = (k: HleEvent) => string;
const isi = (teks: string, v: Record<string, string>) => Object.entries(v).reduce((x, [a, b]) => x.split(`{${a}}`).join(b), teks);

export type FormCatatan = {
  course: string; pelajaran: number; pemilik: string;
  /** the option whose form the address opened, and a refusal said to it */
  buka: string | null; galat: string | null;
  /** the option a save was just made on */
  tersimpan: string | null;
  /** the address this page is at, for «Batal» and the open links */
  alamat: (q: Record<string, string>, jangkar: string) => string;
};

export default function CatatanPeninjau({ s, mode, item, label, catatan, day, form }: {
  s: S;
  mode: "studio" | "guru";
  /** the question on screen (Studio: the version the form writes on) */
  item: string;
  label: readonly string[];
  /** null: the read was refused or failed; Studio says nothing then, as with no note */
  catatan: readonly Catatan[] | null;
  /** the date only, in the school's zone (tanggalUtuh) */
  day: (iso: string | null | undefined) => string;
  /** Studio, for a reviewer of the question's school: the forms */
  form?: FormCatatan | null;
}) {
  const semua = catatan ?? [];
  const blok = blokCatatan(label, semua, mode === "studio" && !!form, item).filter((b) => mode === "studio" || b.kini.length > 0);
  const kini = semua.filter((c) => !c.digantikan).length;
  if (blok.length === 0 || (mode === "guru" && kini === 0)) return null;
  const nama = (c: Catatan) => (c.pustaka ? s("studio.catatan.pintar") : c.nama ?? "—");
  const oleh = (c: Catatan) => (mode === "guru"
    ? isi(s("studio.catatan.oleh_guru"), { nama: nama(c), tanggal: day(c.pada) })
    : isi(s("studio.catatan.oleh"), { nama: nama(c), tanggal: day(c.pada), n: String(c.versi) }));
  const i5 = (c: Catatan) => (c.sebelum_koreksi ? (
    <p className="pin-meta" data-catatan-i5={c.id}>
      {isi(s(mode === "guru" ? "studio.catatan.i5_guru" : "studio.catatan.i5"),
        { kunci_saat_itu: c.kunci_saat_itu ?? "—", kunci_kini: c.kunci_kini ?? "—", n: String(c.versi) })}
    </p>
  ) : null);
  const terbuka = !!form && (form.buka !== null || form.tersimpan !== null);
  return (
    <details className="pin-disclosure pin-catatan-peninjau pin-noprint" data-catatan-peninjau={item} open={terbuka || undefined}>
      <summary>{isi(s("studio.catatan.judul"), { n: String(kini) })}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
      {blok.map((b) => {
        const sasaran = `${item}:${b.label}`;
        const diganti = catatanKiniDi(semua, item, b.label);
        const formIni = form && form.buka === b.label;
        const formId = `catatan-form-${item}-${b.label}`;
        return (
          <section key={b.label} className="pin-catatan-pilihan" id={`catatan-${item}-${b.label}`} data-catatan-pilihan={sasaran}>
            <p className="pin-catatan-judul"><strong>{isi(s("studio.catatan.pilihan"), { label: b.label })}</strong></p>
            {b.kini.map((c) => (
              <div key={c.id} className="pin-catatan-isi" data-catatan={c.id}>
                {i5(c)}
                <p className="pin-catatan-teks"><TeksBaris teks={c.isi} /></p>
                <p className="pin-meta">{oleh(c)}</p>
              </div>
            ))}
            {mode === "studio" && b.lama.length > 0 ? (
              <details className="pin-disclosure pin-noprint" data-catatan-sebelumnya={sasaran}>
                <summary>{isi(s("studio.catatan.sebelumnya"), { n: String(b.lama.length) })}<Ikon nama="chevron-down" kelas="pin-chevron" /></summary>
                <ol className="pin-daftar">
                  {b.lama.map((c) => (
                    <li key={c.id} className="pin-catatan-isi" data-catatan-lama={c.id}>
                      {i5(c)}
                      <p className="pin-catatan-teks"><TeksBaris teks={c.isi} /></p>
                      <p className="pin-meta">{oleh(c)} · {isi(s("studio.catatan.diganti_pada"), { tanggal: day(c.digantikan_pada) })}</p>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
            {form && form.tersimpan === b.label ? <BarisHasil nada="ok">{s("studio.catatan.tersimpan")}</BarisHasil> : null}
            {form && formIni ? (
              <form id={formId} action={tulisCatatanAksi} className="pin-catatan-form" data-catatan-form={sasaran}>
                <input type="hidden" name="course" value={form.course} />
                <input type="hidden" name="pelajaran" value={String(form.pelajaran)} />
                <input type="hidden" name="item" value={item} />
                <input type="hidden" name="opsi" value={b.label} />
                {diganti ? <input type="hidden" name="menggantikan" value={diganti.id} /> : null}
                {form.galat ? <BarisHasil nada="gagal">{form.galat}</BarisHasil> : null}
                <label htmlFor={`${formId}-isi`} className="pin-label">{isi(s("studio.catatan.label"), { label: b.label })}</label>
                <p className="pin-ket" id={`${formId}-petunjuk`}>
                  {s("studio.catatan.petunjuk")}
                  {diganti ? <> {s("studio.catatan.petunjuk_ganti")}</> : null}
                </p>
                <textarea id={`${formId}-isi`} className="pin-input pin-alasan-isian" name="isi" rows={4} maxLength={1000}
                  aria-describedby={`${formId}-petunjuk`} aria-invalid={form.galat ? true : undefined} />
                <div className="pin-aksi">
                  <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyimpan")}>{s("studio.catatan.simpan")}</TombolKirim>
                  <Link className="pin-btn pin-quiet" href={form.alamat({}, `catatan-${item}-${b.label}`)}>{s("studio.catatan.batal")}</Link>
                </div>
                <SimpanIsian form={formId} ditolak={!!form.galat} pemilik={form.pemilik} />
              </form>
            ) : form ? (
              <p className="pin-soal-tindakan">
                <Link className="pin-studio-tautan" {...(diganti ? { "data-catatan-ganti": sasaran } : { "data-catatan-tulis": sasaran })}
                  href={form.alamat({ catatan: sasaran }, `catatan-${item}-${b.label}`)}>
                  {s(diganti ? "studio.catatan.ganti" : "studio.catatan.tulis")}
                  <span className="pin-sr"> · {isi(s("studio.catatan.pilihan"), { label: b.label })}</span>
                </Link>
              </p>
            ) : null}
          </section>
        );
      })}
    </details>
  );
}
