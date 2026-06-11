import { ok, fail, preflight } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("categories").select("*").order("id");
  if (error) return fail(500, error.message);
  return ok<Category[]>(data as Category[]);
}
