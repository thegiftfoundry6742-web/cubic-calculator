import React from 'react';
import type { CalculationResult, CalculatorState } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface PrintableQuoteProps {
  results: CalculationResult;
  state: CalculatorState;
}

export const PrintableQuote: React.FC<PrintableQuoteProps> = ({ results, state }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const quoteId = `3DP-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="print-only print-container p-8 font-sans bg-white text-slate-900 max-w-4xl mx-auto">
      {/* Printable Quote Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
            3D PRINTING QUOTATION
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manufacturing Cost & Price Estimate
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold text-slate-900">Quote #: {quoteId}</p>
          <p className="text-slate-600">Date: {currentDate}</p>
        </div>
      </div>

      {/* Product Details Box */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <h2 className="text-sm font-bold uppercase text-slate-700 tracking-wide mb-1">
          Job / Product Specification
        </h2>
        <p className="text-lg font-bold text-slate-900">
          {state.productName || 'Custom 3D Printed Component'}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Quantity: <strong>{results.quantity} unit(s)</strong>
        </p>
      </div>

      {/* Itemized Cost Breakdown Table */}
      <table className="w-full text-xs text-left border-collapse mb-6">
        <thead>
          <tr className="bg-slate-900 text-white uppercase text-[10px]">
            <th className="p-2.5">Item Description</th>
            <th className="p-2.5 text-right">Details</th>
            <th className="p-2.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {/* Filaments */}
          {results.filamentResults.map((f) => (
            <tr key={f.id}>
              <td className="p-2.5 font-medium">{f.name} Filament</td>
              <td className="p-2.5 text-right font-mono">{f.usedGrams}g @ ₹{f.costPerKg}/kg</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(f.cost)}</td>
            </tr>
          ))}

          {/* Electricity */}
          <tr>
            <td className="p-2.5 font-medium">Electricity Power</td>
            <td className="p-2.5 text-right font-mono">{results.calculatedKwh.toFixed(2)} kWh @ ₹{state.electricity.ratePerKwh}/unit</td>
            <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.electricityCost)}</td>
          </tr>

          {/* Operating Costs */}
          {results.operatingBreakdown.machineWear > 0 && (
            <tr>
              <td className="p-2.5 font-medium">Machine Wear & Maintenance</td>
              <td className="p-2.5 text-right text-slate-500">-</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.operatingBreakdown.machineWear)}</td>
            </tr>
          )}

          {results.operatingBreakdown.labour > 0 && (
            <tr>
              <td className="p-2.5 font-medium">Labour & Operator Setup</td>
              <td className="p-2.5 text-right text-slate-500">-</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.operatingBreakdown.labour)}</td>
            </tr>
          )}

          {results.operatingBreakdown.postProcessing > 0 && (
            <tr>
              <td className="p-2.5 font-medium">Post-Processing Finishing</td>
              <td className="p-2.5 text-right text-slate-500">-</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.operatingBreakdown.postProcessing)}</td>
            </tr>
          )}

          {results.operatingBreakdown.packaging > 0 && (
            <tr>
              <td className="p-2.5 font-medium">Custom Packaging</td>
              <td className="p-2.5 text-right text-slate-500">-</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.operatingBreakdown.packaging)}</td>
            </tr>
          )}

          {results.operatingBreakdown.other > 0 && (
            <tr>
              <td className="p-2.5 font-medium">Other Overhead Expenses</td>
              <td className="p-2.5 text-right text-slate-500">-</td>
              <td className="p-2.5 text-right font-mono font-bold">{formatINR(results.operatingBreakdown.other)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5 text-xs font-medium border-t border-slate-900 pt-3">
          <div className="flex justify-between">
            <span className="text-slate-600">Base Production Cost:</span>
            <span className="font-bold">{formatINR(results.baseProductionCost)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Profit Markup:</span>
            <span>+{formatINR(results.profitAmount)}</span>
          </div>

          {results.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Customer Discount:</span>
              <span>-{formatINR(results.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t-2 border-slate-900 pt-2">
            <span>Unit Final Price:</span>
            <span>{formatINR(results.finalSellingPrice)}</span>
          </div>

          {results.quantity > 1 && (
            <div className="flex justify-between text-base font-extrabold text-blue-900 bg-slate-100 p-2 rounded">
              <span>Total Batch Price ({results.quantity} units):</span>
              <span>{formatINR(results.totalSellingPrice)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quote Footer Signoff */}
      <div className="border-t border-slate-200 pt-6 text-[11px] text-slate-500 flex justify-between items-end">
        <div>
          <p className="font-bold text-slate-700">Thank you for your business!</p>
          <p>Generated via 3D Print Cost Calculator Pro</p>
        </div>
        <div className="text-right border-t border-slate-400 pt-8 w-48 text-center font-bold text-slate-700">
          Authorized Signature
        </div>
      </div>
    </div>
  );
};
