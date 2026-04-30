# Gestor Kanri — Guía de despliegue

Sistema completo de gestión de trámites (React + FastAPI + PostgreSQL).
Este documento cubre tanto el despliegue en **Vercel** (recomendado) como ejecución local.

---

## 1. Variables de entorno

Copia `.env.example` y completa los valores:

| Variable              | Dónde              | Descripción                                                           |
| --------------------- | ------------------ | --------------------------------------------------------------------- |
| `DATABASE_URL`        | Backend            | Supabase Session Pooler URL (IPv4). Ver sección Supabase.             |
| `JWT_SECRET`          | Backend            | Secreto para firmar JWT. Genera con `openssl rand -hex 32`.           |
| `ADMIN_EMAIL`         | Backend            | Correo del administrador seed (default `admin@kanri.mx`).             |
| `ADMIN_PASSWORD`      | Backend            | Password del administrador seed.                                      |
| `INIT_DATA_TOKEN`     | Backend            | Token que protege `POST /api/init-data`.                              |
| `CORS_ORIGINS`        | Backend            | `*` o lista separada por comas de orígenes permitidos.                |
| `REACT_APP_BACKEND_URL` | Frontend         | URL pública del backend (misma que el dominio en Vercel).             |

---

## 2. Supabase — Obtener DATABASE_URL

1. Crea un proyecto en <https://supabase.com>.
2. `Settings → Database → Connection String`.
3. Selecciona la pestaña **Session pooler** (IPv4, obligatorio para contenedores sin IPv6 y para Vercel).
4. Copia la URL y reemplaza `[YOUR-PASSWORD]` por el password del proyecto.

Formato: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`

---

## 3. Inicializar base de datos

Una única vez, después del primer deploy:

```bash
curl -X POST "https://TU_DOMINIO/api/init-data?token=EL_VALOR_DE_INIT_DATA_TOKEN"
```

Esto aplica `backend/schema.sql`, crea el usuario admin y pobla dependencias, tipos y clientes de ejemplo.

---

## 4. Despliegue en Vercel

```bash
# Desde la raíz del repo
vercel
```

Durante el primer deploy, configura las variables de entorno en el dashboard de Vercel (`Project → Settings → Environment Variables`). Agrega **todas** las del paso 1, incluida `REACT_APP_BACKEND_URL`.

La configuración `vercel.json` en la raíz enruta:

- `/api/*` → función serverless Python (`api/index.py`)
- `/*`      → SPA estática de `frontend/build`

El backend se importa desde `api/index.py`, que añade `backend/` al `sys.path` y expone `app`.

---

## 5. Ejecución local

### Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env    # rellena valores
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

Visita <http://localhost:3000>.

---

## 6. Usuarios y credenciales iniciales

Tras correr `/api/init-data`, el admin creado es:

- Email: `admin@kanri.mx`
- Password: `Kanri2026!`

⚠️ **Cambia la contraseña y el `JWT_SECRET` antes de pasar a producción.**

---

## 7. Endpoints principales

| Método | Ruta                          | Descripción                        |
| ------ | ----------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`          | Registro                           |
| POST   | `/api/auth/login`             | Login                              |
| GET    | `/api/auth/me`                | Usuario actual                     |
| GET    | `/api/procedures`             | Lista de trámites                  |
| GET    | `/api/procedures/stats`       | KPIs del dashboard                 |
| POST   | `/api/procedures`             | Crear trámite                      |
| PATCH  | `/api/procedures/:id/status`  | Cambiar estado                     |
| GET    | `/api/procedures/:id/notes`   | Notas / historial                  |
| POST   | `/api/procedures/:id/notes`   | Agregar nota                       |
| `…`    | `/api/clients`, `/api/types`, `/api/dependencies`, `/api/notifications` |

---

## 8. PWA

La app es instalable. `manifest.json` y `service-worker.js` viven en `frontend/public/`. Tras abrir en un navegador compatible, aparece el prompt "Instalar Gestor Kanri".

---

## 9. Checklist final

- [ ] `JWT_SECRET` único y seguro
- [ ] `ADMIN_PASSWORD` cambiado
- [ ] `CORS_ORIGINS` configurado con el dominio real (no `*` en prod)
- [ ] `/api/init-data` ejecutado una sola vez
- [ ] Backup de Supabase habilitado
