import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export interface CustomAbsence {
  id: string;
  name: string;
  code: string;
  color: string;
  description?: string;
  isCustom: true;
  createdAt: string;
}

interface CreateAbsenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAbsenceSaved: (absence: CustomAbsence) => void;
  absenceToEdit?: CustomAbsence | null;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export const CreateAbsenceDialog: React.FC<CreateAbsenceDialogProps> = ({
  open,
  onOpenChange,
  onAbsenceSaved,
  absenceToEdit
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [description, setDescription] = useState('');

  const isEditing = !!absenceToEdit;

  // Pre-fill form when editing
  useEffect(() => {
    if (absenceToEdit) {
      setName(absenceToEdit.name);
      setCode(absenceToEdit.code);
      setColor(absenceToEdit.color);
      setDescription(absenceToEdit.description || '');
    } else {
      setName('');
      setCode('');
      setColor('#8b5cf6');
      setDescription('');
    }
  }, [absenceToEdit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    
    if (!code.trim() || code.length > 3) {
      toast({ title: "El código debe tener 1-3 caracteres", variant: "destructive" });
      return;
    }

    const absence: CustomAbsence = {
      id: isEditing ? absenceToEdit!.id : `${code.toUpperCase()}-custom-${Date.now()}`,
      name: name.trim(),
      code: code.toUpperCase().trim(),
      color,
      description: description.trim() || undefined,
      isCustom: true,
      createdAt: isEditing ? absenceToEdit!.createdAt : new Date().toISOString()
    };

    onAbsenceSaved(absence);
    
    // Reset form
    setName('');
    setCode('');
    setColor('#8b5cf6');
    setDescription('');
    onOpenChange(false);
    
    toast({ title: isEditing ? `Ausencia "${absence.name}" actualizada` : `Ausencia "${absence.name}" creada` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? 'Editar Ausencia' : 'Nueva Ausencia Personalizada'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Asuntos propios"
              className="h-8 text-sm"
              maxLength={30}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs">Código (1-3 caracteres)</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: AP"
              className="h-8 text-sm w-20"
              maxLength={3}
            />
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-1 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Días de asuntos propios según convenio"
              className="h-8 text-sm"
              maxLength={100}
            />
          </div>

          {/* Preview */}
          <div className="pt-2 border-t">
            <span className="text-[10px] text-muted-foreground">Vista previa:</span>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 rounded border bg-background">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium">{name || 'Nombre'}</span>
              <span className="text-[10px] text-muted-foreground">({code || 'XX'})</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              {isEditing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
