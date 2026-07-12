import { Button } from "@/components/ui/button";
import { Plus, FileText, Award } from "lucide-react";
import { useLocation } from "wouter";

export default function Quotations() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-muted/50 p-6 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Quotations
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional quotation template for DIOUF AL-SHARQ
          </p>
        </div>

        {/* Quotation Options */}
        <div className="flex justify-center gap-6 max-w-4xl mx-auto">
          {/* Professional Quotation */}
          <div className="bg-card rounded-xl shadow-lg p-8 border border-border max-w-md">
            <FileText className="h-16 w-16 text-pink-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Professional Template
            </h2>
            <p className="text-muted-foreground mb-6">
              Use our professional template with company branding and official
              layout
            </p>
            <Button
              onClick={() => setLocation("/professional-quotation")}
              size="lg"
              variant="primary"
              className="w-full"
            >
              <FileText className="h-5 w-5 mr-2" />
              Create Professional
            </Button>
          </div>

          {/* AMANI MUHAMMAD Template */}
          <div className="bg-card rounded-xl shadow-lg p-8 border border-border max-w-md">
            <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-3">
              AMANI MUHAMMAD
            </h2>
            <p className="text-muted-foreground mb-6">
              Professional template customized for AMANI MUHAMMAD AL OTAIBI company branding
            </p>
            <Button
              onClick={() => setLocation("/amani-quotation")}
              size="lg"
              variant="primary"
              className="w-full"
            >
              <Award className="h-5 w-5 mr-2" />
              Create AMANI MUHAMMAD
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
