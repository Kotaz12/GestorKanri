from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr
import db
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    get_jwt_secret,
    JWT_ALGORITHM,
)
import jwt

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


def _user_to_dict(row) -> dict:
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "name": row["name"],
        "role": row["role"],
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


@router.post("/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower().strip()
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    existing = await db.fetchrow("SELECT id FROM users WHERE email = $1", email)
    if existing:
        raise HTTPException(status_code=400, detail="Este correo ya está registrado")
    row = await db.fetchrow(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, 'user') "
        "RETURNING id, email, name, role, created_at",
        email,
        hash_password(data.password),
        data.name,
    )
    user = _user_to_dict(row)
    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user, "access_token": access, "refresh_token": refresh}


@router.post("/login")
async def login(data: LoginIn, response: Response):
    email = data.email.lower().strip()
    row = await db.fetchrow(
        "SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = $1",
        email,
    )
    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    user = _user_to_dict(row)
    access = create_access_token(user["id"], user["email"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": user, "access_token": access, "refresh_token": refresh}


@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No hay refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    row = await db.fetchrow("SELECT id, email FROM users WHERE id = $1", payload["sub"])
    if not row:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    access = create_access_token(str(row["id"]), row["email"])
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 8,
        path="/",
    )
    return {"access_token": access}
