import Link from "next/link";
import { currentViewer } from "@/lib/auth";
import { s, studioInstitutions } from "./_lib";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import SesiSaya from "@/components/SesiSaya";

/**
 * Studio shell (FABLE-05 §1, §12).
 *
 * A viewer with no Studio capability in any institution gets one calm refusal,
 * never a half-rendered page with dead controls. The refusal is decided by the
 * database's own capability answer, not by the display role.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  const viewer = await currentViewer();
  const institutions = viewer ? await studioInstitutions() : [];

  if (!viewer || institutions.length === 0) {
    // S0.5: the ONE refusal page. The decision above is unchanged — the
    // database's capability answer still decides, and this branch is reached on
    // exactly the same condition as before. Only the telling moved.
    return (
      <HalamanPenolakan
        messageKey="studio.refused"
        persona="staff"
        locale={locale}
        backHref="/"
        backKey="entry.title"
      />
    );
  }

  const nav: Array<[string, string]> = [
    ["/studio", s("studio.nav.beranda")],
    ["/studio/unggah", s("studio.nav.unggah")],
    ["/studio/tinjau", s("studio.nav.tinjau")],
    ["/studio/kanonik", s("studio.nav.kanonik")],
    ["/studio/kuis", s("studio.nav.kuis")],
    ["/studio/definisi", s("studio.nav.definisi")],
    ["/studio/bank", s("studio.nav.bank")],
    ["/studio/integritas", s("studio.nav.integritas")],
    ["/studio/sertifikat", s("studio.nav.sertifikat")],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        {/* DAISY-02: who is signed in and the way out, beside the title. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-3">{s("app.name")}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{s("studio.title")}</h1>
          </div>
          <SesiSaya locale={locale} persona="staff" sebut />
        </div>
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
