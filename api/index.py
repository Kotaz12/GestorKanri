"""Vercel serverless entry point for the FastAPI backend.

Vercel's Python runtime will look for `app` in this file and wrap it with
an ASGI-to-serverless adapter automatically (Python 3.11 runtime).

Environment variables required on Vercel:
  - DATABASE_URL          (PostgreSQL connection string, use Supabase Session Pooler)
  - JWT_SECRET            (random 64-char hex)
  - ADMIN_EMAIL           (optional, default admin@kanri.mx)
  - ADMIN_PASSWORD        (optional, default Kanri2026!)
  - INIT_DATA_TOKEN       (token to protect /api/init-data)
  - CORS_ORIGINS          (comma-separated list or "*")
"""
import os
import sys
from pathlib import Path

# Ensure /app/backend is on sys.path so we can import the FastAPI app
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from server import app  # noqa: E402

# Vercel's Python runtime detects the `app` ASGI callable.
