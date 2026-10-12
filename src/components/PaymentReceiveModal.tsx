import React, { useState, useEffect } from 'react';
import { Customer, Invoice, PaymentRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  CreditCard,
  X,
  CheckCircle2,
  Calendar,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export interface RecordPaymentParams {
  customerId: string;
  invoiceId?: string;
  amount: number;
  discountWaived?: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  date: string;
  referenceNo?: string;
  notes?: string;
}

interface PaymentReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  initialCustomerId?: string | null;
  initialInvoiceId?: string | null;
  onRecordPayment: (params: RecordPaymentParams) => void;
  lang: 'gu' | 'en';
}

export const PaymentReceiveModal: React.FC<PaymentReceiveModalProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  initialCustomerId,
  initialInvoiceId,
  onRecordPayment,
  lang,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('all');
  const [amount, setAmount] = useState<number>(0);
  const [discountWaived, setDiscountWaived] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync initial selections when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setDiscountWaived(0);
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    let targetCustId = initialCustomerId;
    let targetInvId = initialInvoiceId || 'all';

    if (initialInvoiceId) {
      const inv = invoices.find((i) => i.id === initialInvoiceId);
      if (inv) {
        targetCustId = inv.customerId;
        targetInvId = inv.id;
      }
    }

    if (!targetCustId && customers.length > 0) {
      targetCustId = customers[0].id;
    }

    setSelectedCustomerId(targetCustId || '');
    setSelectedInvoiceId(targetInvId);

    // Calculate default suggested amount
    if (targetCustId) {
      if (targetInvId !== 'all') {
        const inv = invoices.find((i) => i.id === targetInvId);
        setAmount(inv ? inv.balanceDue : 0);
      } else {
        const custInvs = invoices.filter(
          (i) => i.customerId === targetCustId || (customers.find((c) => c.id === targetCustId)?.name.toLowerCase() === i.customerName.toLowerCase())
        );
        const totalDue = custInvs.reduce((sum, i) => sum + i.balanceDue, 0);
        setAmount(totalDue > 0 ? totalDue : 0);
      }
    }
  }, [isOpen, initialCustomerId, initialInvoiceId, customers, invoices]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // All invoices for this customer
  const customerInvoices = currentCustomer
    ? invoices.filter(
        (i) =>
          i.customerId === currentCustomer.id ||
          i.customerName.toLowerCase() === currentCustomer.name.toLowerCase()
      )
    : [];

  const unpaidInvoices = customerInvoices.filter((i) => i.balanceDue > 0);
  const totalCustomerDue = customerInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  // Target balance due depending on selection
  let maxApplicableDue = totalCustomerDue;
  if (selectedInvoiceId !== 'all') {
    const inv = customerInvoices.find((i) => i.id === selectedInvoiceId);
    maxApplicableDue = inv ? inv.balanceDue : 0;
  }

  // Handle invoice dropdown change
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    setErrorMsg('');
    setDiscountWaived(0);
    if (invId === 'all') {
      setAmount(totalCustomerDue);
    } else {
      const targetInv = customerInvoices.find((i) => i.id === invId);
      setAmount(targetInv ? targetInv.balanceDue : 0);
    }
  };

  // Handle customer dropdown change
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    setSelectedInvoiceId('all');
    setErrorMsg('');
    setDiscountWaived(0);

    const newCust = customers.find((c) => c.id === custId);
    const newInvs = newCust
      ? invoices.filter(
          (i) => i.customerId === newCust.id || i.customerName.toLowerCase() === newCust.name.toLowerCase()
        )
      : [];
    const newTotalDue = newInvs.reduce((sum, i) => sum + i.balanceDue, 0);
    setAmount(newTotalDue);
  };

  const handleSetQuickAmount = (val: number) => {
    setAmount(Math.max(0, val));
    setErrorMsg('');
  };

  const remainingAfterPayment = Math.max(0, maxApplicableDue - amount - discountWaived);

  const handleWaiveRemaining = () => {
    const rem = Math.max(0, maxApplicableDue - amount);
    setDiscountWaived(rem);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCustomer) {
      setErrorMsg(lang === 'gu' ? 'કૃપા કરીને ગ્રાહક પસંદ કરો' : 'Please select customer');
      return;
    }

    if ((!amount || amount <= 0) && (!discountWaived || discountWaived <= 0)) {
      setErrorMsg(lang === 'gu' ? 'કૃપા કરીને જમા રકમ અથવા ડિસ્કાઉન્ટ રકમ દાખલ કરો' : 'Please enter payment amount or discount amount');
      return;
    }

    onRecordPayment({
      customerId: currentCustomer.id,
      invoiceId: selectedInvoiceId === 'all' ? undefined : selectedInvoiceId,
      amount,
      discountWaived: discountWaived > 0 ? discountWaived : undefined,
      paymentMode,
      date,
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {lang === 'gu' ? 'પેમેન્ટ જમા લો (Receive Payment)' : 'Record Payment Receipt'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'gu'
                  ? 'ગ્રાહક પાસેથી મળેલ રોકડ / UPI પેમેન્ટની પહોંચ અને ખાતાવહી એન્ટ્રી'
                  : 'Record customer payment against invoices or general ledger'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'ગ્રાહક (Customer)' : 'Customer Name'} *
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900"
              >
                {customers.map((c) => {
                  const cInvs = invoices.filter(
                    (i) => i.customerId === c.id || i.customerName.toLowerCase() === c.name.toLowerCase()
                  );
                  const cDue = cInvs.reduce((sum, i) => sum + i.balanceDue, 0);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ''} — {cDue > 0 ? `બાકી ₹${cDue}` : 'હિસાબ ચોખ્ખો'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Payment Target / Invoice Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'કયા બિલ પેટે જમા લેવું છે? (Against Invoice)' : 'Apply Payment To'}
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">
                {lang === 'gu'
                  ? `બધા બાકી બિલો પેટે (કુલ બાકી: ₹${totalCustomerDue})`
                  : `All Pending Invoices (Total Due: ₹${totalCustomerDue})`}
              </option>
              {customerInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} ({formatDate(inv.date)}) — Billed: ₹{inv.grandTotal} | Due: ₹{inv.balanceDue}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Status Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">
                {selectedInvoiceId === 'all'
                  ? lang === 'gu'
                    ? 'કુલ બાકી લેણી રકમ:'
                    : 'Total Customer Balance Due:'
                  : lang === 'gu'
                  ? 'આ બિલની બાકી રકમ:'
                  : 'Selected Invoice Balance Due:'}
              </span>
              <span className="font-mono font-black text-base text-rose-600">
                {formatCurrency(maxApplicableDue)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block text-[11px]">
                {lang === 'gu' ? 'ચૂકવણી પછી બાકી રહેશે:' : 'Balance After Payment:'}
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatCurrency(remainingAfterPayment)}
              </span>
            </div>
          </div>

          {/* Amount Input & Quick Chips */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="font-bold text-slate-900">
                {lang === 'gu' ? 'જમા રકમ (Received Amount ₹)' : 'Received Amount (₹)'} *
              </label>
              {maxApplicableDue > 0 && (
                <span className="text-[11px] text-slate-500">
                  {lang === 'gu' ? 'બાકી પૂરેપૂરા: ' : 'Total Due: '}
                  <strong className="text-emerald-700 font-mono">₹{maxApplicableDue}</strong>
                </span>
              )}
            </div>

            <input
              type="number"
              required
              min="1"
              value={amount || ''}
              onChange={(e) => {
                setErrorMsg('');
                setAmount(Math.max(0, parseFloat(e.target.value) || 0));
              }}
              placeholder="e.g. 1450"
              className="w-full px-3.5 py-2.5 text-base font-mono font-black text-slate-900 border-2 border-emerald-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/20"
            />

            {/* Quick buttons */}
            {maxApplicableDue > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSetQuickAmount(maxApplicableDue);
                    setDiscountWaived(0);
                  }}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px] transition-colors"
                >
                  {lang === 'gu' ? `પૂરા ₹${maxApplicableDue}` : `Full ₹${maxApplicableDue}`}
                </button>
                {maxApplicableDue > 100 && (
                  <button
                    type="button"
                    onClick={() => handleSetQuickAmount(Math.round(maxApplicableDue / 2))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                  >
                    50% (₹{Math.round(maxApplicableDue / 2)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSetQuickAmount(500)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] transition-colors"
                >
                  ₹500
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickAmount(1000)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] transition-colors"
                >
                  ₹1000
                </button>
              </div>
            )}
          </div>

          {/* Discount / Waived Amount Input (ઓછું આપે તો માફ કરવાનો વિકલ્પ) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <span>🏷️</span>
                <span>
                  {lang === 'gu'
                    ? 'ડિસ્કાઉન્ટ / માફ કરેલ રકમ (Discount / Waived ₹)'
                    : 'Discount / Waived Off Amount (₹)'}
                </span>
              </label>
              {maxApplicableDue > amount && (
                <button
                  type="button"
                  onClick={handleWaiveRemaining}
                  className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                >
                  {lang === 'gu'
                    ? `બાકી ₹${maxApplicableDue - amount} પૂરા માફ કરો`
                    : `Waive remaining ₹${maxApplicableDue - amount}`}
                </button>
              )}
            </div>

            <p className="text-[11px] text-amber-700">
              {lang === 'gu'
                ? 'જો ગ્રાહક અમુક રકમ ઓછી આપે અને બાકી રકમ જતી/માફ કરવી હોય તો અહીં ડિસ્કાઉન્ટ લખો જેથી હિસાબ સરભર થઈ જાય.'
                : 'Enter discount/waived amount if customer pays less and you want to forgive the remaining balance.'}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={discountWaived || ''}
                onChange={(e) => {
                  setErrorMsg('');
                  setDiscountWaived(Math.max(0, parseFloat(e.target.value) || 0));
                }}
                placeholder={lang === 'gu' ? 'દા.ત. 50 અથવા 100' : 'e.g. 50 or 200'}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-amber-950 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              {discountWaived > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscountWaived(0)}
                  className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 shrink-0"
                >
                  {lang === 'gu' ? 'હટાવો' : 'Clear'}
                </button>
              )}
            </div>

            {/* Total Settled Summary */}
            {(amount > 0 || discountWaived > 0) && (
              <div className="pt-1.5 border-t border-amber-200/80 flex justify-between text-[11px] text-amber-900">
                <span>
                  {lang === 'gu' ? 'કુલ સરભર થયેલ રકમ:' : 'Total Settled Balance:'}{' '}
                  <strong>₹{amount + discountWaived}</strong> (મળ્યા: ₹{amount} + માફ: ₹{discountWaived})
                </span>
                <span className="font-bold">
                  {remainingAfterPayment === 0 ? (
                    <span className="text-emerald-700">✓ હિસાબ ચોખ્ખો (Full Clear)</span>
                  ) : (
                    <span className="text-rose-600">બાકી: ₹{remainingAfterPayment}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Payment Mode and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'પેમેન્ટ મોડ' : 'Payment Mode'} *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">Cash (રોકડ)</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="Cheque">Cheque (ચેક)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'તારીખ (Date)' : 'Receipt Date'} *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Reference / UTR Number & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'રેફરન્સ / UTR / ચેક નં.' : 'Reference / UTR / Cheque #'}
              </label>
              <input
                type="text"
                placeholder={lang === 'gu' ? 'દા.ત. UPI-492102...' : 'e.g. UPI Ref / UTR'}
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'નોંધ / વિગત' : 'Notes / Remarks'}
              </label>
              <input
                type="text"
                placeholder={lang === 'gu' ? 'દા.ત. ડિલિવરી સમયે મળ્યા' : 'Optional notes'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {lang === 'gu'
                ? `₹${amount || 0} પેમેન્ટ જમા કરો`
                : `Confirm Payment (₹${amount || 0})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
