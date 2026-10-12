import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  ExternalLink,
  Copy,
  Info,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface AndroidAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'gu' | 'en';
}

export const AndroidAppInstallModal: React.FC<AndroidAppInstallModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'apk' | 'guide'>('quick');

  const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-b5tgtekvtt2qixd4kwbtyq-955944740019.asia-east1.run.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      setInstalling(false);
    }
  };

  const pwabuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <img
                  src="/pwa-192x192.png"
                  alt="App Icon"
                  className="w-full h-full object-contain rounded-xl drop-shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold border border-emerald-300/30 mb-1">
                  <Smartphone className="w-3 h-3" />
                  <span>{lang === 'gu' ? 'Android ઇન્સ્ટોલેશન સહાયક' : 'Android App Assistant'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {lang === 'gu'
                    ? 'Android મોબાઇલમાં એપ ઇન્સ્ટોલ કરો'
                    : 'Install App on Android Device'}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 font-normal mt-0.5">
                  {lang === 'gu'
                    ? 'તમારા Android ફોનમાં ડાયરેક્ટ ઇન્સ્ટોલ કરો અથવા APK ફાઇલ મેળવો'
                    : 'Install directly on your phone or generate a standalone APK'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-2 mt-5 bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'quick'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              {lang === 'gu' ? '⚡ ડાયરેક્ટ ઇન્સ્ટોલ (સરળ)' : '⚡ Direct Install'}
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'apk'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              {lang === 'gu' ? '📦 APK ફાઇલ બનાવવી' : '📦 Generate APK'}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                activeTab === 'guide'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10'
              }`}
            >
              {lang === 'gu' ? '📖 સ્ટેપ-બાય-સ્ટેપ માર્ગદર્શિકા' : '📖 Step Guide'}
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* TAB 1: QUICK DIRECT INSTALL */}
          {activeTab === 'quick' && (
            <div className="space-y-5">
              {/* If already installed */}
              {isInstalled ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">
                      {lang === 'gu'
                        ? 'આ એપ તમારા ફોન/ડિવાઇસમાં સફળતાપૂર્વક ઇન્સ્ટોલ કરેલી છે!'
                        : 'This App is already installed on your device!'}
                    </h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      {lang === 'gu'
                        ? 'તમે તમારા હોમ સ્ક્રીન કે એપ લિસ્ટમાંથી PRECISION REPAIR SERVICE એપ ખોલીને ઓફલાઇન પણ ઉપયોગ કરી શકો છો.'
                        : 'You can launch PRECISION REPAIR SERVICE directly from your app drawer or home screen.'}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Direct Install Button (When prompt is available) */}
              {isInstallable && !isInstalled && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <h4 className="text-sm font-black text-indigo-950">
                          {lang === 'gu'
                            ? 'એક ક્લિકમાં Android એપ ઇન્સ્ટોલ કરો'
                            : '1-Click Android App Install Ready'}
                        </h4>
                      </div>
                      <p className="text-xs text-indigo-800 mt-1">
                        {lang === 'gu'
                          ? 'ગુગલ ક્રોમ તમારા મોબાઇલમાં ઓટોમેટિક વેબ-એપીકે (WebAPK) બનાવીને હોમ સ્ક્રીન પર સેવ કરશે.'
                          : 'Android Chrome will immediately generate a native WebAPK and pin it to your apps list.'}
                      </p>
                    </div>

                    <button
                      onClick={handleDirectInstall}
                      disabled={installing}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {installing
                          ? (lang === 'gu' ? 'ઇન્સ્ટોલ થઈ રહ્યું છે...' : 'Installing...')
                          : (lang === 'gu' ? 'હમણાં ઇન્સ્ટોલ કરો' : 'Install App Now')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* QR Code and Mobile Link Sharing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Scan to open on Android"
                      className="w-44 h-44 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
                      QR Code Loading...
                    </div>
                  )}
                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {lang === 'gu'
                        ? 'મોબાઈલ કેમેરાથી QR કોડ સ્કેન કરો'
                        : 'Scan QR with Android Camera / Lens'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'gu'
                        ? 'તમારા Android ફોનમાં સીધું ઓપન થશે'
                        : 'Instantly opens on your mobile'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>
                      {lang === 'gu'
                        ? 'Android ફોન માટે લિંક'
                        : 'Link for Android Mobile'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'gu'
                      ? 'આ લિંકને WhatsApp અથવા મેસેજમાં તમારા ફોન પર મોકલીને Google Chrome માં ખોલો:'
                      : 'Copy and send this link to your phone via WhatsApp or Chrome:'}
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 truncate shadow-2xs select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                      title="Copy URL"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'gu' ? 'કોપી થયું!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{lang === 'gu' ? 'કોપી' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>{lang === 'gu' ? 'મહત્વનું સૂચન:' : 'Pro Tip:'} </strong>
                      {lang === 'gu'
                        ? 'ફોનમાં Google Chrome માં આ લિંક ખોલ્યા પછી ઉપર આપેલા 3 ટપકાં (⋮) પર ક્લિક કરી "Install app" અથવા "Add to Home screen" સિલેક્ટ કરો.'
                        : 'Open in Chrome on Android, then tap ⋮ menu and select "Install app" or "Add to Home screen".'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STANDALONE APK CREATION */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950">
                      {lang === 'gu'
                        ? 'સ્વતંત્ર .APK ફાઇલ કેવી રીતે ડાઉનલોડ કરવી?'
                        : 'How to get a standalone .APK file?'}
                    </h4>
                    <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                      {lang === 'gu'
                        ? 'આ સોફ્ટવેર Progressive Web App (PWA) ટેકનોલોજી પર બનેલું છે. આ સોફ્ટવેરની સત્તાવાર .APK ફાઇલ Microsoft / Google સપોર્ટેડ PWABuilder ટૂલ દ્વારા માત્ર 2 મિનિટમાં ફ્રીમાં જનરેટ કરી શકાય છે!'
                        : 'This software is built as a production PWA. You can package it into a signed .apk file using PWABuilder in just 2 minutes!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PWABuilder 1-click CTA */}
              <div className="p-5 bg-white rounded-2xl border-2 border-indigo-600/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      Official Tool
                    </span>
                    <h5 className="font-bold text-sm text-slate-900">
                      PWABuilder Android APK Generator
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {lang === 'gu'
                      ? 'તમારા આ સોફ્ટવેરની લિંક સાથે ડાયરેક્ટ APK બિલ્ડર ઓપન થશે. ત્યાંથી "Build Android APK" બટન દબાવો.'
                      : 'Opens PWABuilder pre-loaded with your live app URL. Just click "Package for Android" to download your APK.'}
                  </p>
                </div>

                <a
                  href={pwabuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-sm"
                >
                  <span>{lang === 'gu' ? 'PWABuilder માં APK બનાવો' : 'Open PWABuilder'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Why WebAPK is better than normal APK */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'gu'
                      ? 'Google Chrome ની WebAPK શા માટે સૌથી શ્રેષ્ઠ છે?'
                      : 'Why Android WebAPK is superior to raw APK:'}
                  </span>
                </h5>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>{lang === 'gu' ? 'કોઈ પરમિશનની માથાકૂટ નહીં:' : 'No security warnings:'}</strong>{' '}
                    {lang === 'gu'
                      ? 'સામાન્ય APK ઇન્સ્ટોલ કરતી વખતે "Unknown Sources" વોર્નિંગ આવે છે, જ્યારે Chrome WebAPK ગૂગલ પ્લે સર્વિસ દ્વારા સુરક્ષિત રીતે ઇન્સ્ટોલ થાય છે.'
                      : 'Installs securely without "Unknown Sources" untrusted warnings.'}
                  </li>
                  <li>
                    <strong>{lang === 'gu' ? 'ઓટો અપડેટ:' : 'Automatic Updates:'}</strong>{' '}
                    {lang === 'gu'
                      ? 'જ્યારે પણ તમે સોફ્ટવેરમાં કોઈ નવો ફેરફાર કરશો, ત્યારે ફોનમાં આપોઆપ અપડેટ થઈ જશે, નવેસરથી APK ઇન્સ્ટોલ નહીં કરવી પડે.'
                      : 'App updates automatically without re-installing new APK files manually.'}
                  </li>
                  <li>
                    <strong>{lang === 'gu' ? 'ઓફલાઇન સપોર્ટ:' : 'Offline Support:'}</strong>{' '}
                    {lang === 'gu'
                      ? 'મોબાઈલમાં ઇન્ટરનેટ ન હોય તો પણ બિલિંગ, કેશબુક અને સ્ટોક જોઈ શકાય છે.'
                      : 'Works even without active internet connection using Service Worker caching.'}
                  </li>
                  <li>
                    <strong>{lang === 'gu' ? 'ઓછી મેમરી:' : 'Lightweight:'}</strong>{' '}
                    {lang === 'gu'
                      ? 'મોબાઇલમાં માત્ર 3-5 MB જગ્યા રોકે છે અને સુપરફાસ્ટ ચાલે છે.'
                      : 'Consumes barely 5 MB storage and runs extremely fast.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP MOBILE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'gu' ? 'Android ફોન માટે 3 સરળ સ્ટેપ્સ:' : '3 Simple Steps for Android:'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                      1
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">
                      {lang === 'gu' ? 'ક્રોમમાં ખોલો' : 'Open in Chrome'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {lang === 'gu'
                        ? 'આ સોફ્ટવેરની લિંક તમારા Android ફોનમાં Google Chrome બ્રાઉઝરમાં ઓપન કરો.'
                        : 'Open this application URL in Google Chrome on your Android mobile device.'}
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>Google Chrome</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                      2
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 mb-1">
                      {lang === 'gu' ? '3 ટપકાં (⋮) મેનૂ' : 'Tap 3 Dots Menu'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {lang === 'gu'
                        ? 'Chrome ના ઉપર જમણી બાજુના 3 ટપકાં (⋮) પર ક્લિક કરો અને "Install app" અથવા "Add to Home screen" પસંદ કરો.'
                        : 'Tap the top-right 3 dots menu and select "Install app" or "Add to Home screen".'}
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-indigo-700 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>"Install App"</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                      3
                    </div>
                    <h5 className="text-xs font-bold text-emerald-950 mb-1">
                      {lang === 'gu' ? 'એપ તૈયાર!' : 'App Ready!'}
                    </h5>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      {lang === 'gu'
                        ? 'તમારા ફોનની હોમ સ્ક્રીન અને એપ લિસ્ટમાં PRECISION નો લોગો આવી જશે. ક્લિક કરતાં જ ફૂલ સ્ક્રીનમાં ઓપન થશે!'
                        : 'Precision Repair Service app icon will appear on your home screen and run standalone.'}
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Native Standalone UI</span>
                  </div>
                </div>
              </div>

              {/* iOS Note */}
              <div className="p-3.5 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong>iPhone / iPad (iOS) વપરાશકર્તાઓ માટે: </strong>
                  Safari બ્રાઉઝરમાં ઓપન કરી નીચેના <strong>Share</strong> બટન પર ટેપ કરો અને <strong>"Add to Home Screen"</strong> પસંદ કરો.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] text-slate-500 font-medium">
              PWA v1.0.0 • Android WebAPK Compliant
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            {lang === 'gu' ? 'બંધ કરો' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
