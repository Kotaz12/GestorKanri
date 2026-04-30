from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import db
from auth import get_current_user

router = APIRouter(prefix="/procedures", tags=["procedures"])


class ProcedureIn(BaseModel):
    title: str
    description: Optional[str] = None
    client_id: Optional[str] = None
    type_id: Optional[str] = None
    dependency_id: Optional[str] = None
    assigned_user_id: Optional[str] = None
    responsible_type: str = "internal"  # 'internal' | 'external'


class StatusIn(BaseModel):
    status: str  # 'on_time' | 'warning' | 'late' | 'completed'


class NoteIn(BaseModel):
    content: str


def _compute_status(due: Optional[datetime], current: str) -> str:
    if current == "completed":
        return "completed"
    if due is None:
        return current or "on_time"
    now = datetime.now(timezone.utc)
    if due < now:
        return "late"
    delta = due - now
    if delta <= timedelta(days=2):
        return "warning"
    return "on_time"


def _proc(r) -> dict:
    return {
        "id": str(r["id"]),
        "title": r["title"],
        "description": r["description"],
        "client_id": str(r["client_id"]) if r["client_id"] else None,
        "client_name": r.get("client_name") if isinstance(r, dict) else r["client_name"],
        "type_id": str(r["type_id"]) if r["type_id"] else None,
        "type_name": r.get("type_name") if isinstance(r, dict) else r["type_name"],
        "response_days": r["response_days"],
        "dependency_id": str(r["dependency_id"]) if r["dependency_id"] else None,
        "dependency_name": r.get("dependency_name") if isinstance(r, dict) else r["dependency_name"],
        "assigned_user_id": str(r["assigned_user_id"]) if r["assigned_user_id"] else None,
        "assigned_user_email": r.get("assigned_user_email") if isinstance(r, dict) else r["assigned_user_email"],
        "responsible_type": r["responsible_type"],
        "due_date": r["due_date"].isoformat() if r["due_date"] else None,
        "status": _compute_status(r["due_date"], r["status"]),
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
    }


BASE_SELECT = """
    SELECT p.id, p.title, p.description, p.client_id, c.name AS client_name,
           p.type_id, t.name AS type_name, t.response_days,
           p.dependency_id, d.name AS dependency_name,
           p.assigned_user_id, u.email AS assigned_user_email,
           p.responsible_type, p.due_date, p.status, p.created_at
    FROM procedures p
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN procedure_types t ON t.id = p.type_id
    LEFT JOIN dependencies d ON d.id = p.dependency_id
    LEFT JOIN users u ON u.id = p.assigned_user_id
"""


@router.get("")
async def list_procedures(_: dict = Depends(get_current_user)):
    rows = await db.fetch(BASE_SELECT + " ORDER BY p.created_at DESC")
    return [_proc(r) for r in rows]


@router.get("/stats")
async def stats(_: dict = Depends(get_current_user)):
    rows = await db.fetch("SELECT due_date, status FROM procedures")
    total = len(rows)
    buckets = {"on_time": 0, "warning": 0, "late": 0, "completed": 0}
    for r in rows:
        s = _compute_status(r["due_date"], r["status"])
        buckets[s] = buckets.get(s, 0) + 1
    return {"total": total, **buckets}


@router.post("")
async def create_procedure(data: ProcedureIn, user: dict = Depends(get_current_user)):
    response_days = 5
    if data.type_id:
        t = await db.fetchrow("SELECT response_days FROM procedure_types WHERE id = $1", data.type_id)
        if t:
            response_days = t["response_days"]
    created_at = datetime.now(timezone.utc)
    due_date = created_at + timedelta(days=response_days)
    status = _compute_status(due_date, "on_time")
    r = await db.fetchrow(
        "INSERT INTO procedures (title, description, client_id, type_id, dependency_id, "
        "assigned_user_id, responsible_type, due_date, status, created_at) "
        "VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
        data.title, data.description, data.client_id, data.type_id, data.dependency_id,
        data.assigned_user_id, data.responsible_type, due_date, status, created_at,
    )
    # Create notification for assignee
    if data.assigned_user_id:
        await db.execute(
            "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
            data.assigned_user_id,
            f"Se te asignó el trámite: {data.title}",
        )
    full = await db.fetchrow(BASE_SELECT + " WHERE p.id = $1", r["id"])
    return _proc(full)


