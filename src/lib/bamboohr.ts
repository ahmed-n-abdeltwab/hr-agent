import { seedEmployees, seedTimeOffTypes } from "./assets.js";
import { parseMode, readEnv } from "./locale.js";

export type Employee = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  workEmail: string;
  phone?: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  supervisor: string;
  supervisorEId: string;
  location: string;
  country: string;
  customIqamaNumber: string;
  customIqamaExpiry: string;
  customEntity: string;
  customBankIban: string;
  basicMonthlySalary: number;
  leaveBalanceAnnual: number;
};

export type TimeOffRequest = {
  start: string;
  end: string;
  timeOffTypeId: number;
  notes?: string;
  status?: string;
};

export type OnboardingTask = {
  name: string;
  dueDate: string;
  completed: boolean;
};

export type BambooError = {
  ok: false;
  code: "UPSTREAM_ERROR";
  status: number;
  body?: string;
};

function bambooError(status: number, body?: string): BambooError {
  return { ok: false, code: "UPSTREAM_ERROR", status, body };
}

const mockStore = {
  employees: seedEmployees as Employee[],
  types: { ...seedTimeOffTypes } as Record<string, number>,
  timeOff: [] as Array<TimeOffRequest & { employeeId: string; id: string }>,
  checklists: new Map<string, OnboardingTask[]>(),
};

function isMock(): boolean {
  return parseMode(readEnv("BAMBOOHR_MODE", "mock")) === "mock";
}

function basicAuth(): string {
  const key = readEnv("BAMBOOHR_API_KEY", "mock");
  return `Basic ${Buffer.from(`${key}:x`).toString("base64")}`;
}

function subdomain(): string {
  return readEnv("BAMBOOHR_SUBDOMAIN", "pilot");
}

