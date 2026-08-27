import { readKnowledgeFiles } from "./assets.js";
import { parseMode, readEnv } from "./locale.js";

export type SearchHit = {
  slug: string;
  title: string;
  snippet: string;
  score: number;
  country: string[];
  path: string;
};

type Doc = {
  slug: string;
  title: string;
  country: string[];
  lastUpdated: string;
  body: string;
  path: string;
};

const memory = {
  onboarding_cases: new Map<string, Record<string, unknown>>(),
  sop_gaps: [] as Array<Record<string, unknown>>,
};

function parseFront(raw: string, file: string): Doc {
  const title = raw.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? file;
  const country = (raw.match(/^country:\s*(.+)$/m)?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const lastUpdated = raw.match(/^lastUpdated:\s*(.+)$/m)?.[1]?.trim() ?? "";
  return {
    slug: file.replace(/\.md$/, ""),
    title,
    country,
    lastUpdated,
    body: raw,
    path: `knowledge/${file}`,
  };
}

function loadDocs(): Doc[] {
  return readKnowledgeFiles().map(({ file, raw }) => parseFront(raw, file));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function overlapScore(query: string, doc: Doc): number {
  const q = new Set(tokenize(query));
  const d = tokenize(`${doc.title} ${doc.body}`);
  if (q.size === 0) return 0;
  let hit = 0;
  for (const token of q) if (d.includes(token)) hit += 1;
  const base = hit / q.size;
  const titleBoost = tokenize(doc.title).some((t) => q.has(t)) ? 0.25 : 0;
  return Math.min(1, base + titleBoost);
}

export async function dataSearch(
  collection: string,
  query: string,
  limit = 5,
  minScore = 0.7,
): Promise<SearchHit[]> {
  if (collection !== "hr_policies") return [];
  const mode = parseMode(readEnv("DATA_MODE", "mock"));
  if (mode === "live") {
    try {
      const mod = await import("lua-cli");
      const Data = (mod as { Data?: { search: Function } }).Data;
      if (Data?.search) return Data.search(collection, query, limit, minScore);
    } catch {
      // fall through to local search
    }
  }
  return loadDocs()
    .map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      snippet: doc.body.split("\n").filter((l) => l.trim() && !l.startsWith("title:") && !l.startsWith("country:") && !l.startsWith("lastUpdated:"))[0] ?? "",
      score: overlapScore(query, doc),
      country: doc.country,
      path: doc.path,
    }))
    .filter((h) => h.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getSopBySlug(slug: string): Doc | undefined {
  return loadDocs().find((d) => d.slug === slug || d.path.endsWith(`${slug}.md`));
}

export async function dataUpsert(collection: string, key: string, value: Record<string, unknown>): Promise<void> {
  if (collection === "onboarding_cases") memory.onboarding_cases.set(key, value);
  if (collection === "sop_gaps") memory.sop_gaps.push({ ...value, id: key });
}

export function getOnboardingCase(employeeId: string): Record<string, unknown> | undefined {
  return memory.onboarding_cases.get(employeeId);
}

export function listSopGaps(): Array<Record<string, unknown>> {
  return memory.sop_gaps.slice();
}

export function resetData(): void {
  memory.onboarding_cases.clear();
  memory.sop_gaps.length = 0;
}
