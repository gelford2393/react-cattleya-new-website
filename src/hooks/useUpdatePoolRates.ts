import type { PoolRatesFormValues } from "@/components/admin/Pools/_config";
import { poolService } from "@/services/PoolServices/poolServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      toast.success("Pool rates updated successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to update pool rates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    },
  });
}
