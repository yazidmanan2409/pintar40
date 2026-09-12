import type { Metadata } from "next";
import "./globals.css";
import { t } from "@/lib/hle";

export const metadata: Metadata = {
  title: t("app.name", "public"),
  description: "Belajar dengan tenang. Bukti yang bisa dipercaya.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-surface-0 text-ink-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
