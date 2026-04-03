# GUIA DE TESTEO MANUAL COMPLETO — TurnoSmart

> Fecha: 2026-04-03
> Objetivo: Test end-to-end como un Manager que descubre TurnoSmart por primera vez.
> Base de datos: limpia (0 colaboradores, 0 departamentos, 0 turnos).

---

## DATOS DE ACCESO

| Campo | Valor |
|-------|-------|
| URL | https://www.turnosmart.app |
| Email Manager | jmgalvan@telefonica.net |
| Password | TurnoSmart2026! |
| Org | Hotel Atlantico |
| Super Admin | goturnosmart@gmail.com / TurnoSmart2026! (solo si necesitas acceso total) |

---

## FASE 0 — LOGIN Y PRIMERA IMPRESION (5 min)

### 0.1 Login
- [ ] Abrir https://www.turnosmart.app
- [ ] Introducir email: `jmgalvan@telefonica.net`
- [ ] Introducir password: `TurnoSmart2026!`
- [ ] Verificar que entra al Dashboard sin errores
- [ ] Verificar que el sidebar muestra: Calendario, Equipo, HR, Analítica, Configuración

### 0.2 Dashboard
- [ ] El dashboard muestra el nombre de la org: "Hotel Atlantico"
- [ ] El rol del usuario aparece como FOM/Manager (no "Empleado")
- [ ] No hay datos ficticios ni errores en consola

### 0.3 Navegacion general
- [ ] Hacer clic en cada seccion del sidebar y verificar que carga sin errores
- [ ] Calendario: deberia estar vacio (sin turnos ni empleados)
- [ ] Equipo: deberia mostrar "0 colaboradores" o un estado vacio
- [ ] HR: seccion accesible, posiblemente vacia

---

## FASE 1 — CREAR ESTRUCTURA DEL DEPARTAMENTO (10 min)

### 1.1 Crear departamento (Equipo)
- [ ] Ir a Configuración (Settings) o al area de departamentos
- [ ] Buscar opcion "Equipos" o "Departamentos"
- [ ] Crear nuevo departamento: **"Recepcion"**
- [ ] Verificar que aparece en la lista

### 1.2 Crear puestos de trabajo (Jobs)
Dentro del departamento Recepcion, crear estos puestos:
- [ ] **FOM** (Front Office Manager)
- [ ] **AFOM** (Assistant Front Office Manager)
- [ ] **Night Agent** (Agente Nocturno)
- [ ] **GEX** (Guest Experience)
- [ ] **FDA** (Front Desk Agent) — si el sistema permite crear varios con el mismo nombre, crear 3 (FDA1, FDA2, FDA3)

### 1.3 Verificar estructura
- [ ] En Equipo, el departamento "Recepcion" aparece
- [ ] Los puestos creados aparecen asociados al departamento

---

## FASE 2 — CREAR COLABORADORES (20 min)

### 2.1 Metodo 1: Creador Rapido (recomendado para el equipo base)
- [ ] Ir a Equipo > boton "Creador Rapido"
- [ ] **Tab "Creador Rapido"**
  - Equipo: Recepcion
  - Tipo contrato: Contrato indefinido
  - Fecha inicio: 01/04/2026
  - Horas semanales: 40
  - Cantidad: 5
  - Clic "Generar tabla"
- [ ] Rellenar la tabla de 5 personas:

| # | Nombre | Apellidos | Email |
|---|--------|-----------|-------|
| 1 | Eva | Martinez Lopez | eva.martinez@hotel.com |
| 2 | Manuel | Rodriguez Ruiz | manuel.rodriguez@hotel.com |
| 3 | Carlos | Garcia Torres | carlos.garcia@hotel.com |
| 4 | Ana | Fernandez Diaz | ana.fernandez@hotel.com |
| 5 | Pedro | Sanchez Vega | pedro.sanchez@hotel.com |

- [ ] Clic "Guardar equipo"
- [ ] Verificar toast de confirmacion
- [ ] Verificar que los 5 aparecen en la lista de Equipo

### 2.2 Metodo 2: Importar Excel
- [ ] Volver a Creador Rapido > Tab "Importar archivo"
- [ ] Clic "Descargar plantilla Excel"
- [ ] Abrir la plantilla en Excel/Numbers/Google Sheets
- [ ] Rellenar con 2 personas adicionales:

| Nombre | Apellidos | Email | Horas | Tipo contrato | Fecha inicio |
|--------|-----------|-------|-------|---------------|--------------|
| Laura | Torres Gil | laura.torres@hotel.com | 30 | Contrato temporal | 01/04/2026 |
| Marcos | Diaz Ruiz | marcos.diaz@hotel.com | 20 | Contrato en practicas | 01/04/2026 |

