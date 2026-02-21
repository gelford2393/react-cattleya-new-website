import { PoolRatesSheetForm } from "@/components/admin/Pools/PoolRatesSheetForm";
import { PoolRatesTable } from "@/components/admin/Pools/PoolRatesTable";

export function PoolsPage() {
  return (
    <>
      <PoolRatesTable />
      <PoolRatesSheetForm />
    </>
  );
}
