import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  parseUploadedExcel,
  transformRowsToUnits,
  transformRowsToCatalog,
  transformRowsToCustomers,
  transformRowsToSuppliers,
  transformRowsToStaff,
  downloadUnitMastersTemplate,
  downloadCatalogTemplate,
  downloadCustomersTemplate,
  downloadSuppliersTemplate,
  downloadStaffTemplate,
} from '../utils/excelMasterImportExport';
import { MasterTab } from './MasterHubView';

interface MasterExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MasterTab;
  lang: 'gu' | 'en';
  onImportUnits: (items: any[], replace: boolean) => void;
  onImportCatalog: (items: any[], replace: boolean) => void;
  onImportCustomers: (items: any[], replace: boolean) => void;
  onImportSuppliers: (items: any[], replace: boolean) => void;
  onImportStaff: (items: any[], replace: boolean) => void;
}

export const MasterExcelUploadModal: React.FC<MasterExcelUploadModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  lang,
  onImportUnits,
  onImportCatalog,
  onImportCustomers,
  onImportSuppliers,
  onImportStaff,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const tabTitles: Record<MasterTab, { gu: string; en: string }> = {
    units: { gu: 'યુનિટ / મશીન મોડેલ માસ્ટર', en: 'Unit / Machine Masters' },
    parts: { gu: 'સ્પેરપાર્ટ્સ & સર્વિસ માસ્ટર', en: 'Spare Parts & Services Master' },
    suppliers: { gu: 'સપ્લાયર્સ & વેન્ડર્સ માસ્ટર', en: 'Suppliers & Vendors Master' },
    customers: { gu: 'ગ્રાહક એકાઉન્ટ માસ્ટર', en: 'Customer Directory Master' },
    staff: { gu: 'કારીગર / સ્ટાફ માસ્ટર', en: 'Staff & Technicians Master' },
  };

  const handleDownloadTemplate = () => {
    if (activeTab === 'units') downloadUnitMastersTemplate();
    else if (activeTab === 'parts') downloadCatalogTemplate();
    else if (activeTab === 'customers') downloadCustomersTemplate();
    else if (activeTab === 'suppliers') downloadSuppliersTemplate();
    else if (activeTab === 'staff') downloadStaffTemplate();
  };

  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setIsParsing(true);
    try {
      const rawRows = await parseUploadedExcel(selectedFile);
      if (!rawRows || rawRows.length === 0) {
        setErrorMessage(
          lang === 'gu'
            ? 'પસંદ કરેલ એક્સેલ ફાઇલમાં કોઈ ડેટા મળ્યો નથી. કૃપા કરીને યોગ્ય ફાઇલ પસંદ કરો.'
            : 'No data rows found in selected file. Please select a valid sheet.'
        );
        setParsedItems([]);
        setIsParsing(false);
        return;
      }

      let transformed: any[] = [];
      if (activeTab === 'units') transformed = transformRowsToUnits(rawRows);
      else if (activeTab === 'parts') transformed = transformRowsToCatalog(rawRows);
      else if (activeTab === 'customers') transformed = transformRowsToCustomers(rawRows);
      else if (activeTab === 'suppliers') transformed = transformRowsToSuppliers(rawRows);
      else if (activeTab === 'staff') transformed = transformRowsToStaff(rawRows);

      if (transformed.length === 0) {
        setErrorMessage(
          lang === 'gu'
            ? 'એક્સેલ કોલમ હેડર મેળ ખાતા નથી. કૃપા કરીને સેમ્પલ ટેમ્પલેટ ડાઉનલોડ કરીને તે મુજબ ડેટા ભરો.'
            : 'Could not map required columns. Please download sample template for correct headers.'
        );
      } else {
        setParsedItems(transformed);
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMessage(
        lang === 'gu'
          ? 'એક્સેલ ફાઇલ વાંચવામાં ભૂલ આવી. કૃપા કરીને માન્ય .xlsx કે .csv ફાઇલ પસંદ કરો.'
          : 'Failed to read file. Please upload a valid .xlsx or .csv format.'
      );
      setParsedItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileProcess(droppedFile);
    }
  };

  const handleConfirm = () => {
    if (parsedItems.length === 0) return;
    const replace = importMode === 'replace';
    if (activeTab === 'units') onImportUnits(parsedItems, replace);
    else if (activeTab === 'parts') onImportCatalog(parsedItems, replace);
    else if (activeTab === 'customers') onImportCustomers(parsedItems, replace);
    else if (activeTab === 'suppliers') onImportSuppliers(parsedItems, replace);
    else if (activeTab === 'staff') onImportStaff(parsedItems, replace);

    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setFile(null);
    setParsedItems([]);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/60 rounded-xl border border-indigo-400/30">
              <FileSpreadsheet className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/20">
                  Excel Bulk Upload
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">
                {lang === 'gu'
                  ? `${tabTitles[activeTab].gu} - એક્સેલ અપલોડ`
                  : `Upload ${tabTitles[activeTab].en} via Excel`}
              </h2>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Download Sample Template Card */}
          <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  {lang === 'gu' ? 'નમૂનાની એક્સેલ ફાઇલ ડાઉનલોડ કરો (Sample Template)' : 'Download Ready Excel Template'}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {lang === 'gu'
                    ? 'આ નમૂના ફાઇલમાં તમામ સાચા કોલમ હેડર્સ અને ઉદાહરણો પહેલેથી આપેલા છે.'
                    : 'Pre-formatted sheet with exact columns and sample values ready to fill.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? 'ટેમ્પલેટ ડાઉનલોડ (.xlsx)' : 'Download Template (.xlsx)'}</span>
            </button>
          </div>

          {/* Step 2: Drag & Drop File Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-indigo-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileProcess(f);
              }}
              className="hidden"
            />
            <div className={`p-3.5 rounded-2xl ${file ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {file ? file.name : (lang === 'gu' ? 'કમ્પ્યુટરમાંથી એક્સેલ ફાઇલ સિલેક્ટ કરો' : 'Click or drag your Excel file here')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB • ${lang === 'gu' ? 'બીજી ફાઇલ બદલવા ક્લિક કરો' : 'Click to change file'}`
                  : (lang === 'gu' ? 'સપોર્ટ: .xlsx, .xls, .csv ફાઇલ' : 'Supports .xlsx, .xls, and .csv files')}
              </p>
            </div>
          </div>

          {/* Loading status */}
          {isParsing && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{lang === 'gu' ? 'એક્સેલ ડેટા પ્રોસેસ થઈ રહ્યો છે...' : 'Processing Excel data...'}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{lang === 'gu' ? 'અપલોડમાં સમસ્યા:' : 'Import Warning:'}</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Step 3: Parsed Data Preview & Options */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">
                    {lang === 'gu'
                      ? `${parsedItems.length} રેકોર્ડ્સ સફળતાપૂર્વક મળ્યા`
                      : `${parsedItems.length} valid records ready to import`}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {lang === 'gu' ? 'નીચે પ્રિવ્યૂ ચકાસો' : 'Preview below before confirming'}
                </span>
              </div>

              {/* Import Mode Radio */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-800">
                  {lang === 'gu' ? 'આયાત કરવાની પદ્ધતિ (Import Mode):' : 'Import Mode:'}
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{lang === 'gu' ? 'હાલના ડેટામાં ઉમેરો (Merge & Append)' : 'Merge with Existing'}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-rose-600">{lang === 'gu' ? 'તમામ બદલો (Replace All)' : 'Replace All'}</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">Sr.</th>
                      <th className="py-2 px-3">{lang === 'gu' ? 'નામ' : 'Name'}</th>
                      <th className="py-2 px-3">
                        {activeTab === 'units' && (lang === 'gu' ? 'પ્રીફિક્સ / કેટેગરી' : 'Prefix / Category')}
                        {activeTab === 'parts' && (lang === 'gu' ? 'કોડ / ભાવ' : 'Code / Price')}
                        {activeTab === 'customers' && (lang === 'gu' ? 'ફોન / શહેર' : 'Phone / City')}
                        {activeTab === 'suppliers' && (lang === 'gu' ? 'સંપર્ક / શહેર' : 'Contact / City')}
                        {activeTab === 'staff' && (lang === 'gu' ? 'રોલ / પગાર' : 'Role / Salary')}
                      </th>
                      <th className="py-2 px-3 text-right">{lang === 'gu' ? 'વિગત' : 'Extra'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedItems.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {item.name}
                          {item.nameGu && <span className="block text-[10px] text-slate-500">{item.nameGu}</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {activeTab === 'units' && `${item.codePrefix} • ${item.category}`}
                          {activeTab === 'parts' && `${item.code} • ₹${item.salePrice}`}
                          {activeTab === 'customers' && `${item.phone || '-'} • ${item.city}`}
                          {activeTab === 'suppliers' && `${item.phone || '-'} • ${item.city}`}
                          {activeTab === 'staff' && `${item.role} • ₹${item.salary}`}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">
                          {activeTab === 'units' && `₹${item.defaultServiceCharge}`}
                          {activeTab === 'parts' && `${item.stock !== undefined ? `${item.stock} ${item.unit}` : 'Service'}`}
                          {activeTab === 'customers' && (item.gstNumber || '-')}
                          {activeTab === 'suppliers' && (item.category || '-')}
                          {activeTab === 'staff' && (item.salaryType || 'Monthly')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center italic">
                  + {parsedItems.length - 15} {lang === 'gu' ? 'વધુ રેકોર્ડ્સ આયાત થશે...' : 'more records will be imported...'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:scale-102"
          >
            <FileCheck className="w-4 h-4" />
            <span>
              {lang === 'gu'
                ? `${parsedItems.length || 0} રેકોર્ડ્સ માસ્ટરમાં અપલોડ કરો`
                : `Upload ${parsedItems.length || 0} Records to Master`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