- [ ] Guardar el archivo Excel
- [ ] Subir el archivo en "Seleccionar archivo"
- [ ] Verificar que el preview muestra 2 personas con los datos correctos
- [ ] **IMPORTANTE**: Verificar que las horas (30/20) y tipo contrato aparecen en el preview o se usan del archivo (no del molde)
- [ ] Clic "Importar 2 colaboradores"
- [ ] Verificar que aparecen en la lista

### 2.3 Metodo 3: Formulario Individual (con email real para invitacion)
- [ ] Ir a Equipo > boton "+ Anadir" (o Creador Rapido > Tab "Individual")
- [ ] Rellenar el formulario completo:
  - **Nombre**: [Tu nombre real o nombre de test]
  - **Apellidos**: [Apellidos]
  - **Email**: **[UNA DIRECCION EMAIL REAL DONDE PUEDAS RECIBIR CORREO]**
  - **Telefono**: Opcional
  - **Fecha inicio contrato**: 01/04/2026
  - **Hora inicio**: 09:00
  - **Tipo contrato**: Contrato indefinido
  - **Horas semanales**: 40
  - **Equipo**: Recepcion
  - **Puesto de trabajo**: seleccionar uno (ej: FDA)
- [ ] Clic "Guardar"
- [ ] Verificar que se crea correctamente

### 2.4 Verificacion final de colaboradores
- [ ] Ir a Equipo
- [ ] Contar: deberian ser **8 colaboradores** (5 rapido + 2 Excel + 1 individual)
- [ ] Verificar que cada uno muestra nombre, email, departamento
- [ ] Hacer clic en un colaborador para ver su perfil detallado
- [ ] Verificar que los datos estan correctos

---

## FASE 3 — ASIGNAR ROLES Y CONFIGURAR (10 min)

### 3.1 Asignar puestos a colaboradores
Para cada colaborador, abrir su perfil y asignar el puesto:

| Colaborador | Puesto |
|-------------|--------|
| Eva Martinez | FOM |
| Manuel Rodriguez | Night Agent |
| Carlos Garcia | FDA |
| Ana Fernandez | FDA |
| Pedro Sanchez | FDA |
| Laura Torres | GEX |
| Marcos Diaz | AFOM |
| [Tu email real] | FDA |

### 3.2 Verificar horarios guardados (Saved Shifts)
- [ ] Ir a Calendario (o Configuracion > Turnos/Horarios)
- [ ] Verificar que existen los turnos predefinidos:
  - M (Manana) 07:00-15:00
  - T (Tarde) 15:00-23:00
  - N (Noche) 23:00-07:00
  - 11x19 (Transicion) 11:00-19:00
  - 9x17 (GEX manana) 09:00-17:00
  - 12x20 (GEX tarde) 12:00-20:00
  - G (Guardia) 09:00-21:00
- [ ] Si no existen, crearlos manualmente

---

## FASE 4 — CALENDARIO Y TURNOS (15 min)

### 4.1 Vista del calendario
- [ ] Ir a Calendario (Turnos)
- [ ] Verificar que aparecen los 8 empleados en las filas
- [ ] Verificar que el mes actual (abril 2026) esta vacio (sin turnos)
- [ ] Cambiar entre vistas: Semanal, Mensual

### 4.2 Asignar turnos manualmente
- [ ] Hacer clic en una celda vacia de un empleado
- [ ] Seleccionar un turno (ej: M para Eva el lunes)
- [ ] Verificar que la celda se llena con el turno y su color
- [ ] Asignar algunos turnos manuales a distintos empleados
- [ ] Verificar que se guardan correctamente

### 4.3 Bloquear celdas (Candado)
- [ ] Clic derecho en una celda con turno asignado
- [ ] Seleccionar "Bloquear" (Lock)
- [ ] Verificar que aparece un icono de candado
- [ ] El motor SMART deberia respetar esta celda al generar

---

## FASE 5 — GENERAR TURNOS CON MOTOR SMART (20 min)

### 5.1 Abrir el Wizard de generacion
- [ ] En Calendario, clic en boton "Generar [Mes Actual]"
- [ ] Se abre el Wizard SMART de 7+ pasos

### 5.2 Wizard Step 1 — Periodo
- [ ] Seleccionar el periodo: Abril 2026 (o la semana actual)
- [ ] Seleccionar duracion: 1 semana / 2 semanas / mes completo

### 5.3 Wizard Step 2 — Empleados
- [ ] Verificar que aparecen los 8 empleados
- [ ] Todos deberian estar seleccionados por defecto
- [ ] Si hay menos de 2 empleados seleccionados, el boton deberia estar bloqueado

