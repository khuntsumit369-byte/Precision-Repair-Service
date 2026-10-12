import React from 'react';
import { Trash2 } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemDetails?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onClose: () => void;
  lang?: 'gu' | 'en';
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemDetails,
  confirmButtonText,
  cancelButtonText,
  onConfirm,
  onClose,
  lang = 'gu',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {title || (lang === 'gu' ? 'ડિલીટ કરવાની પુષ્ટિ કરો' : 'Confirm Delete')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {message ||
                  (lang === 'gu'
                    ? 'શું તમે ખરેખર આ રેકોર્ડ કાયમ માટે ડિલીટ કરવા માંગો છો?'
                    : 'Are you sure you want to permanently delete this record?')}
              </p>
              {itemDetails && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 break-words">
                  {itemDetails}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {cancelButtonText || (lang === 'gu' ? 'ના, રદ કરો' : 'Cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-200"
          >
            {confirmButtonText || (lang === 'gu' ? 'હા, ડિલીટ કરો' : 'Yes, Delete')}
          </button>
        </div>
      </div>
    </div>
  );
};
