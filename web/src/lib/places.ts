// Query & validasi untuk "places" — dipakai Route Handlers.
import { supabaseAdmin } from "./supabase";
import { haversineMeters } from "./haversine";
import type { Place, PlaceDetail, Review } from "./types";

const SELECT = "*, categories(name, icon)";

type Row = {
  id: number;
  category_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  open_hours: string | null;
  price_range: string | null;
  rating: number | null;
  photo_url: string | null;
  created_at?: string;
  updated_at?: string;
  categories: { name: string; icon: string | null } | null;
};

/** Ubah baris DB (dengan join kategori) menjadi objek Place yang rapi. */
export function mapRow(r: Row): Place {
  return {
    id: r.id,
    category_id: r.category_id,
    category: r.categories?.name ?? null,
    category_icon: r.categories?.icon ?? null,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    description: r.description,
    open_hours: r.open_hours,
    price_range: r.price_range,
    rating: r.rating,
    photo_url: r.photo_url,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export type PlaceQuery = {
  category?: string | null; // nama kategori (ilike) atau id numerik
  q?: string | null;
  sort?: "distance" | "rating" | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number | null;
  offset?: number | null;
};

export async function fetchPlaces(opts: PlaceQuery): Promise<Place[]> {
  const hasUser = opts.lat != null && opts.lng != null;
  const wantDistance = opts.sort === "distance" && hasUser;

  let q = supabaseAdmin.from("places").select(SELECT);

  // Filter kategori: terima id numerik ATAU nama kategori.
  if (opts.category && opts.category.trim() !== "") {
    const raw = opts.category.trim();
    const asId = Number(raw);
    if (Number.isInteger(asId) && asId > 0 && String(asId) === raw) {
      q = q.eq("category_id", asId);
    } else {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .ilike("name", raw)
        .limit(1)
        .maybeSingle();
      if (!cat) return []; // kategori tak dikenal → hasil kosong
      q = q.eq("category_id", (cat as { id: number }).id);
    }
  }

  // Pencarian kata kunci pada nama / alamat.
  if (opts.q && opts.q.trim() !== "") {
    const safe = opts.q.replace(/[,()*%]/g, " ").trim();
    if (safe) q = q.or(`name.ilike.%${safe}%,address.ilike.%${safe}%`);
  }

  // Urutan + pagination (kecuali sort=distance yang dihitung di JS).
  const builder =
    opts.sort === "rating" && !wantDistance
      ? q.order("rating", { ascending: false, nullsFirst: false })
      : q.order("name", { ascending: true });

  const off = opts.offset ?? 0;
  const finalQ =
    !wantDistance && opts.limit != null ? builder.range(off, off + opts.limit - 1) : builder;

  const { data, error } = await finalQ;
  if (error) throw new Error(error.message);

  let places = (data as unknown as Row[]).map(mapRow);

  if (hasUser) {
    places = places.map((p) => ({
      ...p,
      distance_m: haversineMeters(opts.lat!, opts.lng!, p.latitude, p.longitude),
    }));
  }

  if (wantDistance) {
    places.sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));
    if (opts.limit != null) places = places.slice(off, off + opts.limit);
  }

  return places;
}

export async function fetchPlaceDetail(
  id: number,
  lat?: number | null,
  lng?: number | null,
): Promise<PlaceDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("places")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const place = mapRow(data as unknown as Row);
  if (lat != null && lng != null) {
    place.distance_m = haversineMeters(lat, lng, place.latitude, place.longitude);
  }

  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("place_id", id)
    .order("created_at", { ascending: false });

  return { ...place, reviews: (reviews ?? []) as Review[] };
}

// ---------- Validasi input admin ----------
type Validated = { ok: true; value: Record<string, unknown> } | { ok: false; message: string };

export function validatePlace(body: Record<string, unknown>, partial = false): Validated {
  const errors: string[] = [];
  const out: Record<string, unknown> = {};

  const str = (k: string, required: boolean) => {
    const v = body[k];
    if (v == null || (typeof v === "string" && v.trim() === "")) {
      if (required && !partial) errors.push(`${k} wajib diisi`);
      return;
    }
    if (typeof v !== "string") {
      errors.push(`${k} harus berupa teks`);
      return;
    }
    out[k] = v.trim();
  };

  str("name", true);
  str("address", true);

  if (body.category_id != null) {
    const n = Number(body.category_id);
    if (!Number.isInteger(n) || n <= 0) errors.push("category_id tidak valid");
    else out.category_id = n;
  } else if (!partial) {
    errors.push("category_id wajib diisi");
  }

  for (const key of ["latitude", "longitude"] as const) {
    if (body[key] != null && body[key] !== "") {
      const n = Number(body[key]);
      const limit = key === "latitude" ? 90 : 180;
      if (Number.isNaN(n) || n < -limit || n > limit) errors.push(`${key} harus antara -${limit}..${limit}`);
      else out[key] = n;
    } else if (!partial) {
      errors.push(`${key} wajib diisi`);
    }
  }

  for (const k of ["description", "open_hours", "price_range", "photo_url"] as const) {
    if (body[k] != null) {
      if (typeof body[k] !== "string") errors.push(`${k} harus berupa teks`);
      else out[k] = (body[k] as string).trim();
    }
  }

  if (body.rating != null && body.rating !== "") {
    const n = Number(body.rating);
    if (Number.isNaN(n) || n < 0 || n > 5) errors.push("rating harus 0..5");
    else out.rating = n;
  }

  if (errors.length) return { ok: false, message: errors.join("; ") };
  return { ok: true, value: out };
}
