"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Locale, type Persona } from "@/lib/hle";
import type { Tur } from "@/lib/tur";

/**
 * BANTUAN — the panel behind the header control (§F).
 *
 * WHAT IS IN IT, AND WHAT IS NOT. The tour, by name, with its length and a way
 * back into it; the seven step headlines as a list, because that list IS the
 * map in one glance and reading it may be all somebody needed; and one
 * sentence about where else to ask. There is no contact detail, because PINTAR
 * has no institution help-desk field to draw one from and a placeholder
 * telephone number is a promise the school never made (§F-4).
 *
 * OPENING IT COSTS NOTHING. Replay is deliberate assistance: it calls none of
 * the three presentation verbs, so it cannot spend one of the person's three
 * automatic presentations, cannot un-finish a finished tour and cannot undo a
 * decision not to be interrupted. That is why "don't show this tour again" is
 * still honoured after somebody has replayed the tour ten times, and why the
 * panel keeps offering the tour to a person who suppressed it — suppression is
 * a decision about being interrupted, not a decision to lose the map.
 *
 * IT IS NOT MODAL (§O-2). The page behind it is not inert and not veiled, only
 * the canvas is repainted, because Help is somewhere you look while the page
 * stays where it was. The close control is in words on both layouts: the
 * design draws it on the phone sheet, and §K-11 asks for it everywhere.
 */
export default function PanelBantuan({
  tur,
  locale,
  persona,
  pernah,
  onMulai,
  onTutup,
}: {
  /** Null when this person has no tour of their own yet (§H-3, §H-6). */
  tur: Tur | null;
  locale: Locale;
  persona: Persona;
  /** Whether this person has met this tour before — it changes one label. */
  pernah: boolean;
  onMulai: (langkah: number) => void;
  onTutup: () => void;
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, persona, { locale });
  const judulRef = useRef<HTMLHeadingElement>(null);
  const [kotak, setKotak] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function ukur() {
      // On a phone this is a full-screen surface placed by the stylesheet, so
      // it is deliberately given no coordinates: an inline position would win
      // over the media query and leave it anchored to a control off the top of
      // its own sheet.
      const el = window.matchMedia("(max-width: 560px)").matches
        ? null
        : document.querySelector('[data-tur="bantuan"]');
      if (!el) {
        setKotak(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setKotak({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }
    ukur();
    window.addEventListener("resize", ukur);
    window.addEventListener("scroll", ukur, true);
    return () => {
      window.removeEventListener("resize", ukur);
      window.removeEventListener("scroll", ukur, true);
    };
  }, []);

  // Focus moves to the panel's own heading so the next thing read is where the
  // reader now is, not wherever the page happened to be — and on the way out it
  // goes back to the control that opened this, because a panel that closes and
  // leaves focus nowhere drops a keyboard reader at the top of the document.
  useEffect(() => {
    judulRef.current?.focus();
    return () => {
      const tombol = document.querySelector('[data-tur="bantuan"]');
      if (tombol instanceof HTMLElement) tombol.focus();
    };
  }, []);

  // Esc closes, and a press outside closes. Neither is the only way out: the
  // panel carries a close control in words.
  useEffect(() => {
    function tombol(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onTutup();
      }
    }
    let siap = false;
    const id = window.setTimeout(() => (siap = true), 0);
    function luar(e: Event) {
      if (!siap) return;
      const target = e.target as Element | null;
      if (target && (target.closest(".pin-bantuan") || target.closest(".pin-bantuan-tombol"))) return;
      onTutup();
    }
    window.addEventListener("keydown", tombol, true);
    window.addEventListener("pointerdown", luar, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", tombol, true);
      window.removeEventListener("pointerdown", luar, true);
    };
  }, [onTutup]);

  const posisi = kotak ? { top: kotak.top, right: kotak.right } : undefined;

  return (
    <div className="pin-bantuan" role="group" aria-labelledby="pin-bantuan-judul" style={posisi}>
      <div className="pin-bantuan-atas">
        <h2 id="pin-bantuan-judul" className="pin-bantuan-judul" tabIndex={-1} ref={judulRef}>
          {s("tur.bantuan.judul")}
        </h2>
        <button type="button" className="pin-bantuan-tutup" onClick={onTutup}>
          {s("tur.tutup")}
        </button>
      </div>

      {/* The tour itself. A read surface has no primary button (P5), so the way
          back in is a secondary one.

          ABSENT, NOT EMPTY, for somebody with no tour of their own: a Head of
          Department sees the rest of this panel and no tour card, rather than a
          card offering a map of the educator's page. The panel is still worth
          opening — it says where else to ask. */}
      {tur ? (
        <>
          <div className="pin-bantuan-kartu">
            <p className="pin-eyebrow">{s("tur.tur")}</p>
            <p className="pin-bantuan-nama">{s(tur.nama)}</p>
            <p className="pin-sub">{s("tur.bantuan.langkah7")}</p>
            <button type="button" className="pin-btn" onClick={() => onMulai(0)}>
              {s(pernah ? "tur.bantuan.mulai_lagi" : "tur.bantuan.mulai")}
            </button>
          </div>

          {/* The seven headlines. Reading them may be the whole of the help that
              was needed, which is why they are the panel's largest block. */}
          <p className="pin-bantuan-atau">{s("tur.bantuan.atau")}</p>
          <ol className="pin-bantuan-daftar">
            {tur.langkah.map((l, i) => (
              <li key={l.posisi}>
                <button type="button" className="pin-bantuan-baris" onClick={() => onMulai(i)}>
                  <span className="pin-num pin-bantuan-no" aria-hidden="true">{l.posisi}</span>
                  <span>{s(l.judul)}</span>
                </button>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      <div className="pin-bantuan-kartu">
        <p className="pin-bantuan-nama">{s("tur.bantuan.lain")}</p>
        <p className="pin-sub">
          {s(persona === "educator" ? "tur.bantuan.sekolah" : "tur.bantuan.guru")}
        </p>
      </div>
    </div>
  );
}
