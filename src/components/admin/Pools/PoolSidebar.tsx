import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useGetPools } from "@/hooks/useGetPools";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type PoolSummary = {
  id: string;
  pool_number: number;
  name: string;
};

export default function PoolSidebar() {
  const { data: pools, isLoading } = useGetPools();
  const location = useLocation();

  const isActive = (href: string) =>
    location.pathname === href
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "hover:bg-slate-50 text-slate-700";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="size-4" />
          Pools Drawer
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[340px] sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pools & Rates</SheetTitle>
          <SheetDescription>
            Quick navigation for pool management pages.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-2 overflow-y-auto">
          <SheetClose asChild>
            <Link
              to="/admin/pools-rates"
              className={`block rounded-md border px-3 py-2 text-sm font-medium transition-colors ${isActive("/admin/pools-rates")}`}
            >
              Pools & Rates Overview
            </Link>
          </SheetClose>

          {isLoading ? (
            <p className="text-xs text-slate-500">Loading pools...</p>
          ) : (
            (pools as PoolSummary[] | undefined)?.map((pool) => (
              <SheetClose asChild key={pool.id}>
                <Link
                  to={`/admin/pools/${pool.id}/edit`}
                  className={`block rounded-md border px-3 py-2 text-sm transition-colors ${isActive(`/admin/pools/${pool.id}/edit`)}`}
                >
                  Pool #{pool.pool_number} - {pool.name}
                </Link>
              </SheetClose>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
