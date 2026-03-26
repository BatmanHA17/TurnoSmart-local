# TurnoSmart — Guía de Despliegue

> Última actualización: Marzo 2026

---

## Requisitos previos

- Node.js ≥ 20
- Supabase CLI (`npm install -g supabase`)
- Acceso al proyecto Supabase Cloud
- Cuenta en Vercel (o Netlify)
- Repositorio en GitHub con secrets configurados

---

## Variables de entorno

Copia `.env.example` → `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key | Dashboard → Settings → API |
| `VITE_SENTRY_DSN` | DSN de Sentry (opcional) | sentry.io → Settings → Client Keys |

---

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Arrancar Supabase local
supabase start

# 3. Arrancar dev server
npm run dev
# → http://localhost:8080
```

---

## Migraciones de base de datos

### Aplicar migraciones en producción

```bash
# Ver estado actual
supabase db diff --linked

# Aplicar todas las migraciones pendientes
supabase db push --linked

# O ejecutar una migración concreta
supabase db query --linked < supabase/migrations/MIGRATION_FILE.sql
```

### Rollback de emergencia

```bash
# Si una migración rompió algo, crear una migración de rollback manual
# NO usar DROP TABLE ni truncate sin backup previo

# Ver logs de actividad en BD
supabase db query --linked "SELECT * FROM public.activity_log ORDER BY created_at DESC LIMIT 50;"
```

---

## Build de producción

```bash
# Verifica que los tests pasan antes de buildear
npm test

# Build optimizado
npm run build
# → Genera /dist (HTML + assets chunked)

# Preview local del build
npm run preview
```

---

## Checklist pre-deploy

- [ ] `npm test` pasa (11/11 ✅)
- [ ] `npm run build` sin errores
- [ ] Variables de entorno configuradas en Vercel/Netlify
- [ ] Migraciones de BD aplicadas con `supabase db push --linked`
- [ ] Secrets de GitHub actualizados (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Revisado `activity_log` para detectar anomalías recientes
- [ ] Comunicado al admin (goturnosmart@gmail.com) antes de deploys mayores

---

## Deploy con GitHub Actions (automático)

El workflow `.github/workflows/ci.yml` se ejecuta en cada push:
1. **Lint** — `npm run lint`
2. **Type-check** — `tsc --noEmit`
3. **Tests** — `npm test`
4. **Build** — Solo si lint y tests pasan

El workflow `.github/workflows/deploy.yml` despliega al hacer push a `main`.

### GitHub Secrets necesarios

Configurar en GitHub → Repo → Settings → Secrets and variables → Actions:

| Secret | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL de Supabase producción |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase producción |
| `VITE_SENTRY_DSN` | DSN de Sentry (opcional) |
| `VERCEL_TOKEN` | Token de Vercel (si usas Vercel) |
| `VERCEL_ORG_ID` | ID de organización Vercel |
| `VERCEL_PROJECT_ID` | ID del proyecto Vercel |

---

## Deploy manual a Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy a staging
vercel

# Deploy a producción
vercel --prod
```

---

## Monitoreo en producción

| Herramienta | URL | Para qué |
|---|---|---|
| Supabase Studio | supabase.com/dashboard | BD, auth, logs |
| Activity Log | turnosmart.app/activity | Auditoría de acciones |
| Sentry | sentry.io | Errores JavaScript |
| Admin Dashboard | turnosmart.app/admin | Usuarios y estadísticas |

### Ver errores en tiempo real

```bash
# Logs de edge functions
supabase functions logs --linked

# Logs de auth
# Supabase Dashboard → Auth → Logs
```

---

## Estructura de ramas recomendada

```
main        → Producción (turnosmart.app)
develop     → Staging / pre-producción
feature/*   → Nuevas funcionalidades
fix/*       → Bugfixes
```

---

## Contacto emergencias

- **Admin:** goturnosmart@gmail.com
- **Supabase Project:** Ver `.env.local` → `VITE_SUPABASE_URL`
- **Vercel:** vercel.com/dashboard

---

## Historial de cambios críticos

| Fecha | Cambio | Autor |
|---|---|---|
| Mar 2026 | Eliminadas 8 cuentas no autorizadas | José |
| Mar 2026 | CORS restringido a turnosmart.app | José |
| Mar 2026 | Auth migrada a passwordless (OTP) | José |
| Mar 2026 | Audit triggers en tablas críticas | José |
| Mar 2026 | RLS habilitado en verification_codes | José |
| Mar 2026 | Fase 3 frontend: error boundaries + hooks cleanup | José |
| Mar 2026 | Fase 4: CI/CD + Sentry + DEPLOY.md | José |
