import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  TrendingUp,
  FileText,
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
  User,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, type ComponentType } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
      { name: "Invoices", href: "/invoices", icon: Receipt },
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

function NavLeaf({
  href,
  icon: Icon,
  name,
  active,
  onItemClick,
  isCollapsed,
  nested,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  name: string;
  active: boolean;
  onItemClick?: () => void;
  isCollapsed?: boolean;
  nested?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        onClick={onItemClick}
        title={isCollapsed ? name : undefined}
        className={cn(
          "group relative flex cursor-pointer items-center rounded-lg text-sm transition-colors duration-150",
          isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
          nested && !isCollapsed && "py-1.5",
          active
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "font-medium text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )}
      >
        {/* Active indicator bar */}
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-opacity",
            active ? "opacity-100" : "opacity-0"
          )}
        />
        <Icon
          className={cn(
            "h-[18px] w-[18px] flex-shrink-0 transition-colors",
            active
              ? "text-sidebar-primary"
              : "text-sidebar-muted group-hover:text-sidebar-foreground"
          )}
        />
        {!isCollapsed && <span className="truncate">{name}</span>}
      </div>
    </Link>
  );
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

  const isActive = (href?: string) =>
    !!href &&
    (location === href || (location === "/" && href === "/dashboard"));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-4 py-4">
        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "justify-between gap-2"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <HardHat className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold tracking-tight text-white">
                  Diouf Al-Sharq
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-widest text-sidebar-muted">
                  Construction
                </p>
              </div>
            )}
          </div>
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
        {onToggleCollapse && isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="mt-3 flex h-8 w-full items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map(item => (
            <div key={item.name}>
              {item.children ? (
                <div className={cn(!isCollapsed && "pb-1")}>
                  {isCollapsed ? (
                    // Collapsed: show children as flat icons under a divider
                    <div className="my-2 space-y-1 border-t border-sidebar-border pt-2">
                      {item.children.map(child => (
                        <NavLeaf
                          key={child.href}
                          href={child.href}
                          icon={child.icon}
                          name={child.name}
                          active={isActive(child.href)}
                          onItemClick={onItemClick}
                          isCollapsed
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className="flex w-full items-center justify-between rounded-lg px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-muted transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                      >
                        <span className="truncate">{item.name}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                            expandedItems.includes(item.name)
                              ? "rotate-0"
                              : "-rotate-90"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-200 ease-out",
                          expandedItems.includes(item.name)
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]"
                        )}
                      >
                        <div className="min-h-0 space-y-0.5 overflow-hidden">
                          {item.children.map(child => (
                            <NavLeaf
                              key={child.href}
                              href={child.href}
                              icon={child.icon}
                              name={child.name}
                              active={isActive(child.href)}
                              onItemClick={onItemClick}
                              nested
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <NavLeaf
                  href={item.href!}
                  icon={item.icon}
                  name={item.name}
                  active={isActive(item.href)}
                  onItemClick={onItemClick}
                  isCollapsed={isCollapsed}
                />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer strip */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border px-4 py-3">
          <p className="text-[11px] font-medium text-sidebar-muted">
            Diouf Al-Sharq CMS · v1.0
          </p>
        </div>
      )}
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
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={cn(
          "hidden flex-shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out md:flex",
          isCollapsed ? "w-16" : "w-64 lg:w-72"
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
          className="w-72 border-r border-sidebar-border bg-sidebar p-0 sm:w-80"
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
