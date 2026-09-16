import { useState, useEffect, useCallback } from 'react';
import type { Preset, CalculatorState } from '../types/calculator';

const STORAGE_KEY = '3d_print_calc_presets_v1';

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'preset-pla-standard',
    name: 'PLA Standard (Bambu / Creality)',
    description: 'Standard PLA print with ₹1,399/kg spool price & ₹15/kWh electricity rate.',
    filaments: [
      { id: 'p1-f1', name: 'PLA Standard', usedGrams: 264, costPerKg: 1399 },
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
    profit: { mode: 'markup', value: 25 },
    discount: { mode: 'percentage', value: 10 },
    createdAt: Date.now() - 10000,
  },
  {
    id: 'preset-petg-durable',
    name: 'PETG Functional Print',
    description: 'Durable PETG component @ ₹1,599/kg with 150W printer consumption.',
    filaments: [
      { id: 'p2-f1', name: 'PETG Tough', usedGrams: 350, costPerKg: 1599 },
    ],
    electricity: {
      mode: 'calculated',
      manualKwh: 1.2,
      printerWatts: 150,
      printHours: 8,
      printMinutes: 30,
      ratePerKwh: 15,
    },
    operatingCosts: {
      machineWear: 35,
      labour: 60,
      postProcessing: 20,
      packaging: 30,
      other: 0,
    },
    profit: { mode: 'margin', value: 30 },
    discount: { mode: 'percentage', value: 5 },
    createdAt: Date.now() - 8000,
  },
  {
    id: 'preset-tpu-flexible',
    name: 'TPU Flexible / Gasket',
    description: 'High-margin flexible print @ ₹2,499/kg filament.',
    filaments: [
      { id: 'p3-f1', name: 'TPU 95A', usedGrams: 180, costPerKg: 2499 },
    ],
    electricity: {
      mode: 'calculated',
      manualKwh: 0.9,
      printerWatts: 110,
      printHours: 6,
      printMinutes: 15,
      ratePerKwh: 15,
    },
    operatingCosts: {
      machineWear: 40,
      labour: 75,
      postProcessing: 15,
      packaging: 25,
      other: 10,
    },
    profit: { mode: 'markup', value: 40 },
    discount: { mode: 'fixed', value: 50 },
    createdAt: Date.now() - 6000,
  },
];

export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return BUILTIN_PRESETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch {
      // Storage error ignored
    }
  }, [presets]);

  const savePreset = useCallback((name: string, description: string, currentState: CalculatorState) => {
    const newPreset: Preset = {
      id: `preset-custom-${Date.now()}`,
      name: name.trim() || 'My Custom Preset',
      description: description.trim(),
      filaments: currentState.filaments,
      electricity: currentState.electricity,
      operatingCosts: currentState.operatingCosts,
      profit: currentState.profit,
      discount: currentState.discount,
      createdAt: Date.now(),
    };

    setPresets((prev) => [newPreset, ...prev]);
    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
  };
}
