import React, { useRef, useState, useEffect } from 'react';
import {
  Wrench,
  FileText,
  PlusCircle,
  Tag,
  Boxes,
  Users,
  Settings,
  Globe,
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Upload,
  Camera,
  Layers,
  Smartphone,
  Download,
} from 'lucide-react';
import { WorkshopSettings } from '../types';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  settings: WorkshopSettings;
  lang: 'gu' | 'en';
  onToggleLang: () => void;
  onOpenAndroidInstall?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  settings,
  lang,
  onToggleLang,
  onOpenAndroidInstall,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: lang === 'gu' ? 'ડેશબોર્ડ' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'invoices',
      label: lang === 'gu' ? 'બિલિંગ & ઇનવોઇસ' : 'Invoices',
      icon: FileText,
    },
    {
      id: 'new-invoice',
      label: lang === 'gu' ? '+ નવું બિલ' : '+ New Bill',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'parts-stock',
      label: lang === 'gu' ? 'પાર્ટ્સ ખરીદી & સ્ટોક' : 'Parts & Stock',
      icon: Boxes,
    },
    {
      id: 'cashflow',
      label: lang === 'gu' ? 'ખર્ચ & કેશ ફ્લો' : 'Expense & Cash Flow',
      icon: Wallet,
    },
    {
      id: 'masters',
      label: lang === 'gu' ? 'માસ્ટર્સ (Masters)' : 'Masters',
      icon: Layers,
    },
    {
      id: 'tracker',
      label: lang === 'gu' ? 'યુનિટ ટ્રેકિંગ' : 'Unit Tracker',
      icon: Tag,
    },
    {
      id: 'customers',
      label: lang === 'gu' ? 'ખાતાવહી' : 'Ledger',
      icon: Users,
    },
    {
      id: 'settings',
      label: lang === 'gu' ? 'સેટિંગ્સ' : 'Settings',
      icon: Settings,
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Workshop Info with Official Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <img
              src={settings.logoUrl || '/logo.jpg'}
              alt="Precision Logo"
              className="w-10 h-10 object-contain rounded-xl bg-white shadow-xs p-0.5 border border-slate-200 shrink-0"
              onError={(e) => {
                // Fallback to logo.png if needed
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />

            <div
              onClick={() => onSelectTab('dashboard')}
              className="cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase">
                  {settings.workshopName || 'PRECISION REPAIR SERVICE'}
                </span>
                <span className="hidden xl:inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  Service & Billing
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {lang === 'gu' ? settings.workshopNameGu : settings.tagline}
              </p>
            </div>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.highlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all mx-1"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Language Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{lang === 'gu' ? 'English' : 'ગુજરાતી'}</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Scroll Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  item.highlight
                    ? 'bg-indigo-600 text-white'
                    : isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
