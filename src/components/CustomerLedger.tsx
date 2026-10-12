import React, { useState } from 'react';
import { Customer, Invoice, PaymentRecord, StaffMember, ExpenseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { PaymentReceiveModal, RecordPaymentParams } from './PaymentReceiveModal';
import {
  Users,
  CreditCard,
  Search,
  Eye,
  CheckCircle2,
  Calendar,
  Share2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Receipt,
  UserCheck,
  Phone,
  Wallet,
  DollarSign,
  Plus,
  X,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

interface CustomerLedgerProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  staffMembers?: StaffMember[];
  expenses?: ExpenseRecord[];
  onRecordPayment: (params: RecordPaymentParams) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onAddExpense?: (expense: ExpenseRecord) => void;
  lang: 'gu' | 'en';
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({
  customers,
  invoices,
  payments,
  staffMembers = [],
  expenses = [],
  onRecordPayment,
  onUpdateCustomer,
  onSelectInvoice,
  onAddExpense,
  lang,
}) => {
  // Main Slab Switcher: 'customers' or 'staff'
  const [mainSlab, setMainSlab] = useState<'customers' | 'staff'>('customers');

  // Customer Ledger State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetInvoiceIdForPayment, setTargetInvoiceIdForPayment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');

  // Staff Ledger State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffMembers[0]?.id || ''
  );
  const [staffSearchTerm, setStaffSearchTerm] = useState('');

  // Modals for Staff Ledger transactions
  const [showPaySalaryModal, setShowPaySalaryModal] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payTitle, setPayTitle] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [showReceiveStaffModal, setShowReceiveStaffModal] = useState(false);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [receiveMode, setReceiveMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [receiveTitle, setReceiveTitle] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // -------------------------------------------------------------
  // CUSTOMER DATA COMPUTATIONS
  // -------------------------------------------------------------
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const customerInvoices = selectedCustomer
    ? invoices.filter(
        (inv) =>
          inv.customerId === selectedCustomer.id ||
          inv.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  const customerPayments = selectedCustomer
    ? payments.filter(
        (p) =>
          p.customerId === selectedCustomer.id ||
          p.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  const totalBilled = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaidFromInvoices = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDueFromInvoices = customerInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const currentBalance = customerInvoices.length > 0 ? totalDueFromInvoices : (selectedCustomer?.balanceDue || 0);

  const handleOpenPaymentForInvoice = (invId?: string) => {
    setTargetInvoiceIdForPayment(invId || null);
    setShowPaymentModal(true);
  };

  const handleSharePaymentWhatsApp = (pay: PaymentRecord) => {
    let text = `*🧾 Payment Receipt / જમા પહોંચ*\n━━━━━━━━━━━━━━━━━\n👤 *Customer:* ${pay.customerName}\n💵 *Amount Received:* ₹${pay.amount}`;
    if (pay.discountWaived && pay.discountWaived > 0) {
      text += `\n🏷️ *Discount / Waived:* ₹${pay.discountWaived}\n💰 *Total Balance Settled:* ₹${pay.amount + pay.discountWaived}`;
    }
    text += `\n📅 *Date:* ${formatDate(pay.date)}\n💳 *Mode:* ${pay.paymentMode}${pay.referenceNo ? `\n🔢 *Ref / UTR:* ${pay.referenceNo}` : ''}${pay.invoiceNumber ? `\n📄 *Against Invoice:* ${pay.invoiceNumber}` : ''}${pay.notes ? `\n📝 *Notes:* ${pay.notes}` : ''}\n━━━━━━━━━━━━━━━━━\nThank you for your payment! 🙏`;
    const cleanPhone = selectedCustomer?.phone ? selectedCustomer.phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // -------------------------------------------------------------
  // STAFF DATA COMPUTATIONS
  // -------------------------------------------------------------
  const selectedStaff =
    staffMembers.find((s) => s.id === selectedStaffId) || staffMembers[0];

  const staffTransactions = selectedStaff
    ? expenses
        .filter(
          (e) =>
            e.staffId === selectedStaff.id ||
            (e.staffName && e.staffName.toLowerCase() === selectedStaff.name.toLowerCase()) ||
            (e.paidTo && e.paidTo.toLowerCase() === selectedStaff.name.toLowerCase())
        )
        .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
    : [];

  // Total Credit (ચૂકવેલી રકમ - Outflow paid to staff)
  const totalStaffPaidCredit = staffTransactions
    .filter((e) => e.type !== 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);

  // Total Debit (જમા આવેલી રકમ - Inflow received from staff)
  const totalStaffReceivedDebit = staffTransactions
    .filter((e) => e.type === 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Balance = Credit (ચૂકવેલી) - Debit (જમા આવેલી)
  const netStaffBalance = totalStaffPaidCredit - totalStaffReceivedDebit;

  // Running balance calculated chronological row-by-row
  let currentStaffRunning = 0;
  const staffTxnsWithBalance = staffTransactions
    .map((txn) => {
      const isDebit = txn.type === 'STAFF_RECEIPT'; // Jama aaveli rakam
      const debitAmount = isDebit ? txn.amount : 0;
      const creditAmount = !isDebit ? txn.amount : 0; // Chukveli rakam
      currentStaffRunning = currentStaffRunning + creditAmount - debitAmount;
      return {
        ...txn,
        debitAmount,
        creditAmount,
        runningBalance: currentStaffRunning,
      };
    })
    .reverse(); // Show latest on top with correct running balance

  // Open Pay Salary Modal
  const handleOpenPaySalaryModal = () => {
    if (!selectedStaff) return;
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount(selectedStaff.salary || 0);
    setPayMode('Cash');
    setPayTitle(
      lang === 'gu'
        ? `પગાર / એડવાન્સ - ${selectedStaff.name}`
        : `Salary / Advance - ${selectedStaff.name}`
    );
    setPayNotes('');
    setShowPaySalaryModal(true);
  };

  const handleSavePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || payAmount <= 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને માન્ય રકમ દાખલ કરો' : 'Please enter valid amount');
      return;
    }
    if (onAddExpense) {
      const newExp: ExpenseRecord = {
        id: `exp-${Date.now()}`,
        expenseNo: `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: payDate,
        category: 'Salary',
        type: 'EXPENSE',
        title: payTitle.trim() || `પગાર - ${selectedStaff.name}`,
        amount: payAmount,
        paymentMode: payMode,
        paidTo: selectedStaff.name,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        notes: payNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newExp);
    }
    setShowPaySalaryModal(false);
  };

  // Open Receive Money from Staff Modal
  const handleOpenReceiveStaffModal = () => {
    if (!selectedStaff) return;
    setReceiveDate(new Date().toISOString().split('T')[0]);
    setReceiveAmount(0);
    setReceiveMode('Cash');
    setReceiveTitle(
      lang === 'gu'
        ? `સ્ટાફ પાસેથી રકમ જમા - ${selectedStaff.name}`
        : `Received from Staff - ${selectedStaff.name}`
    );
    setReceiveNotes('');
    setShowReceiveStaffModal(true);
  };

  const handleSaveReceiveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || receiveAmount <= 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને માન્ય રકમ દાખલ કરો' : 'Please enter valid amount');
      return;
    }
    if (onAddExpense) {
      const newReceipt: ExpenseRecord = {
        id: `str-${Date.now()}`,
        expenseNo: `STR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: receiveDate,
        category: 'Salary',
        type: 'STAFF_RECEIPT',
        title: receiveTitle.trim() || `સ્ટાફ પાસેથી જમા - ${selectedStaff.name}`,
        amount: receiveAmount,
        paymentMode: receiveMode,
        paidTo: selectedStaff.name,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        notes: receiveNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddExpense(newReceipt);
    }
    setShowReceiveStaffModal(false);
  };

  // WhatsApp Share for Staff Statement
  const handleShareStaffWhatsApp = (staff: StaffMember) => {
    let text = `*📋 સ્ટાફ ખાતાવહી હિસાબ (Staff Ledger Statement)*\n━━━━━━━━━━━━━━━━━\n👤 *Staff Name:* ${staff.name} ${staff.nameGu ? `(${staff.nameGu})` : ''}\n💼 *Role:* ${staff.role}\n📞 *Phone:* ${staff.phone}\n💰 *Base Salary:* ₹${staff.salary.toLocaleString('en-IN')}\n\n*📊 હિસાબ સારાંશ:*\n🔴 *ચૂકવેલી રકમ (Credit):* ₹${totalStaffPaidCredit.toLocaleString('en-IN')}\n🟢 *જમા આવેલી રકમ (Debit):* ₹${totalStaffReceivedDebit.toLocaleString('en-IN')}\n⚖️ *ચોખ્ખી બાકી રકમ (Net Balance):* ₹${netStaffBalance.toLocaleString('en-IN')}\n━━━━━━━━━━━━━━━━━\n*છેલ્લા વ્યવહારો (Recent Transactions):*\n`;

    const recent = staffTxnsWithBalance.slice(0, 5);
    if (recent.length === 0) {
      text += `કોઈ વ્યવહાર નોંધાયેલ નથી.\n`;
    } else {
      recent.forEach((t) => {
        const isRec = t.type === 'STAFF_RECEIPT';
        text += `• ${formatDate(t.date)}: ${isRec ? '🟢 જમા (Debit)' : '🔴 ચૂકવણી (Credit)'} ₹${t.amount.toLocaleString('en-IN')} (${t.title})\n`;
      });
    }
    text += `━━━━━━━━━━━━━━━━━\nPrecision Repair Services`;
    const cleanPhone = staff.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Slab Navigation Switcher: Customer Ledger vs Staff Ledger */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMainSlab('customers')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                mainSlab === 'customers'
                  ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{lang === 'gu' ? 'ગ્રાહક ખાતાવહી (Customer Ledger)' : 'Customer Ledger'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                mainSlab === 'customers' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {customers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMainSlab('staff')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                mainSlab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{lang === 'gu' ? 'સ્ટાફ ખાતાવહી (Staff Ledger)' : 'Staff Ledger'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                mainSlab === 'staff' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {staffMembers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Action Button according to active Slab */}
        <div>
          {mainSlab === 'customers' && selectedCustomer && (
            <button
              onClick={() => handleOpenPaymentForInvoice()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-102 active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ પેમેન્ટ જમા લો' : '+ Record Payment'}</span>
            </button>
          )}

          {mainSlab === 'staff' && selectedStaff && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenPaySalaryModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-rose-200 transition-all hover:scale-102"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{lang === 'gu' ? '+ ચૂકવણી કરો (Credit)' : '+ Pay (Credit)'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenReceiveStaffModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-102"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{lang === 'gu' ? '+ રકમ જમા લો (Debit)' : '+ Receive (Debit)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SLAB 1: CUSTOMER LEDGER (ગ્રાહક ખાતાવહી)                   */}
      {/* ========================================================= */}
      {mainSlab === 'customers' && (
        <div className="space-y-6">
          {/* Two Column Layout: Customer Selector Left, Ledger Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Customers List */}
            <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 h-fit">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'gu' ? 'ગ્રાહક શોધો...' : 'Search customer...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const cInvs = invoices.filter(
                      (inv) => inv.customerId === c.id || inv.customerName.toLowerCase() === c.name.toLowerCase()
                    );
                    const cDue = cInvs.length > 0 ? cInvs.reduce((sum, i) => sum + i.balanceDue, 0) : c.balanceDue;

                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 shadow-2xs'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {c.name}
                          </span>
                          {cDue > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                              Due: ₹{cDue}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Clear
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                          <span>{c.city || 'Local'}</span>
                          <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {cInvs.length} {lang === 'gu' ? 'બિલ' : 'Bills'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right: Selected Customer Account Statement */}
            <div className="md:col-span-8 space-y-4">
              {selectedCustomer ? (
                <>
                  {/* Account Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-slate-500 font-semibold uppercase">
                        {lang === 'gu' ? 'કુલ બિલિંગ (Total Billed)' : 'Total Billed'}
                      </div>
                      <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                        {formatCurrency(totalBilled)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {customerInvoices.length} Invoices issued
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-emerald-600 font-semibold uppercase">
                        {lang === 'gu' ? 'કુલ જમા (Total Received)' : 'Total Received'}
                      </div>
                      <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                        {formatCurrency(totalPaidFromInvoices)}
                      </div>
                      <div className="text-[11px] text-emerald-600/70 mt-0.5">
                        {customerPayments.length} Payments recorded
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-xs text-rose-600 font-semibold uppercase">
                        {lang === 'gu' ? 'બાકી લેણું (Outstanding Due)' : 'Balance Due'}
                      </div>
                      <div className="text-xl font-black text-rose-600 mt-1 font-mono">
                        {formatCurrency(currentBalance)}
                      </div>
                      <div className="text-[11px] text-rose-500/70 mt-0.5">
                        {currentBalance > 0 ? (
                          <button
                            onClick={() => handleOpenPaymentForInvoice()}
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            {lang === 'gu' ? 'હવે જમા લો' : 'Click to pay now'}
                          </button>
                        ) : (
                          'All accounts settled'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-Tabs: Invoices vs Payment Receipts */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                      <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                        <button
                          onClick={() => setActiveTab('invoices')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'invoices'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lang === 'gu' ? 'બિલ હિસ્ટ્રી' : 'Invoices'} ({customerInvoices.length})
                        </button>
                        <button
                          onClick={() => setActiveTab('receipts')}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            activeTab === 'receipts'
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {lang === 'gu' ? 'જમા પહોંચ (Receipts)' : 'Payment Receipts'} ({customerPayments.length})
                        </button>
                      </div>

                      <div className="text-xs text-slate-500">
                        Customer: <strong className="text-slate-800">{selectedCustomer.name}</strong>
                      </div>
                    </div>

                    {/* Tab 1: Invoices Table */}
                    {activeTab === 'invoices' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 pl-6 w-12 text-center">Sr.</th>
                              <th className="py-2.5">Invoice #</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5 text-center">Units</th>
                              <th className="py-2.5 text-right">Billed (₹)</th>
                              <th className="py-2.5 text-right">Paid (₹)</th>
                              <th className="py-2.5 text-right">Due (₹)</th>
                              <th className="py-2.5 pr-6 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {customerInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                                  {lang === 'gu' ? 'આ ગ્રાહક માટે કોઈ બિલ મળ્યું નથી.' : 'No invoices generated for this customer yet.'}
                                </td>
                              </tr>
                            ) : (
                              customerInvoices.map((inv, index) => (
                                <tr key={inv.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 pl-6 text-center font-mono font-bold text-slate-400">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 font-mono font-bold text-indigo-700">
                                    {inv.invoiceNumber}
                                  </td>
                                  <td className="py-3 text-slate-600">{formatDate(inv.date)}</td>
                                  <td className="py-3 text-center">
                                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                                      {inv.units.length} Units
                                    </span>
                                  </td>
                                  <td className="py-3 text-right font-mono font-bold text-slate-900">
                                    {formatCurrency(inv.grandTotal)}
                                  </td>
                                  <td className="py-3 text-right font-mono text-emerald-700 font-semibold">
                                    {formatCurrency(inv.paidAmount)}
                                  </td>
                                  <td className="py-3 text-right font-mono font-bold text-rose-600">
                                    {formatCurrency(inv.balanceDue)}
                                  </td>
                                  <td className="py-3 pr-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {inv.balanceDue > 0 && (
                                        <button
                                          onClick={() => handleOpenPaymentForInvoice(inv.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-[11px] transition-colors"
                                          title="Receive payment for this invoice"
                                        >
                                          <CreditCard className="w-3 h-3 text-emerald-600" />
                                          <span>{lang === 'gu' ? 'પેમેન્ટ લો' : 'Pay'}</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => onSelectInvoice(inv)}
                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>{lang === 'gu' ? 'જુઓ' : 'View'}</span>
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

                    {/* Tab 2: Payment Receipts Table */}
                    {activeTab === 'receipts' && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 pl-6 w-12 text-center">Sr.</th>
                              <th className="py-2.5">Date</th>
                              <th className="py-2.5">Amount (₹)</th>
                              <th className="py-2.5">Mode</th>
                              <th className="py-2.5">Against Bill</th>
                              <th className="py-2.5">Ref / UTR</th>
                              <th className="py-2.5">Notes</th>
                              <th className="py-2.5 pr-6 text-center">Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {customerPayments.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                                  {lang === 'gu'
                                    ? 'આ ગ્રાહક માટે હજુ કોઈ જમા પહોંચ નથી.'
                                    : 'No payment receipts recorded for this customer yet.'}
                                </td>
                              </tr>
                            ) : (
                              customerPayments.map((pay, index) => (
                                <tr key={pay.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 pl-6 text-center font-mono font-bold text-slate-400">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 text-slate-700 font-medium">
                                    {formatDate(pay.date)}
                                  </td>
                                  <td className="py-3 font-mono">
                                    <div className="font-black text-emerald-700 text-sm">
                                      {formatCurrency(pay.amount)}
                                    </div>
                                    {pay.discountWaived && pay.discountWaived > 0 && (
                                      <div className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                                        <span>🏷️ +{formatCurrency(pay.discountWaived)} માફ</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3">
                                    <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[10px]">
                                      {pay.paymentMode}
                                    </span>
                                  </td>
                                  <td className="py-3 font-mono text-indigo-700 font-semibold">
                                    {pay.invoiceNumber || 'General Account'}
                                  </td>
                                  <td className="py-3 font-mono text-slate-500 text-[11px]">
                                    {pay.referenceNo || '-'}
                                  </td>
                                  <td className="py-3 text-slate-600 truncate max-w-[150px]">
                                    {pay.notes || '-'}
                                  </td>
                                  <td className="py-3 pr-6 text-center">
                                    <button
                                      onClick={() => handleSharePaymentWhatsApp(pay)}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                      title="Share WhatsApp Receipt"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  Select a customer to view ledger.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SLAB 2: STAFF LEDGER (સ્ટાફ ખાતાવહી)                      */}
      {/* ========================================================= */}
      {mainSlab === 'staff' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Staff Members List */}
            <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 h-fit">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={lang === 'gu' ? 'સ્ટાફ શોધો...' : 'Search staff...'}
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {staffMembers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    {lang === 'gu' ? 'કોઈ સ્ટાફ મેમ્બર ઉપલબ્ધ નથી.' : 'No staff members added yet.'}
                  </div>
                ) : (
                  staffMembers
                    .filter(
                      (s) =>
                        s.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                        (s.nameGu && s.nameGu.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                        s.role.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                        s.phone.includes(staffSearchTerm)
                    )
                    .map((s) => {
                      const isSelected = selectedStaff?.id === s.id;
                      // Calculate quick net balance for this staff
                      const sTxns = expenses.filter(
                        (e) =>
                          e.staffId === s.id ||
                          (e.staffName && e.staffName.toLowerCase() === s.name.toLowerCase()) ||
                          (e.paidTo && e.paidTo.toLowerCase() === s.name.toLowerCase())
                      );
                      const sPaid = sTxns
                        .filter((e) => e.type !== 'STAFF_RECEIPT')
                        .reduce((sum, e) => sum + e.amount, 0);
                      const sRec = sTxns
                        .filter((e) => e.type === 'STAFF_RECEIPT')
                        .reduce((sum, e) => sum + e.amount, 0);
                      const sNet = sPaid - sRec;

                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedStaffId(s.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 shadow-2xs ring-1 ring-indigo-200'
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {s.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                s.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {s.active ? (lang === 'gu' ? 'હાજર' : 'Active') : 'Inactive'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex justify-between items-center">
                            <span className="truncate">{s.role}</span>
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              {formatCurrency(s.salary)}
                            </span>
                          </div>

                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">
                              {sTxns.length} {lang === 'gu' ? 'વ્યવહાર' : 'Entries'}
                            </span>
                            <span className="font-mono font-bold text-indigo-700">
                              {lang === 'gu' ? 'નેટ:' : 'Net:'} {formatCurrency(sNet)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right Column: Selected Staff Ledger Statement */}
            <div className="md:col-span-8 space-y-4">
              {selectedStaff ? (
                <>
                  {/* Staff Info Banner & Quick Share */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                        {selectedStaff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-slate-900">
                            {selectedStaff.name}
                          </h2>
                          {selectedStaff.nameGu && (
                            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                              {selectedStaff.nameGu}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedStaff.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {selectedStaff.phone}
                          </span>
                          {selectedStaff.joiningDate && (
                            <>
                              <span>•</span>
                              <span>
                                {lang === 'gu' ? 'જોઈનિંગ:' : 'Joined:'} {formatDate(selectedStaff.joiningDate)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShareStaffWhatsApp(selectedStaff)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                        title="Share WhatsApp statement"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        title="Print statement"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'gu' ? 'પ્રિન્ટ' : 'Print'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Financial Metric Cards for Staff */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Base Salary */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {lang === 'gu' ? 'નિયમિત પગાર' : 'Base Salary'}
                      </span>
                      <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                        {formatCurrency(selectedStaff.salary)}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {selectedStaff.salaryType || 'Monthly'}
                      </span>
                    </div>

                    {/* Card 2: ચૂકવેલી રકમ - ક્રેડિટ (Credit / Outflow) */}
                    <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                          {lang === 'gu' ? 'ચૂકવેલી રકમ (Credit)' : 'Paid Out (Credit)'}
                        </span>
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div className="text-base font-black text-rose-600 mt-0.5 font-mono">
                        {formatCurrency(totalStaffPaidCredit)}
                      </div>
                      <span className="text-[10px] text-rose-500/80 block mt-0.5 font-medium">
                        {lang === 'gu' ? 'પગાર / એડવાન્સ ચુકવણી' : 'Salary & Advance Outflow'}
                      </span>
                    </div>

                    {/* Card 3: જમા આવેલી રકમ - ડેબિટ (Debit / Inflow) */}
                    <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {lang === 'gu' ? 'જમા આવેલી રકમ (Debit)' : 'Received (Debit)'}
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="text-base font-black text-emerald-600 mt-0.5 font-mono">
                        {formatCurrency(totalStaffReceivedDebit)}
                      </div>
                      <span className="text-[10px] text-emerald-600/80 block mt-0.5 font-medium">
                        {lang === 'gu' ? 'સ્ટાફ પાસેથી મળેલ જમા' : 'Advance Repaid / Inflow'}
                      </span>
                    </div>

                    {/* Card 4: ચોખ્ખી બાકી / હિસાબ બેલેન્સ */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                        {lang === 'gu' ? 'ચોખ્ખી બાકી (Net Balance)' : 'Net Balance'}
                      </span>
                      <div className="text-base font-black text-indigo-900 mt-0.5 font-mono">
                        {formatCurrency(netStaffBalance)}
                      </div>
                      <span className="text-[10px] text-indigo-600/80 block mt-0.5 font-medium">
                        {lang === 'gu' ? 'ક્રેડિટ - ડેબિટ ચોખ્ખો હિસાબ' : 'Credit minus Debit'}
                      </span>
                    </div>
                  </div>

                  {/* Staff Ledger Table with Columns: Date, Particulars, Mode, Jama / Debit, Chukveli / Credit, Balance */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                          <span>
                            {lang === 'gu'
                              ? 'સ્ટાફ ખાતાવહી વ્યવહારો (Staff Ledger Statement)'
                              : 'Staff Ledger Statement'}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lang === 'gu'
                            ? 'જમા આવેલી રકમ ડેબિટ અને ચૂકવેલી રકમ ક્રેડિટ કોલમમાં દર્શાવેલ છે'
                            : 'Amounts received shown in Debit column, amounts paid shown in Credit column'}
                        </p>
                      </div>

                      <div className="text-xs font-mono font-bold text-slate-600">
                        {staffTransactions.length} {lang === 'gu' ? 'કુલ વ્યવહારો' : 'Transactions'}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                            <th className="py-3">તારીખ (Date)</th>
                            <th className="py-3">વિગત / વિવરણ (Particulars)</th>
                            <th className="py-3 text-center">મોડ (Mode)</th>
                            <th className="py-3 text-right pr-4 text-emerald-800 bg-emerald-50/50">
                              જમા આવેલી રકમ (Debit ₹)
                            </th>
                            <th className="py-3 text-right pr-4 text-rose-800 bg-rose-50/50">
                              ચૂકવેલી રકમ (Credit ₹)
                            </th>
                            <th className="py-3 text-right pr-6 bg-slate-100/70">
                              ચોખ્ખી બાકી (Balance ₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {staffTxnsWithBalance.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                                <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                                <p className="font-semibold text-slate-600">
                                  {lang === 'gu'
                                    ? 'આ સ્ટાફ મેમ્બર માટે કોઈ વ્યવહાર નોંધાયેલ નથી.'
                                    : 'No ledger transactions recorded for this staff member yet.'}
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleOpenPaySalaryModal}
                                    className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
                                  >
                                    + પગાર / ચૂકવણી કરો
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleOpenReceiveStaffModal}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                                  >
                                    + રકમ જમા લો
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            staffTxnsWithBalance.map((txn, index) => {
                              const isReceipt = txn.type === 'STAFF_RECEIPT';
                              return (
                                <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                                    {index + 1}
                                  </td>
                                  <td className="py-3.5 font-mono font-medium text-slate-700">
                                    {formatDate(txn.date)}
                                  </td>
                                  <td className="py-3.5">
                                    <div className="font-bold text-slate-900">{txn.title}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-slate-400">
                                        {txn.expenseNo}
                                      </span>
                                      {txn.notes && (
                                        <>
                                          <span>•</span>
                                          <span>{txn.notes}</span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                      {txn.paymentMode}
                                    </span>
                                  </td>

                                  {/* Column: જમા આવેલી રકમ (Debit ₹) */}
                                  <td className="py-3.5 text-right pr-4 font-mono font-bold text-sm bg-emerald-50/20">
                                    {isReceipt ? (
                                      <span className="text-emerald-700 font-black">
                                        {formatCurrency(txn.debitAmount)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 font-normal">-</span>
                                    )}
                                  </td>

                                  {/* Column: ચૂકવેલી રકમ (Credit ₹) */}
                                  <td className="py-3.5 text-right pr-4 font-mono font-bold text-sm bg-rose-50/20">
                                    {!isReceipt ? (
                                      <span className="text-rose-700 font-black">
                                        {formatCurrency(txn.creditAmount)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 font-normal">-</span>
                                    )}
                                  </td>

                                  {/* Column: ચોખ્ખી બાકી / બેલેન્સ (Balance ₹) */}
                                  <td className="py-3.5 text-right pr-6 font-mono font-black text-sm bg-slate-50/50 text-indigo-900">
                                    {formatCurrency(txn.runningBalance)}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                          <tr>
                            <td colSpan={3} className="py-3 pl-6 text-right font-black uppercase text-[11px] text-slate-700">
                              {lang === 'gu' ? 'કુલ સરવાળો (Total):' : 'Grand Total:'}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono font-black text-sm text-emerald-800 bg-emerald-100/50">
                              {formatCurrency(totalStaffReceivedDebit)}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono font-black text-sm text-rose-800 bg-rose-100/50">
                              {formatCurrency(totalStaffPaidCredit)}
                            </td>
                            <td className="py-3 pr-6 text-right font-mono font-black text-sm text-indigo-900 bg-indigo-100/50">
                              {formatCurrency(netStaffBalance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  Select a staff member to view ledger.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global / Dedicated Customer Payment Receive Modal */}
      <PaymentReceiveModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setTargetInvoiceIdForPayment(null);
        }}
        customers={customers}
        invoices={invoices}
        initialCustomerId={selectedCustomer?.id || null}
        initialInvoiceId={targetInvoiceIdForPayment}
        onRecordPayment={onRecordPayment}
        lang={lang}
      />

      {/* MODAL: Pay Salary / Advance to Staff (Credit Outflow) */}
      {showPaySalaryModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'gu' ? 'પગાર / એડવાન્સ ચૂકવો (Credit)' : 'Pay Salary / Advance'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedStaff.name} • {selectedStaff.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaySalaryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePaySalary} className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {lang === 'gu'
                    ? 'આ રકમ સ્ટાફ લેજરમાં ક્રેડિટ (ચૂકવણી) તરીકે અને નેટ કેશ બેલેન્સમાંથી બાદ થશે.'
                    : 'Recorded as Credit in Staff Ledger and deducted from net cash balance.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'તારીખ (Date)' : 'Date'} *
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
                    {lang === 'gu' ? 'રકમ (Amount ₹)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payAmount || ''}
                    onChange={(e) => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 border-2 border-rose-300 rounded-xl font-mono font-black text-rose-700 text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'વિગત / શીર્ષક (Title)' : 'Title / Purpose'} *
                </label>
                <input
                  type="text"
                  required
                  value={payTitle}
                  onChange={(e) => setPayTitle(e.target.value)}
                  placeholder="e.g. Salary for month"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
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
                  <option value="Cash">Cash (રોકડ ચૂકવ્યા)</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  <option value="Cheque">Cheque (ચેક)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'નોંધ / રીમાર્કસ' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaySalaryModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {lang === 'gu' ? 'ચૂકવણી સેવ કરો (Credit)' : 'Save Payment (Credit)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Receive Money from Staff (Debit Inflow) */}
      {showReceiveStaffModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-100 bg-emerald-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {lang === 'gu' ? 'સ્ટાફ પાસેથી રકમ જમા (Debit)' : 'Receive Money from Staff'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedStaff.name} • {selectedStaff.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiveStaffModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReceiveStaff} className="p-6 space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'gu'
                    ? 'આ રકમ સ્ટાફ લેજરમાં ડેબિટ (જમા) તરીકે અને નેટ કેશ બેલેન્સમાં ઉમેરાશે (+ Inflow).'
                    : 'Recorded as Debit in Staff Ledger and added to net cash balance.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'તારીખ (Date)' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'રકમ (Amount ₹)' : 'Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={receiveAmount || ''}
                    onChange={(e) => setReceiveAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border-2 border-emerald-300 rounded-xl font-mono font-black text-emerald-700 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'વિગત / હેતુ (Title)' : 'Title / Purpose'} *
                </label>
                <input
                  type="text"
                  required
                  value={receiveTitle}
                  onChange={(e) => setReceiveTitle(e.target.value)}
                  placeholder="e.g. Advance repaid"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'પેમેન્ટ મોડ' : 'Payment Mode'} *
                </label>
                <select
                  value={receiveMode}
                  onChange={(e) => setReceiveMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Cash">Cash (રોકડ જમા)</option>
                  <option value="UPI">UPI (GPay / PhonePe)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                  <option value="Cheque">Cheque (ચેક)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'નોંધ / રીમાર્કસ' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReceiveStaffModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {lang === 'gu' ? 'જમા રકમ સેવ કરો (Debit)' : 'Save Receipt (Debit)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

