import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Megaphone, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from "@/hooks/use-toast";

interface CalendarPublishButtonProps {
  isPublished: boolean;
  isDraft: boolean;
  canPublish: boolean;
  isPublishing?: boolean;
  publishedAt?: string;
  version?: number;
  hasUnpublishedChanges?: boolean;
  onPublish: () => Promise<boolean>;
  onUnpublish: () => Promise<boolean>;
  disabled?: boolean;
}

export const CalendarPublishButton: React.FC<CalendarPublishButtonProps> = ({
  isPublished,
  isDraft,
  canPublish,
  isPublishing = false,
  publishedAt,
  version = 1,
  hasUnpublishedChanges = false,
  onPublish,
  onUnpublish,
  disabled = false
}) => {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const handleClick = () => {
    if (!canPublish) {
      toast({
        title: "Sin permisos",
        description: "No tiene permisos para publicar calendarios",
        variant: "destructive"
      });
      return;
    }

    // Si está publicado pero hay cambios sin publicar → re-publicar
    if (isPublished && hasUnpublishedChanges) {
      setShowPublishDialog(true);
    } 
    // Si está en draft → publicar por primera vez
    else if (isDraft) {
      setShowPublishDialog(true);
    } 
    // Si está publicado sin cambios → modificar (despublicar)
    else if (isPublished) {
      setShowUnpublishDialog(true);
    }
  };

  const handlePublish = async () => {
    const success = await onPublish();
    setShowPublishDialog(false);
    
    if (success) {
      toast({
        title: "Calendario publicado",
        description: "El calendario ha sido publicado exitosamente",
        duration: 5000,
      });
    }
  };

  const handleUnpublish = async () => {
    const success = await onUnpublish();
    setShowUnpublishDialog(false);
    
    if (success) {
      toast({
        title: "Calendario en borrador",
        description: "El calendario ha vuelto al estado de borrador",
        duration: 5000,
      });
    }
  };

  const getTooltipText = () => {
    if (!canPublish) return "Sin permisos para publicar";
    if (isPublishing) return "Procesando...";
    if (hasUnpublishedChanges && isPublished) return "Publicar cambios del calendario";
    if (isDraft) return "Publicar calendario";
    if (isPublished && publishedAt) {
      return `Calendario publicado el ${formatDate(publishedAt)}`;
    }
    if (isPublished) return "Calendario publicado";
    return "Publicar calendario";
  };

  const formatDate = (dateString: string) => {
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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-accent"
            onClick={handleClick}
            disabled={disabled || isPublishing || !canPublish}
          >
            {isPublishing ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Megaphone 
                className={`h-2.5 w-2.5 ${
                  isPublished 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-muted-foreground'
                }`} 
              />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-[9px]">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>

      {/* Publish Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasUnpublishedChanges && isPublished 
                ? "Re-publicar Calendario con Cambios" 
                : "Publicar Calendario"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasUnpublishedChanges && isPublished ? (
                // Mensaje para RE-PUBLICACIÓN
                <>
                  Este calendario ya fue publicado. ¿Desea re-publicarlo con los cambios realizados?
                  <br /><br />
                  <strong>Al re-publicar:</strong>
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Solo los empleados afectados recibirán un email de actualización</li>
                    <li>Se enviará la versión {version + 1} con los nuevos turnos</li>
                    <li>El email incluirá el indicador "MODIFICADO"</li>
                  </ul>
                </>
              ) : (
                // Mensaje para PRIMERA PUBLICACIÓN
                <>
                  ¿Está seguro de que desea publicar este calendario?
                  <br /><br />
                  <strong>Una vez publicado:</strong>
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Todos los empleados recibirán un email con sus turnos</li>
                    <li>Se enviará la versión {version} a los empleados</li>
                    <li>Podrá modificarlo y re-publicar posteriormente</li>
                  </ul>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>
              {hasUnpublishedChanges && isPublished 
                ? "Re-publicar con cambios" 
                : "Publicar Calendario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unpublish Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modificar Calendario Publicado</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <div>
                  <strong>Estado actual:</strong> Publicado
                </div>
                {publishedAt && (
                  <div>
                    <strong>Fecha de publicación:</strong> {formatDate(publishedAt)}
                  </div>
                )}
                <div>
                  <strong>Versión:</strong> {version}
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    ¿Desea hacer modificaciones al calendario?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    El calendario volverá al estado de "Borrador" y podrá editarlo nuevamente.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnpublish}>
              Sí, modificar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};