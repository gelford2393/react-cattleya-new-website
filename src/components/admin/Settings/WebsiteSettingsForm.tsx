import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import {
  parseWebsiteSettingsContent,
  useWebsiteSettingsPageQuery,
  useWebsiteSettingsSaveMutation,
  type WebsiteSettingsValues,
} from "@/hooks/useWebsiteSettings";
import { cmsServices } from "@/services/CMSServices/cmsServices";
import { toast } from "sonner";

const settingsSchema = yup.object({
  siteName: yup.string().trim().required("Site name is required"),
  websiteSubtitle: yup
    .string()
    .trim()
    .required("Website subtitle is required"),
  homeWelcomeTitle: yup
    .string()
    .trim()
    .required("Home welcome title is required"),
  homeWelcomeDescription: yup
    .string()
    .trim()
    .required("Home welcome description is required"),
  adminTheme: yup
    .mixed<"light" | "dark">()
    .oneOf(["light", "dark"])
    .required("Admin theme is required")
    .default("light"),
  siteIconUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Website icon must be a valid URL")
    .optional()
    .default(""),
  homeBackgroundUrl: yup
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .url("Home background must be a valid URL")
    .optional()
    .default(""),
});

const defaultValues: WebsiteSettingsValues = {
  siteName: "Cattleya Resort",
  websiteSubtitle: "Clean, Exclusive, Private and Affordable Pools and Villas for Rent",
  homeWelcomeTitle: "Welcome to the hottest way to cool down in Antipolo!",
  homeWelcomeDescription:
    "Just 30 minutes from Metro Manila, in the hills of Antipolo, Cattleya Resort is an exciting venue for families, friends and companies. It is perfect for birthdays, homecomings, wedding receptions and team building activities. Enjoy an affordable exclusive resort.",
  adminTheme: "light",
  siteIconUrl: "",
  homeBackgroundUrl: "",
};

export function WebsiteSettingsForm() {
  const { data: settingsPage, isLoading } = useWebsiteSettingsPageQuery();
  const saveMutation = useWebsiteSettingsSaveMutation();
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<WebsiteSettingsValues>({
    resolver: yupResolver(settingsSchema),
    defaultValues,
  });

  const siteIconUrl = useWatch({ control, name: "siteIconUrl" });
  const homeBackgroundUrl = useWatch({ control, name: "homeBackgroundUrl" });

  useEffect(() => {
    if (!settingsPage) {
      reset(defaultValues);
      return;
    }

    reset(parseWebsiteSettingsContent(settingsPage.content));
  }, [settingsPage, reset]);

  const handleSiteIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingIcon(true);
      const uploadedUrl = await cmsServices.uploadCMSImage(
        file,
        "website-settings/site-icon",
      );
      setValue("siteIconUrl", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Website icon uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload website icon");
    } finally {
      setIsUploadingIcon(false);
      event.target.value = "";
    }
  };

  const handleHomeBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsUploadingBackground(true);
      const uploadedUrl = await cmsServices.uploadCMSImage(
        file,
        "website-settings/home-background",
      );
      setValue("homeBackgroundUrl", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Home background uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload home background");
    } finally {
      setIsUploadingBackground(false);
      event.target.value = "";
    }
  };

  const onSubmit = (values: WebsiteSettingsValues) => {
    saveMutation.mutate(
      {
        siteName: values.siteName.trim(),
        websiteSubtitle: values.websiteSubtitle.trim(),
        homeWelcomeTitle: values.homeWelcomeTitle.trim(),
        homeWelcomeDescription: values.homeWelcomeDescription.trim(),
        adminTheme: values.adminTheme,
        siteIconUrl: values.siteIconUrl.trim(),
        homeBackgroundUrl: values.homeBackgroundUrl.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Website settings saved");
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Failed to save settings";
          toast.error(message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Website Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your website brand and homepage visuals.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <FieldLabel htmlFor="siteName" className="text-sm font-medium">
              Website Name
            </FieldLabel>
            <Input
              id="siteName"
              placeholder="Cattleya Resort"
              {...register("siteName")}
            />
            {errors.siteName && (
              <p className="text-xs text-red-500">{errors.siteName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="websiteSubtitle" className="text-sm font-medium">
              Website Subtitle
            </FieldLabel>
            <Input
              id="websiteSubtitle"
              placeholder="Clean, Exclusive, Private and Affordable Pools and Villas for Rent"
              {...register("websiteSubtitle")}
            />
            {errors.websiteSubtitle && (
              <p className="text-xs text-red-500">{errors.websiteSubtitle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="adminTheme" className="text-sm font-medium">
              Admin Theme
            </FieldLabel>
            <select
              id="adminTheme"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              {...register("adminTheme")}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            {errors.adminTheme && (
              <p className="text-xs text-red-500">{errors.adminTheme.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="homeWelcomeTitle" className="text-sm font-medium">
              Home Welcome Title
            </FieldLabel>
            <Input
              id="homeWelcomeTitle"
              placeholder="Welcome to the hottest way to cool down in Antipolo!"
              {...register("homeWelcomeTitle")}
            />
            {errors.homeWelcomeTitle && (
              <p className="text-xs text-red-500">{errors.homeWelcomeTitle.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="homeWelcomeDescription" className="text-sm font-medium">
              Home Welcome Description
            </FieldLabel>
            <textarea
              id="homeWelcomeDescription"
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe your resort welcome section"
              {...register("homeWelcomeDescription")}
            />
            {errors.homeWelcomeDescription && (
              <p className="text-xs text-red-500">{errors.homeWelcomeDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="siteIconUrl" className="text-sm font-medium">
              Website Icon URL
            </FieldLabel>
            <Input
              id="siteIconUrl"
              placeholder="https://..."
              {...register("siteIconUrl")}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={handleSiteIconUpload}
              disabled={isUploadingIcon}
            />
            {isUploadingIcon && <Skeleton className="h-8 w-full" />}
            {errors.siteIconUrl && (
              <p className="text-xs text-red-500">{errors.siteIconUrl.message}</p>
            )}
            {siteIconUrl?.trim() && (
              <img
                src={siteIconUrl}
                alt="Website icon preview"
                className="size-12 rounded border"
              />
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel
              htmlFor="homeBackgroundUrl"
              className="text-sm font-medium"
            >
              Home Background URL
            </FieldLabel>
            <Input
              id="homeBackgroundUrl"
              placeholder="https://..."
              {...register("homeBackgroundUrl")}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={handleHomeBackgroundUpload}
              disabled={isUploadingBackground}
            />
            {isUploadingBackground && <Skeleton className="h-8 w-full" />}
            {errors.homeBackgroundUrl && (
              <p className="text-xs text-red-500">
                {errors.homeBackgroundUrl.message}
              </p>
            )}
            {homeBackgroundUrl?.trim() && (
              <img
                src={homeBackgroundUrl}
                alt="Home background preview"
                className="h-28 w-full rounded border object-cover"
              />
            )}
          </div>

          {saveMutation.error instanceof Error && (
            <p className="text-sm text-red-500">
              Failed to save: {saveMutation.error.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
