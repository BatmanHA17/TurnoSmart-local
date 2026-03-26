import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OverviewStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  className?: string;
}

const getVariantStyles = (variant: string) => {
  switch (variant) {
    case 'success':
      return {
        card: 'border-green-200 bg-gradient-to-br from-green-50 to-green-100',
        value: 'text-green-700',
        title: 'text-green-600',
      };
    case 'warning':
      return {
        card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100',
        value: 'text-orange-700',
        title: 'text-orange-600',
      };
    case 'info':
      return {
        card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100',
        value: 'text-blue-700',
        title: 'text-blue-600',
      };
    case 'danger':
      return {
        card: 'border-red-200 bg-gradient-to-br from-red-50 to-red-100',
        value: 'text-red-700',
        title: 'text-red-600',
      };
    default:
      return {
        card: 'border-border/50 bg-gradient-to-br from-card to-muted/20',
        value: 'text-foreground',
        title: 'text-muted-foreground',
      };
  }
};

export const OverviewStatsCard: React.FC<OverviewStatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  variant = 'default',
  className,
}) => {
  const styles = getVariantStyles(variant);

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md cursor-pointer border',
      styles.card,
      className
    )}>
      <CardContent className="p-6">
        <div className="space-y-2">
          {/* Título */}
          <p className={cn('text-sm font-medium uppercase tracking-wide', styles.title)}>
            {title}
          </p>
          
          {/* Valor principal */}
          <div className="flex items-baseline gap-2">
            <p className={cn('text-3xl font-bold', styles.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* Tendencia */}
            {trend && (
              <span className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          
          {/* Subtítulo */}
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};