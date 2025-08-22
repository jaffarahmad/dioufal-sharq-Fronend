import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function debugPDFGeneration(elementId: string) {
  console.log("=== PDF Debug Start ===");

  // Check if element exists
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID '${elementId}' not found`);
    return;
  }
  console.log("✓ Element found:", element);

  // Check element dimensions
  const rect = element.getBoundingClientRect();
  console.log("Element dimensions:", {
    width: rect.width,
    height: rect.height,
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
  });

  // Check if element is visible
  const computedStyle = window.getComputedStyle(element);
  console.log("Element visibility:", {
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    position: computedStyle.position,
  });

  // Check if element has content
  console.log("Element content length:", element.innerHTML.length);
  console.log("Element text content length:", element.textContent?.length || 0);

  try {
    console.log("Generating canvas...");
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: true, // Enable logging for debugging
      scrollX: 0,
      scrollY: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      foreignObjectRendering: true,
      imageTimeout: 5000,
      removeContainer: true,
    });

    console.log("Canvas generated:", {
      width: canvas.width,
      height: canvas.height,
      hasContent: canvas.width > 0 && canvas.height > 0,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      console.error("Canvas has no dimensions!");
      return;
    }

    // Create a test image to verify canvas content
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    console.log("Image data length:", imgData.length);

    // Create a temporary image element to verify the canvas content
    const testImg = document.createElement("img");
    testImg.src = imgData;
    testImg.style.position = "fixed";
    testImg.style.top = "10px";
    testImg.style.right = "10px";
    testImg.style.width = "200px";
    testImg.style.height = "auto";
    testImg.style.border = "2px solid red";
    testImg.style.zIndex = "10000";
    testImg.title = "Debug: Generated canvas preview";
    document.body.appendChild(testImg);

    console.log("✓ Test image added to page (top-right corner)");

    // Generate PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    console.log("PDF page dimensions:", { pageWidth, pageHeight });

    // Calculate dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgAspectRatio = imgWidth / imgHeight;
    const pageAspectRatio = pageWidth / pageHeight;

    let finalWidth: number;
    let finalHeight: number;

    if (imgAspectRatio > pageAspectRatio) {
      finalWidth = pageWidth - 20; // 10mm margins
      finalHeight = (pageWidth - 20) / imgAspectRatio;
    } else {
      finalHeight = pageHeight - 20; // 10mm margins
      finalWidth = (pageHeight - 20) * imgAspectRatio;
    }

    console.log("Final PDF dimensions:", { finalWidth, finalHeight });

    pdf.addImage(
      imgData,
      "JPEG",
      10, // x position
      10, // y position
      finalWidth,
      finalHeight,
      undefined,
      "FAST"
    );

    pdf.save("debug-invoice.pdf");
    console.log("✓ Debug PDF saved");

    // Remove test image after 5 seconds
    setTimeout(() => {
      if (testImg.parentNode) {
        testImg.parentNode.removeChild(testImg);
      }
    }, 5000);
  } catch (error) {
    console.error("Error during PDF generation:", error);
  }

  console.log("=== PDF Debug End ===");
}

// Add debug button to page
export function addDebugButton(elementId: string) {
  const debugBtn = document.createElement("button");
  debugBtn.textContent = "Debug PDF";
  debugBtn.style.position = "fixed";
  debugBtn.style.top = "10px";
  debugBtn.style.left = "10px";
  debugBtn.style.zIndex = "10000";
  debugBtn.style.padding = "10px";
  debugBtn.style.backgroundColor = "#ff4444";
  debugBtn.style.color = "white";
  debugBtn.style.border = "none";
  debugBtn.style.borderRadius = "4px";
  debugBtn.style.cursor = "pointer";

  debugBtn.onclick = () => debugPDFGeneration(elementId);
  document.body.appendChild(debugBtn);

  console.log("Debug button added to page");
}
