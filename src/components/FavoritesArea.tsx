import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { SavedShift } from "@/store/savedShiftsStore";
import { Coffee, Plus, X, Pencil } from "lucide-react";
import { CreateAbsenceDialog, CustomAbsence } from './CreateAbsenceDialog';

export const CUSTOM_ABSENCES_KEY = 'turnosmart-custom-absences';

export const getCustomAbsences = (): CustomAbsence[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_ABSENCES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCustomAbsences = (absences: CustomAbsence[]) => {
  localStorage.setItem(CUSTOM_ABSENCES_KEY, JSON.stringify(absences));
};

export const defaultAbsenceShifts: SavedShift[] = [
  { id: 'L-default', name: 'Libre', startTime: '', endTime: '', color: '#10b981', accessType: 'absence', isSystemDefault: true, description: 'Día libre', createdAt: new Date(), updatedAt: new Date() },
  { id: 'V-default', name: 'Vacaciones', startTime: '', endTime: '', color: '#3b82f6', accessType: 'absence', isSystemDefault: true, description: 'Vacaciones', createdAt: new Date(), updatedAt: new Date() },
  { id: 'E-default', name: 'Enfermo', startTime: '', endTime: '', color: '#ef4444', accessType: 'absence', isSystemDefault: true, description: 'Baja por enfermedad', createdAt: new Date(), updatedAt: new Date() },
  { id: 'P-default', name: 'Permiso', startTime: '', endTime: '', color: '#f59e0b', accessType: 'absence', isSystemDefault: true, description: 'Permiso autorizado', createdAt: new Date(), updatedAt: new Date() },
  { id: 'C-default', name: 'Curso', startTime: '', endTime: '', color: '#8b5cf6', accessType: 'absence', isSystemDefault: true, description: 'Formación', createdAt: new Date(), updatedAt: new Date() },
  { id: 'F-default', name: 'Festivo', startTime: '', endTime: '', color: '#ec4899', accessType: 'absence', isSystemDefault: true, description: 'Día festivo', createdAt: new Date(), updatedAt: new Date() },
  { id: 'G-default', name: 'Guardia', startTime: '', endTime: '', color: '#8b5cf6', accessType: 'absence', isSystemDefault: true, description: 'Guardia', createdAt: new Date(), updatedAt: new Date() },
  { id: 'DG-default', name: 'Descanso Guardia', startTime: '', endTime: '', color: '#64748b', accessType: 'absence', isSystemDefault: true, description: 'Descanso de guardia', createdAt: new Date(), updatedAt: new Date() },
];

interface FavoritesAreaProps {
  isVisible: boolean;
  favoriteShifts: SavedShift[];
  onDragStart: (e: React.DragEvent, shift: SavedShift) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemoveFavorite: (shiftId: string) => void;
}

export const FavoritesArea: React.FC<FavoritesAreaProps> = ({
  isVisible,
  favoriteShifts,
  onDragStart,
  onDrop,
  onDragOver,
  onRemoveFavorite
}) => {
  const [customAbsences, setCustomAbsences] = useState<CustomAbsence[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<CustomAbsence | null>(null);

  useEffect(() => {
    const customAbs = getCustomAbsences();
    setCustomAbsences(customAbs);
  }, []);

  const handleAbsenceSaved = (absence: CustomAbsence) => {
    let updated: CustomAbsence[];
    
    if (editingAbsence) {
      // Update existing
      updated = customAbsences.map(a => a.id === absence.id ? absence : a);
    } else {
      // Add new
      updated = [...customAbsences, absence];
    }
    
    setCustomAbsences(updated);
    saveCustomAbsences(updated);
    setEditingAbsence(null);
  };

  const handleEditAbsence = (absence: CustomAbsence) => {
    setEditingAbsence(absence);
    setDialogOpen(true);
  };

  const handleRemoveCustomAbsence = (id: string) => {
    const updated = customAbsences.filter(a => a.id !== id);
    setCustomAbsences(updated);
    saveCustomAbsences(updated);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAbsence(null);
    }
  };

  if (!isVisible) return null;

  const customAbsenceShifts: SavedShift[] = customAbsences.map(ca => ({
    id: ca.id,
    name: ca.name,
    startTime: '',
    endTime: '',
    color: ca.color,
    accessType: 'absence',
    isSystemDefault: false,
    description: ca.description,
    createdAt: new Date(ca.createdAt),
    updatedAt: new Date(ca.createdAt)
  }));

  const sortShiftsByTime = (shifts: SavedShift[]) => {
    return shifts.sort((a, b) => {
      if (a.accessType === 'absence' && b.accessType !== 'absence') return 1;
      if (b.accessType === 'absence' && a.accessType !== 'absence') return -1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      return 0;
    });
  };

  const sortedFavoriteShifts = sortShiftsByTime([...favoriteShifts]);
  const workShifts = sortedFavoriteShifts.filter(s => s.accessType !== 'absence');
  const allAbsenceShifts = [...defaultAbsenceShifts, ...customAbsenceShifts];

  return (
    <div className="w-full animate-fade-in">
      <Card 
        className="p-1 mb-1.5 bg-gradient-to-r from-background to-muted/30 border-dashed border border-muted-foreground/20 rounded-lg shadow-sm"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></div>
          <h3 className="text-[10px] font-medium text-muted-foreground">Favoritos</h3>
          <span className="text-[8px] text-muted-foreground/60 ml-0.5">(se adaptan al contrato)</span>
        </div>
        
        {/* Sección de Ausencias */}
        <div className="flex flex-wrap gap-1">
          <div className="flex items-center gap-1 w-full mb-0.5">
            <span className="text-[8px] text-muted-foreground/60">Ausencias:</span>
            <button
              onClick={() => {
                setEditingAbsence(null);
                setDialogOpen(true);
              }}
              className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title="Crear ausencia personalizada"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
          
          {allAbsenceShifts.map((shift) => {
            const isCustom = !shift.isSystemDefault;
            const customAbsenceData = isCustom ? customAbsences.find(ca => ca.id === shift.id) : null;
            const absenceCode = isCustom 
              ? customAbsenceData?.code || shift.id.split('-')[0]
              : shift.id.split('-')[0];
            
            return (
              <div
                key={shift.id}
                className="relative group"
                draggable
                onDragStart={(e) => {
                  const dragData = {
                    type: 'favorite',
                    shift: shift,
                    isFavorite: true,
                    isAbsence: true,
                    absenceCode: absenceCode
                  };
                  e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                  onDragStart(e, shift);
                }}
              >
                <div className="transition-all duration-200 hover:scale-105 cursor-move">
                  <Card className="px-1.5 py-0.5 text-[9px] font-medium rounded border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm min-w-fit">
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: shift.color }}
                      ></div>
                      <span className="text-foreground/90 font-light whitespace-nowrap">
                        {shift.name}
                      </span>
                    </div>
                  </Card>
                </div>
                
                {isCustom && customAbsenceData && (
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleEditAbsence(customAbsenceData)}
                      className="w-3 h-3 bg-primary/80 hover:bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                      title="Editar ausencia"
                    >
                      <Pencil className="w-1.5 h-1.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveCustomAbsence(shift.id)}
                      className="w-3 h-3 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      title="Eliminar ausencia"
                    >
                      <X className="w-1.5 h-1.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {workShifts.length > 0 && <div className="w-full border-t border-border/30 my-1"></div>}
        
        {/* Sección de Horarios de trabajo */}
        <div className="flex flex-wrap gap-1">
          {workShifts.length > 0 && (
            <span className="text-[8px] text-muted-foreground/60 w-full mb-0.5">Mis horarios:</span>
          )}
          {workShifts.map((shift) => (
            <div
              key={shift.id}
              className="relative group"
              draggable
              onDragStart={(e) => {
                const dragData = { type: 'favorite', shift: shift, isFavorite: true };
                e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                onDragStart(e, shift);
              }}
            >
              <div className="transition-all duration-200 hover:scale-105 cursor-move">
                <Card className="px-1.5 py-0.5 text-[9px] font-medium rounded border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm min-w-fit relative">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: shift.color }} />
                    <span className="text-foreground/90 font-light whitespace-nowrap">{shift.name}</span>
                    {shift.startTime && shift.endTime && (
                      <span className="text-muted-foreground/70 text-[8px] ml-0.5">{shift.startTime}-{shift.endTime}</span>
                    )}
                    {shift.startTime && shift.endTime && (
                      <span className="text-blue-500/60 text-[7px] ml-0.5" title="Se adapta al contrato">📏</span>
                    )}
                  </div>
                  {shift.hasBreak && (
                    <div className="absolute -top-0.5 -left-0.5 z-10 bg-white/90 rounded-full p-[1px]">
                      <Coffee className="h-1.5 w-1.5 text-amber-700 drop-shadow-sm" />
                    </div>
                  )}
                </Card>
              </div>
              
              {!shift.isSystemDefault && (
                <button
                  onClick={() => onRemoveFavorite(shift.id)}
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  title="Eliminar de favoritos"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          
          {workShifts.length === 0 && (
            <div className="w-full py-1 text-center">
              <div className="text-muted-foreground/50 text-[9px]">
                <span className="text-xs mr-1">⭐</span>
                Arrastra turnos aquí para guardarlos
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <CreateAbsenceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onAbsenceSaved={handleAbsenceSaved}
        absenceToEdit={editingAbsence}
      />
    </div>
  );
};
