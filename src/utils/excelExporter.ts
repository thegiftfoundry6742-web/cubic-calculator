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
 * 1. Exports CUSTOMER QUOTE Excel Sheet (.xlsx)
 * Clean, customer-facing quotation with pricing & quantities.
 */
export function exportCategoryCustomerExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const subcatMap = new Map(categorySubcategories.map((s) => [s.id, s.name]));
  const categoryProducts = products.filter((p) => p.categoryId === category.id);

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = categoryProducts.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const subName = subcatMap.get(prod.subcategoryId) || 'General';

    // Multi-Part Dimensions
    const dims: DimensionItem[] = Array.isArray(prod.dimensions) && prod.dimensions.length > 0
      ? prod.dimensions
      : [
          {
            id: 'legacy',
            name: 'Main Body',
            lengthMm: (prod.dimensions as any)?.lengthMm || 0,
            widthMm: (prod.dimensions as any)?.widthMm || 0,
            heightMm: (prod.dimensions as any)?.heightMm || 0,
            diameterMm: (prod.dimensions as any)?.diameterMm || 0,
          },
        ];

    const dimMultiline = dims
      .map(
        (d, idx) =>
          `${d.name || `Part #${idx + 1}`}: ${d.lengthMm || 0} × ${d.widthMm || 0} × ${d.heightMm || 0} mm${
            d.diameterMm ? ` (Dia: ${d.diameterMm}mm)` : ''
          }`
      )
      .join('\r\n');

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
 * 2. Exports ADMIN INTERNAL MASTER Excel Sheet (.xlsx)
 * Full manufacturing cost breakdown (filaments, electricity, operating expenses, margins, net profit).
 */
export function exportCategoryAdminExcel(
  category: Category,
  subcategories: Subcategory[],
  products: CatalogProduct[]
) {
  const categorySubcategories = subcategories.filter((s) => s.categoryId === category.id);
  const subcatMap = new Map(categorySubcategories.map((s) => [s.id, s.name]));
  const categoryProducts = products.filter((p) => p.categoryId === category.id);

  if (categoryProducts.length === 0) {
    alert(`No products found in category "${category.name}". Please add products before exporting.`);
    return;
  }

  const exportRows: Record<string, string | number>[] = categoryProducts.map((prod) => {
    const res = prod.calculationResult;
    const st = prod.calculatorState;
    const subName = subcatMap.get(prod.subcategoryId) || 'General';

    // Multi-Part Dimensions
    const dims: DimensionItem[] = Array.isArray(prod.dimensions) && prod.dimensions.length > 0
      ? prod.dimensions
      : [
          {
            id: 'legacy',
            name: 'Main Body',
            lengthMm: (prod.dimensions as any)?.lengthMm || 0,
            widthMm: (prod.dimensions as any)?.widthMm || 0,
            heightMm: (prod.dimensions as any)?.heightMm || 0,
            diameterMm: (prod.dimensions as any)?.diameterMm || 0,
          },
        ];

    const dimMultiline = dims
      .map(
        (d, idx) =>
          `${d.name || `Part #${idx + 1}`}: ${d.lengthMm || 0} × ${d.widthMm || 0} × ${d.heightMm || 0} mm${
            d.diameterMm ? ` (Dia: ${d.diameterMm}mm)` : ''
          }`
      )
      .join('\r\n');

    // Filaments multiline string
    const filamentLines = (res.filamentResults || [])
      .map((f) => `${f.name}: ${f.usedGrams}g @ ₹${f.costPerKg}/kg (₹${f.cost.toFixed(2)})`)
      .join('\r\n') || 'None';

    // Electricity specs
    const elecHours = st.electricity.printHours || 0;
    const elecMins = st.electricity.printMinutes || 0;
    const elecWatts = st.electricity.printerWatts || 0;
    const elecRate = st.electricity.ratePerKwh || 0;
    const elecKwh = res.calculatedKwh || 0;
    const elecSpecs = `Time: ${elecHours}h ${elecMins}m | Power: ${elecWatts}W | KWh: ${elecKwh.toFixed(3)} | Rate: ₹${elecRate}/kWh`;

    // Operating expenses breakdown
    const op = res.operatingBreakdown || { machineWear: 0, labour: 0, postProcessing: 0, packaging: 0, other: 0 };
    const opLines = `Wear: ₹${op.machineWear} | Labour: ₹${op.labour} | PostProc: ₹${op.postProcessing} | Pkg: ₹${op.packaging} | Other: ₹${op.other}`;

    // Discount label
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
    { wch: 22 }, // Category
    { wch: 20 }, // Subcategory
    { wch: 26 }, // Product Name
    { wch: 40 }, // Dimensions
    { wch: 45 }, // Filament Breakdown
    { wch: 22 }, // Material Cost
    { wch: 55 }, // Electricity Specs
    { wch: 22 }, // Electricity Cost
    { wch: 55 }, // Operating Breakdown
    { wch: 22 }, // Operating Cost
    { wch: 24 }, // Base Prod Cost
    { wch: 26 }, // Total Batch Prod Cost
    { wch: 20 }, // Profit Target
    { wch: 24 }, // Profit Amount
    { wch: 26 }, // Selling Price Pre-Discount
    { wch: 16 }, // Bulk Order MOQ
    { wch: 20 }, // Discount
    { wch: 24 }, // Final Selling Price
    { wch: 24 }, // Actual Net Profit
    { wch: 18 }, // Actual Margin %
    { wch: 30 }, // Total Batch Quote
    { wch: 26 }, // Total Batch Net Profit
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = category.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Admin Master';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const cleanCategoryName = category.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadWorkbook(workbook, `${cleanCategoryName}_Admin_Internal_Master.xlsx`);
}

// Default export alias for compatibility
export const exportCategoryToExcel = exportCategoryCustomerExcel;
