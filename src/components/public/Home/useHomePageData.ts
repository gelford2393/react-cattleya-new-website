import { useMemo } from "react";
import { useGetPools } from "@/hooks/useGetPools";
import { useContactUsPageQuery } from "@/hooks/useContactUsEditor";
import { useLocationMapPageQuery } from "@/hooks/useLocationMapEditor";
import { useReservationPageQuery } from "@/hooks/useReservationEditor";
import { useNotePageQuery } from "@/hooks/useNoteEditor";
import {
  parseWebsiteSettingsContent,
  useWebsiteSettingsPageQuery,
} from "@/hooks/useWebsiteSettings";
import type { CarouselSlide, PoolSummary } from "./home.types";

const FALLBACK_WEBSITE_SUBTITLE =
  "Clean, Exclusive, Private and Affordable Pools and Villas for Rent";

export function useHomePageData() {
  const { data: pools, isLoading: isPoolsLoading, isError: isPoolsError } = useGetPools();
  const { data: settingsPage, isLoading: isSettingsLoading, isError: isSettingsError } = useWebsiteSettingsPageQuery();
  const { data: contactPage, isLoading: isContactLoading, isError: isContactError } = useContactUsPageQuery();
  const { data: reservationPage, isLoading: isReservationLoading, isError: isReservationError } = useReservationPageQuery();
  const { data: locationMapPage, isLoading: isLocationMapLoading, isError: isLocationMapError } = useLocationMapPageQuery();
  const { data: notePage, isLoading: isNoteLoading, isError: isNoteError } = useNotePageQuery();

  const websiteSettings = parseWebsiteSettingsContent(settingsPage?.content);
  const resortName = websiteSettings.siteName?.trim() || "Cattleya Resort";
  const heroBackground = websiteSettings.homeBackgroundUrl?.trim() || "";
  const websiteSubtitle =
    websiteSettings.websiteSubtitle?.trim() || FALLBACK_WEBSITE_SUBTITLE;
  const homeWelcomeTitle =
    websiteSettings.homeWelcomeTitle?.trim() ||
    "Welcome to the hottest way to cool down in Antipolo!";
  const homeWelcomeDescription =
    websiteSettings.homeWelcomeDescription?.trim() ||
    "Just 30 minutes from Metro Manila, in the hills of Antipolo, Cattleya Resort is an exciting venue for families, friends and companies. It is perfect for birthdays, homecomings, wedding receptions and team building activities. Enjoy an affordable exclusive resort.";
  const poolRows = useMemo(() => (pools ?? []) as PoolSummary[], [pools]);
  const carouselSlides = useMemo(
    () =>
      poolRows
        .filter((pool) => Boolean(pool.cover_image_url?.trim()))
        .map(
          (pool): CarouselSlide => ({
            id: pool.id,
            name: pool.name,
            poolNumber: pool.pool_number,
            coverImageUrl: pool.cover_image_url?.trim() ?? "",
          }),
        ),
    [poolRows],
  );

  // Determine if page is still loading critical data
  const isCriticalDataLoading = isPoolsLoading || isSettingsLoading;
  const hasCriticalDataError = isPoolsError || isSettingsError;

  return {
    resortName,
    heroBackground,
    websiteSubtitle,
    homeWelcomeTitle,
    homeWelcomeDescription,
    siteIconUrl: websiteSettings.siteIconUrl,
    contactHtml: contactPage?.content,
    reservationHtml: reservationPage?.content ?? "",
    locationMapHtml: locationMapPage?.content ?? "",
    noteHtml: notePage?.content ?? "",
    hasReservationContent: Boolean(reservationPage?.content?.trim()),
    hasLocationMapContent: Boolean(locationMapPage?.content?.trim()),
    hasNoteContent: Boolean(notePage?.content?.trim()),
    poolRows,
    carouselSlides,
    // Loading states
    isCriticalDataLoading,
    isPoolsLoading,
    isSettingsLoading,
    isContactLoading,
    isReservationLoading,
    isLocationMapLoading,
    isNoteLoading,
    // Error states
    hasCriticalDataError,
    isPoolsError,
    isSettingsError,
    isContactError,
    isReservationError,
    isLocationMapError,
    isNoteError,
  };
}