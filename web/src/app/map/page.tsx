"use client";
import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiGet, qs } from "@/lib/client-api";
import { useGeolocation } from "@/lib/useGeolocation";
import { useRealtime } from "@/lib/useRealtime";
import { usePresence } from "@/lib/usePresence";
import { useShareLocation } from "@/lib/useShareLocation";
import { useAuth } from "@/components/AuthProvider";
import { getDeviceId } from "@/lib/device";
import type { Category, Place } from "@/lib/types";
import { formatDistance } from "@/lib/haversine";
import { RouteButton } from "@/components/RouteButton";
import { StarRating } from "@/components/StarRating";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryChips } from "@/components/CategoryChips";
import { PlacePhoto } from "@/components/PlacePhoto";
import { LoadingState } from "@/components/States";
import type { RouteGeometry } from "@/components/MapView";
import {
  ChevronRight,
  MapPin,
  X,
  Car,
  Footprints,
  Bike,
  Clock,
  Radio,
  Users,
  ExternalLink,
  Plus,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";

const MapView = nextDynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <LoadingState label="Memuat peta…" />,
});

type Profile = "driving" | "walking" | "cycling";
type RouteData = { geometry: RouteGeometry; distance_m: number; duration_s: number };

function formatDuration(s: number): string {
  const m = Math.round(s / 60);
  if (m < 60) return `${m} mnt`;
  return `${Math.floor(m / 60)} jam ${m % 60} mnt`;
}

