# 🐛 DEBUG SPRINT 1A: WEEK VIEW VACÍO

## 🔍 INVESTIGACIÓN

### Componente: GoogleCalendarStyle.tsx

**Data Flow:**
1. `useEffect` (línea 1170): Dispara cuando `currentOrg?.org_id` disponible
2. `loadColaboradores()` (línea 586): Query colaboradores desde BD
3. `setEmployees(data)` (línea 663): Guarda empleados en estado
4. `loadShiftsFromSupabase()` (línea 667): Solo si employees.length > 0

### Puntos Críticos a Verificar

**1. useCurrentOrganization() Hook**
- ¿Está retornando `org_id` correctamente?
- ¿currentOrg es null o tiene values?

**2. Colaboradores en BD**
- ¿Existen colaboradores para esta org?
- ¿Query está filtrando correctamente?

**3. Calendar Shifts en BD**
- ¿Existen shifts creados?
- ¿RLS policies permiten acceso?

**4. Estado de Carga**
- ¿isLoadingData se actualiza correctamente?
- ¿Hay race conditions?

---

## 🧪 TESTS A EJECUTAR

### Test 1: Verificar currentOrg
```
En browser console (Week view):
window.location.pathname
// Debería mostrar: /turnosmart/week

Buscar en código:
const { org: currentOrg } = useCurrentOrganization();
// ¿currentOrg tiene org_id?
```

### Test 2: Verificar BD
```
En Supabase:
SELECT COUNT(*) FROM colaboradores
WHERE org_id = '0739faa3-1445-4474-8aef-bb058e30c0b2';
// Debería retornar: 8 (nuestros 8 empleados)

SELECT COUNT(*) FROM calendar_shifts
WHERE org_id = '0739faa3-1445-4474-8aef-bb058e30c0b2';
// Debería retornar: > 0 (si hay shifts)
```

### Test 3: Console Logs
```
En browser console (Week view):
Buscar logs de:
- "Error cargando colaboradores:"
- "No hay org_id disponible"
- Cualquier error de query
```

---

## 📌 HIPÓTESIS PRINCIPALES

### Hipótesis A: currentOrg no está disponible
**Síntoma:** useEffect no se ejecuta porque currentOrg?.org_id es undefined
**Solución:** Verificar useCurrentOrganization hook

### Hipótesis B: Colaboradores no existen en BD para esta org
**Síntoma:** Query retorna [] (array vacío)
**Solución:** Verificar que org_id en colaboradores es correcto

### Hipótesis C: Diferentes org_id entre vistas
**Síntoma:** Day view funciona pero Week view no
**Solución:** Verificar que ambas vistas usan mismo org_id

### Hipótesis D: RLS Policies bloqueando data
**Síntoma:** Query ejecuta pero retorna error silenciosamente
**Solución:** Verificar RLS policies en table colaboradores

---

## 🔧 PASOS PARA ARREGLAR

**Si es Hipótesis A (currentOrg undefined):**
1. Revisar useCurrentOrganization en GoogleCalendarStyle.tsx
2. Verificar que org se pasa correctamente
3. Añadir fallback si org no disponible

**Si es Hipótesis B (No hay colaboradores):**
1. Verificar datos en BD
2. Crear colaboradores si no existen
3. Verificar org_id coincide

**Si es Hipótesis C (org_id mismatch):**
1. Comparar org_id en Day vs Week
2. Estandarizar

**Si es Hipótesis D (RLS):**
1. Verificar RLS policies
2. Añadir service_role bypass si necesario

---

## 📝 NOTAS DE ARQUITECTURA

### Day View (Funciona ✅)
- Ubicación: `/turnosmart/day`
- Query: SELECT colaboradores FROM Supabase
- Resultado: 13 empleados mostrados

### Week View (Vacío ❌)
- Ubicación: `/turnosmart/week`
- Query: SELECT colaboradores FROM Supabase (MISMA)
- Resultado: 0 empleados

**Diferencia:** ¿Qué es diferente entre ambos componentes?
- ¿Diferentes hooks?
- ¿Diferentes org_id?
- ¿Diferentes RLS policies?

---

## 🎯 PRÓXIMOS PASOS

1. **Inmediato:** Abrir Week view en navegador + DevTools
2. **Console:** Buscar errores específicos
3. **Supabase:** Verificar data en BD
4. **Comparar:** Day vs Week en código
5. **Fix:** Aplicar solución según hipótesis

---

Status: 🔄 PENDIENTE DEBUGGING
Prioridad: 🔴 CRÍTICO
Siguiente: Ejecutar tests en browser
