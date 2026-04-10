/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type HomeLoadingContextValue = {
  loadedHeroSrc: string | null;
  setLoadedHeroSrc: (src: string) => void;
};

const HomeLoadingContext = createContext<HomeLoadingContextValue | undefined>(
  undefined,
);

type HomeLoadingProviderProps = {
  children: ReactNode;
};

export function HomeLoadingProvider({ children }: HomeLoadingProviderProps) {
  const [loadedHeroSrc, setLoadedHeroSrc] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      loadedHeroSrc,
      setLoadedHeroSrc,
    }),
    [loadedHeroSrc],
  );

  return (
    <HomeLoadingContext.Provider value={value}>
      {children}
    </HomeLoadingContext.Provider>
  );
}

export function useHomeLoadingContext() {
  const context = useContext(HomeLoadingContext);
  if (!context) {
    throw new Error("useHomeLoadingContext must be used inside HomeLoadingProvider");
  }

  return context;
}
