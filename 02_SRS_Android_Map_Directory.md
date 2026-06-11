# Software Requirements Specification (SRS)
## Android Map Directory

| | |
|---|---|
| **Produk** | Android Map Directory |
| **Versi** | 1.0 |
| **Standar acuan** | IEEE 830 (disederhanakan) |
| **Tanggal** | Juni 2026 |

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini mendefinisikan kebutuhan perangkat lunak untuk aplikasi **Android Map Directory**: sebuah sistem direktori tempat kampus berbasis peta yang terdiri dari aplikasi Android, REST API, server cloud, dan database. Dokumen ditujukan untuk tim pengembang, dosen penilai, dan AI Agent yang akan mengimplementasikan sistem.

### 1.2 Lingkup Produk
Sistem memungkinkan pengguna menemukan tempat di sekitar kampus, melihat detailnya pada peta, menghitung jarak dari lokasi pengguna (GPS), dan membuka rute navigasi. Data dilayani oleh backend cloud melalui REST API; aplikasi Android tidak mengakses database secara langsung.

### 1.3 Definisi & Singkatan

| Istilah | Arti |
|---------|------|
| API | Application Programming Interface |
| REST | Representational State Transfer |
| GPS | Global Positioning System |
| MVP | Minimum Viable Product |
| JSON | JavaScript Object Notation |
| Marker | Penanda lokasi pada peta |
| Intent (Android) | Mekanisme membuka aplikasi lain (mis. aplikasi peta) |
| CRUD | Create, Read, Update, Delete |

### 1.4 Referensi
- Dokumen brief proyek "Cloud Computing — Android Map Directory".
- IEEE Std 830-1998 (Recommended Practice for SRS).

### 1.5 Ikhtisar Dokumen
Bagian 2 menjelaskan gambaran umum. Bagian 3 memuat kebutuhan fungsional. Bagian 4 kebutuhan non-fungsional. Bagian 5 kebutuhan antarmuka eksternal termasuk spesifikasi API.

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
Sistem terdiri dari lima komponen yang terpisah tanggung jawabnya:

```
[Android App] --HTTPS/JSON--> [REST API] --> [Cloud Server] --> [Database]
      |                                                              
      +--intent--> [Map Service / Aplikasi Peta]                    
```

Prinsip arsitektur: aplikasi Android **tidak** mengakses database langsung. Semua data melewati API.

### 2.2 Fungsi Utama Produk
- Menampilkan daftar tempat & kategori.
- Menampilkan tempat sebagai marker di peta.
- Membaca lokasi GPS dan menghitung jarak.
- Membuka rute ke tempat tujuan.
- (Opsional) pencarian/filter, admin input data, favorit/review.

### 2.3 Karakteristik Pengguna

| Pengguna | Karakteristik | Hak akses |
|----------|---------------|-----------|
| Mahasiswa | Pengguna umum, awam teknis | Baca data, gunakan GPS & rute |
| Admin | Mengelola data tempat | CRUD data via web admin |

### 2.4 Batasan Umum
- Backend wajib online (ter-deploy), bukan lokal.
- Credential DB hanya di server, tidak di aplikasi.
- Gunakan HTTPS jika memungkinkan.
- Koordinat (lat/lng) wajib ada untuk setiap tempat.

### 2.5 Asumsi & Ketergantungan
- Perangkat memiliki GPS, internet, dan aplikasi peta.
- Ketersediaan layanan Map SDK / penyedia peta.
- Data tempat diisi manual minimal 15–30 entri.

---

## 3. Kebutuhan Fungsional

> Notasi: **FR-x** = Functional Requirement. Setiap kebutuhan dapat diuji.

### 3.1 Manajemen Direktori Tempat

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-01 | Sistem harus menampilkan daftar seluruh tempat yang diambil dari endpoint `GET /api/places`. | Wajib |
| FR-02 | Setiap item daftar harus menampilkan nama, kategori, alamat singkat, dan estimasi jarak. | Wajib |
| FR-03 | Sistem harus menampilkan halaman detail tempat dari `GET /api/places/{id}` berisi nama, kategori, alamat, koordinat, jam buka, deskripsi, rating, dan foto (jika ada). | Wajib |
| FR-04 | Sistem harus menampilkan daftar kategori dari `GET /api/categories`. | Wajib |

