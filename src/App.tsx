import { useState } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { usePresets } from './hooks/usePresets';
import { useCatalog } from './hooks/useCatalog';
import { formatINR, formatPercent } from './utils/formatters';
import { Header } from './components/Header';
import { ProductHeaderCard } from './components/ProductHeaderCard';
import { DimensionsCard } from './components/DimensionsCard';
import { MaterialSection } from './components/MaterialSection';
import { ElectricitySection } from './components/ElectricitySection';
import { OperatingSection } from './components/OperatingSection';
import { ProfitSection } from './components/ProfitSection';
import { DiscountSection } from './components/DiscountSection';
import { QuantityRoundingSection } from './components/QuantityRoundingSection';
import { ResultsPanel } from './components/ResultsPanel';
import { FormulaBreakdown } from './components/FormulaBreakdown';
import { PresetModal } from './components/PresetModal';
import { PrintableQuote } from './components/PrintableQuote';
import { Toast } from './components/Toast';
import { DashboardHome } from './components/Dashboard/DashboardHome';
import type { CatalogProduct, CalculatorState } from './types/calculator';
import { calculate3DPrintCost } from './engine/calculationEngine';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'calculator'>('dashboard');

  const {
    globalSettings,
    updateGlobalSettings,
    categories,
    subcategories,
    products,
    addCategory,
    updateCategory,
    addSubcategory,
    updateSubcategory,
    saveCatalogProduct,
    updateCategoryRates,
    deleteProduct,
    deleteCategory,
    deleteSubcategory,
  } = useCatalog();

  const {
    state,
    results,
    setProductName,
    setCategoryAssignment,
    setCategoryAssignments,
    addDimensionItem,
    updateDimensionItem,
    removeDimensionItem,
    addFilament,
    updateFilament,
    removeFilament,
    updateElectricity,
    updateOperatingCost,
    updateProfit,
    updateDiscount,
    updateRounding,
    setQuantity,
    resetAll,
    loadPreset,
    loadCatalogProduct,
    prepareNewProductForSubcategory,
  } = useCalculator(globalSettings);

  const { presets, savePreset, deletePreset } = usePresets();

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save product to catalog database (saves independent products for each assigned category)
  const handleSaveProductToCatalog = async () => {
    let assignments = state.categoryAssignments && state.categoryAssignments.length > 0
      ? state.categoryAssignments.filter((a) => a.categoryId)
      : [];

    let targetCatId = state.categoryId;
    let targetSubId = state.subcategoryId;

    if (!targetCatId && assignments.length > 0) {
      targetCatId = assignments[0].categoryId;
      targetSubId = assignments[0].subcategoryId;
    }

    if (!targetCatId) {
      if (categories.length > 0) {
        targetCatId = categories[0].id;
        const matchingSub = subcategories.find((s) => s.categoryId === targetCatId);
        targetSubId = matchingSub ? matchingSub.id : undefined;
      } else {
        const newCat = await addCategory('General Products', 'Default catalog category');
        targetCatId = newCat.id;
        const newSub = await addSubcategory(newCat.id, 'Standard Prints', 'Default subcategory');
        targetSubId = newSub.id;
      }
    }

    if (!targetSubId && targetCatId) {
      const matchingSub = subcategories.find((s) => s.categoryId === targetCatId);
      if (matchingSub) {
        targetSubId = matchingSub.id;
      } else {
        const newSub = await addSubcategory(targetCatId, 'Standard Prints', 'Default subcategory');
        targetSubId = newSub.id;
      }
    }

    if (assignments.length === 0 && targetCatId) {
      assignments = [{ categoryId: targetCatId, subcategoryId: targetSubId }];
    } else if (assignments.length > 0 && (!assignments[0].subcategoryId && targetSubId)) {
      assignments[0].subcategoryId = targetSubId;
    }

    if (!targetCatId || !targetSubId) return;

    // Save independent products for each category assignment:
    // Assignment 0: If editing an existing product whose category matches assignments[0].categoryId, update that product's ID.
    // Subsequent assignments (or if category changed): create separate independent products so editing one never affects the other!
    const savedProducts: CatalogProduct[] = [];

    for (let i = 0; i < assignments.length; i++) {
      const a = assignments[i];
      const catId = a.categoryId;
      let subId = a.subcategoryId;

      if (!subId) {
        const matchingSub = subcategories.find((s) => s.categoryId === catId);
        subId = matchingSub?.id;
      }
      if (!catId || !subId) continue;

      const catObj = categories.find((c) => c.id === catId);
      const catRates = catObj?.rates;

      let prodId: string | undefined;
      if (i === 0 && state.productId && state.categoryId === catId) {
        prodId = state.productId;
      } else {
        prodId = undefined;
      }

      const qty = typeof a.quantity === 'number' && a.quantity > 0
        ? a.quantity
        : (catRates?.bulkQuantity ?? state.quantity ?? 1);

      const filCost = typeof a.filamentCostPerKg === 'number' && a.filamentCostPerKg > 0
        ? a.filamentCostPerKg
        : (catRates?.filamentCostPerKg ?? state.filaments?.[0]?.costPerKg ?? 1399);

      const profPercent = typeof a.profitPercent === 'number'
        ? a.profitPercent
        : (catRates?.profitPercent ?? state.profit?.value ?? 25);

      const profMode = a.profitMode || catRates?.profitMode || state.profit?.mode || 'margin';

      const elecRate = typeof a.electricityRatePerKwh === 'number' && a.electricityRatePerKwh > 0
        ? a.electricityRatePerKwh
        : (catRates?.electricityRatePerKwh ?? state.electricity?.ratePerKwh ?? 15);

      const independentState: CalculatorState = {
        ...state,
        productId: prodId,
        categoryId: catId,
        subcategoryId: subId,
        categoryAssignments: [{
          categoryId: catId,
          subcategoryId: subId,
          quantity: qty,
          filamentCostPerKg: filCost,
          profitPercent: profPercent,
          profitMode: profMode,
          electricityRatePerKwh: elecRate,
        }],
        quantity: qty,
        profit: {
          mode: profMode,
          value: profPercent,
        },
        filaments: (state.filaments || []).map((f) => ({ ...f, costPerKg: filCost })),
        electricity: {
          ...state.electricity,
          ratePerKwh: elecRate,
        },
      };

      const independentResult = calculate3DPrintCost(independentState);

      const saved = await saveCatalogProduct({
        id: prodId,
        categoryId: catId,
        subcategoryId: subId,
        categoryAssignments: independentState.categoryAssignments,
        name: state.productName || 'Custom 3D Printed Product',
        dimensions: state.dimensions,
        calculatorState: independentState,
        calculationResult: independentResult,
      });

      savedProducts.push(saved);
    }

    const categoryNames = assignments
      .map((a) => categories.find((c) => c.id === a.categoryId)?.name)
      .filter(Boolean)
      .join(', ');

    if (savedProducts.length > 1) {
      showToast(`Saved ${savedProducts.length} independent products across [${categoryNames}]! Each can be edited separately.`);
    } else if (savedProducts.length === 1) {
      showToast(`"${savedProducts[0].name}" saved to [${categoryNames}]!`);
    }

    setCurrentView('dashboard');
  };

  const handleEditProductFromCatalog = (product: CatalogProduct, currentCategoryId?: string) => {
    loadCatalogProduct(product, currentCategoryId);
    setCurrentView('calculator');
  };

  const handleAddProductForSubcategory = (subcategoryId: string) => {
    const sub = subcategories.find((s) => s.id === subcategoryId);
    if (sub) {
      prepareNewProductForSubcategory(sub.categoryId, sub.id, globalSettings);
    }
    setCurrentView('calculator');
  };

  const handleCopySummary = () => {
    const dims = Array.isArray(state.dimensions) ? state.dimensions : [];
    const dimSummary = dims.map((d, i) => `[Part #${i+1} ${d.name}]: ${d.lengthMm || 0}x${d.widthMm || 0}x${d.heightMm || 0}mm${d.diameterMm ? ` (Dia: ${d.diameterMm}mm)` : ''}`).join(' | ');

    const summaryText = `Product: ${state.productName || 'Custom 3D Printed Product'}
Multi-Part Dimensions: ${dimSummary || 'N/A'}

Material Cost: ${formatINR(results.totalMaterialCost)}
Electricity Cost: ${formatINR(results.electricityCost)}
Machine Wear: ${formatINR(results.operatingBreakdown.machineWear)}
Labour: ${formatINR(results.operatingBreakdown.labour)}
Packaging: ${formatINR(results.operatingBreakdown.packaging)}
Post-Processing: ${formatINR(results.operatingBreakdown.postProcessing)}
Other Cost: ${formatINR(results.operatingBreakdown.other)}

Production Cost: ${formatINR(results.baseProductionCost)}

Profit (${state.profit.mode}): ${formatINR(results.profitAmount)}
Selling Price (Pre-Discount): ${formatINR(results.sellingPriceBeforeDiscount)}

Discount: ${formatINR(results.discountAmount)}

Final Selling Price: ${formatINR(results.finalSellingPrice)}${results.quantity > 1 ? ` (Batch Total: ${formatINR(results.totalSellingPrice)})` : ''}

Net Profit: ${formatINR(results.actualProfitAfterDiscount)}
Profit Margin: ${formatPercent(results.actualMarginAfterDiscount)}
Markup: ${formatPercent(results.actualMarkupAfterDiscount)}`;

    navigator.clipboard.writeText(summaryText);
    showToast('Calculation summary copied to clipboard!');
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Printable Quote Overlay (Only visible in Print Mode) */}
      <PrintableQuote results={results} state={state} />

      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onReset={resetAll}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        presetCount={presets.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-print">
        {currentView === 'dashboard' ? (
          /* CATALOG DASHBOARD HOME VIEW */
          <DashboardHome
            categories={categories}
            subcategories={subcategories}
            products={products}
            globalSettings={globalSettings}
            onUpdateGlobalSettings={updateGlobalSettings}
            onUpdateCategoryRates={updateCategoryRates}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onAddSubcategory={addSubcategory}
            onUpdateSubcategory={updateSubcategory}
            onAddProductForSubcategory={handleAddProductForSubcategory}
            onEditProduct={handleEditProductFromCatalog}
            onDeleteProduct={deleteProduct}
            onDeleteCategory={deleteCategory}
            onDeleteSubcategory={deleteSubcategory}
            onOpenCalculator={() => {
              prepareNewProductForSubcategory(categories[0]?.id || '', subcategories[0]?.id || '', globalSettings);
              setCurrentView('calculator');
            }}
            showToast={showToast}
          />
        ) : (
          /* CALCULATOR PAGE VIEW */
          <div>
            {/* Product & Quick Presets Header Card */}
            <ProductHeaderCard
              productName={state.productName}
              onProductNameChange={setProductName}
              categories={categories}
              subcategories={subcategories}
              selectedCategoryId={state.categoryId}
              selectedSubcategoryId={state.subcategoryId}
              categoryAssignments={state.categoryAssignments}
              onCategoryChange={setCategoryAssignment}
              onCategoryAssignmentsChange={setCategoryAssignments}
              presets={presets}
              onLoadPreset={loadPreset}
              onSavePresetClick={() => setIsPresetModalOpen(true)}
              calculatorState={state}
            />

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-7 space-y-5">
                {/* Multi-Part Product Dimensions Card */}
                <DimensionsCard
                  dimensions={state.dimensions}
                  onAddDimension={addDimensionItem}
                  onUpdateDimension={updateDimensionItem}
                  onRemoveDimension={removeDimensionItem}
                />

                {/* Section A: Material Cost */}
                <MaterialSection
                  filaments={state.filaments}
                  totalMaterialCost={results.totalMaterialCost}
                  quantity={state.quantity}
                  onAddFilament={addFilament}
                  onUpdateFilament={updateFilament}
                  onRemoveFilament={removeFilament}
                />

                {/* Section B: Electricity Cost */}
                <ElectricitySection
                  config={state.electricity}
                  calculatedKwh={results.calculatedKwh}
                  electricityCost={results.electricityCost}
                  onUpdate={updateElectricity}
                />

                {/* Section C: Machine & Operating Costs */}
                <OperatingSection
                  costs={state.operatingCosts}
                  totalOperatingCost={results.operatingCost}
                  onUpdateCost={updateOperatingCost}
                />

                {/* Section D: Profit & Selling Price */}
                <ProfitSection
                  config={state.profit}
                  baseProductionCost={results.baseProductionCost}
                  profitAmount={results.profitAmount}
                  sellingPriceBeforeDiscount={results.sellingPriceBeforeDiscount}
                  effectiveMarkupPercent={results.effectiveMarkupPercent}
                  effectiveMarginPercent={results.effectiveMarginPercent}
                  validationError={results.validationErrors.profitError}
                  onUpdate={updateProfit}
                />

                {/* Section E: Discount */}
                <DiscountSection
                  config={state.discount}
                  sellingPriceBeforeDiscount={results.sellingPriceBeforeDiscount}
                  discountAmount={results.discountAmount}
                  priceAfterDiscount={results.sellingPriceAfterDiscount}
                  validationError={results.validationErrors.discountError}
                  onUpdate={updateDiscount}
                />

                {/* Section F: Price Rounding & Quantity Multiplier */}
                <QuantityRoundingSection
                  rounding={state.rounding}
                  quantity={state.quantity}
                  unroundedPrice={results.sellingPriceAfterDiscount}
                  finalSellingPrice={results.finalSellingPrice}
                  onUpdateRounding={updateRounding}
                  onUpdateQuantity={setQuantity}
                />
              </div>

              {/* Right Column: Live Sticky Results Panel */}
              <div className="lg:col-span-5 space-y-6">
                <ResultsPanel
                  results={results}
                  state={state}
                  onSaveProduct={handleSaveProductToCatalog}
                  onCopySummary={handleCopySummary}
                  onPrintQuote={handlePrintQuote}
                />
              </div>
            </div>

            {/* Section H: Expandable Formula Audit Log */}
            <div className="mt-8">
              <FormulaBreakdown results={results} state={state} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Cubic Extruder Solutions • 3D Print Cost Calculator & Catalog Suite</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Realtime Supabase Cloud Backend • Multi-part dimensions, filament usage, pricing engine & downloadable Excel export (.xlsx).
          </p>
        </div>
      </footer>

      {/* Preset Modal */}
      <PresetModal
        isOpen={isPresetModalOpen}
        presets={presets}
        currentState={state}
        onClose={() => setIsPresetModalOpen(false)}
        onLoadPreset={loadPreset}
        onSavePreset={(name, desc, st) => savePreset(name, desc, st)}
        onDeletePreset={deletePreset}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default App;
