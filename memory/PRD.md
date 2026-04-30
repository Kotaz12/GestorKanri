# Gestor Kanri — PRD

## Original Problem Statement
Full-stack production-ready procedure/trámite management system with:
- Frontend: React + Tailwind + Shadcn/UI + React Router + React Query
- Backend: FastAPI + asyncpg (no ORM) + JWT auth
- Database: PostgreSQL (Supabase Session Pooler — IPv4)
- Vercel-compatible structure (`api/index.py`, `vercel.json`)
- PWA (manifest + service worker + install prompt)
- Spanish UI, responsive, collapsible sidebar, dashboards with KPIs

## Architecture
- `/app/backend/` — FastAPI modular (`routers/auth|clients|catalogs|procedures|notifications|init_data`, `db.py`, `auth.py`, `schema.sql`)
- `/app/frontend/` — React (CRA+craco) with pages: Login, Dashboard, Procedures, ProcedureDetail, Clients, Types, Dependencies, Notifications
- `/app/api/index.py` + `/app/vercel.json` — Vercel serverless compatibility
- `/app/DEPLOY.md` + `/app/.env.example` — deployment guide

## User Personas
1. **Admin / coordinator** — Configures clients, types, dependencies. Monitors KPIs and delegates.
2. **Assigned staff** — Works assigned trámites, adds notes, changes status, receives notifications.
3. **External applicant** (future) — View-only access via tracking code.

## Core Requirements
- Trámite lifecycle: `on_time` (>2d until due), `warning` (≤2d), `late` (overdue), `completed`.
- `due_date = created_at + procedure_type.response_days` (auto-calculated).
- Notes timeline per trámite (audit trail).
- Notifications to assigned user on new trámite.

## Implemented (2026-04-30)
- ✅ JWT + bcrypt auth (register, login, logout, me, refresh) with Bearer header + httpOnly cookie
- ✅ PostgreSQL schema + bootstrap endpoint `/api/init-data?token=`
- ✅ Seed data: 5 clients, 6 dependencies, 6 procedure types, 5 procedures (mixed statuses), admin user
- ✅ Full CRUD: clients, types (with response_days), dependencies, procedures, notes, notifications
- ✅ Dashboard: 5 KPI cards, status distribution bar chart, recent procedures feed
- ✅ Procedures list with search + status filter + "Nuevo trámite" modal (all dropdowns wired)
- ✅ Procedure detail: fields, status change dropdown, notes timeline, delete
- ✅ Sidebar collapsible (desktop) + mobile drawer; topbar with notifications bell + user menu
- ✅ Swiss & High-Contrast design system (IBM Plex Sans, blue #1D4ED8, Phosphor icons)
- ✅ PWA: manifest.json + service-worker.js + install prompt
- ✅ Vercel compat: `api/index.py` ASGI entry + `vercel.json` routes
- ✅ DEPLOY.md + .env.example + test_credentials.md
- ✅ Testing: 14/14 backend pytest passed, ~95% frontend coverage (testing_agent_v3 iteration_1)

## Backlog (P1/P2)
- P1: Due-date calendar picker (manual override on edit)
- P1: Assign multiple users per trámite + role-based permissions
- P1: Email notifications (SendGrid/Resend) for new assignment + near-due
- P2: External applicant tracking page by code
- P2: File attachments per trámite (object storage)
- P2: Reports/export (CSV/PDF) of closed trámites
- P2: Slack/Teams webhooks for late trámites
- P2: Dark mode toggle

## Next Tasks
- (Optional) Suppress Recharts width/height(-1) console warning
- (Optional) Adjust toast position to avoid topbar overlap
- Collect user feedback after first demo
