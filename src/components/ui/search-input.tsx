import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps extends React.ComponentProps<"input"> {
  containerClassName?: string;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn(
        // Notion search bar: white background contrasting with sidebar, no visible border
        "relative flex items-center bg-background rounded-sm shadow-none border-0",
        containerClassName
      )}>
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          className={cn(
            // Notion search input: clean, simple, icon on left
            "h-8 w-full rounded-sm bg-transparent pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-notion-blue-text/20 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          placeholder="Search"
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }