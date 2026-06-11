// =============================================================
//  Pengaya (enrichment) data tempat via Google Places API.
//  Untuk SETIAP place yang sudah ada (dari OSM), cari padanannya di Google
//  lalu lengkapi: foto (proxy /api/photo), rating, kisaran harga, alamat presisi.
//  Tidak menghapus data — hanya UPDATE.
//
//  Jalankan:  node db/enrich_google.mjs
//  Perlu di web/.env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_MAPS_API_KEY
// =============================================================
import { readFileSync } from "node:fs";

const envText = readFileSync(new URL("../web/.env.local", import.meta.url), "utf8");
const env = (k) => (envText.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const GKEY = env("GOOGLE_MAPS_API_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ SUPABASE_URL / SERVICE_ROLE tidak ada di web/.env.local");
  process.exit(1);
}
if (!GKEY) {
  console.error("✗ GOOGLE_MAPS_API_KEY belum di-set di web/.env.local");
  process.exit(1);
}
const REST = `${SUPABASE_URL}/rest/v1`;
const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

const PRICE = { 0: "Gratis", 1: "Rp10-25K", 2: "Rp25-50K", 3: "Rp50-100K", 4: ">Rp100K" };

async function findPlace(name, lat, lng) {
  const fields = "place_id,rating,price_level,formatted_address,photos";
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(name)}&inputtype=textquery` +
    `&locationbias=circle:160@${lat},${lng}&fields=${fields}&key=${GKEY}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.status !== "OK" || !j.candidates?.length) return null;
  return j.candidates[0];
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) await fn(items[i++]);
    }),
  );
}

async function main() {
  const res = await fetch(`${REST}/places?select=id,name,latitude,longitude,address,rating,price_range,photo_url`, {
    headers: H,
  });
  const places = await res.json();
  console.log(`Memeriksa ${places.length} tempat ke Google Places…`);

  let withPhoto = 0,
    withRating = 0,
    matched = 0;

  await pool(places, 5, async (p) => {
    try {
      const c = await findPlace(p.name, p.latitude, p.longitude);
      if (!c) return;
      matched++;
      const upd = {};
      if (c.photos?.length) {
        upd.photo_url = `/api/photo?gp=${encodeURIComponent(c.place_id)}`;
        withPhoto++;
      }
      if (typeof c.rating === "number") {
        upd.rating = c.rating;
        withRating++;
      }
      if (c.price_level != null && PRICE[c.price_level]) upd.price_range = PRICE[c.price_level];
      if (c.formatted_address && c.formatted_address.length > (p.address?.length || 0))
        upd.address = c.formatted_address.slice(0, 255);

      if (Object.keys(upd).length) {
        await fetch(`${REST}/places?id=eq.${p.id}`, {
          method: "PATCH",
          headers: { ...H, Prefer: "return=minimal" },
          body: JSON.stringify(upd),
        });
      }
    } catch {
      /* lewati satu yang gagal */
    }
  });

  console.log(`✓ Selesai. Cocok di Google: ${matched}/${places.length}`);
  console.log(`  • dapat foto: ${withPhoto}   • dapat rating: ${withRating}`);
}

main().catch((e) => {
  console.error("✗ Error:", e.message);
  process.exit(1);
});
