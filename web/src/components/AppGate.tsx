"use client";
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { PermissionsPrompt } from "@/components/PermissionsPrompt";

const GUEST_KEY = "amd_guest";
const PERMS_KEY = "amd_perms_done";

/**
 * Gerbang aplikasi: setelah splash → layar Login (kecuali sudah login / pilih tamu)
 * → layar Izin akses (sekali per perangkat) → aplikasi.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const [ready, setReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const [permsDone, setPermsDone] = useState(false);

  useEffect(() => {
    setGuest(sessionStorage.getItem(GUEST_KEY) === "1");
    setPermsDone(localStorage.getItem(PERMS_KEY) === "1");
    setReady(true);
  }, []);

  // Saat berhasil login, batalkan status "tamu".
  useEffect(() => {
    if (user && guest) {
      sessionStorage.removeItem(GUEST_KEY);
      setGuest(false);
    }
  }, [user, guest]);

  const continueAsGuest = () => {
    sessionStorage.setItem(GUEST_KEY, "1");
    setGuest(true);
  };

  const finishPerms = () => {
    localStorage.setItem(PERMS_KEY, "1");
    setPermsDone(true);
  };

  // Sedang menyiapkan / cek sesi → loader bermerek (splash menutup detik awal).
  if (!ready || loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-foreground/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          <MapPin size={30} />
        </div>
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  const needLogin = configured && !user && !guest;

  // 1) Gerbang Login (penuh layar)
  if (needLogin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pb-10 pt-14 text-white">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-xl">
            <MapPin size={34} className="text-emerald-600" strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-bold">Selamat datang 👋</h1>
          <p className="mt-1 text-sm text-emerald-50/90">
            Masuk untuk menyimpan favorit, berbagi lokasi realtime, dan berkontribusi tempat.
          </p>
        </div>
        <div className="-mt-5 flex-1 px-5">
          <AuthPanel onGuest={continueAsGuest} />
        </div>
      </div>
    );
  }

  // 2) Layar Izin akses (sekali per perangkat, setelah login/tamu)
  if ((user || guest) && !permsDone) {
    return <PermissionsPrompt onDone={finishPerms} />;
  }

  // 3) Aplikasi
  return <>{children}</>;
}
