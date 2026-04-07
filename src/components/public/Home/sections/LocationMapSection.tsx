import { Text } from "@/components/ui/text";

type LocationMapSectionProps = {
  locationMapHtml: string;
  hasLocationMapContent: boolean;
};

export function LocationMapSection({ locationMapHtml, hasLocationMapContent }: LocationMapSectionProps) {
  return (
    <>
      <h2 className="text-2xl font-bold">Location Map</h2>
      {hasLocationMapContent ? (
        <div
          className="mt-3 overflow-hidden text-sm leading-7 text-white/90 [&_a]:font-semibold [&_a]:underline [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_iframe]:min-h-[300px] [&_iframe]:w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: locationMapHtml }}
        />
      ) : (
        <Text as="p" className="mt-3 text-sm text-white/80">
          Location details will be posted soon.
        </Text>
      )}
    </>
  );
}
