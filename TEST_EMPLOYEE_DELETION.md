# TEST: Persistencia de Eliminación de Empleados (Problema #2)

## Objetivo
Verificar que cuando un empleado es eliminado de la vista en una vista del calendario, permanece eliminado al navegar entre diferentes vistas (semana, día, mes).

## Pasos de Test

### Setup
1. Iniciar servidor de desarrollo: `npm run dev`
2. Acceder a la app: http://localhost:8080/turnosmart/week
3. Autenticarse como admin

### Test Case 1: Vista Semana → Vista Día → Vista Semana
1. **Vista Semana** (`/turnosmart/week`):
   - Deberías ver una lista de empleados
   - Conta cuántos empleados hay (ej: 16 empleados)
   - Elimina todos los empleados EXCEPTO los de "Recepción" (ej: quedan 2)
   - Verifica que solo 2 empleados se muestran ✅

2. **Navega a Vista Día** (`/turnosmart/day`):
   - Verifica que SOLO los 2 empleados de Recepción aparecen ✅
   - Si todos los empleados reaparecen → **FALLO** ❌

3. **Navega de vuelta a Vista Semana** (`/turnosmart/week`):
   - Verifica que SOLO los 2 empleados de Recepción se muestran ✅
   - Si todos los empleados reaparecen → **FALLO** ❌

### Test Case 2: Vista Semana → Vista Mes → Vista Semana
1. **Vista Semana**:
   - Comienza con empleados filtrados del Test Case 1 (solo Recepción)

2. **Navega a Vista Mes** (`/turnosmart/month`):
   - Verifica que SOLO los 2 empleados de Recepción aparecen ✅
   - Si todos los empleados reaparecen → **FALLO** ❌

3. **Navega de vuelta a Vista Semana**:
   - Verifica que SOLO los 2 empleados de Recepción se muestran ✅

### Test Case 3: Vista Día → Vista Mes → Vista Semana
1. **Vista Día**:
   - Verifica que los 2 empleados de Recepción se muestran

2. **Navega a Vista Mes**:
   - Verifica que SOLO los 2 empleados se muestran ✅

3. **Navega a Vista Semana**:
   - Verifica que SOLO los 2 empleados se muestran ✅

### Test Case 4: Reset de Filtro
1. **Vista Semana**:
   - Con los empleados filtrados, busca un botón de "Reset" o funcionalidad para restablecer
   - Si existe, haz click
   - Verifica que todos los empleados reaparecen ✅

### Test Case 5: Cambio de Organización
1. **Vista Semana (Organización A)**:
   - Filtra empleados (dejan solo Recepción)

2. **Cambia a Organización B** (si existen múltiples organizaciones):
   - Deberías ver todos los empleados de esa organización ✅
   - El filtro NO debe aplicarse entre organizaciones diferentes ✅

3. **Vuelve a Organización A**:
   - El filtro anterior (solo Recepción) debe estar restaurado ✅

## Criterios de Éxito

✅ **PASS** si:
- Los empleados eliminados permanecen excluidos al navegar entre vistas
- El filtro persiste correctamente en localStorage
- Cada organización tiene su propio filtro separado
- La app no muestra errores en la consola relacionados con localStorage

❌ **FAIL** si:
- Los empleados reaparecen después de navegar
- Los empleados eliminados se restablecen al cambiar de organización
- Hay errores de JSON en localStorage

## Archivos Modificados

- ✅ `/src/hooks/useCalendarEmployeeFilter.ts` (NUEVO)
- ✅ `/src/components/GoogleCalendarStyle.tsx`
- ✅ `/src/pages/CalendarDay.tsx`
- ✅ `/src/components/MonthlyCalendarView.tsx`
- ✅ `/src/components/BiWeeklyCalendarView.tsx`

## Notas Técnicas

- localStorage key format: `calendar-employee-exclusions-{orgId}`
- El hook sincroniza automáticamente entre vistas
- Los empleados "excluidos" aún pueden tener turnos (solo se ocultan de la vista)

## Debugging

Si el test falla, revisa:
1. **Console del navegador** (F12 → Console):
   - Busca errores de JSON en `calendar-employee-exclusions-*`
   - Verifica que el `currentOrg?.org_id` es consistente

2. **Application → Storage → Local Storage**:
   - Busca keys `calendar-employee-exclusions-*`
   - Verifica que el contenido es un JSON válido con array de IDs

3. **React DevTools**:
   - Inspecciona el hook `useCalendarEmployeeFilter`
   - Verifica que `filteredEmployees` tiene la cantidad correcta
