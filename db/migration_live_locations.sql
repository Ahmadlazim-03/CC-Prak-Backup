-- =============================================================
--  Migration: live_locations (berbagi lokasi pengguna realtime)
--  Jalankan di Supabase SQL Editor (aman dijalankan ulang).
-- =============================================================

create table if not exists public.live_locations (
  user_id    varchar(128) primary key,        -- auth uid (login) atau device id (tamu)
  name       varchar(120),
  avatar_url varchar(400),
  latitude   double precision not null check (latitude between -90 and 90),
  longitude  double precision not null check (longitude between -180 and 180),
  is_guest   boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists live_locations_updated_idx on public.live_locations(updated_at);

-- Realtime: payload penuh + daftarkan ke publication SSE.
alter table public.live_locations replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.live_locations;
exception
  when duplicate_object then null;
end $$;

-- Verifikasi:  select * from public.live_locations;
