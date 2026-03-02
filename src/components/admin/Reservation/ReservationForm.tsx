import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/ui/Editor";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";

import {
  reservationEditorSchema,
  type ReservationEditorValues,
} from "./_config";
import {
  useReservationPageQuery,
  useReservationSaveMutation,
} from "@/hooks/useReservationEditor";
import { Label } from "@/components/ui/label";

export default function ReservationForm() {
  const { data: page, isLoading } = useReservationPageQuery();
  const saveMutation = useReservationSaveMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservationEditorValues>({
    resolver: yupResolver(reservationEditorSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (page) {
      reset({ content: page.content ?? "" });
    }
  }, [page, reset]);

  const onSubmit = async (values: ReservationEditorValues) => {
    await saveMutation.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label>Reservation Editor</Label>

      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <Editor value={field.value ?? ""} onChange={field.onChange} />
        )}
      />

      {errors.content && <p>{errors.content.message}</p>}

      <Button
        className="mt-4"
        type="submit"
        disabled={isSubmitting || saveMutation.isPending || isLoading}
      >
        {saveMutation.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
