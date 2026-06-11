import {
  Coffee,
  Utensils,
  Printer,
  Home,
  CircleParking,
  CreditCard,
  Building2,
  MapPin,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const ICONS: Record<string, ComponentType<LucideProps>> = {
  coffee: Coffee,
  utensils: Utensils,
  printer: Printer,
  home: Home,
  parking: CircleParking,
  "credit-card": CreditCard,
  building: Building2,
};

export function CategoryIcon({
  name,
  ...props
}: Omit<LucideProps, "name"> & { name?: string | null }) {
  const Icon = (name && ICONS[name]) || MapPin;
  return <Icon {...props} />;
}
