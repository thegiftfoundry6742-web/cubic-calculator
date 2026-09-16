import React from 'react';
import { TrendingUp, Percent, HelpCircle, AlertTriangle } from 'lucide-react';
import type { ProfitConfig } from '../types/calculator';
import { formatINR, formatPercent } from '../utils/formatters';

interface ProfitSectionProps {
  config: ProfitConfig;
  baseProductionCost: number;
  profitAmount: number;
  sellingPriceBeforeDiscount: number;
  effectiveMarkupPercent: number;
  effectiveMarginPercent: number;
  validationError?: string;
  onUpdate: (updates: Partial<ProfitConfig>) => void;
}

export const ProfitSection: React.FC<ProfitSectionProps> = ({
  config,
  baseProductionCost,
  profitAmount,
  sellingPriceBeforeDiscount,
  effectiveMarkupPercent,
  effectiveMarginPercent,
  validationError,
  onUpdate,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            D
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Profit & Selling Price
            </h2>
            <p className="text-xs text-slate-500">
              Set markup %, target margin %, or fixed profit ₹.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Profit Amount</span>
          <span className="text-base font-bold text-emerald-600">{formatINR(profitAmount)}</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => onUpdate({ mode: 'markup' })}
          className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            config.mode === 'markup'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Markup %</span>
        </button>

        <button
          type="button"
          onClick={() => onUpdate({ mode: 'margin' })}
          className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            config.mode === 'margin'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-emerald-600" />
          <span>Profit Margin %</span>
        </button>

        <button
          type="button"
          onClick={() => onUpdate({ mode: 'fixed' })}
          className={`flex-1 py-2 px-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            config.mode === 'fixed'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="font-bold text-slate-700">₹</span>
          <span>Fixed Profit ₹</span>
        </button>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Input Field */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label htmlFor="profit-value-input" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
            {config.mode === 'markup' && 'Markup Percentage (%)'}
            {config.mode === 'margin' && 'Desired Profit Margin (%)'}
            {config.mode === 'fixed' && 'Fixed Profit Amount (₹)'}
          </label>
          <div className="relative rounded-lg shadow-2xs">
            {config.mode === 'fixed' && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                ₹
              </div>
            )}
            <input
              id="profit-value-input"
              type="number"
              min="0"
              max={config.mode === 'margin' ? '99.9' : undefined}
              step="any"
              value={config.value === 0 ? '' : config.value}
              onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
              placeholder={config.mode === 'fixed' ? 'e.g. 150' : 'e.g. 25'}
              className={`w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg ${
                config.mode === 'fixed' ? 'pl-7' : 'pl-3'
              } pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none`}
            />
            {config.mode !== 'fixed' && (
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                %
              </span>
            )}
          </div>
        </div>

        {/* Calculated Selling Price Preview */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Selling Price (Pre-Discount)
          </div>
          <div className="text-lg font-bold text-slate-900 font-heading">
            {formatINR(sellingPriceBeforeDiscount)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
            <span>Markup: {formatPercent(effectiveMarkupPercent)}</span>
            <span>•</span>
            <span>Margin: {formatPercent(effectiveMarginPercent)}</span>
          </div>
        </div>
      </div>

      {/* Explanatory Note on Markup vs Margin */}
      <div className="mt-4 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          {config.mode === 'markup' && (
            <p>
              <strong>Markup:</strong> Calculated on top of production cost ({formatINR(baseProductionCost)} + {config.value}% = {formatINR(sellingPriceBeforeDiscount)}).
            </p>
          )}
          {config.mode === 'margin' && (
            <p>
              <strong>Profit Margin:</strong> Calculated on the final selling price ({formatINR(baseProductionCost)} ÷ (1 - {config.value}%) = {formatINR(sellingPriceBeforeDiscount)}).
            </p>
          )}
          {config.mode === 'fixed' && (
            <p>
              <strong>Fixed Profit:</strong> Adds a flat ₹{config.value} profit on top of {formatINR(baseProductionCost)} production cost.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
