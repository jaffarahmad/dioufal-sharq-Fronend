import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Printer, Type } from "lucide-react";
import logoImage from "@assets/image_17540348329.png";

// Library loading helper function
function loadLibrary(name: string, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[name]) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${name}`));
    document.head.appendChild(script);
  });
}

interface ModernQuotationTemplateProps {
  onSave?: (description: string) => void;
  initialContent?: string;
}

export default function ModernQuotationTemplate({
  onSave,
  initialContent = "",
}: ModernQuotationTemplateProps) {
  const [description, setDescription] = useState(initialContent);
  const [isRTL, setIsRTL] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Update description when initialContent changes
  useEffect(() => {
    setDescription(initialContent);
  }, [initialContent]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    setIsGeneratingPDF(true);

    try {
      // Load html2pdf library if not already loaded
      if (!(window as any).html2pdf) {
        await loadLibrary(
          "html2pdf",
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        );
      }

      const element = printRef.current;
      const opt = {
        margin: [0.8, 0.8, 0.8, 0.8],
        filename: `DIOUF-AL-SHARQ-quotation-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: {
          scale: 4,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
          letterRendering: true,
          imageTimeout: 0,
          removeContainer: true,
          foreignObjectRendering: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
          precision: 16,
          userUnit: 1.0,
          hotfixes: ["px_scaling"],
          encryption: {
            userPassword: "",
            ownerPassword: "",
            userPermissions: ["print", "modify", "copy", "annot-forms"],
          },
        },
      };

      await (window as any).html2pdf().set(opt).from(element).save();
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Fallback to print dialog
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(description);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Control Buttons - Only visible on screen, not in print */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print-hidden">
        <Button
          onClick={() => setIsRTL(!isRTL)}
          variant="outline"
          size="sm"
          className={isRTL ? "bg-blue-50 border-blue-300" : ""}
          title="Toggle text direction"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" title="Print">
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="sm"
          disabled={isGeneratingPDF}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleSave}
          variant="outline"
          size="sm"
          title="Save Content"
        >
          💾
        </Button>
      </div>

      {/* Printable Content */}
      <div
        ref={printRef}
        className="max-w-5xl mx-auto p-10 bg-white min-h-screen"
      >
        {/* Header with Company Branding */}
        <div className="relative pb-8 mb-10">
          {/* Left: English Company Name */}
          <div className="absolute left-0 top-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wide">
              DIOUF AL-SHARQ
            </h1>
            <p className="text-base text-gray-800 font-semibold tracking-wider">
              GENERAL CONTRACTING COMPANY
            </p>
            <p className="text-sm text-gray-700 mt-2 tracking-wide">
              C.R 4030313386 / 7005094516
            </p>
          </div>

          {/* Center: Company Logo */}
          <div className="flex justify-center pt-3">
            <img
              src={logoImage}
              alt="Company Logo"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* Right: Arabic Company Name */}
          <div className="absolute right-0 top-0 text-right" dir="rtl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ضيوف الشرق
            </h1>
            <p className="text-base text-gray-800 font-semibold">
              شركة المقاولات العامة
            </p>
            <p className="text-sm text-gray-700 mt-2">
              س.ت ٤٠٣٠٣١٣٣٨٦ / ٧٠٠٥٠٩٤٥١٦
            </p>
          </div>

          {/* Three Red Lines Below Header */}
          <div className="absolute bottom-0 left-0 right-0 space-y-1.5">
            <div className="h-1 bg-red-600 rounded-sm"></div>
            <div className="h-1 bg-red-600 rounded-sm"></div>
            <div className="h-1 bg-red-600 rounded-sm"></div>
          </div>
        </div>

        {/* Main Content Area - Editable Description */}
        <div className="my-16 min-h-[500px]">
          <div className="w-full bg-white rounded-lg shadow-sm print:shadow-none">
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                isRTL
                  ? "اكتب وصف عرض الأسعار هنا..."
                  : "Enter your quotation description here..."
              }
              className="w-full min-h-[500px] text-lg border-none bg-white p-8 resize-none focus:outline-none focus:ring-0 print:bg-white print:border-none print:p-6"
              dir={isRTL ? "rtl" : "ltr"}
              style={{
                fontFamily: isRTL
                  ? "Arial, Tahoma, sans-serif"
                  : "Arial, sans-serif",
                lineHeight: "2.2",
                letterSpacing: "0.02em",
                textAlign: isRTL ? "right" : "left",
                color: "#1a1a1a",
              }}
            />
          </div>
        </div>

        {/* Spacer to push footer to bottom */}
        <div className="flex-grow min-h-[120px]"></div>

        {/* Footer with Red Design */}
        <div className="mt-auto pt-24">
          {/* Three Red horizontal lines with 3 vertical lines on both sides */}
          <div className="relative mb-8">
            {/* Left vertical lines */}
            <div className="absolute left-0 -top-8 flex gap-1.5">
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
            </div>

            {/* Three horizontal lines */}
            <div className="space-y-1.5">
              <div className="w-full h-1 bg-red-600 rounded-sm"></div>
              <div className="w-full h-1 bg-red-600 rounded-sm"></div>
              <div className="w-full h-1 bg-red-600 rounded-sm"></div>
            </div>

            {/* Right vertical lines */}
            <div className="absolute right-0 -top-8 flex gap-1.5">
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
              <div className="w-1 h-14 bg-red-600 rounded-sm"></div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center mt-6">
            <p className="font-semibold text-gray-800 text-base tracking-wide leading-relaxed uppercase">
              Gharnath Street, Opposite Saudi Aramco Complex,
              <br />
              Mushrifa, Jeddah, Kingdom of Saudi Arabia
            </p>
            <p className="text-sm text-gray-600 mt-2 tracking-wider">
              Tel: +966 12 345 6789 | Email: info@diouf-alsharq.com
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            -webkit-font-smoothing: antialiased !important;
            text-rendering: optimizeLegibility !important;
            font-smooth: always !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #ffffff !important;
            color: #1a1a1a !important;
          }
          
          .print-hidden {
            display: none !important;
          }
          
          /* Hide all buttons and controls in PDF */
          button, .button, [role="button"], .controls {
            display: none !important;
          }
          
          /* Enhance text rendering */
          p, h1, h2, h3, h4, h5, h6, span, div {
            color: #1a1a1a !important;
            text-shadow: none !important;
            filter: none !important;
            -webkit-text-stroke: 0 !important;
            letter-spacing: 0.02em !important;
          }

          /* Ensure images render at high quality */
          img {
            image-rendering: high-quality !important;
            image-rendering: -webkit-optimize-contrast !important;
            transform: translateZ(0) !important;
          }
          
          /* Remove all borders and backgrounds from text areas in PDF */
          textarea, input, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            color: #1a1a1a !important;
          }
            box-shadow: none !important;
            resize: none !important;
            outline: none !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            color: #000000 !important;
            font-family: inherit !important;
          }
          
          /* Remove any input styling */
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            color: #000000 !important;
          }
          
          /* Ensure red lines are visible in PDF */
          .bg-red-600 {
            background-color: #dc2626 !important;
            min-height: 2px !important;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
        
        /* Enhanced line visibility for PDF generation */
        .bg-red-600 {
          background-color: #dc2626;
          min-height: 2px;
        }
        
        /* Remove borders from textarea in screen view too */
        textarea {
          border: none;
          background: transparent;
          box-shadow: none;
          outline: none;
        }
        
        /* RTL Support */
        [dir="rtl"] {
          text-align: right;
          direction: rtl;
        }
        
        [dir="rtl"] textarea {
          text-align: right;
          direction: rtl;
        }
        
        /* Arabic font optimization */
        .arabic-text {
          font-family: 'Tahoma', 'Arial', 'Segoe UI', sans-serif;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
