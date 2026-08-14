/**
 * Fair-price maths for Egyptian tourist zones.
 *
 * The baseline is a normal Cairo supermarket price. Kiosks legitimately charge more
 * than a supermarket, and resort areas legitimately charge more than Cairo -- so a
 * verdict is only meaningful relative to *where the tourist is standing*. The same
 * 35 EGP quote is a rip-off in Cairo and completely fair in Sahel.
 */

export type Verdict = "fair" | "high" | "overcharged";

export interface Zone {
  id: string;
  label: string;
  /** Short plain-language hint shown under the zone picker. */
  note: string;
  multiplier: number;
  /**
   * Where the multiplier came from. "measured" is scraped data, "reported" is local
   * knowledge from someone who lives there, "estimate" is a judgement call and should be
   * labelled as such in the UI.
   */
  source: "measured" | "reported" | "estimate";
}

export interface PriceBands {
  /** Bottom of the fair range: baseline adjusted for the zone. */
  fairLow: number;
  /** Top of the fair range -- normal kiosk convenience markup. */
  fairHigh: number;
  /** Above this is overcharging rather than an expensive-but-real price. */
  highMax: number;
}

/** Kiosks charge more than supermarkets even at a fair price. */
const KIOSK_MARKUP = 1.25;
/** Beyond this multiple of the zone-adjusted baseline, it is a tourist price. */
const OVERCHARGE_THRESHOLD = 1.6;

/**
 * The printed price for a price-marked pack.
 *
 * Many Egyptian products carry سعر الجمهور printed on the packaging, and that number is
 * the official price everywhere in the country. Baselines scraped from Carrefour read
 * 9.99 where the pack says 10, so the printed figure is the ceiling of the baseline.
 */
export function printedPrice(baselineEgp: number): number {
  return Math.ceil(baselineEgp);
}

/**
 * Compute the fair / high / overcharged boundaries for a product in a zone.
 *
 * @param baselineEgp Normal Cairo supermarket price, in EGP.
 * @param zone The zone the tourist is buying in.
 */
export function priceBands(
  baselineEgp: number,
  zone: Zone,
  priceMarked = false,
): PriceBands {
  if (!Number.isFinite(baselineEgp) || baselineEgp <= 0) {
    throw new Error(`baselineEgp must be a positive number, got ${baselineEgp}`);
  }
  if (!Number.isFinite(zone.multiplier) || zone.multiplier <= 0) {
    throw new Error(`zone.multiplier must be positive, got ${zone.multiplier}`);
  }

  // A price-marked pack has its official price printed on it. No kiosk markup applies,
  // no zone multiplier applies -- the printed number is the price, in Sahel as in Cairo,
  // and anything above it is overcharging rather than "expensive but normal".
  if (priceMarked) {
    const printed = printedPrice(baselineEgp);
    return { fairLow: round2(baselineEgp), fairHigh: printed, highMax: printed };
  }

  const adjusted = baselineEgp * zone.multiplier;
  return {
    fairLow: round2(adjusted),
    fairHigh: round2(adjusted * KIOSK_MARKUP),
    highMax: round2(adjusted * OVERCHARGE_THRESHOLD),
  };
}

/** Classify a quoted price against the bands for a product and zone. */
export function judgePrice(
  askedEgp: number,
  baselineEgp: number,
  zone: Zone,
  priceMarked = false,
): Verdict {
  const bands = priceBands(baselineEgp, zone, priceMarked);
  if (askedEgp <= bands.fairHigh) return "fair";
  // No middle band for price-marked packs: above the printed number there is no
  // "high but normal" -- the pack itself says what it costs.
  if (!priceMarked && askedEgp <= bands.highMax) return "high";
  return "overcharged";
}

/**
 * What the tourist should counter-offer: the top of the fair range, which is a price
 * a kiosk will actually accept rather than an unrealistic supermarket price.
 */
export function counterOffer(
  baselineEgp: number,
  zone: Zone,
  priceMarked = false,
): number {
  return Math.round(priceBands(baselineEgp, zone, priceMarked).fairHigh);
}

/** How many times over the fair price a quote is, for phrasing the warning. */
export function overchargeFactor(
  askedEgp: number,
  baselineEgp: number,
  zone: Zone,
  priceMarked = false,
): number {
  const reference = priceMarked
    ? printedPrice(baselineEgp)
    : priceBands(baselineEgp, zone).fairLow;
  return round2(askedEgp / reference);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
