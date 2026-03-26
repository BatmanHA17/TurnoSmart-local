import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CuadranteMensual } from "./CuadranteMensual";
import { CuadranteMensual as CuadranteMensualType } from "@/types/cuadrante";
import { 
  Plus, 
  Calendar, 
  Download, 
  Upload, 
  FileText, 
  Edit3, 
  Copy, 
  Trash2,
  Settings,
  Grid3x3,
  CalendarDays,
  Clock,
  Users,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getCuadrantes as getSupabaseCuadrantes } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { ImportCSVDialog } from './ImportCSVDialog';

interface Cuadrante {
  id: string;
  name: string;
  month: string;
  year: number;
  type: 'manual' | 'auto';
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  employeeCount: number;
  description?: string;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

export const Cuadrantes = () => {
  const [cuadrantes, setCuadrantes] = useState<Cuadrante[]>([]);
  const [loading, setLoading] = useState(true);

  const getMonthName = (month: number) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1] || 'Desconocido';
  };

  const loadCuadrantes = async () => {
    try {
      const supabaseCuadrantes = await getSupabaseCuadrantes();
      const formattedData = supabaseCuadrantes.map(c => ({
        id: c.id,
        name: c.name,
        month: getMonthName(c.month),
        year: c.year,
        type: 'auto' as const,
        status: 'published' as const,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        employeeCount: 0, // Se puede calcular después si es necesario
        description: `Cuadrante ${getMonthName(c.month)} ${c.year}`
      }));
      setCuadrantes(formattedData);
    } catch (error) {
      console.error('Error loading cuadrantes:', error);
      toast({
        title: "Error",
        description: "Error al cargar cuadrantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuadrantes();
    
    const refreshHandler = () => loadCuadrantes();
    window.addEventListener('cuadrante-saved', refreshHandler);
    return () => window.removeEventListener('cuadrante-saved', refreshHandler);
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingCuadrante, setEditingCuadrante] = useState<CuadranteMensualType | null>(null);
  const [newCuadrante, setNewCuadrante] = useState({
    name: '',
    month: '',
    year: 2024,
    type: 'manual' as 'manual' | 'auto',
    description: ''
  });

  const handleCreateCuadrante = async () => {
    if (!newCuadrante.name || !newCuadrante.month) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      // NOTA: La tabla 'cuadrantes' no existe en el schema actual
      // Esta funcionalidad necesita ser reimplementada o la tabla debe ser creada
      console.error('La tabla cuadrantes no existe. Funcionalidad deshabilitada temporalmente.');
      toast({
        title: "Funcionalidad no disponible",
        description: "La tabla de cuadrantes necesita ser creada en la base de datos",
        variant: "destructive"
      });
      return;

      await loadCuadrantes();
      setIsCreateDialogOpen(false);
      setNewCuadrante({
        name: '',
        month: '',
        year: 2024,
        type: 'manual',
        description: ''
      });

      toast({
        title: "Horario creado",
        description: `${newCuadrante.name} ha sido creado exitosamente`,
      });
    } catch (error) {
      console.error('Error creating cuadrante:', error);
      toast({
        title: "Error",
        description: "Error al crear cuadrante",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateCuadrante = async (id: string) => {
    try {
      toast({
        title: "Función no disponible",
        description: "La duplicación estará disponible próximamente"
      });
    } catch (error) {
      console.error('Error duplicating cuadrante:', error);
      toast({
        title: "Error",
        description: "Error al duplicar cuadrante",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCuadrante = async (id: string) => {
    try {
      // NOTA: La tabla 'cuadrantes' no existe en el schema actual
      console.error('La tabla cuadrantes no existe. Funcionalidad deshabilitada temporalmente.');
      toast({
        title: "Funcionalidad no disponible",
        description: "La tabla de cuadrantes necesita ser creada en la base de datos",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting cuadrante:', error);
      toast({
        title: "Error",
        description: "Error al eliminar cuadrante",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'auto' ? <Clock className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />;
  };

  const filteredCuadrantes = cuadrantes.filter(c => c.year === selectedYear);

  const handleEditCuadrante = (cuadranteId: string) => {
    // Simular carga de cuadrante completo
    const cuadrante: CuadranteMensualType = {
      id: cuadranteId,
      name: `Cuadrante ${selectedYear}`,
      month: new Date().getMonth() + 1,
      year: selectedYear,
      daysInMonth: 31,
      employees: [],
      occupancy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'DRAFT'
    };
    setEditingCuadrante(cuadrante);
  };

  const handleSaveCuadrante = (cuadrante: CuadranteMensualType) => {
    
    // Map status correctly
    const mappedStatus = cuadrante.status === 'PUBLISHED' ? 'published' :
                        cuadrante.status === 'ARCHIVED' ? 'archived' : 'draft';
    
    const existingIndex = cuadrantes.findIndex(c => c.id === cuadrante.id);
    const summary: Cuadrante = existingIndex >= 0 ? {
      ...cuadrantes[existingIndex],
      name: cuadrante.name,
      month: getMonthName(cuadrante.month),
      year: cuadrante.year,
      employeeCount: cuadrante.employees.length,
      updatedAt: new Date(),
      status: mappedStatus
    } : {
      id: cuadrante.id,
      name: cuadrante.name,
      month: getMonthName(cuadrante.month),
      year: cuadrante.year,
      type: 'manual',
      status: mappedStatus,
      createdAt: cuadrante.createdAt,
      updatedAt: new Date(),
      employeeCount: cuadrante.employees.length,
      description: `Cuadrante generado para ${getMonthName(cuadrante.month)} ${cuadrante.year}`
    };

    if (existingIndex >= 0) {
      const newList = cuadrantes.map(c => c.id === summary.id ? summary : c);
      setCuadrantes(newList);
    } else {
      setCuadrantes(prev => [...prev, summary]);
    }

    // Data will be saved automatically in Supabase

    setEditingCuadrante(null);
    
    toast({
      title: "Horario guardado",
      description: `${summary.name} ha sido guardado correctamente`,
    });
  };

  // Función auxiliar para convertir número de mes a nombre (usando la ya definida arriba)

  const handleCancelEdit = () => {
    setEditingCuadrante(null);
  };

  const handleImportCSV = async (csvData: string, metadata: {
    fileName: string;
    cuadranteName: string;
    month: string;
    year: number;
    status: 'draft' | 'published' | 'archived';
  }) => {
    try {
      // NOTA: La tabla 'cuadrantes' no existe en el schema actual
      console.error('La tabla cuadrantes no existe. Funcionalidad deshabilitada temporalmente.');
      toast({
        title: "Funcionalidad no disponible",
        description: "La tabla de cuadrantes necesita ser creada en la base de datos",
        variant: "destructive"
      });
      return;
      // TODO: Implementar procesamiento del CSV

      await loadCuadrantes(); // Refresh from Supabase

      toast({
        title: "CSV importado exitosamente",
        description: `Se ha creado el cuadrante "${metadata.cuadranteName}" para ${metadata.month} ${metadata.year}`,
      });
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error",
        description: "Error al importar CSV",
        variant: "destructive"
      });
    }
  };

  // Mostrar editor de cuadrante si está editando
  if (editingCuadrante) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCancelEdit}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Cuadrantes
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Editando Cuadrante</h1>
            <p className="text-muted-foreground">
              {editingCuadrante.name}
            </p>
          </div>
        </div>
        
        <CuadranteMensual
          cuadrante={editingCuadrante}
          onSave={handleSaveCuadrante}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Turnos</h2>
          <p className="text-muted-foreground">
            Gestiona todos los turnos del año. Crea, edita y organiza los turnos del personal.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
            Nuevo Horario
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Horario</DialogTitle>
                <DialogDescription>
                  Crea un horario en blanco o generado automáticamente desde Turno Público
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Horario *</Label>
                  <Input
                    id="name"
                    value={newCuadrante.name}
                    onChange={(e) => setNewCuadrante({...newCuadrante, name: e.target.value})}
                    placeholder="Ej: Horario Marzo 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mes *</Label>
                    <Select value={newCuadrante.month} onValueChange={(value) => setNewCuadrante({...newCuadrante, month: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Select value={newCuadrante.year.toString()} onValueChange={(value) => setNewCuadrante({...newCuadrante, year: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Horario</Label>
                  <Tabs value={newCuadrante.type} onValueChange={(value) => setNewCuadrante({...newCuadrante, type: value as 'manual' | 'auto'})}>
                    <TabsList className="h-auto p-0 bg-transparent border-none relative">
                      <TabsTrigger value="manual" className="bg-transparent border-none text-sm font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none">
                        Manual
                      </TabsTrigger>
                      <TabsTrigger value="auto" className="bg-transparent border-none text-sm font-normal text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-transparent data-[state=active]:after:bg-foreground after:transition-colors hover:text-foreground px-0 pb-2 rounded-none ml-6">
                        Automatizado
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-muted-foreground">
                    {newCuadrante.type === 'auto' 
                      ? 'Se generará automáticamente basado en los datos de Turno Público'
                      : 'Cuadrante en blanco para cumplimentar manualmente'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={newCuadrante.description}
                    onChange={(e) => setNewCuadrante({...newCuadrante, description: e.target.value})}
                    placeholder="Descripción del cuadrante..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCuadrante}>
                  Crear Cuadrante
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <ImportCSVDialog
            isOpen={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            onImport={handleImportCSV}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horarios {selectedYear}</CardTitle>
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCuadrantes.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCuadrantes.filter(c => c.status === 'published').length} publicados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCuadrantes.filter(c => c.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendientes de publicar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCuadrantes.length > 0 
                ? Math.round(filteredCuadrantes.reduce((acc, c) => acc + c.employeeCount, 0) / filteredCuadrantes.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Por cuadrante
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cuadrantes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCuadrantes.map((cuadrante) => (
          <Card key={cuadrante.id} className="group relative hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{cuadrante.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(cuadrante.type)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {cuadrante.type === 'auto' ? 'Automatizado' : 'Manual'}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusColor(cuadrante.status)}>
                  {cuadrante.status === 'published' ? 'Publicado' : 
                   cuadrante.status === 'draft' ? 'Borrador' : 'Archivado'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Período</p>
                  <p className="font-medium">{cuadrante.month} {cuadrante.year}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Empleados</p>
                  <p className="font-medium">{cuadrante.employeeCount}</p>
                </div>
              </div>

              {cuadrante.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {cuadrante.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Creado: {cuadrante.createdAt.toLocaleDateString()}</p>
                <p>Actualizado: {cuadrante.updatedAt.toLocaleDateString()}</p>
              </div>

              <div className="flex justify-between pt-2 border-t">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicateCuadrante(cuadrante.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex gap-1">
                  <Button size="sm" variant="default" onClick={() => handleEditCuadrante(cuadrante.id)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCuadrante(cuadrante.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCuadrantes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay cuadrantes para {selectedYear}</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer cuadrante para comenzar a gestionar los turnos del personal.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Cuadrante
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};