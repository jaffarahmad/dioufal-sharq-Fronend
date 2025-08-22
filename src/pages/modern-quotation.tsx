import { useState, useEffect } from "react";
import ModernQuotationTemplate from "@/components/modern-quotation-template";

export default function ModernQuotationPage() {
  const [savedContent, setSavedContent] = useState("");

  useEffect(() => {
    // Load previously saved content
    const saved = localStorage.getItem("quotation-description");
    if (saved) {
      setSavedContent(saved);
    }
  }, []);

  const handleSave = (description: string) => {
    localStorage.setItem("quotation-description", description);
    setSavedContent(description);
    console.log("Description saved:", description);
  };

  return (
    <ModernQuotationTemplate
      onSave={handleSave}
      initialContent={savedContent}
    />
  );
}
