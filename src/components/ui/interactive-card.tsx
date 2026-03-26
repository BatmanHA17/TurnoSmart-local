import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, GripVertical, Plus } from "lucide-react";

interface InteractiveCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  expandable?: boolean;
  draggable?: boolean;
  className?: string;
}

export const InteractiveCard = ({
  title,
  description,
  children,
  expandable = false,
  draggable = false,
  className,
}: InteractiveCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleToggle = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={cn(
        "group relative",
        isDragging && "opacity-60",
        className
      )}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={draggable}
    >
      {/* Drag handle - appears on hover like Notion */}
      {draggable && (
        <div className="drag-handle absolute -left-6 top-2 flex items-center justify-center w-4 h-6 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      
      {/* Add button - appears on hover */}
      <div className="drag-handle absolute -left-6 top-8 flex items-center justify-center w-4 h-6">
        <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground hover-notion cursor-pointer" />
      </div>

      <Card className={cn(
        "hover-notion hover:shadow-sm cursor-pointer transition-shadow duration-150",
        expandable && "select-none"
      )}>
        <CardHeader 
          className="pb-3"
          onClick={handleToggle}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {expandable && (
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 chevron-expandable text-muted-foreground",
                      isExpanded && "chevron-expanded"
                    )}
                  />
                )}
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1 text-sm">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Expandable content with accordion animation */}
        {expandable && (
          <div 
            className={cn(
              "overflow-hidden transition-all duration-200 ease-out",
              isExpanded ? "animate-slide-down" : "animate-slide-up hidden"
            )}
          >
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </div>
        )}
        
        {/* Non-expandable content */}
        {!expandable && children && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  );
};