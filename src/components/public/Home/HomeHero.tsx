import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { DESIGN_TOKENS } from "@/lib/designTokens";
import { cn } from "@/lib/utils";
import { HOME_NAV_ITEMS } from "./home.utils";
import { useGetPools } from "@/hooks/useGetPools";

type HomeHeroProps = {
  resortName: string;
  websiteSubtitle: string;
  heroBackground: string;
  siteIconUrl?: string;
  navHrefPrefix?: string;
};

export function HomeHero({
  resortName,
  websiteSubtitle,
  heroBackground,
  siteIconUrl,
  navHrefPrefix = "",
}: HomeHeroProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobilePoolsExpanded, setIsMobilePoolsExpanded] = useState(false);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const { data: pools, isLoading: isPoolsLoading } = useGetPools();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const resolvedLogoUrl = siteIconUrl?.trim() || "";
  const hasLogoImage = Boolean(resolvedLogoUrl) && failedLogoUrl !== resolvedLogoUrl;
  const sortedPools = useMemo(
    () => [...(pools ?? [])].sort((a, b) => Number(a.pool_number) - Number(b.pool_number)),
    [pools],
  );
  const homeHref = `${navHrefPrefix}#home`;
  const handleMobilePoolsToggle = useCallback(() => {
    setIsMobilePoolsExpanded((current) => !current);
  }, []);
  const handleLogoError = useCallback(() => {
    setFailedLogoUrl(resolvedLogoUrl);
  }, [resolvedLogoUrl]);

  return (
    <section
      id="home"
      className="relative min-h-[52vh] overflow-hidden border-b border-white/10 md:min-h-[60vh]"
    >
      <div
        className="absolute inset-0 bg-[var(--app-public-surface)] bg-cover bg-center"
        style={heroBackground ? { backgroundImage: `url(${heroBackground})` } : undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-[var(--app-public-surface)]" />

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-all duration-300",
          isScrolled
            ? "border-b border-white/10 bg-black/35 shadow-md backdrop-blur-sm"
            : "border-b border-transparent bg-transparent shadow-none backdrop-blur-0",
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl animate-in fade-in slide-in-from-top-2 duration-700 items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
          <a
            href={homeHref}
            className={cn(
              "max-w-[68vw] items-center gap-2 rounded-md bg-[#f8efe8] px-2 py-1.5 text-[#383838] shadow-sm sm:max-w-none",
              isScrolled ? "flex" : "hidden md:flex",
            )}
            aria-label={`${resortName} home`}
          >
            {hasLogoImage ? (
              <img
                src={resolvedLogoUrl}
                alt={`${resortName} logo`}
                className="h-9 w-auto max-w-[7rem] object-contain sm:h-11 sm:max-w-[9rem]"
                onError={handleLogoError}
              />
            ) : (
              <Sparkles className="size-5" />
            )}
            <span className="sr-only">{resortName}</span>
          </a>

          <nav className="hidden items-center gap-5 text-xs font-semibold uppercase tracking-widest text-white/90 md:flex">
            {HOME_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={`${navHrefPrefix}${item.href}`}
                className={DESIGN_TOKENS.classes.publicAccentLink}
              >
                {item.label}
              </a>
            ))}
            <Link to="/admin" className="rounded bg-white/20 px-3 py-1 hover:bg-white/30">
              Admin
            </Link>
          </nav>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-white/60 bg-transparent text-white hover:bg-[var(--app-public-paper)] hover:text-[var(--app-public-surface)] md:hidden"
              >
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[90vw] border-l border-[var(--app-public-accent)]/40 bg-[var(--app-public-surface)] p-0 text-[var(--app-public-accent)] sm:max-w-sm"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              </SheetHeader>

              <nav className="h-full overflow-y-auto px-3 pb-6 pt-14 text-[1rem] leading-8">
                <div className="mb-4 rounded-md border border-[#a4d473]/45 bg-[#f8efe8]/10 px-3 py-2">
                  <a href={homeHref} className="flex items-center gap-2" aria-label={`${resortName} home`}>
                    {hasLogoImage ? (
                      <img
                        src={resolvedLogoUrl}
                        alt={`${resortName} logo`}
                        className="h-8 w-auto max-w-[6rem] object-contain"
                        onError={handleLogoError}
                      />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    <span className="sr-only">{resortName}</span>
                  </a>
                </div>

                <ul className="border-l border-[#a4d473]/45 pl-3">
                  {HOME_NAV_ITEMS.map((item) => {
                    const isPoolsItem = item.href === "#pools";

                    return (
                      <li key={item.href} className="relative">
                        <span className="absolute -left-3 top-4 h-px w-2 bg-[#a4d473]/55" aria-hidden="true" />

                        {isPoolsItem ? (
                          <div className="flex items-center justify-between gap-2">
                            <SheetClose asChild>
                              <a
                                href={`${navHrefPrefix}${item.href}`}
                                className="text-[#a4d473] transition-colors hover:text-[#feb234]"
                              >
                                {item.label === "Location Map" ? "Map" : item.label}
                              </a>
                            </SheetClose>

                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={handleMobilePoolsToggle}
                              className="h-6 px-2 text-[0.72rem] font-semibold uppercase tracking-wide text-[var(--app-public-accent)] hover:bg-[var(--app-public-accent)]/15 hover:text-[var(--app-public-highlight)]"
                              aria-expanded={isMobilePoolsExpanded}
                              aria-label={isMobilePoolsExpanded ? "Hide pools" : "Show pools"}
                            >
                              {isMobilePoolsExpanded ? "Hide" : "Show"}
                            </Button>
                          </div>
                        ) : (
                          <SheetClose asChild>
                            <a
                              href={`${navHrefPrefix}${item.href}`}
                              className="text-[#a4d473] transition-colors hover:text-[#feb234]"
                            >
                              {item.label === "Location Map" ? "Map" : item.label}
                            </a>
                          </SheetClose>
                        )}

                        {isPoolsItem && isMobilePoolsExpanded ? (
                          <ul className="mt-1 border-l border-[#a4d473]/45 pl-4">
                            {isPoolsLoading ? (
                              <li className="relative text-[#a4d473]">
                                <span
                                  className="absolute -left-4 top-4 h-px w-2 bg-[#a4d473]/55"
                                  aria-hidden="true"
                                />
                                Loading pools...
                              </li>
                            ) : (
                              sortedPools.map((pool) => (
                                <li key={pool.id} className="relative">
                                  <span
                                    className="absolute -left-4 top-4 h-px w-2 bg-[#a4d473]/55"
                                    aria-hidden="true"
                                  />

                                  <SheetClose asChild>
                                    <Link
                                      to={`/pools/${pool.id}`}
                                      className="text-[#a4d473] transition-colors hover:text-[#feb234]"
                                    >
                                      {`Pool ${pool.pool_number} - ${pool.name}`}
                                    </Link>
                                  </SheetClose>
                                </li>
                              ))
                            )}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}

                  <li className="relative">
                    <span className="absolute -left-3 top-4 h-px w-2 bg-[#a4d473]/55" aria-hidden="true" />
                    <SheetClose asChild>
                      <a
                        href="https://exsight360.com/virtual-tours/cattleya-resort/v4/tour-start-aerial.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a4d473] transition-colors hover:text-[#feb234]"
                      >
                        Day Tour
                      </a>
                    </SheetClose>
                  </li>

                  <li className="relative">
                    <span className="absolute -left-3 top-4 h-px w-2 bg-[#a4d473]/55" aria-hidden="true" />
                    <SheetClose asChild>
                      <a
                        href="https://cattleyaresort.com/tour2017/tour-night.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a4d473] transition-colors hover:text-[#feb234]"
                      >
                        Night Tour
                      </a>
                    </SheetClose>
                  </li>

                  <li className="relative">
                    <span className="absolute -left-3 top-4 h-px w-2 bg-[#a4d473]/55" aria-hidden="true" />
                    <SheetClose asChild>
                      <Link to="/admin" className="text-[#a4d473] transition-colors hover:text-[#feb234]">
                        Admin
                      </Link>
                    </SheetClose>
                  </li>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[52vh] w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700 flex-col items-center justify-center px-4 pb-6 pt-20 text-center md:min-h-[60vh] md:px-8 md:pt-24">
        <h1 className="w-full text-center text-3xl font-extrabold leading-tight drop-shadow-md sm:text-3xl md:text-5xl">
          {resortName}
        </h1>
        <p className="mt-3 w-full max-w-2xl text-center text-sm font-medium text-white/90 md:text-base">
          {websiteSubtitle || "Clean, Exclusive, Private and Affordable Pools and Villas for Rent"}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            asChild
            variant="outline"
            className="h-10 border-white/70 bg-transparent px-5 text-sm font-semibold text-white hover:bg-[var(--app-public-paper)] hover:text-[var(--app-public-surface)]"
          >
            <a
              href="https://exsight360.com/virtual-tours/cattleya-resort/v4/tour-start-aerial.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Day Tour
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 border-white/70 bg-transparent px-5 text-sm font-semibold text-white hover:bg-[var(--app-public-paper)] hover:text-[var(--app-public-surface)]"
          >
            <a
              href="https://cattleyaresort.com/tour2017/tour-night.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Night Tour
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}