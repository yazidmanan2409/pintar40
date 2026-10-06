import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bacaPengaturanEmail } from "./pengaturan";

/**
 * D-098(c): THE WAITS EVERY CODE REQUEST ASKS BEFORE IT ANSWERS (activation,
 * Gate 3; recovery, Gate 4), as the routes' tools. Service-role (F01-S03).
 */
export function alatTunggu(layanan: SupabaseClient) {
  return {
    jedaKirimUlang: async () => {
      const { data, error } = await layanan.rpc("email_resend_seconds");
      if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
      return data;
    },
    jedaPengiriman: async () => {
      bacaPengaturanEmail(); // missing settings: no code could ever go, so the request fails as the server's
      const { data, error } = await layanan.rpc("email_sending_wait");
      if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
      return data;
    },
    catatPermintaan: async (kunci: string) => {
      const { data, error } = await layanan.rpc("code_request_pace", { p_kunci: kunci });
      if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
      return data;
    },
  };
}
