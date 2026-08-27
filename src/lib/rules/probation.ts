import { normalizeCountry, tenureYears, type Country } from "./leave.js";

export function getProbationMonths(country: string): number {
  const c = normalizeCountry(country);
  if (c === "KSA") return 90 / 30;
  if (c === "UAE") return 6;
  if (c === "Egypt") return 3;
  return 3;
}

export function isInProbation(input: {
  country: string;
  hireDate: string;
  asOfDate: string;
}): boolean {
  const months = getProbationMonths(input.country);
  return tenureYears(input.hireDate, input.asOfDate) * 12 < months;
}
