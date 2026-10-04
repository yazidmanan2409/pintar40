import "server-only";
import { createHash, createHmac } from "node:crypto";
import { cardPepper } from "@/lib/env";
import { domainKartu } from "@/lib/sesi";

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
  return `card-${cardNumber}@${domainKartu()}`;
}

/**
 * BOB-12 (b): the key a card's failed attempts are counted under. An HMAC of
 * the card number with the same pepper, under its own label, so the database
 * never sees a card number and nobody without the pepper can compute or clear
 * another card's record. Any number typed is keyed the same way, existing or not.
 */
export function kunciJedaKartu(cardNumber: string): string {
  return createHmac("sha256", cardPepper()).update(`jeda-kartu|${cardNumber}`).digest("hex");
}

/**
 * BOB-26: the keys Gate 3's attempts are counted under (BOB-24's
 * identity_attempts), made the card's way: an HMAC with the same pepper under
 * a label of its own, so the database never sees an address or a username and
 * nobody without the pepper can compute or clear another's record. Anything
 * typed is keyed the same way, existing or not.
 */
export function kunciIdentitas(label: "kode-alamat" | "masuk-password" | "minta-kode", nilai: string): string {
  return createHmac("sha256", cardPepper()).update(`${label}|${nilai}`).digest("hex");
}
