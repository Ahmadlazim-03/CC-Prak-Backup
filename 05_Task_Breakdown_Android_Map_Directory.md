# Task Breakdown (WBS)
## Android Map Directory

| | |
|---|---|
| **Produk** | Android Map Directory |
| **Versi** | 1.0 |
| **Durasi** | 7 minggu |
| **Tanggal** | Juni 2026 |

---

## 1. Ringkasan Tahapan

| Minggu | Fokus | Artefak yang dihasilkan |
|--------|-------|-------------------------|
| 1 | Definisi & desain data | Domain, fitur, data tempat, skema DB |
| 2 | Backend API | API + endpoint teruji (Postman/browser) |
| 3–4 | UI Android | List, detail, peta, marker |
| 5–6 | Integrasi & deploy | GPS, routing, error handling, deployment |
| 7 | Finalisasi | Testing, dokumentasi, video/demo, presentasi, HKI |

> Setiap minggu harus menghasilkan artefak nyata: skema, API, app screen, integrasi, demo.

---

## 2. Work Breakdown Structure (WBS)

### Epik A — Perencanaan & Data (Minggu 1)

| ID | Tugas | Estimasi | Dependensi | Output |
|----|-------|----------|------------|--------|
| A1 | Finalisasi daftar fitur (MVP + tambahan) | 0.5 hari | — | Daftar fitur |
| A2 | Definisi domain & kategori tempat | 0.5 hari | A1 | Daftar kategori |
| A3 | Kumpulkan 15–30 data tempat + koordinat valid | 2 hari | A2 | Dataset awal |
| A4 | Rancang skema database (ERD + DDL) | 1 hari | A2 | Skema DB |
| A5 | Rancang kontrak API (endpoint + format JSON) | 1 hari | A4 | Spesifikasi API |

### Epik B — Backend & API (Minggu 2)

| ID | Tugas | Estimasi | Dependensi | Output |
|----|-------|----------|------------|--------|
| B1 | Setup proyek backend + koneksi DB | 0.5 hari | A4 | Skeleton backend |
| B2 | Buat tabel & seed data tempat/kategori | 0.5 hari | A4, A3 | DB terisi |
| B3 | Endpoint `GET /api/places` (+ filter category) | 1 hari | B1, B2 | Endpoint daftar |
| B4 | Endpoint `GET /api/places/{id}` | 0.5 hari | B3 | Endpoint detail |
| B5 | Endpoint `GET /api/categories` | 0.5 hari | B2 | Endpoint kategori |
| B6 | Endpoint `POST/PUT/DELETE /api/places` (opsional admin) | 1 hari | B3 | Endpoint admin |
| B7 | Validasi input + format error standar | 0.5 hari | B3 | Validasi |
| B8 | Uji semua endpoint dengan Postman | 0.5 hari | B3–B7 | Koleksi Postman |

### Epik C — Aplikasi Android: Tampilan (Minggu 3–4)

| ID | Tugas | Estimasi | Dependensi | Output |
|----|-------|----------|------------|--------|
| C1 | Setup proyek Android + struktur (MVVM) | 0.5 hari | — | Skeleton app |
| C2 | Layer data: ApiService + model + repository | 1 hari | A5 | Lapisan data |
| C3 | Layar Home & Kategori (list + chip filter) | 2 hari | C2, B3 | Layar Home |
| C4 | Layar Detail tempat | 1.5 hari | C2, B4 | Layar Detail |
| C5 | Integrasi Map SDK + tampil marker | 2 hari | C2, B3 | Layar Peta |
| C6 | State loading/empty/error di semua layar | 1 hari | C3, C4, C5 | UX states |
| C7 | Pencarian & filter (opsional) | 1 hari | C3 | Fitur cari |

### Epik D — GPS, Routing, Integrasi & Deploy (Minggu 5–6)

| ID | Tugas | Estimasi | Dependensi | Output |
|----|-------|----------|------------|--------|
| D1 | Permission & baca lokasi GPS | 1 hari | C1 | LocationProvider |
| D2 | Hitung jarak (Haversine) & tampilkan di kartu | 1 hari | D1, C3 | Estimasi jarak |
| D3 | Tampilkan marker posisi pengguna di peta | 0.5 hari | D1, C5 | Posisi pengguna |
| D4 | Buka rute via intent ke aplikasi peta | 1 hari | C4, D1 | Fitur rute |
| D5 | Error handling menyeluruh (GPS/API/internet/kosong) | 1 hari | C6, D1 | Robustness |
| D6 | Deploy backend ke cloud/hosting (online) | 1 hari | B8 | API online |
| D7 | Hubungkan Android ke base URL produksi | 0.5 hari | D6 | Integrasi penuh |
| D8 | Halaman web admin (opsional) | 1.5 hari | B6 | Admin web |
| D9 | Favorit & review (opsional) | 1.5 hari | C4 | Fitur tambahan |

