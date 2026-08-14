"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import {
  counterOffer,
  judgePrice,
  overchargeFactor,
  priceBands,
  type Verdict,
  type Zone,
} from "@/lib/pricing";
import { convert, formatMoney, type CurrencyCode } from "@/lib/currency";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  zone: Zone;
  currency: CurrencyCode;
  rates: Record<string, number>;
  /** False on the product's own page, where linking to itself is pointless. */
  linkToDetail?: boolean;
}

const VERDICT_STYLES: Record<Verdict, { box: string; label: string; icon: string }> = {
  fair: {
    box: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100",
    label: "Fair price",
    icon: "✓",
  },
  high: {
    box: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100",
    label: "High, but not a scam",
    icon: "!",
  },
  overcharged: {
    box: "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100",
    label: "Overcharged",
    icon: "✕",
  },
};

export default function ProductCard({
  product,
  zone,
  currency,
  rates,
  linkToDetail = true,
}: Props) {
  const [asked, setAsked] = useState("");

  const bands = priceBands(product.baseline_egp, zone);
  const askedNumber = Number.parseFloat(asked);
  const hasAsked = Number.isFinite(askedNumber) && askedNumber > 0;
  const verdict = hasAsked ? judgePrice(askedNumber, product.baseline_egp, zone) : null;

  const money = (egp: number) => formatMoney(convert(egp, currency, rates), currency);
  const showEgp = currency !== "EGP";

  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-md dark:bg-slate-900 dark:ring-white/10">
      {/* The photo is the fastest way to confirm this is the item in your hand -- brands
          and packaging differ, and so do their fair prices. */}
      <header className="mb-3 flex items-start gap-3">
        {product.image && (
          <ProductImage src={product.image} alt={product.source.product} />
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {linkToDetail ? (
              // Links the card to its own page. Without them the per-product pages are
              // orphans that only the sitemap knows about, which crawlers weight poorly.
              <Link href={`/price/${product.id}`} className="hover:underline">
                {product.name}
              </Link>
            ) : (
              product.name
            )}
          </h2>
          {/* The exact brand the price was taken from. "Local water 600ml" alone leaves a
              tourist unable to tell whether the bottle in their hand is the one priced. */}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {product.source.product}
          </p>
          {/* bdi rather than dir="rtl" on the block: the latter right-aligns the line, so
              the Arabic drifts to the far edge away from the English name it belongs to.
              bdi keeps the line left-aligned while still rendering the Arabic correctly. */}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <bdi lang="ar">{product.name_ar}</bdi>
          </p>
        </div>
      </header>

      {/* The answer, then the picture. The headline gives the fair range in the chosen
          currency with EGP beside it (what is physically handed over); the scale shows the
          same three bands spatially, which reads faster than three near-identical rows and
          gives the typed price somewhere to land. */}
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Fair</span>
        <span className="text-2xl font-black tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
          {money(bands.fairLow)} – {money(bands.fairHigh)}
        </span>
        {showEgp && (
          <span className="text-sm font-medium tabular-nums text-slate-500 dark:text-slate-400">
            {Math.round(bands.fairLow)}–{Math.round(bands.fairHigh)} EGP
          </span>
        )}
      </p>

      <PriceScale bands={bands} asked={hasAsked ? askedNumber : null} verdict={verdict} />

      {/* Optional price check. Purely local arithmetic -- nothing is sent anywhere. */}
      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
        <label
          htmlFor={`asked-${product.id}`}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          They&rsquo;re asking me…
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id={`asked-${product.id}`}
            type="number"
            inputMode="decimal"
            min="0"
            value={asked}
            onChange={(event) => setAsked(event.target.value)}
            placeholder="0"
            className="w-24 rounded-xl border border-slate-300 px-3 py-2.5 text-base tabular-nums
                       focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200
                       dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
          />
          <span className="text-lg font-medium text-slate-600 dark:text-slate-400">EGP</span>
        </div>

        {verdict && (
          <div
            role="status"
            className={`mt-3 rounded-xl border-2 p-3 ${VERDICT_STYLES[verdict].box}`}
          >
            <p className="flex items-center gap-2 font-bold">
              <span aria-hidden="true">{VERDICT_STYLES[verdict].icon}</span>
              {VERDICT_STYLES[verdict].label}
            </p>
            {verdict !== "fair" && (
              <p className="mt-1 text-sm">
                That&rsquo;s {overchargeFactor(askedNumber, product.baseline_egp, zone)}× the
                normal {zone.label} price. Offer{" "}
                <strong>{counterOffer(product.baseline_egp, zone)} EGP</strong>
                {verdict === "overcharged" ? " and walk away if refused." : "."}
              </p>
            )}
            {/* Only on the worst verdict, and worded for pressure rather than for a price
                disagreement -- telling someone to ring a hotline over a few pounds would be
                absurd and would waste a line meant for people who actually need it. */}
            {verdict === "overcharged" && (
              <p className="mt-2 text-xs">
                Being pressured, followed, or refused your change? Tourism hotline{" "}
                <a href="tel:19654" className="font-bold underline underline-offset-2">
                  19654
                </a>{" "}
                · Tourist Police{" "}
                <a href="tel:126" className="font-bold underline underline-offset-2">
                  126
                </a>
              </p>
            )}
          </div>
        )}

        {/* Shown only once a verdict exists. As static text it repeated on all 41 cards,
            which is where reassurance turns into noise -- and it matters at the moment
            someone has actually typed a price, not before. */}
        {verdict && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Worked out on your phone — nothing is sent anywhere.
          </p>
        )}
      </div>

      <footer className="mt-3 space-y-1 text-xs text-slate-400 dark:text-slate-500">
        <p>
          Baseline {product.baseline_egp} EGP · verified {product.updated}
          {zone.source === "estimate" && " · area markup is an estimate"}
        </p>
        {/* The app asks for trust in a number; linking the shop listings makes that
            number checkable instead. */}
        {product.sources && product.sources.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Check the price:</span>
            {product.sources.map((source) => (
              <a
                key={source.store}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${source.product} — ${source.price_egp} EGP`}
                className="underline decoration-dotted underline-offset-2 hover:text-sky-600 dark:hover:text-sky-400"
              >
                {source.store} {source.price_egp} EGP
              </a>
            ))}
          </p>
        )}
      </footer>
    </article>
  );
}

/**
 * The three price bands drawn as one horizontal scale, with the asked price as a marker.
 *
 * Three stacked rows reading "6-7", "up to 10", "over 10" make the reader do the spatial
 * work in their head. A scale does it visually: green is where a fair price lives, red is
 * where to walk away, and when a price is typed a marker drops onto the bar showing
 * exactly where the quote sits. The domain runs a little past highMax so an overcharged
 * marker has somewhere to land instead of pinning to the edge.
 */
function PriceScale({
  bands,
  asked,
  verdict,
}: {
  bands: { fairLow: number; fairHigh: number; highMax: number };
  asked: number | null;
  verdict: Verdict | null;
}) {
  const min = bands.fairLow * 0.85;
  const max = bands.highMax * 1.45;
  const pct = (v: number) =>
    Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));

  const fairEnd = pct(bands.fairHigh);
  const highEnd = pct(bands.highMax);
  const marker = asked !== null ? pct(asked) : null;
  const markerTone =
    verdict === "fair"
      ? "border-emerald-600 dark:border-emerald-400"
      : verdict === "high"
        ? "border-amber-500"
        : "border-rose-600 dark:border-rose-400";

  return (
    <div className="mt-2" aria-hidden="true">
      <div className="relative h-2.5 overflow-hidden rounded-full">
        <div className="absolute inset-y-0 left-0 bg-emerald-400/90 dark:bg-emerald-500/80"
             style={{ width: `${fairEnd}%` }} />
        <div className="absolute inset-y-0 bg-amber-400/90 dark:bg-amber-500/80"
             style={{ left: `${fairEnd}%`, width: `${highEnd - fairEnd}%` }} />
        <div className="absolute inset-y-0 right-0 bg-rose-400/90 dark:bg-rose-500/80"
             style={{ left: `${highEnd}%` }} />
        {marker !== null && (
          <div
            className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-white shadow transition-all duration-300 dark:bg-slate-900 ${markerTone}`}
            style={{ left: `${marker}%` }}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
        <span className="absolute -translate-x-1/2" style={{ left: `${pct(bands.fairLow)}%` }}>
          {Math.round(bands.fairLow)}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${highEnd}%` }}>
          {Math.round(bands.highMax)}
        </span>
        <span className="absolute right-0">EGP</span>
      </div>
    </div>
  );
}

