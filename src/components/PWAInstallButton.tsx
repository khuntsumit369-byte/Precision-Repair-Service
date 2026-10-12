import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  lang: 'gu' | 'en';
  onOpenModal?: () => void;
  variant?: 'navbar' | 'prominent' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  onOpenModal,
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  const handleClick = async () => {
    if (onOpenModal) {
      onOpenModal();
      return;
    }

    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    }
  };

  // If already running inside standalone app
  if (isInstalled && variant !== 'prominent') {
    return null;
  }

  if (variant === 'prominent') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        title={lang === 'gu' ? 'Android APK / મોબાઇલ એપ ઇન્સ્ટોલ કરો' : 'Install Android App / APK'}
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
        <span>
          {lang === 'gu' ? 'Android એપ / APK' : 'Install Android App'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors shadow-2xs"
      title={lang === 'gu' ? 'Android APK / મોબાઇલ એપ ઇન્સ્ટોલેશન' : 'Android App / APK Setup'}
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span className="hidden sm:inline-block">
        {lang === 'gu' ? 'Android એપ' : 'Android App'}
      </span>
      <span className="sm:hidden text-[11px]">
        {lang === 'gu' ? 'APK' : 'App'}
      </span>
    </button>
  );
};
