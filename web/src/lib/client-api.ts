// Pemanggil API dari sisi client. Selalu lewat /api/* (tidak pernah ke DB langsung).
import type { ApiResponse } from "./types";

async function unwrap<T>(res: Response): Promise<T> {
  let json: ApiResponse<T> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    /* respons bukan JSON */
  }
  if (!res.ok || !json || json.status !== "success") {
    const msg =
      json && json.status === "error" ? json.message : `Permintaan gagal (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return json.data;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { cache: "no-store", signal });
  return unwrap<T>(res);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
  apiKey?: string,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["X-API-Key"] = apiKey;
  const res = await fetch(path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return unwrap<T>(res);
}

/** Bangun query string dari objek (hanya nilai non-null). */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
