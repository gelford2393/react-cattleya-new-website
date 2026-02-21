import { poolService } from "@/services/PoolServices/poolServices";
import { useQuery } from "@tanstack/react-query";

export function useGetPools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const data = await poolService.getPoolsSummary();
      return data;
    },
  });
}
