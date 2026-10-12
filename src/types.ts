export type ItemType = 'part' | 'service';

export interface CatalogItem {
  id: string;
  code: string; // e.g. PRT-BRG-01, SRV-HP-01
  name: string; // e.g. Bearing, Cable
  nameGu?: string; // e.g. બેરિંગ, કેબલ
  type: ItemType;
  salePrice: number; // e.g. 70, 250, 200
  costPrice: number; // purchase/cost price
  stock?: number; // for physical parts
  unit?: string; // pcs, set, etc.
  category?: string; // Mechanical, Electrical, Service
}

export interface UnitPartUsage {
  id: string;
  catalogItemId?: string;
  name: string;
  code?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice?: number; // purchase/cost price per unit
  totalCost?: number; // total purchase cost (quantity * costPrice)
}

export interface UnitServiceCharge {
  id: string;
  catalogItemId?: string;
  name: string;
  charge: number;
}

export interface RepairedUnit {
  id: string;
  unitType: 'Handpiece' | 'Motor' | 'Micro-Motor' | 'Ultrasonic' | 'Custom' | string;
  unitName: string; // e.g. "Handpiece 1", "Motor 2"
  trackingCode: string; // e.g. "HP-2608-01", "MOT-2608-01"
  serialNumber?: string; // manufacturer serial if any
  brandModel?: string; // e.g. "NSK", "Marathon", "Strong"
  reportedIssue?: string; // e.g. "Vibration, no rotation, cable cut"
  technicianNotes?: string; // notes on repair
  parts: UnitPartUsage[];
  services: UnitServiceCharge[];
  unitSubtotal: number; // total parts + services
  warrantyDays: number; // e.g. 30 days
  status: 'Repaired' | 'In-Progress' | 'Delivered' | 'Replaced';
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0801"
  date: string; // YYYY-MM-DD e.g. "2026-08-25"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerCity?: string;
  units: RepairedUnit[];
  totalUnitsCount: number;
  partsTotal: number;
  servicesTotal: number;
  subtotal: number;
  discount: number;
  taxPercent: number; // 0, 5, 12, 18
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  remarks?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string; // e.g. "Govindji Jewellers"
  contactPerson?: string;
  phone: string;
  city: string;
  address?: string;
  gstNumber?: string;
  balanceDue: number;
  totalInvoicesCount: number;
  totalBilledAmount: number;
}

export interface PaymentRecord {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  discountWaived?: number; // waived / discounted amount when collecting payment
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
  notes?: string;
  createdAt?: string;
}

export interface PurchaseItem {
  id: string;
  catalogItemId: string;
  code?: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseRecord {
  id: string;
  purchaseNo: string; // e.g. "PUR-2026-001"
  billNumber?: string; // vendor bill number
  supplierId?: string; // linked SupplierClient id from Supplier Master
  vendorName: string; // e.g. "Royal Spares Rajkot", "Gujarat Micro-Tools"
  vendorPhone?: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent' // દુકાન ભાડું
  | 'Electricity' // લાઈટ બિલ
  | 'Tea & Refreshment' // ચા-નાસ્તો
  | 'Courier & Transport' // કુરિયર / ટ્રાન્સપોર્ટ
  | 'Salary' // સ્ટાફ પગાર
  | 'Tools & Consumables' // ટૂલ્સ & કેમિકલ્સ
  | 'Maintenance' // મેન્ટેનન્સ / રિપેરિંગ
  | 'Other'; // પરચૂરણ ખર્ચ

export type ExpenseType = 'EXPENSE' | 'STAFF_RECEIPT';

export interface ExpenseRecord {
  id: string;
  expenseNo: string; // e.g. "EXP-2026-001" or "STR-2026-001"
  date: string;
  category: ExpenseCategory;
  type?: ExpenseType; // 'EXPENSE' (outflow, reduces net balance) or 'STAFF_RECEIPT' (inflow from staff, increases net balance)
  title: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  paidTo?: string; // or receivedFrom
  staffId?: string; // linked staff member ID
  staffName?: string; // staff member name
  notes?: string;
  createdAt: string;
}

export interface WorkshopSettings {
  workshopName: string;
  workshopNameGu: string;
  tagline: string;
  ownerName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address: string;
  city: string;
  gstin?: string;
  logoUrl?: string;
  terms: string[];
  defaultWarrantyDays: number;
  currencySymbol: string;
}

export interface UnitMasterItem {
  id: string;
  name: string; // e.g. "Dental Handpiece", "Micro-Motor", "Marathon Motor"
  nameGu?: string; // e.g. "હેન્ડપીસ", "માઇક્રો મોટર"
  category: string; // "Dental Equipment", "Jewellery Tools", "Motors"
  codePrefix: string; // e.g. "HP", "MOT", "MIC", "USC"
  defaultServiceCharge: number; // default service charge ₹
  defaultWarrantyDays: number; // e.g. 30 days
  commonIssues?: string[]; // e.g. ["Vibration / Noise", "Heating", "Bearing jammed", "Cable cut"]
  active: boolean;
}

export interface SupplierClient {
  id: string;
  name: string; // e.g. "Royal Spares Rajkot", "Gujarat Micro-Tools"
  contactPerson?: string;
  phone: string;
  city: string;
  address?: string;
  gstNumber?: string;
  category?: string; // e.g. "Spare Parts Distributor", "Bearing Importer", "Dental Supplies"
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string; // e.g. "Ramesh Patel", "Haresh Parmar"
  nameGu?: string;
  phone: string; // e.g. "+91 98790 12345"
  role: string; // e.g. "Senior Technician", "Assistant Technician", "Helper", "Accountant"
  salary: number; // e.g. 18000
  salaryType: 'Monthly' | 'Daily' | 'Per-Piece';
  joiningDate?: string; // e.g. "2025-01-10"
  active: boolean;
  address?: string;
  notes?: string;
  createdAt?: string;
}

