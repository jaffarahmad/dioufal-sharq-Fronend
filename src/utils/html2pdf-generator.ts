import html2pdf from 'html2pdf.js';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH = 794; // 210mm
const A4_HEIGHT = 1123; // 297mm

interface PDFOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  image?: {
    type: 'jpeg' | 'png';
    quality: number;
  };
  html2canvas?: {
    scale: number;
    useCORS: boolean;
    allowTaint: boolean;
    backgroundColor: string;
    logging: boolean;
    letterRendering: boolean;
    foreignObjectRendering: boolean;
  };
  jsPDF?: {
    unit: 'mm' | 'pt' | 'px';
    format: 'a4' | [number, number];
    orientation: 'portrait' | 'landscape';
  };
}

class HTML2PDFGenerator {
  private defaultOptions: PDFOptions = {
    filename: 'document.pdf',
    margin: 0, // No margins - using CSS padding instead
    image: {
      type: 'jpeg',
      quality: 0.98
    },
    html2canvas: {
      scale: 2, // High DPI for crisp text
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true,
      foreignObjectRendering: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  /**
   * Wait for all fonts to load
   */
  private async waitForFonts(): Promise<void> {
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
        console.log('✅ All fonts loaded');
      } catch (error) {
        console.warn('⚠️ Font loading timeout:', error);
      }
    }
  }

