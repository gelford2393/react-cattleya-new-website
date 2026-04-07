import * as yup from "yup";

export const locationMapEditorSchema = yup.object({
  content: yup.string().required("Content is required"),
});

export type LocationMapFormValues = yup.InferType<typeof locationMapEditorSchema>;