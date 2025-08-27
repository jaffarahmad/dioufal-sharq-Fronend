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
  duration = 3000,
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
    switch (type) {
      case "success":
        return "bg-green-50/70 border-green-200/70 text-green-800 dark:bg-green-900/10 dark:border-green-800/50 dark:text-green-300";
      case "error":
        return "bg-red-50/70 border-red-200/70 text-red-800 dark:bg-red-900/10 dark:border-red-800/50 dark:text-red-300";
      case "warning":
        return "bg-yellow-50/70 border-yellow-200/70 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800/50 dark:text-yellow-300";
      case "info":
        return "bg-gray-50/70 border-gray-200/70 text-gray-800 dark:bg-gray-900/10 dark:border-gray-800/50 dark:text-gray-300";
      default:
        return "bg-gray-50/70 border-gray-200/70 text-gray-800 dark:bg-gray-900/10 dark:border-gray-800/50 dark:text-gray-300";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-in-out",
        isVisible && !isExiting
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-full",
        isExiting && "opacity-0 translate-x-full"
      )}
    >
      <div
        className={cn(
          "border rounded-lg shadow-lg p-4 relative",
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
            className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