### 3.2 Peta & Marker

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-05 | Sistem harus menampilkan peta dengan marker untuk setiap tempat berdasarkan latitude/longitude dari server. | Wajib |
| FR-06 | Saat marker ditekan, sistem harus menampilkan ringkasan (nama, jarak) dan tautan ke detail. | Wajib |
| FR-07 | Sistem harus menampilkan posisi pengguna saat ini pada peta. | Wajib |

### 3.3 GPS & Routing

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-08 | Sistem harus meminta izin lokasi (GPS) saat dibutuhkan. | Wajib |
| FR-09 | Sistem harus membaca lokasi pengguna dan menghitung jarak ke tiap tempat. | Wajib |
| FR-10 | Sistem harus membuka rute ke koordinat tujuan melalui intent URL aplikasi peta. | Wajib |
| FR-11 | Jika izin GPS ditolak, sistem tetap menampilkan daftar tempat tanpa jarak/rute dan memberi pesan. | Wajib |

### 3.4 Pencarian & Filter (Tambahan)

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-12 | Sistem harus memfilter tempat berdasarkan kategori melalui `GET /api/places?category={cat}`. | Tambahan |
| FR-13 | Sistem harus mencari tempat berdasarkan kata kunci nama/alamat. | Tambahan |
| FR-14 | Sistem harus mengurutkan tempat berdasarkan jarak atau rating. | Tambahan |

### 3.5 Admin & Data (Tambahan)

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-15 | Admin harus dapat menambah tempat melalui `POST /api/places` lewat halaman web sederhana. | Tambahan |
| FR-16 | Admin harus dapat mengedit/menghapus tempat. | Tambahan |
| FR-17 | Backend harus memvalidasi input (koordinat valid, kolom wajib terisi, kategori sesuai). | Wajib |

### 3.6 Favorit & Review (Tambahan)

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-18 | Pengguna harus dapat menyimpan tempat sebagai favorit. | Tambahan |
| FR-19 | Pengguna harus dapat memberi rating/komentar sederhana. | Tambahan |

### 3.7 Penanganan Error

| ID | Kebutuhan | Prioritas |
|----|-----------|-----------|
| FR-20 | Sistem harus menampilkan pesan jelas saat: GPS mati, API gagal, internet tidak ada, atau data kosong. | Wajib |
| FR-21 | Sistem harus menyediakan aksi coba lagi (retry) saat gagal memuat data. | Wajib |

---

## 4. Kebutuhan Non-Fungsional

### 4.1 Performa (NFR-Performance)
- **NFR-01:** Daftar tempat harus tampil dalam ≤ 3 detik pada koneksi normal.
- **NFR-02:** Respons API harus dikembalikan dalam ≤ 2 detik untuk daftar tempat standar.

### 4.2 Keamanan (NFR-Security)
- **NFR-03:** Credential database tidak boleh berada di aplikasi Android; hanya di server.
- **NFR-04:** Komunikasi sebaiknya menggunakan HTTPS, terutama saat dipublikasikan.
- **NFR-05:** Backend harus memvalidasi seluruh input untuk mencegah data tidak valid.
- **NFR-06:** API key layanan peta (jika ada) harus dibatasi penggunaannya.

### 4.3 Keandalan (NFR-Reliability)
- **NFR-07:** Sistem harus menangani kegagalan jaringan tanpa crash.
- **NFR-08:** Backend harus tetap memberi response valid (kode status & pesan) saat error.

### 4.4 Usability
- **NFR-09:** Alur utama (cari → detail → rute) harus dapat diselesaikan dalam ≤ 5 ketukan.
- **NFR-10:** Antarmuka harus menampilkan status loading, empty, dan error secara jelas.

### 4.5 Skalabilitas & Pemeliharaan
- **NFR-11:** App, API, dan database harus terpisah agar fitur baru (review, admin, analitik) mudah ditambah.
- **NFR-12:** Format JSON harus konsisten antar-endpoint.

### 4.6 Privasi
- **NFR-13:** Lokasi pengguna hanya dipakai sementara untuk jarak/rute dan tidak disimpan tanpa alasan jelas.

### 4.7 Kompatibilitas
- **NFR-14:** Aplikasi harus berjalan pada perangkat Android yang umum dipakai mahasiswa (mendukung Map SDK & GPS).

