import React, { useState, useEffect } from 'react';
import {
  Invoice,
  CatalogItem,
  Customer,
  PaymentRecord,
  WorkshopSettings,
  PurchaseRecord,
  ExpenseRecord,
  UnitMasterItem,
  SupplierClient,
  StaffMember,
} from './types';
import {
  loadCatalog,
  saveCatalog,
  loadInvoices,
  saveInvoices,
  loadCustomers,
  saveCustomers,
  loadPayments,
  savePayments,
  loadPurchases,
  savePurchases,
  loadExpenses,
  saveExpenses,
  loadSettings,
  saveSettings,
  loadLanguage,
  saveLanguage,
  loadUnitMasters,
  saveUnitMasters,
  loadSuppliers,
  saveSuppliers,
  loadStaffMembers,
  saveStaffMembers,
  resetAllToDefault,
} from './utils/storage';
import {
  setupRealtimeSync,
  seedLocalDataToCloudIfEmpty,
  syncInvoiceToCloud,
  deleteInvoiceFromCloud,
  syncCatalogItemToCloud,
  deleteCatalogItemFromCloud,
  syncCustomerToCloud,
  deleteCustomerFromCloud,
  syncPaymentToCloud,
  deletePaymentFromCloud,
  syncPurchaseToCloud,
  deletePurchaseFromCloud,
  syncExpenseToCloud,
  deleteExpenseFromCloud,
  syncSettingsToCloud,
  syncUnitMasterToCloud,
  deleteUnitMasterFromCloud,
  syncSupplierToCloud,
  deleteSupplierFromCloud,
  syncStaffMemberToCloud,
  deleteStaffMemberFromCloud,
  saveInvoiceWithTransaction,
  recordPaymentWithTransaction,
  clearAllCloudTransactionalRecords,
  SyncStatus,
} from './utils/firestoreSync';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceView } from './components/InvoiceView';
import { InvoiceEditor } from './components/InvoiceEditor';
import { UnitHistoryTracker } from './components/UnitHistoryTracker';
import { PartsPurchaseAndStockView } from './components/PartsPurchaseAndStockView';
import { ExpenseAndCashFlowView } from './components/ExpenseAndCashFlowView';
import { CustomerLedger } from './components/CustomerLedger';
import { WorkshopSettingsView } from './components/WorkshopSettingsView';
import { MasterHubView } from './components/MasterHubView';
import { UnitStickersModal } from './components/UnitStickersModal';
import { PaymentReceiveModal, RecordPaymentParams } from './components/PaymentReceiveModal';
import { AndroidAppInstallModal } from './components/AndroidAppInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [unitMasters, setUnitMasters] = useState<UnitMasterItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierClient[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [settings, setSettings] = useState<WorkshopSettings>(loadSettings());
  const [lang, setLang] = useState<'gu' | 'en'>('gu');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [stickersModalInvoice, setStickersModalInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [showAndroidInstallModal, setShowAndroidInstallModal] = useState<boolean>(false);

  // Load data on mount and start Firestore real-time sync
  useEffect(() => {
    const initialCatalog = loadCatalog();
    const initialInvoices = loadInvoices();
    const initialCustomers = loadCustomers();
    const initialPayments = loadPayments();
    const initialPurchases = loadPurchases();
    const initialExpenses = loadExpenses();
    const initialUnitMasters = loadUnitMasters();
    const initialSuppliers = loadSuppliers();
    const initialStaff = loadStaffMembers();
    const initialSettings = loadSettings();

    setCatalog(initialCatalog);
    setInvoices(initialInvoices);
    setCustomers(initialCustomers);
    setPayments(initialPayments);
    setPurchases(initialPurchases);
    setExpenses(initialExpenses);
    setUnitMasters(initialUnitMasters);
    setSuppliers(initialSuppliers);
    setStaffMembers(initialStaff);
    setSettings(initialSettings);
    setLang(loadLanguage());

    if (initialInvoices.length > 0) {
      setSelectedInvoice(initialInvoices[0]);
    }

    // One-time automatic cleanup to wipe old cloud transaction data to 0-0 while keeping Masters
    if (typeof window !== 'undefined' && localStorage.getItem('repairflow_cloud_cleared_v2') !== 'true') {
      clearAllCloudTransactionalRecords().then(() => {
        localStorage.setItem('repairflow_cloud_cleared_v2', 'true');
      });
    }

    // Attempt to seed local data to Firestore if cloud is fresh
    seedLocalDataToCloudIfEmpty({
      invoices: initialInvoices,
      catalog: initialCatalog,
      customers: initialCustomers,
      payments: initialPayments,
      purchases: initialPurchases,
      expenses: initialExpenses,
      settings: initialSettings,
      unitMasters: initialUnitMasters,
      suppliers: initialSuppliers,
      staffMembers: initialStaff,
    });

    // Start Real-Time Cloud Listeners across devices
    const unsubscribeSync = setupRealtimeSync({
      onInvoices: (cloudInvs) => {
        setInvoices(cloudInvs);
        setSelectedInvoice((prev) => {
          if (!prev) return cloudInvs[0] || null;
          return cloudInvs.find((i) => i.id === prev.id) || cloudInvs[0] || null;
        });
      },
      onCatalog: (cloudCatalog) => setCatalog(cloudCatalog),
      onCustomers: (cloudCustomers) => setCustomers(cloudCustomers),
      onPayments: (cloudPayments) => setPayments(cloudPayments),
      onPurchases: (cloudPurchases) => setPurchases(cloudPurchases),
      onExpenses: (cloudExpenses) => setExpenses(cloudExpenses),
      onSettings: (cloudSettings) => setSettings(cloudSettings),
      onUnitMasters: (cloudUnitMasters) => setUnitMasters(cloudUnitMasters),
      onSuppliers: (cloudSuppliers) => setSuppliers(cloudSuppliers),
      onStaffMembers: (cloudStaff) => setStaffMembers(cloudStaff),
      onStatusChange: (status) => setSyncStatus(status),
    });

    return () => {
      unsubscribeSync();
    };
  }, []);

  const handleToggleLang = () => {
    const nextLang = lang === 'gu' ? 'en' : 'gu';
    setLang(nextLang);
    saveLanguage(nextLang);
  };

  const handleSelectTab = (tab: string) => {
    if (tab === 'new-invoice') {
      setEditingInvoice(null);
    }
    setActiveTab(tab);
  };

  // Payment Recording Engine with Discount / Waive support
  const handleRecordPayment = (params: RecordPaymentParams) => {
    const { customerId, invoiceId, amount, discountWaived = 0, paymentMode, date, referenceNo, notes } = params;
    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer ? customer.name : '';
    const totalSettling = amount + discountWaived;

    let updatedInvoices = [...invoices];
    let targetInvoiceNumber = '';

    if (invoiceId) {
      // Direct payment against specific invoice
      updatedInvoices = updatedInvoices.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        targetInvoiceNumber = inv.invoiceNumber;
        const newPaid = inv.paidAmount + amount;
        const newDiscount = (inv.discount || 0) + discountWaived;
        const newDue = Math.max(0, inv.balanceDue - totalSettling);
        const newStatus: 'Paid' | 'Partial' | 'Unpaid' =
          newDue === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...inv,
          paidAmount: newPaid,
          discount: newDiscount,
          balanceDue: newDue,
          paymentStatus: newStatus,
        };
      });
    } else {
      // General payment distributed across customer's unpaid invoices from oldest to newest
      let remainingSettlement = totalSettling;
      let remainingActualPaid = amount;

      updatedInvoices = updatedInvoices.map((inv) => {
        const isMatch =
          inv.customerId === customerId ||
          inv.customerName.toLowerCase() === customerName.toLowerCase();
        if (!isMatch || inv.balanceDue <= 0 || remainingSettlement <= 0) return inv;

        const settleThis = Math.min(inv.balanceDue, remainingSettlement);
        const payThis = Math.min(settleThis, remainingActualPaid);
        const discountThis = settleThis - payThis;

        remainingSettlement -= settleThis;
        remainingActualPaid -= payThis;

        const newPaid = inv.paidAmount + payThis;
        const newDiscount = (inv.discount || 0) + discountThis;
        const newDue = Math.max(0, inv.balanceDue - settleThis);
        const newStatus: 'Paid' | 'Partial' | 'Unpaid' =
          newDue === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

        if (!targetInvoiceNumber) {
          targetInvoiceNumber = inv.invoiceNumber;
        } else {
          targetInvoiceNumber += `, ${inv.invoiceNumber}`;
        }

        return {
          ...inv,
          paidAmount: newPaid,
          discount: newDiscount,
          balanceDue: newDue,
          paymentStatus: newStatus,
        };
      });
    }

    // Save invoices
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // If currently viewing the invoice, update selectedInvoice as well
    if (selectedInvoice) {
      const refreshed = updatedInvoices.find((i) => i.id === selectedInvoice.id);
      if (refreshed) {
        setSelectedInvoice(refreshed);
      }
    }

    // Update customer balanceDue
    const updatedCustomers = customers.map((c) => {
      if (c.id !== customerId && c.name.toLowerCase() !== customerName.toLowerCase()) return c;
      const custInvs = updatedInvoices.filter(
        (i) => i.customerId === c.id || i.customerName.toLowerCase() === c.name.toLowerCase()
      );
      const totalDue = custInvs.reduce((sum, i) => sum + i.balanceDue, 0);
      return {
        ...c,
        balanceDue: totalDue,
      };
    });
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);

    // Create and save PaymentRecord
    const newPaymentRecord: PaymentRecord = {
      id: 'pay-' + Date.now(),
      invoiceId,
      invoiceNumber: targetInvoiceNumber || undefined,
      customerId,
      customerName,
      date,
      amount,
      discountWaived: discountWaived > 0 ? discountWaived : undefined,
      paymentMode,
      referenceNo,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newPaymentRecord, ...payments];
    setPayments(updatedPayments);
    savePayments(updatedPayments);

    // Sync to Cloud atomically via Firestore transaction
    recordPaymentWithTransaction({
      payment: newPaymentRecord,
      targetInvoices: updatedInvoices.filter((i) =>
        invoiceId ? i.id === invoiceId : (i.customerId === customerId || i.customerName.toLowerCase() === customerName.toLowerCase())
      ),
      customerId,
      totalSettling,
    }).catch((err) => {
      console.warn('Payment transaction notice, falling back to batch sync:', err);
      syncPaymentToCloud(newPaymentRecord);
      updatedInvoices.forEach((inv) => syncInvoiceToCloud(inv));
      updatedCustomers.forEach((c) => syncCustomerToCloud(c));
    });
  };

  // Invoice Actions (Atomic transaction across 2-5 devices)
  const handleSaveInvoice = async (invoice: Invoice) => {
    const exists = invoices.some((i) => i.id === invoice.id);
    const prevInvoice = exists ? invoices.find((i) => i.id === invoice.id) || null : null;
    const existingCust = customers.find((c) => c.id === invoice.customerId || c.name.toLowerCase() === invoice.customerName.toLowerCase()) || null;

    // Execute atomic transaction in Firestore
    const res = await saveInvoiceWithTransaction({
      invoice,
      isNew: !exists,
      previousInvoice: prevInvoice,
      currentCatalog: catalog,
      currentCustomer: existingCust,
    });

    if (!res.success && res.error) {
      alert(lang === 'gu' ? `બિલ સેવ કરવામાં ભૂલ: ${res.error}` : `Error saving invoice: ${res.error}`);
      return;
    }

    // Update local state optimistically (onSnapshot will guarantee authoritative multi-device consistency)
    let updatedInvoices: Invoice[];
    if (exists) {
      updatedInvoices = invoices.map((i) => (i.id === invoice.id ? invoice : i));
    } else {
      updatedInvoices = [invoice, ...invoices];
    }
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    setSelectedInvoice(invoice);
    setEditingInvoice(null);
    setActiveTab('view-invoice');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const toDelete = invoices.find((i) => i.id === invoiceId);
    if (toDelete) {
      // Revert parts used in this invoice back to catalog stock
      const quantitiesToRevert: Record<string, number> = {};
      toDelete.units?.forEach((u) => {
        u.parts?.forEach((p) => {
          const catItem = catalog.find(
            (c) =>
              c.id === p.catalogItemId ||
              (p.code && c.code.toLowerCase() === p.code.toLowerCase()) ||
              c.name.toLowerCase() === p.name.toLowerCase()
          );
          if (catItem) {
            quantitiesToRevert[catItem.id] =
              (quantitiesToRevert[catItem.id] || 0) + (p.quantity || 1);
          }
        });
      });

      if (Object.keys(quantitiesToRevert).length > 0) {
        const updatedCatalog = catalog.map((catItem) => {
          if (quantitiesToRevert[catItem.id]) {
            return {
              ...catItem,
              stock: (catItem.stock || 0) + quantitiesToRevert[catItem.id],
            };
          }
          return catItem;
        });
        setCatalog(updatedCatalog);
        saveCatalog(updatedCatalog);
        updatedCatalog.forEach((it) => syncCatalogItemToCloud(it));
      }
    }

    const updated = invoices.filter((i) => i.id !== invoiceId);
    setInvoices(updated);
    saveInvoices(updated);
    deleteInvoiceFromCloud(invoiceId);
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice(updated[0] || null);
      setActiveTab('invoices');
    }
  };

  const handleSelectInvoiceToView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setActiveTab('new-invoice');
  };

  // Catalog Actions
  const handleSaveCatalogItem = (item: CatalogItem) => {
    const exists = catalog.some((i) => i.id === item.id);
    let updated: CatalogItem[];
    if (exists) {
      updated = catalog.map((i) => (i.id === item.id ? item : i));
    } else {
      updated = [...catalog, item];
    }
    setCatalog(updated);
    saveCatalog(updated);
    syncCatalogItemToCloud(item);
  };

  const handleDeleteCatalogItem = (itemId: string) => {
    const updated = catalog.filter((i) => i.id !== itemId);
    setCatalog(updated);
    saveCatalog(updated);
    deleteCatalogItemFromCloud(itemId);
  };

  // Purchases and Stock Actions
  const handleRecordPurchase = (purchase: PurchaseRecord, updatedCatalog: CatalogItem[]) => {
    const updatedPurchases = [purchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    syncPurchaseToCloud(purchase);

    setCatalog(updatedCatalog);
    saveCatalog(updatedCatalog);
    updatedCatalog.forEach((it) => syncCatalogItemToCloud(it));
  };

  const handleUpdatePurchase = (purchase: PurchaseRecord, updatedCatalog: CatalogItem[]) => {
    const updatedPurchases = purchases.map((p) => (p.id === purchase.id ? purchase : p));
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    syncPurchaseToCloud(purchase);

    setCatalog(updatedCatalog);
    saveCatalog(updatedCatalog);
    updatedCatalog.forEach((it) => syncCatalogItemToCloud(it));
  };

  const handleDeletePurchase = (purchaseId: string) => {
    const toDelete = purchases.find((p) => p.id === purchaseId);
    if (toDelete) {
      // Revert items from catalog stock
      const quantitiesToRevert: Record<string, number> = {};
      toDelete.items.forEach((it) => {
        quantitiesToRevert[it.catalogItemId] = (quantitiesToRevert[it.catalogItemId] || 0) + it.quantity;
      });

      const updatedCatalog = catalog.map((catItem) => {
        if (quantitiesToRevert[catItem.id]) {
          return {
            ...catItem,
            stock: Math.max(0, (catItem.stock || 0) - quantitiesToRevert[catItem.id]),
          };
        }
        return catItem;
      });

      setCatalog(updatedCatalog);
      saveCatalog(updatedCatalog);
      updatedCatalog.forEach((it) => syncCatalogItemToCloud(it));
    }

    const updatedPurchases = purchases.filter((p) => p.id !== purchaseId);
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    deletePurchaseFromCloud(purchaseId);
  };

  // Expenses Actions
  const handleAddExpense = (expense: ExpenseRecord) => {
    const updatedExpenses = [expense, ...expenses];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    syncExpenseToCloud(expense);
  };

  const handleUpdateExpense = (expense: ExpenseRecord) => {
    const updatedExpenses = expenses.map((e) => (e.id === expense.id ? expense : e));
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    syncExpenseToCloud(expense);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    deleteExpenseFromCloud(expenseId);
  };

  // Payment Record Updates (Cash Flow / Ledger)
  const handleUpdatePayment = (updatedPayment: PaymentRecord) => {
    const updated = payments.map((p) => (p.id === updatedPayment.id ? updatedPayment : p));
    setPayments(updated);
    savePayments(updated);
    syncPaymentToCloud(updatedPayment);
  };

  const handleDeletePayment = (paymentId: string) => {
    const updated = payments.filter((p) => p.id !== paymentId);
    setPayments(updated);
    savePayments(updated);
    deletePaymentFromCloud(paymentId);
  };

  // Customer Actions
  const handleUpdateCustomer = (customer: Customer) => {
    const updated = customers.map((c) => (c.id === customer.id ? customer : c));
    setCustomers(updated);
    saveCustomers(updated);
    syncCustomerToCloud(customer);
  };

  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some((c) => c.id === customer.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map((c) => (c.id === customer.id ? customer : c));
    } else {
      updated = [...customers, customer];
    }
    setCustomers(updated);
    saveCustomers(updated);
    syncCustomerToCloud(customer);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    saveCustomers(updated);
    deleteCustomerFromCloud(customerId);
  };

  // Unit Master Actions
  const handleSaveUnitMaster = (unit: UnitMasterItem) => {
    const exists = unitMasters.some((u) => u.id === unit.id);
    let updated: UnitMasterItem[];
    if (exists) {
      updated = unitMasters.map((u) => (u.id === unit.id ? unit : u));
    } else {
      updated = [...unitMasters, unit];
    }
    setUnitMasters(updated);
    saveUnitMasters(updated);
    syncUnitMasterToCloud(unit);
  };

  const handleDeleteUnitMaster = (unitId: string) => {
    const updated = unitMasters.filter((u) => u.id !== unitId);
    setUnitMasters(updated);
    saveUnitMasters(updated);
    deleteUnitMasterFromCloud(unitId);
  };

  // Supplier Actions
  const handleSaveSupplier = (supplier: SupplierClient) => {
    const exists = suppliers.some((s) => s.id === supplier.id);
    let updated: SupplierClient[];
    if (exists) {
      updated = suppliers.map((s) => (s.id === supplier.id ? supplier : s));
    } else {
      updated = [...suppliers, supplier];
    }
    setSuppliers(updated);
    saveSuppliers(updated);
    syncSupplierToCloud(supplier);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const updated = suppliers.filter((s) => s.id !== supplierId);
    setSuppliers(updated);
    saveSuppliers(updated);
    deleteSupplierFromCloud(supplierId);
  };

  // Staff Member Actions
  const handleSaveStaffMember = (staff: StaffMember) => {
    const exists = staffMembers.some((s) => s.id === staff.id);
    let updated: StaffMember[];
    if (exists) {
      updated = staffMembers.map((s) => (s.id === staff.id ? staff : s));
    } else {
      updated = [staff, ...staffMembers];
    }
    setStaffMembers(updated);
    saveStaffMembers(updated);
    syncStaffMemberToCloud(staff);
  };

  const handleDeleteStaffMember = (staffId: string) => {
    const updated = staffMembers.filter((s) => s.id !== staffId);
    setStaffMembers(updated);
    saveStaffMembers(updated);
    deleteStaffMemberFromCloud(staffId);
  };

  // Bulk Excel Import Handlers for Master Hub
  const handleBulkImportCatalog = (newItems: CatalogItem[], replace: boolean) => {
    let updated: CatalogItem[];
    if (replace) {
      updated = newItems;
    } else {
      const existingMap = new Map(catalog.map((i) => [i.code.toUpperCase(), i]));
      newItems.forEach((item) => {
        existingMap.set(item.code.toUpperCase(), item);
      });
      updated = Array.from(existingMap.values());
    }
    setCatalog(updated);
    saveCatalog(updated);
    updated.forEach((it) => syncCatalogItemToCloud(it));
  };

  const handleBulkImportCustomers = (newItems: Customer[], replace: boolean) => {
    let updated: Customer[];
    if (replace) {
      updated = newItems;
    } else {
      const existingMap = new Map(customers.map((c) => [(c.phone || c.name).toLowerCase(), c]));
      newItems.forEach((cust) => {
        existingMap.set((cust.phone || cust.name).toLowerCase(), cust);
      });
      updated = Array.from(existingMap.values());
    }
    setCustomers(updated);
    saveCustomers(updated);
    updated.forEach((c) => syncCustomerToCloud(c));
  };

  const handleBulkImportSuppliers = (newItems: SupplierClient[], replace: boolean) => {
    let updated: SupplierClient[];
    if (replace) {
      updated = newItems;
    } else {
      const existingMap = new Map(suppliers.map((s) => [(s.phone || s.name).toLowerCase(), s]));
      newItems.forEach((sup) => {
        existingMap.set((sup.phone || sup.name).toLowerCase(), sup);
      });
      updated = Array.from(existingMap.values());
    }
    setSuppliers(updated);
    saveSuppliers(updated);
    updated.forEach((s) => syncSupplierToCloud(s));
  };

  const handleBulkImportUnitMasters = (newItems: UnitMasterItem[], replace: boolean) => {
    let updated: UnitMasterItem[];
    if (replace) {
      updated = newItems;
    } else {
      const existingMap = new Map(unitMasters.map((u) => [u.name.toLowerCase(), u]));
      newItems.forEach((u) => {
        existingMap.set(u.name.toLowerCase(), u);
      });
      updated = Array.from(existingMap.values());
    }
    setUnitMasters(updated);
    saveUnitMasters(updated);
    updated.forEach((u) => syncUnitMasterToCloud(u));
  };

  const handleBulkImportStaff = (newItems: StaffMember[], replace: boolean) => {
    let updated: StaffMember[];
    if (replace) {
      updated = newItems;
    } else {
      const existingMap = new Map(staffMembers.map((s) => [(s.phone || s.name).toLowerCase(), s]));
      newItems.forEach((st) => {
        existingMap.set((st.phone || st.name).toLowerCase(), st);
      });
      updated = Array.from(existingMap.values());
    }
    setStaffMembers(updated);
    saveStaffMembers(updated);
    updated.forEach((st) => syncStaffMemberToCloud(st));
  };

  // Settings Actions
  const handleSaveSettings = (newSettings: WorkshopSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    syncSettingsToCloud(newSettings);
  };

  const handleUpdateLogo = (newLogoUrl: string) => {
    const updated = { ...settings, logoUrl: newLogoUrl };
    setSettings(updated);
    saveSettings(updated);
    syncSettingsToCloud(updated);
  };

  const handleResetData = () => {
    setCatalog(loadCatalog());
    const invs = loadInvoices();
    setInvoices(invs);
    setCustomers(loadCustomers());
    setPayments(loadPayments());
    setPurchases(loadPurchases());
    setExpenses(loadExpenses());
    setUnitMasters(loadUnitMasters());
    setSuppliers(loadSuppliers());
    setStaffMembers(loadStaffMembers());
    setSettings(loadSettings());
    setSelectedInvoice(invs[0] || null);
    setActiveTab('dashboard');
  };

  const handleRestoreData = (restored: any) => {
    if (!restored) return;
    if (restored.catalog && Array.isArray(restored.catalog)) {
      setCatalog(restored.catalog);
      saveCatalog(restored.catalog);
      restored.catalog.forEach((it: any) => syncCatalogItemToCloud(it));
    }
    if (restored.invoices && Array.isArray(restored.invoices)) {
      setInvoices(restored.invoices);
      saveInvoices(restored.invoices);
      restored.invoices.forEach((inv: any) => syncInvoiceToCloud(inv));
      if (restored.invoices.length > 0) {
        setSelectedInvoice(restored.invoices[0]);
      }
    }
    if (restored.customers && Array.isArray(restored.customers)) {
      setCustomers(restored.customers);
      saveCustomers(restored.customers);
      restored.customers.forEach((c: any) => syncCustomerToCloud(c));
    }
    if (restored.payments && Array.isArray(restored.payments)) {
      setPayments(restored.payments);
      savePayments(restored.payments);
      restored.payments.forEach((p: any) => syncPaymentToCloud(p));
    }
    if (restored.purchases && Array.isArray(restored.purchases)) {
      setPurchases(restored.purchases);
      savePurchases(restored.purchases);
      restored.purchases.forEach((p: any) => syncPurchaseToCloud(p));
    }
    if (restored.expenses && Array.isArray(restored.expenses)) {
      setExpenses(restored.expenses);
      saveExpenses(restored.expenses);
      restored.expenses.forEach((e: any) => syncExpenseToCloud(e));
    }
    if (restored.settings && typeof restored.settings === 'object') {
      setSettings(restored.settings);
      saveSettings(restored.settings);
      syncSettingsToCloud(restored.settings);
    }
    if (restored.unitMasters && Array.isArray(restored.unitMasters)) {
      setUnitMasters(restored.unitMasters);
      saveUnitMasters(restored.unitMasters);
      restored.unitMasters.forEach((u: any) => syncUnitMasterToCloud(u));
    }
    if (restored.suppliers && Array.isArray(restored.suppliers)) {
      setSuppliers(restored.suppliers);
      saveSuppliers(restored.suppliers);
      restored.suppliers.forEach((s: any) => syncSupplierToCloud(s));
    }
    if (restored.staffMembers && Array.isArray(restored.staffMembers)) {
      setStaffMembers(restored.staffMembers);
      saveStaffMembers(restored.staffMembers);
      restored.staffMembers.forEach((sm: any) => syncStaffMemberToCloud(sm));
    }
  };

  const currentAppData = {
    invoices,
    catalog,
    customers,
    payments,
    purchases,
    expenses,
    settings,
    unitMasters,
    suppliers,
    staffMembers,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        settings={settings}
        lang={lang}
        onToggleLang={handleToggleLang}
        onUpdateLogo={handleUpdateLogo}
        onOpenAndroidInstall={() => setShowAndroidInstallModal(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            invoices={invoices}
            catalog={catalog}
            customers={customers}
            settings={settings}
            onNavigate={handleSelectTab}
            onSelectInvoice={handleSelectInvoiceToView}
            lang={lang}
            onUpdateLogo={handleUpdateLogo}
            onOpenAndroidInstall={() => setShowAndroidInstallModal(true)}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            catalog={catalog}
            settings={settings}
            onSelectInvoice={handleSelectInvoiceToView}
            onCreateNew={() => handleSelectTab('new-invoice')}
            onPrintStickers={(inv) => setStickersModalInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
            onOpenPayment={(inv) => setPaymentModalInvoice(inv)}
            lang={lang}
          />
        )}

        {activeTab === 'new-invoice' && (
          <InvoiceEditor
            initialInvoice={editingInvoice}
            catalog={catalog}
            customers={customers}
            existingInvoices={invoices}
            unitMasters={unitMasters}
            settings={settings}
            onSave={handleSaveInvoice}
            onCancel={() => {
              if (editingInvoice && selectedInvoice) {
                setActiveTab('view-invoice');
              } else {
                setActiveTab('invoices');
              }
            }}
            lang={lang}
          />
        )}

        {activeTab === 'view-invoice' && selectedInvoice && (
          <InvoiceView
            invoice={selectedInvoice}
            customers={customers}
            invoices={invoices}
            settings={settings}
            onBack={() => setActiveTab('invoices')}
            onEdit={handleEditInvoice}
            onRecordPayment={handleRecordPayment}
            lang={lang}
          />
        )}

        {activeTab === 'tracker' && (
          <UnitHistoryTracker
            invoices={invoices}
            settings={settings}
            onOpenInvoice={handleSelectInvoiceToView}
            lang={lang}
          />
        )}

        {(activeTab === 'parts-stock' || activeTab === 'parts') && (
          <PartsPurchaseAndStockView
            catalog={catalog}
            purchases={purchases}
            onSaveCatalogItem={handleSaveCatalogItem}
            onDeleteCatalogItem={handleDeleteCatalogItem}
            onRecordPurchase={handleRecordPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            lang={lang}
          />
        )}

        {activeTab === 'cashflow' && (
          <ExpenseAndCashFlowView
            expenses={expenses}
            purchases={purchases}
            payments={payments}
            staffMembers={staffMembers}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            onOpenEditPurchase={(purId) => setActiveTab('parts-stock')}
            lang={lang}
          />
        )}

        {activeTab === 'masters' && (
          <MasterHubView
            catalog={catalog}
            customers={customers}
            suppliers={suppliers}
            unitMasters={unitMasters}
            staffMembers={staffMembers}
            settings={settings}
            expenses={expenses}
            onSaveCatalogItem={handleSaveCatalogItem}
            onDeleteCatalogItem={handleDeleteCatalogItem}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onSaveUnitMaster={handleSaveUnitMaster}
            onDeleteUnitMaster={handleDeleteUnitMaster}
            onSaveStaffMember={handleSaveStaffMember}
            onDeleteStaffMember={handleDeleteStaffMember}
            onAddExpense={handleAddExpense}
            onBulkSaveCatalogItems={handleBulkImportCatalog}
            onBulkSaveCustomers={handleBulkImportCustomers}
            onBulkSaveSuppliers={handleBulkImportSuppliers}
            onBulkSaveUnitMasters={handleBulkImportUnitMasters}
            onBulkSaveStaffMembers={handleBulkImportStaff}
            onNavigateToCustomerLedger={(custId) => setActiveTab('customers')}
            onNavigateToNewBill={(custId) => setActiveTab('new-invoice')}
            lang={lang}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerLedger
            customers={customers}
            invoices={invoices}
            payments={payments}
            staffMembers={staffMembers}
            expenses={expenses}
            onRecordPayment={handleRecordPayment}
            onUpdateCustomer={handleUpdateCustomer}
            onSelectInvoice={handleSelectInvoiceToView}
            onAddExpense={handleAddExpense}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <WorkshopSettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
            lang={lang}
            currentData={currentAppData}
            onRestoreData={handleRestoreData}
          />
        )}
      </main>

      {/* Standalone Stickers Modal triggered from Invoices List */}
      {stickersModalInvoice && (
        <UnitStickersModal
          units={stickersModalInvoice.units}
          invoiceNumber={stickersModalInvoice.invoiceNumber}
          customerName={stickersModalInvoice.customerName}
          date={stickersModalInvoice.date}
          settings={settings}
          isOpen={true}
          onClose={() => setStickersModalInvoice(null)}
          lang={lang}
        />
      )}

      {/* Standalone Payment Modal triggered from Invoices List */}
      {paymentModalInvoice && (
        <PaymentReceiveModal
          isOpen={true}
          onClose={() => setPaymentModalInvoice(null)}
          customers={customers}
          invoices={invoices}
          initialCustomerId={paymentModalInvoice.customerId}
          initialInvoiceId={paymentModalInvoice.id}
          onRecordPayment={handleRecordPayment}
          lang={lang}
        />
      )}

      {/* Android APK & Mobile App Installation Modal */}
      <AndroidAppInstallModal
        isOpen={showAndroidInstallModal}
        onClose={() => setShowAndroidInstallModal(false)}
        lang={lang}
      />

      {/* Offline Status Indicator Toast */}
      <OfflineIndicator lang={lang} />

      {/* Screen Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-800">{settings.workshopName}</strong> • {settings.city}
          </div>
          <div>
            {lang === 'gu'
              ? 'રીપેર સર્વિસ બિલિંગ, યુનિટ કોડ અને એકાઉન્ટ સોફ્ટવેર'
              : 'Repair Service Billing, Unit Tracking Codes & Accounting Software'}
          </div>
        </div>
      </footer>
    </div>
  );
}
