import { absolute, SITE_NAME, SITE_URL } from "@/lib/site";
import { priceBands, type Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/**
 * JSON-LD for search engines.
 *
 * The price published here is the ordinary Egyptian supermarket price with its source
 * listing attached -- it is a real, checkable offer, not a number invented to win a rich
 * result. Marking up the inflated "tourist" figure would be misrepresentation.
 */
export function ProductJsonLd({ product, zone }: { product: Product; zone: Zone }) {
  const bands = priceBands(product.baseline_egp, zone);
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    alternateName: product.name_ar,
    image: product.image ? absolute(product.image) : undefined,
    description: `Typical Egyptian retail price for ${product.name}. Fair kiosk range ${Math.round(bands.fairLow)}–${Math.round(bands.fairHigh)} EGP.`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EGP",
      lowPrice: product.baseline_egp,
      highPrice: Math.round(bands.highMax),
      offerCount: product.sources?.length ?? 1,
      url: product.source.url,
    },
  };
  return <JsonLd data={data} />;
}

/** Site-level identity, shown against the homepage. */
export function SiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Fair prices for everyday items in Egypt, adjusted by region and converted to your own currency.",
    inLanguage: ["en", "ar"],
  };
  return <JsonLd data={data} />;
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own committed data, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * FAQPage markup, fed by the same array that renders the visible questions.
 *
 * One source for both matters: schema that says things the page does not visibly say is
 * against Google's guidelines, and the visible text is the real ranking asset anyway --
 * these are the exact sentences people type into Google.
 */
export function FaqJsonLd({ faq }: { faq: { q: string; a: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <JsonLd data={data} />;
}

/** Breadcrumbs help engines understand the site shape and can show in results. */
export function BreadcrumbJsonLd({ name, id }: { name: string; id: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Egypt prices", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: absolute(`/price/${id}`) },
    ],
  };
  return <JsonLd data={data} />;
}

