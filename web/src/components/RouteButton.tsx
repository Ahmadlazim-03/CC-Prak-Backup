"use client";
import { Navigation } from "lucide-react";

/** Tombol "Buka Rute" — membuka aplikasi peta (intent URL) ke koordinat tujuan. */
export function RouteButton({
  lat,
  lng,
  name,
  variant = "solid",
  className = "",
}: {
  lat: number;
  lng: number;
  name?: string;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const openRoute = () => {
    // Universal Google Maps directions URL (dipakai dari posisi pengguna saat ini).
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${
      name ? `&destination_place_id=&travelmode=driving` : ""
    }`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "solid"
      ? "bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3"
      : "border border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 px-3 py-2 text-sm";

  return (
    <button onClick={openRoute} className={`${base} ${styles} ${className}`} type="button">
      <Navigation size={variant === "solid" ? 18 : 15} />
      Buka Rute
    </button>
  );
}