### Epik E — Testing, Dokumentasi & Demo (Minggu 7)

| ID | Tugas | Estimasi | Dependensi | Output |
|----|-------|----------|------------|--------|
| E1 | Uji API dari jaringan luar | 0.5 hari | D6 | Bukti uji API |
| E2 | Uji data: 15–30 marker valid di peta | 0.5 hari | C5, D6 | Bukti data |
| E3 | Uji GPS (izin, baca lokasi, GPS mati) | 0.5 hari | D1 | Bukti GPS |
| E4 | Uji routing (buka rute ke tujuan) | 0.5 hari | D4 | Bukti rute |
| E5 | Uji koneksi (server down/internet mati/kosong) | 0.5 hari | D5 | Bukti error handling |
| E6 | Susun dokumentasi & diagram arsitektur | 1 hari | semua | Dokumen |
| E7 | Rekam video/screenshot demo end-to-end | 0.5 hari | E1–E5 | Video demo |
| E8 | Siapkan slide presentasi akhir | 0.5 hari | E6 | Slide |
| E9 | Siapkan dokumen HKI | 1 hari | E6 | Dokumen HKI |

---

## 3. Checklist "Definition of Done"

### MVP (Wajib)
- [ ] Endpoint `/places`, `/places/{id}`, `/categories` berjalan dari jaringan luar, JSON benar.
- [ ] Minimal 15–30 tempat dengan koordinat valid tampil sebagai marker.
- [ ] Aplikasi meminta izin GPS dan membaca lokasi pengguna.
- [ ] Estimasi jarak muncul di daftar.
- [ ] Detail tempat tampil lengkap.
- [ ] Tombol "Buka Rute" membuka aplikasi peta ke koordinat tujuan.
- [ ] Pesan jelas saat GPS mati / API gagal / internet putus / data kosong.
- [ ] Backend ter-deploy (online), bukan lokal.
- [ ] Demo end-to-end dari HP/emulator berhasil.

### Tambahan (Jika waktu memungkinkan)
- [ ] Pencarian & filter.
- [ ] Halaman web admin.
- [ ] Favorit / review.

---

## 4. Pembagian Peran (Saran Tim)

| Peran | Tanggung jawab utama | Epik terkait |
|-------|----------------------|--------------|
| Backend/Cloud Dev | API, database, deployment | A4–A5, B, D6 |
| Android Dev | UI, peta, GPS, routing | C, D1–D5, D7 |
| Data/QA | Kumpulkan data, testing, dokumentasi | A3, E |
| Koordinator | Integrasi, presentasi, HKI | E6–E9 |

> Untuk tim kecil, satu orang dapat memegang beberapa peran. Prioritaskan jalur kritis: **A4 → A5 → B → C2 → C3/C5 → D6 → D7**.

---

## 5. Jalur Kritis (Critical Path)

```
A2 -> A4 -> A5 -> B1 -> B3 -> C2 -> C3 -> D1 -> D2 -> D4 -> D6 -> D7 -> E7
```

Keterlambatan pada rantai ini langsung menggeser tanggal demo. **Saran:** kerjakan B (backend) dan C1–C2 (skeleton Android) secara paralel di Minggu 2–3, dan lakukan **deploy (D6) lebih awal** untuk menghindari kejutan saat demo.

---

## 6. Estimasi Beban per Epik

| Epik | Total estimasi (orang-hari) |
|------|------------------------------|
| A — Perencanaan & Data | ~5 |
| B — Backend & API | ~5 |
| C — UI Android | ~9 |
| D — Integrasi & Deploy | ~9 |
| E — Testing & Demo | ~6 |
| **Total** | **~34 orang-hari** |

> Angka adalah estimasi kasar; sesuaikan dengan ukuran tim dan ketersediaan waktu.

---

## 7. Peta Tugas ↔ Bobot Penilaian

| Bobot | Komponen | Epik pendukung |
|-------|----------|----------------|
| 35% | Aplikasi Android | C, D1–D5, D7 |
| 25% | Backend, API & Cloud | A4–A5, B, D6 |
| 15% | Database & Data | A3, A4, B2 |
| 15% | Dokumentasi & Demo | E6, E7, E8 |
| 10% | Dokumen HKI | E9 |
