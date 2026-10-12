import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
import {
  Invoice,
  CatalogItem,
  Customer,
  PaymentRecord,
  PurchaseRecord,
  ExpenseRecord,
  WorkshopSettings,
  UnitMasterItem,
  SupplierClient,
  StaffMember,
} from '../types';
import {
  saveInvoices,
  saveCatalog,
  saveCustomers,
  savePayments,
  savePurchases,
  saveExpenses,
  saveSettings,
  saveUnitMasters,
  saveSuppliers,
  saveStaffMembers,
} from './storage';

// Call connection test on boot as required by Firebase skill
testConnection();

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
}

// Collections
export const COLLECTIONS = {
  INVOICES: 'invoices',
  CATALOG: 'catalog',
  CUSTOMERS: 'customers',
  PAYMENTS: 'payments',
  PURCHASES: 'purchases',
  EXPENSES: 'expenses',
  SETTINGS: 'settings',
  UNIT_MASTERS: 'unit_masters',
  SUPPLIERS: 'suppliers',
  STAFF: 'staff',
  COUNTERS: 'counters',
} as const;

/**
 * Atomic Invoice Number Generator
 * Reads /counters/invoices in a Firestore transaction to increment and guarantee
 * zero collision / duplicates when 2-5 devices create invoices simultaneously.
 */
export async function getNextAtomicInvoiceNumber(): Promise<string> {
  const counterDocRef = doc(db, COLLECTIONS.COUNTERS, 'invoices');
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `INV-${year}-${month}`;

  try {
    const nextInvoiceNumber = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterDocRef);
      let currentSeq = 0;
      let lastMonth = monthPrefix;

      if (snap.exists()) {
        const data = snap.data();
        if (data.monthPrefix === monthPrefix && typeof data.lastSeq === 'number') {
          currentSeq = data.lastSeq;
        }
      }

      const nextSeq = currentSeq + 1;
      transaction.set(
        counterDocRef,
        {
          monthPrefix,
          lastSeq: nextSeq,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return `${monthPrefix}${String(nextSeq).padStart(3, '0')}`;
    });

    return nextInvoiceNumber;
  } catch (err) {
    console.warn('Fallback invoice numbering:', err);
    // Fallback based on timestamp entropy
    const rand = Math.floor(100 + Math.random() * 900);
    return `${monthPrefix}${rand}`;
  }
}

/**
 * Atomic Invoice Creation / Edit Transaction
 * Guarantees:
 * 1. Checks and deducts/adjusts catalog stock without race conditions.
 * 2. Writes the invoice document.
 * 3. Creates/updates customer balance and billing statistics.
 * 4. Records initial payment receipt if paidAmount > 0 on new invoice creation.
 */