---

## 5. Kebutuhan Antarmuka Eksternal

### 5.1 Antarmuka Pengguna (UI)
Tiga layar inti minimum: **Home & Kategori**, **Peta & Marker**, **Detail & Rute**. (Rincian di dokumen UI/UX Flow.)

### 5.2 Antarmuka Perangkat Keras
- Modul GPS perangkat.
- Koneksi internet (seluler/Wi-Fi).

### 5.3 Antarmuka Perangkat Lunak
- Map SDK / aplikasi peta untuk menampilkan peta dan menerima intent rute.
- Server backend menyediakan REST API.

### 5.4 Antarmuka Komunikasi — Spesifikasi REST API

Semua endpoint mengembalikan **JSON**. Base path: `/api`.

#### 5.4.1 Daftar Endpoint

| Method | Endpoint | Fungsi | Prioritas |
|--------|----------|--------|-----------|
| GET | `/api/places` | Mengambil daftar semua tempat | Wajib |
| GET | `/api/places?category={cat}` | Filter tempat berdasarkan kategori | Wajib |
| GET | `/api/places/{id}` | Mengambil detail satu tempat | Wajib |
| GET | `/api/categories` | Mengambil daftar kategori | Wajib |
| POST | `/api/places` | Menambah tempat (admin) | Opsional |
| PUT | `/api/places/{id}` | Mengubah tempat (admin) | Opsional |
| DELETE | `/api/places/{id}` | Menghapus tempat (admin) | Opsional |

#### 5.4.2 Contoh Response — `GET /api/places`

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Kafe Literasi",
      "category": "cafe",
      "address": "Jl. Kampus No. 12",
      "latitude": -7.4471,
      "longitude": 112.7183,
      "description": "Kafe tenang untuk belajar, ada Wi-Fi.",
      "open_hours": "08:00-22:00",
      "price_range": "Rp15-30K",
      "rating": 4.5,
      "photo_url": "https://cdn.example.com/places/1.jpg"
    }
  ]
}
```

#### 5.4.3 Contoh Response — `GET /api/places/{id}`

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Kafe Literasi",
    "category": "cafe",
    "address": "Jl. Kampus No. 12",
    "latitude": -7.4471,
    "longitude": 112.7183,
    "description": "Kafe tenang untuk belajar, ada Wi-Fi.",
    "open_hours": "08:00-22:00",
    "price_range": "Rp15-30K",
    "rating": 4.5,
    "photo_url": "https://cdn.example.com/places/1.jpg"
  }
}
```

#### 5.4.4 Contoh Response — `GET /api/categories`

```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "cafe", "icon": "coffee" },
    { "id": 2, "name": "fotokopi", "icon": "printer" },
    { "id": 3, "name": "atm", "icon": "credit-card" }
  ]
}
```

#### 5.4.5 Contoh Request — `POST /api/places`

```json
{
  "name": "Kantin Pusat",
  "category_id": 4,
  "address": "Gedung A Lantai 1",
  "latitude": -7.4468,
  "longitude": 112.7190,
  "description": "Kantin dengan banyak pilihan menu.",
  "open_hours": "07:00-17:00",
  "price_range": "Rp10-25K"
}
```

#### 5.4.6 Format Error Standar

```json
{
  "status": "error",
  "code": 404,
  "message": "Tempat tidak ditemukan"
}
```

#### 5.4.7 Kode Status HTTP

| Kode | Makna |
|------|-------|
| 200 | OK — permintaan berhasil |
| 201 | Created — data berhasil ditambah |
| 400 | Bad Request — input tidak valid |
| 404 | Not Found — data tidak ditemukan |
| 500 | Internal Server Error |

---

## 6. Matriks Ketertelusuran (Traceability)

| User Story | Kebutuhan Fungsional |
|-----------|----------------------|
| US-01 | FR-01, FR-02 |
| US-02 | FR-05, FR-06 |
| US-03 | FR-07, FR-08, FR-09 |
| US-04 | FR-10 |
| US-05 | FR-03 |
| US-06 | FR-12, FR-13, FR-14 |
| US-07 | FR-18 |
| US-08 | FR-19 |
| US-09 | FR-15, FR-16, FR-17 |
| US-10 | FR-11, FR-20, FR-21 |
