import React from 'react';
import { Tag, Bookmark, Layers, Folder } from 'lucide-react';
import type { Preset, Category, Subcategory } from '../types/calculator';

interface ProductHeaderCardProps {
  productName: string;
  onProductNameChange: (name: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  onCategoryChange: (categoryId: string, subcategoryId?: string) => void;
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onSavePresetClick: () => void;
}

export const ProductHeaderCard: React.FC<ProductHeaderCardProps> = ({
  productName,
  onProductNameChange,
  categories,
  subcategories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  presets,
  onLoadPreset,
  onSavePresetClick,
}) => {
  const filteredSubcategories = subcategories.filter((s) => s.categoryId === selectedCategoryId);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-5 transition-all space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Product Name Input */}
        <div className="flex-1">
          <label htmlFor="product-name-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            Product / Model Name
          </label>
          <input
            id="product-name-input"
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder="e.g. Custom Desk Organizer, Phone Stand, Enclosure Knob..."
            className="w-full text-base sm:text-lg font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          />
        </div>

        {/* Quick Presets Selector & Save Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-full md:w-auto">
            <label htmlFor="preset-select" className="block text-[11px] font-medium text-slate-500 mb-1">
              Load Machine Preset
            </label>
            <select
              id="preset-select"
              defaultValue=""
              onChange={(e) => {
                const found = presets.find((p) => p.id === e.target.value);
                if (found) {
                  onLoadPreset(found);
                  e.target.value = '';
                }
              }}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="" disabled>
                -- Choose Preset --
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="self-end">
            <button
              onClick={onSavePresetClick}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Save current configuration as preset"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category & Subcategory Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <label htmlFor="category-select" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Folder className="w-3 h-3 text-slate-400" />
            Assign Category
          </label>
          <select
            id="category-select"
            value={selectedCategoryId || ''}
            onChange={(e) => {
              const catId = e.target.value;
              const firstSub = subcategories.find((s) => s.categoryId === catId);
              onCategoryChange(catId, firstSub?.id);
            }}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="" disabled>
              -- Select Category --
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subcategory-select" className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Assign Subcategory
          </label>
          <select
            id="subcategory-select"
            value={selectedSubcategoryId || ''}
            onChange={(e) => onCategoryChange(selectedCategoryId || '', e.target.value)}
            disabled={!selectedCategoryId}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="" disabled>
              -- Select Subcategory --
            </option>
            {filteredSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
