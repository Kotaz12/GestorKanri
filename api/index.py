"""Vercel serverless entry point para FastAPI."""
import os
import sys
from pathlib import Path

# En Vercel el working directory es la raíz del repo
# __file__ = /var/task/api/index.py  →  parent.parent = /var/task
ROOT = Path(__file__).resolve().parent.parent
"""BACKEND = ROOT / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))"""

"""from server import app  # noqa: E402"""
from backend.server import app