import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/ui/Editor";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";

import {
  reservationEditorSchema,
  type ReservationEditorValues,
} from "./_config";
import {
  useReservationPageQuery,
  useReservationSaveMutation,
} from "@/hooks/useReservationEditor";
import { Label } from "@/components/ui/label";
import { cmsServices } from "@/services/CMSServices/cmsServices";
import { toast } from "sonner";

export function ReservationForm() {
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
    try {
      await saveMutation.mutateAsync(values);
      toast.success("Reservation page saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save reservation page";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label>Reservation Editor</Label>

      <Controller
        name="content"
        control={control}
        render={({ field }) => (
          <Editor
            value={field.value ?? ""}
            onChange={field.onChange}
            loading={isLoading}
            slug="reservation"
            onImageUpload={(file, currentSlug) =>
              cmsServices.uploadCMSImage(file, currentSlug)
            }
          />
        )}
      />

      {errors.content && <p>{errors.content.message}</p>}

      <Button
        className="mt-4"
        type="submit"
        disabled={isSubmitting || saveMutation.isPending || isLoading}
      >
        {saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
        {saveMutation.isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

export default ReservationForm;
