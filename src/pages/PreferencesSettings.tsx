import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminSettingsRoute from "@/components/AdminSettingsRoute";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

export default function PreferencesSettings() {
  // Preferencias - Rotas
  const [defaultWeeklyView, setDefaultWeeklyView] = useState(true);
  const [payingSundays, setPayingSundays] = useState(true);
  const [employeesCanModifyMeals, setEmployeesCanModifyMeals] = useState(false);
  const [employeesCanSeeHours, setEmployeesCanSeeHours] = useState(true);
  const [employeesCanSeeTeamPlanning, setEmployeesCanSeeTeamPlanning] = useState(true);
  const [hideCommentsFromEmployees, setHideCommentsFromEmployees] = useState(true);
  const [rotaStartTime, setRotaStartTime] = useState("15:00");
  
  // Preferencias - Derechos
  const [employeesCanEditPersonalInfo, setEmployeesCanEditPersonalInfo] = useState(true);
  const [employeesCanSeeAttendance, setEmployeesCanSeeAttendance] = useState(false);
  const [employeesCanSeeContacts, setEmployeesCanSeeContacts] = useState(true);
  const [managersCanPlanDirectly, setManagersCanPlanDirectly] = useState(true);
  const [allowCrossEstablishments, setAllowCrossEstablishments] = useState(false);
  const [authorizeDashboardAccess, setAuthorizeDashboardAccess] = useState(false);
  const [vacationReadOnlyAccess, setVacationReadOnlyAccess] = useState(false);
  
  // Preferencias - General
  const [currency, setCurrency] = useState("Euro");
  const [probationPeriod, setProbationPeriod] = useState("30");
  const [allowDirectDeclaration, setAllowDirectDeclaration] = useState(true);
  const [generateDocuments, setGenerateDocuments] = useState(true);
  const [phantomMode, setPhantomMode] = useState(true);
  
  const { permissions } = useAdminPermissions();

  useEffect(() => {
    document.title = "Preferencias | TurnoSmart";
  }, []);

  const handleSave = () => {
    if (!permissions.canEdit) {
      toast.error("No tienes permisos para editar estas preferencias");
      return;
    }
    toast.success("Configuración guardada correctamente");
  };

  // Generar opciones de tiempo de 15:00 a 00:00 en intervalos de 15 minutos
  const generateTimeOptions = () => {
    const times = ["Introducir manualmente"];
    for (let hour = 15; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    times.push("00:00");
    return times;
  };

  const timeOptions = generateTimeOptions();

  const currencies = [
    "Euro", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RUB", "BRL", "MXN", "KRW", "SGD", "HKD"
  ];

  return (
    <AdminSettingsRoute allowView={true}>
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Preferencias</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Rotas */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Rotas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Por defecto visualizar una semana por turno</label>
              <Switch 
                checked={defaultWeeklyView} 
                onCheckedChange={setDefaultWeeklyView}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Se pagan los domingos</label>
              <Switch 
                checked={payingSundays} 
                onCheckedChange={setPayingSundays}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Los empleados no pueden modificar sus comidas</label>
              <Switch 
                checked={employeesCanModifyMeals} 
                onCheckedChange={setEmployeesCanModifyMeals}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Los empleados pueden ver el total de horas planificadas y horas netas de la semana (contractuales)</label>
              <Switch 
                checked={employeesCanSeeHours} 
                onCheckedChange={setEmployeesCanSeeHours}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Los empleados pueden ver el planning de los otros miembros de su equipo</label>
              <Switch 
                checked={employeesCanSeeTeamPlanning} 
                onCheckedChange={setEmployeesCanSeeTeamPlanning}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Ocultar los comentarios de hoy/si empleados con capacidad de días trabajados en el planning</label>
                <p className="text-xs text-gray-500">Los directivos planning-pueden-cambiar-estados</p>
              </div>
              <Switch 
                checked={hideCommentsFromEmployees} 
                onCheckedChange={setHideCommentsFromEmployees}
                className="data-[state=checked]:bg-teal-600"
                disabled={!permissions.canEdit}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Las horas de la Rota empiezan a las</label>
              <Select value={rotaStartTime} onValueChange={setRotaStartTime} disabled={!permissions.canEdit}>
                <SelectTrigger className="w-48 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleSave}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md px-4 py-2 text-sm font-medium"
                variant="secondary"
                disabled={!permissions.canEdit}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>

        {/* Derechos */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Derechos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Los empleados pueden editar su información personal</label>
                <span className="text-xs text-blue-600 ml-2">Nuevo</span>
              </div>
              <Switch 
                checked={employeesCanEditPersonalInfo} 
                onCheckedChange={setEmployeesCanEditPersonalInfo}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Los empleados pueden ver su hoja de asistencias en su perfil</label>
              <Switch 
                checked={employeesCanSeeAttendance} 
                onCheckedChange={setEmployeesCanSeeAttendance}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Los empleados pueden ver los números de teléfono y correos electrónicos de los otros empleados</label>
              <Switch 
                checked={employeesCanSeeContacts} 
                onCheckedChange={setEmployeesCanSeeContacts}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Los empleados creados por un directivo pueden planificarse directamente</label>
                <p className="text-xs text-gray-500">Empleados que se tienen registrado de no poder autoasignarse empleados desde su perfil</p>
              </div>
              <Switch 
                checked={managersCanPlanDirectly} 
                onCheckedChange={setManagersCanPlanDirectly}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Permitir a los directivos que sus empleados estén disponibles en otros establecimientos</label>
              <Switch 
                checked={allowCrossEstablishments} 
                onCheckedChange={setAllowCrossEstablishments}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Autorizar los directivos para que accedan al Dashboard SHG-FR</label>
              <Switch 
                checked={authorizeDashboardAccess} 
                onCheckedChange={setAuthorizeDashboardAccess}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Proporcionar acceso de solo lectura a la página "Contador de vacaciones" en el panel de RRHH</label>
                <p className="text-xs text-gray-500">Acceso a verificar el calendario de cada página para activado desde su perfil</p>
                <p className="text-xs text-gray-700 mt-1">A los directivos</p>
                <p className="text-xs text-gray-700">A los managers</p>
              </div>
              <Switch 
                checked={vacationReadOnlyAccess} 
                onCheckedChange={setVacationReadOnlyAccess}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleSave}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md px-4 py-2 text-sm font-medium"
                variant="secondary"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>

        {/* General */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Convertir las monedas a</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Período de prueba para las solicitudes de ausencia (días)</label>
              <Input 
                type="number" 
                value={probationPeriod} 
                onChange={(e) => setProbationPeriod(e.target.value)}
                className="w-20 h-8 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Dar la posibilidad declarar o apagar directamente en Centro sobre FR)</label>
              <Switch 
                checked={allowDirectDeclaration} 
                onCheckedChange={setAllowDirectDeclaration}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Crear y generar plantillas de documentos (contratos de trabajo, cláusulas adicionales, etc.)</label>
              <Switch 
                checked={generateDocuments} 
                onCheckedChange={setGenerateDocuments}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Activar la modalidad fantasma</label>
              <Switch 
                checked={phantomMode} 
                onCheckedChange={setPhantomMode}
                className="data-[state=checked]:bg-teal-600"
              />
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleSave}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md px-4 py-2 text-sm font-medium"
                variant="secondary"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminSettingsRoute>
  );
}