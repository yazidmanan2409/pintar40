import { t, type Locale } from "@/lib/hle";

export type Lingkup = {
  /** The institution's mark. Q-7: there is no column for one yet. */
  markUrl?: string | null;
  institution?: string | null;
  /** The node path, outermost first. Presentation only; never authority. */
  path?: string[];
  period?: string | null;
};

/**
 * BarisLingkup — the scope line: whose institution, which node, which period.
 *
 * THE MARK SLOT RENDERS NOTHING WHEN THERE IS NO MARK (Q-7). Not a grey square,
 * not initials in a circle, not a PINTAR logo standing in for the school's.
 * A placeholder mark on a certificate is a claim about an institution that the
 * institution did not make, and the confirmed finding Q-7 is precisely that no
 * column carries one yet. When the column arrives, `markUrl` starts arriving
 * with it and this component is already ready for it.
 *
 * NOTE THAT THIS IS A DIFFERENT MARK FROM THE ONE IN THE HEADER. The ruling of
 * 2026-09-17 (claude/UX-1-INSTITUTION-MARK-RULING.md §2.5) keeps application-
 * shell branding and credential issuer identity apart permanently: an
 * institution's mark appearing in the shell does not thereby appear on its
 * certificates, and whatever is in the header decorates no claim about who
 * issued what.
 */
export default function BarisLingkup({
  scope,
  locale = "id",
}: {
  scope: Lingkup;
  locale?: Locale;
}) {
  const parts = [
    scope.institution,
    ...(scope.path ?? []),
    scope.period,
  ].filter((x): x is string => Boolean(x && x.trim()));

  if (parts.length === 0 && !scope.markUrl) return null;

  return (
    <div className="pin-scope">
      {scope.markUrl ? (
        <span className="pin-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={scope.markUrl} alt={scope.institution ?? t("app.name", "public", { locale })} height={20} />
        </span>
      ) : null}
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} style={{ display: "contents" }}>
          {i > 0 ? <span className="pin-sep" aria-hidden="true">/</span> : null}
          <span>{part}</span>
        </span>
      ))}
    </div>
  );
}
