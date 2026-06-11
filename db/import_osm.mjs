// =============================================================
//  Importer data tempat ASLI dari OpenStreetMap (Overpass API)
//  → mengganti seluruh data places di Supabase dengan POI nyata
//    di sekitar kampus UNAIR (A/B/C) dan ITS, Surabaya.
//
//  Jalankan:  node db/import_osm.mjs
//  Kredensial dibaca dari web/.env.local (SUPABASE_URL + SERVICE_ROLE).
//  Data © OpenStreetMap contributors (ODbL).
// =============================================================
import { readFileSync } from "node:fs";

// ---------- Baca env dari web/.env.local ----------
const envText = readFileSync(new URL("../web/.env.local", import.meta.url), "utf8");
const env = (k) => (envText.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim();
const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di web/.env.local");
  process.exit(1);
}
const REST = `${SUPABASE_URL}/rest/v1`;
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// ---------- Pusat kampus + radius (meter) ----------
const AREAS = [
  { label: "Kampus C UNAIR (Mulyorejo)", lat: -7.2659, lng: 112.7836, r: 950 },
  { label: "Kampus B UNAIR (Dharmawangsa)", lat: -7.2676, lng: 112.7585, r: 700 },
  { label: "Kampus A UNAIR (Prof. Moestopo)", lat: -7.2654, lng: 112.7569, r: 600 },
  { label: "Kampus ITS (Keputih)", lat: -7.2819, lng: 112.7948, r: 1100 },
];

// ---------- Filter Overpass → kategori kita ----------
const FILTERS = [
  ["amenity", "cafe"],
  ["amenity", "restaurant"],
  ["amenity", "fast_food"],
  ["amenity", "food_court"],
  ["shop", "copyshop"],
  ["shop", "stationery"],
  ["shop", "printing"],
  ["amenity", "parking"],
  ["amenity", "atm"],
  ["amenity", "bank"],
  ["amenity", "library"],
  ["amenity", "hospital"],
  ["amenity", "clinic"],
  ["amenity", "pharmacy"],
  ["amenity", "place_of_worship"],
  ["amenity", "university"],
  ["amenity", "college"],
  ["tourism", "guest_house"],
  ["building", "dormitory"],
];

function mapCategory(t) {
  const a = t.amenity,
    s = t.shop,
    to = t.tourism,
    b = t.building;
  if (a === "cafe") return "Kafe";
  if (a === "restaurant" || a === "fast_food" || a === "food_court") return "Kantin";
  if (s === "copyshop" || s === "stationery" || s === "printing") return "Fotokopi";
  if (to === "guest_house" || b === "dormitory") return "Kos";
  if (a === "parking") return "Parkir";
  if (a === "atm" || a === "bank") return "ATM";
  if (["library", "hospital", "clinic", "pharmacy", "place_of_worship", "university", "college"].includes(a))
    return "Layanan Kampus";
  return null;
}

function nameOf(t, cat) {
  let n = t.name || t["name:id"] || t["name:en"];
  if (!n) {
    if (cat === "ATM") {
      const op = t.operator || t.brand || t.network;
      n = op ? `ATM ${op}` : "ATM";
    } else if (cat === "Parkir") {
      n = null; // lewati parkir tanpa nama (hindari sampah)
    } else {
      n = t.brand || t.operator || null;
    }
  }
  return n ? String(n).slice(0, 120) : null;
}

function addressOf(t, area) {
  const parts = [];
  const street = t["addr:street"];
  const hn = t["addr:housenumber"];
  if (street && hn) parts.push(`${street} No. ${hn}`);
  else if (street) parts.push(street);
  if (t["addr:suburb"]) parts.push(t["addr:suburb"]);
  if (t["addr:city"]) parts.push(t["addr:city"]);
  let a = parts.join(", ");
  if (!a) a = `Sekitar ${area.label}, Surabaya`;
  return a.slice(0, 255);
}

// ---------- Resolusi GAMBAR (Wikimedia/Wikidata/Commons, gratis tanpa key) ----------
const UA = "AndroidMapDirectory/1.0 (Cloud Computing campus project; OSM import)";

const MAPILLARY_TOKEN = env("MAPILLARY_TOKEN");

function commonsFilePath(fileName) {
  if (!fileName) return null;
  let f = String(fileName).replace(/^File:/i, "").trim();
  if (!f || /^Category:/i.test(f)) return null; // kategori bukan berkas gambar
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(f)}?width=640`;
  return url.length <= 255 ? url : null;
}

// Mapillary: cari foto street-level dekat titik → simpan REFERENSI pendek (id) via proxy
// /api/photo (URL asli kedaluwarsa, jadi diresolusi saat diakses, token tetap di server).
async function mapillaryRef(lat, lng) {
  if (!MAPILLARY_TOKEN) return null;
  try {
    const d = 0.0006; // ~65m bbox
    const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
    const r = await fetch(
      `https://graph.mapillary.com/images?access_token=${MAPILLARY_TOKEN}&fields=id&bbox=${bbox}&limit=1`,
      { headers: { "User-Agent": UA } },
    );
    const j = await r.json();
    const id = j.data?.[0]?.id;
    return id ? `/api/photo?mid=${id}` : null;
  } catch {
    return null;
  }
}

async function wikidataImage(qid) {
  try {
    const r = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, {
      headers: { "User-Agent": UA },
    });
    const j = await r.json();
    const file = j.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    return file ? commonsFilePath(file) : null;
  } catch {
    return null;
  }
}

