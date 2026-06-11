"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, qs } from "@/lib/client-api";
import { useGeolocation } from "@/lib/useGeolocation";
import { useRealtime } from "@/lib/useRealtime";
import type { Category, Place } from "@/lib/types";
import { CategoryChips } from "@/components/CategoryChips";
import { PlaceCard } from "@/components/PlaceCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { Search, MapPinned, Navigation, MapPinOff } from "lucide-react";

export default function HomePage() {
  const geo = useGeolocation(true);
  const loc = geo.status === "granted" ? { lat: geo.lat!, lng: geo.lng! } : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    apiGet<Category[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path =
        "/api/places" +
        qs({
          category: activeCat ?? undefined,
          q: debounced || undefined,
          lat: loc?.lat,
          lng: loc?.lng,
          sort: loc ? "distance" : undefined,
        });
      setPlaces(await apiGet<Place[]>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, debounced, loc?.lat, loc?.lng]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(() => load(), ["places"]);

  return (
    <div className="flex flex-col">
      <header className="bg-gradient-to-br from-emerald-600 to-teal-700 px-4 pb-4 pt-6 text-white">
        <h1 className="text-xl font-bold">Kampus Directory</h1>
        <p className="text-sm text-emerald-50/90">Tempat di sekitar kampus, lengkap dengan rute.</p>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-neutral-700 shadow-sm">
          <Search size={18} className="text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tempat… (nama / alamat)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        {geo.status === "loading" && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-50/90">
            <Navigation size={12} className="animate-pulse" /> Mendeteksi lokasimu…
          </p>
        )}
        {(geo.status === "denied" || geo.status === "error" || geo.status === "unsupported") && (
          <button
            onClick={geo.request}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/25"
          >
            <MapPinOff size={13} /> Aktifkan lokasi untuk jarak & urutan terdekat
          </button>
        )}
      </header>

      <div className="sticky top-0 z-20 border-b border-black/5 bg-background/95 px-4 py-2.5 backdrop-blur">
        <CategoryChips categories={categories} active={activeCat} onChange={setActiveCat} />
      </div>

      <section className="flex-1 space-y-2.5 px-4 py-3 pb-28">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : places.length === 0 ? (
          <EmptyState label="Belum ada tempat yang cocok." />
        ) : (
          <>
            <p className="px-1 text-xs text-foreground/50">
              {places.length} tempat{loc ? " · diurutkan dari terdekat" : ""}
            </p>
            {places.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </>
        )}
      </section>

      <Link
        href="/map"
        className="fixed bottom-20 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/25 active:scale-95 dark:bg-white dark:text-neutral-900"
      >
        <MapPinned size={17} /> Lihat Peta
      </Link>
    </div>
  );
}
