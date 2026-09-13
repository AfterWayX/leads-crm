import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  HOT: "bg-red-100 text-red-800 border-red-200",
  GOOD: "bg-amber-100 text-amber-800 border-amber-200",
  MAYBE: "bg-zinc-100 text-zinc-700 border-zinc-200",
  IGNORE: "bg-zinc-50 text-zinc-400 border-zinc-100",
};

export function TemperatureBadge({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) {
  const v = value || "IGNORE";
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", COLORS[v] || COLORS.IGNORE, className)}
    >
      {v}
    </Badge>
  );
}
