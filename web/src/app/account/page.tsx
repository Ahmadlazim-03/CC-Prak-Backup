"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  Heart,
  LogOut,
  MapPin,
  PlusCircle,
  ShieldAlert,
  UserRound,
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.6 35.5 12.5 30.4 12.5 24S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.6-2 13-5.2l-6-5.1c-2 1.4-4.5 2.3-7 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.2l6 5.1c-.4.4 6.3-4.6 6.3-14.3 0-1.2-.1-2.3-.3-3.5z" />
    </svg>
  );
}

export default function AccountPage() {
  const { user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } =
    useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profileName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Pengguna";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  const google = async () => {
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal login Google");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setBusy(true);
    try {
      if (tab === "login") {
        await signInWithEmail(email.trim(), password);
      } else {
        if (name.trim().length < 2) throw new Error("Nama minimal 2 karakter");
        if (password.length < 6) throw new Error("Kata sandi minimal 6 karakter");
        const { needsConfirm } = await signUpWithEmail(email.trim(), password, name.trim());
        if (needsConfirm) {
          setOk("Registrasi berhasil! Cek email kamu untuk konfirmasi, lalu masuk.");
          setTab("login");
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-foreground/15 bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div>
      <header className="bg-gradient-to-br from-indigo-600 to-violet-700 px-4 pb-7 pt-8 text-white">
        <h1 className="text-2xl font-bold">Akun</h1>
        <p className="text-sm text-indigo-100/90">Masuk untuk berbagi lokasi & menyimpan favorit.</p>
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
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
            {!configured && (
              <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-200">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <ShieldAlert size={14} /> Auth belum dikonfigurasi
                </p>
                Isi <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Kamu
                tetap bisa memakai app sebagai tamu.
              </div>
            )}

            {/* Tabs */}
            <div className="mb-4 grid grid-cols-2 rounded-xl bg-foreground/5 p-1 text-sm font-semibold">
              <button
                onClick={() => {
                  setTab("login");
                  setErr(null);
                }}
                className={`rounded-lg py-2 transition ${tab === "login" ? "bg-white text-indigo-700 shadow-sm dark:bg-neutral-800" : "text-foreground/55"}`}
              >
                Masuk
              </button>
              <button
                onClick={() => {
                  setTab("register");
                  setErr(null);
                }}
                className={`rounded-lg py-2 transition ${tab === "register" ? "bg-white text-indigo-700 shadow-sm dark:bg-neutral-800" : "text-foreground/55"}`}
              >
                Daftar
              </button>
            </div>

            <form onSubmit={submit} className="space-y-2.5">
              {tab === "register" && (
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className={field} />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={field} />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kata sandi" className={field} />
              </div>

              {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
              {ok && (
                <p className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 size={15} /> {ok}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition active:scale-[0.99] disabled:opacity-60"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {tab === "login" ? "Masuk" : "Daftar"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-foreground/40">
              <span className="h-px flex-1 bg-foreground/10" /> atau <span className="h-px flex-1 bg-foreground/10" />
            </div>

            <button
              onClick={google}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-foreground/15 bg-white py-3 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              <GoogleIcon /> Lanjut dengan Google
            </button>

            <p className="mt-3 text-center text-xs text-foreground/45">
              Tanpa login pun kamu tetap bisa menjelajah & berbagi lokasi sebagai tamu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
