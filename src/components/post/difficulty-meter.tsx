import { cn, difficultyLabel } from "@/lib/utils";

export function DifficultyMeter({
  value,
  showLabel = true,
}: {
  value: number;
  showLabel?: boolean;
}) {
  const color =
    value <= 3
      ? "bg-emerald-500"
      : value <= 6
        ? "bg-amber-500"
        : value <= 8
          ? "bg-orange-500"
          : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3 w-1.5 rounded-full",
              i < value ? color : "bg-muted",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {value}/10 · {difficultyLabel(value)}
        </span>
      )}
    </div>
  );
}
