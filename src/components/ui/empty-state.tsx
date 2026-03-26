import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

// Notion-style empty state with simple black and white illustration
export const EmptyState = ({
  title,
  description,
  illustration,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <Card className={cn("border-0 shadow-none bg-transparent", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
        {illustration && (
          <div className="mb-6 opacity-60">
            {illustration}
          </div>
        )}
        
        <h3 className="text-lg font-medium text-foreground mb-2 leading-tight">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-6">
          {description}
        </p>
        
        {action && action}
      </CardContent>
    </Card>
  );
};

// Simple geometric illustrations in Notion style (black lines only)
export const WorkIllustration = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    className="text-muted-foreground"
  >
    {/* Desk */}
    <rect x="20" y="70" width="80" height="8" stroke="currentColor" strokeWidth="1.5" />
    <rect x="18" y="78" width="84" height="4" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Laptop */}
    <rect x="35" y="55" width="30" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="37" y="57" width="26" height="8" fill="currentColor" />
    <rect x="40" y="59" width="20" height="4" fill="white" />
    
    {/* Documents */}
    <rect x="70" y="58" width="12" height="16" stroke="currentColor" strokeWidth="1.5" />
    <line x1="72" y1="62" x2="80" y2="62" stroke="currentColor" strokeWidth="1" />
    <line x1="72" y1="65" x2="78" y2="65" stroke="currentColor" strokeWidth="1" />
    <line x1="72" y1="68" x2="80" y2="68" stroke="currentColor" strokeWidth="1" />
    
    {/* Person (simple) */}
    <circle cx="60" cy="35" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M50 50 Q60 45 70 50" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const CalendarIllustration = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    className="text-muted-foreground"
  >
    {/* Calendar base */}
    <rect x="30" y="35" width="60" height="50" rx="4" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Calendar header */}
    <rect x="30" y="35" width="60" height="12" fill="currentColor" />
    
    {/* Binding rings */}
    <circle cx="42" cy="30" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="78" cy="30" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    
    {/* Calendar grid */}
    <line x1="40" y1="55" x2="80" y2="55" stroke="currentColor" strokeWidth="0.5" />
    <line x1="40" y1="65" x2="80" y2="65" stroke="currentColor" strokeWidth="0.5" />
    <line x1="40" y1="75" x2="80" y2="75" stroke="currentColor" strokeWidth="0.5" />
    
    <line x1="45" y1="47" x2="45" y2="85" stroke="currentColor" strokeWidth="0.5" />
    <line x1="55" y1="47" x2="55" y2="85" stroke="currentColor" strokeWidth="0.5" />
    <line x1="65" y1="47" x2="65" y2="85" stroke="currentColor" strokeWidth="0.5" />
    <line x1="75" y1="47" x2="75" y2="85" stroke="currentColor" strokeWidth="0.5" />
    
    {/* Some filled dates */}
    <circle cx="50" cy="61" r="2" fill="currentColor" />
    <circle cx="70" cy="71" r="2" fill="currentColor" />
  </svg>
);

export const TeamIllustration = () => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    className="text-muted-foreground"
  >
    {/* Three simple people */}
    {/* Person 1 */}
    <circle cx="45" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M38 55 Q45 50 52 55" stroke="currentColor" strokeWidth="1.5" fill="none" />
    
    {/* Person 2 */}
    <circle cx="60" cy="35" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M52 52 Q60 47 68 52" stroke="currentColor" strokeWidth="1.5" fill="none" />
    
    {/* Person 3 */}
    <circle cx="75" cy="40" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M68 55 Q75 50 82 55" stroke="currentColor" strokeWidth="1.5" fill="none" />
    
    {/* Connection lines */}
    <line x1="51" y1="47" x2="54" y2="45" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
    <line x1="66" y1="45" x2="69" y2="47" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
  </svg>
);