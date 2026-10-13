import React from 'react';
import { Invoice, WorkshopSettings } from '../types';
import { formatCurrency, formatDate, numberToWordsIndian, groupInvoiceUnitsByCategory } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface CustomerViewA5Props {
  invoice: Invoice;
  settings: WorkshopSettings;
  lang: 'gu' | 'en';
}

export const CustomerViewA5: React.FC<CustomerViewA5Props> = ({
  invoice,
  settings,
  lang,
}) => {
  const categoryGroups = groupInvoiceUnitsByCategory(invoice);

  return (
    <div
      id="invoice-customer-a5"
      className="invoice-card-a5 relative bg-white border border-slate-300 shadow-md print:shadow-none print:border-none mx-auto rounded-xl overflow-hidden text-slate-900 transition-all"
      style={{
        width: '100%',
        maxWidth: '595px', // Exact A5 proportional width on screen
        minHeight: '840px', // Exact A5 height
      }}
    >
      {/* Content wrapper with relative z-10 */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between h-full min-h-[840px]">
        <div>
          {/* Header Bar */}
          <div className="border-b-2 border-slate-900 pb-3 mb-3">
            <div className="flex items-start justify-between gap-3">
              {/* Workshop Details with Official Logo */}
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={settings.logoUrl || '/logo.jpg'}
                  alt="Precision Logo"
                  className="w-12 h-12 object-contain rounded-lg border border-slate-200 p-0.5 shrink-0 bg-white shadow-2xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-tight whitespace-nowrap">
                    {settings.workshopName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {settings.workshopNameGu}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {settings.address}, {settings.city}
                  </p>
                  <div className="text-[11px] font-mono text-slate-700 mt-1 flex flex-wrap gap-x-3">
                    <span>Ph: <strong>{settings.phone}</strong></span>
                    {settings.gstin && <span>GSTIN: <strong>{settings.gstin}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Invoice Number & Date (TAX INVOICE A5 removed) */}
              <div className="text-right shrink-0">
                <div className="font-mono font-black text-base text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Date: <strong>{formatDate(invoice.date)}</strong>
                </div>
                <div className="mt-1 flex justify-end">
                  <BarcodeRenderer code={invoice.invoiceNumber} height={20} showText={false} />
                </div>
              </div>
            </div>

            {/* Customer Box (PAID/UNPAID status removed) */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 bg-slate-50/80 px-3 py-2 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Billed To / ગ્રાહક:
                </span>
                <span className="text-sm font-black text-slate-900">
                  {invoice.customerName}
                </span>
                {invoice.customerPhone && (
                  <span className="text-slate-600 ml-2 font-medium">
                    (Ph: {invoice.customerPhone})
                  </span>
                )}
                {invoice.customerCity && (
                  <span className="text-slate-500 block text-[11px]">
                    {invoice.customerCity}
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-slate-700">
                  Total Units: <span className="font-mono text-slate-900 font-black">{invoice.units.length} Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer View: Category-Wise Units Summary Table ('Customer View Default' text removed) */}
          <div className="my-3">
            <div className="mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                {lang === 'gu'
                  ? 'રીપેર સર્વિસ અને મશીન યુનિટ્સ વિગત'
                  : 'Repair Service & Equipment Summary'}
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-2 px-3 w-10 text-center">Sr.</th>
                    <th className="py-2 px-3">
                      {lang === 'gu' ? 'મશીન પ્રકાર / કેટેગરી' : 'Item Category & Service'}
                    </th>
                    <th className="py-2 px-3 text-center">
                      {lang === 'gu' ? 'કુલ યુનિટ' : 'Qty'}
                    </th>
                    <th className="py-2 px-3 text-right">
                      {lang === 'gu' ? 'કુલ રકમ (Amount)' : 'Total Amount'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white/95">
                  {categoryGroups.map((group, index) => (
                    <tr key={group.categoryKey} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{group.count} - {group.categoryTitle}</span>
                        </div>
                        {/* List of tracking codes */}
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs">
                          Tags: {group.units.map((u) => u.trackingCode).join(', ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {group.count} {group.count > 1 ? 'Units' : 'Unit'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm text-slate-900">
                        {formatCurrency(group.totalAmount)}
                      </td>
                    </tr>
                  ))}

                  {/* Fallback if no groups */}
                  {categoryGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                        No repaired units added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Note on unit tracking tags */}
            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
              <span>* Each repaired unit is tagged with unique barcode sticker for verification.</span>
              <span className="font-medium text-slate-600">Total: {invoice.units.length} Units</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Totals, In Words, Signatures */}
        <div className="mt-auto pt-3 border-t-2 border-slate-900">
          <div className="grid grid-cols-12 gap-3 items-start">
            {/* Left Column: Terms & Amount in Words */}
            <div className="col-span-7 space-y-2">
              <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">
                  Amount in Words:
                </span>
                <span className="text-[11px] font-bold text-slate-800 italic leading-tight block">
                  {numberToWordsIndian(invoice.grandTotal)}
                </span>
              </div>

              <div className="text-[10px] text-slate-600 space-y-0.5">
                <span className="font-bold text-slate-700 block">
                  {lang === 'gu' ? 'શરતો અને નોંધ:' : 'Terms & Notes:'}
                </span>
                {settings.terms && settings.terms.length > 0 ? (
                  settings.terms.map((t, idx) => (
                    <p key={idx} className="leading-tight">{idx + 1}. {t}</p>
                  ))
                ) : (
                  <>
                    <p>1. Please inspect machine working at delivery.</p>
                    <p>2. Keep tracking sticker intact on unit for service record.</p>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Grand Total Calculations */}
            <div className="col-span-5 bg-slate-50/90 p-2.5 rounded-lg border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium text-[11px]">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatCurrency(invoice.discount)}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>GST ({invoice.taxPercent}%):</span>
                  <span className="font-mono">+ {formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-1 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-indigo-700">
                  {formatCurrency(invoice.grandTotal)}
                </span>
              </div>

              <div className="pt-1 border-t border-slate-200 flex justify-between text-[11px]">
                <span className="text-slate-600">Paid:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>

              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-700">Balance:</span>
                <span
                  className={`font-mono ${
                    invoice.balanceDue > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'
                  }`}
                >
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-300 flex justify-between items-end text-[11px] text-slate-600">
            <div className="text-center">
              <div className="border-b border-slate-400 w-28 mb-1"></div>
              <span>Customer Sign</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800 text-[10px] uppercase">
                {settings.workshopName}
              </div>
              <div className="border-b border-slate-400 w-36 mt-4 mb-1"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
