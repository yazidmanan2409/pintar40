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
 */
export default function KodeVerifikasi({ url, label }: { url: string; label: string }) {
  const { path, size } = qrSvgPath(qrMatrix(url));
  return (
    <div className="pin-qr">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <path d={path} fill="var(--ink-1)" />
      </svg>
    </div>
  );
}
