# 🔍 AUDITORÍA COMPLETA TURNOSMART - SESSION 04
**Fecha:** 28 Marzo 2026
**Estado:** Documento de auditoría pre-ejecución
**Acción:** SIN REPARACIONES - Solo documentación de hallazgos

---

## 🔴 PROBLEMAS CRÍTICOS (BLOQUEADORES)

### #1 - WEEK VIEW COMPLETAMENTE VACÍO
* **Ruta:** `/turnosmart/week`
* **Estado:** Completamente vacío, sin empleados ni shifts visibles
* **Contraste:** Day view muestra 13 empleados
* **Headers:** "0" shifts para cada día
* **Impacto:** Feature completamente no funcional
* **Severidad:** 🔴 CRÍTICO

### #2 - /CUADRANTE ERROR - SELECT COMPONENT CRASH
* **Ruta:** `/cuadrante`
* **Error:** "A <select.item /> must have a value prop that is not empty"
* **Componente:** RotaFilter Select (RotaFilter.tsx)
* **Botón "Volver":** No funciona
* **Impacto:** Ruta completamente inaccesible
* **Severidad:** 🔴 CRÍTICO

---

## 🟠 PROBLEMAS GRAVES (FUNCIONALES)

### #3 - INCONSISTENCIA DAY/WEEK/MONTH VIEWS
- Day view: ✓ 13 empleados
- Week view: ✗ Vacío (0 shifts)
- Month view: ✓ Sin datos visuales
- **Causa:** Arquitectura de filtrado desincronizada

### #4 - PERÍODO DESACTUALIZADO EN ANALÍTICA
- Mostrado: "1 dic - 31 mal 2026" (typo?)
- Correcto: Marzo 2026
- **Afecta:** Analítica del equipo, HR Home

### #5 - MÉTRICA "HBNO" SIN DOCUMENTAR
- Aparece en Month view
- Todos muestran "0h | 0d | HBNO"
- **Significado:** DESCONOCIDO
- **Necesita:** Documentación o remover

### #6 - RUTA /COLABORADORES INCONSISTENTE
- Intento: `/turnosmart/collaborators` → 404
- Correcto: `/colaboradores` ✓
- **Problema:** Inconsistencia en prefixes

### #7 - EMPLEADOS "(PENDIENTE)" SIN CONTEXTO
4 empleados tienen "(pendiente)":
- Jefa de Bar (pendiente)
- Jefa de Recepción (pendiente)
- Jefa de Cocina (pendiente)
- Jefa de Sala (pendiente)
- **Significado:** Unclear ¿Validación pendiente? ¿Temporal?

### #8 - EMAILS AUTO-GENERADOS (INVÁLIDOS)
- **Formato:** `jefe-a-de-bar-1-177447841562@setup.turnosmart.app`
- **Patrón:** Todos slug-UUID@setup.turnosmart.app
- **Problema:** No son emails reales
- **Impacto:** Sistema de contacto roto

### #9 - DATOS INCOMPLETOS EN TABLA EQUIPO
- Teléfono: "No especificado"
- Ubicación: "Turno General"
- Email: Inválidos (ver #8)
- Estado: "Aceptada" (¿de qué?)

### #10 - CONFIGURACIÓN NO ACCESIBLE
- `/configuracion` → 404
- `/turnosmart/configuracion` → 404
- **Problema:** ConfigurationHub mencionada pero no accesible

### #11 - "PERFILES INCOMPLETOS: 1" SIN DETALLES
- HR Home muestra: "1 incompleto"
- Pero: No dice cuál
- **Necesita:** Link o lista expandible

### #12 - NO HAY DATOS DE TURNOS EN NINGUNA VISTA
- Day view: Empleados sin shifts
- Week view: "0" shifts por día
- Month view: Calendario vacío
- **Pregunta:** ¿No hay turnos creados? ¿O data no cargando?

---

## 🟡 PROBLEMAS UX/UI (MODERADOS)

### #13 - DAY VIEW TIMELINE DEMASIADO ANCHA
- Visible: 01:00-23:00 (todas las horas)
- **Problema:** Difícil leer, nombres superponen
- **Sugerencia:** Colapsable/zoomable, default 06:00-22:00

### #14 - FALTA ESTADO "RECHAZADA" EN EQUIPO
- Solo visible: "Aceptada"
- Falta: "Rechazada", "Pendiente", "Invitado"
- **Necesita:** Estados completos

### #15 - BOTONES SIN ICONOGRAFÍA CLARA
- Botón "Generar" en Week view (¿qué significa?)
- **Necesita:** Descripción clara, tooltip

### #16 - FILTROS EN EQUIPO CONFUSOS
- "Todos establecimientos (3) / Todos equipos (3)" juntos
- **Mejora:** Dropdowns separados

### #17 - MODAL "GESTIONAR ROL" CONFUSO
- Click en empleado abre solo rol
- **Esperado:** Perfil completo del empleado
- **Actual:** Solo cambiar rol

### #18 - VISTA 2 SEMANAS NO PROBADA
- Disponible pero no testeada
- **Estado:** Desconocido

---

## 🔵 OBSERVACIONES DE ARQUITECTURA

### #19 - DATA LOADING INCONSISTENTE
- Day view carga correctamente
- Week view no carga
- **Causa probable:** useEffect dependencies o GoogleCalendarStyle.tsx lógica

### #20 - LOCALSTORAGE PUEDE SER FACTOR
- localStorage con calendar-employees podría tener datos stale
- **Necesita:** Investigación

### #21 - FEATURE "GENERAR CUADRANTE" SIN PROBAR
- Botón visible en Week view
- Lógica desarrollada pero no testeable (Week view vacío)
- **Estado:** Funcionalidad no probada

### #22 - RUTAS INCONSISTENTES
- `/turnosmart/week` ✓
- `/turnosmart/day` ✓
- `/turnosmart/month` ✓
- `/turnosmart/collaborators` ✗
- `/colaboradores` ✓
- **Patrón:** A veces prefix, a veces no

---

## 📊 RESUMEN

| Categoría | Count | Severidad |
|-----------|-------|-----------|
| Críticos | 2 | 🔴 Bloquean uso |
| Graves | 10 | 🟠 Funcionalidad |
| Moderados | 6 | 🟡 UX/UI |
| Arquitectura | 4 | 🔵 Design |
| **TOTAL** | **22** | |

---

## ✅ COBERTURA DE TEST

| Sección | Estado | Notas |
|---------|--------|-------|
| Day view | ✓ | Funciona pero sin shifts |
| Week view | ✗ | Completamente vacío |
| Month view | ✓ | Sin datos visuales |
| Equipo | ✓ | Problemas de data |
| HR Home | ✓ | Período incorrecto |
| Analítica | ✓ | Período incorrecto |
| /cuadrante | ✗ | Error, inaccesible |
| Configuración | ✗ | No existe |
| Vista 2 semanas | ? | No probada |
| Perfil completo | ✗ | Modal rol, no completo |

---

**Generado:** 28 Marzo 2026
**Acción:** Waiting for Plan de Acción
