import React from 'react';
import { Tag, Percent, AlertTriangle } from 'lucide-react';
import type { DiscountConfig } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface DiscountSectionProps {
  config: DiscountConfig;
  sellingPriceBeforeDiscount: number;
  discountAmount: number;
  priceAfterDiscount: number;
  validationError?: string;
  onUpdate: (updates: Partial<DiscountConfig>) => void;
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({
  config,
  discountAmount,
  priceAfterDiscount,
  validationError,
  onUpdate,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
            E
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Discount (Optional)
            </h2>
            <p className="text-xs text-slate-500">
              Apply customer discount by percentage or fixed amount.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Discount Deduction</span>
          <span className="text-base font-bold text-rose-600">-{formatINR(discountAmount)}</span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-4 text-xs font-medium max-w-xs">
        <button
          type="button"
          onClick={() => onUpdate({ mode: 'percentage' })}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            config.mode === 'percentage'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-rose-500" />
          <span>Discount (%)</span>
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ mode: 'fixed' })}
          className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
            config.mode === 'fixed'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-rose-500" />
          <span>Fixed Discount (₹)</span>
        </button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label htmlFor="discount-input" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
            {config.mode === 'percentage' ? 'Discount Percentage (%)' : 'Fixed Discount Amount (₹)'}
          </label>
          <div className="relative rounded-lg shadow-2xs">
            {config.mode === 'fixed' && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
                ₹
              </div>
            )}
            <input
              id="discount-input"
              type="number"
              min="0"
              max={config.mode === 'percentage' ? '100' : undefined}
              step="any"
              value={config.value === 0 ? '' : config.value}
              onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
              placeholder={config.mode === 'percentage' ? 'e.g. 10' : 'e.g. 50'}
              className={`w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg ${
                config.mode === 'fixed' ? 'pl-7' : 'pl-3'
              } pr-8 py-2 focus:ring-2 focus:ring-blue-500 outline-none`}
            />
            {config.mode === 'percentage' && (
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                %
              </span>
            )}
          </div>
        </div>

        {/* Price Preview after discount */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Price After Discount
          </div>
          <div className="text-lg font-bold text-slate-900 font-heading">
            {formatINR(priceAfterDiscount)}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            Customer Saves: {formatINR(discountAmount)}
          </div>
        </div>
      </div>
    </div>
  );
};
