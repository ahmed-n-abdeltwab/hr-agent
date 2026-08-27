import { z } from "zod";
import { bamboohr, isBambooError } from "../lib/bamboohr.js";
import { dataUpsert, getOnboardingCase } from "../lib/data.js";
import { t } from "../lib/i18n.js";
import { detectLocale, type Locale } from "../lib/locale.js";
import { seedOrientation } from "../lib/assets.js";

const REQUIRED = ["iqama_copy", "bank_iban", "emergency_contact"] as const;
type DocType = (typeof REQUIRED)[number];

type OnboardingCase = {
  employeeId: string;
  documents: Partial<Record<DocType, Record<string, string>>>;
  orientation?: { entity: string; location: string; days: string[] };
  checklistCreated?: boolean;
};

function loadOrientation(): Array<{ entity: string; location: string; days: string[] }> {
  return seedOrientation as Array<{ entity: string; location: string; days: string[] }>;
}

function asCase(raw: Record<string, unknown> | undefined, employeeId: string): OnboardingCase {
  return {
    employeeId,
    documents: (raw?.documents as OnboardingCase["documents"]) ?? {},
    orientation: raw?.orientation as OnboardingCase["orientation"],
    checklistCreated: Boolean(raw?.checklistCreated),
  };
}

function nextMissing(c: OnboardingCase): DocType | "orientation" | undefined {
  for (const key of REQUIRED) if (!c.documents[key]) return key;
  if (!c.orientation) return "orientation";
  return undefined;
}

export async function startOnboarding(input: { employeeId: string; text?: string }) {
  const locale = detectLocale(input.text);
  const emp = await bamboohr.getEmployee(input.employeeId);
  if (isBambooError(emp)) return emp;
  if (!emp) return { ok: false as const, code: "MISSING_FIELD", field: "employeeId", locale };
  const existing = asCase(getOnboardingCase(input.employeeId), input.employeeId);
  const c: OnboardingCase = { ...existing, checklistCreated: true };
  for (const name of ["Iqama copy", "Bank IBAN", "Emergency contact"]) {
    await bamboohr.upsertOnboardingTask(input.employeeId, {
      name,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      completed: false,
    });
  }
  await dataUpsert("onboarding_cases", input.employeeId, c);
  return {
    ok: true as const,
    locale,
    message: t("onboarding_next_step", locale),
    next: nextMissing(c),
    case: c,
  };
}

export async function submitOnboardingDocument(input: {
  employeeId: string;
  documentType: DocType;
  value: string;
  extra?: string;
  text?: string;
}) {
  const locale = detectLocale(input.text);
  if (!input.value) return { ok: false as const, code: "MISSING_FIELD", field: input.documentType, locale };
  const c = asCase(getOnboardingCase(input.employeeId), input.employeeId);
  c.documents[input.documentType] = { value: input.value, extra: input.extra ?? "" };
  const nameMap: Record<DocType, string> = {
    iqama_copy: "Iqama copy",
    bank_iban: "Bank IBAN",
    emergency_contact: "Emergency contact",
  };
  await bamboohr.upsertOnboardingTask(input.employeeId, {
    name: nameMap[input.documentType],
    dueDate: new Date().toISOString().slice(0, 10),
    completed: true,
  });
  await dataUpsert("onboarding_cases", input.employeeId, c);
  const next = nextMissing(c);
  return {
    ok: true as const,
    locale,
    message: next === "iqama_copy" ? t("missing_iqama", locale) : t("onboarding_next_step", locale),
    next,
  };
}

export async function assignOrientation(input: { employeeId: string; text?: string }) {
  const locale = detectLocale(input.text);
  const emp = await bamboohr.getEmployee(input.employeeId);
  if (isBambooError(emp)) return emp;
  if (!emp) return { ok: false as const, code: "MISSING_FIELD", field: "employeeId", locale };
  const match = loadOrientation().find(
    (o) => o.entity === emp.customEntity && o.location === emp.location,
  ) ?? loadOrientation()[0];
  const c = asCase(getOnboardingCase(input.employeeId), input.employeeId);
  c.orientation = match;
  await dataUpsert("onboarding_cases", input.employeeId, c);
  return { ok: true as const, locale, message: t("onboarding_next_step", locale), orientation: match };
}

export async function completeOnboarding(input: { employeeId: string; text?: string }) {
  const locale = detectLocale(input.text);
  const c = asCase(getOnboardingCase(input.employeeId), input.employeeId);
  const missing = nextMissing(c);
  if (missing) {
    const field = missing === "bank_iban" || missing === "iqama_copy" || missing === "emergency_contact" ? missing : "orientation";
    return { ok: false as const, code: "MISSING_FIELD" as const, field, locale, message: t("onboarding_next_step", locale) };
  }
  return { ok: true as const, locale, message: t("onboarding_next_step", locale), completed: true };
}

export const startOnboardingSchema = z.object({
  employeeId: z.string(),
  text: z.string().optional(),
});
export const submitDocSchema = z.object({
  employeeId: z.string(),
  documentType: z.enum(REQUIRED),
  value: z.string(),
  extra: z.string().optional(),
  text: z.string().optional(),
});
export const employeeIdSchema = z.object({
  employeeId: z.string(),
  text: z.string().optional(),
});
