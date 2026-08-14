import { describe, expect, it } from "vitest";
import {
  counterOffer,
  toArabicDigits,
  judgePrice,
  overchargeFactor,
  priceBands,
  type Zone,
} from "./pricing";

const cairo: Zone = {
  id: "cairo", label: "Cairo", note: "", multiplier: 1.0, source: "measured",
};
const sahel: Zone = {
  id: "sahel", label: "Sahel", note: "", multiplier: 2.0, source: "measured",
};

// Dasani 1.5L, scraped from Carrefour Egypt at 8.99 EGP; rounded for legible maths.
const WATER = 9;

describe("priceBands", () => {
  it("scales the baseline by the zone multiplier", () => {
    expect(priceBands(WATER, cairo)).toEqual({ fairLow: 9, fairHigh: 11.25, highMax: 14.4 });
    expect(priceBands(WATER, sahel)).toEqual({ fairLow: 18, fairHigh: 22.5, highMax: 28.8 });
  });

  it("rejects a non-positive baseline rather than emitting nonsense bands", () => {
    expect(() => priceBands(0, cairo)).toThrow(/positive/);
    expect(() => priceBands(-5, cairo)).toThrow(/positive/);
    expect(() => priceBands(Number.NaN, cairo)).toThrow(/positive/);
  });

  it("rejects a non-positive zone multiplier", () => {
    expect(() => priceBands(WATER, { ...cairo, multiplier: 0 })).toThrow(/positive/);
  });
});

describe("judgePrice", () => {
  // The whole point of the zone model: identical quote, opposite verdicts.
  it("calls 20 EGP overcharged in Cairo but fair in Sahel", () => {
    expect(judgePrice(20, WATER, cairo)).toBe("overcharged");
    expect(judgePrice(20, WATER, sahel)).toBe("fair");
  });

  it("calls 35 EGP overcharged in Cairo and overcharged in Sahel", () => {
    expect(judgePrice(35, WATER, cairo)).toBe("overcharged");
    expect(judgePrice(35, WATER, sahel)).toBe("overcharged");
  });

  it("treats the supermarket price itself as fair", () => {
    expect(judgePrice(WATER, WATER, cairo)).toBe("fair");
  });

  it("is inclusive at each band boundary", () => {
    const { fairHigh, highMax } = priceBands(WATER, cairo);
    expect(judgePrice(fairHigh, WATER, cairo)).toBe("fair");
    expect(judgePrice(fairHigh + 0.01, WATER, cairo)).toBe("high");
    expect(judgePrice(highMax, WATER, cairo)).toBe("high");
    expect(judgePrice(highMax + 0.01, WATER, cairo)).toBe("overcharged");
  });
});

describe("counterOffer", () => {
  it("suggests the top of the fair range, rounded to whole EGP", () => {
    expect(counterOffer(WATER, cairo)).toBe(11);
    expect(counterOffer(WATER, sahel)).toBe(23);
  });
});

describe("overchargeFactor", () => {
  it("reports how many times the fair price a quote is", () => {
    expect(overchargeFactor(45, WATER, cairo)).toBe(5);
    expect(overchargeFactor(45, WATER, sahel)).toBe(2.5);
  });
});

describe("price-marked packs (سعر الجمهور)", () => {
  // Chipsy at 9.99 baseline has 10 printed on the bag.
  const CHIPS = 9.99;

  it("uses the printed price as the ceiling and ignores the zone", () => {
    expect(priceBands(CHIPS, cairo, true)).toEqual({ fairLow: 9.99, fairHigh: 10, highMax: 10 });
    // Identical in Sahel: the printed price applies nationwide.
    expect(priceBands(CHIPS, sahel, true)).toEqual(priceBands(CHIPS, cairo, true));
  });

  it("has no 'high but normal' band -- above the printed price is overcharged", () => {
    expect(judgePrice(10, CHIPS, cairo, true)).toBe("fair");
    expect(judgePrice(10.01, CHIPS, sahel, true)).toBe("overcharged");
    expect(judgePrice(12, CHIPS, cairo, true)).toBe("overcharged");
  });

  it("counter-offers the printed price itself", () => {
    expect(counterOffer(CHIPS, sahel, true)).toBe(10);
  });

  it("measures the overcharge factor against the printed price", () => {
    expect(overchargeFactor(20, CHIPS, sahel, true)).toBe(2);
  });

  it("keeps kiosk markup for unmarked products", () => {
    expect(judgePrice(12, CHIPS, cairo)).toBe("fair");
  });
});

describe("toArabicDigits", () => {
  it("renders the digits a tourist must find on the pack", () => {
    expect(toArabicDigits(10)).toBe("١٠");
    expect(toArabicDigits(7)).toBe("٧");
    expect(toArabicDigits(12.5)).toBe("١٢.٥");
  });
});

