import React, { useState } from 'react';
import { StaffMember, ExpenseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  X,
  UserCheck,
  Phone,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';

interface StaffLedgerModalProps {
  staff: StaffMember;
  expenses: ExpenseRecord[];
  onClose: () => void;
  onPaySalary: (staff: StaffMember) => void;
  onReceiveMoney: (staff: StaffMember) => void;
  lang: 'gu' | 'en';
}

export const StaffLedgerModal: React.FC<StaffLedgerModalProps> = ({
  staff,
  expenses,
  onClose,
  onPaySalary,
  onReceiveMoney,
  lang,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'received'>('all');

  // Find all transactions related to this staff member
  const staffTransactions = expenses
    .filter(
      (e) =>
        e.staffId === staff.id ||
        (e.staffName && e.staffName.toLowerCase() === staff.name.toLowerCase()) ||
        (e.paidTo && e.paidTo.toLowerCase() === staff.name.toLowerCase())
    )
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  // Metrics
  const totalPaid = staffTransactions
    .filter((e) => e.type !== 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalReceived = staffTransactions
    .filter((e) => e.type === 'STAFF_RECEIPT')
    .reduce((sum, e) => sum + e.amount, 0);

  const netPaidToStaff = totalPaid - totalReceived;

  // Running balance row by row
  const chronologicalTxns = [...staffTransactions].sort(
    (a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
  );
  let running = 0;
  const balanceMap = new Map<string, number>();
  chronologicalTxns.forEach((t) => {
    const isDebit = t.type === 'STAFF_RECEIPT';
    const credit = !isDebit ? t.amount : 0;
    const debit = isDebit ? t.amount : 0;
    running = running + credit - debit;
    balanceMap.set(t.id, running);
  });

  const filteredTxns = staffTransactions.filter((txn) => {
    if (filterType === 'paid') return txn.type !== 'STAFF_RECEIPT';
    if (filterType === 'received') return txn.type === 'STAFF_RECEIPT';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg text-white shadow-inner">
              {staff.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{staff.name}</h2>
                {staff.nameGu && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    {staff.nameGu}
                  </span>
                )}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    staff.active
                      ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                      : 'bg-rose-500/30 text-rose-100 border border-rose-400/40'
                  }`}
                >
                  {staff.active ? (lang === 'gu' ? 'કાર્યરત (Active)' : 'Active') : (lang === 'gu' ? 'નિષ્ક્રિય' : 'Inactive')}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5 flex items-center gap-2">
                <span>{staff.role}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {staff.phone}
                </span>
                {staff.joiningDate && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {lang === 'gu' ? 'જોઈનિંગ:' : 'Joined:'} {formatDate(staff.joiningDate)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary Slab Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Base Salary */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                {lang === 'gu' ? 'નિયમિત પગાર' : 'Base Salary'}
              </span>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">
                {formatCurrency(staff.salary)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {staff.salaryType || 'Monthly'}
              </span>
            </div>

            {/* Card 2: Total Paid Out */}
            <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                  {lang === 'gu' ? 'કુલ ચૂકવેલ રકમ' : 'Total Paid Out'}
                </span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-base font-black text-rose-600 mt-0.5 font-mono">
                {formatCurrency(totalPaid)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {lang === 'gu' ? 'પગાર + એડવાન્સ' : 'Salary & Advances'}
              </span>
            </div>

            {/* Card 3: Total Received from Staff */}
            <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                  {lang === 'gu' ? 'સ્ટાફ પાસેથી જમા' : 'Total Received'}
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-black text-emerald-600 mt-0.5 font-mono">
                {formatCurrency(totalReceived)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {lang === 'gu' ? 'એડવાન્સ પરત / વસૂલી' : 'Advance return / recovery'}
              </span>
            </div>

            {/* Card 4: Net Balance / Outflow */}
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 p-3 rounded-2xl border border-indigo-200 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                {lang === 'gu' ? 'નેટ ચૂકવણી (Net Paid)' : 'Net Paid to Staff'}
              </span>
              <div className="text-base font-black text-indigo-900 mt-0.5 font-mono">
                {formatCurrency(netPaidToStaff)}
              </div>
              <span className="text-[10px] text-indigo-600/80 block mt-0.5 font-medium">
                {lang === 'gu' ? 'કુલ નેટ રકમ' : 'Paid minus recovered'}
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/80">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lang === 'gu' ? 'બધા વ્યવહારો' : 'All Transactions'} ({staffTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('paid')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'paid'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                {lang === 'gu' ? 'પગાર / ચૂકવણી' : 'Payments Out'}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('received')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filterType === 'received'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {lang === 'gu' ? 'સ્ટાફ પાસેથી જમા' : 'Received In'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPaySalary(staff)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? 'પગાર / એડવાન્સ ચુકવો' : 'Pay Salary / Advance'}</span>
              </button>
              <button
                type="button"
                onClick={() => onReceiveMoney(staff)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? 'રકમ જમા લો' : 'Receive from Staff'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredTxns.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="font-semibold text-slate-600">
                {lang === 'gu'
                  ? 'આ સ્ટાફ મેમ્બર માટે કોઈ વ્યવહાર નોંધાયેલ નથી.'
                  : 'No transactions recorded for this staff member yet.'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'gu'
                  ? 'પગાર ચૂકવવા માટે "પગાર / એડવાન્સ ચુકવો" અથવા જમા લેવા માટે "રકમ જમા લો" બટન દબાવો.'
                  : 'Use the buttons above to record a salary payout or receive amount back.'}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 pl-4 w-12 text-center">Sr.</th>
                    <th className="py-3">તારીખ (Date)</th>
                    <th className="py-3">વિગત / વિવરણ (Particulars)</th>
                    <th className="py-3 text-center">મોડ (Mode)</th>
                    <th className="py-3 pr-3 text-right text-emerald-800 bg-emerald-50/50">
                      જમા આવેલી રકમ (Debit ₹)
                    </th>
                    <th className="py-3 pr-3 text-right text-rose-800 bg-rose-50/50">
                      ચૂકવેલી રકમ (Credit ₹)
                    </th>
                    <th className="py-3 pr-4 text-right bg-slate-100/70">
                      ચોખ્ખી બાકી (Balance ₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTxns.map((txn, index) => {
                    const isReceipt = txn.type === 'STAFF_RECEIPT';
                    const runBal = balanceMap.get(txn.id) || 0;
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-4 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 font-mono text-slate-700 font-medium">
                          {formatDate(txn.date)}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{txn.title}</div>
                          {txn.notes && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{txn.notes}</div>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {txn.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-bold text-sm bg-emerald-50/20">
                          {isReceipt ? (
                            <span className="text-emerald-700 font-black">
                              {formatCurrency(txn.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right font-mono font-bold text-sm bg-rose-50/20">
                          {!isReceipt ? (
                            <span className="text-rose-700 font-black">
                              {formatCurrency(txn.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-black text-sm bg-slate-50/50 text-indigo-900">
                          {formatCurrency(runBal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3 pl-4 text-right font-black uppercase text-[11px] text-slate-700">
                      {lang === 'gu' ? 'કુલ સરવાળો (Total):' : 'Grand Total:'}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono font-black text-sm text-emerald-800 bg-emerald-100/50">
                      {formatCurrency(totalReceived)}
                    </td>
                    <td className="py-3 pr-3 text-right font-mono font-black text-sm text-rose-800 bg-rose-100/50">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-black text-sm text-indigo-900 bg-indigo-100/50">
                      {formatCurrency(netPaidToStaff)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {lang === 'gu'
              ? '* સ્ટાફ પગાર ખર્ચમાંથી નેટ બેલેન્સ ઘટે છે, અને જમા લીધેલ રકમ નેટ બેલેન્સમાં ઉમેરાય છે.'
              : '* Salary payouts reduce net cash balance; amounts received from staff increase it.'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            {lang === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
