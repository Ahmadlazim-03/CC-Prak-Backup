"use client";
// ID perangkat anonim (untuk favorit & review), disimpan di localStorage.
const KEY = "amd_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "anon";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = "device-" + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
