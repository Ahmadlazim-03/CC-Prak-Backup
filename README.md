# Android Map Directory — Kampus Directory (PWA)

Proyek **Cloud Computing**: direktori tempat di sekitar kampus berbasis peta. Cari tempat,
lihat detail & jarak dari lokasimu (GPS), dan buka rute langsung — semua data dilayani backend
cloud lewat REST API (client **tidak pernah** mengakses database secara langsung).

> Dokumen perancangan lengkap ada di root: `01_PRD…`, `02_SRS…`, `03_SDD…`, `04_UIUX…`, `05_Task…`.

---

## 1. Arsitektur

```
   ┌─────────────────────────┐        HTTPS / JSON        ┌───────────────────────────┐
   │  CLIENT (PWA / Browser)  │  ───────────────────────▶ │  Next.js Route Handlers   │
   │  Home · Peta · Detail    │                           │  /api/*  (server, cloud)  │
   │  GPS · MapLibre 3D       │ ◀───── SSE /api/stream ─── │  service-role key only    │
   └─────────────┬───────────┘        (realtime)          └─────────────┬─────────────┘
                 │ intent URL                                            │ supabase-js
                 ▼                                                       ▼
        Aplikasi Peta (rute)                                   ┌──────────────────┐
        maps/dir/?destination=lat,lng                          │ Supabase Postgres │
                                                               │ categories·places │
                                                               │ reviews·favorites │
                                                               └──────────────────┘
```

**Prinsip:** UI/GPS/Map di client; logika & data di server. Semua data lewat `/api/*`.
Realtime pun lewat backend (server yang subscribe ke Supabase, lalu stream ke client via SSE),
sehingga aturan *"client tidak akses DB langsung"* tetap terjaga.

---

## 2. Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Client | **PWA** — Next.js 16 (App Router) + React 19 + Tailwind v4, installable (manifest + service worker) |
| Backend / REST API | **Next.js Route Handlers** (`/api/*`), runtime Node |
| Database | **Supabase (PostgreSQL)** via `@supabase/supabase-js` (service-role, server-only) |
| Realtime | **Server-Sent Events** `/api/stream` ← Supabase Realtime (postgres_changes) |
| Peta | **MapLibre GL JS** + **MapTiler** (3D buildings + mode Streets/Satelit/Dark/Outdoor) — fallback **OpenFreeMap** tanpa API key |
| Routing | Intent URL ke Google Maps (`/maps/dir/?api=1&destination=lat,lng`) |
| Deploy | **Vercel** (frontend + API satu deployment) |

---

## 3. Struktur Folder

```
CLOUD COMPUTING APPLICATION/
├─ 01_PRD … 05_Task_*.md         # dokumen perancangan
├─ db/
│  ├─ schema.sql                 # DROP + CREATE tabel + realtime publication
│  └─ seed.sql                   # 7 kategori + 24 tempat + review + favorit
└─ web/                          # aplikasi Next.js
   ├─ .env.local                 # kredensial (gitignored)
   └─ src/
      ├─ app/
      │  ├─ api/{health,categories,places,places/[id],places/[id]/reviews,favorites,stream}/route.ts
      │  ├─ page.tsx             # Home: list + search + chip kategori
      │  ├─ map/page.tsx         # Peta MapLibre 3D + bottom sheet
      │  ├─ place/[id]/page.tsx  # Detail + ulasan + favorit + Buka Rute
      │  ├─ favorites/page.tsx   # Favorit
      │  ├─ admin/page.tsx       # CRUD (X-API-Key)
      │  └─ manifest.ts          # PWA manifest
      ├─ components/             # PlaceCard, MapView, CategoryChips, States, …
      └─ lib/                    # supabase, haversine, places (query+validasi), client-api, hooks
```

---

## 4. Menjalankan (Lokal)

**Prasyarat:** Node.js 18+ (diuji pada Node 25), akun Supabase.

