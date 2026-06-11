"use client";
import { useCallback, useEffect, useState } from "react";

export type GeoStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "error"
  | "unsupported";

export type GeoState = {
  status: GeoStatus;
  lat: number | null;
  lng: number | null;
  error?: string;
};

/** Hook GPS: minta izin & baca lokasi pengguna, dengan penanganan error. */
export function useGeolocation(auto = true) {
  const [state, setState] = useState<GeoState>({ status: "idle", lat: null, lng: null });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "unsupported", lat: null, lng: null });
      return;
    }
    setState((s) => ({ ...s, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) =>
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          lat: null,
          lng: null,
          error: err.message,
        }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (auto) request();
  }, [auto, request]);

  return { ...state, request };
}
