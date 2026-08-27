import assert from "node:assert/strict";
import { test } from "node:test";
import { getAnnualEntitlement, countWorkingDays } from "../src/lib/rules/leave.js";
import { calculateGratuity } from "../src/lib/rules/gratuity.js";
import { requestLeave } from "../src/tools/leave.js";
import { detectLocale } from "../src/lib/locale.js";
import { t } from "../src/lib/i18n.js";
import { searchSops } from "../src/tools/sop.js";
import { completeOnboarding, startOnboarding, submitOnboardingDocument, assignOrientation } from "../src/tools/onboarding.js";
import { weeklyTeamPerformance } from "../src/tools/performance.js";
import { evaluateIqama } from "../src/tools/documents.js";
import { resetData } from "../src/lib/data.js";
import { clearNotifications, getNotifications } from "../src/lib/notify.js";

test("KSA hire 2019-01-01 as of 2026-01-01 is 30 days", () => {
  assert.equal(getAnnualEntitlement({ country: "KSA", hireDate: "2019-01-01", asOfDate: "2026-01-01" }), 30);
});

test("KSA hire 2024-01-01 as of 2026-01-01 is 21 days", () => {
  assert.equal(getAnnualEntitlement({ country: "KSA", hireDate: "2024-01-01", asOfDate: "2026-01-01" }), 21);
});

test("leave 25 working days with balance 10 is INSUFFICIENT_BALANCE", async () => {
  clearNotifications();
  const result = await requestLeave({
    employeeId: "1002",
    start: "2026-09-01",
    end: "2026-10-10",
    type: "annual",
    text: "I need a long leave",
  });
  assert.equal(result.ok, false);
  assert.equal((result as { code: string }).code, "INSUFFICIENT_BALANCE");
  assert.ok(countWorkingDays("2026-09-01", "2026-10-10") >= 25);
});

test("leave 3 working days with balance 10 is pending_approval and notifies manager", async () => {
  clearNotifications();
  const result = await requestLeave({
    employeeId: "1002",
    start: "2026-08-30",
    end: "2026-09-01",
    type: "annual",
    text: "Need three days",
  });
  assert.equal(result.ok, true);
  assert.equal((result as { status: string }).status, "pending_approval");
  assert.equal((result as { requested: number }).requested, 3);
  assert.ok(getNotifications().some((n) => n.role === "manager"));
});

test("Arabic leave text sets locale ar and Arabic message", async () => {
  const text = "ابي اجازة سنوية من 1 الى 3 سبتمبر";
  assert.equal(detectLocale(text), "ar");
  const result = await requestLeave({
    employeeId: "1002",
    start: "2026-08-30",
    end: "2026-09-01",
    type: "annual",
    text,
  });
  assert.equal(result.locale, "ar");
  assert.equal((result as { message: string }).message, t("leave_approved", "ar"));
});

test("KSA gratuity 6.5 years salary 12000 is 48000", () => {
  const result = calculateGratuity({
    country: "KSA",
    hireDate: "2019-01-01T00:00:00.000Z",
    exitDate: "2025-06-30T12:00:00.000Z",
    basicMonthlySalary: 12000,
  });
  assert.equal(result.years, 6.5);
  assert.equal(result.amount, 48000);
  assert.equal(result.currency, "SAR");
});

test("gratuity other country cases", () => {
  assert.equal(calculateGratuity({ country: "KSA", hireDate: "2025-01-01", exitDate: "2026-01-01", basicMonthlySalary: 12000 }).amount, 0);
  assert.ok(calculateGratuity({ country: "UAE", hireDate: "2020-01-01", exitDate: "2023-01-01", basicMonthlySalary: 12000 }).amount > 0);
  assert.ok(calculateGratuity({ country: "Egypt", hireDate: "2018-01-01", exitDate: "2026-01-01", basicMonthlySalary: 10000 }).amount > 0);
  assert.ok(calculateGratuity({ country: "Jordan", hireDate: "2020-01-01", exitDate: "2024-01-01", basicMonthlySalary: 8000 }).amount > 0);
});

test("SOP search salary certificate hits sop-salary-certificate.md", async () => {
  const result = await searchSops({ query: "salary certificate" });
  assert.equal(result.ok, true);
  assert.ok((result as { results: Array<{ path: string }> }).results.some((r) => r.path.includes("sop-salary-certificate.md")));
});

test("SOP search mars colony allowance writes a gap", async () => {
  const result = await searchSops({ query: "mars colony allowance", employeeId: "1002" });
  assert.equal((result as { gap?: boolean }).gap, true);
  assert.ok((result as { gaps: unknown[] }).gaps.length >= 1);
  assert.equal((result as { message: string }).message.includes("SOP") || (result as { message: string }).message.includes("HR") || (result as { message: string }).message.includes("سجلت"), true);
});

test("onboarding complete before IBAN returns MISSING_FIELD", async () => {
  resetData();
  await startOnboarding({ employeeId: "1002" });
  await submitOnboardingDocument({ employeeId: "1002", documentType: "iqama_copy", value: "scan.pdf" });
  await assignOrientation({ employeeId: "1002" });
  const result = await completeOnboarding({ employeeId: "1002" });
  assert.equal(result.ok, false);
  assert.equal((result as { code: string }).code, "MISSING_FIELD");
  assert.equal((result as { field: string }).field, "bank_iban");
});

test("weekly summary for Ahmad returns fixture rows and an average", async () => {
  const result = await weeklyTeamPerformance({
    name: "Ahmad",
    weekStart: "2026-08-21",
    weekEnd: "2026-08-27",
    text: "How did Ahmad’s team perform this week?",
  });
  assert.ok(result.summary.rows >= 1);
  assert.ok(result.summary.averageRating > 0);
  assert.equal(result.lead, "Ahmad Al-Harbi");
});

test("Iqama in 10 days is expiring with daysLeft 10", () => {
  const result = evaluateIqama("2026-09-06", "2026-08-27");
  assert.equal(result.status, "expiring");
  assert.equal(result.daysLeft, 10);
  assert.equal(evaluateIqama("2026-08-01", "2026-08-27").status, "expired");
});
