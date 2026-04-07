import { useGetPools } from "@/hooks/useGetPools";

export function Dashboard() {
  const { data: pools, isLoading } = useGetPools();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const totalPools = pools?.length || 0;
  const totalCapacity =
    pools?.reduce((sum, pool) => sum + (pool.capacity || 0), 0) || 0;
  const averageRate = pools?.length
    ? pools.reduce(
        (sum, pool) =>
          sum + ((pool.rates?.day || 0) + (pool.rates?.night || 0)) / 2,
        0,
      ) / pools.length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          Welcome to Cattleya Resort Admin
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage pools, rates, and content from one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Total Pools</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalPools}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            Total Capacity
          </h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalCapacity} pax
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Average Rate</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            ${averageRate.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
