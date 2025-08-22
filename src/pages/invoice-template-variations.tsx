import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, FileText, Palette } from "lucide-react";

export default function InvoiceTemplateVariations() {
  const templates = [
    {
      id: "modern",
      name: "Modern Template",
      description: "Clean, professional layout with company branding",
      route: "/invoices/:id/modern-template",
      previewImage: "/api/placeholder/300/400",
      features: [
        "Company Logo",
        "Bilingual Support",
        "QR Code",
        "Tax Compliance",
      ],
    },
    {
      id: "classic",
      name: "Classic Template",
      description: "Traditional invoice layout with standard formatting",
      route: "/invoices/:id/classic-template",
      previewImage: "/api/placeholder/300/400",
      features: [
        "Simple Layout",
        "Easy to Read",
        "Print Friendly",
        "Standard Format",
      ],
    },
    {
      id: "minimal",
      name: "Minimal Template",
      description: "Clean and simple design with minimal elements",
      route: "/invoices/:id/minimal-template",
      previewImage: "/api/placeholder/300/400",
      features: [
        "Minimal Design",
        "Fast Loading",
        "Clean Typography",
        "Compact Layout",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Invoices
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice Templates
              </h1>
              <p className="text-gray-600">
                Choose from different invoice template designs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card
              key={template.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preview Area */}
                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <Palette className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Template Preview</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600">{template.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Features:
                  </h4>
                  <ul className="grid grid-cols-2 gap-1">
                    {template.features.map((feature, index) => (
                      <li
                        key={index}
                        className="text-xs text-gray-600 flex items-center"
                      >
                        <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      // For now, just show a placeholder
                      alert(`Preview for ${template.name} template`);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Link
                    href={template.route.replace(":id", "1")}
                    className="flex-1"
                  >
                    <Button size="sm" className="w-full text-xs">
                      Use Template
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                Need a Custom Template?
              </h3>
              <p className="text-gray-600 mb-4">
                Contact support to create a custom invoice template that matches
                your brand guidelines and specific requirements.
              </p>
              <Button variant="outline">Request Custom Template</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
