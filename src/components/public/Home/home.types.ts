export type PoolRate = {
  day?: number;
  night?: number;
};

export type PoolSummary = {
  id: string;
  pool_number: number | string;
  name: string;
  capacity?: number | null;
  rates?: PoolRate | null;
  cover_image_url?: string | null;
  amenities?: string[] | null;
  gallery?: string[] | null;
  notes?: string | null;
};

export type CarouselSlide = {
  id: string;
  name: string;
  poolNumber: number | string;
  coverImageUrl: string;
};

export type HomeMenu = "home" | "pools" | "reservation" | "location-map" | "pool-details";

export type HomeNavItem = {
  href: string;
  label: string;
};