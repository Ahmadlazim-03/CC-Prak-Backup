"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Heart, Settings } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/map", label: "Peta", icon: Map },
  { href: "/favorites", label: "Favorit", icon: Heart },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-black/5 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                active ? "text-emerald-600" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
