export const esOverview = {
  // Header
  title: 'Visión general',
  subtitle: 'Resumen',
  
  // Filtros
  filters: {
    fecha: 'Fecha',
    todoElTiempo: 'Todo el tiempo',
    año: 'Año',
    trimestre: 'Trimestre',
    mes: 'Mes',
    día: 'Día',
    establecimiento: 'Establecimiento',
    equipo: 'Equipo',
    tipoContrato: 'Tipo de contrato',
    genero: 'Género',
    todos: 'Todos',
    masculino: 'Masculino',
    femenino: 'Femenino',
    otro: 'Otro',
    propio: 'PROPIO',
    ett: 'ETT',
    ochohoras: '8 HORAS',
    seishoras: '6 HORAS',
    cincohoras: '5 HORAS',
    cuatrohoras: '4 HORAS',
  },
  
  // Cards de estadísticas
  stats: {
    plantilla: 'PLANTILLA',
    presencial: 'PRESENCIAL',
    ausencia: 'AUSENCIA',
    vacaciones: 'VACACIONES',
    enfermos: 'ENFERMOS',
    faltas: 'FALTAS',
    accidentes: 'ACCIDENTES',
    permisos: 'PERMISOS',
    absentismo: 'ABSENTISMO',
    rotacion: 'ROTACIÓN',
    totalEmpleados: 'Total empleados',
    empleadosPresentes: 'Empleados presentes',
    empleadosAusentes: 'Empleados ausentes',
    empleadosVacaciones: 'Empleados de vacaciones',
    empleadosEnfermos: 'Empleados enfermos',
    empleadosFaltas: 'Empleados con faltas',
    empleadosAccidentes: 'Empleados con accidentes',
    empleadosPermisos: 'Empleados con permisos',
    porcentajeAbsentismo: 'Porcentaje de absentismo',
    porcentajeRotacion: 'Porcentaje de rotación',
  },
  
  // Acciones
  actions: {
    exportarDatos: 'Exportar datos',
    csvFile: 'CSV File',
    excelFile: 'Excel File',
    descargarPdf: 'Descargar PDF',
    compartir: 'Compartir',
    actualizar: 'Actualizar',
  },
  
  // Estados y mensajes
  states: {
    cargando: 'Cargando...',
    sinDatos: 'Sin datos disponibles',
    error: 'Error al cargar los datos',
    descargaIniciada: 'La descarga ha comenzado y puede tardar unos minutos',
    descargaCompleta: 'El Dashboard se ha descargado con éxito',
    actualizando: 'Actualizando datos...',
  },
  
  // Tooltips y ayuda
  tooltips: {
    exportar: 'Exportar datos del dashboard',
    filtrarFecha: 'Seleccionar rango de fechas',
    filtrarEstablecimiento: 'Filtrar por establecimiento',
    filtrarEquipo: 'Filtrar por equipo de trabajo',
    filtrarContrato: 'Filtrar por tipo de contrato',
    filtrarGenero: 'Filtrar por género',
    actualizar: 'Actualizar datos del dashboard',
  },
  
  // Valores de ejemplo
  examples: {
    establishments: [
      'Todos los establecimientos',
      'Hotel Madrid Centro',
      'Hotel Barcelona Playa',
      'Restaurante Sevilla',
      'Hotel Valencia Puerto',
    ],
    teams: [
      'Todos los equipos',
      'Recepción',
      'Pisos',
      'Restaurante',
      'Bar',
      'Cocina',
      'Mantenimiento',
    ],
    contractTypes: [
      'Todos los tipos',
      '8 HORAS',
      '6 HORAS',
      '5 HORAS',
      '4 HORAS',
    ],
    genders: [
      'Todos',
      'Masculino',
      'Femenino',
      'Otro',
    ],
  },
};