# Ideas desde FactorialHR — Tour Product + Landing Analysis
> Fecha: 2 abril 2026 | Analizado por: Claude (Senior Project Lead)

---

## 1. STYLE GUIDE & LOOK AND FEEL

### Paleta de colores
- **Primary:** Rojo coral (#E8384F) — CTAs, badges activos, iconos secciones
- **Secondary:** Teal/verde-azulado — links, "Explore more" arrows
- **Neutrals:** Fondo blanco puro, grises muy suaves (muted/20), bordes apenas visibles
- **Accents:** Verde (clocked in), Naranja (on break), Rojo (warning/birthday), Azul (events)
- **Gradient backgrounds:** Rojo-amarillo degradado sutil en hero — da calidez

### Idea TurnoSmart:
- [ ] Considerar accent color rojo coral como alternativa al violeta actual
- [ ] Usar gradientes cálidos (no solo grises neutros) en hero sections
- [ ] Badges con colores semánticos consistentes (verde=OK, naranja=pending, rojo=urgente)

### Tipografía
- Font sans-serif custom, peso variable (300-700)
- Títulos: bold 32-48px, subtítulos: semibold 18-24px, body: regular 14px, micro: 10-12px
- Jerarquía muy clara: 4 niveles máximo

### Idea TurnoSmart:
- [ ] Reforzar jerarquía tipográfica (actualmente un poco flat en dashboards)

### Layout
- **Sidebar fija izquierda** (~220px) con secciones colapsables (Personal / Company)
- **Contenido principal** ocupa el resto
- **Cards con bordes suaves** (border-radius ~12px), sombras mínimas
- **Spacing generoso** — mucho aire entre elementos
- **Grid de 3 columnas** en dashboard (Clock in | Inbox | Events)

### Idea TurnoSmart:
- [ ] Sidebar colapsable con secciones Personal/Empresa
- [ ] Grid de 3 columnas en dashboard FOM (turnos hoy | inbox peticiones | eventos próximos)

---

## 2. DASHBOARD — Ideas principales

### Lo que hace bien Factorial:
- **"Good morning, Hellen!"** — Saludo personalizado con nombre y hora
- **Clock in widget** prominente con timer circular animado + estado (On break/Clocked out)
- **Inbox badge** con count (69) — urgencia visual
- **Events sidebar** con calendario visual de próximos eventos
- **"Who is in?"** — 4 KPIs: Not in office / Missing clock in / Clocked in / On a break
- **Birthday feed** con fotos de empleados
- **Company announcements** con feed tipo red social (avatar + post + comentarios)

### Ideas para TurnoSmart:
- [ ] **Widget "Quién trabaja hoy"** — KPIs: En turno X / Descanso / Ausentes / Sin fichaje
- [ ] **Birthday/aniversario widget** en dashboard (dato ya existe en colaboradores)
- [ ] **Feed de anuncios** — comunicaciones del FOM al equipo (tipo muro social)
- [ ] **Inbox unificada** — centralizar peticiones + ausencias + mensajes pendientes con badges count
- [ ] **Timer de fichaje** — si implementamos clock-in (futuro)

---

## 3. SIDEBAR NAVIGATION — Patrón

### Factorial:
- 2 secciones: **Personal** (Profile, Clock in, Time off, Documents, Training) + **Company** (Employees, Recruitment, Performance, Time tracking, Projects, Analytics, Spending, Payroll, Finance)
- Iconos monocolor, item activo con fondo destacado
- **Search ⌘K** en la parte superior (command palette)
- User avatar + nombre en la parte inferior

### Ideas para TurnoSmart:
- [ ] **Command palette ⌘K** — búsqueda rápida de empleados, turnos, peticiones
- [ ] **Sección "Personal"** para empleados (Mi perfil, Mis turnos, Mis peticiones, Mis documentos)
- [ ] **Sección "Gestión"** para FOM (Equipo, Calendario, Auditoría, HR, Analítica)

---

## 4. EMPLOYEE PROFILE — Benchmark

### Factorial:
- **10 tabs:** Overview, Documents, Schedule planning, Time off, Performance, Tasks, Competencies, Courses, Others
- **Overview** = snapshot: Status card (horas del día), Time off (próximas vacaciones), Salary (€), Timesheet (worked vs planned), Documents pendientes, DETAILS panel lateral
- **Details panel derecha:** Manager, Email, Phone, Legal entity, Start date, Workdays, Teams
- **Timesheet widget:** Barra de progreso 67h worked / -37h remaining con balance
- **Salary card:** €22,000 yearly con gráfico de evolución

### Ideas para TurnoSmart:
- [ ] **Tab "Overview" mejorado** en perfil colaborador — snapshot con: horas mes, próximas ausencias, balance DG/DB, equidad M/T/N
- [ ] **Widget "Timesheet"** — horas trabajadas vs contrato (ya tenemos los datos)
- [ ] **Panel DETAILS lateral** — info clave visible siempre sin hacer scroll
- [ ] **Tabs de Performance** — evaluaciones futuras
- [ ] **Documents tab** — subida de documentos por colaborador (contrato, DNI, etc.)

---

## 5. TIME OFF — Patrón de ausencias

### Factorial:
- **Calendario anual 12 meses** con días coloreados (rojo=festivo, verde/teal=aprobado)
- **Absence tracker:** 3 KPIs con flechas para ciclar tipos: Accrued / Available / Taken
- **"+ Add absence" button** prominente rojo
- **Modal "Add absence":** Type dropdown, Half day / Days toggle, Date range picker, "Choose a substitute" search
- **Current & upcoming** lista con rangos de fechas y duración

### Ideas para TurnoSmart:
- [ ] **Calendario anual mini** en perfil empleado (12 meses, colores por tipo de ausencia)
- [ ] **Tracker Accrued/Available/Taken** — perfecto para vacaciones (48 días)
- [ ] **"Choose a substitute"** — campo para indicar quién cubre la ausencia
- [ ] **Half day toggle** — soporte para medias jornadas en peticiones

---

## 6. ORG CHART — Visual organizativo

### Factorial:
- Organigrama visual con fotos, nombre, rol, ubicación
- Badges numéricas de reportes directos (3, 5, 12)
- **"Find me"** button para ubicar tu posición
- Zoom to fit / Expand all controls
- Filtro por Workplace

### Ideas para TurnoSmart:
- [ ] **Org chart visual** — ya tenemos los datos de jerarquía (manager→empleados)
- [ ] **"Find me" button** — útil en equipos grandes
- [ ] **Vista por departamento/equipo** en la grid de colaboradores

---

## 7. INBOX UNIFICADA — Patrón de notificaciones

### Factorial:
- Un solo inbox para TODO: tareas asignadas, gastos, whistleblowing, facturas, turnos
- **Reject/Approve buttons inline** — acción directa sin abrir detalle
- Cada item muestra: icono módulo, texto, fecha, categoría
- "You have shifts to fill" con contexto (5 of 9 days worked)

### Ideas para TurnoSmart:
- [ ] **Inbox unificada** — reemplazar múltiples paneles por un inbox central:
  - Peticiones pendientes de aprobar (Reject/Approve inline)
  - Ausencias pendientes
  - Alertas de auditoría
  - Notificaciones del motor SMART
  - Mensajes de empleados
- [ ] **Approve/Reject inline** — sin abrir modal, acción directa en la lista
- [ ] **Badge count en sidebar** — "Inbox (5)" con número de pendientes

---

## 8. TONE OF VOICE — Copywriting

### Factorial:
- **Playful pero profesional**: emojis moderados, tono conversacional
- "Phew, it's been a lot. Time to request a well-earned break"
- "Sun, rest, and recharge—lock it in."
- "Every employee has a story—let's explore Alicia's"
- Italics para énfasis: "It's *more* than just data"

### Ideas para TurnoSmart:
- [ ] **Tono más cálido** en mensajes del sistema (actualmente muy técnico)
- [ ] **Mensajes motivacionales** en dashboard empleado según contexto
- [ ] **Emojis sutiles** en tooltips y notificaciones (ya lo hacemos en SMART tags)

---

## 9. MICRO-INTERACTIONS & POLISH

### Factorial:
- **Timer circular animado** para clock-in (arco SVG con transición)
- **Funnel chart** para recruitment pipeline
- **Badges con ms** mostrando performance de carga (Clock in 1197ms)
- **"Powered by Navattic"** — tour interactivo sin código propio
- **⌘K search** — command palette global
- **Gradient backgrounds** sutiles (no flat)
- **Avatar circular** con borde de estado (verde=online)
- **Date range visual** con flechas → entre fechas inicio y fin
- **Carousel** con controles play/pause en landing

### Ideas para TurnoSmart:
- [ ] **Command palette ⌘K** — buscar empleados, turnos, secciones (alta prioridad)
- [ ] **Date range visual** con flechas → para peticiones y ausencias
- [ ] **Avatar con borde de estado** — en turno (verde), descanso (gris), ausente (rojo)
- [ ] **Indicadores de carga** (como los ms de Factorial) — transparencia en performance

---

## 10. FEATURES QUE FACTORIAL TIENE Y NOSOTROS NO (Roadmap ideas)

| Feature Factorial | Prioridad para TurnoSmart | Esfuerzo |
|---|---|---|
| **Documents per employee** | Alta — contratos, DNI, nóminas | Medium |
| **Performance reviews** | Media — evaluaciones anuales | Large |
| **Training / Courses** | Baja — no core para turnos | Large |
| **Expense management** | Baja — no core | Large |
| **Clock-in/Clock-out** | Alta — fichaje digital | Medium |
| **Command palette ⌘K** | Alta — productividad | Small |
| **Inbox unificada** | Alta — centralizar notificaciones | Medium |
| **Birthday/anniversary feed** | Media — engagement | Small |
| **Org chart visual** | Media — visualización equipo | Medium |
| **Substitute on absence** | Alta — ya tenemos peticiones, falta campo "sustituto" | Small |

---

## 11. PRIORIDADES — Lo que implementaríamos primero

### Quick wins (1-2 días cada uno):
1. **⌘K Command palette** — cmdk library
2. **Avatar con estado** en sidebar/grid colaboradores
3. **Substitute field** en peticiones de ausencia
4. **Birthday widget** en dashboard (query fecha_nacimiento)
5. **Tono más cálido** en copywriting de mensajes

### Medium (3-5 días):
6. **Inbox unificada** con Approve/Reject inline
7. **Calendario anual mini** en perfil empleado
8. **Tracker Accrued/Available/Taken** para vacaciones
9. **Documents tab** en perfil colaborador

### Large (1-2 semanas):
10. **Clock-in/Clock-out** con timer visual
11. **Org chart visual** con fotos
12. **Performance reviews** básico

---

*Documento generado durante el Product Tour de FactorialHR (11 steps) el 2 de abril 2026.*
