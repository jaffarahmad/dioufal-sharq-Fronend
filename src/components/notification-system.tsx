import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  Building,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  category: "project" | "financial" | "workforce" | "system";
  timestamp: Date;
  read: boolean;
  urgent: boolean;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

const getNotificationIcon = (type: string, category: string) => {
  if (type === "error")
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (type === "warning")
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  if (type === "success")
    return <CheckCircle className="h-4 w-4 text-green-500" />;

  switch (category) {
    case "financial":
      return <DollarSign className="h-4 w-4 text-blue-500" />;
    case "workforce":
      return <Users className="h-4 w-4 text-purple-500" />;
    case "project":
      return <Building className="h-4 w-4 text-orange-500" />;
    case "system":
      return <FileText className="h-4 w-4 text-gray-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    case "success":
      return "default";
    default:
      return "outline";
  }
};

export function NotificationSystem({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  className = "",
}: NotificationSystemProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length;

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant={urgentCount > 0 ? "destructive" : "default"}
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </div>
            Notifications
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.read
                        ? "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                        : ""
                    } ${notification.urgent ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(
                          notification.type,
                          notification.category
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`text-sm font-medium ${!notification.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                              >
                                {notification.title}
                              </h4>
                              {notification.urgent && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Urgent
                                </Badge>
                              )}
                              <Badge
                                variant={getNotificationBadgeVariant(
                                  notification.type
                                )}
                                className="text-xs"
                              >
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(notification.timestamp, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onMarkRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Budget Alert: Al-Riyadh Commercial Complex",
      message:
        "Project expenses have exceeded 85% of allocated budget. Review required.",
      type: "warning",
      category: "financial",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      urgent: true,
    },
    {
      id: "2",
      title: "New Employee Added",
      message: "Khalid Al-Ahmad has been added to the Construction team.",
      type: "success",
      category: "workforce",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      urgent: false,
    },
    {
      id: "3",
      title: "Project Milestone Completed",
      message:
        "Jeddah Office Building - Foundation work completed successfully.",
      type: "success",
      category: "project",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      read: true,
      urgent: false,
    },
    {
      id: "4",
      title: "System Backup Completed",
      message: "Weekly database backup completed successfully at 2:00 AM.",
      type: "info",
      category: "system",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      read: true,
      urgent: false,
    },
    {
      id: "5",
      title: "Attendance Alert",
      message: "3 employees marked as absent today without prior notice.",
      type: "warning",
      category: "workforce",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
      read: false,
      urgent: false,
    },
  ]);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp">
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permission granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    unreadCount,
    urgentCount,
  };
}
