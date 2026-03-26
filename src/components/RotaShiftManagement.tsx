import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Plus, Edit, Trash2, Palette } from 'lucide-react';
import { useRotaShifts } from '@/hooks/useRotaShifts';
import { useRotaMembers } from '@/hooks/useRota';
import { toast } from '@/hooks/use-toast';

interface RotaShiftManagementProps {
  rotaId: string;
  rotaName: string;
}

const SHIFT_COLORS = [
  { name: 'Gris claro', value: '#e5e7eb' },
  { name: 'Rosa claro', value: '#f3b9d1' },
  { name: 'Rosa oscuro', value: '#be185d' },
  { name: 'Magenta', value: '#a21caf' },
  { name: 'Púrpura', value: '#c026d3' },
  { name: 'Violeta', value: '#9333ea' },
  { name: 'Índigo', value: '#7c3aed' },
  { name: 'Azul', value: '#6366f1' },
  { name: 'Azul gris', value: '#64748b' },
  { name: 'Azul claro', value: '#7dd3fc' },
  { name: 'Azul medio', value: '#3b82f6' },
  { name: 'Azul oscuro', value: '#1e40af' },
  { name: 'Verde oscuro', value: '#065f46' },
  { name: 'Verde', value: '#047857' },
  { name: 'Verde medio', value: '#059669' },
  { name: 'Verde claro', value: '#bbf7d0' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Lima oscuro', value: '#65a30d' },
  { name: 'Lima claro', value: '#bef264' },
  { name: 'Gris', value: '#a3a3a3' },
  { name: 'Amarillo oscuro', value: '#ca8a04' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Verde muy oscuro', value: '#365314' },
  { name: 'Naranja', value: '#f59e0b' },
  { name: 'Naranja oscuro', value: '#ea580c' },
  { name: 'Rojo', value: '#dc2626' },
  { name: 'Rosa salmón', value: '#fca5a5' },
];

export const RotaShiftManagement = ({ rotaId, rotaName }: RotaShiftManagementProps) => {
  const { rotaShifts, loading, createRotaShift, updateRotaShift, deleteRotaShift } = useRotaShifts(rotaId);
  const { members } = useRotaMembers(rotaId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    colaborador_id: '',
    shift_name: '',
    start_time: '',
    end_time: '',
    break_duration: 0,
    color: '#86efac',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      colaborador_id: '',
      shift_name: '',
      start_time: '',
      end_time: '',
      break_duration: 0,
      color: '#86efac',
      notes: '',
    });
    setEditingShift(null);
  };

  const handleSubmit = async () => {
    if (!formData.colaborador_id || !formData.shift_name || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const shiftData = {
      rota_id: rotaId,
      ...formData,
    };

    try {
      if (editingShift) {
        await updateRotaShift(editingShift.id, shiftData);
      } else {
        await createRotaShift(shiftData);
      }
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving shift:', error);
    }
  };

  const handleEdit = (shift: any) => {
    setEditingShift(shift);
    setFormData({
      colaborador_id: shift.colaborador_id,
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_duration: shift.break_duration || 0,
      color: shift.color || '#86efac',
      notes: shift.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (shiftId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este horario?')) {
      await deleteRotaShift(shiftId);
    }
  };

  // Agrupar turnos por colaborador
  const shiftsByColaborador = rotaShifts.reduce((acc, shift) => {
    if (!acc[shift.colaborador_id]) {
      acc[shift.colaborador_id] = [];
    }
    acc[shift.colaborador_id].push(shift);
    return acc;
  }, {} as Record<string, typeof rotaShifts>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horarios de Rota: {rotaName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configura los horarios específicos para cada colaborador en esta rota
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Horario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingShift ? 'Editar Horario' : 'Crear Nuevo Horario'}
                </DialogTitle>
                <DialogDescription>
                  Define un horario específico para un colaborador en esta rota
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="colaborador">Colaborador</Label>
                  <Select
                    value={formData.colaborador_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, colaborador_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.colaborador_id} value={member.colaborador_id}>
                          {member.colaborador?.nombre} {member.colaborador?.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shift_name">Nombre del Horario</Label>
                  <Input
                    id="shift_name"
                    value={formData.shift_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift_name: e.target.value }))}
                    placeholder="ej: Turno Mañana, Turno Tarde..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Hora Inicio</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Hora Fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="break_duration">Descanso (minutos)</Label>
                  <Input
                    id="break_duration"
                    type="number"
                    min="0"
                    value={formData.break_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_duration: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SHIFT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingShift ? 'Actualizar' : 'Crear'} Horario
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando horarios...</p>
        ) : Object.keys(shiftsByColaborador).length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay horarios configurados para esta rota</p>
            <p className="text-sm text-muted-foreground">
              Crea horarios específicos para cada colaborador en esta rota
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(shiftsByColaborador).map(([colaboradorId, shifts]) => {
              const colaborador = members.find(m => m.colaborador_id === colaboradorId)?.colaborador;
              return (
                <div key={colaboradorId} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">
                    {colaborador?.nombre} {colaborador?.apellidos}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {shifts.map((shift) => (
                      <div 
                        key={shift.id} 
                        className="border rounded-lg p-3 flex items-center justify-between"
                        style={{ borderLeftColor: shift.color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{shift.shift_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {shift.start_time} - {shift.end_time}
                          </div>
                          {shift.break_duration > 0 && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {shift.break_duration}min descanso
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(shift)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(shift.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};