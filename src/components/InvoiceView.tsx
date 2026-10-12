import React, { useState } from 'react';
import { Customer, Invoice, WorkshopSettings } from '../types';
import { INITIAL_CATALOG } from '../data/initialData';
import { formatCurrency, formatDate, generateWhatsAppMessage } from '../utils/formatters';
import { CustomerViewA5 } from './CustomerViewA5';
import { DetailedPartsViewA4 } from './DetailedPartsViewA4';
import { InvoicePrintPreviewModal } from './InvoicePrintPreviewModal';
import { UnitStickersModal } from './UnitStickersModal';
import { PaymentReceiveModal, RecordPaymentParams } from './PaymentReceiveModal';
import { downloadElementAsPdf, downloadElementAsImage } from '../utils/exportPdf';
import {
  Printer,
  Eye,
  Share2,
  Tag,
  ArrowLeft,
  Edit3,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  FileText,
  Download,
  Image as ImageIcon,
  Loader2,
  Package,
} from 'lucide-react';

interface InvoiceViewProps {
  invoice: Invoice;
  customers: Customer[];
  invoices: Invoice[];
  settings: WorkshopSettings;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onRecordPayment: (params: RecordPaymentParams) => void;
  lang: 'gu' | 'en';
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoice,
  customers,
  invoices,
  settings,
  onBack,
  onEdit,
  onRecordPayment,
  lang,
}) => {
  // Default view is Customer View (A5) as explicitly requested
  const [viewMode, setViewMode] = useState<'customer' | 'detailed'>('customer');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showStickersModal, setShowStickersModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    const targetId = viewMode === 'customer' ? 'invoice-customer-a5' : 'invoice-detailed-a4';
    const el = document.getElementById(targetId);
    if (!el) return;

    try {
      setIsDownloadingPdf(true);
      const safeCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${invoice.invoiceNumber}_${safeCustomer}_${viewMode.toUpperCase()}`;
      await downloadElementAsPdf(el, {
        fileName,
        format: viewMode === 'customer' ? 'a5' : 'a4',
        orientation: 'portrait',
      });
      setDownloadSuccess('PDF');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    const targetId = viewMode === 'customer' ? 'invoice-customer-a5' : 'invoice-detailed-a4';
    const el = document.getElementById(targetId);
    if (!el) return;

    try {
      setIsDownloadingImage(true);
      const safeCustomer = invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${invoice.invoiceNumber}_${safeCustomer}_${viewMode.toUpperCase()}`;
      await downloadElementAsImage(el, fileName);
      setDownloadSuccess('Image');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to download Image:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handlePrint = (modeToPrint: 'customer' | 'detailed' = viewMode) => {
    // Set active mode if different
    if (modeToPrint !== viewMode) {
      setViewMode(modeToPrint);
    }
    // Inject dynamic print style for exact page size
    const styleId = 'dynamic-invoice-print-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    if (modeToPrint === 'customer') {
      styleTag.innerHTML = `
        @media print {
          @page {
            size: A5 portrait;
            margin: 6mm;
          }
          .invoice-card-a5 {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `;
    } else {
      styleTag.innerHTML = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          .invoice-card-a4 {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `;
    }

    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage(invoice, settings.workshopName);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = generateWhatsAppMessage(invoice, settings.workshopName);
    const cleanPhone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const statusColors = {
    Paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Partial: 'bg-amber-100 text-amber-800 border-amber-300',
    Unpaid: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar - Hidden in Print */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'gu' ? 'પાછા જાઓ' : 'Back'}</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{invoice.invoiceNumber}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  statusColors[invoice.paymentStatus]
                }`}
              >
                {invoice.paymentStatus === 'Paid'
                  ? lang === 'gu'
                    ? 'ચૂકવેલ (PAID)'
                    : 'PAID'
                  : invoice.paymentStatus === 'Partial'
                  ? lang === 'gu'
                    ? 'અડધું ચૂકવેલ'
                    : 'PARTIAL'
                  : lang === 'gu'
                  ? 'બાકી (DUE)'
                  : 'UNPAID'}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              {lang === 'gu' ? 'ગ્રાહક: ' : 'Customer: '}
              <strong>{invoice.customerName}</strong> • {formatDate(invoice.date)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Receive Payment Button */}
          {invoice.balanceDue > 0 ? (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-102"
              title="Record payment for this bill"
            >
              <CreditCard className="w-4 h-4" />
              <span>{lang === 'gu' ? '💰 પેમેન્ટ જમા લો' : '💰 Receive Payment'}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs sm:text-sm font-semibold rounded-xl transition-all"
              title="Payment details"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'gu' ? 'પેમેન્ટ વિગત' : 'Payment Details'}</span>
            </button>
          )}

          {/* Print Stickers Button */}
          <button
            onClick={() => setShowStickersModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
            title="Print barcode stickers for each unit"
          >
            <Tag className="w-4 h-4" />
            <span>{lang === 'gu' ? 'સ્ટીકર્સ પ્રિન્ટ' : 'Print Stickers'}</span>
          </button>

          {/* Print Preview Button */}
          <button
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
            title="Open interactive print preview"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'gu' ? 'પ્રિન્ટ પ્રીવ્યુ' : 'Print Preview'}</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || isDownloadingImage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs sm:text-sm font-bold rounded-xl transition-all"
            title={lang === 'gu' ? 'PDF ફાઈલ ડાઉનલોડ કરો' : 'Download PDF file'}
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : downloadSuccess === 'PDF' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isDownloadingPdf ? '...' : lang === 'gu' ? 'PDF ડાઉનલોડ' : 'Download PDF'}</span>
          </button>

          {/* Download Image (PNG) */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloadingPdf || isDownloadingImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            title={lang === 'gu' ? 'ઇમેજ (PNG) ડાઉનલોડ કરો' : 'Download Image (PNG)'}
          >
            {isDownloadingImage ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : downloadSuccess === 'Image' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <ImageIcon className="w-4 h-4 text-indigo-600" />
            )}
            <span>{isDownloadingImage ? '...' : lang === 'gu' ? 'PNG ઇમેજ' : 'PNG Image'}</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (lang === 'gu' ? 'કોપી થયું!' : 'Copied!') : lang === 'gu' ? 'સમરી' : 'Copy'}</span>
          </button>

          {/* Edit Bill */}
          <button
            onClick={() => onEdit(invoice)}
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>{lang === 'gu' ? 'સુધારો' : 'Edit'}</span>
          </button>

          {/* Direct Print Bill */}
          <button
            onClick={() => handlePrint(viewMode)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>
              {lang === 'gu'
                ? viewMode === 'customer'
                  ? 'A5 બિલ પ્રિન્ટ'
                  : 'A4 બિલ પ્રિન્ટ'
                : viewMode === 'customer'
                ? 'Print A5 Bill'
                : 'Print A4 Bill'}
            </span>
          </button>
        </div>
      </div>

      {/* Bill View Mode Selector Bar (Customer View vs Summarised View) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            {lang === 'gu' ? 'બિલ વ્યૂ પસંદ કરો:' : 'Select Invoice View:'}
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('customer')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'customer'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Customer View (A5)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Summarised Parts View (A4)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="hidden sm:inline">
            {viewMode === 'customer'
              ? '✨ કેટેગરી મુજબ યુનિટ્સ ટોટલ & રકમ (A5 સાઇઝ + મોટો લોગો વોટરમાર્ક)'
              : '📋 દરેક મશીનના પાર્ટ્સ નામ & વિગત સાથે (A4 સાઇઝ)'}
          </span>
          <button
            type="button"
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{lang === 'gu' ? 'પ્રિન્ટ પ્રીવ્યુ ખોલો' : 'Open Preview'}</span>
          </button>
        </div>
      </div>

      {/* Main Invoice Card Display */}
      <div className="w-full flex justify-center">
        {viewMode === 'customer' ? (
          <CustomerViewA5 invoice={invoice} settings={settings} lang={lang} />
        ) : (
          <DetailedPartsViewA4 invoice={invoice} settings={settings} lang={lang} />
        )}
      </div>

      {/* Print Preview Modal */}
      <InvoicePrintPreviewModal
        invoice={invoice}
        settings={settings}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        initialMode={viewMode}
        onPrint={(mode) => {
          setShowPrintPreview(false);
          handlePrint(mode);
        }}
        lang={lang}
      />

      {/* Unit Tracking Stickers Modal */}
      <UnitStickersModal
        units={invoice.units}
        invoiceNumber={invoice.invoiceNumber}
        customerName={invoice.customerName}
        date={invoice.date}
        settings={settings}
        isOpen={showStickersModal}
        onClose={() => setShowStickersModal(false)}
        lang={lang}
      />

      {/* Payment Receive Modal */}
      <PaymentReceiveModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        customers={customers}
        invoices={invoices}
        initialCustomerId={invoice.customerId}
        initialInvoiceId={invoice.id}
        onRecordPayment={onRecordPayment}
        lang={lang}
      />
    </div>
  );
};
