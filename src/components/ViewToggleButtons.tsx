import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Eye, Printer, Maximize2, Download, Trash2, Settings } from "lucide-react";
import { WorkAreaDialog } from "./WorkAreaDialog";
import { CalendarPublishButton } from "./CalendarPublishButton";
import { toast } from "@/hooks/use-toast";
type ViewMode = "employee" | "workarea";
interface ViewToggleButtonsProps {
  onPrint?: () => void;
  onFullScreen?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  // Publishing props
  isPublished?: boolean;
  isDraft?: boolean;
  canPublish?: boolean;
  isPublishing?: boolean;
  publishedAt?: string;
  version?: number;
  hasUnpublishedChanges?: boolean;
  onPublish?: () => Promise<boolean>;
  onUnpublish?: () => Promise<boolean>;
}
export function ViewToggleButtons({
  onPrint,
  onFullScreen,
  onExport,
  onDelete,
  isPublished = false,
  isDraft = true,
  canPublish = false,
  isPublishing = false,
  publishedAt,
  version,
  hasUnpublishedChanges = false,
  onPublish,
  onUnpublish
}: ViewToggleButtonsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("employee");
  const [showWorkAreaDialog, setShowWorkAreaDialog] = useState(false);
  const [showEyeMenu, setShowEyeMenu] = useState(false);
  const handleWorkAreaClick = () => {
    setViewMode("workarea");
    setShowWorkAreaDialog(true);
  };
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      toast({
        title: "Imprimiendo calendario",
        description: "Preparando la versión para imprimir..."
      });
    }
    setShowEyeMenu(false);
  };
  const handleFullScreen = () => {
    if (onFullScreen) {
      onFullScreen();
    }
    setShowEyeMenu(false);
  };
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    setShowEyeMenu(false);
  };
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };
  const handlePublishWrapper = async () => {
    if (onPublish) {
      return await onPublish();
    }
    return false;
  };
  const handleUnpublishWrapper = async () => {
    if (onUnpublish) {
      return await onUnpublish();
    }
    return false;
  };
  // If only publish functionality is needed (no other buttons), show just the publish button
  if (onPublish && onUnpublish && !onPrint && !onFullScreen && !onExport && !onDelete) {
    return (
      <TooltipProvider>
        <CalendarPublishButton 
          isPublished={isPublished} 
          isDraft={isDraft} 
          canPublish={canPublish} 
          isPublishing={isPublishing} 
          publishedAt={publishedAt} 
          version={version} 
          hasUnpublishedChanges={hasUnpublishedChanges}
          onPublish={handlePublishWrapper} 
          onUnpublish={handleUnpublishWrapper} 
          disabled={isPublishing} 
        />
      </TooltipProvider>
    );
  }

  return <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* Publish button */}
          {onPublish && onUnpublish && <CalendarPublishButton isPublished={isPublished} isDraft={isDraft} canPublish={canPublish} isPublishing={isPublishing} publishedAt={publishedAt} version={version} hasUnpublishedChanges={hasUnpublishedChanges} onPublish={handlePublishWrapper} onUnpublish={handleUnpublishWrapper} disabled={isPublishing} />}

          {/* Delete button */}
          {onDelete && <Tooltip>
              <TooltipTrigger asChild>
                
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-[9px]">Eliminar</p>
              </TooltipContent>
            </Tooltip>}

          {/* Settings/Gear icon placeholder */}
          <Tooltip>
            <TooltipTrigger asChild>
              
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-[9px]">Configuración</p>
            </TooltipContent>
          </Tooltip>
        </div>

      </div>

      <WorkAreaDialog isOpen={showWorkAreaDialog} onClose={() => setShowWorkAreaDialog(false)} />
    </TooltipProvider>;
}