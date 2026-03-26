import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, ChevronDown, ChevronUp, Info } from "lucide-react";
import { CalendarActivityLog } from "@/components/CalendarActivityLog";

interface ActivityLog {
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

export default function Activity() {
  const [establishment, setEstablishment] = useState("Todos los establecimientos");
  const [activityType, setActivityType] = useState("Todas las actividades");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchActivities();
  }, [dateFrom, dateTo]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error("Error al cargar las actividades");
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

  const renderActivityDetails = (activity: ActivityLog) => {
    if (!activity.details) return null;
    
    let details;
    try {
      details = typeof activity.details === 'string' ? JSON.parse(activity.details) : activity.details;
    } catch (e) {
      details = activity.details;
    }

    if (!details || typeof details !== 'object') return null;

    return (
      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">Detalles de la actividad:</h4>
        {details.action_type && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">Tipo de acción:</span>
            <span>{details.action_type}</span>
          </div>
        )}
        {details.previous_role && details.new_role && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">Cambio de rol:</span>
            <span className="text-blue-600 dark:text-blue-400">{details.role_change_summary || `${details.previous_role} → ${details.new_role}`}</span>
          </div>
        )}
        {details.permission_name && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">Permiso:</span>
            <span>{details.permission_name}</span>
          </div>
        )}
        {details.department && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">Departamento:</span>
            <span>{details.department}</span>
          </div>
        )}
        {details.target_user_email && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">Usuario afectado:</span>
            <span>{details.target_user_email}</span>
          </div>
        )}
        {details.colaborador_id && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className="font-medium">ID Colaborador:</span>
            <span className="font-mono">{details.colaborador_id}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Informes</h1>
            <p className="text-muted-foreground">
              Visualiza el registro de actividades y las prenóminas de tu organización.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              // Placeholder for export functionality
              toast.info("Funcionalidad de exportación en desarrollo");
            }}
          >
            📋 Exportar la lista de personal
          </Button>
        </div>

        <Tabs defaultValue="actividad" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="actividad">Actividad</TabsTrigger>
            <TabsTrigger value="prenominas">Prenóminas</TabsTrigger>
          </TabsList>

          <TabsContent value="actividad" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-2">
                <Select value={establishment} onValueChange={setEstablishment}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos los establecimientos">
                      Todos los establecimientos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas las actividades">
                      Todas las actividades
                    </SelectItem>
                    <div className="text-sm px-2 py-1 text-muted-foreground">
                      Filtrar por tipo de actividad
                    </div>
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
            </div>

            {/* Activity Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Usuario
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Acontecimiento
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Establecimiento
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground">
                          Fecha
                        </th>
                        <th className="text-left p-4 font-medium text-muted-foreground w-12">
                          
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        // Loading skeleton
                        Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-4">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="p-4">
                              <Skeleton className="h-4 w-full" />
                            </td>
                            <td className="p-4">
                              <Skeleton className="h-6 w-16" />
                            </td>
                            <td className="p-4">
                              <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="p-4">
                              <Skeleton className="h-4 w-8" />
                            </td>
                          </tr>
                        ))
                      ) : activities.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            No se encontraron actividades
                          </td>
                        </tr>
                      ) : (
                        activities.map((activity) => (
                          <React.Fragment key={activity.id}>
                            <tr className="border-b hover:bg-muted/50">
                              <td className="p-4">
                                <div className="text-sm font-medium text-foreground">
                                  {activity.user_name}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm text-foreground">
                                  {activity.action}
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="secondary">{activity.establishment}</Badge>
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
          </TabsContent>

          <TabsContent value="prenominas" className="space-y-4">
            <CalendarActivityLog />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}