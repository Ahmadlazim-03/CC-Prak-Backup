"use client";
import nextDynamic from "next/dynamic";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/client-api";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Category, Place } from "@/lib/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ArrowLeft, Check, Loader2, MapPin } from "lucide-react";

const LocationPicker = nextDynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-60 w-full animate-pulse rounded-2xl bg-foreground/10" />,
});

export default function AddPlacePage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    name: "",
    category_id: "" as number | "",
    address: "",
    open_hours: "",
    price_range: "",
    description: "",
    photo_url: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Category[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!coord) {
      setErr("Tentukan titik lokasi di peta dulu (geser pin).");
      return;
    }
    if (!form.name || !form.category_id || !form.address) {
      setErr("Nama, kategori, dan alamat wajib diisi.");
      return;
    }
    // Menambah tempat butuh akun → buka modal login bila perlu, lalu lanjut otomatis.
    requireAuth(() => doSubmit(), "Masuk untuk menambah tempat baru.");
  };

  const doSubmit = async () => {
    if (!coord) return;
    setBusy(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const sb = getSupabaseBrowser();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (data.session?.access_token) headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch("/api/places", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          category_id: Number(form.category_id),
          latitude: coord.lat,
          longitude: coord.lng,
          address: form.address,
          open_hours: form.open_hours,
          price_range: form.price_range,
          description: form.description,
          photo_url: form.photo_url,
        }),
      });
      const json = await res.json();
      if (json.status !== "success") throw new Error(json.message || "Gagal menambah tempat");
      const place = json.data as Place;
      router.push(`/place/${place.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menambah tempat");
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-foreground/15 bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-gradient-to-br from-emerald-600 to-teal-700 px-4 py-4 text-white">
        <button onClick={() => router.back()} aria-label="Kembali" className="active:scale-90">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-bold leading-tight">Tambah Tempat</h1>
          <p className="text-xs text-emerald-50/90">Bantu lengkapi direktori kampus</p>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-4 p-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <MapPin size={15} className="text-emerald-600" /> Titik lokasi
          </label>
          <LocationPicker value={coord} onChange={(lat, lng) => setCoord({ lat, lng })} />
        </div>

        <input
          required
          placeholder="Nama tempat *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={input}
        />

        {/* Kategori sebagai grid chip */}
        <div>
          <p className="mb-1.5 text-sm font-semibold">Kategori *</p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => {
              const active = form.category_id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm({ ...form, category_id: c.id })}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition ${
                    active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-foreground/10 text-foreground/60 hover:bg-foreground/5"
                  }`}
                >
                  <CategoryIcon name={c.icon} size={18} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        <input
          required
          placeholder="Alamat *"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className={input}
        />
        <div className="flex gap-2">
          <input
            placeholder="Jam buka (08:00-22:00)"
            value={form.open_hours}
            onChange={(e) => setForm({ ...form, open_hours: e.target.value })}
            className={input}
          />
          <input
            placeholder="Harga (Rp10-25K)"
            value={form.price_range}
            onChange={(e) => setForm({ ...form, price_range: e.target.value })}
            className={input}
          />
        </div>
        <input
          placeholder="URL foto (opsional)"
          value={form.photo_url}
          onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
          className={input}
        />
        <textarea
          placeholder="Deskripsi singkat (opsional)"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${input} resize-none`}
        />

        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

        <p className="text-xs text-foreground/45">
          {user ? `Dikontribusikan sebagai ${user.email}` : "Dikontribusikan sebagai tamu"}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/25 transition active:scale-[0.99] disabled:opacity-60"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {busy ? "Menyimpan…" : "Simpan Tempat"}
        </button>
      </form>
    </div>
  );
}
