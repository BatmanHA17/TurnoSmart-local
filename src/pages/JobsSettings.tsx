import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Briefcase, X, Pencil, Trash2, Clock, Users, Building2, Settings, Layers, Tag, ArrowUpDown, SortAsc, SortDesc, Check, ChevronsUpDown } from "lucide-react";
import { CreateJobDialog } from "@/components/CreateJobDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminSettingsRoute from "@/components/AdminSettingsRoute";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  department: string;
  hours: number;
  rate_unit: number;
  created_at: string;
}

interface CustomOption {
  id: string;
  value: string;
  created_at: string;
}

interface ProfessionalLevel {
  id: string;
  level_name: string;
  level_code?: string;
  description?: string;
}

interface ProfessionalCategory {
  id: string;
  category_name: string;
  category_code?: string;
  level_id?: string;
  description?: string;
  level?: ProfessionalLevel;
}

interface PredefinedJob {
  id: string;
  job_title: string;
  category_name: string;
  level_name: string;
  description?: string;
  default_hours: number;
  default_rate_unit: number;
}

export default function JobsSettings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [levelSearchTerm, setLevelSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [levelSortOrder, setLevelSortOrder] = useState<"asc" | "desc">("asc");
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryComboOpen, setCategoryComboOpen] = useState(false);
  const [predefinedJobComboOpen, setPredefinedJobComboOpen] = useState(false);
  const [selectedPredefinedJob, setSelectedPredefinedJob] = useState<PredefinedJob | null>(null);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<CustomOption[]>([]);
  const [professionalLevels, setProfessionalLevels] = useState<ProfessionalLevel[]>([]);
  const [professionalCategories, setProfessionalCategories] = useState<ProfessionalCategory[]>([]);
  const [predefinedJobs, setPredefinedJobs] = useState<PredefinedJob[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<CustomOption | null>(null);
  const [editingLevel, setEditingLevel] = useState<ProfessionalLevel | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProfessionalCategory | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    category: "",
    hours: 8,
    rate_unit: 1.0
  });
  
  const [newDepartment, setNewDepartment] = useState("");
  const [newLevel, setNewLevel] = useState({ name: "", code: "", description: "" });
  const [newCategory, setNewCategory] = useState({ name: "", code: "", description: "", level_id: "" });
  
  const { permissions } = useAdminPermissions();
  const { org: currentOrg } = useCurrentOrganization();

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

  useEffect(() => {
    document.title = "Puestos de Trabajo | TurnoSmart";
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadJobs(),
      loadDepartments(),
      loadProfessionalLevels(),
      loadProfessionalCategories()
    ]);
  };

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading jobs:', error);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('job_departments')
        .select('*')
        .order('value');

      if (error) {
        console.error('Error loading departments:', error);
        return;
      }

      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const loadProfessionalLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_levels')
        .select('*')
        .order('level_name');

      if (error) {
        console.error('Error loading professional levels:', error);
        return;
      }

      setProfessionalLevels(data || []);
    } catch (error) {
      console.error('Error loading professional levels:', error);
    }
  };

  const loadProfessionalCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_categories')
        .select(`
          *,
          level:professional_levels(*)
        `)
        .order('category_name');

      if (error) {
        console.error('Error loading professional categories:', error);
        return;
      }

      setProfessionalCategories(data || []);
    } catch (error) {
      console.error('Error loading professional categories:', error);
    }
  };

  const resetJobForm = () => {
    setFormData({
      title: "",
      department: "",
      category: "",
      hours: 8,
      rate_unit: 1.0
    });
    setEditingJob(null);
    setCategoryComboOpen(false);
    setPredefinedJobComboOpen(false);
    setSelectedPredefinedJob(null);
  };

  const handlePredefinedJobSelect = (predefinedJob: PredefinedJob) => {
    setSelectedPredefinedJob(predefinedJob);
    setFormData({
      ...formData,
      title: predefinedJob.job_title,
      category: predefinedJob.category_name,
      hours: predefinedJob.default_hours,
      rate_unit: predefinedJob.default_rate_unit
    });
    setPredefinedJobComboOpen(false);
  };

  const handleSaveJob = async () => {
    if (!permissions.canEdit) {
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

      // Buscar el category_id si se seleccionó una categoría
      let categoryId: string | null = null;
      if (formData.category) {
        const { data: category } = await supabase
          .from("professional_categories")
          .select("id")
          .eq("category_name", formData.category)
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

      const { error } = editingJob
        ? await supabase
            .from('jobs')
            .update(jobData)
            .eq('id', editingJob.id)
        : await supabase
            .from('jobs')
            .insert(jobData);

      if (error) {
        console.error('Error saving job:', error);
        toast.error("Error al guardar el puesto");
        return;
      }

      toast.success(editingJob ? "Puesto actualizado correctamente" : "Puesto creado correctamente");
      resetJobForm();
      setIsJobDialogOpen(false);
      await loadJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Error al guardar el puesto");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error("Por favor ingresa el nombre del equipo");
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
        toast.error("Debe estar autenticado");
        return;
      }

      const departmentData = {
        value: newDepartment.trim(),
        created_by: user.id,
        org_id: currentOrg.org_id
      };

      const { error } = editingDepartment
        ? await supabase
            .from('job_departments')
            .update({ value: newDepartment.trim() })
            .eq('id', editingDepartment.id)
        : await supabase
            .from('job_departments')
            .insert(departmentData);

      if (error) {
        console.error('Error saving department:', error);
        toast.error("Error al guardar el equipo");
        return;
      }

      toast.success(editingDepartment ? "Equipo actualizado" : "Equipo creado");
      setNewDepartment("");
      setEditingDepartment(null);
      setIsDepartmentDialogOpen(false);
      await loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error("Error al guardar el equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLevel = async () => {
    if (!newLevel.name.trim()) {
      toast.error("Por favor ingresa el nombre del nivel");
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
        toast.error("Debe estar autenticado");
        return;
      }

      const levelData = {
        level_name: newLevel.name.trim(),
        level_code: newLevel.code.trim() || null,
        description: newLevel.description.trim() || null,
        created_by: user.id,
        org_id: currentOrg.org_id
      };

      const { error } = editingLevel
        ? await supabase
            .from('professional_levels')
            .update(levelData)
            .eq('id', editingLevel.id)
        : await supabase
            .from('professional_levels')
            .insert(levelData);

      if (error) {
        console.error('Error saving level:', error);
        toast.error("Error al guardar el nivel");
        return;
      }

      toast.success(editingLevel ? "Nivel actualizado" : "Nivel creado");
      setNewLevel({ name: "", code: "", description: "" });
      setEditingLevel(null);
      setIsLevelDialogOpen(false);
      await loadProfessionalLevels();
    } catch (error) {
      console.error('Error saving level:', error);
      toast.error("Error al guardar el nivel");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Por favor ingresa el nombre de la categoría");
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
        toast.error("Debe estar autenticado");
        return;
      }

      const categoryData = {
        category_name: newCategory.name.trim(),
        category_code: newCategory.code.trim() || null,
        category_type: 'grupo', // Required field
        description: newCategory.description.trim() || null,
        level_id: newCategory.level_id || null,
        created_by: user.id,
        org_id: currentOrg.org_id
      };

      const { error } = editingCategory
        ? await supabase
            .from('professional_categories')
            .update(categoryData)
            .eq('id', editingCategory.id)
        : await supabase
            .from('professional_categories')
            .insert([categoryData]);

      if (error) {
        console.error('Error saving category:', error);
        toast.error("Error al guardar la categoría");
        return;
      }

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada");
      setNewCategory({ name: "", code: "", description: "", level_id: "" });
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
      await loadProfessionalCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error("Error al guardar la categoría");
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      category: "", // TODO: cargar categoría del job si existe
      hours: job.hours,
      rate_unit: job.rate_unit
    });
    setIsJobDialogOpen(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);
      if (error) throw error;
      toast.success("Puesto eliminado correctamente");
      await loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error("Error al eliminar el puesto");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('job_departments').delete().eq('id', departmentId);
      if (error) throw error;
      toast.success("Equipo eliminado");
      await loadDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error("Error al eliminar el equipo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('professional_levels').delete().eq('id', levelId);
      if (error) throw error;
      toast.success("Nivel eliminado");
      await loadProfessionalLevels();
      await loadProfessionalCategories(); // Reload categories as they might be affected
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error("Error al eliminar el nivel");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('professional_categories').delete().eq('id', categoryId);
      if (error) throw error;
      toast.success("Categoría eliminada");
      await loadProfessionalCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Error al eliminar la categoría");
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (hours: number) => {
    const option = hoursOptions.find(opt => opt.value === hours);
    setFormData(prev => ({
      ...prev,
      hours,
      rate_unit: option?.ratio || 1.0
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Filter and sort categories
  const filteredCategories = professionalCategories.filter(category => {
    const matchesSearch = category.category_name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                         (category.category_code && category.category_code.toLowerCase().includes(categorySearchTerm.toLowerCase())) ||
                         (category.description && category.description.toLowerCase().includes(categorySearchTerm.toLowerCase()));
    const matchesLevel = levelFilter === "all" || category.level?.id === levelFilter;
    return matchesSearch && matchesLevel;
  }).sort((a, b) => {
    const compare = a.category_name.localeCompare(b.category_name);
    return sortOrder === "asc" ? compare : -compare;
  });

  // Filter and sort levels
  const filteredLevels = professionalLevels.filter(level => {
    return level.level_name.toLowerCase().includes(levelSearchTerm.toLowerCase()) ||
           (level.level_code && level.level_code.toLowerCase().includes(levelSearchTerm.toLowerCase())) ||
           (level.description && level.description.toLowerCase().includes(levelSearchTerm.toLowerCase()));
  }).sort((a, b) => {
    const compare = a.level_name.localeCompare(b.level_name);
    return levelSortOrder === "asc" ? compare : -compare;
  });

  // Group filtered categories by level for organized display
  const categoriesByLevel = filteredCategories.reduce((acc, category) => {
    const levelName = category.level?.level_name || "Sin nivel";
    if (!acc[levelName]) {
      acc[levelName] = [];
    }
    acc[levelName].push(category);
    return acc;
  }, {} as Record<string, ProfessionalCategory[]>);

  // Sort levels for consistent display
  const sortedLevelNames = Object.keys(categoriesByLevel).sort();

  const getHoursLabel = (hours: number) => {
    const option = hoursOptions.find(opt => opt.value === hours);
    return option?.label || `${hours} horas`;
  };

  const getRatioColor = (ratio: number) => {
    if (ratio >= 1.0) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (ratio >= 0.75) return "bg-blue-100 text-blue-800 border-blue-200";
    if (ratio >= 0.5) return "bg-amber-100 text-amber-800 border-amber-200";
    if (ratio >= 0.25) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  return (
    <AdminSettingsRoute allowView={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-slate-800 mb-2">
                Configuración de Puestos
              </h1>
              <p className="text-slate-500 font-light">
                Gestiona puestos, equipos, niveles y categorías profesionales
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/60 rounded-xl border-0 shadow-sm">
            <TabsTrigger value="jobs" className="rounded-lg font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Briefcase className="h-4 w-4 mr-2" />
              Puestos
            </TabsTrigger>
            <TabsTrigger value="departments" className="rounded-lg font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Building2 className="h-4 w-4 mr-2" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="levels" className="rounded-lg font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Layers className="h-4 w-4 mr-2" />
              Niveles
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-lg font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-white">
              <Tag className="h-4 w-4 mr-2" />
              Categorías
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar puestos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light bg-white/80"
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-56 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg">
                    <SelectItem value="all" className="rounded-lg">Todos los equipos</SelectItem>
                    {departments && departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.value} className="rounded-lg">
                        {dept.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => setIsJobDialogOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-2.5 shadow-sm font-medium transition-all duration-200"
                disabled={!permissions.canEdit}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Puesto
              </Button>

              <CreateJobDialog
                open={isJobDialogOpen}
                onOpenChange={setIsJobDialogOpen}
                onJobCreated={loadJobs}
                departments={departments}
                canEdit={permissions.canEdit}
              />
            </div>

            {/* Jobs Grid */}
            {filteredJobs && filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs && filteredJobs.map((job) => (
                  <Card key={job.id} className="bg-white/70 backdrop-blur border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-xl">
                            <Briefcase className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-medium text-slate-800 leading-tight">
                              {job.title}
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-light mt-1">
                              <Building2 className="h-3 w-3 inline mr-1" />
                              {job.department}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditJob(job)}
                            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-0 shadow-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-medium">¿Eliminar puesto?</AlertDialogTitle>
                                <AlertDialogDescription className="font-light">
                                  Esta acción no se puede deshacer. Se eliminará permanentemente "{job.title}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="bg-rose-600 hover:bg-rose-700 rounded-xl font-medium"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-light">{getHoursLabel(job.hours)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 font-light">Ratio:</span>
                          <Badge 
                            className={`${getRatioColor(job.rate_unit)} rounded-lg font-medium border`}
                          >
                            {job.rate_unit}U
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/70 backdrop-blur border-0 shadow-sm rounded-2xl">
                <CardContent className="py-16 text-center">
                  <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    No hay puestos de trabajo
                  </h3>
                  <p className="text-slate-500 font-light mb-6">
                    {searchTerm || departmentFilter !== "all" 
                      ? "No se encontraron puestos con los filtros aplicados"
                      : "Crea el primer puesto de trabajo para comenzar"
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-slate-800">Gestión de Equipos</h2>
              
              <Dialog open={isDepartmentDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setNewDepartment("");
                  setEditingDepartment(null);
                }
                setIsDepartmentDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-2.5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Equipo
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && newDepartment.trim()) {
                      e.preventDefault();
                      handleSaveDepartment();
                    }
                  }}
                >
                  <DialogHeader className="border-b border-slate-100 pb-4">
                    <DialogTitle className="text-xl font-light text-slate-800">
                      {editingDepartment ? "Editar Equipo" : "Nuevo Equipo"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Nombre del Equipo
                      </label>
                      <Input
                        placeholder="ej. Bares, Cocina, Recepción..."
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setIsDepartmentDialogOpen(false)}
                        className="rounded-xl px-6 font-light"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveDepartment}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 font-medium"
                      >
                        {loading ? "Guardando..." : (editingDepartment ? "Actualizar" : "Crear")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments && departments.map((dept) => (
                <Card key={dept.id} className="bg-white/70 backdrop-blur border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <span className="font-medium text-slate-800">{dept.value}</span>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDepartment(dept);
                            setNewDepartment(dept.value);
                            setIsDepartmentDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-0 shadow-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-medium">¿Eliminar equipo?</AlertDialogTitle>
                              <AlertDialogDescription className="font-light">
                                Esta acción no se puede deshacer. Se eliminará permanentemente "{dept.value}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="bg-rose-600 hover:bg-rose-700 rounded-xl font-medium"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Professional Levels Tab */}
          <TabsContent value="levels" className="space-y-6">
            {/* Header with search and filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-slate-800">Niveles Profesionales</h2>
                <p className="text-sm text-slate-500 mt-1">Gestiona los niveles del convenio colectivo</p>
              </div>
              
              <Dialog open={isLevelDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setNewLevel({ name: "", code: "", description: "" });
                  setEditingLevel(null);
                }
                setIsLevelDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-2.5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Nivel
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && newLevel.name.trim()) {
                      e.preventDefault();
                      handleSaveLevel();
                    }
                  }}
                >
                  <DialogHeader className="border-b border-slate-100 pb-4">
                    <DialogTitle className="text-xl font-light text-slate-800">
                      {editingLevel ? "Editar Nivel" : "Nuevo Nivel Profesional"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Nombre del Nivel *
                      </label>
                      <Input
                        placeholder="ej. Grupo I, Grupo II..."
                        value={newLevel.name}
                        onChange={(e) => setNewLevel(prev => ({ ...prev, name: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Código
                      </label>
                      <Input
                        placeholder="ej. GI, GII..."
                        value={newLevel.code}
                        onChange={(e) => setNewLevel(prev => ({ ...prev, code: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Descripción
                      </label>
                      <Input
                        placeholder="Descripción del nivel..."
                        value={newLevel.description}
                        onChange={(e) => setNewLevel(prev => ({ ...prev, description: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setIsLevelDialogOpen(false)}
                        className="rounded-xl px-6 font-light"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveLevel}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 font-medium"
                      >
                        {loading ? "Guardando..." : (editingLevel ? "Actualizar" : "Crear")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Enhanced search and sort controls */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white/50 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar niveles por nombre, código o descripción..."
                  value={levelSearchTerm}
                  onChange={(e) => setLevelSearchTerm(e.target.value)}
                  className="pl-11 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light bg-white"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLevelSortOrder(levelSortOrder === "asc" ? "desc" : "asc")}
                className="rounded-xl border-slate-200 hover:bg-slate-50 px-3 bg-white"
              >
                {levelSortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">{levelSortOrder === "asc" ? "A-Z" : "Z-A"}</span>
              </Button>
            </div>

            {/* Levels list */}
            {filteredLevels.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                {filteredLevels.map((level, index) => (
                  <div 
                    key={level.id} 
                    className={`flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group ${
                      index !== filteredLevels.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                        <Layers className="h-4 w-4 text-slate-500" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-slate-800 truncate">
                            {level.level_name}
                          </h4>
                          {level.level_code && (
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                              {level.level_code}
                            </span>
                          )}
                        </div>
                        {level.description && (
                          <p className="text-sm text-slate-500 mt-1 truncate">
                            {level.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingLevel(level);
                          setNewLevel({
                            name: level.level_name,
                            code: level.level_code || "",
                            description: level.description || ""
                          });
                          setIsLevelDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl border-0 shadow-xl bg-white z-50">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-medium">¿Eliminar nivel?</AlertDialogTitle>
                            <AlertDialogDescription className="font-light">
                              Esta acción no se puede deshacer. Se eliminará permanentemente "{level.level_name}" y todas sus categorías asociadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteLevel(level.id)}
                              className="bg-rose-600 hover:bg-rose-700 rounded-xl font-medium"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/60 py-16 text-center">
                <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                  <Layers className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  No hay niveles profesionales
                </h3>
                <p className="text-slate-500 font-light mb-6">
                  {levelSearchTerm 
                    ? "No se encontraron niveles con el término de búsqueda"
                    : "Crea el primer nivel profesional para comenzar"
                  }
                </p>
                {levelSearchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setLevelSearchTerm("")}
                    className="rounded-xl"
                  >
                    Limpiar búsqueda
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Professional Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            {/* Header with search and filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-slate-800">Categorías Profesionales</h2>
                <p className="text-sm text-slate-500 mt-1">Organizadas por nivel profesional</p>
              </div>
              
              <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setNewCategory({ name: "", code: "", description: "", level_id: "" });
                  setEditingCategory(null);
                }
                setIsCategoryDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-6 py-2.5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Categoría
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="sm:max-w-md bg-white border-0 shadow-xl rounded-2xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && newCategory.name.trim()) {
                      e.preventDefault();
                      handleSaveCategory();
                    }
                  }}
                >
                  <DialogHeader className="border-b border-slate-100 pb-4">
                    <DialogTitle className="text-xl font-light text-slate-800">
                      {editingCategory ? "Editar Categoría" : "Nueva Categoría Profesional"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Nombre de la Categoría *
                      </label>
                      <Input
                        placeholder="ej. Camarero/a, Jefe de Bares..."
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Nivel Profesional
                      </label>
                      <Select 
                        value={newCategory.level_id} 
                        onValueChange={(value) => setNewCategory(prev => ({ ...prev, level_id: value }))}
                      >
                        <SelectTrigger className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light">
                          <SelectValue placeholder="Selecciona un nivel" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-0 shadow-lg">
                          {professionalLevels && professionalLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id} className="rounded-lg">
                              {level.level_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Código
                      </label>
                      <Input
                        placeholder="ej. CAM, JB..."
                        value={newCategory.code}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, code: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">
                        Descripción
                      </label>
                      <Input
                        placeholder="Descripción de la categoría..."
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        className="rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        onClick={() => setIsCategoryDialogOpen(false)}
                        className="rounded-xl px-6 font-light"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveCategory}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6 font-medium"
                      >
                        {loading ? "Guardando..." : (editingCategory ? "Actualizar" : "Crear")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Enhanced search and filter controls */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/50 rounded-xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar categorías por nombre, código o descripción..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="pl-11 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light bg-white"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-0 font-light bg-white">
                    <SelectValue placeholder="Filtrar por nivel" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-0 shadow-lg bg-white z-50">
                    <SelectItem value="all" className="rounded-lg">Todos los niveles</SelectItem>
                    {professionalLevels && professionalLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id} className="rounded-lg">
                        {level.level_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="rounded-xl border-slate-200 hover:bg-slate-50 px-3 bg-white"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
                </Button>
              </div>
            </div>

            {/* Categories organized by level in rows */}
            {sortedLevelNames.length > 0 ? (
              <div className="space-y-6">
                {sortedLevelNames.map((levelName) => (
                  <div key={levelName} className="space-y-3">
                    {/* Level header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <Layers className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-slate-800">{levelName}</h3>
                        <p className="text-xs text-slate-500">
                          {categoriesByLevel[levelName].length} categoría{categoriesByLevel[levelName].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    {/* Categories list */}
                    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                      {categoriesByLevel[levelName].map((category, index) => (
                        <div 
                          key={category.id} 
                          className={`flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group ${
                            index !== categoriesByLevel[levelName].length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                              <Tag className="h-4 w-4 text-slate-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-slate-800 truncate">
                                  {category.category_name}
                                </h4>
                                {category.category_code && (
                                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                    {category.category_code}
                                  </span>
                                )}
                              </div>
                              {category.description && (
                                <p className="text-sm text-slate-500 mt-1 truncate">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory(category);
                                setNewCategory({
                                  name: category.category_name,
                                  code: category.category_code || "",
                                  description: category.description || "",
                                  level_id: category.level_id || ""
                                });
                                setIsCategoryDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-slate-500 hover:text-rose-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-2xl border-0 shadow-xl bg-white z-50">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-medium">¿Eliminar categoría?</AlertDialogTitle>
                                  <AlertDialogDescription className="font-light">
                                    Esta acción no se puede deshacer. Se eliminará permanentemente "{category.category_name}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl font-light">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="bg-rose-600 hover:bg-rose-700 rounded-xl font-medium"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/60 py-16 text-center">
                <div className="p-4 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
                  <Tag className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  No hay categorías profesionales
                </h3>
                <p className="text-slate-500 font-light mb-6">
                  {categorySearchTerm || levelFilter !== "all" 
                    ? "No se encontraron categorías con los filtros aplicados"
                    : "Crea la primera categoría profesional para comenzar"
                  }
                </p>
                {(categorySearchTerm || levelFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategorySearchTerm("");
                      setLevelFilter("all");
                    }}
                    className="rounded-xl"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminSettingsRoute>
  );
}