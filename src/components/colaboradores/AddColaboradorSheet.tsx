import React from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import {
  useAddColaboradorForm,
  TIPOS_CONTRATO,
  COUNTRY_PHONE_CODES,
} from "@/hooks/useAddColaboradorForm";

interface AddColaboradorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColaboradorAdded?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colaboradorData?: any;
  isEditMode?: boolean;
  onColaboradorUpdated?: () => void;
  showOnlyPersonalInfo?: boolean;
}

export const AddColaboradorSheet = ({
  open,
  onOpenChange,
  onColaboradorAdded,
  colaboradorData,
  isEditMode = false,
  onColaboradorUpdated,
  showOnlyPersonalInfo = false,
}: AddColaboradorSheetProps) => {
  const {
    formData,
    setFormData,
    jobs,
    managers,
    selectedDepartment,
    setSelectedDepartment,
    selectedDepartments,
    setSelectedDepartments,
    activeTab,
    setActiveTab,
    handlePaisMovilChange,
    handlePaisFijoChange,
    handleCodigoPaisMovilEmergenciaChange,
    handleCodigoPaisFijoEmergenciaChange,
    handleSubmit,
    handleOpenChange,
    handleDepartmentSelectCreate,
    handleDepartmentSelectEdit,
    organizations,
    departments,
    currentOrganizationName,
  } = useAddColaboradorForm({
    open,
    isEditMode,
    colaboradorData,
    onOpenChange,
    onColaboradorAdded,
    onColaboradorUpdated,
  });

  // Alias for backwards-compatible JSX references
  const countryToPhoneCode = COUNTRY_PHONE_CODES;
  const tiposContrato = TIPOS_CONTRATO;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-semibold">
            {(isEditMode || showOnlyPersonalInfo) ? "Información Personal" : "Añadir nuevo colaborador"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {(isEditMode || showOnlyPersonalInfo)
              ? "Formulario para editar información personal del colaborador"
              : "Formulario para añadir un nuevo colaborador al sistema"}
          </SheetDescription>
        </SheetHeader>

        {isEditMode ? (
          // Versión con tabs para editar información
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="datos-personales">Datos de turno</TabsTrigger>
              <TabsTrigger value="contacto">Contacto y HR</TabsTrigger>
              <TabsTrigger value="salud">Salud</TabsTrigger>
            </TabsList>
            <p className="text-[10px] text-muted-foreground -mt-4 px-1">Solo la pestaña "Datos de turno" es necesaria para la planificación de turnos</p>

            <TabsContent value="datos-personales" className="space-y-4">
              {/* Contenido de Datos Personales */}
              <FormField label="Nombre" required>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Introduce el nombre"
                />
              </FormField>

              <FormField label="Apellidos" required>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Introduce los apellidos"
                />
              </FormField>

              <FormField label="Nombre a mostrar" required>
                <Input
                  value={formData.apellidosUso}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidosUso: e.target.value }))}
                  placeholder="Nombre que aparecerá en los turnos"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre que aparecerá en el turno (se completa automáticamente con Nombre + Apellidos)
                </p>
              </FormField>

              <FormField label="ID de colaborador interno">
                <Input
                  value={formData.empleadoId}
                  placeholder="ID generado automáticamente"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID único generado automáticamente por el sistema
                </p>
              </FormField>

              <FormField label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>

              {/* Campos adicionales solo en modo edición */}
              {isEditMode && (
                <>
                  <FormField label="Género">
                    <Select value={formData.genero} onValueChange={(value) => setFormData(prev => ({ ...prev, genero: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                        <SelectItem value="no-especificar">Prefiero no especificar</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Apellidos de nacimiento">
                    <Input
                      value={formData.apellidosNacimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellidosNacimiento: e.target.value }))}
                      placeholder="Apellidos de nacimiento"
                    />
                  </FormField>

                  <FormField label="Nacionalidad">
                    <Select value={formData.nacionalidad} onValueChange={(value) => setFormData(prev => ({ ...prev, nacionalidad: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="española">Española</SelectItem>
                        <SelectItem value="alemana">Alemana</SelectItem>
                        <SelectItem value="francesa">Francesa</SelectItem>
                        <SelectItem value="italiana">Italiana</SelectItem>
                        <SelectItem value="británica">Británica</SelectItem>
                        <SelectItem value="otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="País de nacimiento">
                    <Select value={formData.pais} onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alemania" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="España">🇪🇸 España</SelectItem>
                        <SelectItem value="Alemania">🇩🇪 Alemania</SelectItem>
                        <SelectItem value="Francia">🇫🇷 Francia</SelectItem>
                        <SelectItem value="Italia">🇮🇹 Italia</SelectItem>
                        <SelectItem value="Reino Unido">🇬🇧 Reino Unido</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Provincia">
                    <Select value={formData.provincia} onValueChange={(value) => setFormData(prev => ({ ...prev, provincia: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="99 - Extranjero" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="99 - Extranjero">99 - Extranjero</SelectItem>
                        <SelectItem value="28 - Madrid">28 - Madrid</SelectItem>
                        <SelectItem value="08 - Barcelona">08 - Barcelona</SelectItem>
                        <SelectItem value="35 - Las Palmas">35 - Las Palmas</SelectItem>
                        <SelectItem value="38 - Santa Cruz de Tenerife">38 - Santa Cruz de Tenerife</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Ciudad de nacimiento">
                    <Input
                      value={formData.ciudadNacimiento}
                      onChange={(e) => setFormData(prev => ({ ...prev, ciudadNacimiento: e.target.value }))}
                      placeholder="Ciudad"
                    />
                  </FormField>

                  <FormField label="Estado civil">
                    <Select value={formData.estadoCivil} onValueChange={(value) => setFormData(prev => ({ ...prev, estadoCivil: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Soltero/a" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                        <SelectItem value="pareja-de-hecho">Pareja de hecho</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Número de personas dependientes">
                    <Input
                      type="number"
                      value={formData.numeroPersonasDependientes}
                      onChange={(e) => setFormData(prev => ({ ...prev, numeroPersonasDependientes: e.target.value }))}
                      placeholder="0"
                      min="0"
                    />
                  </FormField>

                  <FormField label="Fecha de antigüedad">
                    <Input
                      type="date"
                      value={formData.fechaAntiguedad}
                      onChange={(e) => setFormData(prev => ({ ...prev, fechaAntiguedad: e.target.value }))}
                    />
                  </FormField>
                </>
              )}

              {/* Información de Contacto en la misma pestaña */}
              <div className="pt-4 border-t border-border/20">
                <h4 className="text-md font-medium text-foreground mb-4">Información de Contacto</h4>

                <div className="space-y-4">
                  <FormField label="Correo electrónico" required>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@hotel.com"
                    />
                  </FormField>

                  <FormField label="Teléfono móvil">
                    <div className="flex gap-2">
                      <Select value={formData.paisMovil} onValueChange={handlePaisMovilChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES">🇪🇸 +34</SelectItem>
                          <SelectItem value="FR">🇫🇷 +33</SelectItem>
                          <SelectItem value="DE">🇩🇪 +49</SelectItem>
                          <SelectItem value="IT">🇮🇹 +39</SelectItem>
                          <SelectItem value="GB">🇬🇧 +44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={formData.telefonoMovil}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                        placeholder={`${countryToPhoneCode[formData.paisMovil]} 628 123 456`}
                      />
                    </div>
                  </FormField>

                  <FormField label="Teléfono fijo (opcional)">
                    <div className="flex gap-2">
                      <Select value={formData.paisFijo} onValueChange={handlePaisFijoChange}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES">🇪🇸 +34</SelectItem>
                          <SelectItem value="FR">🇫🇷 +33</SelectItem>
                          <SelectItem value="DE">🇩🇪 +49</SelectItem>
                          <SelectItem value="IT">🇮🇹 +39</SelectItem>
                          <SelectItem value="GB">🇬🇧 +44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={formData.telefonoFijo}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                        placeholder={`${countryToPhoneCode[formData.paisFijo]} 928 123 456`}
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Información de Contrato en la misma pestaña */}
              <div className="pt-4 border-t border-border/20">
                <h4 className="text-md font-medium text-foreground mb-4">Información de Contrato</h4>

                <div className="space-y-4">
                   <FormField label="Fecha de inicio de contrato" required>
                     <Input
                       type="date"
                       value={formData.fechaInicioContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, fechaInicioContrato: e.target.value }))}
                       placeholder="dd/mm/aaaa"
                     />
                   </FormField>

                   <FormField label="Hora de inicio de contrato" required>
                     <Input
                       type="time"
                       value={formData.horaInicioContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, horaInicioContrato: e.target.value }))}
                       placeholder="09:00"
                     />
                   </FormField>

                    <FormField label="Tipo de contrato" required>
                      <Select
                        value={formData.tipoContrato}
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            tipoContrato: value,
                            fechaFinContrato: value === "Contrato indefinido" ? "" : prev.fechaFinContrato
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposContrato.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                       </SelectContent>
                     </Select>
                   </FormField>

                   <FormField
                     label="Fecha de fin del contrato"
                     required={formData.tipoContrato !== "Contrato indefinido"}
                   >
                     <Input
                       type="date"
                       value={formData.fechaFinContrato}
                       onChange={(e) => setFormData(prev => ({ ...prev, fechaFinContrato: e.target.value }))}
                       placeholder="dd/mm/aaaa"
                       disabled={formData.tipoContrato === "Contrato indefinido"}
                       className={formData.tipoContrato === "Contrato indefinido" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                     />
                     {formData.tipoContrato === "Contrato indefinido" && (
                       <p className="text-xs text-muted-foreground mt-1">
                         No requerido para contratos indefinidos
                       </p>
                     )}
                   </FormField>

                 {/* ASIGNACIÓN DE EQUIPOS */}
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                     ASIGNACIÓN DE EQUIPOS
                   </h3>

                    <FormField label="Equipo" required={true}>
                     <div className="space-y-3">
                       <div data-department-select>
                         <Select
                           value=""
                           onValueChange={handleDepartmentSelectEdit}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Seleccionar equipo" />
                           </SelectTrigger>
                           <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                             {departments
                               .filter(dept => !selectedDepartments.find(sd => sd.id === dept.id))
                               .map((dept) => (
                                 <SelectItem key={dept.id} value={dept.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                   {dept.value}
                                 </SelectItem>
                               ))}
                           </SelectContent>
                         </Select>
                       </div>

                       {selectedDepartments.length > 0 && (
                         <div className="flex flex-wrap gap-2">
                           {selectedDepartments.map((dept) => (
                             <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
                               {dept.name}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDepartments(prev => prev.filter(d => d.id !== dept.id));
                                    setFormData(prev => ({ ...prev, jobId: "" }));
                                  }}
                                />
                              </Badge>
                           ))}
                         </div>
                       )}

                       {departments.length === 0 && (
                         <p className="text-sm text-muted-foreground">
                           No hay equipos creados. Crea equipos en Configuración → Puestos → Equipos
                         </p>
                       )}
                     </div>
                   </FormField>

                   {/* Selección de puesto de trabajo */}
                   {selectedDepartments.length > 0 && (
                     <FormField label="Puesto de trabajo" required={false}>
                       <Select value={formData.jobId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value }))}>
                         <SelectTrigger>
                           <SelectValue placeholder="Seleccionar puesto de trabajo" />
                         </SelectTrigger>
                         <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                           {jobs
                             .filter(job => selectedDepartments.some(dept => dept.id === job.department_id))
                             .map((job) => (
                               <SelectItem key={job.id} value={job.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                 {job.title}
                               </SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </FormField>
                    )}

                    {/* AFILIACIÓN */}
                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                        AFILIACIÓN
                      </h3>

                      <FormField label="Establecimiento por defecto" required>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {colaboradorData?.org_id
                              ? (organizations.find(org => org.id === colaboradorData.org_id)?.name || 'Organización no encontrada')
                              : (currentOrganizationName || 'Organización actual')
                            }
                          </span>
                        </div>
                      </FormField>

                      <FormField label="Tiempo de trabajo semanal (en horas)" required>
                        <Input
                          type="number"
                          value={formData.tiempoTrabajoSemanal}
                          onChange={(e) => setFormData(prev => ({ ...prev, tiempoTrabajoSemanal: e.target.value }))}
                          placeholder="Introducir número de horas"
                          min="1"
                          max="48"
                        />
                      </FormField>

                      <FormField label="">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-foreground">
                              Rol en el motor de turnos
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Define cómo participa este colaborador en la generación automática de turnos SMART</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select value={formData.engineRole} onValueChange={(value) => setFormData(prev => ({ ...prev, engineRole: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo de rotación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ROTA_COMPLETO">Rotación completa (M/T/N)</SelectItem>
                              <SelectItem value="ROTA_PARCIAL">Rotación parcial (solo ciertos turnos)</SelectItem>
                              <SelectItem value="FIJO_NO_ROTA">Turno fijo (no rota)</SelectItem>
                              <SelectItem value="COBERTURA">Cobertura (cubre ausencias)</SelectItem>
                              <SelectItem value="FOM">FOM (Front Office Manager)</SelectItem>
                              <SelectItem value="AFOM">AFOM (Asistente FOM)</SelectItem>
                              <SelectItem value="NIGHT_SHIFT_AGENT">Agente nocturno fijo</SelectItem>
                              <SelectItem value="GEX">GEX (Guest Experience)</SelectItem>
                              <SelectItem value="FRONT_DESK_AGENT">Agente de recepción</SelectItem>
                              <SelectItem value="CUSTOM">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {formData.engineRole === 'ROTA_COMPLETO' && 'Rota entre todos los turnos (M/T/N) ~5 días/semana'}
                            {formData.engineRole === 'ROTA_PARCIAL' && 'Solo rota en turnos específicos (ej: 9x17, 12x20)'}
                            {formData.engineRole === 'FIJO_NO_ROTA' && 'Siempre trabaja el mismo turno, no entra en rotación'}
                            {formData.engineRole === 'COBERTURA' && 'Cubre ausencias y huecos de otros colaboradores'}
                            {formData.engineRole === 'FOM' && 'Turno fijo M (L-V), guardias S/D, no rota'}
                            {formData.engineRole === 'AFOM' && 'Espejo del FOM: cubre cuando FOM libra'}
                            {formData.engineRole === 'NIGHT_SHIFT_AGENT' && 'Noche fija permanente, sus libres los cubren otros'}
                            {formData.engineRole === 'GEX' && 'Solo turnos GEX (9x17/12x20) según ocupación'}
                            {formData.engineRole === 'FRONT_DESK_AGENT' && 'Rotación completa M/T/N, cubre noches del nocturno'}
                            {formData.engineRole === 'CUSTOM' && 'Configuración personalizada de turnos'}
                          </p>
                        </div>
                      </FormField>

                      <FormField label="">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium text-foreground">
                              Responsable directo
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">El responsable directo seleccionado, recibirá notificaciones de las solicitudes de ausencia de este colaborador</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Select value={formData.responsableDirecto} onValueChange={(value) => setFormData(prev => ({ ...prev, responsableDirecto: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar el responsable directo" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.length === 0 ? (
                                <SelectItem value="_none" disabled>No hay managers disponibles</SelectItem>
                              ) : (
                                managers.map((manager) => (
                                  <SelectItem key={manager.id} value={manager.id}>
                                    {manager.apellidos}, {manager.nombre} - {manager.role === 'manager' ? 'Manager' : manager.role === 'director' ? 'Director' : manager.role === 'administrador' ? 'Admin' : 'Owner'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormField>
                    </div>
                  </div>

                    <FormField label="">
                    </FormField>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contacto" className="space-y-4">
              {/* CONTACTO */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">CONTACTO</h4>

                <FormField label="Correo electrónico">
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Teléfono móvil">
                  <div className="flex gap-2">
                    <Select value={formData.paisMovil} onValueChange={(value) => setFormData(prev => ({ ...prev, paisMovil: value }))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">🇪🇸</SelectItem>
                        <SelectItem value="FR">🇫🇷</SelectItem>
                        <SelectItem value="DE">🇩🇪</SelectItem>
                        <SelectItem value="IT">🇮🇹</SelectItem>
                        <SelectItem value="GB">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoMovil}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                      placeholder="+44"
                    />
                  </div>
                </FormField>

                <FormField label="Teléfono fijo">
                  <div className="flex gap-2">
                    <Select value={formData.paisFijo} onValueChange={(value) => setFormData(prev => ({ ...prev, paisFijo: value }))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">🇪🇸</SelectItem>
                        <SelectItem value="FR">🇫🇷</SelectItem>
                        <SelectItem value="DE">🇩🇪</SelectItem>
                        <SelectItem value="IT">🇮🇹</SelectItem>
                        <SelectItem value="GB">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoFijo}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                      placeholder="+44"
                    />
                  </div>
                </FormField>

                <FormField label="Dirección">
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Complemento de dirección">
                  <Input
                    value={formData.complementoDireccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, complementoDireccion: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Código postal" className="relative">
                  <Input
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                    placeholder="OPAE (solo FR)"
                    className="pr-20"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                    OPAE (solo FR)
                  </span>
                </FormField>

                <FormField label="Ciudad">
                  <Input
                    value={formData.ciudad}
                    onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="País">
                  <Select value={formData.pais} onValueChange={(value) => setFormData(prev => ({ ...prev, pais: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="España">España</SelectItem>
                      <SelectItem value="Francia">Francia</SelectItem>
                      <SelectItem value="Alemania">Alemania</SelectItem>
                      <SelectItem value="Italia">Italia</SelectItem>
                      <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Marruecos">Marruecos</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Venezuela">Venezuela</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              {/* INFORMACIÓN BANCARIA */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">INFORMACIÓN BANCARIA</h4>

                <FormField label="Nombre del titular de la cuenta">
                  <Input
                    value={formData.nombreTitularCuenta}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreTitularCuenta: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="IBAN">
                  <Input
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="BIC">
                  <Input
                    value={formData.bic}
                    onChange={(e) => setFormData(prev => ({ ...prev, bic: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Número de identificación empleado(a)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Número de identificación interna</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary underline"
                      onClick={() => {
                        const autoNumber = Math.floor(Math.random() * 1000000000).toString();
                        setFormData(prev => ({ ...prev, numeroIdentificacionInterna: autoNumber }));
                      }}
                    >
                      Cambiar a generación automática
                    </Button>
                  </div>
                  <Input
                    value={formData.numeroIdentificacionInterna}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroIdentificacionInterna: e.target.value }))}
                    placeholder="1234567890"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="salud" className="space-y-4">
              {/* SEGURIDAD SOCIAL */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">SEGURIDAD SOCIAL</h4>

                <FormField label="Nº de seguridad social">
                  <Input
                    value={formData.numeroSeguridadSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroSeguridadSocial: e.target.value }))}
                    placeholder="XXXX XXXX XXXX"
                  />
                </FormField>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    Persona con discapacidad
                  </Label>
                  <Switch
                    checked={formData.personaConDiscapacidad}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, personaConDiscapacidad: checked }))}
                  />
                </div>
              </div>

              {/* EXAMEN MÉDICO */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">EXAMEN MÉDICO</h4>

                <FormField label="Última revisión médica realizada">
                  <Input
                    type="date"
                    value={formData.ultimaRevisionMedica}
                    onChange={(e) => setFormData(prev => ({ ...prev, ultimaRevisionMedica: e.target.value }))}
                    placeholder="dd/mm/aaaa"
                  />
                </FormField>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reconocimiento-medico"
                    checked={formData.reconocimientoMedicoReforzado}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, reconocimientoMedicoReforzado: checked as boolean }))}
                  />
                  <Label
                    htmlFor="reconocimiento-medico"
                    className="text-sm text-foreground cursor-pointer"
                  >
                    Reconocimiento médico reforzado
                  </Label>
                </div>

                {/* Próxima cita médica */}
                {formData.ultimaRevisionMedica && (
                  <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-700">
                      Próxima cita médica antes del {(() => {
                        const lastReview = new Date(formData.ultimaRevisionMedica);
                        const yearsToAdd = formData.reconocimientoMedicoReforzado ? 3 : 5;
                        const nextAppointment = new Date(lastReview);
                        nextAppointment.setFullYear(lastReview.getFullYear() + yearsToAdd);
                        return nextAppointment.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      })()}
                    </span>
                  </div>
                )}
              </div>

              {/* MUTUALIDAD */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">MUTUALIDAD</h4>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">
                    El empleado está exento de seguro médico
                  </Label>
                  <Switch
                    checked={formData.exentoSeguroMedico}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, exentoSeguroMedico: checked }))}
                  />
                </div>
              </div>

              {/* PERSONA DE CONTACTO EN CASO DE EMERGENCIA */}
              <div className="space-y-4 pt-6">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">PERSONA DE CONTACTO EN CASO DE EMERGENCIA</h4>

                <FormField label="Nombre del contacto de emergencia">
                  <Input
                    value={formData.nombreContactoEmergencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreContactoEmergencia: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Apellido del contacto de emergencia">
                  <Input
                    value={formData.apellidoContactoEmergencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, apellidoContactoEmergencia: e.target.value }))}
                    placeholder=""
                  />
                </FormField>

                <FormField label="Relación con el contacto de emergencia">
                  <Select value={formData.relacionContactoEmergencia} onValueChange={(value) => setFormData(prev => ({ ...prev, relacionContactoEmergencia: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="padre">Padre</SelectItem>
                      <SelectItem value="madre">Madre</SelectItem>
                      <SelectItem value="hermano">Hermano/a</SelectItem>
                      <SelectItem value="conyugue">Cónyuge</SelectItem>
                      <SelectItem value="pareja">Pareja</SelectItem>
                      <SelectItem value="hijo">Hijo/a</SelectItem>
                      <SelectItem value="abuelo">Abuelo/a</SelectItem>
                      <SelectItem value="tio">Tío/a</SelectItem>
                      <SelectItem value="primo">Primo/a</SelectItem>
                      <SelectItem value="amigo">Amigo/a</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Teléfono móvil del contacto de emergencia">
                  <div className="flex gap-2">
                    <Select value={formData.codigoPaisMovilEmergencia} onValueChange={handleCodigoPaisMovilEmergenciaChange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+34">🇪🇸</SelectItem>
                        <SelectItem value="+33">🇫🇷</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                        <SelectItem value="+39">🇮🇹</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoMovilEmergencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovilEmergencia: e.target.value }))}
                      placeholder={formData.codigoPaisMovilEmergencia}
                    />
                  </div>
                </FormField>

                <FormField label="Teléfono fijo del contacto de emergencia">
                  <div className="flex gap-2">
                    <Select value={formData.codigoPaisFijoEmergencia} onValueChange={handleCodigoPaisFijoEmergenciaChange}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+34">🇪🇸</SelectItem>
                        <SelectItem value="+33">🇫🇷</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                        <SelectItem value="+39">🇮🇹</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="flex-1"
                      value={formData.telefonoFijoEmergencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijoEmergencia: e.target.value }))}
                      placeholder={formData.codigoPaisFijoEmergencia}
                    />
                  </div>
                </FormField>
              </div>
            </TabsContent>

            {/* Button para versión con tabs */}
            <div className="pt-6 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Actualizar
              </Button>
            </div>
          </Tabs>
        ) : (
          // Versión lineal para añadir nuevo colaborador
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              {!showOnlyPersonalInfo && (
                <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                  Información Personal
                </h3>
              )}

              <FormField label="Nombre" required>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Introduce el nombre"
                />
              </FormField>

              <FormField label="Apellidos" required>
                <Input
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  placeholder="Introduce los apellidos"
                />
              </FormField>

              <FormField label="Nombre a mostrar" required>
                <Input
                  value={formData.apellidosUso}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidosUso: e.target.value }))}
                  placeholder="Nombre que aparecerá en los turnos"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre que aparecerá en el turno (se completa automáticamente con Nombre + Apellidos)
                </p>
              </FormField>

              <FormField label="ID de colaborador interno">
                <Input
                  value={formData.empleadoId}
                  placeholder="ID generado automáticamente"
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID único generado automáticamente por el sistema
                </p>
              </FormField>

              <FormField label="Fecha de nacimiento">
                <Input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                Información de Contacto
              </h3>

              <FormField label="Correo electrónico" required>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@hotel.com"
                />
              </FormField>

              <FormField label="Teléfono móvil">
                <div className="flex gap-2">
                  <Select value={formData.paisMovil} onValueChange={(value) => setFormData(prev => ({ ...prev, paisMovil: value }))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ES">🇪🇸 +34</SelectItem>
                      <SelectItem value="FR">🇫🇷 +33</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="IT">🇮🇹 +39</SelectItem>
                      <SelectItem value="GB">🇬🇧 +44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    value={formData.telefonoMovil}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefonoMovil: e.target.value }))}
                    placeholder="628 123 456"
                  />
                </div>
              </FormField>

              <FormField label="Teléfono fijo (opcional)">
                <div className="flex gap-2">
                  <Select value={formData.paisFijo} onValueChange={(value) => setFormData(prev => ({ ...prev, paisFijo: value }))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ES">🇪🇸 +34</SelectItem>
                      <SelectItem value="FR">🇫🇷 +33</SelectItem>
                      <SelectItem value="DE">🇩🇪 +49</SelectItem>
                      <SelectItem value="IT">🇮🇹 +39</SelectItem>
                      <SelectItem value="GB">🇬🇧 +44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1"
                    value={formData.telefonoFijo}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefonoFijo: e.target.value }))}
                    placeholder="928 123 456"
                  />
                </div>
              </FormField>
            </div>

            {/* Información de Contrato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                Información de Contrato
              </h3>

              <FormField label="Fecha de inicio de contrato" required>
                <Input
                  type="date"
                  value={formData.fechaInicioContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaInicioContrato: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>

              <FormField label="Hora de inicio de contrato" required>
                <Input
                  type="time"
                  value={formData.horaInicioContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, horaInicioContrato: e.target.value }))}
                  placeholder="09:00"
                />
              </FormField>

               <FormField label="Tipo de contrato" required>
                 <Select
                   value={formData.tipoContrato}
                   onValueChange={(value) => {
                     setFormData(prev => ({
                       ...prev,
                       tipoContrato: value,
                       fechaFinContrato: value === "Contrato indefinido" ? "" : prev.fechaFinContrato
                     }));
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Selecciona el tipo de contrato" />
                   </SelectTrigger>
                   <SelectContent>
                     {tiposContrato.map((tipo) => (
                       <SelectItem key={tipo} value={tipo}>
                         {tipo}
                       </SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Fecha de fin del contrato"
                required={formData.tipoContrato !== "Contrato indefinido"}
              >
                <Input
                  type="date"
                  value={formData.fechaFinContrato}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaFinContrato: e.target.value }))}
                  placeholder="dd/mm/aaaa"
                  disabled={formData.tipoContrato === "Contrato indefinido"}
                  className={formData.tipoContrato === "Contrato indefinido" ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                />
                {formData.tipoContrato === "Contrato indefinido" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No requerido para contratos indefinidos
                  </p>
                )}
              </FormField>

               {/* ASIGNACIÓN DE EQUIPOS */}
               <div className="space-y-4">
                 <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                   ASIGNACIÓN DE EQUIPOS
                 </h3>

                 <FormField label="Equipo" required={true}>
                    <div className="space-y-3">
                       <Select value={selectedDepartment} data-department-select onValueChange={handleDepartmentSelectCreate}>
                       <SelectTrigger>
                         <SelectValue placeholder="Seleccionar equipo..." />
                       </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                          {departments.filter(dept => !selectedDepartments.some(selected => selected.id === dept.id)).map((dept) => (
                            <SelectItem key={dept.id} value={dept.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                              {dept.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                     </Select>

                     {/* Mostrar equipos seleccionados como badges */}
                     {selectedDepartments.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                         {selectedDepartments.map((dept) => (
                           <Badge key={dept.id} variant="secondary" className="flex items-center gap-1">
                             {dept.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDepartments(prev => prev.filter(d => d.id !== dept.id));
                                  setFormData(prev => ({ ...prev, jobId: "" }));
                                }}
                             />
                           </Badge>
                         ))}
                       </div>
                     )}

                     {departments.length === 0 && (
                       <p className="text-sm text-muted-foreground">
                         No hay equipos creados. Crea equipos en Configuración → Puestos → Equipos
                       </p>
                     )}
                    </div>
                  </FormField>

                  {/* Selección de puesto de trabajo */}
                  {selectedDepartments.length > 0 && (
                    <FormField label="Puesto de trabajo" required={false}>
                      <Select value={formData.jobId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar puesto de trabajo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[100]">
                          {jobs
                            .filter(job => selectedDepartments.some(dept => dept.id === job.department_id))
                            .map((job) => (
                              <SelectItem key={job.id} value={job.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                {job.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}

                  {/* AFILIACIÓN */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-medium text-foreground border-b border-border/40 pb-2">
                      AFILIACIÓN
                    </h3>

                    <FormField label="Establecimiento por defecto" required>
                      <div className="p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          {colaboradorData?.org_id
                            ? (organizations.find(org => org.id === colaboradorData.org_id)?.name || 'Organización no encontrada')
                            : (currentOrganizationName || 'Organización actual')
                          }
                        </span>
                      </div>
                    </FormField>

                    <FormField label="Tiempo de trabajo semanal (en horas)" required>
                      <Input
                        type="number"
                        value={formData.tiempoTrabajoSemanal}
                        onChange={(e) => setFormData(prev => ({ ...prev, tiempoTrabajoSemanal: e.target.value }))}
                        placeholder="Introducir número de horas"
                        min="1"
                        max="48"
                      />
                    </FormField>

                    <FormField label="">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-foreground">
                            Rol en el motor de turnos
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Define cómo participa este colaborador en la generación automática de turnos SMART</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={formData.engineRole} onValueChange={(value) => setFormData(prev => ({ ...prev, engineRole: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo de rotación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ROTA_COMPLETO">Rotación completa (M/T/N)</SelectItem>
                            <SelectItem value="ROTA_PARCIAL">Rotación parcial (solo ciertos turnos)</SelectItem>
                            <SelectItem value="FIJO_NO_ROTA">Turno fijo (no rota)</SelectItem>
                            <SelectItem value="COBERTURA">Cobertura (cubre ausencias)</SelectItem>
                            <SelectItem value="FOM">FOM (Front Office Manager)</SelectItem>
                            <SelectItem value="AFOM">AFOM (Asistente FOM)</SelectItem>
                            <SelectItem value="NIGHT_SHIFT_AGENT">Agente nocturno fijo</SelectItem>
                            <SelectItem value="GEX">GEX (Guest Experience)</SelectItem>
                            <SelectItem value="FRONT_DESK_AGENT">Agente de recepción</SelectItem>
                            <SelectItem value="CUSTOM">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {formData.engineRole === 'ROTA_COMPLETO' && 'Rota entre todos los turnos (M/T/N) ~5 días/semana'}
                          {formData.engineRole === 'ROTA_PARCIAL' && 'Solo rota en turnos específicos (ej: 9x17, 12x20)'}
                          {formData.engineRole === 'FIJO_NO_ROTA' && 'Siempre trabaja el mismo turno, no entra en rotación'}
                          {formData.engineRole === 'COBERTURA' && 'Cubre ausencias y huecos de otros colaboradores'}
                          {formData.engineRole === 'FOM' && 'Turno fijo M (L-V), guardias S/D, no rota'}
                          {formData.engineRole === 'AFOM' && 'Espejo del FOM: cubre cuando FOM libra'}
                          {formData.engineRole === 'NIGHT_SHIFT_AGENT' && 'Noche fija permanente, sus libres los cubren otros'}
                          {formData.engineRole === 'GEX' && 'Solo turnos GEX (9x17/12x20) según ocupación'}
                          {formData.engineRole === 'FRONT_DESK_AGENT' && 'Rotación completa M/T/N, cubre noches del nocturno'}
                          {formData.engineRole === 'CUSTOM' && 'Configuración personalizada de turnos'}
                        </p>
                      </div>
                    </FormField>

                    <FormField label="">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium text-foreground">
                            Responsable directo
                          </Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">El responsable directo seleccionado, recibirá notificaciones de las solicitudes de ausencia de este colaborador</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={formData.responsableDirecto} onValueChange={(value) => setFormData(prev => ({ ...prev, responsableDirecto: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar el responsable directo" />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.length === 0 ? (
                              <SelectItem value="_none" disabled>No hay managers disponibles</SelectItem>
                            ) : (
                              managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id}>
                                  {manager.apellidos}, {manager.nombre} - {manager.role === 'manager' ? 'Manager' : manager.role === 'director' ? 'Director' : manager.role === 'administrador' ? 'Admin' : 'Owner'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormField>
                  </div>
                </div>
            </div>

            {/* Button para versión lineal */}
            <div className="pt-6 border-t border-border/40">
              <Button
                onClick={handleSubmit}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Guardar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
