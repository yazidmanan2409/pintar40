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

/**
 * The Auth address a classroom card signs in as. One definition, used by the
 * card sign-in and by account activation (F-01), so the two can never drift.
 */
export function cardEmail(cardNumber: string): string {
  return `card-${cardNumber}@${process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal"}`;
}
