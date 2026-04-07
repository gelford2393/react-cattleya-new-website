import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsServices } from "@/services/CMSServices/cmsServices";

export type WebsiteSettingsValues = {
  siteName: string;
  websiteSubtitle: string;
  homeWelcomeTitle: string;
  homeWelcomeDescription: string;
  adminTheme: "light" | "dark";
  siteIconUrl: string;
  homeBackgroundUrl: string;
};

const WEBSITE_SETTINGS_PAGE_META = {
  slug: "website-settings",
  title: "Website Settings",
} as const;

export const websiteSettingsQueryKey = [
  "cms_page",
  WEBSITE_SETTINGS_PAGE_META.slug,
] as const;

const defaultWebsiteSettings: WebsiteSettingsValues = {
  siteName: "Cattleya Resort",
  websiteSubtitle: "Clean, Exclusive, Private and Affordable Pools and Villas for Rent",
  homeWelcomeTitle: "Welcome to the hottest way to cool down in Antipolo!",
  homeWelcomeDescription:
    "Just 30 minutes from Metro Manila, in the hills of Antipolo, Cattleya Resort is an exciting venue for families, friends and companies. It is perfect for birthdays, homecomings, wedding receptions and team building activities. Enjoy an affordable exclusive resort.",
  adminTheme: "light",
  siteIconUrl: "",
  homeBackgroundUrl: "",
};

export function parseWebsiteSettingsContent(
  content: string | null | undefined,
): WebsiteSettingsValues {
  if (!content) {
    return defaultWebsiteSettings;
  }

  try {
    const parsed = JSON.parse(content) as Partial<WebsiteSettingsValues>;

    return {
      siteName: parsed.siteName?.trim() || defaultWebsiteSettings.siteName,
      websiteSubtitle:
        parsed.websiteSubtitle?.trim() || defaultWebsiteSettings.websiteSubtitle,
      homeWelcomeTitle:
        parsed.homeWelcomeTitle?.trim() || defaultWebsiteSettings.homeWelcomeTitle,
      homeWelcomeDescription:
        parsed.homeWelcomeDescription?.trim() ||
        defaultWebsiteSettings.homeWelcomeDescription,
      adminTheme: parsed.adminTheme === "dark" ? "dark" : "light",
      siteIconUrl: parsed.siteIconUrl?.trim() || "",
      homeBackgroundUrl: parsed.homeBackgroundUrl?.trim() || "",
    };
  } catch {
    return defaultWebsiteSettings;
  }
}

export function useWebsiteSettingsPageQuery() {
  return useQuery({
    queryKey: websiteSettingsQueryKey,
    queryFn: () => cmsServices.getPageBySlug(WEBSITE_SETTINGS_PAGE_META.slug),
  });
}

export function useWebsiteSettingsSaveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: WebsiteSettingsValues) =>
      cmsServices.upsertPage({
        slug: WEBSITE_SETTINGS_PAGE_META.slug,
        title: WEBSITE_SETTINGS_PAGE_META.title,
        content: JSON.stringify(values),
      }),
    onSuccess: (savedPage) => {
      queryClient.setQueryData(websiteSettingsQueryKey, savedPage);
    },
  });
}
