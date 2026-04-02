// Página de configuración de auditoría de turnos
import { useEffect, useState } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";
import { 
  Clock, 
  Calendar, 
  Users, 
  Palmtree, 
  Plus, 
  Trash2, 
  Settings2,
  Shield,
  AlertTriangle,
  Save,
  UserX
} from "lucide-react";
import { VIOLATION_TYPE_LABELS } from "@/types/audit";
import { Json } from "@/integrations/supabase/types";

interface AuditPolicy {
  id: string;
  org_id: string;
  policy_type: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

interface CoveragePolicy {
  id: string;
  org_id: string;
  name: string;
  start_time: string;
  end_time: string;
  min_employees: number;
  applies_to_days: string[] | null;
  is_enabled: boolean;
}

interface EmployeeRestriction {
  id: string;
  colaborador_id: string;
  org_id: string;
  restriction_type: string;
  config: Record<string, any>;
  reason: string | null;
  is_active: boolean;
  colaborador?: {
    nombre: string;
    apellidos: string;
  };
}

const POLICY_ICONS: Record<string, React.ReactNode> = {
  INSUFFICIENT_REST: <Clock className="h-5 w-5" />,
  MISSING_FREE_DAYS: <Calendar className="h-5 w-5" />,
  MISSING_COVERAGE: <Users className="h-5 w-5" />,
  VACATION_NO_FREE_DAYS: <Palmtree className="h-5 w-5" />
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

// Helper para convertir Json a Record<string, any>
const jsonToRecord = (json: Json): Record<string, any> => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return json as Record<string, any>;
  }
  return {};
};

// Helper para convertir Json a string[] | null
const jsonToStringArray = (json: Json): string[] | null => {
  if (Array.isArray(json)) {
    return json.filter((item): item is string => typeof item === 'string');
  }
  return null;
};

