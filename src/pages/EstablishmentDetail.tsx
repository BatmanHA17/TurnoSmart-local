import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, HelpCircle, Archive, Trash2, AlertTriangle, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlanningConfiguration } from "@/components/PlanningConfiguration";
import { GestionJornadaLaboral } from "@/components/GestionJornadaLaboral";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EstablishmentDetail() {
  const { establishmentName } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [isEditingVacaciones, setIsEditingVacaciones] = useState(false);
  const [isEditingComidas, setIsEditingComidas] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [establishmentId, setEstablishmentId] = useState<string | null>(null);
  const [isSocialSheetOpen, setIsSocialSheetOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    convenioColectivo: "",
    codigoNaf: "",
    cif: "",
    mutua: "",
    direccion: "",
    baseCalculoVacaciones: "Por 6 días laborales",
    adquisicionMensual: "2.5",
    periodoAdquisicion: {
      del: "1",
      mes: "febrero",
      ano: "31 ene. N+1"
    },
    tipoComida: "BND"
  });

  // Función para actualizar la adquisición mensual según la base de cálculo
  const updateAdquisicionMensual = (baseCalculo: string) => {
    let newValue = "2.5";
    switch (baseCalculo) {
      case "Por 5 días hábiles":
        newValue = "2.08";
        break;
      case "Por 6 días laborales":
        newValue = "2.5";
        break;
      case "Por 7 días naturales":
        newValue = "2.5";
        break;
    }
    setFormData(prev => ({ ...prev, adquisicionMensual: newValue }));
  };

  // Cargar datos del establecimiento
  useEffect(() => {
    const loadEstablishmentData = async () => {
      if (!establishmentName) return;
      
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('name', establishmentName)
          .maybeSingle();

        if (error) {
          console.error('Error loading establishment:', error);
          return;
        }

        if (data) {
          setEstablishmentId(data.id);
          setFormData({
            convenioColectivo: data.convenio_colectivo || "",
            codigoNaf: data.codigo_naf || "",
            cif: data.cif || "",
            mutua: data.mutua || "",
            direccion: (data as any).direccion || data.establishment_address || "",
            baseCalculoVacaciones: data.base_calculo_vacaciones || "Por 6 días laborales",
            adquisicionMensual: data.adquisicion_mensual?.toString() || "2.5",
            periodoAdquisicion: {
              del: data.periodo_adquisicion_del?.toString() || "1",
              mes: data.periodo_adquisicion_mes || "febrero",
              ano: data.periodo_adquisicion_ano || "31 ene. N+1"
            },
            tipoComida: data.tipo_comida || "BND"
          });
        }
      } catch (error) {
        console.error('Error loading establishment data:', error);
      }
    };

    loadEstablishmentData();
  }, [establishmentName]);

  useEffect(() => {
    document.title = `${establishmentName} | Establecimiento | TurnoSmart`;
  }, [establishmentName]);

  const handleBack = () => {
    navigate("/settings/locations");
  };

  const handleSocialDataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSocialData = async () => {
    if (!establishmentId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          convenio_colectivo: formData.convenioColectivo,
          codigo_naf: formData.codigoNaf,
          cif: formData.cif,
          mutua: formData.mutua,
          address: formData.direccion
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success("Descripción social actualizada correctamente");
      setIsEditingSocial(false);
    } catch (error) {
      console.error('Error saving social data:', error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVacacionesData = async () => {
    if (!establishmentId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          base_calculo_vacaciones: formData.baseCalculoVacaciones,
          adquisicion_mensual: parseFloat(formData.adquisicionMensual),
          periodo_adquisicion_del: parseInt(formData.periodoAdquisicion.del),
          periodo_adquisicion_mes: formData.periodoAdquisicion.mes,
          periodo_adquisicion_ano: formData.periodoAdquisicion.ano
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success("Configuración de vacaciones actualizada correctamente");
      setIsEditingVacaciones(false);
    } catch (error) {
      console.error('Error saving vacaciones data:', error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComidasData = async () => {
    if (!establishmentId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          tipo_comida: formData.tipoComida
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast.success("Configuración de comidas actualizada correctamente");
      setIsEditingComidas(false);
    } catch (error) {
      console.error('Error saving comidas data:', error);
      toast.error("Error al guardar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Establecimientos
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Configurar</span>
        </div>

        {/* Title and Actions */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{establishmentName}</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditMode(true)}
              className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              Editar establecimiento
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="personal-laboral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-full p-1">
            <TabsTrigger value="personal-laboral" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Personal laboral</TabsTrigger>
            <TabsTrigger value="planificacion" className="rounded-full data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm">Planificación</TabsTrigger>
            <TabsTrigger value="gestion-jornada" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Gestión de Jornada Laboral</TabsTrigger>
          </TabsList>

          <TabsContent value="personal-laboral" className="space-y-8">
            {/* Descripción social */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Descripción social</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsSocialSheetOpen(true)}
                  className="text-gray-600 hover:text-gray-800 rounded-full"
                >
                  Modificar
                </Button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="convenio">Convenio colectivo</Label>
                    <Input 
                      id="convenio"
                      value={formData.convenioColectivo}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigo-naf">Código NAF</Label>
                    <Input 
                      id="codigo-naf"
                      value={formData.codigoNaf}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cif">CIF (Código de Identificación Fiscal)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="cif"
                        value={formData.cif}
                        readOnly
                        className="bg-gray-50"
                      />
                      <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                        12 se acuerde
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mutua">Mutua</Label>
                    <Input 
                      id="mutua"
                      value={formData.mutua}
                      placeholder="No rellenado"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input 
                    id="direccion"
                    value={formData.direccion}
                    placeholder=""
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Bonificaciones y adelantos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Bonificaciones y adelantos</h2>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">Añadir</Button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 rounded-full"></div>
                  </div>
                  <p>No has creado bonificaciones o adelantos.</p>
                </div>
              </div>
            </div>

            {/* Base de cálculo para las vacaciones */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Base de cálculo para las vacaciones</h2>
                <div className="flex items-center gap-2">
                  <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 text-sm">
                    Ver los contadores de días de permisos asignados
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditingVacaciones(!isEditingVacaciones)}
                    className="text-gray-600 hover:text-gray-800 rounded-full"
                  >
                    {isEditingVacaciones ? "Cancelar" : "Modificar"}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <p className="text-blue-800 text-sm">
                    Ahora puede activar los contadores de vacaciones accediendo a la página Gestión de vacaciones.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium text-gray-900">Base de cálculo del conteo de las vacaciones *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Determina el tipo de cálculo para las vacaciones</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select 
                    value={formData.baseCalculoVacaciones} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, baseCalculoVacaciones: value }));
                      updateAdquisicionMensual(value);
                    }}
                    disabled={!isEditingVacaciones}
                  >
                    <SelectTrigger className={`mt-2 rounded-lg ${isEditingVacaciones ? 'bg-white border-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                      <SelectItem value="Por 5 días hábiles" className="rounded-lg">Por 5 días hábiles</SelectItem>
                      <SelectItem value="Por 6 días laborales" className="rounded-lg">Por 6 días laborales</SelectItem>
                      <SelectItem value="Por 7 días naturales" className="rounded-lg">Por 7 días naturales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium text-gray-900">Adquisición mensual *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Se aplica automáticamente la noche del último día del mes.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Se aplica automáticamente la noche del último día del mes.</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={formData.adquisicionMensual}
                      onChange={(e) => setFormData(prev => ({ ...prev, adquisicionMensual: e.target.value }))}
                      readOnly={!isEditingVacaciones}
                      className={`w-20 text-right rounded-lg ${isEditingVacaciones ? 'bg-white border-gray-300' : 'bg-gray-50'}`}
                    />
                    <span className="text-gray-600 text-sm">d</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium text-gray-900">Período de adquisición *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Período durante el cual se adquieren los días de vacaciones.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Del</span>
                    <Select 
                      value={formData.periodoAdquisicion.del}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        periodoAdquisicion: { ...prev.periodoAdquisicion, del: value }
                      }))}
                      disabled={!isEditingVacaciones}
                    >
                      <SelectTrigger className={`w-16 rounded-lg ${isEditingVacaciones ? 'bg-white border-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()} className="rounded-lg">
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={formData.periodoAdquisicion.mes}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        periodoAdquisicion: { ...prev.periodoAdquisicion, mes: value }
                      }))}
                      disabled={!isEditingVacaciones}
                    >
                      <SelectTrigger className={`w-32 rounded-lg ${isEditingVacaciones ? 'bg-white border-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg">
                        <SelectItem value="enero" className="rounded-lg">enero</SelectItem>
                        <SelectItem value="febrero" className="rounded-lg">febrero</SelectItem>
                        <SelectItem value="marzo" className="rounded-lg">marzo</SelectItem>
                        <SelectItem value="abril" className="rounded-lg">abril</SelectItem>
                        <SelectItem value="mayo" className="rounded-lg">mayo</SelectItem>
                        <SelectItem value="junio" className="rounded-lg">junio</SelectItem>
                        <SelectItem value="julio" className="rounded-lg">julio</SelectItem>
                        <SelectItem value="agosto" className="rounded-lg">agosto</SelectItem>
                        <SelectItem value="septiembre" className="rounded-lg">septiembre</SelectItem>
                        <SelectItem value="octubre" className="rounded-lg">octubre</SelectItem>
                        <SelectItem value="noviembre" className="rounded-lg">noviembre</SelectItem>
                        <SelectItem value="diciembre" className="rounded-lg">diciembre</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-gray-600 text-sm">a el</span>
                    <Input 
                      value={formData.periodoAdquisicion.ano}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        periodoAdquisicion: { ...prev.periodoAdquisicion, ano: e.target.value }
                      }))}
                      readOnly={!isEditingVacaciones}
                      className={`w-24 rounded-lg ${isEditingVacaciones ? 'bg-white border-gray-300' : 'bg-gray-50'}`}
                    />
                  </div>
                </div>

                {isEditingVacaciones && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingVacaciones(false)}
                      className="rounded-full"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveVacacionesData}
                      disabled={isLoading}
                      className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isLoading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}

                {!isEditingVacaciones && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">Actualizado el 19/09/2025, por BATMAN BATMAN.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comidas */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Comidas</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingComidas(!isEditingComidas)}
                  className="text-gray-600 hover:text-gray-800 rounded-full"
                >
                  {isEditingComidas ? "Cancelar" : "Modificar"}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Tipo de indemnización de comidas por defecto
              </p>

              <div className="space-y-4">
                <RadioGroup 
                  value={formData.tipoComida} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipoComida: value }))}
                  disabled={!isEditingComidas}
                  className="space-y-4"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="PC" id="pc" className="mt-1" disabled={!isEditingComidas} />
                    <div className="flex-1">
                      <Label htmlFor="pc" className="font-normal text-gray-900 text-sm cursor-pointer">PC - Prestación por comidas</Label>
                      <p className="text-xs text-gray-500 mt-1">Comida tomada en este tarifa plana preferente</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="BND" id="bnd" className="mt-1" disabled={!isEditingComidas} />
                    <div className="flex-1">
                      <Label htmlFor="bnd" className="font-normal text-gray-900 text-sm cursor-pointer">(BND) - Beneficio no dinerario</Label>
                      <p className="text-xs text-gray-500 mt-1">Cuantía gravada, sin deducción salarial, pero con cotizaciones a la seguridad social</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="VR" id="vr" className="mt-1" disabled={!isEditingComidas} />
                    <div className="flex-1">
                      <Label htmlFor="vr" className="font-normal text-gray-900 text-sm cursor-pointer">VR - Vale de restaurante</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="CTF" id="ctf" className="mt-1" disabled={!isEditingComidas} />
                    <div className="flex-1">
                      <Label htmlFor="ctf" className="font-normal text-gray-900 text-sm cursor-pointer">CTF - Comida tomada fuera</Label>
                      <p className="text-xs text-gray-500 mt-1">Indemnización financiera a tanto alzado para comidas tomadas fuera</p>
                    </div>
                  </div>
                </RadioGroup>

                {isEditingComidas && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingComidas(false)}
                      className="rounded-full"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveComidasData}
                      disabled={isLoading}
                      className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {isLoading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}

                {!isEditingComidas && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-2">Actualizado el 19/09/2025, por BATMAN BATMAN.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="planificacion" className="space-y-6">
            <PlanningConfiguration orgId={establishmentId || undefined} />
          </TabsContent>

          <TabsContent value="gestion-jornada">
            <GestionJornadaLaboral />
          </TabsContent>
        </Tabs>

        {/* Social Data Sheet */}
        <Sheet open={isSocialSheetOpen} onOpenChange={setIsSocialSheetOpen}>
          <SheetContent side="right" className="w-[600px] sm:w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold text-left">Descripción social</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-convenio" className="text-sm font-medium text-gray-900">Convenio colectivo</Label>
                  <Input 
                    id="edit-convenio"
                    value={formData.convenioColectivo}
                    onChange={(e) => handleSocialDataChange("convenioColectivo", e.target.value)}
                    className="mt-2 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-codigo-naf" className="text-sm font-medium text-gray-900">Código NAF</Label>
                  <Input 
                    id="edit-codigo-naf"
                    value={formData.codigoNaf}
                    onChange={(e) => handleSocialDataChange("codigoNaf", e.target.value)}
                    className="mt-2 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-cif" className="text-sm font-medium text-gray-900">CIF (Código de Identificación Fiscal)</Label>
                  <Input 
                    id="edit-cif"
                    value={formData.cif}
                    onChange={(e) => handleSocialDataChange("cif", e.target.value)}
                    className="mt-2 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-mutua" className="text-sm font-medium text-gray-900">Mutua</Label>
                  <Input 
                    id="edit-mutua"
                    value={formData.mutua}
                    onChange={(e) => handleSocialDataChange("mutua", e.target.value)}
                    placeholder="No rellenado"
                    className="mt-2 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-direccion" className="text-sm font-medium text-gray-900">Dirección</Label>
                  <Input 
                    id="edit-direccion"
                    value={formData.direccion}
                    onChange={(e) => handleSocialDataChange("direccion", e.target.value)}
                    className="mt-2 rounded-lg"
                  />
                </div>
                
                <div className="flex gap-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSocialSheetOpen(false)}
                    className="flex-1 rounded-full border-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={async () => {
                      await handleSaveSocialData();
                      setIsSocialSheetOpen(false);
                    }}
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Modal */}
        <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{establishmentName}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">Nombre del establecimiento *</Label>
                  <Input 
                    id="edit-name"
                    defaultValue={establishmentName}
                    className="mt-1 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-empresa" className="text-sm font-medium">Nombre de la empresa</Label>
                  <Input 
                    id="edit-empresa"
                    defaultValue="Gotham"
                    className="mt-1 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-identification" className="text-sm font-medium">NIF (código de identificación fiscal)</Label>
                  <Input 
                    id="edit-identification"
                    defaultValue=""
                    className="mt-1 rounded-lg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-logo" className="text-sm font-medium">Logo del establecimiento</Label>
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Plus className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Añadir una imagen</p>
                      <p className="text-xs text-gray-500">JPG, PNG (máx. 2MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 bg-orange-500 rounded text-white flex items-center justify-center text-xs">📍</div>
                  Dirección del establecimiento
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-direccion" className="text-sm">Dirección</Label>
                    <Input id="edit-direccion" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-postal" className="text-sm">Código postal</Label>
                      <Input id="edit-postal" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="edit-ciudad" className="text-sm">Ciudad</Label>
                      <Input id="edit-ciudad" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-pais" className="text-sm">País</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">España</SelectItem>
                        <SelectItem value="fr">Francia</SelectItem>
                        <SelectItem value="de">Alemania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Informaciones jurídicas</h3>
                <div>
                  <Label htmlFor="edit-juridica" className="text-sm">Código del órgano de trabajo al trabajo</Label>
                  <Input id="edit-juridica" className="mt-1" />
                </div>
              </div>

              {/* Associated ID */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">ID asociado:</h3>
                <div className="bg-gray-100 rounded p-2 mb-3">
                  <code className="text-sm text-gray-700">3ac5fde3-3937-43b3-af4a-56057573af83</code>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 text-blue-600 mt-0.5">ℹ️</div>
                  <p className="text-sm text-blue-800">
                    Este ID está utilizado para las integraciones API y para algunas exportaciones de 
                    software de pago. Se genera automáticamente y no es necesario modificarlo si no se 
                    necesita.
                  </p>
                </div>
              </div>

              {/* Actions Section */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-900">Acciones sobre el establecimiento</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Archivar el establecimiento</p>
                      <p className="text-sm text-gray-600">Se archivarán todas las Rotas y turnos relacionados con él</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                          Archivar el establecimiento
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Archivar establecimiento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción archivará el establecimiento y todas sus Rotas y turnos relacionados. 
                            Podrás restaurarlo más tarde desde la sección de establecimientos archivados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Archivar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Suprimir el establecimiento</p>
                      <p className="text-sm text-gray-600">Se suprimirán todas las Rotas y turnos relacionados con él</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                          Suprimir el establecimiento
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>⚠️ Acción irreversible</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente el establecimiento y todos sus datos asociados 
                            (Rotas, turnos, empleados, etc.). Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Eliminar permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditMode(false)}
                  className="rounded-full"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    // Here you would save the changes
                    setIsEditMode(false);
                  }}
                  className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Guardar y continuar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}