-- =============================================================
--  Android Map Directory — SEED DATA
--  Jalankan SETELAH schema.sql berhasil.
--  Area: sekitar kampus ITS Keputih, Sukolilo, Surabaya.
--  Total: 7 kategori + 24 tempat (koordinat valid) + review + favorit.
-- =============================================================

-- ---------- CATEGORIES (7) ----------
insert into public.categories (name, icon) values
  ('Kafe',           'coffee'),
  ('Kantin',         'utensils'),
  ('Fotokopi',       'printer'),
  ('Kos',            'home'),
  ('Parkir',         'parking'),
  ('ATM',            'credit-card'),
  ('Layanan Kampus', 'building');

-- ---------- PLACES (24) ----------
insert into public.places
  (category_id, name, latitude, longitude, address, description, open_hours, price_range, rating, photo_url)
values
  -- Kafe
  ((select id from public.categories where name='Kafe'), 'Kafe Literasi', -7.2756, 112.7946, 'Jl. Teknik Kimia No. 1, Keputih', 'Kafe tenang dekat perpustakaan, Wi-Fi kencang dan colokan di tiap meja.', '08:00-22:00', 'Rp15-30K', 4.5, 'https://picsum.photos/seed/place01/400/300'),
  ((select id from public.categories where name='Kafe'), 'Kopi Sumbu',    -7.2802, 112.7971, 'Jl. Keputih Tegal No. 12', 'Spot ngopi favorit mahasiswa, buka sampai larut, ada area outdoor.', '10:00-24:00', 'Rp18-35K', 4.3, 'https://picsum.photos/seed/place02/400/300'),
  ((select id from public.categories where name='Kafe'), 'Ngopi Squad',   -7.2841, 112.7935, 'Jl. Arief Rahman Hakim No. 8', 'Coworking cafe dengan ruang meeting kecil, cocok untuk kerja kelompok.', '09:00-23:00', 'Rp20-40K', 4.6, 'https://picsum.photos/seed/place03/400/300'),
  ((select id from public.categories where name='Kafe'), 'Teras Kopi ITS', -7.2789, 112.7958, 'Gedung Riset, Kawasan ITS', 'Kafe mungil di dalam kampus, harga ramah mahasiswa.', '07:30-18:00', 'Rp12-25K', 4.1, 'https://picsum.photos/seed/place04/400/300'),

  -- Kantin
  ((select id from public.categories where name='Kantin'), 'Kantin Pusat ITS', -7.2814, 112.7944, 'Gedung Pusat Kegiatan Mahasiswa, ITS', 'Kantin besar banyak stand: nasi, mie, jus, gorengan.', '07:00-17:00', 'Rp10-25K', 4.0, 'https://picsum.photos/seed/place05/400/300'),
  ((select id from public.categories where name='Kantin'), 'Warung Bu Sis',   -7.2837, 112.7969, 'Jl. Keputih Gang II', 'Warung rumahan, menu sayur dan lauk komplit, porsi besar.', '06:30-15:00', 'Rp8-20K', 4.4, 'https://picsum.photos/seed/place06/400/300'),
  ((select id from public.categories where name='Kantin'), 'Kantin Teknik',   -7.2795, 112.7921, 'Area Fakultas Teknik Sipil, ITS', 'Dekat ruang kuliah teknik, andalannya ayam geprek.', '08:00-16:00', 'Rp10-22K', 3.9, 'https://picsum.photos/seed/place07/400/300'),
  ((select id from public.categories where name='Kantin'), 'Penyetan Mas Bro', -7.2860, 112.7951, 'Jl. Keputih Tegal Timur No. 3', 'Penyetan ayam, lele, tempe dengan sambal pedas mantap.', '16:00-23:00', 'Rp12-25K', 4.5, 'https://picsum.photos/seed/place08/400/300'),

  -- Fotokopi
  ((select id from public.categories where name='Fotokopi'), 'Fotokopi Mawar',        -7.2778, 112.7959, 'Jl. Teknik Mesin No. 5', 'Fotokopi, print warna, jilid cepat, dekat gerbang kampus.', '07:00-21:00', 'Rp200-1K/lbr', 4.2, 'https://picsum.photos/seed/place09/400/300'),
  ((select id from public.categories where name='Fotokopi'), 'Copy Center Keputih',   -7.2823, 112.7983, 'Jl. Keputih Tegal No. 20', 'Layanan print dokumen, scan, dan cetak banner.', '08:00-20:00', 'Rp250-1.5K/lbr', 4.0, 'https://picsum.photos/seed/place10/400/300'),
  ((select id from public.categories where name='Fotokopi'), 'Print & Jilid Express', -7.2848, 112.7929, 'Jl. Arief Rahman Hakim No. 22', 'Spesialis jilid skripsi & hardcover, bisa ditunggu.', '08:00-22:00', 'Rp5-25K/jilid', 4.3, 'https://picsum.photos/seed/place11/400/300'),

  -- Kos
  ((select id from public.categories where name='Kos'), 'Kos Putri Melati',   -7.2869, 112.7977, 'Jl. Keputih Gang III No. 7', 'Kos putri, kamar mandi dalam, Wi-Fi, dekat kampus.', '24 Jam', 'Rp650K-1.1Jt/bln', 4.1, 'https://picsum.photos/seed/place12/400/300'),
  ((select id from public.categories where name='Kos'), 'Kos Putra Garuda',   -7.2885, 112.7943, 'Jl. Keputih Tegal Barat No. 14', 'Kos putra, parkir luas, dapur bersama, akses 24 jam.', '24 Jam', 'Rp600K-950K/bln', 3.8, 'https://picsum.photos/seed/place13/400/300'),
  ((select id from public.categories where name='Kos'), 'Griya Kos Keputih',  -7.2858, 112.8001, 'Jl. Keputih Tegal Timur No. 9', 'Kos campur eksklusif, AC, kamar mandi dalam.', '24 Jam', 'Rp900K-1.5Jt/bln', 4.4, 'https://picsum.photos/seed/place14/400/300'),

  -- Parkir
  ((select id from public.categories where name='Parkir'), 'Parkir Pusat ITS',       -7.2808, 112.7939, 'Depan Gedung Rektorat, ITS', 'Lahan parkir utama, kapasitas besar, ada petugas.', '06:00-21:00', 'Rp2-5K', 4.0, 'https://picsum.photos/seed/place15/400/300'),
  ((select id from public.categories where name='Parkir'), 'Parkir Perpustakaan',    -7.2762, 112.7951, 'Samping Perpustakaan ITS', 'Parkir motor dekat perpustakaan, teduh.', '07:00-20:00', 'Rp2K', 3.9, 'https://picsum.photos/seed/place16/400/300'),
  ((select id from public.categories where name='Parkir'), 'Parkir Teknik Sipil',    -7.2799, 112.7912, 'Area Fakultas Teknik Sipil, ITS', 'Parkir khusus area teknik, dekat ruang kelas.', '06:30-18:00', 'Rp2K', 3.7, 'https://picsum.photos/seed/place17/400/300'),

  -- ATM
  ((select id from public.categories where name='ATM'), 'ATM Center ITS',      -7.2811, 112.7951, 'Gedung Pusat, ITS', 'Galeri ATM beberapa bank (BNI, BRI, Mandiri, BCA).', '24 Jam', '-', 4.2, 'https://picsum.photos/seed/place18/400/300'),
  ((select id from public.categories where name='ATM'), 'ATM BNI Keputih',     -7.2832, 112.7990, 'Jl. Keputih Tegal No. 25', 'ATM BNI, tarik & setor tunai.', '24 Jam', '-', 4.0, 'https://picsum.photos/seed/place19/400/300'),
  ((select id from public.categories where name='ATM'), 'ATM Mandiri Sukolilo', -7.2851, 112.7920, 'Jl. Arief Rahman Hakim No. 30', 'ATM Mandiri, dekat minimarket.', '24 Jam', '-', 3.8, 'https://picsum.photos/seed/place20/400/300'),

  -- Layanan Kampus
  ((select id from public.categories where name='Layanan Kampus'), 'Perpustakaan ITS',      -7.2761, 112.7948, 'Jl. Teknik Kimia, Kawasan ITS', 'Perpustakaan pusat, ruang baca & diskusi, koleksi lengkap.', '08:00-20:00', '-', 4.7, 'https://picsum.photos/seed/place21/400/300'),
  ((select id from public.categories where name='Layanan Kampus'), 'Klinik Kesehatan ITS',  -7.2820, 112.7930, 'Gedung Medical Center, ITS', 'Layanan kesehatan mahasiswa & umum, dokter jaga.', '08:00-16:00', 'Gratis-Rp50K', 4.3, 'https://picsum.photos/seed/place22/400/300'),
  ((select id from public.categories where name='Layanan Kampus'), 'BAAK Akademik',         -7.2806, 112.7925, 'Gedung Rektorat Lt. 1, ITS', 'Urusan administrasi akademik & surat-menyurat.', '08:00-15:00', '-', 4.0, 'https://picsum.photos/seed/place23/400/300'),
  ((select id from public.categories where name='Layanan Kampus'), 'Masjid Manarul Ilmi',   -7.2838, 112.7961, 'Kawasan ITS, Sukolilo', 'Masjid kampus, tempat ibadah & kegiatan keagamaan.', '24 Jam', '-', 4.8, 'https://picsum.photos/seed/place24/400/300');

