import React from 'react';
import type { CalculationResult, CalculatorState } from '../types/calculator';
import { formatINR, formatPercent } from '../utils/formatters';
import { Copy, Printer, Award, Save } from 'lucide-react';

interface ResultsPanelProps {
  results: CalculationResult;
  state: CalculatorState;
  onSaveProduct: () => void;
  onCopySummary: () => void;
  onPrintQuote: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  results,
  state,
  onSaveProduct,
  onCopySummary,
  onPrintQuote,
}) => {
  const isBatch = results.quantity > 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden sticky top-20 transition-all">
      {/* Top SaaS Header Banner */}
      <div className="bg-slate-900 text-white p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-blue-400" />
            Live Pricing Summary
          </span>
          {isBatch && (
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Batch of {results.quantity} Units
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 line-clamp-1 mb-4">
          Product: <strong className="text-white">{state.productName || 'Custom 3D Printed Product'}</strong>
        </p>

        {/* 4 DASHBOARD CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Production Cost */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Production Cost
            </span>
            <span className="text-sm font-bold text-slate-200 block mt-0.5">
              {formatINR(results.baseProductionCost)}
            </span>
          </div>

          {/* Profit */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Profit
            </span>
            <span className="text-sm font-bold text-emerald-400 block mt-0.5">
              +{formatINR(results.profitAmount)}
            </span>
          </div>

          {/* Discount */}
          <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Discount
            </span>
            <span className="text-sm font-bold text-rose-400 block mt-0.5">
              -{formatINR(results.discountAmount)}
            </span>
          </div>

          {/* Final Price Card - HIGHEST VISUAL EMPHASIS */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/25 border border-blue-400/40 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider block">
              Final Selling Price
            </span>
            <span className="text-base font-extrabold text-white block mt-0.5">
              {formatINR(results.finalSellingPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* HERO FINAL SELLING PRICE DISPLAY */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-blue-50/70 to-white border-b border-slate-100 text-center">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">
          Final Customer Selling Price {isBatch ? '(Per Unit)' : ''}
        </span>
        <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading tracking-tight text-blue-900 my-1">
          {formatINR(results.finalSellingPrice)}
        </div>

        {isBatch && (
          <div className="mt-2 text-sm font-bold text-blue-800 bg-blue-100/80 inline-block px-3 py-1 rounded-full border border-blue-200">
            Total Batch Selling Price ({results.quantity} units): {formatINR(results.totalSellingPrice)}
          </div>
        )}

        {/* Post-Discount Business Owner True Yield */}
        <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
              Net Profit
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono block mt-0.5">
              {formatINR(results.actualProfitAfterDiscount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
              Actual Margin
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono block mt-0.5">
              {formatPercent(results.actualMarginAfterDiscount)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
              Actual Markup
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono block mt-0.5">
              {formatPercent(results.actualMarkupAfterDiscount)}
            </span>
          </div>
        </div>
      </div>

      {/* ITEMIZED COST BREAKDOWN LIST */}
      <div className="p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Itemized Cost Breakdown
        </h3>

        <div className="space-y-2 text-xs font-medium">
          {/* Material Cost */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-600">Material Cost ({results.filamentResults.length} filaments)</span>
            <span className="font-semibold text-slate-900">{formatINR(results.totalMaterialCost)}</span>
          </div>

          {/* Electricity Cost */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-600">Electricity Cost ({results.calculatedKwh.toFixed(2)} kWh)</span>
            <span className="font-semibold text-slate-900">{formatINR(results.electricityCost)}</span>
          </div>

          {/* Machine Wear */}
          {results.operatingBreakdown.machineWear > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Machine Wear & Depreciation</span>
              <span className="font-semibold text-slate-900">{formatINR(results.operatingBreakdown.machineWear)}</span>
            </div>
          )}

          {/* Labour */}
          {results.operatingBreakdown.labour > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Labour & Setup</span>
              <span className="font-semibold text-slate-900">{formatINR(results.operatingBreakdown.labour)}</span>
            </div>
          )}

          {/* Post Processing */}
          {results.operatingBreakdown.postProcessing > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Post-Processing</span>
              <span className="font-semibold text-slate-900">{formatINR(results.operatingBreakdown.postProcessing)}</span>
            </div>
          )}

          {/* Packaging */}
          {results.operatingBreakdown.packaging > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Packaging</span>
              <span className="font-semibold text-slate-900">{formatINR(results.operatingBreakdown.packaging)}</span>
            </div>
          )}

          {/* Other Cost */}
          {results.operatingBreakdown.other > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">Other Misc Cost</span>
              <span className="font-semibold text-slate-900">{formatINR(results.operatingBreakdown.other)}</span>
            </div>
          )}

          {/* BASE PRODUCTION COST SUBTOTAL */}
          <div className="flex justify-between items-center py-2 bg-slate-50 px-3 rounded-lg font-bold text-slate-900">
            <span>PRODUCTION COST</span>
            <span className="text-blue-700">{formatINR(results.baseProductionCost)}</span>
          </div>

          {/* Profit Amount */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-600">
              Profit ({state.profit.mode === 'markup' ? `${state.profit.value}% Markup` : state.profit.mode === 'margin' ? `${state.profit.value}% Margin` : 'Fixed Profit'})
            </span>
            <span className="font-semibold text-emerald-600">+{formatINR(results.profitAmount)}</span>
          </div>

          {/* Pre-Discount Selling Price */}
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-600">Selling Price Before Discount</span>
            <span className="font-semibold text-slate-900">{formatINR(results.sellingPriceBeforeDiscount)}</span>
          </div>

          {/* Discount Deduction */}
          {results.discountAmount > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">
                Discount ({state.discount.mode === 'percentage' ? `${state.discount.value}%` : 'Fixed'})
              </span>
              <span className="font-semibold text-rose-600">-{formatINR(results.discountAmount)}</span>
            </div>
          )}

          {/* Rounding Adjustment */}
          {state.rounding.mode !== 'none' && Math.abs(results.roundingAdjustment) > 0 && (
            <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-500 italic">
              <span>Price Rounding ({state.rounding.mode === 'custom' ? `Step ₹${state.rounding.customStep}` : `Nearest ₹${state.rounding.mode}`})</span>
              <span>{results.roundingAdjustment > 0 ? '+' : ''}{formatINR(results.roundingAdjustment)}</span>
            </div>
          )}
        </div>

        {/* Batch totals footer if quantity > 1 */}
        {isBatch && (
          <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Batch Production Cost ({results.quantity} units):</span>
              <span className="font-bold">{formatINR(results.totalProductionCost)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Total Batch Net Profit:</span>
              <span className="font-bold">+{formatINR(results.totalProfit)}</span>
            </div>
            <div className="flex justify-between text-blue-300 font-bold border-t border-slate-800 pt-1.5 text-sm">
              <span>Total Batch Customer Quote:</span>
              <span className="text-white">{formatINR(results.totalSellingPrice)}</span>
            </div>
          </div>
        )}

        {/* Primary Action Button: SAVE PRODUCT TO CATALOG */}
        <div className="pt-4 space-y-2">
          <button
            onClick={onSaveProduct}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Product to Catalog</span>
          </button>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onCopySummary}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Copy Text</span>
            </button>

            <button
              onClick={onPrintQuote}
              type="button"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
