"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import ProductCard from "./ProductCard";
import EmergencyNumbers from "./EmergencyNumbers";
import { usePersisted } from "@/lib/usePersisted";
import {
  CURRENCIES,
  CURRENCY_GROUPS,
  FALLBACK_RATES,
  getRates,
  type CurrencyCode,
} from "@/lib/currency";
import type { Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  zones: Zone[];
}

const ZONE_KEY = "zone-v1";
const CURRENCY_KEY = "currency-v1";

export default function PriceChecker({ products, zones }: Props) {
  const [query, setQuery] = useState("");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  const isKnownZone = useCallback((id: string) => zones.some((z) => z.id === id), [zones]);
  const isKnownCurrency = useCallback(
    (code: string) => CURRENCIES.some((c) => c.code === code),
    [],
  );

  const [zoneId, setZoneId] = usePersisted(ZONE_KEY, zones[0].id, isKnownZone);
  const [currency, setCurrency] = usePersisted<CurrencyCode>(
    CURRENCY_KEY,
    "EUR",
    isKnownCurrency,
  );

  useEffect(() => {
    getRates().then(setRates);
  }, []);

  const zone = zones.find((z) => z.id === zoneId) ?? zones[0];

  // Tourists type "water", not "Mineral Water 1.5L", so aliases are weighted as highly
  // as the display name.
  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: [
          { name: "name", weight: 2 },
          { name: "aliases", weight: 2 },
          { name: "name_ar", weight: 1 },
          { name: "source.product", weight: 0.5 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      }),
    [products],
  );

  // With 41 products the flat list is long enough that browsing needs a shortcut, but a
  // search term should always win -- filtering someone's search by a stale category
  // selection looks like the search is broken.
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );
  const [category, setCategory] = useState<string | null>(null);

  const searched = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : products;
  const results =
    category && !query.trim() ? searched.filter((p) => p.category === category) : searched;

  return (
    <div>
      {/* Dark masthead continuing the nav's band, with soft amber glows for warmth. The
          search card overlaps its bottom edge -- the one pattern that most reads
          "designed product" rather than "form on a page". */}
      <section className="relative overflow-hidden bg-slate-950 pb-16 pt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-[-10%] h-56 w-56 rounded-full bg-amber-500/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-[-15%] h-64 w-64 rounded-full bg-orange-600/20 blur-3xl"
        />
        <header className="relative mx-auto max-w-2xl px-4">
          <h1 className="text-3xl font-black tracking-tight text-white">
            What should this{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              cost?
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Fair prices for Egypt, checked against real supermarkets weekly.
          </p>
        </header>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-16">
        {/*
          Controls are deliberately compact. Rendering the zones as wrapped pills pushed
          the first price 535px down a 667px phone -- four fifths of the screen was chrome
          before any content appeared. The cluster floats over the hero's bottom edge and
          stays sticky so the search never scrolls out of reach.
        */}
        <div className="sticky top-2 z-10 -mt-10 space-y-2 rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
          <label htmlFor="search" className="sr-only">
            Search for a product
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search: water, coke, chips…"
            className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3.5 text-base text-slate-900
                       placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400
                       dark:bg-slate-800 dark:text-slate-50"
          />

          <div className="flex flex-wrap gap-2">
            <div className="min-w-[9rem] flex-1">
              <label htmlFor="zone" className="sr-only">
                Where are you?
              </label>
              <select
                id="zone"
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                className="w-full rounded-xl border-0 bg-slate-100 px-3 py-2.5 text-base text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400
                           dark:bg-slate-800 dark:text-slate-50"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    📍 {z.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[9rem] flex-1">
              <label htmlFor="currency" className="sr-only">
                Show prices in
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="w-full rounded-xl border-0 bg-slate-100 px-3 py-2.5 text-base text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-amber-400
                           dark:bg-slate-800 dark:text-slate-50"
              >
                {CURRENCY_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {CURRENCIES.filter((c) => c.group === group).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{zone.note}</p>

      {/* Once, not on every card. `bdi` isolates the Arabic so the surrounding English
          punctuation stops being reordered -- inline it rendered as "them سعر)" with the
          brackets on the wrong sides. */}
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Tip: many Egyptian packs have the price printed on them{" "}
        <bdi lang="ar" dir="rtl">
          سعر الجمهور
        </bdi>{" "}
        — worth a look before you pay.
      </p>

      {/* Hidden while searching: the results are already narrowed, and leaving the chips
          active would silently hide matches the search found. */}
      {!query.trim() && (
        <div className="mt-3 flex flex-wrap gap-2">
          <CategoryChip
            label="All"
            active={category === null}
            onClick={() => setCategory(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            />
          ))}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nothing matches &ldquo;{query}&rdquo;. Try &ldquo;water&rdquo; or
            &ldquo;chips&rdquo;. Missing something?{" "}
            <Link href="/feedback" className="underline underline-offset-2">
              Tell me
            </Link>
            .
          </p>
        ) : (
          results.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              zone={zone}
              currency={currency}
              rates={rates}
            />
          ))
        )}
      </div>

        <EmergencyNumbers />
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-2 text-sm font-semibold capitalize transition ${
        active
          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-sm"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
