import * as yup from "yup";

export const contactUsEditorSchema = yup.object({
  content: yup.string().required("Content is required"),
});

export type ContactUsFormValues = yup.InferType<typeof contactUsEditorSchema>;
