"use client";
import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "./supabase-browser";
import { getDeviceId } from "./device";

export type ShareProfile = { name: string; avatarUrl: string | null; isGuest: boolean };

/**
 * Saat `enabled`, pantau lokasi (watchPosition) dan kirim ke /api/presence tiap ≥4s
 * supaya pengguna lain melihat posisi kita realtime. Saat dimatikan → hapus presence.
 */
export function useShareLocation(enabled: boolean, profile: ShareProfile) {
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    const sb = getSupabaseBrowser();

    const authHeader = async (): Promise<Record<string, string>> => {
      if (sb && !profile.isGuest) {
        const { data } = await sb.auth.getSession();
        const t = data.session?.access_token;
        if (t) return { Authorization: `Bearer ${t}` };
      }
      return {};
    };

    const send = async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSent.current < 4000) return;
      lastSent.current = now;
      const headers = { "Content-Type": "application/json", ...(await authHeader()) };
      const guestBody = "Authorization" in headers ? {} : { user_id: getDeviceId() };
      fetch("/api/presence", {
        method: "POST",
        headers,
        body: JSON.stringify({ lat, lng, name: profile.name, avatar_url: profile.avatarUrl, ...guestBody }),
      }).catch(() => {});
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => send(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      void (async () => {
        const headers = await authHeader();
        const url =
          "Authorization" in headers
            ? "/api/presence"
            : `/api/presence?user_id=${encodeURIComponent(getDeviceId())}`;
        fetch(url, { method: "DELETE", headers }).catch(() => {});
      })();
    };
  }, [enabled, profile.name, profile.avatarUrl, profile.isGuest]);
}
