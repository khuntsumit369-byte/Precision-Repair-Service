import React, { useState } from 'react';
import { ExpenseCategory, ExpenseRecord, PaymentRecord, PurchaseRecord, StaffMember, ExpenseType } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Building,
  Zap,
  Coffee,
  Truck,
  UserCheck,
  Wrench,
  HelpCircle,
  X,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ExpenseAndCashFlowViewProps {
  expenses: ExpenseRecord[];
  purchases: PurchaseRecord[];
  payments: PaymentRecord[];
  staffMembers?: StaffMember[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onUpdateExpense?: (expense: ExpenseRecord) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdatePayment?: (payment: PaymentRecord) => void;
  onDeletePayment?: (paymentId: string) => void;
  onOpenEditPurchase?: (purchaseId: string) => void;
  lang: 'gu' | 'en';
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ElementType> = {
  Rent: Building,
  Electricity: Zap,
  'Tea & Refreshment': Coffee,
  'Courier & Transport': Truck,
  Salary: UserCheck,
  'Tools & Consumables': Wrench,
  Maintenance: Wrench,
  Other: HelpCircle,
};

const CATEGORY_GU: Record<ExpenseCategory, string> = {
  Rent: 'દુકાન ભાડું (Rent)',
  Electricity: 'લાઈટ બિલ (Electricity)',
  'Tea & Refreshment': 'ચા-નાસ્તો (Refreshment)',
  'Courier & Transport': 'કુરિયર / ટ્રાન્સપોર્ટ (Courier)',
  Salary: 'સ્ટાફ પગાર / ચૂકવણી (Salary)',
  'Tools & Consumables': 'ટૂલ્સ & કેમિકલ્સ (Tools)',
  Maintenance: 'મેન્ટેનન્સ (Maintenance)',
  Other: 'પરચૂરણ ખર્ચ (Other)',
};

export const ExpenseAndCashFlowView: React.FC<ExpenseAndCashFlowViewProps> = ({
  expenses,
  purchases,
  payments,
  staffMembers = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onUpdatePayment,
  onDeletePayment,
  onOpenEditPurchase,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'cashflow'>('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Expense / Staff Receipt
  const [expType, setExpType] = useState<ExpenseType>('EXPENSE');
  const [expStaffId, setExpStaffId] = useState<string>('');
  const [expStaffName, setExpStaffName] = useState<string>('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Tea & Refreshment');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expPaymentMode, setExpPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Payment Edit Form State
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [payDate, setPayDate] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDiscountWaived, setPayDiscountWaived] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payRefNo, setPayRefNo] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Calculations
  const customerPaymentsInflow = payments.reduce((sum, p) => sum + p.amount, 0);
  const staffReceiptsInflow = expenses
    .filter((e) => e.type === 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalInflow = customerPaymentsInflow + staffReceiptsInflow;

  const totalExpensesOutflow = expenses
    .filter((e) => e.type !== 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPurchasesOutflow = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalOutflow = totalExpensesOutflow + totalPurchasesOutflow;
  const netCashBalance = totalInflow - totalOutflow;

  // Cash vs Bank split
  const cashInflow =
    payments.filter((p) => p.paymentMode === 'Cash').reduce((sum, p) => sum + p.amount, 0) +
    expenses.filter((e) => e.type === 'STAFF_RECEIPT' && e.paymentMode === 'Cash').reduce((sum, e) => sum + e.amount, 0);
  const cashOutflow =
    expenses.filter((e) => e.type !== 'STAFF_RECEIPT' && e.paymentMode === 'Cash').reduce((sum, e) => sum + e.amount, 0) +
    purchases.filter((p) => p.paymentMode === 'Cash').reduce((sum, p) => sum + p.paidAmount, 0);
  const cashInHand = cashInflow - cashOutflow;

  const bankInflow =
    payments.filter((p) => p.paymentMode !== 'Cash').reduce((sum, p) => sum + p.amount, 0) +
    expenses.filter((e) => e.type === 'STAFF_RECEIPT' && e.paymentMode !== 'Cash').reduce((sum, e) => sum + e.amount, 0);
  const bankOutflow =
    expenses.filter((e) => e.type !== 'STAFF_RECEIPT' && e.paymentMode !== 'Cash').reduce((sum, e) => sum + e.amount, 0) +
    purchases.filter((p) => p.paymentMode !== 'Cash').reduce((sum, p) => sum + p.paidAmount, 0);
  const bankBalance = bankInflow - bankOutflow;

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter === 'expenses_only' && e.type === 'STAFF_RECEIPT') return false;
    if (categoryFilter === 'receipts_only' && e.type !== 'STAFF_RECEIPT') return false;
    if (categoryFilter === 'salary_only' && e.category !== 'Salary') return false;
    if (
      categoryFilter !== 'all' &&
      categoryFilter !== 'expenses_only' &&
      categoryFilter !== 'receipts_only' &&
      categoryFilter !== 'salary_only' &&
      e.category !== categoryFilter
    )
      return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(term) ||
      e.category.toLowerCase().includes(term) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(term)) ||
      (e.staffName && e.staffName.toLowerCase().includes(term))
    );
  });

  // Unified Chronological Cash Flow Ledger
  type FlowItem = {
    id: string;
    date: string;
    type: 'INFLOW' | 'EXPENSE' | 'PURCHASE';
    title: string;
    subtitle?: string;
    amount: number;
    paymentMode: string;
    rawDate: string;
    isStaffReceipt?: boolean;
  };

  const unifiedFlow: FlowItem[] = [
    ...payments.map((p) => ({
      id: p.id,
      date: p.date,
      type: 'INFLOW' as const,
      title: `${lang === 'gu' ? 'ગ્રાહક પેમેન્ટ જમા:' : 'Payment Received:'} ${p.customerName}`,
      subtitle: p.invoiceNumber ? `Invoice: ${p.invoiceNumber}` : 'General Ledger',
      amount: p.amount,
      paymentMode: p.paymentMode,
      rawDate: p.date,
      isStaffReceipt: false,
    })),
    ...expenses.map((e) => {
      if (e.type === 'STAFF_RECEIPT') {
        return {
          id: e.id,
          date: e.date,
          type: 'INFLOW' as const,
          title: `${lang === 'gu' ? 'સ્ટાફ પાસેથી જમા:' : 'Received from Staff:'} ${e.staffName || e.paidTo || e.title}`,
          subtitle: `${lang === 'gu' ? 'એડવાન્સ પરત / જમા' : 'Staff Recovery / Advance Return'} • ${e.title}`,
          amount: e.amount,
          paymentMode: e.paymentMode,
          rawDate: e.date,
          isStaffReceipt: true,
        };
      }
      return {
        id: e.id,
        date: e.date,
        type: 'EXPENSE' as const,
        title:
          e.category === 'Salary'
            ? `${lang === 'gu' ? 'સ્ટાફ પગાર / એડવાન્સ:' : 'Staff Salary / Advance:'} ${e.staffName || e.paidTo || e.title}`
            : `${lang === 'gu' ? 'દુકાન ખર્ચ:' : 'Expense:'} ${e.title}`,
        subtitle: `${CATEGORY_GU[e.category] || e.category}${e.paidTo ? ` • Paid to: ${e.paidTo}` : ''}`,
        amount: e.amount,
        paymentMode: e.paymentMode,
        rawDate: e.date,
        isStaffReceipt: false,
      };
    }),
    ...purchases.map((pur) => ({
      id: pur.id,
      date: pur.date,
      type: 'PURCHASE' as const,
      title: `${lang === 'gu' ? 'સ્પેરપાર્ટ્સ ખરીદી:' : 'Parts Purchase:'} ${pur.vendorName}`,
      subtitle: `${pur.purchaseNo} • ${pur.items.length} Parts (${pur.items.map((i) => i.name).join(', ')})`,
      amount: pur.paidAmount,
      paymentMode: pur.paymentMode,
      rawDate: pur.date,
      isStaffReceipt: false,
    })),
  ].sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  // Open New Expense Modal
  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpType('EXPENSE');
    setExpStaffId('');
    setExpStaffName('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpCategory('Tea & Refreshment');
    setExpTitle('');
    setExpAmount(0);
    setExpPaymentMode('Cash');
    setExpPaidTo('');
    setExpNotes('');
    setShowAddModal(true);
  };

  // Open Edit Expense Modal
  const handleOpenEditExpense = (exp: ExpenseRecord) => {
    setEditingExpense(exp);
    setExpType(exp.type || 'EXPENSE');
    setExpStaffId(exp.staffId || '');
    setExpStaffName(exp.staffName || '');
    setExpDate(exp.date);
    setExpCategory(exp.category);
    setExpTitle(exp.title);
    setExpAmount(exp.amount);
    setExpPaymentMode(exp.paymentMode);
    setExpPaidTo(exp.paidTo || '');
    setExpNotes(exp.notes || '');
    setShowAddModal(true);
  };

  // Handle Save Expense (Add or Edit)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને વિગત અને રકમ દાખલ કરો' : 'Please enter title and valid amount');
      return;
    }

    if (editingExpense) {
      const updated: ExpenseRecord = {
        ...editingExpense,
        date: expDate,
        type: expType,
        category: expCategory,
        title: expTitle.trim(),
        amount: expAmount,
        paymentMode: expPaymentMode,
        paidTo: expPaidTo.trim() || undefined,
        staffId: expStaffId || undefined,
        staffName: expStaffName || undefined,
        notes: expNotes.trim() || undefined,
      };
      if (onUpdateExpense) {
        onUpdateExpense(updated);
      }
    } else {
      const prefix = expType === 'STAFF_RECEIPT' ? 'STR' : 'EXP';
      const newExpense: ExpenseRecord = {
        id: (expType === 'STAFF_RECEIPT' ? 'str-' : 'exp-') + Date.now(),
        expenseNo: `${prefix}-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`,
        date: expDate,
        type: expType,
        category: expCategory,
        title: expTitle.trim(),
        amount: expAmount,
        paymentMode: expPaymentMode,
        paidTo: expPaidTo.trim() || undefined,
        staffId: expStaffId || undefined,
        staffName: expStaffName || undefined,
        notes: expNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newExpense);
    }

    setShowAddModal(false);
    setEditingExpense(null);
    setExpTitle('');
    setExpAmount(0);
    setExpPaidTo('');
    setExpStaffId('');
    setExpStaffName('');
    setExpNotes('');
  };

  // Payment Edit Handlers for Cash Flow Inflows
  const handleOpenEditPayment = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return;
    setEditingPayment(p);
    setPayDate(p.date);
    setPayAmount(p.amount);
    setPayDiscountWaived(p.discountWaived || 0);
    setPayMode(p.paymentMode);
    setPayRefNo(p.referenceNo || '');
    setPayNotes(p.notes || '');
    setShowPaymentEditModal(true);
  };

  const handleSavePaymentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    if (payAmount <= 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને માન્ય રકમ દાખલ કરો' : 'Please enter valid amount');
      return;
    }

    const updated: PaymentRecord = {
      ...editingPayment,
      date: payDate,
      amount: Number(payAmount) || 0,
      discountWaived: Number(payDiscountWaived) || undefined,
      paymentMode: payMode,
      referenceNo: payRefNo.trim() || undefined,
      notes: payNotes.trim() || undefined,
    };

    if (onUpdatePayment) {
      onUpdatePayment(updated);
    }
    setShowPaymentEditModal(false);
    setEditingPayment(null);
  };

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'expense' | 'payment';
    id: string;
    name: string;
    extra?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'expense') {
      onDeleteExpense(deleteTarget.id);
    } else if (deleteTarget.type === 'payment' && onDeletePayment) {
      onDeletePayment(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleDeletePaymentClick = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return;
    setDeleteTarget({
      type: 'payment',
      id: paymentId,
      name: `${p.customerName}`,
      extra: `${formatCurrency(p.amount)} • Mode: ${p.paymentMode} • Date: ${p.date}`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <span>
              {lang === 'gu'
                ? 'દુકાન ખર્ચ અને કેશ ફ્લો (Expense & Cash Flow)'
                : 'Workshop Expenses & Cash Flow'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'gu'
              ? 'દુકાનનું ભાડું, લાઈટ બિલ, ચા-નાસ્તો, સ્ટાફ પગાર, આવક-જાવક અને રોકડ સિલકનો ચોખ્ખો હિસાબ'
              : 'Track daily workshop operating expenses, money inflows vs outflows, and net cash in hand.'}
          </p>
        </div>

        <button
          onClick={handleOpenNewExpense}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-rose-200 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'gu' ? '+ નવો ખર્ચ ઉમેરો (Add Expense)' : '+ Record Expense'}</span>
        </button>
      </div>

      {/* Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ કેશ આવક (Inflow)' : 'Total Inflow (Received)'}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalInflow)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            From {payments.length} customer receipts
          </span>
          <div className="absolute right-0 bottom-0 w-16 h-16 bg-emerald-50 rounded-tl-full -mr-4 -mb-4 pointer-events-none -z-0"></div>
        </div>

        {/* Total Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ જાવક (Outflow)' : 'Total Outflow (Spent)'}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            {formatCurrency(totalOutflow)}
          </div>
          <span className="text-[11px] text-slate-500">
            ખર્ચ: {formatCurrency(totalExpensesOutflow)} + ખરીદી: {formatCurrency(totalPurchasesOutflow)}
          </span>
        </div>

        {/* Net Cash Balance / Surplus */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'ચોખ્ખી બચત (Net Balance)' : 'Net Cash Balance'}</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              netCashBalance >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {netCashBalance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${
            netCashBalance >= 0 ? 'text-indigo-700' : 'text-rose-600'
          }`}>
            {formatCurrency(netCashBalance)}
          </div>
          <span className="text-[11px] text-slate-400">Inflow minus Outflow</span>
        </div>

        {/* Cash in Hand vs Bank */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold mb-2">
            {lang === 'gu' ? 'રોકડ vs બેંક સિલક' : 'Cash vs Bank Split'}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">💵 રોકડ સિલક (Cash):</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(cashInHand)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">💳 બેંક / UPI (Online):</span>
              <span className="font-mono font-bold text-indigo-700">{formatCurrency(bankBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === 'gu' ? '૧. દુકાન ખર્ચ રજીસ્ટર (Expenses)' : '1. Expense Register'}</span>
              <span className="bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {expenses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cashflow')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'cashflow'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'gu' ? '૨. કેશ ફ્લો લેજર (Cash Timeline)' : '2. Cash Flow Ledger'}</span>
              <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {unifiedFlow.length}
              </span>
            </button>
          </div>

          {activeTab === 'expenses' && (
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
              >
                <option value="all">{lang === 'gu' ? 'બધા વ્યવહારો (All Records)' : 'All Records'}</option>
                <option value="expenses_only">{lang === 'gu' ? '🔴 ફક્ત સામાન્ય ખર્ચ (Expenses Only)' : 'Expenses Only'}</option>
                <option value="salary_only">{lang === 'gu' ? '🟣 સ્ટાફ પગાર ચૂકવણી (Staff Salary)' : 'Staff Salary Only'}</option>
                <option value="receipts_only">{lang === 'gu' ? '🟢 સ્ટાફ પાસેથી જમા (Staff Receipts)' : 'Staff Receipts'}</option>
                <option value="Rent">દુકાન ભાડું (Rent)</option>
                <option value="Electricity">લાઈટ બિલ (Electricity)</option>
                <option value="Tea & Refreshment">ચા-નાસ્તો (Refreshment)</option>
                <option value="Courier & Transport">કુરિયર / ટ્રાન્સપોર્ટ</option>
                <option value="Tools & Consumables">ટૂલ્સ & કેમિકલ્સ</option>
                <option value="Maintenance">મેન્ટેનન્સ</option>
                <option value="Other">પરચૂરણ (Other)</option>
              </select>

              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={lang === 'gu' ? 'ખર્ચ શોધો...' : 'Search expense...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: Expenses Register */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Category (કેટેગરી)</th>
                  <th className="py-3">Expense Details (વિગત)</th>
                  <th className="py-3 text-right">Amount (રકમ ₹)</th>
                  <th className="py-3 text-center">Payment Mode</th>
                  <th className="py-3">Paid To (કોને આપ્યા)</th>
                  <th className="py-3 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu'
                        ? 'કોઈ ખર્ચ નોંધાયેલ નથી. "+ નવો ખર્ચ ઉમેરો" પર ક્લિક કરીને નોંધો.'
                        : 'No expenses recorded yet. Click "+ Record Expense" to add.'}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp, index) => {
                    const isReceipt = exp.type === 'STAFF_RECEIPT';
                    const isSalary = exp.category === 'Salary' || !!exp.staffId;
                    const IconComponent = isReceipt
                      ? ArrowUpRight
                      : isSalary
                      ? UserCheck
                      : CATEGORY_ICONS[exp.category] || HelpCircle;

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 text-slate-700 font-medium">
                          {formatDate(exp.date)}
                        </td>
                        <td className="py-3">
                          {isReceipt ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'gu' ? 'સ્ટાફ પાસેથી જમા' : 'Staff Receipt'}</span>
                            </span>
                          ) : isSalary ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <UserCheck className="w-3 h-3 text-purple-600" />
                              <span>{lang === 'gu' ? 'સ્ટાફ પગાર / ચૂકવણી' : 'Staff Salary'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                              <IconComponent className="w-3 h-3 text-rose-600" />
                              <span>{CATEGORY_GU[exp.category] || exp.category}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          {exp.staffName && (
                            <div className="text-[11px] text-indigo-600 font-medium">
                              Staff: {exp.staffName}
                            </div>
                          )}
                          {exp.notes && (
                            <div className="text-[11px] text-slate-400 italic">{exp.notes}</div>
                          )}
                        </td>
                        <td className={`py-3 text-right font-mono font-black text-sm ${
                          isReceipt ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isReceipt ? `+ ${formatCurrency(exp.amount)}` : `- ${formatCurrency(exp.amount)}`}
                        </td>
                        <td className="py-3 text-center">
                          <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[10px]">
                            {exp.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {isReceipt
                            ? `Received from: ${exp.staffName || exp.paidTo || '-'}`
                            : exp.paidTo || exp.staffName || '-'}
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title={lang === 'gu' ? 'ખર્ચ સુધારો (Edit)' : 'Edit Expense'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'expense',
                                  id: exp.id,
                                  name: exp.title,
                                  extra: `${formatCurrency(exp.amount)} • ${CATEGORY_GU[exp.category] || exp.category} • Date: ${formatDate(exp.date)}`,
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Expense"
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

        {/* TAB 2: Unified Cash Flow Timeline */}
        {activeTab === 'cashflow' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Date</th>
                  <th className="py-3 text-center">Flow Type</th>
                  <th className="py-3">Transaction Description (વિગત)</th>
                  <th className="py-3 text-center">Mode</th>
                  <th className="py-3 text-right">Inflow (+ આવક)</th>
                  <th className="py-3 text-right">Outflow (- જાવક)</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unifiedFlow.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      No cash transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  unifiedFlow.map((item, index) => {
                    const isInflow = item.type === 'INFLOW';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 text-slate-700 font-medium">
                          {formatDate(item.date)}
                        </td>
                        <td className="py-3 text-center">
                          {isInflow ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                              <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                              આવક
                            </span>
                          ) : item.type === 'PURCHASE' ? (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-amber-600" />
                              ખરીદી જાવક
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                              ખર્ચ જાવક
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[10px]">
                            {item.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-emerald-700">
                          {isInflow ? `+ ${formatCurrency(item.amount)}` : '-'}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-rose-600">
                          {!isInflow ? `- ${formatCurrency(item.amount)}` : '-'}
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            {item.type === 'EXPENSE' && (
                              <>
                                <button
                                  onClick={() => {
                                    const exp = expenses.find((x) => x.id === item.id);
                                    if (exp) handleOpenEditExpense(exp);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                  title={lang === 'gu' ? 'ખર્ચ એન્ટ્રી સુધારો' : 'Edit Expense'}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const exp = expenses.find((x) => x.id === item.id);
                                    setDeleteTarget({
                                      type: 'expense',
                                      id: item.id,
                                      name: exp ? exp.title : item.title,
                                      extra: `${formatCurrency(item.amount)} • Date: ${formatDate(item.date)}`,
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {item.type === 'INFLOW' && (
                              <>
                                {item.isStaffReceipt ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        const exp = expenses.find((x) => x.id === item.id);
                                        if (exp) handleOpenEditExpense(exp);
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                      title={lang === 'gu' ? 'જમા એન્ટ્રી સુધારો' : 'Edit Staff Receipt'}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const exp = expenses.find((x) => x.id === item.id);
                                        setDeleteTarget({
                                          type: 'expense',
                                          id: item.id,
                                          name: exp ? exp.title : item.title,
                                          extra: `${formatCurrency(item.amount)} • Date: ${formatDate(item.date)}`,
                                        });
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                      title={lang === 'gu' ? 'જમા એન્ટ્રી ડિલીટ કરો' : 'Delete Staff Receipt'}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditPayment(item.id)}
                                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                      title={lang === 'gu' ? 'પેમેન્ટ જમા એન્ટ્રી સુધારો' : 'Edit Payment'}
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {onDeletePayment && (
                                      <button
                                        onClick={() => handleDeletePaymentClick(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                        title="Delete Payment"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </>
                            )}

                            {item.type === 'PURCHASE' && onOpenEditPurchase && (
                              <button
                                onClick={() => onOpenEditPurchase(item.id)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded"
                                title={lang === 'gu' ? 'પાર્ટ્સ ખરીદી બિલ સુધારો' : 'Edit Purchase Bill'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      </div>

      {/* MODAL: Record or Edit Expense / Staff Receipt */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                expType === 'STAFF_RECEIPT'
                  ? 'border-emerald-200 bg-emerald-50/80'
                  : 'border-slate-200 bg-rose-50/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold ${
                    expType === 'STAFF_RECEIPT' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {expType === 'STAFF_RECEIPT' ? <TrendingUp className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingExpense
                      ? expType === 'STAFF_RECEIPT'
                        ? lang === 'gu'
                          ? 'સ્ટાફ જમા એન્ટ્રી સુધારો'
                          : 'Edit Staff Receipt'
                        : lang === 'gu'
                        ? 'ખર્ચ વિગત સુધારો (Edit Expense)'
                        : 'Edit Expense'
                      : expType === 'STAFF_RECEIPT'
                      ? lang === 'gu'
                        ? 'સ્ટાફ પાસેથી રકમ જમા (Staff Inflow)'
                        : 'Receive Money from Staff'
                      : lang === 'gu'
                      ? 'નવો ખર્ચ / પગાર ચૂકવણી (Add Expense / Salary)'
                      : 'Record Expense / Salary Outflow'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {expType === 'STAFF_RECEIPT'
                      ? lang === 'gu'
                        ? 'સ્ટાફ પાસેથી પરત આવેલ એડવાન્સ કે રકમ નેટ બેલેન્સમાં પ્લસ (જમા) થશે.'
                        : 'Amount received from staff will increase net cash balance (Inflow).'
                      : lang === 'gu'
                      ? 'દુકાનનો ખર્ચ કે સ્ટાફ પગાર નેટ બેલેન્સમાંથી માઇનસ (બાદ) થશે.'
                      : 'Workshop expense or salary will be deducted from net cash balance.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Entry Type Toggle (Expense Outflow vs Staff Inflow) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {lang === 'gu' ? 'એન્ટ્રી પ્રકાર (Entry Type)' : 'Select Transaction Type'}
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setExpType('EXPENSE');
                    if (expType === 'STAFF_RECEIPT') {
                      setExpCategory('Tea & Refreshment');
                      setExpTitle('');
                    }
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    expType === 'EXPENSE'
                      ? 'bg-white text-rose-700 shadow-xs ring-1 ring-rose-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === 'gu' ? 'ખર્ચ / પગાર (Outflow)' : 'Expense / Salary Outflow'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpType('STAFF_RECEIPT');
                    setExpCategory('Salary');
                    if (!expTitle || expTitle.startsWith('પગાર')) {
                      setExpTitle(
                        expStaffName
                          ? `${lang === 'gu' ? 'સ્ટાફ પાસેથી જમા' : 'Staff Receipt'} - ${expStaffName}`
                          : lang === 'gu'
                          ? 'સ્ટાફ પાસેથી રકમ જમા'
                          : 'Received from Staff'
                      );
                    }
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    expType === 'STAFF_RECEIPT'
                      ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'gu' ? 'સ્ટાફ પાસેથી જમા (Inflow)' : 'Receive from Staff (Inflow)'}</span>
                </button>
              </div>

              {/* Cash Flow Impact Badge */}
              <div
                className={`mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 ${
                  expType === 'STAFF_RECEIPT'
                    ? 'bg-emerald-100/70 text-emerald-800'
                    : 'bg-rose-100/70 text-rose-800'
                }`}
              >
                {expType === 'STAFF_RECEIPT' ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'gu'
                        ? 'આ રકમ નેટ બેલેન્સમાં ઉમેરાશે (+ Inflow)'
                        : 'Will be added to Net Balance (+ Inflow)'}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      {lang === 'gu'
                        ? 'આ રકમ નેટ બેલેન્સમાંથી બાદ થશે (- Outflow)'
                        : 'Will be deducted from Net Balance (- Outflow)'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'તારીખ (Date)' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                {expType === 'EXPENSE' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {lang === 'gu' ? 'ખર્ચ કેટેગરી' : 'Category'} *
                    </label>
                    <select
                      value={expCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as ExpenseCategory;
                        setExpCategory(newCat);
                        if (newCat === 'Salary' && expStaffName && !expTitle) {
                          setExpTitle(`પગાર / એડવાન્સ - ${expStaffName}`);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    >
                      <option value="Salary">સ્ટાફ પગાર / એડવાન્સ (Salary)</option>
                      <option value="Tea & Refreshment">ચા-નાસ્તો (Refreshment)</option>
                      <option value="Rent">દુકાન ભાડું (Rent)</option>
                      <option value="Electricity">લાઈટ બિલ (Electricity)</option>
                      <option value="Courier & Transport">કુરિયર / ટ્રાન્સપોર્ટ (Courier)</option>
                      <option value="Tools & Consumables">ટૂલ્સ & કેમિકલ્સ (Tools)</option>
                      <option value="Maintenance">મેન્ટેનન્સ (Maintenance)</option>
                      <option value="Other">પરચૂરણ ખર્ચ (Other)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {lang === 'gu' ? 'જમા પ્રકાર' : 'Receipt Type'}
                    </label>
                    <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold">
                      {lang === 'gu' ? 'સ્ટાફ પાસેથી આવક (Inflow)' : 'Staff Inflow Receipt'}
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Member Selector (Shown for Staff Receipt or Salary / Option to link) */}
              {(expType === 'STAFF_RECEIPT' || expCategory === 'Salary' || staffMembers.length > 0) && (
                <div
                  className={`p-3 rounded-xl border ${
                    expType === 'STAFF_RECEIPT'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : expCategory === 'Salary'
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>
                      {expType === 'STAFF_RECEIPT'
                        ? lang === 'gu'
                          ? 'કયા સ્ટાફ પાસેથી રકમ મળી? (Staff Member)'
                          : 'Received From Staff Member'
                        : lang === 'gu'
                        ? 'સ્ટાફ મેમ્બર લિંક કરો (Staff Member)'
                        : 'Link Staff Member'}
                    </span>
                    {expType === 'STAFF_RECEIPT' && (
                      <span className="text-[10px] text-emerald-700 font-normal">
                        {lang === 'gu' ? '* પસંદ કરવું જરૂરી' : '* Required'}
                      </span>
                    )}
                  </label>
                  <select
                    value={expStaffId}
                    onChange={(e) => {
                      const sId = e.target.value;
                      setExpStaffId(sId);
                      const staff = staffMembers.find((s) => s.id === sId);
                      if (staff) {
                        setExpStaffName(staff.name);
                        setExpPaidTo(staff.name);
                        if (expType === 'STAFF_RECEIPT') {
                          setExpTitle(`${lang === 'gu' ? 'સ્ટાફ પાસેથી જમા' : 'Staff Receipt'} - ${staff.name}`);
                        } else if (expCategory === 'Salary') {
                          setExpTitle(`${lang === 'gu' ? 'પગાર / એડવાન્સ' : 'Salary / Advance'} - ${staff.name}`);
                          if (!expAmount && staff.salary) {
                            setExpAmount(staff.salary);
                          }
                        }
                      } else {
                        setExpStaffName('');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium bg-white"
                  >
                    <option value="">
                      {expType === 'STAFF_RECEIPT'
                        ? lang === 'gu'
                          ? '-- સ્ટાફ મેમ્બર પસંદ કરો --'
                          : '-- Select Staff Member --'
                        : lang === 'gu'
                        ? '-- કોઈ સ્ટાફ લિંક નથી (સામાન્ય) --'
                        : '-- None (General) --'}
                    </option>
                    {staffMembers.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.nameGu ? `(${st.nameGu})` : ''} • {st.role} • {formatCurrency(st.salary)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {expType === 'STAFF_RECEIPT'
                    ? lang === 'gu'
                      ? 'જમા વિગત / હેતુ (Receipt Description)'
                      : 'Description / Purpose'
                    : lang === 'gu'
                    ? 'ખર્ચ વિગત / નામ (Expense Description)'
                    : 'Title / Description'}{' '}
                  *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    expType === 'STAFF_RECEIPT'
                      ? lang === 'gu'
                        ? 'દા.ત. રમેશભાઈ પાસેથી એડવાન્સ પરત / જમા'
                        : 'e.g. Advance repayment from Ramesh'
                      : lang === 'gu'
                      ? 'દા.ત. ઓગસ્ટ મહિનાનો પગાર / દુકાન ભાડું'
                      : 'e.g. Shop rent or Salary for August'
                  }
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'રકમ (Amount ₹)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="e.g. 500"
                    className={`w-full px-3 py-2 border-2 rounded-xl font-mono font-black text-sm ${
                      expType === 'STAFF_RECEIPT'
                        ? 'border-emerald-300 text-emerald-700 focus:ring-2 focus:ring-emerald-500'
                        : 'border-rose-300 text-rose-700 focus:ring-2 focus:ring-rose-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'પેમેન્ટ મોડ' : 'Payment Mode'} *
                  </label>
                  <select
                    value={expPaymentMode}
                    onChange={(e) => setExpPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                    <option value="Cheque">Cheque (ચેક)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {expType === 'STAFF_RECEIPT'
                      ? lang === 'gu'
                        ? 'કોની પાસેથી મળ્યા (Received From)'
                        : 'Received From'
                      : lang === 'gu'
                      ? 'કોને ચૂકવ્યા (Paid To)'
                      : 'Paid To'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      expType === 'STAFF_RECEIPT'
                        ? lang === 'gu'
                          ? 'દા.ત. સ્ટાફનું નામ'
                          : 'Staff name'
                        : lang === 'gu'
                        ? 'દા.ત. સ્ટાફ / મકાનમાલિક'
                        : 'e.g. Staff or Landlord'
                    }
                    value={expPaidTo}
                    onChange={(e) => setExpPaidTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'નોંધ / રીમાર્કસ' : 'Notes / Remarks'}
                  </label>
                  <input
                    type="text"
                    placeholder="Optional notes"
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm transition-all ${
                    expType === 'STAFF_RECEIPT'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {editingExpense
                    ? expType === 'STAFF_RECEIPT'
                      ? lang === 'gu'
                        ? 'જમા એન્ટ્રી અપડેટ કરો'
                        : 'Update Staff Receipt'
                      : lang === 'gu'
                      ? 'ખર્ચ અપડેટ કરો'
                      : 'Update Expense'
                    : expType === 'STAFF_RECEIPT'
                    ? lang === 'gu'
                      ? 'જમા એન્ટ્રી સેવ કરો (+ Inflow)'
                      : 'Save Staff Receipt (+ Inflow)'
                    : lang === 'gu'
                    ? 'ખર્ચ સેવ કરો (- Outflow)'
                    : 'Save Expense (- Outflow)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Customer Inflow Payment */}
      {showPaymentEditModal && editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'gu' ? 'પેમેન્ટ જમા એન્ટ્રી સુધારો' : 'Edit Customer Receipt'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingPayment.customerName} {editingPayment.invoiceNumber ? `(${editingPayment.invoiceNumber})` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentEdit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'તારીખ (Date)' : 'Payment Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'પેમેન્ટ મોડ' : 'Payment Mode'} *
                  </label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="Cash">Cash (રોકડ)</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                    <option value="Cheque">Cheque (ચેક)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'જમા રકમ (Received Amount ₹)' : 'Amount Received (₹)'} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 border-2 border-emerald-400 rounded-xl font-mono font-black text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'છૂટ / માફ રકમ (Discount Waived ₹)' : 'Discount / Roundoff Waived (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={payDiscountWaived || ''}
                  onChange={(e) => setPayDiscountWaived(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'યુપીઆઇ / રેફરન્સ નંબર' : 'Reference / UTR / Cheque No'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9812..."
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'નોંધ / રીમાર્કસ' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder="Optional payment notes"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'gu' ? 'પેમેન્ટ સુધારો' : 'Update Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE CUSTOM IN-UI DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'expense'
            ? lang === 'gu'
              ? 'ખર્ચ એન્ટ્રી ડિલીટ કરો'
              : 'Delete Expense Entry'
            : lang === 'gu'
            ? 'ગ્રાહક પેમેન્ટ રસીદ રદ કરો'
            : 'Delete Customer Receipt'
        }
        message={
          deleteTarget?.type === 'expense'
            ? lang === 'gu'
              ? `શું તમે ખરેખર "${deleteTarget?.name}" ખર્ચ ડિલીટ કરવા માંગો છો? આનાથી કેશ ફ્લોમાં જાવક રદ થશે.`
              : `Are you sure you want to delete "${deleteTarget?.name}" expense? This will cancel outflow in cash flow.`
            : lang === 'gu'
            ? `શું તમે ખરેખર "${deleteTarget?.name}" ની પેમેન્ટ એન્ટ્રી રદ કરવા માંગો છો?`
            : `Are you sure you want to delete payment receipt for "${deleteTarget?.name}"?`
        }
        itemDetails={deleteTarget?.extra}
        confirmButtonText={lang === 'gu' ? 'હા, ડિલીટ કરો' : 'Yes, Delete'}
        cancelButtonText={lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        lang={lang}
      />
    </div>
  );
};
