import React from 'react';
import type { CatalogProduct, DimensionItem } from '../../types/calculator';
import { formatINR, formatPercent } from '../../utils/formatters';
import { Edit3, Trash2, Box } from 'lucide-react';

interface ProductCardProps {
  product: CatalogProduct;
  onEdit: (product: CatalogProduct) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const res = product.calculationResult;

  const dims: DimensionItem[] = Array.isArray(product.dimensions) && product.dimensions.length > 0
    ? product.dimensions
    : [
        {
          id: 'legacy',
          name: 'Main Body',
          lengthMm: (product.dimensions as any)?.lengthMm || 0,
          widthMm: (product.dimensions as any)?.widthMm || 0,
          heightMm: (product.dimensions as any)?.heightMm || 0,
          diameterMm: (product.dimensions as any)?.diameterMm || 0,
        },
      ];

  const hasDim = dims.some((d) => d.lengthMm > 0 || d.widthMm > 0 || d.heightMm > 0 || d.diameterMm > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3">
      {/* Top Title & Dimensions */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm text-slate-900 line-clamp-1 font-heading">
            {product.name}
          </h4>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(product)}
              type="button"
              className="p-1 text-slate-400 hover:text-[#16a34a] hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
              title="Edit Product in Calculator"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              type="button"
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Delete Product"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-Part Dimensions Badges */}
        {hasDim ? (
          <div className="mt-1.5 space-y-1">
            {dims.map((d, i) => (
              <div
                key={d.id || i}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono mr-1"
              >
                <Box className="w-2.5 h-2.5 text-[#22c55e]" />
                <span>
                  {dims.length > 1 ? `${d.name || `Part #${i+1}`}: ` : ''}
                  {d.lengthMm || 0}×{d.widthMm || 0}×{d.heightMm || 0}mm
                  {d.diameterMm ? ` (Dia:${d.diameterMm}mm)` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-slate-400 italic">No dimensions specified</div>
        )}
      </div>

      {/* Pricing Summary Stats */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-slate-600">
          <span>Production Cost:</span>
          <span className="font-semibold text-slate-900">{formatINR(res.baseProductionCost)}</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Net Profit ({formatPercent(res.actualMarginAfterDiscount)}):</span>
          <span className="font-semibold text-emerald-600">+{formatINR(res.actualProfitAfterDiscount)}</span>
        </div>

        <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg font-bold text-slate-900 border border-emerald-200/70 mt-1">
          <span>Final Selling Price:</span>
          <span className="text-base text-[#16a34a] font-extrabold">{formatINR(res.finalSellingPrice)}</span>
        </div>
      </div>
    </div>
  );
};
