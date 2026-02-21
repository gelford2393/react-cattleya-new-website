import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type FC, useEffect } from "react";
import { useGetPools } from "@/hooks/useGetPools";
import { useCMSStore } from "@/store/useCMSStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  poolRatesFormSchema,
  type PoolRatesFormValues,
} from "./poolRatesFormConfig";
import { useUpdatePoolRates } from "@/hooks/useUpdatePoolRates";

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

const defaultValues: PoolRatesFormValues = {
  name: "",
  capacity: 0,
  dayRate: 0,
  nightRate: 0,
};

export const PoolForm: FC = () => {
  const isOpen = useCMSStore((state) => state.isPoolSheetOpen);
  const editingPoolId = useCMSStore((state) => state.editingPoolId);
  const closePoolSheet = useCMSStore((state) => state.closePoolSheet);
  const { data: pools } = useGetPools();
  const updatePoolRatesMutation = useUpdatePoolRates();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PoolRatesFormValues>({
    resolver: yupResolver(poolRatesFormSchema),
    defaultValues,
  });

  const selectedPool = (pools as PoolRecord[] | undefined)?.find(
    (pool) => pool.id === editingPoolId,
  );

  useEffect(() => {
    if (!selectedPool) {
      reset(defaultValues);
      return;
    }

    reset({
      name: selectedPool.name ?? "",
      capacity: selectedPool.capacity ?? 0,
      dayRate: selectedPool.rates?.day ?? 0,
      nightRate: selectedPool.rates?.night ?? 0,
    });
  }, [selectedPool, reset]);

  const onSubmit = (values: PoolRatesFormValues) => {
    if (!editingPoolId) {
      return;
    }

    updatePoolRatesMutation.mutate(
      { id: editingPoolId, values },
      {
        onSuccess: () => {
          closePoolSheet();
          reset(defaultValues);
        },
      },
    );
  };

  const onOpenChange = (open: boolean) => {
    if (open) {
      return;
    }

    closePoolSheet();
    reset(defaultValues);
    updatePoolRatesMutation.reset();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            Configure Pools & Rates {selectedPool ? `(#${selectedPool.pool_number})` : ""}
          </SheetTitle>
          <SheetDescription>
            Update summary fields only: name, capacity, day rate, and night rate.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Pool Name
            </label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="capacity" className="text-sm font-medium">
              Capacity (pax)
            </label>
            <Input
              id="capacity"
              type="number"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-xs text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="dayRate" className="text-sm font-medium">
              Day Rate
            </label>
            <Input
              id="dayRate"
              type="number"
              {...register("dayRate", { valueAsNumber: true })}
            />
            {errors.dayRate && (
              <p className="text-xs text-red-500">{errors.dayRate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="nightRate" className="text-sm font-medium">
              Night Rate
            </label>
            <Input
              id="nightRate"
              type="number"
              {...register("nightRate", { valueAsNumber: true })}
            />
            {errors.nightRate && (
              <p className="text-xs text-red-500">{errors.nightRate.message}</p>
            )}
          </div>

          {updatePoolRatesMutation.error instanceof Error && (
            <p className="text-sm text-red-500">
              Failed to save: {updatePoolRatesMutation.error.message}
            </p>
          )}

          <SheetFooter className="px-0">
            <Button
              type="submit"
              className="w-full"
              disabled={updatePoolRatesMutation.isPending}
            >
              {updatePoolRatesMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PoolForm;
