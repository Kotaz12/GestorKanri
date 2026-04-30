"""Database bootstrap endpoint — runs schema.sql + seed data.

Public (token-protected) so it can be run once from the deployed environment
(e.g., after first Vercel deploy) without needing shell access.
"""
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
import db
from auth import hash_password

router = APIRouter(tags=["init"])

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema.sql"


@router.post("/init-data")
async def init_data(token: str = Query(...)):
    expected = os.environ.get("INIT_DATA_TOKEN")
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="Token inválido")

    # 1) Apply schema
    schema_sql = SCHEMA_PATH.read_text()
    pool = db.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(schema_sql)

    # 2) Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kanri.mx").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Kanri2026!")
    existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", admin_email)
    if not existing:
        await db.execute(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'admin')",
            admin_email, hash_password(admin_password), "Administrador Kanri",
        )

    # 3) Seed catalogs (only if empty)
    dep_count = await db.fetchval("SELECT COUNT(*) FROM dependencies")
    if (dep_count or 0) == 0:
        deps = [
            ("Secretaría General", "Coordinación de oficinas del ayuntamiento"),
            ("Obras Públicas", "Permisos de construcción e infraestructura"),
            ("Desarrollo Urbano", "Licencias y uso de suelo"),
            ("Tesorería", "Cobros, pagos y facturación"),
            ("Registro Civil", "Actas, matrimonios y trámites civiles"),
            ("Catastro", "Registro y avalúos de predios"),
        ]
        for name, desc in deps:
            await db.execute(
                "INSERT INTO dependencies (name, description) VALUES ($1, $2)",
                name, desc,
            )

    type_count = await db.fetchval("SELECT COUNT(*) FROM procedure_types")
    if (type_count or 0) == 0:
        types = [
            ("Permiso de Construcción", "Revisión y emisión de permiso de construcción", 10),
            ("Licencia de Uso de Suelo", "Dictamen de compatibilidad urbanística", 15),
            ("Acta de Nacimiento", "Expedición de acta certificada", 3),
            ("Pago de Predial", "Emisión de recibo y cobro", 1),
            ("Constancia de No Adeudo", "Emisión de constancia de no adeudo fiscal", 2),
            ("Avalúo Catastral", "Elaboración de avalúo oficial", 7),
        ]
        for name, desc, days in types:
            await db.execute(
                "INSERT INTO procedure_types (name, description, response_days) VALUES ($1, $2, $3)",
                name, desc, days,
            )

    client_count = await db.fetchval("SELECT COUNT(*) FROM clients")
    if (client_count or 0) == 0:
        clients = [
            ("María González Pérez", "maria.gonzalez@example.com", "555-0101", "Av. Reforma 100, Col. Centro"),
            ("Juan Ramírez López", "juan.ramirez@example.com", "555-0102", "Calle Morelos 45, Col. Juárez"),
            ("Construcciones Nova S.A.", "contacto@nova.mx", "555-0103", "Blvd. Industrial 1200"),
            ("Laura Fernández Ruiz", "laura.fernandez@example.com", "555-0104", "Calle Hidalgo 8"),
            ("Inmobiliaria Cielo", "ventas@cielo.mx", "555-0105", "Av. Universidad 333"),
        ]
        for n, e, p, a in clients:
            await db.execute(
                "INSERT INTO clients (name, email, phone, address) VALUES ($1, $2, $3, $4)",
                n, e, p, a,
            )

    # 4) Seed sample procedures if none exist
    proc_count = await db.fetchval("SELECT COUNT(*) FROM procedures")
    if (proc_count or 0) == 0:
        admin = await db.fetchrow("SELECT id FROM users WHERE email = $1", admin_email)
        from datetime import datetime, timezone, timedelta
        clients_rows = await db.fetch("SELECT id FROM clients LIMIT 5")
        types_rows = await db.fetch("SELECT id, response_days FROM procedure_types LIMIT 5")
        deps_rows = await db.fetch("SELECT id FROM dependencies LIMIT 5")
        if clients_rows and types_rows and deps_rows and admin:
            now = datetime.now(timezone.utc)
            samples = [
                ("Permiso construcción Casa Habitación", "Revisión de planos estructurales", 0, 0, 1, -3, "on_time"),
                ("Licencia uso de suelo - Local comercial", "Ubicación zona mixta", 1, 1, 2, 1, "warning"),
                ("Acta de nacimiento - M. González", "Trámite en línea, envío domicilio", 0, 2, 4, -8, "late"),
                ("Pago predial 2026 - Inmob. Cielo", "Pago anual adelantado", 4, 3, 3, -10, "completed"),
                ("Constancia de no adeudo - J. Ramírez", "Para trámite bancario", 1, 4, 3, 0, "on_time"),
            ]
            for title, desc, ci, ti, di, offset_days, status in samples:
                t_row = types_rows[ti]
                created_at = now - timedelta(days=abs(offset_days) if offset_days < 0 else 1)
                due = created_at + timedelta(days=t_row["response_days"])
                await db.execute(
                    "INSERT INTO procedures (title, description, client_id, type_id, dependency_id, "
                    "assigned_user_id, responsible_type, due_date, status, created_at) "
                    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
                    title, desc, clients_rows[ci]["id"], t_row["id"], deps_rows[di]["id"],
                    admin["id"], "internal", due, status, created_at,
                )
            # A welcome notification
            await db.execute(
                "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
                admin["id"],
                "Bienvenido a Gestor Kanri — datos de ejemplo cargados correctamente.",
            )

    return {"ok": True, "message": "Base de datos inicializada con datos de ejemplo"}
