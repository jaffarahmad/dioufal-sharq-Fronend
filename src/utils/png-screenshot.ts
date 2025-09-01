import html2canvas from "html2canvas";

interface ScreenshotOptions {
  elementId: string;
  filename?: string;
  quality?: number;
  scale?: number;
  padding?: number;
}

interface ElementStyles {
  overflow: string;
  overflowX: string;
  overflowY: string;
  padding: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
}

export async function captureElementAsPNG(
  options: ScreenshotOptions
): Promise<void> {
  const {
    elementId,
    filename = "screenshot.png",
    quality = 1.0,
    scale = 2,
    padding = 20,
  } = options;

  console.log("Starting PNG screenshot capture for element:", elementId);

  // Find the target element
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID '${elementId}' not found`);
  }

  // Store original styles to restore later
  const originalStyles: Partial<ElementStyles> = {
    overflow: element.style.overflow,
    overflowX: element.style.overflowX,
    overflowY: element.style.overflowY,
    padding: element.style.padding,
    paddingTop: element.style.paddingTop,
    paddingRight: element.style.paddingRight,
    paddingBottom: element.style.paddingBottom,
    paddingLeft: element.style.paddingLeft,
  };

  try {
    // Apply temporary styles to prevent cropping
    element.style.overflow = "visible";
    element.style.overflowX = "visible";
    element.style.overflowY = "visible";
    
    // Add safe padding to ensure nothing gets cropped
    const currentPadding = parseInt(window.getComputedStyle(element).padding) || 0;
    const safePadding = Math.max(currentPadding, padding);
    element.style.padding = `${safePadding}px`;

    // Force layout recalculation
    element.offsetHeight;

    // Wait for any dynamic content to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Element prepared for capture:", {
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
    });

    // Use scroll dimensions to capture the full content including all child elements
    const captureWidth = Math.max(
      element.scrollWidth, 
      element.offsetWidth, 
      element.getBoundingClientRect().width
    );
    const captureHeight = Math.max(
      element.scrollHeight, 
      element.offsetHeight, 
      element.getBoundingClientRect().height
    );

    console.log("Generating canvas with dimensions:", {
      width: captureWidth,
      height: captureHeight,
      scale: scale,
    });

    // Generate canvas with full scroll dimensions
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: true,
      scrollX: 0,
      scrollY: 0,
      width: captureWidth,
      height: captureHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      foreignObjectRendering: true,
      imageTimeout: 15000,
      removeContainer: false,
      ignoreElements: (element) => {
        // Skip elements that might interfere with rendering
        return element.classList?.contains('screenshot-hidden') || false;
      },
      onclone: (clonedDoc) => {
        try {
          // Ensure cloned document maintains the same styles
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.overflow = "visible";
            clonedElement.style.overflowX = "visible";
            clonedElement.style.overflowY = "visible";
            clonedElement.style.padding = `${safePadding}px`;
            clonedElement.style.height = "auto";
            clonedElement.style.minHeight = "auto";
            
            // Ensure all child elements are visible
            const allChildren = clonedElement.querySelectorAll('*');
            allChildren.forEach((child) => {
              if (child instanceof HTMLElement) {
                child.style.overflow = "visible";
                child.style.visibility = "visible";
                child.style.display = child.style.display || "";
              }
            });
          }
        } catch (error) {
          console.warn('Failed to apply styles to cloned document:', error);
        }
      },
    });

    console.log('Canvas generated successfully:', {
      width: canvas.width,
      height: canvas.height,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        "Generated canvas has zero dimensions. Please check if the element is visible."
      );
    }

    // Convert canvas to PNG data URL
    const pngDataUrl = canvas.toDataURL("image/png", quality);

    if (pngDataUrl === "data:,") {
      throw new Error("Canvas is empty - no content captured");
    }

    console.log("PNG data generated, size:", pngDataUrl.length);

    // Create download link and trigger download
    const downloadLink = document.createElement("a");
    downloadLink.href = pngDataUrl;
    downloadLink.download = filename;
    downloadLink.style.display = "none";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    console.log("PNG screenshot saved successfully:", filename);

  } finally {
    // Restore original styles
    element.style.overflow = originalStyles.overflow || "";
    element.style.overflowX = originalStyles.overflowX || "";
    element.style.overflowY = originalStyles.overflowY || "";
    element.style.padding = originalStyles.padding || "";
    element.style.paddingTop = originalStyles.paddingTop || "";
    element.style.paddingRight = originalStyles.paddingRight || "";
    element.style.paddingBottom = originalStyles.paddingBottom || "";
    element.style.paddingLeft = originalStyles.paddingLeft || "";
  }
}

// Convenience function for capturing project cards
export async function captureProjectCard(
  projectId: string | number,
  filename?: string
): Promise<void> {
  const elementId = `project-card-${projectId}`;
  const defaultFilename = filename || `project-${projectId}-screenshot.png`;
  
  return captureElementAsPNG({
    elementId,
    filename: defaultFilename,
    quality: 1.0,
    scale: 2,
    padding: 20,
  });
}

export default captureElementAsPNG;