import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Editor, type EditorHandle } from "@/components/ui/Editor";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";

import { locationMapEditorSchema, type LocationMapFormValues } from "./_config";
import {
  useLocationMapPageQuery,
  useLocationMapSaveMutation,
} from "@/hooks/useLocationMapEditor";
import { Label } from "@/components/ui/label";
import { cmsServices } from "@/services/CMSServices/cmsServices";
import { toast } from "sonner";

export function LocationMap() {
  const { data: page, isLoading } = useLocationMapPageQuery();
  const saveMutation = useLocationMapSaveMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const editorContentInitialized = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationMapFormValues>({
    resolver: yupResolver(locationMapEditorSchema),
    defaultValues: { content: "" },
  });

  useEffect(() => {
    if (!page) return;
    const html = page.content ?? "";
    reset({ content: html });
    if (!editorContentInitialized.current) {
      if (editorRef.current) {
        editorRef.current.setContent(html);
        editorContentInitialized.current = true;
      }
    }
  }, [page, reset]);

  const onSubmit = async (values: LocationMapFormValues) => {
    try {
      setSubmitError(null);
      await editorRef.current?.uploadImages();
      const latestContent = editorRef.current?.getContent() ?? values.content;
      const contentWithUploadedImages = await cmsServices.processContentImages(
        latestContent,
        "location-map",
      );
      await saveMutation.mutateAsync(contentWithUploadedImages);
      toast.success("Location map saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save location map";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div>
        <Label>Location Map Editor</Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Editor
              ref={editorRef}
              value={field.value ?? ""}
              onChange={field.onChange}
              loading={isLoading}
              slug="location-map"
              onImageUpload={(file, currentSlug) =>
                cmsServices.uploadCMSImage(file, currentSlug)
              }
            />
          )}
        />
        {errors.content && <p>{errors.content.message}</p>}
        {submitError && <p className="text-sm text-red-600 mt-2">{submitError}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending || isLoading}
        >
          {saveMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
