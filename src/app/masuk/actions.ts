"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { deriveCardSecret } from "@/lib/card";
import { appUrl } from "@/lib/env";

export async function sendMagicLink(formData: FormData): Promise<{ ok: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("lanjut") ?? "/");
  if (!email) return { ok: false };
  const supabase = await supabaseServer();
  const origin = appUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?lanjut=${encodeURIComponent(next)}` },
  });
  return { ok: !error };
}

export async function signInWithCard(formData: FormData): Promise<void> {
  const card = String(formData.get("kartu") ?? "").replace(/\D/g, "");
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  const next = String(formData.get("lanjut") ?? "/");
  if (!card || !pin) redirect("/masuk?kartu=gagal");
  const supabase = await supabaseServer();
  const host = process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal";
  const { error } = await supabase.auth.signInWithPassword({
    email: `card-${card}@${host}`,
    password: deriveCardSecret(card, pin),
  });
  if (error) redirect("/masuk?kartu=gagal");
  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/?keluar=1");
}
