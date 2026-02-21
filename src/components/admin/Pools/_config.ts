import * as yup from "yup";

export const poolFormSchema = yup
  .object({
    name: yup.string().trim().required("Pool name is required"),
    capacity: yup
      .number()
      .typeError("Capacity must be a number")
      .integer("Capacity must be a whole number")
      .min(0, "Capacity cannot be negative")
      .required("Capacity is required"),
    dayRate: yup
      .number()
      .typeError("Day rate must be a number")
      .min(0, "Day rate cannot be negative")
      .required("Day rate is required"),
    nightRate: yup
      .number()
      .typeError("Night rate must be a number")
      .min(0, "Night rate cannot be negative")
      .required("Night rate is required"),
    amenities: yup
      .array()
      .of(yup.string().trim().required("Amenity cannot be empty"))
      .default([]),
    coverImageUrl: yup
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .url("Cover image must be a valid URL")
      .optional()
      .default(""),
    gallery: yup
      .array()
      .of(yup.string().trim().url("Gallery image must be a valid URL"))
      .default([]),
  })
  .required();

export type PoolFormValues = yup.InferType<typeof poolFormSchema>;
