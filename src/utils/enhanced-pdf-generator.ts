import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PDFOptions {
  filename?: string;
  elementId: string;
  pageFormat?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
  quality?: number;
  scale?: number;
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface LoadingOptions {
  show?: boolean;
  message?: string;
  customElement?: HTMLElement;
}

export class EnhancedPDFGenerator {
  private static instance: EnhancedPDFGenerator;
  private loadingElement: HTMLElement | null = null;

  public static getInstance(): EnhancedPDFGenerator {
    if (!EnhancedPDFGenerator.instance) {
      EnhancedPDFGenerator.instance = new EnhancedPDFGenerator();
    }
    return EnhancedPDFGenerator.instance;
  }

  private showLoading(options: LoadingOptions = {}): void {
    if (options.show === false) return;

    if (options.customElement) {
      this.loadingElement = options.customElement;
    } else {
      this.loadingElement = document.createElement("div");
      this.loadingElement.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #1f2937;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <div style="
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 30px #374151;
            max-width: 300px;
          ">
            <div style="
              width: 40px;
              height: 40px;
              border: 4px solid #f3f3f3;
              border-top: 4px solid #3498db;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            "></div>
            <div style="
              font-size: 16px;
              font-weight: 600;
              color: #333;
              margin-bottom: 8px;
            ">
              Generating PDF
            </div>
            <div style="
              font-size: 14px;
              color: #666;
            ">
              ${options.message || "Please wait while we create your PDF with perfect layout preservation..."}
            </div>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(this.loadingElement);
    }
  }

  private hideLoading(): void {
    if (this.loadingElement && this.loadingElement.parentNode) {
      this.loadingElement.parentNode.removeChild(this.loadingElement);
      this.loadingElement = null;
    }
  }

  private async waitForFontsAndImages(element: HTMLElement): Promise<void> {
    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for images to load
    const images = element.querySelectorAll("img");
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails
        setTimeout(resolve, 3000); // Timeout after 3 seconds
      });
    });

    await Promise.all(imagePromises);

    // Additional wait for layout stabilization
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private optimizeElementForPDF(element: HTMLElement): {
    element: HTMLElement;
    cleanup: () => void;
  } {
    const originalStyles = new Map<HTMLElement, string>();
    const elementsToOptimize = [
      element,
      ...Array.from(element.querySelectorAll("*")),
    ] as HTMLElement[];

    elementsToOptimize.forEach(el => {
      originalStyles.set(el, el.style.cssText);

      // Optimize for PDF rendering with enhanced color preservation
      (el.style as any).webkitPrintColorAdjust = "exact";
      (el.style as any).colorAdjust = "exact";
      (el.style as any).printColorAdjust = "exact";
      (el.style as any).webkitFontSmoothing = "antialiased";
      (el.style as any).mozOsxFontSmoothing = "grayscale";

      // Force color preservation for all elements
      const computedStyle = window.getComputedStyle(el);
      if (computedStyle.backgroundColor && computedStyle.backgroundColor !== "transparent" && computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
        el.style.backgroundColor = computedStyle.backgroundColor;
        (el.style as any).webkitPrintColorAdjust = "exact";
        (el.style as any).printColorAdjust = "exact";
      }
      if (computedStyle.color && computedStyle.color !== "transparent") {
        el.style.color = computedStyle.color;
      }
      if (computedStyle.borderColor && computedStyle.borderColor !== "transparent") {
        el.style.borderColor = computedStyle.borderColor;
      }

      // Fix potential layout issues
      if (el.style.transform && el.style.transform !== "none") {
        // Preserve transforms but ensure they don't cause issues
        el.style.transformOrigin = "top left";
      }
    });

    // Add PDF-specific styles with error handling
    let pdfStyleSheet: HTMLStyleElement | null = null;
    try {
      if (document && document.head) {
        pdfStyleSheet = document.createElement("style");
        pdfStyleSheet.id = "pdf-optimization-styles";
        pdfStyleSheet.textContent = `
          #${element.id} {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${element.id} * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
          #${element.id} .bg-red-600,
          #${element.id} .bg-blue-600,
          #${element.id} .bg-gray-600,
          #${element.id} .bg-gray-50,
          #${element.id} .bg-gray-100,
          #${element.id} .text-red-600,
          #${element.id} .text-blue-600,
          #${element.id} .text-white,
          #${element.id} .border-red-600,
          #${element.id} .border-gray-300 {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${element.id} .bg-gradient-to-r,
          #${element.id} .bg-gradient-to-l,
          #${element.id} .bg-gradient-to-t,
          #${element.id} .bg-gradient-to-b {
            background-image: none !important;
            background-color: var(--fallback-bg, #f8f9fa) !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        `;
        document.head.appendChild(pdfStyleSheet);
      }
    } catch (error) {
      console.warn('Failed to inject PDF styles:', error);
    }

    const cleanup = () => {
      // Restore original styles
      elementsToOptimize.forEach(el => {
        const originalStyle = originalStyles.get(el);
        if (originalStyle !== undefined) {
          el.style.cssText = originalStyle;
        }
      });

      // Remove PDF styles
      try {
        const styleSheet = document.getElementById("pdf-optimization-styles");
        if (styleSheet && styleSheet.parentNode) {
          styleSheet.parentNode.removeChild(styleSheet);
        }
      } catch (error) {
        console.warn('Failed to remove PDF styles:', error);
      }
    };

    return { element, cleanup };
  }

  public async generatePDF(
    options: PDFOptions,
    loadingOptions: LoadingOptions = {}
  ): Promise<void> {
    const {
      filename = "document.pdf",
      elementId,
      pageFormat = "a4",
      orientation = "portrait",
      quality = 0.95,
      scale = 2,
      margins = { top: 10, right: 10, bottom: 10, left: 10 },
    } = options;

    const element = document.getElementById(elementId);
    console.log('PDF Generation Debug:', {
      elementId,
      elementFound: !!element,
      elementType: element?.tagName,
      elementClasses: element?.className,
      hasContent: element?.innerHTML?.length || 0
    });
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`);
    }
    
    // Additional element validation
    if (element.innerHTML.trim().length === 0) {
      console.warn('Warning: Element appears to have no content');
    }

    this.showLoading(loadingOptions);

    try {
      // Wait for all resources to load
      await this.waitForFontsAndImages(element as HTMLElement);

      // Optimize element for PDF
      const { cleanup } = this.optimizeElementForPDF(element as HTMLElement);

      try {
        // Ensure element is visible before canvas generation
        const originalStyles = {
          display: element.style.display,
          visibility: element.style.visibility,
          opacity: element.style.opacity,
          position: element.style.position,
          zIndex: element.style.zIndex,
        };

        // Make element fully visible and accessible
        element.style.display = "block";
        element.style.visibility = "visible";
        element.style.opacity = "1";
        element.style.position = "relative";
        element.style.zIndex = "9999";

        // Force multiple reflows to ensure rendering
        element.offsetHeight;
        await new Promise(resolve => setTimeout(resolve, 100));
        element.offsetHeight;
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Debug element dimensions and visibility
        const computedStyle = window.getComputedStyle(element);
        console.log('Element dimensions and visibility:', {
          offsetWidth: element.offsetWidth,
          offsetHeight: element.offsetHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          clientWidth: element.clientWidth,
          clientHeight: element.clientHeight,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          position: computedStyle.position,
          zIndex: computedStyle.zIndex
        });

        // Ensure element has proper dimensions
        if (element.offsetWidth === 0 || element.offsetHeight === 0) {
          throw new Error(`Element has zero dimensions: width=${element.offsetWidth}, height=${element.offsetHeight}. Make sure the element is visible and has content.`);
        }

        // Generate high-quality canvas
        let canvas: HTMLCanvasElement;
        try {
          canvas = await html2canvas(element as HTMLElement, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: true, // Enable logging for debugging
            scrollX: 0,
            scrollY: 0,
            width: element.scrollWidth || element.offsetWidth,
            height: element.scrollHeight || element.offsetHeight,
            windowWidth: element.scrollWidth || element.offsetWidth,
            windowHeight: element.scrollHeight || element.offsetHeight,
            foreignObjectRendering: true,
            imageTimeout: 5000,
            removeContainer: true,
            ignoreElements: (element) => {
              // Skip elements that might interfere with color rendering
              return element.classList?.contains('print-hidden') || false;
            },
            onclone: clonedDoc => {
              try {
                // Ensure cloned document has the same optimizations
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                  (clonedElement.style as any).webkitPrintColorAdjust = "exact";
                  (clonedElement.style as any).colorAdjust = "exact";

                  // Apply PDF optimization styles to cloned document
                  if (clonedDoc && clonedDoc.head) {
                    const clonedStyle = clonedDoc.createElement("style");
                    clonedStyle.textContent =
                      document.getElementById("pdf-optimization-styles")
                        ?.textContent || "";
                    if (clonedStyle.textContent) {
                      clonedDoc.head.appendChild(clonedStyle);
                    }
                  }
                }
              } catch (error) {
                console.warn('Failed to apply styles to cloned document:', error);
              }
            },
          });

          console.log('Canvas generated successfully:', {
            width: canvas.width,
            height: canvas.height,
            element_id: elementId
          });
          
          if (canvas.width === 0 || canvas.height === 0) {
            throw new Error(
              "Generated canvas has no content. Please check if the element is visible."
            );
          }
          
          // Test if canvas has actual content by checking a few pixels
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100));
            const hasContent = imageData.data.some((value, index) => {
              // Check if any pixel is not white (255,255,255) or transparent
              if (index % 4 === 3) return false; // Skip alpha channel
              return value !== 255;
            });
            console.log('Canvas has visible content:', hasContent);
            
            if (!hasContent) {
              console.warn('Canvas appears to be empty or all white');
            }
          }
        } finally {
          // Restore original styles
          element.style.display = originalStyles.display;
          element.style.visibility = originalStyles.visibility;
          element.style.opacity = originalStyles.opacity;
          element.style.position = originalStyles.position;
          element.style.zIndex = originalStyles.zIndex;
        }

        // Convert to high-quality image
        const imgData = canvas.toDataURL("image/jpeg", quality);
        
        // Debug canvas and image data
        console.log('Canvas details:', {
          width: canvas.width,
          height: canvas.height,
          dataURL_length: imgData.length,
          dataURL_prefix: imgData.substring(0, 50)
        });
        
        if (imgData.length < 1000) {
          console.warn('Image data seems too small, might be empty');
        }

        // Create PDF with precise dimensions
        const pdf = new jsPDF({
          orientation: orientation,
          unit: "mm",
          format: pageFormat,
          compress: true,
        });

        // Calculate page dimensions
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Calculate content dimensions with margins
        const contentWidth = pageWidth - margins.left - margins.right;
        const contentHeight = pageHeight - margins.top - margins.bottom;

        // Calculate image dimensions to fit page while maintaining aspect ratio
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const imgAspectRatio = imgWidth / imgHeight;
        const pageAspectRatio = contentWidth / contentHeight;

        let finalWidth: number;
        let finalHeight: number;

        if (imgAspectRatio > pageAspectRatio) {
          // Image is wider than page ratio - fit to width
          finalWidth = contentWidth;
          finalHeight = contentWidth / imgAspectRatio;
        } else {
          // Image is taller than page ratio - fit to height
          finalHeight = contentHeight;
          finalWidth = contentHeight * imgAspectRatio;
        }

        // Center the content on the page
        const xPos = margins.left + (contentWidth - finalWidth) / 2;
        const yPos = margins.top;

        // Handle multi-page content
        let remainingHeight = finalHeight;
        let sourceY = 0;
        let pageCount = 0;

        while (remainingHeight > 0) {
          if (pageCount > 0) {
            pdf.addPage();
          }

          const pageContentHeight = Math.min(remainingHeight, contentHeight);
          const sourceHeight = (pageContentHeight / finalHeight) * imgHeight;

          // Create a temporary canvas for this page
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext("2d")!;

          // Draw the portion of the image for this page
          pageCtx.drawImage(
            canvas,
            0,
            sourceY,
            imgWidth,
            sourceHeight,
            0,
            0,
            imgWidth,
            sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", quality);
          pdf.addImage(
            pageImgData,
            "JPEG",
            xPos,
            yPos,
            finalWidth,
            pageContentHeight,
            undefined,
            "FAST"
          );

          remainingHeight -= pageContentHeight;
          sourceY += sourceHeight;
          pageCount++;
        }

        // Save the PDF
        pdf.save(filename);
      } finally {
        cleanup();
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      throw error;
    } finally {
      this.hideLoading();
    }
  }
}

// Export convenience function
export const generateEnhancedPDF = (
  options: PDFOptions,
  loadingOptions?: LoadingOptions
) => {
  return EnhancedPDFGenerator.getInstance().generatePDF(
    options,
    loadingOptions
  );
};

export default EnhancedPDFGenerator;
