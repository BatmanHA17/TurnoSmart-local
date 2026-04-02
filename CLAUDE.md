# TurnoSmart® — CLAUDE.md

## Proyecto
Generador SMART de cuadrantes de turnos multi-sector.
Stack: Vite + React 18 + TypeScript + Supabase + shadcn/ui + Tailwind.

## Producción (desplegado 2026-04-02)
- **App:** `https://turno-smart-local.vercel.app`
- **Supabase Cloud:** `povgwdbnyqdcygedcijl` (Frankfurt eu-central-1)
- **Deploy:** Auto CI/CD GitHub `main` → Vercel (~25s build)
- **Dominio:** `turnosmart.app` → redirect 307 → `www.turnosmart.app` (IONOS DNS → Vercel, SSL activo)
- **Admin:** goturnosmart@gmail.com / TurnoSmart2026! (super_admin)
- **Manager:** jmgalvan@telefonica.net / TurnoSmart2026! (fom)
- **Org cloud:** "Recepción" (`99c21a44-a760-4fc2-a0ad-152cf5d3d77f`)

## Comandos esenciales
```bash
npm run dev              # Dev server → localhost:8082
npm run build            # Build producción
npx tsc --noEmit         # Type check (SIEMPRE antes de commit)
supabase db reset        # Reset DB local + aplica migraciones + seed.sql
supabase start --ignore-health-check  # Storage puede estar unhealthy, ignorar
git push origin main     # Auto-deploy a Vercel
```

## Motor SMART v2.0
Pipeline 10 fases en `src/utils/engine/`:
1. resolveRoles → 2. loadContinuity → 3. anchorFixed → 4. assignRestDays
→ lockSurvivingFixedShifts → 5. assignGEX → 6. assignRotating (dual-pass)
→ 7. ensureCoverage → 8. applyPetitions → 9. audit (16 checks) → 10. score (legal integrado)

Se ejecuta 3× con weight profiles → 3 alternativas (Equilibrio/Peticiones/Cobertura).
Hook: `src/hooks/useSmartGenerateV2.ts` | Wizard: `src/components/calendar/GenerateScheduleWizard.tsx`

Peticiones y ocupación se cargan desde DB en `useSmartGenerateV2` (líneas 171-223).
El wizard Step 5 muestra detalle real de peticiones por tipo + resumen de ocupación.

## SMART+IA (Fase 6)
Detección proactiva de patrones en `src/utils/engine/smartIA.ts`:
- SM-01: Turnos ad-hoc frecuentes → proponer como favorito
- SM-02: Peticiones recurrentes → proponer tipo D permanente
- SM-09: Alerta 80% vacaciones consumidas
- SM-10: Transiciones T→M → proponer 11×19
Hook: `src/hooks/useSmartSuggestions.ts` | Panel: `src/components/calendar/SmartSuggestionsPanel.tsx`

## Componentes post-publicación (Fase 5)
| Componente | Función |
|------------|---------|
| `ConflictResolutionDialog` | Swap/ForceMajeure/Dismiss al editar turno publicado |
| `useEditLog` | Registro cambios post-pub + indicador azul en celdas |
| `CriteriaConfigDialog` | Criterios SMART (obligatorios/opcionales + boost) |
| `PetitionsListPanel` + `PetitionFormDialog` | CRUD peticiones tipo A/B/C/D |
| `OccupancyImportDialog` | Input manual + CSV de check-in/check-out |
| `SmartSuggestionsPanel` | Panel SMART+IA con sugerencias proactivas |

Todos integrados en `GoogleCalendarStyle.tsx` y accesibles desde `UnifiedCalendarHeader`.

## 5 Roles (SIEMPRE usar roles, NUNCA nombres personales)
| Rol | Tipo Motor | Regla clave |
|-----|-----------|-------------|
| FOM | FIJO_NO_ROTA | M fijo L-V. Libra S+D SIEMPRE. Guardias (G) solo FOM, via wizard. Max 2 fds/mes. |
| AFOM | COBERTURA | Espejo FOM: M→T, D→cubre(M), G→libra(D). NUNCA hace G. |
| Night Agent | FIJO_NO_ROTA | N fijo. No penalizar noches consecutivas en audit. |
| GEX | ROTA_PARCIAL | Solo 9x17/12x20 según ocupación real de DB. No entra en M/T/N. |
| Front Desk Agent | ROTA_COMPLETO | Rotación M/T/N ~5 días/semana. Cubre noches del Night Agent. |

## Reglas inamovibles
- **DOBLE CHECK** — Verificar si ya existe antes de implementar
- **CERO menciones a la competencia** — En código/commits = "la Competencia", nunca el nombre real
- **ONE PROBLEM AT A TIME** — No saltar entre features sin terminar el actual
- **DB → Frontend → Test** — Siempre en ese orden
- **Tono** — Informal, directo, sin adulaciones. El usuario sabe lo que quiere.

## Supabase
### Local (desarrollo)
- DB: `localhost:54322` | Auth: `localhost:54321` | Studio: `localhost:54323` | Mailpit: `localhost:54324`
- Admin: `goturnosmart@gmail.com` (super_admin, bypass RLS, magic link via Inbucket/Mailpit)
- Container DB: `supabase_db_TurnoSmart-local`

### Cloud (producción)
- Proyecto: `povgwdbnyqdcygedcijl` (Frankfurt eu-central-1)
- Env vars en Vercel: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
- `.env.production` está en .gitignore — Vercel env vars son fuente de verdad

### Schema compartido
- `app_role_canonical` enum: OWNER, ADMIN, USER, GUEST — NO existe MANAGER
- Tabla empleados: `colaboradores` (no `employees`), columna `org_id` (no `organization_id`)
- Tabla membresías: `memberships` (no `organization_members`), columna `org_id`
- Vista: `colaborador_full` (unifica datos para listado)
- RPCs clave: `get_turnosmart_role`, `get_user_organizations`, `get_colaborador_for_user`
- Tablas engine: `schedule_petitions`, `daily_occupancy`, `schedule_criteria`, `schedule_edit_log`, `employee_equity`, `schedule_generations`

## Seed
7 empleados por ROL: FOM, AFOM, Night Agent, GEX, Front Desk 1/2/3.
Equity feb-2026, 3 peticiones (tipos A/B), 31 días ocupación marzo-2026.

## Ley laboral (España, Hostelería Cádiz)
- 12h mínimo entre jornadas (T→M prohibido, 11x19 como transición)
- 2 libres consecutivos/semana (excepción con doble confirmación)
- 40h semanales (futura reforma 37.5h)
- 48 días vacaciones/año (30 naturales + 18 festivos)
- N → siguiente día libre (solo ROTA_COMPLETO, no Night Agent fijo)

## Archivos clave
- Engine: `src/utils/engine/` (pipeline.ts, phases/, types.ts, constants.ts, helpers.ts, smartIA.ts)
- Calendario: `src/components/GoogleCalendarStyle.tsx` (archivo principal, ~4300 líneas)
- Header: `src/components/calendar/UnifiedCalendarHeader.tsx` (toolbar unificado)
- Wizard: `src/components/calendar/GenerateScheduleWizard.tsx` (7 pasos, Step 5 con detalle real)
- Migraciones: `supabase/migrations/` (24+ archivos, orden cronológico)
- Ruta calendario: `/turnosmart/create-shift` (renderiza GoogleCalendarStyle)
- Memoria proyecto: @~/.claude/projects/-Users-josegalvan-Library-Mobile-Documents-iCloud-md-obsidian-Documents/memory/project_turnosmart_smart_algorithm.md
- Plan maestro: `docs/PLAN_MAESTRO_EVOLUCION_TURNOSMART.md` (Tier 1-3, validado PO 2026-03-31)
- Guía usuario: `docs/GUIA_USUARIO_GENERACION_TURNOS.md` (v1.0, 20 secciones)
- Guía con notas PO: `docs/GUIA_USUARIO_GENERACION_TURNOS_CON_MIS_NOTAS.md` (anotaciones José)
- Excel criterios: `/Users/josegalvan/Desktop/TurnoSmart_Criterios_SMART.xlsx` (4 hojas, 92 criterios)

