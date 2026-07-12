import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  NotificationSystem,
  useNotifications,
} from "@/components/notification-system";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  onMenuClick?: () => void;
}

/** Route → breadcrumb mapping (section, page title) */
const ROUTE_MAP: Record<string, { section?: string; title: string }> = {
  "/": { title: "Dashboard" },
  "/dashboard": { title: "Dashboard" },
  "/projects": { section: "Project Management", title: "Projects" },
  "/inventory": { section: "Project Management", title: "Inventory" },
  "/categories": { section: "Project Management", title: "Categories" },
  "/workforce": { section: "WorkForce", title: "Employees" },
  "/manpower": { section: "WorkForce", title: "Manpower" },
  "/attendance": { section: "WorkForce", title: "Attendance" },
  "/wages": { section: "WorkForce", title: "Wages" },
  "/quotations": { section: "Financials", title: "Quotations" },
  "/invoices": { section: "Financials", title: "Invoices" },
  "/fixed-assets": { section: "Financials", title: "Fixed Assets" },
  "/purchases": { section: "Financials", title: "Purchases" },
  "/suppliers": { section: "Financials", title: "Suppliers" },
  "/financial-reports": { section: "Financials", title: "Financial Reports" },
  "/reports": { section: "Reports", title: "Reports & Analytics" },
  "/monthly-payments": { section: "Reports", title: "Monthly Payments" },
  "/monthly-reports": { section: "Reports", title: "Monthly Reports" },
  "/ali-al-yamny": { title: "Ali Al Yamny" },
  "/settings": { title: "Settings" },
};

function Breadcrumbs() {
  const [location] = useLocation();
  const match = ROUTE_MAP[location];

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex"
    >
      <Link href="/dashboard">
        <span className="cursor-pointer font-medium text-muted-foreground transition-colors hover:text-foreground">
          Home
        </span>
      </Link>
      {match?.section && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate text-muted-foreground">
            {match.section}
          </span>
        </>
      )}
      {match && match.title !== "Dashboard" && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-semibold text-foreground">
            {match.title}
          </span>
        </>
      )}
    </nav>
  );
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    urgentCount,
  } = useNotifications();

  const handleSignOut = () => {
    logout();
    setLocation("/login");
  };

  const handleSettingsClick = () => {
    setLocation("/settings");
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
      "U"
    : "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 lg:px-6">
        {/* Left: menu + brand (mobile) + breadcrumbs (desktop) */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>

          <h1 className="truncate text-base font-bold tracking-tight text-foreground lg:hidden">
            <span className="hidden sm:inline">Diouf Al-Sharq</span>
            <span className="sm:hidden">D.A.S</span>
          </h1>

          <Breadcrumbs />
        </div>

        {/* Center: search */}
        <div className="hidden max-w-md flex-1 md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects, employees, invoices…"
              className="h-9 w-full bg-muted/60 pl-10 focus:bg-card"
            />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant={urgentCount > 0 ? "destructive" : "default"}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full p-0 px-1 text-[10px] font-bold"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <NotificationSystem
                notifications={notifications}
                onMarkRead={markAsRead}
                onMarkAllRead={markAllAsRead}
                onDelete={deleteNotification}
              />
            </PopoverContent>
          </Popover>

          <ThemeToggle />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                {initials}
                <span className="sr-only">User menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">
                    {user ? `${user.firstName} ${user.lastName}` : "User"}
                  </p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {user?.email || "user@diouf-alsharq.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleSettingsClick}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
