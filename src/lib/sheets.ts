import { seedCheckins } from "./assets.js";
import { parseMode, readEnv } from "./locale.js";

export type CheckinRow = {
  date: string;
  team_lead_email: string;
  team_lead_name: string;
  employee_id: string;
  employee_name: string;
  accomplished: string;
  blockers: string;
  rating: number;
  country: string;
  entity: string;
};

export type WeeklySummary = {
  teamLeadName: string;
  weekStart: string;
  weekEnd: string;
  headcount: number;
  averageRating: number;
  blockerList: string[];
  perPerson: Array<{ employee_id: string; employee_name: string; averageRating: number; rows: number }>;
  rows: number;
};

const rows: CheckinRow[] = (seedCheckins as CheckinRow[]).slice();

function isMock(): boolean {
  return parseMode(readEnv("SHEETS_MODE", "mock")) === "mock";
}

export const sheets = {
  async appendCheckin(row: CheckinRow): Promise<{ ok: true; rowCount: number }> {
    if (!isMock()) {
      const sheetId = readEnv("PERFORMANCE_SHEET_ID");
      const creds = readEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "{}");
      if (!sheetId || creds === "{}") {
        rows.push(row);
        return { ok: true, rowCount: rows.length };
      }
    }
    rows.push(row);
    return { ok: true, rowCount: rows.length };
  },

  async getWeeklySummary(input: {
    teamLeadName?: string;
    teamLeadEmail?: string;
    weekStart: string;
    weekEnd: string;
  }): Promise<WeeklySummary> {
    const name = input.teamLeadName?.toLowerCase();
    const email = input.teamLeadEmail?.toLowerCase();
    const matched = rows.filter((r) => {
      const inWeek = r.date >= input.weekStart && r.date <= input.weekEnd;
      if (!inWeek) return false;
      if (email && r.team_lead_email.toLowerCase() === email) return true;
      if (name && r.team_lead_name.toLowerCase().includes(name)) return true;
      return !name && !email;
    });
    const byPerson = new Map<string, CheckinRow[]>();
    for (const r of matched) {
      const list = byPerson.get(r.employee_id) ?? [];
      list.push(r);
      byPerson.set(r.employee_id, list);
    }
    const ratings = matched.map((r) => r.rating);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      teamLeadName: input.teamLeadName ?? input.teamLeadEmail ?? "",
      weekStart: input.weekStart,
      weekEnd: input.weekEnd,
      headcount: byPerson.size,
      averageRating: Math.round(avg * 100) / 100,
      blockerList: matched.map((r) => r.blockers).filter(Boolean),
      perPerson: [...byPerson.entries()].map(([id, list]) => ({
        employee_id: id,
        employee_name: list[0].employee_name,
        averageRating: Math.round((list.reduce((a, b) => a + b.rating, 0) / list.length) * 100) / 100,
        rows: list.length,
      })),
      rows: matched.length,
    };
  },
};