-- ---------- REVIEWS (contoh) ----------
insert into public.reviews (place_id, user_id, rating, comment) values
  ((select id from public.places where name='Kafe Literasi'),     'device-001', 5, 'Wi-Fi kencang, cocok ngerjain tugas sampai malam.'),
  ((select id from public.places where name='Kafe Literasi'),     'device-002', 4, 'Kopi enak tapi kadang penuh kalau musim ujian.'),
  ((select id from public.places where name='Ngopi Squad'),       'device-003', 5, 'Ruang meeting-nya ngebantu banget buat tugas kelompok.'),
  ((select id from public.places where name='Warung Bu Sis'),     'device-002', 5, 'Murah, porsi banyak, sayurnya seger.'),
  ((select id from public.places where name='Penyetan Mas Bro'),  'device-004', 4, 'Sambalnya juara, pedas nampol.'),
  ((select id from public.places where name='Perpustakaan ITS'),  'device-001', 5, 'Tempat belajar paling nyaman di kampus.'),
  ((select id from public.places where name='Masjid Manarul Ilmi'),'device-005',5, 'Bersih dan adem, parkir luas.'),
  ((select id from public.places where name='Fotokopi Mawar'),    'device-003', 4, 'Cepat dan rapi, harga standar.');

-- ---------- FAVORITES (contoh) ----------
insert into public.favorites (place_id, user_id) values
  ((select id from public.places where name='Kafe Literasi'),    'device-001'),
  ((select id from public.places where name='Perpustakaan ITS'), 'device-001'),
  ((select id from public.places where name='Ngopi Squad'),      'device-003'),
  ((select id from public.places where name='Penyetan Mas Bro'), 'device-004'),
  ((select id from public.places where name='Warung Bu Sis'),    'device-002');

-- Selesai. Verifikasi cepat:
--   select count(*) from public.places;     -- harus 24
--   select count(*) from public.categories; -- harus 7
