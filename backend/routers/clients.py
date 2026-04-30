from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import db
from auth import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientIn(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


def _row(r) -> dict:
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "email": r["email"],
        "phone": r["phone"],
        "address": r["address"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
    }


@router.get("")
async def list_clients(_: dict = Depends(get_current_user)):
    rows = await db.fetch("SELECT id, name, email, phone, address, created_at FROM clients ORDER BY created_at DESC")
    return [_row(r) for r in rows]


@router.post("")
async def create_client(data: ClientIn, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(
        "INSERT INTO clients (name, email, phone, address) VALUES ($1, $2, $3, $4) "
        "RETURNING id, name, email, phone, address, created_at",
        data.name, data.email, data.phone, data.address,
    )
    return _row(r)


@router.get("/{client_id}")
async def get_client(client_id: str, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(
        "SELECT id, name, email, phone, address, created_at FROM clients WHERE id = $1",
        client_id,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return _row(r)


@router.put("/{client_id}")
async def update_client(client_id: str, data: ClientIn, _: dict = Depends(get_current_user)):
    r = await db.fetchrow(
        "UPDATE clients SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 "
        "RETURNING id, name, email, phone, address, created_at",
        data.name, data.email, data.phone, data.address, client_id,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return _row(r)


@router.delete("/{client_id}")
async def delete_client(client_id: str, _: dict = Depends(get_current_user)):
    res = await db.execute("DELETE FROM clients WHERE id = $1", client_id)
    if res.endswith("0"):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"ok": True}
