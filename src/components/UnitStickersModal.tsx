import React, { useState, useRef } from 'react';
import { RepairedUnit, WorkshopSettings } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatDate } from '../utils/formatters';
import {
  Printer,
  X,
  Tag,
  Check,
  Sparkles,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  Sliders,
  Maximize2,
} from 'lucide-react';

export interface StickerFormat {
  id: string;
  name: string;
  stationeryBrand: string; // e.g. "Desmat / Oddy 24-L"
  columns: number;
  rows: number;
  perSheet: number;
  labelWidthMm: number;
  labelHeightMm: number;
  isRoll?: boolean;
  tagSizeDescription: string;
}

export const INDIAN_STICKER_FORMATS: StickerFormat[] = [
  {
    id: 'oddy-24',
    name: '24 Labels / Sheet (70 × 37 mm)',
    stationeryBrand: 'Desmat / Oddy 24-Up (3 × 8)',
    columns: 3,
    rows: 8,
    perSheet: 24,
    labelWidthMm: 70,
    labelHeightMm: 37,
    tagSizeDescription: 'Most Popular Indian Stationery Standard for Tools & Equipment',
  },
  {
    id: 'oddy-40',
    name: '40 Labels / Sheet (48.5 × 25.4 mm)',
    stationeryBrand: 'Desmat / Oddy 40-Up (4 × 10)',
    columns: 4,
    rows: 10,
    perSheet: 40,
    labelWidthMm: 48.5,
    labelHeightMm: 25.4,
    tagSizeDescription: 'Compact size - Ideal for Dental Handpieces, Burrs & Micro-tools',
  },
  {
    id: 'oddy-12',
    name: '12 Labels / Sheet (105 × 48 mm)',
    stationeryBrand: 'Desmat / Oddy 12-Up (2 × 6)',
    columns: 2,
    rows: 6,
    perSheet: 12,
    labelWidthMm: 105,
    labelHeightMm: 48,
    tagSizeDescription: 'Spacious Tag - Full Logo, Barcode, Details & Parts Summary',
  },
  {
    id: 'oddy-16',
    name: '16 Labels / Sheet (105 × 37 mm)',
    stationeryBrand: 'Desmat / Oddy 16-Up (2 × 8)',
    columns: 2,
    rows: 8,
    perSheet: 16,
    labelWidthMm: 105,
    labelHeightMm: 37,
    tagSizeDescription: 'Wide Tag for Micromotor Controller & Box identification',
  },
  {
    id: 'oddy-8',
    name: '8 Labels / Sheet (105 × 74 mm - A7)',
    stationeryBrand: 'Desmat / Oddy 8-Up (2 × 4)',
    columns: 2,
    rows: 4,
    perSheet: 8,
    labelWidthMm: 105,
    labelHeightMm: 74,
    tagSizeDescription: 'Large Service Job Card Sticker with complete workshop info',
  },
  {
    id: 'oddy-65',
    name: '65 Labels / Sheet (38.1 × 21.2 mm)',
    stationeryBrand: 'Desmat / Oddy 65-Up (5 × 13)',
    columns: 5,
    rows: 13,
    perSheet: 65,
    labelWidthMm: 38.1,
    labelHeightMm: 21.2,
    tagSizeDescription: 'Mini Micro-Barcode Sticker for slim handpiece shafts',
  },
  {
    id: 'thermal-50x25',
    name: 'Thermal Roll (50 × 25 mm / 2" × 1")',
    stationeryBrand: 'TVS / TSC / Zebra Roll',
    columns: 1,
    rows: 1,
    perSheet: 1,
    labelWidthMm: 50,
    labelHeightMm: 25,
    isRoll: true,
    tagSizeDescription: 'Standard 2"x1" Barcode Sticker Roll for Thermal Label Printers',
  },
  {
    id: 'thermal-50x38',
    name: 'Thermal Roll (50 × 38 mm / 2" × 1.5")',
    stationeryBrand: 'TVS / TSC / Zebra Roll',
    columns: 1,
    rows: 1,
    perSheet: 1,
    labelWidthMm: 50,
    labelHeightMm: 38,
    isRoll: true,
    tagSizeDescription: 'Medium Thermal Tag for Handpieces with customer name',
  },
  {
    id: 'thermal-75x50',
    name: 'Thermal Roll (75 × 50 mm / 3" × 2")',
    stationeryBrand: 'TVS / TSC / Zebra Roll',
    columns: 1,
    rows: 1,
    perSheet: 1,
    labelWidthMm: 75,
    labelHeightMm: 50,
    isRoll: true,
    tagSizeDescription: 'Large 3"x2" Thermal Service Label with full specifications',
  },
];

