"use client";
import { useCallback, useEffect, useState } from "react";
import { apiGet, qs } from "@/lib/client-api";
import { getDeviceId } from "@/lib/device";
import { useRealtime } from "@/lib/useRealtime";
import type { Place } from "@/lib/types";
import { PlaceCard } from "@/components/PlaceCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/States";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlaces(await apiGet<Place[]>("/api/favorites" + qs({ user_id: getDeviceId() })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat favorit");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(() => load(), ["favorites"]);

  return (
    <div>
      <header className="bg-gradient-to-br from-rose-500 to-red-600 px-4 pb-4 pt-6 text-white">
        <h1 className="inline-flex items-center gap-2 text-xl font-bold">
          <Heart size={20} className="fill-white" /> Favorit
        </h1>
        <p className="text-sm text-rose-50/90">Tempat yang kamu simpan.</p>
      </header>

      <section className="space-y-2.5 px-4 py-3 pb-28">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : places.length === 0 ? (
          <EmptyState label="Belum ada favorit. Tekan ♡ pada halaman detail untuk menyimpan." />
        ) : (
          places.map((p) => <PlaceCard key={p.id} place={p} />)
        )}
      </section>
    </div>
  );
}
