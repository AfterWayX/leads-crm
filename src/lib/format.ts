import { TemperatureBadge } from "@/components/companies/temperature-badge";

export { TemperatureBadge };

export function formatFunding(
  amount: number | null | undefined,
  round: string | null | undefined
) {
  if (!amount && !round) return "—";
  const amt =
    typeof amount === "number"
      ? `€${amount >= 1_000_000 ? `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M` : amount.toLocaleString()}`
      : null;
  if (amt && round) return `${amt} ${round}`;
  return amt || round || "—";
}
