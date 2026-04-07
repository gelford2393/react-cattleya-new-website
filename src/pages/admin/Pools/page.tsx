import { PoolRatesSheetForm, PoolRatesTable } from "@/components/admin/Pools";
import { Note } from "@/components/admin/Note";

export function PoolsPage() {
  return (
    <>
      <PoolRatesTable />
      <Note />
      <PoolRatesSheetForm />
    </>
  );
}
