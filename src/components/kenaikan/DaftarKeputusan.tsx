"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import TombolKirim from "@/components/TombolKirim";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tinjauKenaikanAksi } from "@/app/konfigurasi/kenaikan-aksi";

/**
 * «KENAIKAN KELAS DAN KELULUSAN», step 2 (Daisy's reconciliation Q1, 9 Nov): one native select per learner, as before,
 * with what makes forty rows readable:
 *   - a status line (role="status") that counts as choices are made: «38 naik ke Kelas 6A · 2027/28 · 1 tinggal kelas ·
 *     1 keluar · 0 belum dipilih», naming the undecided when five or fewer remain;
 *   - «Tinjau hasil» disabled while anyone is undecided, the status line its description;
 *   - a row whose choice differs from «Naikkan semua ke» marked as an exception (a left rule and «Pengecualian»).
 * Without script the form still works: each select is required, and the database names anyone left undecided; the
 * button is disabled only once the page is interactive, so it is never stuck.
 * Every word comes from the server (the copy table); this file only counts.
 */
export type BarisKeputusan = {
  person_id: string; nama: string; nomor: string | null; awal: string;
  tanda: string[]; // the row's pills, already in words
};
export type OpsiKeputusan = { label: string; opsi: Array<{ value: string; label: string; ringkas: string }> } | { value: string; label: string; ringkas: string };

export default function DaftarKeputusan({ locale, kelas, tahun, baris, opsi, utama, kata, tolak }: {
  locale: Locale; kelas: string; tahun: string; baris: BarisKeputusan[]; opsi: OpsiKeputusan[]; utama: string | null;
  kata: { pilih: string; keputusanUntuk: string; pengecualian: string; belum: string; belumNama: string; tinjau: string; intro: string };
  tolak?: React.ReactNode;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  // true once interactive, false while rendered on the server (no effect, so no extra render)
  const hidup = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [pilihan, setPilihan] = useState<Record<string, string>>(() => Object.fromEntries(baris.map((b) => [b.person_id, b.awal])));
  const ringkas = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of opsi) for (const x of "opsi" in o ? o.opsi : [o]) m.set(x.value, x.ringkas);
    return m;
  }, [opsi]);
  const belum = baris.filter((b) => !pilihan[b.person_id]);
  // the review waits until every learner has a decision; without script the server says which are missing
  const tertahan = hidup && belum.length > 0;
  const hitung = new Map<string, number>();
  for (const b of baris) {
    const v = pilihan[b.person_id];
    if (v) hitung.set(ringkas.get(v) ?? v, (hitung.get(ringkas.get(v) ?? v) ?? 0) + 1);
  }
  const bagian = [...hitung].map(([r, n]) => `${n} ${r}`);
  bagian.push(`${belum.length} ${kata.belum}`);
  const status = bagian.join(" · ") + (belum.length > 0 && belum.length <= 5 ? `. ${kata.belumNama} ${belum.map((b) => b.nama).join(", ")}.` : "");

  return (
    <form action={tinjauKenaikanAksi} className="pin-kenaikan">
      <input type="hidden" name="kelas" value={kelas} />
      <input type="hidden" name="tahun" value={tahun} />
      <p className="pin-kenaikan-teks">{kata.intro}</p>
      <p id="kn-hitung" role="status" className="pin-kenaikan-hitung" data-kenaikan-hitung={belum.length}>{status}</p>
      <ul className="pin-kenaikan-murid" data-kenaikan-murid="">
        {baris.map((b) => {
          const v = pilihan[b.person_id] ?? "";
          const pengecualian = Boolean(utama && v && v !== utama);
          return (
            <li key={b.person_id} className="pin-kenaikan-baris" data-murid={b.person_id} data-pengecualian={pengecualian ? "" : undefined}>
              <span className="pin-kenaikan-nama">
                {b.nama}{b.nomor ? <span className="pin-meta"> · {b.nomor}</span> : null}
                {b.tanda.map((t) => <span key={t} className="pin-pill pin-info">{t}</span>)}
                {pengecualian ? <span className="pin-meta" data-tanda-pengecualian="">{kata.pengecualian}</span> : null}
              </span>
              <label><span className="pin-sr">{kata.keputusanUntuk} {b.nama}</span>
                <select name={`k[${b.person_id}]`} className="pin-input" required value={v}
                  onChange={(e) => setPilihan((p) => ({ ...p, [b.person_id]: e.target.value }))}>
                  <option value="">{kata.pilih}</option>
                  {opsi.map((o) => "opsi" in o
                    ? <optgroup key={o.label} label={o.label}>{o.opsi.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</optgroup>
                    : <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </li>
          );
        })}
      </ul>
      {tolak}
      <div><TombolKirim className="pin-btn pin-primary justify-self-start" sibuk={s("tombol.memproses")} disabled={tertahan} aria-describedby="kn-hitung">{kata.tinjau}</TombolKirim></div>
    </form>
  );
}
