export interface FilamentItem {
  id: string;
  name: string;
  usedGrams: number;
  costPerKg: number;
}

export type ElectricityMode = 'manual' | 'calculated';

export interface ElectricityConfig {
  mode: ElectricityMode;
  manualKwh: number;
  printerWatts: number;
  printHours: number;
  printMinutes: number;
  ratePerKwh: number;
}

export interface OperatingCosts {
  machineWear: number;
  labour: number;
  postProcessing: number;
  packaging: number;
  other: number;
}

export type ProfitMode = 'markup' | 'margin' | 'fixed';

export interface ProfitConfig {
  mode: ProfitMode;
  value: number; // percentage for markup/margin, or currency amount for fixed
}

export type DiscountMode = 'percentage' | 'fixed';

export interface DiscountConfig {
  mode: DiscountMode;
  value: number;
}

export type RoundingMode = 'none' | '1' | '5' | '10' | '50' | 'custom';

export interface RoundingConfig {
  mode: RoundingMode;
  customStep: number;
}

export interface DimensionItem {
  id: string;
  name: string; // e.g. "Outer Shell", "Inner Tray", "Lid", "Main Body"
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  diameterMm: number;
}

export interface CategoryRates {
  filamentCostPerKg?: number;
  electricityRatePerKwh?: number;
  profitPercent?: number;
  profitMode?: ProfitMode;
  bulkQuantity?: number;
}

export interface CategoryAssignment {
  categoryId: string;
  subcategoryId?: string;
  // Category-specific overrides for this product:
  quantity?: number;
  profitPercent?: number;
  profitMode?: ProfitMode;
  filamentCostPerKg?: number;
  electricityRatePerKwh?: number;
  calculationResult?: CalculationResult;
}

export interface CalculatorState {
  productName: string;
  categoryId?: string;
  subcategoryId?: string;
  categoryAssignments?: CategoryAssignment[];
  productId?: string; // set if editing an existing product
  dimensions: DimensionItem[]; // Array supporting multi-part prints (Outer, Inner, Tray, Lid...)
  filaments: FilamentItem[];
  electricity: ElectricityConfig;
  operatingCosts: OperatingCosts;
  profit: ProfitConfig;
  discount: DiscountConfig;
  rounding: RoundingConfig;
  quantity: number;
}

export interface CalculationResult {
  // Filament breakdown
  filamentResults: {
    id: string;
    name: string;
    usedGrams: number;
    costPerKg: number;
    cost: number;
    totalBatchGrams: number;
    totalBatchKg: number;
  }[];
  totalMaterialCost: number;
  totalSingleUnitGrams: number;
  totalBatchFilamentGrams: number;
  totalBatchFilamentKg: number;

  // Electricity breakdown
  calculatedKwh: number;
  electricityCost: number;

  // Operating breakdown
  operatingCost: number;
  operatingBreakdown: {
    machineWear: number;
    labour: number;
    postProcessing: number;
    packaging: number;
    other: number;
  };

  // Base Production Cost
  baseProductionCost: number;

  // Profit calculation
  profitAmount: number;
  sellingPriceBeforeDiscount: number;
  effectiveMarkupPercent: number;
  effectiveMarginPercent: number;

  // Discount calculation
  discountAmount: number;
  sellingPriceAfterDiscount: number; // exact before rounding

  // Final Price with Rounding
  finalSellingPrice: number; // unit price customer pays
  roundingAdjustment: number; // difference due to rounding

  // Post-discount metrics (actual yield)
  actualProfitAfterDiscount: number;
  actualMarginAfterDiscount: number;
  actualMarkupAfterDiscount: number;

  // Batch / Quantity Totals
  quantity: number;
  totalProductionCost: number;
  totalSellingPrice: number;
  totalProfit: number;
  totalDiscountAmount: number;

  // Validation Warnings/Errors
  validationErrors: {
    profitError?: string;
    discountError?: string;
    generalWarning?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  rates?: CategoryRates;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface CatalogProduct {
  id: string;
  categoryId: string;
  subcategoryId: string;
  categoryAssignments?: CategoryAssignment[];
  name: string;
  dimensions: DimensionItem[];
  calculatorState: CalculatorState;
  calculationResult: CalculationResult;
  createdAt: number;
  updatedAt: number;
}

export function isProductInCategory(product: CatalogProduct, categoryId: string): boolean {
  if (product.categoryId) {
    return product.categoryId === categoryId;
  }
  return product.categoryAssignments?.[0]?.categoryId === categoryId;
}

export function isProductInSubcategory(product: CatalogProduct, subcategoryId: string): boolean {
  if (product.subcategoryId) {
    return product.subcategoryId === subcategoryId;
  }
  return product.categoryAssignments?.[0]?.subcategoryId === subcategoryId;
}

export function getProductForCategory(
  product: CatalogProduct,
  categoryId?: string
): {
  quantity: number;
  calculationResult: CalculationResult;
  profitPercent: number;
  profitMode: ProfitMode;
  filamentCostPerKg: number;
  assignment?: CategoryAssignment;
} {
  const assignment = categoryId
    ? product.categoryAssignments?.find((a) => a.categoryId === categoryId)
    : undefined;

  const firstFil = product.calculatorState?.filaments?.[0];
  const defaultFilCost = firstFil ? firstFil.costPerKg : 1399;

  if (assignment && assignment.calculationResult) {
    return {
      quantity: assignment.quantity ?? assignment.calculationResult.quantity,
      calculationResult: assignment.calculationResult,
      profitPercent: assignment.profitPercent ?? product.calculatorState?.profit?.value ?? 25,
      profitMode: assignment.profitMode ?? product.calculatorState?.profit?.mode ?? 'margin',
      filamentCostPerKg: assignment.filamentCostPerKg ?? defaultFilCost,
      assignment,
    };
  }

  return {
    quantity: product.calculationResult?.quantity ?? product.calculatorState?.quantity ?? 1,
    calculationResult: product.calculationResult,
    profitPercent: product.calculatorState?.profit?.value ?? 25,
    profitMode: product.calculatorState?.profit?.mode ?? 'margin',
    filamentCostPerKg: defaultFilCost,
    assignment,
  };
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  filaments: FilamentItem[];
  electricity: ElectricityConfig;
  operatingCosts: OperatingCosts;
  profit: ProfitConfig;
  discount: DiscountConfig;
  createdAt: number;
}

export interface GlobalSettings {
  defaultFilamentCostPerKg: number;
  defaultElectricityRatePerKwh: number;
  defaultProfitPercent: number;
  defaultProfitMode: ProfitMode;
  defaultBulkQuantity?: number;
}
