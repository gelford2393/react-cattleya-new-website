import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type ReservationFormValues } from "@/components/admin/Reservation/_config";
import { cmsServices } from "@/services/CMSServices/cmsServices";

const RESERVATION_PAGE_META = {
  slug: "reservation",
  title: "Reservation",
} as const;

export const reservationPageQueryKey = [
  "cms_page",
  RESERVATION_PAGE_META.slug,
] as const;

export function useReservationPageQuery() {
  return useQuery({
    queryKey: reservationPageQueryKey,
    queryFn: () => cmsServices.getPageBySlug(RESERVATION_PAGE_META.slug),
  });
}

export function useReservationSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: ReservationFormValues) =>
      cmsServices.upsertPage({
        slug: RESERVATION_PAGE_META.slug,
        title: RESERVATION_PAGE_META.title,
        content: values.content,
      }),
    onSuccess: (savedPage) => {
      queryClient.setQueryData(["cms_page", "reservation"], savedPage);
    },
  });
}
