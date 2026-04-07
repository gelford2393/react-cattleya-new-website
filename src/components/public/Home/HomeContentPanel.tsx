import type { CSSProperties } from "react";
import type { HomeMenu, PoolSummary } from "./home.types";
import type { CarouselSlide } from "./home.types";
import { HomeSection } from "./sections/HomeSection";
import { PoolsSection } from "./sections/PoolsSection";
import { ReservationSection } from "./sections/ReservationSection";
import { LocationMapSection } from "./sections/LocationMapSection";
import { PoolDetailsSection } from "./sections/PoolDetailsSection";

type HomeContentPanelProps = {
  activeMenu: HomeMenu;
  poolRows: PoolSummary[];
  reservationHtml: string;
  locationMapHtml: string;
  noteHtml: string;
  hasReservationContent: boolean;
  hasLocationMapContent: boolean;
  hasNoteContent: boolean;
  homeWelcomeTitle: string;
  homeWelcomeDescription: string;
  carouselSlides: CarouselSlide[];
  activeSlideIndex: number;
  contentHeight: number | null;
  selectedPool?: PoolSummary | null;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSelectSlide: (index: number) => void;
  onActiveImageLoadStateChange?: (isLoaded: boolean) => void;
};

export function HomeContentPanel({
  activeMenu,
  poolRows,
  reservationHtml,
  locationMapHtml,
  noteHtml,
  hasReservationContent,
  hasLocationMapContent,
  hasNoteContent,
  homeWelcomeTitle,
  homeWelcomeDescription,
  carouselSlides,
  activeSlideIndex,
  contentHeight,
  selectedPool,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
  onActiveImageLoadStateChange,
}: HomeContentPanelProps) {
  const panelStyle =
    contentHeight && Number.isFinite(contentHeight)
      ? ({
          "--content-panel-height": `${contentHeight}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div
      className="order-1 max-h-[calc(100dvh-7.5rem)] overflow-y-auto rounded-xl border border-[#a4d473]/25 bg-[#383838] p-4 shadow-xl [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#509b48_#383838] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#383838] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#509b48]/85 [&::-webkit-scrollbar-thumb:hover]:bg-[#a4d473] md:order-2 md:max-h-none md:min-h-0 md:p-5 md:[height:var(--content-panel-height)]"
      style={panelStyle}
    >
      {activeMenu === "home" ? (
        <HomeSection
          homeWelcomeTitle={homeWelcomeTitle}
          homeWelcomeDescription={homeWelcomeDescription}
          carouselSlides={carouselSlides}
          activeSlideIndex={activeSlideIndex}
          onPrevSlide={onPrevSlide}
          onNextSlide={onNextSlide}
          onSelectSlide={onSelectSlide}
          onActiveImageLoadStateChange={onActiveImageLoadStateChange}
        />
      ) : null}

      {activeMenu === "pools" ? (
        <PoolsSection poolRows={poolRows} noteHtml={noteHtml} hasNoteContent={hasNoteContent} />
      ) : null}

      {activeMenu === "reservation" ? (
        <ReservationSection
          reservationHtml={reservationHtml}
          hasReservationContent={hasReservationContent}
        />
      ) : null}

      {activeMenu === "location-map" ? (
        <LocationMapSection
          locationMapHtml={locationMapHtml}
          hasLocationMapContent={hasLocationMapContent}
        />
      ) : null}

      {activeMenu === "pool-details" && selectedPool ? (
        <PoolDetailsSection selectedPool={selectedPool} poolRows={poolRows} />
      ) : null}
    </div>
  );
}