async function commonsGeosearch(lat, lng) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=90&gslimit=1&gsnamespace=6&format=json&origin=*`;
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    const j = await r.json();
    return commonsFilePath(j.query?.geosearch?.[0]?.title);
  } catch {
    return null;
  }
}

async function resolveImage(t, lat, lng) {
  // 1) Tag gambar langsung dari OSM
  if (t.image && /^https?:\/\//i.test(t.image)) return String(t.image).slice(0, 255);
  // 2) Wikimedia Commons / Wikidata (foto presisi, permanen)
  if (t.wikimedia_commons) {
    const u = commonsFilePath(t.wikimedia_commons);
    if (u) return u;
  }
  if (t.wikidata) {
    const u = await wikidataImage(t.wikidata);
    if (u) return u;
  }
  // 3) Mapillary street-level (cakupan luas, butuh token)
  const m = await mapillaryRef(lat, lng);
  if (m) return m;
  // 4) Foto bergeotag terdekat di Commons
  return commonsGeosearch(lat, lng);
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        await fn(items[idx]);
      }
    }),
  );
}

const dist = (aLat, aLng, bLat, bLng) =>
  Math.hypot(aLat - bLat, (aLng - bLng) * Math.cos((aLat * Math.PI) / 180));
const nearestArea = (lat, lng) =>
  AREAS.reduce((best, ar) =>
    dist(lat, lng, ar.lat, ar.lng) < dist(lat, lng, best.lat, best.lng) ? ar : best,
  );

// ---------- Bangun & jalankan query Overpass ----------
function buildQuery() {
  let q = "[out:json][timeout:90];(";
  for (const ar of AREAS)
    for (const [k, v] of FILTERS) q += `nwr[${k}=${v}](around:${ar.r},${ar.lat},${ar.lng});`;
  q += ");out center tags 600;";
  return q;
}

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const OV_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  Accept: "application/json",
  "User-Agent": "AndroidMapDirectory/1.0 (Cloud Computing campus project; OSM import)",
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOverpass(query) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    for (const url of MIRRORS) {
      try {
        console.log(`→ Overpass (coba ${attempt}): ${url}`);
        const res = await fetch(url, {
          method: "POST",
          headers: OV_HEADERS,
          body: "data=" + encodeURIComponent(query),
        });
        if (res.status === 429 || res.status === 504) {
          console.log(`  (HTTP ${res.status} sibuk, tunggu lalu mirror lain)`);
          await sleep(3000);
          continue;
        }
        if (!res.ok) {
          console.log(`  (HTTP ${res.status}, coba mirror lain)`);
          continue;
        }
        const json = await res.json();
        return json.elements || [];
      } catch (e) {
        console.log(`  (gagal: ${e.message})`);
      }
    }
    if (attempt < 2) await sleep(5000);
  }
  throw new Error("Semua mirror Overpass gagal");
}

async function main() {
  // 1) Ambil kategori → map nama ke id
  const catRes = await fetch(`${REST}/categories?select=id,name`, { headers });
  const cats = await catRes.json();
  const catId = Object.fromEntries(cats.map((c) => [c.name, c.id]));
  console.log("Kategori:", catId);

  // 2) Query Overpass
  const elements = await fetchOverpass(buildQuery());
  console.log(`Overpass mengembalikan ${elements.length} elemen.`);

  // 3) Map → baris places, dedupe, batasi per kategori
  const seen = new Set();
  const perCat = {};
  const rows = [];
  const CAP = 30;

  for (const el of elements) {
    const t = el.tags || {};
    const cat = mapCategory(t);
    if (!cat || !catId[cat]) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const name = nameOf(t, cat);
    if (!name) continue;

    const key = `${cat}|${name.toLowerCase()}|${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    perCat[cat] = (perCat[cat] || 0) + 1;
    if (perCat[cat] > CAP) continue;

    const area = nearestArea(lat, lng);
    const oh = t.opening_hours ? String(t.opening_hours).slice(0, 50) : null;

    rows.push({
      category_id: catId[cat],
      name,
      latitude: lat,
      longitude: lng,
      address: addressOf(t, area),
      description: `${cat} di ${area.label}. Data © OpenStreetMap.`,
      open_hours: oh,
      price_range: null,
      rating: null,
      photo_url: null,
      _tags: t,
    });
  }

  console.log("Ringkasan per kategori:", perCat);
  console.log(`Total tempat siap insert: ${rows.length}`);
  if (rows.length < 10) {
    console.error("✗ Hasil terlalu sedikit — batalkan (cek koneksi Overpass).");
    process.exit(1);
  }

  // 3b) Resolusi gambar nyata (Wikimedia/Wikidata/Commons)
  console.log("Mengambil gambar dari Wikimedia/Wikidata/Commons…");
  let withImg = 0;
  await pool(rows, 6, async (row) => {
    const url = await resolveImage(row._tags, row.latitude, row.longitude);
    if (url) {
      row.photo_url = url;
      withImg++;
    }
  });
  rows.forEach((r) => delete r._tags);
  console.log(`  ${withImg}/${rows.length} tempat memperoleh gambar nyata (sisanya placeholder kategori).`);

  // 4) WIPE places lama (cascade ke reviews & favorites), lalu insert data asli
  console.log("Menghapus data places lama…");
  const del = await fetch(`${REST}/places?id=gt.0`, { method: "DELETE", headers });
  if (!del.ok && del.status !== 204) {
    console.error("✗ Gagal hapus:", await del.text());
    process.exit(1);
  }

  console.log("Menyisipkan data asli (batch 50)…");
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const res = await fetch(`${REST}/places`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      console.error("✗ Gagal insert batch:", await res.text());
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`  ${inserted}/${rows.length}\r`);
  }
  console.log(`\n✓ Selesai. ${inserted} tempat asli dari OpenStreetMap dimasukkan.`);
}

main().catch((e) => {
  console.error("✗ Error:", e.message);
  process.exit(1);
});