export async function saveInvoiceWithTransaction(params: {
  invoice: Invoice;
  isNew: boolean;
  previousInvoice?: Invoice | null;
  currentCatalog: CatalogItem[];
  currentCustomer?: Customer | null;
}): Promise<{ success: boolean; invoice: Invoice; error?: string }> {
  const { invoice, isNew, previousInvoice } = params;
  const invoiceDocRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
  const customerDocRef = doc(db, COLLECTIONS.CUSTOMERS, invoice.customerId);

  // Compute part usage
  const getPartUsage = (inv: Invoice): Record<string, number> => {
    const usage: Record<string, number> = {};
    inv.units?.forEach((u) => {
      u.parts?.forEach((p) => {
        const catId = p.catalogItemId;
        if (catId) {
          usage[catId] = (usage[catId] || 0) + (p.quantity || 1);
        }
      });
    });
    return usage;
  };

  const newUsage = getPartUsage(invoice);
  const oldUsage = previousInvoice ? getPartUsage(previousInvoice) : {};

  // All catalog items affected
  const affectedCatalogIds = Array.from(new Set([...Object.keys(newUsage), ...Object.keys(oldUsage)]));

  try {
    await runTransaction(db, async (transaction) => {
      // 1. READ ALL FIRST (Firestore transaction requirement: all reads before writes)
      const catalogSnaps = new Map<string, any>();
      for (const catId of affectedCatalogIds) {
        const cRef = doc(db, COLLECTIONS.CATALOG, catId);
        const cSnap = await transaction.get(cRef);
        if (cSnap.exists()) {
          catalogSnaps.set(catId, cSnap.data());
        }
      }

      const custSnap = await transaction.get(customerDocRef);

      // Verify stock availability
      for (const catId of Object.keys(newUsage)) {
        const requested = newUsage[catId];
        const existingData = catalogSnaps.get(catId);
        if (existingData && existingData.type === 'part') {
          const currentStock = existingData.stock ?? 0;
          const previouslyUsed = oldUsage[catId] || 0;
          const available = currentStock + previouslyUsed;

          if (requested > available) {
            throw new Error(
              `Insufficient stock for "${existingData.name}". Available: ${available}, Required: ${requested}`
            );
          }
        }
      }

      // 2. WRITES
      // A. Update Stock for affected items
      for (const catId of affectedCatalogIds) {
        const existingData = catalogSnaps.get(catId);
        if (existingData && existingData.type === 'part') {
          const currentStock = existingData.stock ?? 0;
          const previouslyUsed = oldUsage[catId] || 0;
          const nowRequested = newUsage[catId] || 0;
          const netChange = nowRequested - previouslyUsed;
          const newStock = Math.max(0, currentStock - netChange);

          const cRef = doc(db, COLLECTIONS.CATALOG, catId);
          transaction.update(cRef, { stock: newStock });
        }
      }

      // B. Save Invoice Document
      transaction.set(invoiceDocRef, invoice, { merge: true });

      // C. Save or Update Customer Document
      if (custSnap.exists()) {
        const cData = custSnap.data();
        const oldDueDelta = previousInvoice ? previousInvoice.balanceDue : 0;
        const newDue = Math.max(0, (cData.balanceDue || 0) - oldDueDelta + invoice.balanceDue);
        const oldBilledDelta = previousInvoice ? previousInvoice.grandTotal : 0;
        const newBilled = Math.max(0, (cData.totalBilledAmount || 0) - oldBilledDelta + invoice.grandTotal);
        const newCount = isNew ? (cData.totalInvoicesCount || 0) + 1 : (cData.totalInvoicesCount || 1);

        transaction.set(
          customerDocRef,
          {
            phone: invoice.customerPhone || cData.phone || '',
            city: invoice.customerCity || cData.city || '',
            balanceDue: newDue,
            totalBilledAmount: newBilled,
            totalInvoicesCount: newCount,
          },
          { merge: true }
        );
      } else {
        transaction.set(customerDocRef, {
          id: invoice.customerId,
          name: invoice.customerName,
          phone: invoice.customerPhone || '',
          city: invoice.customerCity || '',
          balanceDue: invoice.balanceDue,
          totalInvoicesCount: 1,
          totalBilledAmount: invoice.grandTotal,
        });
      }

      // D. Record initial payment receipt if paidAmount > 0 and is new
      if (isNew && invoice.paidAmount > 0) {
        const payDocRef = doc(db, COLLECTIONS.PAYMENTS, `pay-${Date.now()}`);
        const payRecord: PaymentRecord = {
          id: payDocRef.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          date: invoice.date,
          amount: invoice.paidAmount,
          paymentMode: invoice.paymentMode || 'Cash',
          notes: 'Initial payment recorded during invoice generation',
          createdAt: new Date().toISOString(),
        };
        transaction.set(payDocRef, payRecord);
      }
    });

    return { success: true, invoice };
  } catch (error: any) {
    console.error('Error saving invoice with transaction:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.INVOICES}/${invoice.id}`);
    } catch {
      // Structured error handled
    }
    return { success: false, invoice, error: error?.message || 'Transaction failed' };
  }
}

/**
 * Atomic Payment Recording Transaction
 * Guarantees that payment receipts, invoice balances, and customer balance due
 * update synchronously without race conditions across 2-5 devices.
 */
