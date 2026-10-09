import TabStudioNav from "@/components/studio/TabStudio";
import { currentViewer } from "@/lib/auth";
import { s, studioInstitutions, tabSaya } from "./_lib";
import { type TabStudio } from "@/lib/studio-tab";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { currentLocale } from "@/lib/locale";
import { navKonteks } from "@/components/NavKonteks";
import { CangkangStaf } from "@/components/CangkangPengalaman";
import ItemNav from "@/components/ItemNav";
import { t } from "@/lib/hle";

/**
 * Studio shell (FABLE-05 §1, §12).
 *
 * A viewer with no Studio capability in any institution gets one calm refusal,
 * never a half-rendered page with dead controls. The refusal is decided by the
 * database's own capability answer, not by the display role.
 */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  // The viewer, for the gate below; the shell reads the reader and their roles itself (D-138 step 3).
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
        backKey="galat.beranda"
      />
    );
  }

  // DAISY-03: Studio was a dead end -- no way back to the person's own places
  // but the browser's back button. Offered, never granted (D-010). L3: the active
  // context's other surfaces and the chooser (NavKonteks), never every role's.

  // CR-87 (D-127 Q4, Q8; D-129(g)): each tab only for the people its canon names (src/lib/studio-tab.ts). Studio's own
  // Uji Cepat launcher and the certificate layout are gone (CR-84): the class's Uji Cepat is the one human journey.
  const TAB: Record<TabStudio, [string, string]> = {
    beranda: ["/studio", s("studio.nav.beranda")],
    unggah: ["/studio/unggah", s("studio.nav.unggah")],
    tinjau: ["/studio/tinjau", s("studio.nav.tinjau")],
    kanonik: ["/studio/kanonik", s("studio.nav.kanonik")],
    definisi: ["/studio/definisi", s("studio.nav.definisi")],
    bank: ["/studio/bank", s("studio.nav.bank")],
    integritas: ["/studio/integritas", s("studio.nav.integritas")],
  };
  // L3 (D-132 C8): the tabs of the grants that give the active purpose, in the active place (studio/_lib.ts)
  const nav = (await tabSaya()).map((t) => TAB[t]);

  return (
    <>
    {/* D-138 step 3: the staff shell (AppShell). The reader's other places are the active context's (NavKonteks);
        the reader, «Laporkan masalah», the language and the way out are the shell's (DAISY-02, DAISY-12). */}
    <CangkangStaf
      locale={locale}
      kini={t("nav.studio", "staff", { locale })}
      nav={
        <>
          <ItemNav href="/studio" label={t("nav.studio", "staff", { locale })} kini />
          {await navKonteks({ locale, persona: "staff", kecuali: ["/studio"], bentuk: "nav" })}
        </>
      }
    />
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <div>
          <p className="text-sm text-ink-3">{s("app.name")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{s("studio.title")}</h1>
        </div>
        <div className="mt-4"><TabStudioNav tab={nav} label={s("studio.title")} /></div>
      </header>
      {children}
    </main>
    </>
  );
}
