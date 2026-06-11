"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { apiGet, apiSend, qs } from "@/lib/client-api";
import { useAuth } from "@/components/AuthProvider";
import { useGeolocation } from "@/lib/useGeolocation";
import { useRealtime } from "@/lib/useRealtime";
import { getDeviceId } from "@/lib/device";
import type { PlaceDetail, Review } from "@/lib/types";
import { formatDistance } from "@/lib/haversine";
import { RouteButton } from "@/components/RouteButton";
import { StarRating } from "@/components/StarRating";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PlacePhoto } from "@/components/PlacePhoto";
import { LoadingState, ErrorState } from "@/components/States";
import { ArrowLeft, Clock, Heart, MapPin, Wallet, Send, Star } from "lucide-react";

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { requireAuth } = useAuth();
  const geo = useGeolocation(true);
  const loc = geo.status === "granted" ? { lat: geo.lat!, lng: geo.lng! } : null;

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlace(await apiGet<PlaceDetail>(`/api/places/${id}` + qs({ lat: loc?.lat, lng: loc?.lng })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat detail");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loc?.lat, loc?.lng]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const uid = getDeviceId();
    apiGet<{ favorited: boolean }>(`/api/favorites` + qs({ user_id: uid, place_id: id }))
      .then((r) => setFav(r.favorited))
      .catch(() => {});
  }, [id]);

  useRealtime(
    (c) => {
      if (c.table === "reviews" && (c.new?.place_id === Number(id) || c.old?.place_id === Number(id)))
        load();
    },
    ["reviews"],
  );

  const toggleFav = async () => {
    const uid = getDeviceId();
    const next = !fav;
    setFav(next);
    try {
      if (next) await apiSend(`/api/favorites`, "POST", { user_id: uid, place_id: Number(id) });
      else await apiSend(`/api/favorites` + qs({ user_id: uid, place_id: id }), "DELETE");
    } catch {
      setFav(!next); // revert
    }
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    // Menulis ulasan butuh akun → buka modal login bila perlu, lalu lanjut otomatis.
    requireAuth((u) => doSubmitReview(u), "Masuk untuk menulis ulasan.");
  };

  const doSubmitReview = async (u: User) => {
    setSubmitting(true);
    try {
      const author = ((u.user_metadata?.full_name as string) || u.email || "Pengguna").slice(0, 64);
      await apiSend<Review>(`/api/places/${id}/reviews`, "POST", {
        user_id: author,
        rating: myRating,
        comment: comment.trim() || null,
      });
      setComment("");
      setMyRating(5);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal mengirim ulasan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Memuat detail…" />;
  if (error || !place)
    return (
      <div className="p-4">
        <ErrorState message={error ?? "Tempat tidak ditemukan"} onRetry={load} />
      </div>
    );

  return (
    <div className="pb-28">
      {/* Foto + tombol */}
      <div className="relative">
        <PlacePhoto
          photoUrl={place.photo_url}
          icon={place.category_icon}
          className="h-56 w-full"
          iconSize={64}
        />
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={toggleFav}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur active:scale-95"
          aria-label="Favorit"
        >
          <Heart size={19} className={fav ? "fill-red-500 stroke-red-500" : ""} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold leading-tight">{place.name}</h1>
            {place.rating != null && <StarRating value={place.rating} size={16} />}
          </div>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CategoryIcon name={place.category_icon} size={13} /> {place.category}
          </p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-foreground/5 px-2 py-2.5">
            <MapPin size={16} className="mx-auto mb-1 text-emerald-600" />
            <span className="font-medium">{formatDistance(place.distance_m) || "—"}</span>
            <p className="text-[10px] text-foreground/50">Jarak</p>
          </div>
          <div className="rounded-xl bg-foreground/5 px-2 py-2.5">
            <Clock size={16} className="mx-auto mb-1 text-emerald-600" />
            <span className="font-medium">{place.open_hours ?? "—"}</span>
            <p className="text-[10px] text-foreground/50">Jam buka</p>
          </div>
          <div className="rounded-xl bg-foreground/5 px-2 py-2.5">
            <Wallet size={16} className="mx-auto mb-1 text-emerald-600" />
            <span className="font-medium">
              {place.price_range && place.price_range !== "-" ? place.price_range : "—"}
            </span>
            <p className="text-[10px] text-foreground/50">Harga</p>
          </div>
        </div>

        {place.address && (
          <p className="text-sm text-foreground/70">
            <span className="font-medium text-foreground">Alamat: </span>
            {place.address}
          </p>
        )}
        {place.description && (
          <p className="text-sm leading-relaxed text-foreground/70">{place.description}</p>
        )}

        <RouteButton placeId={place.id} className="w-full" />

        {/* Ulasan */}
        <div className="border-t border-black/5 pt-4">
          <h2 className="mb-2 font-semibold">Ulasan ({place.reviews.length})</h2>

          <form onSubmit={submitReview} className="mb-3 rounded-xl bg-foreground/5 p-3">
            <div className="mb-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setMyRating(n)} aria-label={`${n} bintang`}>
                  <Star
                    size={22}
                    className={
                      n <= myRating ? "fill-amber-400 stroke-amber-500" : "stroke-foreground/30"
                    }
                  />
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tulis ulasan singkat…"
                rows={2}
                className="w-full resize-none rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white disabled:opacity-50"
              >
                <Send size={15} /> Kirim
              </button>
            </div>
          </form>

          <div className="space-y-2.5">
            {place.reviews.length === 0 && (
              <p className="text-sm text-foreground/50">Belum ada ulasan. Jadilah yang pertama!</p>
            )}
            {place.reviews.map((r) => (
              <div key={r.id} className="rounded-xl bg-white p-3 ring-1 ring-black/5 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                  <StarRating value={r.rating} size={12} />
                  <span className="text-[11px] text-foreground/40">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-foreground/75">{r.comment}</p>}
                <p className="mt-0.5 text-[11px] text-foreground/40">— {r.user_id}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
