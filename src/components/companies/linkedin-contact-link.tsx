import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function LinkedInContactLink({
  name,
  href,
  className,
}: {
  name: string;
  href: string | null | undefined;
  className?: string;
}) {
  if (!href) {
    return <span className={cn("text-zinc-500", className)}>{name}</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`Open ${name} on LinkedIn`}
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-sky-700 hover:underline",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="truncate">{name}</span>
      <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
    </a>
  );
}
