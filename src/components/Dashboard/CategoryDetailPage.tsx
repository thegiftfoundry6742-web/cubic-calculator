import React, { useState, useEffect } from 'react';
import type { Category, Subcategory, CatalogProduct, CategoryRates, ProfitMode } from '../../types/calculator';
import { isProductInCategory, isProductInSubcategory, getProductForCategory } from '../../types/calculator';
import { SubcategoryRow } from './SubcategoryRow';
import { exportCategoryCustomerExcel, exportCategoryAdminExcel } from '../../utils/excelExporter';
import { formatINR } from '../../utils/formatters';
import {
  ArrowLeft,
  Folder,
  Plus,
  FileSpreadsheet,
  ShieldCheck,
  Trash2,
  Pencil,
  Layers,
  ChevronRight,
  Package,
  Sliders,
  Save,
} from 'lucide-react';

interface CategoryDetailPageProps {
  category: Category;
  categories: Category[];
  subcategories: Subcategory[];
  products: CatalogProduct[];
  onBack: () => void;
  onSelectCategory: (categoryId: string) => void;
  onAddSubcategoryClick: (categoryId: string) => void;
  onEditCategoryClick: (category: Category) => void;
  onEditSubcategoryClick: (subcategory: Subcategory) => void;
  onAddProductClick: (subcategoryId: string) => void;
  onEditProduct: (product: CatalogProduct, categoryId?: string) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
  onUpdateCategoryRates?: (categoryId: string, rates: CategoryRates, applyToExisting: boolean) => Promise<void>;
  showToast?: (msg: string) => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  category,
  categories,
  subcategories,
  products,
  onBack,
  onSelectCategory,
  onAddSubcategoryClick,
  onEditCategoryClick,
  onEditSubcategoryClick,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onDeleteCategory,
  onDeleteSubcategory,
  onUpdateCategoryRates,
  showToast,
}) => {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const categoryProducts = products.filter((p) => isProductInCategory(p, category.id));

  // Category-specific rates free-text state
  const [filamentInputStr, setFilamentInputStr] = useState<string>('');
  const [electricityInputStr, setElectricityInputStr] = useState<string>('');
  const [profitInputStr, setProfitInputStr] = useState<string>('');
  const [profitMode, setProfitMode] = useState<ProfitMode>('margin');
  const [bulkQtyInputStr, setBulkQtyInputStr] = useState<string>('');
  const [isSavingRates, setIsSavingRates] = useState<boolean>(false);

  useEffect(() => {
    const r = category.rates;
    setFilamentInputStr(r?.filamentCostPerKg !== undefined ? r.filamentCostPerKg.toString() : '1399');
    setElectricityInputStr(r?.electricityRatePerKwh !== undefined ? r.electricityRatePerKwh.toString() : '15');
    setProfitInputStr(r?.profitPercent !== undefined ? r.profitPercent.toString() : '25');
    setProfitMode(r?.profitMode || 'margin');
    setBulkQtyInputStr(r?.bulkQuantity !== undefined && r.bulkQuantity > 0 ? r.bulkQuantity.toString() : '');
  }, [category.id, category.rates]);

  // Financial & Batch statistics for this specific category using getProductForCategory
  const totalBatchQuantity = categoryProducts.reduce((sum, p) => {
    const { quantity } = getProductForCategory(p, category.id);
    return sum + quantity;
  }, 0);

  const totalProductionCost = categoryProducts.reduce((sum, p) => {
    const { calculationResult: res } = getProductForCategory(p, category.id);
    if (!res) return sum;
    const qty = res.quantity || 1;
    return sum + (res.totalProductionCost ?? ((res.baseProductionCost || 0) * qty));
  }, 0);

  const totalSellingPrice = categoryProducts.reduce((sum, p) => {
    const { calculationResult: res } = getProductForCategory(p, category.id);
    if (!res) return sum;
    const qty = res.quantity || 1;
    return sum + (res.totalSellingPrice ?? ((res.finalSellingPrice || 0) * qty));
  }, 0);

  const totalNetProfit = categoryProducts.reduce((sum, p) => {
    const { calculationResult: res } = getProductForCategory(p, category.id);
    if (!res) return sum;
    const qty = res.quantity || 1;
    const unitProfit = res.actualProfitAfterDiscount ?? ((res.finalSellingPrice || 0) - (res.baseProductionCost || 0));
    return sum + (res.totalProfit ?? (unitProfit * qty));
  }, 0);

  const totalBatchFilamentGrams = categoryProducts.reduce((sum, p) => {
    const { calculationResult: res } = getProductForCategory(p, category.id);
    if (!res) return sum;
    const singleGrams = res.totalSingleUnitGrams || res.filamentResults.reduce((fSum, f) => fSum + (f.usedGrams || 0), 0);
    const qty = res.quantity || 1;
    return sum + (res.totalBatchFilamentGrams || (singleGrams * qty));
  }, 0);

  const totalBatchFilamentKg = totalBatchFilamentGrams / 1000;
  const filamentWeightStr = totalBatchFilamentKg >= 1
    ? `${Number.isInteger(totalBatchFilamentKg) ? totalBatchFilamentKg : totalBatchFilamentKg.toFixed(2)} kg`
    : `${totalBatchFilamentGrams.toLocaleString('en-IN')} g`;

  const handleExportCustomerExcel = () => {
    exportCategoryCustomerExcel(category, subcategories, products);
    if (showToast) showToast(`Exported "${category.name}" (Customer Excel)`);
  };

  const handleExportAdminExcel = () => {
    exportCategoryAdminExcel(category, subcategories, products);
    if (showToast) showToast(`Exported "${category.name}" (Admin Excel)`);
  };

  const handleSaveCategoryRates = async () => {
    if (!onUpdateCategoryRates) return;
    setIsSavingRates(true);

    const filVal = parseFloat(filamentInputStr) || 1399;
    const elecVal = parseFloat(electricityInputStr) || 15;
    const profitVal = parseFloat(profitInputStr) || 25;
    const bulkQtyVal = bulkQtyInputStr.trim() !== '' ? parseFloat(bulkQtyInputStr) || undefined : undefined;

    const newRates: CategoryRates = {
      filamentCostPerKg: filVal,
      electricityRatePerKwh: elecVal,
      profitPercent: profitVal,
      profitMode: profitMode,
      bulkQuantity: bulkQtyVal,
    };

    try {
      await onUpdateCategoryRates(category.id, newRates, true);
      if (showToast) {
        showToast(
          `Updated rates for "${category.name}" & recalculated ${categoryProducts.length} product(s)!`
        );
      }
    } finally {
      setIsSavingRates(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-emerald-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600" />
            <span>Back to All Categories</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-medium text-slate-500">Categories</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            {category.name}
          </span>
        </div>

        {/* Category Switcher Dropdown (quick jump to another category) */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Jump to:</span>
            <select
              value={category.id}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Category Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-[#22c55e] border border-emerald-500/30 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Category Workspace
              </span>
              <button
                onClick={() => onEditCategoryClick(category)}
                type="button"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Edit Category Name & Description"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  onDeleteCategory(category.id);
                  onBack();
                }}
                type="button"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {category.description || 'Manage subcategories, assign multi-category products, calculate production costs, and export quotes.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto shrink-0">
            {/* Customer Quote Excel */}
            <button
              onClick={handleExportCustomerExcel}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              title="Download Customer Quote Excel Sheet for this category"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Customer Excel</span>
            </button>

            {/* Admin Internal Master Excel */}
            <button
              onClick={handleExportAdminExcel}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-purple-200 bg-slate-800 hover:bg-slate-700 border border-purple-500/40 rounded-xl shadow-md shadow-slate-950/40 transition-all cursor-pointer"
              title="Download Admin Internal Master Excel Sheet for this category"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Admin Excel</span>
            </button>

            {/* Add Subcategory */}
            <button
              onClick={() => onAddSubcategoryClick(category.id)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-900 bg-[#22c55e] hover:bg-[#16a34a] hover:text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Subcategory</span>
            </button>
          </div>
        </div>

        {/* Category Key Stats Grid */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Subcategories
            </span>
            <span className="text-lg font-bold text-white block mt-0.5">
              {categorySubcategories.length}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
              Total Products
            </span>
            <span className="text-lg font-bold text-white block mt-0.5">
              {categoryProducts.length}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide block">
              Total Batch Units
            </span>
            <span className="text-lg font-bold text-blue-300 block mt-0.5">
              {totalBatchQuantity.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide block">
              Batch Filament
            </span>
            <span className="text-lg font-bold text-purple-300 block mt-0.5">
              {filamentWeightStr}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block truncate" title={`Mfg Cost: ${formatINR(totalProductionCost)}`}>
              Catalog Value <span className="text-[9px] text-slate-400 font-normal">({formatINR(totalProductionCost)})</span>
            </span>
            <span className="text-lg font-bold text-[#22c55e] block mt-0.5">
              {formatINR(totalSellingPrice)}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide block">
              Total Net Profit
            </span>
            <span className="text-lg font-bold text-emerald-300 block mt-0.5">
              {formatINR(totalNetProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Base Rates & Pricing Defaults Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#22c55e]" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Pricing Base Rates for "{category.name}"
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Category-Specific
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rates set here are separate for "{category.name}" and will not affect other categories. Easily edit filament cost, electricity rate, margin, and MOQ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 items-end">
          {/* Filament Price for this Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Filament Price (₹/kg)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={filamentInputStr}
                onChange={(e) => setFilamentInputStr(e.target.value)}
                placeholder="e.g. 1399"
                className="w-full pl-7 pr-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Electricity Rate for this Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Electricity Rate (₹/kWh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₹
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={electricityInputStr}
                onChange={(e) => setElectricityInputStr(e.target.value)}
                placeholder="e.g. 15"
                className="w-full pl-7 pr-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Profit Target % for this Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Profit Target (%)
              </label>
              <button
                type="button"
                onClick={() => setProfitMode((prev: ProfitMode) => (prev === 'margin' ? 'markup' : 'margin'))}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                title="Toggle Profit Margin % vs Markup %"
              >
                {profitMode === 'margin' ? 'Margin %' : 'Markup %'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={profitInputStr}
                onChange={(e) => setProfitInputStr(e.target.value)}
                placeholder="e.g. 25"
                className="w-full pl-3 pr-8 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                %
              </span>
            </div>
          </div>

          {/* Bulk Quantity MOQ for this Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Bulk MOQ
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={bulkQtyInputStr}
                onChange={(e) => setBulkQtyInputStr(e.target.value)}
                placeholder="e.g. 100 (optional)"
                className="w-full pl-3 pr-11 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                Units
              </span>
            </div>
          </div>

          {/* Save & Apply to Category Products */}
          <button
            onClick={handleSaveCategoryRates}
            disabled={isSavingRates}
            type="button"
            className="w-full py-2.5 px-4 font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md shadow-slate-900/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingRates ? (
              <span className="text-xs">Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#22c55e]" />
                <span>Save & Apply to {category.name}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subcategories List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Subcategories & Products ({categorySubcategories.length})
          </h2>

          <button
            onClick={() => onAddSubcategoryClick(category.id)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Subcategory</span>
          </button>
        </div>

        {categorySubcategories.length > 0 ? (
          <div className="space-y-5">
            {categorySubcategories.map((subcat) => {
              const subProducts = categoryProducts.filter((p) => isProductInSubcategory(p, subcat.id));
              return (
                <SubcategoryRow
                  key={subcat.id}
                  subcategory={subcat}
                  products={subProducts}
                  categoryId={category.id}
                  onEditSubcategoryClick={onEditSubcategoryClick}
                  onAddProductClick={onAddProductClick}
                  onEditProduct={onEditProduct}
                  onDeleteProduct={onDeleteProduct}
                  onDeleteSubcategory={onDeleteSubcategory}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 shadow-xs max-w-lg mx-auto">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 font-heading">
              No Subcategories in {category.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Create subcategories (e.g. Desk Accessories, Phone Mounts, Replacement Knobs) to organize and price products under this category.
            </p>
            <button
              onClick={() => onAddSubcategoryClick(category.id)}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create First Subcategory</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
