import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Offline Mode</span>
    </div>
  );
}