```bash
# 1) Siapkan database (sekali) — buka Supabase Dashboard ▸ SQL Editor, jalankan berurutan:
#    db/schema.sql   lalu   db/seed.sql

# 2) Konfigurasi env
cd web
# .env.local sudah berisi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_KEY, CORS_ORIGIN.
# (Opsional) isi NEXT_PUBLIC_MAPTILER_KEY untuk mode Satelit/Dark — daftar gratis di maptiler.com.

# 3) Install & jalankan
npm install
npm run dev          # http://localhost:3000
```

Tanpa MapTiler key pun peta tetap jalan (memakai OpenFreeMap, sudah termasuk gedung 3D).

---

## 5. REST API

Base path `/api`. Semua respons JSON: sukses `{ "status":"success", "data":… }`,
error `{ "status":"error", "code":…, "message":… }`.

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/health` | Cek koneksi server + DB |
| GET | `/api/categories` | Daftar kategori |
| GET | `/api/places` | Daftar tempat. Query: `category=` (nama/id), `q=` (cari nama/alamat), `sort=distance\|rating`, `lat=&lng=` (untuk jarak), `limit=&offset=` |
| GET | `/api/places/{id}` | Detail tempat + `reviews[]` (query `lat&lng` untuk jarak) |
| POST | `/api/places` | **Tambah** tempat — header `X-API-Key` |
| PUT | `/api/places/{id}` | **Ubah** tempat (partial) — header `X-API-Key` |
| DELETE | `/api/places/{id}` | **Hapus** tempat — header `X-API-Key` |
| GET | `/api/places/{id}/reviews` · POST | Lihat / tambah ulasan |
| GET/POST/DELETE | `/api/favorites` | Favorit per `user_id` |
| GET | `/api/stream` | **SSE realtime** (event `change` untuk places/reviews/favorites) |

**Contoh:**
```bash
curl "http://localhost:3000/api/places?category=Kafe"
curl "http://localhost:3000/api/places?lat=-7.2819&lng=112.7948&sort=distance&limit=5"
curl -X POST http://localhost:3000/api/places \
  -H "Content-Type: application/json" -H "X-API-Key: <API_KEY>" \
  -d '{"name":"Kantin Baru","category_id":2,"latitude":-7.281,"longitude":112.795,"address":"Gedung X"}'
```

Validasi backend: `name, category_id, latitude, longitude, address` wajib; `lat∈[-90,90]`,
`lng∈[-180,180]`; `category_id` harus ada.

---

## 6. Bukti Pengujian (terverifikasi 2026-06-11)

| Uji | Hasil |
|-----|-------|
| Health / Categories / Places | ✓ up · 7 kategori · 24 tempat |
| Filter `category=Kafe` | ✓ 4 tempat |
| Search `q=kopi` | ✓ 3 tempat |
| Sort `distance` (dari ITS) | ✓ 71 m, 95 m, 158 m |
| Detail + reviews | ✓ jarak + ulasan |
| POST tanpa `X-API-Key` | ✓ ditolak `401` |
| POST/PUT/DELETE + key | ✓ `201/200/200` |
| Realtime SSE | ✓ INSERT + UPDATE + DELETE ter-stream live |

---

## 7. Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Vercel ▸ New Project ▸ pilih repo ▸ **Root Directory = `web`**.
3. Environment Variables (Settings): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY`,
   `CORS_ORIGIN`, dan (opsional) `NEXT_PUBLIC_MAPTILER_KEY`.
4. Deploy. Endpoint `/api/*` otomatis online & dapat dipanggil dari jaringan luar.

> Catatan: SSE long-lived di serverless punya batas durasi; untuk demo lokal/Node berjalan penuh,
> dan di production client otomatis reconnect + ada fallback refetch.

---

## 8. Keamanan

- Credential DB **hanya di server** (`SUPABASE_SERVICE_ROLE_KEY`), tidak pernah dikirim ke client.
- Mutasi data (POST/PUT/DELETE) butuh header `X-API-Key`.
- `.env.local` di-gitignore. **Rotate** service-role key & API key sebelum produksi bila pernah terekspos.
- Lokasi pengguna hanya dipakai sementara untuk jarak/rute, tidak disimpan.
```
