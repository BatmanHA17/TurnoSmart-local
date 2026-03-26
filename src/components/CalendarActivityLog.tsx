import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  UserPlus, 
  UserMinus, 
  Edit3, 
  Trash2, 
  Copy,
  Plus,
  MousePointer2,
  Timer
} from "lucide-react";

interface CalendarActivity {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  establishment: string;
  created_at: string;
  details?: any;
}

export function CalendarActivityLog() {
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activityFilter, setActivityFilter] = useState("all");

  useEffect(() => {
    fetchCalendarActivities();
  }, [dateFrom, dateTo]);

  const fetchCalendarActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .in('entity_type', ['calendar_shift', 'shift_management', 'employee_management'])
        .or('action.ilike.%TURNO%,action.ilike.%COLABORADOR%,action.ilike.%CALENDARIO%,action.ilike.%HORARIO%,action.ilike.%SHIFT%')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching calendar activities:', error);
      toast.error("Error al cargar las actividades del calendario");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleRowExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedRows(newExpanded);
  };

  const getActivityIcon = (action: string, entityType: string) => {
    if (action.includes('TURNO_CREADO') || action.includes('SHIFT_CREATED')) {
      return <Plus className="h-4 w-4 text-green-600" />;
    }
    if (action.includes('TURNO_EDITADO') || action.includes('SHIFT_EDITED')) {
      return <Edit3 className="h-4 w-4 text-blue-600" />;
    }
    if (action.includes('TURNO_ELIMINADO') || action.includes('SHIFT_DELETED')) {
      return <Trash2 className="h-4 w-4 text-red-600" />;
    }
    if (action.includes('TURNO_DUPLICADO') || action.includes('SHIFT_DUPLICATED')) {
      return <Copy className="h-4 w-4 text-purple-600" />;
    }
    if (action.includes('TURNO_MOVIDO') || action.includes('SHIFT_MOVED')) {
      return <MousePointer2 className="h-4 w-4 text-yellow-600" />;
    }
    if (action.includes('COLABORADOR_AÑADIDO') || action.includes('EMPLOYEE_ADDED')) {
      return <UserPlus className="h-4 w-4 text-green-600" />;
    }
    if (action.includes('COLABORADOR_ELIMINADO') || action.includes('EMPLOYEE_REMOVED')) {
      return <UserMinus className="h-4 w-4 text-red-600" />;
    }
    if (action.includes('TURNO_FAVORITO') || action.includes('FAVORITE_SHIFT')) {
      return <Timer className="h-4 w-4 text-orange-600" />;
    }
    return <Clock className="h-4 w-4 text-gray-600" />;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('CREADO') || action.includes('CREATED') || action.includes('AÑADIDO') || action.includes('ADDED')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (action.includes('EDITADO') || action.includes('EDITED') || action.includes('MOVIDO') || action.includes('MOVED')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('ELIMINADO') || action.includes('DELETED') || action.includes('REMOVED')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (action.includes('DUPLICADO') || action.includes('DUPLICATED')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (action.includes('FAVORITO') || action.includes('FAVORITE')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const renderActivityDetails = (activity: CalendarActivity) => {
    if (!activity.details) return null;
    
    let details;
    try {
      details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
    } catch (e) {
      details = activity.details;
    }

    if (!details || typeof details !== 'object') return null;

    return (
      <div className="bg-muted/30 p-4 rounded-lg space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground mb-3">Detalles de la actividad:</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {details.employeeName && (
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Colaborador:</span>
              <span className="font-semibold text-foreground">{details.employeeName}</span>
            </div>
          )}
          
          {details.shiftName && (
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Turno:</span>
              <span className="font-semibold text-foreground">{details.shiftName}</span>
            </div>
          )}
          
          {details.date && (
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Fecha:</span>
              <span className="font-mono text-foreground">{new Date(details.date).toLocaleDateString('es-ES')}</span>
            </div>
          )}
          
          {details.startTime && details.endTime && (
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Horario:</span>
              <span className="font-mono text-foreground">{details.startTime} - {details.endTime}</span>
            </div>
          )}
          
          {details.source && (
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Origen:</span>
              <Badge variant="outline" className={`text-xs ${getActivityColor(activity.action)}`}>
                {details.source === 'favorites' ? 'Favoritos' : 
                 details.source === 'button' ? 'Botón +' : 
                 details.source === 'drag_drop' ? 'Arrastrar' : details.source}
              </Badge>
            </div>
          )}
          
          {details.fromEmployee && details.toEmployee && (
            <>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Desde:</span>
                <span className="text-foreground">{details.fromEmployee}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Hacia:</span>
                <span className="text-foreground">{details.toEmployee}</span>
              </div>
            </>
          )}
          
          {details.adapted && (
            <div className="col-span-full p-2 bg-blue-50 rounded border-l-4 border-blue-400">
              <span className="text-xs text-blue-700">
                ✨ Turno adaptado: {details.originalHours}h → {details.adaptedHours}h
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredActivities = activities.filter(activity => {
    if (activityFilter === "all") return true;
    if (activityFilter === "shifts") return activity.action.includes('TURNO') || activity.action.includes('SHIFT');
    if (activityFilter === "employees") return activity.action.includes('COLABORADOR') || activity.action.includes('EMPLOYEE');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Actividad del Calendario</h2>
        <p className="text-muted-foreground">
          Registro detallado de todas las acciones realizadas en la gestión de turnos y colaboradores.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las actividades</SelectItem>
              <SelectItem value="shifts">Solo turnos</SelectItem>
              <SelectItem value="employees">Solo colaboradores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-10 w-32"
            />
          </div>
          <span className="text-muted-foreground">—</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-10 w-32"
            />
          </div>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredActivities.length} actividades encontradas
        </div>
      </div>

      {/* Activity Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground w-12"></th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actividad</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left p-4 font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-4"><Skeleton className="h-4 w-4" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-full" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-8" /></td>
                    </tr>
                  ))
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 text-muted-foreground/50" />
                        <p>No se encontraron actividades del calendario</p>
                        <p className="text-xs">Prueba a ajustar las fechas o los filtros</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          {getActivityIcon(activity.action, activity.entity_type)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-foreground">
                            {activity.user_name}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getActivityColor(activity.action)}`}
                            >
                              {activity.action}
                            </Badge>
                            {activity.entity_name && (
                              <span className="text-sm text-muted-foreground">
                                · {activity.entity_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </div>
                        </td>
                        <td className="p-4">
                          {activity.details && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(activity.id)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedRows.has(activity.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedRows.has(activity.id) && activity.details && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-muted/20">
                            {renderActivityDetails(activity)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}