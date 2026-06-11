"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet, qs } from "@/lib/client-api";
import { useGeolocation } from "@/lib/useGeolocation";
import { useRealtime } from "@/lib/useRealtime";
import type { Place } from "@/lib/types";
import { formatDistance } from "@/lib/haversine";
import { RouteButton } from "@/components/RouteButton";
import { StarRating } from "@/components/StarRating";
import { CategoryIcon } from "@/components/CategoryIcon";
import { LoadingState } from "@/components/States";
import { ChevronRight, MapPin, X } from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingState label="Memuat peta…" />,
});

export default function MapPage() {
  const geo = useGeolocation(true);
  const loc = geo.status === "granted" ? { lat: geo.lat!, lng: geo.lng! } : null;

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPlaces(await apiGet<Place[]>("/api/places" + qs({ lat: loc?.lat, lng: loc?.lng })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat tempat");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.lat, loc?.lng]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(() => load(), ["places"]);

  // Sinkronkan distance pada kartu terpilih saat data refresh.
  useEffect(() => {
    if (selected) {
      const fresh = places.find((p) => p.id === selected.id);
      if (fresh) setSelected(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  return (
    <div className="relative h-[calc(100dvh-52px)] w-full overflow-hidden">
      <MapView places={places} user={loc} selectedId={selected?.id ?? null} onSelect={setSelected} />

      {error && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white shadow">
          {error}
        </div>
      )}

      {/* Bottom sheet tempat terpilih */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10 dark:bg-neutral-900">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.photo_url ?? `https://picsum.photos/seed/amd${selected.id}/200/200`}
                alt={selected.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold">{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-foreground/40 hover:text-foreground"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CategoryIcon name={selected.category_icon} size={12} /> {selected.category}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-foreground/60">
                  {selected.distance_m != null && (
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                      <MapPin size={12} /> {formatDistance(selected.distance_m)}
                    </span>
                  )}
                  {selected.rating != null && <StarRating value={selected.rating} size={12} />}
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/place/${selected.id}`}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-medium hover:bg-foreground/5"
              >
                Detail <ChevronRight size={15} />
              </Link>
              <RouteButton
                lat={selected.latitude}
                lng={selected.longitude}
                name={selected.name}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
