import React from 'react';
import { Invoice, WorkshopSettings } from '../types';
import { formatCurrency, formatDate, numberToWordsIndian } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { Wrench, Package, Tag } from 'lucide-react';

interface DetailedPartsViewA4Props {
  invoice: Invoice;
  settings: WorkshopSettings;
  lang: 'gu' | 'en';
}

export const DetailedPartsViewA4: React.FC<DetailedPartsViewA4Props> = ({
  invoice,
  settings,
  lang,
}) => {
  const logoSrc = settings.logoUrl || '/logo.jpg';

  return (
    <div
      id="invoice-detailed-a4"
      className="invoice-card-a4 relative bg-white border border-slate-300 shadow-md print:shadow-none print:border-none mx-auto rounded-2xl overflow-hidden text-slate-900 transition-all max-w-4xl"
      style={{
        width: '100%',
        minHeight: '1080px',
      }}
    >
      {/* Background Large Logo Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="text-center opacity-[0.07] print:opacity-[0.09] transform scale-125">
          <img
            src={logoSrc}
            alt=""
            className="w-96 h-96 sm:w-[480px] sm:h-[480px] object-contain mx-auto grayscale"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full min-h-[1080px]">
        <div>
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              {/* Brand & Workshop Details */}
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  <img
                    src={logoSrc}
                    alt={settings.workshopName}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase whitespace-nowrap">
                    {settings.workshopName}
                  </h1>
                  <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {settings.workshopNameGu}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                    {settings.address}, {settings.city}
                  </p>
                  <div className="text-xs font-mono text-slate-700 mt-1 flex flex-wrap gap-x-4">
                    <span>Phone: <strong>{settings.phone}</strong></span>
                    {settings.altPhone && <span>Alt: {settings.altPhone}</span>}
                    {settings.gstin && <span>GSTIN: <strong>{settings.gstin}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 w-full sm:w-auto">
                <span className="inline-block bg-slate-900 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded">
                  SUMMARISED PARTS INVOICE (A4)
                </span>
                <div className="mt-2 text-base font-bold font-mono text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Date: <strong>{formatDate(invoice.date)}</strong>
                </div>
                <div className="mt-2 flex sm:justify-end">
                  <BarcodeRenderer code={invoice.invoiceNumber} height={24} showText={false} />
                </div>
              </div>
            </div>

            {/* Billed To / Customer Box */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Billed To (ગ્રાહકની વિગત):
                </span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {invoice.customerName}
                </div>
                {invoice.customerPhone && (
                  <div className="text-slate-600">
                    Contact: <strong>{invoice.customerPhone}</strong>
                  </div>
                )}
                {invoice.customerCity && (
                  <div className="text-slate-500">
                    Location: {invoice.customerCity}
                  </div>
                )}
              </div>

              <div className="sm:text-right flex flex-col justify-center">
                <div className="text-slate-700">
                  Total Repaired Units: <strong>{invoice.units.length} Units</strong>
                </div>
                <div className="text-slate-600 mt-0.5">
                  Payment Status:{' '}
                  <strong
                    className={
                      invoice.paymentStatus === 'Paid'
                        ? 'text-emerald-700'
                        : invoice.paymentStatus === 'Partial'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }
                  >
                    {invoice.paymentStatus}
                  </strong>{' '}
                  via {invoice.paymentMode || 'Cash'}
                </div>
                {invoice.remarks && (
                  <div className="text-slate-500 italic mt-1">
                    Note: {invoice.remarks}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Repaired Units & Replacement Parts List */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <span>
                  {lang === 'gu'
                    ? 'યુનિટ-વાઇઝ વિગત અને સ્પેરપાર્ટ્સની સંપૂર્ણ માહિતી'
                    : 'Unit-by-Unit Diagnostic, Replaced Parts & Labor Details'}
                </span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {invoice.units.length} Units
              </span>
            </div>

            {invoice.units.map((unit, index) => (
              <div
                key={unit.id}
                className="border border-slate-300 rounded-xl overflow-hidden bg-white/95 shadow-xs"
              >
                {/* Unit Header */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {unit.unitName}
                    </span>
                    {unit.brandModel && (
                      <span className="text-xs text-slate-500">
                        ({unit.brandModel})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                      🏷️ {unit.trackingCode}
                    </span>
                    <div className="hidden sm:block">
                      <BarcodeRenderer code={unit.trackingCode} height={20} showText={false} />
                    </div>
                  </div>
                </div>

                {/* Problem & Diagnosis notes if any */}
                {(unit.reportedIssue || unit.technicianNotes) && (
                  <div className="px-4 py-1.5 bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-600 flex flex-wrap gap-x-4">
                    {unit.reportedIssue && (
                      <span>
                        <strong className="text-slate-700">Reported:</strong> {unit.reportedIssue}
                      </span>
                    )}
                    {unit.technicianNotes && (
                      <span>
                        <strong className="text-slate-700">Diagnosis/Action:</strong>{' '}
                        {unit.technicianNotes}
                      </span>
                    )}
                  </div>
                )}

                {/* Parts & Services Table */}
                <div className="p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="pb-1.5 pl-2 w-10 text-center">Sr.</th>
                        <th className="pb-1.5 pl-2">Item Description / પાર્ટ્સ & સર્વિસ વિગત</th>
                        <th className="pb-1.5 text-center w-28">Type</th>
                        <th className="pb-1.5 text-center w-28">Part Code</th>
                        <th className="pb-1.5 pr-3 text-center w-20">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unit.parts.map((p, pIdx) => (
                        <tr key={p.id} className="text-slate-800">
                          <td className="py-2 pl-2 text-center font-mono font-bold text-slate-400">
                            {pIdx + 1}
                          </td>
                          <td className="py-2 pl-2 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-medium text-slate-900">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2 text-center">
                            <span className="text-[9px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                              Spare Part
                            </span>
                          </td>
                          <td className="py-2 text-center font-mono text-[10px] text-slate-500">
                            {p.code || '-'}
                          </td>
                          <td className="py-2 pr-3 text-center font-mono font-bold text-slate-700">
                            {p.quantity}
                          </td>
                        </tr>
                      ))}

                      {unit.services.map((s, sIdx) => (
                        <tr key={s.id} className="text-slate-800">
                          <td className="py-2 pl-2 text-center font-mono font-bold text-slate-400">
                            {unit.parts.length + sIdx + 1}
                          </td>
                          <td className="py-2 pl-2 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="font-medium text-slate-900">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-2 text-center">
                            <span className="text-[9px] bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                              Service Labor
                            </span>
                          </td>
                          <td className="py-2 text-center font-mono text-[10px] text-slate-500">
                            SRV
                          </td>
                          <td className="py-2 pr-3 text-center font-mono font-bold text-slate-700">
                            1
                          </td>
                        </tr>
                      ))}

                      {unit.parts.length === 0 && unit.services.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-3 text-center text-slate-400 italic">
                            No parts or service charges recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                        <td colSpan={5} className="py-2.5 px-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {unit.unitName} Total ({lang === 'gu' ? 'યુનિટ વાઇઝ કુલ ખર્ચ' : 'Unit Total Cost'}):
                            </span>
                            <span className="font-mono text-sm sm:text-base text-indigo-700 font-black whitespace-nowrap">
                              {formatCurrency(unit.unitSubtotal)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Grand Totals / Signatures */}
        <div className="mt-auto pt-4 border-t-2 border-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Terms & Conditions / શરતો:
              </div>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                {settings.terms
                  .filter((t) => !t.toLowerCase().includes('warranty') && !t.toLowerCase().includes('guarantee'))
                  .map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
              </ul>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2 mt-2">
                <Tag className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Unit Tracking Stickers:</strong> Unique sticker labels are affixed to each repaired handpiece/motor for service tracking and customer records.
                </div>
              </div>
            </div>

            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-700 font-semibold">
                <span>Subtotal / કુલ રકમ:</span>
                <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Discount / વટાવ:</span>
                  <span className="font-mono">- {formatCurrency(invoice.discount)}</span>
                </div>
              )}

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax ({invoice.taxPercent}%):</span>
                  <span className="font-mono font-medium">+ {formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-300 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-indigo-700">
                  {formatCurrency(invoice.grandTotal)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 font-medium italic border-b border-slate-200 pb-2">
                In words: {numberToWordsIndian(invoice.grandTotal)}
              </div>

              <div className="pt-1 flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Paid Amount ({invoice.paymentMode || 'Cash'}):</span>
                <span className="font-mono text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-700">Balance Due:</span>
                <span className={`font-mono text-sm ${invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrency(invoice.balanceDue)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-dashed border-slate-300 flex justify-between items-end text-xs text-slate-600">
            <div className="text-center">
              <div className="border-b border-slate-400 w-36 mb-1"></div>
              <span>Customer Signature</span>
            </div>
            <div className="text-center">
              <div className="font-bold text-slate-800 uppercase">{settings.workshopName}</div>
              <div className="border-b border-slate-400 w-44 mt-5 mb-1"></div>
              <span>Authorized Technician / Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