interface UnitStickersModalProps {
  units: RepairedUnit[];
  invoiceNumber: string;
  customerName: string;
  date: string;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
  lang: 'gu' | 'en';
}

export const UnitStickersModal: React.FC<UnitStickersModalProps> = ({
  units,
  invoiceNumber,
  customerName,
  date,
  settings,
  isOpen,
  onClose,
  lang,
}) => {
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(units.map((u) => u.id));
  const [selectedFormatId, setSelectedFormatId] = useState<string>('oddy-24');
  const [copiesPerUnit, setCopiesPerUnit] = useState<number>(1);
  const [skipBlankCount, setSkipBlankCount] = useState<number>(0);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showPartsSummary, setShowPartsSummary] = useState<boolean>(true);
  const [previewTab, setPreviewTab] = useState<'grid' | 'sheet'>('sheet');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSelectedUnitIds(units.map((u) => u.id));
  }, [units]);

  if (!isOpen) return null;

  const currentFormat =
    INDIAN_STICKER_FORMATS.find((f) => f.id === selectedFormatId) || INDIAN_STICKER_FORMATS[0];

  const toggleSelect = (id: string) => {
    if (selectedUnitIds.includes(id)) {
      if (selectedUnitIds.length > 1) {
        setSelectedUnitIds(selectedUnitIds.filter((uId) => uId !== id));
      }
    } else {
      setSelectedUnitIds([...selectedUnitIds, id]);
    }
  };

  const selectedUnits = units.filter((u) => selectedUnitIds.includes(u.id));

  // Build the list of labels to render:
  // 1. skipBlankCount of empty placeholders (so users can reuse partly used Indian stationery sheets)
  // 2. copiesPerUnit for each selected unit
  const finalLabels: (RepairedUnit | null)[] = [];
  for (let i = 0; i < skipBlankCount; i++) {
    finalLabels.push(null);
  }
  selectedUnits.forEach((unit) => {
    for (let c = 0; c < copiesPerUnit; c++) {
      finalLabels.push(unit);
    }
  });

  const totalSheetsNeeded = currentFormat.isRoll
    ? finalLabels.filter(Boolean).length
    : Math.ceil(finalLabels.length / currentFormat.perSheet);

  const handlePrint = () => {
    // Inject print styling for stickers
    const styleId = 'dynamic-stickers-print-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    if (currentFormat.isRoll) {
      styleTag.innerHTML = `
        @media print {
          @page {
            size: ${currentFormat.labelWidthMm}mm ${currentFormat.labelHeightMm}mm;
            margin: 1mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .sticker-print-container {
            display: block !important;
          }
          .sticker-item-cell {
            page-break-after: always !important;
            break-after: page !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
      `;
    } else {
      styleTag.innerHTML = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm 4mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          .sticker-sheet-page {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `;
    }

    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Render a single sticker label adapted to the chosen stationery format dimensions
  const renderStickerItem = (unit: RepairedUnit | null, index: number) => {
    if (!unit) {
      // Blank label (already peeled off)
      return (
        <div
          key={`blank-${index}`}
          className="border border-dashed border-slate-300 bg-slate-50/50 rounded flex items-center justify-center text-[10px] text-slate-400 select-none print:opacity-0"
          style={{ minHeight: `${Math.max(24, currentFormat.labelHeightMm * 2.8)}px` }}
        >
          <span>[Blank #{index + 1}]</span>
        </div>
      );
    }

    const partsSummary = unit.parts.length
      ? unit.parts.map((p) => (p.quantity > 1 ? `${p.name} x${p.quantity}` : p.name)).join(', ')
      : 'Service / Overhaul';

    const isCompact = currentFormat.id === 'oddy-40' || currentFormat.id === 'oddy-65' || currentFormat.id === 'thermal-50x25';
    const isMini = currentFormat.id === 'oddy-65';
    const isLarge = currentFormat.id === 'oddy-8' || currentFormat.id === 'oddy-12' || currentFormat.id === 'thermal-75x50';

    return (
      <div
        key={`unit-${unit.id}-${index}`}
        className="sticker-item-cell bg-white border border-slate-700/80 rounded-md p-1.5 sm:p-2 flex flex-col justify-between text-slate-900 overflow-hidden relative shadow-2xs print:shadow-none print:border-slate-800"
        style={{
          boxSizing: 'border-box',
          minHeight: `${Math.max(26, currentFormat.labelHeightMm * 2.8)}px`,
        }}
      >
        {/* Header: Workshop Name & Tracking Code */}
        <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src={settings.logoUrl || '/logo.jpg'}
              alt="Logo"
              className="w-3.5 h-3.5 object-contain rounded-xs shrink-0 bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <span className="font-black text-[10px] sm:text-[11px] truncate uppercase tracking-tight text-slate-900">
              {isMini ? 'PRS' : settings.workshopName}
            </span>
          </div>

          <span className="bg-slate-900 text-white font-mono font-black text-[10px] px-1.5 py-0.2 rounded shrink-0">
            {unit.trackingCode}
          </span>
        </div>

        {/* Middle: Unit Name & Details */}
        <div className="my-0.5 leading-tight">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] text-slate-900 truncate">
              {unit.unitName}
            </span>
            {unit.brandModel && (
              <span className="text-[9px] text-slate-500 truncate ml-1">
                {unit.brandModel}
              </span>
            )}
          </div>

          {/* Barcode graphic - made more compact/smaller */}
          {showBarcode && (
            <div className="flex justify-center my-0.5 bg-slate-50/70 rounded py-0.5 border border-slate-100/80 max-w-[90%] mx-auto">
              <BarcodeRenderer
                code={unit.trackingCode}
                height={isMini ? 10 : isCompact ? 12 : isLarge ? 17 : 14}
                scale={isMini ? 0.6 : isCompact ? 0.7 : isLarge ? 0.85 : 0.76}
                showText={false}
              />
            </div>
          )}
        </div>

        {/* Footer: Customer & Parts note */}
        <div className="border-t border-slate-200/90 pt-0.5 mt-auto flex items-center justify-between text-[9px] text-slate-600">
          <span className="truncate max-w-[120px] font-semibold text-slate-800">
            {customerName}
          </span>
          <span className="font-mono text-[8px] text-slate-400">
            {formatDate(date)}
          </span>
        </div>

        {/* Optional parts summary on medium/large stickers */}
        {showPartsSummary && !isCompact && !isMini && (
          <div className="text-[8px] text-slate-500 truncate font-medium mt-0.5 border-t border-dotted border-slate-200 pt-0.5">
            Parts: {partsSummary}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {lang === 'gu'
                    ? 'ઇન્ડિયન સ્ટેશનરી સ્ટીકર પ્રિન્ટ & પ્રીવ્યુ'
                    : 'Indian Stationery Sticker Formats & Print Preview'}
                </h2>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  All Indian Label Sizes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'gu'
                  ? 'હેન્ડપીસ અને મોટર પર લગાવવા માટેના બારકોડ લેબલ્સ (Desmat, Oddy & Thermal Rolls)'
                  : 'Pre-formatted for Oddy, Desmat, Avery A4 label sheets & TVS/TSC Thermal Rolls'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'gu' ? 'સ્ટીકર પ્રિન્ટ કરો' : 'Print Stickers'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stationery Format Selector & Settings Bar */}
        <div className="p-4 bg-slate-100/80 border-b border-slate-200 print:hidden space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Format Dropdown */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'gu' ? 'સ્ટીકર સાઇઝ / ફોર્મેટ (Indian Stationery Size)' : 'Select Sticker Size / Format'}</span>
              </label>
              <select
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-xs"
              >
                <optgroup label="A4 Sheet Formats (Desmat / Oddy / Avery)">
                  {INDIAN_STICKER_FORMATS.filter((f) => !f.isRoll).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.stationeryBrand}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Thermal Printer Rolls (TVS / TSC / Zebra)">
                  {INDIAN_STICKER_FORMATS.filter((f) => f.isRoll).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="text-[11px] text-slate-500 mt-1 italic">
                {currentFormat.tagSizeDescription}
              </div>
            </div>

            {/* Print Options: Copies & Skip Blank Labels */}
            <div className="md:col-span-3 flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {lang === 'gu' ? 'કોપી / યુનિટ' : 'Copies / Unit'}
                </label>
                <select
                  value={copiesPerUnit}
                  onChange={(e) => setCopiesPerUnit(parseInt(e.target.value) || 1)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value={1}>1 Copy</option>
                  <option value={2}>2 Copies (Unit + Box)</option>
                  <option value={3}>3 Copies</option>
                  <option value={4}>4 Copies</option>
                </select>
              </div>

              {!currentFormat.isRoll && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1" title="Skip already used labels on an Indian stationery sheet">
                    {lang === 'gu' ? 'ખાલી છોડો (Skip)' : 'Skip Blanks'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={currentFormat.perSheet - 1}
                    value={skipBlankCount}
                    onChange={(e) => setSkipBlankCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Elements Toggles */}
            <div className="md:col-span-3 flex flex-wrap gap-2 text-xs">
              <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-700">Barcode</span>
              </label>

              <label className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPartsSummary}
                  onChange={(e) => setShowPartsSummary(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-700">Parts Info</span>
              </label>
            </div>
          </div>

          {/* Unit selection pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {lang === 'gu' ? 'યુનિટ પસંદ કરો:' : 'Units:'}
            </span>
            {units.map((u, uIdx) => {
              const isSelected = selectedUnitIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleSelect(u.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">Sr. {uIdx + 1}</span>
                  <span>{u.unitName}</span>
                  <span className="font-mono text-[10px] text-slate-500">({u.trackingCode})</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedUnitIds(units.map((u) => u.id))}
              className="text-[11px] text-indigo-600 hover:underline font-bold ml-1"
            >
              {lang === 'gu' ? 'બધા પસંદ કરો' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Preview Control bar */}
        <div className="px-5 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'gu' ? 'લાઈવ શીટ પ્રિન્ટ પ્રીવ્યુ' : 'Live Sheet Print Preview'}</span>
            </span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
              {selectedUnits.length * copiesPerUnit} stickers ({totalSheetsNeeded}{' '}
              {currentFormat.isRoll ? 'labels' : 'A4 sheets'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-500 min-w-[36px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="text-[10px] text-indigo-600 hover:underline ml-1 font-semibold"
            >
              Fit 100%
            </button>
          </div>
        </div>

        {/* Main Printable / Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex justify-center items-start print:bg-white print:p-0">
          <div
            ref={printRef}
            className="sticker-print-container transition-transform duration-150 origin-top flex flex-col gap-6"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {currentFormat.isRoll ? (
              /* Thermal Roll View */
              <div className="bg-white p-3 border border-slate-300 rounded-xl shadow-lg print:shadow-none print:border-none print:p-0 space-y-3 w-80 max-w-full">
                <div className="text-[10px] text-slate-400 font-mono text-center border-b pb-1 print:hidden">
                  Thermal Continuous Roll • {currentFormat.labelWidthMm}×{currentFormat.labelHeightMm}mm
                </div>
                {finalLabels
                  .filter((u): u is RepairedUnit => u !== null)
                  .map((unit, idx) => renderStickerItem(unit, idx))}
              </div>
            ) : (
              /* A4 Stationery Sheet Page (Desmat / Oddy Standard) */
              Array.from({ length: totalSheetsNeeded }).map((_, pageIdx) => {
                const startIndex = pageIdx * currentFormat.perSheet;
                const pageLabels = finalLabels.slice(startIndex, startIndex + currentFormat.perSheet);

                return (
                  <div
                    key={`page-${pageIdx}`}
                    className="sticker-sheet-page bg-white border border-slate-300 shadow-xl print:shadow-none print:border-none rounded-lg p-3 sm:p-4 transition-all"
                    style={{
                      width: '210mm',
                      minHeight: '297mm', // A4 Dimensions
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Sheet Header info - Hidden in print */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-200 pb-1 mb-2 font-mono print:hidden">
                      <span>
                        A4 Sticker Sheet #{pageIdx + 1} of {totalSheetsNeeded} — {currentFormat.stationeryBrand}
                      </span>
                      <span>Grid: {currentFormat.columns} Cols × {currentFormat.rows} Rows</span>
                    </div>

                    {/* Dynamic Grid for chosen stationery layout */}
                    <div
                      className="grid gap-1.5 sm:gap-2 h-full"
                      style={{
                        gridTemplateColumns: `repeat(${currentFormat.columns}, minmax(0, 1fr))`,
                      }}
                    >
                      {pageLabels.map((unit, idx) =>
                        renderStickerItem(unit, startIndex + idx)
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white rounded-b-2xl flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            💡 Indian Stationery Tip: Desmat / Oddy 24-Up & 40-Up sheets are available at any local stationery store.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {lang === 'gu' ? 'બંધ કરો' : 'Close'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-102"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'gu' ? 'સ્ટીકર પ્રિન્ટ કરો (Ctrl + P)' : 'Print Labels Sheet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
