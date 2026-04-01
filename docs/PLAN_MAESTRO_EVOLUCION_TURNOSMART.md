# PLAN MAESTRO DE EVOLUCIÓN — TurnoSmart®

**Validado por:** Jose Galvan (Product Owner) + Claude (Senior HR Project Leader)
**Fecha validación:** 31 marzo 2026
**Estado:** ✅ COMPLETADO — Tier 1+2 al 100%, Tier 3 al 56%, Bugs QA 7/7 resueltos
**Última actualización:** 1 abril 2026

---

## RESUMEN

| Categoría | Items | Esfuerzo | Estado |
|-----------|-------|----------|--------|
| ✅ Ya incluido 100% | 14 ideas | 0 días | Confirmado |
| 🚀 Tier 1 (quick wins) | 9 features | ~8-10 días | ✅ COMPLETADO |
| 🎯 Tier 2 (medio plazo) | 10 features | ~25-33 días | ✅ COMPLETADO |
| 🔮 Tier 3 (post-lanzamiento) | 9 features | ~18-22 días | 5/9 completados |
| ❌ No recomendado | 5 items | Ahorro ~5-6 sem | Descartado |

---

## PARTE A: IDEAS 100% YA INCLUIDAS ✅

1. Seniority levels: Jefes=3, 2ndos=2, Agentes=1
2. Puestos predefinidos para Recepción (FOM, AFOM, Night, GEX, FDA)
3. Paquete ausencias predefinidas (D, V, E, F, DG, DB, PM, PC)
4. Drag & Drop de Shift Cards (mover, duplicar, eliminar)
5. AFOM aprovecha FDS largo cuando FOM tiene guardia
6. Cobertura mínima: siempre ≥1 FDA en M y T
7. Tipo A (petición dura) inamovible en las 3 alternativas
8. Exportación iCal/PDF/Excel funcional
9. Zona favoritos = navaja suiza del manager
10. Quitar empleado del calendario sin borrar datos
11. Crear puesto → disponible para asociar a empleado
12. Pausas con icono de taza en Shift Card
13. "Descanso Semanal" como favorito del sistema no eliminable
14. Concepto "anclar" turnos fijos antes de generar

---

## TIER 1 — QUICK WINS DE ALTO IMPACTO 🚀

### T1-1. Cobertura mínima configurable por UI
- **Qué:** Formulario en Settings > Criterios SMART donde el manager define M:2, T:2, N:1
- **Dónde:** `CriteriaConfigDialog` + `schedule_criteria` + Phase 07 `ensureCoverage`
- **Esfuerzo:** 1-2 días
- **Estado:** [x] Completado

### T1-2. Kit horarios precargados en onboarding
- **Qué:** Al completar onboarding, insertar M/T/N/11x19/9x17/12x20/G en saved_shifts con colores y pausas 30min
- **Dónde:** Onboarding wizard + `saved_shifts` table
- **Esfuerzo:** 1 día
- **Estado:** [x] Completado

### T1-3. Umbral noches consecutivas >4
- **Qué:** Cambiar default de 3 a 4 en alerta blanda de noches consecutivas
- **Dónde:** `src/utils/engine/constants.ts`
- **Esfuerzo:** 5 minutos
- **Estado:** [x] Completado

### T1-4. Bloquear celdas con candado
- **Qué:** Clic derecho → "Bloquear turno" → icono candado → motor respeta al regenerar
- **Dónde:** `GoogleCalendarStyle.tsx` (UI) + `ShiftBlock` type + Phase 03 `anchorFixed`
- **Esfuerzo:** 1-2 días
- **Estado:** [x] Completado

### T1-5. UX botón Generar contextualizado + date picker
- **Qué:** Botón "Generar Abril 2026" + date picker en Step 1 del wizard + botón en todas las vistas
- **Dónde:** `UnifiedCalendarHeader` + `GenerateScheduleWizard`
- **Esfuerzo:** 1-2 días
- **Estado:** [x] Completado

