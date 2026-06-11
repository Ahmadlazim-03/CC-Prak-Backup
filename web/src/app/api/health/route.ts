import { ok, fail, preflight } from "@/lib/http";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  if (!isSupabaseConfigured) return fail(500, "Supabase belum dikonfigurasi (.env.local)");
  // Pakai SELECT nyata (bukan head/count) untuk benar-benar memastikan tabel ada.
  const { error } = await supabaseAdmin.from("categories").select("id").limit(1);
  if (error) return fail(500, `Database error: ${error.message}`);
  return ok({
    service: "android-map-directory-api",
    status: "up",
    time: new Date().toISOString(),
  });
}
