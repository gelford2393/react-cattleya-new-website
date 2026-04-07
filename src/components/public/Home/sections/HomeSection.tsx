import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { PoolCarousel } from "../PoolCarousel";
import type { CarouselSlide } from "../home.types";

type HomeSectionProps = {
  homeWelcomeTitle: string;
  homeWelcomeDescription: string;
  carouselSlides: CarouselSlide[];
  activeSlideIndex: number;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSelectSlide: (index: number) => void;
  onActiveImageLoadStateChange?: (isLoaded: boolean) => void;
};

export function HomeSection({
  homeWelcomeTitle,
  homeWelcomeDescription,
  carouselSlides,
  activeSlideIndex,
  onPrevSlide,
  onNextSlide,
  onSelectSlide,
  onActiveImageLoadStateChange,
}: HomeSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_minmax(0,1fr)] md:items-stretch">
      <div className="h-full">
        <PoolCarousel
          slides={carouselSlides}
          activeSlideIndex={activeSlideIndex}
          onPrev={onPrevSlide}
          onNext={onNextSlide}
          onSelect={onSelectSlide}
          onActiveImageLoadStateChange={onActiveImageLoadStateChange}
        />
      </div>

      <div className="flex h-full flex-col justify-center gap-6 px-1 py-2 md:px-2">
        <h2 className="text-3xl font-extrabold leading-tight text-white">{homeWelcomeTitle}</h2>
        <Text as="p" className="mt-4 text-base leading-8 text-white/90">
          {homeWelcomeDescription}
        </Text>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="bg-[#509b48] text-white hover:bg-[#a4d473] hover:text-[#383838]">
            <a href="#pools">View Our Pools</a>
          </Button>
          <Button asChild className="bg-[#509b48] text-white hover:bg-[#a4d473] hover:text-[#383838]">
            <a href="#reservation">How to make a reservation</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