export default function HRAuditPolicies() {
  const { org: currentOrg } = useCurrentOrganization();
  const [auditPolicies, setAuditPolicies] = useState<AuditPolicy[]>([]);
  const [coveragePolicies, setCoveragePolicies] = useState<CoveragePolicy[]>([]);
  const [employeeRestrictions, setEmployeeRestrictions] = useState<EmployeeRestriction[]>([]);
  const [colaboradores, setColaboradores] = useState<Array<{ id: string; nombre: string; apellidos: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [showCoverageDialog, setShowCoverageDialog] = useState(false);
  const [showRestrictionDialog, setShowRestrictionDialog] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<CoveragePolicy | null>(null);
  
  // New coverage form
  const [newCoverage, setNewCoverage] = useState({
    name: '',
    start_time: '07:00',
    end_time: '15:00',
    min_employees: 1
  });
  
  // New restriction form
  const [newRestriction, setNewRestriction] = useState({
    colaborador_id: '',
    restriction_type: 'NO_DAY',
    day_of_week: 0,
    max_hours: 8,
    shift_type: 'N',
    reason: ''
  });

  useEffect(() => {
    document.title = "Auditoría de Turnos – TurnoSmart";
  }, []);

  useEffect(() => {
    if (currentOrg?.org_id) {
      loadData();
    }
  }, [currentOrg?.org_id]);

  const loadData = async () => {
    if (!currentOrg?.org_id) return;

    setLoading(true);
    try {
      // Load audit policies (graceful — table may not exist in cloud)
      try {
        const { data: policies, error: policiesError } = await supabase
          .from('audit_policies')
          .select('*')
          .eq('org_id', currentOrg.org_id);

        if (!policiesError) {
          setAuditPolicies((policies || []).map(p => ({
            ...p,
            config: jsonToRecord(p.config)
          })));
        }
      } catch { /* audit_policies may not exist */ }

      // Load coverage policies (graceful — table may not exist in cloud)
      try {
        const { data: coverage, error: coverageError } = await supabase
          .from('coverage_policies')
          .select('*')
          .eq('org_id', currentOrg.org_id)
          .order('start_time');

        if (!coverageError) {
          setCoveragePolicies((coverage || []).map(c => ({
            ...c,
            applies_to_days: jsonToStringArray(c.applies_to_days)
          })));
        }
      } catch { /* coverage_policies may not exist */ }

      // Load employee restrictions (graceful — table may not exist in cloud)
      try {
        const { data: restrictions, error: restrictionsError } = await supabase
          .from('employee_restrictions')
          .select(`
            *,
            colaboradores!employee_restrictions_colaborador_id_fkey (
              nombre,
              apellidos
            )
          `)
          .eq('org_id', currentOrg.org_id);

        if (!restrictionsError) {
          setEmployeeRestrictions((restrictions || []).map(r => ({
            ...r,
            config: jsonToRecord(r.config),
            colaborador: r.colaboradores
          })));
        }
      } catch { /* employee_restrictions may not exist */ }

      // Load colaboradores for selection
      const { data: colabs, error: colabsError } = await supabase
        .from('colaboradores')
        .select('id, nombre, apellidos')
        .eq('org_id', currentOrg.org_id)
        .eq('status', 'activo');

      if (!colabsError) {
        setColaboradores(colabs || []);
      }

    } catch (error) {
      // Silenced — graceful degradation for missing cloud tables
    } finally {
      setLoading(false);
    }
  };

  const togglePolicy = async (policy: AuditPolicy) => {
    try {
      const { error } = await supabase
        .from('audit_policies')
        .update({ is_enabled: !policy.is_enabled })
        .eq('id', policy.id);
      
      if (error) throw error;
      
      setAuditPolicies(prev => prev.map(p => 
        p.id === policy.id ? { ...p, is_enabled: !p.is_enabled } : p
      ));
      toast.success(`Política ${!policy.is_enabled ? 'activada' : 'desactivada'}`);
    } catch (error) {
      // Silenced — audit_policies may not exist in cloud
      toast.error('Error al cambiar el estado de la política');
    }
  };

  const updatePolicyConfig = async (policy: AuditPolicy, config: Record<string, any>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('audit_policies')
        .update({ config: { ...policy.config, ...config } })
        .eq('id', policy.id);
      
      if (error) throw error;
      
      setAuditPolicies(prev => prev.map(p => 
        p.id === policy.id ? { ...p, config: { ...p.config, ...config } } : p
      ));
      toast.success('Configuración guardada');
    } catch (error) {
      // Silenced — audit_policies may not exist in cloud
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const saveCoveragePolicy = async () => {
    if (!currentOrg?.org_id || !newCoverage.name) return;
    
    setSaving(true);
    try {
      if (editingCoverage) {
        const { error } = await supabase
          .from('coverage_policies')
          .update({
            name: newCoverage.name,
            start_time: newCoverage.start_time,
            end_time: newCoverage.end_time,
            min_employees: newCoverage.min_employees
          })
          .eq('id', editingCoverage.id);
        
        if (error) throw error;
        toast.success('Política de cobertura actualizada');
      } else {
        const { error } = await supabase
          .from('coverage_policies')
          .insert({
            org_id: currentOrg.org_id,
            name: newCoverage.name,
            start_time: newCoverage.start_time,
            end_time: newCoverage.end_time,
            min_employees: newCoverage.min_employees,
            is_enabled: true
          });
        
        if (error) throw error;
        toast.success('Política de cobertura creada');
      }
      
      setShowCoverageDialog(false);
      setEditingCoverage(null);
      setNewCoverage({ name: '', start_time: '07:00', end_time: '15:00', min_employees: 1 });
      loadData();
    } catch (error) {
      // Silenced — coverage_policies may not exist in cloud
      toast.error('Error al guardar la política de cobertura');
    } finally {
      setSaving(false);
    }
  };

  const deleteCoveragePolicy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coverage_policies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCoveragePolicies(prev => prev.filter(p => p.id !== id));
      toast.success('Política de cobertura eliminada');
    } catch (error) {
      // Silenced — coverage_policies may not exist in cloud
      toast.error('Error al eliminar la política');
    }
  };

  const toggleCoveragePolicy = async (policy: CoveragePolicy) => {
    try {
      const { error } = await supabase
        .from('coverage_policies')
        .update({ is_enabled: !policy.is_enabled })
        .eq('id', policy.id);
      
      if (error) throw error;
      
      setCoveragePolicies(prev => prev.map(p => 
        p.id === policy.id ? { ...p, is_enabled: !p.is_enabled } : p
      ));
    } catch (error) {
      // Silenced — coverage_policies may not exist in cloud
      toast.error('Error al cambiar el estado');
    }
  };

  const saveEmployeeRestriction = async () => {
    if (!currentOrg?.org_id || !newRestriction.colaborador_id) return;
    
    setSaving(true);
    try {
      const config: Record<string, any> = {};
      if (newRestriction.restriction_type === 'NO_DAY') {
        config.dayOfWeek = newRestriction.day_of_week;
      } else if (newRestriction.restriction_type === 'NO_SHIFT_TYPE') {
        config.shiftType = newRestriction.shift_type;
      } else if (newRestriction.restriction_type === 'MAX_HOURS_DAY') {
        config.maxHours = newRestriction.max_hours;
      }

      const { error } = await supabase
        .from('employee_restrictions')
        .insert({
          org_id: currentOrg.org_id,
          colaborador_id: newRestriction.colaborador_id,
          restriction_type: newRestriction.restriction_type,
          config,
          reason: newRestriction.reason || null,
          is_active: true
        });
      
      if (error) throw error;
      
      toast.success('Restricción añadida');
      setShowRestrictionDialog(false);
      setNewRestriction({
        colaborador_id: '',
        restriction_type: 'NO_DAY',
        day_of_week: 0,
        max_hours: 8,
        reason: ''
      });
      loadData();
    } catch (error) {
      // Silenced — employee_restrictions may not exist in cloud
      toast.error('Error al guardar la restricción');
    } finally {
      setSaving(false);
    }
  };

  const deleteRestriction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_restrictions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEmployeeRestrictions(prev => prev.filter(r => r.id !== id));
      toast.success('Restricción eliminada');
    } catch (error) {
      // Silenced — employee_restrictions may not exist in cloud
      toast.error('Error al eliminar la restricción');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-screen bg-muted/20">
          <HRSidebar />
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Auditoría de Turnos</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Configura las políticas de auditoría para detectar automáticamente problemas en los turnos
              </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Políticas Generales
                </TabsTrigger>
                <TabsTrigger value="coverage" className="gap-2">
                  <Users className="h-4 w-4" />
                  Cobertura Mínima
                </TabsTrigger>
                <TabsTrigger value="restrictions" className="gap-2">
                  <UserX className="h-4 w-4" />
                  Restricciones
                </TabsTrigger>
              </TabsList>

              {/* Tab: Políticas Generales */}
              <TabsContent value="general" className="space-y-4">
                {auditPolicies.map(policy => (
                  <Card key={policy.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {POLICY_ICONS[policy.policy_type]}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {VIOLATION_TYPE_LABELS[policy.policy_type as keyof typeof VIOLATION_TYPE_LABELS] || policy.policy_type}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {getPoliciDescription(policy.policy_type)}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={policy.is_enabled}
                          onCheckedChange={() => togglePolicy(policy)}
                        />
                      </div>
                    </CardHeader>
                    {policy.is_enabled && (
                      <CardContent className="pt-0">
                        <PolicyConfigForm policy={policy} onSave={updatePolicyConfig} saving={saving} />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Tab: Cobertura Mínima */}
              <TabsContent value="coverage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Franjas de Cobertura</CardTitle>
                        <CardDescription>
                          Define el mínimo de empleados requeridos por franja horaria
                        </CardDescription>
                      </div>
                      <Dialog open={showCoverageDialog} onOpenChange={setShowCoverageDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Añadir franja
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingCoverage ? 'Editar' : 'Nueva'} Franja de Cobertura
                            </DialogTitle>
                            <DialogDescription>
                              Define una franja horaria y el mínimo de empleados requeridos
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nombre de la franja</Label>
                              <Input
                                value={newCoverage.name}
                                onChange={(e) => setNewCoverage(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ej: Apertura, Mediodía, Noche..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Hora inicio</Label>
                                <Input
                                  type="time"
                                  value={newCoverage.start_time}
                                  onChange={(e) => setNewCoverage(prev => ({ ...prev, start_time: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Hora fin</Label>
                                <Input
                                  type="time"
                                  value={newCoverage.end_time}
                                  onChange={(e) => setNewCoverage(prev => ({ ...prev, end_time: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Mínimo de empleados</Label>
                              <Input
                                type="number"
                                min={1}
                                value={newCoverage.min_employees}
                                onChange={(e) => setNewCoverage(prev => ({ ...prev, min_employees: parseInt(e.target.value) || 1 }))}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCoverageDialog(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={saveCoveragePolicy} disabled={saving || !newCoverage.name}>
                              {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {coveragePolicies.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No hay franjas de cobertura configuradas
                        </p>
                      ) : (
                        coveragePolicies.map(policy => (
                          <div 
                            key={policy.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Switch
                                checked={policy.is_enabled}
                                onCheckedChange={() => toggleCoveragePolicy(policy)}
                              />
                              <div>
                                <p className="font-medium text-sm">{policy.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {policy.start_time} - {policy.end_time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">
                                Mín. {policy.min_employees} empleado{policy.min_employees > 1 ? 's' : ''}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteCoveragePolicy(policy.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Restricciones por Empleado */}
              <TabsContent value="restrictions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Restricciones por Empleado</CardTitle>
                        <CardDescription>
                          Condiciones especiales o excepciones para empleados específicos
                        </CardDescription>
                      </div>
                      <Dialog open={showRestrictionDialog} onOpenChange={setShowRestrictionDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Añadir restricción
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nueva Restricción</DialogTitle>
                            <DialogDescription>
                              Añade una condición especial para un empleado
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Empleado</Label>
                              <Select
                                value={newRestriction.colaborador_id}
                                onValueChange={(v) => setNewRestriction(prev => ({ ...prev, colaborador_id: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar empleado..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {colaboradores.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.nombre} {c.apellidos}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Tipo de restricción</Label>
                              <Select
                                value={newRestriction.restriction_type}
                                onValueChange={(v) => setNewRestriction(prev => ({ ...prev, restriction_type: v }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NO_DAY">No puede trabajar cierto día</SelectItem>
                                  <SelectItem value="NO_SHIFT_TYPE">No puede hacer cierto turno</SelectItem>
                                  <SelectItem value="MAX_HOURS_DAY">Máximo horas por día</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {newRestriction.restriction_type === 'NO_DAY' && (
                              <div className="space-y-2">
                                <Label>Día de la semana</Label>
                                <Select
                                  value={String(newRestriction.day_of_week)}
                                  onValueChange={(v) => setNewRestriction(prev => ({ ...prev, day_of_week: parseInt(v) }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DAYS_OF_WEEK.map(day => (
                                      <SelectItem key={day.value} value={String(day.value)}>
                                        {day.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {newRestriction.restriction_type === 'NO_SHIFT_TYPE' && (
                              <div className="space-y-2">
                                <Label>Turno restringido</Label>
                                <Select
                                  value={newRestriction.shift_type || 'N'}
                                  onValueChange={(v) => setNewRestriction(prev => ({ ...prev, shift_type: v }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="M">Mañana (M)</SelectItem>
                                    <SelectItem value="T">Tarde (T)</SelectItem>
                                    <SelectItem value="N">Noche (N)</SelectItem>
                                    <SelectItem value="G">Guardia (G)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {newRestriction.restriction_type === 'MAX_HOURS_DAY' && (
                              <div className="space-y-2">
                                <Label>Máximo horas por día</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={12}
                                  value={newRestriction.max_hours}
                                  onChange={(e) => setNewRestriction(prev => ({ ...prev, max_hours: parseInt(e.target.value) || 8 }))}
                                />
                              </div>
                            )}
                            
                            <div className="space-y-2">
                              <Label>Motivo (opcional)</Label>
                              <Input
                                value={newRestriction.reason}
                                onChange={(e) => setNewRestriction(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Ej: Motivos familiares, reducción de jornada..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRestrictionDialog(false)}>
                              Cancelar
                            </Button>
                            <Button 
                              onClick={saveEmployeeRestriction} 
                              disabled={saving || !newRestriction.colaborador_id}
                            >
                              {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {employeeRestrictions.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No hay restricciones configuradas
                          </p>
                        ) : (
                          employeeRestrictions.map(restriction => (
                            <div 
                              key={restriction.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                                  <UserX className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {restriction.colaborador?.nombre} {restriction.colaborador?.apellidos}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {getRestrictionDescription(restriction)}
                                  </p>
                                  {restriction.reason && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Motivo: {restriction.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteRestriction(restriction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Componente para el formulario de configuración de cada política
function PolicyConfigForm({ 
  policy, 
  onSave, 
  saving 
}: { 
  policy: AuditPolicy; 
  onSave: (policy: AuditPolicy, config: Record<string, any>) => void;
  saving: boolean;
}) {
  const [localConfig, setLocalConfig] = useState(policy.config);

  const handleSave = () => {
    onSave(policy, localConfig);
  };

  switch (policy.policy_type) {
    case 'INSUFFICIENT_REST':
      return (
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Horas mínimas de descanso</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={8}
                max={24}
                className="w-20 h-8"
                value={localConfig.minRestHours || 12}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, minRestHours: parseInt(e.target.value) || 12 }))}
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      );

    case 'MISSING_FREE_DAYS':
      return (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Días libres mínimos (jornada completa)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={1}
                  max={7}
                  className="w-20 h-8"
                  value={localConfig.minFreeDaysFullTime || 2}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, minFreeDaysFullTime: parseInt(e.target.value) || 2 }))}
                />
                <span className="text-sm text-muted-foreground">días/semana</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={localConfig.requireConsecutive !== false}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ ...prev, requireConsecutive: checked }))}
              />
              <Label className="text-xs">Deben ser consecutivos</Label>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      );

    case 'VACATION_NO_FREE_DAYS':
      return (
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Días libres junto a vacaciones</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min={0}
                max={7}
                className="w-20 h-8"
                value={localConfig.freeDaysAroundVacation || 2}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, freeDaysAroundVacation: parseInt(e.target.value) || 2 }))}
              />
              <span className="text-sm text-muted-foreground">días (antes o después)</span>
            </div>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      );

    default:
      return null;
  }
}

function getPoliciDescription(type: string): string {
  switch (type) {
    case 'INSUFFICIENT_REST':
      return 'Detecta cuando hay menos de las horas mínimas de descanso entre turnos consecutivos';
    case 'MISSING_FREE_DAYS':
      return 'Verifica que cada empleado tenga el mínimo de días libres por semana';
    case 'MISSING_COVERAGE':
      return 'Alerta cuando no hay suficientes empleados en una franja horaria';
    case 'VACATION_NO_FREE_DAYS':
      return 'Verifica que las vacaciones tengan días libres concatenados antes o después';
    default:
      return '';
  }
}

function getRestrictionDescription(restriction: EmployeeRestriction): string {
  const shiftLabels: Record<string, string> = { M: 'Mañana', T: 'Tarde', N: 'Noche', G: 'Guardia' };
  switch (restriction.restriction_type) {
    case 'NO_DAY':
      const dayName = DAYS_OF_WEEK.find(d => d.value === restriction.config.dayOfWeek)?.label || '';
      return `No puede trabajar los ${dayName}s`;
    case 'NO_SHIFT_TYPE':
      return `No puede hacer turno de ${shiftLabels[restriction.config.shiftType] || restriction.config.shiftType}`;
    case 'MAX_HOURS_DAY':
      return `Máximo ${restriction.config.maxHours || 8} horas por día`;
    default:
      return restriction.restriction_type;
  }
}
