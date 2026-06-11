// Tipe data bersama (selaras dengan kontrak API di dokumen SRS/SDD).

export type Category = {
  id: number;
  name: string;
  icon: string | null;
  created_at?: string;
};

export type Place = {
  id: number;
  category_id: number;
  category: string | null; // nama kategori (hasil join)
  category_icon?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  open_hours: string | null;
  price_range: string | null;
  rating: number | null;
  photo_url: string | null;
  distance_m?: number | null; // diisi saat sort=distance / ada lokasi user
  created_at?: string;
  updated_at?: string;
};

export type Review = {
  id: number;
  place_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type PlaceDetail = Place & { reviews: Review[] };

// Bentuk respons API standar.
export type ApiSuccess<T> = { status: "success"; data: T };
export type ApiError = { status: "error"; code: number; message: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
