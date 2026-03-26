import React from "react";
import { cn } from "@/lib/utils";

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "default" | "narrow" | "wide" | "full";
}

// Notion-style content container that focuses on readability
export const ContentContainer = ({
  children,
  className,
  maxWidth = "default",
}: ContentContainerProps) => {
  const maxWidthClasses = {
    narrow: "max-w-2xl",     // ~700px - optimal for reading
    default: "max-w-4xl",    // ~900px - default content width
    wide: "max-w-6xl",       // ~1200px - for wide layouts
    full: "max-w-none",      // full width
  };

  return (
    <div
      className={cn(
        "mx-auto px-6 lg:px-8",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

// Notion-style page header with proper typography hierarchy
export const PageHeader = ({
  title,
  description,
  action,
  breadcrumb,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("space-y-4 mb-8", className)}>
      {breadcrumb && (
        <div className="text-sm text-muted-foreground">
          {breadcrumb}
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  spacing?: "tight" | "normal" | "loose";
}

// Notion-style content section with proper spacing
export const Section = ({
  title,
  description,
  children,
  className,
  spacing = "normal",
}: SectionProps) => {
  const spacingClasses = {
    tight: "space-y-4",
    normal: "space-y-6",
    loose: "space-y-8",
  };

  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-lg font-medium text-foreground leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

interface TextContentProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "muted" | "small";
}

// Notion-style text content with optimal readability
export const TextContent = ({
  children,
  className,
  variant = "default",
}: TextContentProps) => {
  const variantClasses = {
    default: "text-base text-foreground leading-relaxed",
    muted: "text-sm text-muted-foreground leading-relaxed",
    small: "text-xs text-muted-foreground leading-normal",
  };

  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  );
};