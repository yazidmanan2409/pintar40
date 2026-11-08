"use client";

import { useState } from "react";
import BidangBerkas from "@/components/bentuk/BidangBerkas";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import {
  MEDAN, PERAN_PENDATAAN, bacaKisi, barisTernormalisasi, pemetaanLengkap, tebakPemetaan,
  type Kisi, type Medan, type Pemetaan,
} from "@/lib/pendataan-kontrak";
import type { Tempat } from "@/lib/pendataan";
import TombolKirim from "@/components/TombolKirim";

/**
 * THE FILE, AND WHICH COLUMN IS WHICH. Nothing here provisions anything.
 *
 * WHY THIS IS THE ONE PLACE WITH A CLIENT ISLAND AROUND IT. A spreadsheet has
 * to be read somewhere, and reading it in the browser means it is not uploaded,
 * stored or parsed on a server until a human has seen what PINTAR made of it.
 * The file never leaves this component; what leaves is the normalized rows, and
 * only when the administrator presses the button.
 *
 * WHAT LEAVES IS FIVE FIELDS. `import_row_problems` reads `display_name`,
 * `person_id`, `node_id`, `role` and `programme_id`; this offers those five and
 * no others. There is no column for an institutional ID, deliberately: PINTAR
 * generates all eleven characters and a column for it would invite a school to
 * bring their own.
 *
 * PLACES AND ROLES ARE CHOSEN, NOT TYPED. Three of the five fields are uuids
 * and no school's spreadsheet holds one, so those offer "one choice for
 * everyone" from a list the server built — the class by name, the role by its
 * telling. It decides nothing: every row is checked against the institution and
 * the caller's provisioning scope by the database, three separate times.
 *
 * AND IT PROVISIONS NOTHING. Submitting calls `import_open`, which writes rows
 * in a DRAFT job and creates no person, no identity, no membership and no role.
 * The administrator can still walk away.
 */
