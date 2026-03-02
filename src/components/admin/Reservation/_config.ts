import * as yup from "yup";

export type ReservationFormValues = {
  content: string;
};

export const reservationEditorSchema: yup.ObjectSchema<ReservationFormValues> =
  yup.object({
    content: yup.string().required("Content is required"),
  });

export type ReservationEditorValues = yup.InferType<
  typeof reservationEditorSchema
>;

export const reservationEditorDefaults: ReservationFormValues = {
  content: "",
};
