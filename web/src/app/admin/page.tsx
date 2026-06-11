"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiGet, apiSend } from "@/lib/client-api";
import { useGeolocation } from "@/lib/useGeolocation";
import { useRealtime } from "@/lib/useRealtime";
import type { Category, Place } from "@/lib/types";
import { LoadingState, ErrorState } from "@/components/States";
import { KeyRound, Plus, Pencil, Trash2, Save, X, Crosshair } from "lucide-react";

type FormState = {
  id?: number;
  name: string;
  category_id: number | "";
  latitude: string;
  longitude: string;
  address: string;
  open_hours: string;
  price_range: string;
  description: string;
  photo_url: string;
};

const EMPTY: FormState = {
  name: "",
  category_id: "",
  latitude: "",
  longitude: "",
  address: "",
  open_hours: "",
  price_range: "",
  description: "",
  photo_url: "",
};

export default function AdminPage() {
  const geo = useGeolocation(false);
  const [apiKey, setApiKey] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem("amd_api_key") ?? "");
  }, []);

  const saveKey = (v: string) => {
    setApiKey(v);
    localStorage.setItem("amd_api_key", v);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, pls] = await Promise.all([
        apiGet<Category[]>("/api/categories"),
        apiGet<Place[]>("/api/places"),
      ]);
      setCategories(cats);
      setPlaces(pls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(() => load(), ["places"]);

  const startCreate = () => {
    setForm(EMPTY);
    setShowForm(true);
    setMsg(null);
  };

  const startEdit = (p: Place) => {
    setForm({
      id: p.id,
      name: p.name,
      category_id: p.category_id,
      latitude: String(p.latitude),
      longitude: String(p.longitude),
      address: p.address ?? "",
      open_hours: p.open_hours ?? "",
      price_range: p.price_range ?? "",
      description: p.description ?? "",
      photo_url: p.photo_url ?? "",
    });
    setShowForm(true);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const useMyLocation = () => {
    geo.request();
  };
  useEffect(() => {
    if (geo.status === "granted" && geo.lat != null && geo.lng != null && showForm) {
      setForm((f) => ({ ...f, latitude: geo.lat!.toFixed(6), longitude: geo.lng!.toFixed(6) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.lat, geo.lng]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      setMsg("Masukkan API Key dulu.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const body = {
      name: form.name,
      category_id: Number(form.category_id),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      address: form.address,
      open_hours: form.open_hours,
      price_range: form.price_range,
      description: form.description,
      photo_url: form.photo_url,
    };
    try {
      if (form.id) await apiSend(`/api/places/${form.id}`, "PUT", body, apiKey);
      else await apiSend(`/api/places`, "POST", body, apiKey);
      setMsg(form.id ? "Tersimpan ✓" : "Ditambahkan ✓");
      setShowForm(false);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: Place) => {
    if (!apiKey) {
      setMsg("Masukkan API Key dulu.");
      return;
    }
    if (!confirm(`Hapus "${p.name}"?`)) return;
    try {
      await apiSend(`/api/places/${p.id}`, "DELETE", undefined, apiKey);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal menghapus");
    }
  };

  const input =
    "w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500";

  return (
    <div className="pb-28">
      <header className="bg-gradient-to-br from-neutral-800 to-neutral-900 px-4 pb-4 pt-6 text-white">
        <h1 className="text-xl font-bold">Admin · Data Tempat</h1>
        <p className="text-sm text-neutral-300">Tambah, ubah, hapus tempat (perlu API Key).</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
          <KeyRound size={16} className="text-neutral-300" />
          <input
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            type="password"
            placeholder="X-API-Key"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-400"
          />
        </div>
      </header>

      <div className="p-4">
        {msg && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {msg}
          </p>
        )}

        {!showForm && (
          <button
            onClick={startCreate}
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Tambah Tempat
          </button>
        )}

        {showForm && (
          <form onSubmit={submit} className="mb-5 space-y-2.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{form.id ? "Edit Tempat" : "Tempat Baru"}</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Tutup">
                <X size={18} className="text-foreground/50" />
              </button>
            </div>

            <input
              required
              placeholder="Nama tempat *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={input}
            />
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className={input}
            >
              <option value="">Pilih kategori *</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                required
                placeholder="Latitude *"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className={input}
                inputMode="decimal"
              />
              <input
                required
                placeholder="Longitude *"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className={input}
                inputMode="decimal"
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
            >
              <Crosshair size={13} /> Pakai lokasi saya
            </button>
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
              placeholder="URL foto"
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              className={input}
            />
            <textarea
              placeholder="Deskripsi"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${input} resize-none`}
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={16} /> {busy ? "Menyimpan…" : "Simpan"}
            </button>
          </form>
        )}

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <ul className="space-y-2">
            {places.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-black/5 dark:bg-neutral-900"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-foreground/50">
                    {p.category} · {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50"
                  aria-label="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => remove(p)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  aria-label="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
