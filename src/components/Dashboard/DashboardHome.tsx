import React, { useState } from 'react';
import type { Category, Subcategory, CatalogProduct, GlobalSettings, CategoryRates } from '../../types/calculator';
import { CategoryCard } from './CategoryCard';
import { CategoryDetailPage } from './CategoryDetailPage';
import { CreateCategoryModal, CreateSubcategoryModal } from './ModalForms';
import { formatINR } from '../../utils/formatters';
import { FolderPlus, Sparkles, FileSpreadsheet, Folder } from 'lucide-react';
import { exportFullCatalogCustomerExcel, exportFullCatalogAdminExcel } from '../../utils/excelExporter';

interface DashboardHomeProps {
  categories: Category[];
  subcategories: Subcategory[];
  products: CatalogProduct[];
  globalSettings?: GlobalSettings;
  onUpdateGlobalSettings?: (settings: GlobalSettings, applyToExisting: boolean) => void;
  onUpdateCategoryRates?: (categoryId: string, rates: CategoryRates, applyToExisting: boolean) => Promise<void>;
  onAddCategory: (name: string, description: string) => void;
  onUpdateCategory: (id: string, name: string, description: string) => void;
  onAddSubcategory: (categoryId: string, name: string, description: string) => void;
  onUpdateSubcategory: (id: string, name: string, description: string) => void;
  onAddProductForSubcategory: (subcategoryId: string) => void;
  onEditProduct: (product: CatalogProduct, categoryId?: string) => void;
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
  globalSettings: _globalSettings,
  onUpdateGlobalSettings: _onUpdateGlobalSettings,
  onUpdateCategoryRates,
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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedCategoryIdForSub, setSelectedCategoryIdForSub] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

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

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  if (activeCategory) {
    return (
      <div className="space-y-6">
        <CategoryDetailPage
          category={activeCategory}
          categories={categories}
          subcategories={subcategories}
          products={products}
          onBack={() => setActiveCategoryId(null)}
          onSelectCategory={(catId) => setActiveCategoryId(catId)}
          onAddSubcategoryClick={(catId) => {
            setEditingSubcategory(null);
            setSelectedCategoryIdForSub(catId);
          }}
          onEditCategoryClick={(catToEdit) => setEditingCategory(catToEdit)}
          onEditSubcategoryClick={(subToEdit) => setEditingSubcategory(subToEdit)}
          onAddProductClick={onAddProductForSubcategory}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onDeleteCategory={(catId) => {
            onDeleteCategory(catId);
            setActiveCategoryId(null);
          }}
          onDeleteSubcategory={onDeleteSubcategory}
          onUpdateCategoryRates={onUpdateCategoryRates}
          showToast={showToast}
        />

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
          categoryName={selectedCategoryObj?.name || activeCategory.name}
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
  }

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
                if (products.length === 0) {
                  if (showToast) showToast('No products in catalog to export.');
                  return;
                }
                exportFullCatalogCustomerExcel(categories, subcategories, products);
                if (showToast) showToast('Exporting full catalog (Customer Excel)...');
              }}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
              title="Download Excel quote for ALL categories & products"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#22c55e]" />
              <span>Full Catalog Customer Excel</span>
            </button>

            <button
              onClick={() => {
                if (products.length === 0) {
                  if (showToast) showToast('No products in catalog to export.');
                  return;
                }
                exportFullCatalogAdminExcel(categories, subcategories, products);
                if (showToast) showToast('Exporting full catalog (Admin Excel)...');
              }}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
              title="Download full admin master spreadsheet with all manufacturing costs & margins"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Full Catalog Admin Excel</span>
            </button>

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


      {/* Category Cards Section Header & Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-600" />
              Product Categories ({categories.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any category card to open its dedicated page with all subcategories and products.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-[#22c55e] hover:bg-[#16a34a] hover:text-white transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Create Category</span>
          </button>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                subcategories={subcategories}
                products={products}
                onOpenCategory={(id) => setActiveCategoryId(id)}
                onEditCategoryClick={(catToEdit) => setEditingCategory(catToEdit)}
                onDeleteCategory={onDeleteCategory}
                showToast={showToast}
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
      </div>

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
