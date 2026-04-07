import { MapPin, Phone } from "lucide-react";
import { FaFacebookF, FaFacebookMessenger, FaXTwitter } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

type PublicContactUsPanelProps = {
  contentHtml?: string | null;
  className?: string;
  compact?: boolean;
};

export function PublicContactUsPanel({
  contentHtml,
  className = "",
  compact = false,
}: PublicContactUsPanelProps) {
  const hasCmsContent = Boolean(contentHtml?.trim());
  const facebookPageUrl = "https://www.facebook.com/cattleyaresort";
  const facebookWidgetSrc =
    "https://www.facebook.com/plugins/page.php?href=" +
    encodeURIComponent(facebookPageUrl) +
    "&tabs=timeline&width=280&height=130&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false";
  const socialLinks = [
    {
      href: "https://m.me/cattleyaresort",
      label: "Messenger",
      Icon: FaFacebookMessenger,
    },
    {
      href: "https://www.facebook.com/cattleyaresort",
      label: "Facebook",
      Icon: FaFacebookF,
    },
    {
      href: "https://x.com/cattleyaresort",
      label: "Twitter",
      Icon: FaXTwitter,
    },
  ] as const satisfies ReadonlyArray<{
    href: string;
    label: string;
    Icon: IconType;
  }>;

  return (
    <aside
      id="contact"
      className={cn(
        "bg-[#4d9f44] p-5 text-sm text-white md:min-h-0",
        compact
          ? null
          : "rounded-xl border border-[#7bd26a]/40 shadow-[0_8px_30px_rgba(57,130,59,0.25)]",
        className,
      )}
    >
      <h2 className="text-2xl font-light">Contact Us</h2>

      {hasCmsContent ? (
        <div
          className="mt-4 text-xs leading-6 text-white/95 [&_a]:font-semibold [&_a]:underline [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4"
          dangerouslySetInnerHTML={{ __html: contentHtml ?? "" }}
        />
      ) : (
        <>
          <div className="mt-4 flex items-start gap-2 text-white/95">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Bo. Colaique, Sitio Ibabaw</p>
              <p>Brgy. San Roque</p>
              <p>Antipolo City, Philippines</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-white/95">
            <Phone className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Mon-Sun 8am-8pm</p>
              <p>(+63) 9697 070 670</p>
              <p>(+63) 8966 3839</p>
            </div>
          </div>

          <p className="mt-5 pt-4 text-xs leading-6 text-white/90">
            Email: info@cattlayaresort.com
          </p>
        </>
      )}

      <div className="mt-5 flex items-center gap-3 pt-4">
        {socialLinks.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="inline-flex items-center justify-center rounded-full border border-white/35 p-2 text-white transition hover:bg-white/15"
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-white/30 bg-white/95 p-1">
        <iframe
          title="Cattleya Resort Facebook"
          src={facebookWidgetSrc}
          width="100%"
          height="130"
          style={{ border: "none", overflow: "hidden" }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          loading="lazy"
        />
      </div>
    </aside>
  );
}
