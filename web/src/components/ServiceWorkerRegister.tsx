"use client";
import { useEffect } from "react";

/** Mendaftarkan service worker agar PWA bisa di-install (silent jika gagal). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* abaikan: SW opsional */
      });
    }
  }, []);
  return null;
}
