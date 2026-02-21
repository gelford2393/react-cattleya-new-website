import { poolService } from "@/services/PoolServices/poolServices";
import { useQuery } from "@tanstack/react-query";

export function useGetPoolById(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: async () => {
      if (!poolId) {
        throw new Error("Pool id is required");
      }

      return poolService.getPoolById(poolId);
    },
    enabled: !!poolId,
  });
}
