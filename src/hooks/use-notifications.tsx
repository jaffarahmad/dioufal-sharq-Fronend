import { createContext, useContext, useState, ReactNode } from "react";
import {
  Notification,
  type NotificationType,
} from "@/components/ui/notification";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, "id">) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: Omit<NotificationItem, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };

    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const success = (title: string, message?: string, duration?: number) => {
    addNotification({ type: "success", title, message, duration });
  };

  const error = (title: string, message?: string, duration?: number) => {
    addNotification({ type: "error", title, message, duration });
  };

  const warning = (title: string, message?: string, duration?: number) => {
    addNotification({ type: "warning", title, message, duration });
  };

  const info = (title: string, message?: string, duration?: number) => {
    addNotification({ type: "info", title, message, duration });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}

      {/* Render notifications */}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 8}px)`,
              zIndex: 50 + index,
            }}
          >
            <Notification {...notification} onClose={removeNotification} />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
