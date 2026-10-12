import React, { useState } from 'react';
import { WorkshopSettings } from '../types';
import {
  Settings,
  Save,
  RotateCcw,
  Building,
  Phone,
  MapPin,
  Shield,
  Check,
  Image as ImageIcon,
  Upload,
  Download,
  Database,
  FileJson,
  Plus,
  Trash2,
  Mail,
  FileText,
} from 'lucide-react';
import { resetAllToDefault } from '../utils/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { clearAllCloudTransactionalRecords } from '../utils/firestoreSync';

interface WorkshopSettingsViewProps {
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => void;
  onResetData: () => void;
  lang: 'gu' | 'en';
  currentData?: any;
  onRestoreData?: (restoredData: any) => void;
}

export const WorkshopSettingsView: React.FC<WorkshopSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
  lang,
  currentData,
  onRestoreData,
}) => {
  const [formData, setFormData] = useState<WorkshopSettings>({ ...settings });
  const [newTermInput, setNewTermInput] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAddTerm = () => {
    if (newTermInput.trim()) {
      setFormData({
        ...formData,
        terms: [...(formData.terms || []), newTermInput.trim()],
      });
      setNewTermInput('');
    }
  };

  const handleRemoveTerm = (index: number) => {
    const updated = [...(formData.terms || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, terms: updated });
  };

  const handleUpdateTerm = (index: number, val: string) => {
    const updated = [...(formData.terms || [])];
    updated[index] = val;
    setFormData({ ...formData, terms: updated });
  };

  const handleResetTermsToDefault = () => {
    setFormData({
      ...formData,
      terms: [
        'Unit tracking code sticker is affixed on each machine for service identification.',
        'Please inspect and verify the machine working at the time of delivery.',
        'Payment due on presentation of invoice.'
      ],
    });
  };

  const handleExportJson = () => {
    try {
      const dataToExport = currentData || {
        settings: formData,
      };
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `repairflow_complete_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export JSON error', e);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestoreData) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onRestoreData(parsed);
          setSavedMessage(true);
          setTimeout(() => setSavedMessage(false), 3000);
        } catch (err) {
          console.error('Restore error', err);
          alert(lang === 'gu' ? 'અમાન્ય બેકઅપ JSON ફાઇલ' : 'Invalid backup JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData({ ...formData, logoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleConfirmReset = async () => {
    resetAllToDefault();
    await clearAllCloudTransactionalRecords();
    onResetData();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>
              {lang === 'gu' ? 'દુકાન અને બિલ સેટિંગ્સ' : 'Workshop & Invoice Settings'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'gu'
              ? 'દુકાનનું નામ, ફોન નંબર, સરનામું અને બિલની શરતો સેટ કરો'
              : 'Customize workshop brand, contact details, warranty terms, and address on printed bills.'}
          </p>
        </div>

        {savedMessage && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'gu'
                ? 'સેટિંગ્સ સફળતાપૂર્વક સાચવ્યા!'
                : 'Settings Saved Successfully!'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Business details */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'gu' ? 'દુકાન / વર્કશોપ વિગત' : 'Workshop Information'}</span>
          </h2>

          {/* Logo Upload & Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'gu' ? 'દુકાનનો ઓફિશિયલ લોગો (Workshop Logo)' : 'Official Workshop Logo'}</span>
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                {lang === 'gu' ? 'લોગો સેટ છે' : 'Active Logo'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-white border-2 border-indigo-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                <img
                  src={formData.logoUrl || '/logo.png'}
                  alt="Logo Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'gu' ? 'કમ્પ્યુટરમાંથી નવો લોગો અપલોડ કરો' : 'Upload New Logo Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: '/logo.png' })}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    {lang === 'gu' ? 'ડિફોલ્ટ લોગો રાખો' : 'Reset to Default Logo'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {lang === 'gu'
                    ? 'આ લોગો સોફ્ટવેરમાં ઉપર હેડરમાં, બિલના A5 અને A4 પ્રિન્ટમાં, વોટરમાર્કમાં તથા સ્ટીકર્સમાં દેખાશે.'
                    : 'This logo appears in header, on printed invoices (A5/A4), and unit tracking stickers.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'દુકાનનું નામ (Workshop Name English)' : 'Workshop Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={formData.workshopName}
                onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'દુકાનનું નામ (ગુજરાતીમાં)' : 'Workshop Name (Gujarati)'}
              </label>
              <input
                type="text"
                value={formData.workshopNameGu}
                onChange={(e) => setFormData({ ...formData, workshopNameGu: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'ટેગલાઇન / વિગત' : 'Tagline / Specialty'}
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'માલિક / ટેકનિશિયનનું નામ' : 'Owner / Head Technician'}
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                placeholder="24AAAAA0000A1Z5"
              />
            </div>
          </div>
        </div>

        {/* Contact and address */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'gu' ? 'સંપર્ક અને સરનામું' : 'Contact & Address'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'મોબાઇલ નંબર' : 'Primary Phone'} *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'બીજો મોબાઇલ નંબર (Alternative)' : 'Alternate Phone'}
              </label>
              <input
                type="text"
                value={formData.altPhone || ''}
                onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'gu' ? 'ઇમેઇલ એડ્રેસ (Workshop Email)' : 'Workshop Email Address'}</span>
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                placeholder="service@precisionrepair.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'સરનામું (Address)' : 'Shop Address'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'શહેર અને પીનકોડ' : 'City & Pincode'}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Warranty and Terms */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'gu' ? 'વોરંટી અને બિલની શરતો' : 'Default Warranty & Invoice Terms'}</span>
            </h2>
            <button
              type="button"
              onClick={handleResetTermsToDefault}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              {lang === 'gu' ? 'ડિફોલ્ટ શરતો રીસેટ કરો' : 'Reset Terms to Default'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'ડિફોલ્ટ વોરંટી (દિવસો)' : 'Default Warranty (Days)'}
            </label>
            <input
              type="number"
              min="0"
              value={formData.defaultWarrantyDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultWarrantyDays: parseInt(e.target.value) || 0,
                })
              }
              className="w-32 px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
            />
          </div>

          {/* Editable Terms List */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === 'gu' ? 'બિલ પર છાપવાની શરતો (Invoice Terms & Conditions):' : 'Printed Invoice Terms & Conditions:'}</span>
            </label>
            <div className="space-y-2">
              {(formData.terms || []).map((term, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => handleUpdateTerm(index, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    title="Remove Term"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new term input */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-bold text-indigo-500 w-5 text-right shrink-0">+</span>
              <input
                type="text"
                placeholder={lang === 'gu' ? 'નવી શરત ઉમેરો...' : 'Add new invoice term...'}
                value={newTermInput}
                onChange={(e) => setNewTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-dashed border-indigo-300 rounded-lg focus:ring-1 focus:ring-indigo-500 bg-indigo-50/30"
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? 'ઉમેરો' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'gu' ? 'ડેમો ડેટા રીસેટ કરો' : 'Reset Demo Data'}</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'gu' ? 'સેટિંગ્સ સેવ કરો' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Offline Data Backup, Restore & Clear Records Hub */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'gu'
              ? 'ઓફલાઇન ડેટા બેકઅપ અને રીસ્ટોર'
              : 'Offline Data Backup & Restore'}
          </h2>
        </div>

        {/* Local JSON File Backup & Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                <FileJson className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'gu' ? 'ઓફલાઇન JSON ડેટા બેકઅપ અને રીસ્ટોર' : 'Offline JSON Data Backup & Restore'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'gu'
                    ? 'બધા ગ્રાહકો, ઇન્વોઇસ, સ્ટોક અને ચુકવણીઓનો ઓફલાઇન બેકઅપ સેવ કરો અથવા અગાઉનો બેકઅપ પાછો લાવો'
                    : 'Download an immediate full JSON snapshot of all records, or import a previously downloaded backup.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'gu' ? 'JSON બેકઅપ ડાઉનલોડ' : 'Download JSON Backup'}</span>
              </button>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{lang === 'gu' ? 'JSON ફાઇલમાંથી રીસ્ટોર' : 'Restore from JSON'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
                title={lang === 'gu' ? 'બધા બિલ અને રેકોર્ડ 0-0 કરો' : 'Clear all transactional data to 0-0'}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>{lang === 'gu' ? 'બધા રેકોર્ડ્સ 0-0 કરો' : 'Clear All Records to 0-0'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REUSABLE CUSTOM IN-UI RESET CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        title={lang === 'gu' ? 'બધા રેકોર્ડ્સ 0-0 કરો' : 'Clear All Records to 0-0'}
        message={
          lang === 'gu'
            ? 'શું તમે બધા બિલ, ખરીદી, પેમેન્ટ્સ અને ખર્ચના રેકોર્ડ ક્લિયર કરીને 0-0 કરવા માંગો છો? તમારા માસ્ટર્સ (સ્પેરપાર્ટ્સ, યુનિટ્સ, સપ્લાયર્સ, સ્ટાફ અને સેટિંગ્સ) યથાવત રહેશે.'
            : 'Are you sure you want to clear all invoices, purchases, payments, and expenses to 0-0? All Masters (Parts Catalog, Unit Masters, Suppliers, Staff, Settings) will remain intact.'
        }
        confirmButtonText={lang === 'gu' ? 'હા, 0-0 ક્લિયર કરો' : 'Yes, Clear to 0-0'}
        cancelButtonText={lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetConfirm(false)}
        lang={lang}
      />
    </div>
  );
};
