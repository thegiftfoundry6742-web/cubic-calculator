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
 * Helper to group products by Category and Subcategory preserving visual UI order
 */
function buildGroupedProductsForCategory(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const catSubs = subcategories.filter((s) => s.categoryId === category.id);
  const subcatSet = new Set(catSubs.map((s) => s.id));
  const subcatMap = new Map(catSubs.map((s) => [s.id, s.name]));

  // All products matching category directly or via subcategoryId
  const categoryProducts = products.filter(
    (p) => p.categoryId === category.id || (p.subcategoryId && subcatSet.has(p.subcategoryId))
  );

  const groups: { subcategoryName: string; subcategoryId: string | null; products: CatalogProduct[] }[] = [];

  // 1. Group by known subcategories in exact UI order
  catSubs.forEach((sub) => {
    const subProds = categoryProducts.filter((p) => p.subcategoryId === sub.id);
    if (subProds.length > 0) {
      groups.push({
        subcategoryName: sub.name,
        subcategoryId: sub.id,
        products: subProds,
      });
    }
  });

  // 2. Group orphan products (no subcategory or unlisted subcategory)
  const groupedProdIds = new Set(groups.flatMap((g) => g.products.map((p) => p.id)));
  const orphanProds = categoryProducts.filter((p) => !groupedProdIds.has(p.id));
  if (orphanProds.length > 0) {
    groups.push({
      subcategoryName: 'General / Unassigned',
      subcategoryId: null,
      products: orphanProds,
    });
  }

  return { categoryProducts, groups, subcatMap };
}

/**
 * 1. Single Category Customer Excel Export
 */
export function exportCategoryCustomerExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const { categoryProducts, groups } = buildGroupedProductsForCategory(category, subcategories, products);

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = [];

  groups.forEach((group) => {
    let groupMOQ = 0;
    let groupQuote = 0;

    group.products.forEach((prod) => {
      const res = prod.calculationResult;
      const st = prod.calculatorState;
      const dimMultiline = formatDimensions(prod.dimensions);

      const discountLabel =
        res.discountAmount > 0
          ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
          : 'None (0%)';

      const qty = res.quantity || 1;
      const totalQuote = res.totalSellingPrice ?? (res.finalSellingPrice * qty);

      groupMOQ += qty;
      groupQuote += totalQuote;

      exportRows.push({
        'Category Name': category.name,
        'Subcategory': group.subcategoryName,
        'Product Name': prod.name,
        'Product Dimensions': dimMultiline,
        'Per Unit Cost (Pre-Discount)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
        'Bulk Order MOQ': qty,
        'Discount': discountLabel,
        'Bulk Order Cost Per Unit': Number(res.finalSellingPrice.toFixed(2)),
        'Total Batch Customer Quote (₹)': Number(totalQuote.toFixed(2)),
      });
    });

    // Add Subcategory Subtotal Row if more than 1 product in subcategory
    if (group.products.length > 1) {
      exportRows.push({
        'Category Name': category.name,
        'Subcategory': `Subtotal: ${group.subcategoryName}`,
        'Product Name': `${group.products.length} Products Subtotal`,
        'Product Dimensions': '',
        'Per Unit Cost (Pre-Discount)': '',
        'Bulk Order MOQ': groupMOQ,
        'Discount': '',
        'Bulk Order Cost Per Unit': 'Subtotal Quote:',
        'Total Batch Customer Quote (₹)': Number(groupQuote.toFixed(2)),
      });
    }
  });

  // Calculate Category Grand Totals
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
    'Category Name': 'CATEGORY TOTAL',
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
    { wch: 24 },
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
 * 2. Single Category Admin Internal Master Excel Export
 */
