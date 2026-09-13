import type { ScoreBreakdown, Temperature } from "@/types/crm";

export type ScoringInput = {
  funding_date?: string | null;
  hiring?: boolean | null;
  hiring_count?: number | null;
  employees?: number | null;
  segment?: string | null;
  industry?: string | null;
  has_founder_contact?: boolean;
  tech_stack?: string[] | null;
};

const STACK_MATCH = [
  "react",
  "next.js",
  "nextjs",
  "node",
  "node.js",
  "typescript",
  "ai",
  "llm",
  "python",
];

function monthsSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return Infinity;
  const now = new Date();
  return (
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth())
  );
}

export function computeScore(input: ScoringInput): {
  score: number;
  breakdown: ScoreBreakdown;
  temperature: Temperature;
} {
  const breakdown: ScoreBreakdown = {
    recent_funding: 0,
    hiring_devs: 0,
    employee_range: 0,
    saas_ai_product: 0,
    founder_identified: 0,
    stack_match: 0,
  };

  if (input.funding_date && monthsSince(input.funding_date) <= 3) {
    breakdown.recent_funding = 2;
  }

  if (input.hiring || (input.hiring_count && input.hiring_count > 0)) {
    breakdown.hiring_devs = 2;
  }

  if (
    typeof input.employees === "number" &&
    input.employees >= 10 &&
    input.employees <= 100
  ) {
    breakdown.employee_range = 2;
  }

  const seg = (input.segment || "").toLowerCase();
  const ind = (input.industry || "").toLowerCase();
  if (
    seg.includes("ai") ||
    seg.includes("saas") ||
    ind.includes("ai") ||
    ind.includes("saas")
  ) {
    breakdown.saas_ai_product = 2;
  }

  if (input.has_founder_contact) {
    breakdown.founder_identified = 1;
  }

  const stack = (input.tech_stack || []).map((s) => s.toLowerCase());
  if (stack.some((s) => STACK_MATCH.some((m) => s.includes(m)))) {
    breakdown.stack_match = 1;
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const temperature = scoreToTemperature(score);

  return { score, breakdown, temperature };
}

export function scoreToTemperature(score: number): Temperature {
  if (score >= 8) return "HOT";
  if (score >= 6) return "GOOD";
  if (score >= 4) return "MAYBE";
  return "IGNORE";
}