  /**
   * Wait for all images to load
   */
  private async waitForImages(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('⚠️ Image failed to load:', img.src);
            resolve();
          };
        }
      });
    });

    await Promise.all(imagePromises);
    console.log(`✅ All ${images.length} images loaded`);
  }

  /**
   * Prepare element for PDF capture
   */
  private prepareElement(element: HTMLElement): void {
    // Ensure element is visible
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none') {
      console.warn('⚠️ Element is hidden, making it visible for PDF capture');
      element.style.display = 'block';
    }

    // Ensure white background
    if (!element.style.backgroundColor && computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      element.style.backgroundColor = '#ffffff';
    }

    // Force layout recalculation
    element.offsetHeight;
    
    console.log('✅ Element prepared for PDF capture:', {
      width: element.offsetWidth,
      height: element.offsetHeight,
      display: computedStyle.display,
      backgroundColor: computedStyle.backgroundColor
    });
  }

  /**
   * Add print-specific CSS styles
   */
  private addPrintStyles(): HTMLStyleElement {
    const printStyles = document.createElement('style');
    printStyles.id = 'pdf-print-styles';
    printStyles.textContent = `
      @page {
        size: A4 portrait;
        margin: 10mm !important;
      }
      
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        .pdf-content {
          width: 190mm !important;
          max-width: 190mm !important;
          margin: 0 !important;
          padding: 10mm !important;
          background: white !important;
          box-sizing: border-box !important;
          page-break-inside: auto !important;
          overflow: visible !important;
        }
        

        
        /* Ensure all child elements respect box-sizing */
        .pdf-content * {
          box-sizing: border-box !important;
        }
        
        /* Prevent content from exceeding container width */
        .pdf-content table {
          max-width: 100% !important;
          table-layout: fixed !important;
        }
        
        .pdf-content img {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* Auto-pagination for content sections */
        .quotation-section {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        /* Table pagination rules */
        table {
          page-break-inside: auto !important;
          break-inside: auto !important;
          width: 100% !important;
        }
        
        thead {
          display: table-header-group !important;
        }
        
        tbody {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: auto !important;
        }
        
        td, th {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        tfoot {
          display: table-footer-group !important;
        }
        
        /* Page break controls */
        .page-break-before, .new-page {
          page-break-before: always !important;
          break-before: page !important;
        }
        
        .page-break-after, .end-section {
          page-break-after: always !important;
          break-after: page !important;
        }
        
        .no-page-break, .keep-together {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Prevent orphans and widows */
        p, div {
          orphans: 3 !important;
          widows: 3 !important;
        }
        
        /* Long content handling */
        .quotation-items {
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        
        /* Terms & Conditions specific rules */
        .terms-section {
          page-break-inside: auto !important;
          break-inside: auto !important;
          page-break-before: auto !important;
          break-before: auto !important;
        }
        
        .terms-section > div {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* Ensure text is crisp */
        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      }
    `;
    
    document.head.appendChild(printStyles);
    return printStyles;
  }

  /**
   * Remove print styles
   */
  private removePrintStyles(): void {
    const printStyles = document.getElementById('pdf-print-styles');
    if (printStyles) {
      printStyles.remove();
    }
  }

  /**
   * Generate PDF from HTML element
   */
  async generatePDF(elementId: string, options: Partial<PDFOptions> = {}): Promise<void> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      console.log('🚀 Starting PDF generation...');
      
      // Find the element
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      // Add print styles
      const printStyleElement = this.addPrintStyles();
      
      // Wait for fonts and images
      await this.waitForFonts();
      await this.waitForImages(element);
      
      // Prepare element
      this.prepareElement(element);
      
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('📄 Generating PDF with html2pdf.js...');
      
      // Configure html2pdf options with enhanced pagination
      const html2pdfOptions = {
        margin: [3, 3, 3, 3], // Reduced margins to fit more content
        filename: mergedOptions.filename,
        image: mergedOptions.image,
        html2canvas: {
          ...mergedOptions.html2canvas,
          scale: 1.5, // Reduced scale for better fit
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          letterRendering: true,
          foreignObjectRendering: false,
          windowWidth: 1024,
          scrollX: 0,
          scrollY: 0,
          width: element.scrollWidth,
          height: element.scrollHeight
        },
        jsPDF: {
          ...mergedOptions.jsPDF,
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          putOnlyUsedFonts: true,
          floatPrecision: 16
        },
        pagebreak: {
          mode: ['css', 'legacy'],
          before: ['.page-break-before', '.new-page'],
          after: ['.page-break-after', '.end-section'],
          avoid: ['.no-page-break', '.keep-together', 'tr', 'img', '.footer-section', '.company-stamp', '.terms-section']
        },
        enableLinks: false,
        worker: false
      };
      
      // Generate PDF with page numbers
      const pdf = await html2pdf()
        .set(html2pdfOptions)
        .from(element)
        .toPdf()
        .get('pdf');
      
      // Add page numbers to each page
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150); // Lighter color
        const pageText = `Page ${i} of ${totalPages}`;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const textWidth = pdf.getTextWidth(pageText);
        const x = (pageWidth - textWidth) / 2;
        const y = pdf.internal.pageSize.getHeight() - 5; // 5mm from bottom
        pdf.text(pageText, x, y);
      }
      
      // Save the PDF
      pdf.save(mergedOptions.filename || 'document.pdf');
      
      console.log('✅ PDF generated successfully!');
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    } finally {
      // Clean up
      this.removePrintStyles();
    }
  }

  /**
   * Generate PDF with custom A4 optimization
   */
  async generateA4PDF(elementId: string, filename: string = 'document.pdf'): Promise<void> {
    // First try an Arabic-safe path: html-to-image renders through the
    // browser's own engine so RTL/Arabic text keeps proper letter shaping.
    // The image is then sliced across A4 pages with jsPDF.
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      await this.waitForFonts();
      await this.waitForImages(element as HTMLElement);
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await htmlToImage.toJpeg(element as HTMLElement, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('html-to-image returned empty data');
      }

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load generated image'));
        img.src = dataUrl;
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Scale image to page width, then slice vertically across pages
      const imgWidthMm = pageWidth;
      const imgHeightMm = (img.naturalHeight * imgWidthMm) / img.naturalWidth;

      if (imgHeightMm <= pageHeight) {
        pdf.addImage(dataUrl, 'JPEG', 0, 0, imgWidthMm, imgHeightMm);
      } else {
        // Multi-page: draw slices of the source image onto each page
        const pxPerMm = img.naturalWidth / pageWidth;
        const pageHeightPx = Math.floor(pageHeight * pxPerMm);
        let renderedPx = 0;
        let pageIndex = 0;

        while (renderedPx < img.naturalHeight) {
          const sliceHeightPx = Math.min(pageHeightPx, img.naturalHeight - renderedPx);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = img.naturalWidth;
          sliceCanvas.height = sliceHeightPx;
          const ctx = sliceCanvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            img,
            0, renderedPx, img.naturalWidth, sliceHeightPx,
            0, 0, img.naturalWidth, sliceHeightPx
          );

          if (pageIndex > 0) pdf.addPage();
          const sliceHeightMm = sliceHeightPx / pxPerMm;
          pdf.addImage(
            sliceCanvas.toDataURL('image/jpeg', 0.95),
            'JPEG', 0, 0, imgWidthMm, sliceHeightMm
          );

          renderedPx += sliceHeightPx;
          pageIndex += 1;
        }
      }

      pdf.save(filename);
      console.log('✅ A4 PDF generated via html-to-image (Arabic-safe):', filename);
      return;
    } catch (arabicSafeError) {
      console.warn(
        '⚠️ html-to-image A4 path failed, falling back to html2pdf.js:',
        arabicSafeError
      );
    }

    const a4Options: Partial<PDFOptions> = {
      filename,
      margin: 0, // No margins - using CSS padding instead
      image: {
        type: 'jpeg',
        quality: 0.95
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
        foreignObjectRendering: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };
    
    return this.generatePDF(elementId, a4Options);
  }
}

// Export singleton instance
export const html2pdfGenerator = new HTML2PDFGenerator();

// Export convenience function
export const generateA4PDF = (elementId: string, filename: string = 'document.pdf') => {
  return html2pdfGenerator.generateA4PDF(elementId, filename);
};

export default html2pdfGenerator;