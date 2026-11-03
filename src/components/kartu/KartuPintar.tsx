import { t, type HleEvent, type Locale } from "@/lib/hle";
import { qrMatrix, qrSvgPath } from "@/lib/qr";
import { tampilPintarId, type DataKartu } from "@/lib/aktivasi-kontrak";
import { susunKartu } from "@/lib/kartu-pintar";
import MerekKartu from "./MerekKartu";

/**
 * W3.20 / DAISY-24 / CR-21 — THE PINTAR DIGITAL CARD, FRONT AND BACK, to the frozen design
 * (docs/coordination/ux/kartu-pintar/ronde-2 §K, §1, §5–§8, §L; D-074 and its addendum; D-120 Q16).
 *
 * HOW IT IS DRAWN, AND WHY. HTML and CSS in physical units, scaled by one unit: each face is laid out in the design's
 * own millimetres, every length written as `calc(var(--kp-mm) * <mm>)`, and `--kp-mm` is the face's width divided by
 * 85.6 (container query units). Printed, the face is exactly 85.6 mm wide, so `--kp-mm` is exactly 1 mm and the card
 * is CR80 at actual size; on screen the same numbers scale to the column, so the two can never drift apart. HTML
 * rather than SVG text because the name and the school wrap (ronde-2 §5: a long name takes two lines and grows
 * upward; a long school wraps), which SVG text cannot do; the QR modules are inline SVG, vectors at any size.
 *
 * WHAT IT SHOWS is exactly the card's data and nothing else (ronde-2 §1: no icon, badge, PHOTO, date, signature,
 * «official» label or security claim; D-085 T4, D-086(e), D-159(d)): the wordmark slot, the current name, the PINTAR ID
 * 4 + 4 (one text node, IDENTITY-4.0 §4), the role and school contexts in the card's order (src/lib/kartu-pintar.ts),
 * and on the back the QR of `tautanId` (the public ID page, never a credential) with the instruction and the address.
 * It takes `DataKartu` and nothing else, so it cannot reach a photograph; its only images are the wordmark slot and
 * the QR.
 *
 * STAFF ONLY in 4.0 (C17): it draws what my_identity_card answered, which refuses anyone who is not staff. A
 * learner's class card (aktivasi/LembarKartu) is a different object and does not use this.
 *
 * The face is Bahasa Indonesia only (ronde-2, «Already decided by Yazid»), so it carries `lang="id"`; the names of
 * the faces and of the QR follow the page's language.
 */
/**
 * The web address on the back (ronde-2 §6, KATA_BELAKANG.situs). A domain is a proper noun, the same string in both
 * languages, so it is a constant and never passes through the copy table (as KakiPintar's RANAH); it is an address,
 * never a brand name (the Wordmark card's brand architecture).
 */
const RANAH = "pintarselalu.com";

export default function KartuPintar({ locale, kartu }: { locale: Locale; kartu: DataKartu }) {
  const a = (k: HleEvent) => t(k, "staff", { locale });
  const muka = (k: HleEvent) => t(k, "staff", { locale: "id" });
  const susunan = susunKartu(kartu.konteks);
  const { path, size } = qrSvgPath(qrMatrix(kartu.tautanId));
  const id = tampilPintarId(kartu.pintarId);
  // the symbol with its full 4-module quiet zone, on the tile's own ground (ronde-2 §7)
  const tenang = 4;
  return (
    <div className="pin-kd" data-pasangan={susunan.pasangan} data-pengecualian={susunan.lebihDariDua ? "lebih-dari-dua" : undefined}>
      <div className="pin-kd-wadah" role="group" aria-label={a("akun.kartu.depan")}>
        <div className="pin-kd-muka pin-kd-depan" lang="id" data-keluarga={susunan.keluarga ?? undefined}>
          <div className="pin-kd-bidang" aria-hidden="true" />
          <div className="pin-kd-garis" aria-hidden="true" />
          <MerekKartu />
          <div className="pin-kd-orang">
            <p className="pin-kd-nama">{kartu.nama}</p>
            <p className="pin-kd-id pin-idn-id">{id}</p>
          </div>
          {susunan.baris.length ? (
            <ul className="pin-kd-bab">
              {susunan.baris.map((b, i) => (
                <li key={i} className="pin-kd-bab-baris">
                  {b.peran ? <span className="pin-kd-peran">{b.peran}</span> : null}
                  {b.sekolah ? <span className="pin-kd-sekolah">{b.peran ? ` · ${b.sekolah}` : b.sekolah}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="pin-kd-wadah" role="group" aria-label={a("akun.kartu.belakang")}>
        <div className="pin-kd-muka pin-kd-belakang" lang="id">
          <div className="pin-kd-garis" aria-hidden="true" />
          <div className="pin-kd-ubin">
            <svg viewBox={`${-tenang} ${-tenang} ${size + 2 * tenang} ${size + 2 * tenang}`} role="img" aria-label={a("akun.qr")} shapeRendering="crispEdges">
              <path d={path} fill="currentColor" />
            </svg>
            <p className="pin-kd-id pin-kd-id-ubin" aria-hidden="true">{id}</p>
          </div>
          <p className="pin-kd-petunjuk">{muka("akun.kartu.petunjuk")}</p>
          <p className="pin-kd-situs">{RANAH}</p>
        </div>
      </div>
    </div>
  );
}
