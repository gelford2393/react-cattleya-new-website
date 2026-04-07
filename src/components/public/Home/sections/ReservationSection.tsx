import { Text } from "@/components/ui/text";

type ReservationSectionProps = {
  reservationHtml: string;
  hasReservationContent: boolean;
};

export function ReservationSection({ reservationHtml, hasReservationContent }: ReservationSectionProps) {
  return (
    <>
      <h2 className="text-2xl font-bold">Reservation</h2>
      {hasReservationContent ? (
        <div
          className="mt-3 text-sm leading-7 text-white/90 [&_a]:font-semibold [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: reservationHtml }}
        />
      ) : (
        <Text as="p" className="mt-3 text-sm text-white/80">
          Reservation details will be posted soon.
        </Text>
      )}
    </>
  );
}
