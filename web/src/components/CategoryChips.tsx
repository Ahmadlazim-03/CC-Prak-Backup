"use client";
import type { Category } from "@/lib/types";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryChips({
  categories,
  active,
  onChange,
}: {
  categories: Category[];
  active: number | null; // category_id atau null = Semua
  onChange: (id: number | null) => void;
}) {
  const chip = (selected: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      selected
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"
    }`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button type="button" className={chip(active === null)} onClick={() => onChange(null)}>
        Semua
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={chip(active === c.id)}
          onClick={() => onChange(c.id)}
        >
          <CategoryIcon name={c.icon} size={14} />
          {c.name}
        </button>
      ))}
    </div>
  );
}
