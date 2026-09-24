import React from 'react';
import type { Category, Subcategory, CatalogProduct } from '../../types/calculator';
import { SubcategoryRow } from './SubcategoryRow';
import { exportCategoryCustomerExcel, exportCategoryAdminExcel } from '../../utils/excelExporter';
import { Folder, Plus, FileSpreadsheet, ShieldCheck, Trash2, Pencil } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  subcategories: Subcategory[];
  products: CatalogProduct[];
  onAddSubcategoryClick: (categoryId: string) => void;
  onEditCategoryClick: (category: Category) => void;
  onEditSubcategoryClick: (subcategory: Subcategory) => void;
  onAddProductClick: (subcategoryId: string) => void;
  onEditProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  subcategories,
  products,
  onAddSubcategoryClick,
  onEditCategoryClick,
  onEditSubcategoryClick,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onDeleteCategory,
  onDeleteSubcategory,
}) => {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const subcatSet = new Set(categorySubcategories.map((s) => s.id));
  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id || (p.subcategoryId && subcatSet.has(p.subcategoryId))
  );

  const handleExportCustomerExcel = () => {
    exportCategoryCustomerExcel(category, subcategories, products);
  };

  const handleExportAdminExcel = () => {
    exportCategoryAdminExcel(category, subcategories, products);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6 transition-all">
      {/* Category Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Folder className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {category.name}
              </h2>
              <button
                onClick={() => onEditCategoryClick(category)}
                type="button"
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Edit Category Name & Description"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {categoryProducts.length} Products
              </span>
            </div>
            {category.description && (
              <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
            )}
          </div>
        </div>

        {/* Category Actions: 2 EXPORT EXCEL BUTTONS (Customer & Admin) & Add Subcategory */}
        <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
          {/* 1. Customer Quote Excel Button */}
          <button
            onClick={handleExportCustomerExcel}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download Customer Quote Excel Sheet (Clean prices & quantities for client delivery)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Customer Excel</span>
          </button>

          {/* 2. Admin Internal Master Excel Button */}
          <button
            onClick={handleExportAdminExcel}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-200 bg-slate-900 hover:bg-slate-800 border border-purple-500/40 rounded-xl shadow-md shadow-slate-900/30 transition-all cursor-pointer"
            title="Download Admin Internal Master Excel Sheet (Complete manufacturing cost breakdown, filaments, electricity, operating expenses & net profit)"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Admin Excel</span>
          </button>

          <button
            onClick={() => onAddSubcategoryClick(category.id)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Subcategory</span>
          </button>

          <button
            onClick={() => onDeleteCategory(category.id)}
            type="button"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            title="Delete Category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subcategories List */}
      {categorySubcategories.length > 0 ? (
        <div className="space-y-4">
          {categorySubcategories.map((subcat) => {
            const subProducts = products.filter((p) => p.subcategoryId === subcat.id);
            return (
              <SubcategoryRow
                key={subcat.id}
                subcategory={subcat}
                products={subProducts}
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
        <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl bg-slate-50 text-xs text-slate-500">
          No subcategories created yet under <strong>{category.name}</strong>. Click <strong>"+ Add Subcategory"</strong> above to organize products.
        </div>
      )}
    </div>
  );
};
