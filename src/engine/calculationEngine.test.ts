import { describe, it, expect } from 'vitest';
import { calculate3DPrintCost } from './calculationEngine';
import type { CalculatorState } from '../types/calculator';

describe('3D Print Cost Calculation Engine', () => {
  const sampleState: CalculatorState = {
    productName: 'Custom Desk Organizer',
    dimensions: [
      {
        id: 'dim-1',
        name: 'Main Body',
        lengthMm: 150,
        widthMm: 100,
        heightMm: 60,
        diameterMm: 0,
      },
    ],
    filaments: [
      {
        id: '1',
        name: 'PLA Black',
        usedGrams: 264,
        costPerKg: 1399,
      },
    ],
    electricity: {
      mode: 'manual',
      manualKwh: 0.8,
      printerWatts: 120,
      printHours: 5,
      printMinutes: 0,
      ratePerKwh: 15,
    },
    operatingCosts: {
      machineWear: 25,
      labour: 40,
      postProcessing: 0,
      packaging: 25,
      other: 0,
    },
    profit: {
      mode: 'markup',
      value: 25,
    },
    discount: {
      mode: 'percentage',
      value: 10,
    },
    rounding: {
      mode: 'none',
      customStep: 10,
    },
    quantity: 1,
  };

  it('calculates sample default values correctly', () => {
    const result = calculate3DPrintCost(sampleState);

    // Material Cost: 264g / 1000 * 1399 = 369.336
    expect(result.totalMaterialCost).toBeCloseTo(369.336, 2);

    // Electricity: 0.8 * 15 = 12
    expect(result.electricityCost).toBe(12);

    // Operating Cost: 25 + 40 + 0 + 25 + 0 = 90
    expect(result.operatingCost).toBe(90);

    // Base Production Cost: 369.336 + 12 + 90 = 471.336
    expect(result.baseProductionCost).toBeCloseTo(471.336, 2);

    // Profit: 25% Markup on 471.336 = 117.834
    expect(result.profitAmount).toBeCloseTo(117.834, 2);

    // Selling Price Before Discount: 471.336 + 117.834 = 589.17
    expect(result.sellingPriceBeforeDiscount).toBeCloseTo(589.17, 2);

    // Discount: 10% on 589.17 = 58.917
    expect(result.discountAmount).toBeCloseTo(58.917, 2);

    // Final Selling Price: 589.17 - 58.917 = 530.253
    expect(result.finalSellingPrice).toBeCloseTo(530.253, 2);

    // Actual Profit after discount: 530.253 - 471.336 = 58.917
    expect(result.actualProfitAfterDiscount).toBeCloseTo(58.917, 2);
  });

  it('correctly calculates Profit Margin (Selling Price = Production Cost / (1 - Margin%))', () => {
    const state: CalculatorState = {
      ...sampleState,
      filaments: [{ id: '1', name: 'PLA', usedGrams: 0, costPerKg: 0 }],
      electricity: { ...sampleState.electricity, manualKwh: 0, ratePerKwh: 0 },
      operatingCosts: { machineWear: 500, labour: 0, postProcessing: 0, packaging: 0, other: 0 },
      profit: { mode: 'margin', value: 25 }, // 25% margin
      discount: { mode: 'percentage', value: 0 },
    };

    const result = calculate3DPrintCost(state);

    // Production Cost = 500
    expect(result.baseProductionCost).toBe(500);

    // Selling Price = 500 / (1 - 0.25) = 666.67
    expect(result.sellingPriceBeforeDiscount).toBeCloseTo(666.666, 2);

    // Profit Amount = 666.666 - 500 = 166.666
    expect(result.profitAmount).toBeCloseTo(166.666, 2);

    // Margin = 166.666 / 666.666 = 25%
    expect(result.effectiveMarginPercent).toBeCloseTo(25, 2);
  });

  it('calculates wattage and print time electricity cost correctly', () => {
    const state: CalculatorState = {
      ...sampleState,
      electricity: {
        mode: 'calculated',
        manualKwh: 0,
        printerWatts: 120,
        printHours: 5,
        printMinutes: 0, // 5 hours @ 120W = 600Wh = 0.6kWh
        ratePerKwh: 15,
      },
    };

    const result = calculate3DPrintCost(state);

    expect(result.calculatedKwh).toBeCloseTo(0.6, 2);
    expect(result.electricityCost).toBe(9); // 0.6 * 15 = 9
  });

  it('supports multi-filament material calculation', () => {
    const state: CalculatorState = {
      ...sampleState,
      filaments: [
        { id: '1', name: 'PLA Black', usedGrams: 100, costPerKg: 1399 }, // 139.9
        { id: '2', name: 'PLA White', usedGrams: 50, costPerKg: 1499 },  // 74.95
        { id: '3', name: 'PETG', usedGrams: 75, costPerKg: 1599 },       // 119.925
      ],
    };

    const result = calculate3DPrintCost(state);

    // Total material: 139.9 + 74.95 + 119.925 = 334.775
    expect(result.totalMaterialCost).toBeCloseTo(334.775, 2);
    expect(result.filamentResults).toHaveLength(3);
  });

  it('applies rounding to nearest 10 properly', () => {
    const state: CalculatorState = {
      ...sampleState,
      rounding: { mode: '10', customStep: 10 },
    };

    const result = calculate3DPrintCost(state);

    // Unrounded price was ~530.25 -> Nearest 10 is 530
    expect(result.finalSellingPrice).toBe(530);
  });

  it('calculates quantity batch multiplier correctly', () => {
    const state: CalculatorState = {
      ...sampleState,
      quantity: 10,
    };

    const result = calculate3DPrintCost(state);

    expect(result.quantity).toBe(10);
    expect(result.totalProductionCost).toBeCloseTo(result.baseProductionCost * 10, 2);
    expect(result.totalSellingPrice).toBeCloseTo(result.finalSellingPrice * 10, 2);
    expect(result.totalProfit).toBeCloseTo(result.actualProfitAfterDiscount * 10, 2);
  });
});
