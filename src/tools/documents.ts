import { z } from "zod";
import { bamboohr, isBambooError, type Employee } from "../lib/bamboohr.js";
import { detectLocale, daysBetween, todayIso } from "../lib/locale.js";
import { t } from "../lib/i18n.js";
import { hrEscalationEmail, notify } from "../lib/notify.js";

export type IqamaStatus = "ok" | "expiring" | "expired" | "missing";

export function evaluateIqama(expiry: string | undefined, asOf = todayIso()): {
  status: IqamaStatus;
  daysLeft: number | null;
} {
  if (!expiry) return { status: "missing", daysLeft: null };
  const daysLeft = daysBetween(asOf, expiry);
  if (daysLeft < 0) return { status: "expired", daysLeft };
  if (daysLeft <= 30) return { status: "expiring", daysLeft };
  return { status: "ok", daysLeft };
}

export const checkIqamaSchema = z.object({
  employeeId: z.string(),
  asOf: z.string().optional(),
  text: z.string().optional(),
});

export async function checkIqamaExpiry(input: z.infer<typeof checkIqamaSchema>) {
  const locale = detectLocale(input.text);
  const emp = await bamboohr.getEmployee(input.employeeId);
  if (isBambooError(emp)) return { ...emp, locale };
  if (!emp) return { ok: false as const, code: "MISSING_FIELD", field: "employeeId", locale };
  const evald = evaluateIqama(emp.customIqamaExpiry, input.asOf);
  const message =
    evald.status === "expired"
      ? t("iqama_expired", locale)
      : evald.status === "expiring" || evald.status === "missing"
        ? t("iqama_expiring", locale)
        : t("iqama_expiring", locale);
  return { ok: true as const, locale, message, ...evald, expiry: emp.customIqamaExpiry };
}

export async function runIqamaScan(asOf = todayIso()) {
  const employees = await bamboohr.listEmployees();
  const alerts: Array<{ employee: Employee; status: IqamaStatus; daysLeft: number | null }> = [];
  for (const emp of employees) {
    const evald = evaluateIqama(emp.customIqamaExpiry, asOf);
    if (evald.status === "expiring" || evald.status === "expired") {
      alerts.push({ employee: emp, ...evald });
      const bodyEn = `${emp.firstName} ${emp.lastName} Iqama ${evald.status}, daysLeft=${evald.daysLeft}`;
      const bodyAr = `${emp.firstName} ${emp.lastName} الإقامة ${evald.status}، الأيام المتبقية=${evald.daysLeft}`;
      await notify({ to: emp.workEmail, role: "employee", locale: "en", body: `${bodyEn} / ${bodyAr}` });
      await notify({ to: hrEscalationEmail(), role: "hr", locale: "en", body: `${bodyEn} / ${bodyAr}` });
    }
  }
  return { ok: true as const, asOf, alerts };
}