### T1-6. Unificar L → D
- **Qué:** Eliminar código "L" (Libre), dejar solo "D" (Descanso) en todo el codebase
- **Dónde:** Grep exhaustivo → migración SQL → constants → UI labels
- **Esfuerzo:** 1 día
- **Estado:** [x] Completado

### T1-7. Botón restaurar kit por defecto + anti-duplicado
- **Qué:** Botón "↻ Restaurar horarios base" en favoritos, verifica duplicados por código
- **Dónde:** Zona de favoritos en `GoogleCalendarStyle.tsx`
- **Esfuerzo:** 0.5 días
- **Estado:** [x] Completado

### T1-8. Orden empleados persistente cross-vista
- **Qué:** Guardar orden en localStorage con key compartida, todas las vistas la leen
- **Dónde:** Calendar views + localStorage `employeeOrder_${orgId}`
- **Esfuerzo:** 0.5 días
- **Estado:** [x] Completado

### T1-9. Emails invitación personalizados
- **Qué:** Templates HTML con branding TurnoSmart en español para Supabase Auth
- **Dónde:** `supabase/config.toml` + templates HTML
- **Esfuerzo:** 1 día
- **Estado:** [x] Completado

---

## TIER 2 — FEATURES DE MEDIO PLAZO 🎯

### T2-1. Copilot de Auditoría (sugerir fixes)
- **Qué:** Botón "Resolver" en cada alerta con sugerencia automática
- **Dónde:** Phase 09 `audit` + `suggestedFix` + UI panel auditoría
- **Esfuerzo:** 2-3 días
- **Estado:** [x] Completado

### T2-2. Copilot de Pre-Generación (checklist criterios)
- **Qué:** Checklist inteligente en Wizard Step 5: peticiones, ocupación, horas, roles
- **Dónde:** `GenerateScheduleWizard` Step 5
- **Esfuerzo:** 2 días
- **Estado:** [x] Completado

### T2-3. Calculadora plantilla bruta/activa/presencial (B5)
- **Qué:** Widget con fórmulas RRHH: Bruta → Vacaciones → Activa → Presencial + alertas
- **Dónde:** Dashboard FOM + Wizard Step 5 + Auditoría
- **Esfuerzo:** 3-4 días
- **Estado:** [x] Completado

### T2-4. Peticiones desde vista empleado (C17)
- **Qué:** Formulario simplificado en /mi-espacio: Vacaciones/Preferencia/Intercambio
- **Dónde:** Dashboard empleado + `schedule_petitions`
- **Esfuerzo:** 2-3 días
- **Estado:** [x] Completado

### T2-5. Templates de organización (B2)
- **Qué:** JSON de templates por sector, spinner cantidad por rol, onboarding inteligente
- **Dónde:** `orgTemplates.ts` + Onboarding wizard Pasos 1-3
- **Esfuerzo:** 4-5 días
- **Estado:** [x] Completado

### T2-6. Días debidos por guardia → acumulación (C7)
- **Qué:** No auto-asignar libre tras guardia, acumular en dg_balance, manager decide
- **Dónde:** Phase 03 + `employee_equity.dg_balance` + UI ficha FOM
- **Esfuerzo:** 2 días
- **Estado:** [x] Completado

### T2-7. Tour onboarding (B3)
- **Qué:** 5 tooltips guiados la primera vez que el usuario accede al calendario
- **Dónde:** Librería react-joyride o similar + calendario
- **Esfuerzo:** 1-2 días
- **Estado:** [x] Completado

### T2-8. Auto-refuerzo inteligente por ocupación (B12)
- **Qué:** Phase 07 auto-asigna FDA disponible en días de pico si hay recurso
- **Dónde:** Phase 07 `ensureCoverage` + datos `daily_occupancy`
- **Esfuerzo:** 2-3 días
- **Estado:** [x] Completado

### T2-9. Visualizar período anterior (C9)
- **Qué:** Panel resumen en Wizard Step 5: último turno de cada empleado + noches acumuladas
- **Dónde:** `GenerateScheduleWizard` Step 5 + query DB período anterior
- **Esfuerzo:** 2 días
- **Estado:** [x] Completado

