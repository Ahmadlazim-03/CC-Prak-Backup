"use client";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./client-api";
import { useRealtime } from "./useRealtime";
import type { LiveLocation } from "./types";

/**
 * Membaca lokasi pengguna lain (realtime) lewat /api/presence + SSE.
 * `excludeId` = id kita sendiri agar tidak menampilkan diri sendiri.
 */
export function usePresence(excludeId: string | null) {
  const [others, setOthers] = useState<LiveLocation[]>([]);

  const refresh = useCallback(async () => {
    try {
      const all = await apiGet<LiveLocation[]>("/api/presence");
      setOthers(all.filter((o) => o.user_id !== excludeId));
    } catch {
      /* abaikan */
    }
  }, [excludeId]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 12_000); // buang yang sudah basi
    return () => clearInterval(t);
  }, [refresh]);

  // Update instan saat ada perubahan presence.
  useRealtime(() => refresh(), ["live_locations"]);

  return others;
}
