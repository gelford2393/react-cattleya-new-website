import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Editor, type EditorHandle } from "@/components/ui/Editor";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";

import { noteEditorSchema, type NoteFormValues } from "./_config";
import { useNotePageQuery, useNoteSaveMutation } from "@/hooks/useNoteEditor";
import { Label } from "@/components/ui/label";
import { cmsServices } from "@/services/CMSServices/cmsServices";
import { toast } from "sonner";

export function Note() {
  const { data: page, isLoading } = useNotePageQuery();
  const saveMutation = useNoteSaveMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const editorContentInitialized = useRef(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: yupResolver(noteEditorSchema),
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

  const onSubmit = async (values: NoteFormValues) => {
    try {
      setSubmitError(null);
      await editorRef.current?.uploadImages();
      const latestContent = editorRef.current?.getContent() ?? values.content;
      const contentWithUploadedImages = await cmsServices.processContentImages(
        latestContent,
        "note",
      );
      await saveMutation.mutateAsync(contentWithUploadedImages);
      toast.success("Note saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save note";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      <div>
        <Label>Note Editor</Label>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <Editor
              ref={editorRef}
              value={field.value ?? ""}
              onChange={field.onChange}
              loading={isLoading}
              slug="note"
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