### 5.4 Wizard Step 3 — Guardias FOM
- [ ] Si Eva (FOM) esta incluida, deberia preguntar por guardias de fin de semana
- [ ] Seleccionar 0, 1 o 2 fines de semana con guardia (o ninguno)

### 5.5 Wizard Step 4 — Criterios
- [ ] Verificar que aparecen los criterios SMART
- [ ] Criterios obligatorios (ley): siempre ON, no se pueden desactivar
- [ ] Criterios opcionales: toggle ON/OFF
- [ ] Opcionalmente activar/desactivar algunos

### 5.6 Wizard Step 5 — Resumen pre-generacion
- [ ] Verificar resumen: empleados, peticiones, ocupacion
- [ ] Deberia mostrar "0 peticiones" y "sin datos de ocupacion"
- [ ] Checklist Copilot Pre-Generacion (si existe)

### 5.7 Wizard Step 6 — Generar
- [ ] Clic "Generar"
- [ ] Esperar a que el motor produzca 3 alternativas
- [ ] Verificar que aparecen 3 versiones con scores (0-100)
- [ ] Comparar scores: Equilibrio vs Peticiones vs Cobertura

### 5.8 Wizard Step 7 — Seleccionar alternativa
- [ ] Elegir la alternativa con mejor score
- [ ] Verificar el semaforo de validacion (verde/naranja/rojo)
- [ ] Si hay violaciones (rojo), revisarlas
- [ ] Panel de Auditoria: boton "Revisar" deberia mostrar alertas

### 5.9 Aplicar al calendario
- [ ] Confirmar y aplicar la alternativa seleccionada
- [ ] Verificar que el calendario se llena con los turnos generados
- [ ] Verificar que las celdas bloqueadas (candado) se respetaron
- [ ] Verificar visualmente: cada empleado tiene ~5 dias de trabajo + 2 libres

---

## FASE 6 — EDICION POST-GENERACION (10 min)

### 6.1 Editar un turno
- [ ] Clic en una celda con turno asignado
- [ ] Cambiar el turno (ej: M -> T)
- [ ] Verificar que se muestra un dialogo de confirmacion si es post-publicacion
- [ ] Verificar que los cambios se marcan en un color diferente (azul)

### 6.2 Publicar el cuadrante
- [ ] Buscar boton "Publicar" en la toolbar del calendario
- [ ] Clic en Publicar
- [ ] Verificar el semaforo final (verde = OK para publicar)
- [ ] Confirmar publicacion
- [ ] Verificar notificacion de exito

---

## FASE 7 — PETICIONES DE EMPLEADOS (10 min)

### 7.1 Crear peticiones como Manager
- [ ] Ir al panel de Peticiones (desde el calendario o sidebar)
- [ ] Crear una peticion tipo A (vacaciones obligatorias):
  - Empleado: Carlos Garcia
  - Tipo: A (Obligatoria)
  - Dias: una semana de abril
  - Motivo: "Vacaciones aprobadas"
- [ ] Crear una peticion tipo B (preferencia blanda):
  - Empleado: Ana Fernandez
  - Tipo: B (Preferencia)
  - Dias: un viernes concreto
  - Turno solicitado: M (Manana)
  - Motivo: "Prefiere manana para llevar hijos al colegio"
- [ ] Verificar que ambas peticiones aparecen en la lista

### 7.2 Regenerar con peticiones
- [ ] Volver al calendario y regenerar los turnos
- [ ] En Step 5 del Wizard, verificar que aparecen "2 peticiones"
- [ ] Generar y verificar que:
  - Carlos Garcia tiene "V" (vacaciones) en la semana solicitada
  - Ana Fernandez tiene "M" el viernes (si el motor pudo asignarlo)

---

## FASE 8 — OCUPACION E IMPORTACION (10 min)

### 8.1 Importar datos de ocupacion
- [ ] En el calendario, buscar opcion "Ocupacion" o "Check-in/Check-out"
- [ ] Introducir manualmente datos para algunos dias:
  - Dia 7 abril: 45 check-ins, 20 check-outs
  - Dia 14 abril: 80 check-ins, 30 check-outs (dia alto)
  - Dia 21 abril: 15 check-ins, 10 check-outs (dia bajo)
- [ ] O importar un CSV con datos de ocupacion

### 8.2 Regenerar con ocupacion
- [ ] Regenerar los turnos
- [ ] Verificar que el motor propone refuerzo en dias de alta ocupacion (dia 14)
- [ ] Verificar alerta si no hay personal para cubrir el refuerzo

---

## FASE 9 — INVITACION POR EMAIL (10 min)

### 9.1 Invitar colaborador
- [ ] Ir a Equipo > boton "Invitar"
- [ ] Introducir el email real (el del colaborador individual que creaste)
- [ ] Enviar invitacion
- [ ] Verificar que aparece en la lista de invitaciones pendientes

