import * as XLSX from 'xlsx';
import type { Category, Subcategory, CatalogProduct, DimensionItem } from '../types/calculator';

/**
 * Helper to download workbook buffer as file
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  try {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    XLSX.writeFile(workbook, fileName);
  }
}

/**
 * Formats dimensions array into multiline string
 */
function formatDimensions(dims: DimensionItem[]): string {
  const safeDims: DimensionItem[] = Array.isArray(dims) && dims.length > 0
    ? dims
    : [
        {
          id: 'legacy',
          name: 'Main Body',
          lengthMm: (dims as any)?.lengthMm || 0,
          widthMm: (dims as any)?.widthMm || 0,
          heightMm: (dims as any)?.heightMm || 0,
          diameterMm: (dims as any)?.diameterMm || 0,
        },
      ];

  return safeDims
    .map(
      (d, idx) =>
        `${d.name || `Part #${idx + 1}`}: ${d.lengthMm || 0} × ${d.widthMm || 0} × ${d.heightMm || 0} mm${
          d.diameterMm ? ` (Dia: ${d.diameterMm}mm)` : ''
        }`
    )
    .join('\r\n');
}

/**
 * 1. Exports SINGLE CATEGORY CUSTOMER QUOTE Excel Sheet (.xlsx)
 */
export function exportCategoryCustomerExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const subcatSet = new Set(categorySubcategories.map((s) => s.id));
  const subcatMap = new Map(categorySubcategories.map((s) => [s.id, s.name]));

  // Match by categoryId OR subcategoryId fallback
  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id || (p.subcategoryId && subcatSet.has(p.subcategoryId))
  );

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = categoryProducts.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const subName = subcatMap.get(prod.subcategoryId) || 'General';
    const dimMultiline = formatDimensions(prod.dimensions);

    const discountLabel =
      res.discountAmount > 0
        ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
        : 'None (0%)';

    return {
      'Category Name': category.name,
      'Subcategory': subName,
      'Product Name': prod.name,
      'Product Dimensions': dimMultiline,
      'Per Unit Cost (Pre-Discount)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
      'Bulk Order MOQ': res.quantity,
      'Discount': discountLabel,
      'Bulk Order Cost Per Unit': Number(res.finalSellingPrice.toFixed(2)),
      'Total Batch Customer Quote (₹)': Number(res.totalSellingPrice.toFixed(2)),
    };
  });

  // Calculate totals
  const totalMOQ = categoryProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
  const totalBatchQuote = categoryProducts.reduce(
    (sum, p) =>
      sum +
      (p.calculationResult?.totalSellingPrice ??
        ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );

  // Append Grand Total Row
  exportRows.push({
    'Category Name': 'TOTAL',
    'Subcategory': '',
    'Product Name': `Total: ${categoryProducts.length} Product(s)`,
    'Product Dimensions': '',
    'Per Unit Cost (Pre-Discount)': '',
    'Bulk Order MOQ': totalMOQ,
    'Discount': '',
    'Bulk Order Cost Per Unit': 'TOTAL BATCH QUOTE:',
    'Total Batch Customer Quote (₹)': Number(totalBatchQuote.toFixed(2)),
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 28 },
    { wch: 45 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = category.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Customer Quote';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const cleanCategoryName = category.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadWorkbook(workbook, `${cleanCategoryName}_Customer_Quote.xlsx`);
}

/**
 * 2. Exports SINGLE CATEGORY ADMIN INTERNAL MASTER Excel Sheet (.xlsx)
 */
export function exportCategoryAdminExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const subcatSet = new Set(categorySubcategories.map((s) => s.id));
  const subcatMap = new Map(categorySubcategories.map((s) => [s.id, s.name]));

  // Match by categoryId OR subcategoryId fallback
  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id || (p.subcategoryId && subcatSet.has(p.subcategoryId))
  );

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = categoryProducts.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const subName = subcatMap.get(prod.subcategoryId) || 'General';
    const dimMultiline = formatDimensions(prod.dimensions);

    const filamentLines = (res.filamentResults || [])
      .map((f) => `${f.name}: ${f.usedGrams}g @ ₹${f.costPerKg}/kg (₹${f.cost.toFixed(2)})`)
      .join('\r\n') || 'None';

    const elecHours = st.electricity?.printHours || 0;
    const elecMins = st.electricity?.printMinutes || 0;
    const elecWatts = st.electricity?.printerWatts || 0;
    const elecRate = st.electricity?.ratePerKwh || 0;
    const elecKwh = res.calculatedKwh || 0;
    const elecSpecs = `Time: ${elecHours}h ${elecMins}m | Power: ${elecWatts}W | KWh: ${elecKwh.toFixed(3)} | Rate: ₹${elecRate}/kWh`;

    const op = res.operatingBreakdown || { machineWear: 0, labour: 0, postProcessing: 0, packaging: 0, other: 0 };
    const opLines = `Wear: ₹${op.machineWear} | Labour: ₹${op.labour} | PostProc: ₹${op.postProcessing} | Pkg: ₹${op.packaging} | Other: ₹${op.other}`;

    const discountLabel =
      res.discountAmount > 0
        ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
        : 'None (0%)';

    const profitSetting = `${st.profit.value}${st.profit.mode === 'fixed' ? ' ₹' : `% ${st.profit.mode}`}`;
    const qty = res.quantity || 1;
    const totalBatchProdCost = res.totalProductionCost ?? (res.baseProductionCost * qty);
    const totalBatchQuote = res.totalSellingPrice ?? (res.finalSellingPrice * qty);
    const totalBatchProfit = res.totalProfit ?? ((res.actualProfitAfterDiscount || (res.finalSellingPrice - res.baseProductionCost)) * qty);

    return {
      'Category Name': category.name,
      'Subcategory': subName,
      'Product Name': prod.name,
      'Product Dimensions': dimMultiline,
      'Filament Breakdown & Cost': filamentLines,
      'Material Cost / Unit (₹)': Number(res.totalMaterialCost.toFixed(2)),
      'Electricity Specs': elecSpecs,
      'Electricity Cost / Unit (₹)': Number(res.electricityCost.toFixed(2)),
      'Operating Cost Breakdown': opLines,
      'Operating Cost / Unit (₹)': Number(res.operatingCost.toFixed(2)),
      'Base Prod Cost / Unit (₹)': Number(res.baseProductionCost.toFixed(2)),
      'Total Batch Prod Cost (₹)': Number(totalBatchProdCost.toFixed(2)),
      'Profit Target': profitSetting,
      'Profit / Unit (Pre-Discount) (₹)': Number(res.profitAmount.toFixed(2)),
      'Selling Price (Pre-Discount) (₹)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
      'Bulk Order MOQ': qty,
      'Discount': discountLabel,
      'Final Selling Price / Unit (₹)': Number(res.finalSellingPrice.toFixed(2)),
      'Actual Net Profit / Unit (₹)': Number(res.actualProfitAfterDiscount.toFixed(2)),
      'Actual Margin %': `${(res.actualMarginAfterDiscount || 0).toFixed(1)}%`,
      'Total Batch Quote (Revenue) (₹)': Number(totalBatchQuote.toFixed(2)),
      'Total Batch Net Profit (₹)': Number(totalBatchProfit.toFixed(2)),
    };
  });

  // Calculate Admin Grand Totals
  const totalMOQ = categoryProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
  const totalBatchProdCostSum = categoryProducts.reduce(
    (sum, p) => sum + (p.calculationResult?.totalProductionCost ?? ((p.calculationResult?.baseProductionCost || 0) * (p.calculationResult?.quantity || 1))),
    0
  );
  const totalBatchQuoteSum = categoryProducts.reduce(
    (sum, p) => sum + (p.calculationResult?.totalSellingPrice ?? ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );
  const totalBatchProfitSum = categoryProducts.reduce(
    (sum, p) => sum + (p.calculationResult?.totalProfit ?? (((p.calculationResult?.actualProfitAfterDiscount || 0) * (p.calculationResult?.quantity || 1)))),
    0
  );

  // Append Grand Total Summary Row
  exportRows.push({
    'Category Name': 'TOTAL',
    'Subcategory': '',
    'Product Name': `Total: ${categoryProducts.length} Product(s)`,
    'Product Dimensions': '',
    'Filament Breakdown & Cost': '',
    'Material Cost / Unit (₹)': '',
    'Electricity Specs': '',
    'Electricity Cost / Unit (₹)': '',
    'Operating Cost Breakdown': '',
    'Operating Cost / Unit (₹)': '',
    'Base Prod Cost / Unit (₹)': 'GRAND TOTALS:',
    'Total Batch Prod Cost (₹)': Number(totalBatchProdCostSum.toFixed(2)),
    'Profit Target': '',
    'Profit / Unit (Pre-Discount) (₹)': '',
    'Selling Price (Pre-Discount) (₹)': '',
    'Bulk Order MOQ': totalMOQ,
    'Discount': '',
    'Final Selling Price / Unit (₹)': '',
    'Actual Net Profit / Unit (₹)': '',
    'Actual Margin %': '',
    'Total Batch Quote (Revenue) (₹)': Number(totalBatchQuoteSum.toFixed(2)),
    'Total Batch Net Profit (₹)': Number(totalBatchProfitSum.toFixed(2)),
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 40 },
    { wch: 45 },
    { wch: 22 },
    { wch: 55 },
    { wch: 22 },
    { wch: 55 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 20 },
    { wch: 24 },
    { wch: 26 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 30 },
    { wch: 26 },
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = category.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Admin Master';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const cleanCategoryName = category.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadWorkbook(workbook, `${cleanCategoryName}_Admin_Internal_Master.xlsx`);
}

/**
 * 3. Exports FULL CATALOG CUSTOMER QUOTE Excel (.xlsx)
 * Exports ALL Categories & ALL Products into a single master Customer Quote Excel file.
 */
export function exportFullCatalogCustomerExcel(
  categories: Category[],
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  if (products.length === 0) {
    alert('No products found in catalog. Please add products before exporting.');
    return;
  }

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const subcatMap = new Map(subcategories.map((s) => [s.id, s.name]));

  const exportRows: Record<string, string | number>[] = products.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const catName = catMap.get(prod.categoryId) || 'General Category';
    const subName = subcatMap.get(prod.subcategoryId) || 'General Subcategory';
    const dimMultiline = formatDimensions(prod.dimensions);

    const discountLabel =
      res.discountAmount > 0
        ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
        : 'None (0%)';

    return {
      'Category Name': catName,
      'Subcategory': subName,
      'Product Name': prod.name,
      'Product Dimensions': dimMultiline,
      'Per Unit Cost (Pre-Discount)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
      'Bulk Order MOQ': res.quantity,
      'Discount': discountLabel,
      'Bulk Order Cost Per Unit': Number(res.finalSellingPrice.toFixed(2)),
      'Total Batch Customer Quote (₹)': Number(res.totalSellingPrice.toFixed(2)),
    };
  });

  // Calculate full catalog totals
  const totalMOQ = products.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
  const totalBatchQuote = products.reduce(
    (sum, p) =>
      sum +
      (p.calculationResult?.totalSellingPrice ??
        ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );

  // Append Grand Total Row
  exportRows.push({
    'Category Name': 'TOTAL CATALOG',
    'Subcategory': '',
    'Product Name': `Total: ${products.length} Product(s)`,
    'Product Dimensions': '',
    'Per Unit Cost (Pre-Discount)': '',
    'Bulk Order MOQ': totalMOQ,
    'Discount': '',
    'Bulk Order Cost Per Unit': 'CATALOG GRAND TOTAL:',
    'Total Batch Customer Quote (₹)': Number(totalBatchQuote.toFixed(2)),
  });

  const workbook = XLSX.utils.book_new();

  // 1. Master Sheet with ALL Products
  const masterWorksheet = XLSX.utils.json_to_sheet(exportRows);
  masterWorksheet['!cols'] = [
    { wch: 24 },
    { wch: 22 },
    { wch: 28 },
    { wch: 45 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
  ];
  XLSX.utils.book_append_sheet(workbook, masterWorksheet, 'Full Catalog Quote');

  // 2. Individual Category Tabs
  categories.forEach((cat) => {
    const catSubSet = new Set(subcategories.filter((s) => s.categoryId === cat.id).map((s) => s.id));
    const catProducts = products.filter(
      (p) => p.categoryId === cat.id || (p.subcategoryId && catSubSet.has(p.subcategoryId))
    );

    if (catProducts.length > 0) {
      const catRows: Record<string, string | number>[] = catProducts.map((prod) => {
        const res = prod.calculationResult;
        const st = prod.calculatorState;
        const subName = subcatMap.get(prod.subcategoryId) || 'General';
        const dimMultiline = formatDimensions(prod.dimensions);

        const discountLabel =
          res.discountAmount > 0
            ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
            : 'None (0%)';

        return {
          'Category Name': cat.name,
          'Subcategory': subName,
          'Product Name': prod.name,
          'Product Dimensions': dimMultiline,
          'Per Unit Cost (Pre-Discount)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
          'Bulk Order MOQ': res.quantity,
          'Discount': discountLabel,
          'Bulk Order Cost Per Unit': Number(res.finalSellingPrice.toFixed(2)),
          'Total Batch Customer Quote (₹)': Number(res.totalSellingPrice.toFixed(2)),
        };
      });

      const catMOQ = catProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
      const catQuote = catProducts.reduce(
        (sum, p) =>
          sum +
          (p.calculationResult?.totalSellingPrice ??
            ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
        0
      );

      catRows.push({
        'Category Name': 'TOTAL',
        'Subcategory': '',
        'Product Name': `Total: ${catProducts.length} Product(s)`,
        'Product Dimensions': '',
        'Per Unit Cost (Pre-Discount)': '',
        'Bulk Order MOQ': catMOQ,
        'Discount': '',
        'Bulk Order Cost Per Unit': 'TOTAL BATCH QUOTE:',
        'Total Batch Customer Quote (₹)': Number(catQuote.toFixed(2)),
      });

      const catWorksheet = XLSX.utils.json_to_sheet(catRows);
      catWorksheet['!cols'] = masterWorksheet['!cols'];
      const safeSheetName = cat.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Category';
      XLSX.utils.book_append_sheet(workbook, catWorksheet, safeSheetName);
    }
  });

  downloadWorkbook(workbook, `Full_Catalog_3DPrint_Customer_Quote.xlsx`);
}

/**
 * 4. Exports FULL CATALOG ADMIN INTERNAL MASTER Excel (.xlsx)
 * Exports ALL Categories & ALL Products into a single master Admin Master Excel file.
 */
export function exportFullCatalogAdminExcel(
  categories: Category[],
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  if (products.length === 0) {
    alert('No products found in catalog. Please add products before exporting.');
    return;
  }

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const subcatMap = new Map(subcategories.map((s) => [s.id, s.name]));

  const exportRows: Record<string, string | number>[] = products.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const catName = catMap.get(prod.categoryId) || 'General Category';
    const subName = subcatMap.get(prod.subcategoryId) || 'General Subcategory';
    const dimMultiline = formatDimensions(prod.dimensions);

    const filamentLines = (res.filamentResults || [])
      .map((f) => `${f.name}: ${f.usedGrams}g @ ₹${f.costPerKg}/kg (₹${f.cost.toFixed(2)})`)
      .join('\r\n') || 'None';

    const elecHours = st.electricity?.printHours || 0;
    const elecMins = st.electricity?.printMinutes || 0;
    const elecWatts = st.electricity?.printerWatts || 0;
    const elecRate = st.electricity?.ratePerKwh || 0;
    const elecKwh = res.calculatedKwh || 0;
    const elecSpecs = `Time: ${elecHours}h ${elecMins}m | Power: ${elecWatts}W | KWh: ${elecKwh.toFixed(3)} | Rate: ₹${elecRate}/kWh`;

    const op = res.operatingBreakdown || { machineWear: 0, labour: 0, postProcessing: 0, packaging: 0, other: 0 };
    const opLines = `Wear: ₹${op.machineWear} | Labour: ₹${op.labour} | PostProc: ₹${op.postProcessing} | Pkg: ₹${op.packaging} | Other: ₹${op.other}`;

    const discountLabel =
      res.discountAmount > 0
        ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
        : 'None (0%)';

    const profitSetting = `${st.profit.value}${st.profit.mode === 'fixed' ? ' ₹' : `% ${st.profit.mode}`}`;
    const qty = res.quantity || 1;
    const totalBatchProdCost = res.totalProductionCost ?? (res.baseProductionCost * qty);
    const totalBatchQuote = res.totalSellingPrice ?? (res.finalSellingPrice * qty);
    const totalBatchProfit = res.totalProfit ?? ((res.actualProfitAfterDiscount || (res.finalSellingPrice - res.baseProductionCost)) * qty);

    return {
      'Category Name': catName,
      'Subcategory': subName,
      'Product Name': prod.name,
      'Product Dimensions': dimMultiline,
      'Filament Breakdown & Cost': filamentLines,
      'Material Cost / Unit (₹)': Number(res.totalMaterialCost.toFixed(2)),
      'Electricity Specs': elecSpecs,
      'Electricity Cost / Unit (₹)': Number(res.electricityCost.toFixed(2)),
      'Operating Cost Breakdown': opLines,
      'Operating Cost / Unit (₹)': Number(res.operatingCost.toFixed(2)),
      'Base Prod Cost / Unit (₹)': Number(res.baseProductionCost.toFixed(2)),
      'Total Batch Prod Cost (₹)': Number(totalBatchProdCost.toFixed(2)),
      'Profit Target': profitSetting,
      'Profit / Unit (Pre-Discount) (₹)': Number(res.profitAmount.toFixed(2)),
      'Selling Price (Pre-Discount) (₹)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
      'Bulk Order MOQ': qty,
      'Discount': discountLabel,
      'Final Selling Price / Unit (₹)': Number(res.finalSellingPrice.toFixed(2)),
      'Actual Net Profit / Unit (₹)': Number(res.actualProfitAfterDiscount.toFixed(2)),
      'Actual Margin %': `${(res.actualMarginAfterDiscount || 0).toFixed(1)}%`,
      'Total Batch Quote (Revenue) (₹)': Number(totalBatchQuote.toFixed(2)),
      'Total Batch Net Profit (₹)': Number(totalBatchProfit.toFixed(2)),
    };
  });

  // Calculate Admin Grand Totals
  const totalMOQ = products.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
  const totalBatchProdCostSum = products.reduce(
    (sum, p) => sum + (p.calculationResult?.totalProductionCost ?? ((p.calculationResult?.baseProductionCost || 0) * (p.calculationResult?.quantity || 1))),
    0
  );
  const totalBatchQuoteSum = products.reduce(
    (sum, p) => sum + (p.calculationResult?.totalSellingPrice ?? ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );
  const totalBatchProfitSum = products.reduce(
    (sum, p) => sum + (p.calculationResult?.totalProfit ?? (((p.calculationResult?.actualProfitAfterDiscount || 0) * (p.calculationResult?.quantity || 1)))),
    0
  );

  // Append Grand Total Summary Row
  exportRows.push({
    'Category Name': 'TOTAL CATALOG',
    'Subcategory': '',
    'Product Name': `Total: ${products.length} Product(s)`,
    'Product Dimensions': '',
    'Filament Breakdown & Cost': '',
    'Material Cost / Unit (₹)': '',
    'Electricity Specs': '',
    'Electricity Cost / Unit (₹)': '',
    'Operating Cost Breakdown': '',
    'Operating Cost / Unit (₹)': '',
    'Base Prod Cost / Unit (₹)': 'CATALOG GRAND TOTALS:',
    'Total Batch Prod Cost (₹)': Number(totalBatchProdCostSum.toFixed(2)),
    'Profit Target': '',
    'Profit / Unit (Pre-Discount) (₹)': '',
    'Selling Price (Pre-Discount) (₹)': '',
    'Bulk Order MOQ': totalMOQ,
    'Discount': '',
    'Final Selling Price / Unit (₹)': '',
    'Actual Net Profit / Unit (₹)': '',
    'Actual Margin %': '',
    'Total Batch Quote (Revenue) (₹)': Number(totalBatchQuoteSum.toFixed(2)),
    'Total Batch Net Profit (₹)': Number(totalBatchProfitSum.toFixed(2)),
  });

  const workbook = XLSX.utils.book_new();

  // 1. Master Sheet with ALL Products
  const masterWorksheet = XLSX.utils.json_to_sheet(exportRows);
  masterWorksheet['!cols'] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 26 },
    { wch: 40 },
    { wch: 45 },
    { wch: 22 },
    { wch: 55 },
    { wch: 22 },
    { wch: 55 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 20 },
    { wch: 24 },
    { wch: 26 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 30 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(workbook, masterWorksheet, 'Full Catalog Master');

  // 2. Individual Category Tabs
  categories.forEach((cat) => {
    const catSubSet = new Set(subcategories.filter((s) => s.categoryId === cat.id).map((s) => s.id));
    const catProducts = products.filter(
      (p) => p.categoryId === cat.id || (p.subcategoryId && catSubSet.has(p.subcategoryId))
    );

    if (catProducts.length > 0) {
      const catRows: Record<string, string | number>[] = catProducts.map((prod) => {
        const res = prod.calculationResult;
        const st = prod.calculatorState;
        const subName = subcatMap.get(prod.subcategoryId) || 'General';
        const dimMultiline = formatDimensions(prod.dimensions);

        const filamentLines = (res.filamentResults || [])
          .map((f) => `${f.name}: ${f.usedGrams}g @ ₹${f.costPerKg}/kg (₹${f.cost.toFixed(2)})`)
          .join('\r\n') || 'None';

        const elecHours = st.electricity?.printHours || 0;
        const elecMins = st.electricity?.printMinutes || 0;
        const elecWatts = st.electricity?.printerWatts || 0;
        const elecRate = st.electricity?.ratePerKwh || 0;
        const elecKwh = res.calculatedKwh || 0;
        const elecSpecs = `Time: ${elecHours}h ${elecMins}m | Power: ${elecWatts}W | KWh: ${elecKwh.toFixed(3)} | Rate: ₹${elecRate}/kWh`;

        const op = res.operatingBreakdown || { machineWear: 0, labour: 0, postProcessing: 0, packaging: 0, other: 0 };
        const opLines = `Wear: ₹${op.machineWear} | Labour: ₹${op.labour} | PostProc: ₹${op.postProcessing} | Pkg: ₹${op.packaging} | Other: ₹${op.other}`;

        const discountLabel =
          res.discountAmount > 0
            ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
            : 'None (0%)';

        const profitSetting = `${st.profit.value}${st.profit.mode === 'fixed' ? ' ₹' : `% ${st.profit.mode}`}`;
        const qty = res.quantity || 1;
        const totalBatchProdCost = res.totalProductionCost ?? (res.baseProductionCost * qty);
        const totalBatchQuote = res.totalSellingPrice ?? (res.finalSellingPrice * qty);
        const totalBatchProfit = res.totalProfit ?? ((res.actualProfitAfterDiscount || (res.finalSellingPrice - res.baseProductionCost)) * qty);

        return {
          'Category Name': cat.name,
          'Subcategory': subName,
          'Product Name': prod.name,
          'Product Dimensions': dimMultiline,
          'Filament Breakdown & Cost': filamentLines,
          'Material Cost / Unit (₹)': Number(res.totalMaterialCost.toFixed(2)),
          'Electricity Specs': elecSpecs,
          'Electricity Cost / Unit (₹)': Number(res.electricityCost.toFixed(2)),
          'Operating Cost Breakdown': opLines,
          'Operating Cost / Unit (₹)': Number(res.operatingCost.toFixed(2)),
          'Base Prod Cost / Unit (₹)': Number(res.baseProductionCost.toFixed(2)),
          'Total Batch Prod Cost (₹)': Number(totalBatchProdCost.toFixed(2)),
          'Profit Target': profitSetting,
          'Profit / Unit (Pre-Discount) (₹)': Number(res.profitAmount.toFixed(2)),
          'Selling Price (Pre-Discount) (₹)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
          'Bulk Order MOQ': qty,
          'Discount': discountLabel,
          'Final Selling Price / Unit (₹)': Number(res.finalSellingPrice.toFixed(2)),
          'Actual Net Profit / Unit (₹)': Number(res.actualProfitAfterDiscount.toFixed(2)),
          'Actual Margin %': `${(res.actualMarginAfterDiscount || 0).toFixed(1)}%`,
          'Total Batch Quote (Revenue) (₹)': Number(totalBatchQuote.toFixed(2)),
          'Total Batch Net Profit (₹)': Number(totalBatchProfit.toFixed(2)),
        };
      });

      const catMOQ = catProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
      const catBatchProd = catProducts.reduce(
        (sum, p) => sum + (p.calculationResult?.totalProductionCost ?? ((p.calculationResult?.baseProductionCost || 0) * (p.calculationResult?.quantity || 1))),
        0
      );
      const catBatchQuote = catProducts.reduce(
        (sum, p) => sum + (p.calculationResult?.totalSellingPrice ?? ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
        0
      );
      const catBatchProfit = catProducts.reduce(
        (sum, p) => sum + (p.calculationResult?.totalProfit ?? (((p.calculationResult?.actualProfitAfterDiscount || 0) * (p.calculationResult?.quantity || 1)))),
        0
      );

      catRows.push({
        'Category Name': 'TOTAL',
        'Subcategory': '',
        'Product Name': `Total: ${catProducts.length} Product(s)`,
        'Product Dimensions': '',
        'Filament Breakdown & Cost': '',
        'Material Cost / Unit (₹)': '',
        'Electricity Specs': '',
        'Electricity Cost / Unit (₹)': '',
        'Operating Cost Breakdown': '',
        'Operating Cost / Unit (₹)': '',
        'Base Prod Cost / Unit (₹)': 'GRAND TOTALS:',
        'Total Batch Prod Cost (₹)': Number(catBatchProd.toFixed(2)),
        'Profit Target': '',
        'Profit / Unit (Pre-Discount) (₹)': '',
        'Selling Price (Pre-Discount) (₹)': '',
        'Bulk Order MOQ': catMOQ,
        'Discount': '',
        'Final Selling Price / Unit (₹)': '',
        'Actual Net Profit / Unit (₹)': '',
        'Actual Margin %': '',
        'Total Batch Quote (Revenue) (₹)': Number(catBatchQuote.toFixed(2)),
        'Total Batch Net Profit (₹)': Number(catBatchProfit.toFixed(2)),
      });

      const catWorksheet = XLSX.utils.json_to_sheet(catRows);
      catWorksheet['!cols'] = masterWorksheet['!cols'];
      const safeSheetName = cat.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Category';
      XLSX.utils.book_append_sheet(workbook, catWorksheet, safeSheetName);
    }
  });

  downloadWorkbook(workbook, `Full_Catalog_3DPrint_Admin_Master.xlsx`);
}

// Default export alias for compatibility
export const exportCategoryToExcel = exportCategoryCustomerExcel;
