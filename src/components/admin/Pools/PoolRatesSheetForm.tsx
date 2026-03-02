import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type FC, useEffect, useMemo } from "react";
import { useGetPools } from "@/hooks/useGetPools";
import { useCMSStore } from "@/store/useCMSStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  poolRatesFormSchema,
  type PoolRatesFormValues,
  type PoolRecord,
} from "./_config";
import { useUpdatePoolRates } from "@/hooks/useUpdatePoolRates";

const defaultValues: PoolRatesFormValues = {
  name: "",
  capacity: 0,
  dayRate: 0,
  nightRate: 0,
};

export const PoolRatesSheetForm: FC = () => {
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

  const selectedPool = useMemo(() => {
    if (!pools || !editingPoolId) {
      return null;
    }

    return (
      (pools as PoolRecord[]).find((pool) => pool.id === editingPoolId) ?? null
    );
  }, [pools, editingPoolId]);

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
            Configure Pools & Rates{" "}
            {selectedPool ? `(#${selectedPool.pool_number})` : ""}
          </SheetTitle>
          <SheetDescription>
            Update summary fields only: name, capacity, day rate, and night
            rate.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name" className="text-sm font-medium">
                Pool Name
              </FieldLabel>
              <Input id="name" {...register("name")} />
              <FieldError errors={errors.name ? [errors.name] : []} />
            </Field>
            <Field>
              <FieldLabel htmlFor="capacity" className="text-sm font-medium">
                Capacity (pax)
              </FieldLabel>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError errors={errors.capacity ? [errors.capacity] : []} />
            </Field>
            <Field>
              <FieldLabel htmlFor="dayRate" className="text-sm font-medium">
                Day Rate
              </FieldLabel>
              <Input
                id="dayRate"
                type="number"
                {...register("dayRate", { valueAsNumber: true })}
              />
              <FieldError errors={errors.dayRate ? [errors.dayRate] : []} />
            </Field>
            <Field>
              <FieldLabel htmlFor="nightRate" className="text-sm font-medium">
                Night Rate
              </FieldLabel>
              <Input
                id="nightRate"
                type="number"
                {...register("nightRate", { valueAsNumber: true })}
              />
              <FieldError errors={errors.nightRate ? [errors.nightRate] : []} />
            </Field>
          </FieldGroup>

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

export default PoolRatesSheetForm;
