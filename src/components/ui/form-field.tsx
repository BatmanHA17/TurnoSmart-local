import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps extends React.ComponentProps<"div"> {
  label?: string;
  error?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, required, children, ...props }, ref) => {
    return (
      <div className={cn("space-y-1", className)} ref={ref} {...props}>
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-notion-red-text ml-1">*</span>}
          </label>
        )}
        {children}
        {error && (
          <p className="text-xs text-notion-red-text">{error}</p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }