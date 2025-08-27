import { Button } from "@/components/ui/button";
import { Plus, FileText, Award } from "lucide-react";
import { useLocation } from "wouter";

export default function Quotations() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Quotations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Professional quotation template for DIOUF AL-SHARQ
          </p>
        </div>

        {/* Quotation Options */}
        <div className="flex justify-center max-w-4xl mx-auto">
          {/* Professional Quotation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 max-w-md">
            <FileText className="h-16 w-16 text-pink-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Professional Template
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Use our professional template with company branding and official
              layout
            </p>
            <Button
              onClick={() => setLocation("/professional-quotation")}
              size="lg"
              className="bg-pink-600 hover:bg-pink-700 text-white w-full"
            >
              <FileText className="h-5 w-5 mr-2" />
              Create Professional
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
