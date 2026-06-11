"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapModes } from "@/lib/map-styles";
import { useGeolocation } from "@/lib/useGeolocation";
import { Crosshair, Hand } from "lucide-react";

const ITS_CENTER: [number, number] = [112.7948, -7.2819];

/**
 * Peta interaktif untuk memilih titik lokasi: marker bisa di-DRAG,
 * atau tap di peta untuk memindahkan pin. Mengirim (lat,lng) via onChange.
 */
export default function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const geo = useGeolocation(false);
  const [coord, setCoord] = useState(value);

  // init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start: [number, number] = value ? [value.lng, value.lat] : ITS_CENTER;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapModes()[0].styleUrl,
      center: start,
      zoom: 15,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const el = document.createElement("div");
    el.className = "amd-pin picker";
    el.innerHTML = `<svg width="30" height="38" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg"><path d="M14 1C6.8 1 1 6.8 1 14c0 9.2 13 21 13 21s13-11.8 13-21C27 6.8 21.2 1 14 1z" fill="currentColor" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`;
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom", draggable: true })
      .setLngLat(start)
      .addTo(map);

    const emit = () => {
      const ll = marker.getLngLat();
      setCoord({ lat: ll.lat, lng: ll.lng });
      onChangeRef.current(ll.lat, ll.lng);
    };
    marker.on("dragend", emit);
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      emit();
    });

    mapRef.current = map;
    markerRef.current = marker;
    if (value) emit();

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pakai lokasi saya
  useEffect(() => {
    if (geo.status === "granted" && geo.lat != null && geo.lng != null) {
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        marker.setLngLat([geo.lng, geo.lat]);
        map.flyTo({ center: [geo.lng, geo.lat], zoom: 16, duration: 700 });
        setCoord({ lat: geo.lat, lng: geo.lng });
        onChangeRef.current(geo.lat, geo.lng);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.lat, geo.lng]);

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10">
      <div ref={containerRef} className="h-60 w-full" />
      <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
        <Hand size={12} /> Geser pin atau ketuk peta
      </div>
      <button
        type="button"
        onClick={() => geo.request()}
        className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow ring-1 ring-black/5 active:scale-95"
      >
        <Crosshair size={14} /> Lokasi saya
      </button>
      {coord && (
        <div className="absolute bottom-2 left-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 shadow ring-1 ring-black/5">
          {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}
        </div>
      )}
    </div>
  );
}
