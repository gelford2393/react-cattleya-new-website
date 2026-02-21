import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  normalizeStringArray,
  poolFormSchema,
  type PoolFormValues,
} from "./_config";
import { useGetPoolById } from "@/hooks/useGetPoolById";
import { useUpdatePool } from "@/hooks/useUpdatePool";
import { poolService } from "@/services/PoolServices/poolServices";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

type PoolRecord = {
  id: string;
  pool_number: number;
  name: string;
  capacity: number | null;
  amenities?: string[] | null;
  cover_image_url?: string | null;
  gallery?: string[] | null;
  rates?: {
    day?: number;
    night?: number;
  } | null;
};

const defaultValues: PoolFormValues = {
  name: "",
  capacity: 0,
  dayRate: 0,
  nightRate: 0,
  amenities: [""],
  coverImageUrl: "",
  gallery: [],
};

export function PoolEditorForm() {
  const { poolId } = useParams();
  const { data: pool, isLoading, error } = useGetPoolById(poolId);
  const updatePoolMutation = useUpdatePool();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PoolFormValues>({
    resolver: yupResolver(poolFormSchema),
    defaultValues,
  });

  const coverImageUrl = watch("coverImageUrl");
  const amenitiesValues = watch("amenities");
  const galleryImages = watch("gallery");

  const appendAmenity = (value = "") => {
    const next = [...(amenitiesValues ?? []), value];
    setValue("amenities", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeAmenity = (index: number) => {
    const current = amenitiesValues ?? [];
    const next = current.filter((_, i) => i !== index);
    setValue("amenities", next.length ? next : [""], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeGallery = (index: number) => {
    const current = galleryImages ?? [];
    const next = current.filter((_, i) => i !== index);
    setValue("gallery", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    const selectedPool = pool as PoolRecord | undefined;

    if (!selectedPool) {
      reset(defaultValues);
      return;
    }

    reset({
      name: selectedPool.name ?? "",
      capacity: selectedPool.capacity ?? 0,
      dayRate: selectedPool.rates?.day ?? 0,
      nightRate: selectedPool.rates?.night ?? 0,
      amenities: normalizeStringArray(selectedPool.amenities).length
        ? normalizeStringArray(selectedPool.amenities)
        : [""],
      coverImageUrl: selectedPool.cover_image_url ?? "",
      gallery: normalizeStringArray(selectedPool.gallery),
    });
  }, [pool, reset]);

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !poolId) {
      return;
    }

    try {
      setIsUploadingCover(true);
      const uploadedUrl = await poolService.uploadPoolImage(
        file,
        poolId,
        "cover",
      );
      setValue("coverImageUrl", uploadedUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (uploadError) {
      console.error(uploadError);
    } finally {
      setIsUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !poolId) {
      return;
    }

    try {
      setIsUploadingGallery(true);

      const uploadedUrls = await Promise.all(
        files.map((file) =>
          poolService.uploadPoolImage(file, poolId, "gallery"),
        ),
      );

      setValue("gallery", [...(galleryImages ?? []), ...uploadedUrls], {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (uploadError) {
      console.error(uploadError);
    } finally {
      setIsUploadingGallery(false);
      event.target.value = "";
    }
  };

  const onSubmit = (values: PoolFormValues) => {
    if (!poolId) {
      return;
    }

    updatePoolMutation.mutate({ id: poolId, values });
  };

  if (isLoading) {
    return <div className="p-6 text-blue-600">Loading pool details...</div>;
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  if (error || !poolId) {
    return <div className="p-6 text-red-500">Error: {errorMessage}</div>;
  }

  const selectedPool = pool as PoolRecord | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pool Editor</h2>
          <p className="text-sm text-muted-foreground">
            Editing{" "}
            {selectedPool ? `Pool #${selectedPool.pool_number}` : "Pool"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/pools-rates">Back to Pools & Rates</Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Pool Name
            </label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="capacity" className="text-sm font-medium">
                Capacity (pax)
              </label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-xs text-red-500">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="dayRate" className="text-sm font-medium">
                Day Rate
              </label>
              <Input
                id="dayRate"
                type="number"
                {...register("dayRate", { valueAsNumber: true })}
              />
              {errors.dayRate && (
                <p className="text-xs text-red-500">{errors.dayRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="nightRate" className="text-sm font-medium">
                Night Rate
              </label>
              <Input
                id="nightRate"
                type="number"
                {...register("nightRate", { valueAsNumber: true })}
              />
              {errors.nightRate && (
                <p className="text-xs text-red-500">
                  {errors.nightRate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Amenities</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAmenity("")}
              >
                Add Amenity
              </Button>
            </div>

            {(amenitiesValues ?? []).map((_, index) => (
              <div key={`amenity-${index}`} className="flex items-center gap-2">
                <Input
                  placeholder={`Amenity ${index + 1}`}
                  {...register(`amenities.${index}` as const)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAmenity(index)}
                  disabled={(amenitiesValues ?? []).length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="coverUpload" className="text-sm font-medium">
              Cover Photo
            </label>
            <Input
              id="coverUpload"
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
            {isUploadingCover && (
              <p className="text-xs text-blue-600">Uploading cover image...</p>
            )}

            {coverImageUrl && (
              <div className="rounded-md border border-slate-200 p-2 space-y-2">
                <img
                  src={coverImageUrl}
                  alt="Pool cover"
                  className="h-36 w-full rounded object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setValue("coverImageUrl", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  Remove cover
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="galleryUpload" className="text-sm font-medium">
              Gallery Photos
            </label>
            <Input
              id="galleryUpload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              disabled={isUploadingGallery}
            />
            {isUploadingGallery && (
              <p className="text-xs text-blue-600">
                Uploading gallery images...
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(galleryImages ?? []).map((imageUrl, index) => (
                <div
                  key={`gallery-${index}`}
                  className="rounded-md border border-slate-200 p-2 space-y-2"
                >
                  <div className="text-[11px] font-medium text-slate-500">
                    #{index + 1}
                  </div>
                  <img
                    src={imageUrl}
                    alt={`Gallery ${index + 1}`}
                    className="h-24 w-full rounded object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => removeGallery(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {updatePoolMutation.error instanceof Error && (
            <p className="text-sm text-red-500">
              Failed to save: {updatePoolMutation.error.message}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={updatePoolMutation.isPending}>
              {updatePoolMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
