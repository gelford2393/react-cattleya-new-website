import * as yup from "yup";

export const poolRatesFormSchema = yup
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
  })
  .required();

export type PoolRatesFormValues = yup.InferType<typeof poolRatesFormSchema>;
