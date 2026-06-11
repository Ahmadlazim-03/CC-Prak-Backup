"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { add3DBuildings, getMapModes, type MapMode } from "@/lib/map-styles";
import type { LiveLocation, Place } from "@/lib/types";
import { Locate, Layers } from "lucide-react";

const ITS_CENTER: [number, number] = [112.7948, -7.2819];

export type RouteGeometry = { type: "LineString"; coordinates: [number, number][] };

function pinSVG(): string {
  return `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 1C6.8 1 1 6.8 1 14c0 9.2 13 21 13 21s13-11.8 13-21C27 6.8 21.2 1 14 1z" fill="currentColor" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff"/></svg>`;
}

export default function MapView({
  places,
  user,
  selectedId,
  onSelect,
  others = [],
  route = null,
}: {
  places: Place[];
  user: { lat: number; lng: number } | null;
  selectedId?: number | null;
  onSelect?: (place: Place) => void;
  others?: LiveLocation[];
  route?: RouteGeometry | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const elsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const othersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const routeRef = useRef<RouteGeometry | null>(route);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const modes = getMapModes();
  const [mode, setMode] = useState<MapMode>(modes[0]);
  const [showModes, setShowModes] = useState(false);

  // ---- Gambar / hapus rute ----
  const applyRoute = (map: MapLibreMap) => {
    const geo = routeRef.current;
    const data = geo
      ? { type: "Feature" as const, geometry: geo, properties: {} }
      : { type: "FeatureCollection" as const, features: [] };
    const src = map.getSource("amd-route") as GeoJSONSource | undefined;
    if (src) {
      src.setData(data as never);
    } else {
      map.addSource("amd-route", { type: "geojson", data: data as never });
      map.addLayer({
        id: "amd-route-line",
        source: "amd-route",
        type: "line",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.85 },
      });
    }
  };

  // ---- Inisialisasi peta (sekali) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mode.styleUrl,
      center: user ? [user.lng, user.lat] : ITS_CENTER,
      zoom: 15,
      pitch: mode.pitch,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("style.load", () => {
      if (mode.buildings) add3DBuildings(map);
      applyRoute(map);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Ganti style saat mode berubah ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mode.styleUrl);
    map.once("style.load", () => {
      if (mode.buildings) add3DBuildings(map);
      applyRoute(map);
      map.easeTo({ pitch: mode.pitch, duration: 600 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- Marker tempat (SVG pin tegak, tidak miring di 3D) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    elsRef.current.clear();

    for (const place of places) {
      const el = document.createElement("div");
      el.className = "amd-pin" + (place.id === selectedId ? " selected" : "");
      el.innerHTML = pinSVG();
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current?.(place);
        map.flyTo({ center: [place.longitude, place.latitude], zoom: 16.5, duration: 700 });
      });
      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);
      markersRef.current.set(place.id, marker);
      elsRef.current.set(place.id, el);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  // ---- Highlight terpilih ----
  useEffect(() => {
    elsRef.current.forEach((el, id) => el.classList.toggle("selected", id === selectedId));
  }, [selectedId]);

  // ---- Marker lokasi pengguna ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !user) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const el = document.createElement("div");
    el.className = "amd-user-dot";
    userMarkerRef.current = new maplibregl.Marker({ element: el, pitchAlignment: "viewport" })
      .setLngLat([user.lng, user.lat])
      .addTo(map);
  }, [user]);

  // ---- Marker pengguna lain (realtime) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const o of others) {
      seen.add(o.user_id);
      const name = o.name ?? "Pengguna";
      const initial = name.trim().charAt(0).toUpperCase() || "?";
      let marker = othersRef.current.get(o.user_id);
      if (!marker) {
        const el = document.createElement("div");
        el.className = "amd-other";
        el.innerHTML = `<div class="ring">${
          o.avatar_url ? `<img src="${o.avatar_url}" alt="" />` : initial
        }</div><span class="tag"></span>`;
        const tag = el.querySelector(".tag");
        if (tag) tag.textContent = name;
        marker = new maplibregl.Marker({ element: el, pitchAlignment: "viewport" }).setLngLat([
          o.longitude,
          o.latitude,
        ]);
        marker.addTo(map);
        othersRef.current.set(o.user_id, marker);
      } else {
        marker.setLngLat([o.longitude, o.latitude]);
      }
    }
    // buang yang sudah tidak ada
    for (const [id, marker] of othersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        othersRef.current.delete(id);
      }
    }
  }, [others]);

  // ---- Update rute ----
  useEffect(() => {
    routeRef.current = route;
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      map.once("idle", () => applyRoute(map));
    } else {
      applyRoute(map);
    }
    if (route && route.coordinates.length > 1) {
      const b = new maplibregl.LngLatBounds();
      route.coordinates.forEach((c) => b.extend(c));
      map.fitBounds(b, { padding: { top: 90, bottom: 230, left: 50, right: 50 }, maxZoom: 16, duration: 800 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: user ? [user.lng, user.lat] : ITS_CENTER, zoom: 15.5, duration: 700 });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute left-3 top-3 z-10">
        <button
          type="button"
          onClick={() => setShowModes((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-sm font-medium text-neutral-800 shadow-md ring-1 ring-black/5 backdrop-blur"
        >
          <Layers size={15} /> {mode.label}
        </button>
        {showModes && (
          <div className="mt-1.5 flex flex-col gap-1 rounded-lg bg-white/95 p-1.5 shadow-md ring-1 ring-black/5 backdrop-blur">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m);
                  setShowModes(false);
                }}
                className={`rounded-md px-3 py-1.5 text-left text-sm transition ${
                  m.id === mode.id ? "bg-emerald-600 text-white" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={recenter}
        className="absolute bottom-28 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-md ring-1 ring-black/5 backdrop-blur active:scale-95"
        aria-label="Ke lokasi saya"
      >
        <Locate size={20} />
      </button>
    </div>
  );
}
