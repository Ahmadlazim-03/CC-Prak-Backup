// Helper respons HTTP + CORS + cek API key, dipakai semua Route Handler.
import { NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

/** Respons sukses: { status: "success", data }. */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ status: "success", data }, { status, headers: CORS_HEADERS });
}

/** Respons error standar: { status: "error", code, message }. */
export function fail(code: number, message: string): NextResponse {
  return NextResponse.json({ status: "error", code, message }, { status: code, headers: CORS_HEADERS });
}

/** Jawaban preflight CORS (OPTIONS). */
export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** True bila header X-API-Key cocok dengan API_KEY di server. */
export function hasValidApiKey(req: Request): boolean {
  const provided = req.headers.get("x-api-key");
  return Boolean(provided && provided === process.env.API_KEY);
}

export { CORS_HEADERS };
