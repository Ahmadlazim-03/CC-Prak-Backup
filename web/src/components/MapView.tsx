"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type LayerSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { add3DBuildings, getMapModes, type MapMode } from "@/lib/map-styles";
import type { LiveLocation, Place } from "@/lib/types";
import { Locate, Layers } from "lucide-react";

const ITS_CENTER: [number, number] = [112.7948, -7.2819];

export type RouteGeometry = { type: "LineString"; coordinates: [number, number][] };

// Ikon pin (SVG → data URL) untuk layer simbol WebGL.
function pinDataUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 1C6.8 1 1 6.8 1 14c0 9.2 13 21 13 21s13-11.8 13-21C27 6.8 21.2 1 14 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>`;
  return "data:image/svg+xml;base64," + btoa(svg);
}

function placesToGeoJSON(places: Place[]) {
  return {
    type: "FeatureCollection" as const,
    features: places.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.longitude, p.latitude] },
      properties: { id: p.id, name: p.name },
    })),
  };
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
  const othersRef = useRef<Map<string, Marker>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const placesByIdRef = useRef<Map<number, Place>>(new Map());
  const routeRef = useRef<RouteGeometry | null>(route);
  const placesRef = useRef<Place[]>(places);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const modes = getMapModes();
  const [mode, setMode] = useState<MapMode>(modes[0]);
  const [showModes, setShowModes] = useState(false);

  // index id → place untuk lookup saat klik
  useEffect(() => {
    placesRef.current = places;
    placesByIdRef.current = new Map(places.map((p) => [p.id, p]));
  }, [places]);

  // ---- Pasang ikon pin ----
  const ensureIcons = (map: MapLibreMap) => {
    ([
      ["amd-pin", "#059669"],
      ["amd-pin-red", "#dc2626"],
    ] as const).forEach(([id, color]) => {
      if (map.hasImage(id)) return;
      const img = new Image(28, 36);
      img.onload = () => {
        if (!map.hasImage(id)) map.addImage(id, img);
      };
      img.src = pinDataUrl(color);
    });
  };

  // ---- Sumber + layer tempat (cluster) ----
  const setupPlacesLayer = (map: MapLibreMap) => {
    if (!map.getSource("places")) {
      map.addSource("places", {
        type: "geojson",
        data: placesToGeoJSON(placesRef.current),
        cluster: true,
        clusterRadius: 55,
        clusterMaxZoom: 15,
      });
    }
    const layers: LayerSpecification[] = [
      {
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#10b981", 10, "#059669", 30, "#047857"],
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 26],
          "circle-opacity": 0.9,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      },
      {
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
          "text-font": ["Noto Sans Regular", "Open Sans Regular", "sans-serif"],
        },
        paint: { "text-color": "#ffffff" },
      },
      {
        id: "unclustered",
        type: "symbol",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "amd-pin",
          "icon-size": 0.95,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
      },
      {
        id: "unclustered-selected",
        type: "symbol",
        source: "places",
        filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], selectedId ?? -1]],
        layout: {
          "icon-image": "amd-pin-red",
          "icon-size": 1.25,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
      },
    ];
    for (const layer of layers) if (!map.getLayer(layer.id)) map.addLayer(layer);
  };

  // ---- Rute ----
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
      map.addLayer(
        {
          id: "amd-route-line",
          source: "amd-route",
          type: "line",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#2563eb", "line-width": 5, "line-opacity": 0.85 },
        },
        map.getLayer("clusters") ? "clusters" : undefined,
      );
    }
  };

  const wireInteractions = (map: MapLibreMap) => {
    map.on("click", "clusters", (e) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0] as
        | MapGeoJSONFeature
        | undefined;
      const clusterId = f?.properties?.cluster_id;
      const src = map.getSource("places") as GeoJSONSource | undefined;
      if (clusterId == null || !src) return;
      src.getClusterExpansionZoom(clusterId as number).then((zoom) => {
        const geom = f!.geometry as unknown as { coordinates: [number, number] };
        map.easeTo({ center: geom.coordinates, zoom: zoom + 0.2, duration: 600 });
      });
    });
    const pick = (e: maplibregl.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as number | undefined;
      if (id == null) return;
      const place = placesByIdRef.current.get(id);
      if (place) {
        onSelectRef.current?.(place);
        map.flyTo({ center: [place.longitude, place.latitude], zoom: 16.5, duration: 700 });
      }
    };
    map.on("click", "unclustered", pick);
    map.on("click", "unclustered-selected", pick);
    for (const ly of ["clusters", "unclustered", "unclustered-selected"]) {
      map.on("mouseenter", ly, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", ly, () => (map.getCanvas().style.cursor = ""));
    }
  };

  // ---- Init peta (sekali) ----
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
    map.on("load", () => {
      ensureIcons(map);
      if (mode.buildings) add3DBuildings(map);
      setupPlacesLayer(map);
      applyRoute(map);
      wireInteractions(map);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Ganti style → pasang ulang ikon/layer/rute ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mode.styleUrl);
    map.once("style.load", () => {
      ensureIcons(map);
      if (mode.buildings) add3DBuildings(map);
      setupPlacesLayer(map);
      applyRoute(map);
      wireInteractions(map);
      map.easeTo({ pitch: mode.pitch, duration: 600 });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- Update data tempat (tanpa re-render marker DOM → ringan) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("places") as GeoJSONSource | undefined;
    if (src) src.setData(placesToGeoJSON(places) as never);
  }, [places]);

  // ---- Highlight pin terpilih (ubah filter, bukan buat ulang) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("unclustered-selected")) return;
    map.setFilter("unclustered-selected", [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "id"], selectedId ?? -1],
    ]);
    if (selectedId != null) {
      const p = placesByIdRef.current.get(selectedId);
      if (p) map.flyTo({ center: [p.longitude, p.latitude], zoom: 16.5, duration: 700 });
    }
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

  // ---- Marker pengguna lain (realtime, jumlah sedikit → tetap DOM) ----
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
    if (!map.isStyleLoaded()) map.once("idle", () => applyRoute(map));
    else applyRoute(map);
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
