import React from 'react';
import type { Category, Subcategory, CatalogProduct } from '../../types/calculator';
import { isProductInCategory } from '../../types/calculator';
import { exportCategoryCustomerExcel, exportCategoryAdminExcel } from '../../utils/excelExporter';
import { formatINR } from '../../utils/formatters';
import {
  Folder,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  Pencil,
  ArrowRight,
  Package,
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  subcategories: Subcategory[];
  products: CatalogProduct[];
  onOpenCategory: (categoryId: string) => void;
  onEditCategoryClick: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  showToast?: (msg: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  subcategories,
  products,
  onOpenCategory,
  onEditCategoryClick,
  onDeleteCategory,
  showToast,
}) => {
  const catSubs = subcategories.filter((s) => s.categoryId === category.id);
  const catProds = products.filter((p) => isProductInCategory(p, category.id));

  // Compute stats for card preview
  const totalSellingPrice = catProds.reduce((sum, p) => {
    const res = p.calculationResult;
    if (!res) return sum;
    const qty = res.quantity || 1;
    return sum + (res.totalSellingPrice ?? ((res.finalSellingPrice || 0) * qty));
  }, 0);

  const totalFilamentGrams = catProds.reduce((sum, p) => {
    const res = p.calculationResult;
    if (!res) return sum;
    const singleGrams = res.totalSingleUnitGrams || res.filamentResults.reduce((fSum, f) => fSum + (f.usedGrams || 0), 0);
    const qty = res.quantity || 1;
    return sum + (res.totalBatchFilamentGrams || (singleGrams * qty));
  }, 0);

  const totalFilamentKg = totalFilamentGrams / 1000;
  const filamentWeightStr = totalFilamentKg >= 1
    ? `${Number.isInteger(totalFilamentKg) ? totalFilamentKg : totalFilamentKg.toFixed(2)} kg`
    : `${totalFilamentGrams.toLocaleString('en-IN')} g`;

  const handleExportCustomerExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportCategoryCustomerExcel(category, subcategories, products);
    if (showToast) showToast(`Exported "${category.name}" (Customer Excel)`);
  };

  const handleExportAdminExcel = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportCategoryAdminExcel(category, subcategories, products);
    if (showToast) showToast(`Exported "${category.name}" (Admin Excel)`);
  };

  return (
    <div
      onClick={() => onOpenCategory(category.id)}
      className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      {/* Top Header Row with Icon & Action Buttons */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold shrink-0 shadow-md group-hover:scale-105 group-hover:from-emerald-950 group-hover:to-slate-900 transition-all duration-200">
            <Folder className="w-6 h-6 text-[#22c55e]" />
          </div>

          {/* Quick Action Buttons (Edit, Excel Downloads, Delete) */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={handleExportCustomerExcel}
              type="button"
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Download Customer Quote Excel Sheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportAdminExcel}
              type="button"
              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
              title="Download Admin Master Excel Sheet"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCategoryClick(category);
              }}
              type="button"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Edit Category Name & Description"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category.id);
              }}
              type="button"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Name & Description */}
        <div className="mb-4">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-heading tracking-tight group-hover:text-emerald-700 transition-colors line-clamp-1">
            {category.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
            {category.description || 'Explore products, pricing parameters, and manufacturing batch costs.'}
          </p>
        </div>

        {/* Subcategories Preview Pills */}
        <div className="mb-5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            Subcategories ({catSubs.length})
          </span>
          {catSubs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {catSubs.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
                >
                  {s.name}
                </span>
              ))}
              {catSubs.length > 3 && (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  +{catSubs.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No subcategories yet</span>
          )}
        </div>
      </div>

      {/* Stats Summary & Call to Action Button */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Metric Badges Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 block">Products</span>
            <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>{catProds.length} Items</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 block">Total Filament</span>
            <span className="font-bold text-purple-700 font-mono mt-0.5 block truncate">
              📦 {filamentWeightStr}
            </span>
          </div>
        </div>

        {/* Value and Open CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wide">
              Catalog Value
            </span>
            <span className="text-base font-extrabold text-[#16a34a]">
              {formatINR(totalSellingPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCategory(category.id);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 group-hover:bg-[#16a34a] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>View Subcategories</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
