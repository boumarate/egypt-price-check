"use client";

import Link from "next/link";
import { convert, formatMoney, type CurrencyCode } from "@/lib/currency";
import { priceBands, printedPrice, toArabicDigits, type Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

/**
 * Compact browse tile: photo, name, fair price. Tapping opens the product's own page,
 * where the full card with the price check lives.
 *
 * The full card is ~370px tall, which put two products on a phone screen and made 42 of
 * them a scroll marathon. A two-up grid of tiles shows six to eight, and costs nothing:
 * every product page is prerendered and sits in the offline cache, so the tap-through is
 * instant even with no signal.
 */
export default function ProductTile({
  product,
  zone,
  currency,
  rates,
}: {
  product: Product;
  zone: Zone;
  currency: CurrencyCode;
  rates: Record<string, number>;
}) {
  const marked = product.price_marked === true;
  const bands = priceBands(product.baseline_egp, zone, marked);
  const money = (egp: number) => formatMoney(convert(egp, currency, rates), currency);

  return (
    <Link
      href={`/price/${product.id}`}
      className="group flex flex-col rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-900/5
                 transition hover:shadow-md hover:ring-slate-900/10
                 dark:bg-slate-900 dark:ring-white/10 dark:hover:ring-white/20"
    >
      <div className="relative mb-2 flex h-28 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
        {product.image ? (
          // Static export with images.unoptimized: next/image would add JS, not bytes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            loading="lazy"
            className="max-h-24 max-w-[80%] object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <span aria-hidden="true" className="text-3xl">
            🛒
          </span>
        )}
        {marked && (
          // The price is printed on the pack; surface the glyphs to look for right on
          // the tile, since that is the fastest possible verification.
          <span className="absolute right-1.5 top-1.5 rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[11px] font-bold text-slate-950">
            <bdi lang="ar">{toArabicDigits(printedPrice(product.baseline_egp))}</bdi> on
            pack
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold leading-tight text-slate-900 dark:text-slate-50">
        {product.name}
      </h3>

      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-base font-black tabular-nums text-emerald-700 dark:text-emerald-400">
          {marked
            ? money(printedPrice(product.baseline_egp))
            : `${money(bands.fairLow)}–${money(bands.fairHigh)}`}
        </span>
        <span className="text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
          {marked
            ? `${printedPrice(product.baseline_egp)} EGP`
            : `${Math.round(bands.fairLow)}–${Math.round(bands.fairHigh)} EGP`}
        </span>
      </p>
    </Link>
  );
}
