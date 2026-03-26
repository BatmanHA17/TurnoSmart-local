// Diccionario en español para la sección Entradas
// Textos extraídos exactamente del tutorial Scribe
export const esStrings = {
  // Título de la sección
  entradas: "Entradas",
  salidas: "Salidas",
  finPeriodoPrueba: "Fin de período de prueba",
  
  // Filtros
  todosLosEstablecimientos: "Todos los establecimientos",
  todosLosEquipos: "Todos los equipos",
  
  // Tabla - Headers
  fechaDeLlegada: "Fecha de llegada",
  fechaDeSalida: "Fecha de salida",
  finPeriodoPruebaHeader: "Fin de período de prueba",
  empleado: "Empleado", 
  equipo: "Equipo",
  contrato: "Contrato",
  fechaDeNacimiento: "Fecha de nacimiento",
  ciudadDeNacimiento: "Ciudad de nacimiento",
  numeroSeguridadSocial: "número de la seguridad social",
  direccion: "Dirección",
  
  // Estados de datos
  sinInformacion: "Sin información",
  contratoIndefinido: "Contrato indefinido (40H)",
  
  // Calendario
  ultimosQuinceDias: "Últimos 15 días",
  proximosQuinceDias: "Próximos 15 días",
  
  // Navegación de meses
  anterior: "Anterior",
  siguiente: "Siguiente",
  
  // Días de la semana
  lunes: "L",
  martes: "M", 
  miercoles: "X",
  jueves: "J",
  viernes: "V",
  sabado: "S",
  domingo: "D",
  
  // Meses
  enero: "Enero",
  febrero: "Febrero",
  marzo: "Marzo",
  abril: "Abril",
  mayo: "Mayo",
  junio: "Junio",
  julio: "Julio",
  agosto: "Agosto",
  septiembre: "Septiembre",
  octubre: "Octubre",
  noviembre: "Noviembre",
  diciembre: "Diciembre",
  
  // Datos de ejemplo del tutorial
  empleados: {
    bobbieStoneman: "Bobbie Stoneman",
    astonAmartin: "Aston Amartin",
    leoMessi: "Leo Messi",
    soldierSpiderman: "Soldier Spiderman",
  },
  
  // Establecimiento de ejemplo
  establecimientos: {
    gotham: "Gotham",
  },
  
  // Equipos
  equipos: {
    rota: "Rota",
  },
  
  // Perfiles incompletos
  perfilesIncompletos: "Perfiles incompletos",
  informacionFaltante: "Información faltante del Registro de Personal y...",
  inicioDelContrato: "Inicio del contrato",
  faltaInformacion: "Falta información",
  empleo: "Empleo",
  cualificacion: "Cualificación", 
  genero: "Género",
  nacionalidad: "Nacionalidad",
  lugarDeNacimiento: "Lugar de nacimiento",
  cronicas: "crónicas",

  // Registro de ausencias
  registroAusencias: "Registro de ausencias",
  fecha: "Fecha",
  estatus: "Estatus",
  tipoAusencia: "Tipo de ausencia",
  periodoAusencia: "Período de la ausencia",
  duracion: "Duración",
  absenceLogTable: {
    fecha: "Fecha",
    estatus: "Estatus", 
    empleado: "Empleado",
    equipo: "Equipo",
    tipoAusencia: "Tipo de ausencia",
    periodoAusencia: "Período de la ausencia",
    duracion: "Duración"
  },

  // Modificación de contratos
  modificacionContratos: "Modificación de contratos",
  perfilModificado: "Perfil modificado",
  impacto: "Impacto",
  modificacionEfectuada: "Modificación efectuada",
  modificadoPor: "Modificado por",
  contractModificationsTable: {
    fecha: "Fecha",
    perfilModificado: "Perfil modificado",
    impacto: "Impacto",
    modificacionEfectuada: "Modificación efectuada",
    modificadoPor: "Modificado por"
  },

  // Seguimiento de fichajes
  seguimientoFichajes: "Seguimiento de fichajes",
  seleccioneUnEquipo: "Seleccione un equipo",
  todosLosEquiposCount: "Todos los equipos",
  planificado: "Planificado",
  fichado: "Fichado",
  horasReales: "Horas reales",
  diferenciaHorasRealesFichado: "Diferencia horas reales / fichado",
  diferenciaHorasRealesPlanificado: "Diferencia horas reales / planificado",
  validadoPor: "Validado por",
  comentario: "Comentario",
  relojDigitalNoActivado: "La opción de reloj digital no está activada en la cuenta.",
  masInformacion: "Más información",
  
  // Establecimientos y equipos para seguimiento
  establishments: {
    gotham: "GOTHAM",
  },
  
  teams: {
    rota2Cocina: "Rota 2 Cocina",
    rota: "Rota", 
    rotaBares: "Rota Bares",
  },

  // Navegación calendario dual adicional (evitamos duplicados con meses existentes)
  septiembreCalendario: "Septiembre",
  octubreCalendario: "Octubre",
} as const;

export type StringKey = keyof typeof esStrings;