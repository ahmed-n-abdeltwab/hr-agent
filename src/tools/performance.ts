import { z } from "zod";
import { bamboohr } from "../lib/bamboohr.js";
import { detectLocale, todayIso } from "../lib/locale.js";
import { t } from "../lib/i18n.js";
import { sheets, type CheckinRow } from "../lib/sheets.js";

export const submitCheckinSchema = z.object({
  teamLeadEmail: z.string(),
  date: z.string(),
  text: z.string().optional(),
  entries: z.array(
    z.object({
      employeeId: z.string(),
      accomplished: z.string(),
      blockers: z.string().default(""),
      rating: z.number().int().min(1).max(5),
    }),
  ),
});

export async function submitTeamCheckin(input: z.infer<typeof submitCheckinSchema>) {
  const locale = detectLocale(input.text);
  const lead = await bamboohr.searchEmployee({ workEmail: input.teamLeadEmail });
  const saved: CheckinRow[] = [];
  for (const entry of input.entries) {
    if (entry.rating < 1 || entry.rating > 5) {
      return { ok: false as const, code: "INVALID_RATING", locale, field: "rating" };
    }
    const emp = await bamboohr.getEmployee(entry.employeeId);
    const row: CheckinRow = {
      date: input.date,
      team_lead_email: input.teamLeadEmail,
      team_lead_name: lead ? `${lead.firstName} ${lead.lastName}` : input.teamLeadEmail,
      employee_id: entry.employeeId,
      employee_name: emp && "firstName" in emp ? `${emp.firstName} ${emp.lastName}` : entry.employeeId,
      accomplished: entry.accomplished,
      blockers: entry.blockers,
      rating: entry.rating,
      country: emp && "country" in emp ? emp.country : "",
      entity: emp && "customEntity" in emp ? emp.customEntity : "",
    };
    await sheets.appendCheckin(row);
    saved.push(row);
  }
  return { ok: true as const, locale, message: t("checkin_saved", locale), saved };
}

export const weeklySchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  weekStart: z.string().optional(),
  weekEnd: z.string().optional(),
  text: z.string().optional(),
});

export async function weeklyTeamPerformance(input: z.infer<typeof weeklySchema>) {
  const locale = detectLocale(input.text ?? input.name);
  const end = input.weekEnd ?? todayIso();
  const startDate = new Date(`${end}T00:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  const start = input.weekStart ?? startDate.toISOString().slice(0, 10);
  const lead = await bamboohr.searchEmployee({
    workEmail: input.email,
    name: input.name,
  });
  const summary = await sheets.getWeeklySummary({
    teamLeadName: lead ? `${lead.firstName} ${lead.lastName}` : input.name,
    teamLeadEmail: lead?.workEmail ?? input.email,
    weekStart: start,
    weekEnd: end,
  });
  return { ok: true as const, locale, message: t("checkin_saved", locale), summary, lead: lead ? `${lead.firstName} ${lead.lastName}` : input.name };
}
