"use client";

import { useId, useState } from "react";
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
 */
export default function TanggalDenganGema({
  jenis = "date", id: idLuar, name, defaultValue, required, min, max, disabled, className = "pin-input",
  keterangan, locale, untuk = "staff",
}: {
  /** "date" for a day; "datetime-local" for a day and a time (on Jakarta's clock, WIB). */
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
  locale: Locale;
  untuk?: Persona;
}) {
  const auto = useId();
  const id = idLuar ?? `tanggal-${auto.replace(/:/g, "")}`;
  const [nilai, setNilai] = useState(defaultValue ?? "");
  const kata = gemaTanggal(nilai, locale);
  const idGema = `${id}-gema`;

  return (
    <>
      <input
        className={className} id={id} type={jenis} name={name} defaultValue={defaultValue} required={required}
        min={min} max={max} disabled={disabled} aria-describedby={keterangan ? `${idGema} ${keterangan}` : idGema}
        onInput={(e) => setNilai(e.currentTarget.value)} onChange={(e) => setNilai(e.currentTarget.value)}
      />
      <p className="pin-gema" aria-live="polite">
        <Ikon nama="calendar" />
        <span id={idGema} className={kata ? undefined : "is-kosong"}>{kata || t("tanggal.belum", untuk, { locale })}</span>
      </p>
    </>
  );
}
