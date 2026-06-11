"use client";
import { useEffect, useState } from "react";
import {
  MapPin,
  Bell,
  Camera,
  Images,
  Check,
  X as XIcon,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type PermState = "idle" | "granted" | "denied" | "loading";
type Key = "location" | "notifications" | "camera" | "gallery";

const META: Record<Key, { icon: typeof MapPin; label: string; desc: string }> = {
  location: { icon: MapPin, label: "Lokasi (GPS)", desc: "Untuk jarak, rute, & berbagi posisi" },
  notifications: { icon: Bell, label: "Notifikasi", desc: "Info tempat baru & aktivitas" },
  camera: { icon: Camera, label: "Kamera", desc: "Ambil foto tempat saat kontribusi" },
  gallery: { icon: Images, label: "Galeri / Foto", desc: "Pilih foto untuk tempat" },
};

export function PermissionsPrompt({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<Record<Key, PermState>>({
    location: "idle",
    notifications: "idle",
    camera: "idle",
    gallery: "idle",
  });
  const [running, setRunning] = useState(false);

  // Cek status awal lewat Permissions API bila tersedia.
  useEffect(() => {
    const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
    if (!perms?.query) return;
    (["geolocation", "notifications", "camera"] as const).forEach((name) => {
      perms
        .query({ name: name as PermissionName })
        .then((r) => {
          if (r.state === "granted") {
            const key = name === "geolocation" ? "location" : (name as Key);
            setState((s) => ({ ...s, [key]: "granted" }));
          }
        })
        .catch(() => {});
    });
  }, []);

  const set = (k: Key, v: PermState) => setState((s) => ({ ...s, [k]: v }));

  const reqLocation = () =>
    new Promise<void>((resolve) => {
      if (!("geolocation" in navigator)) return set("location", "denied"), resolve();
      set("location", "loading");
      navigator.geolocation.getCurrentPosition(
        () => (set("location", "granted"), resolve()),
        () => (set("location", "denied"), resolve()),
        { timeout: 10000 },
      );
    });

  const reqNotifications = async () => {
    if (!("Notification" in window)) return set("notifications", "denied");
    set("notifications", "loading");
    try {
      const r = await Notification.requestPermission();
      set("notifications", r === "granted" ? "granted" : "denied");
    } catch {
      set("notifications", "denied");
    }
  };

  const reqCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return set("camera", "denied");
    set("camera", "loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop()); // langsung lepas, hanya untuk izin
      set("camera", "granted");
    } catch {
      set("camera", "denied");
    }
  };

  // Galeri di web diakses lewat input file (tanpa prompt persisten) → tandai siap.
  const reqGallery = async () => {
    set("gallery", "granted");
  };

  const requestOne = (k: Key) => {
    if (k === "location") return reqLocation();
    if (k === "notifications") return reqNotifications();
    if (k === "camera") return reqCamera();
    return reqGallery();
  };

  const allow = async () => {
    setRunning(true);
    // berurutan agar prompt tidak bertumpuk
    await reqLocation();
    await reqNotifications();
    await reqCamera();
    await reqGallery();
    setRunning(false);
  };

  const StatusIcon = ({ s }: { s: PermState }) => {
    if (s === "loading") return <Loader2 size={16} className="animate-spin text-foreground/40" />;
    if (s === "granted") return <Check size={16} className="text-emerald-600" />;
    if (s === "denied") return <XIcon size={16} className="text-red-500" />;
    return <span className="text-xs font-medium text-indigo-600">Izinkan</span>;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-5 pb-8 pt-10 text-white">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold">Izin Akses</h1>
        <p className="mt-1 text-sm text-indigo-100/90">
          Agar semua fitur berjalan optimal, izinkan akses berikut. Kamu bisa mengaturnya lagi kapan saja
          lewat pengaturan browser.
        </p>
      </div>

      <div className="flex-1 space-y-2.5 p-5">
        {(Object.keys(META) as Key[]).map((k) => {
          const { icon: Icon, label, desc } = META[k];
          const s = state[k];
          return (
            <button
              key={k}
              onClick={() => requestOne(k)}
              disabled={s === "loading" || s === "granted"}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-sm ring-1 ring-black/5 transition disabled:opacity-100 dark:bg-neutral-900"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  s === "granted" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{label}</p>
                <p className="text-xs text-foreground/55">{desc}</p>
              </div>
              <StatusIcon s={s} />
            </button>
          );
        })}
      </div>

      <div className="space-y-2 border-t border-black/5 p-5">
        <button
          onClick={allow}
          disabled={running}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.99] disabled:opacity-60"
        >
          {running ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          {running ? "Meminta izin…" : "Izinkan Semua"}
        </button>
        <button
          onClick={onDone}
          className="w-full py-2.5 text-sm font-medium text-foreground/55 hover:text-foreground"
        >
          Lanjut ke aplikasi
        </button>
      </div>
    </div>
  );
}