## RBAC (2026-03-31)
- 3 niveles: `super_admin` | `fom` (FOM/AFOM=ADMIN) | `empleado` (USER)
- `colaboradores.user_id` → vincula empleados con auth.users
- `get_turnosmart_role(uid, org_id)` RPC devuelve nivel TurnoSmart
- `useTurnoSmartRole` hook + `RoleGuard` component
- Sidebar diferenciado: empleado ve "Mi Espacio", FOM ve "Gestión"
- Rutas protegidas: Colaboradores, HR, Settings, Nóminas requieren `fom`
- RLS endurecido: empleados solo ven/crean sus peticiones, FOM gestiona todo

## Plan Maestro de Evolución (Validado 2026-03-31)
Documento completo: `docs/PLAN_MAESTRO_EVOLUCION_TURNOSMART.md`
Guía usuario con notas PO: `docs/GUIA_USUARIO_GENERACION_TURNOS_CON_MIS_NOTAS.md`

### Tier 1 — Quick Wins (8-10 días) ✅ COMPLETADO
1. **T1-1** Cobertura mínima configurable por UI (M:2, T:2, N:1) → CriteriaConfigDialog + Phase 07
2. **T1-2** Kit horarios precargados en onboarding (M/T/N/11x19/9x17/12x20/G con pausas 30min)
3. **T1-3** Umbral noches consecutivas 3→4 en constants.ts
4. **T1-4** Bloquear celdas con candado (clic derecho → lock → motor respeta)
5. **T1-5** UX botón Generar contextualizado ("Generar Abril 2026") + date picker Step 1
6. **T1-6** Unificar L→D en todo el codebase (eliminar duplicidad Libre/Descanso)
7. **T1-7** Botón restaurar kit por defecto en favoritos + toast anti-duplicado
8. **T1-8** Orden empleados persistente cross-vista (localStorage compartido)
9. **T1-9** Emails invitación personalizados (branding TurnoSmart español)

### Tier 2 — Medio Plazo (25-33 días) 🎯
1. **T2-1** ~~Copilot Auditoría (botón "Resolver" con sugerencia automática por alerta)~~ ✅ `778074e`
2. **T2-2** ~~Copilot Pre-Generación (checklist criterios en Wizard Step 5)~~ ✅ `3c57aac` — CriteriaSummaryCard + 8-point checklist
3. **T2-3** ~~Calculadora plantilla bruta/activa/presencial (widget + alertas RRHH)~~ ✅ `447e4ae` — HR Home con datos reales + PlantillaCalculator en header + wizard
4. **T2-4** Peticiones desde vista empleado (/mi-espacio autoservicio)
5. **T2-5** ~~Templates de organización (onboarding inteligente por sector)~~ ✅ Ya implementado — wizardTemplates.ts con 6 sectores + genérico
6. **T2-6** ~~Días debidos guardia → acumulación en dg_balance (no auto-asignar)~~ ✅ `10cde51` — engine acumula + UI muestra DG/DB
7. **T2-7** ~~Tour onboarding (5 tooltips)~~ ✅ Ya implementado — OnboardingTour.tsx custom (sin react-joyride)
8. **T2-8** ~~Auto-refuerzo inteligente por ocupación (Phase 07 + daily_occupancy)~~ ✅ Ya implementado — ensureCoverage PASADA 2
9. **T2-9** ~~Visualizar período anterior (panel resumen Wizard Step 5)~~ ✅ `0b6e700` — loads from employee_equity DB
10. **T2-10** ~~Modo edición delegable FOM→AFOM (toggle + fechas)~~ ✅ Ya implementado — DelegationToggle + useTurnoSmartRole isDelegated

### Tier 3 — Post-Lanzamiento 🔮 (8/9 completados)
- ~~CSV/Excel parsing mejorado~~ ✅ `1a50c01` — xlsx dynamic import + unified parser
- ~~Tablet Mode~~ ⚠️ Responsive OK, touch gestures pendiente
- ~~Paleta colores pastel progresiva~~ ✅ Ya implementado
- ~~Vista diaria optimizada~~ ✅ Ya implementado (DayView.tsx)
- ~~Landing bienvenida empleado~~ ✅ Ya implementado (WelcomeDashboard.tsx)
- ~~Sugerir vacaciones en baja ocupación~~ ✅ `588fdc7` — SM-11 wired into useSmartSuggestions
- ~~Analítica peticiones~~ ✅ `ccb28f7` — PetitionAnalyticsCard
- ~~SMART tags en notas~~ ✅ `9c1d698` — tag dots en celdas calendario
- OCR foto PMS — pendiente (futuro)

