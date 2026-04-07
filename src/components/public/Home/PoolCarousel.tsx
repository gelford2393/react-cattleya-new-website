import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { CarouselSlide } from "./home.types";

type PoolCarouselProps = {
  slides: CarouselSlide[];
  activeSlideIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  onActiveImageLoadStateChange?: (isLoaded: boolean) => void;
};

export function PoolCarousel({
  slides,
  activeSlideIndex,
  onPrev,
  onNext,
  onSelect,
  onActiveImageLoadStateChange,
}: PoolCarouselProps) {
  const [loadedImageUrls, setLoadedImageUrls] = useState<Record<string, boolean>>({});
  const activeSlide = slides[activeSlideIndex];
  const activeImageUrl = activeSlide?.coverImageUrl ?? "";
  const isActiveImageLoaded = Boolean(loadedImageUrls[activeImageUrl]);

  useEffect(() => {
    onActiveImageLoadStateChange?.(isActiveImageLoaded);
  }, [isActiveImageLoaded, onActiveImageLoadStateChange]);

  const handleImageLoaded = (imageUrl: string) => {
    setLoadedImageUrls((current) => ({
      ...current,
      [imageUrl]: true,
    }));
  };

  if (!activeSlide) {
    return (
      <Text as="p" className="mt-3 text-sm text-white/80">
        Pool cover images will be posted soon.
      </Text>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/20 bg-black/35 shadow-2xl backdrop-blur-sm">
      <div className="relative">
        {!isActiveImageLoaded ? (
          <Skeleton className="absolute inset-0 h-56 w-full sm:h-72 md:h-80" />
        ) : null}
        <img
          src={activeSlide.coverImageUrl}
          alt={`Pool ${activeSlide.poolNumber} cover`}
          onLoad={() => handleImageLoaded(activeSlide.coverImageUrl)}
          onError={() => handleImageLoaded(activeSlide.coverImageUrl)}
          className={cn(
            "h-56 w-full object-cover transition-opacity duration-200 sm:h-72 md:h-80",
            isActiveImageLoaded ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 py-4 text-left sm:px-5">
          <Text as="p" className="text-[11px] uppercase tracking-widest text-[#a4d473]">
            Featured Pool
          </Text>
          <Text as="p" className="mt-1 text-base font-semibold text-white sm:text-lg">
            Pool {activeSlide.poolNumber}: {activeSlide.name}
          </Text>
        </div>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous pool image"
              className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 p-2 text-white/90 transition hover:bg-black/65"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next pool image"
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 p-2 text-white/90 transition hover:bg-black/65"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Go to pool ${slide.poolNumber} cover`}
              className={`h-2 rounded-full transition ${
                index === activeSlideIndex
                  ? "w-8 bg-[#a4d473]"
                  : "w-2 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}