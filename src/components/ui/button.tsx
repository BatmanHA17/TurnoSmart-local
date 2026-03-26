import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles following Notion's flat design principles with microinteractions
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 ease-notion-ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 click-notion",
  {
    variants: {
      variant: {
        // Notion primary button: clean, integrated with background
        default: 
          "bg-sidebar text-foreground border border-border rounded-lg hover:bg-muted active:bg-muted/80 active:scale-[0.98] disabled:bg-background disabled:text-muted-foreground disabled:border-muted-foreground/30",
        
        // Notion secondary button: subtle gray background  
        secondary:
          "bg-muted text-foreground border border-muted-foreground/20 rounded-lg hover:bg-muted/80 active:bg-muted/60 active:scale-[0.98] disabled:bg-background disabled:text-muted-foreground disabled:border-muted-foreground/30",
        
        // Notion outline button: clean border, white/transparent background
        outline:
          "bg-background text-foreground border border-muted-foreground/20 rounded-lg hover:bg-muted/30 active:bg-muted/50 active:scale-[0.98] disabled:bg-background disabled:text-muted-foreground disabled:border-muted-foreground/30",
        
        // Notion ghost button: text-only, hover shows background
        ghost: 
          "bg-transparent text-foreground rounded-lg hover:bg-muted/50 active:bg-muted/70 active:scale-[0.98] disabled:text-muted-foreground hover-notion",
        
        // Notion link button: clean text with subtle hover
        link: 
          "text-foreground underline-offset-4 hover:text-muted-foreground hover:underline active:text-muted-foreground/80 disabled:text-muted-foreground hover-notion",
        
        // Notion destructive button: subtle red styling
        destructive:
          "bg-notion-red-bg text-notion-red-text border border-notion-red-text/20 rounded-lg hover:bg-notion-red-text/10 active:bg-notion-red-text/20 active:scale-[0.98] disabled:bg-background disabled:text-muted-foreground disabled:border-muted-foreground/30",
        
        // Notion icon button: medium gray icon with subtle circular hover
        icon: 
          "bg-transparent text-muted-foreground rounded-full hover:bg-muted/30 hover:text-foreground active:bg-muted/50 active:scale-[0.95] disabled:text-muted-foreground/50 disabled:bg-transparent",
        
        // Notion primary prominent: black text on white with black border (for important CTAs)
        primary: 
          "bg-background text-foreground border border-foreground rounded-lg hover:bg-foreground hover:text-background active:bg-foreground/90 active:scale-[0.98] disabled:bg-background disabled:text-muted-foreground disabled:border-muted-foreground/30",
      },
      size: {
        // Notion-inspired sizing with proper clickable areas
        default: "h-8 px-3 py-2", // 32px height following 8px grid
        sm: "h-6 px-2 py-1 text-xs", // 24px height, smaller text
        lg: "h-10 px-4 py-2", // 40px height for important actions
        icon: "h-8 w-8 p-0", // Square icon buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
