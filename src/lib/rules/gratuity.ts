import { daysBetween } from "../locale.js";
import { normalizeCountry, type Country } from "./leave.js";

export type Currency = "SAR" | "AED" | "EGP" | "JOD";

export function currencyFor(country: string): Currency {
  const c = normalizeCountry(country);
  if (c === "KSA") return "SAR";
  if (c === "UAE") return "AED";
  if (c === "Egypt") return "EGP";
  return "JOD";
}

export function calculateGratuity(input: {
  country: string;
  hireDate: string;
  exitDate: string;
  basicMonthlySalary: number;
}): { amount: number; currency: Currency; years: number; country: Country } {
  const hireMs = Date.parse(input.hireDate.includes("T") ? input.hireDate : `${input.hireDate}T00:00:00Z`);
  const exitMs = Date.parse(input.exitDate.includes("T") ? input.exitDate : `${input.exitDate}T00:00:00Z`);
  const years = (exitMs - hireMs) / (365 * 86_400_000);
  const salary = input.basicMonthlySalary;
  const country = normalizeCountry(input.country);
  let amount = 0;

  if (country === "KSA") {
    if (years < 2) amount = 0;
    else if (years < 5) amount = 0.5 * salary * years;
    else amount = 0.5 * salary * 5 + 1.0 * salary * (years - 5);
  } else if (country === "UAE") {
    const daily = salary / 30;
    const first = Math.min(years, 5) * 21 * daily;
    const rest = Math.max(years - 5, 0) * 30 * daily;
    amount = first + rest;
  } else {
    if (years < 5) amount = 0.5 * salary * years;
    else amount = 0.5 * salary * 5 + 1.0 * salary * (years - 5);
  }

  return {
    amount: Math.round(amount * 100) / 100,
    currency: currencyFor(country),
    years,
    country,
  };
}
