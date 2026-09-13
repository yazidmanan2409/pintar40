import Link from "next/link";
import { currentViewer } from "@/lib/auth";
import { s, studioInstitutions } from "./_lib";

/**
 * Studio shell (FABLE-05 §1, §12).
 *
 * A viewer with no Studio capability in any institution gets one calm refusal,
 * never a half-rendered page with dead controls. The refusal is decided by the
 * database's own capability answer, not by the display role.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const viewer = await currentViewer();
  const institutions = viewer ? await studioInstitutions() : [];

  if (!viewer || institutions.length === 0) {
    return (
      <main className="mx-auto max-w-md py-16">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{s("studio.refused")}</h1>
        <p className="mt-4"><Link href="/">← {s("entry.title")}</Link></p>
      </main>
    );
  }

  const nav: Array<[string, string]> = [
    ["/studio", s("studio.nav.beranda")],
    ["/studio/unggah", s("studio.nav.unggah")],
    ["/studio/tinjau", s("studio.nav.tinjau")],
    ["/studio/kanonik", s("studio.nav.kanonik")],
    ["/studio/definisi", s("studio.nav.definisi")],
    ["/studio/bank", s("studio.nav.bank")],
    ["/studio/integritas", s("studio.nav.integritas")],
    ["/studio/sertifikat", s("studio.nav.sertifikat")],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm text-ink-3">{s("app.name")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{s("studio.title")}</h1>
        <nav className="mt-4 flex flex-wrap gap-3 text-sm">
          {nav.map(([href, text]) => (
            <Link key={href} href={href} className="text-ink-2 underline-offset-4 hover:underline">{text}</Link>
          ))}
        </nav>
      </header>
      {children}
    </main>
  );
}
