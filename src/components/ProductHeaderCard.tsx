import React from 'react';
import { Tag, Bookmark, Layers, Folder, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { Preset, Category, Subcategory, CategoryAssignment } from '../types/calculator';

interface ProductHeaderCardProps {
  productName: string;
  onProductNameChange: (name: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  categoryAssignments?: CategoryAssignment[];
  onCategoryChange: (categoryId: string, subcategoryId?: string) => void;
  onCategoryAssignmentsChange?: (assignments: CategoryAssignment[]) => void;
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
  categoryAssignments,
  onCategoryChange,
  onCategoryAssignmentsChange,
  presets,
  onLoadPreset,
  onSavePresetClick,
}) => {
  // Normalize assignments: ensure at least one row exists
  const assignments: CategoryAssignment[] =
    categoryAssignments && categoryAssignments.length > 0
      ? categoryAssignments
      : selectedCategoryId
      ? [{ categoryId: selectedCategoryId, subcategoryId: selectedSubcategoryId }]
      : categories.length > 0
      ? [{ categoryId: categories[0].id, subcategoryId: subcategories.find((s) => s.categoryId === categories[0].id)?.id }]
      : [{ categoryId: '', subcategoryId: '' }];

  const handleUpdateAssignment = (index: number, newCatId: string, newSubId?: string) => {
    const updated = [...assignments];
    updated[index] = {
      categoryId: newCatId,
      subcategoryId: newSubId,
    };
    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
    if (index === 0) {
      onCategoryChange(newCatId, newSubId);
    }
  };

  const handleAddAssignment = () => {
    // Find a category not yet assigned, or default to first category
    const usedCatIds = new Set(assignments.map((a) => a.categoryId));
    const nextCat = categories.find((c) => !usedCatIds.has(c.id)) || categories[0];
    const nextSub = nextCat ? subcategories.find((s) => s.categoryId === nextCat.id) : undefined;

    const newRow: CategoryAssignment = {
      categoryId: nextCat?.id || '',
      subcategoryId: nextSub?.id || '',
    };
    const updated = [...assignments, newRow];
    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
  };

  const handleRemoveAssignment = (index: number) => {
    if (assignments.length <= 1) return;
    const updated = assignments.filter((_, i) => i !== index);
    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
    if (index === 0 && updated.length > 0) {
      onCategoryChange(updated[0].categoryId, updated[0].subcategoryId);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs mb-5 transition-all space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Product Name Input */}
        <div className="flex-1">
          <label
            htmlFor="product-name-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          >
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

      {/* Multi-Category & Subcategory Selection Section */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-emerald-600" />
              Category & Subcategory Assignments
              {assignments.length > 1 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {assignments.length} Categories Assigned
                </span>
              )}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Assign this product to one or more catalog categories. It will appear under each assigned category and in relevant customer/admin exports.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddAssignment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            title="Assign this product to an additional category and subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add to Another Category</span>
          </button>
        </div>

        {/* Assignment Rows */}
        <div className="space-y-2.5">
          {assignments.map((assignment, idx) => {
            const filteredSubs = subcategories.filter((s) => s.categoryId === assignment.categoryId);

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  idx === 0
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-emerald-50/40 border-emerald-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${idx === 0 ? 'text-blue-600' : 'text-emerald-600'}`} />
                    {idx === 0 ? 'Primary Category Assignment' : `Category Assignment #${idx + 1}`}
                  </span>

                  {assignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignment(idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title="Remove this category assignment"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Selection */}
                  <div>
                    <label
                      htmlFor={`cat-select-${idx}`}
                      className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1"
                    >
                      <Folder className="w-3 h-3 text-slate-400" />
                      Category
                    </label>
                    <select
                      id={`cat-select-${idx}`}
                      value={assignment.categoryId || ''}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        const firstSub = subcategories.find((s) => s.categoryId === newCatId);
                        handleUpdateAssignment(idx, newCatId, firstSub?.id);
                      }}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
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

                  {/* Subcategory Selection */}
                  <div>
                    <label
                      htmlFor={`subcat-select-${idx}`}
                      className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3 text-slate-400" />
                      Subcategory
                    </label>
                    <select
                      id={`subcat-select-${idx}`}
                      value={assignment.subcategoryId || ''}
                      onChange={(e) => handleUpdateAssignment(idx, assignment.categoryId, e.target.value)}
                      disabled={!assignment.categoryId}
                      className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {filteredSubs.length > 0 ? '-- Select Subcategory --' : '-- No Subcategories Available --'}
                      </option>
                      {filteredSubs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
