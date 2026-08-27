import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import checkinsJson from "../../fixtures/checkins.json" with { type: "json" };
import employeesJson from "../../fixtures/employees.json" with { type: "json" };
import orientationJson from "../../fixtures/orientation.json" with { type: "json" };
import timeOffTypesJson from "../../fixtures/timeOffTypes.json" with { type: "json" };
import { knowledgeSeed } from "./knowledgeSeed.js";

/** Seed data is imported so lua-cli's CJS bundle inlines it (no import.meta.url / cwd). */
export const seedEmployees = employeesJson;
export const seedTimeOffTypes = timeOffTypesJson;
export const seedOrientation = orientationJson;
export const seedCheckins = checkinsJson;

export function knowledgeDir(): string | undefined {
  const start = typeof process !== "undefined" && typeof process.cwd === "function" ? process.cwd() : "";
  if (!start || start === "/") return undefined;
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "knowledge");
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      return undefined;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

export function readKnowledgeFiles(): Array<{ file: string; raw: string }> {
  const dir = knowledgeDir();
  if (dir) {
    try {
      const fromDisk = readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((file) => ({ file, raw: readFileSync(join(dir, file), "utf8") }));
      if (fromDisk.length) return fromDisk;
    } catch {
      // lua sandbox cwd is fake; use the bundled seed
    }
  }
  return knowledgeSeed;
}
