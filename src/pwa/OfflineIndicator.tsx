import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
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

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl shadow-amber-500/20 border border-amber-400/30 animate-in fade-in slide-in-from-bottom-2">
        <WifiOff className="w-4 h-4 animate-pulse text-amber-100" />
        <span>حالت آفلاین (Offline Mode) – داده‌های کش محلی در دسترس هستند</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl shadow-emerald-500/20 border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-2">
        <Wifi className="w-4 h-4 text-emerald-100" />
        <span>اتصال مجدد برقرار شد (Back Online)</span>
      </div>
    );
  }

  return null;
};
