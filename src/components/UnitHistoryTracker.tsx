import React, { useState } from 'react';
import { Invoice, RepairedUnit, WorkshopSettings } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { UnitStickersModal } from './UnitStickersModal';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Package,
  Calendar,
  User,
  Tag,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface UnitHistoryTrackerProps {
  invoices: Invoice[];
  settings: WorkshopSettings;
  onOpenInvoice: (invoice: Invoice) => void;
  lang: 'gu' | 'en';
}

export const UnitHistoryTracker: React.FC<UnitHistoryTrackerProps> = ({
  invoices,
  settings,
  onOpenInvoice,
  lang,
}) => {
  const [searchCode, setSearchCode] = useState('HP-260825-01');
  const [selectedUnitSticker, setSelectedUnitSticker] = useState<{
    unit: RepairedUnit;
    invoice: Invoice;
  } | null>(null);

  // Search logic
  const normalizedQuery = searchCode.trim().toLowerCase();

  // Find all matches across all invoices
  interface MatchResult {
    unit: RepairedUnit;
    invoice: Invoice;
    isWarrantyValid: boolean;
    daysSinceRepair: number;
  }

  const results: MatchResult[] = [];

  if (normalizedQuery) {
    invoices.forEach((inv) => {
      inv.units.forEach((unit) => {
        const matchesCode =
          unit.trackingCode.toLowerCase().includes(normalizedQuery) ||
          unit.unitName.toLowerCase().includes(normalizedQuery) ||
          (unit.brandModel && unit.brandModel.toLowerCase().includes(normalizedQuery)) ||
          (unit.serialNumber && unit.serialNumber.toLowerCase().includes(normalizedQuery));

        if (matchesCode) {
          const repairDate = new Date(inv.date);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - repairDate.getTime()) / (1000 * 60 * 60 * 24));
          const isWarrantyValid = diffDays <= unit.warrantyDays;

          results.push({
            unit,
            invoice: inv,
            isWarrantyValid,
            daysSinceRepair: diffDays,
          });
        }
      });
    });
  }

  // Quick chips for demo
  const sampleCodes = ['HP-260825-01', 'HP-260825-03', 'MOT-260825-01', 'MOT-260825-02'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <span>
              {lang === 'gu'
                ? 'યુનિટ પરફોર્મન્સ & સર્વિસ હિસ્ટ્રી ટ્રેકર'
                : 'Unit Performance & Repair History Tracker'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'gu'
              ? 'હેન્ડપીસ અથવા મોટર પર લગાડેલા સ્ટીકરનો કોડ નાખીને મશીનનો જૂનો રીપેરિંગ રેકોર્ડ અને વોરંટી ચેક કરો.'
              : 'Search by unique tracking code pasted on any machine to check previous replaced parts, diagnosis & warranty.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. HP-260825-01 or MOT-260825-01"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          <button
            onClick={() => setSearchCode(searchCode.trim())}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all shrink-0"
          >
            {lang === 'gu' ? 'રેકોર્ડ શોધો' : 'Lookup Unit'}
          </button>
        </div>

        {/* Quick Sample Code Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 font-medium">
            {lang === 'gu' ? 'દાખલા તરીકે કોડ પસંદ કરો:' : 'Try sample unit codes:'}
          </span>
          {sampleCodes.map((c) => (
            <button
              key={c}
              onClick={() => setSearchCode(c)}
              className="font-mono text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors font-semibold"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {results.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {lang === 'gu' ? 'કોઈ યુનિટ રેકોર્ડ મળ્યો નથી' : 'No repair history found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === 'gu'
              ? 'કૃપા કરીને મશીન પર લગાડેલ સાચો યુનિટ કોડ દાખલ કરો (દા.ત. HP-260825-01).'
              : 'Please verify the unit tracking code from the physical sticker on the machine.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {results.length} {lang === 'gu' ? 'યુનિટ રેકોર્ડ મળ્યો' : 'Unit record(s) found'}
          </div>

          {results.map(({ unit, invoice, isWarrantyValid, daysSinceRepair }) => (
            <div
              key={unit.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
            >
              {/* Top Banner */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-lg border border-indigo-100">
                    {unit.unitType === 'Handpiece' ? 'HP' : 'MOT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {unit.unitName}
                      </h2>
                      <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded">
                        🏷️ {unit.trackingCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Model: <strong>{unit.brandModel || 'Standard'}</strong></span>
                      <span>•</span>
                      <span>Type: {unit.unitType}</span>
                    </div>
                  </div>
                </div>

                {/* Warranty Badge */}
                <div className="flex items-center gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                      isWarrantyValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {isWarrantyValid ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'gu' ? 'વોરંટી ચાલુ છે' : 'Warranty Active'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                        <span>{lang === 'gu' ? 'વોરંટી પૂર્ણ' : 'Warranty Expired'}</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedUnitSticker({ unit, invoice })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{lang === 'gu' ? 'સ્ટીકર જુઓ' : 'View Sticker'}</span>
                  </button>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Scannable Code / બારકોડ:
                  </span>
                  <BarcodeRenderer code={unit.trackingCode} height={28} showText={true} />
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    Owner / Customer: <strong>{invoice.customerName}</strong>
                  </div>
                  <div>
                    Last Serviced Date: <strong>{formatDate(invoice.date)}</strong>
                  </div>
                </div>
              </div>

              {/* Problem Reported & Work Done Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                  <span className="font-bold text-amber-900 block mb-1">
                    {lang === 'gu' ? 'મશીનમાં આવેલી ખામી (Reported Issue):' : 'Problem Reported:'}
                  </span>
                  <p className="text-amber-800">
                    {unit.reportedIssue || 'Standard routine service & overhaul'}
                  </p>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80">
                  <span className="font-bold text-blue-900 block mb-1">
                    {lang === 'gu' ? 'કરેલું કામ અને ટેસ્ટિંગ (Work Done / Notes):' : 'Technician Notes & Test Results:'}
                  </span>
                  <p className="text-blue-800">
                    {unit.technicianNotes || 'Replaced parts and performed dynamic balance & run check.'}
                  </p>
                </div>
              </div>

              {/* Replaced Parts & Services History Table */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                  <span>{lang === 'gu' ? 'નાખેલા સ્પેરપાર્ટ્સ અને સર્વિસ હિસ્ટ્રી:' : 'Parts Replaced & Services Applied:'}</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    Unit Total: {formatCurrency(unit.unitSubtotal)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 pl-3 w-10 text-center">Sr.</th>
                        <th className="py-2">Item / Service</th>
                        <th className="py-2 text-center">Type</th>
                        <th className="py-2 text-center">Part Code</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right pr-3">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unit.parts.map((p, pIdx) => (
                        <tr key={p.id}>
                          <td className="py-2 pl-3 text-center font-mono font-bold text-slate-400">
                            {pIdx + 1}
                          </td>
                          <td className="py-2 font-medium text-slate-800 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                            <span>{p.name}</span>
                          </td>
                          <td className="py-2 text-center">
                            <span className="text-[9px] bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                              Part
                            </span>
                          </td>
                          <td className="py-2 text-center font-mono text-slate-500 text-[10px]">
                            {p.code || '-'}
                          </td>
                          <td className="py-2 text-right font-mono">{p.quantity}</td>
                          <td className="py-2 text-right pr-3 font-mono font-bold">
                            {formatCurrency(p.totalPrice)}
                          </td>
                        </tr>
                      ))}

                      {unit.services.map((s, sIdx) => (
                        <tr key={s.id}>
                          <td className="py-2 pl-3 text-center font-mono font-bold text-slate-400">
                            {unit.parts.length + sIdx + 1}
                          </td>
                          <td className="py-2 font-medium text-slate-800 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{s.name}</span>
                          </td>
                          <td className="py-2 text-center">
                            <span className="text-[9px] bg-indigo-50 text-indigo-800 font-semibold px-1.5 py-0.5 rounded">
                              Labor
                            </span>
                          </td>
                          <td className="py-2 text-center font-mono text-slate-500 text-[10px]">
                            SRV
                          </td>
                          <td className="py-2 text-right font-mono">1</td>
                          <td className="py-2 text-right pr-3 font-mono font-bold">
                            {formatCurrency(s.charge)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom: Associated Invoice Link */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  Billed in Invoice: <strong>{invoice.invoiceNumber}</strong> ({formatDate(invoice.date)})
                </div>
                <button
                  onClick={() => onOpenInvoice(invoice)}
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                >
                  <span>{lang === 'gu' ? 'ઓરિજિનલ બિલ જુઓ' : 'View Full Original Invoice'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stickers Modal */}
      {selectedUnitSticker && (
        <UnitStickersModal
          units={[selectedUnitSticker.unit]}
          invoiceNumber={selectedUnitSticker.invoice.invoiceNumber}
          customerName={selectedUnitSticker.invoice.customerName}
          date={selectedUnitSticker.invoice.date}
          settings={settings}
          isOpen={true}
          onClose={() => setSelectedUnitSticker(null)}
          lang={lang}
        />
      )}
    </div>
  );
};
