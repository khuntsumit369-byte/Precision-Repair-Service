import React, { useState } from 'react';
import { Invoice, WorkshopSettings, CatalogItem } from '../types';
import { INITIAL_CATALOG } from '../data/initialData';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  FileText,
  Printer,
  Tag,
  Share2,
  Eye,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
  Trash2,
  CreditCard,
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  catalog?: CatalogItem[];
  settings: WorkshopSettings;
  onSelectInvoice: (invoice: Invoice) => void;
  onCreateNew: () => void;
  onPrintStickers: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenPayment?: (invoice: Invoice) => void;
  lang: 'gu' | 'en';
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  catalog,
  settings,
  onSelectInvoice,
  onCreateNew,
  onPrintStickers,
  onDeleteInvoice,
  onOpenPayment,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Helper to calculate total purchase cost of parts used in an invoice
  const getInvoicePartsPurchaseCost = (inv: Invoice): number => {
    return (inv.units || []).reduce((sum, u) => {
      return (
        sum +
        (u.parts || []).reduce((pSum, p) => {
          if (p.costPrice !== undefined && p.costPrice > 0) {
            return pSum + (p.quantity || 1) * p.costPrice;
          }
          const match =
            (catalog &&
              catalog.find(
                (c) =>
                  c.id === p.catalogItemId ||
                  (p.code && c.code.toLowerCase() === p.code.toLowerCase()) ||
                  c.name.toLowerCase() === p.name.toLowerCase()
              )) ||
            INITIAL_CATALOG.find(
              (c) =>
                c.id === p.catalogItemId ||
                (p.code && c.code.toLowerCase() === p.code.toLowerCase()) ||
                c.name.toLowerCase() === p.name.toLowerCase()
            );
          const cp = match?.costPrice || 0;
          return pSum + (p.quantity || 1) * cp;
        }, 0)
      );
    }, 0);
  };

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;
    if (!matchesStatus) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();

    // Check invoice number or customer
    if (inv.invoiceNumber.toLowerCase().includes(term)) return true;
    if (inv.customerName.toLowerCase().includes(term)) return true;
    if (inv.customerPhone && inv.customerPhone.includes(term)) return true;

    // Check unit tracking codes or unit names
    const matchesUnit = inv.units.some(
      (u) =>
        u.trackingCode.toLowerCase().includes(term) ||
        u.unitName.toLowerCase().includes(term) ||
        (u.brandModel && u.brandModel.toLowerCase().includes(term)) ||
        u.parts.some((p) => p.name.toLowerCase().includes(term))
    );

    return matchesUnit;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              lang === 'gu'
                ? 'બિલ નં, ગ્રાહકનું નામ કે યુનિટ કોડ (HP-260825-01) શોધો...'
                : 'Search bill, customer, or unit code (HP-260825-01)...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Tabs & Create Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {(['All', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'All'
                  ? lang === 'gu'
                    ? 'બધા (All)'
                    : 'All'
                  : st === 'Paid'
                  ? lang === 'gu'
                    ? 'ચૂકવેલ'
                    : 'Paid'
                  : st === 'Partial'
                  ? lang === 'gu'
                    ? 'અડધું'
                    : 'Partial'
                  : lang === 'gu'
                  ? 'બાકી'
                  : 'Unpaid'}
              </button>
            ))}
          </div>

          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'gu' ? '+ નવું બિલ બનાવો' : '+ Create Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {lang === 'gu' ? 'કોઈ બિલ મળ્યું નથી' : 'No invoices found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm
              ? lang === 'gu'
                ? 'સર્ચ ફિલ્ટર બદલીને ફરી તપાસો'
                : 'Try clearing your search query or filter'
              : lang === 'gu'
              ? 'નવું બિલ બનાવવા માટે ઉપર આપેલ બટન પર ક્લિક કરો'
              : 'Click "+ Create Invoice" to generate a bill for customer repairs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((inv, index) => {
            const isGovindji = inv.customerName.toLowerCase().includes('govindji');
            const statusBadgeClasses = {
              Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              Partial: 'bg-amber-50 text-amber-700 border-amber-200',
              Unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
            }[inv.paymentStatus];

            return (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 space-y-4 relative overflow-hidden"
              >
                {/* Special Govindji Prompt Badge */}
                {isGovindji && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{lang === 'gu' ? 'તમારો ઓરિજિનલ જોબ (4 HP + 3 Motor)' : 'Original Requested Job'}</span>
                  </div>
                )}

                {/* Top Row: Meta, Customer, Status */}
                <div className="flex flex-wrap items-start justify-between gap-3 pt-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded-lg border border-slate-200">
                        Sr. {index + 1}
                      </span>
                      <span className="font-mono font-bold text-base text-slate-900">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClasses}`}
                      >
                        {inv.paymentStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(inv.date)}</span>
                      </span>
                      <span>•</span>
                      <span>
                        {lang === 'gu' ? 'કુલ મશીન:' : 'Units:'}{' '}
                        <strong>{inv.units.length} Units</strong>
                      </span>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="sm:text-right">
                    <div className="text-base font-extrabold text-slate-900">
                      {inv.customerName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {inv.customerPhone && <span>{inv.customerPhone}</span>}
                      {inv.customerCity && <span> • {inv.customerCity}</span>}
                    </div>
                  </div>
                </div>

                {/* Repaired Units Pills / Tag Codes Display */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>
                      {lang === 'gu' ? 'યુનિટ્સ અને ટ્રેકિંગ કોડ્સ:' : 'Repaired Units & Service Codes:'}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      {inv.units.length} {lang === 'gu' ? 'મશીન બંડલ' : 'Items'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {inv.units.map((unit) => (
                      <div
                        key={unit.id}
                        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs shadow-2xs"
                      >
                        <span className="font-semibold text-slate-800">{unit.unitName}</span>
                        <span className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                          {unit.trackingCode}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-600">
                          ₹{unit.unitSubtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Breakdown, Grand Total, and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  {/* Cost breakdown */}
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {lang === 'gu' ? 'સ્પેરપાર્ટ્સ' : 'Parts'}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(inv.partsTotal)}
                      </span>
                      {/* Exact niche small font ma same bill ma vaparayela parts ni purchase cost no total */}
                      {(() => {
                        const purchaseCost = getInvoicePartsPurchaseCost(inv);
                        return (
                          <span
                            className="block text-[10px] text-slate-500 font-mono font-medium leading-tight mt-0.5 whitespace-nowrap"
                            title={lang === 'gu' ? 'આ બિલમાં વપરાયેલ પાર્ટ્સની કુલ ખરીદ પડતર' : 'Total purchase cost of parts in this bill'}
                          >
                            {lang === 'gu' ? 'ખરીદ: ' : 'Cost: '}
                            <strong className="text-indigo-600 font-semibold">{formatCurrency(purchaseCost)}</strong>
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-slate-300">|</div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {lang === 'gu' ? 'સર્વિસ ચાર્જ' : 'Labor'}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatCurrency(inv.servicesTotal)}
                      </span>
                    </div>
                    <div className="text-slate-300">|</div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        {lang === 'gu' ? 'કુલ બિલ' : 'Grand Total'}
                      </span>
                      <span className="font-mono font-extrabold text-sm text-indigo-700">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Pay button if balance due */}
                    {inv.balanceDue > 0 && onOpenPayment && (
                      <button
                        onClick={() => onOpenPayment(inv)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-102"
                        title="Receive payment for this invoice"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{lang === 'gu' ? 'પેમેન્ટ લો' : 'Pay'}</span>
                      </button>
                    )}

                    {/* Print Stickers */}
                    <button
                      onClick={() => onPrintStickers(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-xl transition-all"
                      title="Print barcode labels for these units"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{lang === 'gu' ? 'સ્ટીકર્સ' : 'Stickers'}</span>
                    </button>

                    {/* View Bill */}
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'gu' ? 'ઇનવોઇસ જુઓ' : 'View Bill'}</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setInvoiceToDelete(inv)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IN-UI INVOICE DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!invoiceToDelete}
        title={lang === 'gu' ? 'બિલ ડિલીટ કરો' : 'Delete Invoice'}
        message={
          lang === 'gu'
            ? `શું તમે ખરેખર બિલ #${invoiceToDelete?.invoiceNumber} (${invoiceToDelete?.customerName}) ડિલીટ કરવા માંગો છો?`
            : `Are you sure you want to delete invoice #${invoiceToDelete?.invoiceNumber}?`
        }
        itemDetails={
          invoiceToDelete
            ? `${invoiceToDelete.customerName} • Grand Total: ${formatCurrency(invoiceToDelete.grandTotal)} • ${invoiceToDelete.units.length} Machine Units`
            : undefined
        }
        confirmButtonText={lang === 'gu' ? 'હા, બિલ ડિલીટ કરો' : 'Yes, Delete Bill'}
        cancelButtonText={lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        onConfirm={() => {
          if (invoiceToDelete) {
            onDeleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }
        }}
        onClose={() => setInvoiceToDelete(null)}
        lang={lang}
      />
    </div>
  );
};
