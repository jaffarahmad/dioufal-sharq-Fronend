import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, ArrowLeft } from "lucide-react";
import logoImage from "@assets/image_17540348329.png";

interface QuotationItem {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
}

interface QuotationData {
  reference: string;
  date: string;
  clientName: string;
  clientAddress: string;
  project: string;
  subject: string;
  validityPeriod: string;
  paymentTerms: string;
  items: QuotationItem[];
  total: string;
}

// Library loading utility with fallback CDNs
const loadLibrary = (
  name: string,
  src: string,
  fallbackSrc?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any)[name]) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      console.log(`${name} loaded successfully from primary CDN`);
      resolve();
    };
    script.onerror = () => {
      console.warn(
        `Failed to load ${name} from primary CDN, trying fallback...`
      );

      if (fallbackSrc) {
        const fallbackScript = document.createElement("script");
        fallbackScript.src = fallbackSrc;
        fallbackScript.onload = () => {
          console.log(`${name} loaded successfully from fallback CDN`);
          resolve();
        };
        fallbackScript.onerror = () => {
          reject(
            new Error(
              `Failed to load ${name} from both primary and fallback CDNs`
            )
          );
        };
        document.head.appendChild(fallbackScript);
      } else {
        reject(new Error(`Failed to load ${name}`));
      }
    };
    document.head.appendChild(script);
  });
};