async function bambooFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `https://api.bamboohr.com/api/gateway.php/${subdomain()}/v1${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: basicAuth(),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function liveOrMock<T>(live: () => Promise<T | BambooError>, mock: () => T): Promise<T | BambooError> {
  if (isMock()) return mock();
  try {
    return await live();
  } catch {
    return mock();
  }
}

const FIELDS = [
  "firstName",
  "lastName",
  "workEmail",
  "department",
  "jobTitle",
  "hireDate",
  "supervisor",
  "supervisorEId",
  "location",
  "country",
  "customIqamaNumber",
  "customIqamaExpiry",
  "customEntity",
  "customBankIban",
].join(",");

function toEmployee(id: string, row: Record<string, string>): Employee {
  const local = mockStore.employees.find((e) => e.id === id);
  return {
    id,
    employeeNumber: id,
    firstName: row.firstName ?? "",
    lastName: row.lastName ?? "",
    workEmail: row.workEmail ?? "",
    department: row.department ?? "",
    jobTitle: row.jobTitle ?? "",
    hireDate: row.hireDate ?? "",
    supervisor: row.supervisor ?? "",
    supervisorEId: row.supervisorEId ?? "",
    location: row.location ?? "",
    country: row.country ?? "",
    customIqamaNumber: row.customIqamaNumber ?? "",
    customIqamaExpiry: row.customIqamaExpiry ?? "",
    customEntity: row.customEntity ?? "",
    customBankIban: row.customBankIban ?? "",
    phone: local?.phone,
    preferredName: local?.preferredName,
    basicMonthlySalary: local?.basicMonthlySalary ?? 0,
    leaveBalanceAnnual: local?.leaveBalanceAnnual ?? 0,
  };
}

export const bamboohr = {
  async getEmployee(id: string): Promise<Employee | BambooError | undefined> {
    return liveOrMock(
      async () => {
        const res = await bambooFetch(`/employees/${id}?fields=${FIELDS}`);
        if (!res.ok) return bambooError(res.status, await res.text());
        const json = (await res.json()) as Record<string, string>;
        return toEmployee(id, json);
      },
      () => mockStore.employees.find((e) => e.id === id || e.employeeNumber === id),
    );
  },

  async searchEmployee(query: { workEmail?: string; employeeNumber?: string; phone?: string; name?: string }): Promise<Employee | undefined> {
    const list = mockStore.employees;
    const email = query.workEmail?.toLowerCase();
    const name = query.name?.toLowerCase();
    return list.find((e) => {
      if (email && e.workEmail.toLowerCase() === email) return true;
      if (query.employeeNumber && (e.employeeNumber === query.employeeNumber || e.id === query.employeeNumber)) return true;
      if (query.phone && e.phone === query.phone) return true;
      if (name && `${e.firstName} ${e.lastName}`.toLowerCase().includes(name)) return true;
      if (name && e.preferredName?.toLowerCase() === name) return true;
      return false;
    });
  },

  async listEmployees(): Promise<Employee[]> {
    return mockStore.employees.slice();
  },

  async requestTimeOff(employeeId: string, body: TimeOffRequest): Promise<{ id: string; status: string } | BambooError> {
    return liveOrMock(
      async () => {
        const res = await bambooFetch(`/employees/${employeeId}/time_off/request`, {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok) return bambooError(res.status, await res.text());
        const json = (await res.json().catch(() => ({ id: "live" }))) as { id?: string };
        return { id: String(json.id ?? "live"), status: body.status ?? "requested" };
      },
      () => {
        const id = `to-${mockStore.timeOff.length + 1}`;
        mockStore.timeOff.push({ ...body, employeeId, id });
        return { id, status: body.status ?? "requested" };
      },
    );
  },

  async getLeaveBalance(employeeId: string, start: string, end: string): Promise<{ balance: number } | BambooError> {
    return liveOrMock(
      async () => {
        const res = await bambooFetch(`/employees/${employeeId}/time_off/calculator/?start=${start}&end=${end}`);
        if (!res.ok) return bambooError(res.status, await res.text());
        const json = (await res.json()) as { balance?: number; amount?: number };
        return { balance: Number(json.balance ?? json.amount ?? 0) };
      },
      () => {
        const emp = mockStore.employees.find((e) => e.id === employeeId);
        return { balance: emp?.leaveBalanceAnnual ?? 0 };
      },
    );
  },

  async getTimeOffTypes(): Promise<Record<string, number> | BambooError> {
    return liveOrMock(
      async () => {
        const res = await bambooFetch(`/meta/time_off/types/`);
        if (!res.ok) return bambooError(res.status, await res.text());
        const json = (await res.json()) as { timeOffTypes?: Array<{ id: number; name: string }> };
        const map: Record<string, number> = { ...mockStore.types };
        for (const t of json.timeOffTypes ?? []) {
          const n = t.name.toLowerCase();
          if (n.includes("annual") || n.includes("vacation")) map.annual = t.id;
          if (n.includes("sick")) map.sick = t.id;
          if (n.includes("emergency")) map.emergency = t.id;
        }
        return map;
      },
      () => ({ ...mockStore.types }),
    );
  },

  async upsertOnboardingTask(employeeId: string, task: OnboardingTask): Promise<{ ok: true } | BambooError> {
    return liveOrMock(
      async () => {
        const res = await bambooFetch(`/employees/${employeeId}/onboarding/tasks`, {
          method: "PUT",
          body: JSON.stringify(task),
        });
        if (!res.ok) {
          const retry = await bambooFetch(`/employees/${employeeId}/onboarding/tasks`, {
            method: "POST",
            body: JSON.stringify(task),
          });
          if (!retry.ok) return bambooError(retry.status, await retry.text());
        }
        return { ok: true as const };
      },
      () => {
        const current = mockStore.checklists.get(employeeId) ?? [];
        const idx = current.findIndex((t) => t.name === task.name);
        if (idx >= 0) current[idx] = task;
        else current.push(task);
        mockStore.checklists.set(employeeId, current);
        return { ok: true as const };
      },
    );
  },
};

export function isBambooError(value: unknown): value is BambooError {
  return Boolean(value && typeof value === "object" && (value as BambooError).code === "UPSTREAM_ERROR");
}
