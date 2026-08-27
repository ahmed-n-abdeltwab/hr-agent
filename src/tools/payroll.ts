import { z } from "zod";
import { bamboohr, isBambooError } from "../lib/bamboohr.js";
import { detectLocale } from "../lib/locale.js";
import { t } from "../lib/i18n.js";
import { calculateGratuity } from "../lib/rules/gratuity.js";

export const gratuitySchema = z.object({
  employeeId: z.string().optional(),
  country: z.string().optional(),
  hireDate: z.string().optional(),
  exitDate: z.string().optional(),
  basicMonthlySalary: z.number().optional(),
  text: z.string().optional(),
});

export async function calculateGratuityTool(input: z.infer<typeof gratuitySchema>) {
  const locale = detectLocale(input.text);
  let country = input.country;
  let hireDate = input.hireDate;
  let exitDate = input.exitDate ?? new Date().toISOString().slice(0, 10);
  let salary = input.basicMonthlySalary;

  if (input.employeeId) {
    const emp = await bamboohr.getEmployee(input.employeeId);
    if (isBambooError(emp)) return { ...emp, locale };
    if (!emp) return { ok: false as const, code: "MISSING_FIELD", field: "employeeId", locale };
    country = country ?? emp.country;
    hireDate = hireDate ?? emp.hireDate;
    salary = salary ?? emp.basicMonthlySalary;
  }

  if (!country || !hireDate || salary == null) {
    return { ok: false as const, code: "MISSING_FIELD", field: "hireDate", locale };
  }

  const result = calculateGratuity({
    country,
    hireDate,
    exitDate,
    basicMonthlySalary: salary,
  });

  return {
    ok: true as const,
    locale,
    message: t("gratuity_result", locale),
    ...result,
  };
}