export default function QuotationPreview() {
  const [quotationData, setQuotationData] = useState<QuotationData | null>(
    null
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load preview data from localStorage
    const previewData = localStorage.getItem("quotation-preview");
    console.log("Loading quotation preview data:", previewData);

    if (previewData) {
      try {
        const parsedData = JSON.parse(previewData);
        console.log("Parsed quotation data:", parsedData);
        setQuotationData(parsedData);
      } catch (error) {
        console.error("Error parsing preview data:", error);
        alert(
          "Error loading quotation data. Please try creating the quotation again."
        );
      }
    } else {
      console.warn("No quotation preview data found in localStorage");
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !quotationData) {
      console.error("Missing required data for PDF generation");
      alert("No quotation data available. Please create a quotation first.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Load html2pdf library if not already loaded
      if (!(window as any).html2pdf) {
        console.log("Loading html2pdf library...");
        await loadLibrary(
          "html2pdf",
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js",
          "https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"
        );
        console.log("html2pdf library loaded successfully");
      }

      const element = printRef.current;

      // Wait for images and content to load
      console.log("Waiting for content to render...");

      // Wait for all images to load
      const images = element.querySelectorAll("img");
      if (images.length > 0) {
        console.log(`Waiting for ${images.length} images to load...`);
        await Promise.all(
          Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = () => {
                console.warn("Image failed to load:", img.src);
                resolve(void 0); // Continue even if image fails
              };
              setTimeout(() => resolve(void 0), 5000); // Timeout after 5 seconds
            });
          })
        );
      }

      // Additional wait for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify element has content
      if (!element.innerHTML || element.innerHTML.trim() === "") {
        throw new Error("Element has no content to render");
      }

      // Check if quotation data is properly rendered
      const hasQuotationContent =
        element.querySelector("table") && element.querySelector("h1");
      if (!hasQuotationContent) {
        throw new Error("Quotation content not properly rendered");
      }

      console.log("Element dimensions:", {
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      });

      // Enhanced PDF generation options
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `DIOUF-AL-SHARQ-quotation-${quotationData?.reference || "preview"}.pdf`,
        image: {
          type: "jpeg",
          quality: 0.98,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          letterRendering: true,
          imageTimeout: 15000,
          removeContainer: true,
          async: true,
          foreignObjectRendering: true,
          scrollX: 0,
          scrollY: 0,
          width: Math.max(element.scrollWidth, 800),
          height: Math.max(element.scrollHeight, 1000),
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
          precision: 16,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      console.log("Starting PDF generation with options:", opt);
      const pdf = (window as any).html2pdf().set(opt).from(element);
      await pdf.save();
      console.log("PDF generated and downloaded successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);

      // Show user-friendly error message
      alert("PDF generation failed. Please try again or use the print option.");

      // Fallback to print dialog
      setTimeout(() => {
        window.print();
      }, 100);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!quotationData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Preview Data
          </h2>
          <p className="text-gray-600 mb-6">
            Please create a quotation first to preview it.
          </p>
          <Button onClick={() => window.close()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Control Buttons - Only visible on screen, not in print */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 print-hidden">
        <Button
          onClick={() => window.close()}
          variant="outline"
          size="sm"
          title="Close"
        >
          <ArrowLeft className="h-4 w-4" />
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
          {isGeneratingPDF ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              Generating PDF...
            </span>
          ) : (
            <>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* Printable Content */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto p-6 bg-white min-h-screen"
      >
        {/* Header with Company Branding - English Left, Logo Center, Arabic Right */}
        <div className="relative mb-6">
          {/* Company Names and Logo in one row */}
          <div className="flex justify-between items-center mb-4">
            {/* English Company Name - Left Side */}
            <div className="text-left flex-1">
              <h1 className="text-xl font-bold text-black mb-2">
                DIOUF AL SHARQ GENERAL
              </h1>
              <p className="text-base text-black font-semibold mb-1">
                Contracting Company
              </p>
              <p className="text-sm text-black">C.R 4030313386 / 700509451</p>
            </div>

            {/* Logo in the Center */}
            <div className="flex justify-center flex-1">
              <img
                src={logoImage}
                alt="Company Logo"
                className="h-6 w-auto"
                onError={e => {
                  e.currentTarget.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4QjVDRjY7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIyNSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNBODU1Rjc7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSI1MCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQzQ4OTk7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSI3NSUiIHN0eWxlPSJzdG9wLWNvbG9yOiNGOTczMTY7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRUY0NDQ0O3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik0yMCAyMCBMMTIwIDIwIEMxNjAgMjAgMTgwIDQwIDE4MCA4MCBMMTU4MCAxMjAgQzE4MCAxNjAgMTYwIDE4MCAxMjAgMTgwIEwyMCAxODAgTDIwIDIwIFoiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPjxwYXRoIGQ9Ik02MCA2MCBMMTI4IDYwIEMxNDAgNjAgMTUwIDcwIDE1MCA5MCBMMTU4IDExMCBDMTUwIDEzMCAxNDAgMTQwIDEyMCAxNDAgTDYwIDE0MCBMNTQ2MFoiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iODAiIHk9IjgwIiB3aWR0aD0iNDAiIGhlaWdodD0iODAiIGZpbGw9InVybCgjZ3JhZGllbnQxKSIvPjxyZWN0IHg9IjYwIiB5PSI4MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ1cmwoI2dyYWRpZW50MSkiLz48L3N2Zz4=";
                }}
              />
            </div>

            {/* Arabic Company Name - Right Side */}
            <div className="text-right flex-1" dir="rtl">
              <h1 className="text-xl font-bold text-black mb-2">
                شركة ضيوف الشرق
              </h1>
              <p className="text-base text-black font-semibold mb-1">
                للمقاولات العامة
              </p>
              <p className="text-sm text-black">س.ت ٤٠٣٠٣١٣٣٨٦ / ٧٠٠٥٠٩٤٥١٦</p>
            </div>
          </div>
        </div>

        {/* Quotation Details - Matching PDF Layout */}
        <div className="mb-6">
          {/* Reference and Date */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-black">
                <span className="font-bold">Reference:</span>{" "}
                {quotationData.reference}
              </p>
            </div>
            <div>
              <p className="text-sm text-black">
                <span className="font-bold">Date:</span>{" "}
                {new Date(quotationData.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-4">
            <p className="text-sm text-black font-bold">
              {quotationData.clientName}
            </p>
          </div>

          {/* Project */}
          <div className="mb-4">
            <p className="text-sm text-black">
              <span className="font-bold">Project:</span>{" "}
              {quotationData.project}
            </p>
          </div>

          {/* Subject */}
          <div className="mb-6">
            <p className="text-sm text-black">
              <span className="font-bold">Subject:</span>{" "}
              {quotationData.subject}
            </p>
          </div>

          {/* Dear Sir */}
          <div className="mb-4">
            <p className="text-sm text-black font-bold">Dear Sir,</p>
          </div>

          {/* Introduction text */}
          <div className="mb-6">
            <p className="text-sm text-black">
              Kindly refer to the quoted price for:
            </p>
          </div>
        </div>

        {/* Items Table - Matching PDF Layout */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-orange-500 text-black">
                <th className="border border-black px-2 py-2 text-center font-bold text-sm w-12">
                  Sr.#
                </th>
                <th className="border border-black px-2 py-2 text-left font-bold text-sm">
                  Description
                </th>
                <th className="border border-black px-2 py-2 text-center font-bold text-sm w-16">
                  Unit
                </th>
                <th className="border border-black px-2 py-2 text-center font-bold text-sm w-16">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {quotationData.items.map((item, index) => (
                <tr key={item.id} className="bg-white">
                  <td className="border border-black px-2 py-2 text-center text-sm font-bold">
                    {index + 1}
                  </td>
                  <td className="border border-black px-2 py-2 text-sm leading-relaxed">
                    {item.description}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-sm">
                    {item.unit}
                  </td>
                  <td className="border border-black px-2 py-2 text-center text-sm">
                    {item.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Appreciation Message */}
        <div className="mb-8">
          <p className="text-sm text-black">
            Your positive response will be highly Appreciated.
          </p>
        </div>

        {/* Thanks and Best Regards */}
        <div className="mb-8">
          <p className="text-sm text-black font-bold">
            Thanks, and Best Regards
          </p>
        </div>

        {/* Signature Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between"></div>
        </div>

        {/* Spacer */}
        <div className="mb-12"></div>

        {/* Footer with red lines and contact info */}
        <div className="mt-auto">
          {/* Red decorative lines */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex space-x-1">
              <div className="w-16 h-1 bg-red-600"></div>
              <div className="w-16 h-1 bg-red-600"></div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="text-center bg-red-600 text-white py-2">
            <p className="text-xs font-bold">
              Gharnath Street, opposite Saudi Aramco complex, mushrifa Jeddah
              KSA
            </p>
            <p className="text-xs">
              info@diouf-alsharq.sa | www.diouf-alsharq.sa
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
          
          /* Ensure all colors are visible in PDF */
          .bg-red-600 {
            background-color: #dc2626 !important;
          }
          
          .bg-orange-500 {
            background-color: #f97316 !important;
          }
          
          .border-black {
            border-color: #000000 !important;
          }
          
          .text-black {
            color: #000000 !important;
          }
          
          .text-white {
            color: #ffffff !important;
          }
          
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
        
        /* Enhanced styles for PDF generation */
        .bg-red-600 {
          background-color: #dc2626 !important;
        }
        
        .bg-orange-500 {
          background-color: #f97316 !important;
        }
        
        .border-black {
          border-color: #000000 !important;
        }
        
        .text-black {
          color: #000000 !important;
        }
        
        .text-white {
          color: #ffffff !important;
        }
        
        /* Ensure logo renders properly in PDF */
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        
        /* Better table rendering */
        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        
        /* Ensure proper text rendering */
        * {
          font-family: 'Arial', 'Helvetica', sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
        }
        
        /* Ensure borders are visible */
        .border {
          border-width: 1px !important;
          border-style: solid !important;
        }
        
        .border-b {
          border-bottom-width: 1px !important;
          border-bottom-style: solid !important;
        }
        
        .border-t {
          border-top-width: 1px !important;
          border-top-style: solid !important;
        }
        
        .border-l {
          border-left-width: 1px !important;
          border-left-style: solid !important;
        }
        
        .border-b-2 {
          border-bottom-width: 2px !important;
          border-bottom-style: solid !important;
        }
        
        .border-b-4 {
          border-bottom-width: 4px !important;
          border-bottom-style: solid !important;
        }
        
        .border-t-2 {
          border-top-width: 2px !important;
          border-top-style: solid !important;
        }
        
        .border-t-4 {
          border-top-width: 4px !important;
          border-top-style: solid !important;
        }
        
        .border-l-4 {
          border-left-width: 4px !important;
          border-left-style: solid !important;
        }
      `}</style>
    </div>
  );
}
