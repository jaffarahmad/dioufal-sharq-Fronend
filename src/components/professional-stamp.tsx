import React from "react";
import stampImage from "@assets/image_17540348329.png";

interface ProfessionalStampProps {
  size?: "small" | "medium" | "large";
  showSignature?: boolean;
  className?: string;
}

export default function ProfessionalStamp({
  size = "medium",
  showSignature = false,
  className = "",
}: ProfessionalStampProps) {
  const sizeClasses = {
    small: "w-32 h-24",
    medium: "w-48 h-36",
    large: "w-64 h-48",
  };

  const stampSize = {
    small: { width: 120, height: 90 },
    medium: { width: 180, height: 135 },
    large: { width: 240, height: 180 },
  };

  const currentSize = stampSize[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Company Stamp Image */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src={stampImage}
          alt="Company Stamp"
          width={currentSize.width}
          height={currentSize.height}
          className="object-contain print:opacity-100"
        />
      </div>

      {/* Signature section */}
      {showSignature && (
        <div className="mt-6 text-center">
          {/* Signature line with realistic handwritten style */}
          <div className="relative mb-2">
            <svg width="220" height="50" className="mx-auto">
              {/* Main signature stroke */}
              <path
                d="M 30 30 Q 45 15 60 25 Q 75 35 90 20 Q 105 10 120 25 Q 135 40 150 25 Q 165 15 180 30 Q 190 35 200 25"
                fill="none"
                stroke="#4338ca"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Secondary flourish */}
              <path
                d="M 70 25 Q 80 18 90 25 Q 100 32 110 25"
                fill="none"
                stroke="#4338ca"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Underline flourish */}
              <path
                d="M 40 35 Q 110 40 180 35"
                fill="none"
                stroke="#4338ca"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Signature label */}
          <div className="border-t border-indigo-400 pt-2 w-52 mx-auto">
            <p className="text-xs text-indigo-600 font-semibold">
              Authorized Signature
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
