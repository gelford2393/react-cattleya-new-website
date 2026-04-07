import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsServices } from "@/services/CMSServices/cmsServices";

const CONTACT_US_PAGE_META = {
  slug: "contact-us",
  title: "Contact Us",
} as const;

export const contactUsPageQueryKey = [
  "cms_page",
  CONTACT_US_PAGE_META.slug,
] as const;

export function useContactUsPageQuery() {
  return useQuery({
    queryKey: contactUsPageQueryKey,
    queryFn: () => cmsServices.getPageBySlug(CONTACT_US_PAGE_META.slug),
  });
}

export function useContactUsSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      cmsServices.upsertPage({
        slug: CONTACT_US_PAGE_META.slug,
        title: CONTACT_US_PAGE_META.title,
        content,
      }),
    onSuccess: (savedPage) => {
      queryClient.setQueryData(contactUsPageQueryKey, savedPage);
    },
  });
}
