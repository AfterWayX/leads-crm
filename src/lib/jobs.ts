import type { Temperature } from "@/types/crm";

const STACK_KEYWORDS = [
  "react",
  "next",
  "typescript",
  "node",
  "nestjs",
  "postgres",
  "postgresql",
  "redis",
  "elasticsearch",
  "aws",
  "supabase",
];

export function computeJobFit(input: {
  tech_stack: string[];
  moldova_eligible: boolean;
  region?: string | null;
  salary_min_usd?: number | null;
  title?: string | null;
}): { score: number; temperature: Temperature } {
  let score = 0;
  const stack = input.tech_stack.map((s) => s.toLowerCase());
  const stackHits = STACK_KEYWORDS.filter((k) =>
    stack.some((s) => s.includes(k))
  ).length;
  score += Math.min(5, stackHits);

  if (input.moldova_eligible) score += 2;

  const region = (input.region || "").toUpperCase();
  if (region.includes("EMEA") || region.includes("WORLD")) score += 1;
  if (region.includes("US")) score += 1;

  const min = input.salary_min_usd ?? 0;
  if (min >= 5000) score += 1;
  else if (min >= 3500) score += 1;

  const title = (input.title || "").toLowerCase();
  if (
    title.includes("senior") ||
    title.includes("lead") ||
    title.includes("staff")
  ) {
    score += 1;
  }

  score = Math.min(10, score);

  let temperature: Temperature = "IGNORE";
  if (score >= 8) temperature = "HOT";
  else if (score >= 6) temperature = "GOOD";
  else if (score >= 4) temperature = "MAYBE";

  return { score, temperature };
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `$${min.toLocaleString()}–$${max.toLocaleString()}/mo`;
  if (min != null) return `$${min.toLocaleString()}+/mo`;
  return `up to $${max!.toLocaleString()}/mo`;
}
