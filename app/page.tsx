import PriceChecker from "@/components/PriceChecker";
import { FaqJsonLd, SiteJsonLd } from "@/components/StructuredData";
import productsData from "@/data/products.json";
import zonesData from "@/data/zones.json";
import { priceBands, printedPrice, type Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

// Data is imported at build time and inlined into the bundle, so the page needs no
// network at runtime and keeps working offline once cached.
const products = productsData as Product[];
const zones = zonesData as Zone[];

/**
 * The homepage FAQ answers the head queries ("how much does water cost in Egypt") with
 * this build's actual numbers, so the text refreshes with every weekly scrape instead of
 * rotting like the decade-old forum threads that currently rank for these questions.
 */
function buildFaq() {
  const cairo = zones[0];
  const byId = (id: string) => products.find((p) => p.id === id);
  const water = byId("aqua-delta-600ml") ?? products[0];
  const bigWater = byId("dasani-15l");
  const coke = byId("coke-glass");
  const chips = byId("chipsy");

  const waterBands = priceBands(water.baseline_egp, cairo, water.price_marked);
  const faq = [
    {
      q: "How much does a bottle of water cost in Egypt?",
      a:
        `A small (600ml) local bottle is about ${Math.round(waterBands.fairLow)}–${Math.round(waterBands.fairHigh)} EGP` +
        (bigWater ? `, and a 1.5 litre bottle about ${Math.round(priceBands(bigWater.baseline_egp, cairo, bigWater.price_marked).fairHigh)} EGP` : "") +
        `. At tourist sites you may be asked for several times that — anything above ` +
        `${Math.round(waterBands.highMax)} EGP for a small bottle is overcharging.`,
    },
    coke && {
      q: "How much is a Coca-Cola in Egypt?",
      a: `A classic glass bottle is about ${coke.baseline_egp} EGP in a shop; a fair kiosk price is up to ${Math.round(priceBands(coke.baseline_egp, cairo).fairHigh)} EGP.`,
    },
    chips && {
      q: "Why is the price printed on some Egyptian products?",
      a:
        `Many Egyptian-made snacks and drinks carry the official price printed on the pack ` +
        `in Arabic digits (١٠ means 10). For example ${chips.name} is printed ` +
        `${printedPrice(chips.baseline_egp)} EGP. That number applies everywhere in Egypt — ` +
        `paying more is overcharging, and you can point at it when a shop asks for more.`,
    },
    {
      q: "Are prices higher in Hurghada, Sharm El-Sheikh or the North Coast?",
      a:
        `Supermarkets and ordinary shops charge roughly the same nationwide — we measured ` +
        `identical prices in Cairo and North Coast branches of the same chain. The markup ` +
        `happens at stalls inside tourist attractions, hotel shops and airports, not in a ` +
        `region as a whole.`,
    },
  ].filter(Boolean) as { q: string; a: string }[];
  return faq;
}

export default function Home() {
  const faq = buildFaq();
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteJsonLd />
      <FaqJsonLd faq={faq} />
      <PriceChecker products={products} zones={zones} />

      {/* Visible, server-rendered, and sourced from the same array as the schema above. */}
      <section className="mx-auto max-w-2xl px-4 pb-16">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">
          Common questions
        </h2>
        <div className="space-y-2">
          {faq.map((item) => (
            <details
              key={item.q}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
            >
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-50">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
