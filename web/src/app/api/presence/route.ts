import { ok, fail, preflight } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase";
import type { LiveLocation } from "@/lib/types";

export const dynamic = "force-dynamic";
const STALE_MS = 30_000; // dianggap offline bila tak update > 30 detik

export function OPTIONS() {
  return preflight();
}

function bearer(req: Request): string | null {
  const a = req.headers.get("authorization");
  return a && a.toLowerCase().startsWith("bearer ") ? a.slice(7) : null;
}

// GET /api/presence -> daftar lokasi pengguna yang aktif (≤30s)
export async function GET() {
  const since = new Date(Date.now() - STALE_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from("live_locations")
    .select("*")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false });
  if (error) return fail(500, error.message);
  return ok<LiveLocation[]>((data ?? []) as LiveLocation[]);
}

// POST /api/presence  body {lat,lng,name?,avatar_url?,user_id?(tamu)}  Authorization: Bearer <token>(login)
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "Body JSON tidak valid");
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isNaN(lat) || lat < -90 || lat > 90) return fail(400, "lat tidak valid");
  if (Number.isNaN(lng) || lng < -180 || lng > 180) return fail(400, "lng tidak valid");

  let userId = "";
  let name = typeof body.name === "string" ? body.name : null;
  let avatar = typeof body.avatar_url === "string" ? body.avatar_url : null;
  let isGuest = false;

  const token = bearer(req);
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return fail(401, "Sesi login tidak valid");
    const u = data.user;
    userId = u.id;
    name = name ?? (u.user_metadata?.full_name as string) ?? u.email ?? "Pengguna";
    avatar = avatar ?? (u.user_metadata?.avatar_url as string) ?? null;
  } else {
    const gid = typeof body.user_id === "string" ? body.user_id.trim() : "";
    if (!gid) return fail(401, "Perlu login, atau sertakan user_id untuk mode tamu");
    userId = gid;
    isGuest = true;
    name = name ?? "Tamu";
  }

  const { error } = await supabaseAdmin.from("live_locations").upsert(
    {
      user_id: userId,
      name,
      avatar_url: avatar,
      latitude: lat,
      longitude: lng,
      is_guest: isGuest,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return fail(500, error.message);
  return ok({ user_id: userId, shared: true });
}

// DELETE /api/presence?user_id=...  (berhenti berbagi)
export async function DELETE(req: Request) {
  let userId = new URL(req.url).searchParams.get("user_id") ?? "";
  const token = bearer(req);
  if (token) {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data?.user) userId = data.user.id;
  }
  if (!userId) return fail(400, "user_id wajib");
  const { error } = await supabaseAdmin.from("live_locations").delete().eq("user_id", userId);
  if (error) return fail(500, error.message);
  return ok({ user_id: userId, shared: false });
}
