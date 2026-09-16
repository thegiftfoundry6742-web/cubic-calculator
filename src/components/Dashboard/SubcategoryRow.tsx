import React from 'react';
import type { Subcategory, CatalogProduct } from '../../types/calculator';
import { ProductCard } from './ProductCard';
import { Layers, Plus, Trash2, Pencil } from 'lucide-react';

interface SubcategoryRowProps {
  subcategory: Subcategory;
  products: CatalogProduct[];
  onEditSubcategoryClick: (subcategory: Subcategory) => void;
  onAddProductClick: (subcategoryId: string) => void;
  onEditProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteSubcategory: (subcategoryId: string) => void;
}

export const SubcategoryRow: React.FC<SubcategoryRowProps> = ({
  subcategory,
  products,
  onEditSubcategoryClick,
  onAddProductClick,
  onEditProduct,
  onDeleteProduct,
  onDeleteSubcategory,
}) => {
  return (
    <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 mb-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-800 font-heading">
            {subcategory.name}
          </h3>
          <button
            onClick={() => onEditSubcategoryClick(subcategory)}
            type="button"
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
            title="Edit Subcategory Name & Description"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
            {products.length} product(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddProductClick(subcategory.id)}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>

          <button
            onClick={() => onDeleteSubcategory(subcategory.id)}
            type="button"
            className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
            title="Delete Subcategory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {subcategory.description && (
        <p className="text-xs text-slate-500 mb-3">{subcategory.description}</p>
      )}

      {/* Grid of Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
            />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center border border-dashed border-slate-300 rounded-lg bg-white text-xs text-slate-400">
          No products added yet. Click <strong>"+ Add Product"</strong> to launch the cost calculator and save a product.
        </div>
      )}
    </div>
  );
};
