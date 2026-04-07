import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsServices } from "@/services/CMSServices/cmsServices";

const NOTE_PAGE_META = {
  slug: "note",
  title: "Note",
} as const;

export const notePageQueryKey = ["cms_page", NOTE_PAGE_META.slug] as const;

export function useNotePageQuery() {
  return useQuery({
    queryKey: notePageQueryKey,
    queryFn: () => cmsServices.getPageBySlug(NOTE_PAGE_META.slug),
  });
}

export function useNoteSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      cmsServices.upsertPage({
        slug: NOTE_PAGE_META.slug,
        title: NOTE_PAGE_META.title,
        content,
      }),
    onSuccess: (savedPage) => {
      queryClient.setQueryData(notePageQueryKey, savedPage);
    },
  });
}
