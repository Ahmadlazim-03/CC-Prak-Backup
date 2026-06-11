// Supabase admin client — SERVER ONLY.
// Memakai SERVICE_ROLE key, jadi file ini TIDAK BOLEH diimpor dari komponen client.
// Semua akses DB melewati Route Handlers (/api/*) sesuai aturan arsitektur proyek.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Tidak melempar saat build; route handler akan menampilkan error 500 yang jelas.
  console.warn("[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di .env.local");
}

/** Singleton untuk query REST (PostgREST). */
export const supabaseAdmin: SupabaseClient = createClient(url ?? "", serviceKey ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Client baru khusus koneksi Realtime (dipakai per-koneksi SSE agar lifecycle bersih). */
export function createRealtimeClient(): SupabaseClient {
  return createClient(url ?? "", serviceKey ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const isSupabaseConfigured = Boolean(url && serviceKey);
