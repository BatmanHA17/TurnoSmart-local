import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarStatusBadgeProps {
  status: 'draft' | 'published';
  version?: number;
  publishedAt?: string;
  className?: string;
}

export const CalendarStatusBadge: React.FC<CalendarStatusBadgeProps> = ({
  status,
  version,
  publishedAt,
  className
}) => {
  if (status === 'draft') {
    return null; // No mostrar badge para borrador
  }

  const formatPublishedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return "Fecha no disponible";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary"
            className={cn(
              "bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-2 py-1 cursor-help",
              className
            )}
          >
            Publicado {version && `v${version}`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p><strong>Estado:</strong> Publicado</p>
            {version && <p><strong>Versión:</strong> {version}</p>}
            {publishedAt && (
              <p><strong>Publicado:</strong> {formatPublishedDate(publishedAt)}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};