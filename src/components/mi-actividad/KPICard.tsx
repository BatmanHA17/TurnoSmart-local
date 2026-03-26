import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle: string;
  colorClass: string;
  iconBgClass: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const KPICard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  colorClass, 
  iconBgClass, 
  onClick,
  className,
  style
}: KPICardProps) => (
  <Card 
    className={cn(
      "group p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm",
      onClick && "cursor-pointer",
      className
    )}
    onClick={onClick}
    style={style}
  >
    <div className="flex items-center gap-4 mb-3">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconBgClass)}>
        <Icon className={cn("w-6 h-6", colorClass)} strokeWidth={1.5} />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
    <div className={cn("text-4xl font-bold mb-1", colorClass)}>{value}</div>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </Card>
);
