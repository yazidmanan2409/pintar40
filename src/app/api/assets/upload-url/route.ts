import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { sasaranDalamKonteks, sekolahDari } from "@/lib/konteks-server";

/**
 * Signed-upload route (FABLE-01 §7; INV-15). The ONLY write path to the
 * private bucket. The caller's authority is checked through the database
 * primitives (never by UI state); the service-role client then issues a
 * short-lived signed upload URL for exactly one path. No client ever holds a
 * bucket write policy.
 *
 * Phase 1 paths: `profile/<person_id>/<file>` (own photo, any signed-in
 * person). Content paths arrive with Phase 2 (`CAN_DRAFT`/`CAN_REVIEW`).
 * BOB-02: `pelajaran/<school>/<batch>/<file>`, a lesson package's media.
 * BOB-15: `laporan/<id>.<png|jpg|webp>`, a problem report's screenshot, stored at `laporan/<person_id>/<id>.<ext>`.
 *
 * §2.11 (D-132(k)): content and a lesson package's media are a school's, so they are written only in that school's
 * working context; otherwise CONTEXT_OTHER_PLACE (409) and no URL. A narrowing, never a permit. One's own photo and
 * one's own report are nobody's school.
 */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { path?: string; nodeId?: string } | null;
  const path = body?.path ?? "";
  if (!/^[a-z0-9/_.-]{3,200}$/i.test(path) || path.includes("..")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const { data: personId } = await supabase.rpc("current_person_id");
  let allowed = false;
  if (path.startsWith(`profile/${personId}/`)) {
    allowed = true;
  } else if (path.startsWith("content/") && body?.nodeId) {
    if (!(await sasaranDalamKonteks({ sekolah: await sekolahDari("simpul", body.nodeId) }))) return lainKonteks();
    const { data } = await supabase.rpc("can_on_node", { p_capability: "CAN_DRAFT", p_node: body.nodeId });
    allowed = data === true;
  } else if (path.startsWith("pelajaran/")) {
    // BOB-02: a lesson package's media, at pelajaran/<school>/<batch>/<file>.
    // The database says yes only while the batch awaits confirmation, only to
    // someone who may draft in its school, and only for a file the package
    // names -- the same path the lesson will carry and the student read route
    // accepts.
    if (!(await sasaranDalamKonteks({ sekolah: path.split("/")[1] ?? null }))) return lainKonteks();
    const { data } = await supabase.rpc("may_upload_package_media", { p_path: path });
    allowed = data === true;
  }
  // BOB-15 (DAISY-12): a problem report's screenshot. The browser names only a fresh id and the picture's kind; the
  // folder is the signed-in person's own, set here, so nobody writes into another's
  let jalur = path;
  const tangkapan = /^laporan\/([0-9a-f-]{36}\.(?:png|jpg|webp))$/.exec(path);
  if (tangkapan && personId) {
    jalur = `laporan/${personId}/${tangkapan[1]}`;
    allowed = true;
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const service = supabaseService();
  const { data, error } = await service.storage.from("assets").createSignedUploadUrl(jalur);
  if (error || !data) return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  return NextResponse.json({ path: data.path, token: data.token });
}

/** §2.11: the target is outside the working context; nothing is signed. */
function lainKonteks() {
  return NextResponse.json({ error: "CONTEXT_OTHER_PLACE" }, { status: 409 });
}
