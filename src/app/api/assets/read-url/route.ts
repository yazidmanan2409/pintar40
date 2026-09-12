import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

/**
 * Signed-read route (FABLE-01 §7). Reads are short-lived signed URLs issued
 * per request after an authority check — never stored, never public.
 * Phase 1: a person's own profile photo, or a photo of a person visible to
 * the caller (doc 05 "Read a learner's current profile").
 */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path") ?? "";
  const m = /^profile\/([0-9a-f-]{36})\/[a-z0-9_.-]{1,120}$/i.exec(path);
  if (!m) return NextResponse.json({ error: "invalid_path" }, { status: 400 });

  const { data: visible } = await supabase.rpc("person_visible_to_me", { p_person: m[1] });
  if (visible !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data, error } = await supabaseService().storage.from("assets").createSignedUrl(path, 60);
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 60 });
}
