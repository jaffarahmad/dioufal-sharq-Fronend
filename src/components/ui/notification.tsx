import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Notification({
  id,
  type,
  title,
  message,
  duration = 1000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getTypeStyles = () => {
    // All notifications now use the same green styling
    return "bg-green-500 text-white";
  };

  const getIconColor = () => {
    // All icons now use white color to match the text
    return "text-white";
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm w-full transition-all duration-300 ease-in-out",
        isVisible && !isExiting
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4",
        isExiting && "opacity-0 translate-y-4"
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-xl shadow-xl ring-1 ring-black/5 p-4 relative",
          getTypeStyles()
        )}
      >
        <div className="flex items-start space-x-3">
          <div className={cn("flex-shrink-0 mt-0.5", getIconColor())}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{title}</p>
            {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-500"
            aria-label="Close notification"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
