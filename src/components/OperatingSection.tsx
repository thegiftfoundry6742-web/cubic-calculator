import React from 'react';
import { Cog, Wrench, Package, Sparkles, PlusCircle } from 'lucide-react';
import type { OperatingCosts } from '../types/calculator';
import { formatINR } from '../utils/formatters';

interface OperatingSectionProps {
  costs: OperatingCosts;
  totalOperatingCost: number;
  onUpdateCost: (key: keyof OperatingCosts, value: number) => void;
}

export const OperatingSection: React.FC<OperatingSectionProps> = ({
  costs,
  totalOperatingCost,
  onUpdateCost,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            C
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Machine & Operating Costs
            </h2>
            <p className="text-xs text-slate-500">
              Include optional wear, labour, post-processing & packaging expenses.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-500 block">Total Operating</span>
          <span className="text-base font-bold text-indigo-600">{formatINR(totalOperatingCost)}</span>
        </div>
      </div>

      {/* Grid of Operating Costs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {/* Machine Wear / Depreciation */}
        <div>
          <label htmlFor="op-machine-wear" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Cog className="w-3 h-3 text-slate-400" />
            Machine Wear / Nozzle
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
              ₹
            </div>
            <input
              id="op-machine-wear"
              type="number"
              min="0"
              step="any"
              value={costs.machineWear === 0 ? '' : costs.machineWear}
              onChange={(e) => onUpdateCost('machineWear', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 25"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Labour Cost */}
        <div>
          <label htmlFor="op-labour" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-slate-400" />
            Labour / Setup Cost
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
              ₹
            </div>
            <input
              id="op-labour"
              type="number"
              min="0"
              step="any"
              value={costs.labour === 0 ? '' : costs.labour}
              onChange={(e) => onUpdateCost('labour', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 40"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Post Processing Cost */}
        <div>
          <label htmlFor="op-post-processing" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-slate-400" />
            Post-Processing (Sanding/Paint)
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
              ₹
            </div>
            <input
              id="op-post-processing"
              type="number"
              min="0"
              step="any"
              value={costs.postProcessing === 0 ? '' : costs.postProcessing}
              onChange={(e) => onUpdateCost('postProcessing', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 0"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Packaging Cost */}
        <div>
          <label htmlFor="op-packaging" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Package className="w-3 h-3 text-slate-400" />
            Packaging & Box
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
              ₹
            </div>
            <input
              id="op-packaging"
              type="number"
              min="0"
              step="any"
              value={costs.packaging === 0 ? '' : costs.packaging}
              onChange={(e) => onUpdateCost('packaging', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 25"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Other Cost */}
        <div>
          <label htmlFor="op-other" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <PlusCircle className="w-3 h-3 text-slate-400" />
            Other Misc Expense
          </label>
          <div className="relative rounded-lg shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-medium text-xs">
              ₹
            </div>
            <input
              id="op-other"
              type="number"
              min="0"
              step="any"
              value={costs.other === 0 ? '' : costs.other}
              onChange={(e) => onUpdateCost('other', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 0"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
