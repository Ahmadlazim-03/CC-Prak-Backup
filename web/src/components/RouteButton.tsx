"use client";
import Link from "next/link";
import { Navigation } from "lucide-react";

/**
 * Tombol "Buka Rute".
 * - Bila `onRoute` diberikan (mis. di halaman peta) → memicu gambar rute IN-APP.
 * - Bila tidak → navigasi ke /map?dest=<id> yang lalu menggambar rute di peta.
 * Tidak lagi redirect ke Google Maps (itu dipindah jadi opsi sekunder di panel rute).
 */
export function RouteButton({
  placeId,
  onRoute,
  variant = "solid",
  className = "",
  label = "Buka Rute",
}: {
  placeId: number;
  onRoute?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
  label?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "solid"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3"
      : "border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 px-3 py-2 text-sm";
  const size = variant === "solid" ? 18 : 15;

  if (onRoute) {
    return (
      <button onClick={onRoute} className={`${base} ${styles} ${className}`} type="button">
        <Navigation size={size} /> {label}
      </button>
    );
  }
  return (
    <Link href={`/map?dest=${placeId}`} className={`${base} ${styles} ${className}`}>
      <Navigation size={size} /> {label}
    </Link>
  );
}
