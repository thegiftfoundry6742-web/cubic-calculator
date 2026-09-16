import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import type { CalculationResult, CalculatorState } from '../types/calculator';
import { formatINR, formatPercent } from '../utils/formatters';

interface FormulaBreakdownProps {
  results: CalculationResult;
  state: CalculatorState;
}

export const FormulaBreakdown: React.FC<FormulaBreakdownProps> = ({ results, state }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-8 transition-all overflow-hidden">
      {/* Accordion Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">
              How was this calculated? (Calculation Engine Steps)
            </h2>
            <p className="text-xs text-slate-500">
              Complete mathematical audit log showing numbers substituted into exact business formulas.
            </p>
          </div>
        </div>
        <div className="text-slate-500 p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-5 space-y-4 text-xs font-mono text-slate-700 divide-y divide-slate-100">
          {/* Step 1: Material Cost */}
          <div className="pt-2">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">1</span>
              Material Cost Calculation
            </div>
            {results.filamentResults.map((f) => (
              <div key={f.id} className="ml-6 text-slate-600">
                • {f.name}: ({f.usedGrams}g ÷ 1000) × ₹{f.costPerKg}/kg = <strong className="text-slate-900">{formatINR(f.cost)}</strong>
              </div>
            ))}
            <div className="ml-6 font-semibold text-slate-900 mt-1 font-sans">
              Total Material Cost = {formatINR(results.totalMaterialCost)}
            </div>
          </div>

          {/* Step 2: Electricity Cost */}
          <div className="pt-3">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">2</span>
              Electricity Cost Calculation
            </div>
            {state.electricity.mode === 'calculated' ? (
              <div className="ml-6 text-slate-600">
                • kWh = ({state.electricity.printerWatts}W × ({state.electricity.printHours}h + {state.electricity.printMinutes}m/60)) ÷ 1000 = {results.calculatedKwh.toFixed(3)} kWh
                <br />
                • Cost = {results.calculatedKwh.toFixed(3)} kWh × ₹{state.electricity.ratePerKwh}/unit = <strong className="text-slate-900">{formatINR(results.electricityCost)}</strong>
              </div>
            ) : (
              <div className="ml-6 text-slate-600">
                • Electricity Cost = {results.calculatedKwh} kWh × ₹{state.electricity.ratePerKwh}/unit = <strong className="text-slate-900">{formatINR(results.electricityCost)}</strong>
              </div>
            )}
          </div>

          {/* Step 3: Operating Costs */}
          <div className="pt-3">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold">3</span>
              Machine & Operating Costs
            </div>
            <div className="ml-6 text-slate-600">
              • Machine Wear (₹{results.operatingBreakdown.machineWear}) + Labour (₹{results.operatingBreakdown.labour}) + Post-Processing (₹{results.operatingBreakdown.postProcessing}) + Packaging (₹{results.operatingBreakdown.packaging}) + Other (₹{results.operatingBreakdown.other})
              <br />
              • Operating Subtotal = <strong className="text-slate-900">{formatINR(results.operatingCost)}</strong>
            </div>
          </div>

          {/* Step 4: Total Production Cost */}
          <div className="pt-3">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-900 text-[10px] flex items-center justify-center font-bold">4</span>
              Base Production Cost
            </div>
            <div className="ml-6 text-slate-600">
              • Material ({formatINR(results.totalMaterialCost)}) + Electricity ({formatINR(results.electricityCost)}) + Operating ({formatINR(results.operatingCost)})
              <br />
              = <strong className="text-blue-700 font-sans text-sm">{formatINR(results.baseProductionCost)}</strong>
            </div>
          </div>

          {/* Step 5: Profit & Selling Price */}
          <div className="pt-3">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">5</span>
              Profit & Pre-Discount Selling Price
            </div>
            {state.profit.mode === 'markup' && (
              <div className="ml-6 text-slate-600">
                • Formula: Production Cost × {state.profit.value}% Markup
                <br />
                • Profit Amount = {formatINR(results.baseProductionCost)} × {state.profit.value}% = <strong className="text-emerald-700">{formatINR(results.profitAmount)}</strong>
                <br />
                • Selling Price Before Discount = {formatINR(results.baseProductionCost)} + {formatINR(results.profitAmount)} = <strong className="text-slate-900">{formatINR(results.sellingPriceBeforeDiscount)}</strong>
              </div>
            )}
            {state.profit.mode === 'margin' && (
              <div className="ml-6 text-slate-600">
                • Formula: Production Cost ÷ (1 - Margin%)
                <br />
                • Selling Price = {formatINR(results.baseProductionCost)} ÷ (1 - {state.profit.value}%) = <strong className="text-slate-900">{formatINR(results.sellingPriceBeforeDiscount)}</strong>
                <br />
                • Profit Amount = {formatINR(results.sellingPriceBeforeDiscount)} - {formatINR(results.baseProductionCost)} = <strong className="text-emerald-700">{formatINR(results.profitAmount)}</strong>
              </div>
            )}
            {state.profit.mode === 'fixed' && (
              <div className="ml-6 text-slate-600">
                • Fixed Profit = {formatINR(results.profitAmount)}
                <br />
                • Selling Price = {formatINR(results.baseProductionCost)} + {formatINR(results.profitAmount)} = <strong className="text-slate-900">{formatINR(results.sellingPriceBeforeDiscount)}</strong>
              </div>
            )}
          </div>

          {/* Step 6: Discount & Rounding */}
          <div className="pt-3">
            <div className="font-sans font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 text-[10px] flex items-center justify-center font-bold">6</span>
              Discount & Final Price Rounding
            </div>
            <div className="ml-6 text-slate-600">
              • Discount Amount = <strong className="text-rose-600">-{formatINR(results.discountAmount)}</strong>
              <br />
              • Unrounded Price = {formatINR(results.sellingPriceBeforeDiscount)} - {formatINR(results.discountAmount)} = {formatINR(results.sellingPriceAfterDiscount)}
              {state.rounding.mode !== 'none' && (
                <>
                  <br />
                  • Price Rounding ({state.rounding.mode}): {formatINR(results.sellingPriceAfterDiscount)} → <strong className="text-blue-900 font-sans">{formatINR(results.finalSellingPrice)}</strong>
                </>
              )}
            </div>
          </div>

          {/* Step 7: Final Business Yield */}
          <div className="pt-3 font-sans">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">
                Final Customer Selling Price: {formatINR(results.finalSellingPrice)}
              </span>
              <span className="text-slate-700">
                True Business Yield: <strong>{formatINR(results.actualProfitAfterDiscount)} Net Profit</strong> ({formatPercent(results.actualMarginAfterDiscount)} Margin)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
