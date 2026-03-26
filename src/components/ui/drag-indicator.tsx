import React from "react";
import { cn } from "@/lib/utils";

interface DragIndicatorProps {
  orientation?: "horizontal" | "vertical";
  active?: boolean;
  className?: string;
}

export const DragIndicator = ({
  orientation = "horizontal",
  active = false,
  className,
}: DragIndicatorProps) => {
  return (
    <div
      className={cn(
        "drag-indicator bg-notion-blue-text transition-all duration-150 ease-out",
        orientation === "horizontal" 
          ? "h-0.5 w-full" 
          : "w-0.5 h-full",
        active && "drag-indicator-active",
        className
      )}
    />
  );
};

// Component for showing drop zones during drag and drop
export const DropZone = ({
  active = false,
  children,
  className,
}: {
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative transition-all duration-150 ease-out",
        active && "bg-notion-blue-bg/50 rounded border-2 border-dashed border-notion-blue-text/30",
        className
      )}
    >
      {children}
      {active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-notion-blue-text text-white px-2 py-1 rounded text-xs font-medium animate-scale-in">
            Soltar aquí
          </div>
        </div>
      )}
    </div>
  );
};