"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale } from "@/lib/hle";

type Orang = { person_id: string; display_name: string; institutional_id: string; institution_id: string };
type Hasil = { ok: boolean; card?: string; pin?: string; detail?: string | null };

/**
 * The activation controls. Each press is one POST to /api/akun/aktivasi; the
 * database decides and the route creates the identity. A classroom card's
 * number and PIN come back ONCE and are shown here only — they are not stored
 * anywhere PINTAR can show them again, so the screen says to write them down.
 */
export default function FormAktivasi({ locale, orang, adminSistem }: {
  locale: Locale; orang: Orang[]; adminSistem: boolean;
}) {
  const router = useRouter();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [surel, setSurel] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<Record<string, Hasil>>({});
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [baru, setBaru] = useState({ nama: "", surel: "" });

  async function kirim(key: string, body: Record<string, string>) {
    setSibuk(key);
    try {
      const res = await fetch("/api/akun/aktivasi", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const r = (await res.json().catch(() => ({ ok: false }))) as Hasil;
      setHasil((h) => ({ ...h, [key]: r }));
      if (r.ok && !r.card) router.refresh();
    } catch {
      setHasil((h) => ({ ...h, [key]: { ok: false } }));
    } finally {
      setSibuk(null);
    }
  }

  return (
    <>
      {orang.length === 0 ? (
        <p className="pin-meta">{s("aktivasi.kosong")}</p>
      ) : (
        <ul className="pin-daftar">
          {orang.map((o) => {
            const h = hasil[o.person_id];
            return (
              <li key={o.person_id} className="pin-card">
                <p><strong>{o.display_name}</strong> · <span className="pin-num">{o.institutional_id}</span></p>
                {h?.ok && h.card ? (
                  <p role="status">
                    {s("aktivasi.kartu_dibuat")} <strong className="pin-num">{h.card}</strong> · PIN{" "}
                    <strong className="pin-num">{h.pin}</strong>
                  </p>
                ) : (
                  <div className="pin-actions">
                    <label>
                      <span className="pin-meta">{s("aktivasi.surel")}</span>
                      <input type="email" value={surel[o.person_id] ?? ""}
                        onChange={(e) => setSurel((x) => ({ ...x, [o.person_id]: e.target.value }))} />
                    </label>
                    <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null}
                      onClick={() => void kirim(o.person_id, { mode: "EMAIL", person_id: o.person_id, email: surel[o.person_id] ?? "" })}>
                      {s("aktivasi.dengan_surel")}
                    </button>
                    <button type="button" className="pin-btn" disabled={sibuk !== null}
                      onClick={() => void kirim(o.person_id, { mode: "CLASSROOM_CARD", person_id: o.person_id })}>
                      {s("aktivasi.dengan_kartu")}
                    </button>
                  </div>
                )}
                {h && !h.ok && <p className="pin-meta" role="status">{s("aktivasi.gagal")}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {adminSistem && (
        <section className="pin-card">
          <h2>{s("aktivasi.baru.judul")}</h2>
          <p className="pin-meta">{s("aktivasi.baru.arti")}</p>
          <div className="pin-actions">
            <label>
              <span className="pin-meta">{s("aktivasi.baru.nama")}</span>
              <input value={baru.nama} onChange={(e) => setBaru((b) => ({ ...b, nama: e.target.value }))} />
            </label>
            <label>
              <span className="pin-meta">{s("aktivasi.surel")}</span>
              <input type="email" value={baru.surel} onChange={(e) => setBaru((b) => ({ ...b, surel: e.target.value }))} />
            </label>
            <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null}
              onClick={() => void kirim("baru", { mode: "NEW_PERSON", display_name: baru.nama, email: baru.surel })}>
              {s("aktivasi.baru.tombol")}
            </button>
          </div>
          {hasil.baru && (
            <p className="pin-meta" role="status">{s(hasil.baru.ok ? "aktivasi.baru.ok" : "aktivasi.gagal")}</p>
          )}
        </section>
      )}
    </>
  );
}
