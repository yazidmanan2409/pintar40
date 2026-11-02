import type { Metadata } from "next";
import "./globals.css";
import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import EvaluationBanner from "./_evaluation-banner";
import PenjagaSesi from "@/components/PenjagaSesi";
import FokusRute from "@/components/FokusRute";
import PitaPemeliharaan from "@/components/pemeliharaan/PitaPemeliharaan";

export const metadata: Metadata = {
  // W3.1: each page names itself (src/lib/judul-halaman.ts); «PINTAR» alone only where a page does not
  title: { template: `%s · ${t("app.name", "public")}`, default: t("app.name", "public") },
  description: "Belajar dengan tenang. Bukti yang bisa dipercaya.",
};

/**
 * `lang` is read server-side from the interface-language cookie (S0.3), so the
 * document declares the language it is actually written in on the first paint —
 * which is what a screen reader announces and what a browser offers to
 * translate. A client-side correction after hydration would be too late for
 * both.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await currentLocale();
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-surface-0 text-ink-1">
        {/* W3.1 (WCAG 2.4.1): «Langsung ke isi», the first focusable thing on every page; each page's
            <main> is #isi. Out of sight until it has focus (Daisy's skip link, 06-accessibility). */}
        {/* the Tab starting point after a navigation inside PINTAR, just before the skip link (FokusRute) */}
        <FokusRute />
        <a href="#isi" className="pin-lewati pin-noprint">{t("aksesibilitas.lewati", "public", { locale })}</a>
        {/* Rendered from the evaluation session on every page, so the indicator
            cannot be lost on refresh or dismissed (ADR-0020). */}
        <EvaluationBanner />
        {/* #148: planned maintenance from T-60 and live notices, read once per page; the browser times the rest */}
        <PitaPemeliharaan locale={locale} />
        {/* BOB-29: the inactivity clock of a shared computer or a class card; nothing for anybody else. W3.14: its
            warning stands at the top of the page, in the flow, so it never covers the work (Daisy, IdleWarning). */}
        <PenjagaSesi locale={locale} />
        {children}
      </body>
    </html>
  );
}
