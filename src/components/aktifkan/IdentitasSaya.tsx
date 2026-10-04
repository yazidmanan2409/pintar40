import { t, type HleEvent, type Locale } from "@/lib/hle";
import { qrMatrix, qrSvgPath } from "@/lib/qr";
import { id44 } from "./jawaban";
import type { DataKartu } from "./kontrak";

/**
 * A STAFF MEMBER'S PINTAR IDENTITY, AS THEY SEE IT (DAISY-20): the welcome at
 * the end of activation and Akun saya draw the same panel from the same data
 * (BOB-26 §4, `GET /api/akun/kartu`).
 *
 * - The name is the current canonical name (D-077(6)).
 * - The PINTAR ID is shown 4 + 4 and is not a secret (IDENTITY-4.0 §4); it is
 *   one text node, so a copy gives «A14C D7ST» as displayed.
 * - The QR encodes `tautanId`, a pointer to the public ID page and never a
 *   credential (IDENTITY-4.0 §1). It is drawn inline, as the certificate's is,
 *   so nothing about the person leaves the page as an image request.
 * - The context lines are read at render time from current role assignments
 *   (D-059): a statement of where the person works, never an authority. The
 *   platform role has no school.
 *
 * STAFF ONLY (C17). Nothing calls this for a learner: the wizard shows it only
 * when the route said `staf`, and Akun saya refuses a reader with no staff role
 * before it asks for any data.
 *
 * The card itself — the PINTAR Digital Card of the card family — is DAISY-24's;
 * this panel is its data, plainly set.
 */
export default function IdentitasSaya({ locale, kartu }: { locale: Locale; kartu: DataKartu }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const { path, size } = qrSvgPath(qrMatrix(kartu.tautanId));
  return (
    <section className="pin-idn" aria-label={s("akun.id")}>
      <div className="pin-idn-teks">
        <p className="pin-idn-nama">{kartu.nama}</p>
        <p className="pin-eyebrow">{s("akun.id")}</p>
        <p className="pin-idn-id">{id44(kartu.pintarId)}</p>
        {kartu.konteks.length ? (
          <ul className="pin-idn-konteks">
            {kartu.konteks.map((k, i) => (
              <li key={i}>
                {s(`role.${k.peran}` as HleEvent)}
                {k.institusi ? <> · {k.institusi}</> : null}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="pin-meta">{s("akun.id_arti")}</p>
      </div>
      <div className="pin-qr pin-idn-qr">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={s("akun.qr")} shapeRendering="crispEdges">
          <path d={path} fill="var(--ink-1)" />
        </svg>
      </div>
    </section>
  );
}
