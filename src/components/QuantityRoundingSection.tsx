import React from 'react';
import { Sliders, Hash } from 'lucide-react';
import type { RoundingConfig, RoundingMode } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface QuantityRoundingSectionProps {
  rounding: RoundingConfig;
  quantity: number;
  unroundedPrice: number;
  finalSellingPrice: number;
  onUpdateRounding: (updates: Partial<RoundingConfig>) => void;
  onUpdateQuantity: (qty: number) => void;
}

export const QuantityRoundingSection: React.FC<QuantityRoundingSectionProps> = ({
  rounding,
  quantity,
  unroundedPrice,
  finalSellingPrice,
  onUpdateRounding,
  onUpdateQuantity,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm">
            F
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Price Rounding & Batch Quantity
            </h2>
            <p className="text-xs text-slate-500">
              Clean selling price rounding and order batch quantity multiplier.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        {/* Rounding Mode Dropdown */}
        <div>
          <label htmlFor="rounding-mode-select" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            Price Rounding Option
          </label>
          <select
            id="rounding-mode-select"
            value={rounding.mode}
            onChange={(e) => onUpdateRounding({ mode: e.target.value as RoundingMode })}
            className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="none">No Rounding (Exact Decimals)</option>
            <option value="1">Nearest ₹1</option>
            <option value="5">Nearest ₹5</option>
            <option value="10">Nearest ₹10</option>
            <option value="50">Nearest ₹50</option>
            <option value="custom">Custom Step (₹)</option>
          </select>

          {rounding.mode === 'custom' && (
            <div className="mt-2">
              <label htmlFor="custom-step-input" className="block text-[10px] font-medium text-slate-500 mb-0.5">
                Custom Rounding Step Amount
              </label>
              <input
                id="custom-step-input"
                type="number"
                min="1"
                step="1"
                value={rounding.customStep}
                onChange={(e) => onUpdateRounding({ customStep: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          {rounding.mode !== 'none' && (
            <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
              Raw: {formatINR(unroundedPrice)} → Rounded: <strong className="text-slate-800 font-sans">{formatINR(finalSellingPrice)}</strong>
            </div>
          )}
        </div>

        {/* Quantity Multiplier */}
        <div>
          <label htmlFor="quantity-multiplier-input" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Hash className="w-3 h-3 text-slate-400" />
            Order Batch Quantity
          </label>
          <div className="flex items-center rounded-lg shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateQuantity(quantity - 1)}
              disabled={quantity <= 1}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-l-lg px-3 py-2 text-slate-700 font-bold disabled:opacity-50 transition-colors cursor-pointer"
            >
              -
            </button>
            <input
              id="quantity-multiplier-input"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
              className="w-full text-center text-sm font-bold text-slate-900 bg-white border-y border-slate-300 py-2 outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdateQuantity(quantity + 1)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-r-lg px-3 py-2 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">
            Default quantity is 1 unit.
          </div>
        </div>
      </div>
    </div>
  );
};
