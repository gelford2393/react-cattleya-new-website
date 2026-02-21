import { supabase } from "@/lib/supabase";

const POOL_IMAGES_BUCKET =
  import.meta.env.VITE_SUPABASE_POOL_IMAGES_BUCKET || "pool-images";

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
      .select("id,pool_number,name,capacity,rates")
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
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${poolId}/${type}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(POOL_IMAGES_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(POOL_IMAGES_BUCKET).getPublicUrl(filePath);

    return publicUrl;
  },
};
