# 🎯 PLAN DE ACCIÓN - TURNOSMART AUDITORÍA
**Fecha:** 28 Marzo 2026
**Basado en:** AUDIT_REPORT_SESSION_04.md
**Total Problemas:** 22
**Prioridad:** Críticos → Graves → Moderados

---

## FASE 1: CRÍTICOS (BLOQUEADORES) - 2-3 días
**Objetivo:** Restaurar funcionalidad básica

### Sprint 1A: Week View Vacío (#1)
**Problema:** `/turnosmart/week` muestra 0 shifts
**Prioridad:** 🔴 CRÍTICO
**Estimación:** 1-2 días

**Investigación:**
1. Comparar `useEffect` en GoogleCalendarStyle.tsx (Week view) vs Day view
2. Revisar si `weekShifts` query está siendo ejecutada
3. Verificar localStorage state en Week view
4. Buscar diferencias en filtrado entre vistas

**Acciones:**
- [ ] Debug: Console.log en GoogleCalendarStyle para ver data flow
- [ ] Verificar SQL query para shifts by week
- [ ] Comparar Day vs Week hooks (useEmployeeCalendarData vs similar)
- [ ] Limpiar localStorage y probar
- [ ] Una vez arreglado: Testear que muestra 13 empleados igual que Day view

**Success Criteria:**
- Week view muestra mismo # empleados que Day view
- Shifts visibles en timeline semanal
- Headers muestran > 0 shifts por día

---

### Sprint 1B: /Cuadrante Select Error (#2)
**Problema:** `<select.item /> must have a value prop`
**Prioridad:** 🔴 CRÍTICO
**Estimación:** 1 día

**Investigación:**
1. Abrir `/cuadrante` → inspeccionar error exacto
2. Localizar RotaFilter.tsx y revisar Select component
3. Identificar qué `value` prop falta

**Acciones:**
- [ ] Leer RotaFilter.tsx completo
- [ ] Encontrar <select.item /> sin value prop
- [ ] Añadir value prop con estado correcto
- [ ] Probar que /cuadrante carga sin error
- [ ] Verificar que botón "Volver al Inicio" funciona

**Success Criteria:**
- `/cuadrante` carga sin error
- Select dropdown funcional
- Botón volver funciona

---

## FASE 2: GRAVES (FUNCIONALIDAD) - 3-5 días
**Objetivo:** Asegurar data integridad y funcionalidad core

### Sprint 2A: Datos de Turnos No Cargando (#12)
**Problema:** No hay shifts en ninguna vista
**Prioridad:** 🟠 GRAVE
**Estimación:** 1-2 días
**Dependencia:** Sprint 1A debe estar completo

**Investigación:**
1. ¿Existen shifts en BD? SELECT COUNT(*) FROM jobs/shifts
2. ¿Query está bien formado?
3. ¿RLS policies bloquean shifts?
4. ¿Data service está filtrando correctamente?

**Acciones:**
- [ ] Verificar BD: ¿hay shifts/jobs?
- [ ] Revisar query en useEmployeeCalendarData
- [ ] Verificar RLS policies para shifts table
- [ ] Crear shifts de prueba si no existen
- [ ] Una vez arreglado: Testear visualización en todas las vistas

**Success Criteria:**
- Existen shifts en BD
- Shifts visibles en Day view timeline
- Shifts visibles en Week view
- Shifts visibles en Month view

---

### Sprint 2B: Emails Inválidos (#8) + Datos Incompletos (#9)
**Problema:** Emails `slug-UUID@setup.turnosmart.app` no son reales
**Prioridad:** 🟠 GRAVE
**Estimación:** 1 día
**Impacto:** Sistema de contacto roto

**Investigación:**
1. ¿De dónde vienen estos emails? (Email generation logic)
2. ¿Hay emails reales en BD?
3. ¿Se pueden actualizar?

**Acciones:**
- [ ] Encontrar dónde se generan emails (probablemente seed data o migration)
- [ ] Cambiar patrón a algo real: nombre@hotel.com o nombre@company.es
- [ ] Decidir: ¿Actualizar BD? ¿Crear nuevos empleados?
- [ ] Poblar teléfono y ubicación también

**Success Criteria:**
- Todos los empleados tienen emails válidos
- Formato: nombre@dominio.com
- Teléfono: No "No especificado"
- Ubicación: Actualizado

---

### Sprint 2C: "(Pendiente)" Sin Contexto (#7)
**Problema:** 4 empleados con "(pendiente)" pero no se sabe qué significa
**Prioridad:** 🟠 GRAVE
**Estimación:** 0.5 días

**Acciones:**
- [ ] Identificar por qué tienen "(pendiente)"
- [ ] Decidir: ¿Remover "(pendiente)"? ¿O es estado válido?
- [ ] Si es estado válido: Documentar en datos de empleado
- [ ] Actualizar BD para claridad

**Success Criteria:**
- Todos los empleados tienen nombres claros
- O "(pendiente)" tiene significado documentado

---

### Sprint 2D: Período Desactualizado (#4)
**Problema:** "1 dic - 31 mal 2026" debe ser Marzo 2026
**Prioridad:** 🟠 GRAVE
**Estimación:** 0.5 días

**Acciones:**
- [ ] Buscar donde se define este período
- [ ] Cambiar a: "1 mar - 31 mar 2026" (correcto)
- [ ] Verificar en Analytics, HR Home
- [ ] Probar que período se actualiza dinámicamente

