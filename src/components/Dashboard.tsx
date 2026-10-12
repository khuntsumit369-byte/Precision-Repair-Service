import React from 'react';
import { Invoice, CatalogItem, WorkshopSettings, Customer } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wrench,
  Package,
  TrendingUp,
  Clock,
  Tag,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  FileText,
  Users,
  Camera,
  Upload,
  Smartphone,
} from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  catalog: CatalogItem[];
  customers: Customer[];
  settings: WorkshopSettings;
  onNavigate: (tab: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  lang: 'gu' | 'en';
  onUpdateLogo?: (newLogoUrl: string) => void;
  onOpenAndroidInstall?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices,
  catalog,
  customers,
  settings,
  onNavigate,
  onSelectInvoice,
  lang,
  onUpdateLogo,
  onOpenAndroidInstall,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateLogo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  // Aggregate stats
  const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPartsEarned = invoices.reduce((sum, i) => sum + i.partsTotal, 0);
  const totalServiceEarned = invoices.reduce((sum, i) => sum + i.servicesTotal, 0);
  const totalPendingDues = invoices.reduce((sum, i) => sum + i.balanceDue, 0);

  // Total repaired units count
  let totalUnitsRepaired = 0;
  let handpiecesCount = 0;
  let motorsCount = 0;

  invoices.forEach((inv) => {
    inv.units.forEach((u) => {
      totalUnitsRepaired++;
      if (u.unitType === 'Handpiece') handpiecesCount++;
      else if (u.unitType === 'Motor') motorsCount++;
    });
  });

  const govindjiInvoice = invoices.find((i) => i.customerName.toLowerCase().includes('govindji'));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {lang === 'gu'
                ? 'રીપેર સર્વિસ અને સ્પેર પાર્ટ્સ બિલિંગ સિસ્ટમ'
                : 'Repair Service & Parts Billing Platform'}
            </span>
          </div>
          <div className="flex items-center gap-3.5 mb-2">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-white/40 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                <img
                  src={settings.logoUrl || '/logo.png'}
                  alt={settings.workshopName}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              {onUpdateLogo && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={lang === 'gu' ? 'ઓરિજિનલ લોગો અપલોડ કરો (Same-to-Same Image)' : 'Upload Your Exact Logo File'}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full shadow-md border-2 border-slate-900 transition-transform hover:scale-110"
                >
                  <Camera className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                {settings.workshopName}
              </h1>
              <p className="text-xs text-indigo-300 font-semibold">
                {settings.workshopNameGu}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mt-2 font-medium">
            {lang === 'gu'
              ? 'હેન્ડપીસ અને મોટરના યુનિટ કોડ, સ્પેરપાર્ટ્સ ગણતરી અને કન્સોલિડેટેડ ઇનવોઇસ સિસ્ટમ.'
              : 'Multi-unit service tracking, spare parts billing, printable stickers & customer accounting.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            {/* Hidden file input for logo */}
            {onUpdateLogo && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            )}

            <button
              onClick={() => onNavigate('new-invoice')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'gu' ? '+ નવું બિલ બનાવો' : '+ Create Invoice'}</span>
            </button>

            {onUpdateLogo && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm rounded-xl backdrop-blur-xs transition-all border border-white/20"
                title={lang === 'gu' ? 'તમારા કમ્પ્યુટર કે ફોનમાંથી ઓરિજિનલ લોગો ફાઈલ સિલેક્ટ કરો' : 'Upload exact logo image file from your device'}
              >
                <Upload className="w-4 h-4 text-indigo-300" />
                <span>
                  {lang === 'gu' ? 'ઓરિજિનલ લોગો ફાઈલ બદલો' : 'Upload Exact Logo File'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle decorative background circles */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 bottom-0 -mb-12 w-48 h-48 rounded-full bg-amber-500/10 blur-xl pointer-events-none"></div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'gu' ? 'કુલ બિલિંગ' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500">
            {invoices.length} {lang === 'gu' ? 'ઇનવોઇસ જનરેટ થયા' : 'invoices recorded'}
          </div>
        </div>

        {/* Parts Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'gu' ? 'સ્પેર પાર્ટ્સ વેચાણ' : 'Parts Sales'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            {formatCurrency(totalPartsEarned)}
          </div>
          <div className="text-[11px] text-slate-500">
            Bearing, MOSFET, Cable, etc.
          </div>
        </div>

        {/* Labor / Service Charges */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'gu' ? 'સર્વિસ મહેનતાણું' : 'Service Labor'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-700">
            {formatCurrency(totalServiceEarned)}
          </div>
          <div className="text-[11px] text-slate-500">
            HP (₹200) & Motor (₹150) labor
          </div>
        </div>

        {/* Units Repaired */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'gu' ? 'રીપેર કરેલા યુનિટ્સ' : 'Units Repaired'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {totalUnitsRepaired}{' '}
            <span className="text-xs text-slate-500 font-normal">Units</span>
          </div>
          <div className="text-[11px] text-slate-500">
            {handpiecesCount} Handpieces • {motorsCount} Motors
          </div>
        </div>
      </div>

      {/* Spotlight: Govindji Jewellers Prompt Job Breakdown */}
      {govindjiInvoice && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                GJ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Govindji Jewellers Job Card (4 Handpieces + 3 Motors)
                  </h3>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {govindjiInvoice.invoiceNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(govindjiInvoice.date)} • {lang === 'gu' ? 'તમારા પ્રશ્નની વિગત અનુસાર બિલ તૈયાર છે' : 'Loaded with exact items & parts specified in prompt'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectInvoice(govindjiInvoice)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
              >
                <span>{lang === 'gu' ? 'સંપૂર્ણ બિલ જુઓ' : 'View Consolidated Invoice'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Grid of all 7 Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {govindjiInvoice.units.map((u, uIdx) => (
              <div
                key={u.id}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      <span className="text-[10px] text-slate-400 font-mono mr-1">Sr. {uIdx + 1}</span>
                      {u.unitName}
                    </span>
                    <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                      {u.trackingCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {u.parts.length
                      ? u.parts.map((p) => (p.quantity > 1 ? `${p.name} (x${p.quantity})` : p.name)).join(', ')
                      : 'Service Charge Only'}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-baseline font-mono">
                  <span className="text-[10px] text-slate-400">Total:</span>
                  <span className="font-bold text-slate-900">₹{u.unitSubtotal}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-600 bg-amber-50/60 p-3 rounded-xl border border-amber-100">
            <div>
              Spare Parts Total: <strong>₹{govindjiInvoice.partsTotal}</strong> • Service Total: <strong>₹{govindjiInvoice.servicesTotal}</strong>
            </div>
            <div className="font-bold text-sm text-slate-900 font-mono">
              Consolidated Total: ₹{govindjiInvoice.grandTotal}
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('parts-stock')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">
            {lang === 'gu' ? 'પાર્ટ્સ ખરીદી & સ્ટોક' : 'Parts Purchase & Stock'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'gu'
              ? 'ખરીદી બિલ એન્ટ્રી, ગોડાઉન સ્ટોક અને ઇન્વેન્ટરી બેલેન્સ.'
              : 'Record vendor purchase bills & manage inventory levels.'}
          </p>
        </button>

        <button
          onClick={() => onNavigate('cashflow')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-300 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">
            {lang === 'gu' ? 'ખર્ચ & કેશ ફ્લો' : 'Expense & Cash Flow'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'gu'
              ? 'દુકાન ખર્ચ રજીસ્ટર, આવક-જાવક અને રોકડ સિલકનો હિસાબ.'
              : 'Track workshop operating expenses & cash flow.'}
          </p>
        </button>

        <button
          onClick={() => onNavigate('customers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">
            {lang === 'gu' ? 'ગ્રાહક ખાતાવહી (Ledger)' : 'Customer Accounting Ledger'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'gu'
              ? 'ગ્રાહકવાર બાકી લેણી રકમ અને જમા પેમેન્ટ (Discount સહિત).'
              : 'Track dues, record payments with discount/waive option.'}
          </p>
        </button>

        <button
          onClick={() => onNavigate('tracker')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Tag className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm">
            {lang === 'gu' ? 'યુનિટ હિસ્ટ્રી ટ્રેકર' : 'Unit Performance Tracker'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'gu'
              ? 'હેન્ડપીસ/મોટર પરના કોડ દ્વારા જૂના સર્વિસ રેકોર્ડ જુઓ.'
              : 'Lookup repair history by scanning unit sticker code.'}
          </p>
        </button>
      </div>
    </div>
  );
};
