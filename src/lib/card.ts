import "server-only";
import { createHash } from "node:crypto";
import { cardPepper } from "@/lib/env";

/**
 * Classroom-card PIN → auth secret derivation (FABLE-01 §2). The PIN is
 * never the auth password and never stored; the derived value is a peppered
 * SHA-256 over (card, PIN). The synthetic seed uses the same derivation.
 */
export function deriveCardSecret(cardNumber: string, pin: string): string {
  return createHash("sha256").update(`${cardPepper()}|${cardNumber}|${pin}`).digest("hex");
}