function MapPageInner() {
  const params = useSearchParams();
  const destId = params.get("dest");
  const geo = useGeolocation(true);
  const loc = geo.status === "granted" ? { lat: geo.lat!, lng: geo.lng! } : null;
  const { user } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cari & filter kategori (di peta)
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    apiGet<Category[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);
  const filteredPlaces = useMemo(
    () =>
      places.filter(
        (p) =>
          (activeCat == null || p.category_id === activeCat) &&
          (!debounced ||
            p.name.toLowerCase().includes(debounced) ||
            (p.address ?? "").toLowerCase().includes(debounced)),
      ),
    [places, activeCat, debounced],
  );

  // Rute
  const [routeTarget, setRouteTarget] = useState<Place | null>(null);
  const [profile, setProfile] = useState<Profile>("driving");
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeErr, setRouteErr] = useState<string | null>(null);

  // Berbagi lokasi (presence)
  const myId = user?.id ?? getDeviceId();
  const others = usePresence(myId);
  const [sharing, setSharing] = useState(false);
  const shareProfile = useMemo(
    () => ({
      name:
        (user?.user_metadata?.full_name as string) ?? user?.email ?? "Tamu",
      avatarUrl: (user?.user_metadata?.avatar_url as string) ?? null,
      isGuest: !user,
    }),
    [user],
  );
  useShareLocation(sharing, shareProfile);

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

  // Ambil rute dari OSRM (via /api/route) untuk target + profil aktif.
  const fetchRoute = useCallback(
    async (target: Place, prof: Profile) => {
      if (!loc) {
        setRouteErr("Aktifkan GPS dulu untuk membuat rute.");
        return;
      }
      setRouteLoading(true);
      setRouteErr(null);
      try {
        const data = await apiGet<RouteData>(
          "/api/directions" +
            qs({
              fromLat: loc.lat,
              fromLng: loc.lng,
              toLat: target.latitude,
              toLng: target.longitude,
              profile: prof,
            }),
        );
        setRoute(data);
      } catch (e) {
        setRouteErr(e instanceof Error ? e.message : "Gagal membuat rute");
        setRoute(null);
      } finally {
        setRouteLoading(false);
      }
    },
    [loc],
  );

  const startRoute = (target: Place) => {
    setSelected(null);
    setRouteTarget(target);
    fetchRoute(target, profile);
  };

  const changeProfile = (p: Profile) => {
    setProfile(p);
    if (routeTarget) fetchRoute(routeTarget, p);
  };

  const clearRoute = () => {
    setRouteTarget(null);
    setRoute(null);
    setRouteErr(null);
  };

  // Auto-buka rute bila datang dari /map?dest=<id>.
  useEffect(() => {
    if (!destId || !places.length || !loc) return;
    const target = places.find((p) => String(p.id) === destId);
    if (target && (!routeTarget || routeTarget.id !== target.id)) startRoute(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destId, places, loc?.lat, loc?.lng]);

  return (
    <div className="flex h-[calc(100dvh-52px)] w-full flex-col overflow-hidden">
      {/* Top bar: cari + bagikan lokasi + kategori */}
      <div className="z-20 shrink-0 space-y-2 border-b border-black/5 bg-background/95 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-foreground/5 px-3 py-2">
            <Search size={16} className="text-foreground/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tempat di peta…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Bersihkan" className="text-foreground/40">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSharing((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm ring-1 ring-black/5 transition ${
              sharing ? "bg-violet-600 text-white" : "bg-white text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            }`}
            aria-label="Bagikan lokasi"
          >
            <Radio size={14} className={sharing ? "animate-pulse" : ""} />
            {sharing ? "Berbagi" : "Bagikan"}
          </button>
        </div>
        <CategoryChips
          categories={categories}
          active={activeCat}
          onChange={(id) => {
            setActiveCat(id);
            setSelected(null);
          }}
        />
      </div>

      {/* Area peta */}
      <div className="relative flex-1">
        <MapView
          places={filteredPlaces}
          user={loc}
          selectedId={selected?.id ?? routeTarget?.id ?? null}
          onSelect={(p) => {
            if (!routeTarget) setSelected(p);
          }}
          others={others}
          route={route?.geometry ?? null}
        />

        {error && (
          <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white shadow">
            {error}
          </div>
        )}

        {/* Indikator jumlah orang lain online */}
        {others.length > 0 && (
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-violet-700 shadow ring-1 ring-black/5 backdrop-blur">
            <Users size={13} /> {others.length} orang online
          </div>
        )}

        {/* FAB Tambah tempat (seperti Google Maps) */}
        {!selected && !routeTarget && (
          <Link
            href="/add"
            className="absolute bottom-28 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <Plus size={18} /> Tambah
          </Link>
        )}

        {/* Hasil filter kosong */}
        {filteredPlaces.length === 0 && !error && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground/60 shadow ring-1 ring-black/5 backdrop-blur">
            Tak ada tempat cocok di filter ini
          </div>
        )}

      {/* Bottom sheet tempat terpilih (saat tidak sedang rute) */}
      {selected && !routeTarget && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10 dark:bg-neutral-900">
            <div className="flex gap-3">
              <PlacePhoto
                photoUrl={selected.photo_url}
                icon={selected.category_icon}
                className="h-16 w-16 shrink-0 rounded-xl"
                iconSize={24}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold">{selected.name}</h3>
                  <button onClick={() => setSelected(null)} className="text-foreground/40 hover:text-foreground" aria-label="Tutup">
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
              <RouteButton placeId={selected.id} onRoute={() => startRoute(selected)} className="flex-1" />
            </div>
          </div>
        </div>
      )}

      {/* Panel rute aktif */}
      {routeTarget && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-foreground/50">Rute menuju</p>
                <h3 className="truncate font-semibold">{routeTarget.name}</h3>
              </div>
              <button onClick={clearRoute} className="text-foreground/40 hover:text-foreground" aria-label="Tutup rute">
                <X size={18} />
              </button>
            </div>

            {/* Pemilih moda */}
            <div className="mt-2 flex gap-1.5">
              {([
                { id: "driving", icon: Car, label: "Mobil" },
                { id: "walking", icon: Footprints, label: "Jalan" },
                { id: "cycling", icon: Bike, label: "Sepeda" },
              ] as const).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => changeProfile(id)}
                  className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition ${
                    profile === id ? "bg-emerald-600 text-white" : "bg-foreground/5 text-foreground/70"
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Hasil */}
            <div className="mt-2.5 min-h-[40px]">
              {routeLoading ? (
                <p className="text-sm text-foreground/50">Menghitung rute…</p>
              ) : routeErr ? (
                <p className="text-sm text-red-600">{routeErr}</p>
              ) : route ? (
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-lg font-bold text-emerald-700">
                    <MapPin size={17} /> {formatDistance(route.distance_m)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground/70">
                    <Clock size={15} /> {formatDuration(route.duration_s)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Navigasi eksternal (opsional, sekunder) */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${routeTarget.latitude},${routeTarget.longitude}&travelmode=${profile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground/50 hover:text-foreground/80"
            >
              <ExternalLink size={12} /> Navigasi turn-by-turn via Google Maps
            </a>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<LoadingState label="Memuat peta…" />}>
      <MapPageInner />
    </Suspense>
  );
}
