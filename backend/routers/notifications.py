from fastapi import APIRouter, Depends, HTTPException
import db
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    rows = await db.fetch(
        "SELECT id, message, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
        user["id"],
    )
    return [
        {
            "id": str(r["id"]),
            "message": r["message"],
            "read": r["read"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        }
        for r in rows
    ]


@router.get("/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    n = await db.fetchval(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
        user["id"],
    )
    return {"count": n or 0}


@router.post("/{nid}/read")
async def mark_read(nid: str, user: dict = Depends(get_current_user)):
    r = await db.execute(
        "UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2",
        nid, user["id"],
    )
    if r.endswith("0"):
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return {"ok": True}


@router.post("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.execute(
        "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE",
        user["id"],
    )
    return {"ok": True}
