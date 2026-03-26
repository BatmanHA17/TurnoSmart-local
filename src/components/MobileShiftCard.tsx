import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, getDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Employee, StatusCode } from "@/types/database";

interface ShiftAssignment {
  employeeId: string;
  date: string;
  statusCode: string;
  startTime: string;
}

interface MobileShiftCardProps {
  employee: Employee;
  day: Date;
  assignment?: ShiftAssignment;
  statusCodes: StatusCode[];
  onUpdate: (employeeId: string, date: string, field: keyof ShiftAssignment, value: string) => void;
}

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const codesRequiringTime = ["C", "X", "XB"];

export const MobileShiftCard = ({
  employee,
  day,
  assignment,
  statusCodes,
  onUpdate
}: MobileShiftCardProps) => {
  const [isCustomTime, setIsCustomTime] = useState(false);
  const dateKey = format(day, "yyyy-MM-dd");

  const handleStatusChange = (value: string) => {
    onUpdate(employee.id, dateKey, "statusCode", value);
    if (value === "L") {
      setIsCustomTime(false);
    }
  };

  const handleTimeChange = (value: string) => {
    if (value === "custom") {
      setIsCustomTime(true);
      onUpdate(employee.id, dateKey, "startTime", "");
    } else {
      setIsCustomTime(false);
      onUpdate(employee.id, dateKey, "startTime", value);
    }
  };

  const handleCustomTimeChange = (value: string) => {
    onUpdate(employee.id, dateKey, "startTime", value);
  };

  const getStatusColor = (code: string): string => {
    const statusCode = statusCodes.find(sc => sc.code === code);
    return statusCode?.color || "#6b7280";
  };

  const timeSlots = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
  ];

  return (
    <Card className="bg-background border-2">
      <CardContent className="p-4 space-y-4">
        {/* Día */}
        <div className="text-center pb-2 border-b">
          <p className="text-sm text-muted-foreground">{dayNames[getDay(day)]}</p>
          <p className="text-xl font-bold">{format(day, "d 'de' MMMM", { locale: es })}</p>
        </div>

        {/* Estado/Código */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado del día</label>
          <Select
            value={assignment?.statusCode || "L"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              {statusCodes.map(code => (
                <SelectItem key={code.code} value={code.code}>
                  <div className="flex items-center gap-3 py-1">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: code.color }}
                    />
                    <div className="text-left">
                      <p className="font-medium">{code.code}</p>
                      <p className="text-sm text-muted-foreground">{code.description}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Horario (solo si el código lo requiere) */}
        {codesRequiringTime.includes(assignment?.statusCode || "L") && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Hora de entrada</label>
            
            {isCustomTime ? (
              <div className="space-y-2">
                <Input
                  value={assignment?.startTime || ""}
                  onChange={(e) => handleCustomTimeChange(e.target.value)}
                  placeholder="Ej: 10:35"
                  className="h-12 text-base text-center"
                  type="time"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCustomTime(false)}
                  className="w-full text-xs"
                >
                  Usar horarios predefinidos
                </Button>
              </div>
            ) : (
              <Select
                value={assignment?.startTime || ""}
                onValueChange={handleTimeChange}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar horario" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background max-h-60">
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <span>✏️</span>
                      Horario personalizado
                    </div>
                  </SelectItem>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time} className="text-base">
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Resumen visual */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t">
          <div className="text-center">
            <div 
              className="w-6 h-6 rounded-full mx-auto mb-1"
              style={{ backgroundColor: getStatusColor(assignment?.statusCode || "L") }}
            />
            <p className="text-xs font-medium">{assignment?.statusCode || "L"}</p>
          </div>
          {assignment?.startTime && (
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{assignment.startTime}</p>
              <p className="text-xs text-muted-foreground">Entrada</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};