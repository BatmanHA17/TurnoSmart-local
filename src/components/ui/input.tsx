import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Notion input styling: simple rectangle, white background, subtle border
          "flex h-8 w-full rounded-sm border border-muted-foreground/20 bg-background px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-notion-blue-text/60 focus-visible:ring-1 focus-visible:ring-notion-blue-text/20 focus-visible:shadow-sm disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground disabled:border-muted-foreground/10 invalid:border-notion-red-text/60 invalid:ring-1 invalid:ring-notion-red-text/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