export function exportCategoryAdminExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const { categoryProducts, groups } = buildGroupedProductsForCategory(category, subcategories, products);

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = [];

  groups.forEach((group) => {
    let groupMOQ = 0;
    let groupProdCost = 0;
    let groupQuote = 0;
    let groupProfit = 0;

    group.products.forEach((prod) => {
      const res = prod.calculationResult;
      const st = prod.calculatorState;
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

      groupMOQ += qty;
      groupProdCost += totalBatchProdCost;
      groupQuote += totalBatchQuote;
      groupProfit += totalBatchProfit;

      exportRows.push({
        'Category Name': category.name,
        'Subcategory': group.subcategoryName,
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
      });
    });

    // Subcategory Subtotal Row if > 1 product
    if (group.products.length > 1) {
      exportRows.push({
        'Category Name': category.name,
        'Subcategory': `Subtotal: ${group.subcategoryName}`,
        'Product Name': `${group.products.length} Products Subtotal`,
        'Product Dimensions': '',
        'Filament Breakdown & Cost': '',
        'Material Cost / Unit (₹)': '',
        'Electricity Specs': '',
        'Electricity Cost / Unit (₹)': '',
        'Operating Cost Breakdown': '',
        'Operating Cost / Unit (₹)': '',
        'Base Prod Cost / Unit (₹)': 'Subtotal Prod Cost:',
        'Total Batch Prod Cost (₹)': Number(groupProdCost.toFixed(2)),
        'Profit Target': '',
        'Profit / Unit (Pre-Discount) (₹)': '',
        'Selling Price (Pre-Discount) (₹)': '',
        'Bulk Order MOQ': groupMOQ,
        'Discount': '',
        'Final Selling Price / Unit (₹)': '',
        'Actual Net Profit / Unit (₹)': '',
        'Actual Margin %': '',
        'Total Batch Quote (Revenue) (₹)': Number(groupQuote.toFixed(2)),
        'Total Batch Net Profit (₹)': Number(groupProfit.toFixed(2)),
      });
    }
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
    'Category Name': 'CATEGORY TOTAL',
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
    { wch: 22 },
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
 * 3. Full Catalog Customer Quote Excel Export
 * Organizes products by Category and Subcategory across all sheets.
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

  const workbook = XLSX.utils.book_new();
  const masterExportRows: Record<string, string | number>[] = [];

  // Group products by Category and Subcategory
  categories.forEach((cat) => {
    const { categoryProducts, groups } = buildGroupedProductsForCategory(cat, subcategories, products);
    if (categoryProducts.length === 0) return;

    const categorySheetRows: Record<string, string | number>[] = [];

    groups.forEach((group) => {
      let subMOQ = 0;
      let subQuote = 0;

      group.products.forEach((prod) => {
        const res = prod.calculationResult;
        const st = prod.calculatorState;
        const dimMultiline = formatDimensions(prod.dimensions);

        const discountLabel =
          res.discountAmount > 0
            ? `${st.discount.value}${st.discount.mode === 'percentage' ? '%' : ' ₹'} (-₹${res.discountAmount.toFixed(2)})`
            : 'None (0%)';

        const qty = res.quantity || 1;
        const totalQuote = res.totalSellingPrice ?? (res.finalSellingPrice * qty);

        subMOQ += qty;
        subQuote += totalQuote;

        const rowData = {
          'Category Name': cat.name,
          'Subcategory': group.subcategoryName,
          'Product Name': prod.name,
          'Product Dimensions': dimMultiline,
          'Per Unit Cost (Pre-Discount)': Number(res.sellingPriceBeforeDiscount.toFixed(2)),
          'Bulk Order MOQ': qty,
          'Discount': discountLabel,
          'Bulk Order Cost Per Unit': Number(res.finalSellingPrice.toFixed(2)),
          'Total Batch Customer Quote (₹)': Number(totalQuote.toFixed(2)),
        };

        masterExportRows.push(rowData);
        categorySheetRows.push(rowData);
      });

      // Subcategory Subtotal
      if (group.products.length > 1) {
        const subtotalRow = {
          'Category Name': cat.name,
          'Subcategory': `Subtotal: ${group.subcategoryName}`,
          'Product Name': `${group.products.length} Products Subtotal`,
          'Product Dimensions': '',
          'Per Unit Cost (Pre-Discount)': '',
          'Bulk Order MOQ': subMOQ,
          'Discount': '',
          'Bulk Order Cost Per Unit': 'Subtotal Quote:',
          'Total Batch Customer Quote (₹)': Number(subQuote.toFixed(2)),
        };

        masterExportRows.push(subtotalRow);
        categorySheetRows.push(subtotalRow);
      }
    });

    // Category Total for individual category tab
    const catMOQ = categoryProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
    const catQuote = categoryProducts.reduce(
      (sum, p) =>
        sum +
        (p.calculationResult?.totalSellingPrice ??
          ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
      0
    );

    categorySheetRows.push({
      'Category Name': 'CATEGORY TOTAL',
      'Subcategory': '',
      'Product Name': `Total: ${categoryProducts.length} Product(s)`,
      'Product Dimensions': '',
      'Per Unit Cost (Pre-Discount)': '',
      'Bulk Order MOQ': catMOQ,
      'Discount': '',
      'Bulk Order Cost Per Unit': 'TOTAL BATCH QUOTE:',
      'Total Batch Customer Quote (₹)': Number(catQuote.toFixed(2)),
    });

    // Build Category Worksheet
    const catWorksheet = XLSX.utils.json_to_sheet(categorySheetRows);
    catWorksheet['!cols'] = [
      { wch: 24 },
      { wch: 24 },
      { wch: 28 },
      { wch: 45 },
      { wch: 28 },
      { wch: 18 },
      { wch: 22 },
      { wch: 28 },
      { wch: 32 },
    ];
    const safeSheetName = cat.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Category';
    XLSX.utils.book_append_sheet(workbook, catWorksheet, safeSheetName);
  });

  // Calculate Catalog Grand Totals
  const totalMOQ = products.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
  const totalBatchQuote = products.reduce(
    (sum, p) =>
      sum +
      (p.calculationResult?.totalSellingPrice ??
        ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );

  // Append Grand Total to Master Sheet
  masterExportRows.push({
    'Category Name': 'FULL CATALOG TOTAL',
    'Subcategory': '',
    'Product Name': `Total: ${products.length} Product(s)`,
    'Product Dimensions': '',
    'Per Unit Cost (Pre-Discount)': '',
    'Bulk Order MOQ': totalMOQ,
    'Discount': '',
    'Bulk Order Cost Per Unit': 'CATALOG GRAND TOTAL:',
    'Total Batch Customer Quote (₹)': Number(totalBatchQuote.toFixed(2)),
  });

  // Master Sheet with ALL Categories & Subcategories
  const masterWorksheet = XLSX.utils.json_to_sheet(masterExportRows);
  masterWorksheet['!cols'] = [
    { wch: 24 },
    { wch: 24 },
    { wch: 28 },
    { wch: 45 },
    { wch: 28 },
    { wch: 18 },
    { wch: 22 },
    { wch: 28 },
    { wch: 32 },
  ];

  // Insert master worksheet as 1st tab
  const sheetNames = workbook.SheetNames;
  workbook.SheetNames = ['All Categories & Subcategories', ...sheetNames];
  workbook.Sheets['All Categories & Subcategories'] = masterWorksheet;

  downloadWorkbook(workbook, `Full_Catalog_3DPrint_Customer_Quote.xlsx`);
}

/**
 * 4. Full Catalog Admin Internal Master Excel Export
 * Organizes products by Category and Subcategory across all sheets with full manufacturing costs.
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

  const workbook = XLSX.utils.book_new();
  const masterExportRows: Record<string, string | number>[] = [];

  categories.forEach((cat) => {
    const { categoryProducts, groups } = buildGroupedProductsForCategory(cat, subcategories, products);
    if (categoryProducts.length === 0) return;

    const categorySheetRows: Record<string, string | number>[] = [];

    groups.forEach((group) => {
      let subMOQ = 0;
      let subProdCost = 0;
      let subQuote = 0;
      let subProfit = 0;

      group.products.forEach((prod) => {
        const res = prod.calculationResult;
        const st = prod.calculatorState;
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

        subMOQ += qty;
        subProdCost += totalBatchProdCost;
        subQuote += totalBatchQuote;
        subProfit += totalBatchProfit;

        const rowData = {
          'Category Name': cat.name,
          'Subcategory': group.subcategoryName,
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

        masterExportRows.push(rowData);
        categorySheetRows.push(rowData);
      });

      // Subcategory Subtotal Row if > 1 product
      if (group.products.length > 1) {
        const subtotalRow = {
          'Category Name': cat.name,
          'Subcategory': `Subtotal: ${group.subcategoryName}`,
          'Product Name': `${group.products.length} Products Subtotal`,
          'Product Dimensions': '',
          'Filament Breakdown & Cost': '',
          'Material Cost / Unit (₹)': '',
          'Electricity Specs': '',
          'Electricity Cost / Unit (₹)': '',
          'Operating Cost Breakdown': '',
          'Operating Cost / Unit (₹)': '',
          'Base Prod Cost / Unit (₹)': 'Subtotal Prod Cost:',
          'Total Batch Prod Cost (₹)': Number(subProdCost.toFixed(2)),
          'Profit Target': '',
          'Profit / Unit (Pre-Discount) (₹)': '',
          'Selling Price (Pre-Discount) (₹)': '',
          'Bulk Order MOQ': subMOQ,
          'Discount': '',
          'Final Selling Price / Unit (₹)': '',
          'Actual Net Profit / Unit (₹)': '',
          'Actual Margin %': '',
          'Total Batch Quote (Revenue) (₹)': Number(subQuote.toFixed(2)),
          'Total Batch Net Profit (₹)': Number(subProfit.toFixed(2)),
        };

        masterExportRows.push(subtotalRow);
        categorySheetRows.push(subtotalRow);
      }
    });

    // Category Total Row
    const catMOQ = categoryProducts.reduce((sum, p) => sum + (p.calculationResult?.quantity || 1), 0);
    const catBatchProd = categoryProducts.reduce(
      (sum, p) => sum + (p.calculationResult?.totalProductionCost ?? ((p.calculationResult?.baseProductionCost || 0) * (p.calculationResult?.quantity || 1))),
      0
    );
    const catBatchQuote = categoryProducts.reduce(
      (sum, p) => sum + (p.calculationResult?.totalSellingPrice ?? ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
      0
    );
    const catBatchProfit = categoryProducts.reduce(
      (sum, p) => sum + (p.calculationResult?.totalProfit ?? (((p.calculationResult?.actualProfitAfterDiscount || 0) * (p.calculationResult?.quantity || 1)))),
      0
    );

    categorySheetRows.push({
      'Category Name': 'CATEGORY TOTAL',
      'Subcategory': '',
      'Product Name': `Total: ${categoryProducts.length} Product(s)`,
      'Product Dimensions': '',
      'Filament Breakdown & Cost': '',
      'Material Cost / Unit (₹)': '',
      'Electricity Specs': '',
      'Electricity Cost / Unit (₹)': '',
      'Operating Cost Breakdown': '',
      'Operating Cost / Unit (₹)': '',
      'Base Prod Cost / Unit (₹)': 'CATEGORY TOTALS:',
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

    const catWorksheet = XLSX.utils.json_to_sheet(categorySheetRows);
    catWorksheet['!cols'] = [
      { wch: 22 },
      { wch: 22 },
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
    const safeSheetName = cat.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Category';
    XLSX.utils.book_append_sheet(workbook, catWorksheet, safeSheetName);
  });

  // Calculate Admin Grand Totals for Master Sheet
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

  // Append Catalog Grand Total Row
  masterExportRows.push({
    'Category Name': 'FULL CATALOG TOTAL',
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

  const masterWorksheet = XLSX.utils.json_to_sheet(masterExportRows);
  masterWorksheet['!cols'] = [
    { wch: 22 },
    { wch: 22 },
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

  // Insert master worksheet as 1st tab
  const sheetNames = workbook.SheetNames;
  workbook.SheetNames = ['All Categories & Subcategories', ...sheetNames];
  workbook.Sheets['All Categories & Subcategories'] = masterWorksheet;

  downloadWorkbook(workbook, `Full_Catalog_3DPrint_Admin_Master.xlsx`);
}

// Default export alias for compatibility
export const exportCategoryToExcel = exportCategoryCustomerExcel;
