import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotionCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "default" | "lg";
  onClick?: () => void;
}

// Notion-style card with minimal borders and subtle shadows
export const NotionCard = ({
  children,
  className,
  hover = false,
  padding = "default",
  onClick,
}: NotionCardProps) => {
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    default: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-background border border-border/40 rounded-lg transition-all duration-150",
        hover && "hover:border-border/60 hover:shadow-sm cursor-pointer",
        onClick && "cursor-pointer",
        paddingClasses[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

// Clean stat card in Notion style
export const StatCard = ({
  title,
  value,
  description,
  trend,
  className,
}: StatCardProps) => {
  return (
    <NotionCard className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold text-foreground leading-none">
          {value}
        </p>
      </div>
      
      {(description || trend) && (
        <div className="space-y-1">
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <Badge
                variant={trend.value >= 0 ? "default" : "secondary"}
                className="text-xs font-medium"
              >
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      )}
    </NotionCard>
  );
};

interface InfoPanelProps {
  title: string;
  content: React.ReactNode;
  type?: "info" | "warning" | "success" | "neutral";
  className?: string;
}

// Subtle info panel like Notion's callouts
export const InfoPanel = ({
  title,
  content,
  type = "neutral",
  className,
}: InfoPanelProps) => {
  const typeStyles = {
    info: "bg-notion-blue-bg border-notion-blue-text/20",
    warning: "bg-notion-yellow-bg border-notion-yellow-text/20",
    success: "bg-notion-green-bg border-notion-green-text/20",
    neutral: "bg-muted/50 border-muted/10",
  };

  return (
    <div
      className={cn(
        "border-l-4 p-4 rounded-r-lg space-y-2",
        typeStyles[type],
        className
      )}
    >
      <h4 className="text-sm font-medium text-foreground">
        {title}
      </h4>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {content}
      </div>
    </div>
  );
};

interface ListItemProps {
  title: string;
  description?: string;
  meta?: string;
  action?: React.ReactNode;
  avatar?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Clean list item component
export const ListItem = ({
  title,
  description,
  meta,
  action,
  avatar,
  className,
  onClick,
}: ListItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors duration-150",
        onClick && "hover:bg-muted/50 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {avatar && (
        <div className="flex-shrink-0">
          {avatar}
        </div>
      )}
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-foreground leading-tight truncate">
            {title}
          </h4>
          {meta && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {meta}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
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
  );
};