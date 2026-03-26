import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Undo2, Redo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UndoRedoToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  futureSize: number;
  onUndo: () => void;
  onRedo: () => void;
  hasUnsavedChanges?: boolean;
  changeCount?: number;
}

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  historySize,
  futureSize,
  onUndo,
  onRedo,
  hasUnsavedChanges = false,
  changeCount = 0,
}: UndoRedoToolbarProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const undoShortcut = isMac ? '⌘Z' : 'Ctrl+Z';
  const redoShortcut = isMac ? '⌘Y' : 'Ctrl+Y';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border-l pl-3 ml-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 px-2"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deshacer ({undoShortcut})</p>
            {historySize > 0 && <p className="text-xs text-muted-foreground">{historySize} paso{historySize > 1 ? 's' : ''} disponible{historySize > 1 ? 's' : ''}</p>}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 px-2"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rehacer ({redoShortcut})</p>
            {futureSize > 0 && <p className="text-xs text-muted-foreground">{futureSize} paso{futureSize > 1 ? 's' : ''} disponible{futureSize > 1 ? 's' : ''}</p>}
          </TooltipContent>
        </Tooltip>

        {hasUnsavedChanges && changeCount > 0 && (
          <Badge variant="outline" className="ml-2 text-xs">
            {changeCount} cambio{changeCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