@router.get("/{pid}")
async def get_procedure(pid: str, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(BASE_SELECT + " WHERE p.id = $1", pid)
    if not r:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    return _proc(r)


@router.put("/{pid}")
async def update_procedure(pid: str, data: ProcedureIn, _: dict = Depends(get_current_user)):
    # Re-calc due_date if type changed
    existing = await db.fetchrow("SELECT type_id, created_at FROM procedures WHERE id = $1", pid)
    if not existing:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")

    due_date_update = None
    if data.type_id and data.type_id != (str(existing["type_id"]) if existing["type_id"] else None):
        t = await db.fetchrow("SELECT response_days FROM procedure_types WHERE id = $1", data.type_id)
        if t:
            due_date_update = existing["created_at"] + timedelta(days=t["response_days"])

    if due_date_update:
        await db.execute(
            "UPDATE procedures SET title=$1, description=$2, client_id=$3, type_id=$4, "
            "dependency_id=$5, assigned_user_id=$6, responsible_type=$7, due_date=$8 WHERE id=$9",
            data.title, data.description, data.client_id, data.type_id, data.dependency_id,
            data.assigned_user_id, data.responsible_type, due_date_update, pid,
        )
    else:
        await db.execute(
            "UPDATE procedures SET title=$1, description=$2, client_id=$3, type_id=$4, "
            "dependency_id=$5, assigned_user_id=$6, responsible_type=$7 WHERE id=$8",
            data.title, data.description, data.client_id, data.type_id, data.dependency_id,
            data.assigned_user_id, data.responsible_type, pid,
        )
    full = await db.fetchrow(BASE_SELECT + " WHERE p.id = $1", pid)
    return _proc(full)


@router.patch("/{pid}/status")
async def change_status(pid: str, data: StatusIn, _: dict = Depends(get_current_user)):
    if data.status not in ("on_time", "warning", "late", "completed"):
        raise HTTPException(status_code=400, detail="Estado inválido")
    r = await db.execute("UPDATE procedures SET status = $1 WHERE id = $2", data.status, pid)
    if r.endswith("0"):
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    full = await db.fetchrow(BASE_SELECT + " WHERE p.id = $1", pid)
    return _proc(full)


@router.delete("/{pid}")
async def delete_procedure(pid: str, _: dict = Depends(get_current_user)):
    res = await db.execute("DELETE FROM procedures WHERE id = $1", pid)
    if res.endswith("0"):
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    return {"ok": True}


# -------- Notes --------
@router.get("/{pid}/notes")
async def list_notes(pid: str, _: dict = Depends(get_current_user)):
    rows = await db.fetch(
        "SELECT n.id, n.content, n.created_at, n.user_id, u.email AS user_email, u.name AS user_name "
        "FROM notes n LEFT JOIN users u ON u.id = n.user_id "
        "WHERE n.procedure_id = $1 ORDER BY n.created_at DESC",
        pid,
    )
    return [
        {
            "id": str(r["id"]),
            "content": r["content"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            "user_id": str(r["user_id"]) if r["user_id"] else None,
            "user_email": r["user_email"],
            "user_name": r["user_name"],
        }
        for r in rows
    ]


@router.post("/{pid}/notes")
async def add_note(pid: str, data: NoteIn, user: dict = Depends(get_current_user)):
    exists = await db.fetchval("SELECT 1 FROM procedures WHERE id = $1", pid)
    if not exists:
        raise HTTPException(status_code=404, detail="Trámite no encontrado")
    r = await db.fetchrow(
        "INSERT INTO notes (procedure_id, user_id, content) VALUES ($1, $2, $3) "
        "RETURNING id, content, created_at",
        pid, user["id"], data.content,
    )
    return {
        "id": str(r["id"]),
        "content": r["content"],
        "created_at": r["created_at"].isoformat(),
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user["name"],
    }
