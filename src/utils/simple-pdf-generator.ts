import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface SimplePDFOptions {
  elementId: string;
  filename?: string;
  quality?: number;
  scale?: number;
}

export async function generateSimplePDF(
  options: SimplePDFOptions
): Promise<void> {
  const {
    elementId,
    filename = "document.pdf",
    quality = 0.95,
    scale = 2,
  } = options;

  console.log("Starting simple PDF generation for element:", elementId);

  // Find the element
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID '${elementId}' not found`);
  }

  console.log("Element found:", {
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
  });

  // Ensure element is visible
  const originalDisplay = element.style.display;
  const originalVisibility = element.style.visibility;
  const originalOpacity = element.style.opacity;

  element.style.display = "block";
  element.style.visibility = "visible";
  element.style.opacity = "1";

  try {
    // Wait for fonts and images
    await waitForResources();

    // Force a reflow
    element.offsetHeight;

    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Generating canvas...");

    // Use html-to-image (renders via browser's own engine, so Arabic/RTL
    // text keeps proper letter shaping and order). Falls back to
    // html2canvas if it fails for any reason.
    let imgData: string;
    let imgWidth: number;
    let imgHeight: number;

    try {
      const pixelRatio = scale;
      const dataUrl = await htmlToImage.toJpeg(element as HTMLElement, {
        quality,
        pixelRatio,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          display: "block",
          visibility: "visible",
          opacity: "1",
        },
      });

      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("html-to-image returned empty data");
      }

      // Load the image to get its real dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load generated image"));
        img.src = dataUrl;
      });

      imgData = dataUrl;
      imgWidth = img.naturalWidth;
      imgHeight = img.naturalHeight;

      console.log("html-to-image capture succeeded:", { imgWidth, imgHeight });
    } catch (htmlToImageError) {
      console.warn(
        "html-to-image failed, falling back to html2canvas:",
        htmlToImageError
      );

      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      console.log("Canvas generated:", {
        width: canvas.width,
        height: canvas.height,
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas has zero dimensions");
      }

      imgData = canvas.toDataURL("image/jpeg", quality);
      imgWidth = canvas.width;
      imgHeight = canvas.height;
    }

    if (imgData === "data:,") {
      throw new Error("Canvas is empty");
    }

    console.log("Image data generated, length:", imgData.length);

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit page
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Center on page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    console.log("Adding image to PDF:", {
      x,
      y,
      finalWidth,
      finalHeight,
    });

    pdf.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);

    // Save PDF
    pdf.save(filename);

    console.log("PDF saved successfully:", filename);
  } finally {
    // Restore original styles
    element.style.display = originalDisplay;
    element.style.visibility = originalVisibility;
    element.style.opacity = originalOpacity;
  }
}

async function waitForResources(): Promise<void> {
  // Wait for fonts, explicitly forcing the Arabic-capable Cairo weights
  // used in the invoice templates so they are guaranteed to be loaded
  // before html2canvas takes its snapshot.
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('400 16px Cairo'),
        document.fonts.load('600 16px Cairo'),
        document.fonts.load('700 16px Cairo'),
      ]);
    } catch {
      // Ignore font load failures; fall back to document.fonts.ready below
    }
    if (document.fonts.ready) {
      await document.fonts.ready;
    }
  }

  // Wait for images
  const images = document.querySelectorAll("img");
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = () => resolve(undefined);
      img.onerror = () => resolve(undefined);
      setTimeout(() => resolve(undefined), 3000);
    });
  });

  await Promise.all(imagePromises);

  // Additional wait
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Test function
export async function testPDFGeneration(elementId: string): Promise<void> {
  try {
    console.log("=== Testing PDF Generation ===");
    await generateSimplePDF({
      elementId,
      filename: "test-invoice.pdf",
      quality: 0.9,
      scale: 2,
    });
    console.log("✅ PDF generation test completed successfully");
  } catch (error) {
    console.error("❌ PDF generation test failed:", error);
    throw error;
  }
}
