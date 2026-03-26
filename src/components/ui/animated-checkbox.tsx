import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface AnimatedCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const AnimatedCheckbox = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  className,
}: AnimatedCheckboxProps) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [justChanged, setJustChanged] = useState(false);

  const handleChange = () => {
    if (disabled) return;
    
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    setJustChanged(true);
    onChange?.(newChecked);
    
    // Reset animation state
    setTimeout(() => setJustChanged(false), 200);
  };

  return (
    <label 
      className={cn(
        "flex items-center gap-2 cursor-pointer select-none",
        disabled && "cursor-not-allowed opacity-50",
        "hover-notion group",
        className
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center w-4 h-4 border rounded-sm transition-all duration-150",
          isChecked 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-border hover:border-muted-foreground",
          disabled && "pointer-events-none",
          "click-notion"
        )}
        onClick={handleChange}
      >
        {isChecked && (
          <Check 
            className={cn(
              "h-3 w-3",
              justChanged && "check-animated"
            )} 
          />
        )}
      </div>
      
      {label && (
        <span className={cn(
          "text-sm font-medium",
          disabled ? "text-muted-foreground" : "text-foreground group-hover:text-foreground"
        )}>
          {label}
        </span>
      )}
    </label>
  );
};