### Descartado ❌
Copilot chat NLP completo, NLP en notas, Unificar roles/seniority, Eliminar exportación, Eliminar campos RRHH

## Pendiente técnico (deuda anterior)
- **Continuidad cross-período** — Phase 02 falta `lastWeek` (absorbido por T2-9)
- **Dashboard Empleado** — Conectar con datos reales (absorbido por T2-4 peticiones empleado)
- **Escalonar libres** — evitar que todos libren el mismo día
- **Scores bajos** — fórmula scoring necesita ajuste fino
- **Notificaciones publicación** — in-app por empleado al publicar (Step 8 plan anterior)
- **Version History detallado** — pestaña Generaciones SMART (Step 9 plan anterior)

## ═══════════════════════════════════════════════════════
## REGISTRO MAESTRO DE BUGS — TurnoSmart
## ═══════════════════════════════════════════════════════

### 🔴 BUGS PRODUCCIÓN — PENDIENTES (Smoke Test 2026-04-02)
| # | Bug | Archivo/Zona | Severidad | Origen |
|---|-----|-------------|-----------|--------|
| P1 | ~~**Motor genera con 0 empleados**~~ — bloqueado en Wizard + guard en hook | Wizard / engine | ✅ Fix `b6b33b2` | Smoke test |
| P2 | ~~**"Revisar" en Step 7 no abre auditoría**~~ — panel violaciones expandible + Copilot Wrench | Wizard Step 7 | ✅ Fix `778074e` | Smoke test |
| P3 | ~~**Dropdown empleados vacío en Peticiones**~~ | Panel Peticiones | ✅ Fix `856ff75` | Smoke test |
| P4 | ~~**"Error al cargar datos de analítica"**~~ | `/mi-actividad` | ✅ Fix `8d7dc47` | Smoke test |
| P5 | ~~**HR Home fechas hardcoded 2025**~~ | `HRResumen.tsx` | ✅ Fix `8d7dc47` | Smoke test SA |
| P6 | ~~**Console errors cascada**~~ — silenciados useUserRole + useUserProfile | hooks legacy | ✅ Fix `b6b33b2` | Smoke test SA |
| P7 | ~~**Tablas cloud faltantes**~~ — graceful degradation en useShiftAudit + HRAuditPolicies | useShiftAudit / HRAuditPolicies | ✅ Fix `e20a495` | Smoke test SA |
| P8 | ~~**Dashboard sin RBAC**~~ | `/dashboard` | ✅ Fix `310a6bf` | Smoke test FOM |
| P9 | ~~**Dashboard "permisos completos"**~~ | `/dashboard` | ✅ Fix `310a6bf` | Smoke test FOM |
| P10 | ~~**Dashboard datos ficticios**~~ — resuelto por P8/P9 (nadie llega a DashboardAdministrator) | `/dashboard` | ✅ Fix `310a6bf` | Smoke test FOM |
| P11 | ~~**"Ver mi perfil" roto**~~ | Menú avatar | ✅ Fix `310a6bf` | Smoke test FOM |
| P12 | ~~**Rol colaborador muestra "Empleado"**~~ | ColaboradoresView | ✅ Fix `0563088` | Smoke test FOM |
| P13 | ~~**Usuarios auth sin profile NO pueden login**~~ | Auth.tsx | ✅ Fix `310a6bf` | Smoke test Empleado |
| P14 | ~~**"Iniciar sesión" link es loop**~~ | Auth.tsx | ✅ Fix `310a6bf` | Smoke test Empleado |
| P15 | ~~**404 ruta legacy `/turnosmart/colaboradores`**~~ — añadido redirect a /turnosmart/collaborators | AppRoutes | ✅ Fix `e20a495` | Console Empleado |
| P16 | ~~**Perfil colaborador "Cargando..." infinito**~~ | useColaboradorFull | ✅ Fix `0563088` | Verificación P11 |

