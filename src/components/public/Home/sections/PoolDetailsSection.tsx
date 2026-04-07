import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { PoolSummary } from "../home.types";
import { formatCurrency } from "../home.utils";

type PoolDetailsSectionProps = {
  selectedPool: PoolSummary;
  poolRows: PoolSummary[];
};

type PoolDetailsCarouselProps = {
  poolId: string;
  poolLabel: string;
  fallbackImage: string;
  slides: Array<{ id: string; image: string }>;
};

function PoolDetailsCarousel({ poolId, poolLabel, fallbackImage, slides }: PoolDetailsCarouselProps) {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loadedImageUrls, setLoadedImageUrls] = useState<Record<string, boolean>>({});
  const activeSlide = slides[activeSlideIndex] ?? null;
  const activeImageUrl = activeSlide?.image ?? fallbackImage;
  const isActiveImageLoaded = Boolean(loadedImageUrls[activeImageUrl]);

  const handleImageLoaded = (imageUrl: string) => {
    setLoadedImageUrls((current) => ({
      ...current,
      [imageUrl]: true,
    }));
  };

  useEffect(() => {
    if (slides.length <= 1 || !isActiveImageLoaded) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlideIndex((current) => (current + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [isActiveImageLoaded, slides.length]);

  const goToPrevSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlideIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  };

  const goToNextSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlideIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div key={poolId} className="overflow-hidden rounded-lg border border-[#a4d473]/25 bg-black/30">
      {activeSlide ? (
        <div className="relative">
          {!isActiveImageLoaded ? (
            <Skeleton className="absolute inset-0 h-[220px] w-full md:h-[360px]" />
          ) : null}
          <img
            src={activeSlide.image}
            alt={poolLabel}
            onLoad={() => handleImageLoaded(activeSlide.image)}
            onError={() => handleImageLoaded(activeSlide.image)}
            className={cn(
              "h-[220px] w-full object-cover transition-opacity duration-200 md:h-[360px]",
              isActiveImageLoaded ? "opacity-100" : "opacity-0",
            )}
          />

          {slides.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPrevSlide}
                aria-label="Previous pool image"
                className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 p-2 text-white/90 transition hover:bg-black/65"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={goToNextSlide}
                aria-label="Next pool image"
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/45 p-2 text-white/90 transition hover:bg-black/65"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="relative">
          {!isActiveImageLoaded ? (
            <Skeleton className="absolute inset-0 h-[220px] w-full md:h-[360px]" />
          ) : null}
          <img
            src={fallbackImage}
            alt={poolLabel}
            onLoad={() => handleImageLoaded(fallbackImage)}
            onError={() => handleImageLoaded(fallbackImage)}
            className={cn(
              "h-[220px] w-full object-cover transition-opacity duration-200 md:h-[360px]",
              isActiveImageLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      )}

      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveSlideIndex(index)}
              aria-label={`Go to pool image ${index + 1}`}
              className={
                index === activeSlideIndex
                  ? "h-2 w-8 rounded-full bg-[#a4d473] transition"
                  : "h-2 w-2 rounded-full bg-white/45 transition hover:bg-white/70"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PoolDetailsSection({ selectedPool, poolRows }: PoolDetailsSectionProps) {
  const selectedPoolRates = selectedPool.rates ?? {};
  const selectedPoolAmenities = Array.isArray(selectedPool.amenities)
    ? selectedPool.amenities.filter(
        (item: string | null | undefined): item is string => Boolean(item?.trim()),
      )
    : [];
  const selectedPoolGallery = Array.isArray(selectedPool.gallery)
    ? selectedPool.gallery.filter(
        (item: string | null | undefined): item is string => Boolean(item?.trim()),
      )
    : [];
  const selectedPoolImage =
    selectedPool.cover_image_url?.trim() ||
    selectedPoolGallery[0] ||
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80";
  const selectedPoolNotesHtml = selectedPool.notes ?? "";
  const hasSelectedPoolNotes = Boolean(selectedPoolNotesHtml.trim());

  const selectedPoolSlides = Array.from(
    new Map(
      [selectedPool.cover_image_url?.trim(), ...selectedPoolGallery]
        .filter((image): image is string => Boolean(image?.trim()))
        .map((image, index) => [image, `${selectedPool.id}-${index}`]),
    ).entries(),
  ).map(([image, id]) => ({ id, image }));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold sm:text-2xl">{`Pool ${selectedPool.pool_number} - ${selectedPool.name}`}</h2>
        <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
          <Link to="/#pools">Back to Pools & Rates</Link>
        </Button>
      </div>

      <PoolDetailsCarousel
        key={selectedPool.id}
        poolId={selectedPool.id}
        poolLabel={`Pool ${selectedPool.pool_number} - ${selectedPool.name}`}
        fallbackImage={selectedPoolImage}
        slides={selectedPoolSlides}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white">Amenities</h3>
          {selectedPoolAmenities.length > 0 ? (
            <ul className="mt-3 list-disc pl-5 text-sm leading-7 text-white/90">
              {selectedPoolAmenities.map((amenity: string, index: number) => (
                <li key={`${amenity}-${index}`}>{amenity}</li>
              ))}
            </ul>
          ) : (
            <Text as="p" className="mt-3 text-sm text-white/75">
              Amenities will be posted soon.
            </Text>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="text-lg font-semibold text-white">Rental Rates</h3>
          <div className="mt-3 text-sm leading-8 text-white/90">
            <Text as="p">
              Day Rate (9am-5pm, 8 hrs): <strong>{formatCurrency(selectedPoolRates.day)}</strong>
            </Text>
            <Text as="p">
              Night Rate (7pm-7am, 12 hrs): <strong>{formatCurrency(selectedPoolRates.night)}</strong>
            </Text>
            <Text as="p">
              Capacity: <strong>{selectedPool.capacity ?? "N/A"}</strong>
            </Text>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white">Notes</h3>
        {hasSelectedPoolNotes ? (
          <div
            className="mt-3 text-sm leading-7 text-white/90 [&_a]:font-semibold [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: selectedPoolNotesHtml }}
          />
        ) : (
          <Text as="p" className="mt-3 text-sm text-white/75">
            Notes will be posted soon.
          </Text>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#a4d473]">Other Pools</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {poolRows.map((pool) => {
            const isCurrent = pool.id === selectedPool.id;

            return (
              <Link
                key={pool.id}
                to={`/pools/${pool.id}`}
                className={`rounded border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  isCurrent
                    ? "border-[#a4d473] bg-[#a4d473]/20 text-[#f8efe8]"
                    : "border-white/20 text-white/85 hover:border-[#a4d473]/70 hover:text-[#feb234]"
                }`}
              >
                {`Pool ${pool.pool_number}`}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
