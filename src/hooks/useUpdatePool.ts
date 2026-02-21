import { poolService } from "@/services/PoolServices/poolServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PoolFormValues } from "@/components/admin/Pools/_config";

type UpdatePoolPayload = {
  id: string;
  values: PoolFormValues;
};

export function useUpdatePool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: UpdatePoolPayload) => {
      const amenities = values.amenities
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const gallery = values.gallery
        .map((item) => item?.trim())
        .filter((item) => item && item.length > 0);

      await poolService.updatePool(id, {
        name: values.name,
        capacity: values.capacity,
        rates: {
          day: values.dayRate,
          night: values.nightRate,
        },
        amenities,
        cover_image_url: values.coverImageUrl.trim() || null,
        gallery,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pools"] });
    },
  });
}