### 🟡 BUGS QA — PENDIENTES (Revisión guía usuario 2026-03-31)
| # | Bug | Archivo/Zona | Severidad |
|---|-----|-------------|-----------|
| Q1 | ~~Favoritos desaparecen al navegar~~ — useLocalStorageCleanup borraba favorites en cada mount | useLocalStorageCleanup + useFavoriteShifts | ✅ Fix `a92a69b` |
| Q2 | Clic en alerta auditoría no navega a celda | Audit UI | 🟡 Menor |
| Q3 | Cobertura insuficiente noche 23 marzo | Engine lógica vs bug | 🟡 Verificar |
| Q4 | Botón Guardar manual — verificar funcionalidad | Calendario toolbar | 🟡 Verificar |
| Q5 | ~~Botón Generar presente en TODAS las vistas~~ — verificado: canEdit=false para empleados, OK | Calendario toolbar | ✅ No-bug |
| Q6 | ~~Peticiones "?" nombres de empleado~~ | usePetitions.ts | ✅ Fix `134b2a4` |
| Q7 | ~~Audit "Exceso horas 152h/40h" falso~~ | GoogleCalendarStyle.tsx | ✅ Fix `134b2a4` |
| Q8 | Notificaciones in-app al publicar cuadrante | Step 8 plan, parcial | 🟡 Feature |
| Q9 | Version History "Generaciones SMART" | Step 9 plan, parcial | 🟡 Feature |

### ✅ BUGS CORREGIDOS (2026-04-02)
| # | Bug | Fix | Commit |
|---|-----|-----|--------|
| F1 | Race condition `useTurnoSmartRole` — resolvía "empleado" antes de cargar org | Añadido `orgLoading` check | `7101e28` |
| F2 | Filtro status `activo` vs `active` en ColaboradoresView | Aceptar ambos idiomas | `7132701` |
| F3 | Profiles table sin `first_name`, `last_name`, `avatar_url` | ALTER TABLE en cloud | SQL directo |
| F4 | Fake Supabase anon key en `.env.production` | Reemplazada con JWT real | manual |
| F5 | Hardcoded email whitelist en Auth.tsx | Eliminado | `ea9d780` |
| F6 | **P13** Auth bloqueaba users sin profile | Siempre mostrar password step, Supabase Auth valida | `310a6bf` |
| F7 | **P14** "Iniciar sesión" link loop | Cambiado texto + href a `/auth?mode=register` | `310a6bf` |
| F8 | **P8/P9** Dashboard sin RBAC — FOM veía panel Super Admin | RoleBasedDashboard usa useTurnoSmartRole | `310a6bf` |
| F9 | **P11** "Ver mi perfil" → `/collaborators/:id` literal | Navega a ruta correcta + ColaboradorRedirect helper | `310a6bf` |
| F10 | **P16** Perfil colaborador "Cargando..." infinito | setLoading(false) en 3 early returns de useColaboradorById | `0563088` |
| F11 | **P12** Rol muestra "Empleado" en vez de FOM | Fallback a memberships.app_role cuando colaborador_roles vacía | `0563088` |
| F12 | **P3** Dropdown empleados vacío en Peticiones | Fix .or() syntax inválida en query PostgREST | `856ff75` |
| F13 | **P4** "Error al cargar datos de analítica" | Graceful degradation — absence_requests faltante no crashea | `8d7dc47` |
| F14 | **P5** HR Home fechas hardcoded 2025 | Fechas dinámicas mes actual | `8d7dc47` |
| F15 | **P1** Motor genera con 0 empleados | Wizard bloquea Step 5 + guard en hook | `b6b33b2` |
| F16 | **P6** Console errors cascada legacy | Silenciado useUserRole/useUserProfile | `b6b33b2` |
| F17 | **P7** Tablas cloud faltantes (coverage_policies, employee_restrictions, audit_policies) | Graceful degradation con try/catch independientes | `e20a495` |
| F18 | **P15** 404 ruta legacy /turnosmart/colaboradores | Redirect a /turnosmart/collaborators | `e20a495` |
| F19 | **Q6** Peticiones "?" nombres de empleado | Fallback a "Empleado <id>" cuando FK huérfana | `134b2a4` |
| F20 | **Q7** Audit "Exceso horas 152h/40h" falso positivo | Usar rango real de fechas para calcular semanas, no solo días con turnos | `134b2a4` |
| F21 | **Q1** Favoritos desaparecen al navegar | useLocalStorageCleanup no borra favorites + filtro absence relajado + showFavorites persiste | `a92a69b` |

