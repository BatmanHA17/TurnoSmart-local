import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { useRotaMembers } from '@/hooks/useRota';
import { useRotaShifts, useRotaSchedule } from '@/hooks/useRotaShifts';
import { toast } from '@/hooks/use-toast';

interface RotaCalendarViewProps {
  rotaId: string;
  rotaName: string;
}

export function RotaCalendarView({ rotaId, rotaName }: RotaCalendarViewProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedColaborador, setSelectedColaborador] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');

  const { members: rotaMembers } = useRotaMembers(rotaId);
  const { rotaShifts } = useRotaShifts(rotaId);
  const { scheduleAssignments, assignShiftToDay, loading } = useRotaSchedule(
    rotaId,
    format(currentWeek, 'yyyy-MM-dd'),
    format(addDays(currentWeek, 6), 'yyyy-MM-dd')
  );

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const getAssignmentForDay = (colaboradorId: string, date: Date) => {
    return scheduleAssignments.find(
      assignment => 
        assignment.colaborador_id === colaboradorId && 
        isSameDay(new Date(assignment.work_date), date)
    );
  };

  const getShiftDetails = (shiftId: string | null) => {
    if (!shiftId) return null;
    return rotaShifts.find(shift => shift.id === shiftId);
  };

  const handleAssignShift = async () => {
    if (!selectedDate || !selectedColaborador || !selectedShift) {
      toast({
        title: "Error",
        description: "Selecciona fecha, colaborador y turno",
        variant: "destructive",
      });
      return;
    }

    const success = await assignShiftToDay(
      selectedColaborador,
      format(selectedDate, 'yyyy-MM-dd'),
      selectedShift
    );

    if (success) {
      setSelectedDate(null);
      setSelectedColaborador('');
      setSelectedShift('');
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Calendario - {rotaName}</h3>
          <p className="text-muted-foreground">
            Semana del {format(currentWeek, 'dd MMM', { locale: es })} al {format(addDays(currentWeek, 6), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Asignación rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Asignar Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Select value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''} onValueChange={(value) => setSelectedDate(new Date(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fecha" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={format(day, 'yyyy-MM-dd')} value={format(day, 'yyyy-MM-dd')}>
                      {format(day, 'EEEE dd MMM', { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Colaborador</label>
              <Select value={selectedColaborador} onValueChange={setSelectedColaborador}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {rotaMembers.map((member) => (
                    <SelectItem key={member.colaborador_id} value={member.colaborador_id}>
                      {member.colaborador?.nombre} {member.colaborador?.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Turno</label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  {rotaShifts.filter(shift => !selectedColaborador || shift.colaborador_id === selectedColaborador).map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.start_time} - {shift.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAssignShift}
                disabled={!selectedDate || !selectedColaborador || !selectedShift || loading}
                className="w-full"
              >
                Asignar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario semanal */}
      <div className="grid grid-cols-8 gap-4">
        {/* Columna de colaboradores */}
        <div className="space-y-2">
          <div className="h-12 flex items-center">
            <span className="text-sm font-medium">Colaboradores</span>
          </div>
          {rotaMembers.map((member) => (
            <div key={member.colaborador_id} className="h-16 p-2 bg-muted rounded-lg flex items-center">
              <div className="text-xs">
                <div className="font-medium truncate">
                  {member.colaborador?.nombre}
                </div>
                <div className="text-muted-foreground truncate">
                  {member.colaborador?.apellidos}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Columnas de días */}
        {weekDays.map((day) => (
          <div key={format(day, 'yyyy-MM-dd')} className="space-y-2">
            <div className="h-12 p-2 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
              <div className="text-xs font-medium">
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className="text-sm">
                {format(day, 'dd')}
              </div>
            </div>
            
            {rotaMembers.map((member) => {
              const assignment = getAssignmentForDay(member.colaborador_id, day);
              const shiftDetails = assignment?.rota_shift_id ? getShiftDetails(assignment.rota_shift_id) : null;
              
              return (
                <div 
                  key={`${member.colaborador_id}-${format(day, 'yyyy-MM-dd')}`}
                  className="h-16 p-1 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedDate(day)}
                >
                  {assignment ? (
                    <div className="h-full flex flex-col justify-center">
                      {shiftDetails ? (
                        <div 
                          className="text-xs p-1 rounded text-white text-center"
                          style={{ backgroundColor: shiftDetails.color }}
                        >
                          <div className="font-medium truncate">
                            {shiftDetails.shift_name}
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{shiftDetails.start_time}</span>
                          </div>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {assignment.status_code}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">-</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leyenda de turnos */}
      {rotaShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Turnos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {rotaShifts.map((shift) => (
                <div key={shift.id} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: shift.color }}
                  />
                  <span className="text-sm">
                    {shift.shift_name} ({shift.start_time} - {shift.end_time})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}