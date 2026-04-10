import { supabase } from "@/lib/supabase";

const POOL_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_POOL_IMAGES_BUCKET || "pool-images";

const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

const optimizeImageForUpload = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const imageUrl = URL.createObjectURL(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Failed to load image"));
      element.src = imageUrl;
    });

    const largestSide = Math.max(image.width, image.height);
    if (largestSide <= MAX_IMAGE_DIMENSION && file.size <= 1_500_000) {
      URL.revokeObjectURL(imageUrl);
      return file;
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
    const targetWidth = Math.round(image.width * scale);
    const targetHeight = Math.round(image.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      URL.revokeObjectURL(imageUrl);
      return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    URL.revokeObjectURL(imageUrl);

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const normalizedName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${normalizedName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
};

export const poolService = {
  getAllPools: async () => {
    const { data, error } = await supabase
      .from("pools")
      .select("*")
      .order("pool_number");
    if (error) throw error;
    return data;
  },

  getPoolsSummary: async () => {
    const { data, error } = await supabase
      .from("pools")
      .select("id,pool_number,name,capacity,rates,cover_image_url")
      .order("pool_number");
    if (error) throw error;
    return data;
  },

  getPoolById: async (id: string) => {
    const { data, error } = await supabase
      .from("pools")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  updatePool: async (id: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("pools")
      .update({ ...updates, updated_at: new Date() })
      .eq("id", id)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  },

  uploadPoolImage: async (
    file: File,
    poolId: string,
    type: "cover" | "gallery",
  ) => {
    const optimizedFile = await optimizeImageForUpload(file);
    const sanitizedFileName = optimizedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${poolId}/${type}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(POOL_IMAGES_BUCKET)
      .upload(filePath, optimizedFile, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(POOL_IMAGES_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  },
};
