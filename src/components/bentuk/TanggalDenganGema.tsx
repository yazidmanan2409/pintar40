"use client";

import { useEffect, useId, useRef, useState } from "react";
import { t, type Locale, type Persona } from "@/lib/hle";
import { gemaTanggal } from "@/lib/tanggal";
import Ikon from "@/components/Ikon";

/**
 * W3.3 · Date and time with its echo (Batch 2; Daisy, components/DateTime; RV-16).
 *
 * PINTAR cannot set how a native date field shows its value (the computer's language decides: 9 October reads
 * «10/09/2026» on an English-US computer), so the field stays native (keyboard, screen reader, a phone's picker) and
 * PINTAR says the date itself, right under it: «Jumat, 9 Okt 2026», or «Jumat, 9 Okt 2026, 07.30 WIB» for a time;
 * «Belum ada tanggal.» when empty. The echo is built from the field's value (yyyy-mm-dd, the same in every browser),
 * never from what the field displays; it is announced politely, and the field's aria-describedby names it first.
 *
 * The field's own label is the caller's (`<label htmlFor={id}>`). name, id, defaultValue, required, min and max pass
 * through unchanged, so a server action's form reads the same value as before.
 *
 * Batch 3 · W3.11 (Daisy, J5Jendela): `kosong` is what an empty optional field means, said in the echo in place of
 * «Belum ada tanggal.» («Tanpa batas akhir» under Siapkan's «Sampai»). `galat` is the server's own sentence about
 * this field, drawn under it with the alert icon: the field is marked invalid and names the sentence after its echo,
 * focus is put on the field when the page arrives with it, and correcting the date clears it.
 *
 * E-K9: `disabled` means the value is fixed (Siapkan after «Disediakan»): it is drawn as text, not as a field.
 */
export default function TanggalDenganGema({
  jenis = "date", id: idLuar, name, defaultValue, required, min, max, disabled, className = "pin-input",
  keterangan, kosong, galat, locale, untuk = "staff", zona,
}: {
  /** "date" for a day; "datetime-local" for a day and a time (on the clock of `zona`; WIB when none). */
  jenis?: "date" | "datetime-local";
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  /** Further ids that describe the field, read after the echo. */
  keterangan?: string;
  /** The echo of an empty field, when empty means something («Tanpa batas akhir»); «Belum ada tanggal.» otherwise. */
  kosong?: string;
  /** The server's sentence about this field (a refusal), drawn under it until the date is changed. */
  galat?: string;
  locale: Locale;
  untuk?: Persona;
  /** The zone a time typed here is read in (the school the form is for; the owner's ruling, 10 Nov): its echo's word. */
  zona?: string | null;
}) {
  const auto = useId();
  const id = idLuar ?? `tanggal-${auto.replace(/:/g, "")}`;
  const [nilai, setNilai] = useState(defaultValue ?? "");
  const kata = gemaTanggal(nilai, locale, zona);
  const idGema = `${id}-gema`;
  const idGalat = `${id}-galat`;
  const [diubah, setDiubah] = useState(false);
  const salah = Boolean(galat) && !diubah;
  const kolom = useRef<HTMLInputElement>(null);
  // the refusal arrives with the page: focus goes to the field it is about, which reads it after its echo
  useEffect(() => {
    if (galat) kolom.current?.focus();
  }, [galat]);
  const ubah = (v: string) => {
    setNilai(v);
    if (galat) setDiubah(true);
  };
  const dijelaskan = [idGema, salah ? idGalat : "", keterangan ?? ""].filter(Boolean).join(" ");

  // E-K9 (D-173(d)): a date that can no longer change is a fact, not a field. It is said as text through the date
  // helper (the echo's words), never drawn as a disabled field showing the computer's format of a value nobody can
  // change. <output> keeps the caller's <label htmlFor> valid; a disabled field was never sent, so nothing is lost.
  if (disabled) {
    return (
      <p className="pin-gema" data-tetap="">
        <Ikon nama="calendar" />
        <output id={id} className={kata ? undefined : "is-kosong"}>{kata || kosong || t("tanggal.belum", untuk, { locale })}</output>
      </p>
    );
  }

  return (
    <>
      <input
        ref={kolom} className={className} id={id} type={jenis} name={name} defaultValue={defaultValue} required={required}
        min={min} max={max} disabled={disabled} aria-describedby={dijelaskan} aria-invalid={salah ? "true" : undefined}
        onInput={(e) => ubah(e.currentTarget.value)} onChange={(e) => ubah(e.currentTarget.value)}
      />
      <p className="pin-gema" aria-live="polite">
        <Ikon nama="calendar" />
        <span id={idGema} className={kata ? undefined : "is-kosong"}>{kata || kosong || t("tanggal.belum", untuk, { locale })}</span>
      </p>
      {salah ? (
        <p className="pin-galat-bidang" id={idGalat}>
          <Ikon nama="circle-alert" />
          <span>{galat}</span>
        </p>
      ) : null}
    </>
  );
}
