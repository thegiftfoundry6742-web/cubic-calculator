import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import type { FilamentItem } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface MaterialSectionProps {
  filaments: FilamentItem[];
  totalMaterialCost: number;
  onAddFilament: () => void;
  onUpdateFilament: (id: string, key: keyof FilamentItem, value: any) => void;
  onRemoveFilament: (id: string) => void;
}

export const MaterialSection: React.FC<MaterialSectionProps> = ({
  filaments,
  totalMaterialCost,
  onAddFilament,
  onUpdateFilament,
  onRemoveFilament,
}) => {
  // Store input unit preferences per row (grams 'g' or kilograms 'kg')
  const [units, setUnits] = useState<{ [id: string]: 'g' | 'kg' }>({});

  const getUnit = (id: string) => units[id] || 'g';

  const toggleUnit = (id: string) => {
    const currentUnit = getUnit(id);
    const nextUnit = currentUnit === 'g' ? 'kg' : 'g';
    setUnits((prev) => ({ ...prev, [id]: nextUnit }));
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            A
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Material Cost (Filament)
            </h2>
            <p className="text-xs text-slate-500">
              Calculate exact spool consumption per print.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Total Material Cost</span>
          <span className="text-base font-bold text-blue-600">{formatINR(totalMaterialCost)}</span>
        </div>
      </div>

      {/* Filament Input Rows */}
      <div className="space-y-4">
        {filaments.map((f, index) => {
          const unit = getUnit(f.id);
          const displayUsed = unit === 'kg' ? (f.usedGrams / 1000).toString() : f.usedGrams.toString();
          const rowCost = (f.usedGrams / 1000) * f.costPerKg;

          return (
            <div
              key={f.id}
              className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                  <input
                    type="text"
                    value={f.name}
                    onChange={(e) => onUpdateFilament(f.id, 'name', e.target.value)}
                    placeholder="Filament Name (e.g. PLA Black, PETG White...)"
                    className="text-xs font-semibold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded-md px-2 py-1 outline-none transition-colors w-full max-w-xs"
                  />
                </div>

                {filaments.length > 1 && (
                  <button
                    onClick={() => onRemoveFilament(f.id)}
                    type="button"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Filament"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Filament Used */}
                <div className="sm:col-span-6">
                  <label htmlFor={`filament-used-${f.id}`} className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Total Filament Used
                  </label>
                  <div className="flex rounded-lg shadow-2xs">
                    <input
                      id={`filament-used-${f.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={f.usedGrams === 0 ? '' : displayUsed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const grams = unit === 'kg' ? val * 1000 : val;
                        onUpdateFilament(f.id, 'usedGrams', grams);
                      }}
                      placeholder={unit === 'g' ? 'e.g. 264' : 'e.g. 0.264'}
                      className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-l-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => toggleUnit(f.id)}
                      className="bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-300 rounded-r-lg px-3 text-xs font-bold text-slate-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      title="Toggle grams (g) or kilograms (kg)"
                    >
                      {unit}
                    </button>
                  </div>
                </div>

                {/* Filament Cost per 1 kg */}
                <div className="sm:col-span-6">
                  <label htmlFor={`filament-cost-${f.id}`} className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Filament Cost per 1 kg
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                      ₹
                    </div>
                    <input
                      id={`filament-cost-${f.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={f.costPerKg === 0 ? '' : f.costPerKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateFilament(f.id, 'costPerKg', val);
                      }}
                      placeholder="e.g. 1399"
                      className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated row subtotal summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1 border-t border-slate-200/60 font-mono">
                <span>
                  Calculation: ({f.usedGrams}g ÷ 1000) × ₹{f.costPerKg}/kg
                </span>
                <span className="font-bold text-slate-800 font-sans">
                  Subtotal: {formatINR(rowCost)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Filament Button */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <button
          onClick={onAddFilament}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Filament</span>
        </button>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3" /> Supports multi-color / multi-material prints
        </span>
      </div>
    </div>
  );
};
