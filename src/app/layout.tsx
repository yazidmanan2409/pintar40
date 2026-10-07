import type { Metadata } from "next";
import "./globals.css";
import { t } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import EvaluationBanner from "./_evaluation-banner";
import PenjagaSesi from "@/components/PenjagaSesi";
import PitaPemeliharaan from "@/components/pemeliharaan/PitaPemeliharaan";

export const metadata: Metadata = {
  title: t("app.name", "public"),
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
        {/* Rendered from the evaluation session on every page, so the indicator
            cannot be lost on refresh or dismissed (ADR-0020). */}
        <EvaluationBanner />
        {/* #148: planned maintenance from T-60 and live notices, read once per page; the browser times the rest */}
        <PitaPemeliharaan locale={locale} />
        {children}
        {/* BOB-29: the inactivity clock of a shared computer or a class card; nothing for anybody else. */}
        <PenjagaSesi locale={locale} />
      </body>
    </html>
  );
}
