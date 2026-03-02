import { supabase } from "@/lib/supabase";

export const cmsServices = {
  getPageBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .single();
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
};
