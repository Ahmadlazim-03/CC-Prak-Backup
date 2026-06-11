"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { Heart, LogOut, MapPin, PlusCircle, UserRound } from "lucide-react";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();

  const profileName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Pengguna";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div>
      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 pb-7 pt-8 text-white">
        <h1 className="text-2xl font-bold">Akun</h1>
        <p className="text-sm text-indigo-100/90">Kelola profil, favorit & kontribusimu.</p>
      </header>

      <div className="-mt-4 space-y-4 px-4 pb-4">
        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-foreground/50 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
            Memuat…
          </div>
        ) : user ? (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={profileName} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <UserRound size={26} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{profileName}</p>
                {user.email && <p className="truncate text-sm text-foreground/55">{user.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Link href="/add" className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
                <PlusCircle size={20} className="text-emerald-600" /> Tambah
              </Link>
              <Link href="/favorites" className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
                <Heart size={20} className="text-rose-500" /> Favorit
              </Link>
              <Link href="/map" className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-xs font-medium shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
                <MapPin size={20} className="text-emerald-600" /> Peta
              </Link>
            </div>

            <button
              onClick={signOut}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Keluar
            </button>
          </>
        ) : (
          <AuthPanel />
        )}
      </div>
    </div>
  );
}
