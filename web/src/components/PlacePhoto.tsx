import { CategoryIcon } from "./CategoryIcon";

/**
 * Foto tempat. Bila ada photo_url → tampilkan gambar.
 * Bila tidak (data OSM umumnya tanpa foto) → placeholder kategori (gradient + ikon),
 * jujur tanpa gambar palsu.
 */
export function PlacePhoto({
  photoUrl,
  icon,
  className = "",
  iconSize = 26,
}: {
  photoUrl?: string | null;
  icon?: string | null;
  className?: string;
  iconSize?: number;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" loading="lazy" className={`${className} object-cover`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white/90`}
      aria-hidden
    >
      <CategoryIcon name={icon} size={iconSize} />
    </div>
  );
}
