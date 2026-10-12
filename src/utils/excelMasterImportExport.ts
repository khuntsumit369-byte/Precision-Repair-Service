import * as XLSX from 'xlsx';
import { CatalogItem, Customer, SupplierClient, UnitMasterItem, StaffMember } from '../types';

/**
 * Downloads a worksheet workbook as an Excel (.xlsx) file
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 1. UNIT MASTERS EXPORT & TEMPLATE
// ==========================================
export function exportUnitMastersToExcel(units: UnitMasterItem[], filename = 'Precision_Unit_Masters') {
  const data = units.map((u, idx) => ({
    'Sr No': idx + 1,
    'Prefix Code': u.codePrefix,
    'Unit / Machine Name': u.name,
    'Gujarati Name': u.nameGu || '',
    'Category': u.category,
    'Service Charge (₹)': u.defaultServiceCharge,
    'Warranty (Days)': u.defaultWarrantyDays,
    'Common Issues': u.commonIssues ? u.commonIssues.join(', ') : '',
    'Status': u.active ? 'Active' : 'Inactive',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 30 },
    { wch: 25 },
    { wch: 24 },
    { wch: 18 },
    { wch: 16 },
    { wch: 40 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Unit Masters');
  downloadWorkbook(workbook, filename);
}

export function downloadUnitMastersTemplate() {
  const sample = [
    {
      'Prefix Code': 'HP',
      'Unit / Machine Name': 'Dental Handpiece High Speed',
      'Gujarati Name': 'ડેન્ટલ હેન્ડપીસ હાઈ સ્પીડ',
      'Category': 'Dental Equipment',
      'Service Charge (₹)': 200,
      'Warranty (Days)': 30,
      'Common Issues': 'Bearing noise, Water block, Burr slipping',
      'Status': 'Active',
    },
    {
      'Prefix Code': 'MOT',
      'Unit / Machine Name': 'Micro-Motor Handpiece 35000 RPM',
      'Gujarati Name': 'માઇક્રો મોટર હેન્ડપીસ',
      'Category': 'Jewellery & Lab Micro-Tools',
      'Service Charge (₹)': 150,
      'Warranty (Days)': 30,
      'Common Issues': 'Carbon brush worn, Cable wire cut, Heating',
      'Status': 'Active',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 26 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 42 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Unit Masters Template');
  downloadWorkbook(wb, 'Unit_Masters_Sample_Template');
}

// ==========================================
// 2. PARTS & SERVICES EXPORT & TEMPLATE
// ==========================================
export function exportCatalogToExcel(catalog: CatalogItem[], filename = 'Precision_Parts_Catalog') {
  const data = catalog.map((p, idx) => ({
    'Sr No': idx + 1,
    'Part Code': p.code,
    'Item Name': p.name,
    'Gujarati Name': p.nameGu || '',
    'Type': p.type, // 'part' or 'service'
    'Category': p.category || '',
    'Sale Price (₹)': p.salePrice,
    'Cost Price (₹)': p.costPrice || 0,
    'Current Stock': p.type === 'part' ? (p.stock ?? 0) : '-',
    'Unit': p.unit || 'pcs',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 12 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parts & Services');
  downloadWorkbook(wb, filename);
}

export function downloadCatalogTemplate() {
  const sample = [
    {
      'Part Code': 'PRT-BRG-70',
      'Item Name': 'Miniature High-Speed Bearing',
      'Gujarati Name': 'હાઈ સ્પીડ બેરિંગ',
      'Type': 'part',
      'Category': 'Mechanical Spare Parts',
      'Sale Price (₹)': 70,
      'Cost Price (₹)': 42,
      'Current Stock': 100,
      'Unit': 'pcs',
    },
    {
      'Part Code': 'SRV-HP-200',
      'Item Name': 'Handpiece Service Labor Charge',
      'Gujarati Name': 'હેન્ડપીસ સર્વિસ ચાર્જ',
      'Type': 'service',
      'Category': 'Labor & Servicing',
      'Sale Price (₹)': 200,
      'Cost Price (₹)': 0,
      'Current Stock': '-',
      'Unit': 'job',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 30 },
    { wch: 24 },
    { wch: 12 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parts Template');
  downloadWorkbook(wb, 'Parts_Catalog_Sample_Template');
}

// ==========================================
// 3. CUSTOMER MASTER EXPORT & TEMPLATE
// ==========================================
export function exportCustomersToExcel(customers: Customer[], filename = 'Precision_Customers_Master') {
  const data = customers.map((c, idx) => ({
    'Sr No': idx + 1,
    'Customer Name': c.name,
    'Contact Person': c.contactPerson || '',
    'Phone': c.phone,
    'City': c.city,
    'Address': c.address || '',
    'GSTIN': c.gstNumber || '',
    'Balance Due (₹)': c.balanceDue || 0,
    'Total Invoices': c.totalInvoicesCount || 0,
    'Total Billed (₹)': c.totalBilledAmount || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 35 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  downloadWorkbook(wb, filename);
}

export function downloadCustomersTemplate() {
  const sample = [
    {
      'Customer Name': 'Govindji Jewellers',
      'Contact Person': 'Shree Govindbhai',
      'Phone': '+91 98242 11223',
      'City': 'Rajkot',
      'Address': 'Near Palace Road, Gold Market',
      'GSTIN': '24AABCG1234F1Z8',
      'Balance Due (₹)': 0,
    },
    {
      'Customer Name': 'Ambica Ornaments',
      'Contact Person': 'Hareshbhai',
      'Phone': '+91 99090 44556',
      'City': 'Ahmedabad',
      'Address': 'Manek Chowk Gold Bazaar',
      'GSTIN': '',
      'Balance Due (₹)': 1450,
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [{ wch: 26 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 32 }, { wch: 18 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers Template');
  downloadWorkbook(wb, 'Customer_Master_Sample_Template');
}

// ==========================================
// 4. SUPPLIERS MASTER EXPORT & TEMPLATE
// ==========================================
export function exportSuppliersToExcel(suppliers: SupplierClient[], filename = 'Precision_Suppliers_Master') {
  const data = suppliers.map((s, idx) => ({
    'Sr No': idx + 1,
    'Supplier Name': s.name,
    'Contact Person': s.contactPerson || '',
    'Phone': s.phone,
    'City': s.city,
    'Address': s.address || '',
    'GSTIN': s.gstNumber || '',
    'Category': s.category || '',
    'Notes': s.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 35 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
  downloadWorkbook(wb, filename);
}

export function downloadSuppliersTemplate() {
  const sample = [
    {
      'Supplier Name': 'Royal Spares Rajkot',
      'Contact Person': 'Mansukhbhai Patel',
      'Phone': '+91 98250 88991',
      'City': 'Rajkot',
      'Address': 'Shop No. 4, Lati Plot Main Road',
      'GSTIN': '24AABFR1234F1Z9',
      'Category': 'Spare Parts Distributor',
      'Notes': 'High speed bearings and cables dealer',
    },
    {
      'Supplier Name': 'Shreeji Electronics',
      'Contact Person': 'Nileshbhai Vora',
      'Phone': '+91 94260 33221',
      'City': 'Rajkot',
      'Address': 'Dhebar Road, Opp. ST Stand',
      'GSTIN': '24AAJFS4455K1Z8',
      'Category': 'Electronic Components',
      'Notes': 'MOSFETs, capacitors and transformers',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 26 },
    { wch: 22 },
    { wch: 18 },
    { wch: 16 },
    { wch: 32 },
    { wch: 18 },
    { wch: 24 },
    { wch: 35 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Suppliers Template');
  downloadWorkbook(wb, 'Suppliers_Master_Sample_Template');
}

// ==========================================
// 5. STAFF MASTER EXPORT & TEMPLATE
// ==========================================
export function exportStaffToExcel(staff: StaffMember[], filename = 'Precision_Staff_Master') {
  const data = staff.map((st, idx) => ({
    'Sr No': idx + 1,
    'Staff Name': st.name,
    'Gujarati Name': st.nameGu || '',
    'Phone': st.phone,
    'Role': st.role,
    'Salary (₹)': st.salary,
    'Salary Type': st.salaryType,
    'Joining Date': st.joiningDate || '',
    'Address': st.address || '',
    'Notes': st.notes || '',
    'Status': st.active ? 'Active' : 'Inactive',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 30 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Staff');
  downloadWorkbook(wb, filename);
}

export function downloadStaffTemplate() {
  const sample = [
    {
      'Staff Name': 'Ramesh Patel',
      'Gujarati Name': 'રમેશ પટેલ',
      'Phone': '+91 98790 12345',
      'Role': 'Senior Handpiece Technician',
      'Salary (₹)': 18000,
      'Salary Type': 'Monthly',
      'Joining Date': '2025-01-10',
      'Address': 'Mavdi Plot, Rajkot',
      'Notes': 'Lead repair specialist',
      'Status': 'Active',
    },
    {
      'Staff Name': 'Haresh Parmar',
      'Gujarati Name': 'હરેશ પરમાર',
      'Phone': '+91 98245 67890',
      'Role': 'Electronics & PCB Specialist',
      'Salary (₹)': 15000,
      'Salary Type': 'Monthly',
      'Joining Date': '2025-06-01',
      'Address': 'Kothariya Road, Rajkot',
      'Notes': 'Marathon controller specialist',
      'Status': 'Active',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 28 },
    { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Staff Template');
  downloadWorkbook(wb, 'Staff_Master_Sample_Template');
}

// ==========================================
// GENERIC EXCEL PARSER FOR UPLOADS
// ==========================================
export async function parseUploadedExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Helpers to extract field case-insensitively
function getVal(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const target of possibleKeys) {
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of rowKeys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanTarget && row[key] !== undefined && row[key] !== '') {
        return row[key];
      }
    }
  }
  return '';
}

// 1. Transform raw rows to UnitMasterItem[]
export function transformRowsToUnits(rows: any[]): UnitMasterItem[] {
  return rows
    .map((r, i) => {
      const name = String(getVal(r, ['Unit / Machine Name', 'Unit Name', 'Machine Name', 'Name', 'નામ'])).trim();
      if (!name) return null;

      const prefix = String(getVal(r, ['Prefix Code', 'Prefix', 'Code Prefix', 'Code', 'કોડ'])).trim().toUpperCase() || 'HP';
      const nameGu = String(getVal(r, ['Gujarati Name', 'Name Gu', 'ગુજરાતી નામ'])).trim();
      const category = String(getVal(r, ['Category', 'કેટેગરી'])).trim() || 'Dental Equipment';
      const charge = Number(getVal(r, ['Service Charge (₹)', 'Service Charge', 'Charge', 'સર્વિસ ચાર્જ'])) || 200;
      const warranty = Number(getVal(r, ['Warranty (Days)', 'Warranty Days', 'Warranty', 'વોરંટી'])) || 30;
      const issuesRaw = String(getVal(r, ['Common Issues', 'Issues', 'સમસ્યાઓ']));
      const issues = issuesRaw
        ? issuesRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;
      const statusRaw = String(getVal(r, ['Status', 'Active', 'સ્થિતિ'])).toLowerCase();
      const active = !statusRaw.includes('inact') && !statusRaw.includes('બંધ');

      const unit: UnitMasterItem = {
        id: 'um-' + Date.now() + '-' + i,
        name,
        nameGu: nameGu || undefined,
        category,
        codePrefix: prefix,
        defaultServiceCharge: charge,
        defaultWarrantyDays: warranty,
        commonIssues: issues,
        active,
      };
      return unit;
    })
    .filter(Boolean) as UnitMasterItem[];
}

// 2. Transform raw rows to CatalogItem[]
export function transformRowsToCatalog(rows: any[]): CatalogItem[] {
  return rows
    .map((r, i) => {
      const name = String(getVal(r, ['Item Name', 'Part Name', 'Name', 'પાર્ટનું નામ', 'નામ'])).trim();
      if (!name) return null;

      const code = String(getVal(r, ['Part Code', 'Code', 'Item Code', 'કોડ'])).trim().toUpperCase() || ('PRT-' + Math.floor(100 + Math.random() * 900));
      const nameGu = String(getVal(r, ['Gujarati Name', 'Name Gu', 'ગુજરાતી નામ'])).trim();
      const typeRaw = String(getVal(r, ['Type', 'પ્રકાર'])).trim().toLowerCase();
      const type: 'part' | 'service' = typeRaw.includes('serv') || typeRaw.includes('સર્વિસ') ? 'service' : 'part';
      const category = String(getVal(r, ['Category', 'કેટેગરી'])).trim() || (type === 'service' ? 'Labor & Servicing' : 'Mechanical Spare Parts');
      const salePrice = Number(getVal(r, ['Sale Price (₹)', 'Sale Price', 'Price', 'વેચાણ ભાવ', 'ભાવ'])) || 0;
      const costPrice = Number(getVal(r, ['Cost Price (₹)', 'Cost Price', 'Purchase Price', 'ખરીદ ભાવ'])) || 0;
      const stockRaw = getVal(r, ['Current Stock', 'Stock', 'જથ્થો']);
      const stock = type === 'part' ? (Number(stockRaw) || 0) : undefined;
      const unit = String(getVal(r, ['Unit', 'એકમ'])).trim() || (type === 'service' ? 'job' : 'pcs');

      const item: CatalogItem = {
        id: 'item-' + Date.now() + '-' + i,
        code,
        name,
        nameGu: nameGu || undefined,
        type,
        category,
        salePrice,
        costPrice,
        stock,
        unit,
      };
      return item;
    })
    .filter(Boolean) as CatalogItem[];
}

// 3. Transform raw rows to Customer[]
export function transformRowsToCustomers(rows: any[]): Customer[] {
  return rows
    .map((r, i) => {
      const name = String(getVal(r, ['Customer Name', 'Client Name', 'Name', 'ગ્રાહકનું નામ', 'નામ'])).trim();
      if (!name) return null;

      const contact = String(getVal(r, ['Contact Person', 'Contact', 'સંપર્ક વ્યક્તિ'])).trim();
      const phone = String(getVal(r, ['Phone', 'Mobile', 'Mobile No', 'મોબાઇલ નંબર'])).trim();
      const city = String(getVal(r, ['City', 'શહેર'])).trim() || 'Rajkot';
      const address = String(getVal(r, ['Address', 'Shop Address', 'સરનામું'])).trim();
      const gst = String(getVal(r, ['GSTIN', 'GST', 'GST Number', 'GST નંબર'])).trim().toUpperCase();
      const balance = Number(getVal(r, ['Balance Due (₹)', 'Balance Due', 'Balance', 'બાકી રકમ'])) || 0;

      const cust: Customer = {
        id: 'cust-' + Date.now() + '-' + i,
        name,
        contactPerson: contact || undefined,
        phone,
        city,
        address: address || undefined,
        gstNumber: gst || undefined,
        balanceDue: balance,
        totalInvoicesCount: 0,
        totalBilledAmount: 0,
      };
      return cust;
    })
    .filter(Boolean) as Customer[];
}

// 4. Transform raw rows to SupplierClient[]
export function transformRowsToSuppliers(rows: any[]): SupplierClient[] {
  return rows
    .map((r, i) => {
      const name = String(getVal(r, ['Supplier Name', 'Vendor Name', 'Name', 'સપ્લાયર નામ', 'વેન્ડર નામ'])).trim();
      if (!name) return null;

      const contact = String(getVal(r, ['Contact Person', 'Contact', 'સંપર્ક વ્યક્તિ'])).trim();
      const phone = String(getVal(r, ['Phone', 'Mobile', 'Mobile No', 'મોબાઇલ નંબર'])).trim();
      const city = String(getVal(r, ['City', 'શહેર'])).trim() || 'Rajkot';
      const address = String(getVal(r, ['Address', 'સરનામું'])).trim();
      const gst = String(getVal(r, ['GSTIN', 'GST', 'GST Number', 'GST નંબર'])).trim().toUpperCase();
      const category = String(getVal(r, ['Category', 'કેટેગરી'])).trim() || 'Spare Parts Distributor';
      const notes = String(getVal(r, ['Notes', 'Remark', 'નોંધ'])).trim();

      const sup: SupplierClient = {
        id: 'sup-' + Date.now() + '-' + i,
        name,
        contactPerson: contact || undefined,
        phone,
        city,
        address: address || undefined,
        gstNumber: gst || undefined,
        category,
        notes: notes || undefined,
      };
      return sup;
    })
    .filter(Boolean) as SupplierClient[];
}

// 5. Transform raw rows to StaffMember[]
export function transformRowsToStaff(rows: any[]): StaffMember[] {
  return rows
    .map((r, i) => {
      const name = String(getVal(r, ['Staff Name', 'Employee Name', 'Name', 'સ્ટાફ નામ', 'કારીગર નામ'])).trim();
      if (!name) return null;

      const nameGu = String(getVal(r, ['Gujarati Name', 'Name Gu', 'ગુજરાતી નામ'])).trim();
      const phone = String(getVal(r, ['Phone', 'Mobile', 'મોબાઇલ નંબર'])).trim();
      const role = String(getVal(r, ['Role', 'Designation', 'હોદ્દો'])).trim() || 'Technician';
      const salary = Number(getVal(r, ['Salary (₹)', 'Salary', 'પગાર'])) || 15000;
      const salaryTypeRaw = String(getVal(r, ['Salary Type', 'Type', 'પગાર પ્રકાર'])).toLowerCase();
      let salaryType: 'Monthly' | 'Daily' | 'Per-Piece' = 'Monthly';
      if (salaryTypeRaw.includes('day') || salaryTypeRaw.includes('દૈનિક')) salaryType = 'Daily';
      if (salaryTypeRaw.includes('piece') || salaryTypeRaw.includes('પીસ')) salaryType = 'Per-Piece';

      const joiningDate = String(getVal(r, ['Joining Date', 'Date', 'તારીખ'])).trim() || new Date().toISOString().split('T')[0];
      const address = String(getVal(r, ['Address', 'સરનામું'])).trim();
      const notes = String(getVal(r, ['Notes', 'નોંધ'])).trim();
      const statusRaw = String(getVal(r, ['Status', 'Active', 'સ્થિતિ'])).toLowerCase();
      const active = !statusRaw.includes('inact') && !statusRaw.includes('બંધ');

      const st: StaffMember = {
        id: 'staff-' + Date.now() + '-' + i,
        name,
        nameGu: nameGu || undefined,
        phone,
        role,
        salary,
        salaryType,
        joiningDate,
        address: address || undefined,
        notes: notes || undefined,
        active,
        createdAt: new Date().toISOString(),
      };
      return st;
    })
    .filter(Boolean) as StaffMember[];
}
