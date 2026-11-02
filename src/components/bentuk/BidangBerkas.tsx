"use client";

import { useId, useState, type ChangeEvent } from "react";
import { t, type Locale, type Persona } from "@/lib/hle";
import Ikon from "@/components/Ikon";

/**
 * W3.3 · FileField (Batch 2; Daisy, components/FileField; closes RV-5 «Choose File / No file chosen»).
 *
 * The native input does the picking (keyboard, screen reader, a phone's camera or files), lying transparent over its
 * button «Pilih berkas», so the browser's own words never show. Beneath: what was chosen, in words («Belum dipilih»
 * before), announced politely; the limit is said before anything is chosen; a wrong file is told under the field, in the
 * Text field's error pattern (described by it, aria-invalid; never a second announcement, DAISY-18), and the choice
 * stays so it can be replaced. The field's own label names the input (WCAG 1.3.1, 4.1.2).
 */
export default function BidangBerkas({
  label, accept, batas, multiple = false, name, galat, onPilih, locale, untuk = "staff", id: idLuar, required, disabled,
}: {
  label: string;
  accept?: string;
  /** The limit line, said before a choice («Paling besar 10 MB»). */
  batas?: string;
  multiple?: boolean;
  name?: string;
  /** A wrong file, in words; shown under the field in the error pattern. */
  galat?: string | null;
  onPilih?: (berkas: File[], e: ChangeEvent<HTMLInputElement>) => void;
  locale: Locale;
  untuk?: Persona;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, untuk, { locale });
  const auto = useId();
  const id = idLuar ?? `berkas-${auto.replace(/:/g, "")}`;
  const [nama, setNama] = useState<string[]>([]);
  const terangkan = [`${id}-nama`, batas ? `${id}-batas` : null, galat ? `${id}-galat` : null].filter(Boolean).join(" ");

  return (
    <div className="pin-berkas" data-berkas>
      <span className="pin-berkas-judul" id={`${id}-label`}>{label}</span>
      <span className="pin-berkas-tombol">
        <input
          id={id} type="file" accept={accept} name={name} multiple={multiple} required={required} disabled={disabled}
          aria-labelledby={`${id}-label`} aria-describedby={terangkan} aria-invalid={galat ? true : undefined}
          onChange={(e) => {
            const fs = Array.from(e.target.files ?? []);
            setNama(fs.map((f) => f.name));
            onPilih?.(fs, e);
          }}
        />
        <label htmlFor={id} className="pin-btn" aria-hidden="true">
          <Ikon nama="upload" />{s("berkas.pilih")}
        </label>
      </span>
      <p className="pin-berkas-nama" id={`${id}-nama`} aria-live="polite">
        <Ikon nama="file" />
        <span>{nama.length === 0 ? s("berkas.belum") : nama.length === 1 ? nama[0] : s("berkas.banyak").replace("{n}", String(nama.length)).replace("{nama}", nama.join(", "))}</span>
      </p>
      {batas ? <p className="pin-hint" id={`${id}-batas`}>{batas}</p> : null}
      {galat ? <p className="pin-berkas-galat" id={`${id}-galat`}>{galat}</p> : null}
    </div>
  );
}