### 9.2 Recibir email
- [ ] Revisar la bandeja de entrada del email real
- [ ] Verificar que llega un email de invitacion con branding TurnoSmart
- [ ] Verificar el contenido: enlace de registro, nombre del hotel, etc.
- [ ] Hacer clic en el enlace de invitacion
- [ ] Verificar que lleva a la pagina de registro/login

### 9.3 Login como empleado invitado
- [ ] Completar el registro (si aplica) o hacer login
- [ ] Verificar que el empleado ve "Mi Espacio" (no panel de gestion)
- [ ] Verificar que puede ver su horario
- [ ] Verificar que puede crear peticiones desde su dashboard

---

## FASE 10 — HR Y ANALITICA (10 min)

### 10.1 HR Home
- [ ] Ir a HR (Recursos Humanos)
- [ ] Verificar que muestra datos reales:
  - Plantilla Bruta: 8 empleados
  - Plantilla Activa (descontando vacaciones)
  - Plantilla Presencial (formula /1.4)
- [ ] Verificar la Calculadora de Plantilla en el header

### 10.2 Analitica
- [ ] Ir a Analitica / Mi Actividad
- [ ] Verificar que carga sin errores
- [ ] Verificar graficos de peticiones, equidad, etc.

### 10.3 Perfil de colaborador
- [ ] Clic en un colaborador desde Equipo
- [ ] Navegar las tabs: Perfil, Contrato, Documentos, etc.
- [ ] Verificar que los datos se muestran correctamente

---

## FASE 11 — CONFIGURACION AVANZADA (5 min)

### 11.1 Criterios SMART
- [ ] Ir a Configuracion > Criterios (o desde el calendario)
- [ ] Verificar que se pueden activar/desactivar criterios
- [ ] Probar el BOOST en un criterio
- [ ] Guardar cambios

### 11.2 SMART+IA Sugerencias
- [ ] Despues de generar turnos, verificar si aparece el panel SMART+IA
- [ ] Si hay sugerencias, verificar que se pueden aceptar/rechazar

---

## FASE 12 — EXPORTACION (5 min)

### 12.1 Exportar cuadrante
- [ ] En el calendario con turnos generados, buscar boton "Exportar"
- [ ] Exportar a PDF — verificar que se descarga y tiene formato correcto
- [ ] Exportar a Excel — verificar que contiene los datos
- [ ] Si hay opcion iCal, probarla

---

## FASE 13 — MOBILE / RESPONSIVE (5 min)

### 13.1 Test en movil
- [ ] Abrir https://www.turnosmart.app en el movil (o reducir ventana del navegador)
- [ ] Verificar que el sidebar se convierte en menu hamburguesa
- [ ] Navegar por las secciones principales
- [ ] Verificar que el calendario es legible en pantalla pequena
- [ ] Verificar la navegacion inferior (bottom nav)

---

## CHECKLIST FINAL

| Seccion | Estado |
|---------|--------|
| Login y Dashboard | [ ] OK |
| Crear Departamento y Puestos | [ ] OK |
| Creador Rapido (5 colaboradores) | [ ] OK |
| Import Excel (2 colaboradores) | [ ] OK |
| Formulario Individual (1 con email real) | [ ] OK |
| Asignar roles/puestos | [ ] OK |
| Calendario vacio | [ ] OK |
| Turnos manuales | [ ] OK |
| Bloquear celdas | [ ] OK |
| Motor SMART (3 alternativas) | [ ] OK |
| Auditoría y scores | [ ] OK |
| Publicar cuadrante | [ ] OK |
| Peticiones (A + B) | [ ] OK |
| Regenerar con peticiones | [ ] OK |
| Ocupacion check-in/check-out | [ ] OK |
| Invitar por email | [ ] OK |
| Login como empleado | [ ] OK |
| HR Home + Calculadora | [ ] OK |
| Analitica | [ ] OK |
| Perfil colaborador | [ ] OK |
| Criterios SMART | [ ] OK |
| SMART+IA | [ ] OK |
| Exportar PDF/Excel | [ ] OK |
| Mobile/Responsive | [ ] OK |

---

## BUGS ENCONTRADOS

| # | Seccion | Descripcion | Severidad |
|---|---------|-------------|-----------|
| | | | |
| | | | |
| | | | |

---

## NOTAS

- La org se llama "Hotel Atlantico" — puedes renombrarla en Settings si quieres
- Los 14 turnos predefinidos (M/T/N/G/11x19/9x17/12x20 + variantes) ya estan cargados
- El Super Admin (goturnosmart@gmail.com) tiene acceso total por si necesitas desbloquear algo
- Si encuentras un bug, anota: seccion + descripcion + pasos para reproducir + screenshot
