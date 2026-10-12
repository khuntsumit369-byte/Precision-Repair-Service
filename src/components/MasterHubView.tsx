import React, { useState } from 'react';
import { CatalogItem, Customer, SupplierClient, UnitMasterItem, WorkshopSettings, StaffMember, ExpenseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { StaffLedgerModal } from './StaffLedgerModal';
import {
  Layers,
  Boxes,
  Users,
  Building2,
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  ShieldCheck,
  Package,
  Wrench,
  Percent,
  UserCheck,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import {
  exportUnitMastersToExcel,
  exportCatalogToExcel,
  exportCustomersToExcel,
  exportSuppliersToExcel,
  exportStaffToExcel,
} from '../utils/excelMasterImportExport';
import { MasterExcelUploadModal } from './MasterExcelUploadModal';

interface MasterHubViewProps {
  catalog: CatalogItem[];
  customers: Customer[];
  suppliers: SupplierClient[];
  unitMasters: UnitMasterItem[];
  staffMembers?: StaffMember[];
  settings: WorkshopSettings;
  expenses?: ExpenseRecord[];
  onSaveCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (itemId: string) => void;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSaveSupplier: (supplier: SupplierClient) => void;
  onDeleteSupplier: (supplierId: string) => void;
  onSaveUnitMaster: (unit: UnitMasterItem) => void;
  onDeleteUnitMaster: (unitId: string) => void;
  onSaveStaffMember?: (staff: StaffMember) => void;
  onDeleteStaffMember?: (staffId: string) => void;
  onBulkSaveCatalogItems?: (items: CatalogItem[], replace: boolean) => void;
  onBulkSaveCustomers?: (items: Customer[], replace: boolean) => void;
  onBulkSaveSuppliers?: (items: SupplierClient[], replace: boolean) => void;
  onBulkSaveUnitMasters?: (items: UnitMasterItem[], replace: boolean) => void;
  onBulkSaveStaffMembers?: (items: StaffMember[], replace: boolean) => void;
  onAddExpense?: (expense: ExpenseRecord) => void;
  onNavigateToCustomerLedger?: (customerId: string) => void;
  onNavigateToNewBill?: (customerId?: string) => void;
  lang: 'gu' | 'en';
}

export type MasterTab = 'units' | 'parts' | 'suppliers' | 'customers' | 'staff';

export const MasterHubView: React.FC<MasterHubViewProps> = ({
  catalog,
  customers,
  suppliers,
  unitMasters,
  staffMembers = [],
  settings,
  expenses = [],
  onSaveCatalogItem,
  onDeleteCatalogItem,
  onSaveCustomer,
  onDeleteCustomer,
  onSaveSupplier,
  onDeleteSupplier,
  onSaveUnitMaster,
  onDeleteUnitMaster,
  onSaveStaffMember,
  onDeleteStaffMember,
  onBulkSaveCatalogItems,
  onBulkSaveCustomers,
  onBulkSaveSuppliers,
  onBulkSaveUnitMasters,
  onBulkSaveStaffMembers,
  onAddExpense,
  onNavigateToCustomerLedger,
  onNavigateToNewBill,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('units');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [excelToast, setExcelToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setExcelToast({ message, type });
    setTimeout(() => {
      setExcelToast(null);
    }, 4000);
  };

  // ---------------------------------------------
  // EXCEL EXPORT & IMPORT HANDLERS
  // ---------------------------------------------
  const handleExcelDownload = () => {
    try {
      if (activeTab === 'units') {
        exportUnitMastersToExcel(unitMasters);
        showToast(lang === 'gu' ? 'યુનિટ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Unit Masters downloaded to Excel!');
      } else if (activeTab === 'parts') {
        exportCatalogToExcel(catalog);
        showToast(lang === 'gu' ? 'પાર્ટ્સ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Parts Catalog downloaded to Excel!');
      } else if (activeTab === 'suppliers') {
        exportSuppliersToExcel(suppliers);
        showToast(lang === 'gu' ? 'સપ્લાયર્સ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Suppliers Master downloaded to Excel!');
      } else if (activeTab === 'customers') {
        exportCustomersToExcel(customers);
        showToast(lang === 'gu' ? 'કસ્ટમર માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Customers Master downloaded to Excel!');
      } else if (activeTab === 'staff') {
        exportStaffToExcel(staffMembers);
        showToast(lang === 'gu' ? 'સ્ટાફ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Staff Directory downloaded to Excel!');
      }
    } catch (err) {
      console.error('Error downloading excel:', err);
      showToast(lang === 'gu' ? 'એક્સેલ ડાઉનલોડ કરવામાં સમસ્યા આવી.' : 'Failed to download Excel file.', 'info');
    }
  };

  const handleOpenExcelUpload = () => {
    setShowExcelUploadModal(true);
  };

  const handleDownloadTabExcel = (tab: MasterTab, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTab(tab);
    try {
      if (tab === 'units') {
        exportUnitMastersToExcel(unitMasters);
        showToast(lang === 'gu' ? 'યુનિટ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Unit Masters downloaded to Excel!');
      } else if (tab === 'parts') {
        exportCatalogToExcel(catalog);
        showToast(lang === 'gu' ? 'પાર્ટ્સ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Parts Catalog downloaded to Excel!');
      } else if (tab === 'suppliers') {
        exportSuppliersToExcel(suppliers);
        showToast(lang === 'gu' ? 'સપ્લાયર્સ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Suppliers Master downloaded to Excel!');
      } else if (tab === 'customers') {
        exportCustomersToExcel(customers);
        showToast(lang === 'gu' ? 'કસ્ટમર માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Customers Master downloaded to Excel!');
      } else if (tab === 'staff') {
        exportStaffToExcel(staffMembers);
        showToast(lang === 'gu' ? 'સ્ટાફ માસ્ટર એક્સેલ ફાઇલ ડાઉનલોડ થઈ ગઈ!' : 'Staff Directory downloaded to Excel!');
      }
    } catch (err) {
      console.error('Error downloading excel:', err);
      showToast(lang === 'gu' ? 'એક્સેલ ડાઉનલોડ કરવામાં સમસ્યા આવી.' : 'Failed to download Excel file.', 'info');
    }
  };

  const handleUploadTabExcel = (tab: MasterTab, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveTab(tab);
    setShowExcelUploadModal(true);
  };

  const handleImportUnits = (items: UnitMasterItem[], replace: boolean) => {
    if (onBulkSaveUnitMasters) {
      onBulkSaveUnitMasters(items, replace);
    } else {
      items.forEach((it) => onSaveUnitMaster(it));
    }
    showToast(
      lang === 'gu'
        ? `${items.length} યુનિટ મોડલ્સ એક્સેલમાંથી સફળતાપૂર્વક અપલોડ થયા!`
        : `${items.length} Unit Masters imported from Excel!`
    );
  };

  const handleImportCatalog = (items: CatalogItem[], replace: boolean) => {
    if (onBulkSaveCatalogItems) {
      onBulkSaveCatalogItems(items, replace);
    } else {
      items.forEach((it) => onSaveCatalogItem(it));
    }
    showToast(
      lang === 'gu'
        ? `${items.length} સ્પેરપાર્ટ્સ એક્સેલમાંથી સફળતાપૂર્વક અપલોડ થયા!`
        : `${items.length} Spare Parts imported from Excel!`
    );
  };

  const handleImportCustomers = (items: Customer[], replace: boolean) => {
    if (onBulkSaveCustomers) {
      onBulkSaveCustomers(items, replace);
    } else {
      items.forEach((it) => onSaveCustomer(it));
    }
    showToast(
      lang === 'gu'
        ? `${items.length} ગ્રાહકો એક્સેલમાંથી સફળતાપૂર્વક અપલોડ થયા!`
        : `${items.length} Customers imported from Excel!`
    );
  };

  const handleImportSuppliers = (items: SupplierClient[], replace: boolean) => {
    if (onBulkSaveSuppliers) {
      onBulkSaveSuppliers(items, replace);
    } else {
      items.forEach((it) => onSaveSupplier(it));
    }
    showToast(
      lang === 'gu'
        ? `${items.length} સપ્લાયર્સ એક્સેલમાંથી સફળતાપૂર્વક અપલોડ થયા!`
        : `${items.length} Suppliers imported from Excel!`
    );
  };

  const handleImportStaff = (items: StaffMember[], replace: boolean) => {
    if (onBulkSaveStaffMembers) {
      onBulkSaveStaffMembers(items, replace);
    } else if (onSaveStaffMember) {
      items.forEach((it) => onSaveStaffMember(it));
    }
    showToast(
      lang === 'gu'
        ? `${items.length} સ્ટાફ મેમ્બર્સ એક્સેલમાંથી સફળતાપૂર્વક અપલોડ થયા!`
        : `${items.length} Staff members imported from Excel!`
    );
  };

  // Modals state
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitMasterItem | null>(null);

  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<CatalogItem | null>(null);

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierClient | null>(null);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Staff Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffNameGu, setStaffNameGu] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState('Senior Technician');
  const [staffSalary, setStaffSalary] = useState<number>(15000);
  const [staffSalaryType, setStaffSalaryType] = useState<'Monthly' | 'Daily' | 'Per-Piece'>('Monthly');
  const [staffJoiningDate, setStaffJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffAddress, setStaffAddress] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [staffActive, setStaffActive] = useState(true);

  // Staff Ledger Modal State
  const [selectedStaffForLedger, setSelectedStaffForLedger] = useState<StaffMember | null>(null);

  // Quick Pay Salary Modal State
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [quickPayStaff, setQuickPayStaff] = useState<StaffMember | null>(null);
  const [quickPayDate, setQuickPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPayAmount, setQuickPayAmount] = useState<number>(0);
  const [quickPayMode, setQuickPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [quickPayTitle, setQuickPayTitle] = useState('');
  const [quickPayNotes, setQuickPayNotes] = useState('');

  // Quick Receive from Staff Modal State
  const [showQuickReceiveModal, setShowQuickReceiveModal] = useState(false);
  const [quickReceiveStaff, setQuickReceiveStaff] = useState<StaffMember | null>(null);
  const [quickReceiveDate, setQuickReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickReceiveAmount, setQuickReceiveAmount] = useState<number>(0);
  const [quickReceiveMode, setQuickReceiveMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [quickReceiveTitle, setQuickReceiveTitle] = useState('');
  const [quickReceiveNotes, setQuickReceiveNotes] = useState('');

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'unit' | 'part' | 'supplier' | 'customer' | 'staff';
    id: string;
    name: string;
    extra?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'unit') {
      onDeleteUnitMaster(deleteTarget.id);
    } else if (deleteTarget.type === 'part') {
      onDeleteCatalogItem(deleteTarget.id);
    } else if (deleteTarget.type === 'supplier') {
      onDeleteSupplier(deleteTarget.id);
    } else if (deleteTarget.type === 'customer') {
      onDeleteCustomer(deleteTarget.id);
    } else if (deleteTarget.type === 'staff' && onDeleteStaffMember) {
      onDeleteStaffMember(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Unit Master Form State
  const [unitName, setUnitName] = useState('');
  const [unitNameGu, setUnitNameGu] = useState('');
  const [unitCategory, setUnitCategory] = useState('Dental Equipment');
  const [unitCodePrefix, setUnitCodePrefix] = useState('HP');
  const [unitServiceCharge, setUnitServiceCharge] = useState<number>(200);
  const [unitWarrantyDays, setUnitWarrantyDays] = useState<number>(30);
  const [unitCommonIssues, setUnitCommonIssues] = useState<string>('');

  // Part Master Form State
  const [partCode, setPartCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partNameGu, setPartNameGu] = useState('');
  const [partType, setPartType] = useState<'part' | 'service'>('part');
  const [partCategory, setPartCategory] = useState('Mechanical Spare Parts');
  const [partCostPrice, setPartCostPrice] = useState<number>(0);
  const [partSalePrice, setPartSalePrice] = useState<number>(0);
  const [partStock, setPartStock] = useState<number>(50);
  const [partUnit, setPartUnit] = useState('pcs');

  // Supplier Master Form State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCity, setSupCity] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGst, setSupGst] = useState('');
  const [supCategory, setSupCategory] = useState('Spare Parts Distributor');
  const [supNotes, setSupNotes] = useState('');

  // Customer Master Form State
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custGst, setCustGst] = useState('');

  // ---------------------------------------------
  // UNIT MASTER HANDLERS
  // ---------------------------------------------
  const handleOpenNewUnit = () => {
    setEditingUnit(null);
    setUnitName('');
    setUnitNameGu('');
    setUnitCategory('Dental Equipment');
    setUnitCodePrefix('HP');
    setUnitServiceCharge(200);
    setUnitWarrantyDays(30);
    setUnitCommonIssues('');
    setShowUnitModal(true);
  };

  const handleOpenEditUnit = (u: UnitMasterItem) => {
    setEditingUnit(u);
    setUnitName(u.name);
    setUnitNameGu(u.nameGu || '');
    setUnitCategory(u.category);
    setUnitCodePrefix(u.codePrefix);
    setUnitServiceCharge(u.defaultServiceCharge);
    setUnitWarrantyDays(u.defaultWarrantyDays);
    setUnitCommonIssues(u.commonIssues ? u.commonIssues.join(', ') : '');
    setShowUnitModal(true);
  };

  const handleSaveUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    const issues = unitCommonIssues
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const saved: UnitMasterItem = {
      id: editingUnit ? editingUnit.id : 'um-' + Date.now(),
      name: unitName.trim(),
      nameGu: unitNameGu.trim() || undefined,
      category: unitCategory,
      codePrefix: unitCodePrefix.trim().toUpperCase(),
      defaultServiceCharge: Number(unitServiceCharge) || 0,
      defaultWarrantyDays: Number(unitWarrantyDays) || 0,
      commonIssues: issues.length > 0 ? issues : undefined,
      active: true,
    };

    onSaveUnitMaster(saved);
    setShowUnitModal(false);
  };

  // ---------------------------------------------
  // PART MASTER HANDLERS
  // ---------------------------------------------
  const handleOpenNewPart = () => {
    setEditingPart(null);
    setPartCode('PRT-' + Math.floor(100 + Math.random() * 900));
    setPartName('');
    setPartNameGu('');
    setPartType('part');
    setPartCategory('Mechanical Spare Parts');
    setPartCostPrice(0);
    setPartSalePrice(0);
    setPartStock(50);
    setPartUnit('pcs');
    setShowPartModal(true);
  };

  const handleOpenEditPart = (p: CatalogItem) => {
    setEditingPart(p);
    setPartCode(p.code);
    setPartName(p.name);
    setPartNameGu(p.nameGu || '');
    setPartType(p.type);
    setPartCategory(p.category || 'Mechanical Spare Parts');
    setPartCostPrice(p.costPrice || 0);
    setPartSalePrice(p.salePrice);
    setPartStock(p.stock !== undefined ? p.stock : 0);
    setPartUnit(p.unit || 'pcs');
    setShowPartModal(true);
  };

  const handleSavePartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    const saved: CatalogItem = {
      id: editingPart ? editingPart.id : 'item-' + Date.now(),
      code: partCode.trim().toUpperCase(),
      name: partName.trim(),
      nameGu: partNameGu.trim() || undefined,
      type: partType,
      category: partCategory,
      costPrice: Number(partCostPrice) || 0,
      salePrice: Number(partSalePrice) || 0,
      stock: partType === 'part' ? Number(partStock) || 0 : undefined,
      unit: partUnit,
    };

    onSaveCatalogItem(saved);
    setShowPartModal(false);
  };

  // ---------------------------------------------
  // SUPPLIER / CLIENT MASTER HANDLERS
  // ---------------------------------------------
  const handleOpenNewSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupCity('Rajkot');
    setSupAddress('');
    setSupGst('');
    setSupCategory('Spare Parts Distributor');
    setSupNotes('');
    setShowSupplierModal(true);
  };

  const handleOpenEditSupplier = (s: SupplierClient) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setSupContact(s.contactPerson || '');
    setSupPhone(s.phone);
    setSupCity(s.city);
    setSupAddress(s.address || '');
    setSupGst(s.gstNumber || '');
    setSupCategory(s.category || 'Spare Parts Distributor');
    setSupNotes(s.notes || '');
    setShowSupplierModal(true);
  };

  const handleSaveSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const saved: SupplierClient = {
      id: editingSupplier ? editingSupplier.id : 'sup-' + Date.now(),
      name: supName.trim(),
      contactPerson: supContact.trim() || undefined,
      phone: supPhone.trim(),
      city: supCity.trim() || 'Rajkot',
      address: supAddress.trim() || undefined,
      gstNumber: supGst.trim() || undefined,
      category: supCategory,
      notes: supNotes.trim() || undefined,
    };

    onSaveSupplier(saved);
    setShowSupplierModal(false);
  };

  // ---------------------------------------------
  // CUSTOMER MASTER HANDLERS
  // ---------------------------------------------
  const handleOpenNewCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustContact('');
    setCustPhone('');
    setCustCity('Rajkot');
    setCustAddress('');
    setCustGst('');
    setShowCustomerModal(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustContact(c.contactPerson || '');
    setCustPhone(c.phone);
    setCustCity(c.city);
    setCustAddress(c.address || '');
    setCustGst(c.gstNumber || '');
    setShowCustomerModal(true);
  };

  const handleSaveCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const saved: Customer = {
      id: editingCustomer ? editingCustomer.id : 'cust-' + Date.now(),
      name: custName.trim(),
      contactPerson: custContact.trim() || undefined,
      phone: custPhone.trim(),
      city: custCity.trim() || 'Rajkot',
      address: custAddress.trim() || undefined,
      gstNumber: custGst.trim() || undefined,
      balanceDue: editingCustomer ? editingCustomer.balanceDue : 0,
      totalInvoicesCount: editingCustomer ? editingCustomer.totalInvoicesCount : 0,
      totalBilledAmount: editingCustomer ? editingCustomer.totalBilledAmount : 0,
    };

    onSaveCustomer(saved);
    setShowCustomerModal(false);
  };

  // ---------------------------------------------
  // STAFF MASTER HANDLERS
  // ---------------------------------------------
  const handleOpenNewStaff = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffNameGu('');
    setStaffPhone('');
    setStaffRole('Senior Technician');
    setStaffSalary(15000);
    setStaffSalaryType('Monthly');
    setStaffJoiningDate(new Date().toISOString().split('T')[0]);
    setStaffAddress('');
    setStaffNotes('');
    setStaffActive(true);
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (st: StaffMember) => {
    setEditingStaff(st);
    setStaffName(st.name);
    setStaffNameGu(st.nameGu || '');
    setStaffPhone(st.phone);
    setStaffRole(st.role);
    setStaffSalary(st.salary);
    setStaffSalaryType(st.salaryType || 'Monthly');
    setStaffJoiningDate(st.joiningDate || new Date().toISOString().split('T')[0]);
    setStaffAddress(st.address || '');
    setStaffNotes(st.notes || '');
    setStaffActive(st.active);
    setShowStaffModal(true);
  };

  const handleSaveStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffPhone.trim()) {
      alert(lang === 'gu' ? 'કૃપા કરીને સ્ટાફનું નામ અને મોબાઈલ નંબર દાખલ કરો' : 'Please enter staff name and phone');
      return;
    }

    const saved: StaffMember = {
      id: editingStaff ? editingStaff.id : 'staff-' + Date.now(),
      name: staffName.trim(),
      nameGu: staffNameGu.trim() || undefined,
      phone: staffPhone.trim(),
      role: staffRole.trim(),
      salary: staffSalary,
      salaryType: staffSalaryType,
      joiningDate: staffJoiningDate,
      address: staffAddress.trim() || undefined,
      notes: staffNotes.trim() || undefined,
      active: staffActive,
      createdAt: editingStaff?.createdAt || new Date().toISOString(),
    };

    if (onSaveStaffMember) {
      onSaveStaffMember(saved);
    }
    setShowStaffModal(false);
  };

  // Quick Pay Salary
  const handleOpenQuickPay = (st: StaffMember) => {
    setQuickPayStaff(st);
    setQuickPayAmount(st.salary || 0);
    setQuickPayDate(new Date().toISOString().split('T')[0]);
    setQuickPayMode('Bank Transfer');
    const curMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    setQuickPayTitle(`Salary - ${st.name} (${curMonth})`);
    setQuickPayNotes('');
    setShowQuickPayModal(true);
  };

  const handleSaveQuickPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPayStaff || quickPayAmount <= 0) return;

    if (onAddExpense) {
      const newSalaryExpense: ExpenseRecord = {
        id: 'exp-' + Date.now(),
        expenseNo: `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: quickPayDate,
        category: 'Salary',
        type: 'EXPENSE',
        title: quickPayTitle.trim() || `Staff Salary - ${quickPayStaff.name}`,
        amount: quickPayAmount,
        paymentMode: quickPayMode,
        paidTo: quickPayStaff.name,
        staffId: quickPayStaff.id,
        staffName: quickPayStaff.name,
        notes: quickPayNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newSalaryExpense);
    }
    setShowQuickPayModal(false);
    setQuickPayStaff(null);
  };

  // Quick Receive from Staff
  const handleOpenQuickReceive = (st: StaffMember) => {
    setQuickReceiveStaff(st);
    setQuickReceiveAmount(0);
    setQuickReceiveDate(new Date().toISOString().split('T')[0]);
    setQuickReceiveMode('Cash');
    setQuickReceiveTitle(`Advance Return / Deposit from ${st.name}`);
    setQuickReceiveNotes('');
    setShowQuickReceiveModal(true);
  };

  const handleSaveQuickReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReceiveStaff || quickReceiveAmount <= 0) return;

    if (onAddExpense) {
      const newReceipt: ExpenseRecord = {
        id: 'str-' + Date.now(),
        expenseNo: `STR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: quickReceiveDate,
        category: 'Salary',
        type: 'STAFF_RECEIPT',
        title: quickReceiveTitle.trim() || `Amount received from ${quickReceiveStaff.name}`,
        amount: quickReceiveAmount,
        paymentMode: quickReceiveMode,
        paidTo: quickReceiveStaff.name,
        staffId: quickReceiveStaff.id,
        staffName: quickReceiveStaff.name,
        notes: quickReceiveNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newReceipt);
    }
    setShowQuickReceiveModal(false);
    setQuickReceiveStaff(null);
  };

  // Filtered queries
  const term = searchTerm.toLowerCase();

  const filteredUnits = unitMasters.filter(
    (u) =>
      u.name.toLowerCase().includes(term) ||
      (u.nameGu && u.nameGu.toLowerCase().includes(term)) ||
      u.codePrefix.toLowerCase().includes(term) ||
      u.category.toLowerCase().includes(term)
  );

  const filteredParts = catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      (p.nameGu && p.nameGu.toLowerCase().includes(term)) ||
      p.code.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(term)) ||
      s.city.toLowerCase().includes(term) ||
      s.phone.includes(term)
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(term)) ||
      c.city.toLowerCase().includes(term) ||
      c.phone.includes(term)
  );

  const filteredStaff = staffMembers.filter(
    (st) =>
      st.name.toLowerCase().includes(term) ||
      (st.nameGu && st.nameGu.toLowerCase().includes(term)) ||
      st.role.toLowerCase().includes(term) ||
      st.phone.includes(term) ||
      (st.address && st.address.toLowerCase().includes(term))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Slab Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 bg-indigo-600/60 rounded-xl border border-indigo-400/30">
              <Layers className="w-5 h-5 text-indigo-300" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              {lang === 'gu' ? 'મુખ્ય માસ્ટર્સ સ્લેબ (Master Management Hub)' : 'Master Database Slab'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {lang === 'gu' ? 'માસ્ટર્સ સ્લેબ (Masters Slab)' : 'Masters Hub'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {lang === 'gu'
              ? 'યુનિટ માસ્ટર, પાર્ટ્સ માસ્ટર, ક્લાયન્ટ/સપ્લાયર, કસ્ટમર અને સ્ટાફ માસ્ટર તમામ એક જ જગ્યાએથી એડિટ અને મેનેજ કરો.'
              : 'Single unified slab to control Unit Models, Spare Parts, Suppliers/Vendors, Customers, and Staff records.'}
          </p>
        </div>

        {/* Action Buttons: 1. Excel Download, 2. Upload By Excel, 3. Add Item */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Option 1: Excel Download */}
          <button
            type="button"
            onClick={handleExcelDownload}
            title={lang === 'gu' ? 'આ માસ્ટર સ્લેબનો ડેટા એક્સેલમાં ડાઉનલોડ કરો' : 'Download this master slab data to Excel (.xlsx)'}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-102"
          >
            <Download className="w-4 h-4" />
            <span>1. Excel Download</span>
          </button>

          {/* Option 2: Upload By Excel */}
          <button
            type="button"
            onClick={handleOpenExcelUpload}
            title={lang === 'gu' ? 'એક્સેલ ફાઇલમાંથી બલ્ક ડેટા અપલોડ કરો' : 'Upload records from Excel spreadsheet'}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-102"
          >
            <Upload className="w-4 h-4" />
            <span>2. Upload By Excel</span>
          </button>

          {/* Add Item Action */}
          {activeTab === 'units' && (
            <button
              onClick={handleOpenNewUnit}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવું યુનિટ મોડલ' : '+ Add Unit Master'}</span>
            </button>
          )}
          {activeTab === 'parts' && (
            <button
              onClick={handleOpenNewPart}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવો સ્પેરપાર્ટ' : '+ Add Part Master'}</span>
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button
              onClick={handleOpenNewSupplier}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવો સપ્લાયર / ક્લાયન્ટ' : '+ Add Supplier / Client'}</span>
            </button>
          )}
          {activeTab === 'customers' && (
            <button
              onClick={handleOpenNewCustomer}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવો કસ્ટમર' : '+ Add Customer Master'}</span>
            </button>
          )}
          {activeTab === 'staff' && (
            <button
              onClick={handleOpenNewStaff}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-102"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવો સ્ટાફ (Add Staff)' : '+ Add Staff Master'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Excel Notification Toast */}
      {excelToast && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            excelToast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-indigo-50 text-indigo-800 border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{excelToast.message}</span>
          </div>
          <button
            onClick={() => setExcelToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Masters Navigation Slab Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Unit Master Card */}
        <div
          onClick={() => {
            setActiveTab('units');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === 'units'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-2.5 rounded-xl ${
                activeTab === 'units' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Tag className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {unitMasters.length}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>{lang === 'gu' ? 'યુનિટ માસ્ટર' : 'Unit Master'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'gu' ? 'મશીન મોડેલ & સર્વિસ ચાર્જ' : 'Machine models & charges'}
            </p>
          </div>
          {/* Card Excel Options (Small Icons) */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
              Excel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleDownloadTabExcel('units', e)}
                title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
              <button
                type="button"
                onClick={(e) => handleUploadTabExcel('units', e)}
                title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
                className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Upload className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Parts Master Card */}
        <div
          onClick={() => {
            setActiveTab('parts');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === 'parts'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-2.5 rounded-xl ${
                activeTab === 'parts' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Boxes className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {catalog.length}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>{lang === 'gu' ? 'પાર્ટ્સ માસ્ટર' : 'Parts Master'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'gu' ? 'સ્પેરપાર્ટ્સ, ભાવ & સ્ટોક' : 'Spares, prices & stock'}
            </p>
          </div>
          {/* Card Excel Options (Small Icons) */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
              Excel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleDownloadTabExcel('parts', e)}
                title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
              <button
                type="button"
                onClick={(e) => handleUploadTabExcel('parts', e)}
                title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
                className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Upload className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Client / Supplier Master Card */}
        <div
          onClick={() => {
            setActiveTab('suppliers');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-2.5 rounded-xl ${
                activeTab === 'suppliers' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {suppliers.length}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>{lang === 'gu' ? 'સપ્લાયર / ક્લાયન્ટ' : 'Client / Supplier'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'gu' ? 'વેન્ડર્સ & સપ્લાયર્સ લિસ્ટ' : 'Vendors & parts dealers'}
            </p>
          </div>
          {/* Card Excel Options (Small Icons) */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
              Excel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleDownloadTabExcel('suppliers', e)}
                title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
              <button
                type="button"
                onClick={(e) => handleUploadTabExcel('suppliers', e)}
                title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
                className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Upload className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Customer Master Card */}
        <div
          onClick={() => {
            setActiveTab('customers');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-2.5 rounded-xl ${
                activeTab === 'customers' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Users className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {customers.length}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>{lang === 'gu' ? 'કસ્ટમર માસ્ટર' : 'Customer Master'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'gu' ? 'ગ્રાહકો & પેમેન્ટ હિસાબ' : 'Client list & balances'}
            </p>
          </div>
          {/* Card Excel Options (Small Icons) */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
              Excel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleDownloadTabExcel('customers', e)}
                title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
              <button
                type="button"
                onClick={(e) => handleUploadTabExcel('customers', e)}
                title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
                className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Upload className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. Staff Master Card */}
        <div
          onClick={() => {
            setActiveTab('staff');
            setSearchTerm('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`p-2.5 rounded-xl ${
                activeTab === 'staff' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {staffMembers.length}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center justify-between">
              <span>{lang === 'gu' ? 'સ્ટાફ માસ્ટર' : 'Staff Master'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {lang === 'gu' ? 'કારીગરો, પગાર & હિસાબ' : 'Technicians & salaries'}
            </p>
          </div>
          {/* Card Excel Options (Small Icons) */}
          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">
              Excel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => handleDownloadTabExcel('staff', e)}
                title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Download className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
              <button
                type="button"
                onClick={(e) => handleUploadTabExcel('staff', e)}
                title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
                className="p-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg transition-all shadow-2xs flex items-center justify-center group/btn"
              >
                <Upload className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card with Search & Tables */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">
              {activeTab === 'units' && (lang === 'gu' ? 'યુનિટ માસ્ટર લિસ્ટ' : 'Unit Master List')}
              {activeTab === 'parts' && (lang === 'gu' ? 'પાર્ટ્સ & સર્વિસ માસ્ટર' : 'Parts & Services Master')}
              {activeTab === 'suppliers' && (lang === 'gu' ? 'સપ્લાયર & ક્લાયન્ટ લિસ્ટ' : 'Suppliers & Vendors')}
              {activeTab === 'customers' && (lang === 'gu' ? 'કસ્ટમર એકાઉન્ટ લિસ્ટ' : 'Customers Master Directory')}
              {activeTab === 'staff' && (lang === 'gu' ? 'સ્ટાફ માસ્ટર લિસ્ટ (Staff Directory)' : 'Staff Members Directory')}
            </span>
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono font-semibold">
              {activeTab === 'units' && filteredUnits.length}
              {activeTab === 'parts' && filteredParts.length}
              {activeTab === 'suppliers' && filteredSuppliers.length}
              {activeTab === 'customers' && filteredCustomers.length}
              {activeTab === 'staff' && filteredStaff.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Small Icon 1: Excel Download */}
            <button
              type="button"
              onClick={handleExcelDownload}
              title={lang === 'gu' ? '1. એક્સેલ ડાઉનલોડ (Excel Download)' : '1. Excel Download'}
              className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 rounded-xl transition-all shadow-2xs flex items-center justify-center group"
            >
              <Download className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
            </button>

            {/* Small Icon 2: Upload By Excel */}
            <button
              type="button"
              onClick={handleOpenExcelUpload}
              title={lang === 'gu' ? '2. એક્સેલથી અપલોડ (Upload By Excel)' : '2. Upload By Excel'}
              className="p-2 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-300 hover:border-amber-600 rounded-xl transition-all shadow-2xs flex items-center justify-center group"
            >
              <Upload className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors" />
            </button>

            <div className="relative min-w-[180px] sm:min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'gu' ? 'શોધો...' : 'Search master records...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: UNIT MASTER TABLE */}
        {activeTab === 'units' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Unit Name (સાધન / મશીન)</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 text-center">Code Prefix</th>
                  <th className="py-3 text-right">Default Service Charge</th>
                  <th className="py-3 text-center">Warranty</th>
                  <th className="py-3">Common Issues</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu' ? 'કોઈ યુનિટ માસ્ટર મળ્યો નથી.' : 'No unit masters found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((u, index) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                        {u.nameGu && (
                          <div className="text-[11px] text-slate-500 font-medium">{u.nameGu}</div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">{u.category}</td>
                      <td className="py-3.5 text-center">
                        <span className="font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                          {u.codePrefix}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(u.defaultServiceCharge)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                          {u.defaultWarrantyDays} Days
                        </span>
                      </td>
                      <td className="py-3.5 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {u.commonIssues?.slice(0, 3).map((issue, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded truncate max-w-[140px]"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditUnit(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'unit',
                                id: u.id,
                                name: u.name,
                                extra: `${u.codePrefix} • Standard: ${formatCurrency(u.defaultServiceCharge)}`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PARTS MASTER TABLE */}
        {activeTab === 'parts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Code</th>
                  <th className="py-3">Item Name (પાર્ટ્સ / સર્વિસ નામ)</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 text-right">Cost Price (ખરીદ કિંમત)</th>
                  <th className="py-3 text-right">Sale Price (વેચાણ કિંમત)</th>
                  <th className="py-3 text-center">Margin</th>
                  <th className="py-3 text-center">Current Stock</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu' ? 'કોઈ પાર્ટ્સ મળ્યા નથી.' : 'No parts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p, index) => {
                    const margin = p.salePrice - (p.costPrice || 0);
                    const marginPercent = p.salePrice > 0 ? Math.round((margin / p.salePrice) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-indigo-700">
                          {p.code}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                          {p.nameGu && (
                            <div className="text-[11px] text-slate-500 font-medium">{p.nameGu}</div>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-600 font-medium">
                          {p.category || 'General'}
                        </td>
                        <td className="py-3.5 text-right font-mono text-slate-600">
                          {p.costPrice ? formatCurrency(p.costPrice) : '₹0'}
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(p.salePrice)}
                        </td>
                        <td className="py-3.5 text-center">
                          {p.costPrice > 0 ? (
                            <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{marginPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {p.type === 'part' ? (
                            <span
                              className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                                (p.stock || 0) <= 15
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock !== undefined ? p.stock : 0} {p.unit || 'pcs'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                              SERVICE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditPart(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Part"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'part',
                                  id: p.id,
                                  name: p.name,
                                  extra: `${p.code} • ${formatCurrency(p.salePrice)} (${p.type.toUpperCase()})`,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Part"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CLIENT / SUPPLIER MASTER TABLE */}
        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Vendor / Supplier Firm</th>
                  <th className="py-3">Contact Person</th>
                  <th className="py-3">Phone & City</th>
                  <th className="py-3">GSTIN</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Notes</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu'
                        ? 'કોઈ સપ્લાયર / ક્લાયન્ટ નોંધાયેલ નથી.'
                        : 'No suppliers recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s, index) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{s.name}</span>
                        </div>
                        {s.address && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.address}</div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">
                        {s.contactPerson || '-'}
                      </td>
                      <td className="py-3.5">
                        <div className="font-mono text-slate-800 font-medium">{s.phone}</div>
                        <div className="text-[11px] text-slate-500">{s.city}</div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600">
                        {s.gstNumber || '-'}
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {s.category || 'Vendor'}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                        {s.notes || '-'}
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditSupplier(s)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'supplier',
                                id: s.id,
                                name: s.name,
                                extra: `${s.phone} • ${s.city} ${s.gstNumber ? `• GST: ${s.gstNumber}` : ''}`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: CUSTOMER MASTER TABLE */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Customer / Firm Name</th>
                  <th className="py-3">Contact Person</th>
                  <th className="py-3">Phone & City</th>
                  <th className="py-3">GSTIN</th>
                  <th className="py-3 text-center">Total Invoices</th>
                  <th className="py-3 text-right">Total Billed</th>
                  <th className="py-3 text-right">Balance Due (બાકી)</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu' ? 'કોઈ કસ્ટમર મળ્યા નથી.' : 'No customers found.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, index) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{c.name}</span>
                        </div>
                        {c.address && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{c.address}</div>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-700 font-medium">
                        {c.contactPerson || '-'}
                      </td>
                      <td className="py-3.5">
                        <div className="font-mono text-slate-800 font-semibold">{c.phone}</div>
                        <div className="text-[11px] text-slate-500">{c.city}</div>
                      </td>
                      <td className="py-3.5 font-mono text-slate-600">
                        {c.gstNumber || '-'}
                      </td>
                      <td className="py-3.5 text-center font-mono font-bold text-slate-700">
                        {c.totalInvoicesCount} Bills
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.totalBilledAmount)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-sm">
                        {c.balanceDue > 0 ? (
                          <span className="text-rose-600">{formatCurrency(c.balanceDue)}</span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-xs">CLEAR (₹0)</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditCustomer(c)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Customer Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'customer',
                                id: c.id,
                                name: c.name,
                                extra: `${c.phone} • ${c.city} • Due: ₹${c.balanceDue}`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: STAFF MASTER TABLE & SUMMARY */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            {/* Quick Metrics Bar for Staff */}
            <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'gu' ? 'કુલ / કાર્યરત સ્ટાફ' : 'Total / Active Staff'}
                  </span>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {staffMembers.filter((s) => s.active).length} / {staffMembers.length}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    {staffMembers.filter((s) => s.active).length} {lang === 'gu' ? 'હાજર કારીગરો' : 'Active'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === 'gu' ? 'માસિક પગાર બજેટ' : 'Monthly Salary Budget'}
                  </span>
                  <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                    {formatCurrency(
                      staffMembers
                        .filter((s) => s.active && (!s.salaryType || s.salaryType === 'Monthly'))
                        .reduce((sum, s) => sum + s.salary, 0)
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'gu' ? 'માસિક ફિક્સ પગાર' : 'Total monthly salary'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      {lang === 'gu' ? 'કુલ ચૂકવેલ પગાર / એડવાન્સ' : 'Total Paid to Staff'}
                    </span>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-base font-black text-rose-600 mt-0.5 font-mono">
                    {formatCurrency(
                      expenses
                        .filter((e) => e.type !== 'STAFF_RECEIPT' && (e.category === 'Salary' || e.staffId))
                        .reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'gu' ? 'નેટ બેલેન્સમાંથી માઇનસ થયેલ' : 'Deducted from cash balance'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {lang === 'gu' ? 'સ્ટાફ પાસેથી જમા (Inflow)' : 'Received from Staff'}
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="text-base font-black text-emerald-600 mt-0.5 font-mono">
                    {formatCurrency(
                      expenses
                        .filter((e) => e.type === 'STAFF_RECEIPT')
                        .reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'gu' ? 'નેટ બેલેન્સમાં ઉમેરાયેલ' : 'Added to cash balance'}
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                    <th className="py-3">સ્ટાફ નામ & સંપર્ક (Staff Member)</th>
                    <th className="py-3">હોદ્દો / કામગીરી (Role)</th>
                    <th className="py-3 text-right">નિયમિત પગાર (Salary)</th>
                    <th className="py-3 text-right">કુલ ચૂકવેલ (Paid)</th>
                    <th className="py-3 text-right">જમા લીધેલ (Received)</th>
                    <th className="py-3 text-center">સ્થિતિ (Status)</th>
                    <th className="py-3 pr-6 text-right">વ્યવહાર & ક્રિયાઓ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        <p className="font-semibold text-slate-600">
                          {lang === 'gu' ? 'કોઈ સ્ટાફ મેમ્બર મળ્યા નથી.' : 'No staff members found.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenNewStaff}
                          className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'gu' ? '+ નવો સ્ટાફ ઉમેરો' : '+ Add Staff Member'}</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((st, index) => {
                      // Total paid to this staff
                      const stPaid = expenses
                        .filter(
                          (e) =>
                            e.type !== 'STAFF_RECEIPT' &&
                            (e.staffId === st.id ||
                              (e.staffName && e.staffName.toLowerCase() === st.name.toLowerCase()) ||
                              (e.paidTo && e.paidTo.toLowerCase() === st.name.toLowerCase()))
                        )
                        .reduce((sum, e) => sum + e.amount, 0);

                      // Total received from this staff
                      const stReceived = expenses
                        .filter(
                          (e) =>
                            e.type === 'STAFF_RECEIPT' &&
                            (e.staffId === st.id ||
                              (e.staffName && e.staffName.toLowerCase() === st.name.toLowerCase()) ||
                              (e.paidTo && e.paidTo.toLowerCase() === st.name.toLowerCase()))
                        )
                        .reduce((sum, e) => sum + e.amount, 0);

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                                {st.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                  <span>{st.name}</span>
                                  {st.nameGu && (
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      ({st.nameGu})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                  <span>{st.phone}</span>
                                  {st.address && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-400 max-w-[160px] truncate">{st.address}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              {st.role}
                            </span>
                            {st.joiningDate && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Joined: {formatDate(st.joiningDate)}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 text-right font-mono">
                            <div className="font-bold text-slate-900 text-sm">
                              {formatCurrency(st.salary)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {st.salaryType || 'Monthly'}
                            </div>
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-rose-600">
                            {formatCurrency(stPaid)}
                          </td>
                          <td className="py-3.5 text-right font-mono font-bold text-emerald-600">
                            {formatCurrency(stReceived)}
                          </td>
                          <td className="py-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                st.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {st.active ? (lang === 'gu' ? 'કાર્યરત' : 'Active') : (lang === 'gu' ? 'બંધ' : 'Inactive')}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Pay Salary / Advance */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuickPay(st)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                                title={lang === 'gu' ? 'પગાર / એડવાન્સ ચુકવો' : 'Pay Salary'}
                              >
                                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                <span>{lang === 'gu' ? 'પગાર ચૂકવો' : 'Pay'}</span>
                              </button>

                              {/* Quick Receive from Staff */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuickReceive(st)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                                title={lang === 'gu' ? 'સ્ટાફ પાસેથી જમા મેળવો' : 'Receive from Staff'}
                              >
                                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                <span>{lang === 'gu' ? 'જમા લો' : 'Receive'}</span>
                              </button>

                              {/* View Staff Ledger */}
                              <button
                                type="button"
                                onClick={() => setSelectedStaffForLedger(st)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={lang === 'gu' ? 'સ્ટાફ હિસાબ / લેજર જુઓ' : 'Staff Ledger'}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Staff */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(st)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={lang === 'gu' ? 'વિગત સુધારો' : 'Edit Staff'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Staff */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'staff',
                                    id: st.id,
                                    name: st.name,
                                    extra: `${st.role} • ${st.phone} • Salary: ₹${st.salary}`,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={lang === 'gu' ? 'ડિલીટ કરો' : 'Delete Staff'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD/EDIT UNIT MASTER */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingUnit
                      ? lang === 'gu'
                        ? 'યુનિટ મોડલ સુધારો'
                        : 'Edit Unit Master'
                      : lang === 'gu'
                      ? 'નવું યુનિટ મોડલ ઉમેરો'
                      : 'Add Unit Master'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'મશીન પ્રકાર, પ્રિફિક્સ કોડ અને સ્ટાન્ડર્ડ સર્વિસ ચાર્જ'
                      : 'Configure repair machine model, tracking prefix & base charge'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUnitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnitSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unit Model Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dental Handpiece (High Speed)"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  નામ (ગુજરાતીમાં)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. ડેન્ટલ હેન્ડપીસ"
                  value={unitNameGu}
                  onChange={(e) => setUnitNameGu(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={unitCategory}
                    onChange={(e) => setUnitCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Dental Equipment">Dental Equipment</option>
                    <option value="Jewellery & Lab Micro-Tools">Jewellery & Lab Micro-Tools</option>
                    <option value="Electronic Controllers">Electronic Controllers</option>
                    <option value="Jewellery Machinery">Jewellery Machinery</option>
                    <option value="General Tools">General Tools</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tag Code Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HP, MOT, USC"
                    value={unitCodePrefix}
                    onChange={(e) => setUnitCodePrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono uppercase font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Service Charge ₹
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitServiceCharge}
                    onChange={(e) => setUnitServiceCharge(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Warranty (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitWarrantyDays}
                    onChange={(e) => setUnitWarrantyDays(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Common Issues / Diagnostic Points (Comma separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bearing noise, Water block, No rotation, Carbon worn out"
                  value={unitCommonIssues}
                  onChange={(e) => setUnitCommonIssues(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingUnit
                    ? lang === 'gu'
                      ? 'સેવ કરો'
                      : 'Update Unit'
                    : lang === 'gu'
                    ? 'ઉમેરો'
                    : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PART MASTER */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingPart
                      ? lang === 'gu'
                        ? 'સ્પેરપાર્ટ વિગત સુધારો'
                        : 'Edit Part Master'
                      : lang === 'gu'
                      ? 'નવો સ્પેરપાર્ટ ઉમેરો'
                      : 'Add Part Master'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'ખરીદ કિંમત, વેચાણ કિંમત અને હાજર સ્ટોક'
                      : 'Manage catalog price, margin, and stock unit'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPartModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePartSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Part Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRT-BRG-70"
                    value={partCode}
                    onChange={(e) => setPartCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono uppercase font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={partType}
                    onChange={(e) => setPartType(e.target.value as 'part' | 'service')}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="part">Physical Spare Part</option>
                    <option value="service">Service Labor Charge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bearing 70"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  નામ (ગુજરાતીમાં)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. બેરિંગ ૭૦"
                  value={partNameGu}
                  onChange={(e) => setPartNameGu(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={partCategory}
                  onChange={(e) => setPartCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Mechanical Spare Parts">Mechanical Spare Parts</option>
                  <option value="Electronic Components">Electronic Components</option>
                  <option value="Cables & Wires">Cables & Wires</option>
                  <option value="Electrical Components">Electrical Components</option>
                  <option value="Labor & Servicing">Labor & Servicing</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cost / Purchase Price ₹ (ખરીદ ભાવ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={partCostPrice}
                    onChange={(e) => setPartCostPrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sale Price ₹ (ગ્રાહક વેચાણ ભાવ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={partSalePrice}
                    onChange={(e) => setPartSalePrice(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-black text-indigo-700"
                  />
                </div>
              </div>

              {partType === 'part' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Current Stock (હાજર સ્ટોક)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={partStock}
                      onChange={(e) => setPartStock(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-bold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                    <select
                      value={partUnit}
                      onChange={(e) => setPartUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="pcs">pcs (નંગ)</option>
                      <option value="set">set (સેટ)</option>
                      <option value="meter">meter (મીટર)</option>
                      <option value="packet">packet (પેકેટ)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingPart
                    ? lang === 'gu'
                      ? 'સેવ કરો'
                      : 'Update Part'
                    : lang === 'gu'
                    ? 'ઉમેરો'
                    : 'Add Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT SUPPLIER / CLIENT MASTER */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingSupplier
                      ? lang === 'gu'
                        ? 'સપ્લાયર / ક્લાયન્ટ સુધારો'
                        : 'Edit Supplier / Client'
                      : lang === 'gu'
                      ? 'નવો સપ્લાયર / ક્લાયન્ટ ઉમેરો'
                      : 'Add Supplier / Client'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'સ્પેરપાર્ટ્સ વેન્ડર્સ અને ડિસ્ટ્રીબ્યુટર વિગત'
                      : 'Manage vendor contact and business information'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor / Supplier Firm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Spares Rajkot"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mansukhbhai"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98250..."
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="Rajkot"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={supGst}
                    onChange={(e) => setSupGst(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={supCategory}
                  onChange={(e) => setSupCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Spare Parts Distributor">Spare Parts Distributor</option>
                  <option value="Dental & Precision Importer">Dental & Precision Importer</option>
                  <option value="Electronic Components">Electronic Components</option>
                  <option value="Bearing Importer">Bearing Importer</option>
                  <option value="Tools & Machinery Dealer">Tools & Machinery Dealer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Shop number, Street, Area"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Special parts supplied, credit terms, etc."
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingSupplier
                    ? lang === 'gu'
                      ? 'સેવ કરો'
                      : 'Update Supplier'
                    : lang === 'gu'
                    ? 'ઉમેરો'
                    : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD/EDIT CUSTOMER MASTER */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingCustomer
                      ? lang === 'gu'
                        ? 'કસ્ટમર વિગત સુધારો'
                        : 'Edit Customer Master'
                      : lang === 'gu'
                      ? 'નવો કસ્ટમર ઉમેરો'
                      : 'Add Customer Master'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'ગ્રાહક પેઢીનું નામ, મોબાઈલ, સરનામું અને GST'
                      : 'Client firm name, mobile, address, and GSTIN'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer / Firm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Govindji Jewellers"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhaveshbhai"
                    value={custContact}
                    onChange={(e) => setCustContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98250..."
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="Rajkot"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="24AAAAA0000A1Z5"
                    value={custGst}
                    onChange={(e) => setCustGst(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Shop number, Market, Area"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingCustomer
                    ? lang === 'gu'
                      ? 'સેવ કરો'
                      : 'Update Customer'
                    : lang === 'gu'
                    ? 'ઉમેરો'
                    : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD/EDIT STAFF MASTER */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingStaff
                      ? lang === 'gu'
                        ? 'સ્ટાફ વિગત સુધારો (Edit Staff)'
                        : 'Edit Staff Member'
                      : lang === 'gu'
                      ? 'નવો સ્ટાફ મેમ્બર ઉમેરો (Add Staff)'
                      : 'Add Staff Member'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'કારીગર/ટેકનિશિયનનું નામ, મોબાઈલ, હોદ્દો અને માસિક પગાર'
                      : 'Technician profile, mobile number, role, and salary details'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffSubmit} className="p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff Name (અંગ્રેજી નામ) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ગુજરાતી નામ (Name in Gujarati)
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. રમેશભાઈ પટેલ"
                    value={staffNameGu}
                    onChange={(e) => setStaffNameGu(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98790 12345"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    હોદ્દો / કામગીરી (Role / Designation) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Technician, Helper"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    પગાર રકમ (Salary Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="15000"
                    value={staffSalary || ''}
                    onChange={(e) => setStaffSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-indigo-200 rounded-xl font-mono font-bold text-indigo-700 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">પ્રકાર</label>
                  <select
                    value={staffSalaryType}
                    onChange={(e) => setStaffSalaryType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Monthly">Monthly (માસિક)</option>
                    <option value="Daily">Daily (દૈનિક)</option>
                    <option value="Per-Piece">Per Piece (કામ દીઠ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    જોઈનિંગ તારીખ (Joining Date)
                  </label>
                  <input
                    type="date"
                    value={staffJoiningDate}
                    onChange={(e) => setStaffJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">સ્થિતિ (Status)</label>
                  <select
                    value={staffActive ? 'true' : 'false'}
                    onChange={(e) => setStaffActive(e.target.value === 'true')}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="true">કાર્યરત (Active Employee)</option>
                    <option value="false">બંધ (Inactive / Left)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  સરનામું (Address / Location)
                </label>
                <input
                  type="text"
                  placeholder="Area / Village / City"
                  value={staffAddress}
                  onChange={(e) => setStaffAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ખાસ નોંધ (Notes / Expertise)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expert in NSK Handpieces, Marathon boxes"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md"
                >
                  {editingStaff
                    ? lang === 'gu'
                      ? 'સેવ કરો'
                      : 'Update Staff'
                    : lang === 'gu'
                    ? 'ઉમેરો'
                    : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: QUICK PAY SALARY / ADVANCE */}
      {showQuickPayModal && quickPayStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-rose-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'gu' ? 'પગાર / એડવાન્સ ચુકવો' : 'Pay Staff Salary / Advance'}
                  </h2>
                  <p className="text-xs text-rose-700 font-medium">
                    {quickPayStaff.name} ({formatCurrency(quickPayStaff.salary)}/mo)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickPayModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPay} className="p-6 space-y-3.5 text-xs">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-800 text-[11px]">
                {lang === 'gu'
                  ? '* આ રકમ દુકાનના ખર્ચ & કેશ ફ્લોમાં "Salary" તરીકે ઉમેરાશે અને નેટ બેલેન્સમાંથી ઓછી થશે.'
                  : '* This payment will be recorded under Expenses & Cash Flow as Salary, reducing net balance.'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    તારીખ (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickPayDate}
                    onChange={(e) => setQuickPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ચૂકવણી મોડ (Mode) *
                  </label>
                  <select
                    value={quickPayMode}
                    onChange={(e) => setQuickPayMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ચૂકવેલ રકમ (Amount ₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quickPayAmount || ''}
                  onChange={(e) => setQuickPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 border-2 border-rose-300 rounded-xl font-mono font-black text-rose-700 text-base focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  વિગત / શીર્ષક (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={quickPayTitle}
                  onChange={(e) => setQuickPayTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  નોંધ (Optional Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Part payment, Advance for festival"
                  value={quickPayNotes}
                  onChange={(e) => setQuickPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickPayModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md"
                >
                  {lang === 'gu' ? 'પગાર ચૂકવો (Confirm Payout)' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: QUICK RECEIVE FROM STAFF */}
      {showQuickReceiveModal && quickReceiveStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'gu' ? 'સ્ટાફ પાસેથી રકમ જમા લો' : 'Receive Money from Staff'}
                  </h2>
                  <p className="text-xs text-emerald-700 font-medium">
                    {quickReceiveStaff.name} ({quickReceiveStaff.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickReceiveModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickReceive} className="p-6 space-y-3.5 text-xs">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-[11px]">
                {lang === 'gu'
                  ? '* સ્ટાફે એડવાન્સ પરત આપ્યો હોય કે દુકાન માટે લાવેલ રકમ જમા કરાવો તો આ નેટ બેલેન્સમાં ઉમેરાશે (+ Inflow).'
                  : '* Amounts returned or deposited by staff will be added to the workshop net cash balance (+ Inflow).'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    તારીખ (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickReceiveDate}
                    onChange={(e) => setQuickReceiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    જમા મોડ (Mode) *
                  </label>
                  <select
                    value={quickReceiveMode}
                    onChange={(e) => setQuickReceiveMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Cash">Cash (રોકડ મળ્યા)</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  જમા રકમ (Amount Received ₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quickReceiveAmount || ''}
                  onChange={(e) => setQuickReceiveAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 2000"
                  className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl font-mono font-black text-emerald-700 text-base focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  વિગત / શીર્ષક (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={quickReceiveTitle}
                  onChange={(e) => setQuickReceiveTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  નોંધ (Optional Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance recovery, Cash collection from market"
                  value={quickReceiveNotes}
                  onChange={(e) => setQuickReceiveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickReceiveModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  {lang === 'gu' ? 'રકમ જમા લો (Confirm Receipt)' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: STAFF LEDGER & TRANSACTION HISTORY */}
      {selectedStaffForLedger && (
        <StaffLedgerModal
          staff={selectedStaffForLedger}
          expenses={expenses}
          onClose={() => setSelectedStaffForLedger(null)}
          onPaySalary={(st) => {
            setSelectedStaffForLedger(null);
            handleOpenQuickPay(st);
          }}
          onReceiveMoney={(st) => {
            setSelectedStaffForLedger(null);
            handleOpenQuickReceive(st);
          }}
          lang={lang}
        />
      )}

      {/* REUSABLE CUSTOM IN-UI DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'unit'
            ? lang === 'gu'
              ? 'યુનિટ મોડલ ડિલીટ કરો'
              : 'Delete Unit Master'
            : deleteTarget?.type === 'part'
            ? lang === 'gu'
              ? 'સ્પેરપાર્ટ ડિલીટ કરો'
              : 'Delete Spare Part'
            : deleteTarget?.type === 'supplier'
            ? lang === 'gu'
              ? 'સપ્લાયર / વેન્ડર ડિલીટ કરો'
              : 'Delete Supplier'
            : deleteTarget?.type === 'staff'
            ? lang === 'gu'
              ? 'સ્ટાફ મેમ્બર ડિલીટ કરો'
              : 'Delete Staff Member'
            : lang === 'gu'
            ? 'કસ્ટમર ડિલીટ કરો'
            : 'Delete Customer'
        }
        message={
          lang === 'gu'
            ? `શું તમે ખરેખર "${deleteTarget?.name}" ડિલીટ કરવા માંગો છો? આ પ્રક્રિયા રદ કરી શકાશે નહીં.`
            : `Are you sure you want to permanently delete "${deleteTarget?.name}"?`
        }
        itemDetails={deleteTarget?.extra}
        confirmButtonText={lang === 'gu' ? 'હા, ડિલીટ કરો' : 'Yes, Delete'}
        cancelButtonText={lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        lang={lang}
      />

      {/* EXCEL BULK UPLOAD MODAL */}
      <MasterExcelUploadModal
        isOpen={showExcelUploadModal}
        onClose={() => setShowExcelUploadModal(false)}
        activeTab={activeTab}
        lang={lang}
        onImportUnits={handleImportUnits}
        onImportCatalog={handleImportCatalog}
        onImportCustomers={handleImportCustomers}
        onImportSuppliers={handleImportSuppliers}
        onImportStaff={handleImportStaff}
      />
    </div>
  );
};
