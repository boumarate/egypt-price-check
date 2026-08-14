"use client";

import { useCallback, useEffect, useState } from "react";
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
import { priceBands, type Zone } from "@/lib/pricing";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  zones: Zone[];
}

const ZONE_KEY = "zone-v1";
const CURRENCY_KEY = "currency-v1";

export default function ProductPage({ product, zones }: Props) {
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

  return (
    <div>
      {/* Same dark masthead as the home page, so moving between the two reads as one
          product rather than a styled cover page over plain inner pages. */}
      <section className="relative overflow-hidden bg-slate-950 pb-14 pt-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 right-[-10%] h-56 w-56 rounded-full bg-amber-500/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl px-4">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-slate-200">
            ← All prices
          </Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
            {product.name} <span className="text-slate-400">price in Egypt</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            About <strong className="text-amber-400">{product.baseline_egp} EGP</strong> in
            an Egyptian supermarket. Kiosks and tourist areas charge more — here is what
            counts as fair where you are.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-16">
      {/* Same compact pair as the home page, floating over the masthead edge. Both
          selects stay at 16px so iOS does not zoom the viewport on focus. */}
      <div className="sticky top-2 z-10 -mt-8 mb-5 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
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

      <ProductCard
        product={product}
        zone={zone}
        currency={currency}
        rates={rates}
        linkToDetail={false}
      />

      {/* Every region in one table. Useful in itself, and it is the concrete text a
          search engine can actually match against a query like "water price hurghada". */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">
          {product.name} price by area
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th scope="col" className="p-3 text-left font-semibold">Area</th>
                <th scope="col" className="p-3 text-right font-semibold">Fair price</th>
                <th scope="col" className="p-3 text-right font-semibold">Too much</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => {
                const bands = priceBands(product.baseline_egp, z, product.price_marked === true);
                return (
                  <tr key={z.id} className="border-t border-slate-200 dark:border-slate-700">
                    <th scope="row" className="p-3 text-left font-medium">
                      {z.label}
                    </th>
                    <td className="p-3 text-right tabular-nums">
                      {Math.round(bands.fairLow)}–{Math.round(bands.fairHigh)} EGP
                    </td>
                    <td className="p-3 text-right tabular-nums text-rose-700 dark:text-rose-400">
                      over {Math.round(bands.highMax)} EGP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {product.price_marked
            ? "This pack has its official price printed on it, so the same price applies in every area."
            : `Supermarket baseline from Carrefour Egypt, verified ${product.updated}. Regional markups are estimates.`}
        </p>
      </section>

      <EmergencyNumbers />
      </div>
    </div>
  );
}
