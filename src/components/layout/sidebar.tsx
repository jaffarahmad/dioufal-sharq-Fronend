import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  TrendingUp,
  FileText,
  HardHat,
  Package,
  Tag,
  UserCheck,
  Clock,
  DollarSign,
  Receipt,
  FileText as FileContract,
  Building,
  ShoppingCart,
  Truck,
  Settings,
  UserCog,
  User,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import logoImage from "@assets/image_17540348329.png";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Project Management",
    icon: FolderOpen,
    children: [
      { name: "Projects", href: "/projects", icon: FolderOpen },
      { name: "Inventory", href: "/inventory", icon: Package },
      { name: "Categories", href: "/categories", icon: Tag },
    ],
  },
  {
    name: "WorkForce",
    icon: Users,
    children: [
      { name: "Employees", href: "/workforce", icon: Users },
      { name: "Manpower", href: "/manpower", icon: UserCheck },
      { name: "Attendance", href: "/attendance", icon: Clock },
      { name: "Wages", href: "/wages", icon: DollarSign },
    ],
  },
  {
    name: "Financials",
    icon: TrendingUp,
    children: [
      { name: "Quotations", href: "/quotations", icon: FileContract },
      { name: "Bill", href: "/invoices", icon: Receipt },
      { name: "Fixed Assets", href: "/fixed-assets", icon: Building },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart },
      { name: "Suppliers", href: "/suppliers", icon: Truck },
      { name: "Financial Reports", href: "/financial-reports", icon: FileText },
    ],
  },
  {
    name: "Reports",
    icon: FileText,
    children: [
      { name: "Reports & Analytics", href: "/reports", icon: FileText },
      { name: "Monthly Payments", href: "/monthly-payments", icon: Calendar },
      { name: "Monthly Reports", href: "/monthly-reports", icon: FileText },
    ],
  },
  { name: "Ali Al Yamny", href: "/ali-al-yamny", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  onItemClick,
  isCollapsed,
  onToggleCollapse,
}: {
  onItemClick?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Project Management",
    "WorkForce",
    "Financials",
    "Reports",
  ]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev =>
      prev.includes(itemName)
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-center w-full"
            )}
          >
            {!isCollapsed && (
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Diouf Al-Sharq
              </h1>
            )}
            {isCollapsed && (
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                D
              </h1>
            )}
          </div>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map(item => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.name)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isCollapsed ? "justify-center" : "justify-between"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div
                      className={cn(
                        "flex items-center min-w-0",
                        isCollapsed ? "justify-center" : "space-x-3"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </div>
                    {!isCollapsed &&
                      (expandedItems.includes(item.name) ? (
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      ))}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.name) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map(child => (
                        <Link key={child.href} href={child.href}>
                          <div
                            onClick={onItemClick}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                              location === child.href
                                ? "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{child.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link href={item.href}>
                  <div
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isCollapsed ? "justify-center" : "space-x-3",
                      location === item.href ||
                        (location === "/" && item.href === "/dashboard")
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-800 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop & Tablet Sidebar */}
      <aside
        className={cn(
          "hidden md:flex bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300",
          isCollapsed
            ? "w-16" // Collapsed: icon only
            : "w-64 lg:w-72" // Responsive: 64 on tablet, 72 on desktop
        )}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="left"
          className="w-72 sm:w-80 p-0 bg-white dark:bg-gray-900"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onItemClick={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