### ✅ SMOKE TEST SUPER ADMIN — VERIFICADOS OK (2026-04-02)
Login, Calendario, Equipo, HR, Analítica, Settings, Wizard SMART, Criterios SMART,
Peticiones, SMART+IA, Auditoría, Exportar, Historial, Notificaciones, Menú usuario,
Limpiar Turnos, Ocupación, Horarios rotativos, Balance anual (20+ secciones)

### ✅ SMOKE TEST MANAGER/FOM — jmgalvan@telefonica.net (2026-04-02)
- ✅ Login password funciona
- ✅ Calendario/Turnos (mismo acceso que SA, correcto para FOM)
- ✅ Equipo (ve colaboradores, botones Invitar/Añadir)
- ✅ HR Home (acceso completo, correcto para FOM)
- ✅ Analítica (mismo error P4 de carga datos)
- ✅ Notificaciones, menú avatar funcional
- ⚠️ Dashboard `/dashboard` muestra panel Super Admin (P8/P9) — BUG RBAC GRAVE
- ⚠️ "Ver mi perfil" → `/collaborators/:id` sin resolver (P11)
- ⚠️ Rol muestra "Empleado" en vez de FOM/Manager (P12)

### 🔴 SMOKE TEST EMPLEADO — calltobatman@gmail.com + sendtogalvan@gmail.com (2026-04-02)
- 🔴 **BLOQUEADOS** — Ambos usuarios existen en Supabase Auth pero NO tienen profile ni colaborador
- 🔴 Auth.tsx `checkIfUserExists()` busca en `profiles` + `colaboradores`, NO en `auth.users`
- 🔴 Resultado: "No encontramos esta cuenta" → no pueden ni siquiera acceder al campo de password
- 🔴 El enlace "Iniciar sesión" apunta a `/auth` (misma página), no hay toggle a modo login
- ⚠️ Console: mismos errores legacy (useUserRole, useUserProfile) + 404 `/turnosmart/colaboradores`
- 📋 **Conclusión**: El flujo de onboarding de empleados está ROTO. Un empleado invitado/creado en Auth sin profile+colaborador no puede acceder a la app.

### 🔲 PENDIENTE DE PROBAR
- Añadir colaborador (botón en Equipo)
- Invitar colaborador (email)
- Dominio turnosmart.app (IONOS → Vercel)

## Deuda Técnica Producción
- Consolidar `useCurrentOrganization` (2 archivos .ts y .tsx con diferente API, riesgo de confusión)
- Limpiar hooks legacy (`useUserRole.tsx`, `useUserProfile.tsx`) que generan errores en console
- Migrar tablas faltantes a cloud (`coverage_policies`, `employee_restrictions`)
- Conectar dominio `turnosmart.app` (IONOS → Vercel DNS)
- Rutas: Colaboradores = `/turnosmart/collaborators` (inglés), Nav "Equipo" → `/colaboradores` → redirect

## Gotchas
- `apellidos` puede ser NULL → usar `${nombre}${apellidos ? ' ' + apellidos : ''}` no template literal directo
- `engineOutputToBlocks` debe skip D/rest blocks (hours=0) para evitar duplicados visuales
- `turnos_publicos` es tabla legacy que no existe → error de publicación conocido, no bloquea
- Phase 06 necesita dual-pass: (1) coverage mínima, (2) employee-driven para llenar días
- Después de `supabase db reset`, la sesión auth se pierde → reinyectar token o re-login via Mailpit
- Puerto real de Vite: **8082** (no 8085)
