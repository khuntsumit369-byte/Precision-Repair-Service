import React, { useState, useRef } from 'react';
import { Invoice, WorkshopSettings } from '../types';
import { CustomerViewA5 } from './CustomerViewA5';
import { DetailedPartsViewA4 } from './DetailedPartsViewA4';
import { downloadElementAsPdf, downloadElementAsImage } from '../utils/exportPdf';
import {
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  FileText,
  Sparkles,
  Download,
  Image as ImageIcon,
  Loader2,
  Check,
} from 'lucide-react';

interface InvoicePrintPreviewModalProps {
  invoice: Invoice;
  settings: WorkshopSettings;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'customer' | 'detailed';
  onPrint: (mode: 'customer' | 'detailed') => void;
  lang: 'gu' | 'en';
}

export const InvoicePrintPreviewModal: React.FC<InvoicePrintPreviewModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
  initialMode = 'customer',
  onPrint,
  lang,
}) => {
  const [activeMode, setActiveMode] = useState<'customer' | 'detailed'>(initialMode);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrintClick = () => {
    onPrint(activeMode);
  };

  const getTargetElement = (): HTMLElement | null => {
    const targetId = activeMode === 'customer' ? 'invoice-customer-a5' : 'invoice-detailed-a4';
    return (
      (previewContainerRef.current?.querySelector(`#${targetId}`) as HTMLElement) ||
      document.getElementById(targetId)
    );
  };

  const handleDownloadPdf = async () => {
    const el = getTargetElement();
    if (!el) return;

    try {
      setIsDownloadingPdf(true);
      const safeCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${invoice.invoiceNumber}_${safeCustomer}_${activeMode.toUpperCase()}`;
      await downloadElementAsPdf(el, {
        fileName,
        format: activeMode === 'customer' ? 'a5' : 'a4',
        orientation: 'portrait',
      });
      setDownloadSuccess('PDF');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const el = getTargetElement();
    if (!el) return;

    try {
      setIsDownloadingImage(true);
      const safeCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${invoice.invoiceNumber}_${safeCustomer}_${activeMode.toUpperCase()}`;
      await downloadElementAsImage(el, fileName);
      setDownloadSuccess('Image');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to generate Image:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 print:hidden animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Title & Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base">
                {lang === 'gu' ? 'બિલ પ્રિન્ટ પ્રીવ્યુ' : 'Invoice Print Preview'}
              </span>
              <span className="font-mono text-xs text-indigo-300 font-bold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700">
                {invoice.invoiceNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'gu'
                ? 'પ્રિન્ટ કરતા પહેલા પેપર સાઇઝ અને ફોર્મેટ પસંદ કરો'
                : 'Select paper size & layout before sending to printer'}
            </p>
          </div>
        </div>

        {/* Center: View Mode Toggle */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveMode('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'customer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Customer View (A5)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('detailed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'detailed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Summarised Parts View (A4)</span>
          </button>
        </div>

        {/* Right: Zoom controls & Download / Print Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-1.5 py-1 text-[10px] text-slate-400 hover:text-white border-l border-slate-700 ml-1"
              title="Reset 100%"
            >
              100%
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || isDownloadingImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-900/40 transition-all hover:scale-102"
            title={lang === 'gu' ? 'PDF ફાઈલ ડાઉનલોડ કરો' : 'Download PDF file'}
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess === 'PDF' ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloadingPdf ? 'Creating...' : lang === 'gu' ? 'PDF ડાઉનલોડ' : 'Download PDF'}</span>
          </button>

          {/* Download Image Button */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloadingPdf || isDownloadingImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all"
            title={lang === 'gu' ? 'ઇમેજ (PNG) ડાઉનલોડ કરો' : 'Download Image (PNG)'}
          >
            {isDownloadingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : downloadSuccess === 'Image' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-indigo-400" />
            )}
            <span>{isDownloadingImage ? 'Exporting...' : lang === 'gu' ? 'ઇમેજ (PNG)' : 'Image (PNG)'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrintClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-900/50 transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>
              {lang === 'gu'
                ? activeMode === 'customer'
                  ? 'A5 પ્રિન્ટ'
                  : 'A4 પ્રિન્ટ'
                : activeMode === 'customer'
                ? 'Print A5'
                : 'Print A4'}
            </span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info indicator */}
      <div className="text-[11px] text-slate-300 mt-2 flex items-center gap-3">
        <span className="inline-flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2.5 py-0.5 rounded-full">
          📄 Paper:{' '}
          <strong className="text-amber-300 font-mono">
            {activeMode === 'customer' ? 'A5 (148 × 210 mm) Portrait' : 'A4 (210 × 297 mm) Portrait'}
          </strong>
        </span>
        <span className="text-slate-400 hidden sm:inline">
          {activeMode === 'customer'
            ? 'Category-wise summary with background watermark'
            : 'Complete parts diagnostic breakdown'}
        </span>
      </div>

      {/* Main Scrollable Paper Preview Canvas */}
      <div
        ref={previewContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 sm:p-6 flex items-start justify-center"
      >
        <div
          className="transition-transform duration-150 origin-top flex justify-center w-full"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {activeMode === 'customer' ? (
            <CustomerViewA5 invoice={invoice} settings={settings} lang={lang} />
          ) : (
            <DetailedPartsViewA4 invoice={invoice} settings={settings} lang={lang} />
          )}
        </div>
      </div>

      {/* Footer bar */}
      <div className="w-full max-w-5xl py-2 px-4 flex items-center justify-between text-xs text-slate-400">
        <span>PRECISION REPAIR SERVICE • Official Workshop Invoice Engine</span>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
          >
            {lang === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
          <button
            onClick={handlePrintClick}
            className="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
          >
            {lang === 'gu' ? 'પ્રિન્ટ કરો (Ctrl + P)' : 'Print Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
