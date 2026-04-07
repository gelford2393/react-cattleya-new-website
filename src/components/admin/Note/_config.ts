import * as yup from "yup";

export const noteEditorSchema = yup.object({
  content: yup.string().required("Content is required"),
});

export type NoteFormValues = yup.InferType<typeof noteEditorSchema>;
