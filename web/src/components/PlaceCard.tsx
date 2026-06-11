import Link from "next/link";
import type { Place } from "@/lib/types";
import { formatDistance } from "@/lib/haversine";
import { CategoryIcon } from "./CategoryIcon";
import { StarRating } from "./StarRating";
import { RouteButton } from "./RouteButton";
import { Clock, MapPin } from "lucide-react";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      <Link href={`/place/${place.id}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={place.photo_url ?? `https://picsum.photos/seed/amd${place.id}/200/200`}
          alt={place.name}
          className="h-20 w-20 rounded-xl object-cover"
          loading="lazy"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/place/${place.id}`} className="block">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold leading-tight">{place.name}</h3>
            {place.rating != null && <StarRating value={place.rating} size={13} />}
          </div>

          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700">
            <CategoryIcon name={place.category_icon} size={12} />
            {place.category ?? "Tempat"}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground/60">
            {place.distance_m != null && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <MapPin size={12} /> {formatDistance(place.distance_m)}
              </span>
            )}
            {place.open_hours && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {place.open_hours}
              </span>
            )}
            {place.price_range && place.price_range !== "-" && <span>{place.price_range}</span>}
          </div>
        </Link>

        <div className="mt-2">
          <RouteButton placeId={place.id} variant="ghost" />
        </div>
      </div>
    </div>
  );
}
