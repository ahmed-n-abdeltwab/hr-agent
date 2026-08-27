export type Locale = "ar" | "en";

const ARABIC_RE = /[\u0600-\u06FF]/;

export function detectLocale(text: string | undefined | null): Locale {
  return text && ARABIC_RE.test(text) ? "ar" : "en";
}

export function parseMode(value: string | undefined, fallback = "mock"): "mock" | "live" {
  return value === "live" ? "live" : fallback === "live" ? "live" : "mock";
}

export function readEnv(name: string, fallback = ""): string {
  if (typeof process !== "undefined" && process.env[name] != null) {
    return String(process.env[name]);
  }
  return fallback;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

export function todayIso(asOf?: string): string {
  return asOf ?? new Date().toISOString().slice(0, 10);
}
