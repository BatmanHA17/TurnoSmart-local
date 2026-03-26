import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropZonesProps {
  isActive: boolean;
  onMoveHover: (isHovering: boolean) => void;
  onDuplicateHover: (isHovering: boolean) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  className?: string;
  hoveredZone?: 'move' | 'duplicate' | null;
}

export const DragDropZones = ({ 
  isActive, 
  onMoveHover, 
  onDuplicateHover, 
  onDragOver,
  onDrop,
  className,
  hoveredZone 
}: DragDropZonesProps) => {
  if (!isActive) return null;

  return (
    <div className={cn("absolute inset-0 flex z-10 pointer-events-none", className)}
         onMouseDown={(e) => e.stopPropagation()}
         onMouseUp={(e) => e.stopPropagation()}
    >
      {/* Zona MOVER - Lado izquierdo */}
      <div 
        className={cn(
          "flex-1 border backdrop-blur-sm flex items-center justify-center transition-all duration-200 pointer-events-auto rounded-sm relative overflow-hidden",
          hoveredZone === 'move' 
            ? "bg-sky-100/80 border-sky-300/60 shadow-lg scale-105 z-10" 
            : hoveredZone === 'duplicate' 
              ? "bg-gray-50/20 border-gray-200/20 opacity-40 scale-95" 
              : "bg-sky-50/30 border-sky-200/30"
        )}
        onMouseEnter={() => onMoveHover(true)}
        onMouseLeave={() => onMoveHover(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop(e);
        }}
        data-drop-action="move"
      >
        {/* Efecto de brillo cuando está activo */}
        {hoveredZone === 'move' && (
          <div className="absolute inset-0 bg-gradient-to-r from-sky-200/30 to-sky-300/30 animate-pulse" />
        )}
        <div className={cn(
          "flex items-center justify-center transition-all duration-200 relative z-10",
          hoveredZone === 'move' 
            ? "text-sky-700 font-medium scale-110" 
            : hoveredZone === 'duplicate' 
              ? "text-gray-300" 
              : "text-sky-600"
        )} data-drop-action="move">
          <span className="text-xs tracking-wide select-none" data-drop-action="move">
            {hoveredZone === 'move' ? "📦 Mover" : "Mover"}
          </span>
        </div>
      </div>
      
      {/* Zona DUPLICAR - Lado derecho */}
      <div 
        className={cn(
          "flex-1 border backdrop-blur-sm flex items-center justify-center transition-all duration-200 pointer-events-auto rounded-sm relative overflow-hidden",
          hoveredZone === 'duplicate' 
            ? "bg-sky-100/80 border-sky-300/60 shadow-lg scale-105 z-10" 
            : hoveredZone === 'move' 
              ? "bg-gray-50/20 border-gray-200/20 opacity-40 scale-95" 
              : "bg-sky-50/30 border-sky-200/30"
        )}
        onMouseEnter={() => onDuplicateHover(true)}
        onMouseLeave={() => onDuplicateHover(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(e);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop(e);
        }}
        data-drop-action="duplicate"
      >
        {/* Efecto de brillo cuando está activo */}
        {hoveredZone === 'duplicate' && (
          <div className="absolute inset-0 bg-gradient-to-l from-sky-200/30 to-sky-300/30 animate-pulse" />
        )}
        <div className={cn(
          "flex items-center justify-center transition-all duration-200 relative z-10",
          hoveredZone === 'duplicate' 
            ? "text-sky-700 font-medium scale-110" 
            : hoveredZone === 'move' 
              ? "text-gray-300" 
              : "text-sky-600"
        )} data-drop-action="duplicate">
          <span className="text-xs tracking-wide select-none" data-drop-action="duplicate">
            {hoveredZone === 'duplicate' ? "📋 Duplicar" : "Duplicar"}
          </span>
        </div>
      </div>
    </div>
  );
};

interface DeleteZoneProps {
  isVisible: boolean;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const DeleteZone = ({ 
  isVisible, 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop 
}: DeleteZoneProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[45] transition-all duration-300 ease-out cursor-pointer",
        isDragOver 
          ? "h-12 bg-red-500/30 border-t-4 border-red-500" 
          : "h-8 bg-red-100/40 border-t-4 border-red-200/50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(e);
      }}
      onDragEnter={() => {
        // Permitir eventos cuando el drag entra en la zona
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e);
      }}
    >
      <div className="flex items-center justify-center h-full w-full">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-200",
          isDragOver 
            ? "scale-110 text-red-600 font-semibold" 
            : "text-red-400/80"
        )}>
          <Trash2 className={cn("transition-all duration-200", isDragOver ? "h-6 w-6" : "h-5 w-5")} />
          <span className={cn("text-xs transition-all duration-200", isDragOver && "text-sm")}>
            Suelta aquí para eliminar
          </span>
        </div>
      </div>
    </div>
  );
};