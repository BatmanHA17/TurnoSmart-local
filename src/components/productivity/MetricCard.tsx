import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  icon: LucideIcon;
}

export function MetricCard({ title, value, subtitle, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="mt-1 text-2xl font-bold text-foreground leading-tight">{value}</p>
            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                  trend.positive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="shrink-0 rounded-xl bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