export default function BacaDanPetakan({
  institusi,
  tempat,
  aksi,
  locale = "id",
}: {
  institusi: string;
  tempat: Tempat[];
  aksi: (formData: FormData) => void | Promise<void>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const [kisi, setKisi] = useState<Kisi | null>(null);
  const [peta, setPeta] = useState<Pemetaan>({});

  function terima(teks: string) {
    const k = bacaKisi(teks);
    setKisi(k.baris.length > 0 ? k : null);
    setPeta(k.baris.length > 0 ? tebakPemetaan(k.kepala) : {});
  }

  async function dariBerkas(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    terima(await f.text());
  }

  function ubah(m: Medan, nilai: string) {
    setPeta((lama) => {
      const baru = { ...lama };
      if (nilai === "") delete baru[m];
      else if (nilai.startsWith("k:")) baru[m] = { jenis: "kolom", kolom: Number(nilai.slice(2)) };
      else baru[m] = { jenis: "tetap", nilai: nilai.slice(2) };
      return baru;
    });
  }

  const siap = kisi !== null && pemetaanLengkap(peta);
  // Built only to be submitted. It is derived from the grid and the mapping on
  // every render rather than kept in a second piece of state, so what is sent
  // cannot fall behind what is shown.
  const baris = kisi ? barisTernormalisasi(kisi, peta) : [];

  // A field offers a fixed choice only where a fixed choice is meaningful: a
  // place, a programme and a role. A name is per person by definition, and an
  // already-registered person is per row or not at all.
  const pilihanTetap: Partial<Record<Medan, Array<{ nilai: string; label: string }>>> = {
    node_id: tempat.map((x) => ({ nilai: x.id, label: x.nama })),
    programme_id: tempat.filter((x) => x.program).map((x) => ({ nilai: x.program!, label: x.nama })),
    role: PERAN_PENDATAAN.map((r) => ({ nilai: r, label: t(`role.${r}` as HleEvent, "staff", { locale }) })),
  };

  return (
    <div className="pin-data-baca">
      <section className="pin-sec" aria-labelledby="pin-unggah">
        <h2 id="pin-unggah">{s("pendataan.unggah.judul")}</h2>
        <p className="pin-mm">{s("pendataan.unggah.bentuk")}</p>
        {/* Readiness A1 (Daisy, 8 Nov; owner: «clear instructions, a valid example»): one list per class, a name column;
            the class is chosen once, after the list is read, never guessed from a «Kelas» column */}
        <p className="pin-mm" data-contoh-arti="">{s("pendataan.unggah.contoh_arti")}</p>
        <pre className="pin-mono pin-contoh-daftar" aria-label={s("pendataan.unggah.contoh_label")}>{s("pendataan.unggah.contoh")}</pre>

        {/* W3.7 (Batch 4; RV-22): the field frame of Daisy's TextField, its label in sentence case */}
        <div className="pin-bidang">
          <BidangBerkas
            id="pin-berkas" label={s("pendataan.unggah.berkas")} locale={locale}
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onPilih={(_fs, e) => dariBerkas(e)}
          />
        </div>

        <div className="pin-bidang">
          <label htmlFor="pin-tempel" className="pin-bidang-label">{s("pendataan.unggah.tempel")}</label>
          <textarea
            id="pin-tempel"
            rows={4}
            onChange={(e) => terima(e.target.value)}
            spellCheck={false}
          />
        </div>

        <p className={kisi ? "pin-meta" : "pin-empty"}>
          {kisi
            ? `${format.number(kisi.baris.length, locale)} ${s("pendataan.unggah.terbaca")}`
            : s("pendataan.unggah.kosong")}
        </p>
      </section>

      {kisi ? (
        <section className="pin-sec" aria-labelledby="pin-peta">
          <h2 id="pin-peta">{s("pendataan.peta.judul")}</h2>
          <p className="pin-mm">{s("pendataan.peta.sub")}</p>

          <dl className="pin-data-peta">
            {MEDAN.map((m) => {
              const kini = peta[m];
              const nilai = !kini ? "" : kini.jenis === "kolom" ? `k:${kini.kolom}` : `t:${kini.nilai}`;
              const tetap = pilihanTetap[m];
              return (
                <div key={m}>
                  <dt>
                    <label htmlFor={`pin-medan-${m}`}>{s(`pendataan.medan.${m}`)}</label>
                  </dt>
                  <dd>
                    <select id={`pin-medan-${m}`} value={nilai} onChange={(e) => ubah(m, e.target.value)}>
                      <option value="">{s("pendataan.peta.tidak")}</option>
                      <optgroup label={s("pendataan.peta.kolom")}>
                        {kisi.kepala.map((h, i) => (
                          <option key={`k${i}`} value={`k:${i}`}>{h || `#${i + 1}`}</option>
                        ))}
                      </optgroup>
                      {tetap && tetap.length > 0 ? (
                        <optgroup label={s("pendataan.peta.sama")}>
                          {tetap.map((o) => (
                            <option key={`t${o.nilai}`} value={`t:${o.nilai}`}>{o.label}</option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                  </dd>
                </div>
              );
            })}
          </dl>

          {/* WHAT PINTAR WILL ACTUALLY SEND, shown before it is sent. The first
              rows as mapped — not the file as uploaded — so a mapping that put
              the wrong column in the name is visible rather than discovered
              after a thousand people are recorded. */}
          <h3 className="pin-ml">{s("pendataan.peta.pratayang")}</h3>
          <ul className="pin-list pin-data-contoh">
            {baris.slice(0, 5).map((r, i) => (
              <li key={i}>
                <span className="pin-num">{format.number(i + 1, locale)}</span>
                <span>{r.display_name ?? "—"}</span>
              </li>
            ))}
          </ul>

          {!siap ? <p className="pin-msg pin-msg-note">{s("pendataan.peta.wajib")}</p> : null}

          <form action={aksi}>
            <input type="hidden" name="institusi" value={institusi} />
            <input type="hidden" name="baris" value={JSON.stringify(baris)} />
            <TombolKirim className="pin-btn pin-go pin-data-btn" disabled={!siap} sibuk={s("tombol.memproses")}>
              {s("pendataan.peta.lanjut")}
            </TombolKirim>
          </form>
        </section>
      ) : null}
    </div>
  );
}
