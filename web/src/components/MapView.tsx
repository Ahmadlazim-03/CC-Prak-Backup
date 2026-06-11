"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { add3DBuildings, getMapModes, type MapMode } from "@/lib/map-styles";
import type { Place } from "@/lib/types";
import { Locate, Layers } from "lucide-react";

const ITS_CENTER: [number, number] = [112.7948, -7.2819]; // lng, lat

export default function MapView({
  places,
  user,
  selectedId,
  onSelect,
}: {
  places: Place[];
  user: { lat: number; lng: number } | null;
  selectedId?: number | null;
  onSelect?: (place: Place) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const elsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const modes = getMapModes();
  const [mode, setMode] = useState<MapMode>(modes[0]);
  const [showModes, setShowModes] = useState(false);

  // --- Inisialisasi peta (sekali) ---
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
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Ganti style saat mode berubah ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mode.styleUrl);
    map.once("style.load", () => {
      if (mode.buildings) add3DBuildings(map);
      map.easeTo({ pitch: mode.pitch, duration: 600 });
    });
  }, [mode]);

  // --- Render marker tempat ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    elsRef.current.clear();

    for (const place of places) {
      const el = document.createElement("div");
      el.className = "amd-marker";
      el.title = place.name;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current?.(place);
        map.flyTo({ center: [place.longitude, place.latitude], zoom: 16.5, duration: 700 });
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);
      markersRef.current.set(place.id, marker);
      elsRef.current.set(place.id, el);
    }
  }, [places]);

  // --- Highlight marker terpilih ---
  useEffect(() => {
    elsRef.current.forEach((el, id) => {
      el.classList.toggle("selected", id === selectedId);
    });
    if (selectedId != null) {
      const p = places.find((x) => x.id === selectedId);
      if (p && mapRef.current) {
        mapRef.current.flyTo({ center: [p.longitude, p.latitude], zoom: 16.5, duration: 700 });
      }
    }
  }, [selectedId, places]);

  // --- Marker lokasi pengguna ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !user) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const el = document.createElement("div");
    el.className = "amd-user-dot";
    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([user.lng, user.lat])
      .addTo(map);
  }, [user]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: user ? [user.lng, user.lat] : ITS_CENTER, zoom: 15.5, duration: 700 });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Pemilih mode peta */}
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
                  m.id === mode.id
                    ? "bg-emerald-600 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tombol re-center ke lokasi pengguna */}
      <button
        type="button"
        onClick={recenter}
        className="absolute bottom-24 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-emerald-700 shadow-md ring-1 ring-black/5 backdrop-blur active:scale-95"
        aria-label="Ke lokasi saya"
      >
        <Locate size={20} />
      </button>
    </div>
  );
}
