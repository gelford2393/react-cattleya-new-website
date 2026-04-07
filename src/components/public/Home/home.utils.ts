import type { HomeMenu, HomeNavItem } from "./home.types";

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  { href: "#home", label: "Home" },
  { href: "#pools", label: "Pools & Rates" },
  { href: "#reservation", label: "Reservation" },
  { href: "#location-map", label: "Location Map" },
];

export function formatCurrency(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getMenuFromHash(hash: string): HomeMenu {
  const cleaned = hash.replace("#", "");

  if (cleaned === "home") return "home";
  if (cleaned === "pools") return "pools";
  if (cleaned === "reservation") return "reservation";
  if (cleaned === "location-map") return "location-map";

  return "home";
}

export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}