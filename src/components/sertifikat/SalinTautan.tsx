"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/hle";

/**
 * Copy the verification link.
 *
 * It copies what is already on the screen and tells the reader it did. It
 * records nothing: a learner sharing their own certificate is not an event
 * PINTAR has any business writing down, and there is no endpoint behind this
 * button to write one.
 */
export default function SalinTautan({ url, locale }: { url: string; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        className="pin-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            // A browser that refuses the clipboard leaves the link visible
            // beside the code, which is where it was going to be read from
            // anyway. Nothing is lost and nothing is claimed.
          }
        }}
      >
        {t("sertifikat.salin", "learner", { locale })}
      </button>
      <span className="pin-meta" aria-live="polite">
        {copied ? t("sertifikat.tersalin", "learner", { locale }) : ""}
      </span>
    </>
  );
}
