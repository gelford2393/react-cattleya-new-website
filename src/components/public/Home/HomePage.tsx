import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { PublicContactUsPanel } from "@/components/public/shared";
import { Text } from "@/components/ui/text";
import { HomeContentPanel } from "./HomeContentPanel";
import { HomeHero } from "./HomeHero";
import type { HomeMenu } from "./home.types";
import { getMenuFromHash } from "./home.utils";
import { useHomePageData } from "./useHomePageData";
import { useGetPoolById } from "@/hooks/useGetPoolById";

type HomePageProps = {
  selectedPoolId?: string;
};

export function HomePage({ selectedPoolId }: HomePageProps) {
  const contactPanelRef = useRef<HTMLDivElement | null>(null);
  const { data: selectedPoolData, isLoading: isSelectedPoolLoading } = useGetPoolById(selectedPoolId);
  const [activeMenu, setActiveMenu] = useState<HomeMenu>(() =>
    getMenuFromHash(typeof window !== "undefined" ? window.location.hash : ""),
  );
  const [contentPanelHeight, setContentPanelHeight] = useState<number | null>(null);
  const {
    resortName,
    heroBackground,
    siteIconUrl,
    websiteSubtitle,
    homeWelcomeTitle,
    homeWelcomeDescription,
    contactHtml,
    reservationHtml,
    locationMapHtml,
    noteHtml,
    hasReservationContent,
    hasLocationMapContent,
    hasNoteContent,
    poolRows,
    carouselSlides,
  } = useHomePageData();

  useEffect(() => {
    if (selectedPoolId) return;

    const syncFromHash = () => {
      setActiveMenu(getMenuFromHash(window.location.hash));
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [selectedPoolId]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isActiveCarouselImageLoaded, setIsActiveCarouselImageLoaded] = useState(false);

  useEffect(() => {
    if (carouselSlides.length <= 1 || !isActiveCarouselImageLoaded) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setIsActiveCarouselImageLoaded(false);
      setActiveSlideIndex((current) => (current + 1) % carouselSlides.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [carouselSlides.length, isActiveCarouselImageLoaded]);

  useEffect(() => {
    const contactPanelElement = contactPanelRef.current;

    if (!contactPanelElement || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      setContentPanelHeight(contactPanelElement.getBoundingClientRect().height);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(contactPanelElement);
    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [contactHtml]);

  const normalizedSlideIndex = useMemo(
    () => (carouselSlides.length > 0 ? activeSlideIndex % carouselSlides.length : 0),
    [activeSlideIndex, carouselSlides.length],
  );

  const goToPrevSlide = useCallback(() => {
    if (carouselSlides.length <= 1) return;
    setIsActiveCarouselImageLoaded(false);
    setActiveSlideIndex((current) =>
      current === 0 ? carouselSlides.length - 1 : current - 1,
    );
  }, [carouselSlides.length]);

  const goToNextSlide = useCallback(() => {
    if (carouselSlides.length <= 1) return;
    setIsActiveCarouselImageLoaded(false);
    setActiveSlideIndex((current) => (current + 1) % carouselSlides.length);
  }, [carouselSlides.length]);

  const handleSelectSlide = useCallback((index: number) => {
    setIsActiveCarouselImageLoaded(false);
    setActiveSlideIndex(index);
  }, []);

  const selectedPool = useMemo(
    () =>
      selectedPoolId
        ? selectedPoolData ?? poolRows.find((pool) => pool.id === selectedPoolId) ?? null
        : null,
    [poolRows, selectedPoolData, selectedPoolId],
  );

  const resolvedActiveMenu: HomeMenu = useMemo(
    () => (selectedPoolId ? "pool-details" : activeMenu),
    [activeMenu, selectedPoolId],
  );

  if (selectedPoolId && !isSelectedPoolLoading && !selectedPool) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#383838] text-white [font-family:'Trebuchet_MS','Gill_Sans',sans-serif]">
      <HomeHero
        resortName={resortName}
        websiteSubtitle={websiteSubtitle}
        heroBackground={heroBackground}
        siteIconUrl={siteIconUrl}
        navHrefPrefix={selectedPoolId ? "/" : ""}
      />

      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div id="pools" className="h-0 scroll-mt-24" />
        <div id="reservation" className="h-0 scroll-mt-24" />
        <div id="location-map" className="h-0 scroll-mt-24" />

        <div className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
          <div ref={contactPanelRef} className="order-2 md:order-1">
            <PublicContactUsPanel contentHtml={contactHtml} />
          </div>

          <HomeContentPanel
            activeMenu={resolvedActiveMenu}
            poolRows={poolRows}
            reservationHtml={reservationHtml}
            locationMapHtml={locationMapHtml}
            noteHtml={noteHtml}
            hasReservationContent={hasReservationContent}
            hasLocationMapContent={hasLocationMapContent}
            hasNoteContent={hasNoteContent}
            homeWelcomeTitle={homeWelcomeTitle}
            homeWelcomeDescription={homeWelcomeDescription}
            carouselSlides={carouselSlides}
            activeSlideIndex={normalizedSlideIndex}
            contentHeight={contentPanelHeight}
            selectedPool={selectedPool}
            onPrevSlide={goToPrevSlide}
            onNextSlide={goToNextSlide}
            onSelectSlide={handleSelectSlide}
            onActiveImageLoadStateChange={setIsActiveCarouselImageLoaded}
          />
        </div>
      </section>

      <footer className="border-t border-[#a4d473]/35 bg-[#509b48] px-4 py-8 text-center text-sm text-white/95 md:px-8">
        <Text as="p" className="text-lg font-bold tracking-wide">
          {resortName}
        </Text>
        <Text as="p" className="mt-1 text-xs text-white/85">
          Copyright 2024 {resortName}. All rights reserved.
        </Text>
      </footer>
    </div>
  );
}
