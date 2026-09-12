"use client";
import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";

/** Browser client: anon key + user session only. Never holds privileged keys. */
export function supabaseBrowser() {
  return createBrowserClient(publicSupabaseUrl(), publicSupabaseAnonKey());
}
