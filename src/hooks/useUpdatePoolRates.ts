import type { PoolRatesFormValues } from "@/components/admin/Pools/_config";
import { poolService } from "@/services/PoolServices/poolServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdatePoolRatesPayload = {
  id: string;
  values: PoolRatesFormValues;
};

export function useUpdatePoolRates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: UpdatePoolRatesPayload) => {
      await poolService.updatePool(id, {
        name: values.name,
        capacity: values.capacity,
        rates: {
          day: values.dayRate,
          night: values.nightRate,
        },
      });
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["pools"] });
      await queryClient.invalidateQueries({ queryKey: ["pool", variables.id] });
    },
  });
}