### T2-10. Modo edición delegable FOM→AFOM (C1)
- **Qué:** Toggle en ficha empleado: "Delegación de edición" con fechas o manual
- **Dónde:** Ficha empleado + RBAC guards + `schedule_edit_log`
- **Esfuerzo:** 2-3 días
- **Estado:** [x] Completado

---

## TIER 3 — EVOLUCIONES FUTURAS 🔮

### T3-1. CSV/Excel parsing mejorado para ocupación — ⚠️ Parcial (CSV/TSV OK, Excel .xlsx pendiente)
### T3-2. Tablet Friendly Mode (Fase 1 responsive) — ⚠️ Parcial (Tailwind responsive, touch pending)
### T3-3. Paleta colores progresiva (pastel claro→oscuro) — ✅ Completado
### T3-4. Vista diaria desde primer turno — ✅ Completado (DayView con zoom + time grid)
### T3-5. Landing bienvenida empleado — ✅ Completado (WelcomeDashboard personalizado)
### T3-6. Sugerir vacaciones en baja operativa — ⬜ Pendiente (necesita data producción)
### T3-7. Analítica comportamiento peticiones — ⬜ Pendiente (necesita historial real)
### T3-8. Notas → SMART tags (keywords estructurados) — ⬜ Pendiente
### T3-9. OCR foto PMS (feature premium) — ⬜ Pendiente

---

## NO RECOMENDADO ❌

1. **Copilot Conversacional Completo (chat NLP)** — Overengineering, valor se logra con B1-A y B1-B
2. **NLP en notas con IA** — Riesgo de alucinación, tags estructurados son más seguros
3. **Unificar App Roles y Seniority** — Son conceptos diferentes y complementarios
4. **Eliminar sección Exportar** — Necesidad real del día a día hotelero
5. **Eliminar campos RRHH del formulario** — Solo ocultar/colapsar, no eliminar

---

## DEUDA DE PLANES ANTERIORES (revisado 2026-03-31)

Los siguientes planes existían antes del Plan Maestro. Se revisan y absorben:

### Plan `radiant-imagining-muffin.md` — Algoritmo SMART v2.0
- ✅ Fase 1 MVP Engine — COMPLETADA
- ✅ Fase 2 Alternativas + Score UI — COMPLETADA
- ✅ Fase 3 Continuidad + Equidad — COMPLETADA
  - `lastWeek` carga últimos 3 días del período anterior desde calendar_shifts (2026-04-01)
- ✅ Fase 4 Peticiones + GEX + Ocupación — COMPLETADA
- ✅ Fase 5 Wizard UX + Post-Pub — COMPLETADA
- ✅ Fase 6 SMART+IA — COMPLETADA

### Plan `lucky-cooking-breeze.md` — Datos reales DB al Wizard
- ✅ COMPLETADO 100%

### Plan `lucky-cooking-breeze-agent.md` — Gaps A-D + Phase 5
- ✅ Step 1-7 — COMPLETADOS
- ✅ Step 8 Publish Notifications — COMPLETADO
  - Edge Function `notify-calendar-published` + insert en tabla `notifications` al publicar
- ✅ Step 9 Version History Expansion — COMPLETADO
  - VersionHistoryDialog con pestaña "Versiones" + "Generaciones SMART"

---

## BUGS Y QA — RESUELTOS ✅ (2026-04-01)

- [x] Favoritos desaparecen al navegar → Cache v2.2 con invalidation fix
- [x] Clic en alerta de auditoría no reacciona → onViolationClick + scrollIntoView + ring highlight
- [x] Cobertura insuficiente noche 23 marzo → CK-08 fix: 11x19 cuenta como M coverage
- [x] Botón Guardar manual → Verificado funcional (forceSave wired)
- [x] Botón Generar presente en TODAS las vistas → Restringido a week/month
- [x] Peticiones "?" nombres de empleado → JOIN con colaboradores en usePetitions
- [x] Audit "Exceso horas 152h/40h" → contractHours escalado al período visible (semanas)

---

*Documento de referencia. Actualizar conforme se completan features.*
