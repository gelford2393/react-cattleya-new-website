import { useGetPools } from "@/hooks/useGetPools";
import { useCMSStore } from "@/store/useCMSStore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type PoolRecord = {
  id: string;
  pool_number: number;
  name: string;
  capacity: number | null;
  rates?: {
    day?: number;
    night?: number;
  } | null;
};

export function PoolsDataList() {
  const { data: pools, isLoading, error } = useGetPools();
  const openPoolSheet = useCMSStore((state) => state.openPoolSheet);

  const handleConfigureClick = (id: string) => {
    openPoolSheet(id);
  };

  if (isLoading)
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  if (error)
    return <div className="p-8 text-red-500">Error: {errorMessage}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-2">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[80px]">No.</TableHead>
            <TableHead>Pool Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Day Rate</TableHead>
            <TableHead>Night Rate</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(pools as PoolRecord[] | undefined)?.map((pool) => (
            <TableRow
              key={pool.id}
              className="hover:bg-blue-50/50 transition-colors"
            >
              <TableCell className="font-bold text-slate-400">
                #{pool.pool_number}
              </TableCell>
              <TableCell className="font-semibold text-slate-700">
                {pool.name}
              </TableCell>
              <TableCell>{pool.capacity || 0} pax</TableCell>
              <TableCell>₱{pool.rates?.day?.toLocaleString() || "0"}</TableCell>
              <TableCell>
                ₱{pool.rates?.night?.toLocaleString() || "0"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => handleConfigureClick(pool.id)}
                  type="button"
                >
                  Configure
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
