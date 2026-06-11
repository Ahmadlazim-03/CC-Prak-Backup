import { Star } from "lucide-react";

export function StarRating({
  value,
  size = 14,
  showNumber = true,
}: {
  value: number | null | undefined;
  size?: number;
  showNumber?: boolean;
}) {
  const v = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`Rating ${v}`}>
      <Star size={size} className="fill-amber-400 stroke-amber-500" />
      {showNumber && <span className="font-medium text-foreground/80">{v.toFixed(1)}</span>}
    </span>
  );
}
