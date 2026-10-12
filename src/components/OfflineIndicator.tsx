import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC<{ lang: 'gu' | 'en' }> = ({ lang }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl animate-bounce print:hidden">
      <WifiOff className="w-4 h-4" />
      <span>
        {lang === 'gu'
          ? 'ઓફલાઇન મોડ — કેશ્ડ ડેટાનો ઉપયોગ થઈ રહ્યો છે.'
          : 'Offline Mode — Using cached data.'}
      </span>
    </div>
  );
};
