"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

/** Splash screen bermerek, tampil sekali per sesi browser lalu memudar. */
export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("amd_splashed")) return;
    setShow(true);
    sessionStorage.setItem("amd_splashed", "1");
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(() => setShow(false), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl">
          <MapPin size={48} className="text-emerald-600" strokeWidth={2.4} />
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">Kampus Directory</h1>
      <p className="mt-1 text-sm text-emerald-50/90">Temukan tempat · Lihat peta · Buka rute</p>
      <div className="mt-8 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
      </div>
    </div>
  );
}
