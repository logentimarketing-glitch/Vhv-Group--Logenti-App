# Deploy de VHV Interno

Este proyecto se publica desde la carpeta `web/`.

## 1. GitHub

En tu computadora, desde la raiz del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\LOGVHV_app
git init
git branch -M main
git add .
git commit -m "Initial VHV Interno setup"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Si `git` no esta instalado:
- descarga Git para Windows
- instalalo
- reinicia VS Code

## 2. Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Abre el SQL Editor.
3. Ejecuta este archivo:

`C:\Users\Usuario\Desktop\LOGVHV_app\database\supabase-app-state.sql`

4. Copia estos valores del proyecto:
- `Project URL`
- `service_role key`

## 3. Variables de entorno

Crea este archivo:

`C:\Users\Usuario\Desktop\LOGVHV_app\web\.env.local`

Con esta base:

```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
NEXT_PUBLIC_BACKEND_URL=
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=TU_SUPABASE_SERVICE_ROLE_KEY
META_PAGE_ID=984756714716469
META_PAGE_ACCESS_TOKEN=
META_USER_ACCESS_TOKEN=
META_LEAD_FORM_IDS=
```

## 4. Vercel

1. Entra a [Vercel](https://vercel.com/).
2. Importa el repositorio de GitHub.
3. En `Root Directory` selecciona:

`web`

4. Framework:

`Next.js`

5. Agrega las mismas variables de entorno de `.env.local`.
6. Haz deploy.

## 5. Comandos locales de verificacion

```powershell
cd C:\Users\Usuario\Desktop\LOGVHV_app\web
npm.cmd install
npm.cmd run build
npm.cmd run dev
```

## 6. Qué queda pendiente manualmente

Estas cosas si requieren tu cuenta o credenciales externas:
- crear el repo en GitHub
- conectar Vercel al repo
- crear el proyecto de Supabase
- pegar variables reales
- si quieres Facebook/Meta en vivo, pegar sus tokens reales
