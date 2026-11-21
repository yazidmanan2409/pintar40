/**
 * C3w-1 · THE ONE BUILDER OF A PROVIDER REQUEST (Sharon's R-3 control 1, C3W-R3-DESIGN.md). Pure: no network, no
 * database, no React; it holds no secret, so it is not server-only, and only server modules import it.
 *
 * It takes exactly the final excerpt (already checked by c3w_periksa_bahan), the objectives' statements and the
 * count, and makes exactly four keys: excerpt, objectives, itemSchema, promptVersion. Anything else, a person, a school,
 * an id or a learner-derived value, is refused at run time as well as by the type.
 */
import type { PermintaanPenyedia } from "@/lib/ai/kontrak";

export const VERSI_PROMPT = "c3w-1.1";

const MASUK = ["excerpt", "objectives", "jumlah"] as const;

export function bangunPermintaan(masuk: unknown): PermintaanPenyedia {
  if (typeof masuk !== "object" || masuk === null || Array.isArray(masuk)) throw new Error("permintaan: not a record");
  const kunci = Object.keys(masuk).sort();
  if (JSON.stringify(kunci) !== JSON.stringify([...MASUK].sort())) {
    throw new Error(`permintaan: exactly ${MASUK.join(", ")}; got ${kunci.join(", ")}`);
  }
  const { excerpt, objectives, jumlah } = masuk as Record<string, unknown>;
  if (typeof excerpt !== "string" || excerpt.length < 1 || excerpt.length > 20000) throw new Error("permintaan: excerpt");
  if (!Array.isArray(objectives) || objectives.length < 1 || objectives.some((o) => typeof o !== "string" || o.length < 1 || o.length > 500)) {
    throw new Error("permintaan: objectives");
  }
  if (typeof jumlah !== "number" || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 10) throw new Error("permintaan: jumlah");
  return {
    excerpt,
    objectives: [...(objectives as string[])],
    itemSchema: { type: "array", minItems: jumlah, maxItems: jumlah, items: { type: "object", required: ["stem", "options"] } },
    promptVersion: VERSI_PROMPT,
  };
}
