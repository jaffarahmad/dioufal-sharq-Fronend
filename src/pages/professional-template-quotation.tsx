import React from "react";
import ProfessionalTemplate from "../components/professional-template";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProfessionalTemplateQuotation() {
  const [, setLocation] = useLocation();

  const handleSave = (data: any) => {
    console.log("Saving professional quotation:", data);
    // Here you would typically save to your backend
    // For now, we'll just log the data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50 print-hidden">
        <Button
          onClick={() => setLocation("/quotations")}
          variant="outline"
          size="sm"
          className="bg-white shadow-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotations
        </Button>
      </div>

      <ProfessionalTemplate type="quotation" onSave={handleSave} />
    </div>
  );
}
