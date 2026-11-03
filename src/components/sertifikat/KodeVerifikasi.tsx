import { qrMatrix, qrSvgPath } from "@/lib/qr";

/**
 * The verification QR, inline as one SVG path.
 *
 * Inline rather than an <img>, for two reasons that are both about what leaves
 * the page: an image URL carrying a verification token would be a request to
 * somewhere, and a raster would print at the screen's resolution rather than
 * the printer's. The path is computed on the server from the link itself.
 *
 * `shapeRendering="crispEdges"` because a QR module is a square, and a browser
 * that anti-aliases the boundary between two modules is making the symbol
 * harder for a camera to read, not softer.
 *
 * TWO DRAWINGS OF ONE LINK. On screen, the card's tile at level M. On the
 * printed sheet (`cetak`), Daisy's symbol: byte mode at level Q (D-160(b)), its
 * modules exactly 26 mm in PINTAR green, its 4-module quiet zone clear paper
 * (`.pin-s-qr`). The link is the same in both.
 */
export default function KodeVerifikasi({ url, label, cetak = false }: { url: string; label: string; cetak?: boolean }) {
  const { path, size } = qrSvgPath(qrMatrix(url, cetak ? "Q" : "M"));
  return (
    <div className={cetak ? "pin-s-qr" : "pin-qr"}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <path d={path} fill={cetak ? "var(--pintar-primary)" : "var(--ink-1)"} />
      </svg>
    </div>
  );
}
