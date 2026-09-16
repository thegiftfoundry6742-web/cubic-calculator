import { useState, useMemo, useCallback } from 'react';
import type { CalculatorState, FilamentItem, Preset, DimensionItem, CatalogProduct } from '../types/calculator';
import { calculate3DPrintCost } from '../engine/calculationEngine';

export const DEFAULT_DIMENSIONS: DimensionItem[] = [
  {
    id: 'dim-1',
    name: 'Main Body / Outer Shell',
    lengthMm: 150,
    widthMm: 100,
    heightMm: 60,
    diameterMm: 0,
  },
];

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
  productName: 'Custom 3D Printed Product',
  categoryId: undefined,
  subcategoryId: undefined,
  productId: undefined,
  dimensions: DEFAULT_DIMENSIONS,
  filaments: [
    {
      id: 'default-1',
      name: 'PLA Standard',
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

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(DEFAULT_CALCULATOR_STATE);

  const results = useMemo(() => calculate3DPrintCost(state), [state]);

  const setProductName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, productName: name }));
  }, []);

  const setCategoryAssignment = useCallback((categoryId?: string, subcategoryId?: string) => {
    setState((prev) => ({ ...prev, categoryId, subcategoryId }));
  }, []);

  // Multi-Part Dimension Handlers
  const addDimensionItem = useCallback(() => {
    setState((prev) => {
      const currentDims = Array.isArray(prev.dimensions) ? prev.dimensions : [];
      return {
        ...prev,
        dimensions: [
          ...currentDims,
          {
            id: `dim-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: `Part #${currentDims.length + 1} (e.g. Inner Liner)`,
            lengthMm: 120,
            widthMm: 90,
            heightMm: 50,
            diameterMm: 0,
          },
        ],
      };
    });
  }, []);

  const updateDimensionItem = useCallback((id: string, key: keyof DimensionItem, value: any) => {
    setState((prev) => {
      const currentDims = Array.isArray(prev.dimensions) ? prev.dimensions : [];
      return {
        ...prev,
        dimensions: currentDims.map((d) => (d.id === id ? { ...d, [key]: value } : d)),
      };
    });
  }, []);

  const removeDimensionItem = useCallback((id: string) => {
    setState((prev) => {
      const currentDims = Array.isArray(prev.dimensions) ? prev.dimensions : [];
      if (currentDims.length <= 1) return prev; // keep at least 1 dimension row
      return {
        ...prev,
        dimensions: currentDims.filter((d) => d.id !== id),
      };
    });
  }, []);

  const addFilament = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filaments: [
        ...prev.filaments,
        {
          id: `fil-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: `Filament #${prev.filaments.length + 1}`,
          usedGrams: 50,
          costPerKg: 1399,
        },
      ],
    }));
  }, []);

  const updateFilament = useCallback((id: string, key: keyof FilamentItem, value: any) => {
    setState((prev) => ({
      ...prev,
      filaments: prev.filaments.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    }));
  }, []);

  const removeFilament = useCallback((id: string) => {
    setState((prev) => {
      if (prev.filaments.length <= 1) return prev; // keep at least 1 row
      return {
        ...prev,
        filaments: prev.filaments.filter((f) => f.id !== id),
      };
    });
  }, []);

  const updateElectricity = useCallback((updates: Partial<CalculatorState['electricity']>) => {
    setState((prev) => ({
      ...prev,
      electricity: { ...prev.electricity, ...updates },
    }));
  }, []);

  const updateOperatingCost = useCallback((key: keyof CalculatorState['operatingCosts'], value: number) => {
    setState((prev) => ({
      ...prev,
      operatingCosts: { ...prev.operatingCosts, [key]: value },
    }));
  }, []);

  const updateProfit = useCallback((updates: Partial<CalculatorState['profit']>) => {
    setState((prev) => ({
      ...prev,
      profit: { ...prev.profit, ...updates },
    }));
  }, []);

  const updateDiscount = useCallback((updates: Partial<CalculatorState['discount']>) => {
    setState((prev) => ({
      ...prev,
      discount: { ...prev.discount, ...updates },
    }));
  }, []);

  const updateRounding = useCallback((updates: Partial<CalculatorState['rounding']>) => {
    setState((prev) => ({
      ...prev,
      rounding: { ...prev.rounding, ...updates },
    }));
  }, []);

  const setQuantity = useCallback((qty: number) => {
    setState((prev) => ({ ...prev, quantity: Math.max(1, qty) }));
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_CALCULATOR_STATE);
  }, []);

  const loadPreset = useCallback((preset: Preset) => {
    setState((prev) => ({
      ...prev,
      filaments: preset.filaments.length > 0 ? preset.filaments : prev.filaments,
      electricity: preset.electricity || prev.electricity,
      operatingCosts: preset.operatingCosts || prev.operatingCosts,
      profit: preset.profit || prev.profit,
      discount: preset.discount || prev.discount,
    }));
  }, []);

  const loadCatalogProduct = useCallback((catalogProduct: CatalogProduct) => {
    const loadedDims = Array.isArray(catalogProduct.dimensions)
      ? catalogProduct.dimensions
      : [
          {
            id: 'dim-legacy',
            name: 'Main Body / Outer Shell',
            lengthMm: (catalogProduct.dimensions as any)?.lengthMm || 0,
            widthMm: (catalogProduct.dimensions as any)?.widthMm || 0,
            heightMm: (catalogProduct.dimensions as any)?.heightMm || 0,
            diameterMm: (catalogProduct.dimensions as any)?.diameterMm || 0,
          },
        ];

    setState({
      ...catalogProduct.calculatorState,
      productName: catalogProduct.name,
      categoryId: catalogProduct.categoryId,
      subcategoryId: catalogProduct.subcategoryId,
      productId: catalogProduct.id,
      dimensions: loadedDims,
    });
  }, []);

  const prepareNewProductForSubcategory = useCallback((categoryId: string, subcategoryId: string) => {
    setState({
      ...DEFAULT_CALCULATOR_STATE,
      productName: 'New 3D Print Product',
      categoryId,
      subcategoryId,
      productId: undefined,
    });
  }, []);

  return {
    state,
    results,
    setProductName,
    setCategoryAssignment,
    addDimensionItem,
    updateDimensionItem,
    removeDimensionItem,
    addFilament,
    updateFilament,
    removeFilament,
    updateElectricity,
    updateOperatingCost,
    updateProfit,
    updateDiscount,
    updateRounding,
    setQuantity,
    resetAll,
    loadPreset,
    loadCatalogProduct,
    prepareNewProductForSubcategory,
  };
}
