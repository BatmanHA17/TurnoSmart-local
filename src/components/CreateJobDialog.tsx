import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { cn } from '@/lib/utils';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
  departments: Array<{ id: string; value: string }>;
  canEdit: boolean;
}

interface PredefinedJob {
  id: string;
  job_title: string;
  category_name: string;
  level_name: string;
  description: string;
  default_hours: number;
  default_rate_unit: number;
}

const hoursOptions = [
  { value: 8, label: "8 horas (Tiempo completo)", ratio: 1.0 },
  { value: 7, label: "7 horas (87.5%)", ratio: 0.875 },
  { value: 6, label: "6 horas (75%)", ratio: 0.75 },
  { value: 5, label: "5 horas (62.5%)", ratio: 0.625 },
  { value: 4, label: "4 horas (50%)", ratio: 0.5 },
  { value: 3, label: "3 horas (37.5%)", ratio: 0.375 },
  { value: 2, label: "2 horas (25%)", ratio: 0.25 },
  { value: 1, label: "1 hora (12.5%)", ratio: 0.125 }
];

export function CreateJobDialog({ open, onOpenChange, onJobCreated, departments, canEdit }: CreateJobDialogProps) {
  const { currentOrg } = useCurrentOrganization();
  const [loading, setLoading] = useState(false);
  const [predefinedJobs, setPredefinedJobs] = useState<PredefinedJob[]>([]);
  const [predefinedJobComboOpen, setPredefinedJobComboOpen] = useState(false);
  const [selectedPredefinedJob, setSelectedPredefinedJob] = useState<PredefinedJob | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    hours: 8,
    rate_unit: 1.0
  });

  useEffect(() => {
    if (open) {
      loadPredefinedJobs();
    }
  }, [open]);

  const loadPredefinedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('predefined_jobs')
        .select('*')
        .order('level_name', { ascending: true })
        .order('job_title', { ascending: true });

      if (error) {
        console.error('Error loading predefined jobs:', error);
        return;
      }

      setPredefinedJobs(data || []);
    } catch (error) {
      console.error('Error loading predefined jobs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      hours: 8,
      rate_unit: 1.0
    });
    setSelectedPredefinedJob(null);
    setPredefinedJobComboOpen(false);
  };

  const handlePredefinedJobSelect = (predefinedJob: PredefinedJob) => {
    setSelectedPredefinedJob(predefinedJob);
    setFormData(prev => ({
      ...prev,
      title: predefinedJob.job_title,
      hours: predefinedJob.default_hours,
      rate_unit: predefinedJob.default_rate_unit
    }));
    setPredefinedJobComboOpen(false);
  };

  const handleHoursChange = (hours: number) => {
    const option = hoursOptions.find(opt => opt.value === hours);
    setFormData(prev => ({
      ...prev,
      hours,
      rate_unit: option?.ratio || 1.0
    }));
  };

  const handleSaveJob = async () => {
    if (!canEdit) {
      toast.error("No tienes permisos para crear puestos");
      return;
    }
    if (!formData.title.trim() || !formData.department.trim()) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (!currentOrg?.org_id) {
      toast.error("No se encontró la organización actual");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debe estar autenticado para crear puestos");
        return;
      }

      // Buscar el department_id basado en el nombre del equipo seleccionado
      const { data: department } = await supabase
        .from("job_departments")
        .select("id")
        .eq("value", formData.department)
        .eq("org_id", currentOrg.org_id)
        .maybeSingle();

      // Buscar el category_id si se seleccionó un puesto predefinido con categoría
      let categoryId = null;
      if (selectedPredefinedJob) {
        const { data: category } = await supabase
          .from("professional_categories")
          .select("id")
          .eq("category_name", selectedPredefinedJob.category_name)
          .eq("org_id", currentOrg.org_id)
          .maybeSingle();
        
        categoryId = category?.id || null;
      }

      const jobData = {
        title: formData.title.trim(),
        department: formData.department,
        department_id: department?.id || null,
        category_id: categoryId,
        hours: formData.hours,
        rate_unit: formData.rate_unit,
        created_by: user.id,
        org_id: currentOrg.org_id
      };

      const { error } = await supabase
        .from('jobs')
        .insert(jobData);

      if (error) {
        console.error('Error saving job:', error);
        toast.error("Error al guardar el puesto");
        return;
      }

      toast.success("Puesto creado correctamente");
      resetForm();
      onOpenChange(false);
      onJobCreated();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Error al guardar el puesto");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Agrupar puestos predefinidos por nivel
  const jobsByLevel = predefinedJobs.reduce((acc, job) => {
    const level = job.level_name || "Sin nivel";
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(job);
    return acc;
  }, {} as Record<string, PredefinedJob[]>);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white border-0 shadow-xl rounded-2xl">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-xl font-light text-slate-800">
            Crear Nuevo Puesto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Puestos Predefinidos del Convenio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Puestos del Convenio Colectivo
            </label>
            <Popover open={predefinedJobComboOpen} onOpenChange={setPredefinedJobComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={predefinedJobComboOpen}
                  className="w-full justify-between rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                >
                  {selectedPredefinedJob 
                    ? selectedPredefinedJob.job_title
                    : "Seleccionar puesto del convenio (opcional)"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-full p-0 rounded-xl border-0 shadow-lg"
                style={{ 
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(0, 0, 0)',
                  zIndex: 9999,
                  opacity: 1
                }}
              >
                <Command className="rounded-xl">
                  <CommandInput 
                    placeholder="Buscar puesto..." 
                    className="h-9"
                  />
                  <CommandEmpty>No se encontró ningún puesto.</CommandEmpty>
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    {Object.entries(jobsByLevel).map(([level, jobs]) => (
                      <CommandGroup key={level} heading={level}>
                        {jobs.map((predefinedJob) => (
                          <CommandItem
                            key={predefinedJob.id}
                            value={predefinedJob.job_title}
                            onSelect={() => handlePredefinedJobSelect(predefinedJob)}
                            className="cursor-pointer rounded-lg"
                          >
                            <div className="flex flex-col w-full">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{predefinedJob.job_title}</span>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedPredefinedJob?.id === predefinedJob.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 bg-blue-50 px-2 py-1 rounded">
                                  {predefinedJob.level_name}
                                </span>
                                <span className="text-xs text-slate-500 bg-green-50 px-2 py-1 rounded">
                                  {predefinedJob.default_hours}h
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-slate-500">
              Selecciona un puesto del convenio colectivo o crea uno personalizado abajo
            </p>
          </div>

          {/* Título del Puesto */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Título del Puesto *
            </label>
            <Input
              placeholder="Ej: Camarero/a, Cocinero/a, Recepcionista..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
            />
          </div>

          {/* Equipo/Departamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Equipo *
            </label>
            <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
              <SelectTrigger className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light">
                <SelectValue placeholder="Seleccionar equipo" />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl border-0 shadow-lg"
                style={{ 
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(0, 0, 0)',
                  zIndex: 9999,
                  opacity: 1
                }}
              >
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.value} className="rounded-lg">
                    {dept.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Horas de Contrato */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Horas de Contrato
            </label>
            <Select value={formData.hours.toString()} onValueChange={(value) => handleHoursChange(parseInt(value))}>
              <SelectTrigger className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light">
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                className="rounded-xl border-0 shadow-lg"
                style={{ 
                  backgroundColor: 'rgb(255, 255, 255)',
                  color: 'rgb(0, 0, 0)',
                  zIndex: 9999,
                  opacity: 1
                }}
              >
                {hoursOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()} className="rounded-lg">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ratio/Unidad de Tarifa */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Unidad de Trabajo
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-medium text-slate-700">{formData.rate_unit} U</span>
              <p className="text-sm text-slate-500 mt-1">
                {formData.rate_unit === 1.0 ? 'Tiempo completo' : 
                 `${Math.round(formData.rate_unit * 100)}% de tiempo completo`}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="rounded-xl font-medium"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveJob}
            disabled={loading || !formData.title.trim() || !formData.department.trim()}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium"
          >
            {loading ? "Creando..." : "Crear Puesto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}