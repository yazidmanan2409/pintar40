import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { cardEmail, deriveCardSecret } from "@/lib/card";
import { rujukan } from "@/lib/galat-kontrak";

/**
 * ACCOUNT ACTIVATION (F-01). The one place an Auth identity is created for a
 * person PINTAR has provisioned.
 *
 * THE SPLIT, the same one certificate issuance uses. The DATABASE decides and
 * audits — `authorize_account_activation` (CAN_PROVISION_PEOPLE in the
 * person's institution, or a SYSTEM_ADMIN) or `authorize_new_person`
 * (SYSTEM_ADMIN) — asked with the CALLER's own client, so the answer comes from
 * the caller's JWT. Its yes is a short-lived, single-use ACTIVATION GRANT for
 * one email address. Only then does this route use the service key, and only
 * to create the identity; `handle_new_auth_user` consumes the grant at the
 * moment Auth inserts the user and links it. Nothing depends on app_metadata:
 * GoTrue applies it after the insert, where the trigger cannot see it (NEW-2).
 *
 *   EMAIL           the person signs in with a magic link to that address.
 *                   `email_confirm` is set because the administrator vouches
 *                   for the address; possession is still proven at every
 *                   sign-in, because the link only reaches that inbox.
 *   CLASSROOM_CARD  a card number and a six-digit PIN, generated here, shown
 *                   ONCE in the response and never stored; the password is the
 *                   peppered derivation the card sign-in already uses, and the
 *                   grant is for the card's own sign-in address.
 *   NEW_PERSON      a SYSTEM_ADMIN's path to someone no institution has
 *                   provisioned yet — a school's first administrator.
 */
type Body = {
  mode?: "EMAIL" | "CLASSROOM_CARD" | "NEW_PERSON";
  person_id?: string;
  email?: string;
  display_name?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.mode) return NextResponse.json({ ok: false, error: "mode" }, { status: 400 });

  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });

  const email = String(body.email ?? "").trim().toLowerCase();
  const service = supabaseService();

  if (body.mode === "NEW_PERSON") {
    if (!email) return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
    const { data: name, error } = await caller.rpc("authorize_new_person", {
      p_display_name: body.display_name ?? "", p_email: email,
    });
    if (error || typeof name !== "string") return refused("authorize_new_person", error);
    const { error: created } = await service.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { display_name: name },
    });
    if (created) return gagalBuat(created);
    return NextResponse.json({ ok: true, mode: body.mode });
  }

  const person = String(body.person_id ?? "");
  if (!UUID.test(person)) return NextResponse.json({ ok: false, error: "person_id" }, { status: 400 });
  const authorize = async (kind: "EMAIL" | "CLASSROOM_CARD", address: string, card: string | null) => {
    const { data, error } = await caller.rpc("authorize_account_activation", {
      p_person: person, p_kind: kind, p_email: address, p_card_number: card,
    });
    const row = Array.isArray(data) ? (data[0] as { display_name: string } | undefined) : undefined;
    return { row, error };
  };

  if (body.mode === "EMAIL") {
    const { row, error } = await authorize("EMAIL", email, null);
    if (error || !row) return refused("authorize_account_activation", error);
    const { error: created } = await service.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { display_name: row.display_name },
    });
    if (created) return gagalBuat(created);
    return NextResponse.json({ ok: true, mode: body.mode });
  }

  if (body.mode !== "CLASSROOM_CARD") return NextResponse.json({ ok: false, error: "mode" }, { status: 400 });
  // CLASSROOM_CARD: a fresh number until one is free, each one granted before
  // it is created; the PIN leaves once and is never stored
  for (let attempt = 0; attempt < 5; attempt++) {
    const card = String(randomInt(1_000_000_000, 9_999_999_999));
    const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { row, error } = await authorize("CLASSROOM_CARD", cardEmail(card), card);
    if (error || !row) return refused("authorize_account_activation", error);
    const { error: created } = await service.auth.admin.createUser({
      email: cardEmail(card), password: deriveCardSecret(card, pin), email_confirm: true,
      user_metadata: { display_name: row.display_name },
    });
    if (!created) return NextResponse.json({ ok: true, mode: body.mode, card, pin });
    if (!/already|exists|registered/i.test(created.message)) {
      return gagalBuat(created);
    }
  }
  return NextResponse.json({ ok: false, error: "create_failed" }, { status: 409 });
}

/**
 * BOB-07 (D-011): the answer carries the route's own word and a reference;
 * the database's or Auth's own sentence goes to the server log beside it and
 * never into the response (the screen never showed it: src/components/aktivasi/hasil.ts).
 */
function refused(fn: string, error: { code?: string | null; message?: string | null } | null) {
  const ref = rujukan();
  console.error(`[aktivasi ${ref}] ${fn} refused`, error?.code, error?.message);
  return NextResponse.json({ ok: false, error: "refused", ref }, { status: 403 });
}

function gagalBuat(created: { code?: string | null; status?: number; message?: string | null }) {
  const ref = rujukan();
  console.error(`[aktivasi ${ref}] auth.admin.createUser failed`, created.code ?? created.status, created.message);
  return NextResponse.json({ ok: false, error: "create_failed", ref }, { status: 409 });
}
