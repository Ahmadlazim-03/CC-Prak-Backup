# Product Requirements Document (PRD)
## Android Map Directory — Direktori Tempat Kampus Berbasis Peta

| | |
|---|---|
| **Nama Produk** | Android Map Directory |
| **Mata Kuliah** | Cloud Computing |
| **Versi Dokumen** | 1.0 |
| **Status** | Draft untuk pengerjaan proyek |
| **Tanggal** | Juni 2026 |
| **Pemilik Dokumen** | Tim Proyek |

---

## 1. Ringkasan Eksekutif

Android Map Directory adalah aplikasi mobile berbasis peta yang membantu mahasiswa menemukan tempat di sekitar kampus (kafe, kantin, fotokopi, kos, parkir, ATM, layanan kampus) lengkap dengan detail, estimasi jarak, dan rute navigasi langsung dari ponsel.

Inti produk bukan sekadar tampilan Android, melainkan **integrasi penuh** antara aplikasi mobile, server cloud, REST API, database, dan GPS sebagai satu sistem end-to-end. Aplikasi tidak mengakses database secara langsung; seluruh data mengalir melalui API agar sistem aman, terkontrol, dan mudah dikembangkan.

---

## 2. Latar Belakang & Pernyataan Masalah

Mahasiswa, terutama mahasiswa baru, sering membutuhkan informasi cepat tentang tempat di sekitar kampus. Saat ini informasi tersebut:

- Tersebar tidak terstruktur di grup chat, media sosial, atau pengetahuan teman.
- Sulit dibandingkan (jarak, harga, jam buka) karena tidak ada satu sumber terpusat.
- Tidak langsung dapat dipakai untuk navigasi.

**Masalah inti:** belum ada satu kanal terpusat yang memberi daftar tempat, detail, jarak, dan rute secara langsung dan akurat berbasis lokasi pengguna.

---

## 3. Tujuan Produk (Goals & Objectives)

### 3.1 Tujuan Produk
- Menyediakan direktori tempat kampus yang terpusat dan terstruktur.
- Memvisualisasikan tempat pada peta dengan marker berdasarkan koordinat.
- Memberi estimasi jarak dari posisi pengguna dan membuka rute navigasi.

### 3.2 Tujuan Pembelajaran (Learning Objectives)
Produk dirancang untuk membuktikan pemahaman cloud secara aplikatif:

1. **Cloud Backend** — menyiapkan server/API yang dapat diakses dari Android melalui internet.
2. **REST API** — aplikasi berkomunikasi melalui endpoint API, bukan membaca DB langsung.
3. **Database** — data tempat, kategori, koordinat, rating, foto disimpan terstruktur.
4. **GPS & Map** — mengambil lokasi pengguna, menghitung jarak, menampilkan marker, membuka rute.
5. **Deployment** — backend dipublikasikan agar benar-benar dapat dipanggil oleh HP.
6. **Demo End-to-End** — alur lengkap dari HP: cari → detail → buka rute.

---

## 4. Target Pengguna & Persona

### Persona 1 — Mahasiswa Baru (Pengguna Utama)
- **Nama:** Rani, 18 tahun, semester 1.
- **Kebutuhan:** cepat menemukan tempat makan/nongkrong murah dan dekat.
- **Frustrasi:** belum hafal area kampus, bingung arah.
- **Harapan:** buka aplikasi → lihat yang dekat → langsung dapat rute.

### Persona 2 — Mahasiswa Aktif (Pengguna Sekunder)
- **Nama:** Dimas, 21 tahun, semester 5.
- **Kebutuhan:** cari fotokopi/ATM/parkir saat butuh cepat, filter berdasarkan kategori.
- **Harapan:** filter cepat, info jam buka & harga akurat.

### Persona 3 — Admin Data (Pengelola)
- **Nama:** Asisten/anggota tim.
- **Kebutuhan:** menambah dan memperbarui data tempat lewat halaman web sederhana.
- **Harapan:** form input mudah, data langsung tampil di aplikasi.

---

## 5. User Stories

| ID | Sebagai | Saya ingin | Sehingga | Prioritas |
|----|---------|-----------|----------|-----------|
| US-01 | Mahasiswa | melihat daftar tempat di sekitar kampus | saya tahu pilihan yang tersedia | Wajib |
| US-02 | Mahasiswa | melihat tempat pada peta sebagai marker | saya paham posisinya secara visual | Wajib |
| US-03 | Mahasiswa | aplikasi membaca lokasi GPS saya | saya tahu jarak ke tiap tempat | Wajib |
| US-04 | Mahasiswa | membuka rute ke tempat yang dipilih | saya bisa langsung navigasi | Wajib |
| US-05 | Mahasiswa | melihat detail tempat (jam buka, harga, deskripsi) | saya bisa menilai sebelum berangkat | Wajib |
| US-06 | Mahasiswa | memfilter tempat berdasarkan kategori/jarak/kata kunci | saya cepat menemukan yang relevan | Tambahan |
| US-07 | Mahasiswa | menyimpan tempat favorit | saya bisa akses cepat lain waktu | Tambahan |
| US-08 | Mahasiswa | memberi rating/review sederhana | pengguna lain terbantu | Tambahan |
| US-09 | Admin | menambah/mengedit data tempat lewat web | data selalu terbarui | Tambahan |
| US-10 | Mahasiswa | mendapat pesan jelas saat error (GPS mati, internet putus) | saya tidak bingung saat gagal | Wajib |

---

## 6. Ruang Lingkup (Scope)

