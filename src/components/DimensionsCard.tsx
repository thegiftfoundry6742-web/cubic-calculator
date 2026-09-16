import React from 'react';
import { Box, Plus, Trash2, Info } from 'lucide-react';
import type { DimensionItem } from '../types/calculator';

interface DimensionsCardProps {
  dimensions: DimensionItem[];
  onAddDimension: () => void;
  onUpdateDimension: (id: string, key: keyof DimensionItem, value: any) => void;
  onRemoveDimension: (id: string) => void;
}

export const DimensionsCard: React.FC<DimensionsCardProps> = ({
  dimensions = [],
  onAddDimension,
  onUpdateDimension,
  onRemoveDimension,
}) => {
  const safeDims = Array.isArray(dimensions) && dimensions.length > 0 ? dimensions : [
    { id: 'default', name: 'Main Body / Outer Shell', lengthMm: 0, widthMm: 0, heightMm: 0, diameterMm: 0 }
  ];

  // Calculate total volume across all components
  let totalVolumeCm3 = 0;
  safeDims.forEach((dim) => {
    const l = dim.lengthMm || 0;
    const w = dim.widthMm || 0;
    const h = dim.heightMm || 0;
    const dia = dim.diameterMm || 0;

    if (dia > 0 && h > 0) {
      const radiusCm = dia / 20;
      const heightCm = h / 10;
      totalVolumeCm3 += Math.PI * radiusCm * radiusCm * heightCm;
    } else if (l > 0 && w > 0 && h > 0) {
      totalVolumeCm3 += (l * w * h) / 1000;
    }
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-5 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16a34a] flex items-center justify-center font-bold text-sm">
            <Box className="w-4 h-4 text-[#22c55e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              Multi-Part Bounding Dimensions
            </h2>
            <p className="text-xs text-slate-500">
              Add individual part dimensions (e.g. Outer Pot & Inner Liner for planters).
            </p>
          </div>
        </div>
        {totalVolumeCm3 > 0 && (
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Combined Volume</span>
            <span className="text-sm font-bold text-[#16a34a] font-mono">{totalVolumeCm3.toFixed(1)} cm³</span>
          </div>
        )}
      </div>

      {/* Multi-Part Dimension Rows */}
      <div className="space-y-4">
        {safeDims.map((dim, index) => {
          const l = dim.lengthMm || 0;
          const w = dim.widthMm || 0;
          const h = dim.heightMm || 0;
          const dia = dim.diameterMm || 0;

          let partVol = 0;
          if (dia > 0 && h > 0) {
            partVol = Math.PI * (dia / 20) * (dia / 20) * (h / 10);
          } else if (l > 0 && w > 0 && h > 0) {
            partVol = (l * w * h) / 1000;
          }

          return (
            <div
              key={dim.id}
              className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition-all space-y-3"
            >
              {/* Row Part Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-slate-400">Part #{index + 1}</span>
                  <input
                    type="text"
                    value={dim.name}
                    onChange={(e) => onUpdateDimension(dim.id, 'name', e.target.value)}
                    placeholder="e.g. Outer Shell, Inner Liner, Lid..."
                    className="text-xs font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded-md px-2 py-1 outline-none transition-colors w-full max-w-xs"
                  />
                </div>

                {safeDims.length > 1 && (
                  <button
                    onClick={() => onRemoveDimension(dim.id)}
                    type="button"
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Part Dimension"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid Inputs for Part Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Length */}
                <div>
                  <label htmlFor={`dim-l-${dim.id}`} className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Length (mm)
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      id={`dim-l-${dim.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={l === 0 ? '' : l}
                      onChange={(e) => onUpdateDimension(dim.id, 'lengthMm', parseFloat(e.target.value) || 0)}
                      placeholder="150"
                      className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#22c55e] outline-none"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                      mm
                    </span>
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label htmlFor={`dim-w-${dim.id}`} className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Width (mm)
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      id={`dim-w-${dim.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={w === 0 ? '' : w}
                      onChange={(e) => onUpdateDimension(dim.id, 'widthMm', parseFloat(e.target.value) || 0)}
                      placeholder="100"
                      className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#22c55e] outline-none"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                      mm
                    </span>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label htmlFor={`dim-h-${dim.id}`} className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Height (mm)
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      id={`dim-h-${dim.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={h === 0 ? '' : h}
                      onChange={(e) => onUpdateDimension(dim.id, 'heightMm', parseFloat(e.target.value) || 0)}
                      placeholder="60"
                      className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#22c55e] outline-none"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                      mm
                    </span>
                  </div>
                </div>

                {/* Diameter */}
                <div>
                  <label htmlFor={`dim-dia-${dim.id}`} className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    Diameter (mm) <span className="text-[9px] text-slate-400 font-normal">(opt)</span>
                  </label>
                  <div className="relative rounded-lg shadow-2xs">
                    <input
                      id={`dim-dia-${dim.id}`}
                      type="number"
                      min="0"
                      step="any"
                      value={dia === 0 ? '' : dia}
                      onChange={(e) => onUpdateDimension(dim.id, 'diameterMm', parseFloat(e.target.value) || 0)}
                      placeholder="80"
                      className="w-full text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-[#22c55e] outline-none"
                    />
                    <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-[10px] font-bold">
                      mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Part summary footer */}
              {partVol > 0 && (
                <div className="text-[11px] text-slate-500 font-mono text-right pt-1 border-t border-slate-200/60">
                  Part Bounding Volume: <strong className="text-slate-800 font-sans">{partVol.toFixed(1)} cm³</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Part Dimension Button */}
      <div className="mt-4 pt-2 flex items-center justify-between">
        <button
          onClick={onAddDimension}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#16a34a] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Part / Dimension Component</span>
        </button>

        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3 text-[#22c55e]" /> Ideal for planters (Outer/Inner) & multi-piece assemblies
        </span>
      </div>
    </div>
  );
};
