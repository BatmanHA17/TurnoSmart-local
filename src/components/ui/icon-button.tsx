import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  // Notion icon button: medium gray icon with subtle circular hover and microinteractions
  "inline-flex items-center justify-center rounded-full transition-all duration-150 ease-notion-ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20 disabled:pointer-events-none disabled:opacity-50 click-notion",
  {
    variants: {
      variant: {
        // Default: medium gray, darker on hover, light circular background
        default: 
          "text-muted-foreground hover:bg-muted/30 hover:text-foreground active:bg-muted/50 active:scale-[0.95]",
        
        // Ghost: even more subtle
        ghost: 
          "text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground active:bg-muted/30 active:scale-[0.95]",
        
        // Active: when button represents an active state
        active:
          "text-foreground bg-muted/20 hover:bg-muted/40 active:bg-muted/60 active:scale-[0.95]",
      },
      size: {
        default: "h-8 w-8",
        sm: "h-6 w-6",
        lg: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(iconButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }