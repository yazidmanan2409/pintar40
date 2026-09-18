import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { tujuanInternal } from "@/lib/tujuan";

/** Magic-link / OTP exchange. Public route; establishes the session cookie. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // L-1. The destination arrives from a link in an email -- the one value on
  // this route that nothing in PINTAR has held since it was written -- so it is
  // narrowed here as well as where the link was built. A link forged by hand
  // never passed through the builder.
  const next = tujuanInternal(url.searchParams.get("lanjut"));
  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
