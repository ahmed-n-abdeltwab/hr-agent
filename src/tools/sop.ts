import { z } from "zod";
import { dataSearch, dataUpsert, getSopBySlug, listSopGaps } from "../lib/data.js";
import { detectLocale } from "../lib/locale.js";
import { t } from "../lib/i18n.js";
import { hrEscalationEmail, notify } from "../lib/notify.js";

export const searchSopsSchema = z.object({
  query: z.string(),
  employeeId: z.string().optional(),
  text: z.string().optional(),
});

export async function searchSops(input: z.infer<typeof searchSopsSchema>) {
  const locale = detectLocale(input.text ?? input.query);
  const hits = await dataSearch("hr_policies", input.query, 5, 0.7);
  if (hits.length === 0) return logSopGap({ ...input, locale });
  return {
    ok: true as const,
    locale,
    message: t("sop_found", locale),
    results: hits,
  };
}

export async function getSop(input: { slug: string; text?: string }) {
  const locale = detectLocale(input.text);
  const doc = getSopBySlug(input.slug);
  if (!doc) return { ok: false as const, code: "NOT_FOUND", locale, message: t("sop_missing", locale) };
  return { ok: true as const, locale, message: t("sop_found", locale), title: doc.title, body: doc.body, country: doc.country };
}

export async function logSopGap(input: { query: string; employeeId?: string; text?: string; locale?: "ar" | "en" }) {
  const locale = input.locale ?? detectLocale(input.text ?? input.query);
  const row = {
    query: input.query,
    employeeId: input.employeeId ?? "",
    timestamp: new Date().toISOString(),
    status: "open",
  };
  await dataUpsert("sop_gaps", `gap-${Date.now()}`, row);
  await notify({
    to: hrEscalationEmail(),
    role: "hr",
    locale,
    body: `SOP gap: ${input.query}`,
    channel: "email",
  });
  return {
    ok: true as const,
    gap: true as const,
    locale,
    message: t("sop_missing", locale),
    row,
    gaps: listSopGaps(),
  };
}

export const getSopSchema = z.object({ slug: z.string(), text: z.string().optional() });
export const logGapSchema = searchSopsSchema;
