import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";

/**
 * Signed-read route (FABLE-01 §7). Reads are short-lived signed URLs issued
 * per request after an authority check — never stored, never public.
 * Phase 1: a person's own profile photo, or a photo of a person visible to
 * the caller (doc 05 "Read a learner's current profile").
 *
 * FABLE-03 §3 adds lesson media — audio, video and PDF companions. The
 * authority question is answered by the database, per object: a learner may
 * read a media path only when a lesson they are actually assigned names that
 * exact path. Deliberately not a prefix rule: "anything under pelajaran/"
 * would let one assigned course open every other course's media.
 *
 * BOB-11 (M9). TWO ANSWERS, ONE CHECK.
 * - Without `alih`, the answer is JSON `{ url, expiresIn }`, as before.
 * - With `alih=1` it is a 302 to the same signed URL, so a `<video>`,
 *   `<audio>` or a PDF link can point straight at this route. A media element
 *   cannot read JSON; it was pointed here and played nothing.
 * - A school's staff who may draft or review there may also read the media
 *   of their own school's lessons before release (`may_preview_lesson_media`),
 *   so an author or reviewer hears and sees what learners will.
 * - Both are asked per exact path; a refusal is the same 403 for a stranger
 *   and for an unknown path.
 */
/** How long a redirected media URL stays valid: one lesson's sitting. */
const MEDIA_URL_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const q = new URL(request.url).searchParams;
  const path = q.get("path") ?? "";
  const alih = q.get("alih") === "1";
  const profile = /^profile\/([0-9a-f-]{36})\/[a-z0-9_.-]{1,120}$/i.exec(path);
  // flat for the seeded lessons; pelajaran/<school>/<batch>/<file> for a
  // package's media (BOB-02). Either way the exact path must be named by a
  // lesson the caller is assigned; the shape only decides what is asked.
  const lesson = /^pelajaran\/(?:[0-9a-f-]{36}\/[0-9a-f-]{36}\/)?[a-z0-9_.-]{1,160}$/i.test(path);
  if (!profile && !lesson) return NextResponse.json({ error: "invalid_path" }, { status: 400 });

  if (profile) {
    const { data: visible } = await supabase.rpc("person_visible_to_me", { p_person: profile[1] });
    if (visible !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else {
    const [{ data: murid }, { data: staf }] = await Promise.all([
      supabase.rpc("may_read_lesson_media", { p_path: path }),
      supabase.rpc("may_preview_lesson_media", { p_path: path }),
    ]);
    if (murid !== true && staf !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // A media element fetches in ranges for as long as the lesson is open, and
  // the browser keeps the URL it was redirected to; a 60-second URL would
  // stop a video that is paused or sought after a minute. The hour is lesson
  // media's only: a profile photo is an <img> fetched at once, so it keeps its
  // 60 seconds with or without alih, and so does the JSON answer, which
  // whoever reads it fetches at once.
  const umur = alih && lesson ? MEDIA_URL_SECONDS : 60;
  const { data, error } = await supabaseService().storage.from("assets").createSignedUrl(path, umur);
  if (error || !data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (alih) {
    const r = NextResponse.redirect(data.signedUrl, 302);
    r.headers.set("Cache-Control", "private, no-store");
    return r;
  }
  return NextResponse.json({ url: data.signedUrl, expiresIn: 60 });
}
