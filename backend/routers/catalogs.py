from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import db
from auth import get_current_user

router = APIRouter(tags=["catalogs"])


# -------- Dependencies --------
class DependencyIn(BaseModel):
    name: str
    description: Optional[str] = None


def _dep(r) -> dict:
    return {"id": str(r["id"]), "name": r["name"], "description": r["description"]}


@router.get("/dependencies")
async def list_dependencies(_: dict = Depends(get_current_user)):
    rows = await db.fetch("SELECT id, name, description FROM dependencies ORDER BY name")
    return [_dep(r) for r in rows]


@router.post("/dependencies")
async def create_dependency(data: DependencyIn, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(
        "INSERT INTO dependencies (name, description) VALUES ($1, $2) RETURNING id, name, description",
        data.name, data.description,
    )
    return _dep(r)


@router.put("/dependencies/{dep_id}")
async def update_dependency(dep_id: str, data: DependencyIn, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(
        "UPDATE dependencies SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description",
        data.name, data.description, dep_id,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Dependencia no encontrada")
    return _dep(r)


@router.delete("/dependencies/{dep_id}")
async def delete_dependency(dep_id: str, _: dict = Depends(get_current_user)):
    res = await db.execute("DELETE FROM dependencies WHERE id = $1", dep_id)
    if res.endswith("0"):
        raise HTTPException(status_code=404, detail="Dependencia no encontrada")
    return {"ok": True}


# -------- Procedure Types --------
class TypeIn(BaseModel):
    name: str
    description: Optional[str] = None
    response_days: int = 5


def _type(r) -> dict:
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "description": r["description"],
        "response_days": r["response_days"],
    }


@router.get("/types")
async def list_types(_: dict = Depends(get_current_user)):
    rows = await db.fetch("SELECT id, name, description, response_days FROM procedure_types ORDER BY name")
    return [_type(r) for r in rows]


@router.post("/types")
async def create_type(data: TypeIn, _: dict = Depends(get_current_user)):
    if data.response_days < 1:
        raise HTTPException(status_code=400, detail="Los días de respuesta deben ser ≥ 1")
    r = await db.fetchrow(
        "INSERT INTO procedure_types (name, description, response_days) VALUES ($1, $2, $3) "
        "RETURNING id, name, description, response_days",
        data.name, data.description, data.response_days,
    )
    return _type(r)


@router.put("/types/{type_id}")
async def update_type(type_id: str, data: TypeIn, _: dict = Depends(get_current_user)):
    if data.response_days < 1:
        raise HTTPException(status_code=400, detail="Los días de respuesta deben ser ≥ 1")
    r = await db.fetchrow(
        "UPDATE procedure_types SET name = $1, description = $2, response_days = $3 WHERE id = $4 "
        "RETURNING id, name, description, response_days",
        data.name, data.description, data.response_days, type_id,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return _type(r)


@router.delete("/types/{type_id}")
async def delete_type(type_id: str, _: dict = Depends(get_current_user)):
    res = await db.execute("DELETE FROM procedure_types WHERE id = $1", type_id)
    if res.endswith("0"):
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return {"ok": True}


# -------- Users (for assignment dropdowns) --------
@router.get("/users")
async def list_users(_: dict = Depends(get_current_user)):
    rows = await db.fetch("SELECT id, email, name, role FROM users ORDER BY created_at")
    return [{"id": str(r["id"]), "email": r["email"], "name": r["name"], "role": r["role"]} for r in rows]