**Success Criteria:**
- Período correcto en todas las vistas
- Se actualiza cada mes automáticamente

---

### Sprint 2E: Rutas Inconsistentes (#6, #22)
**Problema:** `/turnosmart/collaborators` vs `/colaboradores`
**Prioridad:** 🟠 GRAVE
**Estimación:** 0.5 días

**Acciones:**
- [ ] Decidir: ¿Usar `/turnosmart/` prefix o no?
- [ ] Estandarizar ALL routes
- [ ] Actualizar AppRoutes.tsx
- [ ] Verificar no hay enlaces rotos

**Success Criteria:**
- Patrón de rutas consistente
- Todos los enlaces funcionan
- Documentado en router structure

---

## FASE 3: MODERADOS (UX/UI) - 2-3 días
**Objetivo:** Mejorar experiencia de usuario

### Sprint 3A: Timeline Demasiado Ancha (#13)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Reducir horas visibles default: 06:00-22:00
- [ ] Añadir controles de zoom
- [ ] Test responsiveness

### Sprint 3B: "HBNO" Sin Documentación (#5)
**Estimación:** 0.5 días
**Acciones:**
- [ ] ¿Qué significa HBNO?
- [ ] Si importante: Documentar con tooltip
- [ ] Si no importante: Remover

### Sprint 3C: Estados Incompletos (#14)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Añadir estados: Rechazada, Pendiente, Invitado
- [ ] Implementar visual differences
- [ ] Test filtering por estado

### Sprint 3D: Botones Sin Iconografía (#15)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Añadir tooltips claros
- [ ] Revisar iconografía
- [ ] Test en diferentes breakpoints

### Sprint 3E: Filtros Confusos (#16)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Separar dropdowns: Establecimientos | Equipos
- [ ] Añadir labels claros
- [ ] Test usabilidad

### Sprint 3F: Modal Perfil Confuso (#17)
**Estimación:** 1 día
**Acciones:**
- [ ] Expandir modal para mostrar perfil completo
- [ ] Acceso a editar rol desde perfil
- [ ] Test completar empleado desde modal

---

## FASE 4: ARQUITECTURA - 2 días
**Objetivo:** Mejorar design y mantenibilidad

### Sprint 4A: Investigar Data Loading (#19)
**Estimación:** 1 día
**Acciones:**
- [ ] Comparar useEffect en Day vs Week
- [ ] Documentar diferencias
- [ ] Consolidar si es posible

### Sprint 4B: Perfiles Incompletos ID (#11)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Mostrar lista de empleados incompletos
- [ ] Link directo a perfil
- [ ] Test completar perfil

### Sprint 4C: Vista 2 Semanas (#18)
**Estimación:** 0.5 días
**Acciones:**
- [ ] Testear completamente
- [ ] Documentar si funciona o remover

---

## FASE 5: CONFIGURACIÓN
**Objetivo:** Acceso a setup

### Sprint 5A: /Configuración No Accesible (#10)
**Estimación:** 1 día
**Acciones:**
- [ ] ¿Ruta existe pero no está en nav?
- [ ] ¿Componente no existe?
- [ ] Crear/habilitar según caso

### Sprint 5B: Feature Generar Cuadrante (#21)
**Estimación:** 1-2 días
**Dependencia:** Sprint 1A + 2A
**Acciones:**
- [ ] Una vez Week view funciona: Testear generador
- [ ] Verificar SMART Schedule Engine
- [ ] Test creación de shifts automáticos

---

## 📋 ROADMAP TEMPORAL

```
Semana 1:
  Lunes-Martes:   Sprint 1A (Week view)
  Miércoles:      Sprint 1B (/cuadrante)
  Jueves:         Sprint 2A (Shifts en BD)
  Viernes:        Sprint 2B-E (Data + Rutas)

Semana 2:
  Lunes-Martes:   Sprint 3A-F (UX/UI)
  Miércoles:      Sprint 4A-C (Arquitectura)
  Jueves:         Sprint 5A-B (Config)
  Viernes:        Testing integral

TOTAL: 2 semanas (10 días de trabajo)
```

---

## ✅ CRITERIOS DE ACEPTACIÓN FINALES

**Funcionalidad Core:**
- [ ] Week view muestra empleados y shifts
- [ ] /cuadrante accessible sin errores
- [ ] Shifts visibles en todas las vistas
- [ ] Data integridad: emails, teléfono, ubicación

**UX/UI:**
- [ ] Timeline legible en todos los tamaños
- [ ] Filtros claros e intuitivos
- [ ] Modales informativos
- [ ] Estados empleados claros

**Arquitectura:**
- [ ] Rutas consistentes
- [ ] Data loading predecible
- [ ] localStorage limpio
- [ ] localStorage limpio

**Documentación:**
- [ ] Todos los términos documentados (HBNO, etc)
- [ ] Estados empleados explicados
- [ ] Configuración accesible

---

## 🚀 NEXT STEPS

1. **Aprobación:** Confirmar prioridades
2. **Sprint 1A:** Iniciar Week view investigation
3. **Daily standups:** Reportar progreso
4. **Testing:** Validar cada sprint
5. **Documentación:** Actualizar al resolver

---

**Prioridad Máxima:** Críticos DEBEN estar done antes de Graves
**Flexibilidad:** Moderados pueden parallelizarse
**Dependencias:** Respetar chains marcadas

Waiting for approval to start execution. 🎯
