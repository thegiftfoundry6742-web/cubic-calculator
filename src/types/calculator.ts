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

// Retain legacy type alias for compatibility
export type ProductDimensions = DimensionItem[];

export interface CalculatorState {
  productName: string;
  categoryId?: string;
  subcategoryId?: string;
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
  }[];
  totalMaterialCost: number;

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
  name: string;
  dimensions: DimensionItem[];
  calculatorState: CalculatorState;
  calculationResult: CalculationResult;
  createdAt: number;
  updatedAt: number;
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
