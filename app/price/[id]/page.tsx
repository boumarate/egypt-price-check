import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPage from "@/components/ProductPage";
import {
  BreadcrumbJsonLd,
  FaqJsonLd,
  ProductJsonLd,
} from "@/components/StructuredData";
import productsData from "@/data/products.json";
import zonesData from "@/data/zones.json";
import { absolute, SITE_NAME } from "@/lib/site";
import { priceBands, printedPrice, type Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

const products = productsData as Product[];
const zones = zonesData as Zone[];

/**
 * One static page per product.
 *
 * Search intent here is specific -- people type "how much is a coke in egypt", not
 * "egypt prices" -- and a single page cannot rank for sixteen different products at
 * once. Each of these carries its own title, description and structured data.
 */
export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

// Next 15+ passes params as a Promise. Destructuring it synchronously yields undefined,
// so every lookup here silently missed and the page fell back to the layout's metadata.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) return {};

  const cairo = zones[0];
  const bands = priceBands(product.baseline_egp, cairo);
  const title = `${product.name} price in Egypt — what should it cost?`;
  const description =
    `A ${product.name} costs about ${product.baseline_egp} EGP in an Egyptian supermarket. ` +
    `A fair kiosk price is ${Math.round(bands.fairLow)}–${Math.round(bands.fairHigh)} EGP; ` +
    `above ${Math.round(bands.highMax)} EGP you are being overcharged. ` +
    `Prices adjusted for tourist areas and shown in your own currency.`;

  return {
    title,
    description,
    alternates: { canonical: absolute(`/price/${product.id}`) },
    openGraph: {
      title,
      description,
      url: absolute(`/price/${product.id}`),
      siteName: SITE_NAME,
      type: "article",
      images: product.image ? [{ url: absolute(product.image) }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: product.image ? [absolute(product.image)] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  // The questions people literally type into Google, answered with this build's data.
  // Rendered visibly by ProductPage and emitted as FAQPage schema from the same array,
  // so the markup can never claim something the page does not say.
  const cairoBands = priceBands(product.baseline_egp, zones[0], product.price_marked);
  const resort = zones.find((z) => z.id === "redsea") ?? zones[zones.length - 1];
  const resortBands = priceBands(product.baseline_egp, resort, product.price_marked);
  const faq = [
    {
      q: `How much does a ${product.name} cost in Egypt?`,
      a: product.price_marked
        ? `${printedPrice(product.baseline_egp)} EGP — the price is printed on the pack ` +
          `(look for the Arabic digits) and applies everywhere in Egypt.`
        : `About ${product.baseline_egp} EGP in a supermarket. A fair price at a kiosk or ` +
          `small shop is ${Math.round(cairoBands.fairLow)}–${Math.round(cairoBands.fairHigh)} EGP; ` +
          `above ${Math.round(cairoBands.highMax)} EGP you are being overcharged.`,
    },
    {
      q: `Is a ${product.name} more expensive in Hurghada or Sharm El-Sheikh?`,
      a: product.price_marked
        ? `No — the printed price applies nationwide, in resort towns as in Cairo. ` +
          `Anything above it is overcharging, not a regional price.`
        : `Slightly. Expect ${Math.round(resortBands.fairLow)}–${Math.round(resortBands.fairHigh)} EGP ` +
          `in resort areas, against ${Math.round(cairoBands.fairLow)}–${Math.round(cairoBands.fairHigh)} EGP in Cairo. ` +
          `Refuse anything above ${Math.round(resortBands.highMax)} EGP.`,
    },
    {
      q: "What should I do if a shop asks for more?",
      a: product.price_marked
        ? `Point at the price printed on the packaging and pay that, or buy elsewhere. ` +
          `Persistent overcharging can be reported to the tourism hotline on 19654.`
        : `Offer ${Math.round(cairoBands.fairHigh)} EGP and walk away if refused — the next ` +
          `kiosk is rarely far. Persistent overcharging can be reported on 19654.`,
    },
  ];

  // Same aisle, so a reader comparing bottles can hop without going back to the grid --
  // and crawlers reach every page from every related page.
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ProductJsonLd product={product} zone={zones[0]} />
      <BreadcrumbJsonLd name={product.name} id={product.id} />
      <FaqJsonLd faq={faq} />
      {/* ProductPage owns the full-bleed masthead, so the width constraint lives inside
          it rather than here -- same structure as the home page. */}
      <ProductPage product={product} zones={zones} faq={faq} related={related} />
    </main>
  );
}
