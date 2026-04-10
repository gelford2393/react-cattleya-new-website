import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor, type EditorHandle } from "@/components/ui/Editor";
import {
  normalizeStringArray,
  poolFormSchema,
  type PoolFormValues,
  type PoolRecord,
} from "./_config";
import { useGetPoolById } from "@/hooks/useGetPoolById";
import { useUpdatePool } from "@/hooks/useUpdatePool";
import { poolService } from "@/services/PoolServices/poolServices";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

const defaultValues: PoolFormValues = {
  name: "",
  capacity: 0,
  dayRate: 0,
  nightRate: 0,
  amenities: [""],
  notes: "",
  coverImageUrl: "",
  gallery: [],
};

export function PoolEditorForm() {
  const { poolId } = useParams();
  const { data: pool, isLoading, error } = useGetPoolById(poolId);
  const updatePoolMutation = useUpdatePool();
  const notesEditorRef = useRef<EditorHandle>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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
      notes: selectedPool.notes ?? "",
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
      toast.success("Cover image uploaded successfully!");
    } catch (uploadError) {
      console.error(uploadError);
      toast.error("Failed to upload cover image. Please try again.");
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
      toast.success("Gallery images uploaded successfully!");
    } catch (uploadError) {
      console.error(uploadError);
      toast.error("Failed to upload gallery images. Please try again.");
    } finally {
      setIsUploadingGallery(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (values: PoolFormValues) => {
    if (!poolId) {
      return;
    }

    await notesEditorRef.current?.uploadImages();
    const latestNotes = notesEditorRef.current?.getContent() ?? values.notes;

    updatePoolMutation.mutate({
      id: poolId,
      values: {
        ...values,
        notes: latestNotes,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3 mb-4" />
          <div className="rounded-xl border bg-white p-4 space-y-4">
            <Skeleton className="h-10 w-full mb-2" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full mt-4" />
            <Skeleton className="h-32 w-32 mt-4" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-32 w-32" />
              <Skeleton className="h-32 w-32" />
              <Skeleton className="h-32 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
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
            <FieldLabel htmlFor="name" className="text-sm font-medium">
              Pool Name
            </FieldLabel>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <FieldLabel htmlFor="capacity" className="text-sm font-medium">
                Capacity (pax)
              </FieldLabel>
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
              <FieldLabel htmlFor="dayRate" className="text-sm font-medium">
                Day Rate
              </FieldLabel>
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
              <FieldLabel htmlFor="nightRate" className="text-sm font-medium">
                Night Rate
              </FieldLabel>
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
              <FieldLabel className="text-sm font-medium">Amenities</FieldLabel>
            </div>

            {(amenitiesValues ?? []).map((_, index) => (
              <div key={`amenity-${index}`} className="flex items-center gap-2">
                <Input
                  placeholder={`Amenity ${index + 1}`}
                  {...register(`amenities.${index}` as const)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAmenity(index)}
                  disabled={(amenitiesValues ?? []).length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendAmenity("")}
              >
                Add Amenity
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="notes" className="text-sm font-medium">
              Pool Notes
            </FieldLabel>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Editor
                  ref={notesEditorRef}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  height={320}
                  mode="text"
                />
              )}
            />
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="coverUpload" className="text-sm font-medium">
              Cover Photo
            </FieldLabel>
            <Input
              id="coverUpload"
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
            {isUploadingCover && (
              <Skeleton className="h-8 w-full" />
            )}

            {coverImageUrl && (
              <div className="rounded-md border border-slate-200 p-2 space-y-2 w-40">
                <img
                  src={coverImageUrl}
                  alt="Pool cover"
                  className="h-36 w-36 rounded object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
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
            <FieldLabel htmlFor="galleryUpload" className="text-sm font-medium">
              Gallery Photos
            </FieldLabel>
            <Input
              id="galleryUpload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              disabled={isUploadingGallery}
            />
            {isUploadingGallery && (
              <Skeleton className="h-8 w-full" />
            )}

            <div className="flex flex-wrap gap-2 align-items-center">
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
                    className="h-32 w-32 rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-32"
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