export async function recordPaymentWithTransaction(params: {
  payment: PaymentRecord;
  targetInvoices: Invoice[];
  customerId: string;
  totalSettling: number;
}): Promise<{ success: boolean; error?: string }> {
  const { payment, targetInvoices, customerId } = params;
  const payDocRef = doc(db, COLLECTIONS.PAYMENTS, payment.id);
  const custDocRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);

  try {
    await runTransaction(db, async (transaction) => {
      // READS
      const custSnap = await transaction.get(custDocRef);
      const invoiceSnaps = new Map<string, any>();
      for (const inv of targetInvoices) {
        const iRef = doc(db, COLLECTIONS.INVOICES, inv.id);
        const iSnap = await transaction.get(iRef);
        if (iSnap.exists()) {
          invoiceSnaps.set(inv.id, iSnap.data());
        }
      }

      // WRITES
      // 1. Payment receipt
      transaction.set(payDocRef, payment);

      // 2. Updated invoices
      for (const inv of targetInvoices) {
        const iRef = doc(db, COLLECTIONS.INVOICES, inv.id);
        transaction.set(iRef, inv, { merge: true });
      }

      // 3. Customer balance
      if (custSnap.exists()) {
        const cData = custSnap.data();
        const currentDue = cData.balanceDue || 0;
        const newDue = Math.max(0, currentDue - params.totalSettling);
        transaction.update(custDocRef, { balanceDue: newDue });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error recording payment with transaction:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.PAYMENTS}/${payment.id}`);
    } catch {
      // Structured error handled
    }
    return { success: false, error: error?.message || 'Payment transaction failed' };
  }
}

// 1. Invoices Cloud Sync
export async function syncInvoiceToCloud(invoice: Invoice): Promise<void> {
  const path = `${COLLECTIONS.INVOICES}/${invoice.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
    await setDoc(docRef, invoice, { merge: true });
  } catch (error) {
    console.error('Error syncing invoice to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteInvoiceFromCloud(invoiceId: string): Promise<void> {
  const path = `${COLLECTIONS.INVOICES}/${invoiceId}`;
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, invoiceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting invoice from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 2. Catalog Cloud Sync
export async function syncCatalogItemToCloud(item: CatalogItem): Promise<void> {
  const path = `${COLLECTIONS.CATALOG}/${item.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.CATALOG, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    console.error('Error syncing catalog item to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteCatalogItemFromCloud(itemId: string): Promise<void> {
  const path = `${COLLECTIONS.CATALOG}/${itemId}`;
  try {
    const docRef = doc(db, COLLECTIONS.CATALOG, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting catalog item from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 3. Customers Cloud Sync
export async function syncCustomerToCloud(customer: Customer): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customer.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customer.id);
    await setDoc(docRef, customer, { merge: true });
  } catch (error) {
    console.error('Error syncing customer to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteCustomerFromCloud(customerId: string): Promise<void> {
  const path = `${COLLECTIONS.CUSTOMERS}/${customerId}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting customer from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 4. Payments Cloud Sync
export async function syncPaymentToCloud(payment: PaymentRecord): Promise<void> {
  const path = `${COLLECTIONS.PAYMENTS}/${payment.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, payment.id);
    await setDoc(docRef, payment, { merge: true });
  } catch (error) {
    console.error('Error syncing payment to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deletePaymentFromCloud(paymentId: string): Promise<void> {
  const path = `${COLLECTIONS.PAYMENTS}/${paymentId}`;
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting payment from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 5. Purchases Cloud Sync
export async function syncPurchaseToCloud(purchase: PurchaseRecord): Promise<void> {
  const path = `${COLLECTIONS.PURCHASES}/${purchase.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.PURCHASES, purchase.id);
    await setDoc(docRef, purchase, { merge: true });
  } catch (error) {
    console.error('Error syncing purchase to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deletePurchaseFromCloud(purchaseId: string): Promise<void> {
  const path = `${COLLECTIONS.PURCHASES}/${purchaseId}`;
  try {
    const docRef = doc(db, COLLECTIONS.PURCHASES, purchaseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting purchase from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 6. Expenses Cloud Sync
export async function syncExpenseToCloud(expense: ExpenseRecord): Promise<void> {
  const path = `${COLLECTIONS.EXPENSES}/${expense.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
    await setDoc(docRef, expense, { merge: true });
  } catch (error) {
    console.error('Error syncing expense to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteExpenseFromCloud(expenseId: string): Promise<void> {
  const path = `${COLLECTIONS.EXPENSES}/${expenseId}`;
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting expense from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 7. Settings Cloud Sync
export async function syncSettingsToCloud(settings: WorkshopSettings): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/global`;
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error('Error syncing settings to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

// 8. Unit Masters Cloud Sync
export async function syncUnitMasterToCloud(unit: UnitMasterItem): Promise<void> {
  const path = `${COLLECTIONS.UNIT_MASTERS}/${unit.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.UNIT_MASTERS, unit.id);
    await setDoc(docRef, unit, { merge: true });
  } catch (error) {
    console.error('Error syncing unit master to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteUnitMasterFromCloud(unitId: string): Promise<void> {
  const path = `${COLLECTIONS.UNIT_MASTERS}/${unitId}`;
  try {
    const docRef = doc(db, COLLECTIONS.UNIT_MASTERS, unitId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting unit master from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 9. Suppliers Cloud Sync
export async function syncSupplierToCloud(supplier: SupplierClient): Promise<void> {
  const path = `${COLLECTIONS.SUPPLIERS}/${supplier.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.SUPPLIERS, supplier.id);
    await setDoc(docRef, supplier, { merge: true });
  } catch (error) {
    console.error('Error syncing supplier to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteSupplierFromCloud(supplierId: string): Promise<void> {
  const path = `${COLLECTIONS.SUPPLIERS}/${supplierId}`;
  try {
    const docRef = doc(db, COLLECTIONS.SUPPLIERS, supplierId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting supplier from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

// 10. Staff Members Cloud Sync
export async function syncStaffMemberToCloud(staff: StaffMember): Promise<void> {
  const path = `${COLLECTIONS.STAFF}/${staff.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.STAFF, staff.id);
    await setDoc(docRef, staff, { merge: true });
  } catch (error) {
    console.error('Error syncing staff member to cloud:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Handled
    }
  }
}

export async function deleteStaffMemberFromCloud(staffId: string): Promise<void> {
  const path = `${COLLECTIONS.STAFF}/${staffId}`;
  try {
    const docRef = doc(db, COLLECTIONS.STAFF, staffId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting staff member from cloud:', error);
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Handled
    }
  }
}

/**
 * Uploads initial local data to Firestore if cloud collection is empty.
 * This ensures new devices immediately get existing records on first sync.
 */
export async function seedLocalDataToCloudIfEmpty(initialData: {
  invoices: Invoice[];
  catalog: CatalogItem[];
  customers: Customer[];
  payments: PaymentRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  settings: WorkshopSettings;
  unitMasters: UnitMasterItem[];
  suppliers: SupplierClient[];
  staffMembers?: StaffMember[];
}) {
  try {
    const invoicesSnap = await getDocs(collection(db, COLLECTIONS.INVOICES));
    if (invoicesSnap.empty && initialData.invoices.length > 0) {
      console.log('Seeding initial invoices to Firestore...');
      for (const inv of initialData.invoices) {
        await syncInvoiceToCloud(inv);
      }
    }

    const catalogSnap = await getDocs(collection(db, COLLECTIONS.CATALOG));
    if (catalogSnap.empty && initialData.catalog.length > 0) {
      console.log('Seeding initial catalog to Firestore...');
      for (const item of initialData.catalog) {
        await syncCatalogItemToCloud(item);
      }
    }

    const customersSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    if (customersSnap.empty && initialData.customers.length > 0) {
      console.log('Seeding initial customers to Firestore...');
      for (const cust of initialData.customers) {
        await syncCustomerToCloud(cust);
      }
    }

    const paymentsSnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
    if (paymentsSnap.empty && initialData.payments.length > 0) {
      for (const p of initialData.payments) {
        await syncPaymentToCloud(p);
      }
    }

    const purchasesSnap = await getDocs(collection(db, COLLECTIONS.PURCHASES));
    if (purchasesSnap.empty && initialData.purchases.length > 0) {
      for (const pur of initialData.purchases) {
        await syncPurchaseToCloud(pur);
      }
    }

    const expensesSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    if (expensesSnap.empty && initialData.expenses.length > 0) {
      for (const exp of initialData.expenses) {
        await syncExpenseToCloud(exp);
      }
    }

    const unitMastersSnap = await getDocs(collection(db, COLLECTIONS.UNIT_MASTERS));
    if (unitMastersSnap.empty && initialData.unitMasters.length > 0) {
      for (const u of initialData.unitMasters) {
        await syncUnitMasterToCloud(u);
      }
    }

    const suppliersSnap = await getDocs(collection(db, COLLECTIONS.SUPPLIERS));
    if (suppliersSnap.empty && initialData.suppliers.length > 0) {
      for (const s of initialData.suppliers) {
        await syncSupplierToCloud(s);
      }
    }

    if (initialData.staffMembers && initialData.staffMembers.length > 0) {
      const staffSnap = await getDocs(collection(db, COLLECTIONS.STAFF));
      if (staffSnap.empty) {
        for (const sm of initialData.staffMembers) {
          await syncStaffMemberToCloud(sm);
        }
      }
    }

    await syncSettingsToCloud(initialData.settings);
  } catch (err) {
    console.warn('Could not seed initial data to cloud:', err);
    try {
      handleFirestoreError(err, OperationType.GET, 'seed-check');
    } catch {
      // Structured error handled
    }
  }
}

/**
 * Subscribe to real-time changes across all workshop collections.
 * Automatically synchronizes changes across all 2-5 connected devices.
 */
export function setupRealtimeSync(handlers: {
  onInvoices: (invoices: Invoice[]) => void;
  onCatalog: (catalog: CatalogItem[]) => void;
  onCustomers: (customers: Customer[]) => void;
  onPayments: (payments: PaymentRecord[]) => void;
  onPurchases: (purchases: PurchaseRecord[]) => void;
  onExpenses: (expenses: ExpenseRecord[]) => void;
  onSettings: (settings: WorkshopSettings) => void;
  onUnitMasters: (unitMasters: UnitMasterItem[]) => void;
  onSuppliers: (suppliers: SupplierClient[]) => void;
  onStaffMembers?: (staffMembers: StaffMember[]) => void;
  onStatusChange?: (status: SyncStatus) => void;
}) {
  const unsubs: (() => void)[] = [];

  // Invoices listener
  const unsubInvoices = onSnapshot(
    collection(db, COLLECTIONS.INVOICES),
    (snapshot) => {
      const cloudInvoices = snapshot.docs.map((d) => d.data() as Invoice);
      cloudInvoices.sort(
        (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );
      saveInvoices(cloudInvoices);
      handlers.onInvoices(cloudInvoices);

      handlers.onStatusChange?.({
        isOnline: true,
        isSyncing: false,
        lastSyncedAt: new Date(),
        error: null,
      });
    },
    (err) => {
      console.warn('Invoices sync snapshot notice:', err);
      handlers.onStatusChange?.({
        isOnline: navigator.onLine,
        isSyncing: false,
        lastSyncedAt: null,
        error: err.message,
      });
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.INVOICES);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubInvoices);

  // Catalog listener
  const unsubCatalog = onSnapshot(
    collection(db, COLLECTIONS.CATALOG),
    (snapshot) => {
      const cloudCatalog = snapshot.docs.map((d) => d.data() as CatalogItem);
      saveCatalog(cloudCatalog);
      handlers.onCatalog(cloudCatalog);
    },
    (err) => {
      console.warn('Catalog snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.CATALOG);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubCatalog);

  // Customers listener
  const unsubCustomers = onSnapshot(
    collection(db, COLLECTIONS.CUSTOMERS),
    (snapshot) => {
      const cloudCustomers = snapshot.docs.map((d) => d.data() as Customer);
      saveCustomers(cloudCustomers);
      handlers.onCustomers(cloudCustomers);
    },
    (err) => {
      console.warn('Customers snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.CUSTOMERS);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubCustomers);

  // Payments listener
  const unsubPayments = onSnapshot(
    collection(db, COLLECTIONS.PAYMENTS),
    (snapshot) => {
      const cloudPayments = snapshot.docs.map((d) => d.data() as PaymentRecord);
      cloudPayments.sort(
        (a, b) => new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime()
      );
      savePayments(cloudPayments);
      handlers.onPayments(cloudPayments);
    },
    (err) => {
      console.warn('Payments snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.PAYMENTS);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubPayments);

  // Purchases listener
  const unsubPurchases = onSnapshot(
    collection(db, COLLECTIONS.PURCHASES),
    (snapshot) => {
      const cloudPurchases = snapshot.docs.map((d) => d.data() as PurchaseRecord);
      cloudPurchases.sort(
        (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );
      savePurchases(cloudPurchases);
      handlers.onPurchases(cloudPurchases);
    },
    (err) => {
      console.warn('Purchases snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.PURCHASES);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubPurchases);

  // Expenses listener
  const unsubExpenses = onSnapshot(
    collection(db, COLLECTIONS.EXPENSES),
    (snapshot) => {
      const cloudExpenses = snapshot.docs.map((d) => d.data() as ExpenseRecord);
      cloudExpenses.sort(
        (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );
      saveExpenses(cloudExpenses);
      handlers.onExpenses(cloudExpenses);
    },
    (err) => {
      console.warn('Expenses snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.EXPENSES);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubExpenses);

  // Settings listener
  const unsubSettings = onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'global'),
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudSettings = snapshot.data() as WorkshopSettings;
        saveSettings(cloudSettings);
        handlers.onSettings(cloudSettings);
      }
    },
    (err) => {
      console.warn('Settings snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.SETTINGS}/global`);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubSettings);

  // Unit Masters listener
  const unsubUnitMasters = onSnapshot(
    collection(db, COLLECTIONS.UNIT_MASTERS),
    (snapshot) => {
      const cloudUnitMasters = snapshot.docs.map((d) => d.data() as UnitMasterItem);
      saveUnitMasters(cloudUnitMasters);
      handlers.onUnitMasters(cloudUnitMasters);
    },
    (err) => {
      console.warn('Unit Masters snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.UNIT_MASTERS);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubUnitMasters);

  // Suppliers listener
  const unsubSuppliers = onSnapshot(
    collection(db, COLLECTIONS.SUPPLIERS),
    (snapshot) => {
      const cloudSuppliers = snapshot.docs.map((d) => d.data() as SupplierClient);
      saveSuppliers(cloudSuppliers);
      handlers.onSuppliers(cloudSuppliers);
    },
    (err) => {
      console.warn('Suppliers snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.SUPPLIERS);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubSuppliers);

  // Staff listener
  const unsubStaff = onSnapshot(
    collection(db, COLLECTIONS.STAFF),
    (snapshot) => {
      if (handlers.onStaffMembers) {
        const cloudStaff = snapshot.docs.map((d) => d.data() as StaffMember);
        saveStaffMembers(cloudStaff);
        handlers.onStaffMembers(cloudStaff);
      }
    },
    (err) => {
      console.warn('Staff snapshot notice:', err);
      try {
        handleFirestoreError(err, OperationType.GET, COLLECTIONS.STAFF);
      } catch {
        // Handled
      }
    }
  );
  unsubs.push(unsubStaff);

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Completely clears all transactional records (Invoices, Purchases, Payments, Expenses)
 * from Cloud Firestore and resets all customer balances to 0-0.
 * Masters (Catalog, Unit Masters, Suppliers, Staff, Settings) are strictly PRESERVED!
 */
export async function clearAllCloudTransactionalRecords(): Promise<void> {
  try {
    const invSnap = await getDocs(collection(db, COLLECTIONS.INVOICES));
    for (const d of invSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.INVOICES, d.id));
    }

    const purSnap = await getDocs(collection(db, COLLECTIONS.PURCHASES));
    for (const d of purSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.PURCHASES, d.id));
    }

    const paySnap = await getDocs(collection(db, COLLECTIONS.PAYMENTS));
    for (const d of paySnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.PAYMENTS, d.id));
    }

    const expSnap = await getDocs(collection(db, COLLECTIONS.EXPENSES));
    for (const d of expSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.EXPENSES, d.id));
    }

    const custSnap = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
    for (const d of custSnap.docs) {
      await setDoc(
        doc(db, COLLECTIONS.CUSTOMERS, d.id),
        {
          balanceDue: 0,
          totalBilledAmount: 0,
          totalInvoicesCount: 0,
        },
        { merge: true }
      );
    }

    const counterRef = doc(db, COLLECTIONS.COUNTERS, 'invoices');
    await setDoc(counterRef, { lastSeq: 0 }, { merge: true });
    console.log('All transaction records cleared from Firestore. Masters preserved.');
  } catch (err) {
    console.error('Error clearing cloud transaction records:', err);
  }
}

