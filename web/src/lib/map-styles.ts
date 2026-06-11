// Definisi "mode" peta (3D buildings + banyak gaya) untuk MapLibre.
// Pakai MapTiler bila NEXT_PUBLIC_MAPTILER_KEY ada; jika tidak, fallback ke
// OpenFreeMap (gratis, tanpa API key) supaya peta tetap jalan.
import type { Map as MapLibreMap } from "maplibre-gl";

export type MapMode = {
  id: string;
  label: string;
  styleUrl: string;
  pitch: number;
  buildings: boolean;
};

const KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export function hasMapTilerKey(): boolean {
  return Boolean(KEY && KEY.length > 0);
}

export function getMapModes(): MapMode[] {
  if (hasMapTilerKey()) {
    const u = (name: string) => `https://api.maptiler.com/maps/${name}/style.json?key=${KEY}`;
    return [
      { id: "streets", label: "Streets", styleUrl: u("streets-v2"), pitch: 0, buildings: true },
      { id: "3d", label: "3D", styleUrl: u("streets-v2"), pitch: 60, buildings: true },
      { id: "satellite", label: "Satelit", styleUrl: u("hybrid"), pitch: 0, buildings: false },
      { id: "outdoor", label: "Outdoor", styleUrl: u("outdoor-v2"), pitch: 0, buildings: true },
      { id: "dark", label: "Dark", styleUrl: u("streets-v2-dark"), pitch: 0, buildings: true },
    ];
  }
  // Fallback tanpa API key.
  const o = (name: string) => `https://tiles.openfreemap.org/styles/${name}`;
  return [
    { id: "streets", label: "Streets", styleUrl: o("liberty"), pitch: 0, buildings: true },
    { id: "3d", label: "3D", styleUrl: o("liberty"), pitch: 60, buildings: true },
    { id: "bright", label: "Bright", styleUrl: o("bright"), pitch: 0, buildings: true },
    { id: "light", label: "Light", styleUrl: o("positron"), pitch: 0, buildings: true },
  ];
}

/** Tambahkan layer gedung 3D (fill-extrusion) — bekerja untuk skema OpenMapTiles. */
export function add3DBuildings(map: MapLibreMap): void {
  try {
    const style = map.getStyle();
    if (!style?.sources) return;

    const vectorSourceId = Object.keys(style.sources).find(
      (id) => (style.sources[id] as { type?: string }).type === "vector",
    );
    if (!vectorSourceId) return;
    if (map.getLayer("amd-3d-buildings")) return;

    let firstSymbolId: string | undefined;
    for (const layer of style.layers ?? []) {
      if (layer.type === "symbol") {
        firstSymbolId = layer.id;
        break;
      }
    }

    const layer = {
      id: "amd-3d-buildings",
      source: vectorSourceId,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", "render_height"], ["get", "height"], 10],
          0,
          "#dfe3f0",
          60,
          "#aab2d5",
          200,
          "#7d86bf",
        ],
        "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 10],
        "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
        "fill-extrusion-opacity": 0.85,
      },
    };

    map.addLayer(layer as unknown as Parameters<typeof map.addLayer>[0], firstSymbolId);
  } catch (e) {
    console.warn("[map] gagal menambah gedung 3D:", e);
  }
}