### 6.1 In Scope — Fitur Wajib (Minimum Viable Product)
- **Direktori Tempat:** daftar nama, kategori, alamat, koordinat, jam buka, deskripsi singkat.
- **Map & Marker:** marker tempat di peta berdasarkan latitude/longitude dari server.
- **GPS & Rute:** baca lokasi pengguna, hitung jarak, buka rute ke tempat terpilih.
- **Detail Tempat:** halaman detail per tempat.
- **Error Handling:** pesan jelas saat GPS mati, API gagal, internet tidak ada, atau data kosong.

> **MVP = daftar tempat + marker peta + detail + rute dari lokasi pengguna.**

### 6.2 In Scope — Fitur Tambahan (Jika Waktu Memungkinkan)
- Pencarian & filter (kategori, jarak, rating, kata kunci).
- Halaman web admin untuk input/edit data.
- Favorit dan review/rating sederhana.

### 6.3 Out of Scope
- Sistem pembayaran/transaksi.
- Chat antar pengguna.
- Navigasi turn-by-turn internal (cukup membuka aplikasi peta eksternal via intent).
- Login/registrasi kompleks dengan OAuth pihak ketiga (kecuali diperlukan untuk fitur favorit).
- Notifikasi push.

---

## 7. Daftar Fitur & Prioritas (MoSCoW)

| Fitur | Prioritas | Catatan |
|-------|-----------|---------|
| Daftar tempat dari API | Must | Inti aplikasi |
| Peta + marker | Must | Visualisasi lokasi |
| GPS lokasi pengguna | Must | Dasar jarak & rute |
| Estimasi jarak | Must | Dihitung dari koordinat |
| Detail tempat | Must | Info pendukung keputusan |
| Buka rute (intent ke map) | Must | Aksi navigasi |
| Error/empty/loading state | Must | Kualitas pengalaman |
| Pencarian & filter | Should | Memudahkan menemukan tempat |
| Halaman admin web | Should | Pemeliharaan data |
| Favorit | Could | Nilai tambah pengguna |
| Review/rating | Could | Nilai tambah komunitas |
| Foto tempat | Could | Memperkaya detail |

> **Saran:** stabilkan integrasi cloud (Must) sebelum menambah fitur kosmetik (Could).

---

## 8. Alur Pengguna Utama (Happy Path)

```
Buka aplikasi → Izinkan GPS → Pilih kategori / cari tempat
   → Lihat daftar & marker → Lihat detail tempat → Buka rute
```

**Contoh use case:** mahasiswa baru mencari tempat nongkrong terdekat, melihat estimasi jarak, lalu diarahkan ke aplikasi peta untuk navigasi.

---

## 9. Metrik Keberhasilan (Success Metrics)

| Aspek | Indikator Keberhasilan |
|-------|------------------------|
| Data | Minimal 15–30 tempat dengan koordinat valid muncul sebagai marker |
| API | Endpoint `/places`, `/categories`, `/places/{id}` berjalan dari jaringan luar dan memberi JSON benar |
| GPS | Aplikasi meminta izin lokasi dan membaca lokasi pengguna |
| Routing | Tempat terpilih dapat membuka rute ke koordinat tujuan |
| Ketahanan | Pesan jelas saat server down/internet mati/response kosong |
| Demo | Alur end-to-end berhasil dari HP/emulator |

---

## 10. Asumsi & Batasan (Assumptions & Constraints)

**Asumsi**
- Pengguna memiliki perangkat Android dengan GPS dan koneksi internet.
- Tersedia layanan peta (Map SDK / aplikasi peta) di perangkat.
- Data tempat dikumpulkan secara manual oleh tim.

**Batasan**
- Waktu pengerjaan ±7 minggu (proyek kuliah).
- Tim dengan sumber daya terbatas.
- Backend harus online (di-deploy), bukan hanya lokal.
- Credential database tidak boleh disimpan di aplikasi Android.

---

## 11. Rencana Rilis & Milestone

| Milestone | Target | Output |
|-----------|--------|--------|
| M1 — Definisi | Minggu 1 | Domain, fitur, data tempat, skema DB |
| M2 — Backend siap | Minggu 2 | API + endpoint teruji (Postman) |
| M3 — Android dasar | Minggu 3–4 | List, detail, peta, marker |
| M4 — Integrasi | Minggu 5–6 | GPS, routing, error handling, deployment |
| M5 — Final | Minggu 7 | Testing, dokumentasi, video/demo, presentasi |

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Koordinat tempat tidak akurat | Marker/rute salah | Verifikasi koordinat saat input data |
| Backend tidak online saat demo | Demo gagal | Deploy lebih awal, siapkan cadangan/fallback |
| Izin GPS ditolak pengguna | Jarak/rute tak jalan | Tampilkan pesan & tetap izinkan browsing daftar |
| Internet tidak stabil saat demo | Data tidak muncul | Cache sederhana / data demo lokal cadangan |
| Scope creep (terlalu banyak fitur) | MVP tidak selesai | Fokus Must-have dahulu |

---

## 13. Kriteria Penilaian (Acuan)

| Bobot | Komponen |
|-------|----------|
| 35% | Aplikasi Android (UI jalan, peta tampil, marker, detail, rute) |
| 25% | Backend, API, & Cloud Deployment (online, JSON benar, error ditangani) |
| 15% | Database & Data (skema sesuai, koordinat valid, data cukup) |
| 15% | Dokumentasi & Demo (presentasi, diagram, bukti testing, video) |
| 10% | Dokumen HKI |

> **Kesimpulan:** proyek berhasil bila aplikasi mobile, API, database, server cloud, dan GPS bekerja sebagai satu sistem.
