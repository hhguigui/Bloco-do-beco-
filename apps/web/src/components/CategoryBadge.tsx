import { CATEGORY_META } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      data-testid={`category-badge-${category}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider",
        className,
      )}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
