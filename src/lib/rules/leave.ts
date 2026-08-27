export type Country = "KSA" | "UAE" | "Egypt" | "Jordan";

export function normalizeCountry(value: string): Country {
  const raw = value.trim().toUpperCase();
  if (raw === "KSA" || raw === "SA" || raw === "SAUDI" || raw === "SAUDI ARABIA") return "KSA";
  if (raw === "UAE" || raw === "AE" || raw === "UNITED ARAB EMIRATES") return "UAE";
  if (raw === "EGYPT" || raw === "EG") return "Egypt";
  if (raw === "JORDAN" || raw === "JO") return "Jordan";
  throw new Error(`Unsupported country: ${value}`);
}

export function tenureYears(hireDate: string, asOfDate: string): number {
  const hire = Date.parse(`${hireDate}T00:00:00Z`);
  const asOf = Date.parse(`${asOfDate}T00:00:00Z`);
  return (asOf - hire) / (365 * 86_400_000);
}

export function getAnnualEntitlement(input: {
  country: string;
  hireDate: string;
  asOfDate: string;
}): number {
  const country = normalizeCountry(input.country);
  const years = tenureYears(input.hireDate, input.asOfDate);
  if (country === "KSA") return years < 5 ? 21 : 30;
  if (country === "UAE") return 30;
  if (country === "Egypt") return years < 10 ? 21 : 30;
  return years < 5 ? 14 : 21;
}

export function getEmergencyEntitlement(_country: string): number {
  return 5;
}

export function getSickLeaveRules(country: string): {
  fullPayDays: number;
  reducedPayDays: number;
  reducedPayRate: number;
} {
  if (normalizeCountry(country) === "KSA") {
    return { fullPayDays: 30, reducedPayDays: 60, reducedPayRate: 0.75 };
  }
  return { fullPayDays: 30, reducedPayDays: 60, reducedPayRate: 0.75 };
}

/** Sun-Thu working week for every pilot country/location. */
export function countWorkingDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getUTCDay(); // 0 Sun ... 6 Sat
    if (dow >= 0 && dow <= 4) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
