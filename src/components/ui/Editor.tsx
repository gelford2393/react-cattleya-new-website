import { useRef, useImperativeHandle } from "react";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import { toast } from "sonner";
import { Spinner } from "./spinner";

const DEFAULT_PLUGINS = [
  // Core editing features
  "anchor",
  "autolink",
  "charmap",
  "codesample",
  "emoticons",
  "image",
  "link",
  "lists",
  "media",
  "searchreplace",
  "table",
  "visualblocks",
  "wordcount",
];
const TEXT_ONLY_PLUGINS = DEFAULT_PLUGINS.filter(
  (plugin) => plugin !== "image" && plugin !== "media",
);
const DEFAULT_TOOLBAR =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat";
const TEXT_ONLY_TOOLBAR =
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat";

export interface RichEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  loading?: boolean;
  slug?: string;
  mode?: "text" | "upload";
  onImageUpload?: (file: File, slug: string) => Promise<string>;
  ref?: React.Ref<EditorHandle>;
}

export interface EditorHandle {
  uploadImages: () => Promise<void>;
  getContent: () => string;
  setContent: (html: string) => void;
}

type TinyImageBlobInfo = {
  blob: () => Blob;
  filename?: () => string;
  name?: string;
};

export function Editor({
  value,
  onChange,
  height = 775,
  loading = false,
  slug = "editor",
  mode,
  onImageUpload,
  ref,
}: RichEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    uploadImages: () =>
      new Promise<void>((resolve, reject) => {
        if (!editorRef.current) {
          resolve();
          return;
        }
        editorRef.current
          .uploadImages()
          .then(() => resolve())
          .catch(reject);
      }),
    getContent: () => {
      if (!editorRef.current) return value;
      return editorRef.current.getContent() as string;
    },
    setContent: (html: string) => {
      if (editorRef.current) {
        editorRef.current.setContent(html);
      }
    },
  }));

  const resolvedMode = mode ?? (onImageUpload ? "upload" : "text");
  const uploadsEnabled = resolvedMode === "upload" && Boolean(onImageUpload);

  const images_upload_handler = async (
    blobInfo: TinyImageBlobInfo,
  ): Promise<string> => {
    try {
      if (!uploadsEnabled || !onImageUpload) {
        throw new Error("Image upload is not configured for this editor.");
      }

      const blob = blobInfo.blob();
      const fallbackName =
        blobInfo.filename?.() ?? blobInfo.name ?? `editor-image-${Date.now()}.png`;
      const file =
        blob instanceof File
          ? blob
          : new File([blob], fallbackName, {
              type: blob.type || "image/png",
            });

      const publicUrl = await onImageUpload(file, slug);
      return publicUrl;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image upload failed";
      toast.error(message);
      // Re-throwing causes TinyMCE to remove the image from the editor.
      throw new Error(message);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockImagePaste = (event: ClipboardEvent, editor: any) => {
    const items = event.clipboardData?.items;
    const html = event.clipboardData?.getData("text/html") || "";
    const plainText = event.clipboardData?.getData("text/plain") || "";

    let hasImageInClipboard = false;

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].type.startsWith("image/")) {
          hasImageInClipboard = true;
          break;
        }
      }
    }

    // Some apps paste HTML with <img> tags even when clipboard items do not
    // expose image/* types.
    const htmlContainsImageTag = /<img\b/i.test(html);

    if (!hasImageInClipboard && !htmlContainsImageTag) {
      return;
    }

    event.preventDefault();

    // Preserve non-image pasted content if any.
    const sanitizedHtml = html ? stripPastedImagesFromHtml(html) : "";
    if (sanitizedHtml.trim()) {
      editor.insertContent(sanitizedHtml);
    } else if (plainText.trim()) {
      editor.insertContent(plainText);
    }

      toast.error(
        uploadsEnabled
          ? "Image paste is disabled. Use Insert/Edit image instead."
          : "Images are disabled in this editor.",
      );
  };

  const stripPastedImagesFromHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const images = doc.querySelectorAll("img");
    if (images.length === 0) {
      return html;
    }

    images.forEach((img) => img.remove());
    return doc.body.innerHTML;
  };

  return (
    <div>
      {loading ? (
        <div
          className="flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <Spinner className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading editor...</p>
          </div>
        </div>
      ) : (
        <TinyMCEEditor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key"}
          value={value}
          onInit={(_evt, editor) => {
            editorRef.current = editor;
          }}
          init={{
            height,
            menubar: false,
            plugins: uploadsEnabled ? DEFAULT_PLUGINS : TEXT_ONLY_PLUGINS,
            toolbar: uploadsEnabled ? DEFAULT_TOOLBAR : TEXT_ONLY_TOOLBAR,
            // Called for every image that needs uploading:
            // pasted images, dragged images, and images inserted via file picker.
            // Throwing here causes TinyMCE to remove the image from the editor.
            images_upload_handler,
            // Disallow image pasting from clipboard; retain insert/edit upload flow.
            paste_data_images: false,
            // Upload immediately when image is pasted/inserted so Save only
            // persists already-uploaded public URLs.
            automatic_uploads: true,
            ...(uploadsEnabled
              ? {
                  file_picker_types: "image",
                  file_picker_callback: (
                    callback: (url: string, meta?: { alt?: string }) => void,
                  ) => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      const selectedFile = input.files?.[0];
                      if (!selectedFile) return;
                      try {
                        if (!onImageUpload) {
                          throw new Error(
                            "Image upload is not configured for this editor.",
                          );
                        }
                        const publicUrl = await onImageUpload(selectedFile, slug);
                        callback(publicUrl, { alt: selectedFile.name });
                      } catch (error) {
                        const message =
                          error instanceof Error
                            ? error.message
                            : "Image upload failed";
                        toast.error(message);
                      }
                    };
                    input.click();
                  },
                }
              : {}),
            images_reuse_filename: true,
            relative_urls: false,
            remove_script_host: false,
            convert_urls: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setup: (editor: any) => {
              editor.on("paste", (event: ClipboardEvent) => {
                blockImagePaste(event, editor);
              });

              // Some browsers/apps paste images as HTML <img> instead of
              // clipboard image items. Sanitize that path too.
              editor.on("PastePreProcess", (event: { content: string }) => {
                event.content = stripPastedImagesFromHtml(event.content);
              });
            },
          }}
          onEditorChange={onChange}
        />
      )}
    </div>
  );
}
