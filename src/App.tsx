import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { NotificationProvider } from "@/hooks/use-notifications";
import { ThemeProvider } from "@/contexts/theme-context";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Inventory from "@/pages/inventory";
import Categories from "@/pages/categories";
import Manpower from "@/pages/manpower";
import AttendancePage from "@/pages/attendance";
import WagesPage from "@/pages/wages";
import Workforce from "@/pages/workforce";
import Quotations from "@/pages/quotations";

import ExactQuotation from "@/pages/exact-quotation";
import CreateQuotation from "@/pages/create-quotation";
import ProfessionalQuotation from "@/pages/professional-quotation";
import AmaniQuotation from "@/pages/amani-quotation";

import ProfessionalTemplateQuotation from "@/pages/professional-template-quotation";
import QuotationPreview from "@/pages/quotation-preview";
import Invoices from "@/pages/invoices";
import InvoicePreview from "@/pages/invoice-preview";
import ViewInvoicePage from "@/pages/view-invoice";
import TaxInvoicePage from "@/pages/tax-invoice";
import InvoiceTemplateVariations from "@/pages/invoice-template-variations";
import ModernInvoiceTemplate from "@/pages/modern-invoice-template";
import AssetPathsInvoiceTemplate from "@/pages/asset-paths-invoice";
import FixedAssets from "@/pages/fixed-assets";
import Purchases from "@/pages/purchases";
import Suppliers from "@/pages/suppliers";
import Financials from "@/pages/financials";
import FinancialReports from "@/pages/financial-reports";
import Reports from "@/pages/reports";
import MonthlyPayments from "@/pages/monthly-payments";
import MonthlyReports from "@/pages/monthly-reports";
import Settings from "@/pages/settings";
import AliAlYamny from "@/pages/ali-al-yamny";
import DeleteProjectData from "@/components/delete-project-data";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
        setSidebarOpen(false);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 bg-background p-3 sm:p-4 lg:p-6">
            <div className="max-w-full">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />

                {/* Project Management Routes */}
                <Route path="/projects" component={Projects} />
                <Route path="/inventory" component={Inventory} />
                <Route path="/categories" component={Categories} />
                <Route path="/ali-al-yamny" component={AliAlYamny} />

                {/* WorkForce Routes */}
                <Route path="/manpower" component={Manpower} />
                <Route path="/attendance" component={AttendancePage} />
                <Route path="/wages" component={WagesPage} />
                <Route path="/workforce" component={Workforce} />

                {/* Financial Routes */}
                <Route path="/quotations" component={Quotations} />

                <Route path="/quotations/exact" component={ExactQuotation} />
                <Route
                  path="/quotations/professional"
                  component={ProfessionalTemplateQuotation}
                />

                <Route path="/exact-quotation" component={ExactQuotation} />
                <Route path="/create-quotation" component={CreateQuotation} />
                <Route
                  path="/professional-quotation"
                  component={ProfessionalQuotation}
                />
                <Route
                  path="/amani-quotation"
                  component={AmaniQuotation}
                />

                <Route path="/quotation-preview" component={QuotationPreview} />
                <Route path="/invoices" component={Invoices} />
                <Route path="/invoices/:id" component={InvoicePreview} />
                <Route path="/invoice-preview/:id" component={InvoicePreview} />
                <Route path="/view-invoice/:id" component={ViewInvoicePage} />
                <Route path="/tax-invoice/:id" component={TaxInvoicePage} />
                <Route
                  path="/invoice-templates/:id"
                  component={InvoiceTemplateVariations}
                />
                <Route
                  path="/modern-invoice/:id"
                  component={ModernInvoiceTemplate}
                />
                <Route
                  path="/asset-paths-invoice/:id"
                  component={AssetPathsInvoiceTemplate}
                />
                <Route path="/fixed-assets" component={FixedAssets} />
                <Route path="/purchases" component={Purchases} />
                <Route path="/suppliers" component={Suppliers} />
                <Route path="/financials" component={Financials} />
                <Route path="/financial-reports" component={FinancialReports} />

                {/* Reports Route */}
                <Route path="/reports" component={Reports} />
                <Route path="/monthly-payments" component={MonthlyPayments} />
                <Route path="/monthly-reports" component={MonthlyReports} />

                {/* Settings Route */}
                <Route path="/settings" component={Settings} />
                
                {/* Data Management Route */}
                <Route path="/delete-project-data" component={DeleteProjectData} />

                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Router() {
  const [location] = useLocation();

  // Show login page only when explicitly navigating to /login
  if (location === "/login") {
    return <LoginPage />;
  }

  // Show main app for all other routes (direct access to dashboard)
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
