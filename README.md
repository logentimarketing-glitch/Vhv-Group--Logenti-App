# VHV Interno

Plataforma interna para reclutamiento, capacitacion, comunidad y administracion de talento.

## Estado actual

- Web con Next.js en `web/`
- Modo app instalable como PWA
- Login por roles con bienvenida personalizada
- Sincronizacion remota preparada para Supabase
- Estructura apta para dominio publico
- Base Expo inicial en `movile/`

## Publicar en GitHub, Vercel y Supabase

La guia completa esta en:

[DEPLOY.md](C:\Users\Usuario\Desktop\LOGVHV_app\DEPLOY.md)

### Resumen rapido

1. Copia `web/.env.example` a `web/.env.local`
2. Define:
   - `NEXT_PUBLIC_APP_URL=https://tu-dominio.com`
   - `NEXT_PUBLIC_BACKEND_URL=` si usas backend externo
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
3. En Supabase ejecuta [database/supabase-app-state.sql](C:\Users\Usuario\Desktop\LOGVHV_app\database\supabase-app-state.sql)
4. Publica `web/` en Netlify o Vercel

## Netlify

- Base directory: `web`
- Build command: `npm run build`
- Framework: `Next.js`

Ya existe [netlify.toml](C:\Users\Usuario\Desktop\LOGVHV_app\netlify.toml) para apuntar a la carpeta correcta.

## App instalable

La web queda lista para instalarse como app desde navegador compatible:

- Android Chrome: `Agregar a pantalla de inicio`
- Escritorio Chrome/Edge: `Instalar app`

## App movil nativa

La carpeta `movile/` conserva la base de Expo para evolucionar a app nativa si quieres publicar en stores.
