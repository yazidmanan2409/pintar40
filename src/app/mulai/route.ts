import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { berandaPeran } from "@/lib/beranda";
import { tujuanInternal } from "@/lib/tujuan";
import { bacaKonteks, bacaPintu, bacaTempat, berandaPasangan, rencanaMasuk } from "@/lib/konteks";
import { COOKIE_SELESAI } from "@/lib/tanda-keluar";

/**
 * L3 · ARRIVING (CR-83; D-127 Q1; D-132 C4, C5, C9). Every sign-in ends here (tujuanMasuk): password, card, link,
 * activation, recovery, S15's «Lanjutkan». By now the proxy has made this session's row, so the working context
 * can be set on it.
 *
 *   the door (`pintu`)        its purpose, never a role: one place held for it, set; several, the chooser asks where;
 *                             none, the chooser says so and offers what is held (§2.2, §2.3)
 *   a page asked for          only when no door: sets the context only if exactly one held pair serves it (C4)
 *   neither                   one pair held: set; several: the chooser. D-010's ranking never chooses (C9)
 *   the sign-out mark         a session ended on this browser since the last sign-in: any carried destination is
 *                             ignored and the mark removed (C5: 4.0's stale-continuation guard, not context)
 *
 * A session that already has a context (S15) keeps it: a door never replaces one (C4); it continues to the page
 * asked for, whose own guard sends it to the chooser if the page belongs elsewhere. An evaluation persona has no
 * session row and no context (C10): it lands on its single role's home, as before.
 *
 * A GET, because the browser follows it after signing in. It can only ever set a context where the session has none
 * (the database refuses a door over an existing one), so a link to it from elsewhere changes nothing a person chose.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const tanda = request.cookies.has(COOKIE_SELESAI);
  const pintu = bacaPintu(sp.get("pintu"));
  const lanjut = tanda ? "" : tujuanInternal(sp.get("lanjut"), "");
  const supabase = await supabaseServer();

  const { data: kData, error: kGalat } = await supabase.rpc("konteks_saya");
  const k = kGalat ? null : bacaKonteks(kData);
  let ke: string;
  if (!k || k.keadaan === "TANPA" || k.keadaan === "BERAKHIR") {
    // C10: an evaluation persona keeps its single role's home; an unreadable answer degrades to the same
    const viewer = await currentViewer();
    ke = lanjut || berandaPeran(viewer?.displayRole ?? null);
  } else if (k.keadaan === "ADA") {
    ke = lanjut || berandaPasangan(k);
  } else {
    const { data: tData } = await supabase.rpc("konteks_tempat_saya");
    const r = rencanaMasuk({ pintu, lanjut, tanda: false, tempat: bacaTempat(tData) });
    ke = r.ke;
    if (r.tetapkan) {
      const { error } = await supabase.rpc("konteks_tetapkan", {
        p_tujuan: r.tetapkan.tujuan, p_tempat: r.tetapkan.tempat, p_platform: r.tetapkan.platform, p_sebab: r.tetapkan.sebab,
      });
      // refused (the grant went in the meantime): the chooser, which offers only what is held now
      if (error) ke = "/";
    }
  }

  // A relative Location, resolved by the browser against the address it used. `request.url` names the server's own
  // host (behind `next start`, localhost): another origin, holding none of this session's cookies, where the arrival
  // would look signed out (the proxy's own redirects are relative for the same reason)
  const res = new NextResponse(null, { status: 307, headers: { location: tujuanInternal(ke, "/") } });
  if (tanda) res.cookies.set(COOKIE_SELESAI, "", { path: "/", maxAge: 0 });
  res.headers.set("cache-control", "no-store");
  return res;
}
