import { CatalogItem, Customer, ExpenseRecord, Invoice, PaymentRecord, PurchaseRecord, WorkshopSettings, UnitMasterItem, SupplierClient, StaffMember } from '../types';
import {
  INITIAL_CATALOG,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PURCHASES,
  INITIAL_SETTINGS,
  INITIAL_UNIT_MASTERS,
  INITIAL_SUPPLIERS,
  INITIAL_STAFF,
} from '../data/initialData';

const STORAGE_KEYS = {
  CATALOG: 'repairflow_catalog_v1',
  INVOICES: 'repairflow_invoices_v1',
  CUSTOMERS: 'repairflow_customers_v1',
  PAYMENTS: 'repairflow_payments_v1',
  PURCHASES: 'repairflow_purchases_v1',
  EXPENSES: 'repairflow_expenses_v1',
  SETTINGS: 'repairflow_settings_v1',
  LANG: 'repairflow_lang_v1',
  UNIT_MASTERS: 'repairflow_unit_masters_v1',
  SUPPLIERS: 'repairflow_suppliers_v1',
  STAFF: 'repairflow_staff_v1',
  CLEARED_V2: 'repairflow_cleared_to_zero_v2',
};

// Immediate cleanup: Clear all bills, purchases, payments, and expenses to 0-0
// Masters (Catalog, Unit Masters, Suppliers, Staff, Settings) are strictly preserved!
if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.CLEARED_V2) !== 'true') {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

    const rawCust = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (rawCust) {
      const parsedCust = JSON.parse(rawCust);
      if (Array.isArray(parsedCust)) {
        const clearedCusts = parsedCust.map((c: any) => ({
          ...c,
          balanceDue: 0,
          totalInvoicesCount: 0,
          totalBilledAmount: 0,
        }));
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(clearedCusts));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    }
  } catch (e) {
    console.error('Storage clear error:', e);
  }
  localStorage.setItem(STORAGE_KEYS.CLEARED_V2, 'true');
}

export function loadCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) {
      saveCatalog(INITIAL_CATALOG);
      return INITIAL_CATALOG;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading catalog:', e);
    return INITIAL_CATALOG;
  }
}

export function saveCatalog(items: CatalogItem[]): void {
  localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(items));
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      saveInvoices(INITIAL_INVOICES);
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading invoices:', e);
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading customers:', e);
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function loadPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!raw) {
      savePayments(INITIAL_PAYMENTS);
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading payments:', e);
    return INITIAL_PAYMENTS;
  }
}

export function savePayments(payments: PaymentRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
}

export function loadPurchases(): PurchaseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!raw) {
      savePurchases(INITIAL_PURCHASES);
      return INITIAL_PURCHASES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading purchases:', e);
    return INITIAL_PURCHASES;
  }
}

export function savePurchases(purchases: PurchaseRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
}

export function loadExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      saveExpenses(INITIAL_EXPENSES);
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading expenses:', e);
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: ExpenseRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function loadSettings(): WorkshopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_SETTINGS,
      ...parsed,
    };
  } catch (e) {
    console.error('Error loading settings:', e);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: WorkshopSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadLanguage(): 'gu' | 'en' {
  const saved = localStorage.getItem(STORAGE_KEYS.LANG);
  return (saved === 'en' || saved === 'gu') ? saved : 'gu';
}

export function saveLanguage(lang: 'gu' | 'en'): void {
  localStorage.setItem(STORAGE_KEYS.LANG, lang);
}

export function loadUnitMasters(): UnitMasterItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNIT_MASTERS);
    if (!raw) {
      saveUnitMasters(INITIAL_UNIT_MASTERS);
      return INITIAL_UNIT_MASTERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading unit masters:', e);
    return INITIAL_UNIT_MASTERS;
  }
}

export function saveUnitMasters(units: UnitMasterItem[]): void {
  localStorage.setItem(STORAGE_KEYS.UNIT_MASTERS, JSON.stringify(units));
}

export function loadSuppliers(): SupplierClient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (!raw) {
      saveSuppliers(INITIAL_SUPPLIERS);
      return INITIAL_SUPPLIERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading suppliers:', e);
    return INITIAL_SUPPLIERS;
  }
}

export function saveSuppliers(suppliers: SupplierClient[]): void {
  localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
}

export function loadStaffMembers(): StaffMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) {
      saveStaffMembers(INITIAL_STAFF);
      return INITIAL_STAFF;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading staff members:', e);
    return INITIAL_STAFF;
  }
}

export function saveStaffMembers(staff: StaffMember[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
}

export function resetAllToDefault(): void {
  localStorage.removeItem(STORAGE_KEYS.CATALOG);
  localStorage.removeItem(STORAGE_KEYS.INVOICES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
  localStorage.removeItem(STORAGE_KEYS.PURCHASES);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  // Restore settings directly to permanent INITIAL_SETTINGS
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  localStorage.removeItem(STORAGE_KEYS.UNIT_MASTERS);
  localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
  localStorage.removeItem(STORAGE_KEYS.STAFF);
}
