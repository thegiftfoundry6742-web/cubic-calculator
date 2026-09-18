import React, { useState, useEffect } from 'react';
import type { Category, Subcategory, CatalogProduct, GlobalSettings, ProfitMode } from '../../types/calculator';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryModal, CreateSubcategoryModal } from './ModalForms';
import { formatINR } from '../../utils/formatters';
import { FolderPlus, Sparkles, Sliders, Save } from 'lucide-react';

interface DashboardHomeProps {
  categories: Category[];
  subcategories: Subcategory[];
  products: CatalogProduct[];
  globalSettings: GlobalSettings;
  onUpdateGlobalSettings: (settings: GlobalSettings, applyToExisting: boolean) => void;
  onAddCategory: (name: string, description: string) => void;
  onUpdateCategory: (id: string, name: string, description: string) => void;
  onAddSubcategory: (categoryId: string, name: string, description: string) => void;
  onUpdateSubcategory: (id: string, name: string, description: string) => void;
  onAddProductForSubcategory: (subcategoryId: string) => void;
  onEditProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
  onOpenCalculator: () => void;
  showToast?: (msg: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  categories,
  subcategories,
  products,
  globalSettings,
  onUpdateGlobalSettings,
  onAddCategory,
  onUpdateCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onAddProductForSubcategory,
  onEditProduct,
  onDeleteProduct,
  onDeleteCategory,
  onDeleteSubcategory,
  onOpenCalculator,
  showToast,
}) => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedCategoryIdForSub, setSelectedCategoryIdForSub] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  const [filamentInputStr, setFilamentInputStr] = useState<string>(
    globalSettings.defaultFilamentCostPerKg ? globalSettings.defaultFilamentCostPerKg.toString() : ''
  );
  const [electricityInputStr, setElectricityInputStr] = useState<string>(
    globalSettings.defaultElectricityRatePerKwh ? globalSettings.defaultElectricityRatePerKwh.toString() : ''
  );
  const [profitInputStr, setProfitInputStr] = useState<string>(
    globalSettings.defaultProfitPercent ? globalSettings.defaultProfitPercent.toString() : '25'
  );
  const [profitMode, setProfitMode] = useState<ProfitMode>(
    globalSettings.defaultProfitMode || 'margin'
  );

  useEffect(() => {
    setFilamentInputStr(
      globalSettings.defaultFilamentCostPerKg ? globalSettings.defaultFilamentCostPerKg.toString() : ''
    );
    setElectricityInputStr(
      globalSettings.defaultElectricityRatePerKwh ? globalSettings.defaultElectricityRatePerKwh.toString() : ''
    );
    setProfitInputStr(
      globalSettings.defaultProfitPercent ? globalSettings.defaultProfitPercent.toString() : '25'
    );
    setProfitMode(globalSettings.defaultProfitMode || 'margin');
  }, [
    globalSettings.defaultFilamentCostPerKg,
    globalSettings.defaultElectricityRatePerKwh,
    globalSettings.defaultProfitPercent,
    globalSettings.defaultProfitMode,
  ]);

  // Compute stats
  const totalBatchQuantity = products.reduce((sum, p) => {
    const qty = p.calculationResult?.quantity ?? p.calculatorState?.quantity ?? 1;
    return sum + qty;
  }, 0);

  const totalCatalogProductionCost = products.reduce((sum, p) => {
    const res = p.calculationResult;
    if (!res) return sum;
    const qty = res.quantity || 1;
    return sum + (res.totalProductionCost ?? ((res.baseProductionCost || 0) * qty));
  }, 0);

  const totalCatalogSellingPrice = products.reduce((sum, p) => {
    const res = p.calculationResult;
    if (!res) return sum;
    const qty = res.quantity || 1;
    return sum + (res.totalSellingPrice ?? ((res.finalSellingPrice || 0) * qty));
  }, 0);

  const totalCatalogNetProfit = products.reduce((sum, p) => {
    const res = p.calculationResult;
    if (!res) return sum;
    const qty = res.quantity || 1;
    const unitProfit = res.actualProfitAfterDiscount ?? ((res.finalSellingPrice || 0) - (res.baseProductionCost || 0));
    return sum + (res.totalProfit ?? (unitProfit * qty));
  }, 0);

  const selectedCategoryObj = categories.find(
    (c) => c.id === (selectedCategoryIdForSub || editingSubcategory?.categoryId)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Portfolio Summary (Highlighter Green Theme) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-[#22c55e] border border-emerald-500/30">
                Cubic Extruder Business Suite
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
              3D Print Product Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Organize products by category and subcategory. Calculate exact manufacturing pricing with physical dimensions and export full financial data to downloadable Excel (.xlsx).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Create Category</span>
            </button>

            <button
              onClick={onOpenCalculator}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#22c55e]" />
              <span>Open Cost Calculator</span>
            </button>
          </div>
        </div>

        {/* Dashboard Summary Stat Cards Grid */}
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
          {/* Row 1: Item & Unit Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                Categories
              </span>
              <span className="text-lg font-bold text-white block mt-0.5">{categories.length}</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                Subcategories
              </span>
              <span className="text-lg font-bold text-white block mt-0.5">{subcategories.length}</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">
                Catalog Products
              </span>
              <span className="text-lg font-bold text-white block mt-0.5">{products.length}</span>
            </div>

            <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide block">
                Total Batch Quantity
              </span>
              <span className="text-lg font-extrabold text-blue-300 block mt-0.5">
                {totalBatchQuantity.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">Units</span>
              </span>
            </div>
          </div>

          {/* Row 2: Financial Breakdown (Total Production Cost, Catalog Total Value, Total Net Profit) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Production Cost
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
                  Mfg Cost
                </span>
              </div>
              <span className="text-xl font-extrabold text-slate-200 block mt-1">
                {formatINR(totalCatalogProductionCost)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Combined manufacturing cost for all bulk orders
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 via-slate-800 to-teal-900/40 rounded-2xl p-4 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">
                  Catalog Total Quote Value
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#22c55e] border border-emerald-500/30 font-semibold">
                  Gross Revenue
                </span>
              </div>
              <span className="text-xl font-extrabold text-white block mt-1">
                {formatINR(totalCatalogSellingPrice)}
              </span>
              <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
                Total customer quote value for all catalog items
              </span>
            </div>

            <div className="bg-gradient-to-br from-teal-900/50 via-slate-800 to-emerald-950/60 rounded-2xl p-4 border border-teal-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-teal-300 uppercase tracking-wider">
                  Total Net Profit (Margin)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                  Net Margin
                </span>
              </div>
              <span className="text-xl font-extrabold text-[#22c55e] block mt-1">
                {formatINR(totalCatalogNetProfit)}
              </span>
              <span className="text-[10px] text-teal-300/80 mt-0.5 block">
                Net profit across full catalog after discounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Base Rates & Pricing Defaults Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#22c55e]" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Global Pricing Base Rates
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Catalog Defaults
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set default filament price and electricity rate applied to all products across your 3D print catalog. Free text entry allowing easy editing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-end">
          {/* Filament Default Price (Free text) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Filament Price (₹/kg)
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

          {/* Electricity Default Rate (Free text) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Electricity Rate (₹/kWh)
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

          {/* Profit Target % (Free text) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Default Profit Target (%)
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

          {/* Save & Apply to All Products Button */}
          <button
            onClick={() => {
              const filVal = parseFloat(filamentInputStr) || 0;
              const elecVal = parseFloat(electricityInputStr) || 0;
              const profitVal = parseFloat(profitInputStr) || 0;
              onUpdateGlobalSettings(
                {
                  defaultFilamentCostPerKg: filVal,
                  defaultElectricityRatePerKwh: elecVal,
                  defaultProfitPercent: profitVal,
                  defaultProfitMode: profitMode,
                },
                true
              );
              if (showToast)
                showToast(
                  `Applied Base Rates & Profit Margin to all products! Filament: ₹${filVal}/kg | Electricity: ₹${elecVal}/kWh | Profit: ${profitVal}% (${profitMode})`
                );
            }}
            type="button"
            className="w-full py-2.5 px-4 font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md shadow-slate-900/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-[#22c55e]" />
            <span>Save & Apply to All Products</span>
          </button>
        </div>
      </div>

      {/* List of Category Cards */}
      {categories.length > 0 ? (
        <div className="space-y-6">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              subcategories={subcategories}
              products={products}
              onAddSubcategoryClick={(catId) => {
                setEditingSubcategory(null);
                setSelectedCategoryIdForSub(catId);
              }}
              onEditCategoryClick={(catToEdit) => setEditingCategory(catToEdit)}
              onEditSubcategoryClick={(subToEdit) => setEditingSubcategory(subToEdit)}
              onAddProductClick={onAddProductForSubcategory}
              onEditProduct={onEditProduct}
              onDeleteProduct={onDeleteProduct}
              onDeleteCategory={onDeleteCategory}
              onDeleteSubcategory={onDeleteSubcategory}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto my-8">
          <FolderPlus className="w-12 h-12 text-[#16a34a] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 font-heading">No Categories Created</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Start by creating product categories (e.g. Desk Accessories, Custom Parts) to structure your 3D printing business catalog.
          </p>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            type="button"
            className="px-5 py-2.5 font-bold text-xs bg-[#16a34a] hover:bg-[#15803d] text-white rounded-xl shadow-md cursor-pointer"
          >
            + Create First Category
          </button>
        </div>
      )}

      {/* Category Modal (Create or Edit) */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen || !!editingCategory}
        initialData={editingCategory}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={(name, desc) => {
          if (editingCategory) {
            onUpdateCategory(editingCategory.id, name, desc);
          } else {
            onAddCategory(name, desc);
          }
        }}
      />

      {/* Subcategory Modal (Create or Edit) */}
      <CreateSubcategoryModal
        isOpen={!!selectedCategoryIdForSub || !!editingSubcategory}
        categoryName={selectedCategoryObj?.name || ''}
        initialData={editingSubcategory}
        onClose={() => {
          setSelectedCategoryIdForSub(null);
          setEditingSubcategory(null);
        }}
        onSubmit={(name, desc) => {
          if (editingSubcategory) {
            onUpdateSubcategory(editingSubcategory.id, name, desc);
          } else if (selectedCategoryIdForSub) {
            onAddSubcategory(selectedCategoryIdForSub, name, desc);
          }
        }}
      />
    </div>
  );
};
