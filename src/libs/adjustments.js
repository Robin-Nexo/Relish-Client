/**
 * calculateAdjustments — Pure calculation engine for checkout adjustments.
 *
 * Calculation Order:
 *   1. Start with itemSubtotal (items + addons, with item-level discounts already applied)
 *   2. Apply Discounts (subtract)
 *   3. Apply Charges (add)
 *   4. Apply Taxes (add, last — calculated on post-charge total)
 *
 * @param {number} itemSubtotal
 * @param {Array} adjustments — all adjustment documents from Firestore
 * @returns {{ discounts, charges, taxes, adjustedTotal, breakdown }}
 */
export function calculateAdjustments(itemSubtotal, adjustments = []) {
  const active = adjustments.filter((a) => a.status === "active");

  const discounts = active.filter((a) => a.category === "discount");
  const charges = active.filter((a) => a.category === "charge");
  const taxes = active.filter((a) => a.category === "tax");

  const breakdown = [];
  let running = itemSubtotal;

  // Step 1: Apply Discounts
  let totalDiscountAmt = 0;
  for (const adj of discounts) {
    const amt = adj.type === "percentage"
      ? parseFloat(((running * adj.value) / 100).toFixed(2))
      : parseFloat(adj.value);
    const applied = adj.operation === "subtract" ? -Math.abs(amt) : Math.abs(amt);
    breakdown.push({ id: adj.id, name: adj.name, category: adj.category, type: adj.type, value: adj.value, amount: applied });
    running = parseFloat((running + applied).toFixed(2));
    totalDiscountAmt += Math.abs(applied);
  }

  // Step 2: Apply Charges
  let totalChargeAmt = 0;
  for (const adj of charges) {
    const amt = adj.type === "percentage"
      ? parseFloat(((running * adj.value) / 100).toFixed(2))
      : parseFloat(adj.value);
    const applied = adj.operation === "add" ? Math.abs(amt) : -Math.abs(amt);
    breakdown.push({ id: adj.id, name: adj.name, category: adj.category, type: adj.type, value: adj.value, amount: applied });
    running = parseFloat((running + applied).toFixed(2));
    totalChargeAmt += Math.abs(applied);
  }

  // Step 3: Apply Taxes (calculated on post-charge total)
  let totalTaxAmt = 0;
  for (const adj of taxes) {
    const amt = adj.type === "percentage"
      ? parseFloat(((running * adj.value) / 100).toFixed(2))
      : parseFloat(adj.value);
    const applied = adj.operation === "add" ? Math.abs(amt) : -Math.abs(amt);
    breakdown.push({ id: adj.id, name: adj.name, category: adj.category, type: adj.type, value: adj.value, amount: applied });
    running = parseFloat((running + applied).toFixed(2));
    totalTaxAmt += Math.abs(applied);
  }

  return {
    discountTotal: totalDiscountAmt,
    chargeTotal: totalChargeAmt,
    taxTotal: totalTaxAmt,
    adjustedTotal: Math.max(0, running),
    breakdown,
  };
}
