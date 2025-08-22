import { useState, useEffect } from "react";
import ExactQuotationTemplate from "@/components/exact-quotation-template";

export default function ExactQuotationPage() {
  const [savedData, setSavedData] = useState<any>(null);

  useEffect(() => {
    // Load previously saved data
    const saved = localStorage.getItem("exact-quotation-data");
    if (saved) {
      try {
        setSavedData(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing saved quotation data:", error);
      }
    }
  }, []);

  const handleSave = (data: any) => {
    localStorage.setItem("exact-quotation-data", JSON.stringify(data));
    setSavedData(data);
    console.log("Quotation data saved:", data);
  };

  return <ExactQuotationTemplate onSave={handleSave} initialData={savedData} />;
}
