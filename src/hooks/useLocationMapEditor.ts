import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsServices } from "@/services/CMSServices/cmsServices";

const LOCATION_MAP_PAGE_META = {
  slug: "location-map",
  title: "Location Map",
} as const;

export const locationMapPageQueryKey = [
  "cms_page",
  LOCATION_MAP_PAGE_META.slug,
] as const;

export function useLocationMapPageQuery() {
  return useQuery({
    queryKey: locationMapPageQueryKey,
    queryFn: () => cmsServices.getPageBySlug(LOCATION_MAP_PAGE_META.slug),
  });
}

export function useLocationMapSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      cmsServices.upsertPage({
        slug: LOCATION_MAP_PAGE_META.slug,
        title: LOCATION_MAP_PAGE_META.title,
        content,
      }),
    onSuccess: (savedPage) => {
      queryClient.setQueryData(locationMapPageQueryKey, savedPage);
    },
  });
}