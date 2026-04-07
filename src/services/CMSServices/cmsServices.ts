import { supabase } from "@/lib/supabase";

const CMS_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_IMAGES_BUCKET || "content-images";

function dataUrlToFile(dataUrl: string, fallbackName: string): File {
  const [metadata, base64Data] = dataUrl.split(",");
  const mimeMatch = metadata?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "image/png";
  const extension =
    mimeType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "png";
  const fileName = fallbackName.includes(".")
    ? fallbackName
    : `${fallbackName}.${extension}`;

  const decodedData = atob(base64Data || "");
  const bytes = new Uint8Array(decodedData.length);
  for (let i = 0; i < decodedData.length; i += 1) {
    bytes[i] = decodedData.charCodeAt(i);
  }

  return new File([bytes], fileName, { type: mimeType });
}

async function imageSrcToFile(
  src: string,
  fallbackName: string,
): Promise<File | null> {
  if (src.startsWith("data:image/")) {
    return dataUrlToFile(src, fallbackName);
  }

  if (src.startsWith("blob:")) {
    const response = await fetch(src);
    const blob = await response.blob();
    const extension =
      blob.type.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "png";
    const fileName = `${fallbackName}.${extension}`;
    return new File([blob], fileName, { type: blob.type || "image/png" });
  }

  return null;
}

/**
 * Tries to fetch a relative image path from the current origin.
 * Returns null (silently) if the file is not found — no error thrown.
 */
async function fetchRelativeImageAsFile(
  src: string,
  fallbackName: string,
): Promise<File | null> {
  const candidates = Array.from(
    new Set([
      src,
      src.startsWith("/") ? src : `/${src}`,
    ]),
  );

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) continue;

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) continue;

      const pathName = candidate.split("?")[0];
      const fileNameFromPath = pathName.split("/").pop() || fallbackName;
      const extension =
        blob.type.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "png";
      const fileName = fileNameFromPath.includes(".")
        ? fileNameFromPath
        : `${fileNameFromPath}.${extension}`;

      return new File([blob], fileName, { type: blob.type });
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

function isRelativeImageSource(src: string): boolean {
  return (
    !/^(https?:)?\/\//i.test(src) &&
    !src.startsWith("data:") &&
    !src.startsWith("blob:")
  );
}

function normalizeSupabaseObjectUrlToPublic(src: string): string | null {
  try {
    const url = new URL(src);
    const marker = `/storage/v1/object/${CMS_IMAGES_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }

    const objectPath = url.pathname.slice(index + marker.length);
    if (!objectPath) {
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(CMS_IMAGES_BUCKET).getPublicUrl(objectPath);

    return publicUrl;
  } catch {
    return null;
  }
}

async function resolveRelativeSrcToStorageUrl(
  src: string,
  slug: string,
): Promise<string | null> {
  const normalized = src.replace(/^\/+/, "");
  const fileName = normalized.split("/").pop();

  const candidateObjectPaths = Array.from(
    new Set(
      [
        normalized,
        fileName ? `${slug}/${fileName}` : null,
      ].filter((value): value is string => Boolean(value)),
    ),
  );

  for (const objectPath of candidateObjectPaths) {
    const { data, error } = await supabase.storage
      .from(CMS_IMAGES_BUCKET)
      .download(objectPath);

    if (error || !data) {
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(CMS_IMAGES_BUCKET).getPublicUrl(objectPath);

    return publicUrl;
  }

  return null;
}

export const cmsServices = {
  getPageBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },
  upsertPage: async ({
    slug,
    title,
    content,
  }: {
    slug: string;
    title: string;
    content: string;
  }) => {
    const { data, error } = await supabase
      .from("cms_pages")
      .upsert({ slug, title, content }, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  uploadCMSImage: async (file: File, slug: string) => {
    if (!CMS_IMAGES_BUCKET) {
      throw new Error("Storage bucket is not configured");
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${slug}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(CMS_IMAGES_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw new Error(
        `Storage upload failed (${CMS_IMAGES_BUCKET}/${filePath}): ${uploadError.message}`,
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(CMS_IMAGES_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  },

  processContentImages: async (content: string, slug: string) => {
    // Upload any data:, blob:, or relative image sources to Supabase Storage
    // and replace the src attribute with the returned public URL.
    // Absolute https:// URLs (already in storage) are left untouched.
    const hasUploadableSources =
      content.includes("data:image/") ||
      content.includes("blob:") ||
      // rough check for relative src attributes
      /src=['"][^'"]+['"]/i.test(content);

    if (!hasUploadableSources) {
      return content;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = Array.from(doc.querySelectorAll<HTMLImageElement>("img[src]"));

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const source = image.getAttribute("src");
      if (!source) continue;

      // Convert pasted non-public Supabase object URLs to public URLs.
      // Example: /storage/v1/object/content-images/... -> /storage/v1/object/public/content-images/...
      const normalizedPublicUrl = normalizeSupabaseObjectUrlToPublic(source);
      if (normalizedPublicUrl) {
        image.setAttribute("src", normalizedPublicUrl);
        continue;
      }

      // Skip already-uploaded absolute URLs
      if (/^https?:\/\//i.test(source)) continue;

      // Try data: / blob: first, then fall back to fetching relative paths
      let file = await imageSrcToFile(
        source,
        `${slug}-image-${Date.now()}-${index}`,
      );

      if (!file && isRelativeImageSource(source)) {
        file = await fetchRelativeImageAsFile(
          source,
          `${slug}-image-${Date.now()}-${index}`,
        );
      }

      if (!file && isRelativeImageSource(source)) {
        const existingStorageUrl = await resolveRelativeSrcToStorageUrl(
          source,
          slug,
        );

        if (existingStorageUrl) {
          image.setAttribute("src", existingStorageUrl);
          continue;
        }
      }

      if (!file) continue; // file not accessible — leave src as-is

      const publicUrl = await cmsServices.uploadCMSImage(file, slug);
      image.setAttribute("src", publicUrl);
    }

    return doc.body.innerHTML;
  },

  testStorageUpload: async () => {
    const oneByOnePngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApMBgU6YewsAAAAASUVORK5CYII=";
    const binary = atob(oneByOnePngBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const file = new File([bytes], `storage-test-${Date.now()}.png`, {
      type: "image/png",
    });

    return cmsServices.uploadCMSImage(file, "debug");
  },
};
