import type { InputHTMLAttributes } from "react";

/**
 * W1.3 (Batch 3) · ONE TEXT FIELD, AS DAISY DRAWS IT (components/TextField): its label above, the help under the label,
 * then the field; the field's aria-describedby names the help. Only an optional field is marked, with the copy table's
 * «(opsional)» given by the caller. Every word is the caller's (hle.ts); name, type, min, step, required and
 * defaultValue pass through unchanged, so the action reads the same form as before.
 *
 * Server-safe (no state): Aturan Asesmen's numbers are drawn with it.
 */
export default function BidangTeks({
  id, label, petunjuk, opsional, className = "pin-input", ...isian
}: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "children"> & {
  id: string;
  label: string;
  /** What the field is for, and its limit: under the label, named by the field. */
  petunjuk?: string | null;
  /** The «(opsional)» mark, for an optional field only. */
  opsional?: string | null;
}) {
  const idPetunjuk = petunjuk ? `${id}-petunjuk` : undefined;
  return (
    <div className="pin-bidang">
      <label htmlFor={id} className="pin-bidang-label">
        {label}{opsional ? <span className="pin-opsional"> {opsional}</span> : null}
      </label>
      {petunjuk ? <p id={idPetunjuk} className="pin-hint">{petunjuk}</p> : null}
      <input id={id} className={className} aria-describedby={idPetunjuk} {...isian} />
    </div>
  );
}
