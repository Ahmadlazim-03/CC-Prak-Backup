-- =============================================================
--  Android Map Directory — DATABASE SCHEMA (Supabase / PostgreSQL)
--  Cloud Computing Project
--
--  Cara pakai: buka Supabase Dashboard > SQL Editor > New query,
--  tempel SELURUH isi file ini, lalu Run. Setelah itu jalankan seed.sql.
--
--  PERINGATAN: script ini MENGHAPUS tabel lama (DROP) lalu membuat ulang.
--  Semua data lama di tabel berikut akan hilang.
-- =============================================================

-- ---------- 1. WIPE (drop dengan urutan dependensi) ----------
drop table if exists public.favorites cascade;
drop table if exists public.reviews   cascade;
drop table if exists public.places    cascade;
drop table if exists public.categories cascade;

-- ---------- 2. CATEGORIES ----------
create table public.categories (
  id         bigint generated always as identity primary key,
  name       varchar(50)  not null,
  icon       varchar(50),                       -- nama ikon (lucide): coffee, utensils, ...
  created_at timestamptz  not null default now()
);

-- ---------- 3. PLACES ----------
-- Catatan: latitude & longitude WAJIB (inti aplikasi peta).
create table public.places (
  id          bigint generated always as identity primary key,
  category_id bigint       not null references public.categories(id) on delete restrict,
  name        varchar(120) not null,
  latitude    double precision not null check (latitude  between -90  and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  address     varchar(255),
  description text,
  open_hours  varchar(50),                      -- mis. "08:00-22:00"
  price_range varchar(50),                      -- mis. "Rp15-30K"
  rating      numeric(2,1) default 0 check (rating between 0 and 5),
  photo_url   varchar(255),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);
create index places_category_id_idx on public.places(category_id);
create index places_name_idx        on public.places using gin (to_tsvector('simple', name));

-- ---------- 4. REVIEWS ----------
create table public.reviews (
  id         bigint generated always as identity primary key,
  place_id   bigint     not null references public.places(id) on delete cascade,
  user_id    varchar(64) not null,              -- id perangkat / anonim
  rating     int        not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);
create index reviews_place_id_idx on public.reviews(place_id);

-- ---------- 5. FAVORITES ----------
create table public.favorites (
  id         bigint generated always as identity primary key,
  place_id   bigint     not null references public.places(id) on delete cascade,
  user_id    varchar(64) not null,
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);
create index favorites_user_id_idx on public.favorites(user_id);

-- ---------- 6. TRIGGER updated_at pada places ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger places_set_updated_at
  before update on public.places
  for each row execute function public.set_updated_at();

-- ---------- 7. REALTIME ----------
-- Payload penuh (termasuk data lama saat UPDATE/DELETE) untuk SSE.
alter table public.places    replica identity full;
alter table public.reviews   replica identity full;
alter table public.favorites replica identity full;

-- Daftarkan ke publication realtime bawaan Supabase.
-- (Setelah DROP di atas, tabel pasti belum terdaftar, jadi ADD aman.)
alter publication supabase_realtime add table public.places;
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.favorites;

-- Selesai. Lanjut jalankan seed.sql untuk mengisi data.
