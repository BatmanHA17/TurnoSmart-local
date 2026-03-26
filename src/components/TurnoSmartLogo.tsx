import React from "react";

interface TurnoSmartLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const TurnoSmartLogo = ({ className, size = "md" }: TurnoSmartLogoProps) => {
  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 }
  };

  const { width, height } = sizes[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      {/* Background circle with subtle gradient */}
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-foreground" />
      
      {/* Clock/Schedule icon in white */}
      <circle 
        cx="16" 
        cy="16" 
        r="10" 
        stroke="white" 
        strokeWidth="1.5" 
        fill="none"
      />
      
      {/* Clock hands showing organized time */}
      <line 
        x1="16" 
        y1="16" 
        x2="16" 
        y2="10" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <line 
        x1="16" 
        y1="16" 
        x2="20" 
        y2="16" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      
      {/* Small dots for time markers */}
      <circle cx="16" cy="8" r="1" fill="white" />
      <circle cx="24" cy="16" r="1" fill="white" />
      <circle cx="16" cy="24" r="1" fill="white" />
      <circle cx="8" cy="16" r="1" fill="white" />
    </svg>
  );
};