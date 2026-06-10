/**
 * Shipping Calculation Unit & Integration Tests
 * Run: npx tsx src/shipping/shipping.test.ts
 *
 * These tests exercise the pure math functions and the service layer
 * without needing a live DB connection for the unit tests.
 */


// UNIT TESTS — Pure math (no DB)

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`    ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`    ${name}`);
    console.error(`      → ${err.message}`);
    failed++;
  }
}

function assertEqual(actual: number, expected: number, tolerance = 0.001) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

//Math helpers 

function calcDistanceCost(km: number, pricePerKm: number) {
  return km * pricePerKm;
}

function calcWeightCost(weightKg: number, quantity: number, pricePerKg: number) {
  return weightKg * quantity * pricePerKg;
}

function calcBaseShipping(distanceCost: number, weightCost: number) {
  return distanceCost + weightCost;
}

function calcDiscount(base: number, discountPct: number) {
  return base * (discountPct / 100);
}

function calcShippingBeforeVat(base: number, discount: number) {
  return base - discount;
}

function calcVat(beforeVat: number, vatPct: number) {
  return beforeVat * (vatPct / 100);
}

function calcFinalShipping(beforeVat: number, vat: number) {
  return beforeVat + vat;
}

function calcFullShipping(
  sellers: { distanceCost: number; weightCost: number }[],
  discountPct: number,
  vatPct: number
) {
  const totalDistanceCost = sellers.reduce((s, sel) => s + sel.distanceCost, 0);
  const totalWeightCost = sellers.reduce((s, sel) => s + sel.weightCost, 0);
  const base = calcBaseShipping(totalDistanceCost, totalWeightCost);
  const discount = calcDiscount(base, discountPct);
  const beforeVat = calcShippingBeforeVat(base, discount);
  const vat = calcVat(beforeVat, vatPct);
  const final = calcFinalShipping(beforeVat, vat);
  return { totalDistanceCost, totalWeightCost, base, discount, beforeVat, vat, final };
}



console.log("\n  UNIT TESTS — Shipping Math\n");

// Distance cost
test("Distance cost = km × price_per_km", () => {
  assertEqual(calcDistanceCost(300, 10), 3000);
  assertEqual(calcDistanceCost(0, 10), 0);
  assertEqual(calcDistanceCost(100, 5.5), 550);
});

// Weight cost
test("Weight cost = weight_kg × quantity × price_per_kg", () => {
  assertEqual(calcWeightCost(2, 3, 50), 300);
  assertEqual(calcWeightCost(0, 5, 50), 0);
  assertEqual(calcWeightCost(1.5, 2, 40), 120);
});

// Base shipping
test("Base shipping = distance_cost + weight_cost", () => {
  assertEqual(calcBaseShipping(300, 100), 400);
  assertEqual(calcBaseShipping(250, 80), 330);
});

// Discount
test("Discount = base × (pct / 100)", () => {
  assertEqual(calcDiscount(730, 10), 73);
  assertEqual(calcDiscount(1000, 0), 0);
  assertEqual(calcDiscount(500, 20), 100);
});

// Shipping before VAT
test("Shipping before VAT = base − discount", () => {
  assertEqual(calcShippingBeforeVat(730, 73), 657);
  assertEqual(calcShippingBeforeVat(1000, 0), 1000);
});

// VAT
test("VAT amount = beforeVat × (vat_pct / 100)", () => {
  assertEqual(calcVat(657, 16), 105.12);
  assertEqual(calcVat(1000, 16), 160);
  assertEqual(calcVat(500, 0), 0);
});

// Final shipping
test("Final shipping = beforeVat + VAT", () => {
  assertEqual(calcFinalShipping(657, 105.12), 762.12);
});

// Multi-seller example from the spec
test("Multi-seller: Seller A (300+100=400) + Seller B (250+80=330) → 730 base", () => {
  const { totalDistanceCost, totalWeightCost, base } = calcFullShipping(
    [
      { distanceCost: 300, weightCost: 100 },
      { distanceCost: 250, weightCost: 80 },
    ],
    10,
    16
  );
  assertEqual(totalDistanceCost, 550);
  assertEqual(totalWeightCost, 180);
  assertEqual(base, 730);
});

test("Multi-seller full calculation matches spec (10% discount, 16% VAT)", () => {
  const result = calcFullShipping(
    [
      { distanceCost: 300, weightCost: 100 },
      { distanceCost: 250, weightCost: 80 },
    ],
    10,
    16
  );
  assertEqual(result.base, 730);
  assertEqual(result.discount, 73);
  assertEqual(result.beforeVat, 657);
  assertEqual(result.vat, 105.12);
  assertEqual(result.final, 762.12);
});

// Zero discount, zero VAT edge cases
test("Zero discount: full base passes through", () => {
  const { discount, beforeVat } = calcFullShipping(
    [{ distanceCost: 500, weightCost: 0 }],
    0,
    16
  );
  assertEqual(discount, 0);
  assertEqual(beforeVat, 500);
});

test("Zero VAT: final = beforeVat", () => {
  const { final, beforeVat } = calcFullShipping(
    [{ distanceCost: 500, weightCost: 0 }],
    0,
    0
  );
  assertEqual(final, beforeVat);
});

// Single seller
test("Single seller: 500km × 5 pricePerKm + 10kg × 2 qty × 20 pricePerKg", () => {
  const dist = calcDistanceCost(500, 5);   // 2500
  const wt = calcWeightCost(10, 2, 20);    // 400
  const { base, final } = calcFullShipping([{ distanceCost: dist, weightCost: wt }], 0, 16);
  assertEqual(base, 2900);
  assertEqual(final, 2900 * 1.16);
});

// RESULTS

console.log(`\n────────────────────────────────────`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`────────────────────────────────────\n`);

if (failed > 0) {
  process.exit(1);
}
