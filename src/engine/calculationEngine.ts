import type { CalculatorState, CalculationResult } from '../types/calculator';
import { roundPrice } from '../utils/mathUtils';

export function calculate3DPrintCost(state: CalculatorState): CalculationResult {
  const validationErrors: CalculationResult['validationErrors'] = {};

  // 1. MATERIAL COST
  const filamentResults = state.filaments.map((f) => {
    const grams = Math.max(0, Number(f.usedGrams) || 0);
    const costPerKg = Math.max(0, Number(f.costPerKg) || 0);
    const cost = (grams / 1000) * costPerKg;
    return {
      id: f.id,
      name: f.name || 'Filament',
      usedGrams: grams,
      costPerKg: costPerKg,
      cost: cost,
    };
  });

  const totalMaterialCost = filamentResults.reduce((sum, item) => sum + item.cost, 0);

  // 2. ELECTRICITY COST
  const electricityConfig = state.electricity;
  const ratePerKwh = Math.max(0, Number(electricityConfig.ratePerKwh) || 0);
  let calculatedKwh = 0;
  let electricityCost = 0;

  if (electricityConfig.mode === 'manual') {
    calculatedKwh = Math.max(0, Number(electricityConfig.manualKwh) || 0);
    electricityCost = calculatedKwh * ratePerKwh;
  } else {
    const watts = Math.max(0, Number(electricityConfig.printerWatts) || 0);
    const hours = Math.max(0, Number(electricityConfig.printHours) || 0);
    const mins = Math.max(0, Number(electricityConfig.printMinutes) || 0);
    const totalHours = hours + mins / 60;
    calculatedKwh = (watts * totalHours) / 1000;
    electricityCost = calculatedKwh * ratePerKwh;
  }

  // 3. OPERATING COSTS
  const machineWear = Math.max(0, Number(state.operatingCosts.machineWear) || 0);
  const labour = Math.max(0, Number(state.operatingCosts.labour) || 0);
  const postProcessing = Math.max(0, Number(state.operatingCosts.postProcessing) || 0);
  const packaging = Math.max(0, Number(state.operatingCosts.packaging) || 0);
  const other = Math.max(0, Number(state.operatingCosts.other) || 0);

  const operatingCost = machineWear + labour + postProcessing + packaging + other;

  // 4. BASE PRODUCTION COST
  const baseProductionCost = totalMaterialCost + electricityCost + operatingCost;

  // 5. PROFIT & SELLING PRICE BEFORE DISCOUNT
  let profitAmount = 0;
  let sellingPriceBeforeDiscount = baseProductionCost;
  let effectiveMarkupPercent = 0;
  let effectiveMarginPercent = 0;

  const profitVal = Math.max(0, Number(state.profit.value) || 0);

  if (state.profit.mode === 'markup') {
    effectiveMarkupPercent = profitVal;
    profitAmount = baseProductionCost * (effectiveMarkupPercent / 100);
    sellingPriceBeforeDiscount = baseProductionCost + profitAmount;
    effectiveMarginPercent =
      sellingPriceBeforeDiscount > 0 ? (profitAmount / sellingPriceBeforeDiscount) * 100 : 0;
  } else if (state.profit.mode === 'margin') {
    if (profitVal >= 100) {
      validationErrors.profitError = 'Margin must be less than 100%. Capped at 99.9%.';
      effectiveMarginPercent = 99.9;
    } else {
      effectiveMarginPercent = profitVal;
    }

    const marginFactor = 1 - effectiveMarginPercent / 100;
    sellingPriceBeforeDiscount = marginFactor > 0 ? baseProductionCost / marginFactor : baseProductionCost;
    profitAmount = sellingPriceBeforeDiscount - baseProductionCost;
    effectiveMarkupPercent =
      baseProductionCost > 0 ? (profitAmount / baseProductionCost) * 100 : 0;
  } else {
    // Fixed Profit amount
    profitAmount = profitVal;
    sellingPriceBeforeDiscount = baseProductionCost + profitAmount;
    effectiveMarkupPercent =
      baseProductionCost > 0 ? (profitAmount / baseProductionCost) * 100 : 0;
    effectiveMarginPercent =
      sellingPriceBeforeDiscount > 0 ? (profitAmount / sellingPriceBeforeDiscount) * 100 : 0;
  }

  // 6. DISCOUNT CALCULATION
  let discountAmount = 0;
  const discountVal = Math.max(0, Number(state.discount.value) || 0);

  if (state.discount.mode === 'percentage') {
    const discountPct = Math.min(100, discountVal);
    if (discountVal > 100) {
      validationErrors.discountError = 'Discount percentage cannot exceed 100%.';
    }
    discountAmount = sellingPriceBeforeDiscount * (discountPct / 100);
  } else {
    discountAmount = discountVal;
    if (discountAmount > sellingPriceBeforeDiscount && sellingPriceBeforeDiscount > 0) {
      validationErrors.discountError = 'Discount amount exceeds selling price!';
    }
  }

  const sellingPriceAfterDiscount = Math.max(0, sellingPriceBeforeDiscount - discountAmount);

  // 7. PRICE ROUNDING
  const finalSellingPrice = roundPrice(sellingPriceAfterDiscount, state.rounding);
  const roundingAdjustment = finalSellingPrice - sellingPriceAfterDiscount;

  // 8. POST-DISCOUNT TRUE PROFITABILITY
  const actualProfitAfterDiscount = finalSellingPrice - baseProductionCost;
  const actualMarginAfterDiscount =
    finalSellingPrice > 0 ? (actualProfitAfterDiscount / finalSellingPrice) * 100 : 0;
  const actualMarkupAfterDiscount =
    baseProductionCost > 0 ? (actualProfitAfterDiscount / baseProductionCost) * 100 : 0;

  // 9. BATCH / QUANTITY TOTALS
  const quantity = Math.max(1, Math.floor(Number(state.quantity) || 1));
  const totalProductionCost = baseProductionCost * quantity;
  const totalSellingPrice = finalSellingPrice * quantity;
  const totalProfit = actualProfitAfterDiscount * quantity;
  const totalDiscountAmount = discountAmount * quantity;

  return {
    filamentResults,
    totalMaterialCost,

    calculatedKwh,
    electricityCost,

    operatingCost,
    operatingBreakdown: {
      machineWear,
      labour,
      postProcessing,
      packaging,
      other,
    },

    baseProductionCost,

    profitAmount,
    sellingPriceBeforeDiscount,
    effectiveMarkupPercent,
    effectiveMarginPercent,

    discountAmount,
    sellingPriceAfterDiscount,

    finalSellingPrice,
    roundingAdjustment,

    actualProfitAfterDiscount,
    actualMarginAfterDiscount,
    actualMarkupAfterDiscount,

    quantity,
    totalProductionCost,
    totalSellingPrice,
    totalProfit,
    totalDiscountAmount,

    validationErrors,
  };
}
