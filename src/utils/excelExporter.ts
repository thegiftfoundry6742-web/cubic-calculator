import * as XLSX from 'xlsx';
import type { Category, Subcategory, CatalogProduct, DimensionItem } from '../types/calculator';

/**
 * Exports products under a specific Category and its Subcategories into a clean downloadable Excel (.xlsx) file.
 * Includes the requested fields:
 * 1. Category Name
 * 2. Subcategory Name
 * 3. Product Name
 * 4. Product Dimensions (formatted line-by-line for multi-part dimensions)
 * 5. Per Unit Cost (Pre-Discount)
 * 6. Bulk Order MOQ (Quantity)
 * 7. Discount
 * 8. Bulk Order Cost Per Unit (Final customer cost per unit in bulk order)
 * 9. Total Batch Customer Quote (₹) (Total batch quote for the bulk order quantity)
 */
export function exportCategoryToExcel(
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

    // Handle Multi-Part Dimensions
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

    // Multiline Product Dimensions string (one part below the other)
    const dimMultiline = dims
      .map(
        (d, idx) =>
          `${d.name || `Part #${idx + 1}`}: ${d.lengthMm || 0} × ${d.widthMm || 0} × ${d.heightMm || 0} mm${
            d.diameterMm ? ` (Dia: ${d.diameterMm}mm)` : ''
          }`
      )
      .join('\r\n');

    // Discount description text
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

  // Calculate totals across exported category products
  const totalCategoryMOQ = categoryProducts.reduce(
    (sum, p) => sum + (p.calculationResult?.quantity || 1),
    0
  );

  const totalCategoryBatchQuote = categoryProducts.reduce(
    (sum, p) =>
      sum +
      (p.calculationResult?.totalSellingPrice ??
        ((p.calculationResult?.finalSellingPrice || 0) * (p.calculationResult?.quantity || 1))),
    0
  );

  // Append Grand Total Row at the end of the Excel table
  exportRows.push({
    'Category Name': 'TOTAL',
    'Subcategory': '',
    'Product Name': `Total: ${categoryProducts.length} Product(s)`,
    'Product Dimensions': '',
    'Per Unit Cost (Pre-Discount)': '',
    'Bulk Order MOQ': totalCategoryMOQ,
    'Discount': '',
    'Bulk Order Cost Per Unit': 'TOTAL BATCH QUOTE:',
    'Total Batch Customer Quote (₹)': Number(totalCategoryBatchQuote.toFixed(2)),
  });

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Set column widths dynamically for clean presentation
  worksheet['!cols'] = [
    { wch: 24 }, // Category Name
    { wch: 22 }, // Subcategory
    { wch: 28 }, // Product Name
    { wch: 45 }, // Product Dimensions
    { wch: 28 }, // Per Unit Cost (Pre-Discount)
    { wch: 18 }, // Bulk Order MOQ
    { wch: 22 }, // Discount
    { wch: 28 }, // Bulk Order Cost Per Unit
    { wch: 32 }, // Total Batch Customer Quote (₹)
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = category.name.replace(/[:\\/?*\[\]]/g, '').slice(0, 31) || 'Catalog';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // Write file name
  const cleanCategoryName = category.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanCategoryName}_3DPrint_Catalog.xlsx`;

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
