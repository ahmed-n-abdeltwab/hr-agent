import { z } from "zod";
import { bamboohr, isBambooError } from "../lib/bamboohr.js";
import { detectLocale } from "../lib/locale.js";
import { t } from "../lib/i18n.js";
import { notify } from "../lib/notify.js";
import { countWorkingDays } from "../lib/rules/leave.js";

export const requestLeaveSchema = z.object({
  employeeId: z.string(),
  start: z.string(),
  end: z.string(),
  type: z.enum(["annual", "sick", "emergency"]).default("annual"),
  notes: z.string().optional(),
  text: z.string().optional(),
});

export async function requestLeave(input: z.infer<typeof requestLeaveSchema>) {
  const locale = detectLocale(input.text);
  const emp = await bamboohr.getEmployee(input.employeeId);
  if (isBambooError(emp)) return { ...emp, locale };
  if (!emp) return { ok: false as const, code: "MISSING_FIELD", field: "employeeId", locale };

  const requested = countWorkingDays(input.start, input.end);
  const bal = await bamboohr.getLeaveBalance(input.employeeId, input.start, input.end);
  if (isBambooError(bal)) return { ...bal, locale };
  const balance = bal.balance;

  if (requested > balance) {
    return {
      ok: false as const,
      code: "INSUFFICIENT_BALANCE" as const,
      balance,
      requested,
      locale,
      message: t("leave_rejected", locale),
    };
  }

  const types = await bamboohr.getTimeOffTypes();
  if (isBambooError(types)) return { ...types, locale };
  const timeOffTypeId = types[input.type];

  const created = await bamboohr.requestTimeOff(input.employeeId, {
    start: input.start,
    end: input.end,
    timeOffTypeId,
    notes: input.notes ?? input.text ?? "",
    status: "requested",
  });
  if (isBambooError(created)) return { ...created, locale };

  const manager = emp.supervisorEId ? await bamboohr.getEmployee(emp.supervisorEId) : undefined;
  const managerNotify = await notify({
    to: (manager && !isBambooError(manager) && manager?.workEmail) || emp.supervisor,
    role: "manager",
    locale,
    body: locale === "ar"
      ? `طلب إجازة من ${emp.firstName} ${emp.lastName}: ${input.start} إلى ${input.end} (${requested} أيام).`
      : `Leave request from ${emp.firstName} ${emp.lastName}: ${input.start} to ${input.end} (${requested} days).`,
  });
  const employeeNotify = await notify({
    to: emp.workEmail,
    role: "employee",
    locale,
    body: t("leave_approved", locale),
  });

  return {
    ok: true as const,
    status: "pending_approval" as const,
    locale,
    message: t("leave_approved", locale),
    requested,
    balance,
    timeOffId: created.id,
    managerNotify,
    employeeNotify,
  };
}
