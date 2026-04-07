import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Editor, type EditorHandle } from "@/components/ui/Editor";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";

import { contactUsEditorSchema, type ContactUsFormValues } from "./_config";
import {
  useContactUsPageQuery,
  useContactUsSaveMutation,
} from "@/hooks/useContactUsEditor";
import { Label } from "@/components/ui/label";
import { cmsServices } from "@/services/CMSServices/cmsServices";
import { toast } from "sonner";

export function ContactUs() {
  const { data: page, isLoading } = useContactUsPageQuery();
  const saveMutation = useContactUsSaveMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const editorContentInitialized = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactUsFormValues>({
    resolver: yupResolver(contactUsEditorSchema),
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

  const onSubmit = async (values: ContactUsFormValues) => {
    try {
      setSubmitError(null);
      await editorRef.current?.uploadImages();
      const latestContent = editorRef.current?.getContent() ?? values.content;
      const contentWithUploadedImages = await cmsServices.processContentImages(
        latestContent,
        "contact-us",
      );
      await saveMutation.mutateAsync(contentWithUploadedImages);
      toast.success("Contact Us page saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save Contact Us page";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div>
        <Label>Contact Us Editor</Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Editor
              ref={editorRef}
              value={field.value ?? ""}
              onChange={field.onChange}
              loading={isLoading}
              slug="contact-us"
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
