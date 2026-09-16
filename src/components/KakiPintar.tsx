/**
 * The application footer: who stands behind PINTAR.
 *
 * PROVENANCE, NOT PROMOTION. Four lines in the quietest register the type
 * ladder has, below a hairline, at the end of the page — the shape a colophon
 * takes, not a band that competes with the work above it. No icons, no social
 * links, no slogan, no copyright line, no legal claim: nothing Yazid did not
 * supply, because a footer that grows on its own is how an application starts
 * looking like a corporate site.
 *
 * NOTHING HERE PASSES THROUGH THE HLE, AND THAT IS THE POINT. A person's name,
 * their academic credentials, a company's registered name, an email address and
 * a domain are proper nouns: they are the same string in Indonesian and in
 * English, and routing them through a copy table would create two keys that
 * must never diverge — a divergence the bilingual tests would then have to
 * police. They are constants because they are constants. UX1-S1-KAKI-01 asserts
 * that they render byte-identically in both languages.
 *
 * `pin-noprint` is applied where this mounts, not here, so a caller can compose
 * it — but every current caller prints certificates, and none of them prints
 * this. A printed credential carries its ISSUING INSTITUTION's identity. The
 * software vendor's name on the same sheet would be a second claimant to the
 * provenance of the evidence, which is the one thing a certificate may not be
 * ambiguous about.
 */

/** Registered identity, supplied by Yazid. Proper nouns; never translated. */
const PENANGGUNG_JAWAB = "Dr. dr. Gladys DT Tubarad, M.Pd.Ked";
const BADAN_HUKUM = "PT ZAYD PINTAR SELALU";
const SUREL = "info@pintarselalu.com";
const RANAH = "pintarselalu.com";

export default function KakiPintar({ className = "" }: { className?: string }) {
  return (
    <footer className={`pin-kaki ${className}`.trim()}>
      <span className="pin-orang">{PENANGGUNG_JAWAB}</span>
      <span className="pin-badan">{BADAN_HUKUM}</span>
      <span className="pin-hubungi">
        <a href={`mailto:${SUREL}`}>{SUREL}</a>
        {/* The protocol is in the href where a browser needs it, and out of the
            visible text where a reader does not. `rel="noreferrer"` because the
            page a stranger opens from a verification link has no business
            announcing where they came from. */}
        <a href={`https://${RANAH}`} target="_blank" rel="noreferrer">{RANAH}</a>
      </span>
    </footer>
  );
}
