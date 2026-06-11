"use client";
import { useEffect, useRef } from "react";

export type RealtimeChange = {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE" | string;
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

/**
 * Berlangganan perubahan realtime lewat SSE /api/stream (server yang konek ke
 * Supabase Realtime). Browser otomatis reconnect bila koneksi putus.
 */
export function useRealtime(
  onChange: (change: RealtimeChange) => void,
  tables?: string[],
) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;
  const key = (tables ?? []).join(",");

  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;
    const allow = key ? key.split(",") : null;

    const es = new EventSource("/api/stream");
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as RealtimeChange;
        if (!allow || allow.includes(data.table)) cbRef.current(data);
      } catch {
        /* abaikan payload non-JSON */
      }
    };
    es.addEventListener("change", handler as EventListener);

    return () => {
      es.removeEventListener("change", handler as EventListener);
      es.close();
    };
  }, [key]);
}
