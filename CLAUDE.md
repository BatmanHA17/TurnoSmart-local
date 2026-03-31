# TurnoSmart® — CLAUDE.md

## Proyecto
Generador SMART de cuadrantes de turnos para hoteles (Recepción).
Stack: Vite + React 18 + TypeScript + Supabase local + shadcn/ui + Tailwind.

## Comandos esenciales
```bash
npm run dev              # Dev server → localhost:8082
npm run build            # Build producción
npx tsc --noEmit         # Type check (SIEMPRE antes de commit)
supabase db reset        # Reset DB + aplica migraciones + seed.sql
supabase start --ignore-health-check  # Storage puede estar unhealthy, ignorar
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

## Supabase local
- DB: `localhost:54322` | Auth: `localhost:54321` | Studio: `localhost:54323` | Mailpit: `localhost:54324`
- Admin: `goturnosmart@gmail.com` (super_admin, bypass RLS, magic link via Inbucket/Mailpit)
- Container DB: `supabase_db_TurnoSmart-local`
- `app_role_canonical` enum: OWNER, ADMIN, USER, GUEST — NO existe MANAGER
- Tabla empleados: `colaboradores` (no `employees`)
- Tabla membresías: `memberships` (no `organization_members`), columna `org_id` (no `organization_id`)
- Tablas engine: `schedule_petitions`, `daily_occupancy`, `schedule_criteria`, `schedule_edit_log`, `employee_equity` (+ db_balance, dg_balance, overtime_hours_accumulated), `schedule_generations`

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
- Excel criterios: `/Users/josegalvan/Desktop/TurnoSmart_Criterios_SMART.xlsx` (4 hojas, 92 criterios)

## RBAC (2026-03-31)
- 3 niveles: `super_admin` | `fom` (FOM/AFOM=ADMIN) | `empleado` (USER)
- `colaboradores.user_id` → vincula empleados con auth.users
- `get_turnosmart_role(uid, org_id)` RPC devuelve nivel TurnoSmart
- `useTurnoSmartRole` hook + `RoleGuard` component
- Sidebar diferenciado: empleado ve "Mi Espacio", FOM ve "Gestión"
- Rutas protegidas: Colaboradores, HR, Settings, Nóminas requieren `fom`
- RLS endurecido: empleados solo ven/crean sus peticiones, FOM gestiona todo

## Pendiente (próximas iteraciones)
- **Continuidad cross-período** — Phase 02 carga equity + día virtual 0, falta cargar `lastWeek` de la generación anterior
- **Dashboard Empleado** — Conectar con datos reales (horario, peticiones propias)
- **Escalonar libres** — evitar que todos libren el mismo día
- **Scores bajos** — fórmula scoring necesita ajuste fino

## Gotchas
- `apellidos` puede ser NULL → usar `${nombre}${apellidos ? ' ' + apellidos : ''}` no template literal directo
- `engineOutputToBlocks` debe skip D/rest blocks (hours=0) para evitar duplicados visuales
- `turnos_publicos` es tabla legacy que no existe → error de publicación conocido, no bloquea
- Phase 06 necesita dual-pass: (1) coverage mínima, (2) employee-driven para llenar días
- Después de `supabase db reset`, la sesión auth se pierde → reinyectar token o re-login via Mailpit
- Puerto real de Vite: **8082** (no 8085)
