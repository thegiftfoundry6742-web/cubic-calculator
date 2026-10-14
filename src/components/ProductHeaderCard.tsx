import React, { useState } from 'react';
import {
  Tag,
  Bookmark,
  Layers,
  Folder,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type {
  Preset,
  Category,
  Subcategory,
  CategoryAssignment,
  CalculatorState,
  ProfitMode,
} from '../types/calculator';
import { calculate3DPrintCost } from '../engine/calculationEngine';
import { formatINR } from '../utils/formatters';

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
  calculatorState?: CalculatorState;
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
  calculatorState,
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

  // Free-text input states keyed by `${index}_${field}` to allow fluid typing/backspacing
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});

  const getTextValue = (index: number, field: string, fallback: any): string => {
    const key = `${index}_${field}`;
    if (textInputs[key] !== undefined) return textInputs[key];
    return fallback !== undefined && fallback !== null ? fallback.toString() : '';
  };

  const handleTextChange = (
    index: number,
    field: 'quantity' | 'filamentCostPerKg' | 'profitPercent',
    value: string
  ) => {
    const key = `${index}_${field}`;
    setTextInputs((prev) => ({ ...prev, [key]: value }));

    const num = parseFloat(value);
    const updated = [...assignments];
    const target = updated[index] || { categoryId: '' };

    if (!isNaN(num) && num >= 0) {
      updated[index] = {
        ...target,
        [field]: num,
      };
    } else if (value.trim() === '') {
      updated[index] = {
        ...target,
        [field]: undefined,
      };
    }

    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
  };

  const handleUpdateAssignmentCategory = (index: number, newCatId: string, newSubId?: string) => {
    const newCat = categories.find((c) => c.id === newCatId);
    const catRates = newCat?.rates;
    const prevRow = assignments[index] || { categoryId: '' };

    const updated = [...assignments];
    updated[index] = {
      ...prevRow,
      categoryId: newCatId,
      subcategoryId: newSubId,
      // If no custom overrides, adopt category rates or calculator defaults
      quantity: prevRow.quantity ?? catRates?.bulkQuantity ?? calculatorState?.quantity ?? 1,
      filamentCostPerKg: prevRow.filamentCostPerKg ?? catRates?.filamentCostPerKg ?? calculatorState?.filaments?.[0]?.costPerKg ?? 1399,
      profitPercent: prevRow.profitPercent ?? catRates?.profitPercent ?? calculatorState?.profit?.value ?? 25,
      profitMode: prevRow.profitMode ?? catRates?.profitMode ?? calculatorState?.profit?.mode ?? 'margin',
      electricityRatePerKwh: prevRow.electricityRatePerKwh ?? catRates?.electricityRatePerKwh ?? calculatorState?.electricity?.ratePerKwh ?? 15,
    };

    // Clear local text inputs for this row so they refresh with new values
    setTextInputs((prev) => {
      const next = { ...prev };
      delete next[`${index}_quantity`];
      delete next[`${index}_filamentCostPerKg`];
      delete next[`${index}_profitPercent`];
      return next;
    });

    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
    if (index === 0) {
      onCategoryChange(newCatId, newSubId);
    }
  };

  const handleToggleProfitMode = (index: number) => {
    const target = assignments[index];
    const currentMode: ProfitMode = target?.profitMode || 'margin';
    const nextMode: ProfitMode = currentMode === 'margin' ? 'markup' : 'margin';

    const updated = [...assignments];
    updated[index] = {
      ...target,
      profitMode: nextMode,
    };
    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
  };

  const handleResetToCategoryDefaults = (index: number, catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const rates = cat.rates;
    const updated = [...assignments];

    const newQty = rates?.bulkQuantity ?? calculatorState?.quantity ?? 1;
    const newFil = rates?.filamentCostPerKg ?? calculatorState?.filaments?.[0]?.costPerKg ?? 1399;
    const newProf = rates?.profitPercent ?? calculatorState?.profit?.value ?? 25;
    const newMode = rates?.profitMode ?? calculatorState?.profit?.mode ?? 'margin';

    updated[index] = {
      ...updated[index],
      quantity: newQty,
      filamentCostPerKg: newFil,
      profitPercent: newProf,
      profitMode: newMode,
      electricityRatePerKwh: rates?.electricityRatePerKwh ?? calculatorState?.electricity?.ratePerKwh ?? 15,
    };

    setTextInputs((prev) => {
      const next = { ...prev };
      delete next[`${index}_quantity`];
      delete next[`${index}_filamentCostPerKg`];
      delete next[`${index}_profitPercent`];
      return next;
    });

    if (onCategoryAssignmentsChange) {
      onCategoryAssignmentsChange(updated);
    }
  };

  const handleAddAssignment = () => {
    const usedCatIds = new Set(assignments.map((a) => a.categoryId));
    const nextCat = categories.find((c) => !usedCatIds.has(c.id)) || categories[0];
    const nextSub = nextCat ? subcategories.find((s) => s.categoryId === nextCat.id) : undefined;
    const catRates = nextCat?.rates;

    const newRow: CategoryAssignment = {
      categoryId: nextCat?.id || '',
      subcategoryId: nextSub?.id || '',
      quantity: catRates?.bulkQuantity ?? calculatorState?.quantity ?? 1,
      filamentCostPerKg: catRates?.filamentCostPerKg ?? calculatorState?.filaments?.[0]?.costPerKg ?? 1399,
      profitPercent: catRates?.profitPercent ?? calculatorState?.profit?.value ?? 25,
      profitMode: catRates?.profitMode ?? calculatorState?.profit?.mode ?? 'margin',
      electricityRatePerKwh: catRates?.electricityRatePerKwh ?? calculatorState?.electricity?.ratePerKwh ?? 15,
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

  // Preview computation for each assignment row
  const getAssignmentPreview = (assignment: CategoryAssignment) => {
    if (!calculatorState) return null;
    const cat = categories.find((c) => c.id === assignment.categoryId);

    const qty =
      typeof assignment.quantity === 'number' && assignment.quantity > 0
        ? assignment.quantity
        : cat?.rates?.bulkQuantity ?? calculatorState.quantity ?? 1;

    const filCost =
      typeof assignment.filamentCostPerKg === 'number' && assignment.filamentCostPerKg > 0
        ? assignment.filamentCostPerKg
        : cat?.rates?.filamentCostPerKg ?? calculatorState.filaments?.[0]?.costPerKg ?? 1399;

    const profPercent =
      typeof assignment.profitPercent === 'number'
        ? assignment.profitPercent
        : cat?.rates?.profitPercent ?? calculatorState.profit?.value ?? 25;

    const profMode = assignment.profitMode || cat?.rates?.profitMode || calculatorState.profit?.mode || 'margin';

    const elecRate =
      typeof assignment.electricityRatePerKwh === 'number' && assignment.electricityRatePerKwh > 0
        ? assignment.electricityRatePerKwh
        : cat?.rates?.electricityRatePerKwh ?? calculatorState.electricity?.ratePerKwh ?? 15;

    const tempState = {
      ...calculatorState,
      quantity: qty,
      profit: { mode: profMode, value: profPercent },
      filaments: (calculatorState.filaments || []).map((f) => ({ ...f, costPerKg: filCost })),
      electricity: { ...calculatorState.electricity, ratePerKwh: elecRate },
    };

    const res = calculate3DPrintCost(tempState);
    const singleGrams = res.totalSingleUnitGrams || res.filamentResults.reduce((s: number, f: any) => s + (f.usedGrams || 0), 0);
    const batchGrams = res.totalBatchFilamentGrams || singleGrams * qty;
    const batchKg = batchGrams / 1000;
    const batchWeightStr =
      batchKg >= 1
        ? `${Number.isInteger(batchKg) ? batchKg : batchKg.toFixed(2)} kg`
        : `${batchGrams.toLocaleString('en-IN')} g`;

    return { res, qty, filCost, profPercent, profMode, batchWeightStr };
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

      {/* Multi-Category & Subcategory Selection Section with Category-Specific Rates */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-emerald-600" />
              Category Assignments & Specific Pricing Rates
              {assignments.length > 1 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {assignments.length} Categories Assigned
                </span>
              )}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Assign this product to one or more catalog categories. Each category can have its own independent margin, filament cost, and MOQ!
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddAssignment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            title="Assign this product to an additional category and set separate rates"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add to Another Category</span>
          </button>
        </div>

        {/* Assignment Rows */}
        <div className="space-y-3">
          {assignments.map((assignment, idx) => {
            const filteredSubs = subcategories.filter((s) => s.categoryId === assignment.categoryId);
            const currentCat = categories.find((c) => c.id === assignment.categoryId);
            const catRates = currentCat?.rates;
            const preview = getAssignmentPreview(assignment);

            const displayQty = getTextValue(idx, 'quantity', assignment.quantity ?? catRates?.bulkQuantity ?? calculatorState?.quantity ?? 1);
            const displayFilCost = getTextValue(idx, 'filamentCostPerKg', assignment.filamentCostPerKg ?? catRates?.filamentCostPerKg ?? calculatorState?.filaments?.[0]?.costPerKg ?? 1399);
            const displayProfit = getTextValue(idx, 'profitPercent', assignment.profitPercent ?? catRates?.profitPercent ?? calculatorState?.profit?.value ?? 25);
            const currentProfitMode = assignment.profitMode ?? catRates?.profitMode ?? calculatorState?.profit?.mode ?? 'margin';

            const hasCustomRates =
              (assignment.quantity !== undefined && assignment.quantity !== (catRates?.bulkQuantity ?? calculatorState?.quantity)) ||
              (assignment.filamentCostPerKg !== undefined && assignment.filamentCostPerKg !== (catRates?.filamentCostPerKg ?? calculatorState?.filaments?.[0]?.costPerKg)) ||
              (assignment.profitPercent !== undefined && assignment.profitPercent !== (catRates?.profitPercent ?? calculatorState?.profit?.value)) ||
              (assignment.profitMode !== undefined && assignment.profitMode !== (catRates?.profitMode ?? calculatorState?.profit?.mode));

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
                }`}
              >
                {/* Header row: Title and Remove */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className={`w-4 h-4 ${idx === 0 ? 'text-blue-600' : 'text-emerald-600'}`} />
                      {idx === 0 ? 'Primary Category Assignment' : `Category Assignment #${idx + 1}`}
                    </span>

                    {currentCat && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                        📁 {currentCat.name}
                      </span>
                    )}

                    {hasCustomRates && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Custom Category Rates Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {catRates && (
                      <button
                        type="button"
                        onClick={() => handleResetToCategoryDefaults(idx, assignment.categoryId)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        title={`Reset to ${currentCat?.name} default rates (₹${catRates.filamentCostPerKg || 1399}/kg, ${catRates.profitPercent || 25}%, ${catRates.bulkQuantity || 1} MOQ)`}
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>Use Category Defaults</span>
                      </button>
                    )}

                    {assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(idx)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        title="Remove this category assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdowns Row: Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                        handleUpdateAssignmentCategory(idx, newCatId, firstSub?.id);
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
                      onChange={(e) => {
                        const updated = [...assignments];
                        updated[idx] = { ...updated[idx], subcategoryId: e.target.value };
                        if (onCategoryAssignmentsChange) onCategoryAssignmentsChange(updated);
                        if (idx === 0) onCategoryChange(assignment.categoryId, e.target.value);
                      }}
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

                {/* Category-Specific Rates Editor (Free text inputs for MOQ, Filament Rate, Profit Margin %) */}
                <div className="pt-2.5 border-t border-slate-200/60 bg-white/70 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3 h-3 text-emerald-600" />
                      Category Pricing Rates & Overrides for "{currentCat?.name || 'This Category'}"
                    </span>
                    {catRates && (
                      <span className="text-[10px] text-slate-500">
                        Defaults: ₹{catRates.filamentCostPerKg || 1399}/kg · {catRates.profitPercent || 25}% · {catRates.bulkQuantity || 1} units
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Bulk Quantity MOQ */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Bulk MOQ (Units)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={displayQty}
                          onChange={(e) => handleTextChange(idx, 'quantity', e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full pl-2.5 pr-10 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                          Units
                        </span>
                      </div>
                    </div>

                    {/* Filament Cost / kg */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Filament Rate (₹/kg)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={displayFilCost}
                          onChange={(e) => handleTextChange(idx, 'filamentCostPerKg', e.target.value)}
                          placeholder="e.g. 1399"
                          className="w-full pl-6 pr-10 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                          /kg
                        </span>
                      </div>
                    </div>

                    {/* Profit Target % */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-semibold text-slate-600">
                          Profit Target (%)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleToggleProfitMode(idx)}
                          className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                        >
                          {currentProfitMode === 'margin' ? 'Margin %' : 'Markup %'}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={displayProfit}
                          onChange={(e) => handleTextChange(idx, 'profitPercent', e.target.value)}
                          placeholder="e.g. 35"
                          className="w-full pl-2.5 pr-7 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Bar for this category assignment */}
                  {preview && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600">
                          Selling Price:{' '}
                          <strong className="text-emerald-700 font-bold">
                            {formatINR(preview.res.finalSellingPrice)} / unit
                          </strong>
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600">
                          Batch ({preview.qty} pcs):{' '}
                          <strong className="text-slate-900 font-bold">
                            {formatINR(preview.res.totalSellingPrice)}
                          </strong>
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-600">
                          Filament Required:{' '}
                          <strong className="text-purple-700 font-bold font-mono">
                            📦 {preview.batchWeightStr}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
