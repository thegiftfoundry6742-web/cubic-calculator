import React, { useState } from 'react';
import type { Category, Subcategory, CatalogProduct } from '../../types/calculator';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryModal, CreateSubcategoryModal } from './ModalForms';
import { formatINR } from '../../utils/formatters';
import { FolderPlus, Sparkles } from 'lucide-react';

interface DashboardHomeProps {
  categories: Category[];
  subcategories: Subcategory[];
  products: CatalogProduct[];
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
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  categories,
  subcategories,
  products,
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
}) => {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedCategoryIdForSub, setSelectedCategoryIdForSub] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  // Compute stats
  const totalPortfolioValue = products.reduce(
    (sum, p) => sum + (p.calculationResult?.finalSellingPrice || 0),
    0
  );

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

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
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

          <div className="bg-gradient-to-br from-emerald-600/30 to-teal-600/30 rounded-2xl p-3.5 border border-emerald-500/40">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
              Catalog Total Value
            </span>
            <span className="text-lg font-extrabold text-white block mt-0.5">
              {formatINR(totalPortfolioValue)}
            </span>
          </div>
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
